/**
 * Auditor Automático Agent
 * Detecta anomalías e irregularidades en transacciones
 * Identifica posibles fraudes o errores
 */
const BaseAgent = require('../BaseAgent');

class AuditorAutomatico extends BaseAgent {
  constructor() {
    super('AuditorAutomatico', 'internal_auditor', [
      'anomaly_detection',
      'fraud_detection',
      'compliance_check',
      'duplicate_detection',
      'outlier_analysis'
    ]);
  }

  async process(input, context) {
    const { query, empresaId, task, empresa_id, params = {} } = input;
    const { db } = context;
    
    // Modo Scheduler (tareas programadas)
    if (task) {
      return await this.processTask(task, empresa_id || empresaId, params, db);
    }
    
    // Modo Chatbot (consultas conversacionales)
    this.addToMemory('user', query);

    try {
      const query_lower = query.toLowerCase();

      if (query_lower.includes('transacción') || query_lower.includes('auditar') || query_lower.includes('revisar')) {
        return await this.auditTransactions(db, empresaId);
      }

      if (query_lower.includes('anomalía') || query_lower.includes('extraño') || query_lower.includes('sospechoso')) {
        return await this.detectAnomalies(db, empresaId);
      }

      if (query_lower.includes('duplicado') || query_lower.includes('repetido')) {
        return await this.findDuplicates(db, empresaId);
      }

      // Auditoría completa por defecto
      return await this.fullAudit(db, empresaId);

    } catch (error) {
      console.error('[AuditorAutomatico] Error:', error);
      return this.formatResponse(
        'Hubo un error durante la auditoría.',
        'error'
      );
    }
  }

  async processTask(task, empresaId, params, db) {
    try {
      switch (task) {
        case 'detectar-anomalias-tiempo-real':
          return await this.detectarAnomaliasTiempoReal(db, empresaId, params);
        case 'alertas-pre-cierre':
          return await this.alertasPreCierre(db, empresaId, params);
        case 'auditoria-cuentas-cxp-cxc':
          return await this.auditoriaCxpCxc(db, empresaId, params);
        case 'validacion-apertura-mes':
          return await this.validacionAperturaMes(db, empresaId, params);
        case 'presion-cierre-tardio':
          return await this.presionCierreTardio(db, empresaId, params);
        default:
          return this.formatResponse(
            `Tarea no reconocida: ${task}`,
            'error'
          );
      }
    } catch (error) {
      console.error('[AuditorAutomatico] Error en task:', error);
      return this.formatResponse(
        `Error ejecutando ${task}: ${error.message}`,
        'error'
      );
    }
  }

  async detectarAnomaliasTiempoReal(db, empresaId, params) {
    const { checkSaldosNegativos, checkMontosAtipicos, checkDuplicados, horasAtras = 4 } = params;
    const alerts = [];

    // 1. Transacciones recientes con montos atípicos
    if (checkMontosAtipicos) {
      const stats = await db.getAsync(`
        SELECT AVG(monto) as avg_monto, 
               (SELECT AVG(monto) FROM transacciones WHERE empresa_id = ? AND fecha >= datetime('now', '-${horasAtras} hours')) as avg_reciente
        FROM transacciones 
        WHERE empresa_id = ? AND tipo = 'egreso'
      `, [empresaId, empresaId]);

      const transaccionesAltas = await db.allAsync(`
        SELECT id, fecha, descripcion, monto, cuenta_id
        FROM transacciones 
        WHERE empresa_id = ? 
          AND tipo = 'egreso'
          AND fecha >= datetime('now', '-${horasAtras} hours')
          AND monto > ? * 3
        ORDER BY monto DESC
        LIMIT 5
      `, [empresaId, stats?.avg_monto || 0]);

      if (transaccionesAltas.length > 0) {
        alerts.push({
          tipo: 'monto_alto',
          severidad: 'medium',
          mensaje: `${transaccionesAltas.length} transacciones altas detectadas`,
          datos: transaccionesAltas
        });
      }
    }

    // 2. Saldos negativos
    if (checkSaldosNegativos) {
      const cuentasNegativas = await db.allAsync(`
        SELECT id, nombre_banco, numero_cuenta, saldo_actual
        FROM cuentas_bancarias 
        WHERE empresa_id = ? AND saldo_actual < 0
      `, [empresaId]);

      if (cuentasNegativas.length > 0) {
        alerts.push({
          tipo: 'saldo_negativo',
          severidad: 'high',
          mensaje: `${cuentasNegativas.length} cuentas con saldo negativo`,
          datos: cuentasNegativas
        });
      }
    }

    // 3. Duplicados recientes
    if (checkDuplicados) {
      const duplicados = await db.allAsync(`
        SELECT fecha, monto, descripcion, COUNT(*) as cantidad
        FROM transacciones 
        WHERE empresa_id = ? 
          AND fecha >= datetime('now', '-${horasAtras} hours')
        GROUP BY fecha, monto, descripcion
        HAVING cantidad > 1
      `, [empresaId]);

      if (duplicados.length > 0) {
        alerts.push({
          tipo: 'duplicado',
          severidad: 'high',
          mensaje: `${duplicados.length} posibles duplicados`,
          datos: duplicados
        });
      }
    }

    // Log de actividad
    await this.logAgentActivity(db, empresaId, 'detectar_anomalias', {
      horas_atras: horasAtras,
      alertas_encontradas: alerts.length
    });

    if (alerts.length === 0) {
      return this.formatResponse(
        '✅ No se detectaron anomalías en las últimas horas',
        'success'
      );
    }

    return this.formatAuditResponse(alerts);
  }

