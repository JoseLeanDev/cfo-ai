/**
 * Endpoint EMERGENCIA: Ejecutar todos los agentes manualmente
 * Usa queries compatibles con PostgreSQL directamente
 */

const express = require('express');
const router = express.Router();
const { logAgentActivity } = require('../services/agentLogger');

/**
 * POST /api/admin/run-all-agents
 * Ejecuta TODOS los agentes manualmente y genera logs
 */
router.post('/run-all-agents', async (req, res) => {
  const db = req.app.get('db');
  const empresaId = req.body.empresa_id || 1;
  
  const resultados = [];
  
  // ============================================
  // AGENTE 1: CAJA
  // ============================================
  try {
    const startTime = Date.now();
    
    // Compatibilidad: COALESCE(nombre, banco) y COALESCE(saldo_actual, saldo)
    const saldos = await db.allAsync(`
      SELECT cb.id, 
             COALESCE(cb.nombre, cb.banco) as nombre, 
             cb.moneda, 
             COALESCE(cb.saldo_actual, cb.saldo, 0) as saldo_actual
      FROM cuentas_bancarias cb
      WHERE cb.activa = TRUE OR cb.activa = 1
    `);
    
    let totalGTQ = 0, totalUSD = 0;
    const tasaCambio = 7.85;
    
    for (const c of saldos) {
      const saldo = parseFloat(c.saldo_actual) || 0;
      if (c.moneda === 'USD') { totalUSD += saldo; totalGTQ += saldo * tasaCambio; }
      else { totalGTQ += saldo; }
    }
    
    // Burn rate
    const entradas = await db.getAsync(`
      SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
      WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    const salidas = await db.getAsync(`
      SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
      WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    const burnRate = ((salidas?.total || 0) - (entradas?.total || 0)) / 30;
    const diasSobrevivencia = burnRate > 0 ? Math.floor(totalGTQ / burnRate) : 999;
    
    await logAgentActivity({
      agente_nombre: 'Caja',
      agente_tipo: 'caja',
      categoria: 'posicion_caja',
      descripcion: `💰 Posición: Q${Math.round(totalGTQ).toLocaleString()} | Runway: ${diasSobrevivencia} días | Burn: Q${Math.round(burnRate).toLocaleString()}/día`,
      detalles_json: JSON.stringify({ total_gtq: totalGTQ, total_usd: totalUSD, runway: diasSobrevivencia, burn_rate: burnRate }),
      resultado_status: 'exitoso',
      duracion_ms: Date.now() - startTime,
      empresa_id: empresaId
    });
    
    // Alerta si runway < 30
    if (diasSobrevivencia <= 30) {
      await db.runAsync(`
        INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
        VALUES ('runway_bajo', ?, ?, ?, ?, 'activa', NOW())
      `, [diasSobrevivencia <= 7 ? 'critical' : 'warning', 
          `Runway: ${diasSobrevivencia} días`, 
          `Burn rate: Q${Math.round(burnRate).toLocaleString()}/día`, 
          JSON.stringify({ dias: diasSobrevivencia, burn_rate: burnRate })]);
    }
    
    resultados.push({ agente: 'Caja', status: 'ok', totalGTQ, diasSobrevivencia });
  } catch (e) {
    resultados.push({ agente: 'Caja', status: 'error', error: e.message });
  }
  
  // ============================================
  // AGENTE 2: ANÁLISIS (KPIs)
  // ============================================
  try {
    const startTime = Date.now();
    
    const ventasMes = await db.getAsync(`
      SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as count
      FROM transacciones
      WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    const gastosMes = await db.getAsync(`
      SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
      WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    const margen = ventasMes?.total > 0 ? ((ventasMes.total - gastosMes?.total) / ventasMes.total * 100) : 0;
    
    await logAgentActivity({
      agente_nombre: 'Análisis',
      agente_tipo: 'analisis',
      categoria: 'kpis_diarios',
      descripcion: `📊 KPIs: Ventas mes Q${Math.round(ventasMes?.total || 0).toLocaleString()} | Gastos Q${Math.round(gastosMes?.total || 0).toLocaleString()} | Margen ${margen.toFixed(1)}%`,
      detalles_json: JSON.stringify({ ventas_mes: ventasMes?.total, gastos_mes: gastosMes?.total, margen, transacciones: ventasMes?.count }),
      resultado_status: 'exitoso',
      duracion_ms: Date.now() - startTime,
      empresa_id: empresaId
    });
    
    resultados.push({ agente: 'Análisis', status: 'ok', ventasMes: ventasMes?.total, margen });
  } catch (e) {
    resultados.push({ agente: 'Análisis', status: 'error', error: e.message });
  }
  
  // ============================================
  // AGENTE 3: COBRANZA
  // ============================================
  try {
    const startTime = Date.now();
    
    const aging = await db.allAsync(`
      SELECT
        COALESCE(nombre_cliente, 'Cliente') as cliente,
        SUM(CASE WHEN CURRENT_DATE - fecha > 90 THEN monto ELSE 0 END) as vencido_90_plus,
        SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 61 AND 90 THEN monto ELSE 0 END) as vencido_61_90,
        SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 31 AND 60 THEN monto ELSE 0 END) as vencido_31_60,
        SUM(monto) as total
      FROM transacciones
      WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY nombre_cliente
      ORDER BY total DESC
      LIMIT 10
    `);
    
    const totalVencido = aging.reduce((s, c) => s + c.vencido_90_plus + c.vencido_61_90, 0);
    
    await logAgentActivity({
      agente_nombre: 'Cobranza',
      agente_tipo: 'cobranza',
      categoria: 'aging_cartera',
      descripcion: `📋 Aging: ${aging.length} clientes | Vencido >60d: Q${Math.round(totalVencido).toLocaleString()}`,
      detalles_json: JSON.stringify({ clientes: aging.length, vencido: totalVencido, top_deudor: aging[0]?.cliente }),
      resultado_status: 'exitoso',
      duracion_ms: Date.now() - startTime,
      empresa_id: empresaId
    });
    
    // Alertas para deudores críticos
    for (const d of aging.filter(c => c.vencido_90_plus > 0).slice(0, 3)) {
      await db.runAsync(`
        INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
        VALUES ('deudor_critico', 'warning', ?, ?, ?, 'activa', NOW())
      `, [
        `${d.cliente}: Q${Math.round(d.vencido_90_plus).toLocaleString()} >90 días`,
        `CxC vencida critica`,
        JSON.stringify({ cliente: d.cliente, monto: d.vencido_90_plus })
      ]);
    }
    
    resultados.push({ agente: 'Cobranza', status: 'ok', clientes: aging.length, totalVencido });
  } catch (e) {
    resultados.push({ agente: 'Cobranza', status: 'error', error: e.message });
  }
  
  // ============================================
  // AGENTE 4: CONTABILIDAD
  // ============================================
  try {
    const startTime = Date.now();
    
    // Transacciones sin categorizar
    const sinCat = await db.getAsync(`
      SELECT COUNT(*) as count FROM movimientos_bancarios
      WHERE estado_conciliacion = 'pendiente'
    `);
    
    // Balance
    const debe = await db.getAsync(`
      SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
      WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    const haber = await db.getAsync(`
      SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
      WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    const diferencia = Math.abs((debe?.total || 0) - (haber?.total || 0));
    
    await logAgentActivity({
      agente_nombre: 'Contabilidad',
      agente_tipo: 'contabilidad',
      categoria: 'importacion_transacciones',
      descripcion: `📅 Contabilidad: ${sinCat?.count || 0} pendientes | Balance: Q${Math.round(diferencia).toLocaleString()} diferencia`,
      detalles_json: JSON.stringify({ pendientes: sinCat?.count, debe: debe?.total, haber: haber?.total, diferencia }),
      resultado_status: 'exitoso',
      duracion_ms: Date.now() - startTime,
      empresa_id: empresaId
    });
    
    // Alerta si diferencia > 1000
    if (diferencia > 1000) {
      await db.runAsync(`
        INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
        VALUES ('diferencia_balance', 'warning', ?, ?, ?, 'activa', NOW())
      `, [
        `Diferencia contable: Q${Math.round(diferencia).toLocaleString()}`,
        `El debe y haber no coinciden`,
        JSON.stringify({ debe: debe?.total, haber: haber?.total, diferencia })
      ]);
    }
    
    resultados.push({ agente: 'Contabilidad', status: 'ok', diferencia, pendientes: sinCat?.count });
  } catch (e) {
    resultados.push({ agente: 'Contabilidad', status: 'error', error: e.message });
  }
  
  // ============================================
  // BRIEFING DIARIO (Orchestrator)
  // ============================================
  try {
    const startTime = Date.now();
    
    // Contar alertas activas
    const alertasCount = await db.getAsync(`
      SELECT COUNT(*) as count FROM alertas_financieras WHERE estado = 'activa'
    `);
    
    // Resumen de agentes hoy
    const logsHoy = await db.getAsync(`
      SELECT COUNT(*) as count FROM agentes_logs WHERE created_at >= CURRENT_DATE
    `);
    
    await logAgentActivity({
      agente_nombre: 'Orchestrator',
      agente_tipo: 'orchestrator',
      categoria: 'briefing_diario',
      descripcion: `🌅 Briefing: ${logsHoy?.count || 0} acciones hoy | ${alertasCount?.count || 0} alertas activas`,
      detalles_json: JSON.stringify({ acciones_hoy: logsHoy?.count, alertas: alertasCount?.count }),
      resultado_status: 'exitoso',
      duracion_ms: Date.now() - startTime,
      empresa_id: empresaId
    });
    
    resultados.push({ agente: 'Orchestrator', status: 'ok', alertas: alertasCount?.count });
  } catch (e) {
    resultados.push({ agente: 'Orchestrator', status: 'error', error: e.message });
  }
  
  res.json({
    status: 'success',
    message: `Agentes ejecutados: ${resultados.filter(r => r.status === 'ok').length}/${resultados.length}`,
    resultados,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
