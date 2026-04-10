/**
 * Routes para Agente Conciliador Bancario
 * NOTA: Temporalemente desactivado - migrado al nuevo sistema de agentes programados
 */
const express = require('express');
const router = express.Router();
// const ConciliadorBancario = require('../../agents/conciliador/ConciliadorBancario');
// const conciliador = new ConciliadorBancario();

// POST /api/agents/conciliador - Desactivado temporalmente
router.post('/', async (req, res) => {
  res.json({ 
    message: 'Endpoint migrado al nuevo sistema de agentes programados',
    nuevoEndpoint: '/api/agents/status',
    status: 'migrado'
  });
});

// GET /api/agents/conciliador/conciliaciones/:empresa_id/:anio/:mes
router.get('/conciliaciones/:empresa_id/:anio/:mes', async (req, res) => {
  try {
    const { empresa_id, anio, mes } = req.params;
    const db = req.app.get('db');

    const conciliaciones = await db.allAsync(`
      SELECT 
        cb.*,
        c.nombre_banco,
        c.numero_cuenta,
        c.moneda
      FROM conciliaciones_bancarias cb
      JOIN cuentas_bancarias c ON cb.cuenta_bancaria_id = c.id
      WHERE cb.empresa_id = ? AND cb.anio = ? AND cb.mes = ?
      ORDER BY c.nombre_banco
    `, [empresa_id, anio, mes]);

    res.json(conciliaciones);
  } catch (error) {
    console.error('[Routes/Conciliador] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
