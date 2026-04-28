/**
 * CFO AI Core — Orquestador de Agentes v2.0
 * Coordina 4 agentes especializados y genera el Briefing Diario
 * Compatible con PostgreSQL y SQLite
 */

const CajaAgent = require('./CajaAgent');
const AnalisisAgent = require('./AnalisisAgent');
const CobranzaAgent = require('./CobranzaAgent');
const ContabilidadAgent = require('./ContabilidadAgent');
const { logAgentActivity } = require('../src/services/agentLogger');
const db = require('../database/connection');

class CFOAICore {
  constructor() {
    this.agentes = new Map();
    this.estado = 'detenido';
    this.inicioTimestamp = null;
  }

  async ensureTables() {
    try {
      // Asegurar que agentes_logs exista (PostgreSQL-compatible)
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS agentes_logs (
          id SERIAL PRIMARY KEY,
          empresa_id INTEGER DEFAULT 1,
          agente_nombre VARCHAR(255),
          agente_tipo VARCHAR(100),
          agente_version VARCHAR(50) DEFAULT '1.0.0',
          categoria VARCHAR(100),
          descripcion TEXT,
          detalles_json TEXT,
          entidad_tipo VARCHAR(100),
          entidad_id INTEGER,
          impacto_valor DECIMAL(15,2),
          impacto_moneda VARCHAR(10) DEFAULT 'GTQ',
          resultado_status VARCHAR(50) DEFAULT 'exitoso',
          duracion_ms INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Asegurar que alertas_financieras exista
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS alertas_financieras (
          id SERIAL PRIMARY KEY,
          tipo VARCHAR(100) NOT NULL,
          nivel VARCHAR(50),
          titulo TEXT NOT NULL,
          descripcion TEXT,
          monto_afectado DECIMAL(15,2) DEFAULT 0,
          estado VARCHAR(50) DEFAULT 'activa',
          metadata TEXT,
          resuelta_por VARCHAR(255),
          resuelta_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Asegurar que briefings_diarios exista
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS briefings_diarios (
          id SERIAL PRIMARY KEY,
          fecha DATE UNIQUE NOT NULL,
          resumen_ejecutivo TEXT,
          insights_json TEXT,
          alertas_count INTEGER DEFAULT 0,
          estado VARCHAR(50) DEFAULT 'generado',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('[CFO AI Core] ✅ Tablas verificadas');
    } catch (e) {
      console.error('[CFO AI Core] Error creando tablas:', e.message);
    }
  }

  async iniciar() {
    console.log('🤖 ==========================================');
    console.log('🤖 CFO AI Core — Iniciando agentes...');
    console.log('🤖 ==========================================');

    // Asegurar tablas existan antes de iniciar agentes
    await this.ensureTables();

    try {
      const agenteClasses = {
        caja: CajaAgent,
        analisis: AnalisisAgent,
        cobranza: CobranzaAgent,
        contabilidad: ContabilidadAgent
      };

      for (const [key, AgenteClass] of Object.entries(agenteClasses)) {
        console.log(`\n🚀 Iniciando ${AgenteClass.name}...`);
        const agente = new AgenteClass();
        agente.iniciarScheduler();
        this.agentes.set(key, agente);
        console.log(`✅ ${agente.nombre} activo`);
      }

      this.estado = 'activo';
      this.inicioTimestamp = new Date();

      console.log('\n✅ ==========================================');
      console.log('✅ TODOS LOS AGENTES ACTIVOS');
      console.log(`✅ Total: ${this.agentes.size} agentes`);
      console.log('✅ ==========================================\n');

    } catch (error) {
      console.error('❌ Error iniciando agentes:', error);
      await logAgentActivity({
        agente_nombre: 'CFO AI Core',
        agente_tipo: 'orchestrator',
        categoria: 'error_sistema',
        descripcion: `Error iniciando: ${error.message}`,
        resultado_status: 'error',
        duracion_ms: 0
      });
      throw error;
    }
  }

  detener() {
    console.log('\n🛑 Deteniendo CFO AI Core...');
    for (const [key, agente] of this.agentes) {
      console.log(`⏹️  ${key}`);
      agente.detener();
    }
    this.estado = 'detenido';
    console.log('✅ Agentes detenidos');
  }

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
        activo: true
      });
    }

