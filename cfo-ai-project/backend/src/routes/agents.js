/**
 * Agents Routes - API endpoints para el sistema multi-agente
 */
const express = require('express');
const router = express.Router();

// GET /api/agents/status - Estado del sistema de agentes programados
router.get('/status', async (req, res) => {
  try {
    const orchestrator = req.app.get('agentsOrchestrator');
    
    if (!orchestrator) {
      return res.json({
        success: true,
        isRunning: false,
        message: 'Agentes no inicializados aún'
      });
    }
    
    const status = await orchestrator.getStatus();
    
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

    const orchestrator = req.app.get('agentsOrchestrator');
    
    if (!orchestrator) {
      return res.status(503).json({
        error: 'Sistema de agentes no inicializado'
      });
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
        agente_nombre as agenteNombre,
        agente_tipo as agenteTipo,
        agente_version as agenteVersion,
        categoria,
        descripcion,
        detalles_json as detallesJson,
        entidad_tipo as entidadTipo,
        entidad_id as entidadId,
        impacto_valor as impactoValor,
        impacto_moneda as impactoMoneda,
        resultado_status as resultadoStatus,
        created_at as fecha,
        duracion_ms as duracionMs
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
    
    // Parsear detalles_json
    const logsParsed = logs.map(log => ({
      ...log,
      detalles: log.detallesJson ? JSON.parse(log.detallesJson) : null
    }));
    
    // Obtener estadísticas
    const statsQuery = isPostgres
      ? `SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT agente_tipo) as agentesActivos,
          SUM(CASE WHEN resultado_status = 'exitoso' THEN 1 ELSE 0 END) as exitosos,
          SUM(CASE WHEN resultado_status = 'error' THEN 1 ELSE 0 END) as errores,
          SUM(CASE WHEN resultado_status = 'advertencia' THEN 1 ELSE 0 END) as advertencias
        FROM agentes_logs
        WHERE empresa_id = ? 
          AND created_at >= NOW() - INTERVAL '${dias} days'`
      : `SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT agente_tipo) as agentesActivos,
          SUM(CASE WHEN resultado_status = 'exitoso' THEN 1 ELSE 0 END) as exitosos,
          SUM(CASE WHEN resultado_status = 'error' THEN 1 ELSE 0 END) as errores,
          SUM(CASE WHEN resultado_status = 'advertencia' THEN 1 ELSE 0 END) as advertencias
        FROM agentes_logs
        WHERE empresa_id = ? 
          AND created_at >= datetime('now', '-${dias} days')`;
    
    const stats = await db.getAsync(statsQuery, [empresaId]);
    
    // Agrupar por categoría
    const porCategoriaQuery = isPostgres
      ? `SELECT 
          categoria,
          COUNT(*) as count
        FROM agentes_logs
        WHERE empresa_id = ? 
          AND created_at >= NOW() - INTERVAL '${dias} days'
        GROUP BY categoria
        ORDER BY count DESC`
      : `SELECT 
          categoria,
          COUNT(*) as count
        FROM agentes_logs
        WHERE empresa_id = ? 
          AND created_at >= datetime('now', '-${dias} days')
        GROUP BY categoria
        ORDER BY count DESC`;
    
    const porCategoria = await db.allAsync(porCategoriaQuery, [empresaId]);
    
    // Agrupar por agente
    const porAgenteQuery = isPostgres
      ? `SELECT 
          agente_tipo as agente,
          agente_nombre as nombre,
          COUNT(*) as count
        FROM agentes_logs
        WHERE empresa_id = ? 
          AND created_at >= NOW() - INTERVAL '${dias} days'
        GROUP BY agente_tipo, agente_nombre
        ORDER BY count DESC`
      : `SELECT 
          agente_tipo as agente,
          agente_nombre as nombre,
          COUNT(*) as count
        FROM agentes_logs
        WHERE empresa_id = ? 
          AND created_at >= datetime('now', '-${dias} days')
        GROUP BY agente_tipo, agente_nombre
        ORDER BY count DESC`;
    
    const porAgente = await db.allAsync(porAgenteQuery, [empresaId]);
    
    // Agrupar por status
    const porStatusQuery = isPostgres
      ? `SELECT 
          resultado_status as status,
          COUNT(*) as count
        FROM agentes_logs
        WHERE empresa_id = ? 
          AND created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '${dias} days'
        GROUP BY resultado_status
        ORDER BY count DESC`
      : `SELECT 
          resultado_status as status,
          COUNT(*) as count
        FROM agentes_logs
        WHERE empresa_id = ? 
          AND created_at >= datetime('now', '-${dias} days')
        GROUP BY resultado_status
        ORDER BY count DESC`;
    
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
          agentesActivos: stats?.agentesActivos || 0,
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
    console.error('[GET /api/agents/logs] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener logs de agentes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
// ENDPOINTS PARA TAREAS PROGRAMADAS (SCHEDULER)
// ============================================

// POST /api/agents/auditor
router.post('/auditor', async (req, res) => {
  try {
    const { empresa_id, task, params = {} } = req.body;
    
    if (!empresa_id || !task) {
      return res.status(400).json({ error: 'Se requiere empresa_id y task' });
    }

    const db = req.app.get('db');
    const result = await auditorAgent.process(
      { task, empresa_id, params },
      { db }
    );

    res.json(result);
  } catch (error) {
    console.error('[POST /api/agents/auditor] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agents/analista
router.post('/analista', async (req, res) => {
  try {
    const { empresa_id, task, params = {} } = req.body;
    
    if (!empresa_id || !task) {
      return res.status(400).json({ error: 'Se requiere empresa_id y task' });
    }

    const db = req.app.get('db');
    const result = await analistaAgent.process(
      { task, empresa_id, params },
      { db }
    );

    res.json(result);
  } catch (error) {
    console.error('[POST /api/agents/analista] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agents/ia/status
 * Obtiene el estado actual de los agentes de IA
 */
router.get('/ia/status', async (req, res) => {
  try {
    const orchestrator = req.app.get('agentsOrchestratorIA');
    
    if (!orchestrator) {
      return res.json({
        success: true,
        estado: 'no_inicializado',
        mensaje: 'Agentes de IA no iniciados',
        agentes: [],
        timestamp: new Date().toISOString()
      });
    }
    
    const estado = orchestrator.getEstado();
    
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

    const orchestrator = req.app.get('agentsOrchestratorIA');
    
    if (!orchestrator) {
      return res.status(503).json({
        success: false,
        error: 'Sistema de agentes de IA no inicializado'
      });
    }

    const resultado = await orchestrator.ejecutarTarea(agente, tarea);
    
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
