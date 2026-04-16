/**
 * Orquestador de Agentes de IA
 * Inicializa y coordina todos los agentes de IA del sistema CFO AI
 */

const AuditorAgentIA = require('./AuditorAgentIA');
const AnalistaFinancieroIA = require('./AnalistaFinancieroIA');
const ConciliadorAgentIA = require('./ConciliadorAgentIA');
const MaintenanceAgentIA = require('./MaintenanceAgentIA');
const { logAgentActivity } = require('../src/services/agentLogger');
const aiService = require('../src/services/aiService');

class AgentOrchestratorIA {
  constructor() {
    this.agentes = new Map(); // Usar Map para instancias
    this.estado = 'detenido';
    this.inicioTimestamp = null;
  }

  /**
   * Iniciar todos los agentes de IA
   */
  async iniciar() {
    console.log('🤖 ==========================================');
    console.log('🤖 CFO AI - Agentes de IA Iniciando...');
    console.log('🤖 ==========================================');

    // Verificar configuración de LLM
    if (!process.env.OPENROUTER_API_KEY && !process.env.KIMI_API_KEY) {
      console.error('❌ ERROR: No hay API key configurada para LLM');
      console.error('   Configura OPENROUTER_API_KEY o KIMI_API_KEY');
      throw new Error('API key de LLM no configurada');
    }

    console.log(`\n📡 Provider LLM: ${aiService.provider}`);
    console.log(`🎯 Modelo: ${aiService.config.model}\n`);

    try {
      // Crear e iniciar cada agente (instancias)
      const agenteClasses = {
        auditor_ia: AuditorAgentIA,
        analista_ia: AnalistaFinancieroIA,
        conciliador_ia: ConciliadorAgentIA,
        maintenance_ia: MaintenanceAgentIA
      };

      for (const [key, AgenteClass] of Object.entries(agenteClasses)) {
        console.log(`\n🚀 Creando instancia de ${AgenteClass.name}...`);
        const agente = new AgenteClass();
        agente.iniciarScheduler();
        this.agentes.set(key, agente);
        console.log(`✅ ${agente.nombre} iniciado`);
      }

      this.estado = 'activo';
      this.inicioTimestamp = new Date();

      console.log('\n✅ ==========================================');
      console.log('✅ TODOS LOS AGENTES DE IA INICIADOS');
      console.log(`✅ Total: ${this.agentes.size} agentes`);
      console.log('✅ ==========================================\n');

      // Ejecutar health check inicial
      await this.healthCheckInicial();

    } catch (error) {
      console.error('❌ Error iniciando agentes:', error);
      await logAgentActivity({
        agente_nombre: 'Orchestrator IA',
        agente_tipo: 'orchestrator',
        agente_version: '2.0.0',
        categoria: 'error_sistema',
        descripcion: `Error iniciando agentes: ${error.message}`,
        resultado_status: 'error',
        duracion_ms: 0
      });
      throw error;
    }
  }

  /**
   * Detener todos los agentes
   */
  detener() {
    console.log('\n🛑 Deteniendo agentes de IA...\n');
    
    for (const [key, agente] of this.agentes) {
      console.log(`⏹️  Deteniendo ${key}...`);
      agente.detener();
    }

    this.estado = 'detenido';
    console.log('\n✅ Agentes detenidos');
  }

  /**
   * Obtener estado de todos los agentes
   */
  getEstado() {
    const tiempoActivo = this.inicioTimestamp 
      ? Math.floor((new Date() - this.inicioTimestamp) / 1000)
      : 0;

    const agentesArray = [];
    for (const [key, agente] of this.agentes) {
      agentesArray.push({
        id: key,
        nombre: agente.nombre,
        tipo: agente.tipo,
        version: agente.version,
        descripcion: agente.descripcion,
        activo: true
      });
    }

    return {
      estado: this.estado,
      inicio: this.inicioTimestamp,
      tiempo_activo_segundos: tiempoActivo,
      agentes: agentesArray,
      llm: aiService.getStats()
    };
  }

