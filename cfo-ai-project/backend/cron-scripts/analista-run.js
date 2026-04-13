#!/usr/bin/env node
/**
 * Cron Script: Analista Financiero IA
 * Frecuencia: Cada 2 horas
 * Tarea: Generar snapshot diario con análisis IA
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const AnalistaFinancieroIA = require('../agents/AnalistaFinancieroIA');
const db = require('../database/connection');

async function main() {
  console.log('📊 [Analista Financiero IA] Generando snapshot diario...');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    const resultado = await AnalistaFinancieroIA.generarSnapshotDiario();
    console.log('✅ [Analista Financiero IA] Tarea completada exitosamente');
    console.log('📈 Resultado:', JSON.stringify(resultado, null, 2));
    
    // Cerrar conexión a BD
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ [Analista Financiero IA] Error:', error.message);
    console.error(error.stack);
    
    try {
      await new Promise((resolve) => db.close(() => resolve()));
    } catch (e) {}
    
    process.exit(1);
  }
}

main();
