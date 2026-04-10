/**
 * Ejecutar migración 007: Tablas para Agentes de IA
 */

const db = require('./database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration007() {
  console.log('🏗️  Ejecutando migración 007: Tablas para Agentes de IA...\n');

  try {
    // Leer archivo SQL
    const sqlPath = path.join(__dirname, 'database/migrations/007_agentes_ia_tablas.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Dividir en sentencias individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Ejecutando ${statements.length} sentencias...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await db.runAsync(stmt);
        process.stdout.write(`✅ Sentencia ${i + 1}/${statements.length}\r`);
      } catch (error) {
        // Ignorar errores de "table already exists" o "unique constraint"
        if (error.message.includes('already exists') || 
            error.message.includes('UNIQUE constraint')) {
          process.stdout.write(`ℹ️  Sentencia ${i + 1}/${statements.length} (ya existe)\r`);
        } else {
          console.error(`\n❌ Error en sentencia ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n\n✅ Migración 007 completada exitosamente');
    
    // Verificar tablas creadas
    const tables = await db.allAsync(`
      SELECT name FROM sqlite_master WHERE type='table' 
      AND name IN ('alertas_financieras', 'briefings_diarios', 'snapshots_diarios', 
                   'sugerencias_conciliacion', 'movimientos_bancarios', 'cuentas_bancarias')
    `);
    
    console.log('\n📊 Tablas creadas:');
    tables.forEach(t => console.log(`   • ${t.name}`));

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    process.exit(1);
  }
}

runMigration007().then(() => {
  console.log('\n🎉 Listo para usar Agentes de IA');
  process.exit(0);
});
