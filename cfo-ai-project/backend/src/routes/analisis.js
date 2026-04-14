const express = require('express');
const router = express.Router();

// Importar agentes
const AnalistaFinanciero = require('../agents/analista/AnalistaFinanciero');
const PredictorCashFlow = require('../agents/predictor/PredictorCashFlow');

// Cache simple en memoria para insights (TTL: 5 minutos)
const insightsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * GET /api/analisis/insights
 * Genera insights automáticos de análisis financiero usando el Analista Financiero
 * Cachea resultados por 1 hora
 */
router.get('/insights', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    const context = req.query.context || 'all';
    const skipCache = req.query.skip_cache === 'true';
    const umbral = parseFloat(req.query.umbral) || 20;

    // Verificar cache
    const cacheKey = `insights_${empresaId}_${context}`;
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
    // Mapear tipos del backend a tipos del frontend
    const mapTipoInsight = (tipoBackend) => {
      const tipoMap = {
        'gasto_anormal': 'gasto',
        'gasto_reducido': 'gasto',
        'gasto_inusual_alto': 'gasto',
        'cliente_en_riesgo': 'alerta',
        'cliente_crecimiento': 'ingreso',
        'tendencia_negativa_cliente': 'alerta',
        'transaccion_anomala': 'alerta',
        'caida_ingresos_brusca': 'alerta',
        'aumento_ingresos_brusco': 'ingreso',
        'tendencia_ingresos_decreciente': 'alerta',
        'deterioro_flujo_caja': 'alerta',
        'proyeccion_variacion': 'oportunidad',
        'margen_decreciente': 'alerta',
        'cxp_vencidas': 'alerta',
        'cxc_vencidas': 'alerta',
        'variacion_umbral': 'alerta',
        'transaccion_fin_semana': 'alerta'
      };
      return tipoMap[tipoBackend] || 'oportunidad';
    };

    // Mapear cada tipo de insight a su contexto de negocio
    const mapContextoInsight = (tipoBackend, category) => {
      const contexts = [];
      
      // Tesorería: flujo de caja, pagos, cobros
      if (['cxp_vencidas', 'cxc_vencidas', 'deterioro_flujo_caja', 'transaccion_fin_semana'].includes(tipoBackend)) {
        contexts.push('tesoreria');
      }
      
      // Contabilidad: gastos, márgenes, transacciones, auditoría
      if (['margen_decreciente', 'gasto_anormal', 'gasto_reducido', 'gasto_inusual_alto', 'variacion_umbral', 'transaccion_anomala'].includes(tipoBackend)) {
        contexts.push('contabilidad');
      }
      
      // Análisis: clientes, proyecciones, tendencias, comparativas
      if (['cliente_en_riesgo', 'cliente_crecimiento', 'tendencia_negativa_cliente', 'proyeccion_variacion', 'caida_ingresos_brusca', 'aumento_ingresos_brusco', 'tendencia_ingresos_decreciente'].includes(tipoBackend)) {
        contexts.push('analisis');
      }
      
      return contexts.length > 0 ? contexts : ['general'];
    };

    const combinedInsights = [
      ...insightsResult.insights.map(i => ({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: mapTipoInsight(i.tipo || i.type),
        severity: i.severidad === 'alta' ? 'critical' : i.severidad === 'media' ? 'warning' : 'info',
        title: i.titulo || i.title || 'Insight',
        description: i.descripcion || i.description || '',
        impact: i.monto_impacto || i.impact || 0,
        currency: i.currency || 'GTQ',
        category: i.categoria || i.category || 'general',
        contexts: mapContextoInsight(i.tipo || i.type, i.categoria || i.category),
        action: i.accion_sugerida || i.action,
        actionLabel: i.actionLabel || 'Ver detalle',
        change: i.cambio || i.change || 0,
        isNew: true
      })),
      ...anomaliesResult.anomalias.map((a, idx) => ({
        id: `anomalia_${Date.now()}_${idx}`,
        type: mapTipoInsight(a.tipo || a.categoria),
        severity: a.severidad === 'critica' ? 'critical' : a.severidad === 'alta' ? 'warning' : 'info',
        title: a.titulo,
        description: a.descripcion,
        impact: a.datos?.monto_actual || a.datos?.monto_total || 0,
        currency: 'GTQ',
        category: a.categoria,
        contexts: mapContextoInsight(a.tipo || a.categoria, a.categoria),
        action: a.accion_recomendada,
        actionLabel: 'Revisar',
        isNew: true
      })),
      ...anomaliesResult.alertas.map((a, idx) => ({
        id: `alerta_${Date.now()}_${idx}`,
        type: mapTipoInsight(a.tipo || a.categoria),
        severity: a.severidad === 'critica' ? 'critical' : a.severidad === 'alta' ? 'warning' : 'info',
        title: a.titulo,
        description: a.descripcion,
        impact: a.datos?.monto_actual || a.datos?.monto_total || a.datos?.flujo_actual || 0,
        currency: 'GTQ',
        category: a.categoria,
        contexts: mapContextoInsight(a.tipo || a.categoria, a.categoria),
        action: a.accion_recomendada,
        actionLabel: 'Revisar',
        isNew: true
      }))
    ];

    // Ordenar por severidad
    const severidadOrder = { critical: 0, warning: 1, info: 2 };
    combinedInsights.sort((a, b) => severidadOrder[a.severity] - severidadOrder[b.severity]);

    // Filtrar por contexto si se solicita
    const filteredInsights = context === 'all' || context === 'dashboard'
      ? combinedInsights
      : combinedInsights.filter(i => i.contexts.includes(context) || i.contexts.includes('general'));

    // Calcular métricas resumen
    const metricas = {
      total_insights: filteredInsights.length,
      por_severidad: {
        critical: filteredInsights.filter(i => i.severity === 'critical').length,
        warning: filteredInsights.filter(i => i.severity === 'warning').length,
        info: filteredInsights.filter(i => i.severity === 'info').length
      },
      por_tipo: filteredInsights.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {}),
      impacto_total_estimado: filteredInsights.reduce((sum, i) => sum + (i.impact || 0), 0)
    };

    const responseData = {
      status: 'success',
      timestamp: new Date().toISOString(),
      source: 'real-time',
      empresa_id: empresaId,
      context: context,
      periodo_analisis: {
        desde: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        hasta: new Date().toISOString().split('T')[0]
      },
      metricas_resumen: metricas,
      insights: filteredInsights,
      acciones_prioritarias: filteredInsights
        .filter(i => i.severity === 'critical' || i.severity === 'warning')
        .slice(0, 5)
        .map(i => i.action),
      _meta: {
        agentes_utilizados: ['AnalistaFinanciero', 'PredictorCashFlow'],
        cache_ttl_minutos: 5,
        parametros: { umbral, context }
      }
    };

    // Guardar en cache
    insightsCache.set(cacheKey, {
      timestamp: Date.now(),
      data: responseData
    });

    // Guardar insights en histórico (async, no bloquea response)
    const saveToHistory = async () => {
      try {
        const db = req.app.get('db');
        for (const insight of combinedInsights) {
          await db.runAsync(`
            INSERT OR REPLACE INTO insights_historico 
            (insight_id, empresa_id, type, severity, title, description, impact, currency, 
             category, action, action_label, change_percent, periodo_desde, periodo_hasta,
             agent_source, agent_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            insight.id,
            empresaId,
            insight.type,
            insight.severity,
            insight.title,
            insight.description,
            insight.impact || 0,
            insight.currency || 'GTQ',
            insight.category,
            insight.action,
            insight.actionLabel,
            insight.change || 0,
            responseData.periodo_analisis.desde,
            responseData.periodo_analisis.hasta,
            'AnalistaFinanciero/PredictorCashFlow',
            '1.0'
          ]);
        }
      } catch (err) {
        console.error('[Insights] Error guardando en histórico:', err.message);
      }
    };
    saveToHistory();

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

// GET /api/analisis/insights/historico - Obtener histórico de insights
router.get('/insights/historico', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status || 'active';
    const type = req.query.type;
    const severity = req.query.severity;
    const days = parseInt(req.query.days) || 30;
    
    let query = `
      SELECT 
        id,
        insight_id as id,
        type,
        severity,
        title,
        description,
        impact,
        currency,
        category,
        action,
        action_label as actionLabel,
        change_percent as change,
        status,
        created_at as createdAt,
        periodo_desde as periodoDesde,
        periodo_hasta as periodoHasta,
        agent_source as agentSource
      FROM insights_historico
      WHERE empresa_id = ? 
        AND status = ?
        AND created_at >= date('now', '-${days} days')
    `;
    
    const params = [empresaId, status];
    
    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }
    
    if (severity) {
      query += ` AND severity = ?`;
      params.push(severity);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const insights = await db.allAsync(query, params);
    
    // Obtener conteos
    const counts = await db.getAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info
      FROM insights_historico
      WHERE empresa_id = ? AND status = 'active'
        AND created_at >= date('now', '-${days} days')
    `, [empresaId]);
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        insights: insights.map(i => ({ ...i, isNew: false })),
        pagination: {
          total: counts?.total || 0,
          limit,
          offset,
          hasMore: (offset + insights.length) < (counts?.total || 0)
        },
        summary: {
          total: counts?.total || 0,
          critical: counts?.critical || 0,
          warning: counts?.warning || 0,
          info: counts?.info || 0
        }
      }
    });
  } catch (error) {
    console.error('[GET /insights/historico] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener histórico de insights',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH /api/analisis/insights/:id/dismiss - Marcar insight como visto
router.patch('/insights/:id/dismiss', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;
    const userId = req.body.user_id || 1;
    
    await db.runAsync(`
      UPDATE insights_historico 
      SET status = 'dismissed', 
          dismissed_at = CURRENT_TIMESTAMP,
          dismissed_by = ?
      WHERE insight_id = ?
    `, [userId, id]);
    
    res.json({
      status: 'success',
      message: 'Insight marcado como visto',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PATCH /insights/dismiss] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar insight',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
