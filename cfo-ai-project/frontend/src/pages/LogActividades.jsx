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
  WalletIcon,
  PresentationChartBarIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ChartBarIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'

// NUEVO: 4 Agentes Especializados v2.0
const agenteConfig = {
  'caja': { 
    nombre: 'Caja', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: WalletIcon,
    desc: 'Proyección cash flow, runway, posición'
  },
  'analisis': { 
    nombre: 'Análisis', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: PresentationChartBarIcon,
    desc: 'KPIs, rentabilidad, RFM, anomalías'
  },
  'cobranza': { 
    nombre: 'Cobranza', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: DocumentTextIcon,
    desc: 'CxC aging, DSO, CCC, cobro'
  },
  'contabilidad': { 
    nombre: 'Contabilidad', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: BookOpenIcon,
    desc: 'Cierre mensual, fiscal, conciliación'
  },
  'orchestrator': { 
    nombre: 'Qora Core', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: CpuChipIcon,
    desc: 'Orquestador y briefing diario'
  },
}

const categoriaConfig = {
  posicion_caja: { 
    label: 'Caja', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: WalletIcon 
  },
  proyeccion_cashflow: { 
    label: 'Cash Flow', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: PresentationChartBarIcon 
  },
  kpis_diarios: { 
    label: 'KPIs', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: PresentationChartBarIcon 
  },
  analisis_semanal: { 
    label: 'Análisis Sem', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: PresentationChartBarIcon 
  },
  analisis_mensual: { 
    label: 'Análisis Mes', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: PresentationChartBarIcon 
  },
  aging_cartera: { 
    label: 'Aging', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: DocumentTextIcon 
  },
  metricas_cobranza: { 
    label: 'Cobranza', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: DocumentTextIcon 
  },
  importacion_transacciones: { 
    label: 'Importar', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: BookOpenIcon 
  },
  conciliacion_bancaria: { 
    label: 'Conciliación', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: BookOpenIcon 
  },
  cierre_mensual: { 
    label: 'Cierre', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: BookOpenIcon 
  },
  calculos_fiscales: { 
    label: 'Fiscal', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: BookOpenIcon 
  },
  error_sistema: { 
    label: 'Error', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: XCircleIcon 
  },
  briefing_diario: { 
    label: 'Briefing', 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: CpuChipIcon 
  }
}

const statusConfig = {
  exitoso: { 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: CheckCircleIcon,
    label: 'Éxito'
  },
  advertencia: { 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: ExclamationTriangleIcon,
    label: 'Advertencia'
  },
  error: { 
    color: 'text-ink',
    bg: 'bg-white',
    border: 'border-fog',
    icon: XCircleIcon,
    label: 'Error'
  }
}

