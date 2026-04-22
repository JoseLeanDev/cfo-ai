/**
 * CFO AI Core — Orquestador de Agentes
 * Coordina 4 agentes especializados y genera el Briefing Diario
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

  async iniciar() {
    console.log('🤖 ==========================================');
    console.log('🤖 CFO AI Core — Iniciando agentes...');
    console.log('🤖 ==========================================');

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
   * Recopila de los 4 agentes y genera resumen ejecutivo
   */
  async generarBriefingDiario() {
    const startTime = Date.now();
    try {
      console.log('[CFO AI Core] 🌅 Generando Briefing Diario...');

      // Recopilar datos de cada agente
      const caja = await this.obtenerDatosCaja();
      const cobranza = await this.obtenerDatosCobranza();
      const contabilidad = await this.obtenerDatosContabilidad();
      const analisis = await this.obtenerDatosAnalisis();

      // Alertas activas
      const alertas = await db.allAsync(`
        SELECT * FROM alertas_financieras WHERE estado = 'activa' ORDER BY created_at DESC LIMIT 10
      `);

      // Priorizar alertas
      const prioridad1 = alertas.filter(a => a.nivel === 'critical');
      const prioridad2 = alertas.filter(a => a.nivel === 'warning');
      const prioridad3 = alertas.filter(a => a.nivel === 'info');

      // Generar texto del briefing (máx 7 líneas)
      const lineas = [];
      lineas.push(`Buenos días.`);
      lineas.push(`Hoy tienes Q${(caja.posicion || 0).toLocaleString()} disponibles (${caja.runway?.toFixed(1) || 0} días de operación).`);

      if (prioridad1.length > 0) {
        lineas.push(`🚨 ${prioridad1[0].titulo}`);
      }
      if (prioridad2.length > 0) {
        lineas.push(`⚠️ ${prioridad2[0].titulo}`);
      }
      lineas.push(`Tu prioridad hoy: ${this.prioridadDelDia(caja, cobranza, contabilidad)}`);

      const briefing = lineas.join('\n');

      // Guardar
      await db.runAsync(`
        INSERT INTO briefings_diarios (fecha, resumen_ejecutivo, datos_json, estado, created_at)
        VALUES (date('now'), ?, ?, 'enviado', datetime('now'))
      `, [briefing, JSON.stringify({ caja, cobranza, contabilidad, analisis, alertas })]);

      await logAgentActivity({
        agente_nombre: 'CFO AI Core',
        agente_tipo: 'orchestrator',
        categoria: 'briefing_diario',
        descripcion: `🌅 Briefing generado: ${lineas.length} líneas | ${alertas.length} alertas activas`,
        detalles_json: JSON.stringify({
          alertas_p1: prioridad1.length,
          alertas_p2: prioridad2.length,
          alertas_p3: prioridad3.length
        }),
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

  /**
   * Chat conversacional — recibe pregunta y rutea al agente
   */
  async responderPregunta(pregunta) {
    const p = (pregunta || '').toLowerCase();

    // Ruteo por palabras clave
    if (p.includes('caja') || p.includes('efectivo') || p.includes('runway') || p.includes('burn')) {
      const datos = await this.obtenerDatosCaja();
      return `💰 Posición de caja: Q${(datos.posicion || 0).toLocaleString()}. Runway: ${datos.runway?.toFixed(1) || 0} días.`;
    }

    if (p.includes('cliente') && (p.includes('rentable') || p.includes('mejor'))) {
      const datos = await this.obtenerDatosAnalisis();
      const top = datos.rentabilidad?.[0];
      return top ? `🏆 Cliente más rentable: ${top.nombre_cliente} con margen ${top.margen?.toFixed(1) || 0}%` : 'No hay datos suficientes.';
    }

    if (p.includes('debe') || p.includes('cobrar') || p.includes('moroso') || p.includes('dso')) {
      const datos = await this.obtenerDatosCobranza();
      return `📊 DSO: ${datos.dso?.toFixed(0) || 0} días | CxC total: Q${(datos.cxc || 0).toLocaleString()} | Top deudor: ${datos.topDeudor || 'N/A'}`;
    }

    if (p.includes('iva') || p.includes('isr') || p.includes('impuesto') || p.includes('sat')) {
      const datos = await this.obtenerDatosContabilidad();
      return `📅 IVA estimado: Q${(datos.iva || 0).toLocaleString()} | ISR: Q${(datos.isr || 0).toLocaleString()}`;
    }

    if (p.includes('puedo pagar') || p.includes('si pago')) {
      // Simulador simple
      const montoMatch = pregunta.match(/Q?\s*([\d,.]+)/);
      const monto = montoMatch ? parseFloat(montoMatch[1].replace(/,/g, '')) : 0;
      const datos = await this.obtenerDatosCaja();
      const puede = (datos.posicion || 0) > monto;
      return puede
        ? `✅ Sí, puedes pagar Q${monto.toLocaleString()}. Te quedarían Q${(datos.posicion - monto).toLocaleString()}.`
        : `❌ No recomendado. Quedarías con Q${(datos.posicion - monto).toLocaleString()}. Runway se reduce a ${((datos.posicion - monto) / (datos.burnRate || 1) * 30).toFixed(0)} días.`;
    }

    if (p.includes('reporte') && p.includes('banco')) {
      return '📄 Para generar reporte para el banco, necesito saber: ¿qué banco y para qué producto (crédito, tarjeta, etc.)?';
    }

    return `🤔 No entendí completamente. Puedo ayudarte con:
• 💰 "¿Cuánto tengo?" (Caja)
• 📊 "¿Quién me debe más?" (Cobranza)
• 🏆 "¿Cuál es mi cliente más rentable?" (Análisis)
• 📅 "¿Cuánto voy a pagar de IVA?" (Contabilidad)
• ✅ "¿Puedo pagar Q50,000?" (Simulador)`;
  }

  // ─── HELPERS: Obtener datos de cada agente ─────────────────

  async obtenerDatosCaja() {
    const posicion = await db.getAsync(`
      SELECT datos_json FROM snapshots_financieros WHERE tipo = 'posicion_caja' ORDER BY fecha DESC LIMIT 1
    `);
    const cashflow = await db.getAsync(`
      SELECT datos_json FROM snapshots_financieros WHERE tipo = 'cashflow_13s' ORDER BY fecha DESC LIMIT 1
    `);
    const pos = JSON.parse(posicion?.datos_json || '{}');
    const cf = JSON.parse(cashflow?.datos_json || '{}');
    return {
      posicion: pos.neta || 0,
      runway: cf.runway_dias ? cf.runway_dias / 30 : 0, // convertir a meses
      burnRate: cf.burn_rate_semanal ? cf.burn_rate_semanal * 4.33 : 0
    };
  }

  async obtenerDatosCobranza() {
    const metrics = await db.getAsync(`
      SELECT datos_json FROM snapshots_financieros WHERE tipo = 'metricas_cobranza' ORDER BY fecha DESC LIMIT 1
    `);
    const datos = JSON.parse(metrics?.datos_json || '{}');
    const top = datos.lista_cobranza?.[0];
    return {
      dso: datos.dso,
      cxc: datos.cxc_total || 0,
      topDeudor: top?.nombre_cliente
    };
  }

  async obtenerDatosContabilidad() {
    const fiscal = await db.getAsync(`
      SELECT datos_json FROM snapshots_financieros WHERE tipo = 'calculos_fiscales' ORDER BY fecha DESC LIMIT 1
    `);
    const datos = JSON.parse(fiscal?.datos_json || '{}');
    return {
      iva: datos.iva,
      isr: datos.isr,
      iso: datos.iso
    };
  }

  async obtenerDatosAnalisis() {
    const rentabilidad = await db.allAsync(`
      SELECT cliente_id, nombre_cliente,
        SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END) as costos
      FROM transacciones
      WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
        AND fecha >= date('now', '-90 days')
      GROUP BY cliente_id
      ORDER BY (ingresos - costos) DESC
      LIMIT 5
    `);
    return {
      rentabilidad: rentabilidad.map(r => ({
        ...r,
        margen: r.ingresos > 0 ? ((r.ingresos - r.costos) / r.ingresos * 100) : 0
      }))
    };
  }

  prioridadDelDia(caja, cobranza, contabilidad) {
    if (cobranza.dso > 45) return 'Cobrar cuentas vencidas. DSO está alto.';
    if (caja.runway < 3) return 'Asegurar liquidez. Runway crítico.';
    if (contabilidad.iva > 0 && new Date().getDate() > 25) return 'Preparar pago de IVA.';
    return 'Revisar dashboard de KPIs. Todo está estable.';
  }

  async ejecutarTarea(agenteId, tarea) {
    const agente = this.agentes.get(agenteId);
    if (!agente) throw new Error(`Agente ${agenteId} no encontrado`);

    const startTime = Date.now();
    let resultado;

    switch (tarea) {
      // Caja
      case 'actualizarPosicionCaja': resultado = await agente.actualizarPosicionCaja(); break;
      case 'proyectarCashFlow': resultado = await agente.proyectarCashFlow(); break;
      // Análisis
      case 'calcularKPIsDiarios': resultado = await agente.calcularKPIsDiarios(); break;
      case 'analisisSemanal': resultado = await agente.analisisSemanal(); break;
      case 'analisisMensual': resultado = await agente.analisisMensual(); break;
      // Cobranza
      case 'actualizarAging': resultado = await agente.actualizarAging(); break;
      case 'calcularMetricasCobranza': resultado = await agente.calcularMetricasCobranza(); break;
      // Contabilidad
      case 'importarTransacciones': resultado = await agente.importarTransacciones(); break;
      case 'preConciliacionBancaria': resultado = await agente.preConciliacionBancaria(); break;
      case 'ejecutarCierreMensual': resultado = await agente.ejecutarCierreMensual(); break;
      case 'calcularFiscal': resultado = await agente.calcularFiscal(); break;
      default: throw new Error(`Tarea ${tarea} no reconocida`);
    }

    return {
      exito: true,
      agente: agenteId,
      tarea,
      duracion_ms: Date.now() - startTime,
      resultado
    };
  }
}

// Singleton
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
