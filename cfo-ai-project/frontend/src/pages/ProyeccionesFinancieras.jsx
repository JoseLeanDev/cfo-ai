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
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function ProyeccionesFinancieras() {
  const [semanas, setSemanas] = useState(13)
  const { data: proyeccion, isLoading, error } = useTesoreriaProyeccion(semanas)
  
  const proyeccionData = proyeccion?.data || {}
  const datos = proyeccionData.proyeccion || []
  const resumen = proyeccionData.resumen || {}

  // Calcular métricas adicionales
  const saldoInicial = datos.length > 0 ? datos[0].saldo_acumulado : 0
  const saldoFinal = datos.length > 0 ? datos[datos.length - 1].saldo_acumulado : 0
  const variacion = saldoInicial > 0 ? ((saldoFinal - saldoInicial) / saldoInicial * 100).toFixed(1) : 0
  const promedioNeto = datos.length > 0 
    ? datos.reduce((acc, s) => acc + s.neto, 0) / datos.length 
    : 0

  // Encontrar semanas críticas
  const semanasCriticas = datos.filter(s => s.saldo_acumulado < 1000000)
  const semanasNegativas = datos.filter(s => s.saldo_acumulado < 0)

  // Generar insights
  const insights = []
  if (resumen.riesgo_quiebra_tecnica) {
    insights.push({
      tipo: 'critico',
      icono: ExclamationTriangleIcon,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      titulo: 'Riesgo de Quiebra Técnica',
      mensaje: `El saldo mínimo proyectado es Q${(resumen.saldo_minimo_proyectado || 0).toLocaleString()}. Se recomienda acción inmediata.`
    })
  }
  if (parseFloat(variacion) > 10) {
    insights.push({
      tipo: 'positivo',
      icono: ArrowTrendingUpIcon,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      titulo: 'Tendencia Positiva',
      mensaje: `Proyección de crecimiento del ${variacion}% en el período analizado.`
    })
  }
  if (parseFloat(variacion) < -10) {
    insights.push({
      tipo: 'alerta',
      icono: ArrowTrendingDownIcon,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      titulo: 'Tendencia Negativa',
      mensaje: `Se proyecta una disminución del ${Math.abs(variacion)}% en el saldo.`
    })
  }
  if (promedioNeto < 0) {
    insights.push({
      tipo: 'recomendacion',
      icono: LightBulbIcon,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      titulo: 'Flujo Neto Negativo',
      mensaje: 'El promedio semanal es deficitario. Revisa gastos o acelera cobros.'
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/tesoreria" 
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Proyecciones Financieras
                </h1>
                <p className="text-slate-500">Análisis de cash flow y predicciones</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Selector de período */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
          {[4, 8, 13, 26, 52].map(num => (
            <button
              key={num}
              onClick={() => setSemanas(num)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                semanas === num 
                  ? 'bg-cyan-500 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {num} sem
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Saldo Inicial</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <span className="text-cyan-600 font-bold">Q</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : `Q${saldoInicial.toLocaleString()}`}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Saldo Final</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              saldoFinal > saldoInicial ? 'bg-emerald-100' : 'bg-rose-100'
            }`}>
              {saldoFinal > saldoInicial ? (
                <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
              ) : (
                <ArrowTrendingDownIcon className="w-5 h-5 text-rose-600" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : `Q${saldoFinal.toLocaleString()}`}
          </div>
          <div className={`text-sm font-medium ${
            parseFloat(variacion) >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {parseFloat(variacion) >= 0 ? '+' : ''}{variacion}%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Saldo Mínimo</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              resumen.saldo_minimo_proyectado < 1000000 ? 'bg-rose-100' : 'bg-emerald-100'
            }`}>
              <ExclamationTriangleIcon className={`w-5 h-5 ${
                resumen.saldo_minimo_proyectado < 1000000 ? 'text-rose-600' : 'text-emerald-600'
              }`} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            resumen.saldo_minimo_proyectado < 1000000 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {isLoading ? '...' : `Q${(resumen.saldo_minimo_proyectado || 0).toLocaleString()}`}
          </div>
          <div className="text-sm text-slate-500">
            Semana {resumen.semana_critica || '—'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Flujo Neto Prom.</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              promedioNeto >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
            }`}>
              <CalendarIcon className={`w-5 h-5 ${
                promedioNeto >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            promedioNeto >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {isLoading ? '...' : `Q${Math.round(promedioNeto).toLocaleString()}`}
          </div>
          <div className="text-sm text-slate-500">por semana</div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-xl border ${insight.color} flex items-start gap-3`}
            >
              <insight.icono className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">{insight.titulo}</h3>
                <p className="text-sm opacity-90 mt-1">{insight.mensaje}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Proyección de Saldo</h2>
            <p className="text-sm text-slate-500">Evolución del saldo acumulado en el tiempo</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-600"></div>
              <span className="text-xs text-slate-600">Alta certeza</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <span className="text-xs text-slate-600">Media</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-300"></div>
              <span className="text-xs text-slate-600">Baja</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        ) : datos.length > 0 ? (
          <div className="space-y-6">
            {/* Debug info - quitar después */}
            <div className="text-xs text-slate-400 mb-2">
              Datos: {datos.length} semanas | Rango: Q{Math.min(...datos.map(s => s.saldo_acumulado)).toLocaleString()} - Q{Math.max(...datos.map(s => s.saldo_acumulado)).toLocaleString()}
            </div>
            
            {/* Gráfico de barras - versión simplificada */}
            <div className="h-80 flex items-end justify-between gap-1 border-b border-slate-200 pb-2">
              {datos.map((semana, i) => {
                const maxSaldo = Math.max(...datos.map(s => s.saldo_acumulado))
                const minSaldo = Math.min(...datos.map(s => s.saldo_acumulado))
                const rango = maxSaldo - minSaldo || 1
                // Normalizar a porcentaje 10-90%
                const alturaPct = Math.max(10, Math.min(90, ((semana.saldo_acumulado - minSaldo) / rango) * 80 + 10))
                
                const esCritica = semana.saldo_acumulado < 1000000
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative min-w-[20px]">
                    {/* Tooltip */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      <p className="font-semibold">Semana {semana.semana}</p>
                      <p>Saldo: Q{semana.saldo_acumulado.toLocaleString()}</p>
                      <p>Neto: Q{semana.neto.toLocaleString()}</p>
                      {semana.alerta && <p className="text-rose-400">⚠️ {semana.alerta}</p>}
                    </div>
                    
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        esCritica 
                          ? 'bg-gradient-to-t from-rose-500 to-rose-400' 
                          : semana.certeza === 'baja' 
                            ? 'bg-gradient-to-t from-cyan-300 to-cyan-400' 
                            : semana.certeza === 'media'
                              ? 'bg-gradient-to-t from-cyan-400 to-cyan-500'
                              : 'bg-gradient-to-t from-cyan-500 to-cyan-600'
                      }`}
                      style={{ height: `${alturaPct}%`, minHeight: '4px' }}
                    />
                    {i % Math.ceil(datos.length / 10) === 0 && (
                      <span className="text-xs text-slate-400">S{i + 1}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Tabla de datos */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Semana</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Entradas</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Salidas</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Neto</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Saldo Acum.</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.slice(0, 10).map((semana, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">{semana.semana}</td>
                      <td className="py-3 px-4 text-slate-500">{semana.fecha_inicio}</td>
                      <td className="py-3 px-4 text-right text-emerald-600">
                        +Q{semana.entradas.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600">
                        -Q{semana.salidas.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        semana.neto >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {semana.neto >= 0 ? '+' : ''}Q{semana.neto.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        Q{semana.saldo_acumulado.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {semana.alerta ? (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            Crítico
                          </span>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            semana.certeza === 'alta' ? 'bg-emerald-100 text-emerald-700' :
                            semana.certeza === 'media' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {semana.certeza}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {datos.length > 10 && (
                <p className="text-center text-sm text-slate-500 py-4">
                  ... y {datos.length - 10} semanas más
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-slate-400">
            No hay datos de proyección disponibles
          </div>
        )}
      </div>

      {/* Recomendaciones */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5 text-amber-500" />
          Recomendaciones Basadas en el Análisis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumen.riesgo_quiebra_tecnica && (
            <div className="bg-white p-4 rounded-xl border-l-4 border-rose-500 shadow-sm">
              <h3 className="font-semibold text-rose-700 mb-1">Acción Urgente Requerida</h3>
              <p className="text-sm text-slate-600">
                El saldo proyectado cae por debajo del umbral crítico. Considera acelerar cobros, 
                negociar línea de crédito o aplazar pagos no esenciales.
              </p>
            </div>
          )}
          {promedioNeto < 0 && (
            <div className="bg-white p-4 rounded-xl border-l-4 border-amber-500 shadow-sm">
              <h3 className="font-semibold text-amber-700 mb-1">Optimizar Flujo de Caja</h3>
              <p className="text-sm text-slate-600">
                El flujo neto promedio es negativo. Revisa gastos discrecionales y busca 
                oportunidades para reducir el ciclo de conversión de efectivo.
              </p>
            </div>
          )}
          {semanasCriticas.length > 0 && (
            <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
              <h3 className="font-semibold text-blue-700 mb-1">Monitoreo Intensivo</h3>
              <p className="text-sm text-slate-600">
                Hay {semanasCriticas.length} semanas con saldo crítico. Programa revisiones 
                semanales durante estos períodos para tomar acciones preventivas.
              </p>
            </div>
          )}
          <div className="bg-white p-4 rounded-xl border-l-4 border-emerald-500 shadow-sm">
            <h3 className="font-semibold text-emerald-700 mb-1">Mejorar Precisión</h3>
            <p className="text-sm text-slate-600">
              Las proyecciones más allá de 8 semanas tienen baja certeza. 
              Actualiza los datos de CxC y CxP regularmente para mejorar los forecast.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