  async alertasPreCierre(db, empresaId, params) {
    const alerts = [];

    // 1. Asientos desbalanceados del día anterior
    const asientosDesbalanceados = await db.allAsync(`
      SELECT id, fecha, concepto, 
             (SELECT SUM(debe) FROM asientos_detalle WHERE asiento_id = a.id) as total_debe,
             (SELECT SUM(haber) FROM asientos_detalle WHERE asiento_id = a.id) as total_haber
      FROM asientos a
      WHERE empresa_id = ? 
        AND fecha = date('now', '-1 day')
      HAVING ABS(total_debe - total_haber) > 0.01
    `, [empresaId]);

    if (asientosDesbalanceados.length > 0) {
      alerts.push({
        tipo: 'asiento_desbalanceado',
        severidad: 'high',
        mensaje: `${asientosDesbalanceados.length} asientos desbalanceados`,
        datos: asientosDesbalanceados
      });
    }

    // 2. Documentos faltantes
    const transaccionesSinDoc = await db.allAsync(`
      SELECT id, fecha, descripcion, monto
      FROM transacciones 
      WHERE empresa_id = ? 
        AND fecha >= date('now', '-7 days')
        AND (documento_url IS NULL OR documento_url = '')
        AND monto > 5000
      LIMIT 10
    `, [empresaId]);

    if (transaccionesSinDoc.length > 0) {
      alerts.push({
        tipo: 'documento_faltante',
        severidad: 'medium',
        mensaje: `${transaccionesSinDoc.length} transacciones sin documento`,
        datos: transaccionesSinDoc
      });
    }

    // Log de actividad
    await this.logAgentActivity(db, empresaId, 'alertas_pre_cierre', {
      alertas_encontradas: alerts.length
    });

    return this.formatAuditResponse(alerts);
  }

  async auditoriaCxpCxc(db, empresaId, params) {
    const { incluirAuxiliares, toleranciaDiferencia = 0.01 } = params;
    const alerts = [];

    if (incluirAuxiliares) {
      // Validar CxC
      const cxcDiferencias = await db.allAsync(`
        SELECT 
          'CxC' as tipo,
          cliente as entidad,
          SUM(monto) as saldo_auxiliar
        FROM cuentas_cobrar 
        WHERE empresa_id = ? AND estado = 'pendiente'
        GROUP BY cliente
        HAVING saldo_auxiliar > ?
      `, [empresaId, toleranciaDiferencia]);

      // Validar CxP
      const cxpDiferencias = await db.allAsync(`
        SELECT 
          'CxP' as tipo,
          proveedor as entidad,
          SUM(monto) as saldo_auxiliar
        FROM cuentas_pagar 
        WHERE empresa_id = ? AND estado = 'pendiente'
        GROUP BY proveedor
        HAVING saldo_auxiliar > ?
      `, [empresaId, toleranciaDiferencia]);

      const totalDiferencias = [...cxcDiferencias, ...cxpDiferencias];

      if (totalDiferencias.length > 0) {
        alerts.push({
          tipo: 'auxiliar_diferencia',
          severidad: 'medium',
          mensaje: `${totalDiferencias.length} diferencias en auxiliares`,
          datos: totalDiferencias
        });
      }
    }

    // Log de actividad
    await this.logAgentActivity(db, empresaId, 'auditoria_cxp_cxc', {
      diferencias_encontradas: alerts.length
    });

    return this.formatAuditResponse(alerts);
  }

