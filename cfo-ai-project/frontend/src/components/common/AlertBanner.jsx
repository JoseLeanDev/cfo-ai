import { ExclamationTriangleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

const config = {
  critical: {
    icon: ExclamationCircleIcon,
    colors: 'bg-rose-50/80 border-rose-200 text-rose-900',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    glow: 'shadow-glow-danger'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    colors: 'bg-amber-50/80 border-amber-200 text-amber-900',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    glow: ''
  },
  info: {
    icon: InformationCircleIcon,
    colors: 'bg-blue-50/80 border-blue-200 text-blue-900',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    glow: ''
  }
}

export default function AlertBanner({ alerts = [] }) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const { icon: Icon, colors, iconBg, iconColor, glow } = config[alert.level] || config.info
        return (
          <div
            key={alert.id}
            className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm ${colors} ${glow}`}
          >
            <div className="flex items-start gap-4 p-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{alert.message}</p>
                
                {alert.due_date && (
                  <p className="mt-1 text-sm opacity-80">
                    Vence: {new Date(alert.due_date).toLocaleDateString('es-GT')}
                  </p>
                )}
                
                {alert.action_required && (
                  <Link
                    to={alert.action_required}
                    className="inline-flex items-center gap-1 mt-3 text-sm font-semibold hover:underline"
                  >
                    Ver detalle
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
              
              <button className="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                <XMarkIcon className="w-5 h-5 opacity-60" />
              </button>
            </div>
            
            {/* Progress bar for urgency */}
            {alert.level === 'critical' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-200">
                <div className="h-full bg-rose-500 animate-pulse" style={{ width: '60%' }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
