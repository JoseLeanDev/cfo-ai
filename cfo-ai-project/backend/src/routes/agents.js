const express = require('express');
const router = express.Router();
const { ejecutarTareasPendientesWakeUp } = require('../services/wakeUpScheduler');
const aiService = require('../services/aiService');

// GET /api/agents/status - Estado del sistema de agentes programados
router.get('/status', async (req, res) => {
  try {
    const core = req.app.get('CFOAICore');
    
    if (!core) {
      return res.json({
        success: true,
        isRunning: false,
        message: 'CFO AI Core no inicializado aún'
      });
    }
    
    const status = core.getEstado();
    
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agents API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/agents/execute - Ejecutar tarea manualmente
router.post('/execute', async (req, res) => {
  try {
    const { agente, tarea } = req.body;
    
    if (!agente || !tarea) {
      return res.status(400).json({ 
        error: 'Se requiere agente y tarea' 
      });
    }

    const core = req.app.get('CFOAICore');
    
    if (!core) {
      return res.status(503).json({
        error: 'CFO AI Core no inicializado'
      });
    }

    const result = await core.ejecutarTarea(agente, tarea);
    
    res.json({
      success: true,
      agente,
      tarea,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agents API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agents/logs
 * Obtiene el log de actividades de los agentes de IA
 */
router.get('/logs', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const agente = req.query.agente;
    const categoria = req.query.categoria;
    const status = req.query.status;
    const dias = parseInt(req.query.dias) || 7;
    
    // Detectar si es PostgreSQL
    const isPostgres = !!db.pool;
    
    const dateFilter = isPostgres 
      ? `created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '${dias} days'`
      : `created_at >= datetime('now', '-${dias} days')`;
    
    let query = `
      SELECT 
        id,
        agente_nombre,
        agente_tipo,
        agente_version,
        categoria,
        descripcion,
        detalles_json,
        entidad_tipo,
        entidad_id,
        impacto_valor,
        impacto_moneda,
        resultado_status,
        created_at,
        duracion_ms
      FROM agentes_logs
      WHERE empresa_id = ? 
        AND ${dateFilter}
    `;
    
    const params = [empresaId];
    
    if (agente) {
      query += ` AND agente_tipo = ?`;
      params.push(agente);
    }
    
    if (categoria) {
      query += ` AND categoria = ?`;
      params.push(categoria);
    }
    
    if (status) {
      query += ` AND resultado_status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const logs = await db.allAsync(query, params);
    
    // Mapear snake_case a camelCase para el frontend
    const logsParsed = logs.map(log => ({
      id: log.id,
      agenteNombre: log.agente_nombre,
      agenteTipo: log.agente_tipo,
      agenteVersion: log.agente_version,
      categoria: log.categoria,
      descripcion: log.descripcion,
      detallesJson: log.detalles_json,
      detalles: (() => {
        try {
          return log.detalles_json ? JSON.parse(log.detalles_json) : null;
        } catch (e) {
          console.warn('[Agents Logs] Error parseando detalles_json:', e.message);
          return null;
        }
      })(),
      entidadTipo: log.entidad_tipo,
      entidadId: log.entidad_id,
      impactoValor: log.impacto_valor,
      impactoMoneda: log.impacto_moneda,
      resultadoStatus: log.resultado_status,
      fecha: log.created_at,
      duracionMs: log.duracion_ms
    }));
    
    // Obtener estadísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT agente_tipo) as agentes_activos,
        SUM(CASE WHEN resultado_status = 'exitoso' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN resultado_status = 'error' THEN 1 ELSE 0 END) as errores,
        SUM(CASE WHEN resultado_status = 'advertencia' THEN 1 ELSE 0 END) as advertencias
      FROM agentes_logs
      WHERE empresa_id = ? 
        AND ${dateFilter}
    `;
    
    const stats = await db.getAsync(statsQuery, [empresaId]);
    
    // Agrupar por categoría
    const porCategoriaQuery = `
      SELECT 
        categoria,
        COUNT(*) as count
      FROM agentes_logs
      WHERE empresa_id = ? 
        AND ${dateFilter}
      GROUP BY categoria
      ORDER BY count DESC
    `;
    
    const porCategoria = await db.allAsync(porCategoriaQuery, [empresaId]);
    
    // Agrupar por agente
    const porAgenteQuery = `
      SELECT 
        agente_tipo as agente,
        agente_nombre as nombre,
        COUNT(*) as count
      FROM agentes_logs
      WHERE empresa_id = ? 
        AND ${dateFilter}
      GROUP BY agente_tipo, agente_nombre
      ORDER BY count DESC
    `;
    
    const porAgente = await db.allAsync(porAgenteQuery, [empresaId]);
    
    // Agrupar por status
    const porStatusQuery = `
      SELECT 
        resultado_status as status,
        COUNT(*) as count
      FROM agentes_logs
      WHERE empresa_id = ? 
        AND ${dateFilter}
      GROUP BY resultado_status
      ORDER BY count DESC
    `;
    
    const porStatus = await db.allAsync(porStatusQuery, [empresaId]);
    
    // Convertir porStatus a objeto
    const porStatusObj = porStatus.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        logs: logsParsed,
        estadisticas: {
          total: stats?.total || 0,
          agentesActivos: stats?.agentes_activos || 0,
          exitosos: stats?.exitosos || 0,
          errores: stats?.errores || 0,
          advertencias: stats?.advertencias || 0,
          porCategoria,
          porAgente,
          por_status: porStatusObj
        },
        pagination: {
          total: stats?.total || 0,
          limit,
          offset,
          hasMore: (offset + logs.length) < (stats?.total || 0)
        }
      }
    });
  } catch (error) {
    console.error('[GET /api/agents/logs] Error completo:', error);
    console.error('[GET /api/agents/logs] Stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener logs de agentes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/agents/logs
 * Crear un nuevo log (usado internamente por los agentes)
 */
router.post('/logs', async (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      empresa_id = 1,
      agente_nombre,
      agente_tipo,
      agente_version = '1.0',
      categoria,
      descripcion,
      detalles,
      entidad_tipo,
      entidad_id,
      impacto_valor,
      impacto_moneda = 'GTQ',
      resultado_status = 'exito',
      duracion_ms
    } = req.body;
    
    const result = await db.runAsync(`
      INSERT INTO agentes_logs 
      (empresa_id, agente_nombre, agente_tipo, agente_version, categoria, descripcion, 
       detalles_json, entidad_tipo, entidad_id, impacto_valor, impacto_moneda, 
       resultado_status, duracion_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      empresa_id,
      agente_nombre,
      agente_tipo,
      agente_version,
      categoria,
      descripcion,
      detalles ? JSON.stringify(detalles) : null,
      entidad_tipo,
      entidad_id,
      impacto_valor,
      impacto_moneda,
      resultado_status,
      duracion_ms
    ]);
    
    res.json({
      status: 'success',
      message: 'Log registrado exitosamente',
      log_id: result.lastID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[POST /api/agents/logs] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al registrar log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// CHAT ENDPOINT - CFO AI Assistant
// ============================================

/**
 * Obtiene contexto financiero de la empresa para el LLM
 * @param {Object} db - Database connection
 * @param {number} empresaId - ID de la empresa
 * @param {boolean} isPostgres - Si es PostgreSQL
 * @returns {Promise<Object>} - Contexto financiero
 */
async function obtenerContextoFinanciero(db, empresaId, isPostgres) {
  const contexto = {
    cxc: { total: 0, count: 0, avg_dias: 0 },
    cxp: { total: 0, count: 0 },
    bancos: { disponible_gtq: 0, disponible_usd: 0, cuentas_activas: 0 },
    deudores: [],
    proximos_pagos: [],
    obligaciones_sat: [],
    cuentas_bancarias: [],
    fecha_actual: new Date().toISOString().split('T')[0]
  };

  try {
    // CxC resumen
    const cxcQuery = isPostgres
      ? `SELECT COUNT(*) as count, SUM(monto_pendiente) as total, AVG(dias_atraso) as avg_dias FROM cuentas_cobrar WHERE empresa_id = $1 AND estado != 'cobrada'`
      : `SELECT COUNT(*) as count, SUM(monto) as total, AVG(dias_atraso) as avg_dias FROM cuentas_cobrar WHERE empresa_id = ? AND estado != 'cobrada'`;
    const cxc = await db.getAsync(cxcQuery, [empresaId]);
    contexto.cxc = { total: cxc?.total || 0, count: cxc?.count || 0, avg_dias: Math.round(cxc?.avg_dias || 0) };
  } catch (e) { console.error('[Context] CxC error:', e.message); }

  try {
    // CxP resumen
    const cxpQuery = isPostgres
      ? `SELECT COUNT(*) as count, SUM(monto_total) as total FROM cuentas_pagar WHERE empresa_id = $1 AND estado = 'pendiente'`
      : `SELECT COUNT(*) as count, SUM(monto) as total FROM cuentas_pagar WHERE empresa_id = ? AND estado = 'pendiente'`;
    const cxp = await db.getAsync(cxpQuery, [empresaId]);
    contexto.cxp = { total: cxp?.total || 0, count: cxp?.count || 0 };
  } catch (e) { console.error('[Context] CxP error:', e.message); }

  try {
    // Efectivo bancario
    const bancoQuery = isPostgres
      ? `SELECT SUM(CASE WHEN moneda = 'GTQ' THEN saldo ELSE 0 END) as disponible_gtq, SUM(CASE WHEN moneda = 'USD' THEN saldo ELSE 0 END) as disponible_usd, COUNT(*) as cuentas_activas FROM cuentas_bancarias WHERE empresa_id = $1 AND activa = TRUE`
      : `SELECT SUM(CASE WHEN moneda = 'GTQ' THEN saldo ELSE 0 END) as disponible_gtq, SUM(CASE WHEN moneda = 'USD' THEN saldo ELSE 0 END) as disponible_usd, COUNT(*) as cuentas_activas FROM cuentas_bancarias WHERE empresa_id = ? AND activa = TRUE`;
    const bancos = await db.getAsync(bancoQuery, [empresaId]);
    contexto.bancos = { 
      disponible_gtq: bancos?.disponible_gtq || 0, 
      disponible_usd: bancos?.disponible_usd || 0,
      cuentas_activas: bancos?.cuentas_activas || 0
    };
  } catch (e) { console.error('[Context] Bancos error:', e.message); }

  try {
    // Top deudores (máx 3)
    const deudoresQuery = isPostgres
      ? `SELECT cliente_nombre as cliente, monto_pendiente as monto, dias_atraso FROM cuentas_cobrar WHERE empresa_id = $1 AND estado != 'cobrada' ORDER BY monto_pendiente DESC LIMIT 3`
      : `SELECT cliente, monto, dias_atraso FROM cuentas_cobrar WHERE empresa_id = ? AND estado != 'cobrada' ORDER BY monto DESC LIMIT 3`;
    contexto.deudores = await db.allAsync(deudoresQuery, [empresaId]) || [];
  } catch (e) { console.error('[Context] Deudores error:', e.message); }

  try {
    // Próximos pagos (máx 3)
    const pagosQuery = isPostgres
      ? `SELECT proveedor_nombre as proveedor, monto_pendiente as monto, fecha_vencimiento, EXTRACT(DAY FROM (fecha_vencimiento - CURRENT_DATE)) as dias_restantes FROM cuentas_pagar WHERE empresa_id = $1 AND estado = 'pendiente' AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '14 days' ORDER BY fecha_vencimiento LIMIT 3`
      : `SELECT proveedor, monto, fecha_vencimiento, CAST((julianday(fecha_vencimiento) - julianday('now')) AS INTEGER) as dias_restantes FROM cuentas_pagar WHERE empresa_id = ? AND estado = 'pendiente' AND fecha_vencimiento <= date('now', '+14 days') ORDER BY fecha_vencimiento LIMIT 3`;
    contexto.proximos_pagos = await db.allAsync(pagosQuery, [empresaId]) || [];
  } catch (e) { console.error('[Context] Pagos error:', e.message); }

  try {
    // Obligaciones SAT próximas
    const satQuery = isPostgres
      ? `SELECT tipo, periodo, fecha_vencimiento FROM sat_calendario WHERE fecha_vencimiento >= CURRENT_DATE AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' ORDER BY fecha_vencimiento LIMIT 2`
      : `SELECT tipo, periodo, fecha_vencimiento FROM sat_calendario WHERE fecha_vencimiento >= date('now') AND fecha_vencimiento <= date('now', '+30 days') ORDER BY fecha_vencimiento LIMIT 2`;
    contexto.obligaciones_sat = await db.allAsync(satQuery) || [];
  } catch (e) { console.error('[Context] SAT error:', e.message); }

  try {
    // Cuentas bancarias
    const cuentasQuery = isPostgres
      ? `SELECT banco, saldo, moneda FROM cuentas_bancarias WHERE empresa_id = $1 AND activa = TRUE LIMIT 3`
      : `SELECT banco, saldo, moneda FROM cuentas_bancarias WHERE empresa_id = ? AND activa = TRUE LIMIT 3`;
    contexto.cuentas_bancarias = await db.allAsync(cuentasQuery, [empresaId]) || [];
  } catch (e) { console.error('[Context] Cuentas error:', e.message); }

  return contexto;
}

/**
 * POST /api/agents/chat
 * Endpoint principal para el chat del CFO AI Assistant
 * Procesa mensajes del usuario y retorna respuestas inteligentes
 */
router.post('/chat', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.body.empresa_id || 1;
    const message = req.body.message;
    
    // Detectar si es PostgreSQL o SQLite
    const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un mensaje'
      });
    }
    
    const messageLower = message.toLowerCase();
    
    // ========== ANÁLISIS DE INTENCIÓN ==========
    
    // 1. Consulta de runway / liquidez
    if (messageLower.includes('runway') || messageLower.includes('liquidez') || messageLower.includes('efectivo') || messageLower.includes('cash')) {
      const posicion = await db.getAsync(`
        SELECT 
          SUM(CASE WHEN moneda = 'GTQ' THEN saldo ELSE 0 END) as disponible_gtq,
          SUM(CASE WHEN moneda = 'USD' THEN saldo ELSE 0 END) as disponible_usd
        FROM cuentas_bancarias 
        WHERE empresa_id = ? AND activa = TRUE
      `, [empresaId]);
      
      const gastosPromedio = 50000; // Estimación
      const diasOperacion = Math.floor((parseFloat(posicion?.disponible_gtq) || 0) / gastosPromedio);
      
      return res.json({
        success: true,
        response: {
          content: `💰 **Runway de Efectivo**\n\n` +
            `• Disponible GTQ: Q${(parseFloat(posicion?.disponible_gtq) || 0).toLocaleString()}\n` +
            `• Disponible USD: $${(parseFloat(posicion?.disponible_usd) || 0).toLocaleString()}\n\n` +
            `📊 **Días de Operación:** ${diasOperacion} días\n` +
            `(Basado en gastos promedio diarios estimados)`,
          agent: 'Análisis',
          type: 'analysis'
        }
      });
    }
    
    // 2. Consulta de KPIs
    if (messageLower.includes('kpi') || messageLower.includes('metric') || messageLower.includes('indicador')) {
      const cxcQuery = isPostgres 
        ? `SELECT COUNT(*) as count, SUM(monto_pendiente) as total, AVG(dias_atraso) as avg_dias FROM cuentas_cobrar WHERE empresa_id = ? AND estado != 'cobrada'`
        : `SELECT COUNT(*) as count, SUM(monto) as total, AVG(dias_atraso) as avg_dias FROM cuentas_cobrar WHERE empresa_id = ? AND estado != 'cobrada'`;
        
      const cxpQuery = isPostgres
        ? `SELECT COUNT(*) as count, SUM(monto_total) as total FROM cuentas_pagar WHERE empresa_id = ? AND estado = 'pendiente'`
        : `SELECT COUNT(*) as count, SUM(monto) as total FROM cuentas_pagar WHERE empresa_id = ? AND estado = 'pendiente'`;
      
      const cxc = await db.getAsync(cxcQuery, [empresaId]);
      const cxp = await db.getAsync(cxpQuery, [empresaId]);
      
      return res.json({
        success: true,
        response: {
          content: `📈 **KPIs Financieros Clave**\n\n` +
            `**CxC:**\n` +
            `• Total pendiente: Q${(parseFloat(cxc?.total) || 0).toLocaleString()}\n` +
            `• Facturas: ${cxc?.count || 0}\n` +
            `• Días promedio: ${Math.round(parseFloat(cxc?.avg_dias) || 0)}\n\n` +
            `**CxP:**\n` +
            `• Total pendiente: Q${(parseFloat(cxp?.total) || 0).toLocaleString()}\n` +
            `• Facturas: ${cxp?.count || 0}`,
          agent: 'Análisis',
          type: 'analysis'
        }
      });
    }
    
    // 3. Consulta de obligaciones SAT
    if (messageLower.includes('sat') || messageLower.includes('iva') || messageLower.includes('isr') || messageLower.includes('declara') || messageLower.includes('impuesto')) {
      const calendarioQuery = isPostgres
        ? `SELECT * FROM sat_calendario WHERE fecha_vencimiento >= CURRENT_DATE AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' ORDER BY fecha_vencimiento LIMIT 3`
        : `SELECT * FROM sat_calendario WHERE fecha_vencimiento >= date('now') AND fecha_vencimiento <= date('now', '+30 days') ORDER BY fecha_vencimiento LIMIT 3`;
      
      const calendario = await db.allAsync(calendarioQuery);
      
      let respText = `📅 **Obligaciones SAT Próximas**\n\n`;
      
      if (calendario && calendario.length > 0) {
        calendario.forEach(obs => {
          const diasRestantes = Math.ceil((new Date(obs.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
          respText += `• **${obs.tipo}** - ${obs.periodo}\n`;
          respText += `  Vence: ${obs.fecha_vencimiento} (${diasRestantes} días)\n\n`;
        });
      } else {
        respText += `No hay obligaciones próximas a vencer en los próximos 30 días. ✅`;
      }
      
      return res.json({
        success: true,
        response: {
          content: respText,
          agent: 'Contabilidad',
          type: 'alert'
        }
      });
    }
    
    // 4. Consulta de producto menos rentable
    if (messageLower.includes('menos rentable') || messageLower.includes('peor producto') || messageLower.includes('bajo margen')) {
      return res.json({
        success: true,
        response: {
          content: `📉 **Producto Menos Rentable: Desinfectantes**\n\n` +
            `• Margen bruto: **20%** (vs 35% promedio)\n` +
            `• Ventas: Q450,000\n` +
            `• Unidades: 1,800\n\n` +
            `💡 **Recomendación:** Evaluar aumentar precio 10% o negociar costos con proveedor.`,
          agent: 'Análisis',
          type: 'analysis'
        }
      });
    }
    
    // 5. Consulta de CxC / cobranza
    if (messageLower.includes('cxc') || messageLower.includes('cobranza') || messageLower.includes('cliente') || messageLower.includes('deudor')) {
      const deudoresQuery = isPostgres
        ? `SELECT cliente_nombre as cliente, monto_pendiente as monto, dias_atraso FROM cuentas_cobrar WHERE empresa_id = $1 AND estado != 'cobrada' ORDER BY monto_pendiente DESC LIMIT 5`
        : `SELECT cliente, monto, dias_atraso FROM cuentas_cobrar WHERE empresa_id = ? AND estado != 'cobrada' ORDER BY monto DESC LIMIT 5`;
        
      const topDeudores = await db.allAsync(deudoresQuery, [empresaId]);
      
      let respText = `👥 **Top Deudores**\n\n`;
      
      if (topDeudores && topDeudores.length > 0) {
        topDeudores.forEach((d, i) => {
          const alerta = d.dias_atraso > 60 ? '🔴' : d.dias_atraso > 30 ? '🟡' : '🟢';
          respText += `${i+1}. **${d.cliente}**\n`;
          respText += `   ${alerta} Q${parseFloat(d.monto).toLocaleString()} - ${d.dias_atraso} días\n\n`;
        });
      } else {
        respText += `No hay cuentas por cobrar pendientes. ✅`;
      }
      
      return res.json({
        success: true,
        response: {
          content: respText,
          agent: 'Cobranza',
          type: 'alert'
        }
      });
    }
    
    // 6. Consulta de CxP / proveedores
    if (messageLower.includes('cxp') || messageLower.includes('proveedor') || messageLower.includes('pago')) {
      const pagosQuery = isPostgres
        ? `SELECT proveedor_nombre as proveedor, monto_pendiente as monto, fecha_vencimiento, EXTRACT(DAY FROM (fecha_vencimiento - CURRENT_DATE)) as dias_restantes FROM cuentas_pagar WHERE empresa_id = $1 AND estado = 'pendiente' AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '14 days' ORDER BY fecha_vencimiento LIMIT 5`
        : `SELECT proveedor, monto, fecha_vencimiento, CAST((julianday(fecha_vencimiento) - julianday('now')) AS INTEGER) as dias_restantes FROM cuentas_pagar WHERE empresa_id = ? AND estado = 'pendiente' AND fecha_vencimiento <= date('now', '+14 days') ORDER BY fecha_vencimiento LIMIT 5`;
        
      const proximosPagos = await db.allAsync(pagosQuery, [empresaId]);
      
      let respText = `💳 **Próximos Pagos**\n\n`;
      
      if (proximosPagos && proximosPagos.length > 0) {
        proximosPagos.forEach(p => {
          const alerta = p.dias_restantes < 0 ? '🔴 VENCIDO' : p.dias_restantes <= 5 ? '🟡 Pronto' : '🟢';
          respText += `• **${p.proveedor}**\n`;
          respText += `  ${alerta} Q${parseFloat(p.monto).toLocaleString()} - ${p.dias_restantes} días\n\n`;
        });
      } else {
        respText += `No hay pagos pendientes en los próximos 14 días. ✅`;
      }
      
      return res.json({
        success: true,
        response: {
          content: respText,
          agent: 'Cobranza',
          type: 'alert'
        }
      });
    }
    
    // 7. Consulta de conciliación
    if (messageLower.includes('concilia') || messageLower.includes('banco')) {
      const cuentasQuery = isPostgres
        ? `SELECT banco, saldo, moneda, CASE WHEN ultima_conciliacion IS NULL THEN 'Nunca' ELSE EXTRACT(DAY FROM (CURRENT_DATE - ultima_conciliacion::date)) || ' días' END as dias_sin_conciliar FROM cuentas_bancarias WHERE empresa_id = $1 AND activa = TRUE`
        : `SELECT banco, saldo, moneda, CASE WHEN ultima_conciliacion IS NULL THEN 'Nunca' ELSE CAST((julianday('now') - julianday(ultima_conciliacion)) AS INTEGER) || ' días' END as dias_sin_conciliar FROM cuentas_bancarias WHERE empresa_id = ? AND activa = TRUE`;
      
      const cuentas = await db.allAsync(cuentasQuery, [empresaId]);
      
      let respText = `🏦 **Estado de Conciliación**\n\n`;
      
      cuentas.forEach(c => {
        const alerta = c.dias_sin_conciliar.includes('Nunca') || parseInt(c.dias_sin_conciliar) > 2 ? '🔴' : '🟢';
        respText += `• **${c.banco}** (${c.moneda})\n`;
        respText += `  ${alerta} Sin conciliar: ${c.dias_sin_conciliar}\n`;
        respText += `  Saldo: ${c.moneda === 'USD' ? '$' : 'Q'}${parseFloat(c.saldo).toLocaleString()}\n\n`;
      });
      
      return res.json({
        success: true,
        response: {
          content: respText,
          agent: 'Contabilidad',
          type: 'analysis'
        }
      });
    }
    
    // 8. Consulta de CCC (Cash Conversion Cycle)
    if (messageLower.includes('ccc') || messageLower.includes('cash conversion') || messageLower.includes('ciclo')) {
      const cxcData = await db.getAsync(`
        SELECT AVG(dias_atraso) as promedio_dias_cobro FROM cuentas_cobrar WHERE empresa_id = ? AND estado != 'cobrada'
      `, [empresaId]);
      
      const cxpDataQuery = isPostgres
        ? `SELECT AVG(EXTRACT(DAY FROM (fecha_vencimiento::date - fecha_emision::date))) as promedio_dias_pago FROM cuentas_pagar WHERE empresa_id = $1 AND estado = 'pendiente'`
        : `SELECT AVG(CAST((julianday(fecha_vencimiento) - julianday(fecha_emision)) AS INTEGER)) as promedio_dias_pago FROM cuentas_pagar WHERE empresa_id = ? AND estado = 'pendiente'`;
      
      const cxpData = await db.getAsync(cxpDataQuery, [empresaId]);
      
      const dso = Math.round(parseFloat(cxcData?.promedio_dias_cobro) || 45);
      const dpo = Math.round(parseFloat(cxpData?.promedio_dias_pago) || 30);
      const dio = 45; // Placeholder
      const ccc = dio + dso - dpo;
      
      return res.json({
        success: true,
        response: {
          content: `🔄 **Cash Conversion Cycle**\n\n` +
            `• **DIO** (Inventario): ${dio} días\n` +
            `• **DSO** (Cobro): ${dso} días\n` +
            `• **DPO** (Pago): ${dpo} días\n\n` +
            `**Total CCC:** ${ccc} días\n\n` +
            `💡 *Objetivo: Mantener CCC < 60 días*`,
          agent: 'Análisis',
          type: 'analysis'
        }
      });
    }
    
    // ========== RESPUESTA CON LLM ==========
    // Para preguntas que no coinciden con keywords exactas, usar IA
    
    try {
      const apiKey = process.env.OPENROUTER_API_KEY || process.env.KIMI_API_KEY;
      
      if (apiKey && apiKey !== 'sk-or-v1-tu-api-key-aqui') {
        console.log('[Chat] Usando LLM para responder:', message);
        
        const contexto = await obtenerContextoFinanciero(db, empresaId, isPostgres);
        const respuestaIA = await aiService.conversar(message, contexto);
        
        return res.json({
          success: true,
          response: {
            content: respuestaIA,
            agent: 'CFO AI Core',
            type: 'ai_response'
          }
        });
      }
    } catch (llmError) {
      console.error('[Chat] Error LLM:', llmError.message);
    }
    
    // ========== RESPUESTA POR DEFECTO ==========
    
    return res.json({
      success: true,
      response: {
        content: `🤔 Entiendo tu pregunta. Puedo ayudarte con:\n\n` +
          `• 💰 **Runway** - Días de efectivo disponible\n` +
          `• 📈 **KPIs** - Indicadores financieros clave\n` +
          `• 📅 **SAT** - Obligaciones fiscales próximas\n` +
          `• 👥 **CxC** - Cuentas por cobrar y deudores\n` +
          `• 💳 **CxP** - Pagos a proveedores\n` +
          `• 🏦 **Conciliación** - Estado bancario\n` +
          `• 🔄 **CCC** - Cash Conversion Cycle\n\n` +
          `¿Qué te gustaría consultar?`,
        agent: 'CFO AI Core',
        type: 'welcome'
      }
    });
    
  } catch (error) {
    console.error('[POST /api/agents/chat] Error completo:', error);
    console.error('[POST /api/agents/chat] Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el mensaje',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// ENDPOINTS PARA TAREAS PROGRAMADAS (SCHEDULER)
// ============================================

/**
 * GET /api/agents/ia/status
 * Obtiene el estado actual de los agentes de IA
 */
router.get('/ia/status', async (req, res) => {
  try {
    const core = req.app.get('CFOAICore');
    
    if (!core) {
      return res.json({
        success: true,
        estado: 'no_inicializado',
        mensaje: 'CFO AI Core no iniciado',
        agentes: [],
        timestamp: new Date().toISOString()
      });
    }
    
    const estado = core.getEstado();
    
    res.json({
      success: true,
      ...estado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agents IA API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/ia/execute
 * Ejecutar tarea manual de agente de IA
 */
router.post('/ia/execute', async (req, res) => {
  try {
    const { agente, tarea } = req.body;
    
    if (!agente || !tarea) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere agente y tarea' 
      });
    }

    const core = req.app.get('CFOAICore');
    
    if (!core) {
      return res.status(503).json({
        success: false,
        error: 'CFO AI Core no inicializado'
      });
    }

    const resultado = await core.ejecutarTarea(agente, tarea);
    
    res.json({
      success: true,
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agents IA API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agents/ia/alertas
 * Obtiene alertas financieras detectadas por IA
 */
router.get('/ia/alertas', async (req, res) => {
  try {
    const db = req.app.get('db');
    const limit = parseInt(req.query.limit) || 50;
    const estado = req.query.estado || 'activa';
    const nivel = req.query.nivel;
    
    let query = `SELECT * FROM alertas_financieras WHERE estado = ?`;
    const params = [estado];
    
    if (nivel) {
      query += ` AND nivel = ?`;
      params.push(nivel);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    const alertas = await db.allAsync(query, params);
    
    // Parsear metadata
    const alertasParsed = alertas.map(a => ({
      ...a,
      metadata: a.metadata ? JSON.parse(a.metadata) : null
    }));
    
    res.json({
      success: true,
      data: alertasParsed,
      count: alertasParsed.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agents IA API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agents/ia/briefing
 * Obtiene el briefing diario generado por IA
 */
router.get('/ia/briefing', async (req, res) => {
  try {
    const db = req.app.get('db');
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    
    const briefing = await db.getAsync(
      `SELECT * FROM briefings_diarios WHERE fecha = ?`,
      [fecha]
    );
    
    if (!briefing) {
      return res.json({
        success: true,
        data: null,
        mensaje: 'No hay briefing para la fecha solicitada'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...briefing,
        insights: briefing.insights_json ? JSON.parse(briefing.insights_json) : []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agents IA API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
