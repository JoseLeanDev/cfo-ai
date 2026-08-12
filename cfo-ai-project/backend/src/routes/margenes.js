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

module.exports = router;
