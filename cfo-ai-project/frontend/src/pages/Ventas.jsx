import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowUpIcon, ArrowDownIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { useVentas } from '../hooks/useCfoData'
import PageInsights from '../components/agents/PageInsights'
import { chart, axis, grid, tooltip, marcas as COLOR_MARCA, colorMarca } from '../config/charts.jsx'
import { PageTitle, Stat, StatSkeleton, Card, CardHeader, Tabs, Eyebrow, cn } from '../components/ui'
import { ErrorState } from '../components/ui/states'

/**
 * Ventas.
 *
 * Todo sale de /api/ventas/resumen, que lee la capa semántica: las mismas
 * vistas que consulta el chat. La versión anterior mostraba arreglos fijos de
 * otra empresa ("Retail Fashion GT", metas, pipeline y clientes inventados).
 *
 * El color identifica la marca y la sigue a donde vaya: la sucursal, la
 * categoría y el vendedor llevan el color de su marca. El verde y el rojo
 * quedan solo para la variación contra el año anterior, siempre con flecha.
 */

// Espacio duro: la Q nunca queda sola al final de un renglón.
const q = (v) => (v == null ? '—' : 'Q\u00A0' + Math.round(v).toLocaleString('es-GT'))
const qCorto = (v) =>
  v == null ? '—' : Math.abs(v) >= 1e6 ? `Q${(v / 1e6).toFixed(2)}M` : `Q${Math.round(v / 1000)}K`
const entero = (v) => (v == null ? '—' : Math.round(v).toLocaleString('es-GT'))
const pct = (v, d = 1) => (v == null ? '—' : `${Number(v).toFixed(d)}%`)
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const ORDEN_MARCAS = Object.keys(COLOR_MARCA)
// La capital se llama igual que el país: "Guatemala · Guatemala" no dice nada.
const lugar = (ciudad, pais) => (ciudad === pais ? `Ciudad de ${ciudad}` : `${ciudad} · ${pais}`)
const mayuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t)

/* -------------------------------------------------------------------------- */
/* Piezas */
/* -------------------------------------------------------------------------- */

/** Variación con flecha: el color nunca va solo. */
function Variacion({ valor, className }) {
  if (valor == null) return <span className={cn('text-slate', className)}>—</span>
  const sube = valor >= 0
  const Icono = sube ? ArrowUpIcon : ArrowDownIcon
  return (
    <span
      className={cn(
        // relative: el texto para lectores de pantalla es absoluto y, sin un
        // ancestro posicionado, escapa del scroll de la tabla y ensancha la página.
        'relative inline-flex items-center justify-end gap-0.5 font-mono tabular-nums',
        sube ? 'text-verified' : 'text-breach',
        className
      )}
    >
      <Icono className="h-3 w-3 shrink-0" aria-hidden="true" />
      {Math.abs(valor).toFixed(1)}%
      <span className="sr-only">{sube ? 'de aumento' : 'de caída'}</span>
    </span>
  )
}

function Punto({ marca, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]', className)}
      style={{ backgroundColor: colorMarca(marca) }}
    />
  )
}

/** Marca como etiqueta: fondo con un velo de su color, texto siempre en tinta. */
function EtiquetaMarca({ marca }) {
  const color = colorMarca(marca)
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-control px-2 py-0.5 text-[0.75rem] font-medium text-ink"
      style={{ backgroundColor: `${color}1F` }}
    >
      <Punto marca={marca} className="h-2 w-2" />
      {marca}
    </span>
  )
}

