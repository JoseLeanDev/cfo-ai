const express = require('express');
const router = express.Router();

/**
 * GET /api/margenes
 * Obtiene el análisis completo de márgenes: producto, vendedor, cliente, línea
 */
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;

    // 1. Margen por Producto
    const productos = await db.allAsync(`
      SELECT 
        id, sku, nombre, categoria,
        ROUND(precio_actual::numeric, 2) as precio_actual,
        ROUND(costo_actual::numeric, 2) as costo_actual,
        ROUND(margen_pct_actual::numeric, 2) as margen_pct_actual,
        ROUND(margen_pct_historico::numeric, 2) as margen_pct_historico,
        ROUND(delta_puntos::numeric, 2) as delta_puntos,
        unidades_12m, semaforo,
        ROUND(quetzales_perdidos::numeric, 2) as quetzales_perdidos,
        ROUND(precio_sugerido::numeric, 2) as precio_sugerido
      FROM vw_margen_productos
      WHERE id IN (SELECT id FROM productos WHERE empresa_id = ? AND activo = TRUE)
      ORDER BY ABS(delta_puntos) DESC
    `, [empresaId]);

    // 2. Margen por Vendedor
    const vendedores = await db.allAsync(`
      SELECT * FROM vw_margen_vendedor
      WHERE total_ventas_q IS NOT NULL
      ORDER BY total_ventas_q DESC
    `);

    // 3. Margen por Cliente
    const clientes = await db.allAsync(`
      SELECT * FROM vw_margen_cliente
      ORDER BY total_comprado_q DESC
      LIMIT 50
    `);

    // 4. Margen por Línea
    const lineas = await db.allAsync(`
      SELECT * FROM vw_margen_linea
      ORDER BY total_ventas_q DESC
    `);

    // 5. Totales
    const totalMargenPerdido = productos.reduce((sum, p) => sum + (parseFloat(p.quetzales_perdidos) || 0), 0);
    const totalVentas = vendedores.reduce((sum, v) => sum + (parseFloat(v.total_ventas_q) || 0), 0);
    const totalMargen = vendedores.reduce((sum, v) => sum + (parseFloat(v.margen_bruto_q) || 0), 0);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        resumen: {
          total_productos: productos.length,
          total_margen_perdido_12m: totalMargenPerdido,
          total_ventas_q: totalVentas,
          total_margen_bruto_q: totalMargen,
          margen_global_pct: totalVentas > 0 ? Math.round((totalMargen / totalVentas) * 100 * 100) / 100 : 0,
          productos_rojo: productos.filter(p => p.semaforo === 'rojo').length,
          productos_ambar: productos.filter(p => p.semaforo === 'ambar').length,
          productos_verde: productos.filter(p => p.semaforo === 'verde').length,
        },
        productos,
        vendedores,
        clientes,
        lineas,
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
      SELECT p.*, 
        ROUND(AVG((ph.precio_promedio_realizado - ph.costo_unitario) / NULLIF(ph.precio_promedio_realizado, 0) * 100)::numeric, 2) as margen_promedio
      FROM productos p
      LEFT JOIN productos_historial ph ON p.id = ph.producto_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [productoId]);

    if (!producto) return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });

    const historial = await db.allAsync(`
      SELECT fecha, precio_promedio_realizado, costo_unitario, unidades_vendidas,
        ROUND(((precio_promedio_realizado - costo_unitario) / NULLIF(precio_promedio_realizado, 0) * 100)::numeric, 2) as margen_pct
      FROM productos_historial
      WHERE producto_id = ?
      ORDER BY fecha ASC
    `, [productoId]);

    res.json({ status: 'success', data: { producto, historial } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// MARGEN POR VENDEDOR
// ============================================
router.get('/vendedores', async (req, res) => {
  try {
    const db = req.app.get('db');
    const result = await db.allAsync(`
      SELECT 
        v.id,
        v.nombre,
        COALESCE(SUM(vd.total_venta), 0) as ventas_12m,
        COALESCE(SUM(vd.margen_q), 0) as margen_bruto_q,
        ROUND((COALESCE(SUM(vd.margen_q), 0) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct_actual,
        COUNT(DISTINCT vd.id) as num_ventas,
        SUM(vd.cantidad) as unidades_vendidas
      FROM vendedores v
      LEFT JOIN ventas_detalle vd ON v.id = vd.vendedor_id
      WHERE v.activo = TRUE
      GROUP BY v.id, v.nombre
      ORDER BY ventas_12m DESC
    `);
    
    // Mapear al formato que espera el frontend
    const mapped = result.map(v => ({
      id: v.id,
      nombre: v.nombre,
      ventas_12m: parseFloat(v.ventas_12m) || 0,
      margen_pct_actual: parseFloat(v.margen_pct_actual) || 0,
      margen_pct_historico: 0, // No tenemos histórico por vendedor aún
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
// MARGEN POR CLIENTE
// ============================================
router.get('/clientes', async (req, res) => {
  try {
    const db = req.app.get('db');
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
      GROUP BY vd.cliente_nombre
      ORDER BY ventas_12m DESC
      LIMIT 50
    `);
    
    // Mapear al formato que espera el frontend
    const mapped = result.map(c => ({
      id: c.nombre, // Usar nombre como ID para clientes
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
// MARGEN POR LÍNEA
// ============================================
router.get('/lineas', async (req, res) => {
  try {
    const db = req.app.get('db');
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
      WHERE p.activo = TRUE
      GROUP BY p.categoria
      ORDER BY ventas_12m DESC
    `);
    
    // Mapear al formato que espera el frontend
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

module.exports = router;
// deploy: Thu Aug 13 07:50:19 AM CST 2026
