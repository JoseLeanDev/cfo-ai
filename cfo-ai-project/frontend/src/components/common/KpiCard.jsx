import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid'

export default function KpiCard({ 
  title, 
  value, 
  currency, 
  unit, 
  variance, 
  trend, 
  subtitle, 
  loading,
  variant = 'default' // default, positive, negative, warning
}) {
  const formatValue = () => {
    if (loading) return '---'
    if (currency) {
      return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
      }).format(value || 0)
    }
    if (unit) return `${value || 0} ${unit}`
    return new Intl.NumberFormat('es-GT').format(value || 0)
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpIcon className="w-4 h-4" />
    if (trend === 'down') return <ArrowDownIcon className="w-4 h-4" />
    return <MinusIcon className="w-4 h-4" />
  }

  const getTrendColors = () => {
    if (trend === 'up') return 'text-emerald-600 bg-emerald-50 ring-emerald-600/20'
    if (trend === 'down') return 'text-rose-600 bg-rose-50 ring-rose-600/20'
    return 'text-slate-600 bg-slate-100 ring-slate-600/20'
  }

  const getVariantClass = () => {
    switch (variant) {
      case 'positive': return 'positive'
      case 'negative': return 'negative'
      case 'warning': return 'warning'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="kpi-card animate-pulse">
        <div className="h-4 bg-slate-200 rounded-lg w-1/2 mb-4"></div>
        <div className="h-10 bg-slate-200 rounded-lg w-3/4"></div>
      </div>
    )
  }

  return (
    <div className={`kpi-card card-hover ${getVariantClass()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">
              {formatValue()}
            </span>
            
            {variance !== undefined && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${getTrendColors()}`}>
                {getTrendIcon()}
                {Math.abs(variance)}%
              </span>
            )}
          </div>
          
          {subtitle && (
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-violet-500/10 rounded-full blur-2xl"></div>
    </div>
  )
}
