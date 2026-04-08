const express = require('express');
const router = express.Router();

// Importar agentes
const AnalistaFinanciero = require('../agents/analista/AnalistaFinanciero');
const PredictorCashFlow = require('../agents/predictor/PredictorCashFlow');

// Cache simple en memoria para insights (TTL: 1 hora)
const insightsCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * GET /api/analisis/insights
 * Genera insights automáticos de análisis financiero usando el Analista Financiero
 * Cachea resultados por 1 hora
 */
router.get('/insights', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 'default';
    const skipCache = req.query.skip_cache === 'true';
    const umbral = parseFloat(req.query.umbral) || 20;

    // Verificar cache
    const cacheKey = `insights_${empresaId}`;
    const cached = insightsCache.get(cacheKey);
    
    if (!skipCache && cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({
        status: 'success',
        source: 'cache',
        cached_at: new Date(cached.timestamp).toISOString(),
        expires_at: new Date(cached.timestamp + CACHE_TTL_MS).toISOString(),
        data: cached.data
      });
    }

    // Instanciar agentes
    const analista = new AnalistaFinanciero();
    const predictor = new PredictorCashFlow();

    // Ejecutar análisis en paralelo
    const [insightsResult, anomaliesResult] = await Promise.all([
      analista.generateInsights(db, empresaId),
      predictor.detectAnomalies(db, empresaId, umbral)
    ]);

    // Combinar insights financieros con anomalías de cash flow
    const combinedInsights = [
      ...insightsResult.insights,
      ...anomaliesResult.anomalias.map(a => ({
        tipo: `anomalia_${a.tipo}`,
        severidad: a.severidad === 'critica' ? 'alta' : a.severidad,
        titulo: a.titulo,
        descripcion: a.descripcion,
        monto_impacto: a.datos?.monto_actual || a.datos?.monto_total || 0,
        accion_sugerida: a.accion_recomendada,
        categoria: a.categoria,
        datos_detallados: a.datos
      })),
      ...anomaliesResult.alertas.map(a => ({
        tipo: `alerta_${a.tipo}`,
        severidad: a.severidad === 'critica' ? 'alta' : a.severidad,
        titulo: a.titulo,
        descripcion: a.descripcion,
        monto_impacto: a.datos?.monto_actual || a.datos?.monto_total || a.datos?.flujo_actual || 0,
        accion_sugerida: a.accion_recomendada,
        categoria: a.categoria,
        datos_detallados: a.datos
      }))
    ];

    // Ordenar por severidad
    const severidadOrder = { alta: 0, media: 1, baja: 2 };
    combinedInsights.sort((a, b) => severidadOrder[a.severidad] - severidadOrder[b.severidad]);

    // Calcular métricas resumen
    const metricas = {
      total_insights: combinedInsights.length,
      por_severidad: {
        alta: combinedInsights.filter(i => i.severidad === 'alta').length,
        media: combinedInsights.filter(i => i.severidad === 'media').length,
        baja: combinedInsights.filter(i => i.severidad === 'baja').length
      },
      por_tipo: combinedInsights.reduce((acc, i) => {
        acc[i.tipo] = (acc[i.tipo] || 0) + 1;
        return acc;
      }, {}),
      impacto_total_estimado: combinedInsights.reduce((sum, i) => sum + (i.monto_impacto || 0), 0)
    };

    const responseData = {
      status: 'success',
      timestamp: new Date().toISOString(),
      source: 'real-time',
      empresa_id: empresaId,
      periodo_analisis: {
        desde: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        hasta: new Date().toISOString().split('T')[0]
      },
      metricas_resumen: metricas,
      insights: combinedInsights,
      acciones_prioritarias: combinedInsights
        .filter(i => i.severidad === 'alta')
        .slice(0, 5)
        .map(i => i.accion_sugerida),
      _meta: {
        agentes_utilizados: ['AnalistaFinanciero', 'PredictorCashFlow'],
        cache_ttl_minutos: 60,
        parametros: { umbral }
      }
    };

    // Guardar en cache
    insightsCache.set(cacheKey, {
      timestamp: Date.now(),
      data: responseData
    });

    // Limpiar cache antiguo periódicamente (simple cleanup)
    if (insightsCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of insightsCache.entries()) {
        if (now - value.timestamp > CACHE_TTL_MS) {
          insightsCache.delete(key);
        }
      }
    }

    res.json(responseData);

  } catch (error) {
    console.error('[GET /api/analisis/insights] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al generar insights financieros',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/analisis/insights/cache - Limpiar cache (para admin)
router.delete('/insights/cache', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id;
    
    if (empresaId) {
      insightsCache.delete(`insights_${empresaId}`);
      res.json({
        status: 'success',
        message: `Cache limpiado para empresa ${empresaId}`,
        timestamp: new Date().toISOString()
      });
    } else {
      insightsCache.clear();
      res.json({
        status: 'success',
        message: 'Cache de insights completamente limpiado',
        entries_cleared: insightsCache.size,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/analisis/rentabilidad
router.get('/rentabilidad', async (req, res) => {
  try {
    const dimension = req.query.dimension || 'producto';
    
    const metricas = [
      { categoria: 'Producto A - Detergentes', ventas: 1200000, costo: 780000, margen_bruto: 420000, margen_porcentaje: 35.0, unidades_vendidas: 4500, rentabilidad_rank: 1, trend: 'up' },
      { categoria: 'Producto B - Jabones', ventas: 800000, costo: 560000, margen_bruto: 240000, margen_porcentaje: 30.0, unidades_vendidas: 3200, rentabilidad_rank: 2, trend: 'down' },
      { categoria: 'Producto C - Suavizantes', ventas: 600000, costo: 450000, margen_bruto: 150000, margen_porcentaje: 25.0, unidades_vendidas: 2800, rentabilidad_rank: 3, trend: 'stable' },
      { categoria: 'Producto D - Desinfectantes', ventas: 450000, costo: 360000, margen_bruto: 90000, margen_porcentaje: 20.0, unidades_vendidas: 1800, rentabilidad_rank: 4, trend: 'down' }
    ];

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        dimension,
        periodo: '2026-Q1',
        metricas_agrupadas: metricas,
        insight_principal: 'Detergentes mantienen liderazgo con 35% margen. Jabones muestran contracción de 3pp vs Q4.',
        recomendaciones: [
          'Negociar volumen con proveedor de Producto B para recuperar 2pp de margen',
          'Evaluar descontinuar SKU de jabones líquidos (margen 18%, rotación baja)'
        ]
      },
      ui_components: {
        chart: 'profitability_waterfall',
        table: 'product_profitability'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/analisis/presupuesto
router.get('/presupuesto', async (req, res) => {
  try {
    const periodo = req.query.periodo || '2026';

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        periodo,
        moneda: 'GTQ',
        resumen: {
          presupuesto_anual: 48000000,
          real_acumulado: 12500000,
          varianza_absoluta: 500000,
          varianza_porcentaje: 4.2,
          estado: 'dentro_rango'
        },
        detalle_mensual: [
          { mes: 'Enero', presupuesto: 3800000, real: 3900000, varianza: 100000, var_pct: 2.6, estado: 'verde' },
          { mes: 'Febrero', presupuesto: 3600000, real: 4100000, varianza: 500000, var_pct: 13.9, estado: 'rojo', explicacion: 'Gasto extraordinario mantenimiento' },
          { mes: 'Marzo', presupuesto: 4000000, real: 4500000, varianza: 500000, var_pct: 12.5, estado: 'naranja' }
        ],
        rubros_criticos: [
          { rubro: 'Gastos de viaje', presupuesto: 120000, real: 185000, var_pct: 54.2, accion: 'Congelar aprobaciones Q2' }
        ]
      },
      ui_components: {
        chart: 'budget_vs_actual_bars',
        variance_table: 'detailed_variance'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/analisis/ratios
router.get('/ratios', async (req, res) => {
  try {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        fecha_calculo: new Date().toISOString().split('T')[0],
        ratios: {
          liquidez_corriente: { valor: 1.35, interpretacion: 'Tienes Q1.35 por cada Q1 de deuda corto plazo', benchmark_sector: 1.25, posicion: 'above_average', trend: 'stable', alerta: false },
          prueba_acida: { valor: 0.95, interpretacion: 'Sin inventarios, cubres 95% de deudas corto plazo', benchmark_sector: 0.90, posicion: 'average', trend: 'improving', alerta: false },
          rotacion_cartera: { valor: 45, unidad: 'días', interpretacion: 'Tus clientes te pagan en promedio a 45 días', benchmark_sector: 38, posicion: 'below_average', trend: 'worsening', alerta: true, recomendacion: 'Reducir a 40 días con incentivo 1% pronto pago' },
          roi: { valor: 16.9, unidad: '%', interpretacion: 'Por cada Q100 invertidos, generas Q16.90 de utilidad', benchmark_sector: 14.5, posicion: 'above_average', trend: 'improving', alerta: false }
        }
      },
      ui_components: {
        gauges: 'ratio_gauges_vs_benchmark'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/analisis/tendencias
router.get('/tendencias', async (req, res) => {
  try {
    const metrica = req.query.metrica || 'ventas';
    
    const datosHistoricos = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      datosHistoricos.push({
        periodo: fecha.toISOString().slice(0, 7),
        valor: 3200000 + (11 - i) * 80000 + Math.random() * 200000,
        yoy_growth: i < 4 ? 12.3 - (3 - i) * 2 : null
      });
    }

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        metrica,
        datos_historicos: datosHistoricos,
        tendencia_detectada: 'crecimiento_acelerado',
        cagr_12m: 8.7,
        forecast_proximo_trimestre: [
          { mes: 'Abril', forecast: 4250000, intervalo_confianza: [4100000, 4400000] },
          { mes: 'Mayo', forecast: 4380000, intervalo_confianza: [4200000, 4560000] },
          { mes: 'Junio', forecast: 4520000, intervalo_confianza: [4300000, 4740000] }
        ]
      },
      ui_components: {
        chart: 'trend_line_with_forecast'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
