import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowUpIcon } from '@heroicons/react/24/outline'
import { chatConAgenteSQL } from '../../services/cfoApi'
import BloqueVisual from './BloqueVisual'
import { Eyebrow } from '../ui'

/**
 * Conversación con el agente SQL.
 *
 * Sin cromo propio: el contenedor (cajón lateral o página /asistente) decide el
 * tamaño. La salida del agente lleva filete de cobalto y la de la persona no;
 * esa distinción nunca se pierde. Cada respuesta trae el SQL que produjo sus
 * cifras, a un clic: es la promesa de la marca, cada número con su fuente.
 */

export const SUGERENCIAS = [
  '¿Cuánto efectivo tengo y cuántos días me alcanza?',
  '¿Quiénes me deben más?',
  '¿Qué pagos vencen en los próximos 30 días?',
  '¿Cómo va el margen por país?',
  '¿Qué productos perdieron margen?',
  '¿Qué obligaciones con la SAT están pendientes?',
]

const BIENVENIDA = {
  role: 'assistant',
  bienvenida: true,
  content:
    'Consulto la base de la empresa y respondo con la cifra y su origen. Cada respuesta incluye las consultas que la produjeron.',
}

const ESPERA = [
  'Leyendo el catálogo de datos',
  'Consultando la base',
  'Revisando los resultados',
  'Preparando la respuesta',
]

const CLAVE = 'qora_chat_historial'
const MAXIMO_GUARDADO = 40

function cargar() {
  try {
    const arr = JSON.parse(localStorage.getItem(CLAVE) || 'null')
    return Array.isArray(arr) && arr.length ? arr : [BIENVENIDA]
  } catch {
    return [BIENVENIDA]
  }
}

const hora = () => new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })

// Markdown con la tipografía del sistema. Los títulos del modelo bajan a
// Plex Sans 500: en un mensaje no cabe un segundo display.
const MD = {
  h1: ({ children }) => <p className="mb-2 mt-3 text-[0.9375rem] font-medium text-ink first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mb-2 mt-3 text-[0.9375rem] font-medium text-ink first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mb-1.5 mt-2.5 text-[0.875rem] font-medium text-ink first:mt-0">{children}</p>,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 marker:text-mist">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 marker:text-slate">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-medium text-ink">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-copper-500 pl-3 text-graphite">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-control bg-paper px-1 py-0.5 font-mono text-[0.8125rem]">{children}</code>
  ),
  hr: () => <hr className="my-3" />,
  table: ({ children }) => (
    <div className="table-container my-2">
      <table className="table">{children}</table>
    </div>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-cobalt underline decoration-cobalt-100 underline-offset-2" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
}

