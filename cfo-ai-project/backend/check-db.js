const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getTables() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('=== TABLES ===');
    res.rows.forEach(r => console.log('  ' + r.table_name));
  } finally {
    client.release();
  }
}

async function getColumns(table) {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public' 
      ORDER BY ordinal_position`, [table]);
    console.log('\n=== ' + table.toUpperCase() + ' COLUMNS ===');
    res.rows.forEach(r => console.log('  ' + r.column_name + ': ' + r.data_type + (r.is_nullable === 'NO' ? ' (NOT NULL)' : '')));
  } finally {
    client.release();
  }
}

async function main() {
  await getTables();
  await getColumns('cuentas_cobrar');
  await getColumns('cuentas_pagar');
  await getColumns('transacciones');
  await getColumns('obligaciones_sat');
  await pool.end();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
