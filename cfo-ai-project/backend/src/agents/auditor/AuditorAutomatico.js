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
    const { query, empresaId } = input;
    const { db } = context;
    
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
