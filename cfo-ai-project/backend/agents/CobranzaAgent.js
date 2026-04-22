/**
 * AGENTE 3: COBRANZA
 * CxC aging, DSO, DPO, CCC, probabilidad de cobro, lista priorizada
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

  // ─── ACCIONES PROGRAMADAS ─────────────────────────────────

  /**
   * Cada hora laboral: Actualizar aging de cartera
   */
  async actualizarAging() {
    const startTime = Date.now();
    try {
      // CxC aging
      const agingCxC = await db.allAsync(`
        SELECT
          cliente_id, nombre_cliente,
          SUM(CASE WHEN julianday('now') - julianday(fecha) <= 0 THEN monto ELSE 0 END) as al_corriente,
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 1 AND 30 THEN monto ELSE 0 END) as vencido_1_30,
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 31 AND 60 THEN monto ELSE 0 END) as vencido_31_60,
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 61 AND 90 THEN monto ELSE 0 END) as vencido_61_90,
          SUM(CASE WHEN julianday('now') - julianday(fecha) > 90 THEN monto ELSE 0 END) as vencido_90_plus,
          SUM(monto) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND estado = 'activo'
        GROUP BY cliente_id
        ORDER BY total DESC
      `);

      // CxP aging
      const agingCxP = await db.allAsync(`
        SELECT
          categoria as proveedor,
          SUM(CASE WHEN julianday('now') - julianday(fecha) <= 0 THEN monto ELSE 0 END) as al_corriente,
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 1 AND 30 THEN monto ELSE 0 END) as vencido_1_30,
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 31 AND 60 THEN monto ELSE 0 END) as vencido_31_60,
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 61 AND 90 THEN monto ELSE 0 END) as vencido_61_90,
          SUM(CASE WHEN julianday('now') - julianday(fecha) > 90 THEN monto ELSE 0 END) as vencido_90_plus,
          SUM(monto) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '21%')
          AND tipo = 'debe' AND estado = 'activo'
        GROUP BY categoria
        ORDER BY total DESC
      `);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'aging_cartera',
        descripcion: `📋 Aging actualizado: ${agingCxC.length} clientes, ${agingCxP.length} proveedores`,
        detalles_json: JSON.stringify({
          cxc_count: agingCxC.length, cxp_count: agingCxP.length,
          cxc_90plus: agingCxC.reduce((s, c) => s + c.vencido_90_plus, 0)
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

  /**
   * Diario 6:00 AM: Calcular DSO, DPO, CCC, lista de cobranza
   */
  async calcularMetricasCobranza() {
    const startTime = Date.now();
    try {
      // Ventas últimos 30 días
      const ventas30d = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
          AND fecha >= date('now', '-30 days')
      `);

      // CxC total
      const cxcTotal = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND estado = 'activo'
      `);

      // Compras últimos 30 días
      const compras30d = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '51%')
          AND fecha >= date('now', '-30 days')
      `);

      // CxP total
      const cxpTotal = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '21%')
          AND tipo = 'debe' AND estado = 'activo'
      `);

      // DSO = (CxC / Ventas 30d) * 30
      const dso = ventas30d?.total > 0 ? (cxcTotal?.total / ventas30d.total * 30) : 0;
      // DPO = (CxP / Compras 30d) * 30
      const dpo = compras30d?.total > 0 ? (cxpTotal?.total / compras30d.total * 30) : 0;
      // CCC = DSO + DIO - DPO (estimar DIO si no hay inventario)
      const dio = 15; // estimación por defecto
      const ccc = dso + dio - dpo;

      // Working capital
      const workingCapital = (cxcTotal?.total || 0) - (cxpTotal?.total || 0);

      // Lista de cobranza priorizada (score = monto * días vencido * riesgo)
      const listaCobranza = await db.allAsync(`
        SELECT
          cliente_id, nombre_cliente,
          SUM(monto) as monto_total,
          MAX(julianday('now') - julianday(fecha)) as dias_max_vencido,
          AVG(julianday('now') - julianday(fecha)) as dias_promedio
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND estado = 'activo'
          AND julianday('now') - julianday(fecha) > 0
        GROUP BY cliente_id
        ORDER BY (monto_total * MAX(julianday('now') - julianday(fecha))) DESC
        LIMIT 20
      `);

      // Probabilidad de cobro por factura
      const probabilidades = [];
      for (const item of listaCobranza) {
        const prob = this.probabilidadCobro(item.dias_max_vencido);
        const valorEsperado = item.monto_total * prob;
        probabilidades.push({ ...item, probabilidad: prob, valor_esperado: valorEsperado });
      }

      // Guardar métricas
      await db.runAsync(`
        INSERT INTO snapshots_financieros (fecha, tipo, datos_json, created_at)
        VALUES (date('now'), 'metricas_cobranza', ?, datetime('now'))
      `, [JSON.stringify({ dso, dpo, ccc, working_capital, probabilidades })]);

      // Trigger: CxC >90 días > 30% del total
      const cxc90Plus = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND julianday('now') - julianday(fecha) > 90
      `);
      if (cxcTotal?.total > 0 && (cxc90Plus?.total / cxcTotal.total) > 0.30) {
        await this.crearAlerta('cxc_critica', 'critical',
          `🚨 CxC >90 días = ${((cxc90Plus.total / cxcTotal.total) * 100).toFixed(0)}% de cartera. Q${cxc90Plus.total.toLocaleString()} en riesgo de incobrabilidad`,
          { pct: (cxc90Plus.total / cxcTotal.total) * 100, monto: cxc90Plus.total });
      }

      // Trigger: DSO subiendo >5 días en 4 semanas
      const dsoAnterior = await db.getAsync(`
        SELECT datos_json FROM snapshots_financieros WHERE tipo = 'metricas_cobranza' ORDER BY fecha DESC LIMIT 1 OFFSET 1
      `);
      if (dsoAnterior) {
        const datos = JSON.parse(dsoAnterior.datos_json || '{}');
        if (dso - datos.dso > 5) {
          await this.crearAlerta('dso_subiendo', 'warning',
            `📈 DSO subió ${(dso - datos.dso).toFixed(0)} días en 4 semanas. Ahora: ${dso.toFixed(0)} días`,
            { dso_actual: dso, dso_anterior: datos.dso });
        }
      }

      // Trigger: Working capital negativo
      if (workingCapital < 0) {
        await this.crearAlerta('working_capital_negativo', 'warning',
          `⚠️ Working capital negativo: Q${workingCapital.toLocaleString()}. Tus proveedores te financian más de lo que financias a clientes`,
          { cxc: cxcTotal?.total, cxp: cxpTotal?.total });
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'metricas_cobranza',
        descripcion: `📊 DSO: ${dso.toFixed(0)} días | DPO: ${dpo.toFixed(0)} días | CCC: ${ccc.toFixed(0)} días | WC: Q${workingCapital.toLocaleString()}`,
        detalles_json: JSON.stringify({ dso, dpo, ccc, working_capital: workingCapital, lista_cobranza: listaCobranza.length }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { dso, dpo, ccc, workingCapital, listaCobranza: probabilidades };
    } catch (err) {
      console.error(`[${this.nombre}] Error métricas:`, err);
      throw err;
    }
  }

  /**
   * Semanal (lunes 5:30 AM): Tendencias DSO, provisión, oportunidades
   */
  async analisisSemanalCobranza() {
    const startTime = Date.now();
    try {
      // Tendencia DSO por cliente (últimas 8 semanas)
      const tendencias = await db.allAsync(`
        SELECT cliente_id, nombre_cliente,
          strftime('%Y-%W', fecha) as semana,
          AVG(julianday('now') - julianday(fecha)) as dias_promedio
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND fecha >= date('now', '-56 days')
        GROUP BY cliente_id, semana
      `);

      // Provisión de incobrables
      const provision = await db.getAsync(`
        SELECT
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 1 AND 30 THEN monto * 0.05 ELSE 0 END) +
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 31 AND 60 THEN monto * 0.15 ELSE 0 END) +
          SUM(CASE WHEN julianday('now') - julianday(fecha) BETWEEN 61 AND 90 THEN monto * 0.35 ELSE 0 END) +
          SUM(CASE WHEN julianday('now') - julianday(fecha) > 90 THEN monto * 0.60 ELSE 0 END) as provision_total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND julianday('now') - julianday(fecha) > 0
      `);

      // Oportunidades: clientes alto volumen → descuento pronto pago
      const oportunidades = await db.allAsync(`
        SELECT cliente_id, nombre_cliente,
          SUM(monto) as volumen,
          AVG(julianday('now') - julianday(fecha)) as dias_promedio
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
          AND fecha >= date('now', '-90 days')
        GROUP BY cliente_id
        HAVING volumen > 200000 AND dias_promedio < 25
        ORDER BY volumen DESC
        LIMIT 5
      `);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'analisis_semanal_cobranza',
        descripcion: `📋 Provisión incobrables: Q${(provision?.provision_total || 0).toLocaleString()} | ${oportunidades.length} oportunidades descuento pronto pago`,
        detalles_json: JSON.stringify({
          provision: provision?.provision_total,
          oportunidades: oportunidades.length,
          tendencias: tendencias.length
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { provision, oportunidades, tendencias };
    } catch (err) {
      console.error(`[${this.nombre}] Error semanal:`, err);
      throw err;
    }
  }

  /**
   * Mensual (día 1, 5:00 AM): Reporte antigüedad completo
   */
  async reporteMensual() {
    const startTime = Date.now();
    try {
      // % de recuperación del mes
      const vencioMes = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND fecha >= date('now', '-30 days')
      `);

      const cobradoMes = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'debe' AND fecha >= date('now', '-30 days')
      `);

      const recuperacion = vencioMes?.total > 0 ? (cobradoMes?.total / vencioMes.total * 100) : 0;

      // Clientes que pasaron de al corriente a moroso
      const nuevosMorosos = await db.allAsync(`
        SELECT cliente_id, nombre_cliente,
          SUM(CASE WHEN fecha < date('now', '-30 days') THEN monto ELSE 0 END) as antes,
          SUM(CASE WHEN fecha >= date('now', '-30 days') THEN monto ELSE 0 END) as ahora
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
          AND tipo = 'haber' AND estado = 'activo'
        GROUP BY cliente_id
        HAVING antes = 0 AND ahora > 0
      `);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'reporte_mensual_cobranza',
        descripcion: `📊 % Recuperación mes: ${recuperacion.toFixed(1)}% | ${nuevosMorosos.length} nuevos morosos`,
        detalles_json: JSON.stringify({ recuperacion, nuevos_morosos: nuevosMorosos.length }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { recuperacion, nuevosMorosos };
    } catch (err) {
      console.error(`[${this.nombre}] Error mensual:`, err);
      throw err;
    }
  }

  // ─── TRIGGERS REACTIVOS ────────────────────────────────────

  async evaluarTriggers() {
    // Trigger: Factura >Q20K a 31+ días
    const facturasCriticas = await db.allAsync(`
      SELECT id, fecha, nombre_cliente, monto,
        julianday('now') - julianday(fecha) as dias_vencido
      FROM transacciones
      WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
        AND tipo = 'haber' AND monto > 20000
        AND julianday('now') - julianday(fecha) > 30
      ORDER BY monto DESC
      LIMIT 5
    `);

    for (const f of facturasCriticas) {
      await this.crearAlerta('mora_nueva_significativa', 'warning',
        `🚨 Factura Q${f.monto.toLocaleString()} de ${f.nombre_cliente} vencida ${f.dias_vencido.toFixed(0)} días`,
        { factura_id: f.id, monto: f.monto, cliente: f.nombre_cliente, dias: f.dias_vencido });
    }

    // Trigger: Deterioro patrón de pago >10 días
    const deterioro = await db.allAsync(`
      SELECT cliente_id, nombre_cliente,
        AVG(CASE WHEN fecha >= date('now', '-90 days') AND fecha < date('now', '-30 days')
             THEN julianday('now') - julianday(fecha) END) as dso_anterior,
        AVG(CASE WHEN fecha >= date('now', '-30 days')
             THEN julianday('now') - julianday(fecha) END) as dso_actual
      FROM transacciones
      WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '11%')
        AND tipo = 'haber'
      GROUP BY cliente_id
      HAVING dso_actual - dso_anterior > 10 AND dso_anterior > 0
    `);

    for (const d of deterioro) {
      await this.crearAlerta('deterioro_pago', 'warning',
        `⚠️ ${d.nombre_cliente} está pagando ${(d.dso_actual - d.dso_anterior).toFixed(0)} días más lento. Antes: ${d.dso_anterior.toFixed(0)}d, ahora: ${d.dso_actual.toFixed(0)}d`,
        { cliente: d.nombre_cliente, delta: d.dso_actual - d.dso_anterior });
    }

    // Trigger: CxP vencida >15 días
    const cxpVencida = await db.allAsync(`
      SELECT categoria as proveedor, SUM(monto) as total,
        MAX(julianday('now') - julianday(fecha)) as dias
      FROM transacciones
      WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '21%')
        AND tipo = 'debe' AND julianday('now') - julianday(fecha) > 15
      GROUP BY categoria
      ORDER BY total DESC
      LIMIT 3
    `);

    for (const c of cxpVencida) {
      await this.crearAlerta('cxp_vencida', 'warning',
        `📤 Pago a ${c.proveedor} vencido ${c.dias.toFixed(0)} días (Q${c.total.toLocaleString()}). Riesgo: corte de crédito`,
        { proveedor: c.proveedor, dias: c.dias, monto: c.total });
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────

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

    // Cada hora laboral: aging
    this.tareasActivas.push(cron.schedule('0 7-18 * * 1-5', async () => {
      await this.actualizarAging();
    }));

    // Diario 6:00 AM: métricas
    this.tareasActivas.push(cron.schedule('0 6 * * *', async () => {
      await this.calcularMetricasCobranza();
    }));

    // Semanal lunes 5:30 AM
    this.tareasActivas.push(cron.schedule('30 5 * * 1', async () => {
      await this.analisisSemanalCobranza();
    }));

    // Mensual día 1, 5:00 AM
    this.tareasActivas.push(cron.schedule('0 5 1 * *', async () => {
      await this.reporteMensual();
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

module.exports = CobranzaAgent;
