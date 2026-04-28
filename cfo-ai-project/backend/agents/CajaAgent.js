/**
 * AGENTE 1: CAJA
 * Proyección de cash flow, runway, burn rate, posición de caja consolidada
 * Compatible con PostgreSQL y SQLite
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

  async actualizarPosicionCaja() {
    const startTime = Date.now();
    try {
      // Compatibilidad PostgreSQL: usa COALESCE para manejar nombre/saldo_actual vs banco/saldo
      const saldos = await db.allAsync(`
        SELECT cb.id, 
               COALESCE(cb.nombre, cb.banco) as nombre, 
               cb.moneda, 
               COALESCE(cb.saldo_actual, cb.saldo, 0) as saldo_actual, 
               cb.numero_cuenta
        FROM cuentas_bancarias cb
        WHERE cb.activa = TRUE OR cb.activa = 1
      `);

      let totalGTQ = 0;
      let totalUSD = 0;
      const tasaCambio = await this.obtenerTipoCambio();

      for (const c of saldos) {
        const saldo = parseFloat(c.saldo_actual) || 0;
        if (c.moneda === 'USD') {
          totalUSD += saldo;
          totalGTQ += saldo * tasaCambio;
        } else {
          totalGTQ += saldo;
        }
      }

      // Cheques emitidos no cobrados (compatibilidad: usa concepto/descripcion)
      const chequesNoCobrados = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'haber' AND (concepto LIKE '%cheque%' OR descripcion LIKE '%cheque%')
        AND estado = 'activa' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      // Proyección 30 días
      const proyeccion = await this.proyectarCashFlow(30, totalGTQ);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'posicion_caja',
        descripcion: `💰 Posición: Q${totalGTQ.toLocaleString()} (USD: $${totalUSD.toLocaleString()}) | Proyección 30d: ${proyeccion.estado}`,
        detalles_json: JSON.stringify({
          total_gtq: totalGTQ, total_usd: totalUSD,
          tasa_cambio: tasaCambio, cuentas: saldos.length,
          cheques_no_cobrados: chequesNoCobrados?.total || 0,
          proyeccion_dias: proyeccion.dias_sobrevivencia
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { totalGTQ, totalUSD, cuentas: saldos.length, proyeccion };
    } catch (err) {
      console.error(`[${this.nombre}] Error posición caja:`, err);
      throw err;
    }
  }

  async proyectarCashFlow(dias = 30, posicionActual = null) {
    const startTime = Date.now();
    try {
      // Entradas esperadas (promedio últimos 30 días)
      const entradas = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      // Salidas esperadas (promedio últimos 30 días)
      const salidas = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const ingresoDiario = (entradas?.total || 0) / 30;
      const gastoDiario = (salidas?.total || 0) / 30;
      const burnRate = gastoDiario - ingresoDiario;

      const posicion = posicionActual || (await this.actualizarPosicionCaja()).totalGTQ;
      const diasSobrevivencia = burnRate > 0 ? Math.floor(posicion / burnRate) : 999;

      // Umbral crítico
      let estado = 'saludable';
      if (diasSobrevivencia <= 7) estado = 'critico';
      else if (diasSobrevivencia <= 30) estado = 'precaucion';

      // Trigger: Si < 30 días
      if (diasSobrevivencia <= 30) {
        await this.crearAlerta('runway_bajo', estado === 'critico' ? 'critical' : 'warning',
          `🚨 Runway: ${diasSobrevivencia} días de efectivo. Burn rate: Q${burnRate.toLocaleString()}/día`,
          { dias: diasSobrevivencia, burn_rate: burnRate, posicion });
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'proyeccion_cashflow',
        descripcion: `📊 Cash flow ${dias}d: ${estado} | Runway ${diasSobrevivencia} días | Burn Q${burnRate.toLocaleString()}/día`,
        detalles_json: JSON.stringify({ dias, burn_rate: burnRate, dias_sobrevivencia: diasSobrevivencia, estado }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { dias, burnRate, diasSobrevivencia, estado, posicion };
    } catch (err) {
      console.error(`[${this.nombre}] Error proyección:`, err);
      throw err;
    }
  }

  async calcularRunwayDetallado() {
    const startTime = Date.now();
    try {
      const posicion = await this.actualizarPosicionCaja();

      // Gastos fijos mensuales (promedio 3 meses)
      const gastosFijos = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
      `);

      const gastoMensual = (gastosFijos?.total || 0) / 3;
      const runwayMeses = posicion.totalGTQ / (gastoMensual || 1);

      // CxC recuperable
      const cxc = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
      `);

      // Runway con cobranza optimista (recuperar 60% de CxC en 30 días)
      const cxcRecuperable = (cxc?.total || 0) * 0.6;
      const runwayOptimista = (posicion.totalGTQ + cxcRecuperable) / (gastoMensual || 1);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'runway_detallado',
        descripcion: `🛫 Runway: ${runwayMeses.toFixed(1)} meses conservador | ${runwayOptimista.toFixed(1)} meses optimista`,
        detalles_json: JSON.stringify({
          runway_meses: runwayMeses, runway_optimista: runwayOptimista,
          gasto_mensual: gastoMensual, cxc_recuperable: cxcRecuperable
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { runwayMeses, runwayOptimista, gastoMensual, cxcRecuperable };
    } catch (err) {
      console.error(`[${this.nombre}] Error runway:`, err);
      throw err;
    }
  }

  // ─── TRIGGERS REACTIVOS ────────────────────────────────────

  async evaluarTriggers() {
    const posicion = await this.actualizarPosicionCaja();

    // Trigger: Sobregiro detectado (posición negativa)
    if (posicion.totalGTQ < 0) {
      await this.crearAlerta('sobregiro', 'critical',
        `🚨 SOBREGIRO: Q${Math.abs(posicion.totalGTQ).toLocaleString()}. Acción inmediata requerida`,
        { posicion: posicion.totalGTQ });
    }

    // Trigger: Cuenta bancaria sin movimientos > 7 días
    const cuentasInactivas = await db.allAsync(`
      SELECT cb.id, COALESCE(cb.nombre, cb.banco) as nombre
      FROM cuentas_bancarias cb
      WHERE cb.activa = TRUE AND cb.id NOT IN (
        SELECT DISTINCT cuenta_bancaria_id 
        FROM movimientos_bancarios 
        WHERE fecha >= CURRENT_DATE - INTERVAL '7 days'
      )
    `);

    for (const c of cuentasInactivas) {
      await this.crearAlerta('cuenta_inactiva', 'info',
        `🏦 Cuenta ${c.nombre} sin movimientos > 7 días`,
        { cuenta_id: c.id });
    }

    // Trigger: Variación tipo de cambio > 2%
    const tasaActual = await this.obtenerTipoCambio();
    const tasaAnterior = await db.getAsync(`
      SELECT datos_json FROM snapshots_financieros 
      WHERE tipo = 'tasa_cambio' 
      ORDER BY fecha DESC LIMIT 1 OFFSET 1
    `);

    if (tasaAnterior) {
      const datos = JSON.parse(tasaAnterior.datos_json || '{}');
      const variacion = Math.abs((tasaActual - datos.tasa) / datos.tasa * 100);
      if (variacion > 2) {
        await this.crearAlerta('variacion_cambio', 'warning',
          `💱 Tipo de cambio varió ${variacion.toFixed(1)}%: ${datos.tasa} → ${tasaActual}`,
          { tasa_anterior: datos.tasa, tasa_actual: tasaActual });
      }
    }

    // Guardar snapshot de tasa
    await db.runAsync(`
      INSERT INTO snapshots_financieros (fecha, tipo, datos_json)
      VALUES (CURRENT_DATE, 'tasa_cambio', ?)
    `, [JSON.stringify({ tasa: tasaActual, fecha: new Date().toISOString() })]);
  }

  // ─── HELPERS ──────────────────────────────────────────────

  async obtenerTipoCambio() {
    // Simulación: BANGUAT ~7.85
    return 7.85;
  }

  async crearAlerta(tipo, nivel, titulo, metadata = {}) {
    await db.runAsync(`
      INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
      VALUES (?, ?, ?, ?, ?, 'activa', NOW())
    `, [tipo, nivel, titulo, titulo, JSON.stringify(metadata)]);
  }

  // ─── SCHEDULER ─────────────────────────────────────────────
  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Iniciando scheduler...`);

    // Cada hora laboral: posición
    this.tareasActivas.push(cron.schedule('0 7-18 * * 1-5', async () => {
      await this.actualizarPosicionCaja();
    }));

    // Diario 6AM: proyección
    this.tareasActivas.push(cron.schedule('0 6 * * *', async () => {
      await this.proyectarCashFlow();
    }));

    // Semanal lunes 6AM: runway detallado
    this.tareasActivas.push(cron.schedule('0 6 * * 1', async () => {
      await this.calcularRunwayDetallado();
    }));

    // Triggers cada 4 horas
    this.tareasActivas.push(cron.schedule('0 */4 * * *', async () => {
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
