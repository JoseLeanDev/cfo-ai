#!/usr/bin/env node
/**
 * Calibra los datos de tesorería del demo (Grupo Retail Centroamérica).
 *
 * Los datos anteriores no cuadraban entre sí: la cartera estaba 81% vencida,
 * había Q4.85M por pagar a proveedores contra un historial de pagos de
 * Q1.1M al mes, el calendario SAT traía fechas que no son las de ley (IVA el
 * 15, un "IETU" que es un impuesto de México) y el flujo tenía solo 4 meses
 * sueltos. La proyección de caja lee todo esto, así que tiene que cuadrar.
 *
 * Qué deja, todo a la fecha de corte del 31 de marzo de 2026:
 *   - transacciones: seis meses de movimientos (oct 2025 a mar 2026). Las
 *     ventas de tiendas son las mismas de ventas_detalle; el resto es mayoreo.
 *   - cuentas_cobrar: cartera de mayoreo a 30 y 45 días, ~25% vencida.
 *   - cuentas_pagar: unas seis semanas de compras y servicios.
 *   - obligaciones_sat: calendario con fechas de ley y días hábiles.
 *   - prestamos: el préstamo de Banco Industrial cuya cuota sale en el flujo.
 *   - analisis_playbooks: el prompt de caja, alineado con la nueva v_posicion.
 *
 * Al terminar reaplica database/setup/capa_semantica.sql.
 *
 * No toca cuentas_bancarias: los saldos de bancos se quedan igual.
 * Es determinista (semilla fija) e idempotente.
 *
 * Uso: DATABASE_URL=... node scripts/calibrar-demo-tesoreria.js --confirmar
 */
const { Pool } = require('pg');

