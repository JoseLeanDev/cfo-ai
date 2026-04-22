const express = require('express');
const router = express.Router();
const { logAgentActivity } = require('../services/agentLogger');

/**
 * POST /api/test/log - Crear un log de prueba para verificar que funciona
 */
router.post('/log', async (req, res) => {
  try {
    const result = await logAgentActivity({
      agente_nombre: 'Test Manual',
      agente_tipo: 'test',
      agente_version: '1.0.0',
      categoria: 'briefing_diario',
      descripcion: 'Log de prueba manual desde endpoint de test',
      resultado_status: 'exitoso',
      duracion_ms: 100,
      detalles_json: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
    });
    
    res.json({
      status: 'success',
      message: 'Log de prueba creado',
      result
    });
  } catch (error) {
    console.error('[Test Log] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

/**
 * GET /api/test/logs - Verificar tabla de logs
 */
router.get('/logs', async (req, res) => {
  try {
    const db = req.app.get('db');
    
    // Verificar si la tabla existe
    let tableExists;
    if (process.env.DATABASE_URL) {
      // PostgreSQL
      const result = await db.pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'agentes_logs'
        )
      `);
      tableExists = result.rows[0].exists;
    } else {
      // SQLite
      const result = await db.getAsync(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='agentes_logs'
      `);
      tableExists = !!result;
    }
    
    if (!tableExists) {
      return res.status(500).json({
        status: 'error',
        message: 'La tabla agentes_logs NO EXISTE'
      });
    }
    
    // Contar logs
    const count = await db.getAsync('SELECT COUNT(*) as total FROM agentes_logs');
    const recent = await db.allAsync('SELECT * FROM agentes_logs ORDER BY created_at DESC LIMIT 5');
    
    res.json({
      status: 'success',
      tabla_existe: true,
      total_logs: count?.total || count?.count || 0,
      recent_logs: recent
    });
  } catch (error) {
    console.error('[Test Logs] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
