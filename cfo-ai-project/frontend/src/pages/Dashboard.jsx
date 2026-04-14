import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useInsights } from '../hooks/useCfoData'
import RunwayCalculator from '../components/dashboard/RunwayCalculator'
import CustomerConcentrationRisk from '../components/dashboard/CustomerConcentrationRisk'
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
  ArrowPathIcon,
  CpuChipIcon,
  ArrowTrendingDownIcon
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
  const { data: insightsData, isLoading: isLoadingInsights } = useInsights('dashboard')
  const [animatedValues, setAnimatedValues] = useState({})

  // La estructura del backend es: data.tesoreria, data.cxc, data.cxp, data.operacion, data.alertas, data.resumen
  const tesoreria = dashboardData?.data?.tesoreria || {}
  const cxc = dashboardData?.data?.cxc || {}
  const cxp = dashboardData?.data?.cxp || {}
  const operacion = dashboardData?.data?.operacion || {}
  const alertas = dashboardData?.data?.alertas || []
  const resumen = dashboardData?.data?.resumen || {}
  
  const insights = insightsData?.insights || []

  // Animate numbers
  useEffect(() => {
    const ventasValue = operacion.ventas_mes || operacion.avg_ingresos_mes || 0
    if (ventasValue) {
      const duration = 1000
      const steps = 20
      const increment = ventasValue / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= ventasValue) {
          current = ventasValue
          clearInterval(timer)
        }
        setAnimatedValues(prev => ({ ...prev, ventas: Math.floor(current) }))
      }, duration / steps)
      
      return () => clearInterval(timer)
    }
  }, [operacion.ventas_mes, operacion.avg_ingresos_mes])

  // Calculated data
  const workingCapital = (cxc.total || 0) - (cxp.total || 0)
  const runway = Math.floor((tesoreria.total_gtq || 0) / 450000) || operacion.runway_meses || 0
  const liquidezRatio = ((tesoreria.total_gtq || 0) + (cxc.total || 0)) / (cxp.total || 1)

  // Insight styles
  const getInsightStyles = (tipo) => {
    switch (tipo) {
      case 'oportunidad': return 'border-l-[var(--success)] bg-[var(--success-bg)]'
      case 'alerta': return 'border-l-[var(--warning)] bg-[var(--warning-bg)]'
      case 'gasto': return 'border-l-[var(--danger)] bg-[var(--danger-bg)]'
      case 'ingreso': return 'border-l-[var(--success)] bg-[var(--success-bg)]'
      default: return 'border-l-[var(--accent-blue)] bg-[var(--info-bg)]'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Ejecutivo</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Distribuidora Industrial Centroamericana, S.A.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {alertas.filter(a => a.nivel === 'critico').length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--danger-bg)]">
              <ExclamationTriangleIcon className="w-4 h-4 text-[var(--danger)]" />
              <span className="text-xs font-medium text-[var(--danger)]">{alertas.filter(a => a.nivel === 'critico').length} crítico(s)</span>
            </div>
          )}
          
          <Link to="/log-actividades" className="btn-secondary text-xs">
            <CpuChipIcon className="w-4 h-4" />
            Agentes IA
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Ventas del Mes</span>
            <ChartBarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">
            {isLoading ? '---' : formatGTQ(animatedValues.ventas || operacion.ventas_mes || operacion.avg_ingresos_mes || 0)}
          </div>
          <span className="text-xs text-[var(--text-muted)]">Promedio mensual</span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Efectivo Disponible</span>
            <BanknotesIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{isLoading ? '---' : formatGTQ(tesoreria.total_gtq || 0)}</div>
          <span className="text-xs text-[var(--text-muted)]">Total bancos GTQ</span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Runway</span>
            <CalendarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{isLoading ? '---' : `${runway} meses`}</div>
          <span className={`text-xs ${runway < 3 ? 'text-[var(--danger)]' : runway < 6 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
            {runway < 3 ? 'Crítico' : runway < 6 ? 'Atención' : 'Saludable'}
          </span>
        </div>

        <div className="kpi-card card-hover">
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

      {/* Runway Calculator - Insight Crítico */}
      <RunwayCalculator 
        saldoActual={tesoreria.total_gtq || 0}
        promedioIngresosMensual={operacion.avg_ingresos_mes || 0}
        promedioGastosMensual={operacion.avg_gastos_mes || 0}
        proyeccionMeses={12}
      />

      {/* Customer Concentration Risk - Insight #1 */}
      <CustomerConcentrationRisk 
        clientes={[
          { id: 1, nombre: 'Constructora Metropolitana', ingresos: 8500000 },
          { id: 2, nombre: 'Grupo Industrial Centroamericano', ingresos: 6200000 },
          { id: 3, nombre: 'Inversiones del Norte', ingresos: 4100000 },
          { id: 4, nombre: 'Distribuidora del Sur', ingresos: 2800000 },
          { id: 5, nombre: 'Comercializadora Maya', ingresos: 1900000 },
          { id: 6, nombre: 'Importadora del Pacífico', ingresos: 1500000 },
          { id: 7, nombre: 'Suministros Industriales', ingresos: 1200000 },
          { id: 8, nombre: 'Ferretería La Unión', ingresos: 800000 },
          { id: 9, nombre: 'Materiales de Construcción XYZ', ingresos: 650000 },
          { id: 10, nombre: 'Otros clientes', ingresos: 1200000 }
        ]}
        umbralAlerta={20}
        umbralCritico={30}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Insights */}
          <div className="card">
            <div className="section-header">
              <SparklesIcon className="w-5 h-5 text-[var(--accent-blue)]" />
              <h2 className="font-semibold">Insights de IA</h2>              
            </div>

            {isLoadingInsights ? (
              <div className="space-y-3 p-5 pt-0">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-[var(--bg-secondary)] rounded animate-pulse" />
                ))}
              </div>
            ) : insights.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <LightBulbIcon className="w-6 h-6" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">No hay insights disponibles</p>
              </div>
            ) : (
              <div className="space-y-3 p-5 pt-0">
                {insights.slice(0, 4).map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${getInsightStyles(insight.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge-${insight.severity === 'critical' ? 'danger' : insight.severity === 'warning' ? 'warning' : 'info'}`}>
                            {insight.severity === 'critical' ? 'alta' : insight.severity === 'warning' ? 'media' : 'baja'}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] uppercase">{insight.category}</span>
                        </div>
                        <h3 className="font-medium text-[var(--text-primary)] text-sm">{insight.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Posición Financiera */}
          <div className="card">
            <div className="section-header">
              <UsersIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Posición Financiera</h2>
              <Link to="/tesoreria" className="ml-auto text-xs text-[var(--accent-blue)] hover:underline">Ver detalle →</Link>
            </div>

            <div className="space-y-4 p-5 pt-0">
              <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cuentas por Cobrar</span>
                    <span className="amount">{formatGTQ(cxc.total || 0)}</span>
                  </div>
                  <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: Math.min(100, (cxc.total > 0 ? (cxc.vencido || 0) / cxc.total * 100 : 0)) + '%' }} />
                  </div>
                  <span className="text-xs text-[var(--danger)] mt-1">{cxc.total > 0 ? Math.round((cxc.vencido || 0) / cxc.total * 100) : 0}% vencido</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cuentas por Pagar</span>
                    <span className="amount">{formatGTQ(cxp.total || 0)}</span>
                  </div>
                  <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] mt-1">{cxp.proximos_vencimientos?.length || 0} vencimientos próximos</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black text-white rounded-lg">
                <div>
                  <span className="text-sm opacity-80">Ratio de Liquidez</span>
                  <p className="text-xs opacity-60">Activo corriente / Pasivo corriente</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold tabular-nums font-mono">{liquidezRatio.toFixed(2)}</span>
                  <p className="text-xs opacity-60">Ideal: &gt; 1.5</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* SAT Vencimientos */}
          <div className="card">
            <div className="flex items-center gap-2 p-5 pb-4 border-b border-[var(--border-default)]">
              <BuildingOfficeIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="font-semibold text-base">SAT - Vencimientos</h2>
              <span className="badge-warning ml-auto">2 urgentes</span>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="p-3 bg-[var(--danger-bg)] rounded-lg border border-[var(--danger)]/20">
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
              
              <div className="p-3 bg-[var(--warning-bg)] rounded-lg border border-[var(--warning)]/20">
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
            
            <Link to="/sat" className="flex items-center justify-center gap-1 w-full py-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors">
              Ver calendario completo
              <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {/* CFO AI Assistant */}
          <div className="card bg-black text-white">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold">CFO AI</h2>
                  <p className="text-xs opacity-70">4 agentes activos</p>
                </div>
              </div>
              
              <p className="text-sm opacity-80 mb-4">
                Agentes inteligentes para análisis financiero, conciliación y cumplimiento fiscal.
              </p>
              
              <Link to="/log-actividades" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-black font-medium rounded-md hover:bg-opacity-90 transition-colors">
                Ver Agentes
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-lg border border-[var(--border-default)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-medium">Agentes</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold tabular-nums">4</span>
                <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-[var(--border-default)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-medium">Insights</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold tabular-nums">{insights.length}</span>
                <span className="text-[10px] text-[var(--accent-blue)]">+nuevo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
