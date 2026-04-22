/**
 * Agent Scheduler v2.0
 * Orquesta los 4 agentes especializados del CFO AI
 */

const cron = require('node-cron');
const CFOAICore = require('../agents');

class AgentScheduler {
  constructor() {
    this.core = CFOAICore;
    this.tareas = [];
    this.inicializado = false;
  }

  async inicializar() {
    if (this.inicializado) {
      console.log('[AgentScheduler] Ya inicializado');
      return;
    }

    console.log('[AgentScheduler] 🚀 Inicializando CFO AI Core v2.0...');
    await this.core.iniciar();

    // Briefing diario 7:00 AM
    this.tareas.push(
      cron.schedule('0 7 * * *', async () => {
        console.log('[AgentScheduler] 🌅 Generando Briefing Diario...');
        try {
          await this.core.generarBriefingDiario();
        } catch (error) {
          console.error('[AgentScheduler] Error briefing:', error);
        }
      }, { scheduled: true })
    );

    this.inicializado = true;
    console.log('[AgentScheduler] ✅ Scheduler v2.0 activo');
    console.log('  - Briefing Diario: 7:00 AM');
    console.log('  - Agentes: Caja, Análisis, Cobranza, Contabilidad');
  }

  async ejecutarAgenteManual(agenteId, tarea) {
    return await this.core.ejecutarTarea(agenteId, tarea);
  }

  getStatus() {
    return {
      inicializado: this.inicializado,
      ...this.core.getEstado(),
      tareasProgramadas: this.tareas.length
    };
  }

  detener() {
    console.log('[AgentScheduler] 🛑 Deteniendo...');
    this.tareas.forEach(t => t.stop());
    this.tareas = [];
    this.core.detener();
    this.inicializado = false;
  }
}

let schedulerInstance = null;

function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new AgentScheduler();
  }
  return schedulerInstance;
}

module.exports = { AgentScheduler, getScheduler };
