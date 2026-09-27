/**
 * Primitivas de interfaz Qora.
 *
 * Un solo lugar donde viven las decisiones del sistema: eyebrow en mono,
 * cifras en Archivo 600 o mono tabular, pill solo para estado, sombra solo en
 * superposiciones. Las páginas componen con esto en lugar de repetir clases.
 */

import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'

export const cn = (...parts) => twMerge(clsx(parts))

/* -------------------------------------------------------------------------- */
/* Texto */
/* -------------------------------------------------------------------------- */

export function Eyebrow({ as: Tag = 'p', className, children, ...props }) {
  return (
    <Tag className={cn('eyebrow', className)} {...props}>
      {children}
    </Tag>
  )
}

/**
 * Título de página. Un solo display por vista: el resto de la pantalla baja a
 * H2/H3 para que la jerarquía venga del espacio y no del tamaño.
 */
export function PageTitle({ eyebrow, title, description, actions, meta }) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
          <h1 className="font-display text-[2.125rem] leading-[1.15] font-semibold text-ink">
            {title}
          </h1>
          {description ? (
            <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {meta ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-fog pt-3">
          {meta}
        </div>
      ) : null}
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Superficies */
/* -------------------------------------------------------------------------- */

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cn('card', className)} {...props}>
      {children}
    </Tag>
  )
}

/**
 * Encabezado de tarjeta: eyebrow a la izquierda, utilidades a la derecha,
 * filete de cierre. Sustituye al patrón `.section-header` con icono de color.
 */
export function CardHeader({ title, eyebrow, aside, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline justify-between gap-3 border-b border-fog px-6 py-4',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-1">{eyebrow}</Eyebrow> : null}
        <h2 className="font-display text-[1.125rem] font-semibold leading-tight text-ink">
          {title}
        </h2>
      </div>
      {aside ? (
        <div className="flex shrink-0 items-center gap-3">{aside}</div>
      ) : null}
    </div>
  )
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Cifras */
/* -------------------------------------------------------------------------- */

/**
 * Tarjeta de indicador.
 *
 * `tone="ink"` invierte la tarjeta: se usa como máximo una vez por fila, para
 * la cifra que resume todo lo demás. `delta` se escribe como texto legible
 * ("240 pb bajo plan"), no como un porcentaje sin referencia.
 */
export function Stat({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  note,
  tone = 'paper',
  className,
  children,
}) {
  const ink = tone === 'ink'
  return (
    <div
      className={cn(
        'rounded-card border p-5',
        ink ? 'border-ink bg-ink text-white' : 'border-fog bg-white',
        className
      )}
    >
      <p
        className={cn(
          'font-mono text-[0.75rem] uppercase leading-tight tracking-[0.12em]',
          ink ? 'text-mist' : 'text-slate'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
                    // La cifra cede tamaño antes que partirse en dos renglones cuando la
          // tarjeta es estrecha, pero nunca baja del mínimo legible.
          'mt-2 font-display text-[clamp(1.625rem,2.4vw,2rem)] font-semibold leading-none tracking-[-0.02em] tabular-nums',
          ink ? 'text-white' : 'text-ink'
        )}
      >
        {value}
      </p>
      {delta ? (
        <p
          className={cn(
            'mt-2 font-mono text-[0.75rem] tabular-nums',
            // Sobre tinta se usan las variantes claras: el verde y el rojo de
            // texto quedan por debajo de 3:1 sobre fondo oscuro.
            deltaTone === 'up' && (ink ? 'text-verified-300' : 'text-verified'),
            deltaTone === 'down' && (ink ? 'text-breach-300' : 'text-breach'),
            deltaTone === 'agent' && (ink ? 'text-cobalt-300' : 'text-cobalt'),
            deltaTone === 'neutral' && (ink ? 'text-mist' : 'text-slate')
          )}
        >
          {delta}
        </p>
      ) : null}
      {note ? (
        <p
          className={cn(
            'mt-1 text-[0.8125rem] leading-snug',
            ink ? 'text-mist' : 'text-slate'
          )}
        >
          {note}
        </p>
      ) : null}
      {children}
    </div>
  )
}

/** Cifra en línea: mono tabular, no se parte nunca en dos renglones. */
export function Amount({ value, tone = 'default', className }) {
  return (
    <span
      className={cn(
        'amount',
        tone === 'positive' && 'text-verified',
        tone === 'negative' && 'text-breach',
        className
      )}
    >
      {value}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Estado */
/* -------------------------------------------------------------------------- */

const BADGE_TONES = {
  verified: 'badge-success',
  review: 'badge-warning',
  breach: 'badge-danger',
  agent: 'badge-info',
  neutral: 'badge-neutral',
}

export function Badge({ tone = 'neutral', className, children, ...props }) {
  return (
    <span className={cn(BADGE_TONES[tone] ?? BADGE_TONES.neutral, className)} {...props}>
      {children}
    </span>
  )
}

export function StatusDot({ tone = 'neutral', className }) {
  return (
    <span
      className={cn(
        'status-dot',
        tone === 'verified' && 'online',
        tone === 'review' && 'warning',
        tone === 'breach' && 'error',
        tone === 'agent' && 'agent',
        className
      )}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Acciones */
/* -------------------------------------------------------------------------- */

const BUTTON_VARIANTS = {
  primary: 'btn-primary',
  agent: 'btn-agent',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
}

export const Button = forwardRef(function Button(
  { variant = 'secondary', size, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.secondary,
        size === 'sm' && 'btn-sm',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})

/** Enlace de evidencia: mono en cobalto con filete, siempre con flecha. */
export function EvidenceLink({ as: Tag = 'button', className, children, ...props }) {
  return (
    <Tag className={cn('link inline-flex items-center gap-1.5', className)} {...props}>
      {children}
      <span aria-hidden="true">→</span>
    </Tag>
  )
}

/* -------------------------------------------------------------------------- */
/* Navegación interna */
/* -------------------------------------------------------------------------- */

/**
 * Pestañas. Subrayado de tinta sobre filete continuo: el mismo lenguaje que
 * el estado activo de la navegación lateral.
 */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('flex gap-6 overflow-x-auto border-b border-fog', className)} role="tablist">
      {tabs.map((tab) => {
        const id = tab.id ?? tab.value
        const active = id === value
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-[0.875rem] transition-colors',
              active
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-slate hover:text-ink'
            )}
          >
            {tab.icon ? <tab.icon className="h-4 w-4" /> : null}
            {tab.label ?? tab.name}
            {tab.count != null ? (
              <span className="font-mono text-[0.6875rem] tabular-nums text-slate">
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Vacío y carga */
/* -------------------------------------------------------------------------- */

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon ? (
        <span className="empty-state-icon">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <p className="font-display text-[1rem] font-semibold text-ink">{title}</p>
      {description ? (
        <p className="measure mt-1 text-[0.875rem] text-slate">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

/** Esqueleto con la forma de una fila de indicadores, para evitar el salto. */
export function StatSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border border-fog bg-white p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="table-container">
      <div className="border-b border-fog px-4 py-3">
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-fog px-4 py-3 last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-48' : 'w-20')} />
          ))}
        </div>
      ))}
    </div>
  )
}
