import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { allDestinations } from '../../config/navigation'
import { Eyebrow } from '../ui'

/**
 * Paleta de comandos (⌘K / Ctrl+K).
 *
 * El sistema tiene 21 pantallas; navegar por la barra lateral obliga a
 * recordar en qué sección vive cada una. Escribir el nombre es más rápido y no
 * exige conocer la taxonomía.
 */
export default function CommandPalette({ open, onClose, isAdmin, onBriefAgent }) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const commands = useMemo(() => {
    const destinations = allDestinations
      .filter((d) => !d.adminOnly || isAdmin)
      .map((d) => ({
        id: d.href,
        label: d.name,
        hint: d.parent ? `${d.group} · ${d.parent.name}` : d.group ?? 'General',
        icon: d.icon,
        run: () => navigate(d.href),
      }))

    return [
      {
        id: 'brief-agent',
        label: 'Instruir a un agente',
        hint: 'Acción',
        kind: 'action',
        run: onBriefAgent,
      },
      ...destinations,
    ]
  }, [isAdmin, navigate, onBriefAgent])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands.slice(0, 9)
    return commands
      .filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q))
      .slice(0, 9)
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      // El input se monta con el diálogo; se enfoca en el siguiente frame.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  if (!open) return null

  const runAt = (index) => {
    const command = results[index]
    if (!command) return
    onClose()
    command.run?.()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((c) => (c + 1) % Math.max(results.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((c) => (c - 1 + results.length) % Math.max(results.length, 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runAt(cursor)
    } else if (event.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="fixed inset-0 bg-ink/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
        className="relative w-full max-w-xl rounded-card border border-fog bg-white shadow-overlay"
      >
        <div className="flex items-center gap-3 border-b border-fog px-4">
          <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-slate" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar una pantalla o una acción"
            className="w-full bg-transparent py-4 text-[0.9375rem] text-ink outline-none placeholder:text-slate"
          />
          <kbd className="shrink-0 rounded-control border border-fog px-1.5 py-0.5 font-mono text-[0.6875rem] text-slate">
            ESC
          </kbd>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-[0.875rem] text-slate">
            Sin coincidencias para “{query}”.
          </p>
        ) : (
          <ul className="max-h-[52vh] overflow-y-auto py-2">
            {results.map((command, index) => (
              <li key={command.id}>
                <button
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => runAt(index)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === cursor ? 'bg-paper' : ''
                  }`}
                >
                  {command.icon ? (
                    <command.icon className="h-4 w-4 shrink-0 text-slate" />
                  ) : (
                    <span className="status-dot agent shrink-0" />
                  )}
                  <span
                    className={`flex-1 truncate text-[0.875rem] ${
                      command.kind === 'action' ? 'text-cobalt' : 'text-ink'
                    }`}
                  >
                    {command.label}
                  </span>
                  <Eyebrow className="shrink-0 text-[0.6875rem]">{command.hint}</Eyebrow>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
