/**
 * AGENTE 2: ANÁLISIS
 * KPIs, concentración, rentabilidad, RFM, anomalías, ratios
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

  // ─── ACCIONES PROGRAMADAS ─────────────────────────────────

  /**
   * Diario 5:00 AM: KPIs del día anterior
   */
  async calcularKPIsDiarios() {
    const startTime = Date.now();
    try {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split('T')[0];

      // Ventas del día
      const ventasDia = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as transacciones
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
          AND DATE(fecha) = ?
      `, [fechaAyer]);

      // Ventas semana y mes
      const ventasPeriodo = await db.getAsync(`
        SELECT
          COALESCE(SUM(CASE WHEN fecha >= date('now', '-7 days') THEN monto ELSE 0 END), 0) as semana,
          COALESCE(SUM(CASE WHEN fecha >= date('now', '-30 days') THEN monto ELSE 0 END), 0) as mes
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
      `);

      // Ticket promedio
      const ticketPromedio = ventasDia.transacciones > 0 ? ventasDia.total / ventasDia.transacciones : 0;

      // Margen bruto (ventas - costo de ventas)
      const costoVentas = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '51%')
          AND fecha >= date('now', '-30 days')
      `);

      const margenBruto = ventasPeriodo.mes > 0 ? ((ventasPeriodo.mes - costoVentas.total) / ventasPeriodo.mes * 100) : 0;

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'kpis_diarios',
        descripcion: `📊 KPIs: Ventas día Q${ventasDia.total.toLocaleString()} | Semana Q${ventasPeriodo.semana.toLocaleString()} | Mes Q${ventasPeriodo.mes.toLocaleString()} | Margen bruto ${margenBruto.toFixed(1)}%`,
        detalles_json: JSON.stringify({
          ventas_dia: ventasDia.total, ventas_semana: ventasPeriodo.semana,
          ventas_mes: ventasPeriodo.mes, ticket_promedio: ticketPromedio, margen_bruto: margenBruto
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { ventasDia, ventasPeriodo, margenBruto, ticketPromedio };
    } catch (err) {
      console.error(`[${this.nombre}] Error KPIs:`, err);
      throw err;
    }
  }

  /**
   * Semanal (lunes 5:00 AM): Análisis de concentración, rentabilidad, anomalías
   */
  async analisisSemanal() {
    const startTime = Date.now();
    try {
      // ─── 1. Concentración de clientes ──────────────────────
      const ventasPorCliente = await db.allAsync(`
        SELECT cliente_id, nombre_cliente,
               SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as ingresos
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
          AND fecha >= date('now', '-90 days')
        GROUP BY cliente_id
        ORDER BY ingresos DESC
      `);

      const totalVentas = ventasPorCliente.reduce((s, c) => s + c.ingresos, 0);
      const concentracion = ventasPorCliente.map(c => ({
        ...c,
        pct: totalVentas > 0 ? (c.ingresos / totalVentas * 100).toFixed(1) : 0
      }));

      // Alerta: cliente > 15%
      const clientesCriticos = concentracion.filter(c => parseFloat(c.pct) > 15);
      for (const cc of clientesCriticos) {
        // Simular impacto de perder este cliente
        const impacto = totalVentas * (parseFloat(cc.pct) / 100);
        await this.crearAlerta('concentracion_cliente', 'warning',
          `⚠️ ${cc.nombre_cliente} representa ${cc.pct}% de ingresos. Perderlo = -Q${impacto.toLocaleString()}/trimestre`,
          { cliente: cc.nombre_cliente, pct: cc.pct, impacto });
      }

      // ─── 2. Rentabilidad por línea de producto ───────────────
      const lineas = await db.allAsync(`
        SELECT categoria as linea,
               SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as ventas,
               SUM(CASE WHEN tipo = 'debe' AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '51%') THEN monto ELSE 0 END) as costo
        FROM transacciones
        WHERE fecha >= date('now', '-90 days')
        GROUP BY categoria
        ORDER BY ventas DESC
      `);

      for (const l of lineas) {
        const margen = l.ventas > 0 ? ((l.ventas - l.costo) / l.ventas * 100) : 0;
        // Punto de equilibrio simplificado (asumiendo gastos fijos distribuidos)
        const gastosFijos = l.ventas * 0.15; // estimación
        const puntoEquilibrio = l.ventas > 0 ? (gastosFijos / (margen / 100)) : 0;
        const margenSeguridad = l.ventas > 0 ? ((l.ventas - puntoEquilibrio) / l.ventas * 100) : 0;

        if (margenSeguridad < 5 && margenSeguridad > 0) {
          await this.crearAlerta('linea_no_rentable', 'warning',
            `📉 Línea "${l.linea}" margen de seguridad ${margenSeguridad.toFixed(1)}%. Evaluar subir precios o descontinuar`,
            { linea: l.linea, margen, margen_seguridad: margenSeguridad });
        }
      }

      // ─── 3. Detección de anomalías en gastos ────────────────
      const gastosCategorias = await db.allAsync(`
        SELECT categoria,
               SUM(monto) as total_mes,
               (SELECT AVG(monto) FROM transacciones t2
                WHERE t2.categoria = transacciones.categoria
                  AND t2.fecha >= date('now', '-90 days')
                  AND t2.fecha < date('now', '-30 days')) as promedio_meses_anteriores
        FROM transacciones
        WHERE tipo = 'debe' AND fecha >= date('now', '-30 days')
        GROUP BY categoria
      `);

      for (const g of gastosCategorias) {
        const variacion = g.promedio_meses_anteriores > 0
          ? ((g.total_mes - g.promedio_meses_anteriores) / g.promedio_meses_anteriores * 100)
          : 0;
        if (Math.abs(variacion) > 20) {
          await this.crearAlerta('anomalia_gasto', variacion > 50 ? 'warning' : 'info',
            `📈 Gasto "${g.categoria}" varió ${variacion > 0 ? '+' : ''}${variacion.toFixed(0)}% vs promedio 3 meses`,
            { categoria: g.categoria, variacion, actual: g.total_mes, promedio: g.promedio_meses_anteriores });
        }
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'analisis_semanal',
        descripcion: `📈 Análisis semanal: ${concentracion.length} clientes | ${lineas.length} líneas | ${gastosCategorias.length} categorías de gasto revisadas`,
        detalles_json: JSON.stringify({
          top_cliente_pct: concentracion[0]?.pct || 0,
          clientes_criticos: clientesCriticos.length,
          lineas_analizadas: lineas.length
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { concentracion, lineas, gastosCategorias };
    } catch (err) {
      console.error(`[${this.nombre}] Error análisis semanal:`, err);
      throw err;
    }
  }

  /**
   * Mensual (día 1, 6:00 AM): Tendencias, ratios, RFM, presupuesto
   */
  async analisisMensual() {
    const startTime = Date.now();
    try {
      // ─── 1. Tendencias 12 meses ─────────────────────────────
      const tendencias = await db.allAsync(`
        SELECT strftime('%Y-%m', fecha) as mes,
               SUM(CASE WHEN tipo = 'haber' AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%') THEN monto ELSE 0 END) as ventas,
               SUM(CASE WHEN tipo = 'debe' AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '5%') THEN monto ELSE 0 END) as gastos
        FROM transacciones
        WHERE fecha >= date('now', '-12 months')
        GROUP BY mes
        ORDER BY mes
      `);

      // Detectar estacionalidad
      const mesesFuertes = tendencias.filter(t => t.ventas > 0);
      const promedioVentas = mesesFuertes.reduce((s, m) => s + m.ventas, 0) / mesesFuertes.length;
      const mesesDebiles = mesesFuertes.filter(m => m.ventas < promedioVentas * 0.85);

      // ─── 2. Ratios financieros ─────────────────────────────
      const activos = await db.getAsync(`
        SELECT COALESCE(SUM(saldo_actual), 0) as total
        FROM saldos_cuentas
        WHERE periodo = strftime('%Y-%m', 'now')
          AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE tipo = 'activo')
      `);

      const pasivos = await db.getAsync(`
        SELECT COALESCE(SUM(saldo_actual), 0) as total
        FROM saldos_cuentas
        WHERE periodo = strftime('%Y-%m', 'now')
          AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE tipo = 'pasivo')
      `);

      const patrimonio = (activos?.total || 0) - (pasivos?.total || 0);
      const liquidezCorriente = pasivos?.total > 0 ? (activos?.total / pasivos?.total) : 0;

      // ─── 3. Segmentación RFM ────────────────────────────────
      const rfm = await db.allAsync(`
        SELECT cliente_id, nombre_cliente,
          julianday('now') - julianday(MAX(fecha)) as recencia_dias,
          COUNT(DISTINCT DATE(fecha)) as frecuencia,
          SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as valor_monetario
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
          AND fecha >= date('now', '-12 months')
        GROUP BY cliente_id
        HAVING valor_monetario > 0
      `);

      const segmentos = rfm.map(c => {
        let segmento = 'Nuevos';
        if (c.recencia_dias <= 30 && c.frecuencia >= 4 && c.valor_monetario > 100000) segmento = 'Champions';
        else if (c.recencia_dias <= 60 && c.frecuencia >= 3) segmento = 'Leales';
        else if (c.recencia_dias > 90 && c.frecuencia >= 2) segmento = 'En Riesgo';
        else if (c.recencia_dias > 180) segmento = 'Perdidos';
        return { ...c, segmento };
      });

      const enRiesgo = segmentos.filter(s => s.segmento === 'En Riesgo' || s.segmento === 'Perdidos');
      if (enRiesgo.length > 0) {
        await this.crearAlerta('clientes_riesgo', 'warning',
          `🚨 ${enRiesgo.length} clientes en riesgo/perdidos. Valor: Q${enRiesgo.reduce((s, c) => s + c.valor_monetario, 0).toLocaleString()}`,
          { clientes: enRiesgo.map(c => c.nombre_cliente).slice(0, 5) });
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'analisis_mensual',
        descripcion: `📊 Mensual: ${tendencias.length} meses analizados | Liquidez: ${liquidezCorriente.toFixed(2)} | ${segmentos.length} clientes segmentados (RFM)`,
        detalles_json: JSON.stringify({
          tendencias_meses: tendencias.length,
          liquidez_corriente: liquidezCorriente,
          segmentos: segmentos.reduce((acc, s) => { acc[s.segmento] = (acc[s.segmento] || 0) + 1; return acc; }, {}),
          meses_debiles: mesesDebiles.map(m => m.mes)
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { tendencias, ratios: { liquidezCorriente }, rfm: segmentos };
    } catch (err) {
      console.error(`[${this.nombre}] Error análisis mensual:`, err);
      throw err;
    }
  }

  // ─── TRIGGERS REACTIVOS ────────────────────────────────────

  async evaluarTriggersReactivos() {
    // Trigger: Margen erosionándose
    const margenReciente = await db.getAsync(`
      SELECT (SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) - SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END))
             / NULLIF(SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END), 0) * 100 as margen
      FROM transacciones
      WHERE fecha >= date('now', '-30 days')
        AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '4%' OR codigo LIKE '5%')
    `);

    const margenHistorico = await db.getAsync(`
      SELECT (SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) - SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END))
             / NULLIF(SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END), 0) * 100 as margen
      FROM transacciones
      WHERE fecha >= date('now', '-90 days') AND fecha < date('now', '-30 days'
        AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '4%' OR codigo LIKE '5%')
    `);

    if (margenReciente?.margen && margenHistorico?.margen) {
      const diferencia = margenHistorico.margen - margenReciente.margen;
      if (diferencia > 2) {
        await this.crearAlerta('margen_erosion', 'warning',
          `📉 Margen bruto cayó ${diferencia.toFixed(1)} puntos vs promedio 3 meses. Investigar costos o mix de productos`,
          { margen_actual: margenReciente.margen, margen_historico: margenHistorico.margen });
      }
    }

    // Trigger: Cliente redujo compras >30%
    const clientesDeterioro = await db.allAsync(`
      SELECT cliente_id, nombre_cliente,
        SUM(CASE WHEN fecha >= date('now', '-30 days') THEN monto ELSE 0 END) as mes_actual,
        SUM(CASE WHEN fecha >= date('now', '-90 days') AND fecha < date('now', '-30 days') THEN monto ELSE 0 END) / 2 as promedio_mes_anterior
      FROM transacciones
      WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
      GROUP BY cliente_id
      HAVING mes_actual < promedio_mes_anterior * 0.7 AND promedio_mes_anterior > 50000
    `);

    for (const c of clientesDeterioro) {
      await this.crearAlerta('cliente_deterioro', 'warning',
        `⚠️ ${c.nombre_cliente} redujo compras ${((1 - c.mes_actual / c.promedio_mes_anterior) * 100).toFixed(0)}%. Era Q${Math.round(c.promedio_mes_anterior).toLocaleString()}/mes, ahora Q${Math.round(c.mes_actual).toLocaleString()}`,
        { cliente: c.nombre_cliente, reduccion_pct: (1 - c.mes_actual / c.promedio_mes_anterior) * 100 });
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────

  async crearAlerta(tipo, nivel, titulo, metadata = {}) {
    await db.runAsync(`
      INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, estado, created_at)
      VALUES (?, ?, ?, ?, ?, 'activa', datetime('now'))
    `, [tipo, nivel, titulo, titulo, JSON.stringify(metadata)]);
  }

  // ─── SCHEDULER ─────────────────────────────────────────────
  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Iniciando scheduler...`);

    // Diario 5:00 AM: KPIs
    this.tareasActivas.push(cron.schedule('0 5 * * *', async () => {
      await this.calcularKPIsDiarios();
    }));

    // Semanal lunes 5:00 AM
    this.tareasActivas.push(cron.schedule('0 5 * * 1', async () => {
      await this.analisisSemanal();
    }));

    // Mensual día 1, 6:00 AM
    this.tareasActivas.push(cron.schedule('0 6 1 * *', async () => {
      await this.analisisMensual();
    }));

    // Evaluar triggers cada 4 horas
    this.tareasActivas.push(cron.schedule('0 */4 * * *', async () => {
      await this.evaluarTriggersReactivos();
    }));

    console.log(`[${this.nombre}] ✅ Scheduler iniciado`);
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = AnalisisAgent;
