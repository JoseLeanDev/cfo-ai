const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

// ============================================================
// REPORTES FINANCIEROS - Endpoints para generar reportes tabulares
// ============================================================

// Helper: construir WHERE clause con params
function buildDateRange(params) {
  const conditions = [];
  const values = [];
  let idx = 1;
  
  if (params.fecha_desde) {
    conditions.push(`fecha >= $${idx}`);
    values.push(params.fecha_desde);
    idx++;
  }
  if (params.fecha_hasta) {
    conditions.push(`fecha <= $${idx}`);
    values.push(params.fecha_hasta);
    idx++;
  }
  if (params.cuenta_id) {
    conditions.push(`cuenta_id = $${idx}`);
    values.push(params.cuenta_id);
    idx++;
  }
  if (params.cliente_id) {
    conditions.push(`cliente_id = $${idx}`);
    values.push(params.cliente_id);
    idx++;
  }
  if (params.proveedor_id) {
    conditions.push(`proveedor_id = $${idx}`);
    values.push(params.proveedor_id);
    idx++;
  }
  if (params.cuenta_bancaria_id) {
    conditions.push(`cuenta_bancaria_id = $${idx}`);
    values.push(params.cuenta_bancaria_id);
    idx++;
  }
  if (params.estado) {
    conditions.push(`estado = $${idx}`);
    values.push(params.estado);
    idx++;
  }
  if (params.tipo) {
    conditions.push(`tipo = $${idx}`);
    values.push(params.tipo);
    idx++;
  }
  if (params.categoria) {
    conditions.push(`categoria = $${idx}`);
    values.push(params.categoria);
    idx++;
  }
  
  return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', values, nextIdx: idx };
}

// Helper: paginación
function buildPagination(params, nextIdx) {
  let limit = parseInt(params.limit) || 1000;
  let offset = parseInt(params.offset) || 0;
  if (limit > 5000) limit = 5000;
  return { clause: `LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`, values: [limit, offset] };
}

