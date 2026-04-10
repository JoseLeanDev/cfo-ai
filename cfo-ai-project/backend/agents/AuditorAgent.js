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

class AuditorAgent {
  constructor(db) {
    this.db = db;
    this.name = 'Auditor Automático';
    this.type = 'auditor';
    this.version = '1.0.0';
  }

  // Cada 45 min: Detectar anomalías en tiempo real
  async detectarAnomaliasTiempoReal() {
    const startTime = Date.now();
    try {
      console.log('[Auditor] Revisando anomalías en tiempo real...');
      
      // 1. Saldos negativos en cuentas de activo
      const saldosNegativos = await this.db.all(`
        SELECT c.codigo, c.nombre, s.saldo_actual
        FROM cuentas_contables c
        JOIN saldos_cuentas s ON c.id = s.cuenta_id
        WHERE c.tipo = 'activo' AND s.saldo_actual < 0 AND s.periodo = strftime('%Y-%m', 'now')
      `);

      // 2. Transacciones con montos atípicos (>3 desviaciones estándar)
      const montosAtipicos = await this.db.all(`
        SELECT t.*, c.nombre as cuenta_nombre
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE t.fecha >= date('now', '-1 day')
        AND ABS(t.monto) > (
          SELECT AVG(ABS(monto)) + 3 * (
            SELECT SQRT(AVG((monto - (SELECT AVG(monto) FROM transacciones)) * (monto - (SELECT AVG(monto) FROM transacciones)))
            FROM transacciones
          ) FROM transacciones WHERE fecha >= date('now', '-30 days')
        )
      `);

      // 3. Duplicados potenciales
      const duplicados = await this.db.all(`
        SELECT t1.id as id1, t2.id as id2, t1.monto, t1.fecha, t1.descripcion
        FROM transacciones t1
        JOIN transacciones t2 ON t1.cuenta_id = t2.cuenta_id
          AND t1.monto = t2.monto
          AND DATE(t1.fecha) = DATE(t2.fecha)
          AND t1.id < t2.id
        WHERE t1.fecha >= date('now', '-1 day')
      `);

      const issues = [];
      if (saldosNegativos.length) issues.push(`${saldosNegativos.length} cuentas de activo con saldo negativo`);
      if (montosAtipicos.length) issues.push(`${montosAtipicos.length} transacciones con montos atípicos`);
      if (duplicados.length) issues.push(`${duplicados.length} posibles duplicados`);

      const duracion = Date.now() - startTime;
      
      if (issues.length > 0) {
        await logAgentActivity({
          agente_nombre: this.name,
          agente_tipo: this.type,
          agente_version: this.version,
          categoria: 'alerta_detectada',
          descripcion: `Anomalías detectadas: ${issues.join(', ')}`,
          detalles_json: JSON.stringify({ saldosNegativos, montosAtipicos: montosAtipicos.slice(0, 5), duplicados: duplicados.slice(0, 5) }),
          resultado_status: 'advertencia',
          duracion_ms: duracion
        });
        console.log(`[Auditor] ⚠️ Alertas: ${issues.join(', ')}`);
      } else {
        await logAgentActivity({
          agente_nombre: this.name,
          agente_tipo: this.type,
          agente_version: this.version,
          categoria: 'analisis_ejecutado',
          descripcion: 'Revisión de anomalías completada - Sin hallazgos',
          resultado_status: 'exitoso',
          duracion_ms: duracion
        });
        console.log('[Auditor] ✅ Sin anomalías detectadas');
      }

      return { saldosNegativos, montosAtipicos, duplicados };
    } catch (error) {
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'alerta_detectada',
        descripcion: `Error en detección de anomalías: ${error.message}`,
        resultado_status: 'error',
        duracion_ms: Date.now() - startTime
      });
      throw error;
    }
  }

  // Diario 06:00: Alertas pre-cierre
  async alertasPreCierre() {
    const startTime = Date.now();
    try {
      console.log('[Auditor] Ejecutando alertas pre-cierre...');
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split('T')[0];

      // 1. Desbalances en asientos del día anterior
      const desbalances = await this.db.all(`
        SELECT t.numero_asiento, SUM(CASE WHEN t.tipo = 'debe' THEN t.monto ELSE 0 END) as total_debe,
               SUM(CASE WHEN t.tipo = 'haber' THEN t.monto ELSE 0 END) as total_haber
        FROM transacciones t
        WHERE DATE(t.fecha) = ?
        GROUP BY t.numero_asiento
        HAVING ABS(total_debe - total_haber) > 0.01
      `, [fechaAyer]);

      // 2. Cuentas sospechosas (muchas transacciones pequeñas = posible fraccionamiento)
      const cuentasSospechosas = await this.db.all(`
        SELECT cuenta_id, COUNT(*) as num_trans, AVG(monto) as avg_monto
        FROM transacciones
        WHERE DATE(fecha) = ?
        GROUP BY cuenta_id
        HAVING num_trans > 10 AND avg_monto < 1000
      `, [fechaAyer]);

      // 3. Documentos faltantes
      const documentosFaltantes = await this.db.all(`
        SELECT t.id, t.descripcion, t.monto
        FROM transacciones t
        LEFT JOIN documentos_soporte d ON t.id = d.transaccion_id
        WHERE DATE(t.fecha) = ? AND d.id IS NULL AND ABS(t.monto) > 1000
      `, [fechaAyer]);

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'analisis_ejecutado',
        descripcion: `Alertas pre-cierre: ${desbalances.length} desbalances, ${cuentasSospechosas.length} cuentas sospechosas, ${documentosFaltantes.length} docs faltantes`,
        detalles_json: JSON.stringify({ desbalances, cuentasSospechosas, documentosFaltantes }),
        resultado_status: (desbalances.length + cuentasSospechosas.length + documentosFaltantes.length) > 0 ? 'advertencia' : 'exitoso',
        duracion_ms: duracion
      });

      console.log(`[Auditor] Pre-cierre completado`);
      return { desbalances, cuentasSospechosas, documentosFaltantes };
    } catch (error) {
      console.error('[Auditor] Error en alertas pre-cierre:', error);
      throw error;
    }
  }

  // Semanal (Lun 08:00): Auditoría CxP y CxC
  async auditoriaCxPCxC() {
    const startTime = Date.now();
    try {
      console.log('[Auditor] Auditando CxP y CxC...');

      // Clientes/proveedores con saldos inconsistentes vs auxiliares
      const inconsistencias = await this.db.all(`
        SELECT 
          t.tercero_id,
          ter.nombre,
          SUM(CASE WHEN t.tipo = 'debe' THEN t.monto ELSE -t.monto END) as saldo_contable,
          COALESCE(a.saldo_pendiente, 0) as saldo_auxiliar,
          ABS(SUM(CASE WHEN t.tipo = 'debe' THEN t.monto ELSE -t.monto END) - COALESCE(a.saldo_pendiente, 0)) as diferencia
        FROM transacciones t
        JOIN terceros ter ON t.tercero_id = ter.id
        LEFT JOIN auxiliares a ON t.tercero_id = a.tercero_id
        WHERE t.cuenta_id IN (SELECT id FROM cuentas_contables WHERE codigo LIKE '1105%' OR codigo LIKE '2205%')
        AND t.fecha >= date('now', '-90 days')
        GROUP BY t.tercero_id
        HAVING diferencia > 1
      `);

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'analisis_ejecutado',
        descripcion: `Auditoría CxP/CxC: ${inconsistencias.length} inconsistencias encontradas`,
        detalles_json: JSON.stringify({ inconsistencias }),
        resultado_status: inconsistencias.length > 0 ? 'advertencia' : 'exitoso',
        duracion_ms: duracion
      });

      console.log(`[Auditor] ${inconsistencias.length} inconsistencias detectadas`);
      return { inconsistencias };
    } catch (error) {
      console.error('[Auditor] Error en auditoría CxP/CxC:', error);
      throw error;
    }
  }

  // Mensual (Día 1, 00:01): Validación apertura mes
  async validacionAperturaMes() {
    const startTime = Date.now();
    try {
      console.log('[Auditor] Validando apertura de mes...');
      const hoy = new Date();
      const mesActual = hoy.toISOString().slice(0, 7); // YYYY-MM

      // Crear registro de cierre mensual
      await this.db.run(`
        INSERT OR IGNORE INTO cierres_mensuales (mes, estado, created_at)
        VALUES (?, 'abierto', datetime('now'))
      `, [mesActual]);

      // Validaciones preliminares
      const validaciones = {
        mesAnteriorCerrado: await this.verificarMesAnteriorCerrado(),
        saldosIniciales: await this.verificarSaldosIniciales(mesActual),
        documentosPendientes: await this.contarDocumentosPendientes()
      };

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'sincronizacion_datos',
        descripcion: `Apertura mes ${mesActual}: Validaciones completadas`,
        detalles_json: JSON.stringify(validaciones),
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log('[Auditor] Apertura de mes validada');
      return validaciones;
    } catch (error) {
      console.error('[Auditor] Error en validación apertura:', error);
      throw error;
    }
  }

  // Mensual (Día 5, 18:00): Presión cierre tardío
  async presionCierreTardio() {
    const startTime = Date.now();
    try {
      console.log('[Auditor] Verificando cierre tardío...');
      
      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const mesAnteriorStr = mesAnterior.toISOString().slice(0, 7);

      const cierre = await this.db.get(`
        SELECT * FROM cierres_mensuales WHERE mes = ? AND estado != 'cerrado'
      `, [mesAnteriorStr]);

      if (cierre) {
        await logAgentActivity({
          agente_nombre: this.name,
          agente_tipo: this.type,
          agente_version: this.version,
          categoria: 'alerta_detectada',
          descripcion: `⚠️ ALERTA CFO: Mes ${mesAnteriorStr} sigue ABIERTO después del día 5`,
          detalles_json: JSON.stringify({ mes: mesAnteriorStr, dias_retraso: 5 }),
          resultado_status: 'advertencia',
          duracion_ms: Date.now() - startTime
        });
        console.log(`[Auditor] ⚠️ ALERTA: Mes ${mesAnteriorStr} sigue abierto!`);
      } else {
        console.log('[Auditor] ✅ Mes anterior cerrado correctamente');
      }

      return { cerrado: !cierre, mes: mesAnteriorStr };
    } catch (error) {
      console.error('[Auditor] Error en presión cierre:', error);
      throw error;
    }
  }

  // Helpers
  async verificarMesAnteriorCerrado() {
    const hoy = new Date();
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const mesStr = mesAnterior.toISOString().slice(0, 7);
    
    const cierre = await this.db.get(`
      SELECT estado FROM cierres_mensuales WHERE mes = ?
    `, [mesStr]);
    
    return cierre?.estado === 'cerrado';
  }

  async verificarSaldosIniciales(mes) {
    const result = await this.db.get(`
      SELECT COUNT(*) as count FROM saldos_cuentas WHERE periodo = ?
    `, [mes]);
    return result?.count > 0;
  }

  async contarDocumentosPendientes() {
    const result = await this.db.get(`
      SELECT COUNT(*) as count FROM documentos_soporte WHERE estado = 'pendiente'
    `);
    return result?.count || 0;
  }

  iniciarScheduler() {
    console.log('[Auditor] Iniciando scheduler...');
    
    // Cada 45 minutos
    cron.schedule('*/45 * * * *', () => {
      this.detectarAnomaliasTiempoReal();
    });

    // Diario 06:00
    cron.schedule('0 6 * * *', () => {
      this.alertasPreCierre();
    });

    // Lunes 08:00
    cron.schedule('0 8 * * 1', () => {
      this.auditoriaCxPCxC();
    });

    // Día 1 de cada mes a las 00:01
    cron.schedule('1 0 1 * *', () => {
      this.validacionAperturaMes();
    });

    // Día 5 de cada mes a las 18:00
    cron.schedule('0 18 5 * *', () => {
      this.presionCierreTardio();
    });

    console.log('[Auditor] Scheduler iniciado con todas las tareas');
  }
}

module.exports = AuditorAgent;
