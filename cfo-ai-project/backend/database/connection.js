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
  // Procesar en orden específico para evitar conflictos
  let result = sql;
  
  // 1. Guardar protecciones: marcar expresiones que NO deben modificarse
  const protectedExprs = [];
  
  // Proteger COALESCE(x, 0) y COALESCE(x, 1) - mantener los números como números
  result = result.replace(/COALESCE\s*\(\s*([^,]+)\s*,\s*(\d+)\s*\)/gi, (match, col, num) => {
    const id = protectedExprs.length;
    protectedExprs.push(`COALESCE(${col}, ${num})`);
    return `__PROTECTED_${id}__`;
  });
  
  // Proteger CASE WHEN ... = 0/1 THEN dentro de expresiones CASE
  result = result.replace(/(CASE\s+WHEN\s+[^=]+)=\(0|1)\b(\s+THEN)/gi, (match, prefix, num, suffix) => {
    const id = protectedExprs.length;
    protectedExprs.push(`${prefix}=${num}${suffix}`);
    return `__PROTECTED_${id}__`;
  });
  
  // 2. Aplicar conversiones SQLite → PostgreSQL
  
  // Booleanos: = 1 → = TRUE, = 0 → = FALSE (SOLO para columnas booleanas, no para números)
  // Solo reemplazar cuando está comparando columnas booleanas conocidas
  result = result.replace(/(\s+activa\s*=\s*)1\b/gi, '$1TRUE');
  result = result.replace(/(\s+activa\s*=\s*)0\b/gi, '$1FALSE');
  result = result.replace(/(\s+resuelta\s*=\s*)1\b/gi, '$1TRUE');
  result = result.replace(/(\s+resuelta\s*=\s*)0\b/gi, '$1FALSE');
  result = result.replace(/(\s+dismissed\s*=\s*)1\b/gi, '$1TRUE');
  result = result.replace(/(\s+dismissed\s*=\s*)0\b/gi, '$1FALSE');
  
  // datetime('now') → NOW()
  result = result.replace(/datetime\s*\(\s*['"]now['"]\s*\)/gi, 'NOW()');
  
  // date('now') → CURRENT_DATE
  result = result.replace(/date\s*\(\s*['"]now['"]\s*\)/gi, 'CURRENT_DATE');
  
  // date('now', '-X days') → CURRENT_DATE - INTERVAL 'X days'
  result = result.replace(/date\s*\(\s*['"]now['"]\s*,\s*['"]([+-]\d+)\s+days?['"]\s*\)/gi, "CURRENT_DATE - INTERVAL '$1 days'");
  
  // datetime('now', '-X days') → NOW() - INTERVAL 'X days'
  result = result.replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]([+-]\d+)\s+days?['"]\s*\)/gi, "NOW() - INTERVAL '$1 days'");
  
  // strftime('%Y-%m', ...) → TO_CHAR(..., 'YYYY-MM')
  result = result.replace(/strftime\s*\(\s*['"]%Y-%m['"]\s*,\s*([^)]+)\)/gi, "TO_CHAR($1, 'YYYY-MM')");
  
  // ? → $1, $2, etc.
  let paramCount = 0;
  result = result.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });
  
  // 3. Restaurar expresiones protegidas
  protectedExprs.forEach((expr, id) => {
    result = result.replace(`__PROTECTED_${id}__`, expr);
  });
  
  return result;
}

module.exports = db;
