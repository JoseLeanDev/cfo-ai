const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Detectar si estamos en producción (Render) o desarrollo
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let db;

if (isProduction && process.env.DATABASE_URL) {
  // PostgreSQL en Render
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necesario para Render
    }
  });

  console.log('✅ Conectado a base de datos PostgreSQL (Render)');

  // Wrapper para compatibilidad con SQLite
  db = {
    runAsync: async (sql, params = []) => {
      // Convertir sintaxis SQLite a PostgreSQL
      const pgSql = sqliteToPostgres(sql);
      const client = await pool.connect();
      try {
        const result = await client.query(pgSql, params);
        return { id: result.rows[0]?.id || 0, changes: result.rowCount };
      } finally {
        client.release();
      }
    },

    getAsync: async (sql, params = []) => {
      const pgSql = sqliteToPostgres(sql);
      const client = await pool.connect();
      try {
        const result = await client.query(pgSql, params);
        return result.rows[0] || null;
      } finally {
        client.release();
      }
    },

    allAsync: async (sql, params = []) => {
      const pgSql = sqliteToPostgres(sql);
      const client = await pool.connect();
      try {
        const result = await client.query(pgSql, params);
        return result.rows;
      } finally {
        client.release();
      }
    },

    // Pool para operaciones directas si es necesario
    pool
  };

} else {
  // SQLite para desarrollo local
  const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/cfo_ai.db');

  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error conectando a SQLite:', err.message);
    } else {
      console.log('✅ Conectado a base de datos SQLite');
      console.log(`📁 Ubicación: ${DB_PATH}`);
    }
  });

  // Promisify para usar async/await
  db.runAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  };

  db.getAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  db.allAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };
}

/**
 * Convierte sintaxis SQLite a PostgreSQL
 */
function sqliteToPostgres(sql) {
  return sql
    // Booleanos: = 1 → = TRUE, = 0 → = FALSE (para columnas booleanas)
    .replace(/\s*=\s*1(?![0-9])/g, ' = TRUE')
    .replace(/\s*=\s*0(?![0-9])/g, ' = FALSE')
    // datetime('now') → NOW()
    .replace(/datetime\s*\(\s*['"]now['"]\s*\)/gi, 'NOW()')
    // date('now') → CURRENT_DATE
    .replace(/date\s*\(\s*['"]now['"]\s*\)/gi, 'CURRENT_DATE')
    // date('now', '-X days') → CURRENT_DATE - INTERVAL 'X days'
    .replace(/date\s*\(\s*['"]now['"]\s*,\s*['"]([+-]\d+)\s+days?['"]\s*\)/gi, "CURRENT_DATE - INTERVAL '$1 days'")
    // datetime('now', '-X days') → NOW() - INTERVAL 'X days'
    .replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]([+-]\d+)\s+days?['"]\s*\)/gi, "NOW() - INTERVAL '$1 days'")
    // strftime('%Y-%m', ...) → TO_CHAR(..., 'YYYY-MM')
    .replace(/strftime\s*\(\s*['"]%Y-%m['"]\s*,\s*([^)]+)\)/gi, "TO_CHAR($1, 'YYYY-MM')")
    // ? → $1, $2, etc.
    .replace(/\?/g, (match, offset, string) => {
      const count = (string.slice(0, offset).match(/\?/g) || []).length;
      return `$${count + 1}`;
    });
}

module.exports = db;