// --- 1. ESTADO DE RESULTADOS (P&L) ---
router.get('/estado-resultados', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empresa_id = 1 } = req.query;
    
    const ingresos = await db.allAsync(`
      SELECT cc.codigo, cc.nombre, cc.tipo, SUM(CASE WHEN t.tipo = 'haber' THEN t.monto ELSE -t.monto END) as total
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      WHERE cc.tipo = 'ingreso' AND t.estado = 'activa'
        AND t.empresa_id = $1 AND t.fecha BETWEEN $2 AND $3
      GROUP BY cc.id, cc.codigo, cc.nombre, cc.tipo
      ORDER BY cc.codigo
    `, [empresa_id, fecha_desde || '2000-01-01', fecha_hasta || '2099-12-31']);
    
    const gastos = await db.allAsync(`
      SELECT cc.codigo, cc.nombre, cc.tipo, SUM(CASE WHEN t.tipo = 'debe' THEN t.monto ELSE -t.monto END) as total
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      WHERE cc.tipo = 'gasto' AND t.estado = 'activa'
        AND t.empresa_id = $1 AND t.fecha BETWEEN $2 AND $3
      GROUP BY cc.id, cc.codigo, cc.nombre, cc.tipo
      ORDER BY cc.codigo
    `, [empresa_id, fecha_desde || '2000-01-01', fecha_hasta || '2099-12-31']);
    
    const totalIngresos = ingresos.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.total || 0), 0);
    
    res.json({
      success: true,
      reporte: 'estado-resultados',
      periodo: { desde: fecha_desde, hasta: fecha_hasta },
      resumen: { total_ingresos: totalIngresos, total_gastos: totalGastos, utilidad_neta: totalIngresos - totalGastos },
      columnas: ['codigo', 'nombre', 'tipo', 'total'],
      data: [
        ...ingresos.map(i => ({ ...i, total: parseFloat(i.total) })),
        { codigo: '', nombre: 'TOTAL INGRESOS', tipo: 'resumen', total: totalIngresos },
        ...gastos.map(g => ({ ...g, total: parseFloat(g.total) })),
        { codigo: '', nombre: 'TOTAL GASTOS', tipo: 'resumen', total: totalGastos },
        { codigo: '', nombre: 'UTILIDAD NETA', tipo: 'resumen', total: totalIngresos - totalGastos }
      ]
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 2. BALANCE GENERAL ---
router.get('/balance-general', async (req, res) => {
  try {
    const { fecha_hasta, empresa_id = 1 } = req.query;
    
    const saldos = await db.allAsync(`
      SELECT cc.codigo, cc.nombre, cc.tipo, sc.saldo_actual
      FROM cuentas_contables cc
      LEFT JOIN saldos_cuentas sc ON cc.id = sc.cuenta_id
      WHERE cc.activa = TRUE AND (sc.empresa_id = $1 OR sc.empresa_id IS NULL)
        AND (sc.periodo <= $2 OR sc.periodo IS NULL)
      ORDER BY cc.codigo
    `, [empresa_id, fecha_hasta || '2099-12-31']);
    
    const activos = saldos.filter(s => s.tipo === 'activo').reduce((a, s) => a + parseFloat(s.saldo_actual || 0), 0);
    const pasivos = saldos.filter(s => s.tipo === 'pasivo').reduce((a, s) => a + parseFloat(s.saldo_actual || 0), 0);
    const capital = saldos.filter(s => s.tipo === 'capital').reduce((a, s) => a + parseFloat(s.saldo_actual || 0), 0);
    
    res.json({
      success: true,
      reporte: 'balance-general',
      periodo: { hasta: fecha_hasta },
      resumen: { activos, pasivos, capital, patrimonio: capital, pasivo_capital: pasivos + capital },
      columnas: ['codigo', 'nombre', 'tipo', 'saldo_actual'],
      data: [
        ...saldos.map(s => ({ ...s, saldo_actual: parseFloat(s.saldo_actual || 0) })),
        { codigo: '', nombre: 'TOTAL ACTIVOS', tipo: 'resumen', saldo_actual: activos },
        { codigo: '', nombre: 'TOTAL PASIVOS', tipo: 'resumen', saldo_actual: pasivos },
        { codigo: '', nombre: 'TOTAL CAPITAL', tipo: 'resumen', saldo_actual: capital },
        { codigo: '', nombre: 'PASIVO + CAPITAL', tipo: 'resumen', saldo_actual: pasivos + capital }
      ]
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 3. LIBRO DIARIO ---
router.get('/libro-diario', async (req, res) => {
  try {
    const params = { fecha_desde: req.query.fecha_desde, fecha_hasta: req.query.fecha_hasta, cuenta_id: req.query.cuenta_id, estado: req.query.estado };
    const { where, values } = buildDateRange(params);
    const pag = buildPagination(req.query, values.length + 1);
    
    const data = await db.allAsync(`
      SELECT t.id, t.fecha, cc.codigo, cc.nombre as cuenta, t.tipo, t.monto, t.concepto as descripcion, t.referencia, t.documento_soporte as documento, t.categoria, t.estado, t.created_at
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      ${where}
      ORDER BY t.fecha DESC, t.id DESC
      ${pag.clause}
    `, [...values, ...pag.values]);
    
    const total = await db.getAsync(`
      SELECT COUNT(*) as count FROM transacciones t ${where}
    `, values);
    
    res.json({ success: true, reporte: 'libro-diario', columnas: ['id','fecha','codigo','cuenta','tipo','monto','descripcion','referencia','documento','categoria','estado'], data, total: parseInt(total?.count || 0) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 4. CUENTAS POR COBRAR (AGING) ---
router.get('/cxc-aging', async (req, res) => {
  try {
    const { fecha_hasta, empresa_id = 1 } = req.query;
    const fHasta = fecha_hasta || new Date().toISOString().split('T')[0];
    
    const data = await db.allAsync(`
      SELECT 
        cliente_nombre,
        factura_numero,
        monto_total,
        monto_pendiente,
        fecha_emision,
        fecha_vencimiento,
        estado,
        dias_atraso,
        CASE 
          WHEN dias_atraso <= 0 THEN 'Al corriente'
          WHEN dias_atraso <= 30 THEN '1-30 días'
          WHEN dias_atraso <= 60 THEN '31-60 días'
          WHEN dias_atraso <= 90 THEN '61-90 días'
          ELSE 'Más de 90 días'
        END as rango
      FROM cuentas_cobrar
      WHERE empresa_id = $1 AND fecha_emision <= $2
      ORDER BY dias_atraso DESC
    `, [empresa_id, fHasta]);
    
    const resumen = {
      total: data.reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      corriente: data.filter(d => d.dias_atraso <= 0).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      rango_1_30: data.filter(d => d.dias_atraso > 0 && d.dias_atraso <= 30).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      rango_31_60: data.filter(d => d.dias_atraso > 30 && d.dias_atraso <= 60).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      rango_61_90: data.filter(d => d.dias_atraso > 60 && d.dias_atraso <= 90).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      mas_90: data.filter(d => d.dias_atraso > 90).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0)
    };
    
    res.json({ success: true, reporte: 'cxc-aging', resumen, columnas: ['cliente_nombre','factura_numero','monto_total','monto_pendiente','fecha_emision','fecha_vencimiento','estado','dias_atraso','rango'], data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 5. CUENTAS POR PAGAR (AGING) ---
router.get('/cxp-aging', async (req, res) => {
  try {
    const { fecha_hasta, empresa_id = 1 } = req.query;
    const fHasta = fecha_hasta || new Date().toISOString().split('T')[0];
    
    const data = await db.allAsync(`
      SELECT 
        proveedor_nombre,
        factura_numero,
        monto_total,
        monto_pendiente,
        fecha_emision,
        fecha_vencimiento,
        estado,
        dias_restantes,
        CASE 
          WHEN dias_restantes >= 0 THEN 'Al corriente'
          WHEN dias_restantes >= -30 THEN '1-30 días vencido'
          WHEN dias_restantes >= -60 THEN '31-60 días vencido'
          WHEN dias_restantes >= -90 THEN '61-90 días vencido'
          ELSE 'Más de 90 días vencido'
        END as rango
      FROM cuentas_pagar
      WHERE empresa_id = $1 AND fecha_emision <= $2
      ORDER BY dias_restantes ASC
    `, [empresa_id, fHasta]);
    
    const resumen = {
      total: data.reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      corriente: data.filter(d => d.dias_restantes >= 0).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      vencido_1_30: data.filter(d => d.dias_restantes < 0 && d.dias_restantes >= -30).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      vencido_31_60: data.filter(d => d.dias_restantes < -30 && d.dias_restantes >= -60).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      vencido_61_90: data.filter(d => d.dias_restantes < -60 && d.dias_restantes >= -90).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0),
      vencido_mas_90: data.filter(d => d.dias_restantes < -90).reduce((s, d) => s + parseFloat(d.monto_pendiente), 0)
    };
    
    res.json({ success: true, reporte: 'cxp-aging', resumen, columnas: ['proveedor_nombre','factura_numero','monto_total','monto_pendiente','fecha_emision','fecha_vencimiento','estado','dias_restantes','rango'], data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 6. MOVIMIENTOS BANCARIOS ---
router.get('/movimientos-bancarios', async (req, res) => {
  try {
    const params = { fecha_desde: req.query.fecha_desde, fecha_hasta: req.query.fecha_hasta, cuenta_bancaria_id: req.query.cuenta_bancaria_id, tipo: req.query.tipo };
    const { where, values } = buildDateRange(params);
    const pag = buildPagination(req.query, values.length + 1);
    
    const data = await db.allAsync(`
      SELECT mb.id, mb.fecha, cb.banco, cb.numero_cuenta, mb.descripcion, mb.monto, mb.tipo, mb.referencia, mb.estado_conciliacion, mb.created_at
      FROM movimientos_bancarios mb
      JOIN cuentas_bancarias cb ON mb.cuenta_bancaria_id = cb.id
      ${where}
      ORDER BY mb.fecha DESC, mb.id DESC
      ${pag.clause}
    `, [...values, ...pag.values]);
    
    const total = await db.getAsync(`SELECT COUNT(*) as count FROM movimientos_bancarios mb ${where}`, values);
    
    res.json({ success: true, reporte: 'movimientos-bancarios', columnas: ['id','fecha','banco','numero_cuenta','descripcion','monto','tipo','referencia','estado_conciliacion'], data, total: parseInt(total?.count || 0) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 7. ANÁLISIS DE VENTAS POR CLIENTE ---
router.get('/ventas-cliente', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empresa_id = 1 } = req.query;
    
    const data = await db.allAsync(`
      SELECT 
        COALESCE(t.nombre_cliente, 'Sin cliente') as cliente,
        COUNT(*) as transacciones,
        SUM(CASE WHEN t.tipo = 'haber' THEN t.monto ELSE 0 END) as total_ventas,
        SUM(CASE WHEN t.tipo = 'debe' THEN t.monto ELSE 0 END) as total_devoluciones,
        SUM(CASE WHEN t.tipo = 'haber' THEN t.monto ELSE -t.monto END) as neto
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      WHERE cc.codigo LIKE '4%' AND t.estado = 'activa' AND t.empresa_id = $1
        AND t.fecha BETWEEN $2 AND $3
      GROUP BY t.nombre_cliente
      ORDER BY neto DESC
    `, [empresa_id, fecha_desde || '2000-01-01', fecha_hasta || '2099-12-31']);
    
    res.json({ success: true, reporte: 'ventas-cliente', columnas: ['cliente','transacciones','total_ventas','total_devoluciones','neto'], data: data.map(d => ({...d, total_ventas: parseFloat(d.total_ventas), total_devoluciones: parseFloat(d.total_devoluciones), neto: parseFloat(d.neto)})) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 8. ANÁLISIS DE VENTAS POR CUENTA/PRODUCTO ---
router.get('/ventas-cuenta', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empresa_id = 1 } = req.query;
    
    const data = await db.allAsync(`
      SELECT 
        cc.codigo,
        cc.nombre as cuenta,
        COUNT(*) as transacciones,
        SUM(CASE WHEN t.tipo = 'haber' THEN t.monto ELSE 0 END) as total
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      WHERE cc.codigo LIKE '4%' AND t.estado = 'activa' AND t.empresa_id = $1
        AND t.fecha BETWEEN $2 AND $3
      GROUP BY cc.id, cc.codigo, cc.nombre
      ORDER BY total DESC
    `, [empresa_id, fecha_desde || '2000-01-01', fecha_hasta || '2099-12-31']);
    
    res.json({ success: true, reporte: 'ventas-cuenta', columnas: ['codigo','cuenta','transacciones','total'], data: data.map(d => ({...d, total: parseFloat(d.total)})) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 9. CONCILIACIONES BANCARIAS ---
router.get('/conciliaciones', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, banco, estado, empresa_id = 1 } = req.query;
    let where = 'WHERE empresa_id = $1';
    let values = [empresa_id];
    let idx = 2;
    
    if (fecha_desde) { where += ` AND fecha_conciliacion >= $${idx++}`; values.push(fecha_desde); }
    if (fecha_hasta) { where += ` AND fecha_conciliacion <= $${idx++}`; values.push(fecha_hasta); }
    if (banco) { where += ` AND banco ILIKE $${idx++}`; values.push(`%${banco}%`); }
    if (estado) { where += ` AND estado = $${idx++}`; values.push(estado); }
    
    const data = await db.allAsync(`
      SELECT id, banco, cuenta_numero, moneda, saldo_contable, saldo_bancario, diferencia, fecha_conciliacion, estado, observaciones
      FROM conciliaciones_bancarias
      ${where}
      ORDER BY fecha_conciliacion DESC
    `, values);
    
    res.json({ success: true, reporte: 'conciliaciones', columnas: ['id','banco','cuenta_numero','moneda','saldo_contable','saldo_bancario','diferencia','fecha_conciliacion','estado','observaciones'], data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 10. RATIOS FINANCIEROS POR PERÍODO ---
router.get('/ratios-financieros', async (req, res) => {
  try {
    const { fecha_hasta, empresa_id = 1 } = req.query;
    const fHasta = fecha_hasta || new Date().toISOString().split('T')[0];
    
    const activos = await db.getAsync(`
      SELECT SUM(CASE WHEN t.tipo = 'debe' THEN t.monto ELSE -t.monto END) as total
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      WHERE cc.tipo = 'activo' AND t.estado = 'activa' AND t.empresa_id = $1 AND t.fecha <= $2
    `, [empresa_id, fHasta]);
    
    const pasivos = await db.getAsync(`
      SELECT SUM(CASE WHEN t.tipo = 'haber' THEN t.monto ELSE -t.monto END) as total
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      WHERE cc.tipo = 'pasivo' AND t.estado = 'activa' AND t.empresa_id = $1 AND t.fecha <= $2
    `, [empresa_id, fHasta]);
    
    const ingresos = await db.getAsync(`
      SELECT SUM(CASE WHEN t.tipo = 'haber' THEN t.monto ELSE -t.monto END) as total
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      WHERE cc.tipo = 'ingreso' AND t.estado = 'activa' AND t.empresa_id = $1 AND t.fecha <= $2
    `, [empresa_id, fHasta]);
    
    const gastos = await db.getAsync(`
      SELECT SUM(CASE WHEN t.tipo = 'debe' THEN t.monto ELSE -t.monto END) as total
      FROM transacciones t
      JOIN cuentas_contables cc ON t.cuenta_id = cc.id
      WHERE cc.tipo = 'gasto' AND t.estado = 'activa' AND t.empresa_id = $1 AND t.fecha <= $2
    `, [empresa_id, fHasta]);
    
    const patrimonio = (parseFloat(activos?.total || 0) - parseFloat(pasivos?.total || 0));
    const utilidad = (parseFloat(ingresos?.total || 0) - parseFloat(gastos?.total || 0));
    
    const ratios = [
      { nombre: 'Liquidez Corriente', formula: 'Activo Corriente / Pasivo Corriente', valor: (parseFloat(activos?.total || 0) / Math.max(parseFloat(pasivos?.total || 1), 1)).toFixed(2), unidad: '', umbral: '1.5', estado: (parseFloat(activos?.total || 0) / Math.max(parseFloat(pasivos?.total || 1), 1)) >= 1.5 ? 'saludable' : 'atencion' },
      { nombre: 'Endeudamiento', formula: 'Pasivo Total / Activo Total', valor: (parseFloat(pasivos?.total || 0) / Math.max(parseFloat(activos?.total || 1), 1)).toFixed(2), unidad: '', umbral: '0.6', estado: (parseFloat(pasivos?.total || 0) / Math.max(parseFloat(activos?.total || 1), 1)) <= 0.6 ? 'saludable' : 'atencion' },
      { nombre: 'ROE', formula: 'Utilidad Neta / Patrimonio', valor: patrimonio !== 0 ? ((utilidad / patrimonio) * 100).toFixed(1) : '0.0', unidad: '%', umbral: '15', estado: (utilidad / Math.max(patrimonio, 1)) * 100 >= 15 ? 'saludable' : 'atencion' },
      { nombre: 'Margen Neto', formula: 'Utilidad Neta / Ingresos', valor: parseFloat(ingresos?.total || 0) !== 0 ? ((utilidad / parseFloat(ingresos?.total || 1)) * 100).toFixed(1) : '0.0', unidad: '%', umbral: '10', estado: (utilidad / Math.max(parseFloat(ingresos?.total || 1), 1)) * 100 >= 10 ? 'saludable' : 'atencion' },
      { nombre: 'Razón de Solvencia', formula: 'Activo Total / Pasivo Total', valor: (parseFloat(activos?.total || 0) / Math.max(parseFloat(pasivos?.total || 1), 1)).toFixed(2), unidad: '', umbral: '1.5', estado: (parseFloat(activos?.total || 0) / Math.max(parseFloat(pasivos?.total || 1), 1)) >= 1.5 ? 'saludable' : 'atencion' }
    ];
    
    res.json({ success: true, reporte: 'ratios-financieros', periodo: { hasta: fHasta }, resumen: { activos: parseFloat(activos?.total || 0), pasivos: parseFloat(pasivos?.total || 0), patrimonio, ingresos: parseFloat(ingresos?.total || 0), gastos: parseFloat(gastos?.total || 0), utilidad }, columnas: ['nombre','formula','valor','unidad','umbral','estado'], data: ratios });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 11. LISTA DE CUENTAS BANCARIAS ---
router.get('/cuentas-bancarias', async (req, res) => {
  try {
    const data = await db.allAsync(`
      SELECT id, banco, tipo, numero_cuenta, saldo, moneda, ultima_conciliacion, activa
      FROM cuentas_bancarias
      WHERE empresa_id = $1
      ORDER BY banco, numero_cuenta
    `, [req.query.empresa_id || 1]);
    
    res.json({ success: true, reporte: 'cuentas-bancarias', columnas: ['id','banco','tipo','numero_cuenta','saldo','moneda','ultima_conciliacion','activa'], data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 12. LISTA DE CUENTAS CONTABLES ---
router.get('/cuentas-contables', async (req, res) => {
  try {
    const data = await db.allAsync(`
      SELECT cc.id, cc.codigo, cc.nombre, cc.tipo, cc.nivel, cc.activa, COALESCE(sc.saldo_actual, 0) as saldo
      FROM cuentas_contables cc
      LEFT JOIN saldos_cuentas sc ON cc.id = sc.cuenta_id AND sc.periodo = $1
      WHERE cc.empresa_id = $2
      ORDER BY cc.codigo
    `, [req.query.periodo || new Date().toISOString().slice(0,7), req.query.empresa_id || 1]);
    
    res.json({ success: true, reporte: 'cuentas-contables', columnas: ['id','codigo','nombre','tipo','nivel','activa','saldo'], data: data.map(d => ({...d, saldo: parseFloat(d.saldo)})) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- 13. OBLIGACIONES SAT ---
router.get('/obligaciones-sat', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, estado, empresa_id = 1 } = req.query;
    let where = 'WHERE empresa_id = $1';
    let values = [empresa_id];
    let idx = 2;
    
    if (fecha_desde) { where += ` AND fecha_vencimiento >= $${idx++}`; values.push(fecha_desde); }
    if (fecha_hasta) { where += ` AND fecha_vencimiento <= $${idx++}`; values.push(fecha_hasta); }
    if (estado) { where += ` AND estado = $${idx++}`; values.push(estado); }
    
    const data = await db.allAsync(`
      SELECT id, tipo, periodo, fecha_vencimiento, estado, monto_estimado, created_at
      FROM obligaciones_sat
      ${where}
      ORDER BY fecha_vencimiento ASC
    `, values);
    
    res.json({ success: true, reporte: 'obligaciones-sat', columnas: ['id','tipo','periodo','fecha_vencimiento','estado','monto_estimado','created_at'], data: data.map(d => ({...d, monto_estimado: parseFloat(d.monto_estimado || 0)})) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
