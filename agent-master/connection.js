require('dotenv').config();
const { Pool } = require('pg');

// ============================================
// MASTER DATABASE CONNECTION
// abaco-master on Render (Ohio)
const MASTER_DB_URL = process.env.MASTER_DATABASE_URL || 'postgresql://abaco_master_user:cFo4C7ymFAuZwOyUmqvzKB0cfAFT7Cm3@dpg-d9hu97vabvsc73a3ohag-a.ohio-postgres.render.com:5432/abaco_master';

const pool = new Pool({
  connectionString: MASTER_DB_URL,
  ssl: MASTER_DB_URL.includes('render.com') ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[MASTER DB] Unexpected error on idle client:', err.message);
});

// Parameter converter: ? → $1, $2 (SQLite-style to PostgreSQL)
function convertParams(sql) {
  let paramCount = 0;
  return sql.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });
}

const masterDb = {
  pool,

  // Raw query
  query: async (sql, params = []) => {
    const client = await pool.connect();
    try {
      const pgSql = convertParams(sql);
      const result = await client.query(pgSql, params);
      return result.rows;
    } finally {
      client.release();
    }
  },

  // Single row
  get: async (sql, params = []) => {
    const rows = await masterDb.query(sql, params);
    return rows[0] || null;
  },

  // Insert/update/delete
  run: async (sql, params = []) => {
    const client = await pool.connect();
    try {
      const pgSql = convertParams(sql);
      const result = await client.query(pgSql, params);
      return {
        id: result.rows[0]?.id || 0,
        changes: result.rowCount,
        lastID: result.rows[0]?.id || null
      };
    } finally {
      client.release();
    }
  },

  // ============================================
  // CLIENT MANAGEMENT
  // ============================================
  
  getAllClients: async (status = 'active') => {
    return masterDb.query(
      'SELECT * FROM clients WHERE status = ? ORDER BY priority ASC, name ASC',
      [status]
    );
  },

  getClientBySlug: async (slug) => {
    return masterDb.get('SELECT * FROM clients WHERE slug = ?', [slug]);
  },

  getClientById: async (id) => {
    return masterDb.get('SELECT * FROM clients WHERE id = ?', [id]);
  },

  createClient: async (data) => {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columns = fields.join(', ');
    
    const result = await masterDb.run(
      `INSERT INTO clients (${columns}) VALUES (${placeholders}) RETURNING id`,
      values
    );
    return result;
  },

  updateClient: async (id, data) => {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    
    return masterDb.run(
      `UPDATE clients SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1}`,
      [...values, id]
    );
  },

  // ============================================
  // SKILLS
  // ============================================

  getClientSkills: async (clientId) => {
    return masterDb.query(`
      SELECT s.*, cs.proficiency_level, cs.notes 
      FROM skills s
      JOIN client_skills cs ON s.id = cs.skill_id
      WHERE cs.client_id = ? AND s.is_active = true
      ORDER BY cs.proficiency_level DESC
    `, [clientId]);
  },

  // ============================================
  // CONTEXT LOGS
  // ============================================

  logContext: async (clientId, type, content, metadata = {}, title = null, importance = 'normal', projectId = null) => {
    return masterDb.run(
      `INSERT INTO context_logs (client_id, project_id, log_type, title, content, metadata, importance)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [clientId, projectId, type, title, content, JSON.stringify(metadata), importance]
    );
  },

  getContextLogs: async (clientId, limit = 50, types = null) => {
    let sql = 'SELECT * FROM context_logs WHERE client_id = ?';
    const params = [clientId];
    
    if (types && types.length > 0) {
      sql += ` AND log_type IN (${types.map((_, i) => `$${i + 2}`).join(',')})`;
      params.push(...types);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    return masterDb.query(sql, params);
  },

  // ============================================
  // HEALTH CHECK
  // ============================================

  healthCheck: async () => {
    try {
      const result = await masterDb.get('SELECT NOW() as time');
      return { ok: true, time: result.time };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
};

module.exports = masterDb;
