const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    
    // KPIs de tesorería
    const posicionBancaria = await db.getAsync(`
      SELECT 
        SUM(CASE WHEN moneda = 'GTQ' THEN saldo ELSE 0 END) as total_gtq,
        SUM(CASE WHEN moneda = 'USD' THEN saldo ELSE 0 END) as total_usd,
        COUNT(*) as num_cuentas
      FROM cuentas_bancarias 
      WHERE empresa_id = ? AND activa = 1
    `, [empresaId]);

    // CxC resumen
    const cxcResumen = await db.getAsync(`
      SELECT 
        SUM(monto) as total_cxc,
        SUM(CASE WHEN dias_atraso > 30 THEN monto ELSE 0 END) as vencido,
        AVG(dias_atraso) as promedio_dias
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado != 'cobrada'
    `, [empresaId]);

    // CxP resumen
    const cxpResumen = await db.getAsync(`
      SELECT 
        SUM(monto) as total_cxp,
        SUM(CASE WHEN fecha_vencimiento < date('now') THEN monto ELSE 0 END) as vencido
      FROM cuentas_pagar 
      WHERE empresa_id = ? AND estado = 'pendiente'
    `, [empresaId]);

    // Ventas del mes
    const ventasMes = await db.getAsync(`
      SELECT SUM(monto) as total
      FROM transacciones 
      WHERE empresa_id = ? 
        AND tipo = 'entrada' 
        AND strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')
    `, [empresaId]);

    // Promedios de los últimos 6 meses para runway calculator
    const promedios6Meses = await db.getAsync(`
      SELECT 
        AVG(CASE WHEN tipo = 'entrada' THEN monto ELSE 0 END) as avg_ingresos_mes,
        AVG(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as avg_gastos_mes,
        COUNT(DISTINCT strftime('%Y-%m', fecha)) as meses_con_datos
      FROM transacciones 
      WHERE empresa_id = ? 
        AND fecha >= date('now', '-6 months')
    `, [empresaId]);

    // Calcular promedios reales solo de meses con datos
    const mesesHistoricos = await db.allAsync(`
      SELECT 
        strftime('%Y-%m', fecha) as mes,
        SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as gastos
      FROM transacciones 
      WHERE empresa_id = ? 
        AND fecha >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', fecha)
    `, [empresaId]);
    
    const avgIngresos = mesesHistoricos.length > 0 
      ? mesesHistoricos.reduce((sum, m) => sum + m.ingresos, 0) / mesesHistoricos.length 
      : (ventasMes.total || 0);
    const avgGastos = mesesHistoricos.length > 0 
      ? mesesHistoricos.reduce((sum, m) => sum + m.gastos, 0) / mesesHistoricos.length 
      : 0;

    // Alertas activas
    const alertas = [];
    
    // Alerta de liquidez
    const diasOperacion = Math.floor((posicionBancaria.total_gtq || 0) / 50000);
    if (diasOperacion < 20) {
      alertas.push({
        level: 'warning',
        category: 'liquidez',
        message: `Proyección muestra ${diasOperacion} días de liquidez`,
        action_required: '/tesoreria/proyeccion',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    // Alerta CxC vencido
    if (cxcResumen.vencido > 500000) {
      alertas.push({
        level: 'critical',
        category: 'operacion',
        message: `CxC vencido supera Q500,000 (actual: Q${Math.floor(cxcResumen.vencido).toLocaleString()})`,
        action_required: '/tesoreria/cxc',
        due_date: new Date().toISOString().split('T')[0]
      });
    }

    // Alerta SAT
    const obligacionesPendientes = await db.getAsync(`
      SELECT COUNT(*) as count
      FROM obligaciones_sat 
      WHERE empresa_id = ? AND estado = 'pendiente' AND fecha_vencimiento <= date('now', '+7 days')
    `, [empresaId]);

    if (obligacionesPendientes.count > 0) {
      alertas.push({
        level: 'warning',
        category: 'cumplimiento',
        message: `${obligacionesPendientes.count} obligación(es) SAT en próximos 7 días`,
        action_required: '/sat/calendario',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        kpis: {
          ventas_mes: {
            value: ventasMes.total || 0,
            currency: 'GTQ',
            var: 6.7
          },
          disponible_gtq: {
            value: posicionBancaria.total_gtq || 0,
            currency: 'GTQ',
            var: 2.1
          },
          dias_operacion: {
            value: diasOperacion,
            trend: diasOperacion < 30 ? 'down' : 'stable'
          },
          cxc_total: {
            value: cxcResumen.total_cxc || 0,
            currency: 'GTQ',
            var: -5.2
          },
          cxp_total: {
            value: cxpResumen.total_cxp || 0,
            currency: 'GTQ'
          },
          runway: {
            promedio_ingresos_mensual: Math.round(avgIngresos),
            promedio_gastos_mensual: Math.round(avgGastos),
            meses_historicos: mesesHistoricos.length
          }
        }
      },
      alerts: alertas,
      ui_components: {
        cards: [
          { type: 'currency', title: 'Ventas del Mes', data_key: 'ventas_mes' },
          { type: 'currency', title: 'Disponible GTQ', data_key: 'disponible_gtq' },
          { type: 'number', title: 'Días Operación', data_key: 'dias_operacion', unit: 'días' },
          { type: 'currency', title: 'CxC Total', data_key: 'cxc_total' }
        ],
        charts: [
          { type: 'line', title: 'Tendencia 6 Meses', endpoint: '/analisis/tendencias' }
        ]
      }
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
