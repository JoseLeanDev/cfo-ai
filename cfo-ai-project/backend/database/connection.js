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
 * IMPORTANTE: NO convertir = 0 o = 1 globalmente - eso rompe CASE statements
 */
function sqliteToPostgres(sql) {
  let result = sql
    // 0. INSERT OR REPLACE → INSERT ... ON CONFLICT (solo si tiene PRIMARY KEY o UNIQUE)
    // Nota: Esto es simplificado - asume que la primera columna es la clave
    .replace(/INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)/gi, (match, table) => {
      return `INSERT INTO ${table}`;
    })
    // 0b. INSERT OR IGNORE → INSERT ... ON CONFLICT DO NOTHING
    .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO')
    // 1. datetime('now') → NOW()
    .replace(/datetime\s*\(\s*['"]now['"]\s*\)/gi, 'NOW()')
    // 1b. datetime('now', 'localtime') → NOW() (same)
    .replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]localtime['"]\s*\)/gi, 'NOW()')
    // 2. date('now') → CURRENT_DATE  
    .replace(/date\s*\(\s*['"]now['"]\s*\)/gi, 'CURRENT_DATE')
    // 2b. date('now', 'start of month') → DATE_TRUNC('month', CURRENT_DATE)
    .replace(/date\s*\(\s*['"]now['"]\s*,\s*['"]start of month['"]\s*\)/gi, "DATE_TRUNC('month', CURRENT_DATE)")
    // 2c. date('now', 'start of year') → DATE_TRUNC('year', CURRENT_DATE)
    .replace(/date\s*\(\s*['"]now['"]\s*,\s*['"]start of year['"]\s*\)/gi, "DATE_TRUNC('year', CURRENT_DATE)")
    // 2d. date('now', 'weekday 0') → proximo domingo... skip por ahora, raro
    // 3. date('now', '-X days') → CURRENT_DATE - INTERVAL 'X days'
    .replace(/date\s*\(\s*['"]now['"]\s*,\s*['"]([+-]?)(\d+)\s+days?['"]\s*\)/gi, (match, sign, days) => {
      const operator = sign === '+' ? '+' : '-';
      return `CURRENT_DATE ${operator} INTERVAL '${days} days'`;
    })
    // 3a. date('now', '-X months') → CURRENT_DATE - INTERVAL 'X months'
    .replace(/date\s*\(\s*['"]now['"]\s*,\s*['"]([+-]?)(\d+)\s+months?['"]\s*\)/gi, (match, sign, months) => {
      const operator = sign === '+' ? '+' : '-';
      return `CURRENT_DATE ${operator} INTERVAL '${months} months'`;
    })
    // 3b. date('now', '-X years') → CURRENT_DATE - INTERVAL 'X years'
    .replace(/date\s*\(\s*['"]now['"]\s*,\s*['"]([+-]?)(\d+)\s+years?['"]\s*\)/gi, (match, sign, years) => {
      const operator = sign === '+' ? '+' : '-';
      return `CURRENT_DATE ${operator} INTERVAL '${years} years'`;
    })
    // 3c. date(?, '+X days') → ?::date + INTERVAL 'X days'
    .replace(/date\s*\(\s*\?\s*,\s*['"]([+-]?)(\d+)\s+days?['"]\s*\)/gi, (match, sign, days) => {
      const operator = sign === '+' ? '+' : '-';
      return `?::date ${operator} INTERVAL '${days} days'`;
    })
    // 4. datetime('now', '-X days') → NOW() - INTERVAL 'X days'
    .replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]([+-]?)(\d+)\s+days?['"]\s*\)/gi, (match, sign, days) => {
      const operator = sign === '+' ? '+' : '-';
      return `NOW() ${operator} INTERVAL '${days} days'`;
    })
    // 4a. datetime('now', '-X months') → NOW() - INTERVAL 'X months'
    .replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]([+-]?)(\d+)\s+months?['"]\s*\)/gi, (match, sign, months) => {
      const operator = sign === '+' ? '+' : '-';
      return `NOW() ${operator} INTERVAL '${months} months'`;
    })
    // 4b. datetime('now', '-X hours') → NOW() - INTERVAL 'X hours'
    .replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]-\$(\{[^}]+\})\s+hours?['"]\s*\)/gi, "NOW() - INTERVAL '$1 hours'")
    // 4c. datetime('now', '-X days') literal con variable
    .replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]-\$(\{[^}]+\})\s+days?['"]\s*\)/gi, "NOW() - INTERVAL '$1 days'")
    // 4d. datetime('now', '-${dias} days') → NOW() - INTERVAL '${dias} days' (para template literals)
    .replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]-\$(\{[^}]+\})\s+days?['"]\s*\)/gi, "NOW() - INTERVAL '$1 days'")
    // 5. strftime('%Y-%m', ...) → TO_CHAR(...::timestamp, 'YYYY-MM')
    .replace(/strftime\s*\(\s*['"]%Y-%m['"]\s*,\s*([^)]+)\)/gi, "TO_CHAR($1::timestamp, 'YYYY-MM')")
    // 5b. strftime('%Y', ...) → TO_CHAR(...::timestamp, 'YYYY')
    .replace(/strftime\s*\(\s*['"]%Y['"]\s*,\s*([^)]+)\)/gi, "TO_CHAR($1::timestamp, 'YYYY')")
    // 5c. strftime('%m', ...) → TO_CHAR(...::timestamp, 'MM')
    .replace(/strftime\s*\(\s*['"]%m['"]\s*,\s*([^)]+)\)/gi, "TO_CHAR($1::timestamp, 'MM')")
    // 5d. strftime('%d', ...) → TO_CHAR(...::timestamp, 'DD')
    .replace(/strftime\s*\(\s*['"]%d['"]\s*,\s*([^)]+)\)/gi, "TO_CHAR($1::timestamp, 'DD')")
    // 5e. strftime('%w', ...) → EXTRACT(DOW FROM ...)
    .replace(/strftime\s*\(\s*['"]%w['"]\s*,\s*([^)]+)\)/gi, "EXTRACT(DOW FROM $1::timestamp)")
    // 5f. strftime('%Y-%m-%d', ...) → TO_CHAR(...::timestamp, 'YYYY-MM-DD')
    .replace(/strftime\s*\(\s*['"]%Y-%m-%d['"]\s*,\s*([^)]+)\)/gi, "TO_CHAR($1::timestamp, 'YYYY-MM-DD')")
    // 6c. julianday('now') → CURRENT_DATE (ESPECÍFICO PRIMERO)
    .replace(/julianday\s*\(\s*['"]now['"]\s*\)/gi, 'CURRENT_DATE')
    // 6. julianday(a) - julianday(b) → EXTRACT(DAY FROM (a - b))
    .replace(/julianday\s*\(([^)]+)\)\s*-\s*julianday\s*\(([^)]+)\)/gi, 'EXTRACT(DAY FROM ($1 - $2))')
    // 6b. julianday(cualquier_otro) → ::date (GENÉRICO AL FINAL)
    .replace(/julianday\s*\(([^)]+)\)/gi, '$1::date')
    // 7. MAX(0, ...) → GREATEST(0, ...) (solo cuando MAX tiene 2 args)
    .replace(/MAX\s*\(\s*0\s*,\s*/gi, 'GREATEST(0, ')
    // 8. != 'string' → <> 'string' (solo para strings)
    .replace(/!=\s*('[^']*')/g, '<> $1')
    // 9. CAST(strftime('%w', ...) AS INTEGER) → CAST(EXTRACT(DOW FROM ...::timestamp) AS INTEGER)
    .replace(/CAST\s*\(\s*strftime\s*\(\s*['"]%w['"]\s*,\s*([^)]+)\)\s*AS\s*INTEGER\s*\)/gi, "CAST(EXTRACT(DOW FROM $1::timestamp) AS INTEGER)")
    // 10. total_changes() → 0 (no equivalent in PostgreSQL, usually not critical)
    .replace(/total_changes\s*\(\s*\)/gi, '0')
    // 11. changes() → 0
    .replace(/changes\s*\(\s*\)/gi, '0')
    // 12. last_insert_rowid() → lastval()
    .replace(/last_insert_rowid\s*\(\s*\)/gi, 'lastval()')
    // 13. IFNULL → COALESCE
    .replace(/IFNULL\s*\(/gi, 'COALESCE(')
    // 14. random() → random() (same in PG but different behavior, usually OK)
    // 15. ABS(...) → ABS(...) (same in PG)
    // 16. ROUND(...) → ROUND(...) (same in PG)
    ;
  
  // 20. Convertir ? → $1, $2, etc. (contar ocurrencias)
  let paramCount = 0;
  result = result.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });
  
  return result;
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
