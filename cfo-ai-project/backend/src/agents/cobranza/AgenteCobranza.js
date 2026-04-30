/**
 * Agente Cobranza 💵
 * Responsabilidades:
 * - Aging de cartera (CxC)
 * - Cálculo de DSO (Days Sales Outstanding)
 * - Cálculo de CCC (Cash Conversion Cycle)
 * - Recomendaciones de cobro
 * - Alertas de morosidad
 */

const BaseAgent = require('../BaseAgent');
const db = require('../../../database/connection');

class AgenteCobranza extends BaseAgent {
  constructor() {
    super('Cobranza', 'cobranza', [
      'actualizarAging',
      'calcularDSO',
      'calcularCCC',
      'generarRecomendacionesCobro',
      'alertarMorosidad',
      'analizarCartera'
    ]);
    this.version = '2.0.0';
  }

  async process(input, context) {
    const { tarea, empresaId = 1 } = input;
    
    switch(tarea) {
      case 'actualizarAging':
        return await this.actualizarAging(empresaId);
      case 'calcularDSO':
        return await this.calcularDSO(empresaId);
      case 'calcularCCC':
        return await this.calcularCCC(empresaId);
      case 'generarRecomendacionesCobro':
        return await this.generarRecomendacionesCobro(empresaId);
      case 'alertarMorosidad':
        return await this.alertarMorosidad(empresaId);
      default:
        return this.formatResponse('Tarea no reconocida', 'error');
    }
  }

