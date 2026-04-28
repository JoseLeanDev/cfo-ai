/**
 * AGENTE 2: ANÁLISIS
 * KPIs, concentración, rentabilidad, RFM, anomalías, ratios
 * Compatible con PostgreSQL y SQLite
 */
const cron = require('node-cron');
const db = require('../database/connection');
const { logAgentActivity } = require('../src/services/agentLogger');

class AnalisisAgent {
  constructor() {
    this.nombre = 'Análisis';
    this.tipo = 'analisis';
    this.version = '2.0.0';
    this.tareasActivas = [];
  }

  async calcularKPIsDiarios() {
    const startTime = Date.now();
    try {
      const ventasMes = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as transacciones
        FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const gastosMes = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const margen = ventasMes?.total > 0 ? ((ventasMes.total - gastosMes?.total) / ventasMes.total * 100) : 0;
      const ticketPromedio = ventasMes?.transacciones > 0 ? ventasMes.total / ventasMes.transacciones : 0;

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'kpis_diarios',
        descripcion: `📊 KPIs: Ventas mes Q${Math.round(ventasMes?.total || 0).toLocaleString()} | Margen ${margen.toFixed(1)}% | Ticket Q${Math.round(ticketPromedio).toLocaleString()}`,
        detalles_json: JSON.stringify({ ventas_mes: ventasMes?.total, margen, ticket_promedio: ticketPromedio, transacciones: ventasMes?.transacciones }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { ventasMes, margen, ticketPromedio };
    } catch (err) {
      console.error(`[${this.nombre}] Error KPIs:`, err);
      throw err;
    }
  }

  async analisisSemanal() {
    const startTime = Date.now();
    try {
      // Concentración de clientes
      const ventasPorCliente = await db.allAsync(`
        SELECT nombre_cliente, SUM(monto) as ingresos
        FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY nombre_cliente
        ORDER BY ingresos DESC
      `);

      const totalVentas = ventasPorCliente.reduce((s, c) => s + c.ingresos, 0);
      const concentracion = ventasPorCliente.map(c => ({
        ...c,
        pct: totalVentas > 0 ? (c.ingresos / totalVentas * 100).toFixed(1) : 0
      }));

      for (const cc of concentracion.filter(c => parseFloat(c.pct) > 15)) {
        await db.runAsync(`
          INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
          VALUES ('concentracion_cliente', 'warning', ?, ?, ?, 'activa', NOW())
        `, [
          `${cc.nombre_cliente}: ${cc.pct}% de ingresos`,
          `Riesgo de concentración`,
          JSON.stringify({ cliente: cc.nombre_cliente, pct: cc.pct })
        ]);
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'analisis_semanal',
        descripcion: `📈 Análisis semanal: ${concentracion.length} clientes | Top: ${concentracion[0]?.nombre_cliente || 'N/A'} ${concentracion[0]?.pct || 0}%`,
        detalles_json: JSON.stringify({ clientes: concentracion.length, top_pct: concentracion[0]?.pct }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { concentracion };
    } catch (err) {
      console.error(`[${this.nombre}] Error semanal:`, err);
      throw err;
    }
  }

  async analisisMensual() {
    const startTime = Date.now();
    try {
      const tendencias = await db.allAsync(`
        SELECT TO_CHAR(fecha, 'YYYY-MM') as mes, SUM(monto) as ventas
        FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(fecha, 'YYYY-MM')
        ORDER BY mes
      `);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'analisis_mensual',
        descripcion: `📊 Mensual: ${tendencias.length} meses analizados`,
        detalles_json: JSON.stringify({ meses: tendencias.length }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { tendencias };
    } catch (err) {
      console.error(`[${this.nombre}] Error mensual:`, err);
      throw err;
    }
  }

  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Scheduler iniciado`);
    this.tareasActivas.push(cron.schedule('0 5 * * *', async () => { await this.calcularKPIsDiarios(); }));
    this.tareasActivas.push(cron.schedule('0 5 * * 1', async () => { await this.analisisSemanal(); }));
    this.tareasActivas.push(cron.schedule('0 6 1 * *', async () => { await this.analisisMensual(); }));
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = AnalisisAgent;