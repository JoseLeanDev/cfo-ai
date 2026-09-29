import { useMemo, useRef, useState } from 'react'
import { useTesoreriaProyeccion } from '../hooks/useCfoData'
import { PageTitle, Eyebrow, cn } from '../components/ui'
import { PageLoading, ErrorState } from '../components/ui/states'
import {
  ESCENARIOS, FILAS, TRAMOS, tramo,
  prepararContexto, palancas, calcular, agrupar,
  fq, fm, fk, nf, pct, suma,
} from '../lib/proyeccionCaja'

/**
 * Proyección de caja.
 *
 * Todo sale de GET /api/tesoreria/proyeccion: saldos de bancos, cartera y
 * pagos por factura, calendario SAT, préstamos y los ritmos de seis meses de
 * flujo. El modelo (lib/proyeccionCaja.js) arma las partidas semana a semana;
 * esta página las muestra y deja abrir cualquier celda hasta su documento.
 *
 * Cobalto marca lo que produce el agente (la lectura); cobre, lo que decide
 * una persona (palancas, colchón, supuestos).
 */

const HORIZONTES = [4, 8, 13, 26]
const C = {
  ink: '#17181B', graphite: '#33373D', slate: '#636970', mist: '#C7CBD0', fog: '#E9EAEC',
  cobalt: '#4F6BE8', cobaltWash: '#F1F3FE', cobaltLine: '#D7DDFA', copper: '#B87A34', copperText: '#8A5A24',
  verified: '#2F8F5F', breach: '#C2452F', breachWash: '#FCF0EE',
}

