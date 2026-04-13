#!/usr/bin/env node
/**
 * Cron Script: Maintenance IA
 * Frecuencia: Cada 30 minutos
 * Tarea: Health check del sistema con análisis IA
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MaintenanceAgentIA = require('../agents/MaintenanceAgentIA');
const db = require('../database/connection');

async function main() {
  console.log('🔧 [Maintenance IA] Ejecutando health check del sistema...');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    const resultado = await MaintenanceAgentIA.healthCheckSistema();
    console.log('✅ [Maintenance IA] Tarea completada exitosamente');
    console.log('🏥 Health Score:', resultado.health_score);
    console.log('📋 Checks:', JSON.stringify(resultado.checks, null, 2));
    
    // Cerrar conexión a BD
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ [Maintenance IA] Error:', error.message);
    console.error(error.stack);
    
    try {
      await new Promise((resolve) => db.close(() => resolve()));
    } catch (e) {}
    
    process.exit(1);
  }
}

main();
