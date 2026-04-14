/**
 * Predictor de Cash Flow Agent
 * Predice tendencias de flujo de caja
 * Alerta sobre posibles quiebras de tesorería
 */
const BaseAgent = require('../BaseAgent');

class PredictorCashFlow extends BaseAgent {
  constructor() {
    super('PredictorCashFlow', 'cashflow_predictor', [
      'cashflow_forecast',
      'runway_calculation',
      'trend_analysis',
      'liquidity_alerts',
      'scenario_modeling'
    ]);
  }

  async process(input, context) {
    const { query, empresaId } = input;
    const { db } = context;
    
    this.addToMemory('user', query);

    try {
      const query_lower = query.toLowerCase();

      if (query_lower.includes('runway') || query_lower.includes('quiebra') || query_lower.includes('meses')) {
        return await this.calculateRunway(db, empresaId);
      }

      if (query_lower.includes('tendencia') || query_lower.includes('forecast') || query_lower.includes('proyección')) {
        return await this.forecastTrends(db, empresaId);
      }

      if (query_lower.includes('escenario') || query_lower.includes('qué pasa si')) {
        return await this.scenarioAnalysis(db, empresaId, query);
      }

      // Por defecto: análisis completo
      return await this.fullCashflowAnalysis(db, empresaId);

    } catch (error) {
      console.error('[PredictorCashFlow] Error:', error);
      return this.formatResponse(
        'Hubo un error generando las proyecciones.',
        'error'
      );
    }
  }

  async calculateRunway(db, empresaId) {
    // Obtener posición actual
    const posicion = await db.getAsync(`
      SELECT SUM(saldo) as total FROM cuentas_bancarias WHERE empresa_id = ?
    `, [empresaId]);

    const saldoActual = posicion?.total || 0;

    // Calcular gasto promedio mensual (últimos 3 meses)
    const gastos = await db.getAsync(`
      SELECT AVG(monto) as promedio_mensual
      FROM (
        SELECT 
          strftime('%Y-%m', fecha) as mes,
          SUM(monto) as monto
        FROM transacciones 
        WHERE empresa_id = ? 
          AND tipo = 'salida'
          AND fecha >= date('now', '-3 months')
        GROUP BY strftime('%Y-%m', fecha)
      )
    `, [empresaId]);

    const gastoMensual = gastos?.promedio_mensual || 1;
    const runwayMeses = saldoActual / gastoMensual;

    // CxC esperados
    const cxc = await db.getAsync(`
      SELECT SUM(monto) as total,
             SUM(CASE WHEN fecha_vencimiento <= date('now', '+30 days') THEN monto ELSE 0 END) as proximo_mes
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado = 'pendiente'
    `, [empresaId]);

    const data = {
      saldoActual,
      gastoMensualPromedio: gastoMensual,
      runwayMeses: runwayMeses.toFixed(1),
      cxcPendienteTotal: cxc?.total || 0,
      cxcProximoMes: cxc?.proximo_mes || 0,
      runwayConCobros: ((saldoActual + (cxc?.proximo_mes || 0)) / gastoMensual).toFixed(1)
    };

    let response = `🛫 **Análisis de Runway**\n\n`;
    response += `💰 Saldo actual: GTQ ${saldoActual.toLocaleString()}\n`;
    response += `📉 Gasto mensual promedio: GTQ ${gastoMensual.toLocaleString()}\n`;
    response += `🕐 Runway actual: **${data.runwayMeses} meses**\n\n`;

    const recommendations = [];

    if (runwayMeses < 1) {
      response += `🚨 **ALERTA CRÍTICA:** Tienes menos de 1 mes de runway.\n`;
      recommendations.push('Cobrar facturas pendientes URGENTEMENTE');
      recommendations.push('Negociar línea de crédito con banco');
      recommendations.push('Aplazar pagos no críticos');
    } else if (runwayMeses < 3) {
      response += `⚠️ **ALERTA:** Runway por debajo de 3 meses (zona de riesgo).\n`;
      recommendations.push('Implementar plan de aceleración de cobros');
      recommendations.push('Revisar gastos discrecionales para reducir');
    } else if (runwayMeses < 6) {
      response += `⚡ Runway saludable pero monitorear.\n`;
      recommendations.push('Mantener seguimiento semanal de cobros');
    } else {
      response += `✅ Excelente runway. Posición financiera sólida.\n`;
    }

    if (cxc?.proximo_mes > 0) {
      response += `\n📥 Con cobros esperados próximo mes: **${data.runwayConCobros} meses**`;
    }

    return this.formatResponse(response, 'analysis', data, recommendations);
  }

