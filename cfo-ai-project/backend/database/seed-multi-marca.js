/**
 * Seed para demo Multi-Marca, Multi-Tienda, Multi-País
 * Grupo Retail Centroamérica
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============================================
// CONFIGURACIÓN CORPORACIÓN RETAIL
// ============================================

const MARCAS = [
  { id: 1, codigo: 'MU', nombre: 'Moda Urbana', segmento: 'masivo', descripcion: 'Ropa casual y urbana para jóvenes' },
  { id: 2, codigo: 'SL', nombre: 'SportLife', segmento: 'premium', descripcion: 'Ropa y calzado deportivo' },
  { id: 3, codigo: 'CH', nombre: 'Casa & Hogar', segmento: 'masivo', descripcion: 'Artículos para el hogar' },
  { id: 4, codigo: 'TZ', nombre: 'TechZone', segmento: 'premium', descripcion: 'Electrónicos y tecnología' },
];

const TIENDAS = [
  // Guatemala (GT)
  { id: 1, marca_id: 1, pais_id: 1, codigo: 'MU-GT-01', nombre: 'Moda Urbana Oakland', ciudad: 'Guatemala', tipo: 'tienda', metros: 450 },
  { id: 2, marca_id: 1, pais_id: 1, codigo: 'MU-GT-02', nombre: 'Moda Urbana Miraflores', ciudad: 'Guatemala', tipo: 'tienda', metros: 380 },
  { id: 3, marca_id: 2, pais_id: 1, codigo: 'SL-GT-01', nombre: 'SportLife Paseo Cayalá', ciudad: 'Guatemala', tipo: 'tienda', metros: 520 },
  { id: 4, marca_id: 3, pais_id: 1, codigo: 'CH-GT-01', nombre: 'Casa & Hogar Pradera', ciudad: 'Guatemala', tipo: 'tienda', metros: 800 },
  { id: 5, marca_id: 4, pais_id: 1, codigo: 'TZ-GT-01', nombre: 'TechZone Galerías', ciudad: 'Guatemala', tipo: 'tienda', metros: 350 },
  { id: 6, marca_id: 1, pais_id: 1, codigo: 'MU-GT-03', nombre: 'Moda Urbana Xela', ciudad: 'Quetzaltenango', tipo: 'tienda', metros: 300 },
  
  // El Salvador (SV)
  { id: 7, marca_id: 1, pais_id: 2, codigo: 'MU-SV-01', nombre: 'Moda Urbana Multiplaza', ciudad: 'San Salvador', tipo: 'tienda', metros: 420 },
  { id: 8, marca_id: 2, pais_id: 2, codigo: 'SL-SV-01', nombre: 'SportLife La Gran Vía', ciudad: 'San Salvador', tipo: 'tienda', metros: 480 },
  { id: 9, marca_id: 4, pais_id: 2, codigo: 'TZ-SV-01', nombre: 'TechZone Metrocentro', ciudad: 'San Salvador', tipo: 'tienda', metros: 320 },
  
  // Honduras (HN)
  { id: 10, marca_id: 1, pais_id: 3, codigo: 'MU-HN-01', nombre: 'Moda Urbana City Mall', ciudad: 'Tegucigalpa', tipo: 'tienda', metros: 400 },
  { id: 11, marca_id: 3, pais_id: 3, codigo: 'CH-HN-01', nombre: 'Casa & Hogar Mall Multiplaza', ciudad: 'Tegucigalpa', tipo: 'tienda', metros: 650 },
  { id: 12, marca_id: 2, pais_id: 3, codigo: 'SL-HN-01', nombre: 'SportLife SPS', ciudad: 'San Pedro Sula', tipo: 'tienda', metros: 450 },
  
  // Costa Rica (CR)
  { id: 13, marca_id: 1, pais_id: 4, codigo: 'MU-CR-01', nombre: 'Moda Urbana Avenida Escazú', ciudad: 'San José', tipo: 'tienda', metros: 500 },
  { id: 14, marca_id: 4, pais_id: 4, codigo: 'TZ-CR-01', nombre: 'TechZone Terrazas Lindora', ciudad: 'San José', tipo: 'tienda', metros: 380 },
  { id: 15, marca_id: 2, pais_id: 4, codigo: 'SL-CR-01', nombre: 'SportLife Multiplaza Escazú', ciudad: 'San José', tipo: 'tienda', metros: 550 },
  
  // Nicaragua (NI)
  { id: 16, marca_id: 1, pais_id: 5, codigo: 'MU-NI-01', nombre: 'Moda Urbana Galerías', ciudad: 'Managua', tipo: 'tienda', metros: 350 },
  { id: 17, marca_id: 3, pais_id: 5, codigo: 'CH-NI-01', nombre: 'Casa & Hogar Metrocentro', ciudad: 'Managua', tipo: 'tienda', metros: 600 },
];

// Categorías por marca
const CATEGORIAS_POR_MARCA = {
  1: ['Ropa Hombre', 'Ropa Mujer', 'Accesorios'], // Moda Urbana
  2: ['Calzado', 'Deportes'], // SportLife
  3: ['Hogar'], // Casa & Hogar
  4: ['Electrónicos'], // TechZone
};

const VENDEDORES = [
  { id: 1, nombre: 'Sofía Torres', email: 'storres@gruporetail.com', tienda_id: 1 },
  { id: 2, nombre: 'Diego Hernández', email: 'dhernandez@gruporetail.com', tienda_id: 2 },
  { id: 3, nombre: 'Camila Ruiz', email: 'cruiz@gruporetail.com', tienda_id: 3 },
  { id: 4, nombre: 'Mateo Flores', email: 'mflores@gruporetail.com', tienda_id: 4 },
  { id: 5, nombre: 'Valentina Castillo', email: 'vcastillo@gruporetail.com', tienda_id: 5 },
  { id: 6, nombre: 'Lucas Morales', email: 'lmorales@gruporetail.com', tienda_id: 6 },
  { id: 7, nombre: 'Emma González', email: 'egonzalez@gruporetail.com', tienda_id: 7 },
  { id: 8, nombre: 'Daniel Paz', email: 'dpaz@gruporetail.com', tienda_id: 8 },
  { id: 9, nombre: 'Isabella Vásquez', email: 'ivasquez@gruporetail.com', tienda_id: 10 },
  { id: 10, nombre: 'Sebastián Reyes', email: 'sreyes@gruporetail.com', tienda_id: 13 },
  { id: 11, nombre: 'Mariana López', email: 'mlopez@gruporetail.com', tienda_id: 14 },
  { id: 12, nombre: 'Alejandro Díaz', email: 'adiaz@gruporetail.com', tienda_id: 16 },
];

const CLIENTES = [
  'María Elena Gómez', 'Carlos Roberto Morales', 'Ana Lucía Fernández',
  'Jorge Antonio Castillo', 'Sofía Isabel Reyes', 'Luis Fernando Hernández',
  'Diana Michelle Paz', 'Pedro José González', 'Carmen Beatriz Ruiz',
  'Roberto Alejandro Díaz', 'Laura Michelle Flores', 'Fernando José Aguilar',
  'Gabriela María López', 'Andrés Esteban Vásquez', 'Valeria Nicole Martínez',
];

function rnd(min, max) { return Math.random() * (max - min) + min; }
function r2(v) { return Math.round(v * 100) / 100; }

async function seedMultiMarca() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🏢 INICIANDO SEED MULTI-MARCA, MULTI-TIENDA, MULTI-PAÍS...\n');

    // ============================================
    // 1. INSERTAR MARCAS
    // ============================================
    console.log('🏷️ Insertando marcas...');
    await client.query('DELETE FROM marcas');
    for (const m of MARCAS) {
      await client.query(
        'INSERT INTO marcas (id, empresa_id, codigo, nombre, segmento, descripcion, activo) VALUES ($1, 1, $2, $3, $4, $5, TRUE)',
        [m.id, m.codigo, m.nombre, m.segmento, m.descripcion]
      );
    }
    console.log(`   ✅ ${MARCAS.length} marcas insertadas`);

    // ============================================
    // 2. INSERTAR TIENDAS
    // ============================================
    console.log('🏪 Insertando tiendas...');
    await client.query('DELETE FROM tiendas');
    for (const t of TIENDAS) {
      await client.query(
        `INSERT INTO tiendas (id, empresa_id, marca_id, pais_id, codigo, nombre, ciudad, tipo, metros_cuadrados, activo, fecha_apertura)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, TRUE, '2020-01-01')`,
        [t.id, t.marca_id, t.pais_id, t.codigo, t.nombre, t.ciudad, t.tipo, t.metros]
      );
    }
    console.log(`   ✅ ${TIENDAS.length} tiendas insertadas`);

    // ============================================
    // 3. ASIGNAR MARCAS A PRODUCTOS
    // ============================================
    console.log('📦 Asignando productos a marcas...');
    
    const prodResult = await client.query('SELECT id, categoria FROM productos WHERE empresa_id=1 AND activo=TRUE ORDER BY id');
    const productos = prodResult.rows;
    
    // Asignar cada producto a una marca según categoría
    for (const p of productos) {
      let marcaId = 1; // Default Moda Urbana
      
      if (p.categoria === 'Calzado' || p.categoria === 'Deportes') marcaId = 2; // SportLife
      else if (p.categoria === 'Hogar') marcaId = 3; // Casa & Hogar
      else if (p.categoria === 'Electrónicos') marcaId = 4; // TechZone
      else if (p.categoria === 'Ropa Hombre' || p.categoria === 'Ropa Mujer' || p.categoria === 'Accesorios' || p.categoria === 'Belleza') marcaId = 1; // Moda Urbana
      
      await client.query('UPDATE productos SET marca_id = $1 WHERE id = $2', [marcaId, p.id]);
    }
    console.log(`   ✅ ${productos.length} productos asignados a marcas`);

    // ============================================
    // 4. LIMPIAR VENTAS Y ACTUALIZAR VENDEDORES
    // ============================================
    console.log('🧹 Limpiando ventas existentes...');
    await client.query('TRUNCATE TABLE ventas_detalle RESTART IDENTITY');
    console.log('   ✅ Ventas limpiadas');
    
    console.log('👥 Actualizando vendedores con tienda...');
    await client.query('DELETE FROM vendedores');
    for (const v of VENDEDORES) {
      await client.query(
        'INSERT INTO vendedores (id, empresa_id, nombre, email, activo, tienda_id) VALUES ($1, 1, $2, $3, TRUE, $4)',
        [v.id, v.nombre, v.email, v.tienda_id]
      );
    }
    console.log(`   ✅ ${VENDEDORES.length} vendedores actualizados`);

    // ============================================
    // 5. REGENERAR VENTAS CON TIENDA/MARCA/PAÍS
    // ============================================
    console.log('💰 Regenerando ventas multi-dimensión...');
    
    const ventas = [];
    const fechaBase = new Date('2024-01-01');
    
    // Factor por vendedor (algunos venden con más descuento)
    const vendedorFactor = {};
    VENDEDORES.forEach(v => { vendedorFactor[v.id] = 0.95 + Math.random() * 0.10; });
    
    // Ventas ponderadas por tamaño de tienda
    const tiendaPeso = {};
    TIENDAS.forEach(t => { tiendaPeso[t.id] = Math.sqrt(t.metros) / 10; });
    
    for (let mes = 0; mes < 24; mes++) {
      const fecha = new Date(fechaBase);
      fecha.setMonth(fecha.getMonth() + mes);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      // Total transacciones del mes distribuidas por tienda
      const totalTransMes = 400 + Math.floor(Math.random() * 200);
      
      for (let t = 0; t < totalTransMes; t++) {
        // Seleccionar tienda ponderada
        const tiendaTotalWeight = TIENDAS.reduce((sum, ti) => sum + tiendaPeso[ti.id], 0);
        let randomWeight = Math.random() * tiendaTotalWeight;
        let tienda = TIENDAS[0];
        for (const ti of TIENDAS) {
          randomWeight -= tiendaPeso[ti.id];
          if (randomWeight <= 0) { tienda = ti; break; }
        }
        
        // Vendedor de esa tienda
        const vendedoresTienda = VENDEDORES.filter(v => v.tienda_id === tienda.id);
        const vendedor = vendedoresTienda.length > 0 
          ? vendedoresTienda[Math.floor(Math.random() * vendedoresTienda.length)]
          : VENDEDORES[Math.floor(Math.random() * VENDEDORES.length)];
        
        const clienteNombre = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
        
        // Producto de la misma marca que la tienda
        const productosMarca = productos.filter(p => {
          // Buscar marca del producto
          const marcaProd = p.categoria === 'Calzado' || p.categoria === 'Deportes' ? 2 :
                           p.categoria === 'Hogar' ? 3 :
                           p.categoria === 'Electrónicos' ? 4 : 1;
          return marcaProd === tienda.marca_id;
        });
        
        const producto = productosMarca.length > 0 
          ? productosMarca[Math.floor(Math.random() * productosMarca.length)]
          : productos[Math.floor(Math.random() * productos.length)];
        
        const cantidad = Math.floor(rnd(1, 5));
        
        // Obtener precio/costo del catálogo retail
        const catalogoProd = productos.find(p => p.id === producto.id);
        
        // Consultar precio base del producto (no tenemos precio_actual, así que usamos un rango por categoría)
        let precioBase = 200;
        if (producto.categoria === 'Electrónicos') precioBase = 350;
        else if (producto.categoria === 'Calzado') precioBase = 400;
        else if (producto.categoria === 'Hogar') precioBase = 280;
        else if (producto.categoria === 'Deportes') precioBase = 180;
        else if (producto.categoria === 'Ropa Hombre' || producto.categoria === 'Ropa Mujer') precioBase = 220;
        else if (producto.categoria === 'Accesorios') precioBase = 180;
        else if (producto.categoria === 'Belleza') precioBase = 250;
        else if (producto.categoria === 'Juguetes') precioBase = 150;
        
        const costoBase = precioBase * 0.45; // ~55% margen
        
        const precioUnitario = precioBase * vendedorFactor[vendedor.id] * (0.98 + Math.random() * 0.04);
        const costoUnitario = costoBase * (0.97 + Math.random() * 0.06);
        
        ventas.push([
          vendedor.id, clienteNombre, producto.id, 
          tienda.id, tienda.marca_id, tienda.pais_id,
          fechaStr, r2(cantidad), r2(precioUnitario), r2(costoUnitario)
        ]);
      }
      
      if (mes % 3 === 0) process.stdout.write('.');
    }
    
    // Insertar ventas en batches
    for (let i = 0; i < ventas.length; i += 500) {
      const batch = ventas.slice(i, i + 500);
      const vals = batch.map((_, j) => {
        const b = j * 10;
        return `($${b + 1}, $${b + 2}, $${b + 3}, 1, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8}, $${b + 9}, $${b + 10})`;
      }).join(',');
      await client.query(
        `INSERT INTO ventas_detalle (vendedor_id, cliente_nombre, producto_id, empresa_id, tienda_id, marca_id, pais_id, fecha, cantidad, precio_unitario, costo_unitario) VALUES ${vals}`,
        batch.flat()
      );
    }
    
    console.log(`\n   ✅ ${ventas.length} ventas insertadas`);

    // ============================================
    // 6. REGENERAR HISTORIAL DE PRODUCTOS
    // ============================================
    console.log('📊 Regenerando historial de productos...');
    await client.query('TRUNCATE TABLE productos_historial RESTART IDENTITY');
    
    const historial = [];
    for (const p of productos) {
      // Determinar precio base por categoría
      let precioBase = 200;
      if (p.categoria === 'Electrónicos') precioBase = 350;
      else if (p.categoria === 'Calzado') precioBase = 400;
      else if (p.categoria === 'Hogar') precioBase = 280;
      else if (p.categoria === 'Deportes') precioBase = 180;
      else if (p.categoria === 'Ropa Hombre' || p.categoria === 'Ropa Mujer') precioBase = 220;
      else if (p.categoria === 'Accesorios') precioBase = 180;
      else if (p.categoria === 'Belleza') precioBase = 250;
      else if (p.categoria === 'Juguetes') precioBase = 150;
      
      const costoBase = precioBase * 0.45;
      
      for (let mes = 0; mes < 24; mes++) {
        const fecha = new Date(fechaBase);
        fecha.setMonth(fecha.getMonth() + mes);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        const factorPrecio = 0.95 + (mes * 0.004) + (Math.random() * 0.06 - 0.03);
        const factorCosto = 0.92 + (mes * 0.005) + (Math.random() * 0.05 - 0.025);
        
        const precio = r2(precioBase * factorPrecio);
        const costo = r2(costoBase * factorCosto);
        const unidades = Math.floor(rnd(50, 800));
        
        historial.push([p.id, fechaStr, precio, costo, unidades]);
      }
    }
    
    for (let i = 0; i < historial.length; i += 500) {
      const batch = historial.slice(i, i + 500);
      const vals = batch.map((_, j) => {
        const b = j * 5;
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`;
      }).join(',');
      await client.query(
        `INSERT INTO productos_historial (producto_id, fecha, precio_promedio_realizado, costo_unitario, unidades_vendidas) VALUES ${vals}`,
        batch.flat()
      );
      if (i % 5000 === 0) process.stdout.write('.');
    }
    
    console.log(`\n   ✅ ${historial.length} registros de historial insertados`);

    await client.query('COMMIT');
    
    // Verificar
    console.log('\n📊 Verificación:');
    const v1 = await client.query('SELECT COUNT(*) FROM marcas');
    const v2 = await client.query('SELECT COUNT(*) FROM tiendas');
    const v3 = await client.query('SELECT COUNT(*) FROM ventas_detalle');
    const v4 = await client.query('SELECT COUNT(DISTINCT tienda_id) as tiendas FROM ventas_detalle');
    const v5 = await client.query('SELECT COUNT(DISTINCT marca_id) as marcas FROM ventas_detalle');
    const v6 = await client.query('SELECT COUNT(DISTINCT pais_id) as paises FROM ventas_detalle');
    
    console.log(`   Marcas: ${v1.rows[0].count}`);
    console.log(`   Tiendas: ${v2.rows[0].count}`);
    console.log(`   Ventas: ${v3.rows[0].count}`);
    console.log(`   Tiendas con ventas: ${v4.rows[0].tiendas}`);
    console.log(`   Marcas con ventas: ${v5.rows[0].marcas}`);
    console.log(`   Países con ventas: ${v6.rows[0].paises}`);
    
    console.log('\n✅ SEED MULTI-MARCA COMPLETADO EXITOSAMENTE');
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    pool.end();
  }
}

seedMultiMarca();
