const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`🔄 Ejecutando ${file}...`);
    try {
      await db.runAsync(sql);
      console.log(`✅ ${file} completado`);
    } catch (err) {
      console.error(`❌ Error en ${file}:`, err.message);
      // Continuar con la siguiente migración
    }
  }
  
  console.log('🎉 Migraciones SQL completadas');
  
  db.close((err) => {
    if (err) console.error('Error cerrando BD:', err);
    process.exit(0);
  });
}

runMigrations();
