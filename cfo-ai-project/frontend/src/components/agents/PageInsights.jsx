import { useInsights, useInsightsHistorico } from '../../hooks/useCfoData'
import { endpoints } from '../../services/cfoApi'
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  CpuChipIcon,
  BoltIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid'

/**
 * PageInsights - Sección de Insights de IA prominente e inconfundible
 *
 * Diseño: Header con gradiente animado, badge "POWERED BY AI", tarjetas con
 * borde glow violeta. Es OBVIO que esto viene de inteligencia artificial.
 *
 * Props:
 * - context: string - contexto de la página
 * - maxInsights: number - máximo de insights (default: 3)
 * - title: string - título opcional
 */
export default function PageInsights({
  context = 'general',
  maxInsights = 3,
  title: customTitle
}) {
  const { data: insightsData, isLoading: isLoadingReal } = useInsights(context)
  const { data: historicoData, isLoading: isLoadingHist } = useInsightsHistorico({ limit: maxInsights, days: 30 })

  const hasRealInsights = insightsData?.insights?.length > 0
  const insights = hasRealInsights
    ? insightsData.insights.slice(0, maxInsights)
    : (historicoData?.data?.insights || [])

  const isLoading = isLoadingReal && isLoadingHist

  const titles = {
    tesoreria: 'Insights de Tesorería',
    contabilidad: 'Insights Contables',
    analisis: 'Insights de Análisis',
    ventas: 'Insights de Ventas',
    general: 'Insights de IA'
  }

  const title = customTitle || titles[context] || titles.general

  const typeConfig = {
    gasto: {
      icon: ArrowTrendingDownIcon,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      glow: 'shadow-rose-500/10',
      label: 'Ahorro detectado'
    },
    ingreso: {
      icon: ArrowTrendingUpIcon,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/10',
      label: 'Oportunidad de ingreso'
    },
    alerta: {
      icon: ExclamationTriangleIcon,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/10',
      label: 'Alerta'
    },
    oportunidad: {
      icon: LightBulbIcon,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      glow: 'shadow-violet-500/10',
      label: 'Oportunidad'
    }
  }

  const severityConfig = {
    info: { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    warning: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    critical: { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
  }

  const handleInsightAction = async (insight) => {
    try {
      await endpoints.agents.createLog({
        agente_nombre: 'Usuario',
        agente_tipo: 'user_action',
        categoria: 'accion_insight',
        descripcion: `Acción sobre insight: "${insight.title}"`,
        detalles_json: JSON.stringify({
          insight_id: insight.id,
          insight_type: insight.type,
          action_taken: insight.action || 'Ver detalle',
          context,
          timestamp: new Date().toISOString()
        }),
        resultado_status: 'exitoso'
      })
    } catch (e) { /* silenciar */ }
  }

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-fuchsia-600/5 to-violet-600/5" />
        <div className="relative p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 animate-pulse" />
            <div className="h-4 w-32 bg-violet-500/20 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Empty state ───
  if (insights.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-fuchsia-600/5 to-violet-600/5" />
        <div className="relative p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <CpuChipIcon className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-violet-200">{title}</p>
            <p className="text-xs text-slate-400">Los agentes de IA están analizando tus datos. Insights aparecerán pronto.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-500/30 bg-slate-900">
      {/* Fondo animado sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-slate-900 to-fuchsia-900/10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />

      <div className="relative">
        {/* ═══ HEADER PROMINENTE ═══ */}
        <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Icono IA animado */}
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider">
                  IA
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Análisis automatizado · {insights.length} detectado{insights.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <BoltIcon className="w-3 h-3 text-amber-400" />
            <span>abaco AI</span>
          </div>
        </div>

        {/* ═══ GRID DE INSIGHTS - 2 COLUMNAS ═══ */}
        <div className="px-3 pb-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
          {insights.map((insight, index) => {
            const config = typeConfig[insight.type] || typeConfig.oportunidad
            const severity = severityConfig[insight.severity] || severityConfig.info
            const IconComponent = config.icon

            return (
              <div
                key={insight.id || index}
                className={`group relative p-3 rounded-lg border ${config.border} ${config.bg} ${config.glow} hover:shadow-lg transition-all duration-200 cursor-pointer`}
                onClick={() => handleInsightAction(insight)}
              >
                <div className="flex items-start gap-2.5">
                  {/* Icono tipo */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-md ${config.bg} border ${config.border} flex items-center justify-center`}>
                    <IconComponent className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${severity.badge} uppercase tracking-wider`}>
                        {insight.severity === 'critical' ? 'Crítico' : insight.severity === 'warning' ? 'Advertencia' : 'Info'}
                      </span>
                      <span className={`text-[9px] font-medium ${config.color}`}>{config.label}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                      {insight.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {insight.description}
                    </p>

                    {/* Impacto + acción */}
                    <div className="flex items-center justify-between mt-1.5">
                      {insight.impact !== undefined && insight.impact !== 0 && (
                        <span className={`text-[11px] font-bold ${insight.impact > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {insight.impact > 0 ? '+' : '-'}{new Intl.NumberFormat('es-GT', { style: 'currency', currency: insight.currency || 'GTQ', minimumFractionDigits: 0 }).format(Math.abs(insight.impact))}
                        </span>
                      )}
                      {insight.action && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-violet-300 group-hover:text-violet-200 ml-auto">
                          {insight.actionLabel || 'Ver acción'}
                          <ArrowRightIcon className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
