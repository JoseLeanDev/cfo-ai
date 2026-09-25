import { Eyebrow } from '../ui'

/**
 * Hallazgo suelto.
 *
 * Se usa fuera de `PageInsights`, cuando un agente aporta una sola
 * observación dentro de otra pantalla. Mantiene la misma gramática: filete de
 * color a la izquierda según severidad, estado en mono mayúsculas, cifra en
 * Archivo 600 tabular.
 *
 * Props: insight { id, type, title, description, impact, change, currency,
 * severity, isNew }, onView, onDismiss, compact.
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

export default function InsightCard({ insight, onView, onDismiss, compact = true }) {
  const {
    type,
    title,
    description,
    impact,
    change,
    currency = 'GTQ',
    severity = 'info',
    isNew = false,
  } = insight

  const sev = SEVERIDAD[severity] || SEVERIDAD.info

  const moneda = (valor) =>
    new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(valor))

  const tieneImpacto = impact !== undefined && impact !== 0
  const tieneVariacion = change !== undefined && change !== null

  return (
    <article
      onClick={compact ? () => onView?.(insight) : undefined}
      className={`rounded-card border border-fog border-l-2 bg-white ${sev.rule} ${
        compact ? 'cursor-pointer transition-colors hover:border-r-mist' : ''
      } p-4`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={sev.badge}>{sev.label}</span>
        <Eyebrow className="text-[0.6875rem]">{TIPO[type] || 'Hallazgo'}</Eyebrow>
        {isNew ? (
          <Eyebrow className="ml-auto text-[0.6875rem] text-cobalt">Nuevo</Eyebrow>
        ) : null}
      </div>

      <h4 className="mt-2 font-display text-[0.9375rem] font-semibold leading-snug text-ink">
        {title}
      </h4>

      {description ? (
        <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-graphite">
          {description}
        </p>
      ) : null}

      {tieneImpacto || tieneVariacion ? (
        <dl className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          {tieneImpacto ? (
            <div className="flex items-baseline gap-2">
              <dt className="eyebrow text-[0.6875rem]">Impacto</dt>
              <dd
                className={`font-display text-[1.125rem] font-semibold tabular-nums ${
                  impact > 0 ? 'text-verified' : 'text-breach'
                }`}
              >
                {impact > 0 ? '+' : '−'}
                {moneda(impact)}
              </dd>
            </div>
          ) : null}

          {tieneVariacion ? (
            <div className="flex items-baseline gap-2">
              <dt className="eyebrow text-[0.6875rem]">Variación</dt>
              <dd
                className={`font-mono text-[0.8125rem] tabular-nums ${
                  change > 0 ? 'text-verified' : change < 0 ? 'text-breach' : 'text-slate'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change}%
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {!compact ? (
        <div className="mt-4 flex items-center gap-4 border-t border-fog pt-3">
          <button onClick={() => onView?.(insight)} className="link">
            Ver evidencia →
          </button>
          {onDismiss ? (
            <button
              onClick={() => onDismiss(insight)}
              className="ml-auto text-[0.8125rem] text-slate transition-colors hover:text-ink"
            >
              Descartar
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
