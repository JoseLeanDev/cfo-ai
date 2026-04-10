import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useInsights } from '../hooks/useCfoData'
import { 
  CalendarIcon, 
  BoltIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  LightBulbIcon,
  SparklesIcon,
  ChevronRightIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

// Componente para mostrar variación con color - Premium Financial
const Variacion = ({ value, inverse = false }) => {
  if (value === undefined || value === null) return null
  
  const isPositive = inverse ? value < 0 : value > 0
  const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono ${
      isPositive 
        ? 'text-[var(--success)] bg-[var(--success-dim)]' 
        : 'text-[var(--danger)] bg-[var(--danger-dim)]'
    }`}>
      <Icon className="w-3 h-3" />
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

// Componente para icono de insight según tipo
const InsightIcon = ({ tipo, className = "w-5 h-5" }) => {
  switch (tipo) {
    case 'oportunidad':
      return <ArrowTrendingUpIcon className={`${className} text-[var(--success)]`} />
    case 'riesgo':
      return <ArrowTrendingDownIcon className={`${className} text-[var(--warning)]`} />
    case 'critico':
      return <ExclamationTriangleIcon className={`${className} text-[var(--danger)]`} />
    case 'info':
      return <InformationCircleIcon className={`${className} text-[var(--accent-cyan)]`} />
    default:
      return <LightBulbIcon className={`${className} text-[var(--accent-purple)]`} />
  }
}

// Formatear moneda GTQ - Premium Financial Display
const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q0'
  return 'Q ' + value.toLocaleString('es-GT')
}

// KPI Card Component - Premium Design
const KPICard = ({ title, value, icon: Icon, trend, trendLabel, variant = 'default', footer, loading }) => {
  const variants = {
    default: 'card',
    positive: 'kpi-card positive',
    negative: 'kpi-card negative',
    warning: 'kpi-card warning'
  }
  
  return (
    <div className={`${variants[variant] || variants.default} p-5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">{title}</p>
          <div className="kpi-value text-2xl font-bold text-[var(--text-primary)]">
            {loading ? (
              <span className="animate-pulse">---</span>
            ) : (
              value
            )}
          </div>
          
          
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <Variacion value={trend} />
              <span className="text-xs text-[var(--text-muted)]">{trendLabel}</span>
            </div>
          )}
          
          
          {footer && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">{footer}</p>
          )}
        </div>
        
        
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--accent-cyan)]" />
        </div>
      </div>
    </div>
  )
}

