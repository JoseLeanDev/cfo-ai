/**
 * Seed script para productos e historial con datos dramáticos de demo
 * 4 rojos (caída 7-10pp, alta rotación), 13 ámbar, 1 que mejoró, resto estable
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Productos configurados para el demo dramático
// El protagonista (índice 0) es el de mayor volumen y mayor pérdida
const PRODUCTOS_CONFIG = [
  // === ROJOS: caída 7-10 puntos, alta rotación ===
  { sku: 'RES-PEAD-001', nombre: 'Resina PEAD Grado Inyección', categoria: 'Resinas', unidad: 'kg', precioIni: 24.50, costoIni: 14.80, rotacion: 'alta', direccion: 'rojo-fuerte', metaDelta: -8.5 },
  { sku: 'RES-PP-002', nombre: 'Polipropileno Homopolímero', categoria: 'Resinas', unidad: 'kg', precioIni: 22.00, costoIni: 12.50, rotacion: 'alta', direccion: 'rojo-fuerte', metaDelta: -7.2 },
  { sku: 'MB-WHT-004', nombre: 'Masterbatch Blanco TiO2 70%', categoria: 'Masterbatch', unidad: 'kg', precioIni: 38.00, costoIni: 22.00, rotacion: 'alta', direccion: 'rojo-fuerte', metaDelta: -9.1 },
  { sku: 'RES-PEBD-005', nombre: 'Resina PEBD Grado Película', categoria: 'Resinas', unidad: 'kg', precioIni: 21.50, costoIni: 13.20, rotacion: 'media-alta', direccion: 'rojo', metaDelta: -7.8 },
  
  // === ÁMBAR: caída 2-5 puntos ===
  { sku: 'ADD-UV-003', nombre: 'Aditivo UV Absorbente', categoria: 'Aditivos', unidad: 'kg', precioIni: 45.00, costoIni: 28.00, rotacion: 'media', direccion: 'ambar', metaDelta: -3.5 },
  { sku: 'ADD-ANT-006', nombre: 'Antioxidante Fenólico', categoria: 'Aditivos', unidad: 'kg', precioIni: 52.00, costoIni: 34.00, rotacion: 'media', direccion: 'ambar', metaDelta: -2.8 },
  { sku: 'RES-PEAD-007', nombre: 'Resina PEAD Grado Soplado', categoria: 'Resinas', unidad: 'kg', precioIni: 23.80, costoIni: 15.00, rotacion: 'media', direccion: 'ambar', metaDelta: -4.1 },
  { sku: 'RES-PP-008', nombre: 'Polipropileno Copolímero', categoria: 'Resinas', unidad: 'kg', precioIni: 25.50, costoIni: 16.00, rotacion: 'media', direccion: 'ambar', metaDelta: -3.2 },
  { sku: 'RES-PS-009', nombre: 'Poliestireno de Uso General', categoria: 'Resinas', unidad: 'kg', precioIni: 19.00, costoIni: 11.50, rotacion: 'media', direccion: 'ambar', metaDelta: -2.5 },
  { sku: 'ADD-LUB-010', nombre: 'Lubricante Interno Estearato', categoria: 'Aditivos', unidad: 'kg', precioIni: 28.00, costoIni: 17.50, rotacion: 'baja', direccion: 'ambar', metaDelta: -4.5 },
  { sku: 'ADD-ESP-011', nombre: 'Espumante Químico', categoria: 'Aditivos', unidad: 'kg', precioIni: 65.00, costoIni: 42.00, rotacion: 'baja', direccion: 'ambar', metaDelta: -3.8 },
  { sku: 'RES-PA-012', nombre: 'Nylon 6 Grado Inyección', categoria: 'Resinas', unidad: 'kg', precioIni: 58.00, costoIni: 38.00, rotacion: 'media', direccion: 'ambar', metaDelta: -2.2 },
  { sku: 'MB-BLK-013', nombre: 'Masterbatch Negro Carbono 50%', categoria: 'Masterbatch', unidad: 'kg', precioIni: 32.00, costoIni: 20.00, rotacion: 'media', direccion: 'ambar', metaDelta: -3.0 },
  { sku: 'RES-ABS-014', nombre: 'ABS Grado Alta Impacto', categoria: 'Resinas', unidad: 'kg', precioIni: 48.00, costoIni: 30.00, rotacion: 'media', direccion: 'ambar', metaDelta: -2.9 },
  { sku: 'ADD-FR-015', nombre: 'Retardante de Llama', categoria: 'Aditivos', unidad: 'kg', precioIni: 85.00, costoIni: 55.00, rotacion: 'baja', direccion: 'ambar', metaDelta: -4.2 },
  
  // === VERDE: 1 que mejoró ===
  { sku: 'ADD-IMP-017', nombre: 'Impact Modifier MBS', categoria: 'Aditivos', unidad: 'kg', precioIni: 42.00, costoIni: 30.00, rotacion: 'media', direccion: 'mejoro', metaDelta: 2.5 },
  
  // === ESTABLE: ruido normal, deltas pequeños (-1 a +1) ===
  { sku: 'FILM-STR-019', nombre: 'Película Stretch Manual 18"', categoria: 'Películas', unidad: 'rollo', precioIni: 85.00, costoIni: 52.00, rotacion: 'alta', direccion: 'estable', metaDelta: -0.3 },
  { sku: 'FILM-STR-020', nombre: 'Película Stretch Maquina 20"', categoria: 'Películas', unidad: 'rollo', precioIni: 95.00, costoIni: 60.00, rotacion: 'alta', direccion: 'estable', metaDelta: 0.5 },
  { sku: 'FILM-PE-021', nombre: 'Película de Polietileno', categoria: 'Películas', unidad: 'kg', precioIni: 18.50, costoIni: 11.80, rotacion: 'alta', direccion: 'estable', metaDelta: -0.8 },
  { sku: 'BOL-PEAD-022', nombre: 'Bolsa PEAD 20x30cm', categoria: 'Empaque', unidad: 'millar', precioIni: 320.00, costoIni: 210.00, rotacion: 'alta', direccion: 'estable', metaDelta: 0.2 },
  { sku: 'BOL-PP-023', nombre: 'Bolsa de Polipropileno', categoria: 'Empaque', unidad: 'millar', precioIni: 280.00, costoIni: 185.00, rotacion: 'media-alta', direccion: 'estable', metaDelta: -0.5 },
  { sku: 'ZIP-PE-024', nombre: 'Bolsa Zipper PE', categoria: 'Empaque', unidad: 'millar', precioIni: 450.00, costoIni: 300.00, rotacion: 'media', direccion: 'estable', metaDelta: 0.7 },
  { sku: 'CIN-PP-025', nombre: 'Cincho de Polipropileno', categoria: 'Empaque', unidad: 'millar', precioIni: 180.00, costoIni: 115.00, rotacion: 'media-alta', direccion: 'estable', metaDelta: -0.4 },
  { sku: 'TAP-CTN-026', nombre: 'Cinta de Embalaje Transparente', categoria: 'Empaque', unidad: 'caja', precioIni: 120.00, costoIni: 78.00, rotacion: 'alta', direccion: 'estable', metaDelta: 0.3 },
  { sku: 'CORR-PLS-027', nombre: 'Corrugado Plástico', categoria: 'Empaque', unidad: 'placa', precioIni: 45.00, costoIni: 28.00, rotacion: 'baja', direccion: 'estable', metaDelta: -0.6 },
  { sku: 'ISOP-ESP-028', nombre: 'Isopore Espumado', categoria: 'Empaque', unidad: 'placa', precioIni: 38.00, costoIni: 24.00, rotacion: 'baja', direccion: 'estable', metaDelta: 0.4 },
  { sku: 'INY-PEQ-029', nombre: 'Inyectora 50 Toneladas', categoria: 'Equipos', unidad: 'unidad', precioIni: 185000.00, costoIni: 145000.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: -0.2 },
  { sku: 'EXT-PEQ-030', nombre: 'Extrusora Monohusillo', categoria: 'Equipos', unidad: 'unidad', precioIni: 95000.00, costoIni: 72000.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: 0.6 },
  { sku: 'MOL-IND-031', nombre: 'Molde Industrial', categoria: 'Equipos', unidad: 'unidad', precioIni: 45000.00, costoIni: 32000.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: -0.3 },
  { sku: 'SOP-TECN-032', nombre: 'Servicio Técnico', categoria: 'Servicios', unidad: 'hora', precioIni: 850.00, costoIni: 350.00, rotacion: 'media', direccion: 'estable', metaDelta: 0.8 },
  { sku: 'CAP-IND-033', nombre: 'Capacitación Industrial', categoria: 'Servicios', unidad: 'sesión', precioIni: 5500.00, costoIni: 2200.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: -0.1 },
  { sku: 'FILM-BIO-034', nombre: 'Película Biodegradable', categoria: 'Películas', unidad: 'kg', precioIni: 28.00, costoIni: 19.00, rotacion: 'media', direccion: 'estable', metaDelta: 0.4 },
  { sku: 'VAS-ESP-035', nombre: 'Vaso de Espuma', categoria: 'Empaque', unidad: 'millar', precioIni: 220.00, costoIni: 145.00, rotacion: 'alta', direccion: 'estable', metaDelta: -0.5 },
  { sku: 'TAR-PP-036', nombre: 'Tarrina de PP 500ml', categoria: 'Empaque', unidad: 'millar', precioIni: 380.00, costoIni: 250.00, rotacion: 'alta', direccion: 'estable', metaDelta: 0.3 },
  { sku: 'BOL-BIO-037', nombre: 'Bolsa Biodegradable', categoria: 'Empaque', unidad: 'millar', precioIni: 520.00, costoIni: 350.00, rotacion: 'media', direccion: 'estable', metaDelta: -0.4 },
  { sku: 'FILM-ALU-038', nombre: 'Película Metalizada', categoria: 'Películas', unidad: 'kg', precioIni: 42.00, costoIni: 28.00, rotacion: 'baja', direccion: 'estable', metaDelta: 0.2 },
  { sku: 'SAC-KRA-039', nombre: 'Saco de Papel Kraft', categoria: 'Empaque', unidad: 'millar', precioIni: 680.00, costoIni: 450.00, rotacion: 'media', direccion: 'estable', metaDelta: -0.3 },
  { sku: 'CIN-MET-040', nombre: 'Cincho Metálico', categoria: 'Empaque', unidad: 'caja', precioIni: 250.00, costoIni: 165.00, rotacion: 'baja', direccion: 'estable', metaDelta: 0.5 },
  { sku: 'ETI-ADH-041', nombre: 'Etiqueta Adhesiva', categoria: 'Empaque', unidad: 'millar', precioIni: 180.00, costoIni: 115.00, rotacion: 'media-alta', direccion: 'estable', metaDelta: -0.2 },
  { sku: 'FILM-BUR-042', nombre: 'Plástico de Burbuja', categoria: 'Empaque', unidad: 'rollo', precioIni: 150.00, costoIni: 95.00, rotacion: 'media', direccion: 'estable', metaDelta: 0.3 },
  { sku: 'PAL-MAD-043', nombre: 'Palet de Madera', categoria: 'Empaque', unidad: 'unidad', precioIni: 180.00, costoIni: 115.00, rotacion: 'alta', direccion: 'estable', metaDelta: -0.4 },
  { sku: 'ENV-TER-044', nombre: 'Envasadora Termoencogible', categoria: 'Equipos', unidad: 'unidad', precioIni: 125000.00, costoIni: 88000.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: 0.1 },
  { sku: 'GRAN-REC-045', nombre: 'Granulador de Reciclaje', categoria: 'Equipos', unidad: 'unidad', precioIni: 78000.00, costoIni: 52000.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: -0.2 },
  { sku: 'DOS-IND-046', nombre: 'Dosificador Gravimétrico', categoria: 'Equipos', unidad: 'unidad', precioIni: 35000.00, costoIni: 22500.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: 0.4 },
  { sku: 'DES-IND-047', nombre: 'Deshumidificador Industrial', categoria: 'Equipos', unidad: 'unidad', precioIni: 22000.00, costoIni: 14500.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: -0.3 },
  { sku: 'CHA-IND-048', nombre: 'Chiller Industrial', categoria: 'Equipos', unidad: 'unidad', precioIni: 45000.00, costoIni: 30000.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: 0.2 },
  { sku: 'SOP-MNT-049', nombre: 'Mantenimiento Preventivo', categoria: 'Servicios', unidad: 'contrato', precioIni: 15000.00, costoIni: 6000.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: 0.6 },
  { sku: 'CONS-PRO-050', nombre: 'Consultoría de Procesos', categoria: 'Servicios', unidad: 'proyecto', precioIni: 45000.00, costoIni: 18000.00, rotacion: 'muy-baja', direccion: 'estable', metaDelta: -0.1 },
];

// Factores de rotación (unidades anuales)
const ROTACION = {
  'muy-baja': { min: 12, max: 50 },
  'baja': { min: 100, max: 300 },
  'media': { min: 500, max: 1500 },
  'media-alta': { min: 2000, max: 5000 },
  'alta': { min: 8000, max: 25000 },
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

async function seedDramatico() {
  console.log('🎭 SEED DRAMÁTICO DE MÁRGENES\n');
  const client = await pool.connect();

  try {
    // Limpiar tablas
    await client.query('TRUNCATE TABLE productos_historial, alertas_margen, ventas_detalle RESTART IDENTITY');
    await client.query('DELETE FROM productos WHERE empresa_id = 1');
    console.log('🧹 Tablas limpiadas');

    const productoIds = [];
    const historialRecords = [];

    for (const p of PRODUCTOS_CONFIG) {
      // Insertar producto
      const prodResult = await client.query(
        `INSERT INTO productos (empresa_id, sku, nombre, categoria, unidad_medida, activo)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
        [1, p.sku, p.nombre, p.categoria, p.unidad]
      );
      const productoId = prodResult.rows[0].id;
      productoIds.push(productoId);

      // Calcular unidades anuales
      const rot = ROTACION[p.rotacion];
      const unidadesAnuales = randomInt(rot.min, rot.max);

      // Generar 24 meses de historial
      const fechaBase = new Date('2024-01-01');
      let precioActual = p.precioIni;
      let costoActual = p.costoIni;

      // Mes 0 = hace 24 meses (para calcular margen_pct_historico)
      // Mes 23 = actual
      for (let mes = 0; mes < 24; mes++) {
        const fecha = new Date(fechaBase);
        fecha.setMonth(fecha.getMonth() + mes);
        const fechaStr = fecha.toISOString().split('T')[0];

        // Evolución de precio y costo según dirección
        const factorMes = mes / 23; // 0 a 1
        const ruidoPrecio = (Math.random() - 0.5) * 0.03; // ±1.5% ruido
        const ruidoCosto = (Math.random() - 0.5) * 0.02;  // ±1% ruido

        if (p.direccion === 'rojo-fuerte') {
          // Precio plano, costo sube significativamente
          const subidaCosto = factorMes * (p.metaDelta / -100) * p.precioIni * 1.2;
          precioActual = p.precioIni * (1 + ruidoPrecio);
          costoActual = p.costoIni + subidaCosto + (p.costoIni * ruidoCosto);
        } else if (p.direccion === 'rojo') {
          const subidaCosto = factorMes * (p.metaDelta / -100) * p.precioIni * 0.9;
          precioActual = p.precioIni * (1 + ruidoPrecio * 0.5);
          costoActual = p.costoIni + subidaCosto + (p.costoIni * ruidoCosto);
        } else if (p.direccion === 'ambar') {
          const subidaCosto = factorMes * (p.metaDelta / -100) * p.precioIni * 0.8;
          precioActual = p.precioIni * (1 + factorMes * 0.02 + ruidoPrecio);
          costoActual = p.costoIni + subidaCosto + (p.costoIni * ruidoCosto);
        } else if (p.direccion === 'mejoro') {
          // Costo baja, precio sube
          const bajadaCosto = factorMes * (p.metaDelta / 100) * p.precioIni * 0.6;
          precioActual = p.precioIni * (1 + factorMes * 0.03 + ruidoPrecio);
          costoActual = Math.max(p.costoIni * 0.7, p.costoIni - bajadaCosto + (p.costoIni * ruidoCosto));
        } else {
          // Estable: ruido normal
          precioActual = p.precioIni * (1 + (Math.random() - 0.5) * 0.04);
          costoActual = p.costoIni * (1 + (Math.random() - 0.5) * 0.03);
        }

        // Asegurar que costo < precio (excepto casos extremos)
        if (costoActual >= precioActual * 0.98) {
          costoActual = precioActual * 0.95;
        }

        const margenPct = ((precioActual - costoActual) / precioActual) * 100;
        const unidadesMes = Math.round(unidadesAnuales / 12 * (0.8 + Math.random() * 0.4));

        historialRecords.push({
          producto_id: productoId,
          fecha: fechaStr,
          precio_promedio_realizado: round2(precioActual),
          costo_unitario: round2(costoActual),
          unidades_vendidas: unidadesMes,
          margen_pct: round2(margenPct),
        });
      }

      if (PRODUCTOS_CONFIG.indexOf(p) % 10 === 0) process.stdout.write('.');
    }

    console.log(`\n📦 ${productoIds.length} productos creados`);

    // Insertar historial en batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < historialRecords.length; i += BATCH_SIZE) {
      const batch = historialRecords.slice(i, i + BATCH_SIZE);
      const values = batch.map((_, idx) => {
        const base = idx * 6;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      }).join(',');
      const params = batch.flatMap(h => [h.producto_id, h.fecha, h.precio_promedio_realizado, h.costo_unitario, h.unidades_vendidas, h.margen_pct]);
      await client.query(
        `INSERT INTO productos_historial (producto_id, fecha, precio_promedio_realizado, costo_unitario, unidades_vendidas, margen_pct) VALUES ${values}`,
        params
      );
    }

    console.log(`📊 ${historialRecords.length} registros de historial insertados`);

    // Verificar resultados
    const check = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE semaforo = 'rojo') as rojos,
        COUNT(*) FILTER (WHERE semaforo = 'ambar') as ambar,
        COUNT(*) FILTER (WHERE semaforo = 'verde') as verdes,
        SUM(quetzales_perdidos) as total_perdido
      FROM vw_margen_productos
    `);
    console.log(`\n📈 Resultados:`);
    console.log(`   🔴 Rojos: ${check.rows[0].rojos}`);
    console.log(`   🟡 Ámbar: ${check.rows[0].ambar}`);
    console.log(`   🟢 Verdes: ${check.rows[0].verdes}`);
    console.log(`   💸 Total perdido: Q ${Math.round(check.rows[0].total_perdido).toLocaleString()}`);

    // Mostrar top 5 peores
    const topPeores = await client.query(`
      SELECT nombre, sku, margen_pct_actual, margen_pct_historico, delta_puntos, quetzales_perdidos, unidades_12m
      FROM vw_margen_productos ORDER BY delta_puntos ASC LIMIT 5
    `);
    console.log(`\n🏆 Top 5 peores márgenes:`);
    topPeores.rows.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.nombre}: ${r.delta_puntos}pp, Q${Math.round(r.quetzales_perdidos).toLocaleString()}, ${r.unidades_12m} unidades`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seedDramatico();
