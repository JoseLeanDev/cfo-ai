/**
 * Analista Financiero Agent
 * Analiza KPIs, ratios y métricas financieras
 * Da recomendaciones basadas en datos
 */
const BaseAgent = require('../BaseAgent');

class AnalistaFinanciero extends BaseAgent {
  constructor() {
    super('AnalistaFinanciero', 'financial_analyst', [
      'kpi_analysis',
      'ratio_calculation',
      'profitability_analysis',
      'liquidity_assessment',
      'recommendations'
    ]);
  }

  async process(input, context) {
    const { query, empresaId } = input;
    const { db } = context;
    
    this.addToMemory('user', query);

    try {
      // Detectar qué tipo de análisis necesita
      const query_lower = query.toLowerCase();
      
      if (query_lower.includes('ratio') || query_lower.includes('liquidez') || query_lower.includes('solvencia')) {
        return await this.analyzeRatios(db, empresaId);
      }
      
      if (query_lower.includes('rentabilidad') || query_lower.includes('margen') || query_lower.includes('roi')) {
        return await this.analyzeProfitability(db, empresaId);
      }
      
      if (query_lower.includes('kpi') || query_lower.includes('indicador')) {
        return await this.analyzeKPIs(db, empresaId);
      }

      // Análisis general por defecto
      return await this.generalAnalysis(db, empresaId);

    } catch (error) {
      console.error('[AnalistaFinanciero] Error:', error);
      return this.formatResponse(
        'Hubo un error al analizar los datos financieros.',
        'error'
      );
    }
  }

  async analyzeRatios(db, empresaId) {
    // Calcular ratios financieros clave
    const posicion = await db.getAsync(`
      SELECT 
        SUM(CASE WHEN moneda = 'GTQ' THEN saldo ELSE 0 END) as saldo_gtq,
        SUM(CASE WHEN moneda = 'USD' THEN saldo ELSE 0 END) as saldo_usd
      FROM cuentas_bancarias 
      WHERE empresa_id = ?
    `, [empresaId]);

    const cxc = await db.getAsync(`
      SELECT SUM(monto) as total, COUNT(*) as count
      FROM cuentas_cobrar 
      WHERE empresa_id = ? AND estado = 'pendiente'
    `, [empresaId]);

    const cxp = await db.getAsync(`
      SELECT SUM(monto) as total, COUNT(*) as count
      FROM cuentas_pagar 
      WHERE empresa_id = ? AND estado = 'pendiente'
    `, [empresaId]);

    const activoCirculante = (posicion?.saldo_gtq || 0) + (posicion?.saldo_usd || 0) + (cxc?.total || 0);
    const pasivoCirculante = cxp?.total || 0;

    const ratios = {
      ratioLiquidez: pasivoCirculante > 0 ? (activoCirculante / pasivoCirculante).toFixed(2) : 'N/A',
      pruebaAcida: pasivoCirculante > 0 ? ((posicion?.saldo_gtq || 0) / pasivoCirculante).toFixed(2) : 'N/A',
      capitalTrabajo: activoCirculante - pasivoCirculante,
      cxcPendientes: cxc?.count || 0,
      cxpPendientes: cxp?.count || 0
    };

    let analysis = '';
    let recommendations = [];

    if (ratios.ratioLiquidez !== 'N/A') {
      const rl = parseFloat(ratios.ratioLiquidez);
      if (rl >= 1.5) {
        analysis += `✅ **Ratio de liquidez: ${rl}** - Excelente. La empresa puede cubrir sus obligaciones a corto plazo cómodamente.\n\n`;
      } else if (rl >= 1) {
        analysis += `⚠️ **Ratio de liquidez: ${rl}** - Aceptable pero monitorear. Hay margen estrecho.\n\n`;
        recommendations.push('Considera negociar plazos más largos con proveedores');
      } else {
        analysis += `🚨 **Ratio de liquidez: ${rl}** - **ALERTA**. Posible problema de liquidez.\n\n`;
        recommendations.push('Prioriza cobros pendientes inmediatamente');
        recommendations.push('Negocia pagos diferidos con proveedores');
      }
    }

    analysis += `📊 **Capital de trabajo:** GTQ ${ratios.capitalTrabajo.toLocaleString()}\n`;
    analysis += `📋 **CxC pendientes:** ${ratios.cxcPendientes} facturas\n`;
    analysis += `📋 **CxP pendientes:** ${ratios.cxpPendientes} pagos`;

    return this.formatResponse(analysis, 'analysis', ratios, recommendations);
  }

