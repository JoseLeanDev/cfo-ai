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

class ConciliadorAgent {
  constructor(db) {
    this.db = db;
    this.name = 'Conciliador Bancario';
    this.type = 'conciliador';
    this.version = '1.0.0';
  }

  // Diario 08:00: Alerta de conciliación pendiente
  async alertaConciliacionPendiente() {
    const startTime = Date.now();
    try {
      console.log('[Conciliador] Verificando conciliaciones pendientes...');

      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const mesAnteriorStr = mesAnterior.toISOString().slice(0, 7);

      // Cuentas bancarias sin conciliar del mes anterior
      const cuentasPendientes = await this.db.all(`
        SELECT cb.id, cb.nombre_banco, cb.numero_cuenta, cb.moneda,
               COALESCE(c.estado, 'no_iniciada') as estado_conciliacion
        FROM cuentas_bancarias cb
        LEFT JOIN conciliaciones c ON cb.id = c.cuenta_bancaria_id 
          AND c.mes = ?
        WHERE cb.activa = 1
        AND (c.estado IS NULL OR c.estado IN ('no_iniciada', 'en_proceso'))
      `, [mesAnteriorStr]);

      if (cuentasPendientes.length > 0) {
        await logAgentActivity({
          agente_nombre: this.name,
          agente_tipo: this.type,
          agente_version: this.version,
          categoria: 'alerta_detectada',
          descripcion: `⚠️ ${cuentasPendientes.length} cuentas sin conciliar del mes ${mesAnteriorStr}`,
          detalles_json: JSON.stringify({ cuentas: cuentasPendientes, mes: mesAnteriorStr }),
          resultado_status: 'advertencia',
          duracion_ms: Date.now() - startTime
        });
        console.log(`[Conciliador] ⚠️ ${cuentasPendientes.length} cuentas pendientes`);
      } else {
        console.log('[Conciliador] ✅ Todas las cuentas conciliadas');
      }

      return { pendientes: cuentasPendientes };
    } catch (error) {
      console.error('[Conciliador] Error:', error);
      throw error;
    }
  }

  // Mensual (Día 1): Iniciar conciliaciones
  async iniciarConciliaciones() {
    const startTime = Date.now();
    try {
      console.log('[Conciliador] Iniciando conciliaciones del mes...');

      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const mesAnteriorStr = mesAnterior.toISOString().slice(0, 7);

      // Obtener todas las cuentas bancarias activas
      const cuentas = await this.db.all(`
        SELECT id, nombre_banco, numero_cuenta FROM cuentas_bancarias WHERE activa = 1
      `);

      const creadas = [];
      for (const cuenta of cuentas) {
        // Verificar si ya existe
        const existe = await this.db.get(`
          SELECT id FROM conciliaciones 
          WHERE cuenta_bancaria_id = ? AND mes = ?
        `, [cuenta.id, mesAnteriorStr]);

        if (!existe) {
          // Calcular saldo según contabilidad
          const saldoContable = await this.calcularSaldoContable(cuenta.id, mesAnteriorStr);

          await this.db.run(`
            INSERT INTO conciliaciones (cuenta_bancaria_id, mes, saldo_contable, estado, created_at)
            VALUES (?, ?, ?, 'no_iniciada', datetime('now'))
          `, [cuenta.id, mesAnteriorStr, saldoContable]);

          creadas.push({ cuenta: cuenta.nombre_banco, saldo_contable: saldoContable });
        }
      }

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'sincronizacion_datos',
        descripcion: `Conciliaciones iniciadas: ${creadas.length} cuentas para ${mesAnteriorStr}`,
        detalles_json: JSON.stringify({ cuentas_creadas: creadas, mes: mesAnteriorStr }),
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log(`[Conciliador] ${creadas.length} conciliaciones iniciadas`);
      return { creadas };
    } catch (error) {
      console.error('[Conciliador] Error iniciando:', error);
      throw error;
    }
  }

  // Mensual (Día 3): Presión de conciliación
  async presionConciliacion() {
    const startTime = Date.now();
    try {
      console.log('[Conciliador] Verificando retrasos en conciliación...');

      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const mesAnteriorStr = mesAnterior.toISOString().slice(0, 7);

      const pendientes = await this.db.all(`
        SELECT c.*, cb.nombre_banco, cb.numero_cuenta
        FROM conciliaciones c
        JOIN cuentas_bancarias cb ON c.cuenta_bancaria_id = cb.id
        WHERE c.mes = ? AND c.estado != 'conciliado'
      `, [mesAnteriorStr]);

      if (pendientes.length > 0) {
        await logAgentActivity({
          agente_nombre: this.name,
          agente_tipo: this.type,
          agente_version: this.version,
          categoria: 'alerta_detectada',
          descripcion: `🚨 URGENTE: ${pendientes.length} conciliaciones bloquean cierre de ${mesAnteriorStr}`,
          detalles_json: JSON.stringify({ 
            cuentas: pendientes.map(p => p.nombre_banco),
            dias_retraso: 3,
            impacto: 'Bloqueo de cierre mensual'
          }),
          resultado_status: 'error',
          duracion_ms: Date.now() - startTime
        });
        console.log(`[Conciliador] 🚨 ALERTA: ${pendientes.length} conciliaciones urgentes`);
      } else {
        console.log('[Conciliador] ✅ Todas las conciliaciones al día');
      }

      return { pendientes };
    } catch (error) {
      console.error('[Conciliador] Error presión:', error);
      throw error;
    }
  }

  // Helper: Calcular saldo contable
  async calcularSaldoContable(cuentaBancariaId, mes) {
    const result = await this.db.get(`
      SELECT COALESCE(SUM(CASE WHEN tipo = 'debe' THEN monto ELSE -monto END), 0) as saldo
      FROM transacciones t
      JOIN cuentas_contables c ON t.cuenta_id = c.id
      JOIN cuentas_bancarias cb ON c.id = cb.cuenta_contable_id
      WHERE cb.id = ? AND strftime('%Y-%m', t.fecha) <= ?
    `, [cuentaBancariaId, mes]);

    return result?.saldo || 0;
  }

  iniciarScheduler() {
    console.log('[Conciliador] Iniciando scheduler...');

    // Diario 08:00
    cron.schedule('0 8 * * *', () => {
      this.alertaConciliacionPendiente();
    });

    // Día 1 de cada mes a las 06:00
    cron.schedule('0 6 1 * *', () => {
      this.iniciarConciliaciones();
    });

    // Día 3 de cada mes a las 09:00
    cron.schedule('0 9 3 * *', () => {
      this.presionConciliacion();
    });

    console.log('[Conciliador] Scheduler iniciado con todas las tareas');
  }
}

module.exports = ConciliadorAgent;
