import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { QoraMark } from '../brand/QoraLogo'
import ChatConversacion from './ChatConversacion'

/**
 * Cajón lateral del agente.
 *
 * Se abre desde la barra superior o desde ⌘K sin salir de la pantalla en que
 * se está, y devuelve el ancho al contenido en cuanto se cierra. La
 * conversación es la misma de /asistente: comparten el historial.
 */
export default function AgentPanel({ open, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Agente SQL"
        className="relative flex h-full w-full max-w-[520px] flex-col border-l border-fog bg-white shadow-overlay"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-fog px-6 py-4">
          <QoraMark className="h-4 w-4 shrink-0 text-ink" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[1rem] font-semibold leading-tight text-ink">
              Preguntar a un agente
            </h2>
            <p className="truncate text-[0.8125rem] text-slate">Cada cifra vuelve con su consulta</p>
          </div>
          <Link
            to="/asistente"
            onClick={onClose}
            aria-label="Abrir en pantalla completa"
            title="Abrir en pantalla completa"
            className="shrink-0 rounded-control p-1.5 text-slate hover:bg-paper hover:text-ink"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </Link>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            className="shrink-0 rounded-control p-1.5 text-slate hover:bg-paper hover:text-ink"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1">
          <ChatConversacion autoFocus />
        </div>
      </aside>
    </div>
  )
}
