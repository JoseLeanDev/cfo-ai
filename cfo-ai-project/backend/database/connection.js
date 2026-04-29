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
 * Convierte parámetros SQLite (?) a PostgreSQL ($1, $2...)
 * IMPORTANTE: El código ya debe ser PostgreSQL nativo. Solo convertimos placeholders.
 */
function sqliteToPostgres(sql) {
  // Solo convertir ? → $1, $2, etc.
  let paramCount = 0;
  return sql.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });
}

// Test del traductor en desarrollo
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_SQL) {
  const testQueries = [
    "SELECT strftime('%Y-%m', fecha) FROM t WHERE fecha >= date('now', '-6 months')",
    "UPDATE t SET dias = julianday('now') - julianday(fecha)",
    "INSERT OR REPLACE INTO t (a, b) VALUES (1, 2)",
    "SELECT * FROM t WHERE fecha >= datetime('now', '-1 day')"
  ];
  console.log('[DB Translator] Testing sqliteToPostgres...');
  testQueries.forEach(q => console.log('  ', q, '→', sqliteToPostgres(q)));
}

module.exports = db;
