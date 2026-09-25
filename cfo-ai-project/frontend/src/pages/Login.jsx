import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { QoraWordmark } from '../components/brand/QoraLogo'
import { Eyebrow } from '../components/ui'

/**
 * Acceso.
 *
 * Dos planos: tinta a la izquierda con la posición de la marca, papel a la
 * derecha con el formulario. En pantallas estrechas queda solo el formulario,
 * con el wordmark arriba.
 */
export default function Login() {
  const [email, setEmail] = useState('demo@cfoai.com')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-2">
      {/* Plano de tinta */}
      <aside className="hidden flex-col justify-between bg-ink px-12 py-12 lg:flex">
        <QoraWordmark className="h-6 w-auto text-white" />

        <div>
          <p className="font-display max-w-[14ch] text-[3rem] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
            Intelligence, on the record.
          </p>
          <p className="measure mt-6 text-[0.9375rem] leading-relaxed text-mist">
            Los agentes leen los sistemas de registro de la empresa, informan
            qué cambió y sostienen cada cifra con su fuente.
          </p>
        </div>

        <dl className="grid grid-cols-4 gap-px border-t border-white/10 pt-6">
          {[
            ['01', 'Caja'],
            ['02', 'Análisis'],
            ['03', 'Cobranza'],
            ['04', 'Cierre'],
          ].map(([n, label]) => (
            <div key={n}>
              <dt className="eyebrow text-[0.6875rem] text-white/40">{n}</dt>
              <dd className="mt-1 text-[0.875rem] text-white">{label}</dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Plano de papel */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <QoraWordmark className="mb-12 h-5 w-auto text-ink lg:hidden" />

          <Eyebrow className="mb-2">Acceso</Eyebrow>
          <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-[0.9375rem] text-slate">
            Use las credenciales de su instancia.
          </p>

          {error ? (
            <div
              role="alert"
              className="mt-6 border-l-2 border-breach bg-breach-50 px-4 py-3 text-[0.875rem] text-breach"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                Correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="nombre@empresa.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 border-t border-fog pt-5">
            <Eyebrow className="mb-2 text-[0.6875rem]">Credenciales de demostración</Eyebrow>
            <dl className="space-y-1 font-mono text-[0.8125rem] text-graphite">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-slate">correo</dt>
                <dd>demo@cfoai.com</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-slate">clave</dt>
                <dd>demo123</dd>
              </div>
            </dl>
          </div>

          <p className="eyebrow mt-12 text-[0.6875rem]">
            Qora · Versión de demostración
          </p>
        </div>
      </main>
    </div>
  )
}
