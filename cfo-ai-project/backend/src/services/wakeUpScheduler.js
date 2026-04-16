/**
 * Sistema de ejecución forzada de agentes al "despertar"
 * Cuando Render free tier despierta el servidor, ejecutamos las tareas pendientes
 */

const { orchestrator } = require('../agents/index');

// Última ejecución por agente (persistir en memoria simple)
const ultimaEjecucion = {};

/**
 * Ejecutar tareas pendientes de un agente específico
 * Se llama cuando el servidor "despierta" o recibe tráfico
 */
async function ejecutarTareasPendientesWakeUp(db) {
  const ahora = new Date();
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  
  console.log(`[WakeUp Scheduler] ⏰ Ejecutando tareas pendientes a las ${horaActual}:${minutoActual}`);
  
  const resultados = [];
  
  try {
    // === AUDITOR IA ===
    // Ejecutar cada 45 minutos o si nunca se ha ejecutado
    const lastAuditor = ultimaEjecucion['auditor_ia'] || 0;
    const minutosDesdeAuditor = (Date.now() - lastAuditor) / 1000 / 60;
    
    if (minutosDesdeAuditor >= 45 || lastAuditor === 0) {
      console.log('[WakeUp Scheduler] 🔍 Ejecutando Auditor IA...');
      const auditor = orchestrator.agentes.get('auditor_ia');
      if (auditor && auditor.detectarAnomaliasConIA) {
        try {
          const resultado = await auditor.detectarAnomaliasConIA();
          resultados.push({ agente: 'auditor_ia', tarea: 'detectarAnomalias', exito: true });
          ultimaEjecucion['auditor_ia'] = Date.now();
        } catch (err) {
          resultados.push({ agente: 'auditor_ia', tarea: 'detectarAnomalias', exito: false, error: err.message });
        }
      }
    }
    
    // === ANALISTA FINANCIERO ===
    // Ejecutar si es hora de briefing (7:00) o snapshot (18:00) o nunca ejecutado
    const lastAnalista = ultimaEjecucion['analista_ia'] || 0;
    const horaUltimaAnalista = new Date(lastAnalista).getHours();
    
    if ((horaActual === 7 && horaUltimaAnalista !== 7) || 
        (horaActual === 18 && horaUltimaAnalista !== 18) ||
        lastAnalista === 0) {
      
      const analista = orchestrator.agentes.get('analista_ia');
      if (analista) {
        // Briefing matutino
        if (horaActual >= 7 && horaUltimaAnalista !== 7) {
          console.log('[WakeUp Scheduler] 🌅 Ejecutando Briefing Matutino...');
          try {
            await analista.generarBriefingMatutino();
            resultados.push({ agente: 'analista_ia', tarea: 'briefingMatutino', exito: true });
          } catch (err) {
            resultados.push({ agente: 'analista_ia', tarea: 'briefingMatutino', exito: false, error: err.message });
          }
        }
        
        // Snapshot diario
        if (horaActual >= 18 && horaUltimaAnalista !== 18) {
          console.log('[WakeUp Scheduler] 📸 Ejecutando Snapshot Diario...');
          try {
            await analista.generarSnapshotDiario();
            resultados.push({ agente: 'analista_ia', tarea: 'snapshotDiario', exito: true });
          } catch (err) {
            resultados.push({ agente: 'analista_ia', tarea: 'snapshotDiario', exito: false, error: err.message });
          }
        }
        
        ultimaEjecucion['analista_ia'] = Date.now();
      }
    }
    
    // === CONCILIADOR BANCARIO ===
    // Ejecutar a las 8:00 o 10:00 o nunca
    const lastConciliador = ultimaEjecucion['conciliador_ia'] || 0;
    const horaUltimaConciliador = new Date(lastConciliador).getHours();
    
    if ((horaActual === 8 && horaUltimaConciliador !== 8) ||
        (horaActual === 10 && horaUltimaConciliador !== 10) ||
        lastConciliador === 0) {
      
      const conciliador = orchestrator.agentes.get('conciliador_ia');
      if (conciliador) {
        // Análisis de conciliaciones (8:00)
        if (horaActual >= 8 && horaUltimaConciliador !== 8) {
          console.log('[WakeUp Scheduler] 🏦 Ejecutando Análisis de Conciliaciones...');
          try {
            await conciliador.analizarConciliacionesPendientes();
            resultados.push({ agente: 'conciliador_ia', tarea: 'analizarConciliaciones', exito: true });
          } catch (err) {
            resultados.push({ agente: 'conciliador_ia', tarea: 'analizarConciliaciones', exito: false, error: err.message });
          }
        }
        
        // Sugerir emparejamientos (10:00)
        if (horaActual >= 10 && horaUltimaConciliador !== 10) {
          console.log('[WakeUp Scheduler] 🔗 Ejecutando Sugerencias de Emparejamientos...');
          try {
            await conciliador.sugerirEmparejamientos();
            resultados.push({ agente: 'conciliador_ia', tarea: 'sugerirEmparejamientos', exito: true });
          } catch (err) {
            resultados.push({ agente: 'conciliador_ia', tarea: 'sugerirEmparejamientos', exito: false, error: err.message });
          }
        }
        
        ultimaEjecucion['conciliador_ia'] = Date.now();
      }
    }
    
    // === MAINTENANCE ===
    // Ejecutar a las 2:00 o cada 4 horas
    const lastMaintenance = ultimaEjecucion['maintenance_ia'] || 0;
    const horasDesdeMaintenance = (Date.now() - lastMaintenance) / 1000 / 60 / 60;
    
    if (horaActual === 2 || horasDesdeMaintenance >= 4 || lastMaintenance === 0) {
      console.log('[WakeUp Scheduler] 🧹 Ejecutando Maintenance...');
      const maintenance = orchestrator.agentes.get('maintenance_ia');
      if (maintenance && maintenance.healthCheckSistema) {
        try {
          await maintenance.healthCheckSistema();
          resultados.push({ agente: 'maintenance_ia', tarea: 'healthCheck', exito: true });
          ultimaEjecucion['maintenance_ia'] = Date.now();
        } catch (err) {
          resultados.push({ agente: 'maintenance_ia', tarea: 'healthCheck', exito: false, error: err.message });
        }
      }
    }
    
    console.log(`[WakeUp Scheduler] ✅ Completado. ${resultados.filter(r => r.exito).length}/${resultados.length} tareas ejecutadas.`);
    return { ejecutadas: resultados.filter(r => r.exito).length, total: resultados.length, detalles: resultados };
    
  } catch (error) {
    console.error('[WakeUp Scheduler] ❌ Error:', error);
    return { error: error.message, resultados };
  }
}

module.exports = {
  ejecutarTareasPendientesWakeUp,
  ultimaEjecucion
};
