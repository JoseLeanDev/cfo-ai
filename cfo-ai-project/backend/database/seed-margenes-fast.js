/**
 * Seed dramático optimizado - batch inserts
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com:5432/cfo_ai_db';

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const PRODUCTOS = [
  { sku: 'RES-PEAD-001', nombre: 'Resina PEAD Grado Inyección', cat: 'Resinas', um: 'kg', precio: 24.50, costo: 14.80, rot: 'alta', dir: 'rojo-fuerte', metaDelta: -8.5 },
  { sku: 'RES-PP-002', nombre: 'Polipropileno Homopolímero', cat: 'Resinas', um: 'kg', precio: 22.00, costo: 12.50, rot: 'alta', dir: 'rojo-fuerte', metaDelta: -7.2 },
  { sku: 'MB-WHT-004', nombre: 'Masterbatch Blanco TiO2 70%', cat: 'Masterbatch', um: 'kg', precio: 38.00, costo: 22.00, rot: 'alta', dir: 'rojo-fuerte', metaDelta: -9.1 },
  { sku: 'RES-PEBD-005', nombre: 'Resina PEBD Grado Película', cat: 'Resinas', um: 'kg', precio: 21.50, costo: 13.20, rot: 'media-alta', dir: 'rojo', metaDelta: -7.8 },
  { sku: 'ADD-UV-003', nombre: 'Aditivo UV Absorbente', cat: 'Aditivos', um: 'kg', precio: 45.00, costo: 28.00, rot: 'media', dir: 'ambar', metaDelta: -3.5 },
  { sku: 'ADD-ANT-006', nombre: 'Antioxidante Fenólico', cat: 'Aditivos', um: 'kg', precio: 52.00, costo: 34.00, rot: 'media', dir: 'ambar', metaDelta: -2.8 },
  { sku: 'RES-PEAD-007', nombre: 'Resina PEAD Grado Soplado', cat: 'Resinas', um: 'kg', precio: 23.80, costo: 15.00, rot: 'media', dir: 'ambar', metaDelta: -4.1 },
  { sku: 'RES-PP-008', nombre: 'Polipropileno Copolímero', cat: 'Resinas', um: 'kg', precio: 25.50, costo: 16.00, rot: 'media', dir: 'ambar', metaDelta: -3.2 },
  { sku: 'RES-PS-009', nombre: 'Poliestireno de Uso General', cat: 'Resinas', um: 'kg', precio: 19.00, costo: 11.50, rot: 'media', dir: 'ambar', metaDelta: -2.5 },
  { sku: 'ADD-LUB-010', nombre: 'Lubricante Interno Estearato', cat: 'Aditivos', um: 'kg', precio: 28.00, costo: 17.50, rot: 'baja', dir: 'ambar', metaDelta: -4.5 },
  { sku: 'ADD-ESP-011', nombre: 'Espumante Químico', cat: 'Aditivos', um: 'kg', precio: 65.00, costo: 42.00, rot: 'baja', dir: 'ambar', metaDelta: -3.8 },
  { sku: 'RES-PA-012', nombre: 'Nylon 6 Grado Inyección', cat: 'Resinas', um: 'kg', precio: 58.00, costo: 38.00, rot: 'media', dir: 'ambar', metaDelta: -2.2 },
  { sku: 'MB-BLK-013', nombre: 'Masterbatch Negro Carbono 50%', cat: 'Masterbatch', um: 'kg', precio: 32.00, costo: 20.00, rot: 'media', dir: 'ambar', metaDelta: -3.0 },
  { sku: 'RES-ABS-014', nombre: 'ABS Grado Alta Impacto', cat: 'Resinas', um: 'kg', precio: 48.00, costo: 30.00, rot: 'media', dir: 'ambar', metaDelta: -2.9 },
  { sku: 'ADD-FR-015', nombre: 'Retardante de Llama', cat: 'Aditivos', um: 'kg', precio: 85.00, costo: 55.00, rot: 'baja', dir: 'ambar', metaDelta: -4.2 },
  { sku: 'ADD-IMP-017', nombre: 'Impact Modifier MBS', cat: 'Aditivos', um: 'kg', precio: 42.00, costo: 30.00, rot: 'media', dir: 'mejoro', metaDelta: 2.5 },
  { sku: 'FILM-STR-019', nombre: 'Película Stretch Manual 18"', cat: 'Películas', um: 'rollo', precio: 85.00, costo: 52.00, rot: 'alta', dir: 'estable', metaDelta: -0.3 },
  { sku: 'FILM-STR-020', nombre: 'Película Stretch Maquina 20"', cat: 'Películas', um: 'rollo', precio: 95.00, costo: 60.00, rot: 'alta', dir: 'estable', metaDelta: 0.5 },
  { sku: 'FILM-PE-021', nombre: 'Película de Polietileno', cat: 'Películas', um: 'kg', precio: 18.50, costo: 11.80, rot: 'alta', dir: 'estable', metaDelta: -0.8 },
  { sku: 'BOL-PEAD-022', nombre: 'Bolsa PEAD 20x30cm', cat: 'Empaque', um: 'millar', precio: 320.00, costo: 210.00, rot: 'alta', dir: 'estable', metaDelta: 0.2 },
  { sku: 'BOL-PP-023', nombre: 'Bolsa de Polipropileno', cat: 'Empaque', um: 'millar', precio: 280.00, costo: 185.00, rot: 'media-alta', dir: 'estable', metaDelta: -0.5 },
  { sku: 'ZIP-PE-024', nombre: 'Bolsa Zipper PE', cat: 'Empaque', um: 'millar', precio: 450.00, costo: 300.00, rot: 'media', dir: 'estable', metaDelta: 0.7 },
  { sku: 'CIN-PP-025', nombre: 'Cincho de Polipropileno', cat: 'Empaque', um: 'millar', precio: 180.00, costo: 115.00, rot: 'media-alta', dir: 'estable', metaDelta: -0.4 },
  { sku: 'TAP-CTN-026', nombre: 'Cinta de Embalaje Transparente', cat: 'Empaque', um: 'caja', precio: 120.00, costo: 78.00, rot: 'alta', dir: 'estable', metaDelta: 0.3 },
  { sku: 'CORR-PLS-027', nombre: 'Corrugado Plástico', cat: 'Empaque', um: 'placa', precio: 45.00, costo: 28.00, rot: 'baja', dir: 'estable', metaDelta: -0.6 },
  { sku: 'ISOP-ESP-028', nombre: 'Isopore Espumado', cat: 'Empaque', um: 'placa', precio: 38.00, costo: 24.00, rot: 'baja', dir: 'estable', metaDelta: 0.4 },
  { sku: 'INY-PEQ-029', nombre: 'Inyectora 50 Toneladas', cat: 'Equipos', um: 'unidad', precio: 185000.00, costo: 145000.00, rot: 'muy-baja', dir: 'estable', metaDelta: -0.2 },
  { sku: 'EXT-PEQ-030', nombre: 'Extrusora Monohusillo', cat: 'Equipos', um: 'unidad', precio: 95000.00, costo: 72000.00, rot: 'muy-baja', dir: 'estable', metaDelta: 0.6 },
  { sku: 'MOL-IND-031', nombre: 'Molde Industrial', cat: 'Equipos', um: 'unidad', precio: 45000.00, costo: 32000.00, rot: 'muy-baja', dir: 'estable', metaDelta: -0.3 },
  { sku: 'SOP-TECN-032', nombre: 'Servicio Técnico', cat: 'Servicios', um: 'hora', precio: 850.00, costo: 350.00, rot: 'media', dir: 'estable', metaDelta: 0.8 },
  { sku: 'CAP-IND-033', nombre: 'Capacitación Industrial', cat: 'Servicios', um: 'sesión', precio: 5500.00, costo: 2200.00, rot: 'muy-baja', dir: 'estable', metaDelta: -0.1 },
  { sku: 'FILM-BIO-034', nombre: 'Película Biodegradable', cat: 'Películas', um: 'kg', precio: 28.00, costo: 19.00, rot: 'media', dir: 'estable', metaDelta: 0.4 },
  { sku: 'VAS-ESP-035', nombre: 'Vaso de Espuma', cat: 'Empaque', um: 'millar', precio: 220.00, costo: 145.00, rot: 'alta', dir: 'estable', metaDelta: -0.5 },
  { sku: 'TAR-PP-036', nombre: 'Tarrina de PP 500ml', cat: 'Empaque', um: 'millar', precio: 380.00, costo: 250.00, rot: 'alta', dir: 'estable', metaDelta: 0.3 },
  { sku: 'BOL-BIO-037', nombre: 'Bolsa Biodegradable', cat: 'Empaque', um: 'millar', precio: 520.00, costo: 350.00, rot: 'media', dir: 'estable', metaDelta: -0.4 },
  { sku: 'FILM-ALU-038', nombre: 'Película Metalizada', cat: 'Películas', um: 'kg', precio: 42.00, costo: 28.00, rot: 'baja', dir: 'estable', metaDelta: 0.2 },
  { sku: 'SAC-KRA-039', nombre: 'Saco de Papel Kraft', cat: 'Empaque', um: 'millar', precio: 680.00, costo: 450.00, rot: 'media', dir: 'estable', metaDelta: -0.3 },
  { sku: 'CIN-MET-040', nombre: 'Cincho Metálico', cat: 'Empaque', um: 'caja', precio: 250.00, costo: 165.00, rot: 'baja', dir: 'estable', metaDelta: 0.5 },
  { sku: 'ETI-ADH-041', nombre: 'Etiqueta Adhesiva', cat: 'Empaque', um: 'millar', precio: 180.00, costo: 115.00, rot: 'media-alta', dir: 'estable', metaDelta: -0.2 },
  { sku: 'FILM-BUR-042', nombre: 'Plástico de Burbuja', cat: 'Empaque', um: 'rollo', precio: 150.00, costo: 95.00, rot: 'media', dir: 'estable', metaDelta: 0.3 },
  { sku: 'PAL-MAD-043', nombre: 'Palet de Madera', cat: 'Empaque', um: 'unidad', precio: 180.00, costo: 115.00, rot: 'alta', dir: 'estable', metaDelta: -0.4 },
  { sku: 'ENV-TER-044', nombre: 'Envasadora Termoencogible', cat: 'Equipos', um: 'unidad', precio: 125000.00, costo: 88000.00, rot: 'muy-baja', dir: 'estable', metaDelta: 0.1 },
  { sku: 'GRAN-REC-045', nombre: 'Granulador de Reciclaje', cat: 'Equipos', um: 'unidad', precio: 78000.00, costo: 52000.00, rot: 'muy-baja', dir: 'estable', metaDelta: -0.2 },
  { sku: 'DOS-IND-046', nombre: 'Dosificador Gravimétrico', cat: 'Equipos', um: 'unidad', precio: 35000.00, costo: 22500.00, rot: 'muy-baja', dir: 'estable', metaDelta: 0.4 },
  { sku: 'DES-IND-047', nombre: 'Deshumidificador Industrial', cat: 'Equipos', um: 'unidad', precio: 22000.00, costo: 14500.00, rot: 'muy-baja', dir: 'estable', metaDelta: -0.3 },
  { sku: 'CHA-IND-048', nombre: 'Chiller Industrial', cat: 'Equipos', um: 'unidad', precio: 45000.00, costo: 30000.00, rot: 'muy-baja', dir: 'estable', metaDelta: 0.2 },
  { sku: 'SOP-MNT-049', nombre: 'Mantenimiento Preventivo', cat: 'Servicios', um: 'contrato', precio: 15000.00, costo: 6000.00, rot: 'muy-baja', dir: 'estable', metaDelta: 0.6 },
  { sku: 'CONS-PRO-050', nombre: 'Consultoría de Procesos', cat: 'Servicios', um: 'proyecto', precio: 45000.00, costo: 18000.00, rot: 'muy-baja', dir: 'estable', metaDelta: -0.1 },
];

const ROTACION = {
  'muy-baja': [12, 50],
  'baja': [100, 300],
  'media': [500, 1500],
  'media-alta': [2000, 5000],
  'alta': [8000, 25000],
};

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function r2(v) { return Math.round(v * 100) / 100; }

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE productos_historial, alertas_margen, ventas_detalle RESTART IDENTITY');
    await client.query('DELETE FROM productos WHERE empresa_id = 1');

    // Insertar productos en batch
    const prodValues = PRODUCTOS.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(',');
    const prodParams = PRODUCTOS.flatMap(p => [1, p.sku, p.nombre, p.cat, p.um]);
    const prodResult = await client.query(
      `INSERT INTO productos (empresa_id, sku, nombre, categoria, unidad_medida) VALUES ${prodValues} RETURNING id`,
      prodParams
    );
    const ids = prodResult.rows.map(r => r.id);
    console.log(`📦 ${ids.length} productos insertados`);

    // Generar historial
    const historial = [];
    for (let i = 0; i < PRODUCTOS.length; i++) {
      const p = PRODUCTOS[i];
      const pid = ids[i];
      const unidadesAnuales = rnd(...ROTACION[p.rot]);
      const fechaBase = new Date('2024-01-01');

      for (let mes = 0; mes < 24; mes++) {
        const fecha = new Date(fechaBase);
        fecha.setMonth(fecha.getMonth() + mes);
        const f = mes / 23;
        const rp = (Math.random() - 0.5) * 0.03;
        const rc = (Math.random() - 0.5) * 0.02;

        let precio, costo;
        if (p.dir === 'rojo-fuerte') {
          const sc = f * (p.metaDelta / -100) * p.precio * 1.2;
          precio = p.precio * (1 + rp);
          costo = p.costo + sc + (p.costo * rc);
        } else if (p.dir === 'rojo') {
          const sc = f * (p.metaDelta / -100) * p.precio * 0.9;
          precio = p.precio * (1 + rp * 0.5);
          costo = p.costo + sc + (p.costo * rc);
        } else if (p.dir === 'ambar') {
          const sc = f * (p.metaDelta / -100) * p.precio * 0.8;
          precio = p.precio * (1 + f * 0.02 + rp);
          costo = p.costo + sc + (p.costo * rc);
        } else if (p.dir === 'mejoro') {
          const bc = f * (p.metaDelta / 100) * p.precio * 0.6;
          precio = p.precio * (1 + f * 0.03 + rp);
          costo = Math.max(p.costo * 0.7, p.costo - bc + (p.costo * rc));
        } else {
          precio = p.precio * (1 + (Math.random() - 0.5) * 0.04);
          costo = p.costo * (1 + (Math.random() - 0.5) * 0.03);
        }

        if (costo >= precio * 0.98) costo = precio * 0.95;
        const margen = ((precio - costo) / precio) * 100;
        const unidades = Math.round(unidadesAnuales / 12 * (0.8 + Math.random() * 0.4));

        historial.push([pid, fecha.toISOString().split('T')[0], r2(precio), r2(costo), 'promedio_ponderado', unidades]);
      }
    }

    // Insertar historial en batches de 500
    const BATCH = 500;
    for (let i = 0; i < historial.length; i += BATCH) {
      const batch = historial.slice(i, i + BATCH);
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
    console.log(`\n📊 ${historial.length} registros de historial`);

    // Verificar
    const check = await client.query(`SELECT COUNT(*) FILTER (WHERE semaforo='rojo') as rojos, COUNT(*) FILTER (WHERE semaforo='ambar') as ambar, COUNT(*) FILTER (WHERE semaforo='verde') as verdes, SUM(quetzales_perdidos) as perdido FROM vw_margen_productos`);
    console.log(`\n🔴 ${check.rows[0].rojos} | 🟡 ${check.rows[0].ambar} | 🟢 ${check.rows[0].verdes}`);
    console.log(`💸 Total dejado de ganar: Q ${Math.round(check.rows[0].perdido).toLocaleString()}`);

    const top = await client.query(`SELECT nombre, delta_puntos, quetzales_perdidos, unidades_12m FROM vw_margen_productos ORDER BY delta_puntos ASC LIMIT 5`);
    console.log(`\n🏆 Peores 5:`);
    top.rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.nombre}: ${r.delta_puntos}pp, Q${Math.round(r.quetzales_perdidos).toLocaleString()}, ${r.unidades_12m}u`));

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
