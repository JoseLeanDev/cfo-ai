/**
 * CFO AI Core 🤖
 * Orquestador central que coordina los 4 agentes especializados:
 * - Caja (tesorería)
 * - Análisis (KPIs, rentabilidad)
 * - Cobranza (CxC, DSO, CCC)
 * - Contabilidad (asientos, cierre, SAT)
 */

const BaseAgent = require('../BaseAgent');
const AgenteCaja = require('../caja/AgenteCaja');
const AgenteAnalisis = require('../analisis/AgenteAnalisis');
const AgenteCobranza = require('../cobranza/AgenteCobranza');
const AgenteContabilidad = require('../contabilidad/AgenteContabilidad');
const db = require('../../../database/connection');

class CFOAICore extends BaseAgent {
  constructor() {
    super('CFO AI Core', 'orchestrator', [
      'coordinarAgentes',
      'ejecutarTarea',
      'generarBriefingDiario',
      'evaluarSistema'
    ]);
    this.version = '2.0.0';
    this.agentes = new Map();
    this.inicializado = false;
  }

  /**
   * Inicializar todos los agentes
   */
  async iniciar() {
    if (this.inicializado) {
      console.log('[CFO AI Core] Ya inicializado');
      return;
    }

    console.log('[CFO AI Core] 🤖 Inicializando sistema multi-agente v2.0...');

    // Crear instancias de agentes
    this.agentes.set('caja', new AgenteCaja());
    this.agentes.set('analisis', new AgenteAnalisis());
    this.agentes.set('cobranza', new AgenteCobranza());
    this.agentes.set('contabilidad', new AgenteContabilidad());

    this.inicializado = true;
    console.log(`[CFO AI Core] ✅ ${this.agentes.size} agentes listos`);
    console.log('  - 💰 Caja: tesorería, cash flow, runway');
    console.log('  - 📊 Análisis: KPIs, rentabilidad, RFM');
    console.log('  - 💵 Cobranza: CxC, DSO, CCC, cobro');
    console.log('  - 📗 Contabilidad: asientos, cierre, SAT');
  }

  /**
   * Ejecutar una tarea específica de un agente
   */
  async ejecutarTarea(agenteId, tareaId, empresaId = 1) {
    if (!this.inicializado) {
      await this.iniciar();
    }

    const agente = this.agentes.get(agenteId);
    if (!agente) {
      throw new Error(`Agente '${agenteId}' no encontrado`);
    }

    console.log(`[CFO AI Core] ▶️ Ejecutando ${agenteId}.${tareaId}()`);
    const startTime = Date.now();

    try {
      const resultado = await agente.process({ tarea: tareaId, empresaId }, {});
      
      // Log del orquestador
      await this.logActividad('tarea_ejecutada',
        `Tarea ${agenteId}.${tareaId} completada`,
        { agenteId, tareaId, tipo: resultado.type },
        null,
        Date.now() - startTime
      );

      return resultado;

    } catch (error) {
      await this.logActividad('tarea_ejecutada',
        `Error en ${agenteId}.${tareaId}: ${error.message}`,
        { agenteId, tareaId, error: error.message },
        null,
        Date.now() - startTime,
        'error'
      );
      throw error;
    }
  }

