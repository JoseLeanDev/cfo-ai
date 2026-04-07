import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTesoreriaProyeccion } from '../hooks/useCfoData'
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LightBulbIcon,
  CalendarIcon,
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

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-slate-500">Cargando proyección...</p>
      </div>
    )
  }

  const saldoInicial = datos[0]?.saldo_acumulado || 0
  const saldoFinal = datos[datos.length - 1]?.saldo_acumulado || 0
  const variacion = saldoInicial > 0 ? ((saldoFinal - saldoInicial) / saldoInicial * 100).toFixed(1) : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <Link to="/tesoreria" className="text-cyan-600 hover:text-cyan-700 text-sm mb-4 inline-flex items-center gap-1">
          <ArrowLeftIcon className="w-4 h-4" /> Volver a Tesorería
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <ChartBarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Proyecciones Financieras</h1>
              <p className="text-slate-500">Análisis de flujo de caja a {semanas} semanas</p>
            </div>
          </div>

          <div className="flex gap-2">
            {[4, 8, 13, 26].map(n => (
              <button
                key={n}
                onClick={() => setSemanas(n)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  semanas === n 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {n} sem
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Saldo Inicial</p>
          <p className="text-2xl font-bold text-slate-900">Q{saldoInicial.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Saldo Final</p>
          <p className="text-2xl font-bold text-slate-900">Q{saldoFinal.toLocaleString()}</p>
          <span className={`text-sm font-medium ${parseFloat(variacion) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {parseFloat(variacion) >= 0 ? '+' : ''}{variacion}%
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Saldo Mínimo</p>
          <p className={`text-2xl font-bold ${resumen.saldo_minimo_proyectado < 1000000 ? 'text-rose-600' : 'text-slate-900'}`}>
            Q{(resumen.saldo_minimo_proyectado || 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">Semana {resumen.semana_critica || '—'}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Riesgo</p>
          {resumen.riesgo_quiebra_tecnica ? (
            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
              <ExclamationTriangleIcon className="w-5 h-5" /> Alto
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold">✓ Bajo</span>
          )}
        </div>
      </div>

      {/* GRÁFICO - Línea de área */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Evolución del Saldo</h2>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500"></span> Alta</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-300"></span> Media/Baja</span>
          </div>
        </div>

        <div className="h-64 relative">
          {/* Área del gráfico */}
          <div className="absolute inset-0 flex items-end">
            {datos.map((d, i) => {
              const max = Math.max(...datos.map(x => x.saldo_acumulado))
              const min = Math.min(...datos.map(x => x.saldo_acumulado))
              const range = max - min || 1
              const height = ((d.saldo_acumulado - min) / range) * 80 + 10
              const isCrit = d.saldo_acumulado < 1000000
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div className="font-bold mb-1">Semana {d.semana}</div>
                    <div>Saldo: Q{d.saldo_acumulado.toLocaleString()}</div>
                    <div className={d.neto >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      Neto: {d.neto >= 0 ? '+' : ''}Q{d.neto.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Barra */}
                  <div 
                    className={`w-full mx-0.5 rounded-t-md transition-all ${
                      isCrit 
                        ? 'bg-rose-400' 
                        : d.certeza === 'alta' 
                          ? 'bg-cyan-500' 
                          : 'bg-cyan-300'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              )
            })}
          </div>
          
          {/* Eje Y */}
          <div className="absolute left-0 top-0 bottom-8 w-px bg-slate-200"></div>
          <div className="absolute right-0 top-0 bottom-8 w-px bg-slate-200"></div>
          
          {/* Línea de referencia */}
          <div className="absolute left-0 right-0 bottom-8 h-px bg-slate-200"></div>
        </div>
        
        {/* Eje X labels */}
        <div className="flex justify-between mt-2 px-2">
          <span className="text-xs text-slate-400">S1</span>
          <span className="text-xs text-slate-400">S{Math.ceil(datos.length / 2)}</span>
          <span className="text-xs text-slate-400">S{datos.length}</span>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Detalle Semanal</h2>
          <button
            onClick={() => setMostrarTodos(!mostrarTodos)}
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
          >
            {mostrarTodos ? (<><ChevronUpIcon className="w-4 h-4" /> Mostrar menos</>) : (
              <><ChevronDownIcon className="w-4 h-4" /> Ver todas ({datos.length})</>
            )}
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {(mostrarTodos ? datos : datos.slice(0, 5)).map((semana, i) => (
            <div 
              key={i} 
              className={`p-4 flex items-center justify-between hover:bg-slate-50 ${
                semana.saldo_acumulado < 1000000 ? 'bg-rose-50/50' : ''
              }`}
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                  {semana.semana}
                </div>
                <div>
                  <p className="text-sm text-slate-500">{semana.fecha_inicio}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                    semana.certeza === 'alta' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : semana.certeza === 'media'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {semana.certeza}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Entradas</p>
                  <p className="font-medium text-emerald-600">+{semana.entradas.toLocaleString()}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-slate-400">Salidas</p>
                  <p className="font-medium text-rose-600">-{semana.salidas.toLocaleString()}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-slate-400">Neto</p>
                  <p className={`font-bold ${semana.neto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {semana.neto >= 0 ? '+' : ''}{semana.neto.toLocaleString()}
                  </p>
                </div>
                
                <div className="text-right w-32">
                  <p className="text-xs text-slate-400">Saldo</p>
                  <p className={`text-xl font-bold ${semana.saldo_acumulado < 1000000 ? 'text-rose-600' : 'text-slate-900'}`}>
                    Q{semana.saldo_acumulado.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECOMENDACIONES */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5" /> Recomendaciones
        </h3>
        <ul className="space-y-2 text-amber-800">
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
