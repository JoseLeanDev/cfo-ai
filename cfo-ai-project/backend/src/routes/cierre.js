const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

// ============================================
// ENDPOINTS DE CIERRE MENSUAL
// ============================================

// GET /api/cierre/lista - Listar cierres por año
router.get('/lista', async (req, res) => {
  try {
    const { anio = new Date().getFullYear(), empresa_id = 1 } = req.query;
    
    const cierres = await db.allAsync(`
      SELECT 
        id,
        anio,
        mes,
        estado,
        fecha_inicio,
        fecha_cierre,
        usuario_inicio,
        usuario_cierre,
        progreso,
        checklist_completado,
        total_tareas,
        tareas_completadas,
        created_at,
        updated_at
      FROM cierres_mensuales 
      WHERE empresa_id = ? AND anio = ?
      ORDER BY mes DESC
    `, [empresa_id, anio]);

    // Calcular estadísticas del año
    const estadisticas = {
      total_meses: 12,
      meses_cerrados: cierres.filter(c => c.estado === 'cerrado').length,
      meses_en_progreso: cierres.filter(c => c.estado === 'en_progreso').length,
      meses_pendientes: 12 - cierres.length
    };

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        anio: parseInt(anio),
        estadisticas,
        cierres: cierres.map(c => ({
          ...c,
          progreso: c.progreso || 0,
          mes_nombre: obtenerNombreMes(c.mes),
          dias_en_cierre: c.fecha_inicio ? 
            Math.floor((new Date() - new Date(c.fecha_inicio)) / (1000 * 60 * 60 * 24)) : 0
        }))
      },
      ui_components: {
        table: 'cierres_anuales_table',
        chart: 'cierre_progress_timeline'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/cierre/iniciar - Iniciar cierre de un mes
router.post('/iniciar', async (req, res) => {
  try {
    const { anio, mes, usuario_id = 1, empresa_id = 1 } = req.body;
    
    if (!anio || !mes) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Se requiere año y mes para iniciar el cierre' 
      });
    }

    // Verificar si ya existe un cierre para este período
    const cierreExistente = await db.getAsync(`
      SELECT id, estado FROM cierres_mensuales 
      WHERE empresa_id = ? AND anio = ? AND mes = ?
    `, [empresa_id, anio, mes]);

    if (cierreExistente) {
      if (cierreExistente.estado === 'cerrado') {
        return res.status(400).json({
          status: 'error',
          message: 'El período ya está cerrado. No se puede reiniciar el cierre.'
        });
      }
      if (cierreExistente.estado === 'en_progreso') {
        return res.status(400).json({
          status: 'error',
          message: 'Ya existe un cierre en progreso para este período.',
          data: { cierre_id: cierreExistente.id }
        });
      }
    }

    // Crear nuevo cierre
    const result = await db.runAsync(`
      INSERT INTO cierres_mensuales (
        empresa_id, anio, mes, estado, fecha_inicio, usuario_inicio, 
        progreso, checklist_completado, total_tareas, tareas_completadas
      ) VALUES (?, ?, ?, 'en_progreso', datetime('now'), ?, 0, 0, 10, 0)
    `, [empresa_id, anio, mes, usuario_id]);

    const cierreId = result.lastID;

    // Crear checklist por defecto
    const checklistItems = [
      { orden: 1, tarea: 'Verificar asientos del período', automatico: true },
      { orden: 2, tarea: 'Conciliación bancaria', automatico: false },
      { orden: 3, tarea: 'Revisión de cuentas por cobrar', automatico: true },
      { orden: 4, tarea: 'Revisión de cuentas por pagar', automatico: true },
      { orden: 5, tarea: 'Cálculo de depreciaciones', automatico: true },
      { orden: 6, tarea: 'Asientos de ajuste', automatico: false },
      { orden: 7, tarea: 'Conciliación de inventarios', automatico: false },
      { orden: 8, tarea: 'Revisión de provisiones', automatico: true },
      { orden: 9, tarea: 'Generación de estados financieros', automatico: true },
      { orden: 10, tarea: 'Aprobación final', automatico: false, requiere_aprobacion: true }
    ];

    for (const item of checklistItems) {
      await db.runAsync(`
        INSERT INTO cierre_checklist (cierre_id, orden, tarea, completado, automatico, requiere_aprobacion)
        VALUES (?, ?, ?, 0, ?, ?)
      `, [cierreId, item.orden, item.tarea, item.automatico, item.requiere_aprobacion || false]);
    }

    // Crear alertas iniciales
    await crearAlertasIniciales(cierreId, anio, mes, empresa_id);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        cierre_id: cierreId,
        anio,
        mes,
        mes_nombre: obtenerNombreMes(mes),
        estado: 'en_progreso',
        fecha_inicio: new Date().toISOString(),
        progreso: 0,
        checklist: checklistItems.map((item, idx) => ({
          ...item,
          id: idx + 1,
          completado: false
        })),
        tiempo_estimado: '45 minutos'
      },
      ui_components: {
        wizard: 'closing_wizard_stepper',
        checklist: 'cierre_checklist'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/cierre/:anio/:mes - Detalle de cierre
router.get('/:anio/:mes', async (req, res) => {
  try {
    const { anio, mes } = req.params;
    const { empresa_id = 1 } = req.query;

    const cierre = await db.getAsync(`
      SELECT 
        id, anio, mes, estado, fecha_inicio, fecha_cierre,
        usuario_inicio, usuario_cierre, progreso,
        checklist_completado, total_tareas, tareas_completadas,
        observaciones, created_at, updated_at
      FROM cierres_mensuales 
      WHERE empresa_id = ? AND anio = ? AND mes = ?
    `, [empresa_id, anio, mes]);

    if (!cierre) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró cierre para ${mes}/${anio}`
      });
    }

    // Obtener checklist
    const checklist = await db.allAsync(`
      SELECT 
        id, orden, tarea, completado, 
        automatico, requiere_aprobacion, 
        fecha_completado, usuario_completado,
        observaciones
      FROM cierre_checklist 
      WHERE cierre_id = ?
      ORDER BY orden
    `, [cierre.id]);

    // Obtener estadísticas del período
    const estadisticas = await obtenerEstadisticasPeriodo(anio, mes, empresa_id);

    // Obtener alertas activas
    const alertas = await db.allAsync(`
      SELECT id, tipo, mensaje, nivel, fecha_creacion, resuelta
      FROM alertas_cierre 
      WHERE cierre_id = ? AND resuelta = 0
      ORDER BY 
        CASE nivel 
          WHEN 'critico' THEN 1 
          WHEN 'alto' THEN 2 
          WHEN 'medio' THEN 3 
          ELSE 4 
        END
    `, [cierre.id]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        ...cierre,
        mes_nombre: obtenerNombreMes(cierre.mes),
        dias_en_cierre: cierre.fecha_inicio ? 
          Math.floor((new Date() - new Date(cierre.fecha_inicio)) / (1000 * 60 * 60 * 24)) : 0,
        checklist: checklist.map(c => ({
          ...c,
          completado: !!c.completado,
          automatico: !!c.automatico,
          requiere_aprobacion: !!c.requiere_aprobacion
        })),
        estadisticas,
        alertas,
        estados_financieros: {
          balance_general: { generado: cierre.estado === 'cerrado', fecha: cierre.fecha_cierre },
          estado_resultados: { generado: cierre.estado === 'cerrado', fecha: cierre.fecha_cierre },
          flujo_efectivo: { generado: cierre.estado === 'cerrado', fecha: cierre.fecha_cierre }
        }
      },
      ui_components: {
        detail_card: 'cierre_detail',
        checklist: 'interactive_checklist',
        alerts: 'alerts_panel'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/cierre/:anio/:mes/checklist - Actualizar checklist
router.post('/:anio/:mes/checklist', async (req, res) => {
  try {
    const { anio, mes } = req.params;
    const { items, usuario_id = 1, empresa_id = 1 } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        status: 'error',
        message: 'Se requiere array de items para actualizar'
      });
    }

    // Obtener el cierre
    const cierre = await db.getAsync(`
      SELECT id, estado FROM cierres_mensuales 
      WHERE empresa_id = ? AND anio = ? AND mes = ?
    `, [empresa_id, anio, mes]);

    if (!cierre) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró cierre para ${mes}/${anio}`
      });
    }

    if (cierre.estado === 'cerrado') {
      return res.status(400).json({
        status: 'error',
        message: 'No se puede modificar el checklist de un período cerrado'
      });
    }

    // Actualizar items del checklist
    for (const item of items) {
      const { id, completado, observaciones } = item;
      
      if (completado) {
        await db.runAsync(`
          UPDATE cierre_checklist 
          SET completado = 1, 
              fecha_completado = datetime('now'),
              usuario_completado = ?,
              observaciones = COALESCE(?, observaciones)
          WHERE id = ? AND cierre_id = ?
        `, [usuario_id, observaciones, id, cierre.id]);
      } else {
        await db.runAsync(`
          UPDATE cierre_checklist 
          SET completado = 0, 
              fecha_completado = NULL,
              usuario_completado = NULL,
              observaciones = COALESCE(?, observaciones)
          WHERE id = ? AND cierre_id = ?
        `, [observaciones, id, cierre.id]);
      }
    }

    // Recalcular progreso
    const progreso = await calcularProgresoCierre(cierre.id);
    const tareasCompletadas = await db.getAsync(`
      SELECT COUNT(*) as count FROM cierre_checklist 
      WHERE cierre_id = ? AND completado = 1
    `, [cierre.id]);

    await db.runAsync(`
      UPDATE cierres_mensuales 
      SET progreso = ?, 
          tareas_completadas = ?,
          checklist_completado = CASE WHEN ? = 100 THEN 1 ELSE 0 END,
          updated_at = datetime('now')
      WHERE id = ?
    `, [progreso, tareasCompletadas.count, progreso, cierre.id]);

    // Obtener checklist actualizado
    const checklistActualizado = await db.allAsync(`
      SELECT id, orden, tarea, completado, automatico, requiere_aprobacion
      FROM cierre_checklist 
      WHERE cierre_id = ?
      ORDER BY orden
    `, [cierre.id]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        cierre_id: cierre.id,
        anio,
        mes,
        progreso,
        tareas_completadas: tareasCompletadas.count,
        checklist: checklistActualizado.map(c => ({
          ...c,
          completado: !!c.completado
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/cierre/:anio/:mes/cerrar - Cerrar mes
router.post('/:anio/:mes/cerrar', async (req, res) => {
  try {
    const { anio, mes } = req.params;
    const { usuario_id = 1, observaciones = '', empresa_id = 1 } = req.body;

    const cierre = await db.getAsync(`
      SELECT id, estado, progreso FROM cierres_mensuales 
      WHERE empresa_id = ? AND anio = ? AND mes = ?
    `, [empresa_id, anio, mes]);

    if (!cierre) {
      return res.status(404).json({
        status: 'error',
        message: `No se encontró cierre para ${mes}/${anio}`
      });
    }

    if (cierre.estado === 'cerrado') {
      return res.status(400).json({
        status: 'error',
        message: 'El período ya está cerrado'
      });
    }

    if (cierre.progreso < 100) {
      return res.status(400).json({
        status: 'error',
        message: 'No se puede cerrar el período. El checklist no está completo.',
        data: { progreso_actual: cierre.progreso }
      });
    }

    // Verificar alertas críticas pendientes
    const alertasCriticas = await db.getAsync(`
      SELECT COUNT(*) as count FROM alertas_cierre 
      WHERE cierre_id = ? AND nivel IN ('critico', 'alto') AND resuelta = 0
    `, [cierre.id]);

    if (alertasCriticas.count > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Existen ${alertasCriticas.count} alertas críticas sin resolver. Resuélvalas antes de cerrar.`,
        data: { alertas_pendientes: alertasCriticas.count }
      });
    }

    // Cerrar el período
    await db.runAsync(`
      UPDATE cierres_mensuales 
      SET estado = 'cerrado',
          fecha_cierre = datetime('now'),
          usuario_cierre = ?,
          observaciones = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [usuario_id, observaciones, cierre.id]);

    // Generar asiento de cierre automático
    const asientoCierreId = await generarAsientoCierre(anio, mes, empresa_id);

    // Marcar alertas como resueltas
    await db.runAsync(`
      UPDATE alertas_cierre 
      SET resuelta = 1, fecha_resolucion = datetime('now')
      WHERE cierre_id = ?
    `, [cierre.id]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        cierre_id: cierre.id,
        anio,
        mes,
        estado: 'cerrado',
        fecha_cierre: new Date().toISOString(),
        usuario_cierre: usuario_id,
        asiento_cierre_id: asientoCierreId,
        mensaje: `Período ${mes}/${anio} cerrado exitosamente`
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// ENDPOINTS DE CONCILIACIÓN BANCARIA
// ============================================

// GET /api/conciliacion/pendientes - Conciliaciones pendientes
router.get('/conciliacion/pendientes', async (req, res) => {
  try {
    const { empresa_id = 1, dias_atraso = 7 } = req.query;

    const pendientes = await db.allAsync(`
      SELECT 
        cb.id as cuenta_id,
        cb.banco,
        cb.cuenta_numero,
        cb.moneda,
        cb.saldo as saldo_contable,
        cb.ultima_conciliacion,
        julianday('now') - julianday(cb.ultima_conciliacion) as dias_sin_conciliar,
        c.id as conciliacion_id,
        c.estado as estado_conciliacion,
        c.fecha_inicio as fecha_inicio_conciliacion,
        c.diferencia,
        c.transacciones_pendientes
      FROM cuentas_bancarias cb
      LEFT JOIN conciliaciones_bancarias c ON cb.id = c.cuenta_id 
        AND c.estado IN ('pendiente', 'en_progreso')
      WHERE cb.empresa_id = ? 
        AND cb.activa = 1
        AND (cb.ultima_conciliacion IS NULL 
          OR julianday('now') - julianday(cb.ultima_conciliacion) >= ?)
      ORDER BY dias_sin_conciliar DESC
    `, [empresa_id, dias_atraso]);

    const resumen = {
      total_pendientes: pendientes.length,
      criticas: pendientes.filter(p => p.dias_sin_conciliar > 30).length,
      alta: pendientes.filter(p => p.dias_sin_conciliar > 14 && p.dias_sin_conciliar <= 30).length,
      media: pendientes.filter(p => p.dias_sin_conciliar > 7 && p.dias_sin_conciliar <= 14).length,
      baja: pendientes.filter(p => p.dias_sin_conciliar <= 7).length
    };

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        resumen,
        pendientes: pendientes.map(p => ({
          ...p,
          dias_sin_conciliar: Math.floor(p.dias_sin_conciliar || 0),
          prioridad: p.dias_sin_conciliar > 30 ? 'critica' : 
                     p.dias_sin_conciliar > 14 ? 'alta' : 
                     p.dias_sin_conciliar > 7 ? 'media' : 'baja',
          en_progreso: !!p.conciliacion_id
        }))
      },
      ui_components: {
        table: 'conciliacion_pendientes_table',
        cards: 'priority_summary_cards'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/conciliacion/iniciar - Iniciar conciliación
router.post('/conciliacion/iniciar', async (req, res) => {
  try {
    const { 
      cuenta_id, 
      fecha_inicio, 
      fecha_fin, 
      saldo_bancario, 
      usuario_id = 1,
      empresa_id = 1 
    } = req.body;

    if (!cuenta_id || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        status: 'error',
        message: 'Se requiere cuenta_id, fecha_inicio y fecha_fin'
      });
    }

    // Verificar cuenta
    const cuenta = await db.getAsync(`
      SELECT id, banco, cuenta_numero, moneda, saldo 
      FROM cuentas_bancarias 
      WHERE id = ? AND empresa_id = ?
    `, [cuenta_id, empresa_id]);

    if (!cuenta) {
      return res.status(404).json({
        status: 'error',
        message: 'Cuenta bancaria no encontrada'
      });
    }

    // Verificar si ya existe conciliación en progreso
    const existente = await db.getAsync(`
      SELECT id FROM conciliaciones_bancarias 
      WHERE cuenta_id = ? AND estado = 'en_progreso'
    `, [cuenta_id]);

    if (existente) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe una conciliación en progreso para esta cuenta',
        data: { conciliacion_id: existente.id }
      });
    }

    // Obtener transacciones del período
    const transaccionesContables = await db.allAsync(`
      SELECT 
        id, fecha, descripcion, referencia, monto, tipo
      FROM transacciones_bancarias 
      WHERE cuenta_id = ? 
        AND fecha BETWEEN ? AND ?
        AND conciliada = 0
      ORDER BY fecha
    `, [cuenta_id, fecha_inicio, fecha_fin]);

    const saldoContable = cuenta.saldo;
    const saldoBancarioInput = saldo_bancario || saldoContable;
    const diferenciaInicial = saldoContable - saldoBancarioInput;

    // Crear conciliación
    const result = await db.runAsync(`
      INSERT INTO conciliaciones_bancarias (
        cuenta_id, empresa_id, fecha_inicio, fecha_fin,
        saldo_contable, saldo_bancario, diferencia,
        estado, usuario_inicio, transacciones_pendientes,
        transacciones_encontradas, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'en_progreso', ?, ?, 0, datetime('now'))
    `, [
      cuenta_id, empresa_id, fecha_inicio, fecha_fin,
      saldoContable, saldoBancarioInput, diferenciaInicial,
      usuario_id, transaccionesContables.length
    ]);

    const conciliacionId = result.lastID;

    // Intentar match automático
    const matches = await intentarMatchAutomatico(conciliacionId, cuenta_id, fecha_inicio, fecha_fin);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        conciliacion_id: conciliacionId,
        cuenta: {
          id: cuenta.id,
          banco: cuenta.banco,
          cuenta_numero: cuenta.cuenta_numero,
          moneda: cuenta.moneda
        },
        periodo: { fecha_inicio, fecha_fin },
        saldos: {
          contable: saldoContable,
          bancario: saldoBancarioInput,
          diferencia: diferenciaInicial
        },
        transacciones_pendientes: transaccionesContables.length,
        matches_automaticos: matches,
        estado: 'en_progreso'
      },
      ui_components: {
        wizard: 'conciliacion_wizard',
        table: 'transacciones_match'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/conciliacion/:id/completar - Completar conciliación
router.post('/conciliacion/:id/completar', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id = 1, observaciones = '' } = req.body;

    const conciliacion = await db.getAsync(`
      SELECT 
        c.*, cb.banco, cb.cuenta_numero
      FROM conciliaciones_bancarias c
      JOIN cuentas_bancarias cb ON c.cuenta_id = cb.id
      WHERE c.id = ?
    `, [id]);

    if (!conciliacion) {
      return res.status(404).json({
        status: 'error',
        message: 'Conciliación no encontrada'
      });
    }

    if (conciliacion.estado === 'completada') {
      return res.status(400).json({
        status: 'error',
        message: 'La conciliación ya está completada'
      });
    }

    // Verificar diferencias pendientes
    const diferenciasPendientes = await db.getAsync(`
      SELECT COUNT(*) as count FROM conciliacion_diferencias
      WHERE conciliacion_id = ? AND estado = 'pendiente'
    `, [id]);

    if (diferenciasPendientes.count > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Existen ${diferenciasPendientes.count} diferencias pendientes por resolver`,
        data: { diferencias_pendientes: diferenciasPendientes.count }
      });
    }

    // Completar conciliación
    await db.runAsync(`
      UPDATE conciliaciones_bancarias 
      SET estado = 'completada',
          fecha_completado = datetime('now'),
          usuario_completado = ?,
          observaciones = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [usuario_id, observaciones, id]);

    // Actualizar fecha de última conciliación en la cuenta
    await db.runAsync(`
      UPDATE cuentas_bancarias 
      SET ultima_conciliacion = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [conciliacion.fecha_fin, conciliacion.cuenta_id]);

    // Marcar transacciones como conciliadas
    await db.runAsync(`
      UPDATE transacciones_bancarias 
      SET conciliada = 1,
          fecha_conciliacion = datetime('now'),
          conciliacion_id = ?
      WHERE cuenta_id = ? 
        AND fecha BETWEEN ? AND ?
        AND conciliada = 0
    `, [id, conciliacion.cuenta_id, conciliacion.fecha_inicio, conciliacion.fecha_fin]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        conciliacion_id: parseInt(id),
        cuenta: {
          banco: conciliacion.banco,
          cuenta_numero: conciliacion.cuenta_numero
        },
        estado: 'completada',
        fecha_completado: new Date().toISOString(),
        periodo: {
          fecha_inicio: conciliacion.fecha_inicio,
          fecha_fin: conciliacion.fecha_fin
        },
        resultado: {
          saldo_contable: conciliacion.saldo_contable,
          saldo_bancario: conciliacion.saldo_bancario,
          diferencia_final: conciliacion.diferencia
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// ENDPOINTS DE ALERTAS
// ============================================

// GET /api/alertas - Listar alertas de cierre
router.get('/api/alertas', async (req, res) => {
  try {
    const { 
      empresa_id = 1, 
      nivel, 
      resuelta = '0',
      cierre_id,
      limit = 50 
    } = req.query;

    let query = `
      SELECT 
        a.id, a.cierre_id, a.tipo, a.mensaje, a.nivel,
        a.fecha_creacion, a.fecha_resolucion, a.resuelta,
        a.usuario_resolucion, a.observaciones,
        cm.anio, cm.mes
      FROM alertas_cierre a
      LEFT JOIN cierres_mensuales cm ON a.cierre_id = cm.id
      WHERE a.empresa_id = ?
    `;
    
    const params = [empresa_id];

    if (nivel) {
      query += ` AND a.nivel = ?`;
      params.push(nivel);
    }

    if (resuelta !== undefined) {
      query += ` AND a.resuelta = ?`;
      params.push(resuelta === '1' || resuelta === 'true' ? 1 : 0);
    }

    if (cierre_id) {
      query += ` AND a.cierre_id = ?`;
      params.push(cierre_id);
    }

    query += ` ORDER BY 
      CASE a.nivel 
        WHEN 'critico' THEN 1 
        WHEN 'alto' THEN 2 
        WHEN 'medio' THEN 3 
        ELSE 4 
      END,
      a.fecha_creacion DESC
      LIMIT ?`;
    params.push(parseInt(limit));

    const alertas = await db.allAsync(query, params);

    // Estadísticas de alertas
    const stats = await db.getAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN resuelta = 0 THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN nivel = 'critico' AND resuelta = 0 THEN 1 ELSE 0 END) as criticas,
        SUM(CASE WHEN nivel = 'alto' AND resuelta = 0 THEN 1 ELSE 0 END) as altas,
        SUM(CASE WHEN nivel = 'medio' AND resuelta = 0 THEN 1 ELSE 0 END) as medias,
        SUM(CASE WHEN nivel = 'bajo' AND resuelta = 0 THEN 1 ELSE 0 END) as bajas
      FROM alertas_cierre 
      WHERE empresa_id = ?
    `, [empresa_id]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        estadisticas: stats,
        alertas: alertas.map(a => ({
          ...a,
          resuelta: !!a.resuelta,
          periodo: a.anio ? `${a.mes}/${a.anio}` : null
        }))
      },
      ui_components: {
        alerts_list: 'alerts_panel',
        stats_cards: 'alert_stats_cards'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function obtenerNombreMes(mes) {
  const meses = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[parseInt(mes)] || mes;
}

async function obtenerEstadisticasPeriodo(anio, mes, empresaId) {
  try {
    // Estadísticas contables del período
    const asientos = await db.getAsync(`
      SELECT 
        COUNT(*) as total_asientos,
        SUM(debe) as total_debe,
        SUM(haber) as total_haber
      FROM asientos 
      WHERE empresa_id = ? AND strftime('%Y-%m', fecha) = ?
    `, [empresaId, `${anio}-${mes.toString().padStart(2, '0')}`]);

    const transacciones = await db.getAsync(`
      SELECT COUNT(*) as count 
      FROM transacciones_bancarias 
      WHERE empresa_id = ? AND strftime('%Y-%m', fecha) = ?
    `, [empresaId, `${anio}-${mes.toString().padStart(2, '0')}`]);

    return {
      total_asientos: asientos.total_asientos || 0,
      total_debe: asientos.total_debe || 0,
      total_haber: asientos.total_haber || 0,
      balance_diferencia: Math.abs((asientos.total_debe || 0) - (asientos.total_haber || 0)),
      transacciones_bancarias: transacciones.count || 0
    };
  } catch (error) {
    return {
      total_asientos: 0,
      total_debe: 0,
      total_haber: 0,
      balance_diferencia: 0,
      transacciones_bancarias: 0
    };
  }
}

async function calcularProgresoCierre(cierreId) {
  try {
    const resultado = await db.getAsync(`
      SELECT 
        ROUND(CAST(SUM(CASE WHEN completado = 1 THEN 1 ELSE 0 END) AS FLOAT) / 
        CAST(COUNT(*) AS FLOAT) * 100) as progreso
      FROM cierre_checklist 
      WHERE cierre_id = ?
    `, [cierreId]);
    return resultado.progreso || 0;
  } catch (error) {
    return 0;
  }
}

async function crearAlertasIniciales(cierreId, anio, mes, empresaId) {
  const alertasIniciales = [
    { tipo: 'recordatorio', mensaje: 'Verificar saldos iniciales del período', nivel: 'medio' },
    { tipo: 'recordatorio', mensaje: 'Revisar asientos pendientes de aprobación', nivel: 'bajo' }
  ];

  for (const alerta of alertasIniciales) {
    await db.runAsync(`
      INSERT INTO alertas_cierre (cierre_id, empresa_id, tipo, mensaje, nivel, fecha_creacion, resuelta)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 0)
    `, [cierreId, empresaId, alerta.tipo, alerta.mensaje, alerta.nivel]);
  }
}

async function generarAsientoCierre(anio, mes, empresaId) {
  try {
    const result = await db.runAsync(`
      INSERT INTO asientos (empresa_id, fecha, cuenta_codigo, cuenta_nombre, descripcion, debe, haber, documento)
      VALUES (?, ?, '9999', 'Cierre del período', ?, 0, 0, ?)
    `, [
      empresaId, 
      `${anio}-${mes.toString().padStart(2, '0')}-28`,
      `Asiento de cierre ${mes}/${anio}`,
      `CIERRE-${anio}-${mes}`
    ]);
    return result.lastID;
  } catch (error) {
    return null;
  }
}

async function intentarMatchAutomatico(conciliacionId, cuentaId, fechaInicio, fechaFin) {
  // Simulación de matching automático
  // En producción, esto compararía transacciones con el estado de cuenta
  try {
    const transacciones = await db.allAsync(`
      SELECT id, referencia, monto 
      FROM transacciones_bancarias 
      WHERE cuenta_id = ? AND fecha BETWEEN ? AND ? AND conciliada = 0
      LIMIT 10
    `, [cuentaId, fechaInicio, fechaFin]);

    let matches = 0;
    for (const trans of transacciones) {
      // Simular match exitoso para algunas transacciones
      if (Math.random() > 0.3) {
        await db.runAsync(`
          INSERT INTO conciliacion_matches (conciliacion_id, transaccion_id, estado, fecha_match)
          VALUES (?, ?, 'automatico', datetime('now'))
        `, [conciliacionId, trans.id]);
        matches++;
      }
    }

    await db.runAsync(`
      UPDATE conciliaciones_bancarias 
      SET transacciones_encontradas = ?
      WHERE id = ?
    `, [matches, conciliacionId]);

    return matches;
  } catch (error) {
    return 0;
  }
}

module.exports = router;
