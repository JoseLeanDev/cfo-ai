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

  async actualizarPosicionCaja() {
    const startTime = Date.now();
    try {
      const saldos = await db.allAsync(`
        SELECT cb.id, 
               COALESCE(cb.nombre, cb.banco) as nombre, 
               cb.moneda, 
               COALESCE(cb.saldo_actual, cb.saldo, 0) as saldo_actual
        FROM cuentas_bancarias cb
        WHERE cb.activa = TRUE
      `);

      let totalGTQ = 0;
      let totalUSD = 0;
      const tasaCambio = 7.85;

      for (const c of saldos) {
        const saldo = parseFloat(c.saldo_actual) || 0;
        if (c.moneda === 'USD') {
          totalUSD += saldo;
          totalGTQ += saldo * tasaCambio;
        } else {
          totalGTQ += saldo;
        }
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'posicion_caja',
        descripcion: `💰 Posición: Q${Math.round(totalGTQ).toLocaleString()} (USD: $${Math.round(totalUSD).toLocaleString()})`,
        detalles_json: JSON.stringify({ total_gtq: totalGTQ, total_usd: totalUSD, cuentas: saldos.length }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { totalGTQ, totalUSD, cuentas: saldos.length };
    } catch (err) {
      console.error(`[${this.nombre}] Error:`, err);
      throw err;
    }
  }

  async proyectarCashFlow(dias = 30) {
    const startTime = Date.now();
    try {
      const entradas = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const salidas = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const ingresoDiario = (entradas?.total || 0) / 30;
      const gastoDiario = (salidas?.total || 0) / 30;
      const burnRate = gastoDiario - ingresoDiario;

      const posicion = (await this.actualizarPosicionCaja()).totalGTQ;
      const diasSobrevivencia = burnRate > 0 ? Math.floor(posicion / burnRate) : 999;

      let estado = 'saludable';
      if (diasSobrevivencia <= 7) estado = 'critico';
      else if (diasSobrevivencia <= 30) estado = 'precaucion';

      if (diasSobrevivencia <= 30) {
        await db.runAsync(`
          INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
          VALUES ('runway_bajo', ?, ?, ?, ?, 'activa', NOW())
        `, [estado === 'critico' ? 'critical' : 'warning',
            `Runway: ${diasSobrevivencia} días`,
            `Burn rate: Q${Math.round(burnRate).toLocaleString()}/día`,
            JSON.stringify({ dias: diasSobrevivencia, burn_rate: burnRate })]);
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'proyeccion_cashflow',
        descripcion: `📊 Cash flow: ${estado} | Runway ${diasSobrevivencia} días | Burn Q${Math.round(burnRate).toLocaleString()}/día`,
        detalles_json: JSON.stringify({ dias, burn_rate: burnRate, dias_sobrevivencia: diasSobrevivencia, estado }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { dias, burnRate, diasSobrevivencia, estado };
    } catch (err) {
      console.error(`[${this.nombre}] Error:`, err);
      throw err;
    }
  }

  async evaluarTriggers() {
    const posicion = await this.actualizarPosicionCaja();
    if (posicion.totalGTQ < 0) {
      await db.runAsync(`
        INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
        VALUES ('sobregiro', 'critical', ?, ?, ?, 'activa', NOW())
      `, ['SOBREGIRO DETECTADO', `Q${Math.abs(posicion.totalGTQ).toLocaleString()}`, JSON.stringify({ posicion: posicion.totalGTQ })]);
    }
  }

  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Scheduler iniciado`);
    this.tareasActivas.push(cron.schedule('0 7-18 * * 1-5', async () => { await this.actualizarPosicionCaja(); }));
    this.tareasActivas.push(cron.schedule('0 6 * * *', async () => { await this.proyectarCashFlow(); }));
    this.tareasActivas.push(cron.schedule('0 */4 * * *', async () => { await this.evaluarTriggers(); }));
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = CajaAgent;
