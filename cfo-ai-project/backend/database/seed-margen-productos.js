/**
 * Seed script optimizado para datos de margen por producto
 * Usa batch inserts para mayor velocidad
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============================================
// CONFIGURACIÓN DE PRODUCTOS DEMO
// ============================================
const PRODUCTOS_BASE = [
  { sku: 'RES-PEAD-001', nombre: 'Resina PEAD Grado Inyección', categoria: 'Resinas Plásticas', precio_inicial: 28.50, costo_inicial: 19.20, rotacion: 'alta', erosion: 'gradual' },
  { sku: 'RES-PP-002', nombre: 'Polipropileno Homopolímero', categoria: 'Resinas Plásticas', precio_inicial: 24.80, costo_inicial: 16.50, rotacion: 'alta', erosion: 'gradual' },
  { sku: 'ADD-UV-003', nombre: 'Aditivo UV Absorbente', categoria: 'Aditivos Industriales', precio_inicial: 185.00, costo_inicial: 125.00, rotacion: 'alta', erosion: 'gradual' },
  { sku: 'MB-WHT-004', nombre: 'Masterbatch Blanco TiO2 70%', categoria: 'Masterbatch', precio_inicial: 42.00, costo_inicial: 28.50, rotacion: 'alta', erosion: 'gradual' },
  { sku: 'RES-PEBD-005', nombre: 'Resina PEBD Grado Película', categoria: 'Resinas Plásticas', precio_inicial: 26.40, costo_inicial: 17.80, rotacion: 'media', erosion: 'ajuste_insuficiente' },
  { sku: 'ADD-ANT-006', nombre: 'Antioxidante Fenólico', categoria: 'Aditivos Industriales', precio_inicial: 145.00, costo_inicial: 98.00, rotacion: 'media', erosion: 'mejoro' },
  { sku: 'RES-PEAD-007', nombre: 'Resina PEAD Grado Soplado', categoria: 'Resinas Plásticas', precio_inicial: 27.90, costo_inicial: 18.80, rotacion: 'media', erosion: 'estable' },
  { sku: 'RES-PP-008', nombre: 'Polipropileno Copolímero', categoria: 'Resinas Plásticas', precio_inicial: 25.50, costo_inicial: 17.20, rotacion: 'media', erosion: 'estable' },
  { sku: 'RES-PS-009', nombre: 'Poliestireno de Uso General', categoria: 'Resinas Plásticas', precio_inicial: 22.40, costo_inicial: 15.10, rotacion: 'media', erosion: 'estable' },
  { sku: 'ADD-LUB-010', nombre: 'Lubricante Interno Estearato', categoria: 'Aditivos Industriales', precio_inicial: 95.00, costo_inicial: 64.00, rotacion: 'media', erosion: 'estable' },
  { sku: 'ADD-ESP-011', nombre: 'Espumante Químico Azodicarbonamida', categoria: 'Aditivos Industriales', precio_inicial: 210.00, costo_inicial: 142.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'MB-BLK-012', nombre: 'Masterbatch Negro Carbon 35%', categoria: 'Masterbatch', precio_inicial: 38.50, costo_inicial: 26.00, rotacion: 'alta', erosion: 'estable' },
  { sku: 'MB-CLR-013', nombre: 'Masterbatch Azul Ultramar', categoria: 'Masterbatch', precio_inicial: 55.00, costo_inicial: 37.20, rotacion: 'media', erosion: 'estable' },
  { sku: 'MB-RED-014', nombre: 'Masterbatch Rojo Óxido', categoria: 'Masterbatch', precio_inicial: 58.00, costo_inicial: 39.50, rotacion: 'media', erosion: 'estable' },
  { sku: 'PEL-PE-015', nombre: 'Película PE Estirable Manual', categoria: 'Películas y Láminas', precio_inicial: 18.50, costo_inicial: 12.40, rotacion: 'alta', erosion: 'estable' },
  { sku: 'PEL-PE-016', nombre: 'Película PE Estirable Máquina', categoria: 'Películas y Láminas', precio_inicial: 16.80, costo_inicial: 11.30, rotacion: 'alta', erosion: 'estable' },
  { sku: 'PEL-BOPP-017', nombre: 'Lámina BOPP Transparente', categoria: 'Películas y Láminas', precio_inicial: 32.00, costo_inicial: 21.60, rotacion: 'media', erosion: 'estable' },
  { sku: 'PEL-NYL-018', nombre: 'Película Nylon de Barrera', categoria: 'Películas y Láminas', precio_inicial: 65.00, costo_inicial: 44.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'EQU-EXT-019', nombre: 'Tornillo Extrusor 45mm', categoria: 'Equipos de Procesamiento', precio_inicial: 2850.00, costo_inicial: 1920.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'EQU-MOL-020', nombre: 'Molde de Inyección 2 Cavidades', categoria: 'Equipos de Procesamiento', precio_inicial: 4200.00, costo_inicial: 2840.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'RES-EVA-021', nombre: 'Copolímero EVA 18% VA', categoria: 'Resinas Plásticas', precio_inicial: 32.50, costo_inicial: 22.00, rotacion: 'media', erosion: 'estable' },
  { sku: 'RES-ABS-022', nombre: 'ABS Grado Propósito General', categoria: 'Resinas Plásticas', precio_inicial: 45.00, costo_inicial: 30.50, rotacion: 'media', erosion: 'estable' },
  { sku: 'RES-PET-023', nombre: 'PET Grado Botella', categoria: 'Resinas Plásticas', precio_inicial: 35.00, costo_inicial: 23.80, rotacion: 'media', erosion: 'estable' },
  { sku: 'ADD-FLA-024', nombre: 'Retardante de Llama Bromado', categoria: 'Aditivos Industriales', precio_inicial: 320.00, costo_inicial: 216.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'ADD-COU-025', nombre: 'Agente Acoplante Silano', categoria: 'Aditivos Industriales', precio_inicial: 175.00, costo_inicial: 118.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'MB-GRN-026', nombre: 'Masterbatch Verde Clorofila', categoria: 'Masterbatch', precio_inicial: 62.00, costo_inicial: 42.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'MB-YLW-027', nombre: 'Masterbatch Amarillo Cromo', categoria: 'Masterbatch', precio_inicial: 48.00, costo_inicial: 32.50, rotacion: 'media', erosion: 'estable' },
  { sku: 'PEL-PVC-028', nombre: 'Lámina PVC Flexible', categoria: 'Películas y Láminas', precio_inicial: 28.00, costo_inicial: 19.00, rotacion: 'media', erosion: 'estable' },
  { sku: 'PEL-ALU-029', nombre: 'Lámina Aluminizada Laminada', categoria: 'Películas y Láminas', precio_inicial: 85.00, costo_inicial: 57.50, rotacion: 'baja', erosion: 'estable' },
  { sku: 'EQU-DOS-030', nombre: 'Dosificador Gravimétrico', categoria: 'Equipos de Procesamiento', precio_inicial: 12500.00, costo_inicial: 8450.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'RES-LDPE-031', nombre: 'Polietileno de Baja Densidad', categoria: 'Resinas Plásticas', precio_inicial: 23.50, costo_inicial: 15.80, rotacion: 'alta', erosion: 'estable' },
  { sku: 'RES-HDPE-032', nombre: 'Polietileno de Alta Densidad', categoria: 'Resinas Plásticas', precio_inicial: 25.00, costo_inicial: 16.90, rotacion: 'alta', erosion: 'estable' },
  { sku: 'RES-LLDPE-033', nombre: 'Polietileno Lineal de Baja Densidad', categoria: 'Resinas Plásticas', precio_inicial: 24.20, costo_inicial: 16.40, rotacion: 'alta', erosion: 'estable' },
  { sku: 'ADD-IMP-034', nombre: 'Impact Modifier CPE', categoria: 'Aditivos Industriales', precio_inicial: 135.00, costo_inicial: 91.00, rotacion: 'media', erosion: 'estable' },
  { sku: 'ADD-PLA-035', nombre: 'Plastificante DOP', categoria: 'Aditivos Industriales', precio_inicial: 88.00, costo_inicial: 59.50, rotacion: 'media', erosion: 'estable' },
  { sku: 'MB-PEA-036', nombre: 'Masterbatch Pérola Nacarado', categoria: 'Masterbatch', precio_inicial: 120.00, costo_inicial: 81.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'MB-GLD-037', nombre: 'Masterbatch Dorado Metálico', categoria: 'Masterbatch', precio_inicial: 135.00, costo_inicial: 91.50, rotacion: 'baja', erosion: 'estable' },
  { sku: 'PEL-SHR-038', nombre: 'Película Termoencogible POF', categoria: 'Películas y Láminas', precio_inicial: 38.00, costo_inicial: 25.70, rotacion: 'media', erosion: 'estable' },
  { sku: 'PEL-CAS-039', nombre: 'Película de Cast PP', categoria: 'Películas y Láminas', precio_inicial: 42.00, costo_inicial: 28.50, rotacion: 'media', erosion: 'estable' },
  { sku: 'EQU-PEL-040', nombre: 'Unidad de Pelletizado', categoria: 'Equipos de Procesamiento', precio_inicial: 18500.00, costo_inicial: 12500.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'RES-PA6-041', nombre: 'Nylon 6 Grado Inyección', categoria: 'Resinas Plásticas', precio_inicial: 68.00, costo_inicial: 46.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'RES-PA66-042', nombre: 'Nylon 66 Grado Inyección', categoria: 'Resinas Plásticas', precio_inicial: 75.00, costo_inicial: 50.80, rotacion: 'baja', erosion: 'estable' },
  { sku: 'RES-POM-043', nombre: 'Acetal POM Copolímero', categoria: 'Resinas Plásticas', precio_inicial: 82.00, costo_inicial: 55.50, rotacion: 'baja', erosion: 'estable' },
  { sku: 'ADD-CLY-044', nombre: 'Arcilla Organofílica Nanoclay', categoria: 'Aditivos Industriales', precio_inicial: 450.00, costo_inicial: 304.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'ADD-BIO-045', nombre: 'Aditivo Biodegradante D2W', categoria: 'Aditivos Industriales', precio_inicial: 195.00, costo_inicial: 132.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'MB-ANT-046', nombre: 'Masterbatch Anti-bloqueo', categoria: 'Masterbatch', precio_inicial: 35.00, costo_inicial: 23.70, rotacion: 'media', erosion: 'estable' },
  { sku: 'MB-SLP-047', nombre: 'Masterbatch Deslizante', categoria: 'Masterbatch', precio_inicial: 38.00, costo_inicial: 25.70, rotacion: 'media', erosion: 'estable' },
  { sku: 'PEL-VAC-048', nombre: 'Película Vacuum Metallized', categoria: 'Películas y Láminas', precio_inicial: 95.00, costo_inicial: 64.20, rotacion: 'baja', erosion: 'estable' },
  { sku: 'EQU-COO-049', nombre: 'Unidad de Enfriamiento Industrial', categoria: 'Equipos de Procesamiento', precio_inicial: 8500.00, costo_inicial: 5750.00, rotacion: 'baja', erosion: 'estable' },
  { sku: 'EQU-TRA-050', nombre: 'Transportador de Banda Inclinado', categoria: 'Equipos de Procesamiento', precio_inicial: 6500.00, costo_inicial: 4400.00, rotacion: 'baja', erosion: 'estable' },
];

// ============================================
// HELPERS
// ============================================
const formatDate = (date) => date.toISOString().split('T')[0];
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};
const ruido = (base, pct = 0.03) => base * (1 + (Math.random() - 0.5) * 2 * pct);

const generarUnidades = (rotacion, mesIndex) => {
  const base = rotacion === 'alta' ? 850 : rotacion === 'media' ? 420 : 150;
  const seasonal = 1 + 0.15 * Math.sin((mesIndex / 12) * 2 * Math.PI);
  const trend = 1 + (mesIndex * 0.008);
  return Math.round(base * seasonal * trend * (0.9 + Math.random() * 0.2));
};

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function seedMargenProductos() {
  console.log('🌱 SEED DE MARGEN POR PRODUCTO (Optimizado)\n');
  const startTime = Date.now();

  const client = await pool.connect();
  try {
    const empresaId = 1;
    const fechaInicio = new Date('2024-08-01');
    const totalMeses = 24;

    // 1. Obtener IDs de productos existentes
    const prodResult = await client.query('SELECT id, sku FROM productos WHERE empresa_id = $1', [empresaId]);
    const productoMap = {};
    for (const row of prodResult.rows) {
      productoMap[row.sku] = row.id;
    }
    console.log(`📦 ${prodResult.rows.length} productos encontrados`);

    // 2. Generar TODOS los registros en memoria y luego insertar en batch
    const registros = [];
    let totalMargenPerdido = 0;

    for (const prod of PRODUCTOS_BASE) {
      const productoId = productoMap[prod.sku];
      if (!productoId) {
        console.log(`   ⚠️ Producto ${prod.sku} no encontrado, saltando`);
        continue;
      }

      let precioActual = prod.precio_inicial;
      let costoActual = prod.costo_inicial;

      for (let mes = 0; mes < totalMeses; mes++) {
        const fecha = addMonths(fechaInicio, mes);

        if (prod.erosion === 'gradual') {
          if (mes < 6) costoActual = ruido(costoActual, 0.02);
          else if (mes < 18) costoActual = costoActual * (1 + 0.003 + Math.random() * 0.002);
          else costoActual = costoActual * (1 + 0.005 + Math.random() * 0.003);
          precioActual = ruido(prod.precio_inicial, 0.01);
        } else if (prod.erosion === 'ajuste_insuficiente') {
          if (mes < 8) {
            costoActual = ruido(costoActual, 0.02);
            precioActual = ruido(precioActual, 0.02);
          } else {
            costoActual = costoActual * (1 + 0.004 + Math.random() * 0.002);
            precioActual = precioActual * (1 + 0.002 + Math.random() * 0.001);
          }
        } else if (prod.erosion === 'mejoro') {
          if (mes < 6) {
            costoActual = ruido(costoActual, 0.02);
            precioActual = ruido(precioActual, 0.02);
          } else {
            costoActual = costoActual * (0.997 + Math.random() * 0.004);
            precioActual = precioActual * (1 + 0.003 + Math.random() * 0.002);
          }
        } else {
          costoActual = ruido(costoActual, 0.025);
          precioActual = ruido(precioActual, 0.02);
        }

        const unidades = generarUnidades(prod.rotacion, mes);
        registros.push([productoId, formatDate(fecha), precioActual.toFixed(2), costoActual.toFixed(2), unidades]);
      }

      // Calcular margen perdido para protagonistas
      if (prod.erosion === 'gradual' || prod.erosion === 'ajuste_insuficiente') {
        const margenInicial = ((prod.precio_inicial - prod.costo_inicial) / prod.precio_inicial) * 100;
        const margenFinal = ((precioActual - costoActual) / precioActual) * 100;
        const delta = margenInicial - margenFinal;
        const unidadesAnual = generarUnidades(prod.rotacion, 24) * 12;
        const perdido = (delta / 100) * precioActual * unidadesAnual;
        totalMargenPerdido += perdido;
      }
    }

    console.log(`📊 ${registros.length} registros generados, insertando...`);

    // 3. Insertar en batches de 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const batch = registros.slice(i, i + BATCH_SIZE);
      const values = [];
      const params = [];
      let paramIdx = 1;

      for (const r of batch) {
        values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, 'cpp', $${paramIdx + 4})`);
        params.push(...r);
        paramIdx += 5;
      }

      const sql = `INSERT INTO productos_historial (producto_id, fecha, precio_promedio_realizado, costo_unitario, costo_tipo, unidades_vendidas) VALUES ${values.join(',')} ON CONFLICT (producto_id, fecha) DO UPDATE SET precio_promedio_realizado = EXCLUDED.precio_promedio_realizado, costo_unitario = EXCLUDED.costo_unitario, unidades_vendidas = EXCLUDED.unidades_vendidas`;

      await client.query(sql, params);
      process.stdout.write('.');
    }

    console.log(`\n✅ Seed completado en ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log(`   📦 ${PRODUCTOS_BASE.length} productos`);
    console.log(`   📊 ${registros.length} registros de historial`);
    console.log(`   💰 Margen perdido estimado: Q${Math.round(totalMargenPerdido).toLocaleString()}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seedMargenProductos();
