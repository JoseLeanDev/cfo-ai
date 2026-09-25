const express = require('express');
const router = express.Router();

const { generarHallazgos, filtrarPorContexto } = require('../services/hallazgos');

const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');

// Cache simple en memoria para insights (TTL: 5 minutos)
const insightsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * GET /api/analisis/insights?context=dashboard|tesoreria|analisis|contabilidad|ventas
 * Hallazgos de los agentes para una pantalla. Caché de 5 minutos.
 */
router.get('/insights', async (req, res) => {
  // Hallazgos calculados de la capa semántica (ver services/hallazgos.js). Son
  // los mismos números que responde el chat, porque salen de las mismas vistas.
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    const context = req.query.context || 'all';
    const skipCache = req.query.skip_cache === 'true';

    const cacheKey = `hallazgos_${empresaId}`;
    const cached = insightsCache.get(cacheKey);
    let todos;
    let fuente = 'capa_semantica';

    if (!skipCache && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      todos = cached.data;
      fuente = 'cache';
    } else {
      todos = await generarHallazgos(db);
      insightsCache.set(cacheKey, { timestamp: Date.now(), data: todos });

      // Histórico: el id es estable por fecha de corte, así que cada hallazgo
      // actualiza su propia fila. Antes los ids llevaban Date.now() y cada
      // visita insertaba filas nuevas (79 mil en unos meses).
      Promise.all(todos.map((x) => db.runAsync(`
        INSERT INTO insights_historico
          (insight_id, empresa_id, type, severity, title, description, impact, currency,
           category, action, action_label, agent_source, agent_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Qora', '2.0')
        ON CONFLICT (insight_id) DO UPDATE SET
          severity = EXCLUDED.severity, title = EXCLUDED.title,
          description = EXCLUDED.description, impact = EXCLUDED.impact,
          updated_at = CURRENT_TIMESTAMP
      `, [x.id, empresaId, x.type, x.severity, x.title, x.description, x.impact || 0,
          x.currency, x.category, x.action, x.actionLabel])))
        .catch((err) => console.error('[Insights] Error guardando en histórico:', err.message));
    }

    const insights = filtrarPorContexto(todos, context).slice(0, 6);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      source: fuente,
      empresa_id: empresaId,
      context,
      metricas_resumen: {
        total_insights: insights.length,
        por_severidad: {
          critical: insights.filter((i) => i.severity === 'critical').length,
          warning: insights.filter((i) => i.severity === 'warning').length,
          info: insights.filter((i) => i.severity === 'info').length,
        },
      },
      insights,
      acciones_prioritarias: insights
        .filter((i) => i.severity === 'critical' || i.severity === 'warning')
        .map((i) => i.action),
    });
  } catch (error) {
    console.error('[GET /api/analisis/insights] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al generar los hallazgos',
      timestamp: new Date().toISOString(),
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
    
    // Detectar PostgreSQL
    const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');
    
    let query = `
      SELECT 
        insight_id as id,
        type,
        severity,
        title,
        description,
        impact,
        currency,
        category,
        action,
        action_label,
        change_percent as change,
        status,
        created_at,
        periodo_desde,
        periodo_hasta,
        agent_source
      FROM insights_historico
      WHERE empresa_id = ? 
        AND status = ?
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
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
    
    // Mapear snake_case a camelCase
    const insightsMapped = insights.map(i => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      title: i.title,
      description: i.description,
      impact: i.impact,
      currency: i.currency,
      category: i.category,
      action: i.action,
      actionLabel: i.action_label,
      change: i.change,
      status: i.status,
      createdAt: i.created_at,
      periodoDesde: i.periodo_desde,
      periodoHasta: i.periodo_hasta,
      agentSource: i.agent_source,
      isNew: false
    }));
    
    // Obtener conteos
    const counts = await db.getAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info
      FROM insights_historico
      WHERE empresa_id = ? AND status = 'active'
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `, [empresaId]);
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        insights: insightsMapped,
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

// GET /api/analisis/working-capital
// Calcula métricas de capital de trabajo: DSO, DPO, DIO, C2C
router.get('/working-capital', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    const periodoMeses = parseInt(req.query.meses) || 6;
    
    console.log(`[working-capital] empresa_id=${empresaId}, meses=${periodoMeses}`);
    console.log(`[working-capital] DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    
    // Detectar si es PostgreSQL o SQLite
    const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');
    console.log(`[working-capital] isPostgres: ${isPostgres}`);
    
    // ===== DSO (Days Sales Outstanding) =====
    const dsoQuery = isPostgres ? `
      SELECT 
        COALESCE(AVG(dias_atraso), 35)::numeric as dias_promedio_atraso,
        COUNT(*)::integer as total_facturas,
        COALESCE(SUM(CASE WHEN dias_atraso > 0 THEN monto_pendiente ELSE 0 END), 0)::numeric as monto_vencido,
        COALESCE(SUM(monto_pendiente), 0)::numeric as monto_total_cxc
      FROM cuentas_cobrar 
      WHERE empresa_id = $1
    ` : `
      SELECT 
        COALESCE(AVG(dias_atraso), 35) as dias_promedio_atraso,
        COUNT(*) as total_facturas,
        COALESCE(SUM(CASE WHEN dias_atraso > 0 THEN monto ELSE 0 END), 0) as monto_vencido,
        COALESCE(SUM(monto), 0) as monto_total_cxc
      FROM cuentas_cobrar 
      WHERE empresa_id = ?
    `;
    
    console.log(`[working-capital] Executing DSO query...`);
    let dsoData;
    try {
      dsoData = await db.getAsync(dsoQuery, isPostgres ? [empresaId] : [empresaId]);
      console.log(`[working-capital] DSO raw result:`, JSON.stringify(dsoData));
    } catch (queryErr) {
      console.error(`[working-capital] DSO query error:`, queryErr.message);
      dsoData = null;
    }
    
    // FORZAR valores por defecto si no hay datos o si son null/undefined/0
    const dsoValorRaw = dsoData?.dias_promedio_atraso;
    const dsoCountRaw = dsoData?.total_facturas;
    const hasDsoData = dsoValorRaw !== null && dsoValorRaw !== undefined && parseFloat(dsoValorRaw) > 0;
    
    console.log(`[working-capital] hasDsoData: ${hasDsoData}, valor: ${dsoValorRaw}, count: ${dsoCountRaw}`);
    
    if (!hasDsoData) {
      console.log(`[working-capital] Using DEFAULT DSO values`);
      dsoData = {
        dias_promedio_atraso: 35,
        total_facturas: 0,
        monto_vencido: 0,
        monto_total_cxc: 0
      };
    }
    
    const dso = {
      valor: Math.round(parseFloat(dsoData?.dias_promedio_atraso) || 30),
      benchmark_sector: 38,
      monto_vencido: parseFloat(dsoData?.monto_vencido) || 0,
      monto_total: parseFloat(dsoData?.monto_total_cxc) || 0,
      porcentaje_vencido: dsoData?.monto_total_cxc > 0 
        ? ((parseFloat(dsoData?.monto_vencido) || 0) / parseFloat(dsoData?.monto_total_cxc) * 100).toFixed(1)
        : 0
    };
    
    // ===== DPO (Days Payable Outstanding) =====
    const dpoQuery = isPostgres ? `
      SELECT 
        COALESCE(AVG(EXTRACT(DAY FROM (fecha_vencimiento - fecha_emision))), 30)::numeric as dias_plazo_promedio,
        COUNT(*)::integer as total_facturas,
        COALESCE(SUM(CASE WHEN fecha_vencimiento < CURRENT_DATE AND estado = 'pendiente' THEN monto_total ELSE 0 END), 0)::numeric as monto_vencido
      FROM cuentas_pagar 
      WHERE empresa_id = $1
    ` : `
      SELECT 
        COALESCE(AVG(CAST((fecha_vencimiento::date - fecha_emision::date) AS INTEGER)), 30) as dias_plazo_promedio,
        COUNT(*) as total_facturas,
        COALESCE(SUM(CASE WHEN fecha_vencimiento < CURRENT_DATE AND estado = 'pendiente' THEN monto ELSE 0 END), 0) as monto_vencido
      FROM cuentas_pagar 
      WHERE empresa_id = ?
    `;
    
    console.log(`[working-capital] Executing DPO query...`);
    let dpoData;
    try {
      dpoData = await db.getAsync(dpoQuery, isPostgres ? [empresaId] : [empresaId]);
      console.log(`[working-capital] DPO raw result:`, JSON.stringify(dpoData));
    } catch (queryErr) {
      console.error(`[working-capital] DPO query error:`, queryErr.message);
      dpoData = null;
    }
    
    // FORZAR valores por defecto si no hay datos
    const dpoValorRaw = dpoData?.dias_plazo_promedio;
    const hasDpoData = dpoValorRaw !== null && dpoValorRaw !== undefined && parseFloat(dpoValorRaw) > 0;
    
    console.log(`[working-capital] hasDpoData: ${hasDpoData}, valor: ${dpoValorRaw}`);
    
    if (!hasDpoData) {
      console.log(`[working-capital] Using DEFAULT DPO values`);
      dpoData = {
        dias_plazo_promedio: 30,
        total_facturas: 0,
        monto_vencido: 0
      };
    }
    
    const dpo = {
      dias_plazo: Math.round(parseFloat(dpoData?.dias_plazo_promedio) || 30),
      dias_real: Math.round(parseFloat(dpoData?.dias_plazo_promedio) || 30),
      benchmark_sector: 45,
      monto_vencido: parseFloat(dpoData?.monto_vencido) || 0
    };
    
    console.log(`[working-capital] DPO final:`, dpo);
    
    // ===== DIO (Days Inventory Outstanding) =====
    const dio = {
      valor: 45,
      benchmark_sector: 40,
      nota: 'Requiere datos de inventario para cálculo real'
    };
    
    // ===== C2C (Cash Conversion Cycle) =====
    const c2c = dio.valor + dso.valor - dpo.dias_real;
    const c2cBenchmark = dio.benchmark_sector + dso.benchmark_sector - dpo.benchmark_sector;
    
    console.log(`[working-capital] C2C calculation: ${dio.valor} + ${dso.valor} - ${dpo.dias_real} = ${c2c}`);
    
    // ===== Tendencias históricas =====
    const tendencias = [];
    
    // ===== Recomendaciones =====
    const recomendaciones = [];
    
    if (dso.valor > dso.benchmark_sector) {
      recomendaciones.push({
        tipo: 'dso_reduccion',
        titulo: `Reducir días de cobro`,
        descripcion: `DSO actual (${dso.valor} días) vs benchmark (${dso.benchmark_sector} días)`,
        prioridad: 'alta',
        impacto_efectivo: dso.monto_vencido || 0,
        acciones: [
          'Implementar descuento 2% por pronto pago',
          'Enviar recordatorios automáticos a los 15 días',
          'Revisar política de crédito para nuevos clientes'
        ]
      });
    }
    
    if (c2c > c2cBenchmark) {
      recomendaciones.push({
        tipo: 'c2c_optimizacion',
        titulo: `Optimizar Cash Conversion Cycle`,
        descripcion: `C2C actual (${c2c} días) vs óptimo (${c2cBenchmark} días)`,
        prioridad: 'alta',
        impacto_efectivo: Math.round(c2c * 5000),
        acciones: [
          'Negociar mejores plazos con proveedores',
          'Acelerar proceso de cobranza',
          'Reducir niveles de inventario'
        ]
      });
    }
    
    console.log(`[working-capital] Preparing response...`);
    
    const respuesta = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        periodo_analisis: `${periodoMeses} meses`,
        metricas_principales: {
          dso: {
            nombre: 'Days Sales Outstanding',
            descripcion: 'Días promedio de cobro',
            valor: dso.valor,
            unidad: 'días',
            benchmark: dso.benchmark_sector,
            diferencia_benchmark: dso.valor - dso.benchmark_sector,
            status: dso.valor <= dso.benchmark_sector ? 'optimo' : dso.valor <= dso.benchmark_sector + 10 ? 'atencion' : 'critico',
            monto_vencido: dso.monto_vencido,
            porcentaje_vencido: parseFloat(dso.porcentaje_vencido)
          },
          dpo: {
            nombre: 'Days Payable Outstanding',
            descripcion: 'Días promedio de pago a proveedores',
            dias_plazo: dpo.dias_plazo,
            dias_real: dpo.dias_real,
            unidad: 'días',
            benchmark: dpo.benchmark_sector,
            monto_vencido: dpo.monto_vencido
          },
          dio: {
            nombre: 'Days Inventory Outstanding',
            descripcion: 'Días de inventario',
            valor: dio.valor,
            unidad: 'días',
            benchmark: dio.benchmark_sector,
            nota: dio.nota
          },
          c2c: {
            nombre: 'Cash Conversion Cycle',
            descripcion: 'Ciclo de conversión de efectivo',
            valor: c2c,
            formula: 'DIO + DSO - DPO',
            detalle: `${dio.valor} + ${dso.valor} - ${dpo.dias_real} = ${c2c}`,
            unidad: 'días',
            interpretacion: c2c < 30 ? 'Excelente' : c2c < 60 ? 'Bueno' : c2c < 90 ? 'Regular' : 'Necesita atención',
            benchmark: c2cBenchmark
          }
        },
        tendencias_mensuales: tendencias,
        recomendaciones: recomendaciones,
        alertas: [],
        resumen_ejecutivo: {
          efectivo_atraso_cobro: dso.monto_vencido,
          oportunidad_optimizacion: 0,
          dias_efectivo_atrapado: c2c
        }
      },
      debug_info: {
        is_postgres: isPostgres,
        empresa_id: empresaId,
        dso_raw_query: hasDsoData,
        dpo_raw_query: hasDpoData
      }
    };
    
    console.log(`[working-capital] Response sent successfully`);
    res.json(respuesta);
    
  } catch (error) {
    console.error('[GET /working-capital] Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al calcular métricas de working capital',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
