const express = require('express');
const router = express.Router();
const db = require('../../database/connection');

// POST /api/admin/reset-cuentas - Limpia y recrea las cuentas bancarias
router.post('/reset-cuentas', async (req, res) => {
  try {
    // Borrar todas las cuentas
    await db.runAsync('DELETE FROM cuentas_bancarias');
    console.log('✅ Cuentas borradas');

    // Insertar solo 3 cuentas realistas
    const cuentas = [
      { banco: 'Banco Industrial', tipo: 'monetaria', numero: '019-012345-6', saldo: 1250000, moneda: 'GTQ' },
      { banco: 'BAC Credomatic', tipo: 'monetaria', numero: '789-456123-0', saldo: 520000, moneda: 'GTQ' },
      { banco: 'Banco Agromercantil', tipo: 'ahorro', numero: '156-789234-1', saldo: 185000, moneda: 'USD' },
    ];

    for (const cuenta of cuentas) {
      await db.runAsync(`
        INSERT INTO cuentas_bancarias (empresa_id, banco, tipo, numero_cuenta, saldo, moneda, activa)
        VALUES (?, ?, ?, ?, ?, ?, TRUE)
      `, [1, cuenta.banco, cuenta.tipo, cuenta.numero, cuenta.saldo, cuenta.moneda]);
      console.log('✅', cuenta.banco, cuenta.moneda, cuenta.saldo);
    }

    // Verificar
    const rows = await db.allAsync('SELECT id, banco, moneda, saldo FROM cuentas_bancarias');
    
    res.json({
      status: 'success',
      message: 'Cuentas bancarias reseteadas exitosamente',
      data: {
        total_cuentas: rows.length,
        cuentas: rows
      }
    });
  } catch (error) {
    console.error('❌ Error reseteando cuentas:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
