import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useInsightsIA } from '../hooks/useCfoData'
import { endpoints } from '../services/cfoApi'
import InsightCard from '../components/agents/InsightCard'
import { PageTitle, Eyebrow, EmptyState, Skeleton, cn } from '../components/ui'
import { ErrorState } from '../components/ui/states'

/**
 * Insights de IA.
 *
 * Lo que el agente de análisis encontró en su última corrida, agrupado por
 * área. Cada dos días a las 6:00 recorre sus playbooks (caja, cartera, ventas,
 * márgenes) consultando la base con SQL y deja aquí de 3 a 4 hallazgos por
 * área. No son los hallazgos calculados que aparecen arriba de cada pantalla:
 * esos salen de reglas fijas; estos los redacta el agente.
 */

const fechaHora = (f) =>
  f
    ? new Date(f).toLocaleString('es-GT', {
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Guatemala',
      })
    : null

const CONTEO = [
  ['critical', 'críticos', 'bg-breach-500'],
  ['warning', 'por revisar', 'bg-copper-500'],
  ['info', 'observaciones', 'bg-cobalt-500'],
]

function Cargando() {
  return (
    <div className="space-y-10">
      {[0, 1].map((s) => (
        <div key={s}>
          <Skeleton className="h-4 w-48" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[0, 1].map((c) => (
              <div key={c} className="rounded-card border border-fog bg-white p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-5 w-4/5" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-5/6" />
                <Skeleton className="mt-5 h-14 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function InsightsIA() {
  const { data, isLoading, isError, error, refetch, isFetching } = useInsightsIA()
  const [descartando, setDescartando] = useState(null)
  const d = data?.data

  const porArea = useMemo(() => {
    const grupos = {}
    for (const ins of d?.insights || []) (grupos[ins.area] = grupos[ins.area] || []).push(ins)
    return grupos
  }, [d])

  const conteos = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 }
    for (const ins of d?.insights || []) c[ins.severity] = (c[ins.severity] || 0) + 1
    return c
  }, [d])

  const descartar = async (insight) => {
    setDescartando(insight.id)
    try {
      await endpoints.analisis.dismissInsight(insight.id)
      await refetch()
    } finally {
      setDescartando(null)
    }
  }

  if (isError) {
    return <ErrorState title="No se pudieron leer los insights" error={error} onRetry={refetch} />
  }

  const areas = d?.areas || []
  const total = d?.insights?.length || 0
  const conHallazgos = areas.filter((a) => porArea[a.slug]?.length)
  const sinHallazgos = areas.filter((a) => !porArea[a.slug]?.length)

  return (
    <div className="space-y-10">
      <PageTitle
        eyebrow="Inteligencia"
        title="Insights de IA"
        description="El agente de análisis revisa el negocio por área cada dos días y deja aquí lo que encontró. Cada cifra sale de una consulta a la base."
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="btn-ghost btn-sm inline-flex items-center gap-1.5"
              disabled={isFetching}
            >
              <ArrowPathIcon className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              Actualizar
            </button>
            <Link to="/asistente" className="btn-secondary btn-sm">
              Preguntar a un agente
            </Link>
          </>
        }
        meta={
          d ? (
            <>
              <span className="text-[0.8125rem] text-slate">
                {d.ultima_corrida ? (
                  <>
                    Última corrida: <span className="text-ink">{fechaHora(d.ultima_corrida)}</span>
                  </>
                ) : (
                  'Aún no hay corridas'
                )}
              </span>
              {total
                ? CONTEO.filter(([k]) => conteos[k]).map(([k, texto, punto]) => (
                    <span key={k} className="inline-flex items-center gap-2 text-[0.8125rem] text-slate">
                      <span className={cn('h-1.5 w-1.5 rounded-pill', punto)} aria-hidden="true" />
                      <span className="font-mono tabular-nums text-ink">{conteos[k]}</span> {texto}
                    </span>
                  ))
                : null}
            </>
          ) : null
        }
      />

      {isLoading || !d ? (
        <Cargando />
      ) : total === 0 ? (
        <EmptyState
          icon={SparklesIcon}
          title="Todavía no hay insights"
          description="El agente de análisis corre cada dos días a las 6:00 y revisa caja, cartera, ventas y márgenes. Sus hallazgos aparecen aquí al terminar la primera corrida."
          action={
            <Link to="/asistente" className="btn-secondary btn-sm">
              Mientras tanto, preguntar a un agente
            </Link>
          }
        />
      ) : (
        <>
          {conHallazgos.map((area, i) => {
            const items = porArea[area.slug]
            return (
              <section key={area.slug} aria-labelledby={`area-${area.slug}`}>
                <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-fog pb-3">
                  <div className="min-w-0">
                    <Eyebrow className="mb-1">{String(i + 1).padStart(2, '0')}</Eyebrow>
                    <h2
                      id={`area-${area.slug}`}
                      className="font-display text-[1.25rem] font-semibold leading-tight text-ink"
                    >
                      {area.nombre}
                    </h2>
                    {area.descripcion ? (
                      <p className="mt-1 text-[0.875rem] text-slate">{area.descripcion}</p>
                    ) : null}
                  </div>
                  <span className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-slate">
                    {items.length} {items.length === 1 ? 'hallazgo' : 'hallazgos'}
                  </span>
                </header>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((ins) => (
                    <div key={ins.id} className={cn('min-w-0', descartando === ins.id && 'opacity-50')}>
                      <InsightCard insight={ins} onDismiss={descartar} />
                    </div>
                  ))}
                </div>
              </section>
            )
          })}

          {sinHallazgos.length ? (
            <p className="border-t border-fog pt-4 text-[0.8125rem] text-slate">
              Sin hallazgos vigentes en: {sinHallazgos.map((a) => a.nombre).join(', ')}.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