  async validacionAperturaMes(db, empresaId, params) {
    const { mes, anio, ejecutarValidaciones, generarAlertas } = params;
    const alerts = [];

    // Verificar si ya existe cierre para el mes
    const cierreExistente = await db.getAsync(`
      SELECT id FROM cierres_mensuales
      WHERE empresa_id = ? AND anio = ? AND mes = ?
    `, [empresaId, anio, mes]);

    if (!cierreExistente) {
      // Crear registro de cierre
      await db.runAsync(`
        INSERT INTO cierres_mensuales (empresa_id, anio, mes, estado, created_at)
        VALUES (?, ?, ?, 'en_proceso', datetime('now'))
      `, [empresaId, anio, mes]);
    }

    if (ejecutarValidaciones && generarAlertas) {
      // Validaciones preliminares
      const mesActual = new Date().getMonth() + 1;
      const anioActual = new Date().getFullYear();

      if (mes !== mesActual || anio !== anioActual) {
        alerts.push({
          tipo: 'mes_no_actual',
          severidad: 'low',
          mensaje: `Validando mes ${mes}/${anio}`,
          datos: { mes, anio }
        });
      }
    }

    // Log de actividad
    await this.logAgentActivity(db, empresaId, 'validacion_apertura_mes', {
      mes,
      anio,
      cierre_creado: !cierreExistente
    });

    return this.formatResponse(
      `✅ Validación de apertura completada para ${mes}/${anio}`,
      'success',
      { mes, anio, alerts }
    );
  }

  async presionCierreTardio(db, empresaId, params) {
    const { mes, anio } = params;

    const cierre = await db.getAsync(`
      SELECT estado, fecha_inicio_cierre 
      FROM cierres_mensuales
      WHERE empresa_id = ? AND anio = ? AND mes = ?
    `, [empresaId, anio, mes]);

    if (!cierre || cierre.estado === 'cerrado') {
      return this.formatResponse(
        '✅ El mes ya está cerrado o no requiere acción',
        'success'
      );
    }

    // Log de actividad
    await this.logAgentActivity(db, empresaId, 'presion_cierre_tardio', {
      mes,
      anio,
      estado: cierre.estado
    });

    return this.formatResponse(
      `🚨 ALERTA: El cierre de ${mes}/${anio} sigue pendiente (${cierre.estado})`,
      'alert',
      { mes, anio, estado: cierre.estado },
      ['Completar cierre lo antes posible', 'Revisar checklist de cierre']
    );
  }

