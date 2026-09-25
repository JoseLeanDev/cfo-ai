import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts'
import { chart, series as SERIES, axis, grid, tooltip, legend } from '../../config/charts.jsx'

/**
 * Bloque visual devuelto por el agente SQL.
 *
 * El agente elige el tipo de visualización y las columnas, pero NUNCA escribe
 * los datos: vienen de las filas reales de su consulta. Por eso un número de
 * la gráfica no puede dejar de cuadrar con la base.
 */

const nf = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 0 })
const nfDec = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 1 })

const num = (v) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

// Las columnas vienen de la capa semántica, cuyos nombres son conocidos: el
// dinero se reconoce por nombre y lleva "Q"; los porcentajes llevan "%".
const ES_PORCENTAJE = /(_pct|porcentaje|parte|participacion)$/i
const ES_DINERO =
  /(saldo|ventas|monto|costo|margen_bruto|efectivo|cxc|cxp|capital|gasto|entradas|salidas|neto|precio|total|pendiente|vencida|perdida|impacto)/i
const NO_DINERO = /(pct|dias|unidades|facturas|cantidad|lineas|conteo|numero|_id$|anio|mes$)/i

const tipoColumna = (c) =>
  ES_PORCENTAJE.test(c) ? 'pct' : ES_DINERO.test(c) && !NO_DINERO.test(c) ? 'dinero' : 'numero'

const corto = (v) => {
  const n = num(v)
  if (n === null) return ''
  const a = Math.abs(n)
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (a >= 1e3) return Math.round(n / 1e3) + 'K'
  return nf.format(n)
}

function celda(v, columna) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  const n = num(v)
  if (n === null) return String(v)
  const t = tipoColumna(columna)
  if (t === 'pct') return `${nfDec.format(n)}%`
  if (t === 'dinero') return `Q${nf.format(n)}`
  return Number.isInteger(n) ? nf.format(n) : nfDec.format(n)
}

const etiquetaX = (v) => {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 7)
  if (typeof v === 'string' && v.length > 22) return v.slice(0, 21) + '…'
  return String(v ?? '')
}

const encabezado = (c) => c.replace(/_/g, ' ')

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltip.contentStyle}>
      <p style={tooltip.labelStyle}>{etiquetaX(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-baseline gap-3 tabular-nums">
          <span className="flex-1 text-slate">{encabezado(String(p.name))}</span>
          <span className="font-mono text-ink">{celda(p.value, String(p.dataKey ?? p.name))}</span>
        </p>
      ))}
    </div>
  )
}

function Marco({ titulo, nota, children }) {
  return (
    <figure className="mt-4 overflow-hidden rounded-card border border-fog bg-white">
      {titulo || nota ? (
        <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-fog px-4 py-2.5">
          {titulo ? <span className="text-[0.8125rem] font-medium text-ink">{titulo}</span> : <span />}
          {nota ? <span className="font-mono text-[0.6875rem] text-slate">{nota}</span> : null}
        </figcaption>
      ) : null}
      {children}
    </figure>
  )
}

