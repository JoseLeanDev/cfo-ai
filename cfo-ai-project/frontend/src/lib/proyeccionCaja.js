/**
 * Proyección de caja semana a semana.
 *
 * Recibe los insumos de GET /api/tesoreria/proyeccion (bancos, cartera y pagos
 * por factura, SAT pendiente, préstamos y ritmos de los últimos seis meses) y
 * arma cada partida con su semana, su monto y de dónde sale. Lo que tiene
 * documento (factura, declaración, contrato) se marca `doc`; lo que sale de un
 * ritmo histórico es estimado. Así la página puede abrir cualquier celda
 * hasta la factura o el supuesto que la compone.
 *
 * Semana 1 va del día siguiente al corte a siete días después. Lo que ya
 * venció al corte cae en la semana 1.
 */

const DIA = 864e5
export const HMAX = 26
const SEM = 12 / 52

// Feriados nacionales de Guatemala: mueven quincenas, IGSS y cuotas.
const FERIADOS = new Set([
  '2026-01-01', '2026-04-02', '2026-04-03', '2026-05-01', '2026-06-30', '2026-09-15',
  '2026-10-20', '2026-11-01', '2026-12-25',
  '2027-01-01', '2027-03-25', '2027-03-26', '2027-05-01', '2027-06-30', '2027-09-15',
])

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// ---------------------------------------------------------------------------
// Fechas (todo en UTC, como días desde el corte)
// ---------------------------------------------------------------------------
const aFecha = (s) => new Date(s + 'T00:00:00Z')
const iso = (d) => d.toISOString().slice(0, 10)
const mas = (s, n) => iso(new Date(aFecha(s).getTime() + n * DIA))
const esHabil = (s) => {
  const w = aFecha(s).getUTCDay()
  return w !== 0 && w !== 6 && !FERIADOS.has(s)
}
const siguienteHabil = (s) => { while (!esHabil(s)) s = mas(s, 1); return s }
const anteriorHabil = (s) => { while (!esHabil(s)) s = mas(s, -1); return s }
const finDeMes = (y, m) => iso(new Date(Date.UTC(y, m + 1, 0)))

