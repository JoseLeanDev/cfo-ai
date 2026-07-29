const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://mission_control_e9jm_user:9tS9C1zvj9vOIxL1Yw8pkgCIuHmfcqYW@dpg-d9hudajeo5us73dmtr70-a.ohio-postgres.render.com:5432/mission_control_e9jm',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'mc_tasks' 
    ORDER BY ordinal_position
  `);
  console.log('=== mc_tasks columns ===');
  res.rows.forEach(r => console.log(r.column_name, ':', r.data_type));
  
  const hasProjectId = res.rows.some(r => r.column_name === 'project_id');
  console.log('\nHas project_id:', hasProjectId);
  
  await pool.end();
}
check();
