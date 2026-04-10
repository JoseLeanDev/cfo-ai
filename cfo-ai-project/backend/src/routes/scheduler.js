/**
 * Routes para Scheduler
 * Endpoints para gestionar las tareas programadas
 */
const express = require('express');
const router = express.Router();

// GET /api/scheduler/status
router.get('/status', async (req, res) => {
  try {
    const orchestrator = req.app.get('agentsOrchestrator');
    
    res.json({
      success: true,
      running: orchestrator ? orchestrator.isRunning : false,
      timestamp: new Date().toISOString(),
      message: 'Sistema de agentes programados',
      tareas: [
        { agente: 'Auditor', frecuencia: '45min, 06:00, Lun 08:00, Día 1/5' },
        { agente: 'Analista', frecuencia: '07:00/18:00, Vie 17:00, Día 1, Trimestral' },
        { agente: 'Conciliador', frecuencia: '08:00, Día 1 06:00, Día 3 09:00' },
        { agente: 'Maintenance', frecuencia: '02:00, Dom 03:00, Día 15 04:00' }
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

    const orchestrator = req.app.get('agentsOrchestrator');
    
    if (!orchestrator) {
      return res.status(503).json({ error: 'Sistema de agentes no inicializado' });
    }

    const result = await orchestrator.ejecutarTarea(agente, tarea);

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

// GET /api/scheduler/logs
router.get('/logs', async (req, res) => {
  try {
    const db = req.app.get('db');
    const dias = parseInt(req.query.dias) || 7;
    
    const logs = await db.allAsync(`
      SELECT * FROM agentes_logs 
      WHERE created_at >= datetime('now', '-${dias} days')
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    
    res.json({
      success: true,
      count: logs.length,
      logs: logs.map(log => ({
        ...log,
        detalles: log.detalles_json ? JSON.parse(log.detalles_json) : null
      }))
    });
  } catch (error) {
    console.error('[Routes/Scheduler] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
