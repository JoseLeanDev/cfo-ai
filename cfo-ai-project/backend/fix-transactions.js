const db = require('./database/connection');

async function fixTransactions() {
  try {
    console.log('🔧 Corrigiendo transacciones...\n');
    
    // 1. Verificar cuentas contables existentes
    const cuentas = await db.allAsync('SELECT id, codigo, nombre, tipo FROM cuentas_contables');
    console.log('Cuentas contables:', cuentas.length);
    cuentas.forEach(c => console.log('  -', c.codigo, c.nombre, '(' + c.tipo + ')'));
    
    // 2. Verificar transacciones actuales
    const trans = await db.allAsync('SELECT COUNT(*) as count FROM transacciones');
    console.log('\nTransacciones existentes:', trans[0].count);
    
    // 3. Encontrar cuentas de ingresos y gastos
    const cuentaIngresos = cuentas.find(c => c.codigo === '4100');
    const cuentaGastos = cuentas.find(c => c.codigo === '5100');
    
    if (!cuentaIngresos || !cuentaGastos) {
      console.log('\n❌ No se encontraron cuentas de ingresos/gastos');
      return;
    }
    
    console.log('\n✅ Cuentas encontradas:');
    console.log('  Ingresos:', cuentaIngresos.id, cuentaIngresos.nombre);
    console.log('  Gastos:', cuentaGastos.id, cuentaGastos.nombre);
    
    // 4. Actualizar transacciones de entrada (ingresos)
    await db.runAsync(`
      UPDATE transacciones 
      SET cuenta_id = $1, tipo = 'haber' 
      WHERE tipo = 'entrada' AND (cuenta_id IS NULL OR cuenta_id = 0)
    `, [cuentaIngresos.id]);
    console.log('\n✅ Transacciones de entrada actualizadas');
    
    // 5. Actualizar transacciones de salida (gastos)  
    await db.runAsync(`
      UPDATE transacciones 
      SET cuenta_id = $1, tipo = 'debe' 
      WHERE tipo = 'salida' AND (cuenta_id IS NULL OR cuenta_id = 0)
    `, [cuentaGastos.id]);
    console.log('✅ Transacciones de salida actualizadas');
    
    // 6. Verificar transacciones actualizadas
    const updated = await db.allAsync(`
      SELECT COUNT(*) as count FROM transacciones WHERE cuenta_id IS NOT NULL
    `);
    console.log('\nTransacciones con cuenta_id:', updated[0].count);
    
    // 7. Calcular totales
    const ingresos = await db.getAsync(`
      SELECT SUM(CASE WHEN tipo = 'haber' THEN monto ELSE -monto END) as total
      FROM transacciones 
      WHERE cuenta_id = $1 AND estado = 'activa'
    `, [cuentaIngresos.id]);
    
    const gastos = await db.getAsync(`
      SELECT SUM(CASE WHEN tipo = 'debe' THEN monto ELSE -monto END) as total
      FROM transacciones 
      WHERE cuenta_id = $1 AND estado = 'activa'
    `, [cuentaGastos.id]);
    
    console.log('\n📊 Resultados:');
    console.log('  Total ingresos:', 'Q' + (parseFloat(ingresos?.total || 0)).toLocaleString());
    console.log('  Total gastos:', 'Q' + (parseFloat(gastos?.total || 0)).toLocaleString());
    console.log('  Utilidad neta:', 'Q' + (parseFloat(ingresos?.total || 0) - parseFloat(gastos?.total || 0)).toLocaleString());
    
    console.log('\n✅ Datos corregidos exitosamente');
  } catch(e) {
    console.error('\n❌ Error:', e.message);
    console.error(e.stack);
  }
}

fixTransactions().then(() => process.exit(0));
