const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

// GET /api/sat/calendario
router.get('/calendario', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    
    const obligaciones = await db.allAsync(`
      SELECT 
        obligacion,
        formulario,
        fecha_vencimiento,
        julianday(fecha_vencimiento) - julianday('now') as dias_restantes,
        monto_estimado,
        estado
      FROM obligaciones_sat 
      WHERE empresa_id = ?
      ORDER BY fecha_vencimiento
    `, [empresaId]);

    const stats = await db.getAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'presentada' THEN 1 ELSE 0 END) as presentadas,
        SUM(CASE WHEN estado = 'atrasada' THEN 1 ELSE 0 END) as con_retraso
      FROM obligaciones_sat 
      WHERE empresa_id = ? AND fecha_vencimiento >= date('now', '-1 year')
    `, [empresaId]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        fecha_consulta: new Date().toISOString().split('T')[0],
        proximos_vencimientos: obligaciones.map(o => ({
          ...o,
          dias_restantes: Math.ceil(o.dias_restantes),
          prioridad: o.dias_restantes <= 0 ? 'urgente' : o.dias_restantes <= 7 ? 'alta' : 'media',
          estado_preparacion: o.estado,
          accion_recomendada: o.dias_restantes <= 0 ? '🚨 URGENTE: Pagar hoy' : `Presentar antes del ${o.fecha_vencimiento}`
        })),
        estadisticas_cumplimiento: {
          declaraciones_ultimo_ano: stats.total,
          presentadas_tiempo: stats.presentadas,
          con_retraso: stats.con_retraso,
          score_cumplimiento: 92
        }
      },
      ui_components: {
        calendar: 'interactive_tax_calendar'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/sat/calculo/iva
router.get('/calculo/iva', async (req, res) => {
  try {
    const mes = req.query.mes || '2026-03';
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        periodo: mes,
        iva_debito: { total: 540000, detalle_por_tasa: [{ tasa: 12, monto: 540000 }] },
        iva_credito: { total: 385000, detalle_por_tasa: [{ tasa: 12, monto: 385000 }] },
        iva_neto: { valor: 155000, tipo: 'a_pagar' },
        retenciones_efectuadas: 45000,
        total_a_pagar: 110000,
        comparativo_mes_anterior: { mes_anterior: 142000, var: -22.5 }
      },
      ui_components: {
        summary: 'iva_calculation_summary'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/sat/calculo/isr
router.get('/calculo/isr', async (req, res) => {
  try {
    const { tipo, periodo } = req.query;
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        tipo_calculo: tipo || 'anticipado_mensual',
        periodo: periodo || '2026-03',
        base_gravable: {
          ingresos_mes: 4100000,
          coeficiente_utilidad: 0.085,
          base_calculada: 348500
        },
        tasa_aplicable: 0.05,
        isr_calculado: 17425,
        acumulado_anual: 52350,
        estimado_anual: 628200
      },
      ui_components: {
        calculation_steps: 'isr_breakdown'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/sat/dte/validacion
router.get('/dte/validacion', async (req, res) => {
  try {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        fecha_consulta: new Date().toISOString().split('T')[0],
        resumen: {
          total_emitidas: 145,
          enviadas_sat: 142,
          pendientes_envio: 2,
          con_error: 1,
          tasa_cumplimiento: 97.9
        },
        facturas_pendientes: [
          { numero: 'FCE-2026-001442', fecha: '2026-03-30', cliente: 'Tienda La Esquina', monto: 8500, estado: 'pendiente_envio', accion: 'Enviar a SAT inmediatamente' }
        ],
        facturas_error: [
          { numero: 'FCE-2026-001438', fecha: '2026-03-29', cliente: 'Distribuidora El Sol', monto: 45000, estado: 'rechazada_sat', error: 'NIT receptor inválido', accion: 'Corregir NIT y reenviar' }
        ]
      },
      ui_components: {
        gauge: 'compliance_percentage'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/sat/declaracion/preparar
router.post('/declaracion/preparar', async (req, res) => {
  try {
    const { obligacion } = req.body;
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        declaracion_id: `DEC-${obligacion}-001`,
        estado: 'lista_para_presentar',
        formulario: 'SAT-2231',
        datos_llenados: {
          casilla_1: { valor: 4100000, descripcion: 'Total ventas' },
          casilla_11: { valor: 540000, descripcion: 'IVA débito' },
          casilla_22: { valor: 385000, descripcion: 'IVA crédito' },
          casilla_28: { valor: 155000, descripcion: 'IVA a pagar' }
        },
        validaciones: [
          { tipo: 'advertencia', mensaje: 'Ventas 15% superiores a mes anterior, verificar consistencia' }
        ]
      },
      ui_components: {
        preview: 'form_preview'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
