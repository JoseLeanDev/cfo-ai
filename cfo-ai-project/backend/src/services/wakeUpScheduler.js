/**
 * Sistema de ejecución forzada de agentes al "despertar" (WakeUp Scheduler v3.0)
 * Persiste últimas ejecuciones en BD y ejecuta tareas pendientes en cada request
 */

const CFOAICore = require('../agents/index');
const db = require('../../database/connection');

// Cache en memoria para evitar ejecuciones duplicadas en la misma hora
const ultimaEjecucionMemoria = {};

/**
 * Obtener última ejecución desde BD (persistente entre reinicios)
 */
async function obtenerUltimaEjecucion(agente, tarea) {
  try {
    const row = await db.getAsync(
      `SELECT MAX(created_at) as last_run FROM agentes_logs 
       WHERE agente_tipo = ? AND categoria = ? 
       AND resultado_status = 'exitoso' 
       AND created_at >= datetime('now', '-7 days')`,
      [agente, tarea]
    );
    return row?.last_run ? new Date(row.last_run).getTime() : 0;
  } catch (e) {
    console.error('[WakeUp] Error leyendo BD:', e.message);
    return 0;
  }
}

/**
 * Verificar si debe ejecutar basado en hora y última ejecución
 */
function debeEjecutar(horaActual, horaEsperada, ultimaEjecucionMs, ventanaHoras = 2) {
  // Si nunca se ejecutó
  if (ultimaEjecucionMs === 0) return true;
  
  const ahora = Date.now();
  const horasDesdeUltima = (ahora - ultimaEjecucionMs) / 1000 / 60 / 60;
  
  // Ya se ejecutó en los últimos X horas? No ejecutar
  if (horasDesdeUltima < ventanaHoras) return false;
  
  // Si estamos en la hora esperada y pasaron más de X horas
  if (horaActual === horaEsperada) return true;
  
  // Si se pasó la hora esperada y nunca se ejecutó hoy
  const ultimaFecha = new Date(ultimaEjecucionMs);
  const hoy = new Date();
  const mismoDia = ultimaFecha.getDate() === hoy.getDate() && 
                   ultimaFecha.getMonth() === hoy.getMonth();
  
  // Si ya pasó la hora esperada hoy y no se ejecutó
  if (horaActual > horaEsperada && !mismoDia) return true;
  
  // Fallback: si pasaron muchas horas
  return horasDesdeUltima >= ventanaHoras + 2;
}

/**
 * Ejecutar tareas pendientes de los agentes v2.0
 * Se llama cuando el servidor "despierta" o recibe tráfico
 */
