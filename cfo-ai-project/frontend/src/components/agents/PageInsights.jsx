import { useInsights } from '../../hooks/useCfoData'
import { 
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

/**
 * PageInsights - Componente compacto de insights para páginas específicas
 * Muestra insights relevantes al contexto de la página con diseño distintivo
 * 
 * Props:
 * - context: string - contexto de la página ('tesoreria', 'contabilidad', 'analisis', etc.)
 * - maxInsights: number - máximo de insights a mostrar (default: 3)
 * - title: string - título opcional (default según contexto)
 */
export default function PageInsights({ 
  context = 'general', 
  maxInsights = 3,
  title: customTitle
}) {
  const { data: insightsData, isLoading, error } = useInsights()
  
  const insights = insightsData?.insights || []
  
  // Filtrar insights por contexto si es necesario
  const filteredInsights = insights.slice(0, maxInsights)
  
  // Títulos por contexto
  const titles = {
    tesoreria: 'Insights de Tesorería',
    contabilidad: 'Insights Contables',
    analisis: 'Insights de Análisis',
    general: 'Insights de IA'
  }
  
  const title = customTitle || titles[context] || titles.general
  
  // Colores de gradiente por contexto
  const gradients = {
    tesoreria: 'from-emerald-500 to-teal-600',
    contabilidad: 'from-violet-500 to-purple-600',
    analisis: 'from-cyan-500 to-blue-600',
    general: 'from-primary-500 to-primary-600'
  }
  
  const gradient = gradients[context] || gradients.general
  
  // Configuración de iconos por tipo
  const typeConfig = {
    gasto: {
      icon: ArrowTrendingDownIcon,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      border: 'border-rose-100'
    },
    ingreso: {
      icon: ArrowTrendingUpIcon,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    alerta: {
      icon: ExclamationTriangleIcon,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    oportunidad: {
      icon: LightBulbIcon,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      border: 'border-violet-100'
    }
  }
  
  // Configuración de severidad
  const severityConfig = {
    info: { badge: 'bg-blue-100 text-blue-700' },
    warning: { badge: 'bg-amber-100 text-amber-700' },
    critical: { badge: 'bg-rose-100 text-rose-700' }
  }
  
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <SparklesIcon className="w-5 h-5 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  
  if (error || filteredInsights.length === 0) {
    return null // No mostrar nada si hay error o no hay insights
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header distintivo */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Análisis automatizado por IA</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            {filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Lista de insights */}
      <div className="divide-y divide-slate-100">
        {filteredInsights.map((insight, index) => {
          const config = typeConfig[insight.type] || typeConfig.oportunidad
          const severity = severityConfig[insight.severity] || severityConfig.info
          const IconComponent = config.icon
          
          return (
            <div 
              key={insight.id || index} 
              className="p-4 hover:bg-white transition-colors group"
            >
              <div className="flex items-start gap-3">
                {/* Icono */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center`}>
                  <IconComponent className={`w-5 h-5 ${config.color}`} />
                </div>
                
                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severity.badge}`}>
                      {insight.severity === 'critical' ? 'Crítico' : insight.severity === 'warning' ? 'Advertencia' : 'Info'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {insight.description}
                  </p>
                  
                  {/* Impacto si existe */}
                  {insight.impact !== undefined && insight.impact !== 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Impacto:</span>
                      <span className={`text-sm font-bold ${insight.impact > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {insight.impact > 0 ? '+' : '-'}
                        {new Intl.NumberFormat('es-GT', {
                          style: 'currency',
                          currency: insight.currency || 'GTQ',
                          minimumFractionDigits: 0
                        }).format(Math.abs(insight.impact))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
