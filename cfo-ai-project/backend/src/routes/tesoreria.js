const express = require('express');
const router = express.Router();
const db = require('../../database/connection');
const config = require('../config/financiera');

const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');

// Los vencimientos se miden contra la fecha de corte de los datos (la foto de
// tesorería), igual que en la capa semántica. Contra CURRENT_DATE todo el
// calendario aparecería vencido.
const HOY = isPostgres ? '(SELECT fecha_corte FROM analitica.v_meta)' : 'CURRENT_DATE';

// GET /api/tesoreria/posicion
router.get('/posicion', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    
    // Usar DISTINCT para eliminar duplicados de la BD
    const cuentas = await db.allAsync(`
      SELECT DISTINCT
        banco,
        tipo,
        saldo,
        moneda
      FROM cuentas_bancarias 
      WHERE empresa_id = ? AND activa = TRUE
      ORDER BY saldo DESC
    `, [empresaId]);

    const totales = await db.getAsync(`
      SELECT 
        SUM(CASE WHEN moneda = 'GTQ' THEN saldo ELSE 0 END) as total_gtq,
        SUM(CASE WHEN moneda = 'USD' THEN saldo ELSE 0 END) as total_usd
      FROM cuentas_bancarias 
      WHERE empresa_id = ? AND activa = TRUE
    `, [empresaId]);

    const tipoCambio = 7.75;
    const totalGTQ = parseFloat(totales.total_gtq) || 0;
    const totalUSD = parseFloat(totales.total_usd) || 0;
    const totalConsolidado = totalGTQ + totalUSD * tipoCambio;
    // Días de caja: los mismos de v_posicion que ven el Resumen y el chat.
    const corte = isPostgres ? await db.getAsync('SELECT fecha_corte, dias_de_caja FROM analitica.v_posicion') : null;
    const diasOperacion = corte ? Number(corte.dias_de_caja) : Math.floor(totalGTQ / config.liquidez.dias_operacion_default);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        fecha_corte: new Date(corte?.fecha_corte || Date.now()).toISOString().split('T')[0],
        total_disponible_gtq: totalGTQ,
        total_disponible_usd: totalUSD,
        tipo_cambio: tipoCambio,
        total_consolidado_gtq: totalConsolidado,
        dias_operacion: diasOperacion,
        cuentas: cuentas.map(c => ({
          ...c,
          saldo: parseFloat(c.saldo) || 0
        }))
      },
      ui_components: {
        cards: 'bank_account_cards',
        total_card: 'consolidated_position',
        gauge: {
          type: 'liquidity_days',
          value: diasOperacion,
          min: 0,
          max: 90,
          thresholds: { danger: 15, warning: 30, good: 45 }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/tesoreria/cxc
router.get('/cxc', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    
    // Para PostgreSQL: usar sintaxis compatible - evitar = 0 en CASE
    const distribucion = await db.getAsync(`
      SELECT 
        SUM(CASE WHEN dias_atraso IS NULL OR dias_atraso <= 0 THEN monto_total ELSE 0 END) as al_corriente,
        SUM(CASE WHEN dias_atraso > 0 AND dias_atraso <= 30 THEN monto_total ELSE 0 END) as _30_dias,
        SUM(CASE WHEN dias_atraso > 30 AND dias_atraso <= 60 THEN monto_total ELSE 0 END) as _60_dias,
        SUM(CASE WHEN dias_atraso > 60 THEN monto_total ELSE 0 END) as _90_dias,
        SUM(monto_total) as total
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado ${isPostgres ? "<> 'cobrada'" : "!= 'cobrada'"}
    `, [empresaId]);

    // Usar cliente_nombre y monto_total
    const topDeudores = await db.allAsync(`
      SELECT cliente_nombre as cliente, monto_total as monto, dias_atraso as dias
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado ${isPostgres ? "<> 'cobrada'" : "!= 'cobrada'"}
      ORDER BY monto_total DESC
      LIMIT 5
    `, [empresaId]);

    const promedioDias = await db.getAsync(`
      SELECT AVG(CASE WHEN dias_atraso IS NULL THEN 0 ELSE dias_atraso END) as promedio
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado ${isPostgres ? "<> 'cobrada'" : "!= 'cobrada'"}
    `, [empresaId]);

    // Detalle por factura, con días medidos contra la fecha de corte.
    const facturas = await db.allAsync(`
      SELECT c.cliente, c.factura, c.saldo, c.fecha_emision, c.fecha_vencimiento, c.dias_vencida, c.nota,
             c.fecha_vencimiento - m.fecha_corte AS dias_para_vencer
      FROM analitica.v_cxc c CROSS JOIN analitica.v_meta m
      ORDER BY c.dias_vencida DESC, c.fecha_vencimiento
    `);

    const total = distribucion.total || 1;

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        total_cxc: parseFloat(distribucion.total) || 0,
        promedio_dias_cobro: Math.round(parseFloat(promedioDias.promedio) || 0),
        distribucion_aging: {
          al_corriente: { 
            monto: parseFloat(distribucion.al_corriente) || 0, 
            porcentaje: parseFloat(((parseFloat(distribucion.al_corriente) || 0) / total * 100).toFixed(1))
          },
          _30_dias: { 
            monto: parseFloat(distribucion._30_dias) || 0, 
            porcentaje: parseFloat(((parseFloat(distribucion._30_dias) || 0) / total * 100).toFixed(1))
          },
          _60_dias: { 
            monto: parseFloat(distribucion._60_dias) || 0, 
            porcentaje: parseFloat(((parseFloat(distribucion._60_dias) || 0) / total * 100).toFixed(1))
          },
          _90_dias: { 
            monto: parseFloat(distribucion._90_dias) || 0, 
            porcentaje: parseFloat(((parseFloat(distribucion._90_dias) || 0) / total * 100).toFixed(1))
          }
        },
        top_deudores: topDeudores.map(d => ({
          ...d,
          monto: parseFloat(d.monto) || 0
        })),
        facturas: facturas.map(f => ({
          cliente: f.cliente,
          factura: f.factura,
          monto: Number(f.saldo),
          emision: new Date(f.fecha_emision).toISOString().slice(0, 10),
          vencimiento: new Date(f.fecha_vencimiento).toISOString().slice(0, 10),
          dias_vencida: Number(f.dias_vencida),
          dias_para_vencer: Number(f.dias_para_vencer),
          nota: f.nota
        }))
      },
      ui_components: {
        chart: 'aging_pie_chart',
        table: 'cxc_detail_table'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/tesoreria/cxp
router.get('/cxp', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    const dias = parseInt(req.query.proximos_dias) || 30;
    
    // Usar nombres de columnas PostgreSQL
    // Para PostgreSQL: fecha_vencimiento - CURRENT_DATE devuelve integer (días)
    const cxp = await db.allAsync(`
      SELECT 
        proveedor_nombre as proveedor,
        monto_total as monto,
        fecha_vencimiento,
        ${isPostgres ? `(fecha_vencimiento - ${HOY})::integer` : "CAST((fecha_vencimiento::date - CURRENT_DATE) AS INTEGER)"} as dias_restantes
      FROM cuentas_pagar 
      WHERE empresa_id = ? 
        AND estado = 'pendiente'
        AND fecha_vencimiento <= ${HOY} + INTERVAL '${dias} days'
      ORDER BY fecha_vencimiento
    `, [empresaId]);

    const total = await db.getAsync(`
      SELECT SUM(monto_total) as total, 
             AVG(${isPostgres ? `(fecha_vencimiento - ${HOY})::integer` : "CAST((fecha_vencimiento::date - CURRENT_DATE) AS INTEGER)"}) as promedio_dias
      FROM cuentas_pagar 
      WHERE empresa_id = ? AND estado = 'pendiente'
    `, [empresaId]);

    const facturas = await db.allAsync(`
      SELECT proveedor, factura, saldo, fecha_emision, fecha_vencimiento, dias_para_vencer, nota
      FROM analitica.v_cxp
      ORDER BY fecha_vencimiento
    `);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        total_cxp: parseFloat(total.total) || 0,
        facturas: facturas.map(f => ({
          proveedor: f.proveedor,
          factura: f.factura,
          monto: Number(f.saldo),
          emision: new Date(f.fecha_emision).toISOString().slice(0, 10),
          vencimiento: new Date(f.fecha_vencimiento).toISOString().slice(0, 10),
          dias_restantes: Number(f.dias_para_vencer),
          nota: f.nota
        })),
        promedio_dias_pago: Math.round(parseFloat(total.promedio_dias) || 0),
        proximos_pagos: cxp.map(p => ({
          ...p,
          monto: parseFloat(p.monto) || 0,
          dias_restantes: Math.ceil(parseFloat(p.dias_restantes)),
          ahorro_si_paga_hoy: 0
        }))
      },
      ui_components: {
        timeline: 'payment_timeline',
        table: 'cxp_schedule'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/tesoreria/proyeccion
//
// Insumos de la proyección de caja, todos leídos de la base a la fecha de
// corte: saldos de bancos, cartera y pagos por factura, calendario SAT
// pendiente, préstamos vigentes y los ritmos de los últimos seis meses de
// flujo. La página arma con esto la proyección semana a semana, los
// escenarios y las palancas (frontend/src/lib/proyeccionCaja.js), así que
// cada cifra que muestra se puede rastrear hasta una fila de aquí.
router.get('/proyeccion', async (req, res) => {
  try {
    const n = (v) => (v == null ? null : Number(v));
    const dia = (f) => (f ? new Date(f).toISOString().slice(0, 10) : null);

    const meta = await db.getAsync('SELECT fecha_corte, flujo_desde FROM analitica.v_meta');
    const bancos = await db.allAsync(
      'SELECT banco, tipo, moneda, numero_cuenta, saldo, saldo_quetzales FROM analitica.v_bancos ORDER BY saldo_quetzales DESC');
    const cxc = await db.allAsync(
      'SELECT cliente, factura, fecha_vencimiento, saldo, dias_vencida, nota FROM analitica.v_cxc ORDER BY fecha_vencimiento');
    const cxp = await db.allAsync(
      'SELECT proveedor, factura, fecha_vencimiento, saldo, nota FROM analitica.v_cxp ORDER BY fecha_vencimiento');
    const sat = await db.allAsync(
      `SELECT obligacion, periodo, fecha_vencimiento, monto_estimado, monto_es_estimado
         FROM analitica.v_obligaciones_sat
        WHERE estado <> 'presentada' ORDER BY fecha_vencimiento`);
    const prestamos = await db.allAsync(
      'SELECT banco, numero, destino, cuota, dia_pago, fecha_ultimo_pago, saldo, tasa_anual FROM analitica.v_prestamos');

    // Ritmos: promedio mensual por categoría del concepto ("Categoría - fecha").
    const categorias = await db.allAsync(
      `SELECT split_part(concepto, ' - ', 1) AS categoria, tipo,
              count(*) AS movimientos, sum(monto) AS total
         FROM analitica.v_flujo GROUP BY 1, 2`);
    const meses = await db.getAsync(`SELECT count(DISTINCT periodo) AS meses FROM analitica.v_flujo`);
    const nMeses = Number(meses?.meses) || 1;
    const porMes = (...cats) =>
      Math.round(categorias.filter((c) => cats.includes(c.categoria)).reduce((s, c) => s + Number(c.total), 0) / nMeses);
    const promedioPago = (cat) => {
      const c = categorias.find((x) => x.categoria === cat);
      return c ? Math.round(Number(c.total) / Number(c.movimientos)) : 0;
    };

    res.json({
      status: 'success',
      data: {
        fecha_corte: dia(meta.fecha_corte),
        flujo_desde: dia(meta.flujo_desde),
        tipo_cambio_usd: 7.75,
        bancos: bancos.map((b) => ({ ...b, saldo: n(b.saldo), saldo_quetzales: n(b.saldo_quetzales) })),
        cxc: cxc.map((c) => ({ cliente: c.cliente, factura: c.factura, vence: dia(c.fecha_vencimiento), saldo: n(c.saldo), dias_vencida: n(c.dias_vencida), nota: c.nota })),
        cxp: cxp.map((p) => ({ proveedor: p.proveedor, factura: p.factura, vence: dia(p.fecha_vencimiento), saldo: n(p.saldo), nota: p.nota })),
        sat: sat.map((o) => ({ obligacion: o.obligacion, periodo: o.periodo, vence: dia(o.fecha_vencimiento), monto: n(o.monto_estimado), estimado: !!o.monto_es_estimado })),
        prestamos: prestamos.map((p) => ({ banco: p.banco, numero: p.numero, destino: p.destino, cuota: n(p.cuota), dia_pago: n(p.dia_pago), ultimo_pago: dia(p.fecha_ultimo_pago), saldo: n(p.saldo), tasa_anual: n(p.tasa_anual) })),
        ritmos: {
          meses: nMeses,
          ventas_tiendas: porMes('Ventas minoristas'),
          ventas_mayoreo_contado: porMes('Ventas mayoristas'),
          cobros_cartera: porMes('Cobros CxC'),
          pagos_proveedores: porMes('Pagos CxP'),
          gastos_varios: porMes('Gastos varios'),
          otros_ingresos: porMes('Intereses bancarios', 'Otros ingresos'),
          quincena: promedioPago('Nómina'),
          igss: promedioPago('IGSS'),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
