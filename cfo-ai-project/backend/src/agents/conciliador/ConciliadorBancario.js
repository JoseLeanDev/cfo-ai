/**
 * Conciliador Bancario Agent
 * Gestiona conciliaciones bancarias mensuales
 */
const BaseAgent = require('../BaseAgent');

class ConciliadorBancario extends BaseAgent {
  constructor() {
    super('ConciliadorBancario', 'bank_reconciler', [
      'bank_reconciliation',
      'difference_tracking',
      'adjustment_suggestions',
      'pending_alerts'
    ]);
  }

  async process(input, context) {
    const { task, empresa_id, params = {} } = input;
    const { db } = context;

    try {
      switch (task) {
        case 'alerta-conciliacion-pendiente':
          return await this.alertaConciliacionPendiente(db, empresa_id, params);
        case 'iniciar-conciliaciones':
          return await this.iniciarConciliaciones(db, empresa_id, params);
        case 'presion-conciliacion':
          return await this.presionConciliacion(db, empresa_id, params);
        case 'validar-conciliacion':
          return await this.validarConciliacion(db, empresa_id, params);
        default:
          return this.formatResponse(
            'Tarea no reconocida',
            'error'
          );
      }
    } catch (error) {
      console.error('[ConciliadorBancario] Error:', error);
      return this.formatResponse(
        `Error en conciliación: ${error.message}`,
        'error'
      );
    }
  }

  async alertaConciliacionPendiente(db, empresaId, params) {
    const { mes, anio } = params;

    // Obtener cuentas bancarias sin conciliar
    const cuentasPendientes = await db.allAsync(`
      SELECT 
        cb.id,
        cb.cuenta_bancaria_id,
        c.nombre_banco,
        c.numero_cuenta,
        c.moneda,
        cb.estado,
        cb.saldo_contable_final,
        cb.saldo_estado_cuenta,
        cb.diferencia
      FROM conciliaciones_bancarias cb
      JOIN cuentas_bancarias c ON cb.cuenta_bancaria_id = c.id
      WHERE cb.empresa_id = ? 
        AND cb.anio = ? 
        AND cb.mes = ?
        AND cb.estado != 'conciliado'
    `, [empresaId, anio, mes]);

    if (cuentasPendientes.length === 0) {
      return this.formatResponse(
        '✅ Todas las conciliaciones bancarias están completas',
        'success'
      );
    }

    let mensaje = `⚠️ **Conciliaciones Pendientes - ${mes}/${anio}**\n\n`;
    let alertaAlta = false;

    for (const cuenta of cuentasPendientes) {
      const emoji = cuenta.estado === 'pendiente' ? '⏳' : cuenta.diferencia !== 0 ? '⚠️' : '🔄';
      mensaje += `${emoji} **${cuenta.nombre_banco}** (${cuenta.moneda})\n`;
      mensaje += `   Estado: ${cuenta.estado}\n`;
      
      if (cuenta.diferencia && cuenta.diferencia !== 0) {
        mensaje += `   Diferencia: GTQ ${cuenta.diferencia.toLocaleString()}\n`;
        alertaAlta = true;
      }
      mensaje += `\n`;
    }

    mensaje += `\n📌 **Acción requerida:** Completa las conciliaciones para poder cerrar el mes.`;

    // Log de actividad para el agente
    await this.logAgentActivity(db, empresaId, 'alerta_conciliacion', {
      mes,
      anio,
      cuentas_pendientes: cuentasPendientes.length,
      tiene_diferencias: alertaAlta
    });

    return this.formatResponse(
      mensaje,
      alertaAlta ? 'alert' : 'warning',
      { cuentasPendientes },
      ['Completar conciliaciones pendientes', 'Verificar diferencias identificadas']
    );
  }

  async iniciarConciliaciones(db, empresaId, params) {
    const { mes, anio, autoCrearRegistros } = params;

    // Obtener todas las cuentas bancarias
    const cuentas = await db.allAsync(`
      SELECT id, nombre_banco, numero_cuenta, moneda, saldo_actual
      FROM cuentas_bancarias 
      WHERE empresa_id = ? AND activa = 1
    `, [empresaId]);

    const resultados = [];

    for (const cuenta of cuentas) {
      // Verificar si ya existe conciliación
      const existente = await db.getAsync(`
        SELECT id, estado FROM conciliaciones_bancarias
        WHERE empresa_id = ? AND cuenta_bancaria_id = ? AND anio = ? AND mes = ?
      `, [empresaId, cuenta.id, anio, mes]);

      if (existente) {
        resultados.push({
          cuenta: cuenta.nombre_banco,
          accion: 'omitida',
          mensaje: 'Ya existe conciliación'
        });
        continue;
      }

      if (autoCrearRegistros) {
        // Calcular saldo contable al inicio del mes
        const saldoInicial = await db.getAsync(`
          SELECT saldo_contable_final 
          FROM conciliaciones_bancarias
          WHERE empresa_id = ? AND cuenta_bancaria_id = ? 
            AND (anio < ? OR (anio = ? AND mes < ?))
          ORDER BY anio DESC, mes DESC
          LIMIT 1
        `, [empresaId, cuenta.id, anio, anio, mes]);

        // Si no hay mes anterior, usar saldo actual de la cuenta
        const saldoContableInicial = saldoInicial?.saldo_contable_final || cuenta.saldo_actual;

        // Crear registro de conciliación
        await db.runAsync(`
          INSERT INTO conciliaciones_bancarias (
            empresa_id, cuenta_bancaria_id, anio, mes,
            saldo_contable_inicial, estado, created_at
          ) VALUES (?, ?, ?, ?, ?, 'pendiente', datetime('now'))
        `, [empresaId, cuenta.id, anio, mes, saldoContableInicial]);

        resultados.push({
          cuenta: cuenta.nombre_banco,
          accion: 'creada',
          saldo_inicial: saldoContableInicial
        });
      }
    }

    // Log de actividad
    await this.logAgentActivity(db, empresaId, 'iniciar_conciliaciones', {
      mes,
      anio,
      cuentas_procesadas: cuentas.length,
      resultados
    });

    const creadas = resultados.filter(r => r.accion === 'creada').length;
    const omitidas = resultados.filter(r => r.accion === 'omitida').length;

    return this.formatResponse(
      `📋 **Conciliaciones Iniciadas - ${mes}/${anio}**\n\n` +
      `✅ Creadas: ${creadas}\n` +
      `⏭️ Omitidas (ya existían): ${omitidas}\n\n` +
      `Las conciliaciones están listas para ser procesadas.`,
      'success',
      { resultados }
    );
  }

