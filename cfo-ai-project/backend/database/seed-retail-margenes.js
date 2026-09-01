/**
 * Seed para convertir datos de industrial a RETAIL
 * Actualiza productos, clientes, y regenera ventas para demo de tiendas retail
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============================================
// CATÁLOGO RETAIL GUATEMALA
// ============================================

const PRODUCTOS_RETAIL = [
  // Ropa Hombre
  { sku: 'RH-001', nombre: 'Camisa Polo Clásica Hombre', categoria: 'Ropa Hombre', precio: 189.00, costo: 85.00 },
  { sku: 'RH-002', nombre: 'Jeans Slim Fit Hombre', categoria: 'Ropa Hombre', precio: 295.00, costo: 135.00 },
  { sku: 'RH-003', nombre: 'Chaqueta de Cuero Sintético', categoria: 'Ropa Hombre', precio: 450.00, costo: 220.00 },
  { sku: 'RH-004', nombre: 'Camiseta Básica Pack x3', categoria: 'Ropa Hombre', precio: 149.00, costo: 65.00 },
  { sku: 'RH-005', nombre: 'Pantalón Chino Casual', categoria: 'Ropa Hombre', precio: 245.00, costo: 110.00 },
  
  // Ropa Mujer
  { sku: 'RM-001', nombre: 'Blusa Elegante Mujer', categoria: 'Ropa Mujer', precio: 165.00, costo: 72.00 },
  { sku: 'RM-002', nombre: 'Vestido Casual Verano', categoria: 'Ropa Mujer', precio: 285.00, costo: 125.00 },
  { sku: 'RM-003', nombre: 'Jeans Skinny Mujer', categoria: 'Ropa Mujer', precio: 275.00, costo: 120.00 },
  { sku: 'RM-004', nombre: 'Suéter de Punto', categoria: 'Ropa Mujer', precio: 195.00, costo: 88.00 },
  { sku: 'RM-005', nombre: 'Falda Larga Estampada', categoria: 'Ropa Mujer', precio: 175.00, costo: 78.00 },
  
  // Calzado
  { sku: 'CZ-001', nombre: 'Zapatos Deportivos Nike', categoria: 'Calzado', precio: 895.00, costo: 450.00 },
  { sku: 'CZ-002', nombre: 'Sandalias Casuales Mujer', categoria: 'Calzado', precio: 145.00, costo: 58.00 },
  { sku: 'CZ-003', nombre: 'Botas de Cuero Hombre', categoria: 'Calzado', precio: 595.00, costo: 280.00 },
  { sku: 'CZ-004', nombre: 'Tennis Urbanos Unisex', categoria: 'Calzado', precio: 385.00, costo: 165.00 },
  { sku: 'CZ-005', nombre: 'Zapatillas de Casa', categoria: 'Calzado', precio: 65.00, costo: 22.00 },
  
  // Electrónicos
  { sku: 'EL-001', nombre: 'Audífonos Bluetooth Sony', categoria: 'Electrónicos', precio: 445.00, costo: 220.00 },
  { sku: 'EL-002', nombre: 'Cargador Portátil 20000mAh', categoria: 'Electrónicos', precio: 185.00, costo: 78.00 },
  { sku: 'EL-003', nombre: 'Cable USB-C Rápido', categoria: 'Electrónicos', precio: 55.00, costo: 15.00 },
  { sku: 'EL-004', nombre: 'Funda iPhone 15 Pro', categoria: 'Electrónicos', precio: 125.00, costo: 35.00 },
  { sku: 'EL-005', nombre: 'Altavoz Bluetooth JBL', categoria: 'Electrónicos', precio: 385.00, costo: 175.00 },
  { sku: 'EL-006', nombre: 'Smartwatch Xiaomi', categoria: 'Electrónicos', precio: 645.00, costo: 320.00 },
  { sku: 'EL-007', nombre: 'Mouse Inalámbrico Logitech', categoria: 'Electrónicos', precio: 165.00, costo: 72.00 },
  
  // Accesorios
  { sku: 'AC-001', nombre: 'Mochila Escolar Nike', categoria: 'Accesorios', precio: 295.00, costo: 135.00 },
  { sku: 'AC-002', nombre: 'Reloj de Pulsera Casual', categoria: 'Accesorios', precio: 245.00, costo: 95.00 },
  { sku: 'AC-003', nombre: 'Cartera de Cuero Mujer', categoria: 'Accesorios', precio: 185.00, costo: 72.00 },
  { sku: 'AC-004', nombre: 'Lentes de Sol Polarizados', categoria: 'Accesorios', precio: 225.00, costo: 85.00 },
  { sku: 'AC-005', nombre: 'Cinturón de Cuero Hombre', categoria: 'Accesorios', precio: 95.00, costo: 35.00 },
  
  // Hogar
  { sku: 'HG-001', nombre: 'Juego de Sábanas Queen', categoria: 'Hogar', precio: 385.00, costo: 165.00 },
  { sku: 'HG-002', nombre: 'Cafetera Eléctrica Oster', categoria: 'Hogar', precio: 445.00, costo: 210.00 },
  { sku: 'HG-003', nombre: 'Set de Toallas 6 piezas', categoria: 'Hogar', precio: 165.00, costo: 68.00 },
  { sku: 'HG-004', nombre: 'Almohada Memory Foam', categoria: 'Hogar', precio: 195.00, costo: 82.00 },
  { sku: 'HG-005', nombre: 'Lámpara de Mesa LED', categoria: 'Hogar', precio: 145.00, costo: 58.00 },
  
  // Deportes
  { sku: 'DP-001', nombre: 'Balón de Fútbol Nike', categoria: 'Deportes', precio: 285.00, costo: 125.00 },
  { sku: 'DP-002', nombre: 'Mancuernas 5kg Par', categoria: 'Deportes', precio: 245.00, costo: 110.00 },
  { sku: 'DP-003', nombre: 'Botella Deportiva 1L', categoria: 'Deportes', precio: 65.00, costo: 22.00 },
  { sku: 'DP-004', nombre: 'Colchoneta Yoga', categoria: 'Deportes', precio: 145.00, costo: 58.00 },
  { sku: 'DP-005', nombre: 'Guantes de Gimnasio', categoria: 'Deportes', precio: 85.00, costo: 32.00 },
  
  // Belleza
  { sku: 'BL-001', nombre: 'Perfume Importado 100ml', categoria: 'Belleza', precio: 585.00, costo: 280.00 },
  { sku: 'BL-002', nombre: 'Set de Maquillaje Básico', categoria: 'Belleza', precio: 245.00, costo: 105.00 },
  { sku: 'BL-003', nombre: 'Crema Hidratante Facial', categoria: 'Belleza', precio: 125.00, costo: 48.00 },
  { sku: 'BL-004', nombre: 'Shampoo Keratina 400ml', categoria: 'Belleza', precio: 85.00, costo: 32.00 },
  { sku: 'BL-005', nombre: 'Esmalte de Uñas Pack x5', categoria: 'Belleza', precio: 75.00, costo: 25.00 },
  
  // Juguetes
  { sku: 'JQ-001', nombre: 'Carro a Control Remoto', categoria: 'Juguetes', precio: 225.00, costo: 95.00 },
  { sku: 'JQ-002', nombre: 'Muñeca Interactiva', categoria: 'Juguetes', precio: 185.00, costo: 78.00 },
  { sku: 'JQ-003', nombre: 'Lego Set Construcción', categoria: 'Juguetes', precio: 345.00, costo: 155.00 },
  { sku: 'JQ-004', nombre: 'Juego de Mesa UNO', categoria: 'Juguetes', precio: 45.00, costo: 15.00 },
  { sku: 'JQ-005', nombre: 'Pelota de Playa Pack x3', categoria: 'Juguetes', precio: 55.00, costo: 18.00 },
];

const CLIENTES_RETAIL = [
  'María Elena Gómez',
  'Carlos Roberto Morales',
  'Ana Lucía Fernández',
  'Jorge Antonio Castillo',
  'Sofía Isabel Reyes',
  'Luis Fernando Hernández',
  'Diana Michelle Paz',
  'Pedro José González',
  'Carmen Beatriz Ruiz',
  'Roberto Alejandro Díaz',
  'Laura Michelle Flores',
  'Fernando José Aguilar',
  'Gabriela María López',
  'Andrés Esteban Vásquez',
  'Valeria Nicole Martínez',
];

const VENDEDORES_RETAIL = [
  { id: 1, nombre: 'Sofía Torres', email: 'storres@tienda.com' },
  { id: 2, nombre: 'Diego Hernández', email: 'dhernandez@tienda.com' },
  { id: 3, nombre: 'Camila Ruiz', email: 'cruiz@tienda.com' },
  { id: 4, nombre: 'Mateo Flores', email: 'mflores@tienda.com' },
  { id: 5, nombre: 'Valentina Castillo', email: 'vcastillo@tienda.com' },
];

function rnd(min, max) { return Math.random() * (max - min) + min; }
function r2(v) { return Math.round(v * 100) / 100; }

async function seedRetail() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🛍️  INICIANDO CONVERSIÓN A RETAIL...\n');

    // ============================================
    // 1. ACTUALIZAR PRODUCTOS A RETAIL
    // ============================================
    console.log('📦 Actualizando productos a retail...');
    
    // Obtener productos actuales
    const prodResult = await client.query('SELECT id FROM productos WHERE empresa_id=1 AND activo=TRUE ORDER BY id');
    const productosIds = prodResult.rows.map(r => r.id);
    
    if (productosIds.length !== PRODUCTOS_RETAIL.length) {
      console.log(`   ⚠️  Hay ${productosIds.length} productos existentes vs ${PRODUCTOS_RETAIL.length} productos retail`);
      console.log(`   Se actualizarán los primeros ${Math.min(productosIds.length, PRODUCTOS_RETAIL.length)} productos`);
    }
    
    const numToUpdate = Math.min(productosIds.length, PRODUCTOS_RETAIL.length);
    
    for (let i = 0; i < numToUpdate; i++) {
      const p = PRODUCTOS_RETAIL[i];
      await client.query(
        `UPDATE productos SET 
          sku = $1, 
          nombre = $2, 
          categoria = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4`,
        [p.sku, p.nombre, p.categoria, productosIds[i]]
      );
    }
    
    // Si hay más productos retail que existentes, insertar nuevos
    if (PRODUCTOS_RETAIL.length > productosIds.length) {
      for (let i = productosIds.length; i < PRODUCTOS_RETAIL.length; i++) {
        const p = PRODUCTOS_RETAIL[i];
        await client.query(
          `INSERT INTO productos (empresa_id, sku, nombre, categoria, activo, created_at, updated_at)
           VALUES (1, $1, $2, $3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [p.sku, p.nombre, p.categoria]
        );
      }
    }
    
    // Si hay más productos existentes que retail, desactivar los sobrantes
    if (productosIds.length > PRODUCTOS_RETAIL.length) {
      for (let i = PRODUCTOS_RETAIL.length; i < productosIds.length; i++) {
        await client.query(
          'UPDATE productos SET activo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [productosIds[i]]
        );
      }
      console.log(`   🗑️  ${productosIds.length - PRODUCTOS_RETAIL.length} productos sobrantes desactivados`);
    }
    
    console.log(`   ✅ ${PRODUCTOS_RETAIL.length} productos retail configurados`);

    // ============================================
    // 2. LIMPIAR VENTAS PRIMERO (por FK)
    // ============================================
    console.log('🧹 Limpiando ventas existentes...');
    await client.query('TRUNCATE TABLE ventas_detalle RESTART IDENTITY');
    console.log('   ✅ Ventas limpiadas');

    // ============================================
    // 3. ACTUALIZAR VENDEDORES
    // ============================================
    console.log('👥 Actualizando vendedores...');
    await client.query('DELETE FROM vendedores');
    for (const v of VENDEDORES_RETAIL) {
      await client.query(
        'INSERT INTO vendedores (id, empresa_id, nombre, email, activo) VALUES ($1, 1, $2, $3, TRUE)',
        [v.id, v.nombre, v.email]
      );
    }
    console.log(`   ✅ ${VENDEDORES_RETAIL.length} vendedores retail configurados`);

    // ============================================
    // 4. ACTUALIZAR CLIENTES
    // ============================================
    console.log('🏢 Actualizando clientes...');
    await client.query('DELETE FROM clientes');
    for (let i = 0; i < CLIENTES_RETAIL.length; i++) {
      await client.query(
        'INSERT INTO clientes (empresa_id, codigo, nombre, tipo, activo) VALUES (1, $1, $2, $3, TRUE)',
        [`CLI-${String(i+1).padStart(3, '0')}`, CLIENTES_RETAIL[i], i < 5 ? 'vip' : 'regular']
      );
    }
    console.log(`   ✅ ${CLIENTES_RETAIL.length} clientes retail configurados`);

    // ============================================
    // 5. REGENERAR VENTAS
    // ============================================
    console.log('💰 Regenerando ventas retail (24 meses)...');
    
    // Obtener productos actualizados
    const prodUpdated = await client.query('SELECT id, sku, nombre, categoria FROM productos WHERE empresa_id=1 AND activo=TRUE');
    const productos = prodUpdated.rows;
    
    // Map de producto_id -> precio/costo del catálogo
    const productoMap = {};
    for (let i = 0; i < numToUpdate; i++) {
      productoMap[productosIds[i]] = PRODUCTOS_RETAIL[i];
    }
    
    const ventas = [];
    const fechaBase = new Date('2024-01-01');
    
    // Vendedores con diferentes desempeños de margen:
    const vendedorFactor = { 1: 1.02, 2: 1.0, 3: 0.98, 4: 1.01, 5: 0.95 };
    
    for (let mes = 0; mes < 24; mes++) {
      const fecha = new Date(fechaBase);
      fecha.setMonth(fecha.getMonth() + mes);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      // Cada mes generamos ~200 transacciones
      const numTrans = 180 + Math.floor(Math.random() * 40);
      
      for (let t = 0; t < numTrans; t++) {
        const vendedorId = VENDEDORES_RETAIL[Math.floor(Math.random() * VENDEDORES_RETAIL.length)].id;
        const clienteNombre = CLIENTES_RETAIL[Math.floor(Math.random() * CLIENTES_RETAIL.length)];
        const producto = productos[Math.floor(Math.random() * productos.length)];
        const catalogoProd = productoMap[producto.id];
        
        if (!catalogoProd) continue; // Skip si no está en el mapa
        
        const cantidad = Math.floor(rnd(1, 5)); // Retail: cantidades más pequeñas
        const precioUnitario = catalogoProd.precio * vendedorFactor[vendedorId] * (0.98 + Math.random() * 0.04);
        const costoUnitario = catalogoProd.costo * (0.97 + Math.random() * 0.06);
        
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
    
    console.log(`\n   ✅ ${ventas.length} transacciones de ventas retail insertadas`);

    // ============================================
    // 5. REGENERAR HISTORIAL DE PRODUCTOS
    // ============================================
    console.log('📊 Regenerando historial de productos...');
    await client.query('TRUNCATE TABLE productos_historial RESTART IDENTITY');
    
    const historial = [];
    for (let i = 0; i < numToUpdate; i++) {
      const p = PRODUCTOS_RETAIL[i];
      const productoId = productosIds[i];
      // Generar 24 meses de historial por producto
      for (let mes = 0; mes < 24; mes++) {
        const fecha = new Date(fechaBase);
        fecha.setMonth(fecha.getMonth() + mes);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Precio y costo con variación mensual
        const factorPrecio = 0.95 + (mes * 0.004) + (Math.random() * 0.06 - 0.03); // Tendencia a subir
        const factorCosto = 0.92 + (mes * 0.005) + (Math.random() * 0.05 - 0.025);
        
        const precio = r2(p.precio * factorPrecio);
        const costo = r2(p.costo * factorCosto);
        const unidades = Math.floor(rnd(50, 800)); // Unidades mensuales
        
        historial.push([productoId, fechaStr, precio, costo, unidades]);
      }
    }
    
    // Insertar historial en batches
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
    
    // Verificar vistas
    console.log('\n📊 Verificando vistas de márgenes...');
    const v = await client.query('SELECT COUNT(*) FROM vw_margen_vendedor');
    const c = await client.query('SELECT COUNT(*) FROM vw_margen_cliente');
    const l = await client.query('SELECT COUNT(*) FROM vw_margen_linea');
    const p = await client.query('SELECT COUNT(*) FROM vw_margen_productos');
    console.log(`   Vendedores: ${v.rows[0].count}`);
    console.log(`   Clientes: ${c.rows[0].count}`);
    console.log(`   Líneas: ${l.rows[0].count}`);
    console.log(`   Productos: ${p.rows[0].count}`);
    
    // Muestra de productos retail
    const muestra = await client.query('SELECT sku, nombre, categoria FROM productos WHERE empresa_id=1 AND activo=TRUE LIMIT 5');
    console.log('\n🛍️  MUESTRA DE PRODUCTOS RETAIL:');
    for (const row of muestra.rows) {
      const catProd = PRODUCTOS_RETAIL.find(p => p.sku === row.sku);
      console.log(`   ${row.sku} | ${row.nombre} | ${row.categoria} | Q${catProd ? catProd.precio : '?'} / Q${catProd ? catProd.costo : '?'}`);
    }
    
    console.log('\n✅ CONVERSIÓN A RETAIL COMPLETADA EXITOSAMENTE');
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    pool.end();
  }
}

seedRetail();
