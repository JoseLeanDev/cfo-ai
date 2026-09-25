import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTesoreriaProyeccion } from '../hooks/useCfoData'
import { UMBRAL_SALDO_CRITICO } from '../config/constants'
import { PageLoading } from '../components/ui/states'
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

export default function ProyeccionesFinancieras() {
  const [semanas, setSemanas] = useState(13)
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const { data: proyeccion, isLoading } = useTesoreriaProyeccion(semanas)

  const proyeccionData = proyeccion?.data || {}
  const datos = proyeccionData.proyeccion || []
  const resumen = proyeccionData.resumen || {}

  if (isLoading) return <PageLoading label="Proyectando flujo de caja" />

  const saldoInicial = datos[0]?.saldo_acumulado || 0
  const saldoFinal = datos[datos.length - 1]?.saldo_acumulado || 0
  const variacion = saldoInicial > 0 ? ((saldoFinal - saldoInicial) / saldoInicial * 100).toFixed(1) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/tesoreria" 
                        aria-label="Volver"
className="w-10 h-10 rounded-card bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Proyecciones Financieras</h1>
              <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">Análisis de flujo de caja a {semanas} semanas</p>
            </div>
          </div>
        </div>

        <div className="flex max-w-full gap-2 overflow-x-auto">
          {[4, 8, 13, 26].map(n => (
            <button
              key={n}
              onClick={() => setSemanas(n)}
              className={`px-4 py-2 rounded-card font-medium text-sm ${
                semanas === n 
                  ? 'bg-ink text-white' 
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {n} sem
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <span className="kpi-label">Saldo Inicial</span>
          <p className="kpi-value">Q{saldoInicial.toLocaleString()}</p>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Saldo Final</span>
            <span className={`text-sm font-medium ${parseFloat(variacion) >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {parseFloat(variacion) >= 0 ? '+' : ''}{variacion}%
            </span>
          </div>
          <p className="kpi-value">Q{saldoFinal.toLocaleString()}</p>
        </div>

        <div className="kpi-card card-hover">
          <span className="kpi-label">Saldo Mínimo</span>
          <p className="kpi-value">
            Q{(resumen.saldo_minimo_proyectado || 0).toLocaleString()}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Semana {resumen.semana_critica || '—'}</p>
        </div>

        <div className="kpi-card card-hover">
          <span className="kpi-label">Riesgo</span>
          <div className="mt-1">
            {resumen.riesgo_quiebra_tecnica ? (
              <span className="inline-flex items-center gap-1 text-[var(--danger)] font-semibold">
                <ExclamationTriangleIcon className="w-5 h-5" /> Alto
              </span>
            ) : (
              <span className="text-[var(--success)] font-semibold">✓ Bajo</span>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Evolución del Saldo</h2>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cobalt"></span> Alta certeza
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cobalt"></span> Media/Baja
            </span>
          </div>
        </div>

        <div className="relative h-64 [overflow-x:clip]">
          <div className="absolute inset-0 flex items-end">
            {datos.map((d, i) => {
              const max = Math.max(...datos.map(x => x.saldo_acumulado))
              const min = Math.min(...datos.map(x => x.saldo_acumulado))
              const range = max - min || 1
              const height = ((d.saldo_acumulado - min) / range) * 80 + 10
              const isCrit = d.saldo_acumulado < UMBRAL_SALDO_CRITICO

              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-ink text-white text-xs py-2 px-3 rounded-card opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div className="font-semibold mb-1">Semana {d.semana}</div>
                    <div>Saldo: Q{d.saldo_acumulado.toLocaleString()}</div>
                    <div className={d.neto >= 0 ? 'text-verified-300' : 'text-breach-300'}>
                      Neto: {d.neto >= 0 ? '+' : ''}Q{d.neto.toLocaleString()}
                    </div>
                  </div>

                  <div 
                    className={`w-full mx-0.5 rounded-card transition-all ${
                      isCrit 
                        ? 'bg-breach' 
                        : d.certeza === 'alta' 
                          ? 'bg-cobalt' 
                          : 'bg-cobalt'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-between mt-2 px-2">
          <span className="text-xs text-[var(--text-muted)]">S1</span>
          <span className="text-xs text-[var(--text-muted)]">S{Math.ceil(datos.length / 2)}</span>
          <span className="text-xs text-[var(--text-muted)]">S{datos.length}</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <h2 className="font-semibold">Detalle Semanal</h2>
          <button
            onClick={() => setMostrarTodos(!mostrarTodos)}
            className="text-sm text-[var(--accent-blue)] hover:underline flex items-center gap-1"
          >
            {mostrarTodos ? (<><ChevronUpIcon className="w-4 h-4" /> Mostrar menos</>) : (
              <><ChevronDownIcon className="w-4 h-4" /> Ver todas ({datos.length})</>
            )}
          </button>
        </div>

        <div className="divide-y divide-[var(--border-default)]">
          {(mostrarTodos ? datos : datos.slice(0, 5)).map((semana, i) => (
            <div 
              key={i} 
              className={`p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)] ${
                semana.saldo_acumulado < 1000000 ? 'bg-breach-50' : ''
              }`}
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-card bg-[var(--bg-secondary)] flex items-center justify-center font-semibold">
                  {semana.semana}
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{semana.fecha_inicio}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                    semana.certeza === 'alta' 
                      ? 'badge-success' 
                      : semana.certeza === 'media'
                        ? 'badge-warning'
                        : 'badge'
                  }`}>
                    {semana.certeza}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Entradas</p>
                  <p className="font-medium text-[var(--success)]">+{semana.entradas.toLocaleString()}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Salidas</p>
                  <p className="font-medium text-[var(--danger)]">-{semana.salidas.toLocaleString()}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Neto</p>
                  <p className={`font-semibold ${semana.neto >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {semana.neto >= 0 ? '+' : ''}{semana.neto.toLocaleString()}
                  </p>
                </div>

                <div className="text-right w-32">
                  <p className="text-xs text-[var(--text-muted)]">Saldo</p>
                  <p className={`text-xl font-semibold ${semana.saldo_acumulado < UMBRAL_SALDO_CRITICO ? 'text-[var(--danger)]' : ''}`}>
                    Q{semana.saldo_acumulado.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-copper-50 border border-copper-100 rounded-card p-6">
        <h3 className="font-semibold text-copper mb-3 flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5" /> Recomendaciones
        </h3>
        <ul className="space-y-2 text-copper text-sm">
          {resumen.riesgo_quiebra_tecnica && (
            <li>• El saldo cae por debajo de Q1M. Considera acelerar cobros o negociar crédito.</li>
          )}
          {parseFloat(variacion) < -10 && (
            <li>• Tendencia negativa del {variacion}%. Revisa gastos operativos.</li>
          )}
          <li>• Las proyecciones más allá de 8 semanas tienen menor certeza.</li>
          <li>• Actualiza datos de CxC y CxP regularmente para mejorar precisión.</li>
        </ul>
      </div>
    </div>
  )
}
