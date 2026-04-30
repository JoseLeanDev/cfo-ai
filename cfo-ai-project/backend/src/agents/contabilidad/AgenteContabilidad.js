/**
 * Agente Contabilidad 📗
 * Responsabilidades:
 * - Importar y validar transacciones
 * - Generar asientos contables
 * - Conciliación bancaria
 * - Cierre mensual
 * - Obligaciones fiscales (SAT)
 */

const BaseAgent = require('../BaseAgent');
const db = require('../../../database/connection');

class AgenteContabilidad extends BaseAgent {
  constructor() {
    super('Contabilidad', 'contable', [
      'importarTransacciones',
      'generarAsientos',
      'conciliarBancos',
      'prepararCierreMensual',
      'verificarObligacionesFiscales',
      'validarBalance'
    ]);
    this.version = '2.0.0';
  }

  async process(input, context) {
    const { tarea, empresaId = 1 } = input;
    
    switch(tarea) {
      case 'importarTransacciones':
        return await this.importarTransacciones(empresaId);
      case 'generarAsientos':
        return await this.generarAsientos(empresaId);
      case 'conciliarBancos':
        return await this.conciliarBancos(empresaId);
      case 'prepararCierreMensual':
        return await this.prepararCierreMensual(empresaId);
      case 'verificarObligacionesFiscales':
        return await this.verificarObligacionesFiscales(empresaId);
      default:
        return this.formatResponse('Tarea no reconocida', 'error');
    }
  }

