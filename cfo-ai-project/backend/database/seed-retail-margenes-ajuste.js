/**
 * Ajustar historial para crear variación realista de márgenes
 * Algunos productos con caída de margen (rojo/ambar)
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function ajustarMargenes() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔧 Ajustando márgenes para demo realista...\n');
    
    // Obtener productos activos
    const prods = await client.query('SELECT id, sku, nombre FROM productos WHERE empresa_id=1 AND activo=TRUE ORDER BY id');
    const productos = prods.rows;
    
    // Clasificar productos para variación:
    // - 15% rojo (caída fuerte de margen)
    // - 35% ambar (caída moderada)
    // - 50% verde (margen estable o mejorado)
    const numRojo = Math.ceil(productos.length * 0.15);
    const numAmbar = Math.ceil(productos.length * 0.35);
    
    const idsRojo = productos.slice(0, numRojo).map(p => p.id);
    const idsAmbar = productos.slice(numRojo, numRojo + numAmbar).map(p => p.id);
    const idsVerde = productos.slice(numRojo + numAmbar).map(p => p.id);
    
    console.log(`📊 Distribución planificada:`);
    console.log(`   🔴 Rojo: ${idsRojo.length} productos`);
    console.log(`   🟡 Ámbar: ${idsAmbar.length} productos`);
    console.log(`   🟢 Verde: ${idsVerde.length} productos\n`);
    
    // Para cada producto, ajustar los últimos 6 meses de historial
    const fechaCorte = '2024-12-01'; // A partir de aquí, diferente comportamiento
    
    for (const pid of idsRojo) {
      // Rojo: costo subió 15-25% en últimos 6 meses, precio solo 2-5%
      await client.query(`
        UPDATE productos_historial 
        SET costo_unitario = costo_unitario * (1.15 + random() * 0.10),
            precio_promedio_realizado = precio_promedio_realizado * (1.02 + random() * 0.03)
        WHERE producto_id = $1 AND fecha >= $2
      `, [pid, fechaCorte]);
    }
    
    for (const pid of idsAmbar) {
      // Ambar: costo subió 8-15%, precio solo 3-5%
      await client.query(`
        UPDATE productos_historial 
        SET costo_unitario = costo_unitario * (1.08 + random() * 0.07),
            precio_promedio_realizado = precio_promedio_realizado * (1.03 + random() * 0.02)
        WHERE producto_id = $1 AND fecha >= $2
      `, [pid, fechaCorte]);
    }
    
    for (const pid of idsVerde) {
      // Verde: precio subió 5-10%, costo solo 2-5% (margen mejora)
      await client.query(`
        UPDATE productos_historial 
        SET precio_promedio_realizado = precio_promedio_realizado * (1.05 + random() * 0.05),
            costo_unitario = costo_unitario * (1.02 + random() * 0.03)
        WHERE producto_id = $1 AND fecha >= $2
      `, [pid, fechaCorte]);
    }
    
    await client.query('COMMIT');
    
    // Verificar resultado
    const v = await client.query('SELECT semaforo, COUNT(*) FROM vw_margen_productos GROUP BY semaforo');
    console.log('✅ Resultado final:');
    for (const row of v.rows) {
      const emoji = row.semaforo === 'rojo' ? '🔴' : row.semaforo === 'ambar' ? '🟡' : '🟢';
      console.log(`   ${emoji} ${row.semaforo}: ${row.count} productos`);
    }
    
    // Muestra de productos en rojo
    const rojos = await client.query('SELECT sku, nombre, categoria, margen_pct_actual, margen_pct_historico, delta_puntos FROM vw_margen_productos WHERE semaforo = \'rojo\' LIMIT 3');
    if (rojos.rows.length > 0) {
      console.log('\n🔴 Productos con margen en caída:');
      for (const r of rojos.rows) {
        console.log(`   ${r.sku} | ${r.nombre} | Actual: ${parseFloat(r.margen_pct_actual).toFixed(1)}% | Hist: ${parseFloat(r.margen_pct_historico).toFixed(1)}% | Δ: ${parseFloat(r.delta_puntos).toFixed(1)} pts`);
      }
    }
    
    console.log('\n✅ Ajuste completado');
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

ajustarMargenes();
