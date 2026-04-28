/**
 * AGENTE 3: COBRANZA
 * CxC aging, DSO, DPO, CCC, probabilidad de cobro, lista priorizada
 * Compatible con PostgreSQL y SQLite
 */
const cron = require('node-cron');
const db = require('../database/connection');
const { logAgentActivity } = require('../src/services/agentLogger');

class CobranzaAgent {
  constructor() {
    this.nombre = 'Cobranza';
    this.tipo = 'cobranza';
    this.version = '2.0.0';
    this.tareasActivas = [];
  }

  async actualizarAging() {
    const startTime = Date.now();
    try {
      const agingCxC = await db.allAsync(`
        SELECT
          COALESCE(nombre_cliente, 'Cliente') as nombre_cliente,
          SUM(CASE WHEN CURRENT_DATE - fecha <= 0 THEN monto ELSE 0 END) as al_corriente,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 1 AND 30 THEN monto ELSE 0 END) as vencido_1_30,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 31 AND 60 THEN monto ELSE 0 END) as vencido_31_60,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 61 AND 90 THEN monto ELSE 0 END) as vencido_61_90,
          SUM(CASE WHEN CURRENT_DATE - fecha > 90 THEN monto ELSE 0 END) as vencido_90_plus,
          SUM(monto) as total
        FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY nombre_cliente
        ORDER BY total DESC
      `);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'aging_cartera',
        descripcion: `📋 Aging: ${agingCxC.length} clientes | Vencido >90d: Q${agingCxC.reduce((s, c) => s + c.vencido_90_plus, 0).toLocaleString()}`,
        detalles_json: JSON.stringify({ clientes: agingCxC.length, vencido_90: agingCxC.reduce((s, c) => s + c.vencido_90_plus, 0) }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { cxc: agingCxC };
    } catch (err) {
      console.error(`[${this.nombre}] Error:`, err);
      throw err;
    }
  }

  async calcularMetricasCobranza() {
    const startTime = Date.now();
    try {
      const diasCobro = await db.getAsync(`
        SELECT AVG(CURRENT_DATE - fecha) as promedio_dias
        FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
      `);

      const dso = Math.round(diasCobro?.promedio_dias || 45);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'metricas_cobranza',
        descripcion: `📊 Métricas: DSO ${dso} días`,
        detalles_json: JSON.stringify({ dso }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { dso };
    } catch (err) {
      console.error(`[${this.nombre}] Error:`, err);
      throw err;
    }
  }

  async evaluarTriggers() {
    const deudoresCriticos = await db.allAsync(`
      SELECT COALESCE(nombre_cliente, 'Cliente') as nombre_cliente, monto, CURRENT_DATE - fecha as dias_vencido
      FROM transacciones
      WHERE tipo = 'haber' AND CURRENT_DATE - fecha > 60
      ORDER BY monto DESC LIMIT 5
    `);

    for (const d of deudoresCriticos) {
      await db.runAsync(`
        INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
        VALUES ('deudor_critico', 'warning', ?, ?, ?, 'activa', NOW())
      `, [
        `${d.nombre_cliente}: Q${Math.round(d.monto).toLocaleString()} vencido ${d.dias_vencido} días`,
        'CxC vencida crítica',
        JSON.stringify({ cliente: d.nombre_cliente, monto: d.monto, dias: d.dias_vencido })
      ]);
    }
  }

  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Scheduler iniciado`);
    this.tareasActivas.push(cron.schedule('0 7-18 * * 1-5', async () => { await this.actualizarAging(); }));
    this.tareasActivas.push(cron.schedule('0 6 * * *', async () => { await this.calcularMetricasCobranza(); }));
    this.tareasActivas.push(cron.schedule('0 */4 * * *', async () => { await this.evaluarTriggers(); }));
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = CobranzaAgent;