import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useInsights } from '../hooks/useCfoData'
import { 
  CalendarIcon, 
  BanknotesIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  LightBulbIcon,
  SparklesIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ArrowPathIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'

// Format currency GTQ
const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

// Variation component
const Variacion = ({ value }) => {
  if (value === undefined || value === null) return null
  const isPositive = value > 0
  return (
    <span className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
      {isPositive ? '+' : ''}{value}%
    </span>
  )
}

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard()
  const { data: insightsData, isLoading: isLoadingInsights } = useInsights()
  const [animatedValues, setAnimatedValues] = useState({})

  const kpis = dashboardData?.data?.kpis || {}
  const insights = insightsData?.data?.insights || []

  // Animate numbers
  useEffect(() => {
    if (kpis.ventas_mes?.value) {
      const duration = 1000
      const steps = 20
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

  // Calculated data
  const workingCapital = (kpis.cxc_total?.value || 0) - (kpis.cxp_total?.value || 0)
  const runway = Math.floor((kpis.disponible_gtq?.value || 0) / 450000)
  const liquidezRatio = ((kpis.disponible_gtq?.value || 0) + (kpis.cxc_total?.value || 0)) / (kpis.cxp_total?.value || 1)

  // Insight colors
  const getInsightStyles = (tipo) => {
    switch (tipo) {
      case 'oportunidad': return 'border-l-[var(--success)] bg-[var(--success-bg)]'
      case 'riesgo': return 'border-l-[var(--warning)] bg-[var(--warning-bg)]'
      case 'critico': return 'border-l-[var(--danger)] bg-[var(--danger-bg)]'
      default: return 'border-l-[var(--brand-gold)] bg-[var(--bg-tertiary)]'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl">Dashboard Ejecutivo</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Distribuidora Industrial Centroamericana, S.A. • NIT 1234567-8
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {insights.filter(i => i.tipo === 'critico').length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--danger-bg)] border border-[var(--danger)]/20">
              <ExclamationTriangleIcon className="w-4 h-4 text-[var(--danger)]" />
              <span className="text-xs font-medium text-[var(--danger)]">{insights.filter(i => i.tipo === 'critico').length} crítico(s)</span>
            </div>
          )}
          
          <Link to="/log-actividades" className="btn-secondary text-xs">
            <CpuChipIcon className="w-4 h-4" />
            Agentes IA
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></span>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Ventas del Mes</span>
            <ChartBarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">
            {isLoading ? '---' : formatGTQ(animatedValues.ventas || kpis.ventas_mes?.value)}
          </div>
          <Variacion value={kpis.ventas_mes?.var} />
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Efectivo Disponible</span>
            <BanknotesIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{isLoading ? '---' : formatGTQ(kpis.disponible_gtq?.value)}</div>
          <Variacion value={kpis.disponible_gtq?.var} />
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Runway</span>
            <CalendarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{isLoading ? '---' : `${runway} meses`}</div>
          <span className={`text-xs ${runway < 3 ? 'text-[var(--danger)]' : runway < 6 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
            {runway < 3 ? 'Crítico' : runway < 6 ? 'Atención' : 'Saludable'}
          </span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Working Capital</span>
            <ArrowPathIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className={`kpi-value ${workingCapital < 0 ? 'text-[var(--danger)]' : ''}`}>
            {isLoading ? '---' : formatGTQ(workingCapital)}
          </div>
          <span className="text-xs text-[var(--text-muted)]">CxC - CxP</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Insights */}
          <div className="card p-5">
            <div className="section-header">
              <span className="section-number">01</span>
              <div className="flex-1">
                <h2 className="font-serif text-lg">Insights de IA</h2>                
              </div>
              <SparklesIcon className="w-5 h-5 text-[var(--brand-gold)]" />
            </div>

            {isLoadingInsights ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                ))}
              </div>
            ) : insights.length === 0 ? (
              <div className="text-center py-8">
                <LightBulbIcon className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-muted)]">No hay insights disponibles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.slice(0, 4).map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded border-l-2 ${getInsightStyles(insight.tipo)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge-${insight.prioridad === 'alta' ? 'danger' : insight.prioridad === 'media' ? 'warning' : 'info'}`}>
                            {insight.prioridad}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] uppercase">{insight.categoria}</span>
                        </div>
                        <h3 className="font-medium text-[var(--text-primary)] text-sm">{insight.titulo}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{insight.descripcion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Posición Financiera */}
          <div className="card p-5">
            <div className="section-header">
              <span className="section-number">02</span>
              <h2 className="font-serif text-lg">Posición Financiera</h2>
              <Link to="/tesoreria" className="ml-auto text-xs text-[var(--brand-navy)] hover:underline">Ver detalle →</Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cuentas por Cobrar</span>
                    <span className="amount">{formatGTQ(kpis.cxc_total?.value)}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }} />
                  </div>
                  <span className="text-xs text-[var(--danger)] mt-1">82% vencido</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cuentas por Pagar</span>
                    <span className="amount">{formatGTQ(kpis.cxp_total?.value)}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] mt-1">Q1.4M en 15 días</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--brand-navy)] text-white rounded-lg">
                <div>
                  <span className="text-sm opacity-90">Ratio de Liquidez</span>
                  <p className="text-xs opacity-70">Activo corriente / Pasivo corriente</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold tabular-nums font-mono">{liquidezRatio.toFixed(2)}</span>
                  <p className="text-xs opacity-70">Ideal: &gt; 1.5</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* SAT Vencimientos */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BuildingOfficeIcon className="w-4 h-4 text-[var(--brand-navy)]" />
              <h2 className="font-serif">SAT - Vencimientos</h2>
              <span className="badge-warning ml-auto">2 urgentes</span>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-[var(--danger-bg)] border border-[var(--danger)]/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[var(--danger)] text-white flex items-center justify-center text-xs font-bold">
                    HOY
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">1ra. Cuota ISR</p>
                    <p className="text-xs text-[var(--text-muted)]">SAT-2221</p>
                  </div>
                  <span className="amount text-[var(--danger)]">Q175K</span>
                </div>
              </div>
              
              <div className="p-3 bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[var(--warning)] text-white flex items-center justify-center text-xs font-bold">
                    15d
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">IVA Marzo</p>
                    <p className="text-xs text-[var(--text-muted)]">SAT-2231</p>
                  </div>
                  <span className="amount text-[var(--warning)]">Q185K</span>
                </div>
              </div>
            </div>
            
            <Link to="/sat" className="flex items-center justify-center gap-1 w-full mt-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-dashed border-[var(--border-default)] rounded">
              Ver calendario completo
              <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {/* CFO AI Assistant */}
          <div className="card p-5 bg-[var(--brand-navy)] text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg">CFO AI</h2>
                <p className="text-xs opacity-70">4 agentes activos</p>
              </div>
            </div>
            
            <p className="text-sm opacity-80 mb-4">
              Agentes inteligentes para análisis financiero, conciliación y cumplimiento fiscal.
            </p>
            
            <Link to="/log-actividades" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-[var(--brand-navy)] font-medium rounded hover:bg-opacity-90 transition-colors">
              Ver Agentes
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Agentes</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold tabular-nums">4</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></span>
              </div>
            </div>
            
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Insights</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold tabular-nums">{insights.length}</span>
                <span className="text-[10px] text-[var(--brand-gold)]">+nuevo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
