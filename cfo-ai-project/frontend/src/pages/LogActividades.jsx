import { useState } from 'react'
import { useAgentesLogs } from '../hooks/useCfoData'
import { 
  CpuChipIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ChartBarIcon,
  CalculatorIcon,
  ChatBubbleLeftIcon,
  CogIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

// Configuración de iconos por categoría
const categoriaConfig = {
  insight_generado: { icon: LightBulbIcon, color: 'text-violet-500', bg: 'bg-violet-50', label: 'Insight' },
  analisis_ejecutado: { icon: ChartBarIcon, color: 'text-cyan-500', bg: 'bg-cyan-50', label: 'Análisis' },
  sincronizacion_datos: { icon: ArrowPathIcon, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Sincronización' },
  alerta_detectada: { icon: ExclamationTriangleIcon, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Alerta' },
  prediccion_realizada: { icon: CpuChipIcon, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Predicción' },
  auditoria_completada: { icon: ShieldCheckIcon, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Auditoría' },
  calculo_fiscal: { icon: CalculatorIcon, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Cálculo Fiscal' },
  conciliacion: { icon: BanknotesIcon, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Conciliación' },
  cierre_contable: { icon: DocumentCheckIcon, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Cierre' },
  chat_interaccion: { icon: ChatBubbleLeftIcon, color: 'text-pink-500', bg: 'bg-pink-50', label: 'Chat' },
  configuracion: { icon: CogIcon, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Configuración' }
}

// Configuración de agentes (actualizado con Agentes de IA v2.0)
const agenteConfig = {
  // Agentes de IA v2.0
  'auditor_ia': { nombre: 'Auditor IA', color: 'text-rose-600', bg: 'bg-rose-100' },
  'analista_ia': { nombre: 'Analista Financiero IA', color: 'text-cyan-600', bg: 'bg-cyan-100' },
  'conciliador_ia': { nombre: 'Conciliador Bancario IA', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  'maintenance_ia': { nombre: 'Maintenance IA', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'orchestrator': { nombre: 'Orchestrator IA', color: 'text-blue-600', bg: 'bg-blue-100' },
  // Legacy (para compatibilidad)
  'AnalistaFinanciero': { nombre: 'Analista Financiero', color: 'text-cyan-600', bg: 'bg-cyan-100' },
  'PredictorCashFlow': { nombre: 'Predictor Cash Flow', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'AsistenteSAT': { nombre: 'Asistente SAT', color: 'text-orange-600', bg: 'bg-orange-100' },
  'AuditorAutomatico': { nombre: 'Auditor Automático', color: 'text-rose-600', bg: 'bg-rose-100' },
  'ChatbotCFO': { nombre: 'Chatbot CFO', color: 'text-violet-600', bg: 'bg-violet-100' },
  'OrchestratorAgent': { nombre: 'Orchestrator', color: 'text-blue-600', bg: 'bg-blue-100' }
}

// Status icons
const statusConfig = {
  exito: { icon: CheckCircleIcon, color: 'text-emerald-500', label: 'Éxito' },
  advertencia: { icon: ExclamationTriangleIcon, color: 'text-amber-500', label: 'Advertencia' },
  error: { icon: XCircleIcon, color: 'text-rose-500', label: 'Error' },
  en_progreso: { icon: ArrowPathIcon, color: 'text-blue-500', label: 'En Progreso' }
}

export default function LogActividades() {
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const { data: logsData, isLoading } = useAgentesLogs({ 
    agente: filtroAgente || undefined,
    categoria: filtroCategoria || undefined,
    status: filtroStatus || undefined,
    dias: 7,
    limit: 100
  })

  const logs = logsData?.data?.logs || []
  const stats = logsData?.data?.estadisticas || {}

  // Formatear fecha
  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleString('es-GT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Formatear duración
  const formatDuracion = (ms) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/30">
          <CpuChipIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Log de Actividades</h1>
          <p className="text-slate-500">Visibilidad de acciones realizadas por los agentes de IA</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-elevated p-4">
          <p className="text-sm text-slate-500">Total Actividades</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-slate-500">Agentes Activos</p>
          <p className="text-2xl font-bold text-blue-600">{stats.agentesActivos || 0}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-slate-500">Exitosas</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.exitosos || 0}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-slate-500">Advertencias</p>
          <p className="text-2xl font-bold text-amber-600">{stats.advertencias || 0}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-sm text-slate-500">Errores</p>
          <p className="text-2xl font-bold text-rose-600">{stats.errores || 0}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-elevated p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Agente</label>
            <select 
              value={filtroAgente} 
              onChange={(e) => setFiltroAgente(e.target.value)}
              className="input w-full"
            >
              <option value="">Todos los agentes</option>
              <option value="auditor_ia">Auditor IA</option>
              <option value="analista_ia">Analista Financiero IA</option>
              <option value="conciliador_ia">Conciliador Bancario IA</option>
              <option value="maintenance_ia">Maintenance IA</option>
              <option value="orchestrator">Orchestrator</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select 
              value={filtroCategoria} 
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="input w-full"
            >
              <option value="">Todas las categorías</option>
              <option value="insight_generado">Insight Generado</option>
              <option value="analisis_ejecutado">Análisis Ejecutado</option>
              <option value="sincronizacion_datos">Sincronización</option>
              <option value="alerta_detectada">Alerta</option>
              <option value="prediccion_realizada">Predicción</option>
              <option value="auditoria_completada">Auditoría</option>
              <option value="calculo_fiscal">Cálculo Fiscal</option>
              <option value="conciliacion">Conciliación</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="input w-full"
            >
              <option value="">Todos los estados</option>
              <option value="exito">Éxito</option>
              <option value="advertencia">Advertencia</option>
              <option value="error">Error</option>
              <option value="en_progreso">En Progreso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Registro de Actividades</h3>
            <span className="text-sm text-slate-500">
              Mostrando {logs.length} de {stats.total || 0} registros
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-slate-400">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Cargando actividades...</span>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CpuChipIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay actividades registradas</p>
            <p className="text-sm mt-1">Los agentes de IA registrarán sus acciones automáticamente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Agente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Impacto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const catConfig = categoriaConfig[log.categoria] || categoriaConfig.insight_generado
                  const CatIcon = catConfig.icon
                  const ageConfig = agenteConfig[log.agenteTipo] || agenteConfig.orchestrator
                  const StatusIcon = (statusConfig[log.resultadoStatus] || statusConfig.exito).icon
                  const statusCfg = statusConfig[log.resultadoStatus] || statusConfig.exito

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ageConfig.bg.replace('bg-', 'bg-').replace('100', '500')}`} />
                          <span className="text-sm font-medium text-slate-900">{ageConfig.nombre}</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-4">{log.agenteTipo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${catConfig.bg} ${catConfig.color}`}>
                          <CatIcon className="w-3.5 h-3.5" />
                          {catConfig.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 max-w-md">{log.descripcion}</p>
                        {log.duracionMs > 0 && (
                          <span className="text-xs text-slate-400">Duración: {formatDuracion(log.duracionMs)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1 text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusCfg.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.impactoValor ? (
                          <span className={`text-sm font-semibold ${log.impactoValor > 0 ? 'text-emerald-600' : log.impactoValor < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {log.impactoValor > 0 ? '+' : ''}
                            {new Intl.NumberFormat('es-GT', {
                              style: 'currency',
                              currency: log.impactoMoneda || 'GTQ',
                              minimumFractionDigits: 0
                            }).format(log.impactoValor)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <ClockIcon className="w-4 h-4 text-slate-400" />
                          {formatFecha(log.fecha)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actividad por Agente */}
      {stats.porAgente && stats.porAgente.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-elevated p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Actividad por Agente</h3>
            <div className="space-y-3">
              {stats.porAgente.map((item) => {
                const ageConfig = agenteConfig[item.agente] || agenteConfig.orchestrator
                const maxCount = Math.max(...stats.porAgente.map(a => a.count))
                const percentage = (item.count / maxCount) * 100
                
                return (
                  <div key={item.agente} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${ageConfig.bg} ${ageConfig.color} w-40 truncate`}>
                      {ageConfig.nombre}
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${ageConfig.bg.replace('bg-', 'bg-').replace('100', '500')}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-8">{item.count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card-elevated p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Actividad por Categoría</h3>
            <div className="space-y-3">
              {stats.porCategoria && stats.porCategoria.map((item) => {
                const catConfig = categoriaConfig[item.categoria] || categoriaConfig.insight_generado
                const maxCount = Math.max(...stats.porCategoria.map(c => c.count))
                const percentage = (item.count / maxCount) * 100
                
                return (
                  <div key={item.categoria} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${catConfig.bg} ${catConfig.color} w-32 truncate`}>
                      {catConfig.label}
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${catConfig.bg.replace('bg-', 'bg-').replace('50', '500')}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-8">{item.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
