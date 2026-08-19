// Script para escalar datos de ventas_detalle a números realistas para demo Guatemala
const db = require('./database/connection');

async function scaleToRealisticNumbers() {
  console.log('🔄 Escalando datos a números realistas para demo Guatemala...');
  
  try {
    // Ver datos actuales
    const before = await db.getAsync(`
      SELECT 
        COUNT(*) as count,
        SUM(total_venta) as total_ventas,
        SUM(margen_q) as total_margen,
        AVG(precio_unitario) as avg_precio,
        MAX(precio_unitario) as max_precio
      FROM ventas_detalle
    `);
    
    console.log('📊 ANTES:');
    console.log('  Transacciones:', before.count);
    console.log('  Total ventas Q:', before.total_ventas);
    console.log('  Total margen Q:', before.total_margen);
    console.log('  Precio promedio:', before.avg_precio);
    console.log('  Precio máximo:', before.max_precio);
    
    // Factor de escala: ~14.5B → ~120M (dividir por ~120)
    const SCALE_FACTOR = 120;
    
    console.log(`\n🔧 Paso 1: Escalando precios unitarios...`);
    await db.runAsync(`
      UPDATE ventas_detalle
      SET 
        precio_unitario = ROUND((precio_unitario / ${SCALE_FACTOR})::numeric, 2),
        costo_unitario = ROUND((costo_unitario / ${SCALE_FACTOR})::numeric, 2)
    `);
    
    console.log(`🔧 Paso 2: Recalculando totales...`);
    await db.runAsync(`
      UPDATE ventas_detalle
      SET 
        total_venta = ROUND((cantidad * precio_unitario)::numeric, 2),
        total_costo = ROUND((cantidad * costo_unitario)::numeric, 2),
        margen_q = ROUND((cantidad * (precio_unitario - costo_unitario))::numeric, 2),
        margen_pct = CASE 
          WHEN precio_unitario > 0 
          THEN ROUND(((precio_unitario - costo_unitario) / precio_unitario * 100)::numeric, 2)
          ELSE 0 
        END
    `);
    
    // Verificar después
    const after = await db.getAsync(`
      SELECT 
        COUNT(*) as count,
        SUM(total_venta) as total_ventas,
        SUM(margen_q) as total_margen,
        AVG(precio_unitario) as avg_precio,
        MAX(precio_unitario) as max_precio,
        AVG(margen_pct) as avg_margen
      FROM ventas_detalle
    `);
    
    console.log('\n✅ DESPUÉS:');
    console.log('  Transacciones:', after.count);
    console.log('  Total ventas Q:', after.total_ventas);
    console.log('  Total margen Q:', after.total_margen);
    console.log('  Precio promedio:', after.avg_precio);
    console.log('  Precio máximo:', after.max_precio);
    console.log('  Margen promedio %:', after.avg_margen);
    
    console.log('\n🎉 Datos escalados correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

scaleToRealisticNumbers();
