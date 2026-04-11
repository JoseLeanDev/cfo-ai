/**
 * Agent Scheduler - Sistema de ejecución automática de agentes IA
 * Configura cron jobs para ejecutar agentes periódicamente
 */

const cron = require('node-cron');
const AuditorAgentIA = require('../agents/AuditorAgentIA');
const AnalistaFinancieroIA = require('../agents/AnalistaFinancieroIA');
const ConciliadorAgentIA = require('../agents/ConciliadorAgentIA');
const MaintenanceAgentIA = require('../agents/MaintenanceAgentIA');

class AgentScheduler {
  constructor() {
    this.agentes = {};
    this.tareas = [];
    this.inicializado = false;
  }

  /**
   * Inicializa todos los agentes y programa sus tareas
   */
  async inicializar() {
    if (this.inicializado) {
      console.log('[AgentScheduler] Ya inicializado');
      return;
    }

    console.log('[AgentScheduler] 🚀 Inicializando agentes IA...');

    // Crear instancias de agentes
    this.agentes.auditor = new AuditorAgentIA();
    this.agentes.analista = new AnalistaFinancieroIA();
    this.agentes.conciliador = new ConciliadorAgentIA();
    this.agentes.maintenance = new MaintenanceAgentIA();

    // Programar tareas
    this.programarTareas();

    this.inicializado = true;
    console.log('[AgentScheduler] ✅ Agentes inicializados correctamente');
  }

  /**
   * Programa todas las tareas de los agentes
   */
  programarTareas() {
    // Auditor IA - cada 45 minutos
    this.tareas.push(
      cron.schedule('*/45 * * * *', async () => {
        console.log('[AgentScheduler] ⏰ Ejecutando Auditor IA...');
        try {
          await this.agentes.auditor.detectarAnomaliasConIA();
        } catch (error) {
          console.error('[AgentScheduler] Error en Auditor:', error);
        }
      }, { scheduled: true })
    );

    // Analista Financiero IA - cada 2 horas
    this.tareas.push(
      cron.schedule('0 */2 * * *', async () => {
        console.log('[AgentScheduler] ⏰ Ejecutando Analista Financiero IA...');
        try {
          await this.agentes.analista.generarAnalisisConIA();
        } catch (error) {
          console.error('[AgentScheduler] Error en Analista:', error);
        }
      }, { scheduled: true })
    );

    // Conciliador IA - cada hora
    this.tareas.push(
      cron.schedule('0 * * * *', async () => {
        console.log('[AgentScheduler] ⏰ Ejecutando Conciliador IA...');
        try {
          await this.agentes.conciliador.sugerirConciliacionesIA();
        } catch (error) {
          console.error('[AgentScheduler] Error en Conciliador:', error);
        }
      }, { scheduled: true })
    );

    // Maintenance IA - cada 30 minutos
    this.tareas.push(
      cron.schedule('*/30 * * * *', async () => {
        console.log('[AgentScheduler] ⏰ Ejecutando Maintenance IA...');
        try {
          await this.agentes.maintenance.ejecutarTareasMantenimientoIA();
        } catch (error) {
          console.error('[AgentScheduler] Error en Maintenance:', error);
        }
      }, { scheduled: true })
    );

    console.log('[AgentScheduler] 📅 Tareas programadas:');
    console.log('  - Auditor IA: cada 45 minutos');
    console.log('  - Analista Financiero IA: cada 2 horas');
    console.log('  - Conciliador IA: cada hora');
    console.log('  - Maintenance IA: cada 30 minutos');
  }

  /**
   * Ejecuta un agente manualmente
   */
  async ejecutarAgenteManual(nombreAgente, tarea) {
    const agente = this.agentes[nombreAgente];
    if (!agente) {
      throw new Error(`Agente ${nombreAgente} no encontrado`);
    }

    console.log(`[AgentScheduler] ▶️ Ejecutando ${nombreAgente} manualmente...`);
    
    switch (nombreAgente) {
      case 'auditor':
        if (tarea === 'anomalias') return await agente.detectarAnomaliasConIA();
        if (tarea === 'alertas') return await agente.generarAlertasPreventivas();
        break;
      case 'analista':
        if (tarea === 'analisis') return await agente.generarAnalisisConIA();
        if (tarea === 'briefing') return await agente.generarBriefingEjecutivo();
        break;
      case 'conciliador':
        if (tarea === 'sugerencias') return await agente.sugerirConciliacionesIA();
        break;
      case 'maintenance':
        if (tarea === 'mantenimiento') return await agente.ejecutarTareasMantenimientoIA();
        break;
      default:
        throw new Error(`Tarea ${tarea} no reconocida para ${nombreAgente}`);
    }
  }

  /**
   * Obtiene el estado de los agentes
   */
  getStatus() {
    return {
      inicializado: this.inicializado,
      agentes: Object.keys(this.agentes),
      tareasProgramadas: this.tareas.length
    };
  }

  /**
   * Detiene todas las tareas
   */
  detener() {
    console.log('[AgentScheduler] 🛑 Deteniendo tareas...');
    this.tareas.forEach(tarea => tarea.stop());
    this.tareas = [];
    this.inicializado = false;
    console.log('[AgentScheduler] ✅ Tareas detenidas');
  }
}

// Singleton
let schedulerInstance = null;

function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new AgentScheduler();
  }
  return schedulerInstance;
}

module.exports = {
  AgentScheduler,
  getScheduler
};
