/**
 * AGENTE 1: CAJA
 * Proyección de cash flow, runway, burn rate, posición de caja consolidada
 */
const cron = require('node-cron');
const db = require('../database/connection');
const { logAgentActivity } = require('../src/services/agentLogger');

class CajaAgent {
  constructor() {
    this.nombre = 'Caja';
    this.tipo = 'caja';
    this.version = '2.0.0';
    this.tareasActivas = [];
  }

  // ─── ACCIONES PROGRAMADAS ─────────────────────────────────

  /**
   * Cada hora (7AM-6PM): Consolidar saldos y calcular posición neta
   */
  async actualizarPosicionCaja() {
    const startTime = Date.now();
    try {
      const saldos = await db.allAsync(`
        SELECT cb.id, cb.nombre, cb.moneda, cb.saldo_actual, cb.numero_cuenta
        FROM cuentas_bancarias cb
        WHERE cb.activa = 1
      `);

      let totalGTQ = 0;
      let totalUSD = 0;
      const tasaCambio = await this.obtenerTipoCambio();

      for (const c of saldos) {
        if (c.moneda === 'USD') {
          totalUSD += c.saldo_actual || 0;
          totalGTQ += (c.saldo_actual || 0) * tasaCambio;
        } else {
          totalGTQ += c.saldo_actual || 0;
        }
      }

      // Cheques emitidos no cobrados
      const chequesNoCobrados = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'haber' AND descripcion LIKE '%cheque%'
        AND estado = 'activo' AND fecha >= date('now', '-30 days')
      `);

      // Pagos programados próximas 48h
      const pagosProgramados = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'debe' AND fecha BETWEEN date('now') AND date('now', '+2 days')
      `);

      const posicionNeta = totalGTQ - (chequesNoCobrados?.total || 0) - (pagosProgramados?.total || 0);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'posicion_caja',
        descripcion: `💰 Posición de caja: GTQ ${totalGTQ.toLocaleString()} (USD ${totalUSD.toLocaleString()} @ Q${tasaCambio}) | Neta: GTQ ${posicionNeta.toLocaleString()}`,
        detalles_json: JSON.stringify({
          gtq: totalGTQ, usd: totalUSD, tasa_cambio: tasaCambio,
          cheques_pendientes: chequesNoCobrados?.total || 0,
          pagos_48h: pagosProgramados?.total || 0,
          posicion_neta: posicionNeta
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { gtq: totalGTQ, usd: totalUSD, neta: posicionNeta, tasa: tasaCambio };
    } catch (err) {
      console.error(`[${this.nombre}] Error posición caja:`, err);
      throw err;
    }
  }

  /**
   * Diario 6:00 AM: Proyección de cash flow a 13 semanas (3 escenarios)
   */
  async proyectarCashFlow() {
    const startTime = Date.now();
    try {
      const posicionActual = await this.actualizarPosicionCaja();

      // Historial últimas 4 semanas para proyecciones
      const historialVentas = await db.allAsync(`
        SELECT strftime('%Y-%W', fecha) as semana,
               SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as ventas
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
          AND fecha >= date('now', '-28 days')
        GROUP BY semana
      `);

      const promedioVentas = historialVentas.reduce((s, h) => s + h.ventas, 0) / (historialVentas.length || 1);

      // Egresos fijos/semifijos
      const egresosFijos = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'debe'
          AND categoria IN ('nomina', 'alquiler', 'servicios', 'prestamo')
          AND fecha >= date('now', '-30 days')
      `);

      // CxC con probabilidad de cobro
      const cxc = await db.allAsync(`
        SELECT cliente_id, nombre_cliente,
               SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as monto,
               julianday('now') - julianday(MIN(fecha)) as dias_vencido
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND estado = 'activo'
        GROUP BY cliente_id
      `);

      const burnRate = (egresosFijos?.total || 0) / 30 * 7; // semanal
      const runway = posicionActual.neta / ((egresosFijos?.total || 1) / 30);

      // 3 escenarios
      const escenarios = [];
      for (let sem = 1; sem <= 13; sem++) {
        const semanaId = sem;

        // Optimista: cobra 80% CxC + ventas +10%
        const ingresoOpt = promedioVentas * 1.10 + cxc.reduce((s, c) => s + (c.monto * 0.80), 0) / 13;
        const saldoOpt = posicionActual.neta + (ingresoOpt - burnRate) * sem;

        // Base: cobra al ritmo actual + ventas promedio
        const ingresoBase = promedioVentas + cxc.reduce((s, c) => s + (c.monto * this.probabilidadCobro(c.dias_vencido)), 0) / 13;
        const saldoBase = posicionActual.neta + (ingresoBase - burnRate) * sem;

        // Pesimista: cobra 50% + ventas -15%
        const ingresoPes = promedioVentas * 0.85 + cxc.reduce((s, c) => s + (c.monto * 0.50), 0) / 13;
        const saldoPes = posicionActual.neta + (ingresoPes - burnRate) * sem;

        escenarios.push({
          semana: semanaId,
          optimista: Math.round(saldoOpt),
          base: Math.round(saldoBase),
          pesimista: Math.round(saldoPes),
          semana_critica: saldoBase < 0
        });
      }

      const semanaCritica = escenarios.find(e => e.semana_critica);

      // Guardar proyección
      await db.runAsync(`
        INSERT INTO snapshots_financieros (fecha, tipo, datos_json, created_at)
        VALUES (date('now'), 'cashflow_13s', ?, datetime('now'))
      `, [JSON.stringify({ escenarios, burn_rate_semanal: burnRate, runway_dias: runway })]);

      // Triggers reactivos
      if (semanaCritica) {
        await this.crearAlerta('sobregiro_inminente', 'critical',
          `⚠️ Sobregiro proyectado en semana ${semanaCritica.semana}`,
          { semana: semanaCritica.semana, saldo: semanaCritica.pesimista });
      }

      // Concentración de egresos
      const egresosPorSemana = egresosFijos?.total ? [(egresosFijos.total / 30 * 7), (egresosFijos.total / 30 * 7), (egresosFijos.total / 30 * 7), (egresosFijos.total / 30 * 7)] : [0, 0, 0, 0];
      const maxEgreso = Math.max(...egresosPorSemana);
      if (maxEgreso > (egresosFijos?.total || 0) / 30 * 7 * 1.4) {
        await this.crearAlerta('concentracion_egresos', 'warning',
          'Concentración de pagos detectada en una semana',
          { max_egreso: maxEgreso });
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'proyeccion_cashflow',
        descripcion: `📊 Proyección 13 semanas: Runway ${runway.toFixed(1)} días | Burn rate Q${burnRate.toLocaleString()}/sem | Semana crítica: ${semanaCritica ? 'S' + semanaCritica.semana : 'Ninguna'}`,
        detalles_json: JSON.stringify({ escenarios: escenarios.slice(0, 4), runway, burn_rate: burnRate }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { escenarios, runway, burnRate, posicionActual };
    } catch (err) {
      console.error(`[${this.nombre}] Error proyección:`, err);
      throw err;
    }
  }

  // ─── TRIGGERS REACTIVOS ────────────────────────────────────

  async evaluarTriggers() {
    const posicion = await this.actualizarPosicionCaja();
    const proyeccion = await this.proyectarCashFlow();

    // Trigger: Saldo bajo
    const umbralMinimo = 1500000; // configurable por cliente
    if (posicion.neta < umbralMinimo) {
      await this.crearAlerta('saldo_bajo', 'warning',
        `💰 Posición de caja baja: Q${posicion.neta.toLocaleString()} (umbral: Q${umbralMinimo.toLocaleString()})`,
        { acciones: ['Acelerar cobranza', 'Postergar pagos no críticos', 'Negociar línea de crédito'] });
    }

    // Trigger: Oportunidad de inversión
    const promedio13s = proyeccion.escenarios.reduce((s, e) => s + e.base, 0) / 13;
    if (promedio13s > umbralMinimo * 3 && promedio13s > umbralMinimo * 3) {
      await this.crearAlerta('excedente_caja', 'info',
        '💡 Excedente de caja proyectado por 4+ semanas. Considera inversión a corto plazo o pago anticipado con descuento',
        { excedente: promedio13s - umbralMinimo });
    }

    // Trigger: Variación tipo de cambio
    const tasaAnterior = await db.getAsync(`
        SELECT datos_json FROM snapshots_financieros WHERE tipo = 'tasa_cambio' ORDER BY fecha DESC LIMIT 1 OFFSET 1
      `);
    if (tasaAnterior) {
      const tasaActual = await this.obtenerTipoCambio();
      const datos = JSON.parse(tasaAnterior.datos_json || '{}');
      if (Math.abs(tasaActual - datos.tasa) / datos.tasa > 0.01) {
        await this.crearAlerta('tipo_cambio', 'info',
          `💱 Tipo de cambio varió >1%: Q${tasaActual} (promedio 30d: Q${datos.tasa})`,
          { impacto: 'Revisa posición consolidada USD' });
      }
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────

  async obtenerTipoCambio() {
    // En producción: llamar API de BANGUAT
    // Por ahora: devolver valor fijo o leer de última snapshot
    const ultima = await db.getAsync(`
      SELECT datos_json FROM snapshots_financieros WHERE tipo = 'tasa_cambio' ORDER BY fecha DESC LIMIT 1
    `);
    if (ultima) {
      const d = JSON.parse(ultima.datos_json || '{}');
      return d.tasa || 7.85;
    }
    return 7.85;
  }

  probabilidadCobro(diasVencido) {
    if (diasVencido <= 0) return 0.95;
    if (diasVencido <= 30) return 0.85;
    if (diasVencido <= 60) return 0.70;
    if (diasVencido <= 90) return 0.50;
    return 0.25;
  }

  async crearAlerta(tipo, nivel, titulo, metadata = {}) {
    await db.runAsync(`
      INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
      VALUES (?, ?, ?, ?, ?, 'activa', datetime('now'))
    `, [tipo, nivel, titulo, titulo, JSON.stringify(metadata)]);
  }

  // ─── SCHEDULER ─────────────────────────────────────────────
  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Iniciando scheduler...`);

    // Cada hora laboral: posición de caja
    this.tareasActivas.push(cron.schedule('0 7-18 * * 1-5', async () => {
      await this.actualizarPosicionCaja();
    }));

    // Diario 6:00 AM: proyección cash flow
    this.tareasActivas.push(cron.schedule('0 6 * * *', async () => {
      await this.proyectarCashFlow();
    }));

    // Diario 6:30 AM: evaluar triggers
    this.tareasActivas.push(cron.schedule('30 6 * * *', async () => {
      await this.evaluarTriggers();
    }));

    console.log(`[${this.nombre}] ✅ Scheduler iniciado`);
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = CajaAgent;
