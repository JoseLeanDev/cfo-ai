import ChatConversacion from '../components/agents/ChatConversacion'
import { Eyebrow } from '../components/ui'

/**
 * Asistente a pantalla completa.
 *
 * La misma conversación del cajón lateral, con más ancho para tablas y
 * gráficas. Ocupa el alto disponible bajo la barra superior para que la caja
 * de pregunta quede siempre a la vista.
 */
export default function Asistente() {
  return (
    <div className="-mb-8 flex h-[calc(100vh-3.5rem-2rem)] min-h-[520px] flex-col">
      <header className="mb-6 shrink-0">
        <Eyebrow className="mb-2">Inteligencia</Eyebrow>
        <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          Asistente
        </h1>
        <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">
          Pregunte en los términos del negocio. El agente consulta la base, se
          corrige si una consulta falla, y cada respuesta incluye el SQL que la
          produjo.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden rounded-card border border-fog bg-white">
        <ChatConversacion fullPage autoFocus />
      </div>
    </div>
  )
}