function Segmentado({ opciones, valor, onChange, etiqueta }) {
  return (
    <div role="group" aria-label={etiqueta} className="inline-flex rounded-control border border-fog bg-white p-0.5">
      {opciones.map(([v, t]) => (
        <button
          key={v}
          type="button"
          aria-pressed={valor === v}
          onClick={() => onChange(v)}
          className={cn(
            'rounded-control px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
            valor === v ? 'bg-ink text-white' : 'text-graphite hover:bg-paper'
          )}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function Etiqueta({ tag }) {
  const cls = {
    doc: 'bg-verified-50 text-verified',
    est: 'border border-fog bg-paper text-slate',
    mix: 'bg-copper-50 text-copper',
  }[tag]
  return (
    <span className={cn('ml-1.5 inline-block rounded-control px-1.5 py-px align-[1px] font-mono text-[0.59rem] uppercase not-italic tracking-[0.08em]', cls)}>
      {tag === 'mix' ? 'doc + est' : tag}
    </span>
  )
}

function Panel({ titulo, subtitulo, children, className, cuerpo = true }) {
  return (
    <section className={cn('min-w-0 rounded-card border border-fog bg-white', className)}>
      <div className="border-b border-fog px-5 py-4">
        <h2 className="font-display text-[1.125rem] font-semibold leading-tight text-ink">{titulo}</h2>
        {subtitulo ? <p className="mt-1 text-[0.8125rem] text-slate">{subtitulo}</p> : null}
      </div>
      {cuerpo ? <div className="px-5 py-4">{children}</div> : children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Gráfica: saldo con banda de escenarios arriba, entradas y salidas abajo
// ---------------------------------------------------------------------------
function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}

function GraficaSaldo({ ctx, S, cons, opt, h, M, semanaSel, onSemana }) {
  const [hover, setHover] = useState(null)
  const caja = useRef(null)
  const W = 1000, H1 = 250, GAP = 26, H2 = 110, PL = 64, PR = 16, PT = 14, PB = 26
  const TH = PT + H1 + GAP + H2 + PB
  const bw = (W - PL - PR) / h
  const xc = (w) => PL + bw * (w + 0.5)
  const pts = [ctx.saldo0, ...cons.saldo.slice(0, h), ...opt.saldo.slice(0, h), ...S.gtq.slice(0, h), ...S.saldo.slice(0, h), ctx.colchon, 0]
  let lo = Math.min(...pts), hi = Math.max(...pts)
  const step = niceStep((hi - lo) / 5)
  lo = Math.floor(lo / step) * step
  hi = Math.ceil(hi / step) * step
  const y = (v) => PT + H1 - ((v - lo) / (hi - lo)) * H1
  const linea = (arr) => `M${PL},${y(ctx.saldo0)} ` + arr.slice(0, h).map((v, w) => `L${xc(w)},${y(v)}`).join(' ')
  const banda =
    `M${PL},${y(ctx.saldo0)} ` +
    opt.saldo.slice(0, h).map((v, w) => `L${xc(w)},${y(v)}`).join(' ') + ' ' +
    cons.saldo.slice(0, h).map((v, w) => [w, v]).reverse().map(([w, v]) => `L${xc(w)},${y(v)}`).join(' ') + ' Z'
  const ticks = []
  for (let v = lo; v <= hi + 1; v += step) ticks.push(v)
  const top2 = PT + H1 + GAP
  const maxF = Math.max(...S.inn.slice(0, h), ...S.out.slice(0, h), 1)
  const mid = top2 + H2 / 2, sc = (H2 / 2 - 4) / maxF, bwi = Math.min(bw * 0.56, 34)
  const mx = xc(M.wmin)
  const txt = { fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, fill: C.slate }

  const tip = hover != null && caja.current ? (() => {
    const k = caja.current.getBoundingClientRect().width / W
    return { w: hover, left: Math.max(110, Math.min(caja.current.clientWidth - 110, xc(hover) * k)), top: Math.max(y(S.saldo[hover]) * k - 10, 110) }
  })() : null

  return (
    <div ref={caja} className="relative">
      <svg viewBox={`0 0 ${W} ${TH}`} role="img" aria-label="Saldo proyectado por semana" className="block h-auto w-full overflow-visible">
        {semanaSel != null && semanaSel < h ? <rect x={PL + bw * semanaSel} y={PT} width={bw} height={TH - PT - PB} fill={C.cobaltWash} /> : null}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke={v === 0 ? C.mist : C.fog} />
            <text x={PL - 8} y={y(v) + 3.5} textAnchor="end" style={txt}>{v === 0 ? '0' : `${(v / 1e6).toFixed(1)} M`}</text>
          </g>
        ))}
        {lo < 0 ? <rect x={PL} y={y(0)} width={W - PL - PR} height={y(lo) - y(0)} fill={C.breachWash} /> : null}
        <path d={banda} fill={C.cobaltWash} stroke={C.cobaltLine} />
        <line x1={PL} x2={W - PR} y1={y(ctx.colchon)} y2={y(ctx.colchon)} stroke={C.copper} strokeWidth="1.5" strokeDasharray="2 4" />
        <text x={W - PR} y={y(ctx.colchon) + 14} textAnchor="end" style={{ ...txt, fill: C.copperText }}>Colchón {fm(ctx.colchon)}</text>
        <path d={linea(S.gtq)} fill="none" stroke={C.graphite} strokeWidth="1.5" strokeDasharray="5 4" />
        <path d={linea(S.saldo)} fill="none" stroke={C.cobalt} strokeWidth="2.5" strokeLinejoin="round" />
        {S.saldo.slice(0, h).map((v, w) => (
          <circle key={w} cx={xc(w)} cy={y(v)} r={w === M.wmin ? 5 : 2.5} fill={w === M.wmin ? C.ink : C.cobalt} stroke="#fff" strokeWidth="1.5" />
        ))}
        <circle cx={PL} cy={y(ctx.saldo0)} r="3.5" fill={C.ink} />
        <text x={PL + 8} y={y(ctx.saldo0) - 10} style={{ ...txt, fill: C.ink }}>Hoy {fm(ctx.saldo0)}</text>
        {mx - PL > 90 ? (
          <text x={Math.min(mx, W - PR - 4)} y={y(M.min) + 20} textAnchor={mx > W - 140 ? 'end' : 'middle'} style={{ ...txt, fill: C.ink, fontWeight: 500 }}>
            Mínimo {fm(M.min)}
          </text>
        ) : null}

        <line x1={PL} x2={W - PR} y1={mid} y2={mid} stroke={C.mist} />
        <text x={PL - 8} y={top2 + 8} textAnchor="end" style={txt}>Entra</text>
        <text x={PL - 8} y={top2 + H2 - 2} textAnchor="end" style={txt}>Sale</text>
        {Array.from({ length: h }, (_, w) => (
          <g key={w}>
            <rect x={xc(w) - bwi / 2} y={mid - S.inn[w] * sc} width={bwi} height={S.inn[w] * sc} fill={C.verified} opacity="0.85" />
            <rect x={xc(w) - bwi / 2} y={mid} width={bwi} height={S.out[w] * sc} fill={C.graphite} opacity="0.78" />
            {w % (h > 13 ? 2 : 1) === 0 || w === h - 1 ? <text x={xc(w)} y={TH - 6} textAnchor="middle" style={txt}>S{w + 1}</text> : null}
            <rect
              x={PL + bw * w} y={PT} width={bw} height={TH - PT - PB} fill="transparent"
              tabIndex={0} role="button" aria-label={`Semana ${w + 1}: saldo ${fq(S.saldo[w])}`}
              className="cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-cobalt"
              onMouseEnter={() => setHover(w)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(w)} onBlur={() => setHover(null)}
              onClick={() => onSemana(w)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSemana(w))}
            />
          </g>
        ))}
      </svg>
      {tip ? (
        <div className="pointer-events-none absolute min-w-[200px] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-card bg-ink px-3 py-2 text-[0.75rem] leading-relaxed text-white shadow-overlay" style={{ left: tip.left, top: tip.top }}>
          <p><span className="font-display font-semibold">Semana {tip.w + 1}</span> · {ctx.cal.rango(tip.w)}</p>
          {[
            ['Entra', fq(S.inn[tip.w])],
            ['Sale', `−Q${nf(S.out[tip.w])}`],
            ['Saldo', fq(S.saldo[tip.w])],
            ['Solo quetzales', fq(S.gtq[tip.w])],
            ['Rango', `${fm(cons.saldo[tip.w])} a ${fm(opt.saldo[tip.w])}`],
          ].map(([a, b]) => (
            <p key={a} className="flex justify-between gap-4 tabular-nums"><span>{a}</span><span>{b}</span></p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Puente de caja
// ---------------------------------------------------------------------------
function Puente({ ctx, S, h, conPlazo }) {
  const t = (k) => suma(S.agg[k].slice(0, h))
  const pasos = [
    { l: 'Saldo en bancos hoy', v: ctx.saldo0, total: true },
    { l: 'Cobros de cartera', s: 'facturas ya emitidas', v: t('cartera') },
    { l: 'Ventas a crédito nuevas', s: 'cobradas dentro del horizonte', v: t('credito') },
    { l: 'Ventas de contado', s: 'e intereses', v: t('contado') + t('otros') },
    { l: 'Proveedores con factura', v: t('prov') },
    { l: 'Compras aún sin factura', v: t('compras') },
    { l: 'Planilla y cuotas', s: 'IGSS, IRTRA, INTECAP' + (t('bono') ? ', Bono 14' : ''), v: t('planilla') + t('igss') + t('bono') },
    { l: 'Impuestos SAT', v: t('sat') },
    { l: 'Cuota de préstamo', v: t('prestamo') },
    { l: 'Gastos de operación', v: t('opex') },
  ]
  if (conPlazo) pasos.push({ l: 'Plazo fijo', s: 'colocación y vencimiento', v: t('plazoOut') + t('plazoIn') })
  pasos.push({ l: `Saldo en ${h} semanas`, v: ctx.saldo0 + suma(pasos.slice(1).map((p) => p.v)), total: true })
  let acc = 0, lo = 0, hi = 0
  const pos = pasos.map((p) => {
    const a = p.total ? 0 : acc, b = p.total ? p.v : acc + p.v
    acc = b; lo = Math.min(lo, a, b); hi = Math.max(hi, a, b)
    return [a, b]
  })
  const X = (v) => ((v - lo) / (hi - lo)) * 100
  return (
    <div className="grid gap-0.5">
      {pasos.map((p, i) => {
        if (!p.total && Math.abs(p.v) < 500) return null
        const [a, b] = pos[i]
        const color = p.total ? (p.v < 0 ? C.breach : C.ink) : p.v >= 0 ? C.verified : C.graphite
        return (
          <div key={p.l} className={cn('grid grid-cols-[minmax(0,1fr)_88px] items-center gap-x-3 py-1.5 text-[0.84rem] sm:grid-cols-[minmax(0,170px)_minmax(0,1fr)_96px]', p.total && i > 0 && 'mt-1 border-t border-fog pt-2')}>
            <div className={cn('min-w-0', p.total ? 'font-semibold text-ink' : 'text-graphite')}>
              {p.l}
              {p.s ? <small className="block text-[0.72rem] text-slate">{p.s}</small> : null}
            </div>
            <div className="relative col-span-2 row-start-2 h-[18px] sm:col-span-1 sm:row-start-auto">
              <span className="absolute top-0.5 h-3.5 rounded-[1px]" style={{ left: `${Math.min(X(a), X(b))}%`, width: `${Math.max(Math.abs(X(b) - X(a)), 0.4)}%`, background: color, opacity: p.total ? 1 : 0.85 }} />
            </div>
            <div className={cn('text-right font-medium tabular-nums', p.total && p.v < 0 && 'text-breach')}>
              {p.total ? fm(p.v) : `${p.v >= 0 ? '+' : '−'}${(Math.abs(p.v) / 1e6).toFixed(2)} M`}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
export default function ProyeccionesFinancieras() {
  const { data, isLoading, isError, error, refetch } = useTesoreriaProyeccion()
  const [esc, setEsc] = useState('base')
  const [h, setH] = useState(13)
  const [pal, setPal] = useState({ cobro: false, proveedor: false, plazo: false, usd: false })
  const [sel, setSel] = useState(null) // { row, w }

  const ctx = useMemo(() => (data?.data ? prepararContexto(data.data) : null), [data])
  const res = useMemo(() => {
    if (!ctx) return null
    return { cur: calcular(ctx, esc, pal, h), cons: calcular(ctx, 'cons', pal, h), opt: calcular(ctx, 'opt', pal, h) }
  }, [ctx, esc, pal, h])

  if (isError) return <ErrorState title="No se pudo armar la proyección" error={error} onRetry={refetch} />
  if (isLoading || !ctx || !res) return <PageLoading label="Proyectando la caja semana a semana" />

  const { it, S, M } = res.cur
  const { cal } = ctx
  const escNombre = ESCENARIOS[esc].nombre.toLowerCase()
  const lista = palancas(ctx)
  const selW = sel && sel.w < h ? sel.w : null
  const verSemana = (w) => setSel({ row: '__saldo', w })

  // Lectura del agente, con las mismas cifras de la página
  const lectura = (() => {
    const li = []
    const dif = M.fin - ctx.saldo0
    li.push(`El saldo se mueve entre ${fm(M.min)} y ${fm(M.max)} en las próximas ${h} semanas y cierra en ${fm(M.fin)}, ${dif >= 0 ? 'arriba' : 'abajo'} ${fm(Math.abs(dif))} de hoy.`)
    const tops = FILAS.filter((r) => r.io === 'out').map((r) => [r.t.toLowerCase(), -S.agg[r.k][M.wmin]]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
    li.push(`La semana más ajustada es la ${M.wmin + 1} (${cal.rango(M.wmin)}): coinciden ${tops.map(([t, v]) => `${t} (${fm(v)})`).join(', ').replace(/, ([^,]*)$/, ' y $1')}.`)
    if (M.bajo < 0) li.push(`Nunca baja del colchón de ${fm(ctx.colchon)}. En el escenario conservador el mínimo sería ${fm(res.cons.M.min)}${res.cons.M.bajo >= 0 ? `, bajo el colchón en la semana ${res.cons.M.bajo + 1}` : ''}.`)
    else li.push(`Baja del colchón de ${fm(ctx.colchon)} en la semana ${M.bajo + 1}.`)
    const tot = suma(ctx.d.cxc.map((f) => f.saldo))
    const venc = ctx.d.cxc.filter((f) => f.dias_vencida > 0), v60 = ctx.d.cxc.filter((f) => f.dias_vencida > 60)
    if (tot > 0) li.push(`La cartera vencida suma ${fm(suma(venc.map((f) => f.saldo)))} (${pct(suma(venc.map((f) => f.saldo)) / tot)} del total)${v60.length ? `. Con más de 60 días solo hay ${fq(suma(v60.map((f) => f.saldo)))}: ${[...new Set(v60.map((f) => f.cliente))].join(' y ')}` : ''}.`)
    if (!pal.plazo) {
      const alt = calcular(ctx, esc, { ...pal, plazo: true }, h)
      if (alt.M.bajo < 0) li.push(`Hay excedente: colocar ${fm(ctx.plazo.monto)} a plazo fijo 90 días rendiría cerca de ${fq(ctx.plazo.interes)} y el saldo no bajaría de ${fm(alt.M.min)}.`)
    }
    return li
  })()

  const kpis = [
    { l: 'Saldo en bancos hoy', v: fm(ctx.saldo0), s: `${fm(ctx.saldo0 - ctx.usdQ)} en quetzales${ctx.usd ? ` · US$${nf(ctx.usd)}` : ''}` },
    { l: 'Saldo mínimo', v: fm(M.min), s: `Semana ${M.wmin + 1} · ${cal.rango(M.wmin)}`, tono: M.min < 0 ? 'alerta' : M.bajo >= 0 ? 'revisar' : null },
    M.bajo < 0
      ? { l: 'Holgura sobre el colchón', v: fm(M.min - ctx.colchon), s: `Colchón de ${fm(ctx.colchon)}, dos semanas de salidas`, color: 'text-verified' }
      : { l: 'Bajo el colchón', v: `Semana ${M.bajo + 1}`, s: `Colchón de ${fm(ctx.colchon)}`, tono: 'revisar' },
    { l: 'Mínimo en quetzales', v: fm(M.gmin), s: pal.usd ? 'Con los dólares convertidos' : `Semana ${M.wg + 1} · sin tocar los dólares`, tono: M.gmin < 0 ? 'alerta' : null, color: M.gmin < 0 ? 'text-breach' : null },
    { l: `Saldo en ${h} semanas`, v: fm(M.fin), s: `${M.fin >= ctx.saldo0 ? '+' : '−'}${fm(Math.abs(M.fin - ctx.saldo0))} frente a hoy · ${pct(M.docPct)} con documento` },
  ]

  // Tabla
  const ws = [...Array(h).keys()]
  const selCls = (w) => (selW === w ? 'bg-cobalt-50' : '')
  const neto = ws.map((w) => S.inn[w] - S.out[w])
  const fila = (r, signo) => {
    const vals = ws.map((w) => S.agg[r.k][w] * signo)
    if (!vals.some((v) => Math.abs(v) >= 500)) return null
    return (
      <tr key={r.k}>
        <td className="sticky left-0 z-[1] min-w-[220px] border-b border-r border-fog bg-white px-2.5 py-1.5 text-left">{r.t}<Etiqueta tag={r.tag} /></td>
        {vals.map((v, w) => (
          <td
            key={w} tabIndex={0}
            onClick={() => setSel({ row: r.k, w })}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel({ row: r.k, w }))}
            className={cn('cursor-pointer border-b border-fog px-2.5 py-1.5 text-right hover:bg-cobalt-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-cobalt', r.tag === 'est' && 'italic text-slate', selCls(w), sel?.row === r.k && sel?.w === w && 'shadow-[inset_0_0_0_2px_#4F6BE8]')}
          >
            {fk(v)}
          </td>
        ))}
        <td className="border-b border-fog px-2.5 py-1.5 text-right">{fk(suma(vals))}</td>
      </tr>
    )
  }
  const totalFila = (l, arr, extra) => (
    <tr className="font-semibold text-ink">
      <td className="sticky left-0 z-[1] border-b border-r border-fog bg-white px-2.5 py-1.5 text-left">{l}</td>
      {ws.map((w) => <td key={w} className={cn('border-b border-fog px-2.5 py-1.5 text-right', selCls(w), extra?.(arr[w]))}>{fk(arr[w])}</td>)}
      <td className={cn('border-b border-fog px-2.5 py-1.5 text-right', extra?.(suma(ws.map((w) => arr[w]))))}>{fk(suma(ws.map((w) => arr[w])))}</td>
    </tr>
  )
  const seccion = (t) => (
    <tr>
      <td className="sticky left-0 z-[1] border-b border-r border-fog bg-paper px-2.5 pb-1.5 pt-2.5 text-left font-mono text-[0.66rem] uppercase tracking-[0.12em] text-slate">{t}</td>
      <td colSpan={h + 1} className="border-b border-fog bg-paper" />
    </tr>
  )

  // Detalle de la celda elegida (o de la semana más ajustada)
  const det = sel && sel.w < h ? sel : { row: '__saldo', w: M.wmin }
  const detItems = det.row === '__saldo'
    ? agrupar(it.filter((x) => x.w === det.w)).sort((a, b) => Math.abs(b.m) - Math.abs(a.m)).slice(0, 8)
    : agrupar(it.filter((x) => x.row === det.row && x.w === det.w)).sort((a, b) => Math.abs(b.m) - Math.abs(a.m))
  const Partida = ({ x, semana }) => (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-fog py-2 text-[0.84rem] last:border-b-0">
      <div className="min-w-0">
        {x.t}
        {x.ref ? <span className="ml-1.5 font-mono text-[0.69rem] text-slate">{x.ref}</span> : null}
        {semana ? null : <Etiqueta tag={x.doc ? 'doc' : 'est'} />}
      </div>
      <div className={cn('text-right font-medium tabular-nums', x.m > 0 && 'text-verified')}>{x.m < 0 ? '−' : '+'}Q{nf(x.m)}</div>
      <div className="col-span-2 text-[0.78rem] text-slate">{semana ? `Semana ${x.w + 1} · ` : ''}{x.nota}</div>
    </div>
  )

  // Movimientos grandes y concentración
  const grandes = agrupar(it.filter((x) => x.w < h && x.doc && ['prov', 'cartera', 'sat', 'prestamo'].includes(x.row)))
    .sort((a, b) => Math.abs(b.m) - Math.abs(a.m)).slice(0, 8)
  const porProveedor = new Map()
  let totalProv = 0
  for (const x of it) if (x.row === 'prov' && x.w < h) { porProveedor.set(x.t, (porProveedor.get(x.t) || 0) - x.m); totalProv -= x.m }
  const topProv = [...porProveedor.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Compromisos con fecha fija dentro del horizonte
  const lim = h * 7
  const compromisos = [
    ...ctx.d.sat.map((o) => ({ n: cal.dnum(o.vence), t: o.obligacion, m: o.monto, est: o.estimado, nota: o.estimado ? 'Promedio de las últimas declaraciones.' : 'Monto calculado.' })),
    ...ctx.quincenas.map((f) => ({ n: cal.dnum(f), t: 'Planilla', m: ctx.r.quincena, est: true, nota: 'Quincena.' })),
    ...ctx.igss.map((f) => ({ n: cal.dnum(f), t: 'IGSS, IRTRA e INTECAP', m: ctx.r.igss, est: true, nota: 'Planilla del mes anterior.' })),
    ...ctx.cuotas.map(({ f, p }) => ({ n: cal.dnum(f), t: `Cuota préstamo ${p.banco}`, m: p.cuota, est: false, nota: `Contrato ${p.numero}.` })),
    ...ctx.bonos.map((b) => ({ n: cal.dnum(b.f), t: b.t, m: ctx.bruta, est: true, nota: 'Un salario mensual bruto.' })),
  ].filter((e) => e.n > 0 && e.n <= lim).sort((a, b) => a.n - b.n)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle
        eyebrow={`Tesorería · corte ${cal.fd(0)} ${ctx.d.fecha_corte.slice(0, 4)}`}
        title="Proyección de caja"
        description={`Saldo de bancos, cartera por cobrar, facturas de proveedores, planilla y calendario SAT, semana por semana hasta el ${cal.fd(h * 7)}. Escenario ${escNombre}.`}
        meta={
          <div className="flex flex-wrap gap-3">
            <Segmentado etiqueta="Escenario" valor={esc} onChange={setEsc} opciones={Object.entries(ESCENARIOS).map(([k, e]) => [k, e.nombre])} />
            <Segmentado etiqueta="Horizonte" valor={h} onChange={setH} opciones={HORIZONTES.map((n) => [n, `${n} sem`])} />
          </div>
        }
      />

      {/* Cifras: una placa con divisiones */}
      <section aria-label="Resumen" className="grid grid-cols-2 overflow-hidden rounded-card border border-fog bg-white lg:grid-cols-5">
        {kpis.map((k, i) => (
          <div key={k.l} className={cn('min-w-0 border-fog px-5 py-4', i > 0 && 'lg:border-l', i >= 2 && 'border-t lg:border-t-0', i % 2 === 1 && 'border-l', i === 4 && 'col-span-2 lg:col-span-1', k.tono === 'alerta' && 'shadow-[inset_0_-2px_0_#C2452F]', k.tono === 'revisar' && 'shadow-[inset_0_-2px_0_#B87A34]')}>
            <Eyebrow className="text-[0.6875rem]">{k.l}</Eyebrow>
            <p className={cn('mt-2 font-display text-[1.625rem] font-semibold leading-tight tabular-nums text-ink', k.color)}>{k.v}</p>
            <p className="mt-1 text-[0.78rem] text-slate">{k.s}</p>
          </div>
        ))}
      </section>

      {/* Lectura del agente */}
      <section aria-label="Lectura del agente de Caja" className="rounded-card border border-l-2 border-fog border-l-cobalt-500 bg-white px-5 py-4">
        <Eyebrow className="text-cobalt">Lectura del agente de Caja</Eyebrow>
        <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-[0.9rem] leading-relaxed text-ink marker:text-cobalt-500">
          {lectura.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </section>

      <Panel
        titulo="Saldo semana a semana"
        subtitulo="La banda va del escenario conservador al optimista. Pase el cursor sobre una semana para ver el detalle y haga clic para abrirla en la tabla."
      >
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.78rem] text-graphite">
          <span className="inline-flex items-center gap-1.5"><i className="inline-block w-3.5 border-t-2 border-cobalt-500" />Saldo total</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block w-3.5 border-t-2 border-dashed border-graphite" />Solo quetzales</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-3.5 bg-cobalt-50 outline outline-1 outline-cobalt-100" />Rango de escenarios</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block w-3.5 border-t-2 border-dotted border-copper-500" />Colchón mínimo</span>
        </div>
        <GraficaSaldo ctx={ctx} S={S} cons={res.cons.S} opt={res.opt.S} h={h} M={M} semanaSel={selW} onSemana={verSemana} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel titulo="De dónde sale y a dónde va" subtitulo={`Del saldo de hoy al saldo al ${cal.fd(h * 7)}.`}>
          <Puente ctx={ctx} S={S} h={h} conPlazo={pal.plazo} />
        </Panel>
        <Panel titulo="Palancas" subtitulo="Decisiones que usted puede tomar. Al activarlas se recalcula toda la página.">
          <div className="grid gap-2.5">
            {lista.map((l) => {
              const on = pal[l.k]
              const alt = calcular(ctx, esc, { ...pal, [l.k]: !on }, h)
              const con = on ? M : alt.M, sin = on ? alt.M : M
              let efecto
              if (l.k === 'usd') efecto = [`+${fm(con.gmin - sin.gmin)}`, 'al mínimo en quetzales']
              else if (l.k === 'plazo') efecto = [`+${fq(ctx.plazo.interes)}`, con.bajo < 0 ? `mínimo ${fm(con.min)}` : 'baja del colchón']
              else { const d = con.min - sin.min; efecto = [`${d > 0 ? '+' : ''}${fq(d)}`, 'al saldo mínimo'] }
              return (
                <label key={l.k} htmlFor={`palanca-${l.k}`} className={cn('grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-card border px-3.5 py-3 focus-within:outline focus-within:outline-2 focus-within:outline-cobalt', on ? 'border-copper-100 bg-copper-50' : 'border-fog')}>
                  <input id={`palanca-${l.k}`} type="checkbox" checked={on} onChange={(e) => setPal({ ...pal, [l.k]: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#B87A34]" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{l.t}</p>
                    <p className="mt-0.5 text-[0.78rem] text-slate">{l.d}</p>
                  </div>
                  <div className="whitespace-nowrap text-right text-[0.78rem] text-slate">
                    <b className="block font-display text-[0.95rem] font-semibold tabular-nums text-verified">{efecto[0]}</b>
                    {efecto[1]}
                  </div>
                </label>
              )
            })}
          </div>
          <p className="mt-3 text-[0.78rem] text-slate">El efecto se mide sobre el horizonte elegido, con el escenario y las demás palancas como están.</p>
        </Panel>
      </div>

      <Panel
        cuerpo={false}
        titulo="Flujo semanal"
        subtitulo={<>Cifras en miles de quetzales. <Etiqueta tag="doc" /> sale de facturas, declaraciones y contratos; <Etiqueta tag="est" /> es un ritmo de los últimos {ctx.r.meses} meses. Haga clic en una celda para ver qué la compone.</>}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[0.78rem] tabular-nums">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] border-b border-r border-fog bg-white px-2.5 py-1.5 text-left align-bottom font-mono text-[0.66rem] font-medium uppercase tracking-[0.06em] text-slate">Semana</th>
                {ws.map((w) => (
                  <th key={w} className={cn('whitespace-nowrap border-b border-fog bg-white px-2.5 py-1.5 text-right align-bottom font-mono text-[0.66rem] font-medium uppercase tracking-[0.06em] text-slate', selCls(w))}>
                    S{w + 1}<span className="block font-sans text-[0.72rem] normal-case tracking-normal text-graphite">{cal.rango(w)}</span>
                  </th>
                ))}
                <th className="border-b border-fog bg-white px-2.5 py-1.5 text-right align-bottom font-mono text-[0.66rem] font-medium uppercase tracking-[0.06em] text-slate">Total</th>
              </tr>
            </thead>
            <tbody className="whitespace-nowrap">
              <tr>
                <td className="sticky left-0 z-[1] border-b border-r border-fog bg-paper px-2.5 py-1.5 text-left font-mono text-[0.66rem] uppercase tracking-[0.12em] text-slate">Saldo inicial</td>
                {ws.map((w) => <td key={w} className={cn('border-b border-fog bg-paper px-2.5 py-1.5 text-right text-slate', selCls(w))}>{fk(w === 0 ? ctx.saldo0 : S.saldo[w - 1])}</td>)}
                <td className="border-b border-fog bg-paper" />
              </tr>
              {seccion('Entradas')}
              {FILAS.filter((r) => r.io === 'in').map((r) => fila(r, 1))}
              {totalFila('Total entradas', S.inn)}
              {seccion('Salidas')}
              {FILAS.filter((r) => r.io === 'out').map((r) => fila(r, -1))}
              {totalFila('Total salidas', S.out)}
              {totalFila('Flujo neto', neto, (v) => v < 0 && 'text-breach')}
              <tr className="font-display text-[0.82rem] font-semibold">
                <td className="sticky left-0 z-[1] border-b-2 border-r border-fog bg-white px-2.5 py-1.5 text-left">Saldo final</td>
                {ws.map((w) => (
                  <td
                    key={w} tabIndex={0}
                    onClick={() => verSemana(w)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), verSemana(w))}
                    className={cn('cursor-pointer border-b-2 border-fog px-2.5 py-1.5 text-right hover:bg-cobalt-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-cobalt', S.saldo[w] < ctx.colchon && 'bg-breach-50', S.saldo[w] < 0 && 'text-breach', selCls(w), sel?.row === '__saldo' && sel?.w === w && 'shadow-[inset_0_0_0_2px_#4F6BE8]')}
                  >
                    {fk(S.saldo[w])}
                  </td>
                ))}
                <td className="border-b-2 border-fog" />
              </tr>
              <tr>
                <td className="sticky left-0 z-[1] border-b border-r border-fog bg-white px-2.5 py-1.5 text-left">Solo quetzales</td>
                {ws.map((w) => <td key={w} className={cn('border-b border-fog px-2.5 py-1.5 text-right', S.gtq[w] < 0 && 'text-breach', selCls(w))}>{fk(S.gtq[w])}</td>)}
                <td className="border-b border-fog" />
              </tr>
              <tr className="text-slate">
                <td className="sticky left-0 z-[1] border-b border-r border-fog bg-white px-2.5 py-1.5 text-left">Respaldo documental</td>
                {ws.map((w) => <td key={w} className={cn('border-b border-fog px-2.5 py-1.5 text-right', selCls(w))}>{pct(S.doc[w] / (S.abs[w] || 1))}</td>)}
                <td className="border-b border-fog px-2.5 py-1.5 text-right">{pct(M.docPct)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border-t border-fog px-5 py-4">
          {det.row === '__saldo' ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <Eyebrow className="text-[0.6875rem]">Semana {det.w + 1} · {cal.rango(det.w)}{sel ? '' : ' · la más ajustada del horizonte'}</Eyebrow>
                <h3 className="mt-1 font-display text-[1rem] font-semibold text-ink">Saldo final {fq(S.saldo[det.w])}</h3>
              </div>
              <span className="text-[0.8125rem] text-slate">Entra {fq(S.inn[det.w])} · sale {fq(S.out[det.w])} · {pct(S.doc[det.w] / (S.abs[det.w] || 1))} con documento</span>
            </div>
          ) : (
            <div>
              <Eyebrow className="text-[0.6875rem]">{FILAS.find((r) => r.k === det.row).t} · semana {det.w + 1} · {cal.rango(det.w)}</Eyebrow>
              <h3 className="mt-1 font-display text-[1rem] font-semibold text-ink">{fq(Math.abs(S.agg[det.row][det.w]))} en {detItems.length} {detItems.length === 1 ? 'partida' : 'partidas'}</h3>
            </div>
          )}
          <div className="mt-2">
            {detItems.length ? detItems.map((x) => <Partida key={`${x.row}${x.t}${x.ref}`} x={x} />) : <p className="text-[0.8125rem] text-slate">Sin movimientos esta semana.</p>}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel titulo="Pagos y cobros que mueven la caja" subtitulo={`Las ${grandes.length} partidas con documento más grandes de las próximas ${h} semanas.`}>
          {grandes.map((x) => <Partida key={`${x.row}${x.t}${x.ref}`} x={x} semana />)}
          {topProv.length ? (
            <div className="mt-5">
              <Eyebrow className="text-[0.6875rem]">Concentración de pagos a proveedores</Eyebrow>
              <div className="mt-2 grid gap-2.5">
                {topProv.map(([nombre, v]) => (
                  <div key={nombre} className="grid grid-cols-[minmax(0,1fr)_56px] items-center gap-x-3 gap-y-1 text-[0.8125rem]">
                    <div className="min-w-0">{nombre} <span className="tabular-nums text-slate">{fm(v)}</span></div>
                    <div className="text-right tabular-nums text-graphite">{pct(v / totalProv)}</div>
                    <div className="col-span-2 h-1.5 overflow-hidden rounded-[1px] bg-fog"><i className="block h-full bg-graphite" style={{ width: `${(v / topProv[0][1]) * 100}%` }} /></div>
                  </div>
                ))}
                <p className="text-[0.78rem] text-slate">Los {topProv.length} primeros suman {pct(suma(topProv.map((p) => p[1])) / totalProv)} de {fm(totalProv)} en facturas de proveedores.</p>
              </div>
            </div>
          ) : null}
        </Panel>
        <Panel titulo="Compromisos con fecha fija" subtitulo="SAT, planilla y préstamo dentro del horizonte.">
          {compromisos.map((e) => (
            <div key={`${e.n}${e.t}`} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 border-b border-fog py-2 text-[0.84rem] last:border-b-0">
              <span className="font-mono text-[0.72rem] text-graphite">{cal.fd(e.n)}</span>
              <span className="min-w-0">{e.t}</span>
              <span className="text-right font-medium tabular-nums">{fq(e.m)}</span>
              <span className="col-start-2 col-end-4 flex flex-wrap items-center gap-2 text-[0.75rem] text-slate">
                <span className={cn('rounded-pill px-1.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.08em]', e.est ? 'border border-fog bg-paper text-slate' : 'bg-verified-50 text-verified')}>{e.est ? 'Estimado' : 'Monto conocido'}</span>
                {e.nota}
              </span>
            </div>
          ))}
        </Panel>
      </div>

      <Panel titulo="Supuestos" subtitulo="Todo lo que no sale de un documento está aquí.">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.8125rem] tabular-nums">
            <thead>
              <tr className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-slate">
                <th className="border-b border-fog px-2.5 py-2 text-left font-medium">Cobro de cartera por antigüedad</th>
                {Object.entries(ESCENARIOS).map(([k, e]) => <th key={k} className="border-b border-fog px-2.5 py-2 text-right font-medium">{e.nombre}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.keys(TRAMOS).map((b) => (
                <tr key={b}>
                  <td className="border-b border-fog px-2.5 py-2">{TRAMOS[b]} <span className="text-slate">· {fq(suma(ctx.d.cxc.filter((f) => tramo(f.dias_vencida) === b).map((f) => f.saldo)))}</span></td>
                  {Object.entries(ESCENARIOS).map(([k, e]) => (
                    <td key={k} className={cn('border-b border-fog px-2.5 py-2 text-right', k === esc && 'bg-copper-50 font-semibold text-copper')}>
                      {b === 'cur' ? `${pct(e.cur.p)} · ${e.cur.lag} días tarde` : `${pct(e[b].p)} · S${e[b].from + 1} a S${e[b].from + e[b].n}`}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="border-b border-fog px-2.5 py-2">Ventas de contado y a crédito nuevas</td>
                {Object.entries(ESCENARIOS).map(([k, e]) => <td key={k} className={cn('border-b border-fog px-2.5 py-2 text-right', k === esc && 'bg-copper-50 font-semibold text-copper')}>{pct(e.ventas)} del ritmo</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-1.5 text-[0.8125rem] leading-relaxed text-graphite">
          <p><b className="font-semibold text-ink">Saldo inicial.</b> {ctx.d.bancos.map((b) => `${b.banco} ${b.moneda === 'USD' ? 'US$' + nf(b.saldo) : fq(b.saldo)}`).join(' · ')}. El dólar a Q{ctx.d.tipo_cambio_usd}.</p>
          <p><b className="font-semibold text-ink">Ritmos.</b> Promedios mensuales de los últimos {ctx.r.meses} meses de movimientos: ventas de contado {fq(ctx.r.ventas_tiendas + ctx.r.ventas_mayoreo_contado)} ({fq(ctx.r.ventas_tiendas)} en tiendas), 12% más en semanas de quincena; cobros a clientes {fq(ctx.r.cobros_cartera)}, a 30 y 45 días; pagos a proveedores {fq(ctx.r.pagos_proveedores)}, a 30 y 45 días; gastos sin factura {fq(ctx.r.gastos_varios)}. Sin ajuste por temporada.</p>
          <p><b className="font-semibold text-ink">Planilla.</b> {fq(ctx.r.quincena)} por quincena, el 15 y el último día hábil. Cuotas IGSS, IRTRA e INTECAP de {fq(ctx.r.igss)} el día 20. Bono 14 y aguinaldo de un salario mensual bruto ({fq(ctx.bruta)}).</p>
          {ctx.d.prestamos.map((p) => (
            <p key={p.numero}><b className="font-semibold text-ink">Préstamo.</b> {p.banco}, {p.destino.toLowerCase()}: cuota fija de {fq(p.cuota)} el día {p.dia_pago}, saldo de {fq(p.saldo)} al corte.</p>
          ))}
          <p><b className="font-semibold text-ink">Colchón mínimo.</b> {fm(ctx.colchon)}, dos semanas de salidas normales. Lo fija la empresa.</p>
          <p><b className="font-semibold text-ink">Calendario.</b> IVA al cierre del mes siguiente, ISR trimestral a 10 días hábiles e ISO en el mes siguiente al trimestre. Pagos que caen en fin de semana o feriado se corren al día hábil que corresponde.</p>
        </div>
      </Panel>
    </div>
  )
}
