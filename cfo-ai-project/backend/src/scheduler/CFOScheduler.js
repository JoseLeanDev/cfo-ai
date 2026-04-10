/**
 * CFO AI - Scheduler System
 * Sistema de tareas programadas para agentes
 */

const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class CFOScheduler {
  constructor(config = {}) {
    this.apiBaseUrl = config.apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:3000/api';
    this.empresaId = config.empresaId || 1;
    this.tasks = [];
    this.jobs = [];
    this.logsDir = path.join(__dirname, '../../logs/scheduler');
    this.stateFile = path.join(__dirname, '../../logs/scheduler/state.json');
    
    // Configuración de agentes
    this.agents = {
      auditor: {
        endpoint: '/agents/auditor',
        enabled: true
      },
      analista: {
        endpoint: '/agents/analista',
        enabled: true
      },
      conciliador: {
        endpoint: '/agents/conciliador',
        enabled: true
      },
      maintenance: {
        endpoint: null, // Tareas locales
        enabled: true
      }
    };
  }

  async init() {
    await this.ensureDirectories();
    await this.loadState();
    this.setupTasks();
    console.log('[CFOScheduler] Inicializado correctamente');
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
      console.error('[CFOScheduler] Error creando directorios:', error);
    }
  }

  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      this.state = JSON.parse(data);
    } catch {
      this.state = {
        lastExecutions: {},
        cycleCount: 0
      };
    }
  }

  async saveState() {
    try {
      await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[CFOScheduler] Error guardando estado:', error);
    }
  }

  async logExecution(taskName, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      task: taskName,
      success: result.success,
      message: result.message,
      duration: result.duration
    };

    const logFile = path.join(this.logsDir, `${new Date().toISOString().split('T')[0]}.jsonl`);
    
    try {
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[CFOScheduler] Error escribiendo log:', error);
    }
  }

  async callAgent(agentName, task, params = {}) {
    const startTime = Date.now();
    
    try {
      const agent = this.agents[agentName];
      if (!agent || !agent.enabled) {
        throw new Error(`Agente ${agentName} no disponible`);
      }

      const response = await axios.post(`${this.apiBaseUrl}${agent.endpoint}`, {
        empresa_id: this.empresaId,
        task: task,
        params: params
      }, {
        timeout: 30000
      });

      const duration = Date.now() - startTime;
      
      await this.logExecution(`${agentName}.${task}`, {
        success: true,
        message: 'Ejecutado correctamente',
        duration
      });

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await this.logExecution(`${agentName}.${task}`, {
        success: false,
        message: error.message,
        duration
      });

      console.error(`[CFOScheduler] Error en ${agentName}.${task}:`, error.message);
      throw error;
    }
  }

  setupTasks() {
    // === AGENTE AUDITOR ===
    
    // 1. Detectar anomalías cada 30 minutos
    this.schedule('*/30 * * * *', 'auditor.detectar-anomalias', async () => {
      return await this.callAgent('auditor', 'detectar-anomalias-tiempo-real', {
        checkSaldosNegativos: true,
        checkMontosAtipicos: true,
        checkDuplicados: true,
        horasAtras: 4
      });
    });

    // 2. Alertas pre-cierre diario a las 06:00
    this.schedule('0 6 * * *', 'auditor.alertas-pre-cierre', async () => {
      return await this.callAgent('auditor', 'alertas-pre-cierre', {
        revisarAsientosPendientes: true,
        revisarDesbalances: true,
        revisarDocumentosFaltantes: true
      });
    });

    // 3. Auditoría CxC/CxP semanal (lunes 08:00)
    this.schedule('0 8 * * 1', 'auditor.auditoria-cxp-cxc', async () => {
      return await this.callAgent('auditor', 'auditoria-cuentas-cxp-cxc', {
        incluirAuxiliares: true,
        toleranciaDiferencia: 0.01
      });
    });

    // 4. Validación apertura mes (día 1 a las 00:01)
    this.schedule('1 0 1 * *', 'auditor.validacion-apertura-mes', async () => {
      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth();
      const anioMesAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      return await this.callAgent('auditor', 'validacion-apertura-mes', {
        mes: mesAnterior,
        anio: anioMesAnterior,
        ejecutarValidaciones: true,
        generarAlertas: true
      });
    });

    // 5. Presión cierre tardío (día 5 a las 18:00)
    this.schedule('0 18 5 * *', 'auditor.presion-cierre-tardio', async () => {
      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth();
      const anioMesAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      return await this.callAgent('auditor', 'presion-cierre-tardio', {
        mes: mesAnterior,
        anio: anioMesAnterior
      });
    });

    // === AGENTE ANALISTA ===

    // 6. Briefing matutino (07:00, lunes a viernes)
    this.schedule('0 7 * * 1-5', 'analista.briefing-matutino', async () => {
      return await this.callAgent('analista', 'briefing-matutino', {
        incluirVentas: true,
        incluirGastos: true,
        incluirAlertasLiquidez: true,
        compararConAyer: true
      });
    });

    // 7. Snapshot diario (18:00)
    this.schedule('0 18 * * *', 'analista.snapshot-diario', async () => {
      return await this.callAgent('analista', 'snapshot-diario', {
        metricas: ['posicion_bancaria', 'cxc', 'cxp', 'utilidad_dia']
      });
    });

    // 8. Reporte semanal (viernes 17:00)
    this.schedule('0 17 * * 5', 'analista.reporte-semanal', async () => {
      return await this.callAgent('analista', 'reporte-semanal', {
        variacionMinima: 10,
        incluirTopGastos: true,
        compararSemanaAnterior: true
      });
    });

    // 9. Cierre mes anterior (día 1 a las 09:00)
    this.schedule('0 9 1 * *', 'analista.cierre-mes-anterior', async () => {
      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth();
      const anioMesAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      return await this.callAgent('analista', 'cierre-mes-anterior', {
        mes: mesAnterior,
        anio: anioMesAnterior,
        incluirYoY: true,
        incluirAnomalias: true,
        incluirProyecciones: true
      });
    });

    // 10. Proyección trimestral (día 1 de meses 1, 4, 7, 10 a las 10:00)
    this.schedule('0 10 1 1,4,7,10 *', 'analista.proyeccion-trimestral', async () => {
      return await this.callAgent('analista', 'proyeccion-financiera', {
        mesesHistoricos: 12,
        mesesProyeccion: 3
      });
    });

    // === AGENTE CONCILIADOR ===

    // 11. Alerta conciliación pendiente (08:00 diario)
    this.schedule('0 8 * * *', 'conciliador.alerta-conciliacion-pendiente', async () => {
      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth();
      const anioMesAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      return await this.callAgent('conciliador', 'alerta-conciliacion-pendiente', {
        mes: mesAnterior,
        anio: anioMesAnterior
      });
    });

    // 12. Iniciar conciliaciones (día 1)
    this.schedule('0 9 1 * *', 'conciliador.iniciar-conciliaciones', async () => {
      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth();
      const anioMesAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      return await this.callAgent('conciliador', 'iniciar-conciliaciones', {
        mes: mesAnterior,
        anio: anioMesAnterior,
        autoCrearRegistros: true
      });
    });

    // 13. Presión conciliación (día 3)
    this.schedule('0 10 3 * *', 'conciliador.presion-conciliacion', async () => {
      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth();
      const anioMesAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      return await this.callAgent('conciliador', 'presion-conciliacion', {
        mes: mesAnterior,
        anio: anioMesAnterior
      });
    });

    // === AGENTE MAINTENANCE ===

    // 14. Limpieza logs (02:00 diario)
    this.schedule('0 2 * * *', 'maintenance.limpieza-logs', async () => {
      return await this.limpiarLogsViejos();
    });

    // 15. Optimización DB (domingo 03:00)
    this.schedule('0 3 * * 0', 'maintenance.optimizacion-db', async () => {
      return await this.optimizarDB();
    });

    // 16. Snapshot archivo mensual (día 28 a las 04:00)
    this.schedule('0 4 28 * *', 'maintenance.snapshot-archivo', async () => {
      return await this.crearSnapshotArchivo();
    });

    console.log(`[CFOScheduler] ${this.tasks.length} tareas programadas`);
  }

  schedule(cronExpression, taskName, handler) {
    this.tasks.push({
      name: taskName,
      cron: cronExpression,
      handler
    });

    const job = cron.schedule(cronExpression, async () => {
      const startTime = Date.now();
      console.log(`[CFOScheduler] Ejecutando: ${taskName}`);
      
      try {
        await handler();
        console.log(`[CFOScheduler] Completado: ${taskName} (${Date.now() - startTime}ms)`);
      } catch (error) {
        console.error(`[CFOScheduler] Error en ${taskName}:`, error.message);
      }
    }, {
      scheduled: false, // No iniciar automáticamente
      timezone: 'America/Guatemala' // Zona horaria de Guatemala
    });

    this.jobs.push({
      name: taskName,
      job
    });
  }

  // Tareas de mantenimiento locales
  async limpiarLogsViejos() {
    try {
      const logFiles = await fs.readdir(this.logsDir);
      const ahora = new Date();
      const diasMaximos = 90;
      
      let archivosEliminados = 0;
      
      for (const file of logFiles) {
        if (file.endsWith('.jsonl')) {
          const filePath = path.join(this.logsDir, file);
          const stats = await fs.stat(filePath);
          const diasDiferencia = (ahora - stats.mtime) / (1000 * 60 * 60 * 24);
          
          if (diasDiferencia > diasMaximos) {
            await fs.unlink(filePath);
            archivosEliminados++;
          }
        }
      }
      
      return {
        success: true,
        message: `${archivosEliminados} archivos de log antiguos eliminados`,
        duration: 0
      };
    } catch (error) {
      throw error;
    }
  }

  async optimizarDB() {
    try {
      // Llamar al endpoint de mantenimiento de DB
      const response = await axios.post(`${this.apiBaseUrl}/maintenance/optimize`, {
        empresa_id: this.empresaId
      }, {
        timeout: 120000 // 2 minutos timeout para VACUUM
      });
      
      return {
        success: true,
        message: 'Base de datos optimizada',
        duration: 0
      };
    } catch (error) {
      throw error;
    }
  }

  async crearSnapshotArchivo() {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/maintenance/backup`, {
        empresa_id: this.empresaId,
        tipo: 'mensual'
      }, {
        timeout: 300000 // 5 minutos timeout para backup
      });
      
      return {
        success: true,
        message: 'Snapshot mensual creado',
        duration: 0
      };
    } catch (error) {
      throw error;
    }
  }

  start() {
    this.jobs.forEach(({ name, job }) => {
      job.start();
      console.log(`[CFOScheduler] Iniciado: ${name}`);
    });
    console.log('[CFOScheduler] Todos los jobs iniciados');
  }

  stop() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`[CFOScheduler] Detenido: ${name}`);
    });
    console.log('[CFOScheduler] Todos los jobs detenidos');
  }

  listTasks() {
    return this.tasks.map(t => ({
      name: t.name,
      cron: t.cron,
      nextRun: this.getNextRun(t.cron)
    }));
  }

  getNextRun(cronExpression) {
    // Simplificado - en producción usar librería como cron-parser
    return 'Próxima ejecución según programación';
  }
}

module.exports = CFOScheduler;

// Si se ejecuta directamente
if (require.main === module) {
  const scheduler = new CFOScheduler();
  
  scheduler.init().then(() => {
    scheduler.start();
    
    // Manejar señales de terminación
    process.on('SIGINT', () => {
      console.log('\n[CFOScheduler] Recibido SIGINT, deteniendo...');
      scheduler.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n[CFOScheduler] Recibido SIGTERM, deteniendo...');
      scheduler.stop();
      process.exit(0);
    });
  });
}
