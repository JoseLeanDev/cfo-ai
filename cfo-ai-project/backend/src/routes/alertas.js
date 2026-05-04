const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

// GET /api/alertas
router.get('/', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || process.env.DEFAULT_EMPRESA_ID || 1;
    const alertas = [];
    
    // 1. Alerta: CxC vencido alto
    try {
      const cxcVencido = await db.getAsync(`
        SELECT SUM(monto_pendiente) as total, COUNT(*) as count
        FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado != 'cobrada' AND dias_atraso > 30
      `, [empresaId]);
      
      const totalVencido = parseFloat(cxcVencido?.total) || 0;
      if (totalVencido > 0) {
        alertas.push({
          id: 'ALT-CXC-001',
          level: totalVencido > 500000 ? 'critical' : 'warning',
          category: 'operacion',
          message: `CxC vencido supera Q${totalVencido.toLocaleString()}`,
          action_required: '/tesoreria/cxc',
          due_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          data: { total: totalVencido, count: cxcVencido.count || 0 }
        });
      }
    } catch (e) {
      console.log('[Alertas] No se pudo consultar CxC vencido:', e.message);
    }
    
    // 2. Alerta: CxP próximas a vencer
    try {
      const cxpProximas = await db.getAsync(`
        SELECT COUNT(*) as count, SUM(monto_pendiente) as total
        FROM cuentas_pagar
        WHERE empresa_id = ? AND estado = 'pendiente'
        AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
      `, [empresaId]);
      
      const count = parseInt(cxpProximas?.count) || 0;
      const total = parseFloat(cxpProximas?.total) || 0;
      if (count > 0) {
        alertas.push({
          id: 'ALT-CXP-001',
          level: 'warning',
          category: 'operacion',
          message: `${count} cuenta(s) por pagar vence(n) esta semana por Q${total.toLocaleString()}`,
          action_required: '/tesoreria/cxp',
          due_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          data: { count, total }
        });
      }
    } catch (e) {
      console.log('[Alertas] No se pudo consultar CxP próximas:', e.message);
    }
    
    // 3. Alerta: Liquidez baja
    try {
      const tesoreria = await db.getAsync(`
        SELECT SUM(CASE WHEN moneda = 'GTQ' THEN saldo ELSE 0 END) as total_gtq
        FROM cuentas_bancarias
        WHERE empresa_id = ? AND activa = TRUE
      `, [empresaId]);
      
      const totalGTQ = parseFloat(tesoreria?.total_gtq) || 0;
      const umbralCritico = parseFloat(process.env.UMBRAL_LIQUIDEZ_CRITICO) || 100000;
      
      if (totalGTQ < umbralCritico) {
        alertas.push({
          id: 'ALT-LIQ-001',
          level: 'critical',
          category: 'liquidez',
          message: `Liquidez crítica: Q${totalGTQ.toLocaleString()} disponible`,
          action_required: '/tesoreria',
          due_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          data: { disponible: totalGTQ, umbral: umbralCritico }
        });
      }
    } catch (e) {
      console.log('[Alertas] No se pudo consultar tesorería:', e.message);
    }

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        total: alertas.length,
        critical: alertas.filter(a => a.level === 'critical').length,
        warning: alertas.filter(a => a.level === 'warning').length,
        info: alertas.filter(a => a.level === 'info').length,
        alertas
      }
    });
  } catch (error) {
    console.error('[Alertas] Error general:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
