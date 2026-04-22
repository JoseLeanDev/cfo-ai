/**
 * AGENTE 4: CONTABILIDAD
 * Automatización contable, conciliación, cierre mensual, fiscal
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

  // ─── ACCIONES PROGRAMADAS ─────────────────────────────────

  /**
   * Diario 5:00 AM: Importar y categorizar transacciones bancarias
   */
  async importarTransacciones() {
    const startTime = Date.now();
    try {
      // Transacciones sin categorizar
      const sinCategorizar = await db.allAsync(`
        SELECT * FROM movimientos_bancarios
        WHERE estado = 'pendiente' AND fecha >= date('now', '-3 days')
        ORDER BY fecha DESC
        LIMIT 50
      `);

      let categorizadas = 0;
      let flags = 0;

      for (const mov of sinCategorizar) {
        // Match con FEL por monto
        const matchFEL = await db.getAsync(`
          SELECT id FROM transacciones
          WHERE ABS(monto - ?) < 0.01 AND DATE(fecha) = DATE(?)
          LIMIT 1
        `, [mov.monto, mov.fecha]);

        if (matchFEL) {
          await db.runAsync(`
            UPDATE movimientos_bancarios SET estado = 'categorizado', transaccion_id = ? WHERE id = ?
          `, [matchFEL.id, mov.id]);
          categorizadas++;
        } else {
          // Categorizar por reglas aprendidas
          const categoria = this.inferirCategoria(mov.descripcion, mov.monto);
          if (categoria) {
            await db.runAsync(`
              UPDATE movimientos_bancarias SET estado = 'categorizado', categoria_inferida = ? WHERE id = ?
            `, [categoria, mov.id]);
            categorizadas++;
          }
        }

        // Flag: monto > 3x promedio de categoría
        const promedioCategoria = await db.getAsync(`
          SELECT AVG(monto) as avg FROM movimientos_bancarios
          WHERE categoria_inferida = ? AND fecha >= date('now', '-90 days')
        `, [mov.categoria_inferida]);

        if (promedioCategoria?.avg && Math.abs(mov.monto) > promedioCategoria.avg * 3) {
          flags++;
          await this.crearAlerta('transaccion_inusual', 'warning',
            `🚩 Transacción Q${mov.monto.toLocaleString()} en "${mov.descripcion}" es >3x el promedio de su categoría`,
            { monto: mov.monto, descripcion: mov.descripcion, promedio: promedioCategoria.avg });
        }
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'importacion_transacciones',
        descripcion: `📥 ${categorizadas} transacciones categorizadas, ${flags} flags de inusualidad`,
        detalles_json: JSON.stringify({ categorizadas, flags, pendientes: sinCategorizar.length - categorizadas }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { categorizadas, flags };
    } catch (err) {
      console.error(`[${this.nombre}] Error importación:`, err);
      throw err;
    }
  }

  /**
   * Semanal (viernes 6:00 PM): Pre-conciliación bancaria
   */
  async preConciliacionBancaria() {
    const startTime = Date.now();
    try {
      const cuentas = await db.allAsync(`SELECT id, nombre, numero_cuenta FROM cuentas_bancarias WHERE activa = 1`);
      const resultados = [];

      for (const cuenta of cuentas) {
        // Movimientos bancarios últimos 7 días
        const movBanco = await db.allAsync(`
          SELECT * FROM movimientos_bancarios
          WHERE cuenta_bancaria_id = ? AND fecha >= date('now', '-7 days')
          ORDER BY fecha
        `, [cuenta.id]);

        // Registros contables últimos 7 días
        const movLibro = await db.allAsync(`
          SELECT t.*, c.nombre as cuenta_nombre
          FROM transacciones t
          JOIN cuentas_contables c ON t.cuenta_id = c.id
          WHERE t.cuenta_id = (SELECT cuenta_contable_id FROM cuentas_bancarias WHERE id = ? LIMIT 1)
            AND t.fecha >= date('now', '-7 days')
          ORDER BY t.fecha
        `, [cuenta.id]);

        // Partidas en tránsito
        const enLibroNoBanco = movLibro.filter(l =>
          !movBanco.some(b => Math.abs(b.monto - l.monto) < 0.01 && b.fecha === l.fecha)
        );
        const enBancoNoLibro = movBanco.filter(b =>
          !movLibro.some(l => Math.abs(l.monto - b.monto) < 0.01 && l.fecha === b.fecha)
        );

        const diferencia = enLibroNoBanco.reduce((s, x) => s + x.monto, 0) -
                           enBancoNoLibro.reduce((s, x) => s + x.monto, 0);

        // Sugerir causa probable
        const sugerencias = [];
        for (const item of enLibroNoBanco) {
          if (item.descripcion?.toLowerCase().includes('cheque')) {
            sugerencias.push(`Cheque no cobrado: ${item.descripcion} Q${item.monto}`);
          }
        }
        for (const item of enBancoNoLibro) {
          if (item.descripcion?.toLowerCase().includes('transferencia')) {
            sugerencias.push(`Transferencia entre cuentas no registrada: Q${item.monto}`);
          }
          if (Math.abs(item.monto) >= 1000 && Math.abs(item.monto) <= 1500) {
            sugerencias.push(`Posible cargo bancario por mantenimiento: Q${item.monto}`);
          }
        }

        resultados.push({
          cuenta: cuenta.nombre,
          diferencia,
          en_libro_no_banco: enLibroNoBanco.length,
          en_banco_no_libro: enBancoNoLibro.length,
          sugerencias
        });

        // Guardar en tabla de conciliaciones
        await db.runAsync(`
          INSERT OR REPLACE INTO conciliaciones_bancarias
          (cuenta_bancaria_id, fecha, saldo_banco, saldo_libro, diferencia, estado, partidas_transito, sugerencias, created_at)
          VALUES (?, date('now'), ?, ?, ?, 'pendiente', ?, ?, datetime('now'))
        `, [
          cuenta.id, movBanco.reduce((s, m) => s + m.monto, 0),
          movLibro.reduce((s, m) => s + m.monto, 0), diferencia,
          JSON.stringify([...enLibroNoBanco, ...enBancoNoLibro]),
          JSON.stringify(sugerencias)
        ]);
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'conciliacion_bancaria',
        descripcion: `🏦 Pre-conciliación: ${resultados.length} cuentas revisadas`,
        detalles_json: JSON.stringify({
          cuentas: resultados.length,
          diferencias: resultados.filter(r => Math.abs(r.diferencia) > 500).length
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return resultados;
    } catch (err) {
      console.error(`[${this.nombre}] Error conciliación:`, err);
      throw err;
    }
  }

  /**
   * Mensual día 1, 4:00 AM: Cierre mensual automatizado
   */
  async ejecutarCierreMensual() {
    const startTime = Date.now();
    try {
      const mesActual = new Date().toISOString().slice(0, 7);
      const mesAnterior = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);

      // ─── PASO 1: Validación preliminar ────────────────────
      const txSinCategorizar = await db.getAsync(`
        SELECT COUNT(*) as count FROM movimientos_bancarios WHERE estado = 'pendiente'
      `);
      const balanceOk = await this.verificarBalance();

      // ─── PASO 2: Asientos de ajuste ────────────────────────
      // Obtener nómina del mes
      const nomina = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE categoria = 'nomina' AND fecha >= date('now', '-30 days')
      `);
      const montoNomina = nomina?.total || 0;

      // Provisiones laborales Guatemala
      const provisiones = [
        { cuenta: '2140', nombre: 'Provisión Aguinaldo', pct: 0.0833 },
        { cuenta: '2141', nombre: 'Provisión Bono 14', pct: 0.0833 },
        { cuenta: '2142', nombre: 'Provisión Indemnización', pct: 0.0833 },
        { cuenta: '2143', nombre: 'Provisión Vacaciones', pct: 0.0417 },
        { cuenta: '2150', nombre: 'IGSS Patronal 12.67%', pct: 0.1267 },
        { cuenta: '2151', nombre: 'IRTRA 1%', pct: 0.01 },
        { cuenta: '2152', nombre: 'INTECAP 1%', pct: 0.01 },
      ];

      const asientosGenerados = [];
      for (const prov of provisiones) {
        const monto = montoNomina * prov.pct;
        if (monto > 0) {
          asientosGenerados.push({
            cuenta: prov.cuenta, nombre: prov.nombre, monto,
            descripcion: `${prov.nombre} ${mesAnterior}`
          });
        }
      }

      // Depreciación (tasas legales GT)
      const activosFijos = await db.allAsync(`
        SELECT c.id, c.nombre, c.codigo, s.saldo_actual
        FROM cuentas_contables c
        JOIN saldos_cuentas s ON c.id = s.cuenta_id
        WHERE c.tipo = 'activo' AND c.codigo LIKE '12%'
          AND s.periodo = strftime('%Y-%m', 'now')
      `);

      const tasasDepreciacion = {
        '1210': 0.05,   // Edificios
        '1220': 0.20,   // Mobiliario
        '1230': 0.20,   // Vehículos
        '1240': 0.3333, // Equipo computo
        '1250': 0.20,   // Maquinaria
      };

      for (const af of activosFijos) {
        const tasa = tasasDepreciacion[af.codigo?.substring(0, 4)] || 0.20;
        const depreciacion = (af.saldo_actual || 0) * tasa / 12;
        if (depreciacion > 0) {
          asientosGenerados.push({
            cuenta: '5299', nombre: `Depreciación ${af.nombre}`, monto: depreciacion,
            descripcion: `Depreciación mensual ${af.nombre}`
          });
        }
      }

      // ─── PASO 3: Estados financieros ────────────────────────
      const balanceGeneral = await this.generarBalanceGeneral(mesAnterior);
      const estadoResultados = await this.generarEstadoResultados(mesAnterior);

      // ─── PASO 4: Guardar y marcar ──────────────────────────
      await db.runAsync(`
        INSERT OR REPLACE INTO cierres_mensuales (mes, estado, asientos_json, created_at)
        VALUES (?, 'preliminar', ?, datetime('now'))
      `, [mesAnterior, JSON.stringify({ asientos: asientosGenerados, balance: balanceGeneral, resultados: estadoResultados })]);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'cierre_mensual',
        descripcion: `📅 Cierre ${mesAnterior}: ${asientosGenerados.length} asientos de ajuste generados | Balance: ${balanceGeneral ? 'OK' : 'Error'}`,
        detalles_json: JSON.stringify({
          mes: mesAnterior,
          asientos: asientosGenerados.length,
          tx_pendientes: txSinCategorizar?.count || 0,
          balance_ok: balanceOk
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { mes: mesAnterior, asientos: asientosGenerados, balance: balanceGeneral };
    } catch (err) {
      console.error(`[${this.nombre}] Error cierre:`, err);
      throw err;
    }
  }

  /**
   * Mensual día 5, 6:00 AM: Cálculos fiscales
   */
  async calcularFiscal() {
    const startTime = Date.now();
    try {
      // IVA del mes
      const debitoFiscal = await db.getAsync(`
        SELECT COALESCE(SUM(monto * 0.12), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '41%')
          AND fecha >= date('now', '-30 days')
      `);

      const creditoFiscal = await db.getAsync(`
        SELECT COALESCE(SUM(monto * 0.12), 0) as total
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '51%')
          AND fecha >= date('now', '-30 days')
      `);

      const retencionesIVA = 0; // placeholder
      const ivaPagar = (debitoFiscal?.total || 0) - (creditoFiscal?.total || 0) - retencionesIVA;

      // ISR estimado (trimestral)
      const utilidad = await db.getAsync(`
        SELECT (
          COALESCE(SUM(CASE WHEN tipo = 'haber' AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '4%') THEN monto ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN tipo = 'debe' AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '5%') THEN monto ELSE 0 END), 0)
        ) as utilidad
        FROM transacciones
        WHERE fecha >= date('now', '-90 days')
      `);

      const isrEstimado = (utilidad?.utilidad || 0) * 0.25;

      // ISO trimestral
      const activosTotales = await db.getAsync(`
        SELECT COALESCE(SUM(saldo_actual), 0) as total FROM saldos_cuentas
        WHERE periodo = strftime('%Y-%m', 'now')
          AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE tipo = 'activo')
      `);
      const isoTrimestral = (activosTotales?.total || 0) * 0.01 / 4;

      // Calendario fiscal
      const vencimientos = [
        { impuesto: 'IVA', monto: ivaPagar, fecha: this.ultimoDiaHabilMes() },
        { impuesto: 'ISR Trimestral', monto: isrEstimado, fecha: this.ultimoDiaHabilMes() },
        { impuesto: 'ISO Trimestral', monto: isoTrimestral, fecha: this.ultimoDiaHabilMes() },
      ];

      for (const v of vencimientos) {
        const diasRestantes = Math.ceil((new Date(v.fecha) - new Date()) / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 7 && diasRestantes >= 0) {
          await this.crearAlerta('vencimiento_fiscal', diasRestantes <= 3 ? 'critical' : 'warning',
            `📅 ${v.impuesto} vence en ${diasRestantes} días. Monto estimado: Q${v.monto.toLocaleString()}`,
            { impuesto: v.impuesto, monto: v.monto, fecha: v.fecha });
        }
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        categoria: 'calculos_fiscales',
        descripcion: `📊 Fiscal: IVA Q${ivaPagar.toLocaleString()} | ISR Q${isrEstimado.toLocaleString()} | ISO Q${isoTrimestral.toLocaleString()}`,
        detalles_json: JSON.stringify({ iva: ivaPagar, isr: isrEstimado, iso: isoTrimestral }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { iva: ivaPagar, isr: isrEstimado, iso: isoTrimestral, vencimientos };
    } catch (err) {
      console.error(`[${this.nombre}] Error fiscal:`, err);
      throw err;
    }
  }

  // ─── TRIGGERS REACTIVOS ────────────────────────────────────

  async evaluarTriggers() {
    // Trigger: Diferencia conciliación >Q5,000
    const diferenciasGrandes = await db.allAsync(`
      SELECT cb.nombre, cb.numero_cuenta, ABS(cb.diferencia) as dif
      FROM conciliaciones_bancarias cb
      JOIN cuentas_bancarias c ON cb.cuenta_bancaria_id = c.id
      WHERE ABS(cb.diferencia) > 5000 AND cb.estado = 'pendiente'
        AND cb.fecha >= date('now', '-7 days')
    `);

    for (const d of diferenciasGrandes) {
      await this.crearAlerta('diferencia_conciliacion', 'warning',
        `🏦 Diferencia de conciliación Q${d.dif.toLocaleString()} en ${d.nombre}`,
        { cuenta: d.nombre, diferencia: d.dif });
    }

    // Trigger: Factura con error fiscal
    const facturasError = await db.allAsync(`
      SELECT id, descripcion, monto, documento
      FROM transacciones
      WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '51%')
        AND (descripcion LIKE '%NIT inválido%' OR descripcion LIKE '%incompleto%')
        AND fecha >= date('now', '-30 days')
      LIMIT 5
    `);

    for (const f of facturasError) {
      await this.crearAlerta('factura_error_fiscal', 'warning',
        `📝 Factura ${f.documento || ''} tiene error fiscal. IVA en riesgo: Q${(f.monto * 0.12).toLocaleString()}`,
        { factura_id: f.id, monto_iva: f.monto * 0.12 });
    }

    // Trigger: Cierre atrasado
    const mesAnterior = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7);
    const cierre = await db.getAsync(`
      SELECT estado FROM cierres_mensuales WHERE mes = ?
    `, [mesAnterior]);
    const hoy = new Date().getDate();
    if ((!cierre || cierre.estado !== 'cerrado') && hoy > 10) {
      await this.crearAlerta('cierre_atrasado', 'warning',
        `⏰ Cierre de ${mesAnterior} tiene ${hoy - 10} días de atraso. Requiere atención del contador`,
        { mes: mesAnterior, dias_atraso: hoy - 10 });
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────

  inferirCategoria(descripcion, monto) {
    const desc = (descripcion || '').toLowerCase();
    if (desc.includes('eegsa') || desc.includes('electricidad') || desc.includes('agua')) return 'Servicios Públicos';
    if (desc.includes('nomina') || desc.includes('sueldo') || desc.includes('salario')) return 'Nómina';
    if (desc.includes('alquiler') || desc.includes('renta')) return 'Alquiler';
    if (desc.includes('publicidad') || desc.includes('marketing') || desc.includes('ads')) return 'Publicidad';
    if (desc.includes('transporte') || desc.includes('gasolina')) return 'Transporte';
    if (desc.includes('seguro')) return 'Seguros';
    if (desc.includes('interes') || desc.includes('prestamo')) return 'Préstamo';
    if (desc.includes('mantenimiento') || desc.includes('reparacion')) return 'Mantenimiento';
    if (desc.includes('impuesto') || desc.includes('sat') || desc.includes('iva')) return 'Impuestos';
    return 'Otros Gastos';
  }

  async verificarBalance() {
    const result = await db.getAsync(`
      SELECT ABS(
        SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END) -
        SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END)
      ) as diferencia
      FROM transacciones
      WHERE fecha >= date('now', '-30 days')
    `);
    return (result?.diferencia || 0) < 0.01;
  }

  async generarBalanceGeneral(mes) {
    const activos = await db.getAsync(`
      SELECT COALESCE(SUM(saldo_actual), 0) as total
      FROM saldos_cuentas WHERE periodo = ? AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE tipo = 'activo')
    `, [mes]);
    const pasivos = await db.getAsync(`
      SELECT COALESCE(SUM(saldo_actual), 0) as total
      FROM saldos_cuentas WHERE periodo = ? AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE tipo = 'pasivo')
    `, [mes]);
    const patrimonio = (activos?.total || 0) - (pasivos?.total || 0);
    return { activos: activos?.total, pasivos: pasivos?.total, patrimonio };
  }

  async generarEstadoResultados(mes) {
    const ventas = await db.getAsync(`
      SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
      WHERE tipo = 'haber' AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '4%')
        AND strftime('%Y-%m', fecha) = ?
    `, [mes]);
    const gastos = await db.getAsync(`
      SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
      WHERE tipo = 'debe' AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '5%')
        AND strftime('%Y-%m', fecha) = ?
    `, [mes]);
    return { ventas: ventas?.total, gastos: gastos?.total, utilidad: (ventas?.total || 0) - (gastos?.total || 0) };
  }

  ultimoDiaHabilMes() {
    const hoy = new Date();
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    // Simplificación: devolver último día del mes
    return ultimoDia.toISOString().split('T')[0];
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

    // Diario 5:00 AM: importar transacciones
    this.tareasActivas.push(cron.schedule('0 5 * * *', async () => {
      await this.importarTransacciones();
    }));

    // Viernes 6:00 PM: pre-conciliación
    this.tareasActivas.push(cron.schedule('0 18 * * 5', async () => {
      await this.preConciliacionBancaria();
    }));

    // Día 1, 4:00 AM: cierre mensual
    this.tareasActivas.push(cron.schedule('0 4 1 * *', async () => {
      await this.ejecutarCierreMensual();
    }));

    // Día 5, 6:00 AM: cálculos fiscales
    this.tareasActivas.push(cron.schedule('0 6 5 * *', async () => {
      await this.calcularFiscal();
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

module.exports = ContabilidadAgent;
