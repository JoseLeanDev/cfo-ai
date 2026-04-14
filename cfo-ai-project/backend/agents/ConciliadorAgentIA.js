/**
 * Agente de IA: Conciliador Bancario
 * Usa LLM para analizar y resolver discrepancias en conciliaciones
 */

const cron = require('node-cron');
const aiService = require('../src/services/aiService');
const { logAgentActivity } = require('../src/services/agentLogger');
const db = require('../database/connection');

class ConciliadorAgentIA {
  constructor() {
    this.nombre = 'Conciliador Bancario IA';
    this.tipo = 'conciliador_ia';
    this.version = '2.0.0';
    this.descripcion = 'Agente de IA que analiza conciliaciones bancarias y sugiere resoluciones';
    this.tareasActivas = [];
  }

  /**
   * Tarea 1: Análisis diario de conciliaciones pendientes
   * Frecuencia: Diario 08:00
   */
  async analizarConciliacionesPendientes() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 🏦 Analizando conciliaciones pendientes con IA...`);

    try {
      // Obtener conciliaciones pendientes
      const conciliaciones = await db.allAsync(`
        SELECT c.*, cb.nombre as banco_nombre, cb.numero_cuenta
        FROM conciliaciones c
        JOIN cuentas_bancarias cb ON c.cuenta_bancaria_id = cb.id
        WHERE c.estado = 'pendiente'
        ORDER BY c.fecha_inicio DESC
        LIMIT 10
      `);

      if (conciliaciones.length === 0) {
        await logAgentActivity({
          agente_nombre: this.nombre,
          agente_tipo: this.tipo,
          agente_version: this.version,
          categoria: 'analisis_ejecutado',
          descripcion: 'No hay conciliaciones pendientes',
          resultado_status: 'exitoso',
          duracion_ms: Date.now() - startTime
        });
        return { conciliaciones: 0 };
      }

      // Para cada conciliación, obtener datos y analizar
      const resultados = [];
      for (const conc of conciliaciones) {
        const movimientosBanco = await db.allAsync(`
          SELECT * FROM movimientos_bancarios
          WHERE cuenta_bancaria_id = ? AND fecha BETWEEN ? AND ?
          ORDER BY fecha DESC
        `, [conc.cuenta_bancaria_id, conc.fecha_inicio, conc.fecha_fin || 'now']);

        const transaccionesLibro = await db.allAsync(`
          SELECT t.*, c.nombre as cuenta_nombre
          FROM transacciones t
          JOIN cuentas_contables c ON t.cuenta_id = c.id
          WHERE t.cuenta_id IN (
            SELECT cuenta_contable_id FROM cuentas_bancarias WHERE id = ?
          ) AND t.fecha BETWEEN ? AND ?
          ORDER BY t.fecha DESC
        `, [conc.cuenta_bancaria_id, conc.fecha_inicio, conc.fecha_fin || 'now']);

        const analisis = await aiService.analizarConciliacionIA(movimientosBanco, transaccionesLibro);
        
        if (analisis.exito) {
          // Guardar sugerencias del IA
          await db.runAsync(`
            UPDATE conciliaciones 
            SET notas_ia = ?, diferencias_detectadas = ?, 
                sugerencias_json = ?, updated_at = datetime('now')
            WHERE id = ?
          `, [
            analisis.analisis.resumen,
            analisis.analisis.diferencias?.length || 0,
            JSON.stringify(analisis.analisis.sugerencias || []),
            conc.id
          ]);

          resultados.push({
            conciliacion_id: conc.id,
            diferencias: analisis.analisis.diferencias?.length || 0,
            saldo_conciliado: analisis.analisis.saldo_conciliado
          });
        }
      }

      const totalDiferencias = resultados.reduce((sum, r) => sum + r.diferencias, 0);

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'conciliacion_bancaria',
        descripcion: totalDiferencias > 0 
          ? `🏦 Conciliación bancaria: ${conciliaciones.length} cuentas analizadas con ${totalDiferencias} diferencias detectadas entre libro y banco.`
          : `✅ Conciliación bancaria: ${conciliaciones.length} cuentas conciliadas sin diferencias. Tesorería sincronizada.`,
        detalles_json: JSON.stringify({
          cuentas_analizadas: conciliaciones.length,
          diferencias: totalDiferencias
        }),
        resultado_status: totalDiferencias > 0 ? 'advertencia' : 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      console.log(`[${this.nombre}] ✅ Análisis completado: ${totalDiferencias} diferencias`);
      return { conciliaciones_analizadas: conciliaciones.length, diferencias: totalDiferencias };

    } catch (error) {
      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'error_sistema',
        descripcion: `Error en análisis: ${error.message}`,
        resultado_status: 'error',
        duracion_ms: Date.now() - startTime
      });
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 2: Alerta de conciliaciones viejas
   * Frecuencia: Día 3 de cada mes a las 09:00
   */
  async alertarConciliacionesViejas() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] ⚠️ Verificando conciliaciones viejas...`);

    try {
      const viejas = await db.allAsync(`
        SELECT c.*, cb.nombre as banco_nombre,
               julianday('now') - julianday(c.fecha_inicio) as dias_pendiente
        FROM conciliaciones c
        JOIN cuentas_bancarias cb ON c.cuenta_bancaria_id = cb.id
        WHERE c.estado = 'pendiente'
        AND c.fecha_inicio <= date('now', '-10 days')
        ORDER BY c.fecha_inicio ASC
      `);

      if (viejas.length > 0) {
        // Analizar impacto con IA
        const impacto = await aiService.analizarDatos(
          { conciliaciones_viejas: viejas },
          `Evalúa el riesgo de tener ${viejas.length} conciliaciones pendientes por más de 10 días.
Genera alertas priorizadas y recomendaciones de acción urgente.`,
          'conciliacion'
        );

        await logAgentActivity({
          agente_nombre: this.nombre,
          agente_tipo: this.tipo,
          agente_version: this.version,
          categoria: 'alerta_detectada',
          descripcion: `🚨 ${viejas.length} conciliaciones bancarias llevan más de 10 días sin cerrar. Riesgo de discrepancias no detectadas en tesorería.`,
          detalles_json: JSON.stringify({
            count: viejas.length,
            bancos_afectados: viejas.map(v => v.banco_nombre)
          }),
          resultado_status: 'advertencia',
          duracion_ms: impacto.duracion_ms
        });

        console.log(`[${this.nombre}] ⚠️ Alerta: ${viejas.length} conciliaciones viejas`);
      } else {
        await logAgentActivity({
          agente_nombre: this.nombre,
          agente_tipo: this.tipo,
          agente_version: this.version,
          categoria: 'conciliacion_bancaria',
          descripcion: `✅ Todas las conciliaciones bancarias están al día. Sin discrepancias pendientes en cuentas.`,
          resultado_status: 'exitoso',
          duracion_ms: Date.now() - startTime
        });
      }

      return { viejas: viejas.length, detalles: viejas };

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 3: Sugerir emparejamientos automáticos
   * Frecuencia: Diario 10:00
   */
  async sugerirEmparejamientos() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 🔗 Buscando emparejamientos automáticos con IA...`);

    try {
      // Buscar movimientos bancarios sin conciliar
      const movimientos = await db.allAsync(`
        SELECT mb.*, cb.nombre as banco_nombre
        FROM movimientos_bancarios mb
        JOIN cuentas_bancarias cb ON mb.cuenta_bancaria_id = cb.id
        WHERE mb.estado = 'no_conciliado'
        AND mb.fecha >= date('now', '-30 days')
        ORDER BY ABS(mb.monto) DESC
        LIMIT 50
      `);

      // Buscar transacciones sin match
      const transacciones = await db.allAsync(`
        SELECT t.*, c.nombre as cuenta_nombre
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE t.cuenta_id IN (SELECT cuenta_contable_id FROM cuentas_bancarias)
        AND t.fecha >= date('now', '-30 days')
        ORDER BY ABS(t.monto) DESC
        LIMIT 50
      `);

      if (movimientos.length === 0 || transacciones.length === 0) {
        return { sugerencias: 0 };
      }

      // Pedir a IA que encuentre matches
      const analisis = await aiService.analizarDatos(
        { movimientos, transacciones },
        `Encuentra emparejamientos probables entre movimientos bancarios y transacciones contables.
Para cada match sugerido, incluye: id_movimiento, id_transaccion, confianza (alta/media/baja), razón.
Devuelve máximo 20 sugerencias.`,
        'conciliacion'
      );

      const sugerencias = analisis.analisis?.matches || analisis.analisis?.sugerencias || [];

      // Guardar sugerencias
      for (const sug of sugerencias.slice(0, 20)) {
        await db.runAsync(`
          INSERT INTO sugerencias_conciliacion 
          (movimiento_id, transaccion_id, confianza, razon, estado, created_at)
          VALUES (?, ?, ?, ?, 'pendiente', datetime('now'))
        `, [
          sug.movimiento_id || sug.id_movimiento,
          sug.transaccion_id || sug.id_transaccion,
          sug.confianza || 'media',
          sug.razon || ''
        ]);
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'conciliacion_bancaria',
        descripcion: sugerencias.length > 0 
          ? `💡 IA identificó ${sugerencias.length} posibles emparejamientos automáticos entre movimientos bancarios y registros contables.`
          : `🔍 Revisión de emparejamientos completada: sin sugerencias automáticas pendientes.`,
        detalles_json: JSON.stringify({
          sugerencias_generadas: sugerencias.length,
          movimientos_analizados: movimientos.length
        }),
        resultado_status: 'exitoso',
        duracion_ms: analisis.duracion_ms
      });

      console.log(`[${this.nombre}] ✅ ${sugerencias.length} sugerencias generadas`);
      return { sugerencias: sugerencias.length };

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Iniciar scheduler
   */
  iniciarScheduler() {
    console.log(`[${this.nombre}] 🚀 Iniciando scheduler...`);

    // Diario 08:00: Analizar conciliaciones
    this.tareasActivas.push(cron.schedule('0 8 * * *', async () => {
      await this.analizarConciliacionesPendientes();
    }));

    // Diario 10:00: Sugerir emparejamientos
    this.tareasActivas.push(cron.schedule('0 10 * * *', async () => {
      await this.sugerirEmparejamientos();
    }));

    // Día 3 de cada mes a las 09:00: Alertar viejas
    this.tareasActivas.push(cron.schedule('0 9 3 * *', async () => {
      await this.alertarConciliacionesViejas();
    }));

    console.log(`[${this.nombre}] ✅ Scheduler iniciado`);
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = new ConciliadorAgentIA();
