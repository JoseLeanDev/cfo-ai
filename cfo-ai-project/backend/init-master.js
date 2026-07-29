const fs = require('fs');
const { Pool } = require('pg');

const MASTER_DB_URL = 'postgresql://abaco_master_user:cFo4C7ymFAuZwOyUmqvzKB0cfAFT7Cm3@dpg-d9hu97vabvsc73a3ohag-a.ohio-postgres.render.com:5432/abaco_master';

const pool = new Pool({
  connectionString: MASTER_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function init() {
  console.log('🔧 Updating Agent Master Database Schema...\n');
  const schema = fs.readFileSync('./schema-master.sql', 'utf-8');
  const statements = schema
    .split(/;\s*(?=CREATE|INSERT|DROP|DO)/i)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.endsWith(';') ? s : s + ';');

  const client = await pool.connect();
  try {
    for (const stmt of statements) {
      if (stmt.trim().startsWith('--') || stmt.trim().length === 0) continue;
      try {
        await client.query(stmt);
        const firstLine = stmt.split('\n')[0].trim().substring(0, 60);
        console.log(`✅ ${firstLine}...`);
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate key')) {
          console.log(`⚠️  ${e.message.split('\n')[0]}`);
        } else {
          console.error(`❌ ${e.message}`);
        }
      }
    }
    console.log('\n✅ Schema updated successfully');
  } finally {
    client.release();
  }
  await pool.end();
}

init().catch(err => {
  console.error('💥 Failed:', err);
  process.exit(1);
});
