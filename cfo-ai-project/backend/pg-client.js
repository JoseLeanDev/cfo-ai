#!/usr/bin/env node
/**
 * PostgreSQL connection for CFO AI production database (Render)
 * Usage: node pg-client.js "SELECT * FROM cuentas_cobrar LIMIT 5"
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com/cfo_ai_db',
  ssl: { rejectUnauthorized: false }
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    client.release();
  }
}

async function main() {
  const sql = process.argv[2];
  if (!sql) {
    console.log('Usage: node pg-client.js "SELECT * FROM cuentas_cobrar LIMIT 5"');
    process.exit(1);
  }
  
  try {
    const rows = await query(sql);
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { query, pool };
