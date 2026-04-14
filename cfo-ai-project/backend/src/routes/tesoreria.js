const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');

// GET /api/tesoreria/posicion
router.get('/posicion', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    
    // Usar nombres de columnas correctos para PostgreSQL
    const cuentas = await db.allAsync(`
      SELECT 
        banco,
        tipo,
        saldo,
        moneda,
        ${isPostgres ? 'NULL' : "julianday('now') - julianday(ultima_conciliacion)"} as dias_sin_conciliar
      FROM cuentas_bancarias 
      WHERE empresa_id = ? AND activa = TRUE
      ORDER BY saldo DESC
    `, [empresaId]);

    const totales = await db.getAsync(`
      SELECT 
        SUM(CASE WHEN moneda = 'GTQ' THEN saldo ELSE 0 END) as total_gtq,
        SUM(CASE WHEN moneda = 'USD' THEN saldo ELSE 0 END) as total_usd
      FROM cuentas_bancarias 
      WHERE empresa_id = ? AND activa = TRUE
    `, [empresaId]);

    const tipoCambio = 7.75;
    const totalGTQ = parseFloat(totales.total_gtq) || 0;
    const totalUSD = parseFloat(totales.total_usd) || 0;
    const totalConsolidado = totalGTQ + totalUSD * tipoCambio;
    const diasOperacion = Math.floor(totalGTQ / 50000);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        fecha_corte: new Date().toISOString().split('T')[0],
        total_disponible_gtq: totalGTQ,
        total_disponible_usd: totalUSD,
        tipo_cambio: tipoCambio,
        total_consolidado_gtq: totalConsolidado,
        dias_operacion: diasOperacion,
        cuentas: cuentas.map(c => ({
          ...c,
          saldo: parseFloat(c.saldo) || 0,
          dias_sin_conciliar: Math.floor(c.dias_sin_conciliar || 0)
        }))
      },
      ui_components: {
        cards: 'bank_account_cards',
        total_card: 'consolidated_position',
        gauge: {
          type: 'liquidity_days',
          value: diasOperacion,
          min: 0,
          max: 90,
          thresholds: { danger: 15, warning: 30, good: 45 }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/tesoreria/cxc
router.get('/cxc', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    
    // Para PostgreSQL: usar sintaxis compatible - evitar = 0 en CASE
    const distribucion = await db.getAsync(`
      SELECT 
        SUM(CASE WHEN dias_atraso IS NULL OR dias_atraso <= 0 THEN monto_total ELSE 0 END) as al_corriente,
        SUM(CASE WHEN dias_atraso > 0 AND dias_atraso <= 30 THEN monto_total ELSE 0 END) as _30_dias,
        SUM(CASE WHEN dias_atraso > 30 AND dias_atraso <= 60 THEN monto_total ELSE 0 END) as _60_dias,
        SUM(CASE WHEN dias_atraso > 60 THEN monto_total ELSE 0 END) as _90_dias,
        SUM(monto_total) as total
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado ${isPostgres ? "<> 'cobrada'" : "!= 'cobrada'"}
    `, [empresaId]);

    // Usar cliente_nombre y monto_total
    const topDeudores = await db.allAsync(`
      SELECT cliente_nombre as cliente, monto_total as monto, dias_atraso as dias
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado ${isPostgres ? "<> 'cobrada'" : "!= 'cobrada'"}
      ORDER BY monto_total DESC
      LIMIT 5
    `, [empresaId]);

    const promedioDias = await db.getAsync(`
      SELECT AVG(CASE WHEN dias_atraso IS NULL THEN 0 ELSE dias_atraso END) as promedio
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado ${isPostgres ? "<> 'cobrada'" : "!= 'cobrada'"}
    `, [empresaId]);

    const total = distribucion.total || 1;

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        total_cxc: parseFloat(distribucion.total) || 0,
        promedio_dias_cobro: Math.round(parseFloat(promedioDias.promedio) || 0),
        distribucion_aging: {
          al_corriente: { 
            monto: parseFloat(distribucion.al_corriente) || 0, 
            porcentaje: parseFloat(((parseFloat(distribucion.al_corriente) || 0) / total * 100).toFixed(1))
          },
          _30_dias: { 
            monto: parseFloat(distribucion._30_dias) || 0, 
            porcentaje: parseFloat(((parseFloat(distribucion._30_dias) || 0) / total * 100).toFixed(1))
          },
          _60_dias: { 
            monto: parseFloat(distribucion._60_dias) || 0, 
            porcentaje: parseFloat(((parseFloat(distribucion._60_dias) || 0) / total * 100).toFixed(1))
          },
          _90_dias: { 
            monto: parseFloat(distribucion._90_dias) || 0, 
            porcentaje: parseFloat(((parseFloat(distribucion._90_dias) || 0) / total * 100).toFixed(1))
          }
        },
        top_deudores: topDeudores.map(d => ({
          ...d,
          monto: parseFloat(d.monto) || 0
        }))
      },
      ui_components: {
        chart: 'aging_pie_chart',
        table: 'cxc_detail_table'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/tesoreria/cxp
router.get('/cxp', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    const dias = parseInt(req.query.proximos_dias) || 30;
    
    // Usar nombres de columnas PostgreSQL
    // Para PostgreSQL: fecha_vencimiento - CURRENT_DATE devuelve integer (días)
    const cxp = await db.allAsync(`
      SELECT 
        proveedor_nombre as proveedor,
        monto_total as monto,
        fecha_vencimiento,
        ${isPostgres ? '(fecha_vencimiento - CURRENT_DATE)::integer' : "CAST(julianday(fecha_vencimiento) - julianday('now') AS INTEGER)"} as dias_restantes
      FROM cuentas_pagar 
      WHERE empresa_id = ? 
        AND estado = 'pendiente'
        AND fecha_vencimiento <= ${isPostgres ? `CURRENT_DATE + INTERVAL '${dias} days'` : `date('now', '+${dias} days')`}
      ORDER BY fecha_vencimiento
    `, [empresaId]);

    const total = await db.getAsync(`
      SELECT SUM(monto_total) as total, 
             AVG(${isPostgres ? '(fecha_vencimiento - CURRENT_DATE)::integer' : "CAST(julianday(fecha_vencimiento) - julianday('now') AS INTEGER)"}) as promedio_dias
      FROM cuentas_pagar 
      WHERE empresa_id = ? AND estado = 'pendiente'
    `, [empresaId]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        total_cxp: parseFloat(total.total) || 0,
        promedio_dias_pago: Math.round(parseFloat(total.promedio_dias) || 0),
        proximos_pagos: cxp.map(p => ({
          ...p,
          monto: parseFloat(p.monto) || 0,
          dias_restantes: Math.ceil(parseFloat(p.dias_restantes)),
          ahorro_si_paga_hoy: 0
        }))
      },
      ui_components: {
        timeline: 'payment_timeline',
        table: 'cxp_schedule'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/tesoreria/proyeccion
router.get('/proyeccion', async (req, res) => {
  try {
    const semanas = parseInt(req.query.semanas) || 13;
    const proyeccion = [];
    
    // Datos históricos para proyección
    const promedioEntrada = 420000;
    const promedioSalida = 380000;
    let saldoAcumulado = 1900000;

    for (let i = 1; i <= semanas; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + (i * 7));
      
      const variacion = (Math.random() - 0.5) * 0.3; // ±15% variación
      const entradas = Math.round(promedioEntrada * (1 + variacion));
      const salidas = Math.round(promedioSalida * (1 + variacion * 0.5));
      const neto = entradas - salidas;
      saldoAcumulado += neto;

      proyeccion.push({
        semana: i,
        fecha_inicio: fecha.toISOString().split('T')[0],
        entradas,
        salidas,
        neto,
        saldo_acumulado: saldoAcumulado,
        certeza: i <= 4 ? 'alta' : i <= 8 ? 'media' : 'baja',
        alerta: saldoAcumulado < 1000000 ? 'Saldo crítico proyectado' : null
      });
    }

    const saldoMinimo = Math.min(...proyeccion.map(p => p.saldo_acumulado));
    const saldoMaximo = Math.max(...proyeccion.map(p => p.saldo_acumulado));
    const semanaCritica = proyeccion.find(p => p.saldo_acumulado === saldoMinimo)?.semana;

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        proyeccion,
        resumen: {
          saldo_minimo_proyectado: saldoMinimo,
          saldo_maximo_proyectado: saldoMaximo,
          semana_critica: semanaCritica,
          riesgo_quiebra_tecnica: saldoMinimo < 500000
        }
      },
      ui_components: {
        chart_type: 'cashflow_waterfall'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
