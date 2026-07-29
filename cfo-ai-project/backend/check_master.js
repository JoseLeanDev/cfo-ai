const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: 'postgresql://abaco_master_user:cFo4C7ymFAuZwOyUmqvzKB0cfAFT7Cm3@dpg-d9hu97vabvsc73a3ohag-a.ohio-postgres.render.com:5432/abaco_master',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const res = await pool.query('SELECT current_database() as db, current_user as user');
  console.log('Base de datos:', res.rows[0].db);
  console.log('Usuario:', res.rows[0].user);
  
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('\nTablas:', tables.rows.map(r => r.table_name).join(', '));
  
  // Contar registros por tabla
  for (const t of tables.rows) {
    try {
      const c = await pool.query(`SELECT COUNT(*) as count FROM ${t.table_name}`);
      console.log(`  ${t.table_name}: ${c.rows[0].count} registros`);
    } catch(e) {
      console.log(`  ${t.table_name}: ERROR`);
    }
  }
  
  await pool.end();
}
check().catch(e => console.error('ERROR:', e.message));
