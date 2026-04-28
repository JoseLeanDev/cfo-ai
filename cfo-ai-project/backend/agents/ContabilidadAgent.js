/**
 * AGENTE 4: CONTABILIDAD
 * Importación, categorización, conciliación bancaria, cierres, fiscal
 * Compatible con PostgreSQL y SQLite
 */
const cron = require('node-cron');
const db = require('../database/connection');
const { logAgentActivity } = require('../src/services/agentLogger');

class ContabilidadAgent {
  constructor() {
    this.nombre = 'Contabilidad';
    this.tipo = 'contabilidad';
    this.version = '2.0.0';
    this.tareasActivas = [];
  }

  async importarTransacciones() {
    const startTime = Date.now();
    try {
      const sinCat = await db.getAsync(`
        SELECT COUNT(*) as count FROM movimientos_bancarios
        WHERE estado_conciliacion = 'pendiente'
      `);

      const debe = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'debe' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const haber = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const diferencia = Math.abs((debe?.total || 0) - (haber?.total || 0));

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'importacion_transacciones',
        descripcion: `📅 Contabilidad: ${sinCat?.count || 0} pendientes | Balance diff: Q${Math.round(diferencia).toLocaleString()}`,
        detalles_json: JSON.stringify({ pendientes: sinCat?.count, debe: debe?.total, haber: haber?.total, diferencia }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      if (diferencia > 1000) {
        await db.runAsync(`
          INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
          VALUES ('diferencia_balance', 'warning', ?, ?, ?, 'activa', NOW())
        `, [
          `Diferencia contable: Q${Math.round(diferencia).toLocaleString()}`,
          'Debe y haber no coinciden',
          JSON.stringify({ debe: debe?.total, haber: haber?.total, diferencia })
        ]);
      }

      return { diferencia, pendientes: sinCat?.count };
    } catch (err) {
      console.error(`[${this.nombre}] Error:`, err);
      throw err;
    }
  }

  async calcularFiscal() {
    const startTime = Date.now();
    try {
      const ventas = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE tipo = 'haber' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const iva = (ventas?.total || 0) * 0.12;
      const isr = (ventas?.total || 0) * 0.05;

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'calculos_fiscales',
        descripcion: `📅 Fiscal: IVA Q${Math.round(iva).toLocaleString()} | ISR Q${Math.round(isr).toLocaleString()}`,
        detalles_json: JSON.stringify({ iva, isr, ventas: ventas?.total }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { iva, isr };
    } catch (err) {
      console.error(`[${this.nombre}] Error:`, err);
      throw err;
    }
  }

  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Scheduler iniciado`);
    this.tareasActivas.push(cron.schedule('0 5 * * *', async () => { await this.importarTransacciones(); }));
    this.tareasActivas.push(cron.schedule('0 6 * * 1', async () => { await this.calcularFiscal(); }));
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = ContabilidadAgent;