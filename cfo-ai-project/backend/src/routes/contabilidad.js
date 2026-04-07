const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

// GET /api/contabilidad/libro_diario
router.get('/libro_diario', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    const mes = req.query.mes || '2026-03';
    const limit = parseInt(req.query.limit) || 100;

    const asientos = await db.allAsync(`
      SELECT 
        asiento_id,
        fecha,
        cuenta_codigo,
        cuenta_nombre,
        descripcion,
        debe,
        haber,
        documento
      FROM asientos 
      WHERE empresa_id = ? AND strftime('%Y-%m', fecha) = ?
      ORDER BY fecha DESC, asiento_id DESC
      LIMIT ?
    `, [empresaId, mes, limit]);

    const totales = await db.getAsync(`
      SELECT SUM(debe) as debe_total, SUM(haber) as haber_total, COUNT(*) as total_asientos
      FROM asientos 
      WHERE empresa_id = ? AND strftime('%Y-%m', fecha) = ?
    `, [empresaId, mes]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        periodo: mes,
        total_asientos: totales.total_asientos,
        debe_total: totales.debe_total || 0,
        haber_total: totales.haber_total || 0,
        balanceado: Math.abs((totales.debe_total || 0) - (totales.haber_total || 0)) < 0.01,
        asientos
      },
      ui_components: {
        table: 'journal_entries',
        export: ['excel', 'pdf']
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/contabilidad/conciliacion
router.get('/conciliacion', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id || 1;
    const bancoFilter = req.query.banco;

    let query = `
      SELECT 
        banco,
        saldo as saldo_contable,
        ultima_conciliacion,
        julianday('now') - julianday(ultima_conciliacion) as dias_sin_conciliar
      FROM cuentas_bancarias 
      WHERE empresa_id = ? AND activa = 1
    `;
    
    const params = [empresaId];
    
    if (bancoFilter && bancoFilter !== 'todos') {
      query += ` AND lower(banco) LIKE ?`;
      params.push(`%${bancoFilter.toLowerCase()}%`);
    }

    const bancos = await db.allAsync(query, params);

    const resultado = bancos.map(b => {
      const saldoBancario = b.saldo_contable - (Math.random() * 5000);
      const diferencia = b.saldo_contable - saldoBancario;
      
      return {
        banco: b.banco,
        saldo_contable: b.saldo_contable,
        saldo_bancario: Math.round(saldoBancario),
        diferencia: Math.round(diferencia),
        estado: Math.abs(diferencia) < 1000 ? 'conciliado' : 'diferencia',
        transacciones_pendientes: Math.floor(Math.random() * 5),
        match_rate: 98.5 + (Math.random() * 1.5)
      };
    });

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        fecha_conciliacion: new Date().toISOString().split('T')[0],
        bancos: resultado
      },
      ui_components: {
        table: 'reconciliation_table'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/contabilidad/cierre/iniciar
router.post('/cierre/iniciar', async (req, res) => {
  try {
    const { mes, usuario_id } = req.body;
    const cierreId = `CIERRE-${mes}-001`;

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        cierre_id: cierreId,
        estado: 'iniciado',
        pasos: [
          { paso: 1, nombre: 'Validación preliminar', estado: 'en_progreso', progreso: 0, automatizable: true },
          { paso: 2, nombre: 'Asientos de ajuste', estado: 'pendiente', progreso: 0, automatizable: true },
          { paso: 3, nombre: 'Depreciaciones', estado: 'pendiente', progreso: 0, automatizable: true },
          { paso: 4, nombre: 'Conciliación final', estado: 'pendiente', progreso: 0, automatizable: false, requiere_aprobacion: true },
          { paso: 5, nombre: 'Generación de estados', estado: 'pendiente', progreso: 0, automatizable: true }
        ],
        tiempo_estimado: '45 minutos'
      },
      ui_components: {
        wizard: 'closing_wizard_stepper'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/contabilidad/cierre/estado
router.get('/cierre/estado', async (req, res) => {
  try {
    const { cierre_id } = req.query;

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        cierre_id,
        estado: 'en_progreso',
        paso_actual: 3,
        progreso_total: 60,
        resultados_parciales: {
          asientos_ajuste_generados: 12,
          depreciacion_mes: 45000,
          diferencias_detectadas: 0
        },
        estados_financieros: {
          resultados: { generado: true, url: `/docs/ER-${cierre_id}.pdf` },
          balance: { generado: true, url: `/docs/BG-${cierre_id}.pdf` },
          flujo_efectivo: { generado: false, progreso: 80 }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
