/**
 * Service for logging agent activities
 * Centralizes the logging of agent actions to the database
 */

const db = require('../../database/connection');

/**
 * Log an agent activity to the database
 * @param {Object} params - Activity parameters
 * @param {string} params.agente_nombre - Name of the agent
 * @param {string} params.agente_tipo - Type of agent (auditor, analista, etc.)
 * @param {string} params.agente_version - Version of the agent
 * @param {string} params.categoria - Category of activity (alerta_detectada, analisis_ejecutado, etc.)
 * @param {string} params.descripcion - Description of the activity
 * @param {string} params.detalles_json - JSON string with additional details
 * @param {number} params.impacto_valor - Numeric impact value
 * @param {string} params.impacto_moneda - Currency of impact (GTQ, USD, etc.)
 * @param {string} params.resultado_status - Status (exitoso, error, advertencia)
 * @param {number} params.duracion_ms - Duration in milliseconds
 * @returns {Promise} - Result of the insert
 */
async function logAgentActivity(params) {
  const {
    agente_nombre,
    agente_tipo,
    agente_version = '1.0.0',
    categoria,
    descripcion,
    detalles_json = null,
    entidad_tipo = null,
    entidad_id = null,
    impacto_valor = null,
    impacto_moneda = 'GTQ',
    resultado_status = 'exitoso',
    duracion_ms = null,
    empresa_id = 1
  } = params;

  try {
    const result = await db.runAsync(`
      INSERT INTO agentes_logs 
      (empresa_id, agente_nombre, agente_tipo, agente_version, categoria, descripcion, 
       detalles_json, entidad_tipo, entidad_id, impacto_valor, impacto_moneda, resultado_status, duracion_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      empresa_id,
      agente_nombre,
      agente_tipo,
      agente_version,
      categoria,
      descripcion,
      detalles_json,
      entidad_tipo,
      entidad_id,
      impacto_valor,
      impacto_moneda,
      resultado_status,
      duracion_ms
    ]);

    console.log(`[AgentLogger] Log registrado: ${agente_nombre} - ${categoria}`);
    return { success: true, logId: result.id };
  } catch (error) {
    console.error('[AgentLogger] Error registrando log:', error);
    // No lanzar error para no interrumpir el flujo del agente
    return { success: false, error: error.message };
  }
}

/**
 * Get recent logs with optional filtering
 * @param {Object} filters - Filter parameters
 * @param {number} filters.limit - Maximum number of logs to return
 * @param {string} filters.agente_tipo - Filter by agent type
 * @param {string} filters.categoria - Filter by category
 * @param {number} filters.dias - Number of days to look back
 * @returns {Promise} - Array of logs
 */
async function getRecentLogs(filters = {}) {
  const {
    limit = 50,
    agente_tipo = null,
    categoria = null,
    dias = 7
  } = filters;

  let query = `
    SELECT * FROM agentes_logs 
    WHERE created_at >= datetime('now', '-${dias} days')
  `;
  const params = [];

  if (agente_tipo) {
    query += ` AND agente_tipo = ?`;
    params.push(agente_tipo);
  }

  if (categoria) {
    query += ` AND categoria = ?`;
    params.push(categoria);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  try {
    const logs = await db.allAsync(query, params);
    return logs.map(log => ({
      ...log,
      detalles: log.detalles_json ? JSON.parse(log.detalles_json) : null
    }));
  } catch (error) {
    console.error('[AgentLogger] Error obteniendo logs:', error);
    return [];
  }
}

/**
 * Get statistics for agent activities
 * @param {number} dias - Number of days to analyze
 * @returns {Promise} - Statistics object
 */
async function getStats(dias = 7) {
  try {
    const stats = await db.getAsync(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT agente_tipo) as agentes_activos,
        SUM(CASE WHEN resultado_status = 'exitoso' THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN resultado_status = 'error' THEN 1 ELSE 0 END) as errores,
        SUM(CASE WHEN resultado_status = 'advertencia' THEN 1 ELSE 0 END) as advertencias,
        AVG(duracion_ms) as duracion_promedio_ms
      FROM agentes_logs
      WHERE created_at >= datetime('now', '-${dias} days')
    `);

    const porCategoria = await db.allAsync(`
      SELECT categoria, COUNT(*) as count
      FROM agentes_logs
      WHERE created_at >= datetime('now', '-${dias} days')
      GROUP BY categoria
      ORDER BY count DESC
    `);

    const porAgente = await db.allAsync(`
      SELECT agente_tipo, agente_nombre, COUNT(*) as count
      FROM agentes_logs
      WHERE created_at >= datetime('now', '-${dias} days')
      GROUP BY agente_tipo, agente_nombre
      ORDER BY count DESC
    `);

    return {
      ...stats,
      por_categoria: porCategoria,
      por_agente: porAgente
    };
  } catch (error) {
    console.error('[AgentLogger] Error obteniendo estadísticas:', error);
    return {
      total: 0,
      agentes_activos: 0,
      exitosos: 0,
      errores: 0,
      advertencias: 0,
      por_categoria: [],
      por_agente: []
    };
  }
}

module.exports = {
  logAgentActivity,
  getRecentLogs,
  getStats
};