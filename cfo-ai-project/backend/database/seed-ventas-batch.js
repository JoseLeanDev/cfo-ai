/**
 * Seed optimizado para ventas detalladas (batch inserts)
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

async function seedVentasBatch() {
  console.log('🌱 SEED OPTIMIZADO DE VENTAS\n');
  const startTime = Date.now();
  const client = await pool.connect();

  try {
    // Obtener vendedores existentes
    const allVendedores = await client.query('SELECT id FROM vendedores WHERE activo = TRUE');
    const allVendedorIds = allVendedores.rows.map(r => r.id);
    console.log(`👤 ${allVendedorIds.length} vendedores`);

    // Obtener productos con precio/costo más reciente
    const productos = await client.query(`
      SELECT DISTINCT ON (p.id) p.id, ph.precio_promedio_realizado as precio, ph.costo_unitario as costo
      FROM productos p
      JOIN productos_historial ph ON p.id = ph.producto_id
      WHERE p.activo = TRUE
      ORDER BY p.id, ph.fecha DESC
    `);
    console.log(`📦 ${productos.rows.length} productos`);

    // Verificar cuántas ventas ya existen
    const existing = await client.query('SELECT COUNT(*) FROM ventas_detalle');
    const yaInsertadas = parseInt(existing.rows[0].count);
    const necesarias = 3600;
    const faltan = necesarias - yaInsertadas;

    if (faltan <= 0) {
      console.log('✅ Ya hay suficientes ventas');
      return;
    }

    console.log(`💰 Insertando ${faltan} ventas restantes...`);

    const fechaInicio = new Date('2025-08-01');
    const registros = [];

    for (let i = 0; i < faltan; i++) {
      const mes = Math.floor(i / 300);
      const producto = productos.rows[Math.floor(Math.random() * productos.rows.length)];
      const vendedorId = allVendedorIds[Math.floor(Math.random() * allVendedorIds.length)];
      const cliente = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
      
      const fechaBase = new Date(fechaInicio);
      fechaBase.setMonth(fechaBase.getMonth() + mes);
      const dia = Math.floor(Math.random() * 28) + 1;
      const fecha = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), dia);
      
      const cantidad = Math.floor(Math.random() * 50) + 5;
      const precioUnitario = (producto.precio * (0.95 + Math.random() * 0.1)).toFixed(2);
      const costoUnitario = (producto.costo * (0.95 + Math.random() * 0.1)).toFixed(2);

      registros.push([1, fecha.toISOString().split('T')[0], producto.id, cliente, vendedorId, cantidad, precioUnitario, costoUnitario]);
    }

    // Insertar en batches de 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const batch = registros.slice(i, i + BATCH_SIZE);
      const values = batch.map((r, idx) => {
        const base = idx * 8;
        return `(\$${base + 1}, \$${base + 2}, \$${base + 3}, \$${base + 4}, \$${base + 5}, \$${base + 6}, \$${base + 7}, \$${base + 8})`;
      }).join(',');
      
      const params = batch.flat();
      await client.query(
        `INSERT INTO ventas_detalle (empresa_id, fecha, producto_id, cliente_nombre, vendedor_id, cantidad, precio_unitario, costo_unitario) VALUES ${values}`,
        params
      );
      process.stdout.write('.');
    }

    const final = await client.query('SELECT COUNT(*) FROM ventas_detalle');
    console.log(`\n✅ Total ventas: ${final.rows[0].count} en ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seedVentasBatch();
