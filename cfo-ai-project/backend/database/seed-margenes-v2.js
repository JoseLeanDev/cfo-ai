/**
 * Seed dramático para márgenes - versión corregida
 * El truco: costo bajo los primeros 12 meses, costo alto los últimos 12 meses
 * Precio plano todo el tiempo = divergencia masiva en el promedio año vs año
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 50 productos. Los 4 primeros son ROJOS con caídas masivas.
// El protagonista (índice 0) debe tener el MAYOR quetzales_perdidos.
const PRODUCTOS = [
  // === ROJOS FUERTES (caída 8-10 puntos) ===
  { sku: 'RES-PEAD-001', nombre: 'Resina PEAD Grado Inyección', cat: 'Resinas', um: 'kg', precio: 24.50, costo: 14.80, rot: 'alta', rojo: true, fuerza: 9.5 },
  { sku: 'RES-PP-002', nombre: 'Polipropileno Homopolímero', cat: 'Resinas', um: 'kg', precio: 22.00, costo: 12.50, rot: 'alta', rojo: true, fuerza: 8.2 },
  { sku: 'ADD-UV-003', nombre: 'Aditivo UV Absorbente', cat: 'Aditivos', um: 'kg', precio: 45.00, costo: 28.00, rot: 'media', rojo: true, fuerza: 8.8 },
  { sku: 'MB-WHT-004', nombre: 'Masterbatch Blanco TiO2 70%', cat: 'Masterbatch', um: 'kg', precio: 38.00, costo: 22.00, rot: 'alta', rojo: true, fuerza: 9.1 },

  // === ROJO MODERADO (caída 6-7 puntos) ===
  { sku: 'RES-PEBD-005', nombre: 'Resina PEBD Grado Película', cat: 'Resinas', um: 'kg', precio: 21.50, costo: 13.20, rot: 'media-alta', rojo: true, fuerza: 6.5 },

  // === ÁMBAR (caída 2-5 puntos) ===
  { sku: 'ADD-ANT-006', nombre: 'Antioxidante Fenólico', cat: 'Aditivos', um: 'kg', precio: 52.00, costo: 34.00, rot: 'media', rojo: false, fuerza: 3.5 },
  { sku: 'RES-PEAD-007', nombre: 'Resina PEAD Grado Soplado', cat: 'Resinas', um: 'kg', precio: 23.80, costo: 15.00, rot: 'media', rojo: false, fuerza: 4.2 },
  { sku: 'RES-PP-008', nombre: 'Polipropileno Copolímero', cat: 'Resinas', um: 'kg', precio: 25.50, costo: 16.00, rot: 'media', rojo: false, fuerza: 2.8 },
  { sku: 'RES-PS-009', nombre: 'Poliestireno de Uso General', cat: 'Resinas', um: 'kg', precio: 19.00, costo: 11.50, rot: 'media', rojo: false, fuerza: 3.8 },
  { sku: 'ADD-LUB-010', nombre: 'Lubricante Interno Estearato', cat: 'Aditivos', um: 'kg', precio: 28.00, costo: 17.50, rot: 'baja', rojo: false, fuerza: 4.5 },
  { sku: 'ADD-ESP-011', nombre: 'Espumante Químico', cat: 'Aditivos', um: 'kg', precio: 65.00, costo: 42.00, rot: 'baja', rojo: false, fuerza: 3.2 },
  { sku: 'RES-PA-012', nombre: 'Nylon 6 Grado Inyección', cat: 'Resinas', um: 'kg', precio: 58.00, costo: 38.00, rot: 'media', rojo: false, fuerza: 2.5 },
  { sku: 'MB-BLK-013', nombre: 'Masterbatch Negro Carbono 50%', cat: 'Masterbatch', um: 'kg', precio: 32.00, costo: 20.00, rot: 'media', rojo: false, fuerza: 3.0 },
  { sku: 'RES-ABS-014', nombre: 'ABS Grado Alta Impacto', cat: 'Resinas', um: 'kg', precio: 48.00, costo: 30.00, rot: 'media', rojo: false, fuerza: 3.5 },
  { sku: 'ADD-FR-015', nombre: 'Retardante de Llama', cat: 'Aditivos', um: 'kg', precio: 85.00, costo: 55.00, rot: 'baja', rojo: false, fuerza: 4.0 },
  { sku: 'ADD-PLA-016', nombre: 'Plastificante DOP', cat: 'Aditivos', um: 'kg', precio: 35.00, costo: 22.00, rot: 'media', rojo: false, fuerza: 2.2 },
  { sku: 'ADD-IMP-017', nombre: 'Impact Modifier MBS', cat: 'Aditivos', um: 'kg', precio: 42.00, costo: 30.00, rot: 'media', rojo: false, fuerza: -2.5 },
  { sku: 'FILM-BOP-018', nombre: 'Película BOPP', cat: 'Películas', um: 'kg', precio: 26.00, costo: 16.50, rot: 'alta', rojo: false, fuerza: 1.8 },

  // === ESTABLES (ruido pequeño) ===
  { sku: 'FILM-STR-019', nombre: 'Película Stretch Manual 18"', cat: 'Películas', um: 'rollo', precio: 85.00, costo: 52.00, rot: 'alta', rojo: false, fuerza: 0.5 },
  { sku: 'FILM-STR-020', nombre: 'Película Stretch Maquina 20"', cat: 'Películas', um: 'rollo', precio: 95.00, costo: 60.00, rot: 'alta', rojo: false, fuerza: -0.3 },
  { sku: 'FILM-PE-021', nombre: 'Película de Polietileno', cat: 'Películas', um: 'kg', precio: 18.50, costo: 11.80, rot: 'alta', rojo: false, fuerza: 0.8 },
  { sku: 'BOL-PEAD-022', nombre: 'Bolsa PEAD 20x30cm', cat: 'Empaque', um: 'millar', precio: 320.00, costo: 210.00, rot: 'alta', rojo: false, fuerza: -0.2 },
  { sku: 'BOL-PP-023', nombre: 'Bolsa de Polipropileno', cat: 'Empaque', um: 'millar', precio: 280.00, costo: 185.00, rot: 'media-alta', rojo: false, fuerza: 0.4 },
  { sku: 'ZIP-PE-024', nombre: 'Bolsa Zipper PE', cat: 'Empaque', um: 'millar', precio: 450.00, costo: 300.00, rot: 'media', rojo: false, fuerza: -0.5 },
  { sku: 'CIN-PP-025', nombre: 'Cincho de Polipropileno', cat: 'Empaque', um: 'millar', precio: 180.00, costo: 115.00, rot: 'media-alta', rojo: false, fuerza: 0.3 },
  { sku: 'TAP-CTN-026', nombre: 'Cinta de Embalaje Transparente', cat: 'Empaque', um: 'caja', precio: 120.00, costo: 78.00, rot: 'alta', rojo: false, fuerza: -0.4 },
  { sku: 'CORR-PLS-027', nombre: 'Corrugado Plástico', cat: 'Empaque', um: 'placa', precio: 45.00, costo: 28.00, rot: 'baja', rojo: false, fuerza: 0.6 },
  { sku: 'ISOP-ESP-028', nombre: 'Isopore Espumado', cat: 'Empaque', um: 'placa', precio: 38.00, costo: 24.00, rot: 'baja', rojo: false, fuerza: -0.3 },
  { sku: 'INY-PEQ-029', nombre: 'Inyectora 50 Toneladas', cat: 'Equipos', um: 'unidad', precio: 185000.00, costo: 145000.00, rot: 'muy-baja', rojo: false, fuerza: 0.2 },
  { sku: 'EXT-PEQ-030', nombre: 'Extrusora Monohusillo', cat: 'Equipos', um: 'unidad', precio: 95000.00, costo: 72000.00, rot: 'muy-baja', rojo: false, fuerza: -0.1 },
  { sku: 'MOL-IND-031', nombre: 'Molde Industrial', cat: 'Equipos', um: 'unidad', precio: 45000.00, costo: 32000.00, rot: 'muy-baja', rojo: false, fuerza: 0.4 },
  { sku: 'SOP-TECN-032', nombre: 'Servicio Técnico', cat: 'Servicios', um: 'hora', precio: 850.00, costo: 350.00, rot: 'media', rojo: false, fuerza: -0.6 },
  { sku: 'CAP-IND-033', nombre: 'Capacitación Industrial', cat: 'Servicios', um: 'sesión', precio: 5500.00, costo: 2200.00, rot: 'muy-baja', rojo: false, fuerza: 0.1 },
  { sku: 'FILM-BIO-034', nombre: 'Película Biodegradable', cat: 'Películas', um: 'kg', precio: 28.00, costo: 19.00, rot: 'media', rojo: false, fuerza: -0.4 },
  { sku: 'VAS-ESP-035', nombre: 'Vaso de Espuma', cat: 'Empaque', um: 'millar', precio: 220.00, costo: 145.00, rot: 'alta', rojo: false, fuerza: 0.3 },
  { sku: 'TAR-PP-036', nombre: 'Tarrina de PP 500ml', cat: 'Empaque', um: 'millar', precio: 380.00, costo: 250.00, rot: 'alta', rojo: false, fuerza: -0.2 },
  { sku: 'BOL-BIO-037', nombre: 'Bolsa Biodegradable', cat: 'Empaque', um: 'millar', precio: 520.00, costo: 350.00, rot: 'media', rojo: false, fuerza: 0.5 },
  { sku: 'FILM-ALU-038', nombre: 'Película Metalizada', cat: 'Películas', um: 'kg', precio: 42.00, costo: 28.00, rot: 'baja', rojo: false, fuerza: -0.3 },
  { sku: 'SAC-KRA-039', nombre: 'Saco de Papel Kraft', cat: 'Empaque', um: 'millar', precio: 680.00, costo: 450.00, rot: 'media', rojo: false, fuerza: 0.2 },
  { sku: 'CIN-MET-040', nombre: 'Cincho Metálico', cat: 'Empaque', um: 'caja', precio: 250.00, costo: 165.00, rot: 'baja', rojo: false, fuerza: -0.4 },
  { sku: 'ETI-ADH-041', nombre: 'Etiqueta Adhesiva', cat: 'Empaque', um: 'millar', precio: 180.00, costo: 115.00, rot: 'media-alta', rojo: false, fuerza: 0.3 },
  { sku: 'FILM-BUR-042', nombre: 'Plástico de Burbuja', cat: 'Empaque', um: 'rollo', precio: 150.00, costo: 95.00, rot: 'media', rojo: false, fuerza: -0.1 },
  { sku: 'PAL-MAD-043', nombre: 'Palet de Madera', cat: 'Empaque', um: 'unidad', precio: 180.00, costo: 115.00, rot: 'alta', rojo: false, fuerza: 0.4 },
  { sku: 'ENV-TER-044', nombre: 'Envasadora Termoencogible', cat: 'Equipos', um: 'unidad', precio: 125000.00, costo: 88000.00, rot: 'muy-baja', rojo: false, fuerza: -0.2 },
  { sku: 'GRAN-REC-045', nombre: 'Granulador de Reciclaje', cat: 'Equipos', um: 'unidad', precio: 78000.00, costo: 52000.00, rot: 'muy-baja', rojo: false, fuerza: 0.1 },
  { sku: 'DOS-IND-046', nombre: 'Dosificador Gravimétrico', cat: 'Equipos', um: 'unidad', precio: 35000.00, costo: 22500.00, rot: 'muy-baja', rojo: false, fuerza: -0.3 },
  { sku: 'DES-IND-047', nombre: 'Deshumidificador Industrial', cat: 'Equipos', um: 'unidad', precio: 22000.00, costo: 14500.00, rot: 'muy-baja', rojo: false, fuerza: 0.2 },
  { sku: 'CHA-IND-048', nombre: 'Chiller Industrial', cat: 'Equipos', um: 'unidad', precio: 45000.00, costo: 30000.00, rot: 'muy-baja', rojo: false, fuerza: -0.1 },
  { sku: 'SOP-MNT-049', nombre: 'Mantenimiento Preventivo', cat: 'Servicios', um: 'contrato', precio: 15000.00, costo: 6000.00, rot: 'muy-baja', rojo: false, fuerza: 0.3 },
  { sku: 'CONS-PRO-050', nombre: 'Consultoría de Procesos', cat: 'Servicios', um: 'proyecto', precio: 45000.00, costo: 18000.00, rot: 'muy-baja', rojo: false, fuerza: -0.2 },
];

const ROTACION = {
  'muy-baja': [12, 50], 'baja': [100, 300], 'media': [500, 1500],
  'media-alta': [2000, 5000], 'alta': [8000, 25000],
};

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function r2(v) { return Math.round(v * 100) / 100; }

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE productos_historial, alertas_margen, ventas_detalle RESTART IDENTITY');
    await client.query('DELETE FROM productos WHERE empresa_id = 1');

    // Insertar 50 productos en un solo batch
    const pv = PRODUCTOS.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(',');
    const pp = PRODUCTOS.flatMap(p => [1, p.sku, p.nombre, p.cat, p.um]);
    const pr = await client.query(`INSERT INTO productos (empresa_id, sku, nombre, categoria, unidad_medida) VALUES ${pv} RETURNING id`, pp);
    const ids = pr.rows.map(r => r.id);
    console.log(`📦 ${ids.length} productos insertados`);

    // Generar historial: 24 meses, precio plano, costo bajo meses 0-11, costo alto meses 12-23
    const historial = [];
    const fechaBase = new Date('2024-01-01');

    for (let i = 0; i < PRODUCTOS.length; i++) {
      const p = PRODUCTOS[i];
      const pid = ids[i];
      const unidadesAnuales = rnd(...ROTACION[p.rot]);

      // Margen inicial (meses 0-11)
      const margenInicial = ((p.precio - p.costo) / p.precio) * 100;
      // Margen objetivo después de la caída
      const margenFinal = Math.max(5, margenInicial - p.fuerza);
      // Costo que corresponde al margen final (precio fijo)
      const costoFinal = p.precio * (1 - margenFinal / 100);

      for (let mes = 0; mes < 24; mes++) {
        const fecha = new Date(fechaBase);
        fecha.setMonth(fecha.getMonth() + mes);

        // Precio: plano con ruido mínimo
        const precio = p.precio * (1 + (Math.random() - 0.5) * 0.01);

        // Costo: bajo y estable meses 0-11, sube progresivamente meses 12-23
        let costo;
        if (mes < 12) {
          // Primer año: costo estable cerca del inicial
          costo = p.costo * (1 + (Math.random() - 0.5) * 0.03);
        } else {
          // Segundo año: costo sube desde inicial hasta final
          const progreso = (mes - 12) / 11; // 0 a 1
          const costoBase = p.costo + (costoFinal - p.costo) * progreso;
          costo = costoBase * (1 + (Math.random() - 0.5) * 0.02);
        }

        // Asegurar margen positivo
        if (costo >= precio * 0.97) costo = precio * 0.92;

        const unidades = Math.round(unidadesAnuales / 12 * (0.85 + Math.random() * 0.3));
        historial.push([pid, fecha.toISOString().split('T')[0], r2(precio), r2(costo), 'promedio_ponderado', unidades]);
      }
    }

    // Insertar historial en batches
    for (let i = 0; i < historial.length; i += 500) {
      const batch = historial.slice(i, i + 500);
      const vals = batch.map((_, j) => {
        const b = j * 6;
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6})`;
      }).join(',');
      await client.query(
        `INSERT INTO productos_historial (producto_id, fecha, precio_promedio_realizado, costo_unitario, costo_tipo, unidades_vendidas) VALUES ${vals}`,
        batch.flat()
      );
      process.stdout.write('.');
    }

    await client.query('COMMIT');
    console.log(`\n📊 ${historial.length} registros`);

    // Verificar
    const check = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE semaforo = 'rojo') as rojos,
        COUNT(*) FILTER (WHERE semaforo = 'ambar') as ambar,
        COUNT(*) FILTER (WHERE semaforo = 'verde') as verdes,
        SUM(quetzales_perdidos) as perdido
      FROM vw_margen_productos
    `);
    console.log(`\n🔴 ${check.rows[0].rojos} | 🟡 ${check.rows[0].ambar} | 🟢 ${check.rows[0].verdes}`);
    console.log(`💸 Total dejado de ganar: Q ${Math.round(check.rows[0].perdido).toLocaleString()}`);

    const top = await client.query(`
      SELECT nombre, margen_pct_actual, margen_pct_historico, delta_puntos, quetzales_perdidos, unidades_12m
      FROM vw_margen_productos ORDER BY delta_puntos ASC LIMIT 6
    `);
    console.log(`\n🏆 Peores márgenes:`);
    top.rows.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.nombre}: ${r.margen_pct_historico}%→${r.margen_pct_actual}% (${r.delta_puntos}pp), Q${Math.round(r.quetzales_perdidos).toLocaleString()}, ${r.unidades_12m}u`);
    });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
