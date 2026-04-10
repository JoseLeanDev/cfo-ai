/**
 * Script standalone para ejecutar el Scheduler
 * Uso: node src/scheduler/run.js
 */
const CFOScheduler = require('./CFOScheduler');

const scheduler = new CFOScheduler({
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  empresaId: process.env.EMPRESA_ID || 1
});

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          CFO AI - Scheduler Standalone                   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Iniciando sistema de tareas programadas...              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  await scheduler.init();
  scheduler.start();

  console.log('\n✅ Scheduler iniciado correctamente');
  console.log(`📋 Tareas programadas: ${scheduler.tasks.length}`);
  console.log('\nPresiona Ctrl+C para detener\n');
}

main().catch(error => {
  console.error('❌ Error iniciando scheduler:', error);
  process.exit(1);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n\n[CFOScheduler] Recibido SIGINT, deteniendo...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n[CFOScheduler] Recibido SIGTERM, deteniendo...');
  scheduler.stop();
  process.exit(0);
});
