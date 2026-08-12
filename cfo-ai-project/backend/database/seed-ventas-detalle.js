/**
 * Seed script para vendedores y ventas detalladas
 * Genera datos de demo para margen por vendedor, cliente y línea
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const VENDEDORES = [
  { nombre: 'Carlos Ramírez', email: 'c.ramirez@dicsa.com.gt', telefono: '+502 3012-4501', meta: 450000 },
  { nombre: 'María Fernández', email: 'm.fernandez@dicsa.com.gt', telefono: '+502 3012-4502', meta: 500000 },
  { nombre: 'Jorge Castellanos', email: 'j.castellanos@dicsa.com.gt', telefono: '+502 3012-4503', meta: 400000 },
  { nombre: 'Ana Lucía Morales', email: 'a.morales@dicsa.com.gt', telefono: '+502 3012-4504', meta: 480000 },
  { nombre: 'Roberto Álvarez', email: 'r.alvarez@dicsa.com.gt', telefono: '+502 3012-4505', meta: 420000 },
  { nombre: 'Diana Hernández', email: 'd.hernandez@dicsa.com.gt', telefono: '+502 3012-4506', meta: 380000 },
];

const CLIENTES = [
  'Supermercados La Bodeguita, S.A.',
  'Corporación El Sol, S.A.',
  'Tiendas El Mercado, S.A.',
  'Abarrotería Central, S.A.',
  'Cafetería El Buen Café',
  'Restaurante Los 3 Tiempos',
  'Hotel Casa Grande',
  'Farmacias del Pueblo',
  'Dist. Bebidas del Sur',
  'Comercial El Triunfo',
  'Minisúper La Esquina',
  'Puesto de Flores María',
  'Tienda La Bendición',
  'Despensa Familiar',
  'Comercial Santa Clara',
  'Industrias del Plástico GT',
  'Empaques Centroamericanos',
  'Plásticos del Norte, S.A.',
  'Inyecciones Técnicas',
  'Soluciones de Empaque',
];

async function seedVentas() {
  console.log('🌱 SEED DE VENDEDORES Y VENTAS DETALLADAS\n');
  const startTime = Date.now();
  const client = await pool.connect();

  try {
    // 1. Insertar vendedores
    console.log('👤 Insertando vendedores...');
    const vendedorIds = [];
    for (const v of VENDEDORES) {
      const result = await client.query(
        `INSERT INTO vendedores (empresa_id, nombre, email, telefono, meta_mensual, activo)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [1, v.nombre, v.email, v.telefono, v.meta]
      );
      if (result.rows.length > 0) {
        vendedorIds.push(result.rows[0].id);
      }
    }
    console.log(`   ✅ ${vendedorIds.length} vendedores insertados`);

    // Obtener todos los vendedores existentes
    const allVendedores = await client.query('SELECT id FROM vendedores WHERE activo = TRUE');
    const allVendedorIds = allVendedores.rows.map(r => r.id);

    // 2. Obtener productos con su precio/costo más reciente
    const productos = await client.query(`
      SELECT DISTINCT ON (p.id) p.id, ph.precio_promedio_realizado as precio, ph.costo_unitario as costo
      FROM productos p
      JOIN productos_historial ph ON p.id = ph.producto_id
      WHERE p.activo = TRUE
      ORDER BY p.id, ph.fecha DESC
    `);
    console.log(`   📦 ${productos.rows.length} productos encontrados`);

    // 3. Generar ventas (últimos 12 meses, ~300 ventas/mes = ~3600 ventas)
    const meses = 12;
    const ventasPorMes = 300;
    const fechaInicio = new Date('2025-08-01');

    console.log(`\n💰 Generando ${meses * ventasPorMes} ventas detalladas...`);

    let totalVentas = 0;

    for (let mes = 0; mes < meses; mes++) {
      const fechaBase = new Date(fechaInicio);
      fechaBase.setMonth(fechaBase.getMonth() + mes);

      for (let i = 0; i < ventasPorMes; i++) {
        const producto = productos.rows[Math.floor(Math.random() * productos.rows.length)];
        const vendedorId = allVendedorIds[Math.floor(Math.random() * allVendedorIds.length)];
        const cliente = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
        
        // Fecha aleatoria dentro del mes
        const dia = Math.floor(Math.random() * 28) + 1;
        const fecha = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), dia);

        // Cantidad basada en rotación (simulada)
        const cantidad = Math.floor(Math.random() * 50) + 5;

        // Precio y costo con variación del +/- 5%
        const precioUnitario = producto.precio * (0.95 + Math.random() * 0.1);
        const costoUnitario = producto.costo * (0.95 + Math.random() * 0.1);

        await client.query(
          `INSERT INTO ventas_detalle (empresa_id, fecha, producto_id, cliente_nombre, vendedor_id, cantidad, precio_unitario, costo_unitario)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [1, fecha.toISOString().split('T')[0], producto.id, cliente, vendedorId, cantidad, precioUnitario.toFixed(2), costoUnitario.toFixed(2)]
        );

        totalVentas++;
        if (totalVentas % 500 === 0) process.stdout.write('.');
      }
    }

    console.log(`\n\n✅ Seed completado en ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log(`   👤 ${allVendedorIds.length} vendedores`);
    console.log(`   💰 ${totalVentas} ventas detalladas generadas`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seedVentas();
