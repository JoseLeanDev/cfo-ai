/**
 * Agenda de los agentes.
 *
 * Un solo cron, en hora de Guatemala, para los cuatro agentes que existen.
 *
 * Reemplaza a tres mecanismos que convivían y se pisaban:
 *  - un middleware que disparaba tareas en cada request HTTP y, como solo
 *    contaba las ejecuciones exitosas, reintentaba una tarea rota en cada
 *    carga de página (así se juntaron 474 mil filas en agentes_logs);
 *  - un CFOScheduler que solo programaba agentes huérfanos, contra endpoints
 *    que no existían, y fallaba en silencio cada 30 minutos;
 *  - un agentScheduler que nadie importaba.
 *
 * Reglas:
 *  - Una tarea corre en su horario y en ningún otro momento. Si falla, se
 *    registra y espera a su siguiente horario: no hay reintento en bucle.
 *  - Una tarea no se solapa consigo misma.
 *  - Fuera de producción la agenda no arranca salvo que se pida con
 *    AGENDA_ACTIVA=true, para que levantar el backend en local no escriba en
 *    la base del demo.
 */

const cron = require('node-cron');

const ZONA = 'America/Guatemala';

// [expresión cron, agente, tarea, descripción]
const TAREAS = [
  ['0 */4 * * *', 'caja', 'actualizarPosicionCaja', 'Posición de caja'],
  ['0 6 * * *', 'caja', 'proyectarCashFlow', 'Proyección de flujo'],
  ['0 5 * * *', 'analisis', 'calcularKPIsDiarios', 'KPIs diarios'],
  ['30 */4 * * *', 'cobranza', 'actualizarAging', 'Antigüedad de cartera'],
  ['15 6 * * *', 'cobranza', 'calcularMetricasCobranza', 'Métricas de cobranza'],
  ['30 5 * * *', 'contabilidad', 'importarTransacciones', 'Importación de transacciones'],
  ['0 18 * * 5', 'contabilidad', 'preConciliacionBancaria', 'Preconciliación bancaria'],
];

const enCurso = new Set();

async function correr(nombre, fn) {
  if (enCurso.has(nombre)) {
    console.warn(`[agenda] ${nombre} sigue corriendo; se omite este turno`);
    return;
  }
  enCurso.add(nombre);
  const t0 = Date.now();
  try {
    await fn();
    console.log(`[agenda] ${nombre} ok (${Date.now() - t0} ms)`);
  } catch (error) {
    // El agente ya registró el detalle en agentes_logs. Aquí solo se deja
    // constancia en consola; la tarea vuelve a intentarse en su próximo horario.
    console.error(`[agenda] ${nombre} falló: ${error.message}`);
  } finally {
    enCurso.delete(nombre);
  }
}

function activa() {
  if (process.env.AGENDA_ACTIVA !== undefined) {
    return process.env.AGENDA_ACTIVA === 'true';
  }
  return process.env.NODE_ENV === 'production';
}

function iniciarAgenda(core) {
  if (!activa()) {
    console.log('[agenda] desactivada (AGENDA_ACTIVA=true para encenderla fuera de producción)');
    return [];
  }

  const trabajos = TAREAS.map(([expresion, agente, tarea, descripcion]) =>
    cron.schedule(
      expresion,
      () => correr(`${agente}.${tarea}`, () => core.ejecutarTarea(agente, tarea)),
      { timezone: ZONA }
    )
  );

  trabajos.push(
    cron.schedule(
      '0 7 * * *',
      () => correr('briefing', () => core.generarBriefingDiario()),
      { timezone: ZONA }
    )
  );

  console.log(`[agenda] ${trabajos.length} tareas programadas (${ZONA})`);
  return trabajos;
}

module.exports = { iniciarAgenda, TAREAS, ZONA };