export default function LogActividades() {
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [expandedLog, setExpandedLog] = useState(null)

  const [filtroDias, setFiltroDias] = useState(30)

  const { data, isLoading, refetch } = useAgentesLogs({ 
    limit: 100,
    agente: filtroAgente || undefined,
    categoria: filtroCategoria || undefined,
    status: filtroStatus || undefined,
    dias: filtroDias
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Registro</p>
          <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
            Agentes
          </h1>
          <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">
            Qué corrió cada agente, sobre qué fuente y con qué resultado. Toda
            ejecución queda asentada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            className="btn-secondary text-xs"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Actualizar
          </button>

          <span className="badge-info">
            <span className="status-dot agent" />
            4 en ejecución
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Total Actividades</span>
            <ChartBarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{stats?.total || logs.length}</div>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Éxitos</span>
            <CheckCircleIcon className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="kpi-value">{stats?.por_status?.exitoso || 0}</div>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Advertencias</span>
            <ExclamationTriangleIcon className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="kpi-value">{stats?.por_status?.advertencia || 0}</div>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Errores</span>
            <XCircleIcon className="w-4 h-4 text-[var(--danger)]" />
          </div>
          <div className="kpi-value">{stats?.por_status?.error || 0}</div>
        </div>
      </div>

      {/* Agentes Status */}
      <div className="card">
        <div className="section-header">
          <CpuChipIcon className="w-5 h-5 text-[var(--text-muted)]" />
          <h2 className="font-display text-[1.125rem] font-semibold text-ink">Estado de los agentes</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5 pt-0">
          {Object.entries(agenteConfig).filter(([key]) => key !== 'orchestrator').map(([key, config]) => (
            <div key={key} className="border border-fog border-l-2 border-l-cobalt bg-white p-4">
              <p className="eyebrow text-[0.6875rem]">{key}</p>
              <p className="mt-1.5 font-display text-[1rem] font-semibold text-ink">
                {config.nombre}
              </p>
              <p className="measure mt-1 text-[0.8125rem] leading-snug text-slate">
                {config.desc}
              </p>
              <p className="mt-3 flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-verified">
                <span className="status-dot online" />
                Operativo
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm font-medium">Filtros</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Agente</label>
            <select aria-label="Agente" value={filtroAgente} onChange={(e) => setFiltroAgente(e.target.value)} className="input">
              <option value="">Todos</option>
              <option value="caja"> Caja</option>
              <option value="analisis"> Análisis</option>
              <option value="cobranza"> Cobranza</option>
              <option value="contabilidad"> Contabilidad</option>
              <option value="orchestrator">Qora Core</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Categoría</label>
            <select aria-label="Categoría" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="input">
              <option value="">Todas</option>
              <option value="posicion_caja"> Posición Caja</option>
              <option value="proyeccion_cashflow"> Proyección Cash Flow</option>
              <option value="kpis_diarios"> KPIs Diarios</option>
              <option value="analisis_semanal"> Análisis Semanal</option>
              <option value="aging_cartera"> Aging Cartera</option>
              <option value="metricas_cobranza"> Métricas Cobranza</option>
              <option value="conciliacion_bancaria"> Conciliación</option>
              <option value="cierre_mensual"> Cierre Mensual</option>
              <option value="calculos_fiscales"> Cálculos Fiscales</option>
              <option value="briefing_diario"> Briefing Diario</option>
              <option value="error_sistema"> Errores</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Estado</label>
            <select aria-label="Estado" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="input">
              <option value="">Todos</option>
              <option value="exitoso">Éxito</option>
              <option value="advertencia">Advertencia</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Período</label>
            <select aria-label="Período" value={filtroDias} onChange={(e) => setFiltroDias(Number(e.target.value))} className="input">
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
              <option value={365}>Último año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <h2 className="font-display text-[1.125rem] font-semibold text-ink">Bitácora de ejecución</h2>
          <span className="text-xs text-[var(--text-muted)]">{logs.length} registros</span>
        </div>

        {isLoading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-6 border-b border-fog px-4 py-3.5 last:border-b-0">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-4 w-16" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <CommandLineIcon className="w-6 h-6" />
            </div>
            <p className="font-display text-[1rem] font-semibold text-ink">
              Sin ejecuciones en el período
            </p>
            <p className="measure mt-1 text-[0.875rem] text-slate">
              Amplíe el rango de fechas o retire los filtros para ver el
              historial completo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Agente</th>
                  <th>Actividad</th>
                  <th>Estado</th>
                  <th>Duración</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const ageConfig = agenteConfig[log.agenteTipo] || agenteConfig.orchestrator
                  const catConfig = categoriaConfig[log.categoria] || { label: log.categoria || 'General', color: 'text-graphite', bg: 'bg-paper', border: 'border-fog', icon: CommandLineIcon }
                  const statusCfg = statusConfig[log.resultadoStatus] || statusConfig.exitoso
                  const isExpanded = expandedLog === log.id

                  return (
                    <>
                      <tr 
                        key={log.id}
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="cursor-pointer hover:bg-[var(--bg-secondary)]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${ageConfig.color.replace('text-', 'bg-')}`} />
                            <span className="font-medium">{ageConfig.nombre}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`badge ${catConfig.bg} ${catConfig.color} border ${catConfig.border}`}>
                            {catConfig.label}
                          </span>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">{log.descripcion}</p>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`badge ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                            <statusCfg.icon className="w-3.5 h-3.5" />
                            {statusCfg.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-mono text-xs">{formatDuracion(log.duracionMs)}</span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="text-xs text-[var(--text-muted)]">{formatFecha(log.fecha || log.createdAt)}</span>
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && log.detallesJson && (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 bg-[var(--bg-secondary)]">
                            <pre className="text-xs font-mono overflow-x-auto p-3 bg-white rounded border border-[var(--border-default)]">
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
