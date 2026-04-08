import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useInsights } from '../hooks/useCfoData'
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
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
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

// Componente para mostrar variación con color
const Variacion = ({ value, inverse = false }) => {
  if (value === undefined || value === null) return null
  
  const isPositive = inverse ? value < 0 : value > 0
  const colorClass = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
  const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

// Componente para icono de insight según tipo
const InsightIcon = ({ tipo, className = "w-5 h-5" }) => {
  switch (tipo) {
    case 'oportunidad':
      return <TrendingUpIcon className={`${className} text-emerald-600`} />
    case 'riesgo':
      return <TrendingDownIcon className={`${className} text-rose-600`} />
    case 'critico':
      return <ExclamationTriangleIcon className={`${className} text-rose-600`} />
    case 'info':
      return <InformationCircleIcon className={`${className} text-blue-600`} />
    default:
      return <LightBulbIcon className={`${className} text-violet-600`} />
  }
}

// Formatear moneda GTQ
const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q0'
  return 'Q' + value.toLocaleString('es-GT')
}

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard()
  const { data: insightsData, isLoading: isLoadingInsights } = useInsights()
  const [animatedValues, setAnimatedValues] = useState({})
  const [showAllInsights, setShowAllInsights] = useState(false)

  const kpis = dashboardData?.data?.kpis || {}
  const insights = insightsData?.data?.insights || []
  const criticalInsights = insights.filter(i => i.tipo === 'critico' || i.prioridad === 'alta')
  const unseenCriticalCount = criticalInsights.filter(i => !i.visto).length

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
  const runway = Math.floor((kpis.disponible_gtq?.value || 0) / 450000) // Gasto mensual estimado

  // Obtener color de borde según tipo de insight
  const getInsightBorderColor = (tipo) => {
    switch (tipo) {
      case 'oportunidad': return 'border-emerald-200 hover:border-emerald-300'
      case 'riesgo': return 'border-amber-200 hover:border-amber-300'
      case 'critico': return 'border-rose-200 hover:border-rose-300'
      case 'info': return 'border-blue-200 hover:border-blue-300'
      default: return 'border-violet-200 hover:border-violet-300'
    }
  }

  // Obtener color de fondo según tipo de insight
  const getInsightBgColor = (tipo) => {
    switch (tipo) {
      case 'oportunidad': return 'bg-emerald-50'
      case 'riesgo': return 'bg-amber-50'
      case 'critico': return 'bg-rose-50'
      case 'info': return 'bg-blue-50'
      default: return 'bg-violet-50'
    }
  }

  // Obtener color de badge según prioridad
  const getPriorityBadge = (prioridad) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-rose-100 text-rose-700'
      case 'media':
        return 'bg-amber-100 text-amber-700'
      case 'baja':
        return 'bg-slate-100 text-slate-600'
      default:
        return 'bg-violet-100 text-violet-700'
    }
  }

  const displayedInsights = showAllInsights ? insights : insights.slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Profesional con Badge de Insights Críticos */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">DICSA - Dashboard Ejecutivo</h1>
              <p className="text-sm text-slate-500">
                Distribuidora Industrial Centroamericana, S.A. • NIT 1234567-8
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Badge flotante de insights críticos sin ver */}
          {unseenCriticalCount > 0 && (
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors">
                <ExclamationTriangleIcon className="w-5 h-5 text-rose-600" />
                <span className="text-sm font-medium text-rose-700">
                  {unseenCriticalCount} insight{unseenCriticalCount > 1 ? 's' : ''} crítico{unseenCriticalCount > 1 ? 's' : ''}
                </span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
              </div>
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white rounded-xl shadow-lg border border-rose-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                <p className="text-xs text-slate-600">Haz clic en "Ver todos los insights" para revisar los insights críticos del Analista Financiero</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">Sistema en línea</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <span className="text-sm text-slate-600">
              {new Date().toLocaleDateString('es-GT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Insights de IA Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Insights de IA</h2>
              <p className="text-sm text-slate-500">Análisis inteligente del Analista Financiero</p>
            </div>
          </div>
          
          {insights.length > 4 && (
            <button
              onClick={() => setShowAllInsights(!showAllInsights)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
            >
              {showAllInsights ? 'Ver menos' : 'Ver todos los insights'}
              <ChevronRightIcon className={`w-4 h-4 transition-transform ${showAllInsights ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoadingInsights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-pulse">
                <div className="h-10 w-10 bg-slate-200 rounded-lg mb-3" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingInsights && insights.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LightBulbIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-medium mb-1">No hay insights disponibles</h3>
            <p className="text-sm text-slate-500">El Analista Financiero está analizando tus datos. Vuelve en unos minutos.</p>
          </div>
        )}

        {/* Insights Grid */}
        {!isLoadingInsights && insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedInsights.map((insight, idx) => (
              <div
                key={idx}
                className={`relative p-4 rounded-xl border ${getInsightBorderColor(insight.tipo)} ${getInsightBgColor(insight.tipo)} transition-all hover:shadow-md group cursor-pointer`}
              >
                {/* Badge de no visto */}
                {!insight.visto && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full border-2 border-white" />
                )}
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                    <InsightIcon tipo={insight.tipo} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getPriorityBadge(insight.prioridad)}`}>
                        {insight.prioridad}
                      </span>
                      {insight.categoria && (
                        <span className="text-[10px] text-slate-500 uppercase">{insight.categoria}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1">
                      {insight.titulo}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {insight.descripcion}
                    </p>
                  </div>
                </div>

                {/* Indicador de acción */}
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-violet-600 transition-colors">
                  <EyeIcon className="w-3 h-3" />
                  <span>Ver detalle</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-sm font-medium">Ventas del Mes</span>
            <ChartBarIcon className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-3xl font-bold">
            {isLoading ? '...' : formatGTQ(animatedValues.ventas || kpis.ventas_mes?.value)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Variacion value={kpis.ventas_mes?.var} />
            <span className="text-xs text-blue-200">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Efectivo Disponible</span>
            <BanknotesIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {isLoading ? '...' : formatGTQ(kpis.disponible_gtq?.value)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {kpis.disponible_gtq?.var > 0 ? '+' : ''}{kpis.disponible_gtq?.var}%
            </span>
            <span className="text-xs text-slate-400">6 cuentas bancarias</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Runway (meses)</span>
            <CalendarIcon className="w-5 h-5 text-violet-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {isLoading ? '...' : runway}
          </div>
          <div className="mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              runway < 3 ? 'bg-rose-100 text-rose-700' : 
              runway < 6 ? 'bg-amber-100 text-amber-700' : 
              'bg-emerald-100 text-emerald-700'
            }`}>
              {runway < 3 ? '⚠️ Crítico' : runway < 6 ? '⚡ Atención' : '✅ Saludable'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Working Capital</span>
            <BoltIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className={`text-3xl font-bold ${workingCapital >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isLoading ? '...' : formatGTQ(workingCapital)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            CxC: {formatGTQ(kpis.cxc_total?.value)} • CxP: {formatGTQ(kpis.cxp_total?.value)}
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posición Financiera */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Posición Financiera</h2>
              <p className="text-sm text-slate-500">Resumen de activos y pasivos corrientes</p>
            </div>
            <Link 
              to="/tesoreria/proyecciones"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver detalle →
            </Link>
          </div>

          <div className="space-y-4">
            {/* CxC */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">Cuentas por Cobrar</span>
                  <span className="text-lg font-bold text-slate-900">{formatGTQ(kpis.cxc_total?.value)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }} />
                  </div>
                  <span className="text-xs text-rose-600 font-medium">82% vencido</span>
                </div>
              </div>
            </div>

            {/* CxP */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">Cuentas por Pagar</span>
                  <span className="text-lg font-bold text-slate-900">{formatGTQ(kpis.cxp_total?.value)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
                  </div>
                  <span className="text-xs text-amber-600 font-medium">Q1.4M en 15 días</span>
                </div>
              </div>
            </div>

            {/* Ratio */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <div>
                <span className="text-sm text-primary-700 font-medium">Ratio de Liquidez</span>
                <p className="text-xs text-primary-600">Activo corriente / Pasivo corriente</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary-700">
                  {((kpis.disponible_gtq?.value || 0) + (kpis.cxc_total?.value || 0)) / (kpis.cxp_total?.value || 1) > 0 
                    ? (((kpis.disponible_gtq?.value || 0) + (kpis.cxc_total?.value || 0)) / (kpis.cxp_total?.value || 1)).toFixed(2) 
                    : '0.00'}
                </span>
                <p className="text-xs text-primary-600">Ideal: {'>'} 1.5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Alertas y Acciones */}
        <div className="space-y-6">
          {/* Próximos Vencimientos SAT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">SAT - Vencimientos</h2>
              <span className="badge-warning">2 urgentes</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-200">
                <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center text-white font-bold">
                  Hoy
                </div>
                <div className="flex-1">
                  <p className="font-medium text-rose-900 text-sm">1ra. Cuota ISR</p>
                  <p className="text-xs text-rose-700">Formulario SAT-2221</p>
                </div>
                <span className="font-bold text-rose-700">Q175K</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  15d
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-900 text-sm">IVA Marzo</p>
                  <p className="text-xs text-amber-700">Formulario SAT-2231</p>
                </div>
                <span className="font-bold text-amber-700">Q185K</span>
              </div>
            </div>
            
            <button className="w-full mt-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-dashed border-slate-300">
              Ver calendario completo →
            </button>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-violet-500/30">
            <h2 className="text-lg font-bold mb-4">¿Necesitas ayuda?</h2>
            <p className="text-sm text-violet-100 mb-4">
              Habla con nuestros agentes de IA para resolver dudas financieras, fiscales o de tesorería.
            </p>
            <button className="w-full py-3 bg-white text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-colors flex items-center justify-center gap-2">
              <BoltIcon className="w-5 h-5" />
              Abrir Asistente CFO AI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
