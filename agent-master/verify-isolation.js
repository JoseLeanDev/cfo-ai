const { Pool } = require('pg');

async function verify() {
  console.log('🔍 Verifying database isolation...\n');

  // Main app DB
  const mainPool = new Pool({
    connectionString: 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db',
    ssl: { rejectUnauthorized: false }
  });

  // Lavanderia DB
  const lavPool = new Pool({
    connectionString: 'postgresql://abaco_lavanderia_db_user:dWBeRxNVO3AuY9uBd0Bllmywz3BD4Wp7@dpg-d8gr7meq1p3s73andg20-a.oregon-postgres.render.com:5432/abaco_lavanderia_db',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const mainTables = await mainPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log(`✅ Main App DB (cfo_ai_db @ Ohio):`);
    console.log(`   Tables: ${mainTables.rows.length}`);
    console.log(`   Sample: ${mainTables.rows.slice(0,5).map(r => r.table_name).join(', ')}...\n`);

    const lavTables = await lavPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log(`✅ Lavanderia DB (abaco_lavanderia_db @ Oregon):`);
    console.log(`   Tables: ${lavTables.rows.length}`);
    console.log(`   Sample: ${lavTables.rows.slice(0,5).map(r => r.table_name).join(', ')}...\n`);

    if (mainTables.rows.length === lavTables.rows.length) {
      console.log('⚠️  WARNING: Both DBs have same table count - possible schema clone');
    } else {
      console.log('✅ Different table counts - confirmed separate databases');
    }

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await mainPool.end();
    await lavPool.end();
  }
}

verify();
