/**
 * Agente Análisis 📊
 * Responsabilidades:
 * - KPIs diarios
 * - Rentabilidad y márgenes
 * - Análisis RFM (Recency, Frequency, Monetary)
 * - Detección de anomalías
 * - Análisis de tendencias
 */

const BaseAgent = require('../BaseAgent');
const db = require('../../../database/connection');

class AgenteAnalisis extends BaseAgent {
  constructor() {
    super('Análisis', 'analista', [
      'calcularKPIsDiarios',
      'analizarRentabilidad',
      'analizarRFM',
      'detectarAnomalias',
      'generarInsights',
      'analizarTendencias'
    ]);
    this.version = '2.0.0';
  }

  async process(input, context) {
    const { tarea, empresaId = 1 } = input;
    
    switch(tarea) {
      case 'calcularKPIsDiarios':
        return await this.calcularKPIsDiarios(empresaId);
      case 'analizarRentabilidad':
        return await this.analizarRentabilidad(empresaId);
      case 'analizarRFM':
        return await this.analizarRFM(empresaId);
      case 'detectarAnomalias':
        return await this.detectarAnomalias(empresaId);
      case 'analizarTendencias':
        return await this.analizarTendencias(empresaId);
      default:
        return this.formatResponse('Tarea no reconocida', 'error');
    }
  }

  /**
   * Calcular KPIs diarios clave
   */
  async calcularKPIsDiarios(empresaId) {
    const startTime = Date.now();
    
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const inicioMes = new Date().toISOString().slice(0, 7) + '-01';

      // 1. Ingresos del día vs mes anterior
      const ingresosHoy = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE empresa_id = ? AND tipo = 'ingreso' AND fecha = ?
      `, [empresaId, hoy]);

      const ingresosMes = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE empresa_id = ? AND tipo = 'ingreso' AND fecha >= ?
      `, [empresaId, inicioMes]);

