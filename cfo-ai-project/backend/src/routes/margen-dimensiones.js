/**
 * Rutas para análisis de márgenes por vendedor, cliente y línea de producto
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ============================================
// MARGEN POR VENDEDOR
// ============================================
router.get('/vendedores', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM vw_margen_vendedor ORDER BY delta_puntos ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error en margen por vendedor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/vendedores/:id/detalle', async (req, res) => {
  try {
    const { id } = req.params;
    // Historial mensual del vendedor
    const historial = await query(`
      SELECT 
        DATE_TRUNC('month', fecha)::date as mes,
        SUM(total_venta) as ventas,
        SUM(total_costo) as costos,
        CASE WHEN SUM(total_venta) > 0 
          THEN ((SUM(total_venta) - SUM(total_costo)) / SUM(total_venta) * 100)
          ELSE 0 END as margen_pct
      FROM ventas_detalle
      WHERE vendedor_id = $1
      GROUP BY DATE_TRUNC('month', fecha)
      ORDER BY mes
    `, [id]);

    // Top productos vendidos por este vendedor
    const productos = await query(`
      SELECT 
        p.nombre,
        SUM(v.cantidad) as unidades,
        SUM(v.total_venta) as ventas,
        CASE WHEN SUM(v.total_venta) > 0 
          THEN ((SUM(v.total_venta) - SUM(v.total_costo)) / SUM(v.total_venta) * 100)
          ELSE 0 END as margen_pct
      FROM ventas_detalle v
      JOIN productos p ON v.producto_id = p.id
      WHERE v.vendedor_id = $1
        AND v.fecha >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY p.id, p.nombre
      ORDER BY ventas DESC
      LIMIT 10
    `, [id]);

    res.json({ success: true, data: { historial: historial.rows, productos: productos.rows } });
  } catch (error) {
    console.error('Error en detalle vendedor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MARGEN POR CLIENTE
// ============================================
router.get('/clientes', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM vw_margen_cliente ORDER BY delta_puntos ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error en margen por cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/clientes/:id/detalle', async (req, res) => {
  try {
    const { id } = req.params;
    // Historial mensual del cliente
    const historial = await query(`
      SELECT 
        DATE_TRUNC('month', fecha)::date as mes,
        SUM(total_venta) as ventas,
        SUM(total_costo) as costos,
        CASE WHEN SUM(total_venta) > 0 
          THEN ((SUM(total_venta) - SUM(total_costo)) / SUM(total_venta) * 100)
          ELSE 0 END as margen_pct
      FROM ventas_detalle
      WHERE cliente_nombre = $1
      GROUP BY DATE_TRUNC('month', fecha)
      ORDER BY mes
    `, [id]);

    // Top productos comprados por este cliente
    const productos = await query(`
      SELECT 
        p.nombre,
        SUM(v.cantidad) as unidades,
        SUM(v.total_venta) as ventas,
        CASE WHEN SUM(v.total_venta) > 0 
          THEN ((SUM(v.total_venta) - SUM(v.total_costo)) / SUM(v.total_venta) * 100)
          ELSE 0 END as margen_pct
      FROM ventas_detalle v
      JOIN productos p ON v.producto_id = p.id
      WHERE v.cliente_nombre = $1
        AND v.fecha >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY p.id, p.nombre
      ORDER BY ventas DESC
      LIMIT 10
    `, [id]);

    res.json({ success: true, data: { historial: historial.rows, productos: productos.rows } });
  } catch (error) {
    console.error('Error en detalle cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MARGEN POR LÍNEA DE PRODUCTO
// ============================================
router.get('/lineas', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM vw_margen_linea ORDER BY delta_puntos ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error en margen por línea:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/lineas/:id/detalle', async (req, res) => {
  try {
    const { id } = req.params;
    // Historial mensual de la línea
    const historial = await query(`
      SELECT 
        DATE_TRUNC('month', ph.fecha)::date as mes,
        SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) as ventas,
        SUM(ph.costo_unitario * ph.unidades_vendidas) as costos,
        CASE WHEN SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) > 0 
          THEN ((SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) - SUM(ph.costo_unitario * ph.unidades_vendidas)) / SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) * 100)
          ELSE 0 END as margen_pct
      FROM productos p
      JOIN productos_historial ph ON p.id = ph.producto_id
      WHERE p.categoria = $1
      GROUP BY DATE_TRUNC('month', ph.fecha)
      ORDER BY mes
    `, [id]);

    // Top productos de esta línea
    const productos = await query(`
      SELECT 
        nombre,
        sku,
        margen_pct_actual,
        delta_puntos,
        quetzales_perdidos,
        unidades_12m
      FROM vw_margen_productos
      WHERE categoria = $1
      ORDER BY delta_puntos ASC
      LIMIT 10
    `, [id]);

    res.json({ success: true, data: { historial: historial.rows, productos: productos.rows } });
  } catch (error) {
    console.error('Error en detalle línea:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