  /**
   * Ejecutar tarea manual de un agente
   */
  async ejecutarTarea(agenteId, tarea) {
    const agente = this.agentes.get(agenteId);
    if (!agente) {
      throw new Error(`Agente ${agenteId} no encontrado`);
    }

    console.log(`\n▶️  Ejecutando tarea manual: ${agente.nombre}.${tarea}()`);

    const startTime = Date.now();
    try {
      let resultado;
      
      switch (tarea) {
        // Auditor
        case 'detectarAnomaliasConIA':
          resultado = await agente.detectarAnomaliasConIA();
          break;
        case 'analisisPreCierreIA':
          resultado = await agente.analisisPreCierreIA();
          break;
        case 'verificarCierreMensual':
          resultado = await agente.verificarCierreMensual();
          break;
        
        // Analista
        case 'generarBriefingMatutino':
          resultado = await agente.generarBriefingMatutino();
          break;
        case 'generarSnapshotDiario':
          resultado = await agente.generarSnapshotDiario();
          break;
        case 'generarReporteSemanal':
          resultado = await agente.generarReporteSemanal();
          break;
        case 'generarProyeccionMensual':
          resultado = await agente.generarProyeccionMensual();
          break;
        
        // Conciliador
        case 'analizarConciliacionesPendientes':
          resultado = await agente.analizarConciliacionesPendientes();
          break;
        case 'alertarConciliacionesViejas':
          resultado = await agente.alertarConciliacionesViejas();
          break;
        case 'sugerirEmparejamientos':
          resultado = await agente.sugerirEmparejamientos();
          break;
        
        // Maintenance
        case 'limpiarLogsViejos':
          resultado = await agente.limpiarLogsViejos();
          break;
        case 'optimizarBaseDatos':
          resultado = await agente.optimizarBaseDatos();
          break;
        case 'healthCheckSistema':
          resultado = await agente.healthCheckSistema();
          break;
        case 'snapshotArchivo':
          resultado = await agente.snapshotArchivo();
          break;
        
        default:
          throw new Error(`Tarea ${tarea} no reconocida para agente ${agenteId}`);
      }

      const duracion = Date.now() - startTime;
      console.log(`✅ Tarea completada en ${duracion}ms`);
      
      return {
        exito: true,
        agente: agenteId,
        tarea: tarea,
        duracion_ms: duracion,
        resultado: resultado
      };

    } catch (error) {
      console.error(`❌ Error en tarea:`, error);
      throw error;
    }
  }

  /**
   * Health check inicial del sistema
   */
  async healthCheckInicial() {
    console.log('\n🏥 Health Check Inicial...\n');
    
    try {
      // Test de conexión LLM
      const testResponse = await aiService.conversar(
        "Responde únicamente: 'Sistema OK'",
        { modo: 'health_check' }
      );
      
      console.log(`✅ LLM responde: ${testResponse.substring(0, 50)}...`);
      // No loggear health check exitoso - es ruido técnico

    } catch (error) {
      console.error('❌ Health check falló:', error.message);
      await logAgentActivity({
        agente_nombre: 'Orchestrator IA',
        agente_tipo: 'orchestrator',
        agente_version: '2.0.0',
        categoria: 'error_sistema',
        descripcion: `Health check inicial falló: ${error.message}`,
        resultado_status: 'error',
        duracion_ms: 0
      });
      throw error;
    }
  }
}

// Singleton
const orchestrator = new AgentOrchestratorIA();

// Manejo de señales para shutdown limpio
process.on('SIGTERM', () => {
  console.log('\n👋 Recibido SIGTERM, deteniendo agentes...');
  orchestrator.detener();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 Recibido SIGINT, deteniendo agentes...');
  orchestrator.detener();
  process.exit(0);
});

module.exports = orchestrator;

// Si se ejecuta directamente
if (require.main === module) {
  orchestrator.iniciar().catch(error => {
    console.error('Fatal:', error);
    process.exit(1);
  });
}