  /**
   * Generar briefing diario ejecutivo
   */
  async generarBriefingDiario(empresaId = 1) {
    const startTime = Date.now();
    
    console.log('[CFO AI Core] 🌅 Generando Briefing Diario...');

    try {
      // Ejecutar análisis clave
      const resultados = await Promise.allSettled([
        this.ejecutarTarea('caja', 'calcularRunway', empresaId),
        this.ejecutarTarea('analisis', 'calcularKPIsDiarios', empresaId),
        this.ejecutarTarea('cobranza', 'calcularDSO', empresaId),
        this.ejecutarTarea('cobranza', 'actualizarAging', empresaId),
        this.ejecutarTarea('contabilidad', 'verificarObligacionesFiscales', empresaId)
      ]);

      const exitosos = resultados.filter(r => r.status === 'fulfilled');
      const fallidos = resultados.filter(r => r.status === 'rejected');

      // Compilar insights
      const insights = [];
      
      for (const r of exitosos) {
        const data = r.value.data;
        if (data?.nivelRiesgo === 'critico' || data?.nivelRiesgo === 'alto') {
          insights.push(`🚨 ${r.value.content}`);
        }
        if (data?.alertas?.length > 0) {
          insights.push(...data.alertas.map(a => `⚠️ ${a.mensaje || a}`));
        }
      }

      // Guardar briefing
      const briefing = {
        fecha: new Date().toISOString(),
        ejecutados: exitosos.length,
        fallidos: fallidos.length,
        insights,
        detalles: exitosos.map(r => ({
          agente: r.value.agent,
          tipo: r.value.type,
          resumen: r.value.content
        }))
      };

      await db.runAsync(`
        INSERT INTO briefings_diarios (fecha, resumen, insights_json, alertas_count, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [new Date().toISOString().split('T')[0], JSON.stringify(briefing.detalles), JSON.stringify(briefing.insights), insights.length]);

      await this.logActividad('briefing_diario',
        `Briefing generado: ${exitosos.length} agentes, ${insights.length} insights`,
        briefing,
        null,
        Date.now() - startTime
      );

      console.log(`[CFO AI Core] ✅ Briefing listo: ${exitosos.length} agentes, ${insights.length} insights`);
      
      return this.formatResponse(
        `Briefing diario: ${exitosos.length} agentes ejecutados, ${insights.length} insights`,
        'analysis',
        briefing
      );

    } catch (error) {
      await this.logActividad('briefing_diario',
        `Error: ${error.message}`,
        { error: error.message },
        null,
        Date.now() - startTime,
        'error'
      );
      return this.formatResponse(`Error en briefing: ${error.message}`, 'error');
    }
  }

  /**
   * Evaluar estado de todo el sistema
   */
  async evaluarSistema(empresaId = 1) {
    const startTime = Date.now();
    
    try {
      // Logs últimas 24h
      const isPostgres = !!db.pool;
      const dateFilter1 = isPostgres ? "created_at >= NOW() - INTERVAL '1 day'" : "created_at >= datetime('now', '-1 days')";
      const dateFilter7 = isPostgres ? "created_at >= NOW() - INTERVAL '7 days'" : "created_at >= datetime('now', '-7 days')";
      
      const logs24h = await db.allAsync(`
        SELECT agente_tipo, COUNT(*) as count, 
          SUM(CASE WHEN resultado_status = 'error' THEN 1 ELSE 0 END) as errores
        FROM agentes_logs
        WHERE ${dateFilter1}
        GROUP BY agente_tipo
      `);

      // Alertas activas
      const alertas = await db.allAsync(`
        SELECT nivel, COUNT(*) as count
        FROM alertas_financieras
        WHERE ${dateFilter7}
        GROUP BY nivel
      `);

      const estado = {
        agentes: Array.from(this.agentes.keys()),
        logs24h: logs24h,
        alertas: Object.fromEntries(alertas.map(a => [a.nivel, a.count])),
        inicializado: this.inicializado,
        timestamp: new Date().toISOString()
      };

      await this.logActividad('evaluacion_sistema',
        `Sistema evaluado: ${logs24h.length} agentes activos`,
        estado,
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `Sistema evaluado: ${this.agentes.size} agentes`,
        'analysis',
        estado
      );

    } catch (error) {
      return this.formatResponse(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Procesar consulta del usuario (ruteo inteligente)
   */
  async process(input, context) {
    const { query, userId, empresaId = 1 } = input;

    if (!this.inicializado) {
      await this.iniciar();
    }

    // Routing simple por palabras clave
    const q = query?.toLowerCase() || '';
    
    if (q.includes('caja') || q.includes('runway') || q.includes('cash') || q.includes('liquidez')) {
      return await this.ejecutarTarea('caja', 'calcularRunway', empresaId);
    }
    
    if (q.includes('kpi') || q.includes('métrica') || q.includes('rentabilidad') || q.includes('rfm')) {
      return await this.ejecutarTarea('analisis', 'calcularKPIsDiarios', empresaId);
    }
    
    if (q.includes('cobranza') || q.includes('cxc') || q.includes('dso') || q.includes('ccc')) {
      return await this.ejecutarTarea('cobranza', 'actualizarAging', empresaId);
    }
    
    if (q.includes('contabilidad') || q.includes('asiento') || q.includes('sat') || q.includes('fiscal')) {
      return await this.ejecutarTarea('contabilidad', 'verificarObligacionesFiscales', empresaId);
    }

    // Default: ejecutar todos
    return await this.generarBriefingDiario(empresaId);
  }

  /**
   * Obtener estado del sistema
   */
  getEstado() {
    return {
      nombre: this.name,
      version: this.version,
      inicializado: this.inicializado,
      agentes: Array.from(this.agentes.keys()).map(id => ({
        id,
        nombre: this.agentes.get(id)?.name,
        rol: this.agentes.get(id)?.role,
        version: this.agentes.get(id)?.version
      })),
      timestamp: new Date().toISOString()
    };
  }

  detener() {
    this.agentes.clear();
    this.inicializado = false;
    console.log('[CFO AI Core] 🛑 Detenido');
  }

  /**
   * Log de actividad
   */
  async logActividad(categoria, descripcion, detalles, impactoValor, duracionMs, status = 'exitoso') {
    try {
      await db.runAsync(`
        INSERT INTO agentes_logs 
        (empresa_id, agente_nombre, agente_tipo, agente_version, categoria, descripcion, 
         detalles_json, impacto_valor, impacto_moneda, resultado_status, duracion_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        1, this.name, this.role, this.version, categoria, descripcion,
        JSON.stringify(detalles), impactoValor, 'GTQ', status, duracionMs
      ]);
    } catch (e) {
      console.error('[CFOAICore] Error en log:', e.message);
    }
  }
}

// Singleton
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new CFOAICore();
  }
  return instance;
}

module.exports = { CFOAICore, getInstance };