  async forecastTrends(db, empresaId) {
    // Obtener datos de los últimos 6 meses
    const historial = await db.allAsync(`
      SELECT 
        strftime('%Y-%m', fecha) as mes,
        SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as egresos
      FROM transacciones 
      WHERE empresa_id = ? 
        AND fecha >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', fecha)
      ORDER BY mes DESC
      LIMIT 6
    `, [empresaId]);

    if (historial.length === 0) {
      return this.formatResponse(
        'No hay suficientes datos históricos para generar proyecciones.',
        'info'
      );
    }

    // Calcular tendencias
    const utilidades = historial.map(h => ({
      mes: h.mes,
      utilidad: h.ingresos - h.egresos,
      margen: h.ingresos > 0 ? ((h.ingresos - h.egresos) / h.ingresos * 100).toFixed(1) : 0
    }));

    const promedioUtilidad = utilidades.reduce((a, b) => a + b.utilidad, 0) / utilidades.length;
    const tendencia = utilidades[0].utilidad > utilidades[utilidades.length - 1].utilidad ? 'creciente' : 'decreciente';

    let response = `📈 **Proyección de Tendencias**\n\n`;
    response += `**Últimos 6 meses:**\n`;
    
    for (const u of utilidades.slice(0, 3)) {
      const emoji = u.utilidad > 0 ? '✅' : '🔴';
      response += `${emoji} ${u.mes}: GTQ ${u.utilidad.toLocaleString()} (${u.margen}%)\n`;
    }

    response += `\n📊 **Promedio mensual:** GTQ ${promedioUtilidad.toLocaleString()}\n`;
    response += `📈 **Tendencia:** ${tendencia === 'creciente' ? '📈 Creciente' : '📉 Decreciente'}`;

    const recommendations = [];
    
    if (tendencia === 'decreciente' && promedioUtilidad < 0) {
      response += `\n\n🚨 **ALERTA:** Tendencia negativa sostenida`;
      recommendations.push('Revisar estructura de costos');
      recommendations.push('Evaluar estrategia de precios');
    }

    return this.formatResponse(response, 'analysis', { historial: utilidades, tendencia }, recommendations);
  }

  async scenarioAnalysis(db, empresaId, query) {
    // Análisis de escenarios simple
    const posicion = await db.getAsync(`
      SELECT SUM(saldo_actual) as total FROM cuentas_bancarias WHERE empresa_id = ?
    `, [empresaId]);

    const saldoActual = posicion?.total || 0;

    let response = `🎯 **Análisis de Escenarios**\n\n`;
    
    // Escenarios predefinidos
    const escenarios = [
      { nombre: 'Optimista', ingresos: 1.2, gastos: 1.0 },
      { nombre: 'Base', ingresos: 1.0, gastos: 1.0 },
      { nombre: 'Pesimista', ingresos: 0.8, gastos: 1.1 },
      { nombre: 'Crisis', ingresos: 0.6, gastos: 1.0 }
    ];

    response += `Posición actual: GTQ ${saldoActual.toLocaleString()}\n\n`;
    response += `**Escenarios (próximo trimestre):**\n\n`;

    for (const esc of escenarios) {
      const impacto = saldoActual * (esc.ingresos - esc.gastos) * 0.25; // Simplificación
      const emoji = impacto > 0 ? '✅' : impacto > -saldoActual * 0.3 ? '⚠️' : '🚨';
      response += `${emoji} **${esc.nombre}:** Impacto ~ GTQ ${impacto.toLocaleString()}\n`;
    }

    response += `\n💡 *Este es un análisis simplificado. Para escenarios específicos, consulta con tu CFO.*`;

    return this.formatResponse(response, 'analysis');
  }

