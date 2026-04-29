/**
 * Agente Caja 💰
 * Responsabilidades:
 * - Proyección de cash flow
 * - Posición de caja actual
 * - Cálculo de runway
 * - Alertas de liquidez
 */

const BaseAgent = require('../BaseAgent');
const db = require('../../../database/connection');

class AgenteCaja extends BaseAgent {
  constructor() {
    super('Caja', 'tesoreria', [
      'proyectarCashFlow',
      'actualizarPosicionCaja',
      'calcularRunway',
      'detectarRiesgosLiquidez',
      'generarAlertasCaja'
    ]);
    this.version = '2.0.0';
  }

  async process(input, context) {
    const { tarea, empresaId = 1 } = input;
    
    switch(tarea) {
      case 'proyectarCashFlow':
        return await this.proyectarCashFlow(empresaId);
      case 'actualizarPosicionCaja':
        return await this.actualizarPosicionCaja(empresaId);
      case 'calcularRunway':
        return await this.calcularRunway(empresaId);
      case 'detectarRiesgosLiquidez':
        return await this.detectarRiesgosLiquidez(empresaId);
      default:
        return this.formatResponse('Tarea no reconocida', 'error');
    }
  }

  /**
   * Proyectar cash flow para los próximos 90 días
   */
  async proyectarCashFlow(empresaId) {
    const startTime = Date.now();
    
    try {
      // Obtener datos históricos de los últimos 6 meses
      const historico = await db.allAsync(`
        SELECT 
          strftime('%Y-%m', fecha) as mes,
          SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
        FROM transacciones
        WHERE empresa_id = ? AND fecha >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY mes DESC
      `, [empresaId]);

      // Obtener cuentas por cobrar pendientes (entradas futuras)
      const entradasFuturas = await db.allAsync(`
        SELECT 
          fecha_vencimiento,
          SUM(monto) as monto
        FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado = 'pendiente' AND fecha_vencimiento >= date('now')
        GROUP BY fecha_vencimiento
        ORDER BY fecha_vencimiento
      `, [empresaId]);

      // Obtener cuentas por pagar pendientes (salidas futuras)
      const salidasFuturas = await db.allAsync(`
        SELECT 
          fecha_vencimiento,
          SUM(monto) as monto
        FROM cuentas_pagar
        WHERE empresa_id = ? AND estado = 'pendiente' AND fecha_vencimiento >= date('now')
        GROUP BY fecha_vencimiento
        ORDER BY fecha_vencimiento
      `, [empresaId]);

      // Calcular promedio mensual de ingresos/gastos
      const promedioIngresos = historico.length > 0 
        ? historico.reduce((sum, h) => sum + h.ingresos, 0) / historico.length 
        : 0;
      const promedioGastos = historico.length > 0 
        ? historico.reduce((sum, h) => sum + h.gastos, 0) / historico.length 
        : 0;

      // Posición actual de caja
      const posicionCaja = await this.obtenerPosicionCaja(empresaId);

      // Generar proyección 90 días
      const proyeccion = [];
      let saldoAcumulado = posicionCaja.total;
      
      for (let i = 1; i <= 90; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Entradas esperadas para esta fecha
        const entradasDia = entradasFuturas
          .filter(e => e.fecha_vencimiento === fechaStr)
          .reduce((sum, e) => sum + e.monto, 0);
        
        // Salidas esperadas para esta fecha
        const salidasDia = salidasFuturas
          .filter(s => s.fecha_vencimiento === fechaStr)
          .reduce((sum, s) => sum + s.monto, 0);
        
        // Agregar promedio diario si no hay datos específicos
        const ingresosDia = entradasDia > 0 ? entradasDia : (promedioIngresos / 30);
        const gastosDia = salidasDia > 0 ? salidasDia : (promedioGastos / 30);
        
        saldoAcumulado += ingresosDia - gastosDia;
        
        proyeccion.push({
          fecha: fechaStr,
          dia: i,
          saldo_proyectado: Math.round(saldoAcumulado * 100) / 100,
          entradas: Math.round(ingresosDia * 100) / 100,
          salidas: Math.round(gastosDia * 100) / 100,
          balance: Math.round((ingresosDia - gastosDia) * 100) / 100
        });
      }

      // Detectar cuando el saldo cae bajo cero
      const diasHastaNegativo = proyeccion.findIndex(p => p.saldo_proyectado < 0);
      const runwayDias = diasHastaNegativo > 0 ? diasHastaNegativo : 90;

      // Guardar snapshot (compatibilidad con schema existente)
      await db.runAsync(`
        INSERT INTO snapshots_financieros (fecha, metricas_json, created_at)
        VALUES (?, ?, datetime('now'))
      `, [new Date().toISOString(), JSON.stringify({ proyeccion, runwayDias, posicionActual: posicionCaja })]);

      // Log del agente
      await this.logActividad('proyeccion_cashflow', 
        `Cash flow proyectado: ${runwayDias} días de runway`,
        { runwayDias, promedioIngresos, promedioGastos, posicionCaja },
        posicionCaja.total,
        Date.now() - startTime
      );

      return this.formatResponse(
        `Proyección de cash flow generada. Runway: ${runwayDias} días.`,
        'analysis',
        { proyeccion, runwayDias, posicionCaja, promedioIngresos, promedioGastos }
      );

    } catch (error) {
      await this.logActividad('proyeccion_cashflow', 
        `Error en proyección: ${error.message}`,
        { error: error.message },
        null,
        Date.now() - startTime,
        'error'
      );
      return this.formatResponse(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Obtener posición actual de caja
   */
  async actualizarPosicionCaja(empresaId) {
    const startTime = Date.now();
    
    try {
      const posicion = await this.obtenerPosicionCaja(empresaId);
      
      // Obtener transacciones últimas 24h
      const movimientos24h = await db.allAsync(`
        SELECT tipo, SUM(monto) as total
        FROM transacciones
        WHERE empresa_id = ? AND fecha >= date('now', '-1 day')
        GROUP BY tipo
      `, [empresaId]);

      const ingresos24h = movimientos24h.find(m => m.tipo === 'ingreso')?.total || 0;
      const gastos24h = movimientos24h.find(m => m.tipo === 'gasto')?.total || 0;

      await this.logActividad('posicion_caja',
        `Posición caja actualizada: Q${posicion.total.toLocaleString()}`,
        { ...posicion, ingresos24h, gastos24h },
        posicion.total,
        Date.now() - startTime
      );

      return this.formatResponse(
        `Posición de caja: Q${posicion.total.toLocaleString()}`,
        'data',
        { ...posicion, ingresos24h, gastos24h }
      );

    } catch (error) {
      await this.logActividad('posicion_caja',
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
   * Calcular runway basado en promedio de gastos
   */
  async calcularRunway(empresaId) {
    const startTime = Date.now();
    
    try {
      const posicionCaja = await this.obtenerPosicionCaja(empresaId);
      
      // Gasto promedio mensual últimos 3 meses
      const gastosPromedio = await db.getAsync(`
        SELECT AVG(mensual) as promedio FROM (
          SELECT strftime('%Y-%m', fecha) as mes, SUM(monto) as mensual
          FROM transacciones
          WHERE empresa_id = ? AND tipo = 'gasto' AND fecha >= date('now', '-3 months')
          GROUP BY mes
        )
      `, [empresaId]);

      const gastoMensual = gastosPromedio?.promedio || 0;
      const runwayMeses = gastoMensual > 0 ? posicionCaja.total / gastoMensual : 0;
      const runwayDias = Math.round(runwayMeses * 30);

      // Nivel de riesgo
      let nivelRiesgo = 'bajo';
      if (runwayMeses < 1) nivelRiesgo = 'critico';
      else if (runwayMeses < 3) nivelRiesgo = 'alto';
      else if (runwayMeses < 6) nivelRiesgo = 'medio';

      await this.logActividad('runway',
        `Runway calculado: ${runwayMeses.toFixed(1)} meses (${runwayDias} días) - Riesgo: ${nivelRiesgo}`,
        { runwayMeses, runwayDias, nivelRiesgo, posicionCaja: posicionCaja.total, gastoMensual },
        posicionCaja.total,
        Date.now() - startTime
      );

      return this.formatResponse(
        `Runway: ${runwayMeses.toFixed(1)} meses (${runwayDias} días) - Nivel: ${nivelRiesgo}`,
        'analysis',
        { runwayMeses, runwayDias, nivelRiesgo, gastoMensual, posicionCaja }
      );

    } catch (error) {
      await this.logActividad('runway',
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
   * Detectar riesgos de liquidez y generar alertas
   */
  async detectarRiesgosLiquidez(empresaId) {
    const startTime = Date.now();
    
    try {
      const posicion = await this.obtenerPosicionCaja(empresaId);
      const runway = await this.calcularRunway(empresaId);
      const datos = runway.data;

      const alertas = [];
      
      // Alerta 1: Runway crítico
      if (datos.runwayMeses < 1) {
        alertas.push({
          nivel: 'critico',
          tipo: 'runway_critico',
          mensaje: `Runway crítico: ${datos.runwayDias} días. Acción inmediata requerida.`,
          accion: 'Acelerar cobranza o buscar financiamiento'
        });
      }
      // Alerta 2: Runway bajo
      else if (datos.runwayMeses < 3) {
        alertas.push({
          nivel: 'alto',
          tipo: 'runway_bajo',
          mensaje: `Runway bajo: ${datos.runwayMeses.toFixed(1)} meses`,
          accion: 'Revisar gastos y acelerar ingresos'
        });
      }

      // Alerta 3: CxC vencidas significativas
      const cxcVencidas = await db.getAsync(`
        SELECT SUM(monto) as total FROM cuentas_cobrar
        WHERE empresa_id = ? AND estado = 'pendiente' AND fecha_vencimiento < date('now')
      `, [empresaId]);

      if (cxcVencidas?.total > posicion.total * 0.5) {
        alertas.push({
          nivel: 'alto',
          tipo: 'cxc_altas',
          mensaje: `CxC vencidas: Q${cxcVencidas.total.toLocaleString()} (>50% de caja)`,
          accion: 'Priorizar cobranza inmediata'
        });
      }

        // Guardar alertas (compatibilidad con schema existente)
      for (const alerta of alertas) {
        await db.runAsync(`
          INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `, [alerta.tipo, alerta.nivel === 'critico' ? 'alta' : alerta.nivel === 'alto' ? 'alta' : 'media', alerta.mensaje, alerta.accion]);
      }

      await this.logActividad('riesgos_liquidez',
        `Detectadas ${alertas.length} alertas de liquidez`,
        { alertas, posicion: posicion.total },
        null,
        Date.now() - startTime,
        alertas.length > 0 ? 'advertencia' : 'exitoso'
      );

      return this.formatResponse(
        alertas.length > 0 
          ? `⚠️ ${alertas.length} alertas de liquidez detectadas`
          : '✅ Liquidez estable',
        alertas.length > 0 ? 'alert' : 'analysis',
        { alertas, runway: datos }
      );

    } catch (error) {
      await this.logActividad('riesgos_liquidez',
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
   * Obtener posición de caja (helper)
   */
  async obtenerPosicionCaja(empresaId) {
    const cuentas = await db.allAsync(`
      SELECT id, nombre, banco, saldo, moneda
      FROM cuentas_bancarias
      WHERE empresa_id = ? AND activa = 1
    `, [empresaId]);

    const total = cuentas.reduce((sum, c) => sum + (c.saldo || 0), 0);
    
    return {
      total: Math.round(total * 100) / 100,
      cuentas: cuentas.map(c => ({
        id: c.id,
        nombre: c.nombre || c.banco,
        saldo: c.saldo,
        moneda: c.moneda
      }))
    };
  }

  /**
   * Log de actividad en agentes_logs
   */
  async logActividad(categoria, descripcion, detalles, impactoValor, duracionMs, status = 'exitoso') {
    try {
      await db.runAsync(`
        INSERT INTO agentes_logs 
        (empresa_id, agente_nombre, agente_tipo, agente_version, categoria, descripcion, 
         detalles_json, impacto_valor, impacto_moneda, resultado_status, duracion_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        1, // empresa_id
        this.name,
        this.role,
        this.version,
        categoria,
        descripcion,
        JSON.stringify(detalles),
        impactoValor,
        'GTQ',
        status,
        duracionMs
      ]);
    } catch (e) {
      console.error('[AgenteCaja] Error en log:', e.message);
    }
  }
}

module.exports = AgenteCaja;
