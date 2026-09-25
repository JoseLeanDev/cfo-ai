import { Link } from 'react-router-dom'
import { useInsights, useInsightsHistorico } from '../../hooks/useCfoData'
import { endpoints } from '../../services/cfoApi'
import { QoraMark } from '../brand/QoraLogo'
import { Eyebrow, Skeleton } from '../ui'

/**
 * Hallazgos de agente para una pantalla.
 *
 * El diseño anterior resolvía "esto lo hizo una IA" con una placa oscura,
 * degradados violeta-fucsia, un icono de chispas y una insignia "POWERED BY
 * AI". Eso compite con el dato y no dice nada verificable.
 *
 * Aquí la procedencia se marca como la marca la define: filete de cobalto a la
 * izquierda de todo lo que produce un agente, eyebrow en mono con el
 * identificador, y una línea de cierre con fuentes y hora. La placa es clara;
 * la tinta se reserva para una sola cifra por vista.
 */

const SEVERIDAD = {
  critical: { label: 'Crítico', badge: 'badge-danger', rule: 'border-breach' },
  warning: { label: 'Revisar', badge: 'badge-warning', rule: 'border-copper' },
  info: { label: 'Observación', badge: 'badge-info', rule: 'border-cobalt' },
}

const TIPO = {
  gasto: 'Costo',
  ingreso: 'Ingreso',
  alerta: 'Riesgo',
  oportunidad: 'Oportunidad',
}

const TITULOS = {
  tesoreria: 'Hallazgos de tesorería',
  contabilidad: 'Hallazgos contables',
  analisis: 'Hallazgos de análisis',
  ventas: 'Hallazgos de ventas',
  margenes: 'Hallazgos de margen',
  general: 'Hallazgos de los agentes',
}

const moneda = (valor, currency = 'GTQ') =>
  new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(valor))

function Shell({ title, count, children, footer }) {
  return (
    <section className="rounded-card border border-fog bg-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-fog px-6 py-4">
        <QoraMark className="h-4 w-4 shrink-0 text-ink" />
        <h2 className="font-display text-[1rem] font-semibold leading-tight text-ink">
          {title}
        </h2>
        {count != null ? (
          <Eyebrow className="ml-auto text-[0.6875rem]">
            {count} {count === 1 ? 'hallazgo' : 'hallazgos'}
          </Eyebrow>
        ) : null}
      </header>
      {children}
      {footer ? (
        <footer className="border-t border-fog px-6 py-3">{footer}</footer>
      ) : null}
    </section>
  )
}

export default function PageInsights({
  context = 'general',
  maxInsights = 3,
  title: customTitle,
}) {
  const { data: insightsData, isLoading: isLoadingReal } = useInsights(context)
  const { data: historicoData, isLoading: isLoadingHist } = useInsightsHistorico({
    limit: maxInsights,
    days: 30,
  })

  const hasRealInsights = insightsData?.insights?.length > 0
  const insights = hasRealInsights
    ? insightsData.insights.slice(0, maxInsights)
    : historicoData?.data?.insights || []

  const isLoading = isLoadingReal && isLoadingHist
  const title = customTitle || TITULOS[context] || TITULOS.general

  const registrarAccion = async (insight) => {
    try {
      await endpoints.agents.createLog({
        agente_nombre: 'Usuario',
        agente_tipo: 'user_action',
        categoria: 'accion_insight',
        descripcion: `Acción sobre hallazgo: "${insight.title}"`,
        detalles_json: JSON.stringify({
          insight_id: insight.id,
          insight_type: insight.type,
          action_taken: insight.action || 'Ver detalle',
          context,
          timestamp: new Date().toISOString(),
        }),
        resultado_status: 'exitoso',
      })
    } catch {
      /* el registro es best-effort: no bloquea la lectura */
    }
  }

  if (isLoading) {
    return (
      <Shell title={title}>
        <div className="divide-y divide-fog">
          {[0, 1].map((i) => (
            <div key={i} className="border-l-2 border-fog px-6 py-4">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="mt-2.5 h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      </Shell>
    )
  }

  if (insights.length === 0) {
    return (
      <Shell title={title}>
        <p className="measure px-6 py-5 text-[0.875rem] leading-relaxed text-slate">
          Los agentes están leyendo las fuentes de esta instancia. No hay nada
          que reportar en este período.
        </p>
      </Shell>
    )
  }

  return (
    <Shell
      title={title}
      count={insights.length}
      footer={
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-slate">
          Calculado de la base · mismas cifras que el chat
        </p>
      }
    >
      {/*
        Dos columnas en cuanto hay ancho. Apilados, cuatro hallazgos se comían
        media pantalla de scroll antes de llegar a los datos.

        El filete de 1px lo dibuja el fondo del contenedor asomando por el
        `gap`, así que las divisiones horizontales y verticales salen del mismo
        sistema. Si el número de hallazgos es impar, el último ocupa la fila
        entera en vez de dejar una celda vacía.
      */}
      <ul className="grid gap-px bg-fog md:grid-cols-2">
        {insights.map((insight, index) => {
          const sev = SEVERIDAD[insight.severity] || SEVERIDAD.info
          const impacto = insight.impact
          const tieneImpacto = impacto !== undefined && impacto !== 0

          return (
            <li
              key={insight.id || index}
              className="bg-white md:[&:nth-child(odd):last-child]:col-span-2"
            >
              <div className={`flex h-full flex-col border-l-2 ${sev.rule} px-5 py-4`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={sev.badge}>{sev.label}</span>
                  <Eyebrow className="text-[0.6875rem]">
                    {TIPO[insight.type] || 'Hallazgo'}
                  </Eyebrow>
                </div>

                <h3 className="mt-2 font-display text-[1rem] font-semibold leading-snug text-ink">
                  {insight.title}
                </h3>

                <p className="mt-1.5 flex-1 text-[0.875rem] leading-relaxed text-graphite">
                  {insight.description}
                </p>

                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  {tieneImpacto ? (
                    <p>
                      <span className="eyebrow mr-2 text-[0.6875rem]">
                        Impacto
                      </span>
                      <span
                        className={`font-display text-[1.125rem] font-semibold tabular-nums ${
                          impacto > 0 ? 'text-verified' : 'text-breach'
                        }`}
                      >
                        {impacto > 0 ? '+' : '−'}
                        {moneda(impacto, insight.currency)}
                      </span>
                    </p>
                  ) : (
                    <span />
                  )}

                  {/* Antes era un botón que solo registraba un log y no
                      llevaba a ningún lado. Ahora abre la pantalla de la que
                      sale la cifra. */}
                  {insight.href ? (
                    <Link
                      to={insight.href}
                      onClick={() => registrarAccion(insight)}
                      className="link inline-flex items-center gap-1.5"
                    >
                      {insight.actionLabel || 'Ver evidencia'}
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Shell>
  )
}
