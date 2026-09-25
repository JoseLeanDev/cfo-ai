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
    if (trend === 'up') return 'text-verified bg-verified-50 ring-verified'
    if (trend === 'down') return 'text-breach bg-breach-50 ring-breach'
    return 'text-graphite bg-paper ring-slate-600/20'
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
        <div className="h-4 bg-fog rounded-card w-1/2 mb-4"></div>
        <div className="h-10 bg-fog rounded-card w-3/4"></div>
      </div>
    )
  }

  return (
    <div className={`kpi-card card-hover ${getVariantClass()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate">{title}</p>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-ink tracking-tight">
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
            <p className="mt-2 text-sm text-slate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-ink from-primary-500/10 rounded-full blur-2xl"></div>
    </div>
  )
}