  /**
   * Actualizar aging de cartera (buckets de días)
   */
  async actualizarAging(empresaId) {
    const startTime = Date.now();
    
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');

      // Actualizar días de atraso
      await db.runAsync(`
        UPDATE cuentas_cobrar 
        SET dias_atraso = GREATEST(0, (?::date - fecha_vencimiento::date))
        WHERE empresa_id = ? AND estado = 'pendiente' AND fecha_vencimiento < ?
      `, [hoy, empresaId, hoy]);

      // Calcular aging buckets
      const aging = await db.allAsync(`
        SELECT 
          CASE 
            WHEN dias_atraso <= 0 THEN 'Por vencer'
            WHEN dias_atraso <= 30 THEN '1-30 días'
            WHEN dias_atraso <= 60 THEN '31-60 días'
            WHEN dias_atraso <= 90 THEN '61-90 días'
            ELSE 'Más de 90 días'
          END as bucket,
          COUNT(*) as cantidad,
          SUM(monto_pendiente) as total,
          AVG(dias_atraso) as promedio_atraso
        FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado = 'pendiente'
        GROUP BY bucket
        ORDER BY MIN(dias_atraso)
      `, [empresaId]);

      const totalCartera = aging.reduce((sum, a) => sum + a.total, 0);

      // Guardar snapshot
      await db.runAsync(`
        INSERT INTO snapshots_financieros (empresa_id, tipo, datos_json, created_at)
        VALUES (?, 'aging_cartera', ?, NOW())
      `, [empresaId, JSON.stringify({ aging, totalCartera, fecha: hoy })]);

      await this.logActividad('aging_cartera',
        `Aging actualizado: Q${totalCartera.toLocaleString()} en ${aging.length} buckets`,
        { aging, totalCartera },
        totalCartera,
        Date.now() - startTime
      );

      return this.formatResponse(
        `Aging actualizado: Q${totalCartera.toLocaleString()} en ${aging.length} rangos`,
        'analysis',
        { aging, totalCartera }
      );

    } catch (error) {
      await this.logActividad('aging_cartera',
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
   * Calcular DSO (Days Sales Outstanding)
   */
  async calcularDSO(empresaId) {
    const startTime = Date.now();
    
    try {
      // Fórmula: (CxC promedio / Ventas del período) * Días del período
      // Usar últimos 30 días
      const ventas30d = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE empresa_id = ? AND tipo = 'ingreso' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `, [empresaId]);

      const cxcPromedio = await db.getAsync(`
        SELECT COALESCE(AVG(saldo_dia), 0) as promedio FROM (
          SELECT fecha_vencimiento, SUM(monto_pendiente) as saldo_dia
          FROM cuentas_cobrar
          WHERE empresa_id = ? AND estado = 'pendiente'
          GROUP BY fecha_vencimiento
        )
      `, [empresaId]);

      const dso = ventas30d.total > 0 
        ? (cxcPromedio.promedio / ventas30d.total) * 30 
        : 0;

      // Benchmark: DSO ideal < 45 días
      const benchmark = 45;
      const diferencia = dso - benchmark;
      const status = dso <= benchmark ? 'saludable' : dso <= benchmark * 1.5 ? 'atencion' : 'critico';

      await this.logActividad('dso',
        `DSO calculado: ${dso.toFixed(1)} días (${status})`,
        { dso, benchmark, diferencia, status, ventas30d: ventas30d.total },
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `DSO: ${dso.toFixed(1)} días (${status})`,
        'analysis',
        { dso, benchmark, diferencia, status }
      );

    } catch (error) {
      await this.logActividad('dso',
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
   * Calcular CCC (Cash Conversion Cycle)
   */
  async calcularCCC(empresaId) {
    const startTime = Date.now();
    
    try {
      // CCC = DSO + DIO - DPO

      // 1. DSO (Days Sales Outstanding)
      const ventas30d = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE empresa_id = ? AND tipo = 'ingreso' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `, [empresaId]);

      const cxcActual = await db.getAsync(`
        SELECT COALESCE(SUM(monto_pendiente), 0) as total FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado = 'pendiente'
      `, [empresaId]);

      const dso = ventas30d.total > 0 ? (cxcActual.total / ventas30d.total) * 30 : 0;

      // 2. DIO (Days Inventory Outstanding) - simulado con transacciones de compra
      const costoVentas30d = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE empresa_id = ? AND tipo = 'gasto' AND categoria LIKE '%compra%' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `, [empresaId]);

      // Usamos un estimado de inventario si no hay datos específicos
      const inventario = 0; // Se requiere tabla de inventario
      const dio = costoVentas30d.total > 0 ? (inventario / costoVentas30d.total) * 30 : 0;

      // 3. DPO (Days Payable Outstanding)
      const cxpActual = await db.getAsync(`
        SELECT COALESCE(SUM(monto_pendiente), 0) as total FROM cuentas_pagar
        WHERE empresa_id = ? AND estado = 'pendiente'
      `, [empresaId]);

      const compras30d = await db.getAsync(`
        SELECT COALESCE(SUM(monto), 0) as total FROM transacciones
        WHERE empresa_id = ? AND tipo = 'gasto' AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      `, [empresaId]);

      const dpo = compras30d.total > 0 ? (cxpActual.total / compras30d.total) * 30 : 0;

      // CCC
      const ccc = dso + dio - dpo;

      // Guardar snapshot
      await db.runAsync(`
        INSERT INTO snapshots_financieros (empresa_id, tipo, fecha, datos_json, created_at)
        VALUES (?, 'ccc', ?, ?, NOW())
      `, [empresaId, new Date().toISOString().split('T')[0], JSON.stringify({ dso, dio, dpo, ccc })]);

      await this.logActividad('ccc',
        `CCC calculado: ${ccc.toFixed(1)} días (DSO:${dso.toFixed(0)} DIO:${dio.toFixed(0)} DPO:${dpo.toFixed(0)})`,
        { dso, dio, dpo, ccc },
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `CCC: ${ccc.toFixed(1)} días (DSO:${dso.toFixed(0)} + DIO:${dio.toFixed(0)} - DPO:${dpo.toFixed(0)})`,
        'analysis',
        { dso, dio, dpo, ccc }
      );

    } catch (error) {
      await this.logActividad('ccc',
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
   * Generar recomendaciones de cobro inteligentes
   */
  async generarRecomendacionesCobro(empresaId) {
    const startTime = Date.now();
    
    try {
      // Clientes con mayor saldo y más atraso
      const prioritarios = await db.allAsync(`
        SELECT 
          cliente,
          SUM(monto_pendiente) as total,
          MAX(dias_atraso) as max_atraso,
          COUNT(*) as facturas
        FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado = 'pendiente' AND dias_atraso > 0
        GROUP BY cliente
        ORDER BY total DESC
        LIMIT 10
      `, [empresaId]);

      const recomendaciones = prioritarios.map(c => {
        let accion = 'Cobrar inmediatamente';
        let prioridad = 'alta';
        
        if (c.max_atraso > 90) {
          accion = 'Considerar castigo o legal';
          prioridad = 'critica';
        } else if (c.max_atraso > 60) {
          accion = 'Llamada directa + oferta descuento';
          prioridad = 'alta';
        } else if (c.max_atraso > 30) {
          accion = 'Recordatorio formal + negociar';
          prioridad = 'media';
        } else {
          accion = 'Recordatorio amigable';
          prioridad = 'baja';
        }

        return {
          cliente: c.cliente,
          saldo: c.total,
          max_atraso: c.max_atraso,
          facturas: c.facturas,
          accion,
          prioridad
        };
      });

      await this.logActividad('recomendaciones_cobro',
        `${recomendaciones.length} recomendaciones generadas`,
        { recomendaciones: recomendaciones.length },
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `${recomendaciones.length} clientes prioritarios identificados`,
        'recommendation',
        { recomendaciones }
      );

    } catch (error) {
      await this.logActividad('recomendaciones_cobro',
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
   * Alertar sobre morosidad crítica
   */
  async alertarMorosidad(empresaId) {
    const startTime = Date.now();
    
    try {
      // Clientes con >90 días de atraso
      const morosos = await db.allAsync(`
        SELECT 
          cliente,
          SUM(monto_pendiente) as total,
          MAX(dias_atraso) as max_atraso
        FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado = 'pendiente' AND dias_atraso > 90
        GROUP BY cliente
        ORDER BY total DESC
      `, [empresaId]);

      const totalMoroso = morosos.reduce((sum, m) => sum + m.total, 0);

      // Crear alertas
      for (const m of morosos) {
        await db.runAsync(`
          INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, ['morosidad', 'alta',
          `Cliente ${m.cliente}: ${m.max_atraso} días de atraso`,
          `Saldo: Q${m.total.toLocaleString()}. Contactar inmediatamente para cobro.`
        ]);
      }

      await this.logActividad('morosidad',
        `${morosos.length} clientes morosos (>90 días), total: Q${totalMoroso.toLocaleString()}`,
        { morosos: morosos.length, totalMoroso },
        totalMoroso,
        Date.now() - startTime,
        morosos.length > 0 ? 'advertencia' : 'exitoso'
      );

      return this.formatResponse(
        morosos.length > 0 
          ? `🚨 ${morosos.length} clientes morosos: Q${totalMoroso.toLocaleString()}`
          : '✅ Sin morosidad crítica',
        morosos.length > 0 ? 'alert' : 'analysis',
        { morosos, totalMoroso }
      );

    } catch (error) {
      await this.logActividad('morosidad',
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        1, this.name, this.role, this.version, categoria, descripcion,
        JSON.stringify(detalles), impactoValor, 'GTQ', status, duracionMs
      ]);
    } catch (e) {
      console.error('[AgenteCobranza] Error en log:', e.message);
    }
  }
}

module.exports = AgenteCobranza;