async function ejecutarTareasPendientesWakeUp() {
  const ahora = new Date();
  const horaActual = ahora.getHours();
  const fechaStr = ahora.toISOString().split('T')[0];
  
  console.log(`[WakeUp Scheduler v3.0] ⏰ Revisando tareas pendientes - ${horaActual}:${ahora.getMinutes()} (${fechaStr})`);

  const resultados = [];

  try {
    // === CAJA - Posición cada 4 horas ===
    const lastCajaBD = await obtenerUltimaEjecucion('caja', 'posicion_caja');
    const horasDesdeCaja = (Date.now() - lastCajaBD) / 1000 / 60 / 60;
    
    if (horasDesdeCaja >= 4 || lastCajaBD === 0) {
      console.log('[WakeUp Scheduler] 💰 Ejecutando Caja (posición)...');
      try {
        await CFOAICore.ejecutarTarea('caja', 'actualizarPosicionCaja');
        resultados.push({ agente: 'caja', tarea: 'actualizarPosicionCaja', exito: true });
      } catch (err) {
        resultados.push({ agente: 'caja', tarea: 'actualizarPosicionCaja', exito: false, error: err.message });
      }
    }

    // === CAJA - Cash flow diario 6AM ===
    const lastCashFlowBD = await obtenerUltimaEjecucion('caja', 'proyeccion_cashflow');
    if (debeEjecutar(horaActual, 6, lastCashFlowBD, 4)) {
      console.log('[WakeUp Scheduler] 📊 Ejecutando Caja (cash flow)...');
      try {
        await CFOAICore.ejecutarTarea('caja', 'proyectarCashFlow');
        resultados.push({ agente: 'caja', tarea: 'proyectarCashFlow', exito: true });
      } catch (err) {
        resultados.push({ agente: 'caja', tarea: 'proyectarCashFlow', exito: false, error: err.message });
      }
    }

    // === ANÁLISIS - KPIs diarios 5AM ===
    const lastAnalisisBD = await obtenerUltimaEjecucion('analisis', 'kpis_diarios');
    if (debeEjecutar(horaActual, 5, lastAnalisisBD, 4)) {
      console.log('[WakeUp Scheduler] 📈 Ejecutando Análisis (KPIs)...');
      try {
        await CFOAICore.ejecutarTarea('analisis', 'calcularKPIsDiarios');
        resultados.push({ agente: 'analisis', tarea: 'calcularKPIsDiarios', exito: true });
      } catch (err) {
        resultados.push({ agente: 'analisis', tarea: 'calcularKPIsDiarios', exito: false, error: err.message });
      }
    }

    // === COBRANZA - Aging cada 4 horas ===
    const lastCobranzaBD = await obtenerUltimaEjecucion('cobranza', 'aging_cartera');
    const horasDesdeCobranza = (Date.now() - lastCobranzaBD) / 1000 / 60 / 60;
    
    if (horasDesdeCobranza >= 4 || lastCobranzaBD === 0) {
      console.log('[WakeUp Scheduler] 📋 Ejecutando Cobranza (aging)...');
      try {
        await CFOAICore.ejecutarTarea('cobranza', 'actualizarAging');
        resultados.push({ agente: 'cobranza', tarea: 'actualizarAging', exito: true });
      } catch (err) {
        resultados.push({ agente: 'cobranza', tarea: 'actualizarAging', exito: false, error: err.message });
      }
    }

    // === COBRANZA - Métricas diarias 6AM ===
    const lastMetricasBD = await obtenerUltimaEjecucion('cobranza', 'metricas_cobranza');
    if (debeEjecutar(horaActual, 6, lastMetricasBD, 4)) {
      console.log('[WakeUp Scheduler] 📊 Ejecutando Cobranza (métricas)...');
      try {
        await CFOAICore.ejecutarTarea('cobranza', 'calcularMetricasCobranza');
        resultados.push({ agente: 'cobranza', tarea: 'calcularMetricasCobranza', exito: true });
      } catch (err) {
        resultados.push({ agente: 'cobranza', tarea: 'calcularMetricasCobranza', exito: false, error: err.message });
      }
    }

    // === CONTABILIDAD - Importar transacciones 5AM ===
    const lastContabilidadBD = await obtenerUltimaEjecucion('contabilidad', 'importacion_transacciones');
    if (debeEjecutar(horaActual, 5, lastContabilidadBD, 4)) {
      console.log('[WakeUp Scheduler] 📅 Ejecutando Contabilidad (importar)...');
      try {
        await CFOAICore.ejecutarTarea('contabilidad', 'importarTransacciones');
        resultados.push({ agente: 'contabilidad', tarea: 'importarTransacciones', exito: true });
      } catch (err) {
        resultados.push({ agente: 'contabilidad', tarea: 'importarTransacciones', exito: false, error: err.message });
      }
    }

    // === CONTABILIDAD - Conciliación viernes 6PM ===
    const diaSemana = ahora.getDay();
    const lastConciliacionBD = await obtenerUltimaEjecucion('contabilidad', 'conciliacion_bancaria');
    if (diaSemana === 5 && horaActual >= 18 && debeEjecutar(horaActual, 18, lastConciliacionBD, 4)) {
      console.log('[WakeUp Scheduler] 🏦 Ejecutando Contabilidad (conciliación)...');
      try {
        await CFOAICore.ejecutarTarea('contabilidad', 'preConciliacionBancaria');
        resultados.push({ agente: 'contabilidad', tarea: 'preConciliacionBancaria', exito: true });
      } catch (err) {
        resultados.push({ agente: 'contabilidad', tarea: 'preConciliacionBancaria', exito: false, error: err.message });
      }
    }

    // === BRIEFING DIARIO 7AM ===
    const lastBriefingBD = await obtenerUltimaEjecucion('orchestrator', 'briefing_diario');
    if (debeEjecutar(horaActual, 7, lastBriefingBD, 4)) {
      console.log('[WakeUp Scheduler] 🌅 Ejecutando Briefing Diario...');
      try {
        await CFOAICore.generarBriefingDiario();
        resultados.push({ agente: 'orchestrator', tarea: 'briefingDiario', exito: true });
      } catch (err) {
        resultados.push({ agente: 'orchestrator', tarea: 'briefingDiario', exito: false, error: err.message });
      }
    }

    const ejecutadas = resultados.filter(r => r.exito).length;
    const total = resultados.length;
    console.log(`[WakeUp Scheduler] ✅ ${ejecutadas}/${total} tareas ejecutadas.`);
    
    return { ejecutadas, total, detalles: resultados, timestamp: new Date().toISOString() };

  } catch (error) {
    console.error('[WakeUp Scheduler] ❌ Error:', error);
    return { error: error.message, resultados, timestamp: new Date().toISOString() };
  }
}

/**
 * Middleware de Express para ejecutar tareas pendientes en cada request
 */
function wakeUpMiddleware() {
  let ultimaRevision = 0;
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos entre revisiones

  return async (req, res, next) => {
    const ahora = Date.now();
    
    // Solo revisar cada 5 minutos para no ralentizar requests
    if (ahora - ultimaRevision > COOLDOWN_MS) {
      ultimaRevision = ahora;
      
      // Ejecutar en background (no bloquear request)
      setImmediate(async () => {
        try {
          await ejecutarTareasPendientesWakeUp();
        } catch (e) {
          console.error('[WakeUp Middleware] Error:', e.message);
        }
      });
    }
    
    next();
  };
}

module.exports = {
  ejecutarTareasPendientesWakeUp,
  wakeUpMiddleware,
  ultimaEjecucion: ultimaEjecucionMemoria
};
