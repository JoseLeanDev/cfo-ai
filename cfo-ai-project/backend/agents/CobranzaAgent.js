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
          cuenta_id,
          COALESCE(nombre_cliente, 'Cliente ' || cuenta_id) as nombre_cliente,
          SUM(CASE WHEN CURRENT_DATE - fecha <= 0 THEN monto ELSE 0 END) as al_corriente,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 1 AND 30 THEN monto ELSE 0 END) as vencido_1_30,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 31 AND 60 THEN monto ELSE 0 END) as vencido_31_60,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 61 AND 90 THEN monto ELSE 0 END) as vencido_61_90,
          SUM(CASE WHEN CURRENT_DATE - fecha > 90 THEN monto ELSE 0 END) as vencido_90_plus,
          SUM(monto) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND estado = 'activa'
        GROUP BY cuenta_id, nombre_cliente
        ORDER BY total DESC
      `);

      const agingCxP = await db.allAsync(`
        SELECT
          categoria as proveedor,
          SUM(CASE WHEN CURRENT_DATE - fecha <= 0 THEN monto ELSE 0 END) as al_corriente,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 1 AND 30 THEN monto ELSE 0 END) as vencido_1_30,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 31 AND 60 THEN monto ELSE 0 END) as vencido_31_60,
          SUM(CASE WHEN CURRENT_DATE - fecha BETWEEN 61 AND 90 THEN monto ELSE 0 END) as vencido_61_90,
          SUM(CASE WHEN CURRENT_DATE - fecha > 90 THEN monto ELSE 0 END) as vencido_90_plus,
          SUM(monto) as total
        FROM transacciones
        WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY categoria
        ORDER BY total DESC
      `);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'aging_cartera',
        descripcion: `📋 Aging CxC: ${agingCxC.length} clientes | CxP: ${agingCxP.length} proveedores`,
        detalles_json: JSON.stringify({
          cxc_count: agingCxC.length, cxp_count: agingCxP.length,
          vencido_total: agingCxC.reduce((s, c) => s + c.vencido_90_plus, 0)
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { cxc: agingCxC, cxp: agingCxP };
    } catch (err) {
      console.error(`[${this.nombre}] Error aging:`, err);
      throw err;
    }
  }

  async calcularMetricasCobranza() {
    const startTime = Date.now();
    try {
      const ventasPeriodo = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as count
        FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
      `);

      const diasCobro = await db.getAsync(`
        SELECT AVG(CURRENT_DATE - fecha) as promedio_dias
        FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
      `);

      const dso = diasCobro?.promedio_dias || 45;

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'metricas_cobranza',
        descripcion: `📊 Métricas: DSO ${Math.round(dso)} días | Ventas 90d: Q${(ventasPeriodo?.total || 0).toLocaleString()}`,
        detalles_json: JSON.stringify({ dso, ventas_90d: ventasPeriodo?.total, transacciones: ventasPeriodo?.count }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { dso, ventas: ventasPeriodo };
    } catch (err) {
      console.error(`[${this.nombre}] Error métricas:`, err);
      throw err;
    }
  }

  async evaluarTriggers() {
    const deudoresCriticos = await db.allAsync(`
      SELECT COALESCE(nombre_cliente, 'Cliente') as nombre_cliente, monto, CURRENT_DATE - fecha as dias_vencido
      FROM transacciones
      WHERE tipo = 'haber' AND estado = 'activa' AND CURRENT_DATE - fecha > 60
      ORDER BY monto DESC LIMIT 5
    `);

    for (const d of deudoresCriticos) {
      await this.crearAlerta('deudor_critico', 'warning',
        `🔴 ${d.nombre_cliente}: Q${d.monto.toLocaleString()} vencido ${d.dias_vencido} días`,
        { cliente: d.nombre_cliente, monto: d.monto, dias: d.dias_vencido });
    }
  }

  async crearAlerta(tipo, nivel, titulo, metadata = {}) {
    await db.runAsync(`
      INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
      VALUES (?, ?, ?, ?, ?, 'activa', NOW())
    `, [tipo, nivel, titulo, titulo, JSON.stringify(metadata)]);
  }

  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Iniciando scheduler...`);
    this.tareasActivas.push(cron.schedule('0 7-18 * * 1-5', async () => { await this.actualizarAging(); }));
    this.tareasActivas.push(cron.schedule('0 6 * * *', async () => { await this.calcularMetricasCobranza(); }));
    this.tareasActivas.push(cron.schedule('0 */4 * * *', async () => { await this.evaluarTriggers(); }));
    console.log(`[${this.nombre}] ✅ Scheduler iniciado`);
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = CobranzaAgent;