// InformationCircleIcon
const InformationCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard()
  const { data: insightsData, isLoading: isLoadingInsights } = useInsights()
  const [animatedValues, setAnimatedValues] = useState({})
  const [showAllInsights, setShowAllInsights] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const kpis = dashboardData?.data?.kpis || {}
  const insights = insightsData?.data?.insights || []
  const criticalInsights = insights.filter(i => i.tipo === 'critico' || i.prioridad === 'alta')
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Animación de números
  useEffect(() => {
    if (kpis.ventas_mes?.value) {
      const duration = 1500
      const steps = 30
      const increment = kpis.ventas_mes.value / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= kpis.ventas_mes.value) {
          current = kpis.ventas_mes.value
          clearInterval(timer)
        }
        setAnimatedValues(prev => ({ ...prev, ventas: Math.floor(current) }))
      }, duration / steps)
      
      return () => clearInterval(timer)
    }
  }, [kpis.ventas_mes?.value])

  // Datos calculados
  const workingCapital = (kpis.cxc_total?.value || 0) - (kpis.cxp_total?.value || 0)
  const runway = Math.floor((kpis.disponible_gtq?.value || 0) / 450000)
  const liquidezRatio = ((kpis.disponible_gtq?.value || 0) + (kpis.cxc_total?.value || 0)) / (kpis.cxp_total?.value || 1)

  // Insight colors
  const getInsightStyles = (tipo) => {
    switch (tipo) {
      case 'oportunidad':
        return { border: 'border-l-[var(--success)]', bg: 'bg-[var(--success-dim)]', iconBg: 'bg-[var(--success)]/20' }
      case 'riesgo':
        return { border: 'border-l-[var(--warning)]', bg: 'bg-[var(--warning-dim)]', iconBg: 'bg-[var(--warning)]/20' }
      case 'critico':
        return { border: 'border-l-[var(--danger)]', bg: 'bg-[var(--danger-dim)]', iconBg: 'bg-[var(--danger)]/20' }
      case 'info':
        return { border: 'border-l-[var(--accent-cyan)]', bg: 'bg-[var(--info-dim)]', iconBg: 'bg-[var(--accent-cyan)]/20' }
      default:
        return { border: 'border-l-[var(--accent-purple)]', bg: 'bg-[var(--accent-purple-glow)]', iconBg: 'bg-[var(--accent-purple)]/20' }
    }
  }

  const getPriorityBadge = (prioridad) => {
    switch (prioridad) {
      case 'alta':
        return 'badge-danger'
      case 'media':
        return 'badge-warning'
      case 'baja':
        return 'badge-info'
      default:
        return 'badge-purple'
    }
  }

  const displayedInsights = showAllInsights ? insights : insights.slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px]">
      {/* Header Profesional - Premium Financial */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center shadow-lg shadow-[var(--accent-cyan-glow)]">
              <BuildingOfficeIcon className="w-5 h-5 text-[var(--bg-primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard Ejecutivo</h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                DICSA • NIT 1234567-8 • {currentTime.toLocaleDateString('es-GT', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {criticalInsights.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--danger-dim)] border border-[var(--danger)]/30">
              <ExclamationTriangleIcon className="w-4 h-4 text-[var(--danger)]" />
              <span className="text-xs font-medium text-[var(--danger)]">{criticalInsights.length} crítico(s)</span>
            </div>
          )}
          
          <Link 
            to="/log-actividades"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] hover:border-[var(--accent-cyan)]/50 transition-colors"
          >
            <CpuChipIcon className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">Agentes IA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          </Link>
        </div>
      </div>

      {/* KPIs Principales - Premium Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ventas del Mes"
          value={isLoading ? undefined : formatGTQ(animatedValues.ventas || kpis.ventas_mes?.value)}
          icon={ChartBarIcon}
          trend={kpis.ventas_mes?.var}
          trendLabel="vs mes ant."
          variant="default"
          loading={isLoading}
        />
        
        <KPICard
          title="Efectivo Disponible"
          value={isLoading ? undefined : formatGTQ(kpis.disponible_gtq?.value)}
          icon={BanknotesIcon}
          trend={kpis.disponible_gtq?.var}
          trendLabel="vs semana ant."
          variant={kpis.disponible_gtq?.var < 0 ? 'negative' : 'default'}
          footer="6 cuentas bancarias"
          loading={isLoading}
        />
        
        <KPICard
          title="Runway"
          value={isLoading ? undefined : `${runway} meses`}
          icon={CalendarIcon}
          variant={runway < 3 ? 'negative' : runway < 6 ? 'warning' : 'default'}
          footer={runway < 3 ? '⚠️ Crítico' : runway < 6 ? '⚡ Atención' : '✅ Saludable'}
          loading={isLoading}
        />
        
        <KPICard
          title="Working Capital"
          value={isLoading ? undefined : formatGTQ(workingCapital)}
          icon={BoltIcon}
          variant={workingCapital < 0 ? 'negative' : 'default'}
          footer={`CxC: ${formatGTQ(kpis.cxc_total?.value)}`}
          loading={isLoading}
        />
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Insights de IA - Premium Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Insights de IA</h2>
                  <p className="text-xs text-[var(--text-muted)]">Análisis inteligente en tiempo real</p>
                </div>
              </div>
              
              
              {insights.length > 4 && (
                <button
                  onClick={() => setShowAllInsights(!showAllInsights)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-glow)] rounded-lg transition-colors"
                >
                  {showAllInsights ? 'Ver menos' : 'Ver todos'}
                  <ChevronRightIcon className={`w-4 h-4 transition-transform ${showAllInsights ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Loading State */}
            {isLoadingInsights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-[var(--bg-tertiary)] animate-pulse h-24" />
                ))}
              </div>
            )}

            {/* Insights Grid - Premium Cards */}
            {!isLoadingInsights && insights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedInsights.map((insight, idx) => {
                  const styles = getInsightStyles(insight.tipo)
                  return (
                    <div
                      key={idx}
                      className={`relative p-4 rounded-lg border-l-2 ${styles.border} ${styles.bg} hover:opacity-90 transition-opacity cursor-pointer group`}
                    >
                      {!insight.visto && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--accent-cyan)] rounded-full border-2 border-[var(--bg-secondary)]" />
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <InsightIcon tipo={insight.tipo} className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge ${getPriorityBadge(insight.prioridad)}`}>
                              {insight.prioridad}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-1 mb-0.5">
                            {insight.titulo}
                          </h3>
                          
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                            {insight.descripcion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Posición Financiera */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Posición Financiera</h2>
                <p className="text-xs text-[var(--text-muted)]">Resumen de activos y pasivos corrientes</p>
              </div>
              
              <Link 
                to="/tesoreria"
                className="text-xs font-medium text-[var(--accent-cyan)] hover:underline"
              >
                Ver detalle →
              </Link>
            </div>

            <div className="space-y-3">
              {/* CxC */}
              <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue)]/20 flex items-center justify-center">
                      <UsersIcon className="w-4 h-4 text-[var(--accent-blue)]" />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">Cuentas por Cobrar</span>
                  </div>
                  
                  <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                    {formatGTQ(kpis.cxc_total?.value)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-blue)] rounded-full" style={{ width: '82%' }} />
                  </div>
                  <span className="text-xs font-mono text-[var(--warning)]">82% vencido</span>
                </div>
              </div>

              {/* CxP */}
              <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--warning)]/20 flex items-center justify-center">
                      <BuildingOfficeIcon className="w-4 h-4 text-[var(--warning)]" />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">Cuentas por Pagar</span>
                  </div>
                  
                  <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                    {formatGTQ(kpis.cxp_total?.value)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--warning)] rounded-full" style={{ width: '35%' }} />
                  </div>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">Q1.4M en 15 días</span>
                </div>
              </div>

              {/* Ratio */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[var(--accent-cyan)]/10 to-[var(--accent-purple)]/10 border border-[var(--accent-cyan)]/20">
                <div>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Ratio de Liquidez</span>
                  <p className="text-[10px] text-[var(--text-muted)]">Activo corriente / Pasivo corriente</p>
                </div>
                
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-[var(--accent-cyan)]">
                    {liquidezRatio.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)]">Ideal: > 1.5</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho */}
        <div className="space-y-5">
          {/* Próximos Vencimientos SAT */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-[var(--accent-cyan)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">SAT - Vencimientos</h2>
              </div>
              <span className="badge badge-warning">2 urgentes</span>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[var(--danger-dim)] border border-[var(--danger)]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--danger)] flex items-center justify-center text-white font-bold text-xs"
003e
                    HOY
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">1ra. Cuota ISR</p>
                    <p className="text-xs text-[var(--text-muted)]">Formulario SAT-2221</p>
                  </div>
                  
                  <span className="text-sm font-bold font-mono text-[var(--danger)]">Q175K</span>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-[var(--warning-dim)] border border-[var(--warning)]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--warning)] flex items-center justify-center text-white font-bold text-xs">
                    15d
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">IVA Marzo</p>
                    <p className="text-xs text-[var(--text-muted)]">Formulario SAT-2231</p>
                  </div>
                  
                  <span className="text-sm font-bold font-mono text-[var(--warning)]">Q185K</span>
                </div>
              </div>
            </div>
            
            <Link 
              to="/sat"
              className="flex items-center justify-center gap-1 w-full mt-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors border border-dashed border-[var(--border-default)]"
            >
              Ver calendario completo
              <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {/* Asistente CFO AI */}
          <div className="card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-purple)]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Asistente CFO AI</h2>
                  <p className="text-xs text-[var(--text-muted)]">4 agentes activos</p>
                </div>
              </div>
              
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Habla con nuestros agentes de IA para resolver dudas financieras, fiscales o de tesorería.
              </p>
              
              <button className="w-full btn-primary py-2.5 text-sm">
                <BoltIcon className="w-4 h-4" />
                Abrir Chat
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Agentes</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[var(--text-primary)]">4</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Insights</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[var(--text-primary)]">{insights.length}</span>
                <span className="text-[10px] text-[var(--accent-cyan)]">+nuevo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
