/**
 * Agente de IA: Auditor Financiero
 * Usa LLM para detectar anomalías y riesgos financieros
 */

const cron = require('node-cron');
const aiService = require('../src/services/aiService');
const { logAgentActivity } = require('../src/services/agentLogger');
const db = require('../database/connection');

class AuditorAgentIA {
  constructor() {
    this.nombre = 'Auditor IA';
    this.tipo = 'auditor_ia';
    this.version = '2.0.0';
    this.descripcion = 'Agente de IA que audita datos financieros usando análisis inteligente';
    this.tareasActivas = [];
  }

  /**
   * Tarea 1: Detección de anomalías con IA
   * Frecuencia: Cada 45 minutos
   */
  async detectarAnomaliasConIA() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 🔍 Iniciando auditoría con IA...`);

    try {
      // Obtener datos recientes
      const transacciones = await db.all(`
        SELECT t.*, c.nombre as cuenta_nombre, c.codigo as cuenta_codigo
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE t.fecha >= date('now', '-2 days')
        ORDER BY t.fecha DESC
        LIMIT 100
      `);

      const saldos = await db.all(`
        SELECT c.codigo, c.nombre, c.tipo, s.saldo_actual, s.periodo
        FROM cuentas_contables c
        JOIN saldos_cuentas s ON c.id = s.cuenta_id
        WHERE s.periodo = strftime('%Y-%m', 'now')
        AND c.tipo = 'activo'
      `);

      if (transacciones.length === 0) {
        await logAgentActivity({
          agente_nombre: this.nombre,
          agente_tipo: this.tipo,
          agente_version: this.version,
          categoria: 'analisis_ejecutado',
          descripcion: 'No hay transacciones recientes para analizar',
          resultado_status: 'exitoso',
          duracion_ms: Date.now() - startTime
        });
        return { anomalias: [], mensaje: 'Sin datos recientes' };
      }

      // Análisis con IA
      const resultado = await aiService.detectarAnomaliasIA(transacciones, saldos);
      
      if (!resultado.exito) {
        await logAgentActivity({
          agente_nombre: this.nombre,
          agente_tipo: this.tipo,
          agente_version: this.version,
          categoria: 'error_sistema',
          descripcion: `Error en análisis IA: ${resultado.error}`,
          resultado_status: 'error',
          duracion_ms: resultado.duracion_ms
        });
        return resultado;
      }

      const analisis = resultado.analisis;
      const anomaliasCount = analisis.anomalias?.length || 0;
      const severidadAlta = analisis.anomalias?.filter(a => a.severidad === 'alta').length || 0;

      // Guardar anomalías detectadas en tabla
      if (analisis.anomalias?.length > 0) {
        for (const anomalia of analisis.anomalias.slice(0, 10)) {
          await db.run(`
            INSERT INTO alertas_financieras 
            (tipo, nivel, titulo, descripcion, monto_afectado, estado, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, 'activa', ?, datetime('now'))
          `, [
            anomalia.tipo,
            anomalia.severidad,
            `Anomalía detectada: ${anomalia.tipo}`,
            anomalia.descripcion,
            anomalia.monto_impacto || 0,
            JSON.stringify(anomalia)
          ]);
        }
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: anomaliasCount > 0 ? 'alerta_detectada' : 'analisis_ejecutado',
        descripcion: `Auditoría IA completada: ${anomaliasCount} anomalías (${severidadAlta} alta severidad). ${analisis.resumen?.substring(0, 200) || ''}`,
        detalles_json: JSON.stringify({
          anomalias_count: anomaliasCount,
          severidad_alta: severidadAlta,
          riesgo_general: analisis.riesgo_general,
          tokens_usados: resultado.tokens_usados
        }),
        resultado_status: severidadAlta > 0 ? 'advertencia' : 'exitoso',
        duracion_ms: resultado.duracion_ms
      });

      console.log(`[${this.nombre}] ✅ Auditoría completada: ${anomaliasCount} anomalías detectadas`);
      return analisis;

    } catch (error) {
      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'error_sistema',
        descripcion: `Error crítico: ${error.message}`,
        resultado_status: 'error',
        duracion_ms: Date.now() - startTime
      });
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 2: Análisis pre-cierre diario con IA
   * Frecuencia: Diario 06:00
   */
  async analisisPreCierreIA() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 📊 Analizando cierre del día anterior con IA...`);

    try {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fechaAyer = ayer.toISOString().split('T')[0];

      // Obtener datos del día anterior
      const datosDia = await db.all(`
        SELECT 
          COUNT(*) as total_trans,
          SUM(CASE WHEN tipo = 'debe' THEN monto ELSE 0 END) as total_debe,
          SUM(CASE WHEN tipo = 'haber' THEN monto ELSE 0 END) as total_haber,
          COUNT(DISTINCT cuenta_id) as cuentas_usadas
        FROM transacciones
        WHERE DATE(fecha) = ?
      `, [fechaAyer]);

      const transaccionesDia = await db.all(`
        SELECT t.*, c.nombre as cuenta_nombre
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE DATE(t.fecha) = ?
        ORDER BY ABS(t.monto) DESC
        LIMIT 50
      `, [fechaAyer]);

      // Análisis con IA del día
      const resultado = await aiService.analizarDatos(
        { 
          resumen_dia: datosDia[0], 
          transacciones: transaccionesDia,
          fecha: fechaAyer 
        },
        `Analiza el día ${fechaAyer} como CFO. Detecta:
1. Desbalance entre debe y haber
2. Transacciones inusualmente grandes
3. Patrones de fraccionamiento
4. Errores potenciales
5. Recomendaciones para el cierre`,
        'auditoria'
      );

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'analisis_ejecutado',
        descripcion: `Análisis pre-cierre IA para ${fechaAyer}: ${datosDia[0].total_trans} transacciones analizadas`,
        detalles_json: JSON.stringify({
          fecha: fechaAyer,
          resumen: datosDia[0],
          analisis_ia: resultado.analisis
        }),
        resultado_status: 'exitoso',
        duracion_ms: resultado.duracion_ms
      });

      console.log(`[${this.nombre}] ✅ Análisis pre-cierre completado`);
      return resultado.analisis;

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error en pre-cierre:`, error);
      throw error;
    }
  }

  /**
   * Tarea 3: Alerta de cierre tardío mensual
   * Frecuencia: Día 5 de cada mes a las 18:00
   */
  async verificarCierreMensual() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 📅 Verificando cierre mensual...`);

    try {
      const hoy = new Date();
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const mesAnteriorStr = mesAnterior.toISOString().slice(0, 7);

      const cierre = await db.get(`
        SELECT * FROM cierres_mensuales WHERE mes = ?
      `, [mesAnteriorStr]);

      if (!cierre || cierre.estado !== 'cerrado') {
        // Consultar IA sobre impacto del retraso
        const impacto = await aiService.analizarDatos(
          { mes: mesAnteriorStr, estado: cierre?.estado || 'inexistente', dia_actual: hoy.getDate() },
          `Como CFO, evalúa el impacto de tener el mes ${mesAnteriorStr} sin cerrar después del día 5. 
Genera una alerta ejecutiva y recomendaciones urgentes.`,
          'auditoria'
        );

        await logAgentActivity({
          agente_nombre: this.nombre,
          agente_tipo: this.tipo,
          agente_version: this.version,
          categoria: 'alerta_detectada',
          descripcion: `🚨 ALERTA CRÍTICA: Mes ${mesAnteriorStr} SIN CERRAR. Impacto: ${impacto.analisis?.resumen || 'No evaluado'}`,
          detalles_json: JSON.stringify({ mes: mesAnteriorStr, impacto: impacto.analisis }),
          resultado_status: 'advertencia',
          duracion_ms: impacto.duracion_ms
        });

        return { alerta: true, mes: mesAnteriorStr, impacto: impacto.analisis };
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'analisis_ejecutado',
        descripcion: `Mes ${mesAnteriorStr} cerrado correctamente`,
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      return { alerta: false, mes: mesAnteriorStr };

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Iniciar scheduler con todas las tareas
   */
  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Iniciando scheduler de agente IA...`);

    // Cada 45 minutos: Detección de anomalías
    this.tareasActivas.push(cron.schedule('*/45 * * * *', async () => {
      await this.detectarAnomaliasConIA();
    }));

    // Diario 06:00: Análisis pre-cierre
    this.tareasActivas.push(cron.schedule('0 6 * * *', async () => {
      await this.analisisPreCierreIA();
    }));

    // Día 5 de cada mes a las 18:00: Verificar cierre
    this.tareasActivas.push(cron.schedule('0 18 5 * *', async () => {
      await this.verificarCierreMensual();
    }));

    console.log(`[${this.nombre}] ✅ Scheduler iniciado con ${this.tareasActivas.length} tareas`);
  }

  /**
   * Detener todas las tareas
   */
  detener() {
    this.tareasActivas.forEach(tarea => tarea.stop());
    this.tareasActivas = [];
    console.log(`[${this.nombre}] ⏹️ Scheduler detenido`);
  }
}

module.exports = new AuditorAgentIA();