  async logAgentActivity(db, empresaId, categoria, detalles) {
    try {
      // Mapeo de categorías a descripciones de negocio
      const descripcionesNegocio = {
        detectar_anomalias: detalles?.alertas_encontradas 
          ? `🚨 Se detectaron ${detalles.alertas_encontradas} anomalías en transacciones recientes que requieren revisión.`
          : `✅ Revisión de integridad contable completada: sin anomalías detectadas.`,
        alertas_pre_cierre: detalles?.alertas_encontradas
          ? `📋 Pre-cierre revisado: ${detalles.alertas_encontradas} observaciones pendientes antes del cierre.`
          : `✅ Pre-cierre verificado: listo para proceder con el cierre mensual.`,
        auditoria_cxp_cxc: detalles?.diferencias_encontradas
          ? `⚠️ Auditoría de cuentas por cobrar/pagar: ${detalles.diferencias_encontradas} diferencias detectadas entre auxiliares y mayor.`
          : `✅ Auxiliares de CxC y CxP concilian correctamente con el mayor.`,
        validacion_apertura_mes: `📅 Validación de apertura para ${detalles?.mes}/${detalles?.anio} completada.`,
        presion_cierre_tardio: `🚨 ALERTA: El cierre de ${detalles?.mes}/${detalles?.anio} está pendiente (${detalles?.estado}) y requiere atención inmediata.`
      };

      await db.runAsync(`
        INSERT INTO agentes_logs (
          empresa_id, agente_nombre, agente_tipo, categoria,
          descripcion, detalles_json, resultado_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        empresaId,
        'AuditorAutomatico',
        'internal_auditor',
        categoria,
        descripcionesNegocio[categoria] || `Análisis de auditoría completado: ${categoria}`,
        JSON.stringify(detalles),
        detalles?.alertas_encontradas || detalles?.diferencias_encontradas ? 'advertencia' : 'exitoso'
      ]);
    } catch (error) {
      // Silencio: errores de logging no deben interrumpir el flujo
    }
  }

  async auditTransactions(db, empresaId) {
    // Buscar patrones sospechosos
    const alerts = [];

    // 1. Transacciones de monto muy alto (outliers)
    const stats = await db.getAsync(`
      SELECT 
        AVG(monto) as avg_monto,
        MAX(monto) as max_monto
      FROM transacciones 
      WHERE empresa_id = ? AND tipo = 'egreso'
    `, [empresaId]);

    const umbralAlto = (stats?.avg_monto || 0) * 3;
    
    const transaccionesAltas = await db.allAsync(`
      SELECT id, fecha, descripcion, monto, cuenta_id
      FROM transacciones 
      WHERE empresa_id = ? 
        AND tipo = 'egreso'
        AND monto > ?
      ORDER BY monto DESC
      LIMIT 5
    `, [empresaId, umbralAlto]);

    if (transaccionesAltas.length > 0) {
      alerts.push({
        tipo: 'monto_alto',
        severidad: 'medium',
        mensaje: `${transaccionesAltas.length} transacciones con monto significativamente alto`,
        datos: transaccionesAltas
      });
    }

    // 2. Transacciones en fines de semana (posibles automatizaciones incorrectas)
    const weekendTrans = await db.allAsync(`
      SELECT id, fecha, descripcion, monto
      FROM transacciones 
      WHERE empresa_id = ? 
        AND CAST(strftime('%w', fecha) AS INTEGER) IN (0, 6)
      ORDER BY fecha DESC
      LIMIT 5
    `, [empresaId]);

    if (weekendTrans.length > 0) {
      alerts.push({
        tipo: 'fin_semana',
        severidad: 'low',
        mensaje: `${weekendTrans.length} transacciones registradas en fin de semana`,
        datos: weekendTrans
      });
    }

    // 3. Cuentas con saldo negativo
    const cuentasNegativas = await db.allAsync(`
      SELECT id, nombre_banco, numero_cuenta, saldo_actual
      FROM cuentas_bancarias 
      WHERE empresa_id = ? AND saldo_actual < 0
    `, [empresaId]);

    if (cuentasNegativas.length > 0) {
      alerts.push({
        tipo: 'saldo_negativo',
        severidad: 'high',
        mensaje: `${cuentasNegativas.length} cuentas con saldo negativo`,
        datos: cuentasNegativas
      });
    }

    return this.formatAuditResponse(alerts);
  }

  async detectAnomalies(db, empresaId) {
    const alerts = [];

    // 1. Detección de dobles pagos (mismo monto, mismo día, descripción similar)
    const duplicados = await db.allAsync(`
      SELECT t1.id as id1, t2.id as id2, t1.fecha, t1.monto, t1.descripcion
      FROM transacciones t1
      JOIN transacciones t2 ON 
        t1.empresa_id = t2.empresa_id
        AND t1.fecha = t2.fecha
        AND t1.monto = t2.monto
        AND t1.id < t2.id
        AND t1.empresa_id = ?
      WHERE t1.monto > 1000
      LIMIT 5
    `, [empresaId]);

    if (duplicados.length > 0) {
      alerts.push({
        tipo: 'posible_duplicado',
        severidad: 'high',
        mensaje: `${duplicados.length} posibles transacciones duplicadas`,
        datos: duplicados
      });
    }

    // 2. Proveedores nuevos con pagos grandes
    const proveedoresNuevos = await db.allAsync(`
      SELECT t.id, t.fecha, t.monto, t.descripcion
      FROM transacciones t
      WHERE t.empresa_id = ?
        AND t.tipo = 'egreso'
        AND t.monto > 50000
        AND t.fecha >= date('now', '-30 days')
      ORDER BY t.monto DESC
      LIMIT 3
    `, [empresaId]);

    if (proveedoresNuevos.length > 0) {
      alerts.push({
        tipo: 'proveedor_nuevo_alto',
        severidad: 'medium',
        mensaje: `${proveedoresNuevos.length} pagos grandes a proveedores recientes`,
        datos: proveedoresNuevos
      });
    }

    return this.formatAuditResponse(alerts);
  }

  async findDuplicates(db, empresaId) {
    const duplicados = await db.allAsync(`
      SELECT 
        fecha,
        monto,
        descripcion,
        COUNT(*) as cantidad,
        GROUP_CONCAT(id) as ids
      FROM transacciones 
      WHERE empresa_id = ?
      GROUP BY fecha, monto, descripcion
      HAVING cantidad > 1
      ORDER BY monto DESC
    `, [empresaId]);

    if (duplicados.length === 0) {
      return this.formatResponse(
        '✅ No se encontraron transacciones duplicadas.',
        'success'
      );
    }

    let response = `🔄 **Transacciones Duplicadas Detectadas**\n\n`;
    
    for (const dup of duplicados) {
      response += `⚠️ **GTQ ${dup.monto.toLocaleString()}** - ${dup.descripcion}\n`;
      response += `   Fecha: ${dup.fecha} | Repeticiones: ${dup.cantidad}\n`;
      response += `   IDs: ${dup.ids}\n\n`;
    }

    return this.formatResponse(
      response,
      'alert',
      { duplicados },
      ['Revisar y eliminar duplicados', 'Verificar si son pagos fraccionados legítimos']
    );
  }

  async fullAudit(db, empresaId) {
    const transAudit = await this.auditTransactions(db, empresaId);
    const anomalyAudit = await this.detectAnomalies(db, empresaId);
    
    // Combinar alertas
    const allAlerts = [
      ...(transAudit.data?.alerts || []),
      ...(anomalyAudit.data?.alerts || [])
    ];

    const highAlerts = allAlerts.filter(a => a.severidad === 'high');
    const mediumAlerts = allAlerts.filter(a => a.severidad === 'medium');
    const lowAlerts = allAlerts.filter(a => a.severidad === 'low');

    let summary = `🔍 **Auditoría Completa**\n\n`;
    summary += `🚨 Críticas: ${highAlerts.length}\n`;
    summary += `⚠️  Medias: ${mediumAlerts.length}\n`;
    summary += `ℹ️  Bajas: ${lowAlerts.length}\n\n`;

    if (allAlerts.length === 0) {
      summary += `✅ **¡Excelente!** No se detectaron anomalías.`;
    } else {
      summary += transAudit.content + '\n\n' + anomalyAudit.content;
    }

    return this.formatResponse(
      summary,
      allAlerts.length > 0 ? 'alert' : 'success',
      { alerts: allAlerts },
      allAlerts.length > 0 ? ['Revisar alertas críticas primero'] : []
    );
  }

  formatAuditResponse(alerts) {
    if (alerts.length === 0) {
      return this.formatResponse(
        '✅ Auditoría completada. No se detectaron anomalías.',
        'success',
        { alerts: [] }
      );
    }

    let response = `🔍 **Resultados de Auditoría**\n\n`;
    
    // Ordenar por severidad
    const severidadOrden = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => severidadOrden[a.severidad] - severidadOrden[b.severidad]);

    for (const alert of alerts) {
      const emoji = alert.severidad === 'high' ? '🚨' : alert.severidad === 'medium' ? '⚠️' : 'ℹ️';
      response += `${emoji} **${alert.mensaje}**\n`;
    }

    const recommendations = alerts
      .filter(a => a.severidad === 'high')
      .map(a => `Revisar: ${a.tipo}`);

    return this.formatResponse(response, 'alert', { alerts }, recommendations);
  }
}

module.exports = AuditorAutomatico;