/** Tendencia de doce meses en una línea, en el color de la marca. */
function Tendencia({ valores, color, ancho = 96, alto = 28 }) {
  const datos = valores.filter((v) => v != null)
  if (datos.length < 2) return null
  const min = Math.min(...datos)
  const max = Math.max(...datos)
  const rango = max - min || 1
  const paso = ancho / (valores.length - 1)
  const y = (v) => alto - 3 - ((v - min) / rango) * (alto - 6)
  const puntos = valores.map((v, i) => `${(i * paso).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const ultimo = valores[valores.length - 1]
  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" className="overflow-visible">
      <polyline points={puntos} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ancho} cy={y(ultimo)} r="2.5" fill={color} />
    </svg>
  )
}

/**
 * Barra horizontal en HTML: el nombre, la barra y la cifra comparten fila, así
 * que nada se sale de la tarjeta sin importar el ancho.
 */
function FilaBarra({ etiqueta, detalle, valor, maximo, color, derecha, segmentos }) {
  const ancho = maximo > 0 ? Math.max(1.5, (valor / maximo) * 100) : 0
  return (
    <li className="grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] items-center gap-x-4 py-2 max-sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="truncate text-[0.875rem] font-medium text-ink" title={etiqueta}>
          {etiqueta}
        </p>
        {detalle ? <p className="truncate text-[0.75rem] text-slate">{detalle}</p> : null}
      </div>
      <div className="h-3 min-w-0 rounded-[2px] bg-paper max-sm:order-last max-sm:col-span-2 max-sm:mt-1">
        {segmentos ? (
          <div className="flex h-full gap-[2px]" style={{ width: `${ancho}%` }}>
            {segmentos.map((s) => (
              <div
                key={s.clave}
                title={`${s.clave}: ${q(s.valor)}`}
                className="h-full first:rounded-l-[2px] last:rounded-r-[2px]"
                style={{ flexGrow: s.valor, flexBasis: 0, backgroundColor: s.color }}
              />
            ))}
          </div>
        ) : (
          <div className="h-full rounded-[2px]" style={{ width: `${ancho}%`, backgroundColor: color }} />
        )}
      </div>
      <div className="text-right">{derecha}</div>
    </li>
  )
}

function Leyenda({ presentes }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {ORDEN_MARCAS.filter((m) => !presentes || presentes.includes(m)).map((m) => (
        <li key={m} className="inline-flex items-center gap-1.5 text-[0.8125rem] text-graphite">
          <Punto marca={m} />
          {m}
        </li>
      ))}
    </ul>
  )
}

function TooltipMensual({ active, payload, label, anio, anterior }) {
  if (!active || !payload?.length) return null
  const fila = payload[0].payload
  const variacion = fila.ventas_anterior > 0 ? (fila.ventas / fila.ventas_anterior - 1) * 100 : null
  return (
    <div style={tooltip.contentStyle} className="min-w-[220px]">
      <p style={tooltip.labelStyle}>
        {MESES_LARGOS[label - 1]} {anio}
      </p>
      {ORDEN_MARCAS.filter((m) => fila[m] != null).map((m) => (
        <p key={m} className="flex items-center gap-2 tabular-nums">
          <Punto marca={m} className="h-2 w-2" />
          <span className="flex-1 text-slate">{m}</span>
          <span className="font-mono text-ink">{q(fila[m])}</span>
        </p>
      ))}
      <p className="mt-1.5 flex items-baseline gap-2 border-t border-fog pt-1.5 tabular-nums">
        <span className="flex-1 font-medium text-ink">Total</span>
        <span className="font-mono font-medium text-ink">{q(fila.ventas)}</span>
      </p>
      {anterior ? (
        <p className="flex items-baseline gap-2 tabular-nums">
          <span className="flex-1 text-slate">{anterior}</span>
          <span className="font-mono text-slate">{q(fila.ventas_anterior)}</span>
          <Variacion valor={variacion} className="text-[0.75rem]" />
        </p>
      ) : null}
    </div>
  )
}

/** Encabezado de columna ordenable. */
function Th({ id, orden, onOrden, children, num }) {
  const activo = orden.col === id
  return (
    <th className={num ? 'num' : undefined} aria-sort={activo ? (orden.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        onClick={() => onOrden(id)}
        className={cn(
          'inline-flex items-center gap-1 uppercase tracking-[0.12em] transition-colors hover:text-ink',
          activo && 'text-ink'
        )}
      >
        {children}
        {activo ? (
          orden.dir === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
        ) : (
          <ChevronUpDownIcon className="h-3 w-3 opacity-50" />
        )}
      </button>
    </th>
  )
}

function useOrden(filas, inicial = { col: 'ventas', dir: 'desc' }) {
  const [orden, setOrden] = useState(inicial)
  const ordenadas = useMemo(() => {
    const signo = orden.dir === 'asc' ? 1 : -1
    return [...filas].sort((a, b) => {
      const x = a[orden.col]
      const y = b[orden.col]
      if (x == null) return 1
      if (y == null) return -1
      return typeof x === 'string' ? signo * x.localeCompare(y, 'es') : signo * (x - y)
    })
  }, [filas, orden])
  const alternar = (col) =>
    setOrden((o) => (o.col === col ? { col, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: col === 'tienda' || col === 'vendedor' ? 'asc' : 'desc' }))
  return [ordenadas, orden, alternar]
}

/** Filtro por marca en fichas: la ficha activa se rellena con el color de la marca. */
function FiltroMarca({ valor, onChange, conteos }) {
  const opciones = ['todas', ...ORDEN_MARCAS]
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por marca">
      {opciones.map((m) => {
        const activo = valor === m
        const color = m === 'todas' ? chart.ink : colorMarca(m)
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            aria-pressed={activo}
            className={cn(
              'inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-[0.8125rem] transition-colors',
              activo ? 'border-transparent text-ink' : 'border-fog bg-white text-slate hover:border-mist hover:text-ink'
            )}
            style={activo ? { backgroundColor: `${color}24`, borderColor: color } : undefined}
          >
            {m === 'todas' ? 'Todas las marcas' : (
              <>
                <Punto marca={m} className="h-2 w-2" />
                {m}
              </>
            )}
            {conteos?.[m] != null ? (
              <span className="font-mono text-[0.6875rem] tabular-nums text-slate">{conteos[m]}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Pestañas */
/* -------------------------------------------------------------------------- */

function General({ d }) {
  const mejorMes = d.mensual.reduce((a, b) => (b.ventas > a.ventas ? b : a), d.mensual[0])
  const peorMes = d.mensual.reduce((a, b) => (b.ventas < a.ventas ? b : a), d.mensual[0])
  const maxPais = Math.max(...d.paises.map((p) => p.ventas))
  const totalMarcas = d.marcas.reduce((s, m) => s + m.ventas, 0)

  return (
    <div className="space-y-6">
      <Card className="min-w-0">
        <CardHeader
          title="Ventas por mes"
          eyebrow={d.anterior ? `${d.anio} por marca · línea: total ${d.anterior}` : `${d.anio} por marca`}
        />
        <div className="px-6 py-5">
          <Leyenda />
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={d.mensual} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid {...grid} />
                <XAxis dataKey="mes" {...axis} tickFormatter={(m) => MESES[m - 1]} />
                <YAxis {...axis} tickFormatter={qCorto} width={60} />
                <Tooltip
                  content={<TooltipMensual anio={d.anio} anterior={d.anterior} />}
                  cursor={tooltip.cursor}
                />
                {ORDEN_MARCAS.map((m, i) => (
                  <Bar
                    key={m}
                    dataKey={m}
                    name={m}
                    stackId="marcas"
                    fill={COLOR_MARCA[m]}
                    stroke={chart.white}
                    strokeWidth={1}
                    radius={i === ORDEN_MARCAS.length - 1 ? [3, 3, 0, 0] : 0}
                  />
                ))}
                {d.anterior ? (
                  <Line
                    type="monotone"
                    dataKey="ventas_anterior"
                    name={`Total ${d.anterior}`}
                    stroke={chart.ink}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={{ r: 4, fill: chart.ink, stroke: chart.white, strokeWidth: 2 }}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-fog pt-5 lg:grid-cols-4">
            <div>
              <dt className="eyebrow text-[0.6875rem]">Mejor mes</dt>
              <dd className="mt-1 font-display text-[1.125rem] font-semibold capitalize text-ink">
                {MESES_LARGOS[mejorMes.mes - 1]}
              </dd>
              <dd className="font-mono text-[0.8125rem] tabular-nums text-slate">{q(mejorMes.ventas)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6875rem]">Mes más bajo</dt>
              <dd className="mt-1 font-display text-[1.125rem] font-semibold capitalize text-ink">
                {MESES_LARGOS[peorMes.mes - 1]}
              </dd>
              <dd className="font-mono text-[0.8125rem] tabular-nums text-slate">{q(peorMes.ventas)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6875rem]">Promedio mensual</dt>
              <dd className="mt-1 font-display text-[1.125rem] font-semibold tabular-nums text-ink">
                {q(d.kpis.ventas / d.mensual.length)}
              </dd>
              <dd className="text-[0.8125rem] text-slate">{d.mensual.length} meses con datos</dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6875rem]">Meses arriba de {d.anterior ?? 'año anterior'}</dt>
              <dd className="mt-1 font-display text-[1.125rem] font-semibold tabular-nums text-ink">
                {d.anterior ? `${d.mensual.filter((m) => m.ventas > m.ventas_anterior).length} de ${d.mensual.length}` : '—'}
              </dd>
              <dd className="text-[0.8125rem] text-slate">contra el mismo mes</dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader title="Ventas por marca" eyebrow={`Participación ${d.anio}`} />
          <div className="px-6 py-5">
            {/* Una sola barra al 100%: la mezcla de marcas de un vistazo. */}
            <div className="flex h-4 w-full gap-[2px]" role="img" aria-label="Participación de cada marca en las ventas">
              {d.marcas.map((m) => (
                <div
                  key={m.marca}
                  title={`${m.marca}: ${pct(m.participacion)}`}
                  className="h-full first:rounded-l-[2px] last:rounded-r-[2px]"
                  style={{ flexGrow: m.ventas, flexBasis: 0, backgroundColor: colorMarca(m.marca) }}
                />
              ))}
            </div>
            <ul className="mt-5 divide-y divide-fog">
              {d.marcas.map((m) => (
                <li key={m.marca} className="flex items-center gap-3 py-3">
                  <Punto marca={m.marca} className="h-3 w-3" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{m.marca}</p>
                    <p className="text-[0.75rem] text-slate">
                      {mayuscula(m.segmento)} · {m.tiendas} {m.tiendas === 1 ? 'tienda' : 'tiendas'} · margen {pct(m.margen_pct)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[0.875rem] tabular-nums text-ink">{q(m.ventas)}</p>
                    <p className="flex items-center justify-end gap-2 text-[0.75rem]">
                      <span className="font-mono tabular-nums text-slate">{pct((m.ventas / totalMarcas) * 100)}</span>
                      <Variacion valor={m.variacion} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Ventas por país" eyebrow={`${d.anio} · mezcla de marcas`} />
          <div className="px-6 py-4">
            <ul>
              {d.paises.map((p) => (
                <FilaBarra
                  key={p.pais}
                  etiqueta={p.pais}
                  detalle={`${p.tiendas} ${p.tiendas === 1 ? 'tienda' : 'tiendas'} · margen ${pct(p.margen_pct)}`}
                  valor={p.ventas}
                  maximo={maxPais}
                  segmentos={ORDEN_MARCAS.filter((m) => p.marcas[m]).map((m) => ({
                    clave: m,
                    valor: p.marcas[m],
                    color: colorMarca(m),
                  }))}
                  derecha={
                    <>
                      <p className="font-mono text-[0.875rem] tabular-nums text-ink">{qCorto(p.ventas)}</p>
                      <Variacion valor={p.variacion} className="text-[0.75rem]" />
                    </>
                  }
                />
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Sucursales({ d }) {
  const [marca, setMarca] = useState('todas')
  const [pais, setPais] = useState('todos')
  const filtradas = d.tiendas.filter(
    (t) => (marca === 'todas' || t.marca === marca) && (pais === 'todos' || t.pais === pais)
  )
  const [filas, orden, alternar] = useOrden(filtradas)
  const maximo = Math.max(...d.tiendas.map((t) => t.ventas))
  const maxParticipacion = Math.max(...d.tiendas.map((t) => t.participacion ?? 0)) || 1
  const totalFiltrado = filtradas.reduce((s, t) => s + t.ventas, 0)
  const conteos = Object.fromEntries(ORDEN_MARCAS.map((m) => [m, d.tiendas.filter((t) => t.marca === m).length]))
  const paises = [...new Set(d.tiendas.map((t) => t.pais))]

  const conVariacion = filtradas.filter((t) => t.variacion != null)
  const destacadas = filtradas.length
    ? [
        { titulo: 'Mayor venta', t: filtradas[0], cifra: q(filtradas[0].ventas) },
        conVariacion.length && {
          titulo: 'Mayor crecimiento',
          t: conVariacion.reduce((a, b) => (b.variacion > a.variacion ? b : a)),
          variacion: true,
        },
        conVariacion.length && {
          titulo: 'Menor crecimiento',
          t: conVariacion.reduce((a, b) => (b.variacion < a.variacion ? b : a)),
          variacion: true,
        },
        {
          titulo: 'Mayor venta por m²',
          t: filtradas.reduce((a, b) => ((b.ventas_m2 ?? 0) > (a.ventas_m2 ?? 0) ? b : a)),
          cifraDe: (t) => `${q(t.ventas_m2)} / m²`,
        },
        {
          titulo: 'Mejor margen',
          t: filtradas.reduce((a, b) => (b.margen_pct > a.margen_pct ? b : a)),
          cifraDe: (t) => pct(t.margen_pct),
        },
      ].filter(Boolean)
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltroMarca valor={marca} onChange={setMarca} conteos={conteos} />
        <label className="inline-flex items-center gap-2 text-[0.8125rem] text-slate">
          País
          <select value={pais} onChange={(e) => setPais(e.target.value)} className="select w-auto py-1.5 text-[0.8125rem]">
            <option value="todos">Todos</option>
            {paises.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtradas.length === 0 ? (
        <Card className="px-6 py-10 text-center text-slate">
          No hay sucursales de esa marca en ese país.
        </Card>
      ) : (
        <>
          <div className="grid min-w-0 gap-6 lg:grid-cols-3">
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader
                title="Ranking de sucursales"
                eyebrow={`Ventas ${d.anio} · ${filtradas.length} ${filtradas.length === 1 ? 'sucursal' : 'sucursales'} · ${q(totalFiltrado)}`}
              />
              <div className="px-6 py-3">
                <div className="pb-2 pt-2">
                  <Leyenda presentes={[...new Set(filtradas.map((t) => t.marca))]} />
                </div>
                <ol>
                  {filtradas.map((t) => (
                    <FilaBarra
                      key={t.tienda}
                      etiqueta={t.tienda}
                      detalle={lugar(t.ciudad, t.pais)}
                      valor={t.ventas}
                      maximo={maximo}
                      color={colorMarca(t.marca)}
                      derecha={
                        <div className="flex items-baseline justify-end gap-3">
                          <span className="font-mono text-[0.875rem] tabular-nums text-ink">{qCorto(t.ventas)}</span>
                          <Variacion valor={t.variacion} className="w-14 text-[0.75rem]" />
                        </div>
                      }
                    />
                  ))}
                </ol>
              </div>
            </Card>

            <Card className="min-w-0">
              <CardHeader title="Lo que destaca" eyebrow={d.anterior ? `${d.anio} contra ${d.anterior}` : `${d.anio}`} />
              <ul className="divide-y divide-fog">
                {destacadas.map((x) => (
                  <li key={x.titulo} className="flex gap-3 px-6 py-4">
                    <span
                      aria-hidden="true"
                      className="mt-1 w-1 shrink-0 self-stretch rounded-pill"
                      style={{ backgroundColor: colorMarca(x.t.marca) }}
                    />
                    <div className="min-w-0 flex-1">
                      <Eyebrow className="text-[0.6875rem]">{x.titulo}</Eyebrow>
                      <p className="mt-1 truncate font-medium text-ink" title={x.t.tienda}>
                        {x.t.tienda}
                      </p>
                      <p className="text-[0.75rem] text-slate">
                        {x.t.ciudad === x.t.pais ? `Ciudad de ${x.t.ciudad}` : x.t.ciudad} · {x.t.marca}
                      </p>
                    </div>
                    <div className="shrink-0 self-center text-right text-[0.875rem]">
                      {x.variacion ? (
                        <Variacion valor={x.t.variacion} />
                      ) : (
                        <span className="font-mono tabular-nums text-ink">{x.cifra ?? x.cifraDe(x.t)}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="min-w-0">
            <CardHeader
              title="Detalle por sucursal"
              eyebrow="Haga clic en una columna para ordenar"
              aside={
                <Link to="/margenes" className="link">
                  Ver márgenes →
                </Link>
              }
            />
            <div className="table-container border-0">
              <table className="table">
                <thead>
                  <tr>
                    <Th id="tienda" orden={orden} onOrden={alternar}>Sucursal</Th>
                    <Th id="ventas" orden={orden} onOrden={alternar} num>Ventas</Th>
                    {d.anterior ? <Th id="variacion" orden={orden} onOrden={alternar} num>vs {d.anterior}</Th> : null}
                    <Th id="margen_pct" orden={orden} onOrden={alternar} num>Margen</Th>
                    <Th id="unidades" orden={orden} onOrden={alternar} num>Unidades</Th>
                    <Th id="ventas_m2" orden={orden} onOrden={alternar} num>Venta / m²</Th>
                    <Th id="participacion" orden={orden} onOrden={alternar} num>Participación</Th>
                    <th>Ene → dic</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((t) => (
                    <tr key={t.tienda}>
                      <td className="min-w-[230px]">
                        <span className="flex items-start gap-2.5">
                          <Punto marca={t.marca} className="mt-1.5" />
                          <span>
                            <span className="block font-medium text-ink">{t.tienda}</span>
                            <span className="block text-[0.8125rem] text-slate">
                              {lugar(t.ciudad, t.pais)} · {t.marca}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="num">{q(t.ventas)}</td>
                      {d.anterior ? (
                        <td className="num">
                          <Variacion valor={t.variacion} />
                        </td>
                      ) : null}
                      <td className="num">{pct(t.margen_pct)}</td>
                      <td className="num text-slate">{entero(t.unidades)}</td>
                      <td className="num text-slate">{t.ventas_m2 ? q(t.ventas_m2) : '—'}</td>
                      <td className="num">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-12 overflow-hidden rounded-pill bg-fog">
                            <span
                              className="block h-full rounded-pill"
                              style={{
                                width: `${((t.participacion ?? 0) / maxParticipacion) * 100}%`,
                                backgroundColor: colorMarca(t.marca),
                              }}
                            />
                          </span>
                          {pct(t.participacion)}
                        </span>
                      </td>
                      <td>
                        <Tendencia valores={t.serie} color={colorMarca(t.marca)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Vendedores({ d }) {
  const [filas, orden, alternar] = useOrden(d.vendedores)
  const maximo = Math.max(...d.vendedores.map((v) => v.ventas))
  const iniciales = (n) =>
    n
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')

  return (
    <div className="space-y-6">
      <p className="measure text-[0.875rem] leading-relaxed text-slate">
        Cada vendedor tiene una tienda asignada y además atiende las sucursales que no tienen vendedor
        propio, por eso sus ventas suman más de una tienda. El color es la marca de su tienda asignada.
      </p>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {d.vendedores.slice(0, 4).map((v, i) => (
          <div key={v.vendedor} className="relative overflow-hidden rounded-card border border-fog bg-white p-5">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: colorMarca(v.marca_asignada) }}
            />
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill font-display text-[0.875rem] font-semibold text-ink"
                style={{ backgroundColor: `${colorMarca(v.marca_asignada)}2E` }}
              >
                {iniciales(v.vendedor)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{v.vendedor}</p>
                <p className="truncate text-[0.75rem] text-slate">{v.tienda_asignada}</p>
              </div>
              <span className="ml-auto self-start font-mono text-[0.75rem] text-slate">#{i + 1}</span>
            </div>
            <p className="mt-4 font-display text-[1.5rem] font-semibold tabular-nums text-ink">{q(v.ventas)}</p>
            <div className="mt-1 flex items-center justify-between text-[0.8125rem]">
              <span className="text-slate">margen {pct(v.margen_pct)}</span>
              <Variacion valor={v.variacion} />
            </div>
          </div>
        ))}
      </div>

      <Card className="min-w-0">
        <CardHeader title="Ranking de vendedores" eyebrow={`Ventas ${d.anio}`} />
        <div className="px-6 py-3">
          <div className="pb-2 pt-2">
            <Leyenda presentes={[...new Set(d.vendedores.map((v) => v.marca_asignada))]} />
          </div>
          <ol>
            {d.vendedores.map((v) => (
              <FilaBarra
                key={v.vendedor}
                etiqueta={v.vendedor}
                detalle={`${v.tienda_asignada} · ${v.pais_asignado}`}
                valor={v.ventas}
                maximo={maximo}
                color={colorMarca(v.marca_asignada)}
                derecha={
                  <div className="flex items-baseline justify-end gap-3">
                    <span className="font-mono text-[0.875rem] tabular-nums text-ink">{qCorto(v.ventas)}</span>
                    <Variacion valor={v.variacion} className="w-14 text-[0.75rem]" />
                  </div>
                }
              />
            ))}
          </ol>
        </div>
      </Card>

      <Card className="min-w-0">
        <CardHeader title="Detalle por vendedor" eyebrow="Haga clic en una columna para ordenar" />
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <Th id="vendedor" orden={orden} onOrden={alternar}>Vendedor</Th>
                <th>Tienda asignada</th>
                <Th id="ventas" orden={orden} onOrden={alternar} num>Ventas</Th>
                {d.anterior ? <Th id="variacion" orden={orden} onOrden={alternar} num>vs {d.anterior}</Th> : null}
                <Th id="margen_pct" orden={orden} onOrden={alternar} num>Margen</Th>
                <Th id="unidades" orden={orden} onOrden={alternar} num>Unidades</Th>
                <Th id="tiendas" orden={orden} onOrden={alternar} num>Tiendas</Th>
                <Th id="participacion" orden={orden} onOrden={alternar} num>Participación</Th>
              </tr>
            </thead>
            <tbody>
              {filas.map((v) => (
                <tr key={v.vendedor}>
                  <td className="whitespace-nowrap font-medium text-ink">{v.vendedor}</td>
                  <td className="min-w-[200px]">
                    <span className="inline-flex items-center gap-2">
                      <Punto marca={v.marca_asignada} />
                      <span>
                        <span className="block text-ink">{v.tienda_asignada}</span>
                        <span className="block text-[0.8125rem] text-slate">{v.pais_asignado}</span>
                      </span>
                    </span>
                  </td>
                  <td className="num">{q(v.ventas)}</td>
                  {d.anterior ? (
                    <td className="num">
                      <Variacion valor={v.variacion} />
                    </td>
                  ) : null}
                  <td className="num">{pct(v.margen_pct)}</td>
                  <td className="num text-slate">{entero(v.unidades)}</td>
                  <td className="num text-slate">{v.tiendas}</td>
                  <td className="num">{pct(v.participacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Productos({ d }) {
  const maxCat = Math.max(...d.categorias.map((c) => c.ventas))
  const [filas, orden, alternar] = useOrden(d.productos)

  return (
    <div className="space-y-6">
      <div className="grid min-w-0 gap-6 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader
            title="Ventas por categoría"
            eyebrow={`${d.anio} · cada categoría pertenece a una marca`}
          />
          <div className="px-6 py-3">
            <div className="pb-2 pt-2">
              <Leyenda />
            </div>
            <ol>
              {d.categorias.map((c) => (
                <FilaBarra
                  key={c.categoria}
                  etiqueta={c.categoria}
                  detalle={`${c.marca} · margen ${pct(c.margen_pct)}`}
                  valor={c.ventas}
                  maximo={maxCat}
                  color={colorMarca(c.marca)}
                  derecha={
                    <div className="flex items-baseline justify-end gap-3">
                      <span className="font-mono text-[0.875rem] tabular-nums text-ink">{qCorto(c.ventas)}</span>
                      <Variacion valor={c.variacion} className="w-14 text-[0.75rem]" />
                    </div>
                  }
                />
              ))}
            </ol>
          </div>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader title="Crecimiento por categoría" eyebrow={d.anterior ? `${d.anio} contra ${d.anterior}` : 'Sin año anterior'} />
          <ul className="divide-y divide-fog">
            {[...d.categorias]
              .filter((c) => c.variacion != null)
              .sort((a, b) => b.variacion - a.variacion)
              .map((c) => {
                const maxVar = Math.max(...d.categorias.map((x) => Math.abs(x.variacion ?? 0))) || 1
                return (
                  <li key={c.categoria} className="flex items-center gap-3 px-6 py-2.5">
                    <Punto marca={c.marca} />
                    <span className="min-w-0 flex-1 truncate text-[0.875rem] text-ink">{c.categoria}</span>
                    <span className="h-1.5 w-20 overflow-hidden rounded-pill bg-fog">
                      <span
                        className={cn('block h-full rounded-pill', c.variacion >= 0 ? 'bg-verified-500' : 'bg-breach-500')}
                        style={{ width: `${(Math.abs(c.variacion) / maxVar) * 100}%` }}
                      />
                    </span>
                    <Variacion valor={c.variacion} className="w-14 text-[0.8125rem]" />
                  </li>
                )
              })}
          </ul>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader
          title={`Los ${d.productos.length} productos con mayor venta`}
          eyebrow={`${d.anio} · de ${d.kpis.productos} productos`}
          aside={
            <Link to="/margenes" className="link">
              Margen por producto →
            </Link>
          }
        />
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <Th id="producto" orden={orden} onOrden={alternar}>Producto</Th>
                <th>Marca</th>
                <Th id="ventas" orden={orden} onOrden={alternar} num>Ventas</Th>
                {d.anterior ? <Th id="variacion" orden={orden} onOrden={alternar} num>vs {d.anterior}</Th> : null}
                <Th id="margen_pct" orden={orden} onOrden={alternar} num>Margen</Th>
                <Th id="unidades" orden={orden} onOrden={alternar} num>Unidades</Th>
                <Th id="participacion" orden={orden} onOrden={alternar} num>Participación</Th>
              </tr>
            </thead>
            <tbody>
              {filas.map((p) => (
                <tr key={p.sku}>
                  <td className="num text-slate">{d.productos.indexOf(p) + 1}</td>
                  <td className="min-w-[220px]">
                    <p className="font-medium text-ink">{p.producto}</p>
                    <p className="font-mono text-[0.75rem] text-slate">
                      {p.sku} · {p.categoria}
                    </p>
                  </td>
                  <td>
                    <EtiquetaMarca marca={p.marca} />
                  </td>
                  <td className="num">{q(p.ventas)}</td>
                  {d.anterior ? (
                    <td className="num">
                      <Variacion valor={p.variacion} />
                    </td>
                  ) : null}
                  <td className="num">{pct(p.margen_pct)}</td>
                  <td className="num text-slate">{entero(p.unidades)}</td>
                  <td className="num">{pct(p.participacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Página */
/* -------------------------------------------------------------------------- */

const PESTANAS = [
  { id: 'general', label: 'General' },
  { id: 'sucursales', label: 'Por sucursal' },
  { id: 'vendedores', label: 'Por vendedor' },
  { id: 'productos', label: 'Por producto' },
]

export default function Ventas() {
  const [anio, setAnio] = useState(null)
  const [pestana, setPestana] = useState('general')
  const { data, isLoading, isError, error, refetch, isFetching } = useVentas(anio)
  const d = data?.data

  if (isError) {
    return <ErrorState title="No se pudo leer ventas" error={error} onRetry={refetch} />
  }

  const k = d?.kpis
  const deltaMargen = k && d.anterior ? k.margen_pct - k.margen_pct_anterior : null
  const variacionUnidades = k?.unidades_anterior > 0 ? (k.unidades / k.unidades_anterior - 1) * 100 : null
  const firmado = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Operación"
        title="Ventas"
        description={
          d
            ? `${k.tiendas} sucursales de ${d.marcas.length} marcas en ${d.paises.length} países. Enero a diciembre de ${d.anio}${d.anterior ? `, contra ${d.anterior}` : ''}. Cifras en quetzales.`
            : 'Cargando las ventas de la empresa.'
        }
        actions={
          <>
            {d ? (
              <div className="flex rounded-control border border-fog bg-white p-0.5" role="group" aria-label="Año">
                {d.anios.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAnio(a)}
                    aria-pressed={d.anio === a}
                    className={cn(
                      'rounded-[3px] px-3 py-1 font-mono text-[0.8125rem] tabular-nums transition-colors',
                      d.anio === a ? 'bg-ink text-white' : 'text-slate hover:text-ink'
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            ) : null}
            <Link to="/asistente" className="btn-secondary btn-sm">
              Preguntar a un agente
            </Link>
          </>
        }
      />

      {isLoading || !d ? (
        <StatSkeleton count={4} />
      ) : (
        <div className={cn('grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4', isFetching && 'opacity-60')}>
          <Stat
            label={`Ventas ${d.anio}`}
            value={q(k.ventas)}
            delta={k.variacion != null ? `${firmado(k.variacion)} contra ${d.anterior}` : 'Primer año con datos'}
            deltaTone={k.variacion == null ? 'neutral' : k.variacion >= 0 ? 'up' : 'down'}
            tone="ink"
          />
          <Stat
            label="Margen bruto"
            value={pct(k.margen_pct)}
            delta={
              deltaMargen == null
                ? `${q(k.margen_bruto)} de utilidad bruta`
                : Math.abs(deltaMargen) < 0.1
                  ? `Igual que en ${d.anterior}`
                  : `${deltaMargen > 0 ? 'Sube' : 'Baja'} ${Math.abs(deltaMargen).toFixed(1)} puntos contra ${d.anterior}`
            }
            deltaTone={deltaMargen == null || Math.abs(deltaMargen) < 0.1 ? 'neutral' : deltaMargen > 0 ? 'up' : 'down'}
            note={deltaMargen == null ? null : `${q(k.margen_bruto)} de utilidad bruta`}
          />
          <Stat
            label="Unidades vendidas"
            value={entero(k.unidades)}
            delta={variacionUnidades != null ? `${firmado(variacionUnidades)} contra ${d.anterior}` : null}
            deltaTone={variacionUnidades == null ? 'neutral' : variacionUnidades >= 0 ? 'up' : 'down'}
          />
          <Stat
            label="Precio promedio"
            value={q(k.precio_promedio)}
            note={`Por unidad, en ${k.productos} productos`}
          />
        </div>
      )}

      <PageInsights context="ventas" maxInsights={2} title="Hallazgos de ventas" />

      <div>
        <Tabs tabs={PESTANAS} value={pestana} onChange={setPestana} className="mb-6" />
        {!d ? (
          <div className="skeleton h-96 w-full" />
        ) : pestana === 'general' ? (
          <General d={d} />
        ) : pestana === 'sucursales' ? (
          <Sucursales d={d} />
        ) : pestana === 'vendedores' ? (
          <Vendedores d={d} />
        ) : (
          <Productos d={d} />
        )}
      </div>
    </div>
  )
}
