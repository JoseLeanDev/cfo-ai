/**
 * Script de setup para el Scheduler System
 * Crea directorios necesarios y configura el entorno
 */
const fs = require('fs').promises;
const path = require('path');

async function setup() {
  console.log('🔧 CFO AI Scheduler - Setup\n');

  const dirs = [
    path.join(__dirname, '../../logs'),
    path.join(__dirname, '../../logs/scheduler'),
    path.join(__dirname, '../../backups')
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Directorio creado: ${dir}`);
    } catch (error) {
      console.error(`❌ Error creando ${dir}:`, error.message);
    }
  }

  // Crear archivo de estado inicial
  const stateFile = path.join(__dirname, '../../logs/scheduler/state.json');
  try {
    await fs.writeFile(stateFile, JSON.stringify({
      lastExecutions: {},
      cycleCount: 0,
      version: '1.0.0'
    }, null, 2));
    console.log(`✅ Archivo de estado creado: ${stateFile}`);
  } catch (error) {
    console.error(`❌ Error creando estado:`, error.message);
  }

  console.log('\n✨ Setup completado!');
  console.log('\nPara iniciar el scheduler:');
  console.log('  npm run scheduler');
  console.log('\nO en modo desarrollo:');
  console.log('  npm run dev (incluye scheduler)');
}

setup().catch(console.error);
