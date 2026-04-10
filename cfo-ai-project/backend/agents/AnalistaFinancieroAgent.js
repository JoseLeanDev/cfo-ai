const cron = require('node-cron');
const db = require('../database/connection');

// Servicio de logging inline
async function logAgentActivity(params) {
  const {
    agente_nombre, agente_tipo, agente_version = '1.0.0', categoria,
    descripcion, detalles_json = null, impacto_valor = null,
    impacto_moneda = 'GTQ', resultado_status = 'exitoso', duracion_ms = null
  } = params;
  try {
    await db.runAsync(`
      INSERT INTO agentes_logs 
      (agente_nombre, agente_tipo, agente_version, categoria, descripcion,
       detalles_json, impacto_valor, impacto_moneda, resultado_status, duracion_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [agente_nombre, agente_tipo, agente_version, categoria, descripcion,
        detalles_json, impacto_valor, impacto_moneda, resultado_status, duracion_ms]);
  } catch (e) { console.error('[Log Error]', e.message); }
}

class AnalistaFinancieroAgent {
  constructor(db) {
    this.db = db;
    this.name = 'Analista Financiero';
    this.type = 'analista';
    this.version = '1.0.0';
  }

  // Diario 07:00: Briefing matutino
  async briefingMatutino() {
    const startTime = Date.now();
    try {
      console.log('[Analista] Generando briefing matutino...');
      
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split('T')[0];
      
      const anteayer = new Date();
      anteayer.setDate(anteayer.getDate() - 2);
      const fechaAnteayer = anteayer.toISOString().split('T')[0];

      // 1. Ventas de ayer vs anteayer
      const ventas = await this.db.get(`
        SELECT 
          COALESCE(SUM(CASE WHEN DATE(fecha) = ? AND tipo = 'haber' THEN monto ELSE 0 END), 0) as ventas_ayer,
          COALESCE(SUM(CASE WHEN DATE(fecha) = ? AND tipo = 'haber' THEN monto ELSE 0 END), 0) as ventas_anteayer
        FROM transacciones
        WHERE cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '4105%')
        AND DATE(fecha) >= ?
      `, [fechaAyer, fechaAnteayer, fechaAnteayer]);

      const variacionVentas = ventas.ventas_anteayer > 0 
        ? ((ventas.ventas_ayer - ventas.ventas_anteayer) / ventas.ventas_anteayer * 100).toFixed(2)
        : 0;

      // 2. Gastos destacados (top 5)
      const gastos = await this.db.all(`
        SELECT c.nombre, SUM(t.monto) as total
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE DATE(t.fecha) = ? 
        AND t.tipo = 'debe'
        AND t.cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '51%' OR codigo LIKE '52%')
        GROUP BY t.cuenta_id
        ORDER BY total DESC
        LIMIT 5
      `, [fechaAyer]);

      // 3. Alertas de liquidez
      const liquidez = await this.db.get(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'activo' THEN saldo_actual ELSE 0 END), 0) as activos,
          COALESCE(SUM(CASE WHEN tipo = 'pasivo' THEN saldo_actual ELSE 0 END), 0) as pasivos
        FROM cuentas_contables c
        JOIN saldos_cuentas s ON c.id = s.cuenta_id
        WHERE s.periodo = strftime('%Y-%m', 'now')
      `);

      const ratioLiquidez = liquidez.pasivos > 0 
        ? (liquidez.activos / liquidez.pasivos).toFixed(2)
        : 0;

      const alertaLiquidez = ratioLiquidez < 1.2 ? '⚠️ Baja liquidez detectada' : '✅ Liquidez saludable';

      const duracion = Date.now() - startTime;
      
      const insights = {
        ventas_ayer: ventas.ventas_ayer,
        ventas_anteayer: ventas.ventas_anteayer,
        variacion_ventas: `${variacionVentas}%`,
        gastos_destacados: gastos,
        ratio_liquidez: ratioLiquidez,
        alerta_liquidez: alertaLiquidez
      };

      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'insight_generado',
        descripcion: `Briefing matutino: Ventas ${variacionVentas > 0 ? '↑' : '↓'}${variacionVentas}% | ${alertaLiquidez}`,
        detalles_json: JSON.stringify(insights),
        impacto_valor: Math.abs(parseFloat(variacionVentas)),
        impacto_moneda: 'Q',
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log('[Analista] Briefing matutino generado');
      return insights;
    } catch (error) {
      console.error('[Analista] Error en briefing:', error);
      throw error;
    }
  }

  // Diario 18:00: Snapshot diario
  async snapshotDiario() {
    const startTime = Date.now();
    try {
      console.log('[Analista] Guardando snapshot diario...');
      
      const hoy = new Date().toISOString().split('T')[0];

      // Métricas clave
      const metricas = await this.db.get(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'activo' THEN saldo_actual ELSE 0 END), 0) as total_activos,
          COALESCE(SUM(CASE WHEN tipo = 'pasivo' THEN saldo_actual ELSE 0 END), 0) as total_pasivos,
          COALESCE(SUM(CASE WHEN tipo = 'patrimonio' THEN saldo_actual ELSE 0 END), 0) as total_patrimonio,
          COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN saldo_actual ELSE 0 END), 0) as total_ingresos,
          COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN saldo_actual ELSE 0 END), 0) as total_gastos
        FROM cuentas_contables c
        JOIN saldos_cuentas s ON c.id = s.cuenta_id
        WHERE s.periodo = strftime('%Y-%m', 'now')
      `);

      // Guardar snapshot
      await this.db.run(`
        INSERT INTO snapshots_financieros (fecha, metricas_json, created_at)
        VALUES (?, ?, datetime('now'))
      `, [hoy, JSON.stringify(metricas)]);

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'sincronizacion_datos',
        descripcion: `Snapshot diario guardado: Activos Q${metricas.total_activos.toLocaleString()}`,
        detalles_json: JSON.stringify(metricas),
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log('[Analista] Snapshot guardado');
      return metricas;
    } catch (error) {
      console.error('[Analista] Error en snapshot:', error);
      throw error;
    }
  }

  // Viernes 17:00: Reporte semanal
  async reporteSemanal() {
    const startTime = Date.now();
    try {
      console.log('[Analista] Generando reporte semanal...');

      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - 7);
      
      const inicioSemanaAnterior = new Date(inicioSemana);
      inicioSemanaAnterior.setDate(inicioSemana.getDate() - 7);

      // Comparativo semana vs semana anterior
      const comparativo = await this.db.all(`
        SELECT 
          c.nombre,
          c.tipo,
          COALESCE(SUM(CASE WHEN t.fecha >= ? AND t.fecha < ? THEN t.monto ELSE 0 END), 0) as semana_actual,
          COALESCE(SUM(CASE WHEN t.fecha >= ? AND t.fecha < ? THEN t.monto ELSE 0 END), 0) as semana_anterior
        FROM cuentas_contables c
        LEFT JOIN transacciones t ON c.id = t.cuenta_id
        WHERE c.tipo IN ('ingreso', 'gasto')
        GROUP BY c.id
        HAVING semana_actual > 0 OR semana_anterior > 0
      `, [
        inicioSemana.toISOString().split('T')[0],
        hoy.toISOString().split('T')[0],
        inicioSemanaAnterior.toISOString().split('T')[0],
        inicioSemana.toISOString().split('T')[0]
      ]);

      // Variaciones > 10%
      const variaciones = comparativo.filter(c => {
        if (c.semana_anterior === 0) return c.semana_actual > 0;
        const variacion = Math.abs((c.semana_actual - c.semana_anterior) / c.semana_anterior);
        return variacion > 0.10;
      }).map(c => ({
        ...c,
        variacion_pct: c.semana_anterior > 0 
          ? ((c.semana_actual - c.semana_anterior) / c.semana_anterior * 100).toFixed(2)
          : 'N/A'
      }));

      // Top gastos
      const topGastos = comparativo
        .filter(c => c.tipo === 'gasto')
        .sort((a, b) => b.semana_actual - a.semana_actual)
        .slice(0, 5);

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'insight_generado',
        descripcion: `Reporte semanal: ${variaciones.length} variaciones >10%, Top gasto: ${topGastos[0]?.nombre || 'N/A'}`,
        detalles_json: JSON.stringify({ comparativo, variaciones, topGastos }),
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log('[Analista] Reporte semanal generado');
      return { comparativo, variaciones, topGastos };
    } catch (error) {
      console.error('[Analista] Error en reporte semanal:', error);
      throw error;
    }
  }

  // Día 1, 09:00: Cierre mes anterior
  async cierreMesAnterior() {
    const startTime = Date.now();
    try {
      console.log('[Analista] Analizando cierre de mes anterior...');

      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const mesAnteriorStr = mesAnterior.toISOString().slice(0, 7);
      
      const mesAnteriorAnoPasado = new Date(hoy.getFullYear() - 1, hoy.getMonth() - 1, 1);
      const mesAnteriorAnoPasadoStr = mesAnteriorAnoPasado.toISOString().slice(0, 7);

      // Métricas mes anterior
      const metricasMes = await this.db.get(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) as ingresos,
          COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) as gastos
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE strftime('%Y-%m', t.fecha) = ?
      `, [mesAnteriorStr]);

      // YoY comparativo
      const metricasYoY = await this.db.get(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) as ingresos_yoy,
          COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) as gastos_yoy
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE strftime('%Y-%m', t.fecha) = ?
      `, [mesAnteriorAnoPasadoStr]);

      const variacionIngresos = metricasYoY.ingresos_yoy > 0
        ? ((metricasMes.ingresos - metricasYoY.ingresos_yoy) / metricasYoY.ingresos_yoy * 100).toFixed(2)
        : 0;

      // Anomalías del mes
      const anomalias = await this.detectarAnomaliasMes(mesAnteriorStr);

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'insight_generado',
        descripcion: `Cierre ${mesAnteriorStr}: Ingresos YoY ${variacionIngresos > 0 ? '↑' : '↓'}${variacionIngresos}% | ${anomalias.length} anomalías`,
        detalles_json: JSON.stringify({ metricasMes, metricasYoY, variacionIngresos, anomalias }),
        impacto_valor: Math.abs(parseFloat(variacionIngresos)),
        impacto_moneda: '%',
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log('[Analista] Análisis de cierre completado');
      return { metricasMes, metricasYoY, variacionIngresos, anomalias };
    } catch (error) {
      console.error('[Analista] Error en cierre mes:', error);
      throw error;
    }
  }

  // Trimestral: Proyección financiera
  async proyeccionFinanciera() {
    const startTime = Date.now();
    try {
      console.log('[Analista] Generando proyección financiera trimestral...');

      // Obtener tendencias últimos 12 meses
      const tendencias = await this.db.all(`
        SELECT 
          strftime('%Y-%m', fecha) as mes,
          SUM(CASE WHEN c.tipo = 'ingreso' THEN t.monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN c.tipo = 'gasto' THEN t.monto ELSE 0 END) as gastos
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE fecha >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY mes
      `);

      // Proyección simple (promedio móvil 3 meses)
      const proyeccion = this.calcularProyeccion(tendencias);

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'insight_generado',
        descripcion: `Proyección trimestral: Q${proyeccion.ingresos_proyectados.toLocaleString()} ingresos esperados`,
        detalles_json: JSON.stringify({ tendencias, proyeccion }),
        impacto_valor: proyeccion.ingresos_proyectados,
        impacto_moneda: 'Q',
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log('[Analista] Proyección generada');
      return { tendencias, proyeccion };
    } catch (error) {
      console.error('[Analista] Error en proyección:', error);
      throw error;
    }
  }

  // Helpers
  async detectarAnomaliasMes(mes) {
    // Transacciones inusualmente grandes
    return await this.db.all(`
      SELECT t.*, c.nombre as cuenta_nombre
      FROM transacciones t
      JOIN cuentas_contables c ON t.cuenta_id = c.id
      WHERE strftime('%Y-%m', t.fecha) = ?
      AND ABS(t.monto) > (SELECT AVG(ABS(monto)) * 2 FROM transacciones WHERE strftime('%Y-%m', fecha) = ?)
    `, [mes, mes]);
  }

  calcularProyeccion(tendencias) {
    if (tendencias.length < 3) return { ingresos_proyectados: 0, gastos_proyectados: 0 };
    
    const ultimos3 = tendencias.slice(-3);
    const avgIngresos = ultimos3.reduce((sum, t) => sum + t.ingresos, 0) / 3;
    const avgGastos = ultimos3.reduce((sum, t) => sum + t.gastos, 0) / 3;
    
    return {
      ingresos_proyectados: Math.round(avgIngresos * 3),
      gastos_proyectados: Math.round(avgGastos * 3)
    };
  }

  iniciarScheduler() {
    console.log('[Analista] Iniciando scheduler...');

    // Diario 07:00
    cron.schedule('0 7 * * *', () => {
      this.briefingMatutino();
    });

    // Diario 18:00
    cron.schedule('0 18 * * *', () => {
      this.snapshotDiario();
    });

    // Viernes 17:00
    cron.schedule('0 17 * * 5', () => {
      this.reporteSemanal();
    });

    // Día 1 de cada mes a las 09:00
    cron.schedule('0 9 1 * *', () => {
      this.cierreMesAnterior();
    });

    // Primer día de cada trimestre (Ene, Abr, Jul, Oct) a las 10:00
    cron.schedule('0 10 1 1,4,7,10 *', () => {
      this.proyeccionFinanciera();
    });

    console.log('[Analista] Scheduler iniciado con todas las tareas');
  }
}

module.exports = AnalistaFinancieroAgent;
