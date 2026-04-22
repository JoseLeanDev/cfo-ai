/**
 * Sistema de ejecución forzada de agentes al "despertar" (WakeUp Scheduler v2.0)
 * Cuando Render free tier despierta el servidor, ejecutamos las tareas pendientes
 */

const CFOAICore = require('../agents/index');

// Última ejecución por agente (persistir en memoria simple)
const ultimaEjecucion = {};

/**
 * Ejecutar tareas pendientes de los agentes v2.0
 * Se llama cuando el servidor "despierta" o recibe tráfico
 */
async function ejecutarTareasPendientesWakeUp(db) {
  const ahora = new Date();
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();

  console.log(`[WakeUp Scheduler] ⏰ Ejecutando tareas pendientes a las ${horaActual}:${minutoActual}`);

  const resultados = [];

  try {
    // === CAJA ===
    // Posición de caja cada 4 horas
    const lastCaja = ultimaEjecucion['caja'] || 0;
    const horasDesdeCaja = (Date.now() - lastCaja) / 1000 / 60 / 60;

    if (horasDesdeCaja >= 4 || lastCaja === 0) {
      console.log('[WakeUp Scheduler] 💰 Ejecutando Caja...');
      try {
        await CFOAICore.ejecutarTarea('caja', 'actualizarPosicionCaja');
        resultados.push({ agente: 'caja', tarea: 'actualizarPosicionCaja', exito: true });
        ultimaEjecucion['caja'] = Date.now();
      } catch (err) {
        resultados.push({ agente: 'caja', tarea: 'actualizarPosicionCaja', exito: false, error: err.message });
      }
    }

    // === ANÁLISIS ===
    // KPIs diarios si es entre 5-6 AM
    const lastAnalisis = ultimaEjecucion['analisis'] || 0;
    const horaUltimaAnalisis = new Date(lastAnalisis).getHours();

    if ((horaActual === 5 && horaUltimaAnalisis !== 5) || lastAnalisis === 0) {
      console.log('[WakeUp Scheduler] 📊 Ejecutando Análisis (KPIs)...');
      try {
        await CFOAICore.ejecutarTarea('analisis', 'calcularKPIsDiarios');
        resultados.push({ agente: 'analisis', tarea: 'calcularKPIsDiarios', exito: true });
        ultimaEjecucion['analisis'] = Date.now();
      } catch (err) {
        resultados.push({ agente: 'analisis', tarea: 'calcularKPIsDiarios', exito: false, error: err.message });
      }
    }

    // === COBRANZA ===
    // Aging cada 4 horas
    const lastCobranza = ultimaEjecucion['cobranza'] || 0;
    const horasDesdeCobranza = (Date.now() - lastCobranza) / 1000 / 60 / 60;

    if (horasDesdeCobranza >= 4 || lastCobranza === 0) {
      console.log('[WakeUp Scheduler] 📋 Ejecutando Cobranza (Aging)...');
      try {
        await CFOAICore.ejecutarTarea('cobranza', 'actualizarAging');
        resultados.push({ agente: 'cobranza', tarea: 'actualizarAging', exito: true });
        ultimaEjecucion['cobranza'] = Date.now();
      } catch (err) {
        resultados.push({ agente: 'cobranza', tarea: 'actualizarAging', exito: false, error: err.message });
      }
    }

    // === CONTABILIDAD ===
    // Importar transacciones cada 4 horas
    const lastContabilidad = ultimaEjecucion['contabilidad'] || 0;
    const horasDesdeContabilidad = (Date.now() - lastContabilidad) / 1000 / 60 / 60;

    if (horasDesdeContabilidad >= 4 || lastContabilidad === 0) {
      console.log('[WakeUp Scheduler] 📅 Ejecutando Contabilidad...');
      try {
        await CFOAICore.ejecutarTarea('contabilidad', 'importarTransacciones');
        resultados.push({ agente: 'contabilidad', tarea: 'importarTransacciones', exito: true });
        ultimaEjecucion['contabilidad'] = Date.now();
      } catch (err) {
        resultados.push({ agente: 'contabilidad', tarea: 'importarTransacciones', exito: false, error: err.message });
      }
    }

    // === BRIEFING DIARIO ===
    // 7:00 AM
    const lastBriefing = ultimaEjecucion['briefing'] || 0;
    const horaUltimaBriefing = new Date(lastBriefing).getHours();

    if ((horaActual === 7 && horaUltimaBriefing !== 7) || lastBriefing === 0) {
      console.log('[WakeUp Scheduler] 🌅 Ejecutando Briefing Diario...');
      try {
        await CFOAICore.generarBriefingDiario();
        resultados.push({ agente: 'orchestrator', tarea: 'briefingDiario', exito: true });
        ultimaEjecucion['briefing'] = Date.now();
      } catch (err) {
        resultados.push({ agente: 'orchestrator', tarea: 'briefingDiario', exito: false, error: err.message });
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