function Consultas({ consultas, meta }) {
  const [abierto, setAbierto] = useState(false)
  if (!consultas?.length) return null
  return (
    <div className="mt-3 border-t border-fog pt-2">
      <button
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-slate transition-colors hover:text-ink"
      >
        {abierto ? 'Ocultar' : 'Ver'} {consultas.length === 1 ? 'la consulta' : `las ${consultas.length} consultas`}
        {meta ? ` · ${(meta.ms / 1000).toFixed(1)} s` : ''}
      </button>
      {abierto ? (
        <ol className="mt-2 space-y-2">
          {consultas.map((c) => (
            <li key={c.id}>
              {c.proposito ? <p className="mb-1 text-[0.8125rem] text-graphite">{c.proposito}</p> : null}
              <pre className="overflow-x-auto rounded-control border border-fog bg-paper p-2.5 font-mono text-[0.75rem] leading-relaxed text-graphite">
                {c.sql}
              </pre>
              <p className="mt-1 font-mono text-[0.6875rem] text-slate">
                {c.num_filas} {c.num_filas === 1 ? 'fila' : 'filas'}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}

export default function ChatConversacion({ fullPage = false, autoFocus = false }) {
  const [mensajes, setMensajes] = useState(cargar)
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [espera, setEspera] = useState(0)
  const finRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes, pensando])

  useEffect(() => {
    if (autoFocus) requestAnimationFrame(() => inputRef.current?.focus())
  }, [autoFocus])

  // Se guarda por navegador, sin backend. En modo privado simplemente no persiste.
  useEffect(() => {
    try {
      if (mensajes.length <= 1) localStorage.removeItem(CLAVE)
      else localStorage.setItem(CLAVE, JSON.stringify(mensajes.slice(-MAXIMO_GUARDADO)))
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [mensajes])

  useEffect(() => {
    if (!pensando) {
      setEspera(0)
      return undefined
    }
    const t = setInterval(() => setEspera((i) => Math.min(i + 1, ESPERA.length - 1)), 4000)
    return () => clearInterval(t)
  }, [pensando])

  const enviar = async (directo) => {
    const pregunta = (directo ?? texto).trim()
    if (!pregunta || pensando) return

    setTexto('')
    setMensajes((prev) => [...prev, { role: 'user', content: pregunta, at: hora() }])
    setPensando(true)

    const historial = mensajes
      .filter((m) => !m.bienvenida && !m.error && m.content)
      .slice(-4)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1500) }))

    try {
      const data = await chatConAgenteSQL(pregunta, historial)
      if (!data.success) throw new Error(data.error || 'El agente no devolvió respuesta.')
      const r = data.response
      setMensajes((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: r.content,
          bloques: r.bloques || [],
          consultas: r.consultas || [],
          meta: r.meta,
          at: hora(),
        },
      ])
    } catch (error) {
      const detalle = error.response?.data?.error || error.message
      setMensajes((prev) => [
        ...prev,
        {
          role: 'assistant',
          error: true,
          content:
            error.code === 'ECONNABORTED'
              ? 'La consulta tardó demasiado. Intente con una pregunta más específica.'
              : detalle,
          at: hora(),
        },
      ])
    } finally {
      setPensando(false)
      inputRef.current?.focus()
    }
  }

  const reiniciar = () => {
    setMensajes([BIENVENIDA])
    try {
      localStorage.removeItem(CLAVE)
    } catch {
      /* sin almacenamiento disponible */
    }
  }

  const soloBienvenida = mensajes.length <= 1
  const columna = fullPage ? 'mx-auto w-full max-w-[760px]' : ''

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!soloBienvenida ? (
        <div className="flex shrink-0 justify-end border-b border-fog px-6 py-2">
          <button
            onClick={reiniciar}
            className="text-[0.8125rem] text-slate transition-colors hover:text-ink"
          >
            Nueva conversación
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-6 py-5" aria-live="polite">
        <div className={`space-y-6 ${columna}`}>
          {mensajes.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex flex-col items-end">
                <Eyebrow className="mb-1.5 text-[0.6875rem]">Usted{m.at ? ` · ${m.at}` : ''}</Eyebrow>
                <p className="max-w-[92%] rounded-card bg-paper px-4 py-2.5 text-[0.9375rem] leading-relaxed text-ink">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={i} className={`border-l-2 pl-4 ${m.error ? 'border-breach-500' : 'border-cobalt-500'}`}>
                <Eyebrow className={`mb-1.5 text-[0.6875rem] ${m.error ? 'text-breach' : 'text-cobalt'}`}>
                  {m.error ? 'Sin respuesta' : 'Agente SQL'}
                  {m.at ? ` · ${m.at}` : ''}
                </Eyebrow>
                <div className="text-[0.9375rem] leading-relaxed text-graphite">
                  {m.error ? (
                    <p>{m.content}</p>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
                {m.bloques?.map((b, j) => (
                  <BloqueVisual key={j} bloque={b} />
                ))}
                <Consultas consultas={m.consultas} meta={m.meta} />
              </div>
            )
          )}

          {pensando ? (
            <div className="border-l-2 border-cobalt-500 pl-4" role="status">
              <Eyebrow className="mb-2 text-[0.6875rem] text-cobalt">
                Agente SQL · {ESPERA[espera]}
              </Eyebrow>
              <div className="space-y-2">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-4/5" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ) : null}
          <div ref={finRef} />
        </div>
      </div>

      {soloBienvenida ? (
        <div className="shrink-0 border-t border-fog px-6 py-4">
          <div className={columna}>
            <Eyebrow className="mb-3 text-[0.6875rem]">Para empezar</Eyebrow>
            <ul className={fullPage ? 'grid gap-x-6 gap-y-1.5 sm:grid-cols-2' : 'space-y-1.5'}>
              {SUGERENCIAS.slice(0, fullPage ? 6 : 4).map((s) => (
                <li key={s}>
                  <button
                    onClick={() => enviar(s)}
                    disabled={pensando}
                    className="w-full text-left text-[0.875rem] leading-snug text-slate transition-colors hover:text-ink disabled:opacity-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          enviar()
        }}
        className="shrink-0 border-t border-fog px-6 py-4"
      >
        <div className={`flex items-end gap-2 ${columna}`}>
          <label htmlFor="pregunta-agente" className="sr-only">
            Pregunta para el agente
          </label>
          <input
            id="pregunta-agente"
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="¿Qué cliente tiene la cartera más vencida?"
            disabled={pensando}
            autoComplete="off"
            className="input"
          />
          <button
            type="submit"
            disabled={pensando || !texto.trim()}
            aria-label="Enviar pregunta"
            className="btn-agent shrink-0 px-3 py-[9px]"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
