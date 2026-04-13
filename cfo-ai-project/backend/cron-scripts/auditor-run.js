#!/usr/bin/env node
/**
 * Cron Script: Auditor IA
 * Frecuencia: Cada 45 minutos
 * Tarea: Detectar anomalías con IA
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const AuditorAgentIA = require('../agents/AuditorAgentIA');
const db = require('../database/connection');

async function main() {
  console.log('🔍 [Auditor IA] Iniciando detección de anomalías...');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    const resultado = await AuditorAgentIA.detectarAnomaliasConIA();
    console.log('✅ [Auditor IA] Tarea completada exitosamente');
    console.log('📊 Resultado:', JSON.stringify(resultado, null, 2));
    
    // Cerrar conexión a BD
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ [Auditor IA] Error:', error.message);
    console.error(error.stack);
    
    // Intentar cerrar BD incluso si hay error
    try {
      await new Promise((resolve) => db.close(() => resolve()));
    } catch (e) {
      // Ignorar error al cerrar
    }
    
    process.exit(1);
  }
}

main();
