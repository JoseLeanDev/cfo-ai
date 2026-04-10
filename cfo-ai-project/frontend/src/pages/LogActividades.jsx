import { useState } from 'react'
import { useAgentesLogs } from '../hooks/useCfoData'
import { 
  CpuChipIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  CommandLineIcon,
  ChartBarIcon,
  BoltIcon,
  ShieldCheckIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'

// Configuración de agentes de IA v2.0 - Premium
const agenteConfig = {
  'auditor_ia': { 
    nombre: 'Auditor IA', 
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: ShieldCheckIcon,
    desc: 'Detección de anomalías'
  },
  'analista_ia': { 
    nombre: 'Analista IA', 
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: SparklesIcon,
    desc: 'Insights financieros'
  },
  'conciliador_ia': { 
    nombre: 'Conciliador IA', 
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    icon: ChartBarIcon,
    desc: 'Conciliaciones bancarias'
  },
  'maintenance_ia': { 
    nombre: 'Maintenance IA', 
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: CommandLineIcon,
    desc: 'Health checks'
  },
  'orchestrator': { 
    nombre: 'Orchestrator', 
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: CpuChipIcon,
    desc: 'Coordinación'
  },
}

const categoriaConfig = {
  alerta_detectada: { 
    label: 'Alerta', 
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: ExclamationTriangleIcon 
  },
  analisis_ejecutado: { 
    label: 'Análisis', 
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: ChartBarIcon 
  },
  reporte_generado: { 
    label: 'Reporte', 
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    icon: SparklesIcon 
  },
  sincronizacion_datos: { 
    label: 'Sync', 
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: ArrowPathIcon 
  },
  error_sistema: { 
    label: 'Error', 
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: XCircleIcon 
  },
  insight_generado: { 
    label: 'Insight', 
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: BoltIcon 
  }
}

const statusConfig = {
  exitoso: { 
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: CheckCircleIcon,
    label: 'Éxito'
  },
  advertencia: { 
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: ExclamationTriangleIcon,
    label: 'Advertencia'
  },
  error: { 
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: XCircleIcon,
    label: 'Error'
  }
}

export default function LogActividades() {
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [expandedLog, setExpandedLog] = useState(null)
  
  const { data, isLoading, refetch } = useAgentesLogs({ 
    limit: 100,
    agente: filtroAgente || undefined,
    categoria: filtroCategoria || undefined,
    status: filtroStatus || undefined,
    dias: 7
  })

  const logs = data?.data?.logs || []
  const stats = data?.data?.estadisticas || {}

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-GT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuracion = (ms) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-[1600px]">
      {/* Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center shadow-lg shadow-[var(--accent-cyan-glow)]">
            <CpuChipIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Agentes de IA</h1>
            <p className="text-xs text-[var(--text-muted)] font-mono">Monitoreo y logs del sistema multi-agente</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/50 transition-colors text-sm"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Actualizar
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success-dim)] border border-[var(--success)]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--success)]">4 Agentes Activos</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total Actividades</span>
            <ChartBarIcon className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{stats?.total || logs.length}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Últimos 7 días</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Éxitos</span>
            <CheckCircleIcon className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--success)]">{stats?.por_status?.exitoso || 0}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {stats?.total ? Math.round((stats.por_status?.exitoso || 0) / stats.total * 100) : 0}% tasa éxito
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Advertencias</span>
            <ExclamationTriangleIcon className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--warning)]">{stats?.por_status?.advertencia || 0}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Requieren atención</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Errores</span>
            <XCircleIcon className="w-4 h-4 text-[var(--danger)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--danger)]">{stats?.por_status?.error || 0}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Fallos del sistema</div>
        </div>
      </div>

      {/* Agentes Status */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <CommandLineIcon className="w-4 h-4 text-[var(--accent-cyan)]" />
          Estado de Agentes
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(agenteConfig).filter(([key]) => key !== 'orchestrator').map(([key, config]) => (
            <div key={key} className={`p-4 rounded-lg ${config.bg} border ${config.border}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <config.icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${config.color}`}>{config.nombre}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{config.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                <span className="text-xs text-[var(--text-secondary)]">Operativo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Filtros</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Agente</label>
            <select 
              value={filtroAgente} 
              onChange={(e) => setFiltroAgente(e.target.value)}
              className="input text-sm"
            >
              <option value="">Todos los agentes</option>
              <option value="auditor_ia">Auditor IA</option>
              <option value="analista_ia">Analista Financiero IA</option>
              <option value="conciliador_ia">Conciliador Bancario IA</option>
              <option value="maintenance_ia">Maintenance IA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Categoría</label>
            <select 
              value={filtroCategoria} 
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="input text-sm"
            >
              <option value="">Todas</option>
              <option value="alerta_detectada">Alertas</option>
              <option value="analisis_ejecutado">Análisis</option>
              <option value="reporte_generado">Reportes</option>
              <option value="sincronizacion_datos">Sincronización</option>
              <option value="error_sistema">Errores</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Estado</label>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="input text-sm"
            >
              <option value="">Todos</option>
              <option value="exitoso">Éxito</option>
              <option value="advertencia">Advertencia</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Logs de Actividad</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {logs.length} registros
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Cargando logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <CommandLineIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">No hay logs para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Agente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Actividad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Duración</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Hora</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const ageConfig = agenteConfig[log.agenteTipo] || agenteConfig.orchestrator
                  const catConfig = categoriaConfig[log.categoria] || categoriaConfig.insight_generado
                  const statusCfg = statusConfig[log.resultadoStatus] || statusConfig.exitoso
                  const isExpanded = expandedLog === log.id
                  
                  return (
                    <>
                      <tr 
                        key={log.id}
                        className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${ageConfig.color.replace('text-', 'bg-')}`} />
                            <span className="text-[var(--text-primary)] font-medium">{ageConfig.nombre}</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] ml-4">{log.agenteTipo}</span>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${catConfig.bg} ${catConfig.color} border ${catConfig.border}`}>
                              {catConfig.label}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">{log.descripcion}</p>
                        </td>
                        
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                            <statusCfg.icon className="w-3.5 h-3.5" />
                            {statusCfg.label}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-[var(--text-secondary)]">
                            {formatDuracion(log.duracionMs)}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="text-xs text-[var(--text-muted)]">{formatFecha(log.createdAt)}</span>
                            {isExpanded ? (
                              <ChevronUpIcon className="w-4 h-4 text-[var(--text-muted)]" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 text-[var(--text-muted)]" />
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {isExpanded && log.detallesJson && (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 bg-[var(--bg-tertiary)]/30 border-b border-[var(--border-subtle)]">
                            <pre className="text-xs text-[var(--text-secondary)] font-mono overflow-x-auto p-3 rounded-lg bg-[var(--bg-secondary)]">
                              {JSON.stringify(JSON.parse(log.detallesJson), null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
