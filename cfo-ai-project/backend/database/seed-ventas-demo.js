/**
 * Seed para vendedores, clientes y ventas
 * Genera datos de demo para las vistas de margen por vendedor/cliente/linea
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const VENDEDORES = [
  { id: 1, nombre: 'Carlos Mendez', email: 'cmendez@empresa.com' },
  { id: 2, nombre: 'Ana Rodriguez', email: 'arodriguez@empresa.com' },
  { id: 3, nombre: 'Luis Torres', email: 'ltorres@empresa.com' },
  { id: 4, nombre: 'Maria Garcia', email: 'mgarcia@empresa.com' },
  { id: 5, nombre: 'Pedro Sanchez', email: 'psanchez@empresa.com' },
];

const CLIENTES = [
  'Industrias del Plástico SA', 'Empaques Centroamericanos', 'Química Industrial GT',
  'Plásticos del Norte', 'Soluciones de Empaque', 'Polímeros de Guatemala',
  'Inyección Moderna', 'Flexible Packaging GT', 'Resinas del Sur', 'Masterbatch Centroamérica'
];

function rnd(min, max) { return Math.random() * (max - min) + min; }
function r2(v) { return Math.round(v * 100) / 100; }

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Limpiar ventas existentes
    await client.query('TRUNCATE TABLE ventas_detalle RESTART IDENTITY');
    await client.query('DELETE FROM vendedores');
    await client.query('DELETE FROM clientes');

    // Insertar vendedores
    for (const v of VENDEDORES) {
      await client.query(
        'INSERT INTO vendedores (id, empresa_id, nombre, email, activo) VALUES ($1, 1, $2, $3, TRUE)',
        [v.id, v.nombre, v.email]
      );
    }
    console.log('👥 5 vendedores insertados');

    // Insertar clientes
    for (let i = 0; i < CLIENTES.length; i++) {
      await client.query(
        'INSERT INTO clientes (empresa_id, codigo, nombre, tipo, activo) VALUES (1, $1, $2, $3, TRUE)',
        [`CLI-${String(i+1).padStart(3, '0')}`, CLIENTES[i], i < 3 ? 'vip' : 'regular']
      );
    }
    console.log('🏢 10 clientes insertados');

    // Obtener productos
    const prodResult = await client.query('SELECT id, precio_actual, costo_actual FROM vw_margen_productos');
    const productos = prodResult.rows;
    console.log(`📦 ${productos.length} productos para generar ventas`);

    // Generar ventas: 24 meses, 5 vendedores, 10 clientes, productos aleatorios
    const ventas = [];
    const fechaBase = new Date('2024-01-01');

    // Vendedores con diferentes desempeños de margen:
    // vendedor 1 = bueno (margen alto), vendedor 3 = regular, vendedor 5 = bajo (concesiones de precio)
    const vendedorFactor = { 1: 1.02, 2: 1.0, 3: 0.98, 4: 1.01, 5: 0.95 };

    for (let mes = 0; mes < 24; mes++) {
      const fecha = new Date(fechaBase);
      fecha.setMonth(fecha.getMonth() + mes);
      const fechaStr = fecha.toISOString().split('T')[0];

      // Cada mes generamos ~200 transacciones
      const numTrans = 180 + Math.floor(Math.random() * 40);

      for (let t = 0; t < numTrans; t++) {
        const vendedorId = VENDEDORES[Math.floor(Math.random() * VENDEDORES.length)].id;
        const clienteNombre = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
        const producto = productos[Math.floor(Math.random() * productos.length)];

        const cantidad = Math.floor(rnd(10, 500));
        // Precio con factor del vendedor (algunos venden más barato)
        const precioUnitario = producto.precio_actual * vendedorFactor[vendedorId] * (0.98 + Math.random() * 0.04);
        const costoUnitario = producto.costo_actual * (0.97 + Math.random() * 0.06);

        ventas.push([vendedorId, clienteNombre, producto.id, fechaStr, r2(cantidad), r2(precioUnitario), r2(costoUnitario)]);
      }
    }

    // Insertar ventas en batches
    for (let i = 0; i < ventas.length; i += 500) {
      const batch = ventas.slice(i, i + 500);
      const vals = batch.map((_, j) => {
        const b = j * 7;
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7})`;
      }).join(',');
      await client.query(
        `INSERT INTO ventas_detalle (vendedor_id, cliente_nombre, producto_id, fecha, cantidad, precio_unitario, costo_unitario) VALUES ${vals}`,
        batch.flat()
      );
      if (i % 2000 === 0) process.stdout.write('.');
    }

    await client.query('COMMIT');
    console.log(`\n💰 ${ventas.length} transacciones de ventas insertadas`);

    // Verificar vistas
    const v = await client.query('SELECT COUNT(*) FROM vw_margen_vendedor');
    const c = await client.query('SELECT COUNT(*) FROM vw_margen_cliente');
    const l = await client.query('SELECT COUNT(*) FROM vw_margen_linea');
    console.log(`\n📊 Vistas:`);
    console.log(`   Vendedores: ${v.rows[0].count}`);
    console.log(`   Clientes: ${c.rows[0].count}`);
    console.log(`   Líneas: ${l.rows[0].count}`);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