  /**
   * Importar y validar nuevas transacciones
   */
  async importarTransacciones(empresaId) {
    const startTime = Date.now();
    
    try {
      // Verificar transacciones sin asiento (asientos table usa concepto en vez de documento)
      const sinAsiento = await db.allAsync(`
        SELECT t.*
        FROM transacciones t
        WHERE t.empresa_id = ? AND t.estado = 'activo'
          AND NOT EXISTS (SELECT 1 FROM asientos a WHERE a.concepto LIKE '%' || t.id || '%')
        LIMIT 50
      `, [empresaId]);

      const validadas = [];
      const errores = [];

      for (const t of sinAsiento) {
        // Validaciones básicas
        if (!t.monto || t.monto <= 0) {
          errores.push({ id: t.id, error: 'Monto inválido' });
          continue;
        }
        if (!t.fecha) {
          errores.push({ id: t.id, error: 'Fecha faltante' });
          continue;
        }

        validadas.push(t);
      }

      await this.logActividad('importacion_transacciones',
        `${validadas.length} transacciones validadas, ${errores.length} errores`,
        { validadas: validadas.length, errores: errores.length },
        null,
        Date.now() - startTime,
        errores.length > 0 ? 'advertencia' : 'exitoso'
      );

      return this.formatResponse(
        `${validadas.length} transacciones listas para asientos`,
        'analysis',
        { validadas, errores }
      );

    } catch (error) {
      await this.logActividad('importacion_transacciones',
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
   * Generar asientos contables automáticos
   */
  async generarAsientos(empresaId) {
    const startTime = Date.now();
    
    try {
      // Obtener cuentas contables
      const cuentas = await db.allAsync(`
        SELECT * FROM cuentas_contables WHERE empresa_id = ?
      `, [empresaId]);

      // Transacciones sin asiento (asientos usa concepto en vez de documento)
      const transacciones = await db.allAsync(`
        SELECT t.*
        FROM transacciones t
        WHERE t.empresa_id = ? AND t.estado = 'activo'
          AND NOT EXISTS (SELECT 1 FROM asientos a WHERE a.concepto LIKE '%' || t.id || '%')
        LIMIT 50
      `, [empresaId]);

      const asientosGenerados = [];

      for (const t of transacciones) {
        // Determinar cuentas según tipo
        let cuentaDebe, cuentaHaber;
        
        if (t.tipo === 'ingreso') {
          cuentaDebe = '1.01.01'; // Caja/Bancos
          cuentaHaber = '4.01.01'; // Ingresos por ventas
        } else if (t.tipo === 'gasto') {
          cuentaDebe = '5.01.01'; // Gastos operativos
          cuentaHaber = '1.01.01'; // Caja/Bancos
        }

        // Crear asiento resumen (PostgreSQL schema: empresa_id, fecha, concepto, total_debe, total_haber, estado)
        const concepto = `Asiento ${t.tipo} - Transacción #${t.id} - ${t.concepto || 'Sin descripción'}`;
        
        await db.runAsync(`
          INSERT INTO asientos (empresa_id, fecha, concepto, total_debe, total_haber, estado, created_at)
          VALUES (?, ?, ?, ?, ?, 'completado', NOW())
        `, [empresaId, t.fecha, concepto, t.tipo === 'gasto' ? t.monto : 0, t.tipo === 'ingreso' ? t.monto : 0]);

        asientosGenerados.push({ transaccionId: t.id, concepto });
      }

      await this.logActividad('asientos_generados',
        `${asientosGenerados.length} asientos generados`,
        { count: asientosGenerados.length },
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `${asientosGenerados.length} asientos generados`,
        'analysis',
        { asientosGenerados }
      );

    } catch (error) {
      await this.logActividad('asientos_generados',
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
   * Conciliar movimientos bancarios
   */
  async conciliarBancos(empresaId) {
    const startTime = Date.now();
    
    try {
      // Obtener movimientos no conciliados
      const movimientos = await db.allAsync(`
        SELECT m.*, cb.nombre as cuenta_nombre
        FROM movimientos_bancarios m
        JOIN cuentas_bancarias cb ON cb.id = m.cuenta_bancaria_id
        WHERE cb.empresa_id = ? AND m.estado = 'no_conciliado'
        ORDER BY m.fecha DESC
        LIMIT 100
      `, [empresaId]);

      const conciliados = [];
      const noConciliados = [];

      for (const mov of movimientos) {
        // Buscar transacción similar
        const match = await db.getAsync(`
          SELECT t.*
          FROM transacciones t
          WHERE t.empresa_id = ? 
          AND t.monto = ?
          AND ABS((t.fecha::date - ?::date)) <= 2
          LIMIT 1
        `, [empresaId, Math.abs(mov.monto), mov.fecha]);

        if (match) {
          // Conciliar
          await db.runAsync(`
            UPDATE movimientos_bancarios 
            SET estado = 'conciliado', transaccion_id = ?
            WHERE id = ?
          `, [match.id, mov.id]);

          conciliados.push({ movimientoId: mov.id, transaccionId: match.id });
        } else {
          noConciliados.push(mov);
        }
      }

      // Crear alertas para no conciliados significativos
      const totalNoConciliado = noConciliados.reduce((sum, m) => sum + Math.abs(m.monto), 0);
      
      if (totalNoConciliado > 10000) {
        await db.runAsync(`
          INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, ['conciliacion', 'media',
          `${noConciliados.length} movimientos no conciliados`,
          `Total no conciliado: Q${totalNoConciliado.toLocaleString()}. Revisar diferencias bancarias.`
        ]);
      }

      await this.logActividad('conciliacion_bancaria',
        `${conciliados.length} conciliados, ${noConciliados.length} pendientes`,
        { conciliados: conciliados.length, noConciliados: noConciliados.length, totalNoConciliado },
        totalNoConciliado,
        Date.now() - startTime
      );

      return this.formatResponse(
        `${conciliados.length} conciliados, ${noConciliados.length} pendientes`,
        'analysis',
        { conciliados, noConciliados, totalNoConciliado }
      );

    } catch (error) {
      await this.logActividad('conciliacion_bancaria',
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
   * Preparar cierre mensual
   */
  async prepararCierreMensual(empresaId) {
    const startTime = Date.now();
    
    try {
      const periodo = new Date().toISOString().slice(0, 7); // YYYY-MM

      // 1. Verificar asientos pendientes
      const sinAsiento = await db.getAsync(`
        SELECT COUNT(*) as count FROM transacciones t
        WHERE t.empresa_id = ? AND t.estado = 'activo'
          AND NOT EXISTS (SELECT 1 FROM asientos a WHERE a.concepto LIKE '%' || t.id || '%')
          AND TO_CHAR(t.fecha, 'YYYY-MM') = ?
      `, [empresaId, periodo]);

      // 2. Verificar balance
      const balance = await db.getAsync(`
        SELECT 
          SUM(total_debe) as total_debe,
          SUM(total_haber) as total_haber
        FROM asientos
        WHERE empresa_id = ? AND TO_CHAR(fecha, 'YYYY-MM') = ?
      `, [empresaId, periodo]);

      const diferencia = Math.abs((balance?.total_debe || 0) - (balance?.total_haber || 0));
      const balanceOk = diferencia < 0.01;

      // 3. Transacciones del período
      const transacciones = await db.allAsync(`
        SELECT 
          tipo,
          SUM(monto) as total
        FROM transacciones
        WHERE empresa_id = ? AND TO_CHAR(fecha, 'YYYY-MM') = ?
        GROUP BY tipo
      `, [empresaId, periodo]);

      const resumen = {
        periodo,
        asientosPendientes: sinAsiento.count,
        balanceOk,
        diferenciaBalance: diferencia,
        transacciones: Object.fromEntries(transacciones.map(t => [t.tipo, t.total])),
        listoParaCierre: sinAsiento.count === 0 && balanceOk
      };

      // Guardar en cierres_mensuales (compatibilidad con schema existente)
      await db.runAsync(`
        INSERT INTO cierres_mensuales (mes, estado, notas, created_at)
        VALUES (?, ?, ?, NOW())
      `, [periodo, resumen.listoParaCierre ? 'listo' : 'revision', JSON.stringify(resumen)]);

      await this.logActividad('cierre_mensual',
        `Cierre ${periodo}: ${resumen.listoParaCierre ? 'Listo' : 'Revisión'} (${sinAsiento.count} pendientes)`,
        resumen,
        null,
        Date.now() - startTime
      );

      return this.formatResponse(
        `Cierre ${periodo}: ${resumen.listoParaCierre ? '✅ Listo' : '⚠️ Revisión necesaria'}`,
        'analysis',
        resumen
      );

    } catch (error) {
      await this.logActividad('cierre_mensual',
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
   * Verificar obligaciones fiscales próximas
   */
  async verificarObligacionesFiscales(empresaId) {
    const startTime = Date.now();
    
    try {
      const hoy = new Date().toISOString().split('T')[0];

      // Obligaciones próximas (7 días)
      const proximas = await db.allAsync(`
        SELECT *
        FROM obligaciones_sat
        WHERE empresa_id = ? AND estado = 'pendiente'
        AND fecha_vencimiento BETWEEN ? AND date(?, '+7 days')
        ORDER BY fecha_vencimiento
      `, [empresaId, hoy, hoy]);

      // Obligaciones vencidas
      const vencidas = await db.allAsync(`
        SELECT *
        FROM obligaciones_sat
        WHERE empresa_id = ? AND estado = 'pendiente' AND fecha_vencimiento < ?
        ORDER BY fecha_vencimiento
      `, [empresaId, hoy]);

      const totalProximas = proximas.reduce((sum, o) => sum + (o.monto_estimado || 0), 0);
      const totalVencidas = vencidas.reduce((sum, o) => sum + (o.monto_estimado || 0), 0);

      // Alertas
      for (const o of proximas) {
        const dias = Math.ceil((new Date(o.fecha_vencimiento) - new Date(hoy)) / (1000 * 60 * 60 * 24));
        
        await db.runAsync(`
          INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, ['sat', dias <= 2 ? 'alta' : 'media',
          `${o.obligacion} vence en ${dias} días`,
          `Formulario ${o.formulario} - Fecha: ${o.fecha_vencimiento}. Preparar declaración y pago.`
        ]);
      }

      for (const o of vencidas) {
        await db.runAsync(`
          INSERT INTO alertas_financieras (tipo, nivel, titulo, descripcion, created_at)
          VALUES (?, 'alta', ?, ?, NOW())
        `, ['sat',
          `URGENTE: ${o.obligacion} venció`,
          `Formulario ${o.formulario} venció el ${o.fecha_vencimiento}. Regularizar inmediatamente.`
        ]);
      }

      await this.logActividad('obligaciones_fiscales',
        `${proximas.length} próximas, ${vencidas.length} vencidas`,
        { proximas: proximas.length, vencidas: vencidas.length, totalProximas, totalVencidas },
        totalProximas + totalVencidas,
        Date.now() - startTime,
        vencidas.length > 0 ? 'advertencia' : 'exitoso'
      );

      return this.formatResponse(
        `${proximas.length} obligaciones próximas, ${vencidas.length} vencidas`,
        vencidas.length > 0 ? 'alert' : 'analysis',
        { proximas, vencidas, totalProximas, totalVencidas }
      );

    } catch (error) {
      await this.logActividad('obligaciones_fiscales',
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
      console.error('[AgenteContabilidad] Error en log:', e.message);
    }
  }
}

module.exports = AgenteContabilidad;
