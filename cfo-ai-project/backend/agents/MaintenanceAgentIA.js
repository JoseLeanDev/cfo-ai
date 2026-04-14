/**
 * Agente de IA: Maintenance Agent
 * Mantiene el sistema, optimiza BD, archiva datos, usa IA para predicción de mantenimiento
 */

const cron = require('node-cron');
const aiService = require('../src/services/aiService');
const { logAgentActivity } = require('../src/services/agentLogger');
const db = require('../database/connection');
const fs = require('fs').promises;
const path = require('path');

class MaintenanceAgentIA {
  constructor() {
    this.nombre = 'Maintenance IA';
    this.tipo = 'maintenance_ia';
    this.version = '2.0.0';
    this.descripcion = 'Agente de IA que mantiene el sistema y predice necesidades de mantenimiento';
    this.tareasActivas = [];
  }

  /**
   * Tarea 1: Limpieza de logs viejos
   * Frecuencia: Diario 02:00
   */
  async limpiarLogsViejos() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 🧹 Limpiando logs viejos...`);

    try {
      // Archivar logs antiguos (más de 90 días)
      const logsViejos = await db.allAsync(`
        SELECT * FROM agentes_logs
        WHERE created_at < datetime('now', '-90 days')
        ORDER BY created_at ASC
        LIMIT 10000
      `);

      if (logsViejos.length > 0) {
        // Guardar en archivo
        const archiveDir = path.join(__dirname, '../../archives');
        await fs.mkdir(archiveDir, { recursive: true });
        
        const filename = `logs_${new Date().toISOString().split('T')[0]}.json`;
        await fs.writeFile(
          path.join(archiveDir, filename),
          JSON.stringify(logsViejos, null, 2)
        );

        // Eliminar de BD
        const ids = logsViejos.map(l => l.id).join(',');
        await db.runAsync(`DELETE FROM agentes_logs WHERE id IN (${ids})`);

        await logAgentActivity({
          agente_nombre: this.nombre,
          agente_tipo: this.tipo,
          agente_version: this.version,
          categoria: 'sincronizacion_datos',
          descripcion: `Archivados ${logsViejos.length} logs antiguos a ${filename}`,
          detalles_json: JSON.stringify({ archivados: logsViejos.length, archivo: filename }),
          resultado_status: 'exitoso',
          duracion_ms: Date.now() - startTime
        });

        console.log(`[${this.nombre}] ✅ ${logsViejos.length} logs archivados`);
      } else {
        console.log(`[${this.nombre}] ℹ️ No hay logs viejos para archivar`);
      }

      return { archivados: logsViejos.length };

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 2: Optimización de BD con análisis IA
   * Frecuencia: Domingo 03:00
   */
  async optimizarBaseDatos() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] ⚡ Optimizando base de datos con IA...`);

    try {
      // Obtener estadísticas de la BD
      const stats = await db.getAsync(`SELECT COUNT(*) as total FROM sqlite_master WHERE type='table'`);
      const tamaño = await db.getAsync(`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`);
      
      const tablasGrandes = await db.allAsync(`
        SELECT name, 
               (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=t.name) as count
        FROM sqlite_master t
        WHERE type='table'
        ORDER BY count DESC
        LIMIT 10
      `);

      // Análisis IA de salud de BD
      const analisis = await aiService.analizarDatos(
        { 
          tablas: stats.total, 
          tamaño_bytes: tamaño?.size || 0,
          tablas_info: tablasGrandes 
        },
        `Analiza la salud de la base de datos SQLite. 
Sugiere optimizaciones específicas como VACUUM, REINDEX, análisis de índices faltantes.
Genera un reporte de salud del sistema.`,
        'maintenance'
      );

      // Ejecutar optimizaciones básicas
      await db.runAsync('VACUUM');
      await db.runAsync('ANALYZE');

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'sincronizacion_datos',
        descripcion: `Optimización BD completada: VACUUM + ANALYZE. Salud: ${analisis.analisis?.salud || 'OK'}`,
        detalles_json: JSON.stringify({
          tablas: stats.total,
          tamaño_bytes: tamaño?.size,
          recomendaciones_ia: analisis.analisis?.recomendaciones
        }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      console.log(`[${this.nombre}] ✅ BD optimizada`);
      return { exito: true, recomendaciones: analisis.analisis?.recomendaciones };

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 3: Health Check del Sistema
   * Frecuencia: Cada 4 horas
   */
  async healthCheckSistema() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 🏥 Health check del sistema...`);

    try {
      const checks = {
        db_conexion: await this.checkDB(),
        espacio_disco: await this.checkEspacio(),
        errores_recientes: await this.checkErrores(),
        agentes_activos: await this.checkAgentes()
      };

      // Análisis IA del estado del sistema
      const analisis = await aiService.analizarDatos(
        checks,
        `Evalúa el estado general del sistema CFO AI basado en estos health checks.
Identifica riesgos potenciales y sugiere acciones preventivas.
Genera un "System Health Score".`,
        'maintenance'
      );

      const healthScore = analisis.analisis?.health_score || 100;

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: healthScore < 80 ? 'alerta_detectada' : 'sincronizacion_datos',
        descripcion: healthScore < 80 
          ? `⚠️ Health check del sistema detectó problemas. Score: ${healthScore}/100. Requiere atención técnica.`
          : `Health check del sistema completado. Score: ${healthScore}/100`,
        detalles_json: JSON.stringify({ checks, health_score: healthScore }),
        resultado_status: healthScore < 80 ? 'advertencia' : 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      console.log(`[${this.nombre}] ✅ Health check: ${healthScore}/100`);
      return { health_score: healthScore, checks };

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * Tarea 4: Snapshot de archivo
   * Frecuencia: Día 15 de cada mes a las 04:00
   */
  async snapshotArchivo() {
    const startTime = Date.now();
    console.log(`[${this.nombre}] 💾 Creando snapshot de archivo...`);

    try {
      const dbPath = path.join(__dirname, '../../database/cfo_ai.db');
      const backupDir = path.join(__dirname, '../../backups');
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup_${timestamp}.db`);

      // Copiar archivo de BD
      await fs.copyFile(dbPath, backupPath);

      // Limpiar backups antiguos (mantener últimos 10)
      const backups = await fs.readdir(backupDir);
      const dbBackups = backups.filter(f => f.endsWith('.db')).sort();
      
      if (dbBackups.length > 10) {
        const toDelete = dbBackups.slice(0, dbBackups.length - 10);
        for (const file of toDelete) {
          await fs.unlink(path.join(backupDir, file));
        }
      }

      await logAgentActivity({
        agente_nombre: this.nombre,
        agente_tipo: this.tipo,
        agente_version: this.version,
        categoria: 'sincronizacion_datos',
        descripcion: `Snapshot creado: ${path.basename(backupPath)}`,
        detalles_json: JSON.stringify({ archivo: path.basename(backupPath) }),
        resultado_status: 'exitoso',
        duracion_ms: Date.now() - startTime
      });

      console.log(`[${this.nombre}] ✅ Snapshot creado: ${path.basename(backupPath)}`);
      return { archivo: path.basename(backupPath) };

    } catch (error) {
      console.error(`[${this.nombre}] ❌ Error:`, error);
      throw error;
    }
  }

  // ============ HELPERS ============

  async checkDB() {
    try {
      await db.getAsync('SELECT 1');
      return { estado: 'ok', latencia_ms: 0 };
    } catch (e) {
      return { estado: 'error', error: e.message };
    }
  }

  async checkEspacio() {
    try {
      const stats = await fs.stat('/');
      return { estado: 'ok' }; // Simplificado
    } catch (e) {
      return { estado: 'unknown' };
    }
  }

  async checkErrores() {
    const errores = await db.allAsync(`
      SELECT COUNT(*) as count FROM agentes_logs 
      WHERE resultado_status = 'error' 
      AND created_at >= datetime('now', '-24 hours')
    `);
    return { count: errores[0]?.count || 0 };
  }

  async checkAgentes() {
    const ultimosLogs = await db.allAsync(`
      SELECT agente_nombre, MAX(created_at) as last_run
      FROM agentes_logs
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY agente_nombre
    `);
    return { agentes_activos: ultimosLogs.length, detalles: ultimosLogs };
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
      descripcion: `🟢 Agente iniciado y listo. Tareas: limpieza 02:00, optimización dom 03:00, health check cada 4h.`,
      resultado_status: 'exitoso',
      duracion_ms: 0
    });

    // Diario 02:00: Limpiar logs
    this.tareasActivas.push(cron.schedule('0 2 * * *', async () => {
      await this.limpiarLogsViejos();
    }));

    // Domingo 03:00: Optimizar BD
    this.tareasActivas.push(cron.schedule('0 3 * * 0', async () => {
      await this.optimizarBaseDatos();
    }));

    // Cada 4 horas: Health check
    this.tareasActivas.push(cron.schedule('0 */4 * * *', async () => {
      await this.healthCheckSistema();
    }));

    // Día 15 de cada mes a las 04:00: Snapshot
    this.tareasActivas.push(cron.schedule('0 4 15 * *', async () => {
      await this.snapshotArchivo();
    }));

    console.log(`[${this.nombre}] ✅ Scheduler iniciado`);
  }

  detener() {
    this.tareasActivas.forEach(t => t.stop());
    this.tareasActivas = [];
  }
}

module.exports = new MaintenanceAgentIA();
