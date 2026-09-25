import { Component } from 'react'
import { Eyebrow, Skeleton } from './index'

/**
 * Estados de carga, error y procedencia.
 *
 * El diseño anterior no tenía ninguno: una consulta fallida dejaba un spinner
 * indefinido o, peor, mostraba datos de ejemplo sin decirlo. Para una marca que
 * promete cada cifra con su fuente, presentar un dato sustituto como si fuera
 * el real es el fallo más grave posible.
 */

/** Carga con la forma del resultado: el lector sabe qué va a aparecer. */
export function PageLoading({ label = 'Consultando las fuentes', rows = 4 }) {
  return (
    <div className="space-y-8" role="status" aria-live="polite">
      <div>
        <Eyebrow>{label}</Eyebrow>
        <Skeleton className="mt-3 h-9 w-full max-w-80" />
        <Skeleton className="mt-3 h-4 w-full max-w-[28rem]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-fog bg-white p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-card border border-fog bg-white">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-6 border-b border-fog px-6 py-4 last:border-b-0">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Error de consulta. Dice qué falló y qué se puede hacer, sin pedir disculpas
 * ni esconder el detalle técnico, que es lo único accionable para soporte.
 */
export function ErrorState({ title = 'No se pudo leer la fuente', error, onRetry }) {
  const detalle =
    error?.response?.status
      ? `HTTP ${error.response.status} · ${error.config?.url ?? 'endpoint desconocido'}`
      : error?.message

  return (
    <div className="border-l-2 border-breach bg-white px-6 py-5" role="alert">
      <Eyebrow className="text-breach">Consulta fallida</Eyebrow>
      <h2 className="mt-2 font-display text-[1.125rem] font-semibold text-ink">{title}</h2>
      <p className="measure mt-1.5 text-[0.875rem] leading-relaxed text-graphite">
        La pantalla no puede mostrar cifras verificadas mientras la fuente no
        responda. No se sustituyen por estimaciones.
      </p>
      {detalle ? (
        <p className="mt-3 font-mono text-[0.75rem] text-slate">{detalle}</p>
      ) : null}
      {onRetry ? (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-4">
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

/**
 * Aviso de procedencia. Se usa cuando la pantalla cae a datos de muestra
 * porque la fuente no respondió: el lector tiene que saber que lo que ve no
 * viene del sistema de registro.
 */
export function FallbackNotice({ fuente = 'la fuente' }) {
  return (
    <div className="border-l-2 border-copper bg-copper-50 px-4 py-3">
      <Eyebrow className="text-[0.6875rem] text-copper">Datos de muestra</Eyebrow>
      <p className="measure mt-1 text-[0.875rem] leading-relaxed text-graphite">
        {fuente} no respondió. Lo que aparece abajo es un juego de datos de
        demostración y no debe usarse para decidir.
      </p>
    </div>
  )
}

/**
 * Frontera de error. Sin ella, una excepción en cualquier página deja la
 * aplicación entera en blanco, sin rastro para el usuario.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Qora] Error no controlado:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="mx-auto max-w-measure px-6 py-18">
        <Eyebrow className="text-breach">Error de la aplicación</Eyebrow>
        <h1 className="mt-2 font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          Esta pantalla se detuvo
        </h1>
        <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-slate">
          El resto de la aplicación sigue disponible. Si se repite, comparta el
          detalle de abajo con soporte.
        </p>
        <pre className="mt-6 overflow-x-auto border border-fog bg-white p-4 font-mono text-[0.75rem] text-graphite">
          {this.state.error.message}
        </pre>
        <div className="mt-6 flex gap-2">
          <button onClick={() => this.setState({ error: null })} className="btn-secondary">
            Reintentar
          </button>
          <a href="/" className="btn-primary">
            Volver al resumen
          </a>
        </div>
      </div>
    )
  }
}
