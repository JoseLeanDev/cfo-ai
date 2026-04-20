/**
 * Agente de IA: Analista Financiero
 * Genera insights, briefings y análisis predictivo usando LLM
 */

const cron = require('node-cron');
const aiService = require('../src/services/aiService');
const { logAgentActivity } = require('../src/services/agentLogger');
const db = require('../database/connection');

class AnalistaFinancieroIA {
  constructor() {
    this.nombre = 'Analista Financiero IA';
    this.tipo = 'analista_ia';
    this.version = '2.0.0';
    this.descripcion = 'Agente de IA que genera insights financieros y briefings ejecutivos';
    this.tareasActivas = [];
    this.insightsCache = null;
  }

  /**
   * Tarea 1: Briefing Matutino con IA
   * Frecuencia: Diario 07:00
   */
  async generarBriefingMatutino() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 🌅 Generando briefing matutino con IA...`);

    try {
      // Recopilar métricas clave
      const metricas = await this.obtenerMetricasActuales();
      const tendencias = await this.obtenerTendencias(30);
      const alertasPendientes = await db.allAsync(`
        SELECT * FROM alertas_financieras 
        WHERE estado = 'activa' 
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      // Generar insights con IA
      const resultado = await aiService.generarInsightsIA(metricas, tendencias);
      
      if (!resultado.exito) {
        throw new Error(resultado.error);
      }

      const analisis = resultado.analisis;

      // Guardar briefing en tabla
      await db.runAsync(`
        INSERT INTO briefings_diarios 
        (fecha, resumen_ejecutivo, insights_json, alertas_count, estado, created_at)
        VALUES (date('now'), ?, ?, ?, 'generado', datetime('now'))
      `, [
        analisis.brief_ejecutivo,
        JSON.stringify(analisis.insights),
        alertasPendientes.length
      ]);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'reporte_ejecutivo',
        descripcion: `🌅 Briefing matutino generado: ${analisis.insights?.length || 0} insights clave identificados. ${alertasPendientes.length > 0 ? `${alertasPendientes.length} alertas requieren atención hoy.` : 'No hay alertas urgentes para hoy.'} ${analisis.recomendaciones_prioritarias?.length > 0 ? `Recomendaciones: ${analisis.recomendaciones_prioritarias.join(', ')}.` : ''}`,
        detalles_json: JSON.stringify({
          insights_count: analisis.insights?.length,
          alertas_activas: alertasPendientes.length,
          riesgo_nivel: analisis.riesgo_general,
          resumen: analisis.brief_ejecutivo?.substring(0, 200)
        }),
        resultado_status: 'exitoso',
        duracion_ms: resultado.duracion_ms
      });

      console.log(`[${this.nombre}] ✅ Briefing generado: ${analisis.insights?.length || 0} insights`);
      return analisis;

    } catch (error) {
      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'error_sistema',
        descripcion: `Error generando briefing: ${error.message}`,
        resultado_status: 'error',
        duracion_ms: Date.now() - startTime
      });
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 2: Snapshot Diario
   * Frecuencia: Diario 18:00
   */
  async generarSnapshotDiario() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 📸 Generando snapshot diario...`);

    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      const snapshot = await db.getAsync(`
        SELECT 
          COUNT(DISTINCT t.id) as transacciones_hoy,
          SUM(CASE WHEN t.tipo = 'debe' THEN t.monto ELSE 0 END) as total_debe,
          SUM(CASE WHEN t.tipo = 'haber' THEN t.monto ELSE 0 END) as total_haber,
          (SELECT COUNT(*) FROM alertas_financieras WHERE estado = 'activa') as alertas_activas,
          (SELECT COUNT(*) FROM conciliaciones WHERE estado = 'pendiente') as conciliaciones_pendientes
        FROM transacciones t
        WHERE DATE(t.fecha) = ?
      `, [hoy]);

      // Análisis IA del snapshot
      const analisis = await aiService.analizarDatos(
        { fecha: hoy, ...snapshot },
        `Analiza este snapshot del día ${hoy} como CFO. Evalúa:
1. Volumen de actividad vs días anteriores
2. Balance entre debe y haber
3. Alertas pendientes
4. Estado operativo general
Genera un "estado del sistema" ejecutivo.`,
        'analisis'
      );

      await db.runAsync(`
        INSERT INTO snapshots_diarios 
        (fecha, datos_json, analisis_ia, estado, created_at)
        VALUES (?, ?, ?, 'completado', datetime('now'))
      `, [
        hoy,
        JSON.stringify(snapshot),
        JSON.stringify(analisis.analisis)
      ]);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'analisis_liquidez',
        descripcion: `📈 Resumen diario: procesamos ${snapshot.transacciones_hoy} transacciones con movimiento total de Q${((snapshot.total_debe || 0) + (snapshot.total_haber || 0)).toLocaleString()}. ${snapshot.alertas_activas > 0 ? `Hay ${snapshot.alertas_activas} alertas financieras que requieren revisión.` : 'Sin alertas críticas.'} ${snapshot.conciliaciones_pendientes > 0 ? `Pendientes: ${snapshot.conciliaciones_pendientes} conciliaciones bancarias.` : 'Tesorería conciliada al día.'}`,
        detalles_json: JSON.stringify({
          transacciones: snapshot.transacciones_hoy,
          total_debe: snapshot.total_debe,
          total_haber: snapshot.total_haber,
          alertas_activas: snapshot.alertas_activas,
          conciliaciones_pendientes: snapshot.conciliaciones_pendientes
        }),
        resultado_status: 'exitoso',
        duracion_ms: analisis.duracion_ms
      });

      console.log(`[${this.nombre}] ✅ Snapshot diario completado`);
      return { snapshot, analisis: analisis.analisis };

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 3: Reporte Semanal
   * Frecuencia: Viernes 17:00
   */
  async generarReporteSemanal() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 📊 Generando reporte semanal con IA...`);

    try {
      const datosSemana = await db.allAsync(`
        SELECT 
          DATE(fecha) as dia,
          COUNT(*) as transacciones,
          SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END) as total_debe,
          SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as total_haber
        FROM transacciones
        WHERE fecha >= date('now', '-7 days')
        GROUP BY DATE(fecha)
        ORDER BY dia DESC
      `);

      const topCuentas = await db.allAsync(`
        SELECT c.nombre, c.codigo, SUM(ABS(t.monto)) as volumen
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE t.fecha >= date('now', '-7 days')
        GROUP BY t.cuenta_id
        ORDER BY volumen DESC
        LIMIT 10
      `);

      const analisis = await aiService.analizarDatos(
        { semana: datosSemana, top_cuentas: topCuentas },
        `Genera un reporte semanal ejecutivo como CFO. Incluye:
1. Resumen de actividad semanal
2. Tendencias vs semana anterior
3. Cuentas más activas
4. Observaciones y recomendaciones
5. Acciones para la próxima semana`,
        'analisis'
      );

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'reporte_ejecutivo',
        descripcion: `📈 Reporte semanal ejecutivo generado: análisis de ${datosSemana.length} días de operación. Volumen en cuentas principales evaluado.`,
        detalles_json: JSON.stringify({
          dias_analizados: datosSemana.length,
          top_cuentas: topCuentas.slice(0, 3).map(c => c.nombre)
        }),
        resultado_status: 'exitoso',
        duracion_ms: analisis.duracion_ms
      });

      console.log(`[${this.nombre}] ✅ Reporte semanal generado`);
      return analisis.analisis;

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 4: Proyección Financiera Mensual
   * Frecuencia: Día 1 de cada mes
   */
  async generarProyeccionMensual() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 🔮 Generando proyección mensual con IA...`);

    try {
      const historico = await db.allAsync(`
        SELECT 
          strftime('%Y-%m', fecha) as mes,
          SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END) as total_debe,
          SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as total_haber,
          COUNT(*) as transacciones
        FROM transacciones
        WHERE fecha >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY mes DESC
      `);

      const proyeccion = await aiService.analizarDatos(
        { historico_mensual: historico },
        `Como CFO, analiza los últimos 6 meses y genera:
1. Proyección del próximo mes
2. Identificación de tendencias
3. Riesgos anticipados
4. Recomendaciones estratégicas`,
        'analisis'
      );

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'analisis_liquidez',
        descripcion: `🔮 Proyección financiera mensual generada a partir de ${historico.length} meses de histórico. Tendencias de liquidez y riesgos identificados.`,
        detalles_json: JSON.stringify({ meses_historico: historico.length }),
        resultado_status: 'exitoso',
        duracion_ms: proyeccion.duracion_ms
      });

      console.log(`[${this.nombre}] ✅ Proyección mensual generada`);
      return proyeccion.analisis;

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  // ============ HELPERS ============

  async obtenerMetricasActuales() {
    return await db.getAsync(`
      SELECT 
        (SELECT SUM(saldo_actual) FROM saldos_cuentas WHERE periodo = strftime('%Y-%m', 'now') AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE tipo = 'activo')) as activos_totales,
        (SELECT SUM(saldo_actual) FROM saldos_cuentas WHERE periodo = strftime('%Y-%m', 'now') AND cuenta_id IN (SELECT id FROM cuentas_contables WHERE tipo = 'pasivo')) as pasivos_totales,
        (SELECT COUNT(*) FROM transacciones WHERE fecha >= date('now', '-30 days')) as transacciones_mes,
        (SELECT COUNT(*) FROM alertas_financieras WHERE estado = 'activa') as alertas_activas
    `);
  }

  async obtenerTendencias(dias) {
    return await db.allAsync(`
      SELECT 
        DATE(fecha) as dia,
        SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END) as ingresos,
        SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as egresos,
        COUNT(*) as volumen
      FROM transacciones
      WHERE fecha >= date('now', '-${dias} days')
      GROUP BY DATE(fecha)
      ORDER BY dia DESC
    `);
  }

  /**
   * Iniciar scheduler
   */
  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Iniciando scheduler...`);

    // Log de inicio del sistema
    logAgentActivity({
      agente_nombre: this.nombre,
      agente_tipo: this.tipo,
      agente_version: this.version,
      categoria: 'sincronizacion_datos',
      descripcion: `👋 Analista Financiero listo. Generaré briefings ejecutivos a las 7:00 AM, snapshots diarios a las 6:00 PM, reportes semanales los viernes a las 5:00 PM y proyecciones mensuales el día 1 de cada mes.`,
      resultado_status: 'exitoso',
      duracion_ms: 0
    });

    // Diario 07:00: Briefing matutino
    this.tareasActivas.push(cron.schedule('0 7 * * *', async () => {
      await this.generarBriefingMatutino();
    }));

    // Diario 18:00: Snapshot
    this.tareasActivas.push(cron.schedule('0 18 * * *', async () => {
      await this.generarSnapshotDiario();
    }));

    // Viernes 17:00: Reporte semanal
    this.tareasActivas.push(cron.schedule('0 17 * * 5', async () => {
      await this.generarReporteSemanal();
    }));

    // Día 1 de cada mes: Proyección
    this.tareasActivas.push(cron.schedule('0 9 1 * *', async () => {
      await this.generarProyeccionMensual();
    }));

    console.log(`[${this.nombre}] ✅ Scheduler iniciado`);
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = AnalistaFinancieroIA;
