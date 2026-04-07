const express = require('express');
const router = express.Router();

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