  async analyzeProfitability(db, empresaId) {
    // Análisis de rentabilidad
    const ventas = await db.getAsync(`
      SELECT SUM(monto) as total FROM transacciones 
      WHERE empresa_id = ? AND tipo = 'ingreso' 
      AND fecha >= date('now', 'start of month')
    `, [empresaId]);

    const gastos = await db.getAsync(`
      SELECT SUM(monto) as total FROM transacciones 
      WHERE empresa_id = ? AND tipo = 'egreso'
      AND fecha >= date('now', 'start of month')
    `, [empresaId]);

    const totalVentas = ventas?.total || 0;
    const totalGastos = gastos?.total || 0;
    const utilidad = totalVentas - totalGastos;
    const margen = totalVentas > 0 ? ((utilidad / totalVentas) * 100).toFixed(1) : 0;

    const data = {
      ventasMes: totalVentas,
      gastosMes: totalGastos,
      utilidad,
      margenUtilidad: margen
    };

    let analysis = `📈 **Análisis de Rentabilidad - Mes Actual**\n\n`;
    analysis += `Ventas: GTQ ${totalVentas.toLocaleString()}\n`;
    analysis += `Gastos: GTQ ${totalGastos.toLocaleString()}\n`;
    analysis += `Utilidad: GTQ ${utilidad.toLocaleString()}\n`;
    analysis += `Margen: ${margen}%\n\n`;

    const recommendations = [];
    
    if (parseFloat(margen) > 20) {
      analysis += `✅ Excelente margen de utilidad. Estás por encima del promedio industria.`;
    } else if (parseFloat(margen) > 10) {
      analysis += `⚠️ Margen aceptable pero hay espacio para mejorar eficiencia.`;
      recommendations.push('Revisa categorías de gasto con mayor crecimiento');
    } else {
      analysis += `🚨 Margen bajo. Requiere atención inmediata en control de costos.`;
      recommendations.push('Auditaría de gastos operativos recomendada');
      recommendations.push('Evaluar precios de productos/servicios');
    }

    return this.formatResponse(analysis, 'analysis', data, recommendations);
  }

  async analyzeKPIs(db, empresaId) {
    // KPIs del dashboard
    const kpis = await db.getAsync(`
      SELECT 
        (SELECT SUM(saldo) FROM cuentas_bancarias WHERE empresa_id = ?) as posicion_bancaria,
        (SELECT SUM(monto) FROM cuentas_cobrar WHERE empresa_id = ? AND estado = 'pendiente') as cxc_total,
        (SELECT SUM(monto) FROM cuentas_pagar WHERE empresa_id = ? AND estado = 'pendiente') as cxp_total,
        (SELECT COUNT(*) FROM obligaciones_sat WHERE empresa_id = ? AND estado != 'cumplida') as obligaciones_pendientes
    `, [empresaId, empresaId, empresaId, empresaId]);

    const analysis = `📊 **KPIs Financieros Clave**\n\n` +
      `💰 Posición Bancaria: GTQ ${(kpis?.posicion_bancaria || 0).toLocaleString()}\n` +
      `📥 Cuentas por Cobrar: GTQ ${(kpis?.cxc_total || 0).toLocaleString()}\n` +
      `📤 Cuentas por Pagar: GTQ ${(kpis?.cxp_total || 0).toLocaleString()}\n` +
      `📋 Obligaciones SAT Pendientes: ${kpis?.obligaciones_pendientes || 0}\n\n` +
      `Posición neta: GTQ ${((kpis?.posicion_bancaria || 0) + (kpis?.cxc_total || 0) - (kpis?.cxp_total || 0)).toLocaleString()}`;

    return this.formatResponse(analysis, 'analysis', kpis);
  }

  async generalAnalysis(db, empresaId) {
    return this.analyzeKPIs(db, empresaId);
  }
}

module.exports = AnalistaFinanciero;