export function crearCalendario(corte) {
  const base = aFecha(corte).getTime()
  const dnum = (s) => Math.round((aFecha(s).getTime() - base) / DIA)
  const fecha = (n) => new Date(base + n * DIA)
  const fd = (n) => { const d = fecha(n); return `${d.getUTCDate()} ${MES[d.getUTCMonth()]}` }
  const semana = (n) => (n <= 0 ? 0 : Math.floor((n - 1) / 7))
  const rango = (w) => {
    const a = w * 7 + 1, b = a + 6, da = fecha(a), db = fecha(b)
    return da.getUTCMonth() === db.getUTCMonth()
      ? `${da.getUTCDate()}–${db.getUTCDate()} ${MES[db.getUTCMonth()]}`
      : `${fd(a)} – ${fd(b)}`
  }
  // Meses que toca el horizonte máximo
  const meses = []
  const d0 = fecha(1), d1 = fecha(HMAX * 7)
  for (let y = d0.getUTCFullYear(), m = d0.getUTCMonth(); y < d1.getUTCFullYear() || (y === d1.getUTCFullYear() && m <= d1.getUTCMonth()); ) {
    meses.push([y, m])
    if (++m > 11) { m = 0; y++ }
  }
  const delMes = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return { corte, dnum, fd, semana, rango, meses, delMes }
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------
export const nf = (v) => Math.round(Math.abs(v)).toLocaleString('en-US')
export const fq = (v) => (v < 0 ? '−' : '') + 'Q' + nf(v)
export const fm = (v) => (v < 0 ? '−' : '') + 'Q' + (Math.abs(v) / 1e6).toFixed(2) + ' M'
export const fk = (v) => {
  const k = Math.round(v / 1000)
  return k === 0 ? '·' : k < 0 ? `(${Math.abs(k).toLocaleString('en-US')})` : k.toLocaleString('en-US')
}
export const pct = (p) => Math.round(p * 100) + '%'
export const suma = (a) => a.reduce((x, y) => x + y, 0)

// ---------------------------------------------------------------------------
// Escenarios: cuánto de la cartera entra y cuándo, según su antigüedad
// ---------------------------------------------------------------------------
export const ESCENARIOS = {
  cons: { nombre: 'Conservador', ventas: 0.92, cur: { p: 0.93, lag: 14 }, b1: { p: 0.8, from: 0, n: 3 }, b2: { p: 0.6, from: 1, n: 4 }, b3: { p: 0.35, from: 2, n: 6 }, b4: { p: 0.1, from: 4, n: 8 } },
  base: { nombre: 'Base', ventas: 1.0, cur: { p: 0.98, lag: 6 }, b1: { p: 0.92, from: 0, n: 2 }, b2: { p: 0.78, from: 0, n: 3 }, b3: { p: 0.55, from: 1, n: 4 }, b4: { p: 0.25, from: 2, n: 8 } },
  opt: { nombre: 'Optimista', ventas: 1.05, cur: { p: 1.0, lag: 2 }, b1: { p: 0.97, from: 0, n: 2 }, b2: { p: 0.9, from: 0, n: 2 }, b3: { p: 0.75, from: 1, n: 3 }, b4: { p: 0.45, from: 1, n: 6 } },
}
export const TRAMOS = { cur: 'Al corriente', b1: '1 a 30 días', b2: '31 a 60 días', b3: '61 a 90 días', b4: 'Más de 90 días' }
export const tramo = (d) => (d <= 0 ? 'cur' : d <= 30 ? 'b1' : d <= 60 ? 'b2' : d <= 90 ? 'b3' : 'b4')

// Plazos de crédito: mitad de la cartera de mayoreo a 30 días y mitad a 45;
// las compras, 30% a 30 días (servicios) y 70% a 45 (inventario).
const PLAZOS_VENTA = [[30, 0.5], [45, 0.5]]
const PLAZOS_COMPRA = [[30, 0.3], [45, 0.7]]

export const FILAS = [
  { k: 'cartera', t: 'Cobros de cartera', io: 'in', tag: 'doc' },
  { k: 'credito', t: 'Cobros de ventas a crédito nuevas', io: 'in', tag: 'est' },
  { k: 'contado', t: 'Ventas de contado', io: 'in', tag: 'est' },
  { k: 'otros', t: 'Intereses y otros ingresos', io: 'in', tag: 'est' },
  { k: 'plazoIn', t: 'Vencimiento de plazo fijo', io: 'in', tag: 'doc' },
  { k: 'prov', t: 'Proveedores con factura', io: 'out', tag: 'doc' },
  { k: 'compras', t: 'Compras aún sin factura', io: 'out', tag: 'est' },
  { k: 'sat', t: 'Impuestos SAT', io: 'out', tag: 'mix' },
  { k: 'planilla', t: 'Planilla', io: 'out', tag: 'est' },
  { k: 'igss', t: 'IGSS, IRTRA e INTECAP', io: 'out', tag: 'est' },
  { k: 'bono', t: 'Bono 14 y aguinaldo', io: 'out', tag: 'est' },
  { k: 'prestamo', t: 'Cuota de préstamo', io: 'out', tag: 'doc' },
  { k: 'opex', t: 'Gastos de operación', io: 'out', tag: 'est' },
  { k: 'plazoOut', t: 'Colocación a plazo fijo', io: 'out', tag: 'doc' },
]

// ---------------------------------------------------------------------------
// Contexto: insumos del API ya ordenados y con las reglas del calendario
// ---------------------------------------------------------------------------
export function prepararContexto(d) {
  const cal = crearCalendario(d.fecha_corte)
  const r = d.ritmos
  const saldo0 = suma(d.bancos.map((b) => b.saldo_quetzales))
  const usdQ = suma(d.bancos.filter((b) => b.moneda === 'USD').map((b) => b.saldo_quetzales))
  const usd = suma(d.bancos.filter((b) => b.moneda === 'USD').map((b) => b.saldo))
  const bruta = Math.round((r.quincena * 2) / (1 - 0.0483) / 100) * 100

  const quincenas = [], igss = [], gastos = [], bonos = []
  for (const [y, m] of cal.meses) {
    quincenas.push(anteriorHabil(cal.delMes(y, m, 15)), anteriorHabil(finDeMes(y, m)))
    igss.push(anteriorHabil(cal.delMes(y, m, 20)))
    gastos.push([siguienteHabil(cal.delMes(y, m, 5)), 0.58], [siguienteHabil(cal.delMes(y, m, 18)), 0.42])
    if (m === 6) bonos.push({ t: 'Bono 14', f: anteriorHabil(cal.delMes(y, m, 15)) })
    if (m === 11) bonos.push({ t: 'Aguinaldo', f: anteriorHabil(cal.delMes(y, m, 15)) })
  }
  const cuotas = []
  for (const p of d.prestamos) {
    for (const [y, m] of cal.meses) {
      const f = siguienteHabil(cal.delMes(y, m, Math.min(p.dia_pago, 28)))
      if (f > d.fecha_corte && (!p.ultimo_pago || f <= siguienteHabil(p.ultimo_pago))) cuotas.push({ f, p })
    }
  }
  const semQuincena = new Set(quincenas.map((f) => cal.semana(cal.dnum(f))))
  const ivas = d.sat.filter((o) => o.obligacion.includes('IVA'))
  const ivaMes = ivas.length ? suma(ivas.map((o) => o.monto)) / ivas.length : 0
  const mensualSalidas = r.pagos_proveedores + r.quincena * 2 + r.igss + r.gastos_varios + suma(d.prestamos.map((p) => p.cuota)) + ivaMes
  const colchon = Math.round((mensualSalidas * SEM * 2) / 100000) * 100000

  const principal = Object.entries(
    d.cxp.reduce((acc, f) => ({ ...acc, [f.proveedor]: (acc[f.proveedor] || 0) + f.saldo }), {})
  ).sort((a, b) => b[1] - a[1])[0]

  const plazo = { monto: 1000000, tasa: 0.05, dias: 91, n: cal.dnum(siguienteHabil(mas(d.fecha_corte, 8))) }
  plazo.interes = Math.round((plazo.monto * plazo.tasa * plazo.dias) / 365)

  return {
    d, cal, r, saldo0, usdQ, usd, bruta, colchon, plazo, mensualSalidas,
    quincenas, igss, gastos, bonos, cuotas, semQuincena,
    proveedorPrincipal: principal ? { nombre: principal[0], saldo: principal[1], facturas: d.cxp.filter((f) => f.proveedor === principal[0]).length } : null,
  }
}

export function palancas(ctx) {
  const viejas = ctx.d.cxc.filter((f) => f.dias_vencida > 30)
  const lista = [
    { k: 'cobro', t: 'Gestionar la cartera con más de 30 días', d: `${viejas.length} facturas por ${fq(suma(viejas.map((f) => f.saldo)))}. Supone recuperar 90% en las tres primeras semanas.` },
  ]
  if (ctx.proveedorPrincipal) {
    const p = ctx.proveedorPrincipal
    lista.push({ k: 'proveedor', t: `Pedir 30 días más a ${p.nombre.replace(/, S\.A\.$/, '')}`, d: `${p.facturas} facturas por ${fm(p.saldo)}, el proveedor con más saldo.` })
  }
  lista.push({ k: 'plazo', t: `Colocar ${fm(ctx.plazo.monto)} a plazo fijo 90 días`, d: `Del ${ctx.cal.fd(ctx.plazo.n)} al ${ctx.cal.fd(ctx.plazo.n + ctx.plazo.dias)}, a una tasa de referencia de ${pct(ctx.plazo.tasa)} anual.` })
  if (ctx.usd > 0) lista.push({ k: 'usd', t: `Convertir los US$${nf(ctx.usd)} a quetzales`, d: `A Q${ctx.d.tipo_cambio_usd} por dólar. No cambia el saldo total, sí el de quetzales.` })
  return lista
}

// ---------------------------------------------------------------------------
// Partidas
// ---------------------------------------------------------------------------
/** Parte de un flujo diario que ya venció en la semana w, dados los plazos. */
function partePorPlazos(w, plazos, lag) {
  let dias = 0
  for (let t = w * 7 + 1; t <= w * 7 + 7; t++) for (const [p, peso] of plazos) if (t > p + lag) dias += peso
  return dias
}

export function construir(ctx, escK, pal) {
  const P = ESCENARIOS[escK], { cal, r } = ctx, it = []
  const push = (row, w, m, o) => { w = Math.max(0, w); if (w >= HMAX || !m) return; it.push({ row, w, m, ...o }) }
  const n = (f) => cal.dnum(f)

  for (const f of ctx.d.cxc) {
    const vence = n(f.vence), b = tramo(f.dias_vencida)
    let x = P[b]
    if (pal.cobro && f.dias_vencida > 30) x = { p: 0.9, from: 0, n: 3 }
    const extra = f.nota ? ' ' + f.nota : ''
    if (b === 'cur') {
      push('cartera', cal.semana(vence + x.lag), f.saldo * x.p, { doc: true, t: f.cliente, ref: f.factura, nota: `Vence ${cal.fd(vence)}. Se espera ${pct(x.p)}, con ${x.lag} días de atraso habitual.${extra}` })
    } else {
      for (let i = 0; i < x.n; i++) push('cartera', x.from + i, (f.saldo * x.p) / x.n, { doc: true, t: f.cliente, ref: f.factura, nota: `${f.dias_vencida} días de atraso. Se espera ${pct(x.p)} de ${fq(f.saldo)}, entre la semana ${x.from + 1} y la ${x.from + x.n}.${extra}` })
    }
  }

  const contadoMes = r.ventas_tiendas + r.ventas_mayoreo_contado
  const factores = Array.from({ length: HMAX }, (_, w) => (ctx.semQuincena.has(w) ? 1.12 : 0.94))
  const promFactor = suma(factores) / HMAX
  for (let w = 0; w < HMAX; w++) {
    const q = ctx.semQuincena.has(w)
    push('contado', w, contadoMes * SEM * P.ventas * (factores[w] / promFactor), { doc: false, t: 'Ventas de contado en tiendas y mayoreo', nota: q ? 'Semana de quincena: se vende más.' : 'Semana sin día de pago.' })
    const cobrado = partePorPlazos(w, PLAZOS_VENTA, P.cur.lag)
    push('credito', w, (r.cobros_cartera / 30.4) * cobrado * P.ventas, { doc: false, t: 'Ventas a crédito facturadas después del corte', nota: cobrado < 7 ? `Empiezan a vencer: ${pct(cobrado / 7)} de una semana normal.` : 'Ritmo mensual de cobro a clientes, a 30 y 45 días.' })
    push('otros', w, r.otros_ingresos * SEM, { doc: false, t: 'Intereses bancarios y otros ingresos', nota: 'Ritmo semanal promedio.' })
    const pagado = partePorPlazos(w, PLAZOS_COMPRA, 0)
    push('compras', w, -(r.pagos_proveedores / 30.4) * pagado, { doc: false, t: 'Compras e insumos facturados después del corte', nota: pagado < 7 ? `Empiezan a vencer: ${pct(pagado / 7)} de una semana normal.` : 'Ritmo mensual de pago a proveedores, a 30 y 45 días.' })
  }

  for (const f of ctx.d.cxp) {
    let vence = n(f.vence)
    const mover = pal.proveedor && ctx.proveedorPrincipal && f.proveedor === ctx.proveedorPrincipal.nombre
    if (mover) vence = Math.max(vence, 1) + 30
    const vencida = vence <= 0
    push('prov', vencida ? 1 : cal.semana(vence), -f.saldo, {
      doc: true, t: f.proveedor, ref: f.factura,
      nota: mover ? `Pago movido 30 días, al ${cal.fd(vence)}.` : vencida ? `Venció el ${cal.fd(vence)}. ${f.nota || ''}`.trim() : `Vence ${cal.fd(vence)}.`,
    })
  }
  for (const o of ctx.d.sat) push('sat', cal.semana(n(o.vence)), -o.monto, { doc: !o.estimado, t: o.obligacion, nota: `Vence ${cal.fd(n(o.vence))}. ${o.estimado ? 'Monto estimado con las últimas declaraciones.' : 'Monto calculado.'}`, fecha: n(o.vence), estimado: o.estimado })
  // Las reglas de calendario solo generan fechas posteriores al corte.
  const futuras = (lista, fecha = (x) => x) => lista.filter((x) => n(fecha(x)) > 0)
  futuras(ctx.quincenas).forEach((f) => push('planilla', cal.semana(n(f)), -r.quincena, { doc: false, t: 'Pago de planilla', ref: cal.fd(n(f)), nota: `Quincena del ${cal.fd(n(f))}.` }))
  futuras(ctx.igss).forEach((f) => push('igss', cal.semana(n(f)), -r.igss, { doc: false, t: 'Cuotas IGSS, IRTRA e INTECAP', ref: cal.fd(n(f)), nota: `Planilla del mes anterior, a más tardar el ${cal.fd(n(f))}.` }))
  futuras(ctx.gastos, (g) => g[0]).forEach(([f, parte]) => push('opex', cal.semana(n(f)), -r.gastos_varios * parte, { doc: false, t: 'Comisiones, caja chica, viáticos y pagos con tarjeta', ref: cal.fd(n(f)), nota: 'Ritmo mensual de gastos sin factura de proveedor.' }))
  futuras(ctx.bonos, (b) => b.f).forEach((b) => push('bono', cal.semana(n(b.f)), -ctx.bruta, { doc: false, t: b.t, nota: `Un salario mensual bruto, a más tardar el ${cal.fd(n(b.f))}.` }))
  ctx.cuotas.forEach(({ f, p }) => push('prestamo', cal.semana(n(f)), -p.cuota, { doc: true, t: `Préstamo ${p.banco}`, ref: cal.fd(n(f)), nota: `Cuota fija del contrato ${p.numero}.` }))
  if (pal.plazo) {
    const pl = ctx.plazo
    push('plazoOut', cal.semana(pl.n), -pl.monto, { doc: true, t: 'Plazo fijo a 90 días', nota: `Colocación del ${cal.fd(pl.n)}.` })
    push('plazoIn', cal.semana(pl.n + pl.dias), pl.monto + pl.interes, { doc: true, t: 'Plazo fijo a 90 días', nota: `Capital más ${fq(pl.interes)} de intereses.` })
  }
  return it
}

export function serie(ctx, it, pal) {
  const vacio = () => Array(HMAX).fill(0)
  const inn = vacio(), out = vacio(), doc = vacio(), abs = vacio()
  const agg = Object.fromEntries(FILAS.map((r) => [r.k, vacio()]))
  for (const x of it) {
    agg[x.row][x.w] += x.m
    if (x.m > 0) inn[x.w] += x.m
    else out[x.w] += -x.m
    abs[x.w] += Math.abs(x.m)
    if (x.doc) doc[x.w] += Math.abs(x.m)
  }
  const saldo = [], gtq = []
  let s = ctx.saldo0
  for (let w = 0; w < HMAX; w++) {
    s += inn[w] - out[w]
    saldo.push(s)
    gtq.push(pal.usd ? s : s - ctx.usdQ)
  }
  return { inn, out, doc, abs, agg, saldo, gtq }
}

export function metricas(ctx, S, h) {
  let min = Infinity, wmin = 0, max = -Infinity, gmin = Infinity, wg = 0
  for (let w = 0; w < h; w++) {
    if (S.saldo[w] < min) { min = S.saldo[w]; wmin = w }
    if (S.saldo[w] > max) max = S.saldo[w]
    if (S.gtq[w] < gmin) { gmin = S.gtq[w]; wg = w }
  }
  const bajo = S.saldo.slice(0, h).findIndex((v) => v < ctx.colchon)
  const docPct = suma(S.doc.slice(0, h)) / (suma(S.abs.slice(0, h)) || 1)
  return { min, wmin, max, bajo, gmin, wg, fin: S.saldo[h - 1], docPct }
}

export function calcular(ctx, esc, pal, h) {
  const it = construir(ctx, esc, pal)
  const S = serie(ctx, it, pal)
  return { it, S, M: metricas(ctx, S, h) }
}

/** Agrupa partidas de la misma factura u obligación dentro de una lista. */
export function agrupar(items) {
  const m = new Map()
  for (const x of items) {
    const k = `${x.row}|${x.t}|${x.ref || ''}`
    if (m.has(k)) m.get(k).m += x.m
    else m.set(k, { ...x })
  }
  return [...m.values()]
}
