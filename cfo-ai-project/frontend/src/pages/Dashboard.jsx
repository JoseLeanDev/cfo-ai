import { Link } from 'react-router-dom'
import { useResumen, useInsights } from '../hooks/useCfoData'
import PageInsights from '../components/agents/PageInsights'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { chart, axis, grid, tooltip, legend } from '../config/charts.jsx'
import { PageTitle, Eyebrow, Stat, StatSkeleton, Card, CardHeader, Badge } from '../components/ui'
import { ErrorState } from '../components/ui/states'

/**
 * Resumen.
 *
 * Todo sale de /api/dashboard/resumen, que lee la capa semántica: las mismas
 * vistas que consulta el chat. Antes esta pantalla mostraba arreglos fijos en
 * el código y el chat respondía otras cifras sobre la misma empresa.
 *
 * Hay dos marcos de tiempo y la pantalla los nombra: las ventas llegan al
 * último mes con datos y la tesorería es una foto a la fecha de corte.
 */

const q = (v) => (v == null ? '—' : 'Q ' + Math.round(v).toLocaleString('es-GT'))
const qCorto = (v) => (Math.abs(v) >= 1e6 ? `Q${(v / 1e6).toFixed(1)}M` : `Q${Math.round(v / 1000)}K`)
const mesAnio = (f) =>
  f ? new Date(f).toLocaleDateString('es-GT', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''
const fecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''
const periodoCorto = (p) => {
  const [a, m] = String(p).split('-')
  return new Date(Date.UTC(+a, +m - 1, 1)).toLocaleDateString('es-GT', { month: 'short', timeZone: 'UTC' })
}

// Los países se ordenan por venta y toman la escala neutra; el cobalto queda
// para el último, que es el de menor venta, para que no compita con el líder.
const COLORES_SERIE = [chart.ink, chart.graphite, chart.slate, chart.mist, chart.cobalt]

const TONO_ANTIGUEDAD = {
  'al corriente': 'bg-verified-500',
  '1 a 30 días': 'bg-mist',
  '31 a 60 días': 'bg-copper-500',
  '61 a 90 días': 'bg-copper-500',
  'más de 90 días': 'bg-breach-500',
}

function TooltipQora({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltip.contentStyle}>
      <p style={tooltip.labelStyle}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-baseline gap-3 tabular-nums">
          <span className="flex-1 text-slate">{p.name}</span>
          <span className="font-mono text-ink">{q(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useResumen()
  const { data: insightsData } = useInsights('dashboard')
  const r = data?.data

  if (isError) {
    return <ErrorState title="No se pudo leer el resumen" error={error} onRetry={refetch} />
  }

  const p = r?.posicion
  const meta = r?.meta
  const conteos = r?.conteos
  const paises = r?.paises || []
  const variacionMes =
    r?.mes?.ventas_anio_anterior > 0 ? (r.mes.ventas / r.mes.ventas_anio_anterior - 1) * 100 : null
  const hallazgos = insightsData?.insights?.length ?? 0

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Resumen corporativo"
        title="Posición del período"
        description={
          meta
            ? `${conteos.tiendas} tiendas y ${conteos.marcas} marcas en ${conteos.paises} países. Ventas hasta ${mesAnio(meta.ventas_hasta)}; tesorería y cartera al ${fecha(meta.fecha_corte)}. Cifras en quetzales.`
            : 'Cargando la posición de la empresa.'
        }
        actions={
          <Link to="/asistente" className="btn-secondary btn-sm">
            Preguntar a un agente
          </Link>
        }
      />

      {/* Indicadores. Una sola tarjeta en tinta: el efectivo es la cifra de la
          que cuelga todo lo demás. */}
      {isLoading || !p ? (
        <StatSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Efectivo disponible"
            value={q(p.efectivo)}
            note="Todas las cuentas; dólares a Q7.75"
            tone="ink"
          />
          <Stat
            label={`Ventas de ${mesAnio(r.mes.mes)}`}
            value={q(r.mes.ventas)}
            delta={
              variacionMes == null
                ? null
                : `${variacionMes >= 0 ? '+' : '−'}${Math.abs(variacionMes).toFixed(1)}% contra el año anterior`
            }
            deltaTone={variacionMes == null ? 'neutral' : variacionMes >= 0 ? 'up' : 'down'}
          />
          <Stat
            label="Runway"
            value={`${p.runway_dias} días`}
            delta={`Gasto de ${q(p.gasto_diario)} diarios`}
            deltaTone={p.runway_dias < 60 ? 'down' : 'neutral'}
          />
          <Stat
            label="Cartera por cobrar"
            value={q(p.cxc_total)}
            delta={`${Number(p.cxc_vencida_pct).toFixed(1)}% vencida`}
            deltaTone={p.cxc_vencida_pct > 20 ? 'down' : 'neutral'}
          />
        </div>
      )}

      <PageInsights context="dashboard" maxInsights={4} />

      {/* Ventas por país */}
      <Card>
        <CardHeader
          title="Ventas por país"
          eyebrow="Últimos siete meses con datos"
          aside={
            <Link to="/margenes" className="link">
              Ver márgenes →
            </Link>
          }
        />
        <div className="px-6 py-5">
          <div className="h-64">
            {r ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={r.tendencia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...grid} />
                  <XAxis dataKey="periodo" {...axis} tickFormatter={periodoCorto} />
                  <YAxis {...axis} tickFormatter={qCorto} width={56} />
                  <Tooltip content={<TooltipQora />} cursor={tooltip.cursor} labelFormatter={periodoCorto} />
                  <Legend {...legend} />
                  {paises.map((pa, i) => (
                    <Area
                      key={pa.pais}
                      type="monotone"
                      dataKey={pa.pais}
                      name={pa.pais}
                      stackId="1"
                      stroke={COLORES_SERIE[i % COLORES_SERIE.length]}
                      fill={COLORES_SERIE[i % COLORES_SERIE.length]}
                      fillOpacity={0.85}
                      strokeWidth={1}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="skeleton h-full w-full" />
            )}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-fog pt-5 sm:grid-cols-3 lg:grid-cols-5">
            {paises.map((pa) => (
              <div key={pa.pais}>
                <dt className="eyebrow text-[0.6875rem]">{pa.pais}</dt>
                <dd className="mt-1 font-display text-[1.125rem] font-semibold tabular-nums text-ink">
                  {q(pa.ventas)}
                </dd>
                <dd className="text-[0.8125rem] text-slate">
                  {pa.tiendas} tiendas · margen {Number(pa.margen).toFixed(1)}%
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Ventas por marca"
            eyebrow={meta ? `Año ${new Date(meta.ventas_hasta).getUTCFullYear()}` : 'Año'}
            aside={
              <Link to="/margenes" className="link">
                Detalle →
              </Link>
            }
          />
          <div className="px-6 py-5">
            <div className="h-56">
              {r ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={r.marcas} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="marca" {...axis} interval={0} tick={{ ...axis.tick, fontSize: 11 }} />
                    <YAxis {...axis} tickFormatter={qCorto} width={56} />
                    <Tooltip content={<TooltipQora />} cursor={tooltip.cursor} />
                    <Bar dataKey="ventas" name="Ventas">
                      {r.marcas.map((m, i) => (
                        <Cell key={m.marca} fill={i === 0 ? chart.ink : i === 1 ? chart.graphite : chart.mist} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="skeleton h-full w-full" />
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Tiendas con mayor venta"
            eyebrow={meta ? `Año ${new Date(meta.ventas_hasta).getUTCFullYear()}` : 'Año'}
            aside={
              <Link to="/margenes" className="link">
                Ver todas →
              </Link>
            }
          />
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Tienda</th>
                  <th className="num">Ventas</th>
                  <th className="num">Margen</th>
                </tr>
              </thead>
              <tbody>
                {(r?.tiendas || []).map((t) => (
                  <tr key={t.tienda}>
                    <td>
                      <p className="font-medium text-ink">{t.tienda}</p>
                      <p className="text-[0.8125rem] text-slate">
                        {t.pais} · {t.marca}
                      </p>
                    </td>
                    <td className="num">{q(t.ventas)}</td>
                    <td className="num">{Number(t.margen).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Antigüedad de cartera"
            eyebrow={meta ? `Al ${fecha(meta.fecha_corte)}` : 'Cuentas por cobrar'}
            aside={
              <Link to="/tesoreria/cuentas-por-cobrar" className="link">
                Ver cartera →
              </Link>
            }
          />
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Rango</th>
                  <th className="num">Facturas</th>
                  <th className="num">Monto</th>
                  <th className="num">Participación</th>
                </tr>
              </thead>
              <tbody>
                {(r?.antiguedad || []).map((a) => (
                  <tr key={a.rango}>
                    <td>
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-pill ${TONO_ANTIGUEDAD[a.rango] || 'bg-mist'}`} />
                        <span className="first-letter:uppercase">{a.rango}</span>
                      </span>
                    </td>
                    <td className="num text-slate">{a.facturas}</td>
                    <td className={`num ${a.rango === 'más de 90 días' ? 'text-breach' : ''}`}>{q(a.monto)}</td>
                    <td className="num text-slate">
                      {p ? `${((a.monto / p.cxc_total) * 100).toFixed(0)}%` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
              {p ? (
                <tfoot>
                  <tr className="border-t border-fog">
                    <td className="font-medium" colSpan={2}>
                      Total
                    </td>
                    <td className="num font-medium">{q(p.cxc_total)}</td>
                    <td className="num">
                      <Badge tone={p.cxc_vencida_pct > 20 ? 'review' : 'neutral'}>
                        {Number(p.cxc_vencida_pct).toFixed(0)}% vencida
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Pagos próximos"
            eyebrow={meta ? `Cuentas por pagar desde el ${fecha(meta.fecha_corte)}` : 'Cuentas por pagar'}
            aside={
              <Link to="/tesoreria/cuentas-por-pagar" className="link">
                Ver calendario →
              </Link>
            }
          />
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th className="num">Vence</th>
                  <th className="num">Monto</th>
                </tr>
              </thead>
              <tbody>
                {(r?.pagos || []).map((pg) => (
                  <tr key={`${pg.proveedor}-${pg.fecha_vencimiento}`}>
                    <td className="font-medium text-ink">{pg.proveedor}</td>
                    <td className={`num ${pg.dias <= 3 ? 'text-breach' : 'text-slate'}`}>
                      {pg.dias === 0 ? 'hoy' : `${pg.dias} d`}
                    </td>
                    <td className="num">{q(pg.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Flujo mensual. Reemplaza a una calculadora de runway con fórmula
            propia que daba un número distinto al del chat y los hallazgos. */}
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader
            title="Flujo de efectivo"
            eyebrow="Entradas y salidas por mes"
            aside={
              <Link to="/tesoreria/proyecciones" className="link">
                Ver proyección →
              </Link>
            }
          />
          <div className="px-6 py-5">
            <div className="h-56">
              {r ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={r.flujo} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="periodo" {...axis} tickFormatter={periodoCorto} />
                    <YAxis {...axis} tickFormatter={qCorto} width={56} />
                    <Tooltip content={<TooltipQora />} cursor={tooltip.cursor} labelFormatter={periodoCorto} />
                    <Legend {...legend} />
                    <Bar dataKey="entradas" name="Entradas" fill={chart.ink} />
                    <Bar dataKey="salidas" name="Salidas" fill={chart.mist} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="skeleton h-full w-full" />
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Agentes" eyebrow="Estado" />
          <div className="px-6 py-5">
            <dl className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[0.875rem] text-slate">En ejecución</dt>
                <dd className="flex items-baseline gap-2 font-display text-[1.5rem] font-semibold tabular-nums text-ink">
                  4<span className="status-dot agent mb-1" />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-fog pt-4">
                <dt className="text-[0.875rem] text-slate">Hallazgos abiertos</dt>
                <dd className="font-display text-[1.5rem] font-semibold tabular-nums text-ink">{hallazgos}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-fog pt-4">
                <dt className="text-[0.875rem] text-slate">Capital de trabajo</dt>
                <dd className="font-mono text-[0.9375rem] tabular-nums text-ink">{p ? q(p.capital_de_trabajo) : '—'}</dd>
              </div>
            </dl>

            <Eyebrow className="mt-6 border-t border-fog pt-4 text-[0.6875rem]">
              Caja · Análisis · Cobranza · Contabilidad
            </Eyebrow>

            <Link to="/asistente" className="btn-agent mt-4 w-full">
              Preguntar a un agente
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