      const ingresosMesAnterior = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE empresa_id = ? AND tipo = 'ingreso' 
        AND fecha >= date('now', '-2 months') AND fecha < date('now', '-1 month')
      `, [empresaId]);

      // 2. Gastos del día vs presupuesto
      const gastosHoy = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE empresa_id = ? AND tipo = 'gasto' AND fecha = ?
      `, [empresaId, hoy]);

      // 3. Margen bruto
      const margenBruto = ingresosHoy.total - gastosHoy.total;

      // 4. CxC y CxP pendientes
      const cxc = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado = 'pendiente'
      `, [empresaId]);

      const cxp = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM cuentas_pagar
        WHERE empresa_id = ? AND estado = 'pendiente'
      `, [empresaId]);

      // 5. Facturas pendientes
      const facturasPendientes = await db.getAsync(`
        SELECT COUNT(*) as count, COALESCE(SUM(monto), 0) as total
        FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado = 'pendiente'
      `, [empresaId]);

      // Variación vs mes anterior
      const variacionIngresos = ingresosMesAnterior.total > 0 
        ? ((ingresosMes.total - ingresosMesAnterior.total) / ingresosMesAnterior.total * 100).toFixed(1)
        : 0;

      const kpis = {
        fecha: hoy,
        ingresos_hoy: ingresosHoy.total,
        gastos_hoy: gastosHoy.total,
        margen_bruto: margenBruto,
        ingresos_mes: ingresosMes.total,
        ingresos_mes_anterior: ingresosMesAnterior.total,
        variacion_ingresos_pct: parseFloat(variacionIngresos),
        cxc_pendiente: cxc.total,
        cxp_pendiente: cxp.total,
        facturas_pendientes: facturasPendientes.count,
        monto_facturas_pendientes: facturasPendientes.total
      };

      // Guardar en snapshots (compatibilidad con schema existente - reemplaza si existe)
      await db.runAsync(`
        INSERT OR REPLACE INTO snapshots_diarios (fecha, datos_json, created_at)
        VALUES (?, ?, datetime('now'))
      `, [hoy, JSON.stringify(kpis)]);

      await this.logActividad('kpis_diarios',
        `KPIs calculados. Ingresos mes: Q${ingresosMes.total.toLocaleString()}, Variación: ${variacionIngresos}%`,
        kpis,
        ingresosMes.total,
        Date.now() - startTime
      );

      return this.formatResponse(
        `KPIs diarios calculados. Ingresos mes: Q${ingresosMes.total.toLocaleString()} (${variacionIngresos}%)`,
        'analysis',
        kpis
      );

    } catch (error) {
      await this.logActividad('kpis_diarios',
        `Error: ${error.message}`,
        { error: error.message },
        null,
        Date.now() - startTime,
        'error'
      );
      return this.formatResponse(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Analizar rentabilidad por cliente, producto, categoría
   */
  async analizarRentabilidad(empresaId) {
    const startTime = Date.now();
    
    try {
      // Rentabilidad por cliente (top 10)
      const rentabilidadClientes = await db.allAsync(`
        SELECT 
          nombre_cliente,
          SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
        FROM transacciones
        WHERE empresa_id = ? AND nombre_cliente IS NOT NULL
        GROUP BY nombre_cliente
        ORDER BY ingresos DESC
        LIMIT 10
      `, [empresaId]);

      const clientesAnalisis = rentabilidadClientes.map(c => ({
        cliente: c.nombre_cliente,
        ingresos: c.ingresos,
        gastos: c.gastos,
        margen: c.ingresos - c.gastos,
        margen_pct: c.ingresos > 0 ? ((c.ingresos - c.gastos) / c.ingresos * 100).toFixed(1) : 0
      }));

      // Rentabilidad por categoría
      const rentabilidadCategoria = await db.allAsync(`
        SELECT 
          categoria,
          SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
        FROM transacciones
        WHERE empresa_id = ?
        GROUP BY categoria
        ORDER BY ingresos DESC
      `, [empresaId]);

      await this.logActividad('rentabilidad',
        `Rentabilidad analizada: ${clientesAnalisis.length} clientes, ${rentabilidadCategoria.length} categorías`,
        { clientes: clientesAnalisis.length, categorias: rentabilidadCategoria.length },
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `Rentabilidad analizada: ${clientesAnalisis.length} clientes`,
        'analysis',
        { clientes: clientesAnalisis, categorias: rentabilidadCategoria }
      );

    } catch (error) {
      await this.logActividad('rentabilidad',
        `Error: ${error.message}`,
        { error: error.message },
        null,
        Date.now() - startTime,
        'error'
      );
      return this.formatResponse(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Análisis RFM de clientes
   */
  async analizarRFM(empresaId) {
    const startTime = Date.now();
    
    try {
      // Obtener transacciones por cliente
      const transacciones = await db.allAsync(`
        SELECT 
          nombre_cliente,
          MAX(fecha) as ultima_compra,
          COUNT(*) as frecuencia,
          SUM(monto) as monto_total
        FROM transacciones
        WHERE empresa_id = ? AND tipo = 'ingreso' AND nombre_cliente IS NOT NULL
        GROUP BY nombre_cliente
      `, [empresaId]);

      const hoy = new Date();
      const clientesRFM = transacciones.map(t => {
        const ultima = new Date(t.ultima_compra);
        const diasRecencia = Math.floor((hoy - ultima) / (1000 * 60 * 60 * 24));
        
        return {
          cliente: t.nombre_cliente,
          recencia_dias: diasRecencia,
          frecuencia: t.frecuencia,
          monto: t.monto_total,
          // Scores 1-5
          r_score: diasRecencia <= 7 ? 5 : diasRecencia <= 30 ? 4 : diasRecencia <= 90 ? 3 : diasRecencia <= 180 ? 2 : 1,
          f_score: t.frecuencia >= 20 ? 5 : t.frecuencia >= 10 ? 4 : t.frecuencia >= 5 ? 3 : t.frecuencia >= 2 ? 2 : 1,
          m_score: t.monto_total >= 100000 ? 5 : t.monto_total >= 50000 ? 4 : t.monto_total >= 20000 ? 3 : t.monto_total >= 5000 ? 2 : 1
        };
      });

      // Segmentación
      const segmentos = {
        campeones: clientesRFM.filter(c => c.r_score >= 4 && c.f_score >= 4 && c.m_score >= 4),
        leales: clientesRFM.filter(c => c.r_score >= 3 && c.f_score >= 3 && c.m_score >= 3),
        potenciales: clientesRFM.filter(c => c.r_score >= 4 && c.f_score <= 2),
        riesgo: clientesRFM.filter(c => c.r_score <= 2 && c.f_score >= 3),
        perdidos: clientesRFM.filter(c => c.r_score <= 2 && c.f_score <= 2)
      };

      await this.logActividad('rfm',
        `RFM analizado: ${clientesRFM.length} clientes segmentados`,
        { total: clientesRFM.length, segmentos: Object.fromEntries(Object.entries(segmentos).map(([k, v]) => [k, v.length])) },
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `RFM: ${clientesRFM.length} clientes analizados`,
        'analysis',
        { clientes: clientesRFM, segmentos }
      );

    } catch (error) {
      await this.logActividad('rfm',
        `Error: ${error.message}`,
        { error: error.message },
        null,
        Date.now() - startTime,
        'error'
      );
      return this.formatResponse(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Detectar anomalías en transacciones
   */
  async detectarAnomalias(empresaId) {
    const startTime = Date.now();
    
    try {
      // Obtener promedios históricos
      const promedios = await db.allAsync(`
        SELECT 
          categoria,
          AVG(monto) as promedio,
          (MAX(monto) - MIN(monto)) as rango
        FROM transacciones
        WHERE empresa_id = ? AND fecha >= date('now', '-3 months')
        GROUP BY categoria
      `, [empresaId]);

      // Buscar transacciones atípicas (monto > 3x promedio o < 0.1x)
      const anomalias = [];
      
      for (const cat of promedios) {
        const atipicas = await db.allAsync(`
          SELECT *
          FROM transacciones
          WHERE empresa_id = ? AND categoria = ? 
          AND (monto > ? * 3 OR monto < ? * 0.1)
          AND fecha >= date('now', '-7 days')
        `, [empresaId, cat.categoria, cat.promedio, cat.promedio]);

        anomalias.push(...atipicas.map(t => ({
          ...t,
          tipo_anomalia: t.monto > cat.promedio * 3 ? 'monto_alto' : 'monto_bajo',
          promedio_categoria: cat.promedio
        })));
      }

      // Guardar alertas si hay anomalías (compatibilidad con schema existente)
      if (anomalias.length > 0) {
        for (const a of anomalias.slice(0, 10)) {
          await db.runAsync(`
            INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `, ['anomalia', 'media',
            `Anomalía: ${a.descripcion || 'Sin descripción'}`,
            `Monto: Q${(a.monto || 0).toLocaleString()}. Promedio categoría: Q${(a.promedio_categoria || 0).toLocaleString()}`,
            JSON.stringify(a)
          ]);
        }
      }

      await this.logActividad('anomalias',
        `${anomalias.length} anomalías detectadas`,
        { count: anomalias.length },
        null,
        Date.now() - startTime,
        anomalias.length > 0 ? 'advertencia' : 'exitoso'
      );

      return this.formatResponse(
        `${anomalias.length} anomalías detectadas`,
        anomalias.length > 0 ? 'alert' : 'analysis',
        { anomalias: anomalias.slice(0, 20) }
      );

    } catch (error) {
      await this.logActividad('anomalias',
        `Error: ${error.message}`,
        { error: error.message },
        null,
        Date.now() - startTime,
        'error'
      );
      return this.formatResponse(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Analizar tendencias históricas
   */
  async analizarTendencias(empresaId) {
    const startTime = Date.now();
    
    try {
      // Tendencia mensual últimos 6 meses
      const tendencia = await db.allAsync(`
        SELECT 
          strftime('%Y-%m', fecha) as mes,
          SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
        FROM transacciones
        WHERE empresa_id = ? AND fecha >= date('now', '-6 months')
        GROUP BY mes
        ORDER BY mes
      `, [empresaId]);

      // Calcular tendencia (pendiente simple)
      const n = tendencia.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      
      tendencia.forEach((row, i) => {
        sumX += i;
        sumY += row.ingresos;
        sumXY += i * row.ingresos;
        sumX2 += i * i;
      });

      const pendiente = n > 0 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
      const tendenciaLabel = pendiente > 0 ? 'creciente' : pendiente < 0 ? 'decreciente' : 'estable';

      await this.logActividad('tendencias',
        `Tendencia: ${tendenciaLabel} (${pendiente > 0 ? '+' : ''}${pendiente.toFixed(0)} Q/mes)`,
        { meses: n, tendencia: tendenciaLabel, pendiente },
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `Tendencia ${tendenciaLabel}: ${pendiente > 0 ? '+' : ''}${pendiente.toFixed(0)} Q/mes`,
        'analysis',
        { tendencia, pendiente, tendenciaLabel }
      );

    } catch (error) {
      await this.logActividad('tendencias',
        `Error: ${error.message}`,
        { error: error.message },
        null,
        Date.now() - startTime,
        'error'
      );
      return this.formatResponse(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Log de actividad
   */
  async logActividad(categoria, descripcion, detalles, impactoValor, duracionMs, status = 'exitoso') {
    try {
      await db.runAsync(`
        INSERT INTO agentes_logs 
        (empresa_id, agente_nombre, agente_tipo, agente_version, categoria, descripcion, 
         detalles_json, impacto_valor, impacto_moneda, resultado_status, duracion_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        1, this.name, this.role, this.version, categoria, descripcion,
        JSON.stringify(detalles), impactoValor, 'GTQ', status, duracionMs
      ]);
    } catch (e) {
      console.error('[AgenteAnalisis] Error en log:', e.message);
    }
  }
}

module.exports = AgenteAnalisis;