  async presionConciliacion(db, empresaId, params) {
    const { mes, anio } = params;

    const cuentasPendientes = await db.allAsync(`
      SELECT 
        c.nombre_banco,
        cb.estado,
        cb.created_at
      FROM conciliaciones_bancarias cb
      JOIN cuentas_bancarias c ON cb.cuenta_bancaria_id = c.id
      WHERE cb.empresa_id = ? 
        AND cb.anio = ? 
        AND cb.mes = ?
        AND cb.estado != 'conciliado'
    `, [empresaId, anio, mes]);

    if (cuentasPendientes.length === 0) {
      return this.formatResponse(
        '✅ Todas las conciliaciones están completas',
        'success'
      );
    }

    // Log de actividad de presión
    await this.logAgentActivity(db, empresaId, 'presion_conciliacion', {
      mes,
      anio,
      cuentas_pendientes: cuentasPendientes.length,
      dias_transcurridos: 3
    });

    return this.formatResponse(
      `🚨 **ALERTA: Conciliaciones Pendientes - ${mes}/${anio}**\n\n` +
      `⚠️ Han pasado 3 días y aún hay **${cuentasPendientes.length} cuenta(s)** sin conciliar.\n\n` +
      `📌 **Recordatorio:** Las conciliaciones deben completarse antes del cierre mensual.\n` +
      `⏰ **Impacto:** Esto puede retrasar la generación de estados financieros.`,
      'alert',
      { cuentasPendientes },
      ['Priorizar conciliaciones hoy', 'Contactar al contador responsable']
    );
  }

  async validarConciliacion(db, empresaId, params) {
    const { conciliacion_id } = params;

    const conciliacion = await db.getAsync(`
      SELECT * FROM conciliaciones_bancarias WHERE id = ? AND empresa_id = ?
    `, [conciliacion_id, empresaId]);

    if (!conciliacion) {
      throw new Error('Conciliación no encontrada');
    }

    // Verificar que diferencia = suma de diferencias identificadas
    const detalles = await db.allAsync(`
      SELECT tipo_diferencia, SUM(monto) as total
      FROM conciliacion_detalle
      WHERE conciliacion_id = ?
      GROUP BY tipo_diferencia
    `, [conciliacion_id]);

    const sumaDiferencias = detalles.reduce((sum, d) => sum + d.total, 0);
    const diferenciaEsperada = Math.abs(conciliacion.saldo_contable_final - conciliacion.saldo_estado_cuenta);
    const diferenciaValida = Math.abs(sumaDiferencias - diferenciaEsperada) <= 0.01;

    // Verificar diferencias viejas sin resolver
    const diferenciasViejas = await db.allAsync(`
      SELECT * FROM conciliacion_detalle
      WHERE conciliacion_id = ? AND estado = 'pendiente'
        AND fecha_transaccion < date('now', '-45 days')
    `, [conciliacion_id]);

    const esValida = diferenciaValida && diferenciasViejas.length === 0;

    return this.formatResponse(
      esValida 
        ? '✅ Conciliación válida'
        : `⚠️ Conciliación con problemas:\n` +
          `${!diferenciaValida ? '- La diferencia no cuadra con los items identificados\n' : ''}` +
          `${diferenciasViejas.length > 0 ? `- Hay ${diferenciasViejas.length} diferencias viejas sin resolver` : ''}`,
      esValida ? 'success' : 'alert',
      {
        valida: esValida,
        diferenciaValida,
        diferenciasViejas: diferenciasViejas.length
      }
    );
  }

  async logAgentActivity(db, empresaId, categoria, detalles) {
    try {
      await db.runAsync(`
        INSERT INTO agentes_logs (
          empresa_id, agente_nombre, agente_tipo, categoria,
          descripcion, detalles_json, resultado_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        empresaId,
        'ConciliadorBancario',
        'bank_reconciler',
        categoria,
        `Tarea ejecutada: ${categoria}`,
        JSON.stringify(detalles),
        'exitoso'
      ]);
    } catch (error) {
      console.error('[ConciliadorBancario] Error logging activity:', error);
    }
  }
}

module.exports = ConciliadorBancario;
