const { Pool } = require('pg');

// PostgreSQL connection - Production only
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('✅ Conectado a base de datos PostgreSQL (Render)');

// Wrapper para compatibilidad con API de SQLite
const db = {
  runAsync: async (sql, params = []) => {
    // Convertir ? → $1, $2, etc.
    let paramCount = 0;
    const pgSql = sql.replace(/\?/g, () => {
      paramCount++;
      return `$${paramCount}`;
    });
    const client = await pool.connect();
    try {
      const result = await client.query(pgSql, params);
      return { id: result.rows[0]?.id || 0, changes: result.rowCount };
    } finally {
      client.release();
    }
  },

  getAsync: async (sql, params = []) => {
    let paramCount = 0;
    const pgSql = sql.replace(/\?/g, () => {
      paramCount++;
      return `$${paramCount}`;
    });
    const client = await pool.connect();
    try {
      const result = await client.query(pgSql, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  allAsync: async (sql, params = []) => {
    let paramCount = 0;
    const pgSql = sql.replace(/\?/g, () => {
      paramCount++;
      return `$${paramCount}`;
    });
    const client = await pool.connect();
    try {
      const result = await client.query(pgSql, params);
      return result.rows;
    } finally {
      client.release();
    }
  },

  pool
};

module.exports = db;
