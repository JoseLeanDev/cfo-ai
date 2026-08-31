const express = require('express');
const router = express.Router();

/**
 * Helper para construir WHERE clause con filtros
 */
function buildFilters(req) {
  const conditions = [];
  const params = [];
  
  if (req.query.marca_id) {
    conditions.push('vd.marca_id = $' + (params.length + 1));
    params.push(req.query.marca_id);
  }
  if (req.query.tienda_id) {
    conditions.push('vd.tienda_id = $' + (params.length + 1));
    params.push(req.query.tienda_id);
  }
  if (req.query.pais_id) {
    conditions.push('vd.pais_id = $' + (params.length + 1));
    params.push(req.query.pais_id);
  }
  
  return { where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '', params };
}

/**
 * GET /api/margenes
 * Obtiene el análisis completo de márgenes con filtros opcionales
 * Query params: ?marca_id=1&tienda_id=5&pais_id=1
 */
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    const { where, params } = buildFilters(req);

    // 1. Margen por Producto (con filtros)
    let productosQuery = `
      SELECT 
        p.id, p.sku, p.nombre, p.categoria,
        ROUND(AVG(vd.precio_unitario)::numeric, 2) as precio_actual,
        ROUND(AVG(vd.costo_unitario)::numeric, 2) as costo_actual,
        ROUND(AVG(vd.margen_pct)::numeric, 2) as margen_pct_actual,
        SUM(vd.cantidad) as unidades_12m,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct_calc
      FROM productos p
      LEFT JOIN ventas_detalle vd ON p.id = vd.producto_id ${where.replace('vd.', 'vd.')}
      WHERE p.empresa_id = $${params.length + 1} AND p.activo = TRUE
      GROUP BY p.id, p.sku, p.nombre, p.categoria
      ORDER BY margen_pct_calc DESC NULLS LAST
    `;
    
    const productosParams = [...params, empresaId];
    const productos = await db.allAsync(productosQuery, productosParams);

    // Añadir semáforo y campos calculados
    const productosConSemaforo = productos.map(p => {
      const margen = parseFloat(p.margen_pct_calc) || 0;
      return {
        ...p,
        margen_pct_actual: margen.toFixed(2),
        margen_pct_historico: (margen + 5).toFixed(2), // Simulado
        delta_puntos: (-5).toFixed(2), // Simulado
        semaforo: margen < 25 ? 'rojo' : margen < 40 ? 'ambar' : 'verde',
        quetzales_perdidos: '0.00',
        precio_sugerido: p.precio_actual,
      };
    });

    // 2. Margen por Vendedor
    let vendedoresQuery = `
      SELECT 
        v.id, v.nombre,
        COALESCE(SUM(vd.total_venta), 0) as total_ventas_q,
        COALESCE(SUM(vd.margen_q), 0) as margen_bruto_q,
        ROUND((COALESCE(SUM(vd.margen_q), 0) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas
      FROM vendedores v
      LEFT JOIN ventas_detalle vd ON v.id = vd.vendedor_id ${where}
      WHERE v.activo = TRUE
      GROUP BY v.id, v.nombre
      ORDER BY total_ventas_q DESC
    `;
    const vendedores = await db.allAsync(vendedoresQuery, params);

    // 3. Margen por Cliente
    let clientesQuery = `
      SELECT 
        vd.cliente_nombre as cliente_nombre,
        COUNT(DISTINCT vd.id) as num_compras,
        SUM(vd.cantidad) as unidades_compradas,
        SUM(vd.total_venta) as total_comprado_q,
        SUM(vd.total_costo) as total_costo_q,
        SUM(vd.margen_q) as margen_generado_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct,
        MIN(vd.fecha) as primera_compra,
        MAX(vd.fecha) as ultima_compra
      FROM ventas_detalle vd
      ${where}
      GROUP BY vd.cliente_nombre
      ORDER BY total_comprado_q DESC
      LIMIT 50
    `;
    const clientes = await db.allAsync(clientesQuery, params);

    // 4. Margen por Línea
    let lineasQuery = `
      SELECT 
        p.categoria as linea,
        COUNT(DISTINCT p.id) as num_skus,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct
      FROM productos p
      LEFT JOIN ventas_detalle vd ON p.id = vd.producto_id ${where.replace('WHERE', 'AND').replace('vd.', 'vd.')}
      WHERE p.activo = TRUE
      GROUP BY p.categoria
      ORDER BY total_ventas_q DESC
    `;
    // Fix: la query de lineas necesita un approach diferente
    let lineasQuery2 = `
      SELECT 
        p.categoria as linea,
        COUNT(DISTINCT p.id) as num_skus,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct
      FROM productos p
      LEFT JOIN ventas_detalle vd ON p.id = vd.producto_id
      ${where}
      GROUP BY p.categoria
      ORDER BY total_ventas_q DESC
    `;
    const lineas = await db.allAsync(lineasQuery2, params);

    // 5. Margen por MARCA (nuevo)
    let marcasQuery = `
      SELECT 
        m.id, m.codigo, m.nombre, m.segmento,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct
      FROM marcas m
      LEFT JOIN ventas_detalle vd ON m.id = vd.marca_id
      WHERE m.activo = TRUE
      GROUP BY m.id, m.codigo, m.nombre, m.segmento
      ORDER BY total_ventas_q DESC
    `;
    const marcasResult = await db.allAsync(marcasQuery);

    // 6. Margen por TIENDA (nuevo)
    let tiendasQuery = `
      SELECT 
        t.id, t.codigo, t.nombre, t.ciudad, t.tipo,
        pais.nombre as pais,
        mar.nombre as marca,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct
      FROM tiendas t
      JOIN paises pais ON t.pais_id = pais.id
      JOIN marcas mar ON t.marca_id = mar.id
      LEFT JOIN ventas_detalle vd ON t.id = vd.tienda_id
      WHERE t.activo = TRUE
      GROUP BY t.id, t.codigo, t.nombre, t.ciudad, t.tipo, pais.nombre, mar.nombre
      ORDER BY total_ventas_q DESC
    `;
    const tiendasResult = await db.allAsync(tiendasQuery);

    // 7. Margen por PAIS (nuevo)
    let paisesQuery = `
      SELECT 
        pa.id, pa.codigo_iso, pa.nombre, pa.moneda,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct
      FROM paises pa
      LEFT JOIN ventas_detalle vd ON pa.id = vd.pais_id
      WHERE pa.activo = TRUE
      GROUP BY pa.id, pa.codigo_iso, pa.nombre, pa.moneda
      ORDER BY total_ventas_q DESC
    `;
    const paisesResult = await db.allAsync(paisesQuery);

    // 8. Totales
    const totalMargenPerdido = productosConSemaforo.reduce((sum, p) => sum + (parseFloat(p.quetzales_perdidos) || 0), 0);
    const totalVentas = vendedores.reduce((sum, v) => sum + (parseFloat(v.total_ventas_q) || 0), 0);
    const totalMargen = vendedores.reduce((sum, v) => sum + (parseFloat(v.margen_bruto_q) || 0), 0);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      filters: {
        marca_id: req.query.marca_id || null,
        tienda_id: req.query.tienda_id || null,
        pais_id: req.query.pais_id || null,
      },
      data: {
        resumen: {
          total_productos: productosConSemaforo.length,
          total_margen_perdido_12m: totalMargenPerdido,
          total_ventas_q: totalVentas,
          total_margen_bruto_q: totalMargen,
          margen_global_pct: totalVentas > 0 ? Math.round((totalMargen / totalVentas) * 100 * 100) / 100 : 0,
          productos_rojo: productosConSemaforo.filter(p => p.semaforo === 'rojo').length,
          productos_ambar: productosConSemaforo.filter(p => p.semaforo === 'ambar').length,
          productos_verde: productosConSemaforo.filter(p => p.semaforo === 'verde').length,
        },
        productos: productosConSemaforo,
        vendedores,
        clientes,
        lineas,
        marcas: marcasResult,
        tiendas: tiendasResult,
        paises: paisesResult,
      }
    });
  } catch (error) {
    console.error('[GET /api/margenes] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/margenes/producto/:id/detalle
 */
router.get('/producto/:id/detalle', async (req, res) => {
  try {
    const db = req.app.get('db');
    const productoId = req.params.id;

    const producto = await db.getAsync(`
      SELECT p.*, m.nombre as marca_nombre
      FROM productos p
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.id = ?
    `, [productoId]);

    if (!producto) return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });

    const historial = await db.allAsync(`
      SELECT fecha, precio_promedio_realizado, costo_unitario, unidades_vendidas,
        ROUND(((precio_promedio_realizado - costo_unitario) / NULLIF(precio_promedio_realizado, 0) * 100)::numeric, 2) as margen_pct
      FROM productos_historial
      WHERE producto_id = ?
      ORDER BY fecha ASC
    `, [productoId]);

    // Ventas por tienda
    const ventasPorTienda = await db.allAsync(`
      SELECT t.nombre as tienda, pais.nombre as pais, SUM(vd.total_venta) as total_venta, SUM(vd.margen_q) as margen_q
      FROM ventas_detalle vd
      JOIN tiendas t ON vd.tienda_id = t.id
      JOIN paises pais ON vd.pais_id = pais.id
      WHERE vd.producto_id = ?
      GROUP BY t.nombre, pais.nombre
      ORDER BY total_venta DESC
    `, [productoId]);

    res.json({ status: 'success', data: { producto, historial, ventas_por_tienda: ventasPorTienda } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// MARGEN POR VENDEDOR (con filtros)
// ============================================
router.get('/vendedores', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { where, params } = buildFilters(req);
    
    const result = await db.allAsync(`
      SELECT 
        v.id, v.nombre, t.nombre as tienda, pais.nombre as pais,
        COALESCE(SUM(vd.total_venta), 0) as ventas_12m,
        COALESCE(SUM(vd.margen_q), 0) as margen_bruto_q,
        ROUND((COALESCE(SUM(vd.margen_q), 0) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct_actual,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas
      FROM vendedores v
      LEFT JOIN tiendas t ON v.tienda_id = t.id
      LEFT JOIN paises pais ON t.pais_id = pais.id
      LEFT JOIN ventas_detalle vd ON v.id = vd.vendedor_id ${where}
      WHERE v.activo = TRUE
      GROUP BY v.id, v.nombre, t.nombre, pais.nombre
      ORDER BY ventas_12m DESC
    `, params);
    
    const mapped = result.map(v => ({
      id: v.id,
      nombre: v.nombre,
      tienda: v.tienda,
      pais: v.pais,
      ventas_12m: parseFloat(v.ventas_12m) || 0,
      margen_pct_actual: parseFloat(v.margen_pct_actual) || 0,
      margen_pct_historico: 0,
      delta_puntos: 0,
      quetzales_perdidos: 0,
      semaforo: (parseFloat(v.margen_pct_actual) || 0) < 25 ? 'rojo' : (parseFloat(v.margen_pct_actual) || 0) < 35 ? 'ambar' : 'verde',
      unidades_vendidas: parseInt(v.unidades_vendidas) || 0,
      num_ventas: parseInt(v.num_ventas) || 0
    }));
    
    res.json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('[GET /api/margenes/vendedores] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// MARGEN POR CLIENTE (con filtros)
// ============================================
router.get('/clientes', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { where, params } = buildFilters(req);
    
    const result = await db.allAsync(`
      SELECT 
        vd.cliente_nombre as nombre,
        COUNT(DISTINCT vd.id) as num_compras,
        SUM(vd.cantidad) as unidades_compradas,
        SUM(vd.total_venta) as ventas_12m,
        SUM(vd.total_costo) as total_costo_q,
        SUM(vd.margen_q) as margen_generado_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct_actual,
        MIN(vd.fecha) as primera_compra,
        MAX(vd.fecha) as ultima_compra
      FROM ventas_detalle vd
      ${where}
      GROUP BY vd.cliente_nombre
      ORDER BY ventas_12m DESC
      LIMIT 50
    `, params);
    
    const mapped = result.map(c => ({
      id: c.nombre,
      nombre: c.nombre,
      ventas_12m: parseFloat(c.ventas_12m) || 0,
      margen_pct_actual: parseFloat(c.margen_pct_actual) || 0,
      margen_pct_historico: 0,
      delta_puntos: 0,
      quetzales_perdidos: 0,
      semaforo: (parseFloat(c.margen_pct_actual) || 0) < 25 ? 'rojo' : (parseFloat(c.margen_pct_actual) || 0) < 35 ? 'ambar' : 'verde',
      unidades_compradas: parseInt(c.unidades_compradas) || 0,
      num_compras: parseInt(c.num_compras) || 0,
      primera_compra: c.primera_compra,
      ultima_compra: c.ultima_compra
    }));
    
    res.json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('[GET /api/margenes/clientes] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// MARGEN POR LÍNEA (con filtros)
// ============================================
router.get('/lineas', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { where, params } = buildFilters(req);
    
    const result = await db.allAsync(`
      SELECT 
        p.categoria as nombre,
        COUNT(DISTINCT p.id) as num_skus,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_12m,
        SUM(vd.total_venta) as ventas_12m,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct_actual
      FROM productos p
      LEFT JOIN ventas_detalle vd ON p.id = vd.producto_id
      ${where}
      WHERE p.activo = TRUE
      GROUP BY p.categoria
      ORDER BY ventas_12m DESC
    `, params);
    
    const mapped = result.map(l => ({
      id: l.nombre,
      nombre: l.nombre,
      ventas_12m: parseFloat(l.ventas_12m) || 0,
      margen_pct_actual: parseFloat(l.margen_pct_actual) || 0,
      margen_pct_historico: 0,
      delta_puntos: 0,
      quetzales_perdidos: 0,
      semaforo: (parseFloat(l.margen_pct_actual) || 0) < 25 ? 'rojo' : (parseFloat(l.margen_pct_actual) || 0) < 35 ? 'ambar' : 'verde',
      unidades_12m: parseInt(l.unidades_12m) || 0,
      num_skus: parseInt(l.num_skus) || 0,
      num_ventas: parseInt(l.num_ventas) || 0
    }));
    
    res.json({ status: 'success', data: mapped });
  } catch (error) {
    console.error('[GET /api/margenes/lineas] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// MARGEN POR MARCA
// ============================================
router.get('/marcas', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { where, params } = buildFilters(req);
    
    const result = await db.allAsync(`
      SELECT 
        m.id, m.codigo, m.nombre, m.segmento,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct
      FROM marcas m
      LEFT JOIN ventas_detalle vd ON m.id = vd.marca_id
      ${where.replace('WHERE', 'WHERE m.activo = TRUE AND').replace('WHERE m.activo = TRUE AND', 'WHERE m.activo = TRUE AND')}
      GROUP BY m.id, m.codigo, m.nombre, m.segmento
      ORDER BY total_ventas_q DESC
    `, params);
    
    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('[GET /api/margenes/marcas] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// MARGEN POR TIENDA
// ============================================
router.get('/tiendas', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { where, params } = buildFilters(req);
    
    const result = await db.allAsync(`
      SELECT 
        t.id, t.codigo, t.nombre, t.ciudad, t.tipo, t.metros_cuadrados,
        pais.nombre as pais, pais.codigo_iso,
        mar.nombre as marca, mar.segmento,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct,
        ROUND((SUM(vd.total_venta) / NULLIF(t.metros_cuadrados, 0))::numeric, 2) as ventas_por_m2
      FROM tiendas t
      JOIN paises pais ON t.pais_id = pais.id
      JOIN marcas mar ON t.marca_id = mar.id
      LEFT JOIN ventas_detalle vd ON t.id = vd.tienda_id
      ${where}
      WHERE t.activo = TRUE
      GROUP BY t.id, t.codigo, t.nombre, t.ciudad, t.tipo, t.metros_cuadrados, pais.nombre, pais.codigo_iso, mar.nombre, mar.segmento
      ORDER BY total_ventas_q DESC
    `, params);
    
    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('[GET /api/margenes/tiendas] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// MARGEN POR PAIS
// ============================================
router.get('/paises', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { where, params } = buildFilters(req);
    
    const result = await db.allAsync(`
      SELECT 
        pa.id, pa.codigo_iso, pa.nombre, pa.moneda, pa.tipo_cambio_usd,
        COUNT(DISTINCT t.id) as num_tiendas,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas,
        SUM(vd.total_venta) as total_ventas_q,
        SUM(vd.total_costo) as total_costos_q,
        SUM(vd.margen_q) as margen_bruto_q,
        ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct
      FROM paises pa
      LEFT JOIN tiendas t ON pa.id = t.pais_id AND t.activo = TRUE
      LEFT JOIN ventas_detalle vd ON pa.id = vd.pais_id
      WHERE pa.activo = TRUE
      GROUP BY pa.id, pa.codigo_iso, pa.nombre, pa.moneda, pa.tipo_cambio_usd
      ORDER BY total_ventas_q DESC
    `, params);
    
    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('[GET /api/margenes/paises] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// CATÁLOGOS (para filtros)
// ============================================
router.get('/catalogos', async (req, res) => {
  try {
    const db = req.app.get('db');
    
    const [marcas, tiendas, paises] = await Promise.all([
      db.allAsync('SELECT id, codigo, nombre, segmento FROM marcas WHERE activo = TRUE ORDER BY nombre'),
      db.allAsync(`
        SELECT t.id, t.codigo, t.nombre, t.ciudad, t.tipo,
          p.nombre as pais, m.nombre as marca
        FROM tiendas t
        JOIN paises p ON t.pais_id = p.id
        JOIN marcas m ON t.marca_id = m.id
        WHERE t.activo = TRUE
        ORDER BY t.nombre
      `),
      db.allAsync('SELECT id, codigo_iso, nombre, moneda FROM paises WHERE activo = TRUE ORDER BY nombre')
    ]);
    
    res.json({
      status: 'success',
      data: { marcas, tiendas, paises }
    });
  } catch (error) {
    console.error('[GET /api/margenes/catalogos] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
