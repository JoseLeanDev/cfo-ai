const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
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

class MaintenanceAgent {
  constructor(db) {
    this.db = db;
    this.name = 'Memory/Garbage Collector';
    this.type = 'maintenance';
    this.version = '1.0.0';
    this.backupDir = path.join(__dirname, '../../backups');
  }

  // Diario 02:00: Limpieza logs viejos
  async limpiezaLogsViejos() {
    const startTime = Date.now();
    try {
      console.log('[Maintenance] Limpiando logs viejos...');

      // Archivar logs de agentes > 90 días
      const noventaDiasAtras = new Date();
      noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);
      const fechaLimite = noventaDiasAtras.toISOString();

      // Seleccionar logs antiguos
      const logsAntiguos = await this.db.all(`
        SELECT * FROM agentes_logs 
        WHERE created_at < ?
        ORDER BY created_at
      `, [fechaLimite]);

      if (logsAntiguos.length > 0) {
        // Crear directorio de archivo si no existe
        const archivoDir = path.join(this.backupDir, 'logs');
        if (!fs.existsSync(archivoDir)) {
          fs.mkdirSync(archivoDir, { recursive: true });
        }

        // Guardar en archivo JSON
        const archivoNombre = `logs_${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(
          path.join(archivoDir, archivoNombre),
          JSON.stringify(logsAntiguos, null, 2)
        );

        // Eliminar de la base de datos
        await this.db.run(`
          DELETE FROM agentes_logs 
          WHERE created_at < ?
        `, [fechaLimite]);

        const duracion = Date.now() - startTime;
        await logAgentActivity({
          agente_nombre: this.name,
          agente_tipo: this.type,
          agente_version: this.version,
          categoria: 'sincronizacion_datos',
          descripcion: `Logs archivados: ${logsAntiguos.length} registros > 90 días movidos a ${archivoNombre}`,
          detalles_json: JSON.stringify({ registros_archivados: logsAntiguos.length, archivo: archivoNombre }),
          resultado_status: 'exitoso',
          duracion_ms: duracion
        });

        console.log(`[Maintenance] ${logsAntiguos.length} logs archivados`);
      } else {
        console.log('[Maintenance] No hay logs antiguos para archivar');
      }

      return { archivados: logsAntiguos.length };
    } catch (error) {
      console.error('[Maintenance] Error en limpieza logs:', error);
      throw error;
    }
  }

  // Semanal (Dom 03:00): Optimización DB
  async optimizacionDB() {
    const startTime = Date.now();
    try {
      console.log('[Maintenance] Optimizando base de datos...');

      // VACUUM para SQLite
      await this.db.run('VACUUM');

      // Eliminar datos temporales de conciliaciones completadas
      const result = await this.db.run(`
        DELETE FROM temp_conciliacion_items
        WHERE conciliacion_id IN (
          SELECT id FROM conciliaciones 
          WHERE estado = 'conciliado' 
          AND updated_at < date('now', '-30 days')
        )
      `);

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'sincronizacion_datos',
        descripcion: `DB optimizada: VACUUM completado, ${result?.changes || 0} registros temporales eliminados`,
        detalles_json: JSON.stringify({ vacuum: true, registros_eliminados: result?.changes || 0 }),
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log('[Maintenance] Base de datos optimizada');
      return { vacuum: true };
    } catch (error) {
      console.error('[Maintenance] Error en optimización:', error);
      throw error;
    }
  }

  // Mensual: Snapshot archivo
  async snapshotArchivo() {
    const startTime = Date.now();
    try {
      console.log('[Maintenance] Generando snapshot de archivo...');

      const mesActual = new Date().toISOString().slice(0, 7);

      // Generar resumen de estados financieros
      const estados = await this.db.all(`
        SELECT 
          strftime('%Y-%m', t.fecha) as periodo,
          SUM(CASE WHEN c.tipo = 'activo' AND t.tipo = 'debe' THEN t.monto ELSE 0 END) as activos,
          SUM(CASE WHEN c.tipo = 'pasivo' AND t.tipo = 'haber' THEN t.monto ELSE 0 END) as pasivos,
          SUM(CASE WHEN c.tipo = 'ingreso' AND t.tipo = 'haber' THEN t.monto ELSE 0 END) as ingresos,
          SUM(CASE WHEN c.tipo = 'gasto' AND t.tipo = 'debe' THEN t.monto ELSE 0 END) as gastos
        FROM transacciones t
        JOIN cuentas_contables c ON t.cuenta_id = c.id
        WHERE t.fecha >= date('now', '-24 months')
        GROUP BY strftime('%Y-%m', t.fecha)
        ORDER BY periodo DESC
      `);

      // Crear backup comprimido
      const backupDir = path.join(this.backupDir, 'estados');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const archivoNombre = `estados_historicos_${mesActual}.json`;
      fs.writeFileSync(
        path.join(backupDir, archivoNombre),
        JSON.stringify(estados, null, 2)
      );

      const duracion = Date.now() - startTime;
      await logAgentActivity({
        agente_nombre: this.name,
        agente_tipo: this.type,
        agente_version: this.version,
        categoria: 'sincronizacion_datos',
        descripcion: `Snapshot mensual generado: ${estados.length} períodos en ${archivoNombre}`,
        detalles_json: JSON.stringify({ periodos: estados.length, archivo: archivoNombre }),
        resultado_status: 'exitoso',
        duracion_ms: duracion
      });

      console.log(`[Maintenance] Snapshot generado: ${archivoNombre}`);
      return { archivo: archivoNombre, periodos: estados.length };
    } catch (error) {
      console.error('[Maintenance] Error en snapshot:', error);
      throw error;
    }
  }

  iniciarScheduler() {
    console.log('[Maintenance] Iniciando scheduler...');

    // Diario 02:00
    cron.schedule('0 2 * * *', () => {
      this.limpiezaLogsViejos();
    });

    // Domingo 03:00
    cron.schedule('0 3 * * 0', () => {
      this.optimizacionDB();
    });

    // Día 15 de cada mes a las 04:00
    cron.schedule('0 4 15 * *', () => {
      this.snapshotArchivo();
    });

    console.log('[Maintenance] Scheduler iniciado con todas las tareas');
  }
}

module.exports = MaintenanceAgent;
