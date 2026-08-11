const express = require('express');
const router = express.Router();

/**
 * GET /api/margen-productos
 * Obtiene el análisis de margen por producto con semáforo de erosión
 */
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    
    // Obtener datos de la vista de margen
    const productos = await db.allAsync(`
      SELECT 
        id,
        sku,
        nombre,
        categoria,
        precio_actual,
        costo_actual,
        ROUND(margen_pct_actual::numeric, 2) as margen_pct_actual,
        ROUND(margen_pct_historico::numeric, 2) as margen_pct_historico,
        ROUND(delta_puntos::numeric, 2) as delta_puntos,
        unidades_12m,
        semaforo,
        ROUND(quetzales_perdidos::numeric, 2) as quetzales_perdidos,
        ROUND(precio_sugerido::numeric, 2) as precio_sugerido
      FROM vw_margen_productos
      WHERE id IN (SELECT id FROM productos WHERE empresa_id = ? AND activo = TRUE)
      ORDER BY 
        CASE semaforo 
          WHEN 'rojo' THEN 1 
          WHEN 'ambar' THEN 2 
          WHEN 'verde' THEN 3 
        END,
        ABS(delta_puntos) DESC
    `, [empresaId]);
    
    // Calcular totales
    const totalMargenPerdido = productos.reduce((sum, p) => sum + (parseFloat(p.quetzales_perdidos) || 0), 0);
    const productosRojo = productos.filter(p => p.semaforo === 'rojo').length;
    const productosAmbar = productos.filter(p => p.semaforo === 'ambar').length;
    const productosVerde = productos.filter(p => p.semaforo === 'verde').length;
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        resumen: {
          total_productos: productos.length,
          total_margen_perdido_12m: totalMargenPerdido,
          productos_rojo: productosRojo,
          productos_ambar: productosAmbar,
          productos_verde: productosVerde
        },
        productos
      }
    });
  } catch (error) {
    console.error('[GET /api/margen-productos] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener análisis de margen por producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/margen-productos/:id/detalle
 * Obtiene el detalle histórico de un producto (24 meses)
 */
router.get('/:id/detalle', async (req, res) => {
  try {
    const db = req.app.get('db');
    const productoId = req.params.id;
    
    // Obtener info del producto
    const producto = await db.getAsync(`
      SELECT p.*, 
        ROUND(AVG((ph.precio_promedio_realizado - ph.costo_unitario) / NULLIF(ph.precio_promedio_realizado, 0) * 100)::numeric, 2) as margen_promedio
      FROM productos p
      LEFT JOIN productos_historial ph ON p.id = ph.producto_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [productoId]);
    
    if (!producto) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }
    
    // Obtener historial de 24 meses
    const historial = await db.allAsync(`
      SELECT 
        fecha,
        precio_promedio_realizado,
        costo_unitario,
        unidades_vendidas,
        ROUND(((precio_promedio_realizado - costo_unitario) / NULLIF(precio_promedio_realizado, 0) * 100)::numeric, 2) as margen_pct
      FROM productos_historial
      WHERE producto_id = ?
      ORDER BY fecha ASC
    `, [productoId]);
    
    // Calcular precio sugerido para recuperar margen histórico
    const margenObjetivo = historial.length > 0 
      ? ((historial[0].precio_promedio_realizado - historial[0].costo_unitario) / historial[0].precio_promedio_realizado * 100)
      : 30;
    const costoActual = historial.length > 0 ? historial[historial.length - 1].costo_unitario : 0;
    const precioSugerido = costoActual > 0 && margenObjetivo > 0 
      ? costoActual / (1 - (margenObjetivo / 100))
      : 0;
    
    res.json({
      status: 'success',
      data: {
        producto,
        historial,
        precio_sugerido: Math.round(precioSugerido * 100) / 100,
        margen_objetivo: Math.round(margenObjetivo * 100) / 100
      }
    });
  } catch (error) {
    console.error('[GET /api/margen-productos/:id/detalle] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/margen-productos/alertas
 * Obtiene alertas de erosión de margen (>3 puntos en 90 días)
 */
router.get('/alertas', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    
    // Detectar productos con erosión > 3 puntos en los últimos 3 meses
    const alertas = await db.allAsync(`
      WITH margen_ultimos_meses AS (
        SELECT 
          ph.producto_id,
          p.sku,
          p.nombre,
          AVG(CASE WHEN ph.fecha >= CURRENT_DATE - INTERVAL '3 months' THEN (ph.precio_promedio_realizado - ph.costo_unitario) / NULLIF(ph.precio_promedio_realizado, 0) * 100 END) as margen_ult_3m,
          AVG(CASE WHEN ph.fecha >= CURRENT_DATE - INTERVAL '6 months' AND ph.fecha < CURRENT_DATE - INTERVAL '3 months' THEN (ph.precio_promedio_realizado - ph.costo_unitario) / NULLIF(ph.precio_promedio_realizado, 0) * 100 END) as margen_prev_3m
        FROM productos_historial ph
        JOIN productos p ON ph.producto_id = p.id
        WHERE p.empresa_id = ? AND p.activo = TRUE
        GROUP BY ph.producto_id, p.sku, p.nombre
        HAVING COUNT(CASE WHEN ph.fecha >= CURRENT_DATE - INTERVAL '3 months' THEN 1 END) >= 2
      )
      SELECT 
        producto_id,
        sku,
        nombre,
        ROUND(margen_ult_3m::numeric, 2) as margen_actual,
        ROUND(margen_prev_3m::numeric, 2) as margen_anterior,
        ROUND((margen_ult_3m - margen_prev_3m)::numeric, 2) as delta_puntos
      FROM margen_ultimos_meses
      WHERE (margen_ult_3m - margen_prev_3m) < -3
      ORDER BY (margen_ult_3m - margen_prev_3m) ASC
    `, [empresaId]);
    
    res.json({
      status: 'success',
      data: {
        total_alertas: alertas.length,
        alertas
      }
    });
  } catch (error) {
    console.error('[GET /api/margen-productos/alertas] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