  async fullCashflowAnalysis(db, empresaId) {
    const runway = await this.calculateRunway(db, empresaId);
    const trends = await this.forecastTrends(db, empresaId);
    
    return this.formatResponse(
      `${runway.content}\n\n---\n\n${trends.content}`,
      'analysis',
      { runway: runway.data, trends: trends.data },
      [...(runway.actions || []), ...(trends.actions || [])]
    );
  }

  /**
   * Detecta anomalías en el flujo de caja
   * Identifica: gastos inusuales por categoría, cambios bruscos en patrones de ingreso,
   * y alertas de variación por encima de umbral
   * @param {Object} db - Conexión a base de datos
   * @param {string} empresaId - ID de la empresa
   * @param {number} umbral - Umbral de variación para alertas (default: 20%)
   * @returns {Object} Resultado del análisis con anomalías detectadas
   */
  async detectAnomalies(db, empresaId, umbral = 20) {
    const anomalias = [];
    const alertas = [];
    const now = new Date();
    const tresMesesAtras = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
    const seisMesesAtras = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
    const mesActual = now.toISOString().slice(0, 7);

    try {
      // 1. DETECTAR GASTOS INUSUALES POR CATEGORÍA
      const gastosPorCategoriaMes = await db.allAsync(`
        SELECT 
          categoria,
          strftime('%Y-%m', fecha) as mes,
          SUM(monto) as total,
          COUNT(*) as cantidad_transacciones,
          AVG(monto) as promedio_transaccion
        FROM transacciones 
        WHERE empresa_id = ? 
          AND tipo = 'salida'
          AND fecha >= ?
        GROUP BY categoria, strftime('%Y-%m', fecha)
        ORDER BY categoria, mes DESC
      `, [empresaId, seisMesesAtras]);

      // Agrupar por categoría para análisis estadístico
      const categoriaStats = {};
      gastosPorCategoriaMes.forEach(g => {
        if (!categoriaStats[g.categoria]) {
          categoriaStats[g.categoria] = { meses: [], totales: [], transacciones: [] };
        }
        categoriaStats[g.categoria].meses.push(g.mes);
        categoriaStats[g.categoria].totales.push(g.total);
        categoriaStats[g.categoria].transacciones.push(g.cantidad_transacciones);
      });

      // Detectar anomalías por categoría
      for (const [categoria, stats] of Object.entries(categoriaStats)) {
        if (stats.totales.length >= 2) {
          const promedio = stats.totales.reduce((a, b) => a + b, 0) / stats.totales.length;
          const desviacion = Math.sqrt(
            stats.totales.reduce((sq, n) => sq + Math.pow(n - promedio, 2), 0) / stats.totales.length
          );
          const limiteSuperior = promedio + (2 * desviacion);
          const limiteInferior = Math.max(0, promedio - (2 * desviacion));

          const mesActualGasto = gastosPorCategoriaMes.find(
            g => g.categoria === categoria && g.mes === mesActual
          );

          if (mesActualGasto) {
            // Gasto anormalmente alto
            if (mesActualGasto.total > limiteSuperior) {
              const variacion = ((mesActualGasto.total - promedio) / promedio) * 100;
              anomalias.push({
                tipo: 'gasto_inusual_alto',
                categoria: categoria,
                severidad: variacion > 50 ? 'critica' : variacion > 30 ? 'alta' : 'media',
                titulo: `Gasto inusual en ${categoria}`,
                descripcion: `El gasto en ${categoria} de GTQ ${mesActualGasto.total.toLocaleString()} supera el límite estadístico normal (Promedio: GTQ ${promedio.toLocaleString()}, Desv: ${desviacion.toLocaleString()}).`,
                datos: {
                  monto_actual: mesActualGasto.total,
                  promedio_historico: promedio,
                  desviacion_estandar: desviacion,
                  variacion_porcentaje: variacion,
                  transacciones: mesActualGasto.cantidad_transacciones
                },
                accion_recomendada: `Revisar detalle de ${mesActualGasto.cantidad_transacciones} transacción(es) en ${categoria} del mes actual.`
              });
            }

            // Variación por encima del umbral configurado
            const variacionUmbral = ((mesActualGasto.total - promedio) / promedio) * 100;
            if (Math.abs(variacionUmbral) > umbral && !anomalias.find(a => a.categoria === categoria)) {
              alertas.push({
                tipo: 'variacion_umbral',
                categoria: categoria,
                severidad: Math.abs(variacionUmbral) > umbral * 1.5 ? 'alta' : 'media',
                titulo: variacionUmbral > 0 
                  ? `Aumento del ${variacionUmbral.toFixed(1)}% en ${categoria}`
                  : `Reducción del ${Math.abs(variacionUmbral).toFixed(1)}% en ${categoria}`,
                descripcion: `La variación del ${Math.abs(variacionUmbral).toFixed(1)}% en ${categoria} supera el umbral configurado del ${umbral}%.`,
                datos: {
                  monto_actual: mesActualGasto.total,
                  promedio_historico: promedio,
                  variacion_porcentaje: variacionUmbral,
                  umbral_configurado: umbral
                },
                accion_recomendada: variacionUmbral > 0 
                  ? 'Verificar justificación del aumento y aprobar según presupuesto.'
                  : 'Confirmar que no haya facturas pendientes de registro.'
              });
            }
          }
        }
      }

      // 2. DETECTAR CAMBIOS BRUSCOS EN PATRONES DE INGRESO
      const ingresosMensuales = await db.allAsync(`
        SELECT 
          strftime('%Y-%m', fecha) as mes,
          SUM(monto) as total,
          COUNT(DISTINCT cliente_id) as clientes_activos,
          COUNT(*) as transacciones
        FROM transacciones 
        WHERE empresa_id = ? 
          AND tipo = 'entrada'
          AND fecha >= ?
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY mes ASC
      `, [empresaId, seisMesesAtras]);

      if (ingresosMensuales.length >= 2) {
        const n = ingresosMensuales.length;
        const totales = ingresosMensuales.map(i => i.total);
        
        // Detectar cambio brusco mes a mes
        for (let i = 1; i < n; i++) {
          const variacion = ((totales[i] - totales[i-1]) / totales[i-1]) * 100;

          if (Math.abs(variacion) > 20) {
            const esCaida = variacion < 0;
            anomalias.push({
              tipo: esCaida ? 'caida_ingresos_brusca' : 'aumento_ingresos_brusco',
              categoria: 'ingresos',
              severidad: esCaida && Math.abs(variacion) > 40 ? 'critica' : 'alta',
              titulo: esCaida 
                ? `🚨 Caída brusca de ingresos: ${Math.abs(variacion).toFixed(1)}%`
                : `📈 Aumento significativo de ingresos: ${variacion.toFixed(1)}%`,
              descripcion: `En ${ingresosMensuales[i].mes} se detectó una ${esCaida ? 'caída' : 'subida'} del ${Math.abs(variacion).toFixed(1)}% respecto al mes anterior (${ingresosMensuales[i-1].mes}: GTQ ${totales[i-1].toLocaleString()} → ${ingresosMensuales[i].mes}: GTQ ${totales[i].toLocaleString()}).`,
              datos: {
                mes: ingresosMensuales[i].mes,
                monto_actual: totales[i],
                monto_anterior: totales[i-1],
                variacion_porcentaje: variacion,
                clientes_activos: ingresosMensuales[i].clientes_activos,
                transacciones: ingresosMensuales[i].transacciones
              },
              accion_recomendada: esCaida
                ? 'Investigar causas: revisar clientes perdidos, precios, competencia. Activar plan de retención.'
                : 'Identificar qué impulsó el crecimiento para replicarlo y verificar sostenibilidad.'
            });
          }
        }

        // Detectar tendencia decreciente sostenida (últimos 3 meses si hay 3+)
        if (n >= 3) {
          const ultimos3Meses = ingresosMensuales.slice(-3);
          const tendenciaDecreciente = ultimos3Meses[0].total > ultimos3Meses[1].total && 
                                       ultimos3Meses[1].total > ultimos3Meses[2].total;
          
          if (tendenciaDecreciente) {
            const reduccionTotal = ((ultimos3Meses[0].total - ultimos3Meses[2].total) / ultimos3Meses[0].total) * 100;
            alertas.push({
              tipo: 'tendencia_ingresos_decreciente',
              categoria: 'ingresos',
              severidad: reduccionTotal > 30 ? 'alta' : 'media',
              titulo: `Tendencia decreciente en ingresos (-${reduccionTotal.toFixed(1)}%)`,
              descripcion: `Los ingresos han disminuido consistentemente en los últimos 3 meses (${ultimos3Meses[0].mes}: GTQ ${ultimos3Meses[0].total.toLocaleString()} → ${ultimos3Meses[2].mes}: GTQ ${ultimos3Meses[2].total.toLocaleString()}).`,
              datos: {
                meses: ultimos3Meses.map(m => ({ mes: m.mes, monto: m.total })),
                reduccion_total: reduccionTotal
              },
              accion_recomendada: 'Llamar a clientes principales para evaluar satisfacción. Revisar precios vs competencia. Considerar campaña promocional.'
            });
          }
        }
      }

      // 3. DETECTAR PATRONES INUSUALES EN TRANSACCIONES
      const transaccionesPorDiaSemana = await db.allAsync(`
        SELECT 
          CASE strftime('%w', fecha)
            WHEN '0' THEN 'Domingo'
            WHEN '1' THEN 'Lunes'
            WHEN '2' THEN 'Martes'
            WHEN '3' THEN 'Miércoles'
            WHEN '4' THEN 'Jueves'
            WHEN '5' THEN 'Viernes'
            WHEN '6' THEN 'Sábado'
          END as dia_semana,
          tipo,
          COUNT(*) as cantidad,
          SUM(monto) as total
        FROM transacciones 
        WHERE empresa_id = ? 
          AND fecha >= date('now', '-30 days')
        GROUP BY strftime('%w', fecha), tipo
      `, [empresaId]);

      // Detectar transacciones en días atípicos (fines de semana)
      const transaccionesFinSemana = transaccionesPorDiaSemana.filter(
        t => (t.dia_semana === 'Sábado' || t.dia_semana === 'Domingo') && t.tipo === 'egreso'
      );

      for (const t of transaccionesFinSemana) {
        if (t.total > 10000) { // Umbral para transacción significativa en fin de semana
          anomalias.push({
            tipo: 'transaccion_fin_semana',
            categoria: 'patron_inusual',
            severidad: 'media',
            titulo: `Transacción significativa en ${t.dia_semana}`,
            descripcion: `Se detectaron ${t.cantidad} transacción(es) de egreso por GTQ ${t.total.toLocaleString()} registradas en ${t.dia_semana}.`,
            datos: {
              dia_semana: t.dia_semana,
              cantidad: t.cantidad,
              monto_total: t.total
            },
            accion_recomendada: 'Verificar que las transacciones de fin de semana estén correctamente autorizadas y documentadas.'
          });
        }
      }

      // 4. ANÁLISIS DE VARIACIÓN DE RUNWAY
      const posicionActual = await db.getAsync(`
        SELECT SUM(saldo) as total FROM cuentas_bancarias WHERE empresa_id = ?
      `, [empresaId]);

      const saldoActual = posicionActual?.total || 0;

      const gastosPromedio = await db.getAsync(`
        SELECT AVG(monto_mensual) as promedio
        FROM (
          SELECT strftime('%Y-%m', fecha) as mes, SUM(monto) as monto_mensual
          FROM transacciones 
          WHERE empresa_id = ? AND tipo = 'salida' AND fecha >= ?
          GROUP BY strftime('%Y-%m', fecha)
        )
      `, [empresaId, tresMesesAtras]);

      const gastoMensual = gastosPromedio?.promedio || 1;
      const runwayMeses = saldoActual / gastoMensual;

      // Comparar con runway histórico
      const runwayHistorico = await db.allAsync(`
        SELECT 
          strftime('%Y-%m', fecha) as mes,
          SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE -monto END) as flujo_neto
        FROM transacciones 
        WHERE empresa_id = ? AND fecha >= ?
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY mes ASC
      `, [empresaId, seisMesesAtras]);

      if (runwayHistorico.length >= 3) {
        const flujoPromedio = runwayHistorico.reduce((sum, r) => sum + r.flujo_neto, 0) / runwayHistorico.length;
        const flujoActual = runwayHistorico[runwayHistorico.length - 1].flujo_neto;
        const variacionFlujo = ((flujoActual - flujoPromedio) / Math.abs(flujoPromedio)) * 100;

        if (variacionFlujo < -30) {
          alertas.push({
            tipo: 'deterioro_flujo_caja',
            categoria: 'liquidez',
            severidad: runwayMeses < 3 ? 'critica' : 'alta',
            titulo: `Deterioro del flujo de caja (${variacionFlujo.toFixed(1)}%)`,
            descripcion: `El flujo de caja neto del mes actual (GTQ ${flujoActual.toLocaleString()}) está ${Math.abs(variacionFlujo).toFixed(1)}% por debajo del promedio histórico (GTQ ${flujoPromedio.toLocaleString()}). Runway actual: ${runwayMeses.toFixed(1)} meses.`,
            datos: {
              flujo_actual: flujoActual,
              flujo_promedio: flujoPromedio,
              variacion_porcentaje: variacionFlujo,
              runway_meses: runwayMeses,
              saldo_actual: saldoActual
            },
            accion_recomendada: runwayMeses < 3 
              ? '🚨 URGENTE: Implementar plan de emergencia de tesorería. Congelar gastos no esenciales y acelerar cobros.'
              : 'Monitorear semanalmente el flujo de caja y acelerar cobros pendientes.'
          });
        }
      }

    } catch (error) {
      console.error('[PredictorCashFlow] Error en detectAnomalies:', error);
      return {
        agent: this.name,
        timestamp: new Date().toISOString(),
        error: error.message,
        anomalias: [],
        alertas: []
      };
    }

    // Ordenar por severidad
    const ordenSeveridad = { critica: 0, alta: 1, media: 2, baja: 3 };
    anomalias.sort((a, b) => ordenSeveridad[a.severidad] - ordenSeveridad[b.severidad]);
    alertas.sort((a, b) => ordenSeveridad[a.severidad] - ordenSeveridad[b.severidad]);

    return {
      agent: this.name,
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      umbral_configurado: umbral,
      resumen: {
        total_anomalias: anomalias.length,
        total_alertas: alertas.length,
        criticas: anomalias.filter(a => a.severidad === 'critica').length + alertas.filter(a => a.severidad === 'critica').length,
        altas: anomalias.filter(a => a.severidad === 'alta').length + alertas.filter(a => a.severidad === 'alta').length,
        medias: anomalias.filter(a => a.severidad === 'media').length + alertas.filter(a => a.severidad === 'media').length
      },
      anomalias,
      alertas
    };
  }
}

module.exports = PredictorCashFlow;
