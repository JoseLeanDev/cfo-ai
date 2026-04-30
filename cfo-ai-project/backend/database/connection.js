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
 * IMPORTANTE: Esto permite escribir SQL compatible con SQLite que funcione en ambos motores.
 */
function sqliteToPostgres(sql) {
  let result = sql;

  // date('now', '+X days') → CURRENT_DATE + INTERVAL 'X days'
  result = result.replace(/date\('now',\s*'\+(\d+)\s*days'\)/g, "CURRENT_DATE + INTERVAL '$1 days'");
  // date('now', '-X days') → CURRENT_DATE - INTERVAL 'X days'
  result = result.replace(/date\('now',\s*'-(\d+)\s*days'\)/g, "CURRENT_DATE - INTERVAL '$1 days'");
  // date('now', '+X months') → CURRENT_DATE + INTERVAL 'X months'
  result = result.replace(/date\('now',\s*'\+(\d+)\s*months'\)/g, "CURRENT_DATE + INTERVAL '$1 months'");
  // date('now', '-X months') → CURRENT_DATE - INTERVAL 'X months'
  result = result.replace(/date\('now',\s*'-(\d+)\s*months'\)/g, "CURRENT_DATE - INTERVAL '$1 months'");
  // date('now', 'start of month') → DATE_TRUNC('month', CURRENT_DATE)
  result = result.replace(/date\('now',\s*'start of month'\)/g, "DATE_TRUNC('month', CURRENT_DATE)");
  // date('now') → CURRENT_DATE
  result = result.replace(/date\('now'\)/g, "CURRENT_DATE");

  // datetime('now') → NOW()
  result = result.replace(/datetime\('now'\)/g, "NOW()");
  // datetime('now', '-X days') → NOW() - INTERVAL 'X days'
  result = result.replace(/datetime\('now',\s*'-(\d+)\s*days'\)/g, "NOW() - INTERVAL '$1 days'");
  result = result.replace(/datetime\('now',\s*'-(\d+)\s*months'\)/g, "NOW() - INTERVAL '$1 months'");

  // strftime('%Y-%m', col) → TO_CHAR(col::timestamp, 'YYYY-MM')
  result = result.replace(/strftime\('%Y-%m',\s*([^)]+)\)/g, "TO_CHAR($1::timestamp, 'YYYY-MM')");
  result = result.replace(/strftime\('%Y',\s*([^)]+)\)/g, "EXTRACT(YEAR FROM $1::timestamp)");
  result = result.replace(/strftime\('%m',\s*([^)]+)\)/g, "EXTRACT(MONTH FROM $1::timestamp)");

  // julianday(a) - julianday(b) → (a::date - b::date)
  result = result.replace(/julianday\(([^)]+)\)\s*-\s*julianday\(([^)]+)\)/g, "($1::date - $2::date)");

  // MAX(0, x) → GREATEST(0, x)
  result = result.replace(/MAX\(0,\s*([^)]+)\)/g, "GREATEST(0, $1)");

  // IFNULL → COALESCE
  result = result.replace(/IFNULL\(/g, "COALESCE(");

  // INTERVAL SQLite: date(?, '+X days') → (?::date + INTERVAL 'X days')
  result = result.replace(/date\((\?),\s*'\+(\d+)\s*days'\)/g, "($1::date + INTERVAL '$2 days')");
  result = result.replace(/date\((\?),\s*'-(\d+)\s*days'\)/g, "($1::date - INTERVAL '$2 days')");

  // ? → $1, $2, etc.
  let paramCount = 0;
  result = result.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });

  return result;
}

module.exports = db;
