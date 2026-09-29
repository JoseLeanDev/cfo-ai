import { Eyebrow } from '../ui'

/**
 * Hallazgo del analista.
 *
 * Filete de color a la izquierda según severidad, estado en mono mayúsculas,
 * cifra en Archivo 600 tabular. La recomendación la escribe el agente, así que
 * lleva el filete de cobalto que el sistema reserva para lo que produce un
 * agente.
 *
 * Props: insight { type, title, description, action, impact, change, currency,
 * severity, category }, onDismiss.
 */

const SEVERIDAD = {
  critical: { label: 'Crítico', badge: 'badge-danger', rule: 'border-l-breach-500' },
  warning: { label: 'Revisar', badge: 'badge-warning', rule: 'border-l-copper-500' },
  info: { label: 'Observación', badge: 'badge-info', rule: 'border-l-cobalt-500' },
}

const TIPO = {
  gasto: 'Costo',
  ingreso: 'Ingreso',
  alerta: 'Riesgo',
  oportunidad: 'Oportunidad',
}

export default function InsightCard({ insight, onDismiss }) {
  const { type, title, description, action, impact, change, currency = 'GTQ', severity = 'info' } = insight
  const sev = SEVERIDAD[severity] || SEVERIDAD.info

  const moneda = (valor) =>
    new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(valor))

  const tieneImpacto = impact != null && Number(impact) !== 0
  const tieneVariacion = change != null && !Number.isNaN(Number(change))

  return (
    <article className={`flex h-full flex-col rounded-card border border-l-2 border-fog bg-white p-5 ${sev.rule}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={sev.badge}>{sev.label}</span>
        <Eyebrow className="text-[0.6875rem]">{TIPO[type] || 'Hallazgo'}</Eyebrow>
      </div>

      <h3 className="mt-3 font-display text-[1rem] font-semibold leading-snug text-ink">{title}</h3>

      {description ? (
        <p className="mt-2 text-[0.875rem] leading-relaxed text-graphite">{description}</p>
      ) : null}

      {action ? (
        <div className="mt-4 border-l-2 border-cobalt-500 bg-paper px-3 py-2.5">
          <Eyebrow className="text-[0.6875rem] text-cobalt">Recomendación</Eyebrow>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-ink">{action}</p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-4">
        {tieneImpacto ? (
          <div className="flex items-baseline gap-2">
            <span className="eyebrow text-[0.6875rem]">Impacto</span>
            <span
              className={`font-display text-[1.125rem] font-semibold tabular-nums ${
                impact > 0 ? 'text-verified' : 'text-breach'
              }`}
            >
              {impact > 0 ? '+' : '−'}
              {moneda(impact)}
            </span>
          </div>
        ) : null}

        {tieneVariacion ? (
          <div className="flex items-baseline gap-2">
            <span className="eyebrow text-[0.6875rem]">Variación</span>
            <span
              className={`font-mono text-[0.8125rem] tabular-nums ${
                change > 0 ? 'text-verified' : change < 0 ? 'text-breach' : 'text-slate'
              }`}
            >
              {change > 0 ? '+' : change < 0 ? '−' : ''}
              {Math.abs(Number(change)).toFixed(1)}%
            </span>
          </div>
        ) : null}

        {onDismiss ? (
          <button
            onClick={() => onDismiss(insight)}
            className="ml-auto text-[0.8125rem] text-slate transition-colors hover:text-ink"
          >
            Descartar
          </button>
        ) : null}
      </div>
    </article>
  )
}
