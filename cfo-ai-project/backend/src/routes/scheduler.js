/**
 * Routes para Scheduler v2.0
 * Endpoints para gestionar las tareas programadas
 */
const express = require('express');
const router = express.Router();

// GET /api/scheduler/status
router.get('/status', async (req, res) => {
  try {
    const core = req.app.get('CFOAICore');
    
    res.json({
      success: true,
      running: core ? true : false,
      timestamp: new Date().toISOString(),
      message: 'CFO AI Core v2.0',
      tareas: [
        { agente: '💰 Caja', frecuencia: 'Cada hora 7AM-6PM, 6AM proyección' },
        { agente: '📊 Análisis', frecuencia: '5AM diario, Lun 5AM, Día 1 6AM' },
        { agente: '📋 Cobranza', frecuencia: 'Cada hora 7AM-6PM, 6AM, Lun 5:30AM' },
        { agente: '📅 Contabilidad', frecuencia: '5AM diario, Vie 6PM, Día 1 4AM' },
        { agente: '🤖 CFO AI Core', frecuencia: 'Briefing 7:00 AM diario' }
      ]
    });
  } catch (error) {
    console.error('[Routes/Scheduler] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/scheduler/trigger
// Ejecutar una tarea manualmente
router.post('/trigger', async (req, res) => {
  try {
    const { agente, tarea } = req.body;
    
    if (!agente || !tarea) {
      return res.status(400).json({ error: 'Se requiere agente y tarea' });
    }

    const core = req.app.get('CFOAICore');
    
    if (!core) {
      return res.status(503).json({ error: 'CFO AI Core no inicializado' });
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
    console.error('[Routes/Scheduler] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
