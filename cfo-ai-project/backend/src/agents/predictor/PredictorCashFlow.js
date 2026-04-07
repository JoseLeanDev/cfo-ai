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
      SELECT SUM(saldo_actual) as total FROM cuentas_bancarias WHERE empresa_id = ?
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
          AND tipo = 'egreso'
          AND fecha >= date('now', '-3 months')
        GROUP BY strftime('%Y-%m', fecha)
      )
    `, [empresaId]);

    const gastoMensual = gastos?.promedio_mensual || 1;
    const runwayMeses = saldoActual / gastoMensual;

    // CxC esperados
    const cxc = await db.getAsync(`
      SELECT SUM(saldo_pendiente) as total,
             SUM(CASE WHEN fecha_vencimiento <= date('now', '+30 days') THEN saldo_pendiente ELSE 0 END) as proximo_mes
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
        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END) as egresos
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
}

module.exports = PredictorCashFlow;
