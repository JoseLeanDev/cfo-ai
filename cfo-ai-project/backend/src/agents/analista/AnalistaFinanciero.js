/**
 * Analista Financiero Agent
 * Analiza KPIs, ratios y métricas financieras
 * Da recomendaciones basadas en datos
 */
const BaseAgent = require('../BaseAgent');
const { logAgentActivity } = require('../../services/agentLogger');

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

    await logAgentActivity({
      agente_nombre: this.name,
      agente_tipo: this.role,
      agente_version: '1.0.0',
      categoria: 'analisis_liquidez',
      descripcion: `💧 Análisis de liquidez completado: ratio ${ratios.ratioLiquidez !== 'N/A' ? ratios.ratioLiquidez : 'N/A'}. Capital de trabajo GTQ ${ratios.capitalTrabajo.toLocaleString()}.`,
      detalles_json: JSON.stringify({ ratios, empresa_id: empresaId }),
      entidad_tipo: 'empresa',
      entidad_id: empresaId,
      resultado_status: ratios.ratioLiquidez !== 'N/A' && parseFloat(ratios.ratioLiquidez) < 1 ? 'advertencia' : 'exitoso',
      duracion_ms: 0
    });

    return this.formatResponse(analysis, 'analysis', ratios, recommendations);
  }

  async analyzeProfitability(db, empresaId) {
    // Análisis de rentabilidad
    const ventas = await db.getAsync(`
      SELECT SUM(monto) as total FROM transacciones 
      WHERE empresa_id = ? AND tipo = 'entrada' 
      AND fecha >= date('now', 'start of month')
    `, [empresaId]);

    const gastos = await db.getAsync(`
      SELECT SUM(monto) as total FROM transacciones 
      WHERE empresa_id = ? AND tipo = 'salida'
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

    await logAgentActivity({
      agente_nombre: this.name,
      agente_tipo: this.role,
      agente_version: '1.0.0',
      categoria: 'analisis_rentabilidad',
      descripcion: `📈 Análisis de rentabilidad del mes: margen ${margen}% (${utilidad >= 0 ? 'utilidad' : 'pérdida'} de GTQ ${Math.abs(utilidad).toLocaleString()}).`,
      detalles_json: JSON.stringify({ ventas: totalVentas, gastos: totalGastos, margen, empresa_id: empresaId }),
      entidad_tipo: 'empresa',
      entidad_id: empresaId,
      resultado_status: parseFloat(margen) < 10 ? 'advertencia' : 'exitoso',
      duracion_ms: 0
    });

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

    await logAgentActivity({
      agente_nombre: this.name,
      agente_tipo: this.role,
      agente_version: '1.0.0',
      categoria: 'analisis_operaciones',
      descripcion: `📊 KPIs actualizados: efectivo GTQ ${(kpis?.posicion_bancaria || 0).toLocaleString()}, CxC GTQ ${(kpis?.cxc_total || 0).toLocaleString()}, CxP GTQ ${(kpis?.cxp_total || 0).toLocaleString()}.`,
      detalles_json: JSON.stringify({ kpis, empresa_id: empresaId }),
      entidad_tipo: 'empresa',
      entidad_id: empresaId,
      resultado_status: 'exitoso',
      duracion_ms: 0
    });

    return this.formatResponse(analysis, 'analysis', kpis);
  }

  async generalAnalysis(db, empresaId) {
    return this.analyzeKPIs(db, empresaId);
  }

  /**
   * Genera insights automáticos de análisis financiero
   * Analiza: gastos por categoría, ingresos por cliente, anomalías, proyecciones
   * @param {Object} db - Conexión a base de datos
   * @param {string} empresaId - ID de la empresa
   * @returns {Object} Array de insights con tipo, severidad, título, descripción, monto_impacto, accion_sugerida
   */
  async generateInsights(db, empresaId) {
    const insights = [];
    const now = new Date();
    const tresMesesAtras = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
    const seisMesesAtras = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];

    try {
      // 1. ANÁLISIS DE GASTOS POR CATEGORÍA vs PROMEDIO ÚLTIMOS 3 MESES
      const gastosPorCategoria = await db.allAsync(`
        SELECT 
          categoria,
          strftime('%Y-%m', fecha) as mes,
          SUM(monto) as total_mes
        FROM transacciones 
        WHERE empresa_id = ? 
          AND tipo = 'salida'
          AND fecha >= ?
        GROUP BY categoria, strftime('%Y-%m', fecha)
        ORDER BY categoria, mes DESC
      `, [empresaId, tresMesesAtras]);

      // Calcular promedios por categoría
      const categoriasStats = {};
      gastosPorCategoria.forEach(g => {
        if (!categoriasStats[g.categoria]) {
          categoriasStats[g.categoria] = { meses: [], total: 0 };
        }
        categoriasStats[g.categoria].meses.push(g.total_mes);
        categoriasStats[g.categoria].total += g.total_mes;
      });

      // Detectar categorías con gastos anormales
      const mesActual = now.toISOString().slice(0, 7);
      const gastosMesActual = gastosPorCategoria.filter(g => g.mes === mesActual);

      for (const gasto of gastosMesActual) {
        const stats = categoriasStats[gasto.categoria];
        if (stats && stats.meses.length >= 2) {
          const promedio = stats.total / stats.meses.length;
          const variacion = ((gasto.total_mes - promedio) / promedio) * 100;

          if (variacion > 20) {
            insights.push({
              tipo: 'gasto_anormal',
              severidad: variacion > 50 ? 'alta' : 'media',
              titulo: `Aumento significativo en ${gasto.categoria}`,
              descripcion: `Los gastos en ${gasto.categoria} han aumentado un ${variacion.toFixed(1)}% respecto al promedio de los últimos meses (Promedio: GTQ ${promedio.toLocaleString()}, Actual: GTQ ${gasto.total_mes.toLocaleString()}).`,
              monto_impacto: gasto.total_mes - promedio,
              accion_sugerida: `Revisar facturas de ${gasto.categoria} y verificar si el aumento es justificado o se requiere negociar con proveedores.`
            });
          } else if (variacion < -20) {
            insights.push({
              tipo: 'gasto_reducido',
              severidad: 'baja',
              titulo: `Reducción notable en ${gasto.categoria}`,
              descripcion: `Los gastos en ${gasto.categoria} han disminuido un ${Math.abs(variacion).toFixed(1)}% respecto al promedio (Promedio: GTQ ${promedio.toLocaleString()}, Actual: GTQ ${gasto.total_mes.toLocaleString()}).`,
              monto_impacto: promedio - gasto.total_mes,
              accion_sugerida: `Verificar que no haya servicios suspendidos o pagos pendientes no registrados.`
            });
          }
        } else if (stats && stats.meses.length === 1 && gasto.total_mes > 50000) {
          // Solo un mes disponible: alertar si el gasto es significativo
          insights.push({
            tipo: 'gasto_anormal',
            severidad: 'media',
            titulo: `Gasto significativo en ${gasto.categoria}`,
            descripcion: `Se registró un gasto de GTQ ${gasto.total_mes.toLocaleString()} en ${gasto.categoria} durante ${mesActual}. Como es el único mes con datos, se recomienda monitorear esta categoría.`,
            monto_impacto: gasto.total_mes,
            accion_sugerida: `Verificar que todas las facturas de ${gasto.categoria} estén correctamente autorizadas y registradas.`
          });
        }
      }

      // 2. ANÁLISIS DE INGRESOS POR CLIENTE vs TENDENCIA
      const ingresosPorCliente = await db.allAsync(`
        SELECT 
          cliente_id,
          nombre_cliente,
          strftime('%Y-%m', fecha) as mes,
          SUM(monto) as total_mes,
          COUNT(*) as transacciones
        FROM transacciones 
        WHERE empresa_id = ? 
          AND tipo = 'entrada'
          AND fecha >= ?
          AND cliente_id IS NOT NULL
        GROUP BY cliente_id, strftime('%Y-%m', fecha)
        ORDER BY cliente_id, mes DESC
      `, [empresaId, seisMesesAtras]);

      const clientesStats = {};
      ingresosPorCliente.forEach(i => {
        if (!clientesStats[i.cliente_id]) {
          clientesStats[i.cliente_id] = {
            nombre: i.nombre_cliente,
            meses: [],
            total: 0,
            ultimos3Meses: []
          };
        }
        clientesStats[i.cliente_id].meses.push({ mes: i.mes, monto: i.total_mes });
        clientesStats[i.cliente_id].total += i.total_mes;
      });

      for (const [clienteId, stats] of Object.entries(clientesStats)) {
        if (stats.meses.length >= 2) {
          const mesesOrdenados = stats.meses.sort((a, b) => b.mes.localeCompare(a.mes));
          const promedioHistorico = stats.total / stats.meses.length;
          const mesActualIngreso = mesesOrdenados.find(m => m.mes === mesActual);
          const mesAnterior = mesesOrdenados.find(m => m.mes !== mesActual);

          if (mesActualIngreso && mesAnterior) {
            const variacionMesAMes = ((mesActualIngreso.monto - mesAnterior.monto) / mesAnterior.monto) * 100;
            const variacionVsPromedio = ((mesActualIngreso.monto - promedioHistorico) / promedioHistorico) * 100;

            if (variacionMesAMes < -30 || variacionVsPromedio < -40) {
              insights.push({
                tipo: 'cliente_en_riesgo',
                severidad: 'alta',
                titulo: `Caída significativa en compras: ${stats.nombre}`,
                descripcion: `El cliente ${stats.nombre} ha reducido sus compras. Variación mes a mes: ${variacionMesAMes.toFixed(1)}%. (Mes anterior: GTQ ${mesAnterior.monto.toLocaleString()}, Actual: GTQ ${mesActualIngreso.monto.toLocaleString()}).`,
                monto_impacto: mesAnterior.monto - mesActualIngreso.monto,
                accion_sugerida: `Contactar al cliente ${stats.nombre} para identificar motivos de la reducción y ofrecer incentivos de volumen o revisar precios.`
              });
            } else if (variacionMesAMes > 40 || variacionVsPromedio > 50) {
              insights.push({
                tipo: 'cliente_crecimiento',
                severidad: 'baja',
                titulo: `Crecimiento destacado: ${stats.nombre}`,
                descripcion: `El cliente ${stats.nombre} ha incrementado sus compras. Variación: +${variacionMesAMes.toFixed(1)}% respecto al mes anterior (GTQ ${mesAnterior.monto.toLocaleString()} → GTQ ${mesActualIngreso.monto.toLocaleString()}).`,
                monto_impacto: mesActualIngreso.monto - mesAnterior.monto,
                accion_sugerida: `Agradecer al cliente y evaluar oportunidad de negociar contrato de exclusividad o volumen mínimo.`
              });
            }
          }

          // Detectar tendencia decreciente en últimos 3 meses (solo si hay 3+)
          if (stats.meses.length >= 3) {
            const ultimos3 = mesesOrdenados.slice(0, 3);
            const tendencia = ultimos3[0].monto < ultimos3[1].monto && ultimos3[1].monto < ultimos3[2].monto;
            if (tendencia) {
              const reduccionTotal = ((ultimos3[0].monto - ultimos3[2].monto) / ultimos3[2].monto) * 100;
              if (reduccionTotal > 20) {
                insights.push({
                  tipo: 'tendencia_negativa_cliente',
                  severidad: 'media',
                  titulo: `Tendencia decreciente: ${stats.nombre}`,
                  descripcion: `El cliente ${stats.nombre} muestra una tendencia decreciente sostenida en los últimos meses (Reducción total: ${reduccionTotal.toFixed(1)}%).`,
                  monto_impacto: ultimos3[2].monto - ultimos3[0].monto,
                  accion_sugerida: `Programar reunión comercial con ${stats.nombre} para entender necesidades y recuperar volumen.`
                });
              }
            }
          }
        } else if (stats.meses.length === 1 && stats.meses[0].monto > 100000) {
          // Solo un mes: si es cliente grande, dar insight
          insights.push({
            tipo: 'cliente_crecimiento',
            severidad: 'baja',
            titulo: `Nuevo cliente significativo: ${stats.nombre}`,
            descripcion: `El cliente ${stats.nombre} registró compras por GTQ ${stats.meses[0].monto.toLocaleString()} en ${stats.meses[0].mes}. Monitorear evolución en próximos meses.`,
            monto_impacto: stats.meses[0].monto,
            accion_sugerida: `Dar seguimiento personalizado para consolidar la relación comercial.`
          });
        }
      }

      // 3. ANOMALÍAS EN TRANSACCIONES
      const transaccionesRecientes = await db.allAsync(`
        SELECT * FROM transacciones 
        WHERE empresa_id = ? 
          AND fecha >= date('now', '-30 days')
        ORDER BY monto DESC
      `, [empresaId]);

      if (transaccionesRecientes.length > 0) {
        const montos = transaccionesRecientes.map(t => t.monto).sort((a, b) => a - b);
        const promedioMontos = montos.reduce((a, b) => a + b, 0) / montos.length;
        let atipicos = [];

        if (montos.length >= 5) {
          const q1 = montos[Math.floor(montos.length * 0.25)];
          const q3 = montos[Math.floor(montos.length * 0.75)];
          const iqr = q3 - q1;
          const limiteSuperior = q3 + (1.5 * iqr);
          const limiteInferior = q1 - (1.5 * iqr);
          atipicos = transaccionesRecientes.filter(t => t.monto > limiteSuperior || t.monto < limiteInferior);
        } else {
          // Con pocas transacciones: marcar como atípica si supera 2x el promedio o es > Q25,000
          atipicos = transaccionesRecientes.filter(t => t.monto > Math.max(promedioMontos * 2, 25000));
        }

        for (const t of atipicos.slice(0, 3)) { // Máximo 3 anomalías
          const esIngreso = t.tipo === 'ingreso';
          insights.push({
            tipo: 'transaccion_anomala',
            severidad: !esIngreso && t.monto > promedioMontos * 3 ? 'alta' : 'media',
            titulo: `Transacción atípica detectada: ${t.descripcion || 'Sin descripción'}`,
            descripcion: `Se detectó una transacción de ${esIngreso ? 'INGRESO' : 'EGRESO'} por GTQ ${t.monto.toLocaleString()}. Fecha: ${t.fecha}.`,
            monto_impacto: t.monto,
            accion_sugerida: esIngreso 
              ? `Verificar que el ingreso por GTQ ${t.monto.toLocaleString()} esté correctamente documentado y aplicado al cliente correcto.`
              : `Revisar aprobaciones y soporte documental para el egreso de GTQ ${t.monto.toLocaleString()}. Confirmar con el área de compras.`
          });
        }
      }

      // 4. PROYECCIONES DE VARIACIÓN
      const datos6Meses = await db.allAsync(`
        SELECT 
          strftime('%Y-%m', fecha) as mes,
          SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as egresos
        FROM transacciones 
        WHERE empresa_id = ? 
          AND fecha >= ?
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY mes ASC
      `, [empresaId, seisMesesAtras]);

      if (datos6Meses.length >= 2) {
        const utilidades = datos6Meses.map(d => d.ingresos - d.egresos);
        const n = utilidades.length;

        // Calcular tendencia lineal simple
        const sumX = utilidades.reduce((sum, _, i) => sum + i, 0);
        const sumY = utilidades.reduce((sum, y) => sum + y, 0);
        const sumXY = utilidades.reduce((sum, y, i) => sum + i * y, 0);
        const sumX2 = utilidades.reduce((sum, _, i) => sum + i * i, 0);

        const divisor = n * sumX2 - sumX * sumX;
        let pendiente = 0;
        let promedioUtilidad = sumY / n;

        if (divisor !== 0) {
          pendiente = (n * sumXY - sumX * sumY) / divisor;
        }

        // Proyección próximo mes
        const proyeccionProximoMes = promedioUtilidad + (pendiente * (n / 2));
        const variacionProyectada = promedioUtilidad !== 0 
          ? ((proyeccionProximoMes - promedioUtilidad) / promedioUtilidad) * 100 
          : 0;

        if (Math.abs(variacionProyectada) > 10 || n === 2) {
          const esPositiva = variacionProyectada > 0 || (n === 2 && utilidades[1] > utilidades[0]);
          const titulo = n === 2 
            ? (esPositiva ? '📈 Utilidad en crecimiento' : '📉 Utilidad en declive')
            : (esPositiva ? '📈 Proyección de mejora en utilidad' : '📉 Alerta de reducción proyectada');
          
          insights.push({
            tipo: 'proyeccion_variacion',
            severidad: !esPositiva ? 'alta' : 'baja',
            titulo: titulo,
            descripcion: n === 2 
              ? `Comparando los últimos 2 meses, la utilidad pasó de GTQ ${utilidades[0].toLocaleString()} a GTQ ${utilidades[1].toLocaleString()}. Tendencia ${esPositiva ? 'positiva' : 'negativa'}.`
              : `Basado en la tendencia de los últimos ${n} meses, se proyecta una ${esPositiva ? 'mejora' : 'reducción'} del ${Math.abs(variacionProyectada).toFixed(1)}% en la utilidad del próximo mes (Proyección: GTQ ${proyeccionProximoMes.toLocaleString()} vs Promedio: GTQ ${promedioUtilidad.toLocaleString()}).`,
            monto_impacto: Math.abs(proyeccionProximoMes - promedioUtilidad),
            accion_sugerida: esPositiva
              ? 'Capitalizar la tendencia positiva: identificar qué productos/clientes están impulsando el crecimiento y enfocar esfuerzos comerciales.'
              : 'Implementar plan de contingencia: revisar costos fijos, acelerar cobros pendientes y evaluar pausar inversiones discrecionales.'
          });
        }

        // Alerta de margen decreciente
        const margenes = datos6Meses.map(d => ({
          mes: d.mes,
          margen: d.ingresos > 0 ? ((d.ingresos - d.egresos) / d.ingresos) * 100 : 0
        }));

        const margenActual = margenes[margenes.length - 1].margen;
        const margenPromedio = margenes.reduce((sum, m) => sum + m.margen, 0) / margenes.length;

        if (n >= 3 && margenActual < margenPromedio - 5) {
          insights.push({
            tipo: 'margen_decreciente',
            severidad: margenActual < 10 ? 'alta' : 'media',
            titulo: 'Alerta: Margen de utilidad en declive',
            descripcion: `El margen de utilidad actual (${margenActual.toFixed(1)}%) está por debajo del promedio de los últimos meses (${margenPromedio.toFixed(1)}%). Esto indica presión en costos o precios.`,
            monto_impacto: (margenPromedio - margenActual) * datos6Meses[datos6Meses.length - 1].ingresos / 100,
            accion_sugerida: 'Revisar lista de precios y negociar mejores condiciones con proveedores clave. Considerar ajuste de precios en productos con menor rotación.'
          });
        }
      }

      // 5. INSIGHTS ESPECÍFICOS PARA DISTRIBUIDORA INDUSTRIAL CENTROAMERICANA
      // Análisis de inventario/cartera
      const cxpVencidas = await db.getAsync(`
        SELECT SUM(monto) as total, COUNT(*) as count
        FROM cuentas_pagar 
        WHERE empresa_id = ? 
          AND estado = 'pendiente'
          AND fecha_vencimiento < date('now')
      `, [empresaId]);

      if (cxpVencidas && cxpVencidas.total > 0) {
        insights.push({
          tipo: 'cxp_vencidas',
          severidad: 'alta',
          titulo: `⚠️ Cuentas por pagar vencidas: GTQ ${cxpVencidas.total.toLocaleString()}`,
          descripcion: `Tienes ${cxpVencidas.count} facturas vencidas por un total de GTQ ${cxpVencidas.total.toLocaleString()}. Esto puede afectar relaciones con proveedores y generar recargos por mora.`,
          monto_impacto: cxpVencidas.total,
          accion_sugerida: 'Priorizar pagos a proveedores críticos y negociar plan de pagos para evitar suspensión de suministros.'
        });
      }

      const cxcVencidas = await db.getAsync(`
        SELECT SUM(monto) as total, COUNT(*) as count
        FROM cuentas_cobrar 
        WHERE empresa_id = ? 
          AND estado = 'pendiente'
          AND fecha_vencimiento < date('now')
      `, [empresaId]);

      if (cxcVencidas && cxcVencidas.total > 0) {
        const diasPromedio = await db.getAsync(`
          SELECT AVG(julianday('now') - julianday(fecha_vencimiento)) as dias_promedio
          FROM cuentas_cobrar 
          WHERE empresa_id = ? 
            AND estado = 'pendiente'
            AND fecha_vencimiento < date('now')
        `, [empresaId]);

        insights.push({
          tipo: 'cxc_vencidas',
          severidad: cxcVencidas.total > 500000 ? 'alta' : 'media',
          titulo: `💰 Cartera vencida por cobrar: GTQ ${cxcVencidas.total.toLocaleString()}`,
          descripcion: `Tienes ${cxcVencidas.count} facturas vencidas por GTQ ${cxcVencidas.total.toLocaleString()}. Promedio de atraso: ${Math.round(diasPromedio?.dias_promedio || 0)} días.`,
          monto_impacto: cxcVencidas.total,
          accion_sugerida: 'Implementar llamadas de cobro diarias. Ofrecer descuento por pronto pago (1-2%) para acelerar recuperación.'
        });
      }

    } catch (error) {
      insights.push({
        tipo: 'error',
        severidad: 'alta',
        titulo: 'Error al generar insights',
        descripcion: 'Hubo un error al procesar los datos financieros. Por favor intente más tarde.',
        monto_impacto: 0,
        accion_sugerida: 'Contactar soporte técnico si el problema persiste.'
      });
    }

    // Log de actividad con resumen de negocio
    const criticos = insights.filter(i => i.severidad === 'alta').length;
    const medios = insights.filter(i => i.severidad === 'media').length;
    
    await logAgentActivity({
      agente_nombre: this.name,
      agente_tipo: this.role,
      agente_version: '1.0.0',
      categoria: insights.length > 0 ? 'analisis_ejecutado' : 'analisis_operaciones',
      descripcion: insights.length > 0 
        ? `📊 Análisis financiero completado: ${insights.length} insights generados (${criticos} críticos, ${medios} medios).`
        : `✅ Análisis financiero completado: sin hallazgos significativos.`,
      detalles_json: JSON.stringify({
        total_insights: insights.length,
        criticos,
        medios,
        empresa_id: empresaId
      }),
      entidad_tipo: 'empresa',
      entidad_id: empresaId,
      resultado_status: criticos > 0 ? 'advertencia' : 'exitoso',
      duracion_ms: 0
    });

    return {
      agent: this.name,
      timestamp: new Date().toISOString(),
      total_insights: insights.length,
      insights: insights.sort((a, b) => {
        const severidadOrder = { alta: 0, media: 1, baja: 2 };
        return severidadOrder[a.severidad] - severidadOrder[b.severidad];
      })
    };
  }
}

module.exports = AnalistaFinanciero;
