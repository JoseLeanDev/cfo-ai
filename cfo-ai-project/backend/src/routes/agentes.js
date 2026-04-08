const express = require('express');
const router = express.Router();

/**
 * GET /api/agentes/logs
 * Obtiene el log de actividades de los agentes de IA
 */
router.get('/logs', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 'default';
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const agente = req.query.agente;
    const categoria = req.query.categoria;
    const status = req.query.status;
    const dias = parseInt(req.query.dias) || 7;
    
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
        AND created_at >= datetime('now', '-${dias} days')
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
    const stats = await db.getAsync(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT agente_tipo) as agentesActivos,
        SUM(CASE WHEN resultado_status = 'exito' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN resultado_status = 'error' THEN 1 ELSE 0 END) as errores,
        SUM(CASE WHEN resultado_status = 'advertencia' THEN 1 ELSE 0 END) as advertencias
      FROM agentes_logs
      WHERE empresa_id = ? 
        AND created_at >= datetime('now', '-${dias} days')
    `, [empresaId]);
    
    // Agrupar por categoría
    const porCategoria = await db.allAsync(`
      SELECT 
        categoria,
        COUNT(*) as count
      FROM agentes_logs
      WHERE empresa_id = ? 
        AND created_at >= datetime('now', '-${dias} days')
      GROUP BY categoria
      ORDER BY count DESC
    `, [empresaId]);
    
    // Agrupar por agente
    const porAgente = await db.allAsync(`
      SELECT 
        agente_tipo as agente,
        agente_nombre as nombre,
        COUNT(*) as count
      FROM agentes_logs
      WHERE empresa_id = ? 
        AND created_at >= datetime('now', '-${dias} days')
      GROUP BY agente_tipo, agente_nombre
      ORDER BY count DESC
    `, [empresaId]);
    
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
          porAgente
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
    console.error('[GET /api/agentes/logs] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener logs de agentes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/agentes/logs
 * Crear un nuevo log (usado internamente por los agentes)
 */
router.post('/logs', async (req, res) => {
  try {
    const db = req.app.get('db');
    const {
      empresa_id = 'default',
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
    console.error('[POST /api/agentes/logs] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al registrar log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