export default function BloqueVisual({ bloque }) {
  if (!bloque?.datos?.length) return null

  const { tipo, titulo, datos, num_filas } = bloque
  const llaves = Object.keys(datos[0] || {})

  // Si el agente omite x/y: primera columna de texto para el eje, las
  // numéricas para las series.
  const numericas = llaves.filter((k) => datos.every((d) => d[k] === null || num(d[k]) !== null))
  const textuales = llaves.filter((k) => !numericas.includes(k))

  const ejeX = bloque.x && llaves.includes(bloque.x) ? bloque.x : textuales[0] || llaves[0]
  const series = (
    bloque.y?.length ? bloque.y.filter((k) => llaves.includes(k)) : numericas.filter((k) => k !== ejeX)
  ).slice(0, 6)

  const nota = num_filas > datos.length ? `${datos.length} de ${num_filas} filas` : `${datos.length} filas`

  // ── Tabla ────────────────────────────────────────────────────────────────
  if (tipo === 'tabla' || !series.length) {
    const cols = bloque.columnas?.filter((c) => llaves.includes(c)) || llaves
    return (
      <Marco titulo={titulo} nota={nota}>
        <div className="max-h-80 overflow-auto">
          <table className="table">
            <thead className="sticky top-0">
              <tr>
                {cols.map((c) => (
                  <th key={c} className={numericas.includes(c) ? 'num' : ''}>
                    {encabezado(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td key={c} className={numericas.includes(c) ? 'num' : ''}>
                      {celda(fila[c], c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Marco>
    )
  }

  // ── KPI ──────────────────────────────────────────────────────────────────
  if (tipo === 'kpi') {
    const f = datos[0]
    const campos = (series.length ? series : numericas).slice(0, 4)
    return (
      <Marco titulo={titulo}>
        <dl className="grid grid-cols-2 gap-px bg-fog">
          {campos.map((k) => (
            <div key={k} className="bg-white px-4 py-3">
              <dt className="eyebrow text-[0.6875rem]">{encabezado(k)}</dt>
              <dd className="mt-1 font-display text-[1.25rem] font-semibold tabular-nums text-ink">
                {celda(f[k], k)}
              </dd>
            </div>
          ))}
        </dl>
      </Marco>
    )
  }

  const datosNum = datos.map((d) => {
    const o = { ...d }
    series.forEach((k) => {
      o[k] = num(d[k])
    })
    return o
  })

  // ── Pastel ───────────────────────────────────────────────────────────────
  if (tipo === 'pastel') {
    const k = series[0]
    const orden = [...datosNum].sort((a, b) => (b[k] || 0) - (a[k] || 0))
    const top = orden.slice(0, 5)
    const resto = orden.slice(5)
    if (resto.length) {
      top.push({ [ejeX]: `Otros (${resto.length})`, [k]: resto.reduce((s, d) => s + (d[k] || 0), 0) })
    }
    return (
      <Marco titulo={titulo} nota={nota}>
        <div className="px-2 pb-2" style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={top} dataKey={k} nameKey={ejeX} cx="50%" cy="50%" outerRadius={76} strokeWidth={2} stroke={chart.white}>
                {top.map((_, i) => (
                  <Cell key={i} fill={SERIES[i % SERIES.length]} />
                ))}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend {...legend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Marco>
    )
  }

  // ── Línea ────────────────────────────────────────────────────────────────
  if (tipo === 'linea') {
    return (
      <Marco titulo={titulo} nota={nota}>
        <div className="px-1 pb-2 pt-2" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosNum} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid {...grid} />
              <XAxis dataKey={ejeX} tickFormatter={etiquetaX} {...axis} />
              <YAxis tickFormatter={corto} {...axis} width={48} />
              <Tooltip content={<Tip />} />
              {series.length > 1 ? <Legend {...legend} /> : null}
              {series.map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={k}
                  stroke={SERIES[i % SERIES.length]}
                  strokeWidth={2}
                  dot={{ r: 2.5, strokeWidth: 0, fill: SERIES[i % SERIES.length] }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Marco>
    )
  }

  // ── Barras ───────────────────────────────────────────────────────────────
  const horizontal = datosNum.length > 6 || datosNum.some((d) => String(d[ejeX] ?? '').length > 12)
  const alto = horizontal ? Math.max(180, Math.min(datosNum.length * 28 + 44, 340)) : 240

  return (
    <Marco titulo={titulo} nota={nota}>
      <div className="px-1 pb-2 pt-2" style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datosNum}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 8, right: horizontal ? 52 : 16, left: 4, bottom: 4 }}
            barCategoryGap="24%"
          >
            <CartesianGrid stroke={chart.fog} horizontal={!horizontal} vertical={horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" tickFormatter={corto} {...axis} />
                <YAxis type="category" dataKey={ejeX} tickFormatter={etiquetaX} {...axis} width={170} />
              </>
            ) : (
              <>
                <XAxis dataKey={ejeX} tickFormatter={etiquetaX} {...axis} />
                <YAxis tickFormatter={corto} {...axis} width={48} />
              </>
            )}
            <Tooltip content={<Tip />} cursor={tooltip.cursor} />
            {series.length > 1 ? <Legend {...legend} /> : null}
            {series.map((k, i) => (
              <Bar key={k} dataKey={k} name={k} fill={series.length === 1 ? chart.ink : SERIES[i % SERIES.length]}>
                {series.length === 1 ? (
                  <LabelList
                    dataKey={k}
                    position={horizontal ? 'right' : 'top'}
                    formatter={corto}
                    style={{ fontSize: 11, fill: chart.graphite, fontFamily: "'IBM Plex Mono', monospace" }}
                  />
                ) : null}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Marco>
  )
}