    return {
      estado: this.estado,
      inicio: this.inicioTimestamp,
      tiempo_activo_segundos: tiempoActivo,
      agentes: agentesArray
    };
  }

  /**
 * Generar Briefing Diario — 7:00 AM
   */
  async generarBriefingDiario() {
    const startTime = Date.now();
    try {
      console.log('[CFO AI Core] 🌅 Generando Briefing Diario...');

      const alertas = await db.allAsync(`
        SELECT * FROM alertas_financieras WHERE estado = 'activa' ORDER BY created_at DESC LIMIT 10
      `);

      const prioridad1 = alertas.filter(a => a.nivel === 'critical');
      const prioridad2 = alertas.filter(a => a.nivel === 'warning');

      const lineas = [];
      lineas.push(`Buenos días.`);
      lineas.push(`Tienes ${alertas.length} alertas activas.`);

      if (prioridad1.length > 0) lineas.push(`🚨 ${prioridad1[0].titulo}`);
      if (prioridad2.length > 0) lineas.push(`⚠️ ${prioridad2[0].titulo}`);

      const briefing = lineas.join('\n');

      await db.runAsync(`
        INSERT INTO briefings_diarios (fecha, resumen_ejecutivo, insights_json, estado, created_at)
        VALUES (CURRENT_DATE, ?, ?, 'generado', NOW())
        ON CONFLICT (fecha) DO UPDATE SET
          resumen_ejecutivo = EXCLUDED.resumen_ejecutivo,
          insights_json = EXCLUDED.insights_json,
          estado = 'generado',
          updated_at = NOW()
      `, [briefing, JSON.stringify({ alertas: alertas.length })]);

      await logAgentActivity({
        agente_nombre: 'CFO AI Core',
        agente_tipo: 'orchestrator',
        categoria: 'briefing_diario',
        descripcion: `🌅 Briefing: ${lineas.length} líneas | ${alertas.length} alertas`,
        detalles_json: JSON.stringify({ alertas_p1: prioridad1.length, alertas_p2: prioridad2.length }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      console.log(`[CFO AI Core] ✅ Briefing generado`);
      return { briefing, alertas: alertas.length };
    } catch (err) {
      console.error('[CFO AI Core] ❌ Error briefing:', err);
      throw err;
    }
  }

  async responderPregunta(pregunta) {
    const p = (pregunta || '').toLowerCase();

    if (p.includes('caja') || p.includes('efectivo') || p.includes('runway')) {
      return `💰 Consulta el dashboard de Tesorería para tu posición actual.`;
    }
    if (p.includes('debe') || p.includes('cobrar') || p.includes('moroso')) {
      return `📊 Consulta el dashboard de Cobranza.`;
    }
    if (p.includes('iva') || p.includes('isr') || p.includes('impuesto')) {
      return `📅 Consulta el módulo SAT.`;
    }

    return `🤔 Puedo ayudarte con: Caja, Cobranza, Análisis, Contabilidad.`;
  }

  async obtenerDatosCaja() {
    return { posicion: 0, runway: 0 };
  }

  async obtenerDatosCobranza() {
    return { dso: 0, cxc: 0 };
  }

  async obtenerDatosContabilidad() {
    return { iva: 0, isr: 0 };
  }

  async obtenerDatosAnalisis() {
    return { rentabilidad: [] };
  }

  prioridadDelDia() {
    return 'Revisar dashboard de KPIs.';
  }

  async ejecutarTarea(agenteId, tarea) {
    const agente = this.agentes.get(agenteId);
    if (!agente) throw new Error(`Agente ${agenteId} no encontrado`);

    const startTime = Date.now();
    let resultado;

    switch (tarea) {
      case 'actualizarPosicionCaja': resultado = await agente.actualizarPosicionCaja(); break;
      case 'proyectarCashFlow': resultado = await agente.proyectarCashFlow(); break;
      case 'calcularKPIsDiarios': resultado = await agente.calcularKPIsDiarios(); break;
      case 'analisisSemanal': resultado = await agente.analisisSemanal(); break;
      case 'analisisMensual': resultado = await agente.analisisMensual(); break;
      case 'actualizarAging': resultado = await agente.actualizarAging(); break;
      case 'calcularMetricasCobranza': resultado = await agente.calcularMetricasCobranza(); break;
      case 'importarTransacciones': resultado = await agente.importarTransacciones(); break;
      case 'calcularFiscal': resultado = await agente.calcularFiscal(); break;
      default: throw new Error(`Tarea ${tarea} no reconocida`);
    }

    return { exito: true, agente: agenteId, tarea, duracion_ms: Date.now() - startTime, resultado };
  }
}

const core = new CFOAICore();

process.on('SIGTERM', () => { core.detener(); process.exit(0); });
process.on('SIGINT', () => { core.detener(); process.exit(0); });

module.exports = core;

if (require.main === module) {
  core.iniciar().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}