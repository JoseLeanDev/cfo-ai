const express = require('express');
const router = express.Router();

// GET /api/alertas
router.get('/', async (req, res) => {
  try {
    const alertas = [
      {
        id: 'ALT-001',
        level: 'warning',
        category: 'liquidez',
        message: 'Proyección muestra 18 días de liquidez en 4 semanas',
        action_required: '/tesoreria/proyeccion',
        due_date: '2026-04-28',
        created_at: new Date().toISOString()
      },
      {
        id: 'ALT-002',
        level: 'critical',
        category: 'operacion',
        message: 'CxC vencido supera Q500,000',
        action_required: '/tesoreria/cxc',
        due_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      },
      {
        id: 'ALT-003',
        level: 'warning',
        category: 'cumplimiento',
        message: 'IVA Marzo vence en 15 días',
        action_required: '/sat/calendario',
        due_date: '2026-04-15',
        created_at: new Date().toISOString()
      }
    ];

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
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