if (!process.argv.includes('--confirmar')) {
  console.error('Reemplaza cartera, pagos, SAT y flujo del demo. Correr con --confirmar.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------------
const CORTE = '2026-03-31';
const FERIADOS = new Set([
  '2025-10-20', '2025-11-01', '2025-12-25', '2026-01-01', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-06-30', '2026-09-15', '2026-10-20', '2026-11-01', '2026-12-25',
]);
const D = (s) => new Date(s + 'T12:00:00Z');
const iso = (d) => d.toISOString().slice(0, 10);
const mas = (s, n) => { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const habil = (s) => { const w = D(s).getUTCDay(); return w !== 0 && w !== 6 && !FERIADOS.has(s); };
const siguienteHabil = (s) => { while (!habil(s)) s = mas(s, 1); return s; };
const anteriorHabil = (s) => { while (!habil(s)) s = mas(s, -1); return s; };
const finDeMes = (y, m) => iso(new Date(Date.UTC(y, m, 0, 12))); // m de 1 a 12
const diasEntre = (a, b) => Math.round((D(b) - D(a)) / 864e5);
/** Décimo día hábil del mes (ISR trimestral). */
const decimoHabil = (y, m) => { let s = `${y}-${String(m).padStart(2, '0')}-01`, n = 0; for (;;) { if (habil(s) && ++n === 10) return s; s = mas(s, 1); } };

// ---------------------------------------------------------------------------
// Azar reproducible
// ---------------------------------------------------------------------------
let semilla = 20260331;
const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
const entre = (a, b) => Math.round((a + azar() * (b - a)) / 10) * 10;
const numFactura = () => 'F-2026' + String(Math.floor(1000 + azar() * 8999));
const numProveedor = () => 'NC-2026-' + String(Math.floor(1000 + azar() * 8999));

// ---------------------------------------------------------------------------
// Cartera de mayoreo
// ---------------------------------------------------------------------------
const GRANDES = ['Supermercados La Bodeguita, S.A.', 'Corporación El Sol, S.A.', 'Tiendas El Mercado, S.A.', 'Dist. Bebidas del Sur', 'Abarrotería Central, S.A.', 'Hotel Casa Grande'];
const MEDIANOS = ['Despensa Familiar', 'Tienda La Bendición', 'Minisúper La Esquina', 'Cafetería El Buen Café', 'Puesto de Flores María'];

function cartera() {
  const filas = [];
  const agregar = (cliente, dias, lo, hi, nota) => {
    const plazo = GRANDES.includes(cliente) ? 45 : 30;
    const vence = dias <= 0 ? mas(CORTE, dias) : siguienteHabil(mas(CORTE, dias));
    const atraso = Math.max(0, diasEntre(vence, CORTE));
    const monto = entre(lo, hi);
    filas.push({ cliente, factura: numFactura(), emision: mas(vence, -plazo), vence, monto, atraso, nota: nota || null });
  };
  for (let i = 0; i < 24; i++) {
    const grande = i % 3 !== 2;
    const cliente = grande ? GRANDES[i % GRANDES.length] : MEDIANOS[i % MEDIANOS.length];
    agregar(cliente, 1 + Math.floor((i / 24) * 44 + azar() * 3), grande ? 50000 : 22000, grande ? 80000 : 42000);
  }
  for (let i = 0; i < 6; i++) agregar(i < 4 ? GRANDES[(i + 2) % GRANDES.length] : MEDIANOS[i % MEDIANOS.length], -(2 + Math.floor(azar() * 25)), 32000, 62000);
  agregar('Despensa Familiar', -38, 42000, 48000);
  agregar('Tienda La Bendición', -45, 38000, 44000);
  agregar('Puesto de Flores María', -52, 36000, 40000);
  agregar('Restaurante Los 3 Tiempos', -74, 44000, 46000, 'Acordó pagar en dos partes.');
  agregar('Comercial Santa Clara', -118, 27000, 29000, 'En gestión de cobro; el cliente pidió un plan de pagos.');
  return filas;
}

// ---------------------------------------------------------------------------
// Proveedores: inventario a 30 y 45 días, servicios mensuales
// ---------------------------------------------------------------------------
function proveedores() {
  const filas = [];
  const agregar = (proveedor, dias, lo, hi, plazo, nota) => {
    const vence = dias <= 0 ? mas(CORTE, dias) : siguienteHabil(mas(CORTE, dias));
    filas.push({ proveedor, factura: numProveedor(), emision: mas(vence, -plazo), vence, monto: entre(lo, hi), nota: nota || null });
  };
  [3, 10, 17, 24, 31, 38, 45].forEach((n) => agregar('Importadora Centroamericana, S.A.', n, 88000, 112000, 45));
  [6, 16, 27, 37, 44].forEach((n) => agregar('Industrias La Constancia, S.A.', n, 62000, 84000, 45));
  [8, 22, 36].forEach((n) => agregar('Papelera Nacional, S.A.', n, 28000, 38000, 30));
  [4, 18, 32, 43].forEach((n) => agregar('Transportes del Sur, S.A.', n, 24000, 32000, 30));
  [12, 40].forEach((n) => agregar('Suministros de Oficina G&T', n, 9000, 14000, 30));
  [5, 35].forEach((n) => agregar('Alquileres Metropolitanos', n, 96000, 96000, 30));
  [9, 39].forEach((n) => agregar('Servicios Eléctricos de Guatemala', n, 36000, 42000, 30));
  [14, 44].forEach((n) => agregar('Agua y Saneamiento, S.A.', n, 5500, 7000, 30));
  [11, 41].forEach((n) => agregar('Telefónica Guatemala, S.A.', n, 8500, 9500, 30));
  [7, 37].forEach((n) => agregar('Seguridad Privada Orion', n, 44000, 44000, 30));
  agregar('Seguros El Roble, S.A.', 15, 34800, 34800, 30);
  agregar('Publicidad y Marketing 360°', 20, 42000, 52000, 30);
  agregar('Laboratorio de Análisis QMC', 26, 12000, 16000, 30);
  agregar('Consultoría Financiera SIGMA', 30, 28000, 28000, 30);
  agregar('Mantenimiento Industrial GT', -7, 21800, 21800, 30, 'Retenida por un reclamo de calidad; se paga al cerrar la revisión.');
  return filas;
}

// ---------------------------------------------------------------------------
// SAT: fechas de ley. IVA al cierre del mes siguiente, ISR trimestral a 10
// días hábiles, ISO en el mes siguiente al trimestre. Si cae en inhábil,
// pasa al siguiente día hábil.
// ---------------------------------------------------------------------------
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
function sat() {
  const f = [];
  const iva = (y, m, monto, estimado) => {
    const sig = m === 12 ? [y + 1, 1] : [y, m + 1];
    f.push({ tipo: `Declaración IVA ${MESES[m - 1]} ${y}`, periodo: `${y}-${String(m).padStart(2, '0')}`, vence: siguienteHabil(finDeMes(sig[0], sig[1])), monto, estimado });
  };
  const isr = (y, t, monto, estimado) => {
    const [my, mm] = t === 4 ? [y + 1, 1] : [y, t * 3 + 1];
    const rango = ['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic'][t - 1];
    f.push({ tipo: `Pago trimestral ISR ${t}T ${y} (${rango})`, periodo: `${y}-T${t}`, vence: decimoHabil(my, mm), monto, estimado });
  };
  const isoTrim = (y, t, monto, estimado) => {
    const [my, mm] = t === 4 ? [y + 1, 1] : [y, t * 3 + 1];
    f.push({ tipo: `ISO ${t}T ${y}`, periodo: `${y}-T${t}`, vence: siguienteHabil(finDeMes(my, mm)), monto, estimado });
  };
  // Presentadas dentro del historial de flujo
  iva(2025, 9, 83400); isr(2025, 3, 121000); isoTrim(2025, 3, 64000);
  iva(2025, 10, 81000); iva(2025, 11, 84200); iva(2025, 12, 88900);
  isr(2025, 4, 118000); isoTrim(2025, 4, 64000);
  iva(2026, 1, 78500); iva(2026, 2, 92300);
  f.push({ tipo: 'Declaración Anual ISR 2025', periodo: '2025', vence: '2026-03-31', monto: 245000 });
  // Pendientes: calculadas (IVA marzo, ISR e ISO del 1er trimestre) y estimadas
  iva(2026, 3, 87500, false); isr(2026, 1, 125000, false); isoTrim(2026, 1, 66000, false);
  const ivaEst = Math.round((78500 + 92300 + 87500) / 3 / 100) * 100;
  for (const m of [4, 5, 6, 7, 8, 9]) iva(2026, m, ivaEst, true);
  isr(2026, 2, 125000, true); isoTrim(2026, 2, 66000, true);
  isr(2026, 3, 125000, true); isoTrim(2026, 3, 66000, true);
  return f.map((o) => ({ ...o, estado: o.vence <= CORTE ? 'presentada' : 'pendiente', estimado: !!o.estimado }));
}

// ---------------------------------------------------------------------------
// Préstamo: cuota fija sobre saldo
// ---------------------------------------------------------------------------
function prestamo() {
  const monto = 4700000, tasa = 0.095, plazo = 48, r = tasa / 12;
  const cuota = Math.round((monto * r) / (1 - Math.pow(1 + r, -plazo)) * 100) / 100;
  const primer = '2024-08-26';
  let saldo = monto, pagadas = 0;
  for (let y = 2024, m = 8; ; ) {
    const fecha = siguienteHabil(`${y}-${String(m).padStart(2, '0')}-25`);
    if (fecha > CORTE) break;
    saldo -= cuota - saldo * r; pagadas++;
    if (++m > 12) { m = 1; y++; }
  }
  return { banco: 'Banco Industrial', numero: 'PR-019-58213', destino: 'Apertura de tiendas y equipamiento', monto, tasa, plazo, cuota, dia: 25, primer, saldo: Math.round(saldo * 100) / 100, pagadas };
}

// ---------------------------------------------------------------------------
// Flujo de seis meses
// ---------------------------------------------------------------------------
async function flujo(pool, obligaciones, pr) {
  const { rows: tiendas } = await pool.query(
    `SELECT to_char(mes, 'YYYY-MM') AS p, ventas::float AS v FROM analitica.v_ventas_mensuales`);
  const ventas = Object.fromEntries(tiendas.map((t) => [t.p, t.v]));
  // 2026 no tiene ventas de tiendas registradas: se usa el mismo mes de 2025 con 5% de crecimiento.
  const ventasMes = (p) => ventas[p] ?? Math.round((ventas[`2025-${p.slice(5)}`] || 330000) * 1.05);

  const mov = [];
  const add = (fecha, tipo, cat, monto, ref) => mov.push({ fecha, tipo, concepto: `${cat} - ${fecha}`, monto: Math.round(monto * 100) / 100, ref: ref || null });
  const QUINCENA = 170000;
  const BRUTA = Math.round((QUINCENA * 2) / (1 - 0.0483) / 100) * 100;
  const IGSS = Math.round((BRUTA * 0.175) / 100) * 100;

  for (const [y, m] of [[2025, 10], [2025, 11], [2025, 12], [2026, 1], [2026, 2], [2026, 3]]) {
    const p = `${y}-${String(m).padStart(2, '0')}`;
    const dias = [];
    for (let d = 1; d <= Number(finDeMes(y, m).slice(8)); d++) { const s = `${p}-${String(d).padStart(2, '0')}`; if (habil(s)) dias.push(s); }

    // Tiendas: depósito diario, más alto alrededor de las quincenas
    const pesos = dias.map((s) => { const d = Number(s.slice(8)); return (d >= 14 && d <= 17) || d >= 28 || d <= 2 ? 1.3 : 1; });
    const tot = pesos.reduce((a, b) => a + b, 0), vm = ventasMes(p);
    dias.forEach((s, i) => add(s, 'entrada', 'Ventas minoristas', (vm * pesos[i]) / tot * (0.94 + azar() * 0.12)));

    // Mayoreo de contado (lun, mié, vie), cobros de cartera (mar, jue), pagos a proveedores (vie)
    const porDia = (dow) => dias.filter((s) => D(s).getUTCDay() === dow || (dow === 5 && D(s).getUTCDay() === 4 && !habil(mas(s, 1))));
    const reparte = (lista, total, tipo, cat, ref) => {
      const w = lista.map(() => 0.8 + azar() * 0.4), sw = w.reduce((a, b) => a + b, 0);
      lista.forEach((s, i) => add(s, tipo, cat, (total * w[i]) / sw, ref ? ref() : null));
    };
    reparte(dias.filter((s) => [1, 3, 5].includes(D(s).getUTCDay())), 615000 * (0.95 + azar() * 0.1), 'entrada', 'Ventas mayoristas');
    reparte(dias.filter((s) => [2, 4].includes(D(s).getUTCDay())), 1250000 * (0.94 + azar() * 0.12), 'entrada', 'Cobros CxC', numFactura);
    reparte(porDia(5), 1300000 * (0.95 + azar() * 0.1), 'salida', 'Pagos CxP', numProveedor);

    // Intereses (último día hábil) y otros ingresos ocasionales
    add(anteriorHabil(finDeMes(y, m)), 'entrada', 'Intereses bancarios', entre(9000, 11000));
    if (azar() < 0.7) add(dias[Math.floor(azar() * dias.length)], 'entrada', 'Otros ingresos', entre(4000, 9000));

    // Planilla: 15 y último día hábil; aguinaldo en diciembre
    add(anteriorHabil(`${p}-15`), 'salida', 'Nómina', QUINCENA);
    add(anteriorHabil(finDeMes(y, m)), 'salida', 'Nómina', QUINCENA);
    if (m === 12) add(anteriorHabil(`${p}-15`), 'salida', 'Aguinaldo', BRUTA);
    add(anteriorHabil(`${p}-20`), 'salida', 'IGSS', IGSS);

    // Préstamo y gastos sin factura de proveedor
    add(siguienteHabil(`${p}-25`), 'salida', 'Cuota préstamo', pr.cuota, pr.numero);
    add(siguienteHabil(`${p}-05`), 'salida', 'Gastos varios', entre(38000, 44000));
    add(dias[Math.floor(dias.length * 0.6)], 'salida', 'Gastos varios', entre(26000, 34000));
  }
  // Impuestos pagados en su fecha
  for (const o of obligaciones) if (o.estado === 'presentada' && o.vence >= '2025-10-01') add(o.vence, 'salida', 'Impuestos', o.monto, o.tipo);
  return mov.filter((m) => m.fecha <= CORTE).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ---------------------------------------------------------------------------
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  // El nombre del demo vive en la capa semántica; en empresas dice "Empresa Demo".
  const { rows: emp } = await pool.query('SELECT empresa FROM analitica.v_meta');
  if (emp[0]?.empresa !== 'Grupo Retail Centroamérica') throw new Error('Esta base no es la del demo Grupo Retail Centroamérica.');

  const cxc = cartera(), cxp = proveedores(), obligaciones = sat(), pr = prestamo();
  const mov = await flujo(pool, obligaciones, pr);

  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query(`CREATE TABLE IF NOT EXISTS prestamos (
      id SERIAL PRIMARY KEY, empresa_id INTEGER NOT NULL DEFAULT 1, banco VARCHAR(100) NOT NULL,
      numero VARCHAR(50), destino TEXT, moneda VARCHAR(3) NOT NULL DEFAULT 'GTQ',
      monto_original NUMERIC(14,2) NOT NULL, tasa_anual NUMERIC(6,4) NOT NULL, plazo_meses INTEGER NOT NULL,
      cuota NUMERIC(14,2) NOT NULL, dia_pago INTEGER NOT NULL, fecha_primer_pago DATE NOT NULL,
      saldo NUMERIC(14,2) NOT NULL, activo BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW())`);
    await c.query('ALTER TABLE cuentas_cobrar ADD COLUMN IF NOT EXISTS nota TEXT');
    await c.query('ALTER TABLE cuentas_pagar ADD COLUMN IF NOT EXISTS nota TEXT');
    await c.query('ALTER TABLE obligaciones_sat ADD COLUMN IF NOT EXISTS monto_es_estimado BOOLEAN NOT NULL DEFAULT FALSE');

    await c.query('DELETE FROM cuentas_cobrar WHERE empresa_id = 1');
    for (const f of cxc) {
      await c.query(
        `INSERT INTO cuentas_cobrar (empresa_id, cliente_nombre, factura_numero, monto_total, monto_pendiente,
           fecha_emision, fecha_vencimiento, estado, dias_atraso, nota)
         VALUES (1, $1, $2, $3, $3, $4, $5, $6, $7, $8)`,
        [f.cliente, f.factura, f.monto, f.emision, f.vence, f.atraso > 0 ? 'atrasada' : 'al_corriente', f.atraso, f.nota]);
    }
    await c.query('DELETE FROM cuentas_pagar WHERE empresa_id = 1');
    for (const f of cxp) {
      await c.query(
        `INSERT INTO cuentas_pagar (empresa_id, proveedor_nombre, factura_numero, monto_total, monto_pendiente,
           fecha_emision, fecha_vencimiento, estado, dias_restantes, nota)
         VALUES (1, $1, $2, $3, $3, $4, $5, 'pendiente', $6, $7)`,
        [f.proveedor, f.factura, f.monto, f.emision, f.vence, diasEntre(CORTE, f.vence), f.nota]);
    }
    await c.query('DELETE FROM obligaciones_sat WHERE empresa_id = 1');
    for (const o of obligaciones) {
      await c.query(
        `INSERT INTO obligaciones_sat (empresa_id, tipo, periodo, fecha_vencimiento, estado, monto_estimado, monto_es_estimado)
         VALUES (1, $1, $2, $3, $4, $5, $6)`,
        [o.tipo, o.periodo, o.vence, o.estado, o.monto, o.estimado]);
    }
    await c.query('DELETE FROM prestamos WHERE empresa_id = 1');
    await c.query(
      `INSERT INTO prestamos (empresa_id, banco, numero, destino, monto_original, tasa_anual, plazo_meses, cuota, dia_pago, fecha_primer_pago, saldo)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [pr.banco, pr.numero, pr.destino, pr.monto, pr.tasa, pr.plazo, pr.cuota, pr.dia, pr.primer, pr.saldo]);
    await c.query('DELETE FROM transacciones WHERE empresa_id = 1');
    for (const m of mov) {
      await c.query(
        `INSERT INTO transacciones (empresa_id, fecha, tipo, monto, concepto, referencia, estado)
         VALUES (1, $1, $2, $3, $4, $5, 'activa')`,
        [m.fecha, m.tipo, m.monto, m.concepto, m.ref]);
    }
    // El prompt del playbook de caja vive en la base (el seed no pisa ediciones):
    // se alinea con la nueva v_posicion y con el estado presentada del SAT.
    await c.query(
      `UPDATE analisis_playbooks SET updated_at = NOW(), prompt = replace(replace(replace(prompt,
         '(una fila con efectivo, runway y totales)', '(una fila con efectivo, días de caja, flujo neto y totales)'),
         '- Runway en días y gasto diario (v_posicion). Compáralo con el ritmo de salidas de los últimos meses (v_flujo_mensual).',
         '- Días de caja, flujo neto mensual y runway (v_posicion; runway es NULL si el flujo neto es positivo, y entonces no hay quema que reportar). Compáralo con el ritmo de los últimos meses (v_flujo_mensual).'),
         '- Obligaciones con la SAT pendientes o atrasadas que vencen pronto, con monto estimado.',
         '- Obligaciones con la SAT pendientes (estado distinto de presentada) que vencen pronto, con su monto.')
       WHERE slug = 'caja'`);
    await c.query('COMMIT');
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }

  // Las vistas de analitica leen las columnas nuevas: se reaplica la capa
  // semántica aquí para no esperar al siguiente deploy.
  const fs = require('fs'), path = require('path');
  await pool.query(fs.readFileSync(path.join(__dirname, '..', 'database', 'setup', 'capa_semantica.sql'), 'utf8'));

  const s = (a, k = 'monto') => a.reduce((x, y) => x + y[k], 0);
  const venc = cxc.filter((f) => f.atraso > 0);
  console.log(`cartera: ${cxc.length} facturas, Q${Math.round(s(cxc))}, vencida ${((s(venc) / s(cxc)) * 100).toFixed(1)}%`);
  console.log(`proveedores: ${cxp.length} facturas, Q${Math.round(s(cxp))}`);
  console.log(`SAT: ${obligaciones.length} obligaciones, ${obligaciones.filter((o) => o.estado === 'pendiente').length} pendientes`);
  console.log(`préstamo: cuota Q${pr.cuota}, saldo Q${pr.saldo} tras ${pr.pagadas} cuotas`);
  const ent = s(mov.filter((m) => m.tipo === 'entrada')), sal = s(mov.filter((m) => m.tipo === 'salida'));
  console.log(`flujo: ${mov.length} movimientos, entradas Q${Math.round(ent)}, salidas Q${Math.round(sal)}, neto Q${Math.round(ent - sal)}`);
  await pool.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
