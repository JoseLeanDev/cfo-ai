#!/usr/bin/env node
/**
 * Cron Script: Conciliador IA
 * Frecuencia: Cada hora
 * Tarea: Analizar conciliaciones pendientes con IA
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const ConciliadorAgentIA = require('../agents/ConciliadorAgentIA');
const db = require('../database/connection');

async function main() {
  console.log('🏦 [Conciliador IA] Analizando conciliaciones pendientes...');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    const resultado = await ConciliadorAgentIA.analizarConciliacionesPendientes();
    console.log('✅ [Conciliador IA] Tarea completada exitosamente');
    console.log('💰 Resultado:', JSON.stringify(resultado, null, 2));
    
    // Cerrar conexión a BD
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ [Conciliador IA] Error:', error.message);
    console.error(error.stack);
    
    try {
      await new Promise((resolve) => db.close(() => resolve()));
    } catch (e) {}
    
    process.exit(1);
  }
}

main();
