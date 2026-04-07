import { useDashboard, useAlertas } from '../hooks/useCfoData'
import KpiCard from '../components/common/KpiCard'
import AlertBanner from '../components/common/AlertBanner'
import { 
  ArrowTrendingUpIcon, 
  CalendarIcon, 
  BoltIcon,
  DocumentArrowDownIcon,
  CalculatorIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard()
  const { data: alertasData } = useAlertas()

  const kpis = dashboardData?.data?.kpis || {}
  const alerts = alertasData?.data?.alertas || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Bienvenido de vuelta, aquí está el resumen de hoy
          </p>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <CalendarIcon className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            {new Date().toLocaleDateString('es-GT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Ventas del Mes"
          value={kpis.ventas_mes?.value}
          currency={kpis.ventas_mes?.currency}
          variance={kpis.ventas_mes?.var}
          trend="up"
          subtitle="vs mes anterior"
          loading={isLoading}
          variant="positive"
        />
        
        <KpiCard
          title="Disponible GTQ"
          value={kpis.disponible_gtq?.value}
          currency={kpis.disponible_gtq?.currency}
          trend="stable"
          loading={isLoading}
        />
        
        <KpiCard
          title="Días de Operación"
          value={kpis.dias_operacion?.value}
          unit="días"
          trend={kpis.dias_operacion?.trend}
          loading={isLoading}
          variant={kpis.dias_operacion?.value < 30 ? 'warning' : 'default'}
        />
        
        <KpiCard
          title="CxC Total"
          value={kpis.cxc_total?.value}
          currency={kpis.cxc_total?.currency}
          variance={kpis.cxc_total?.var}
          trend="down"
          loading={isLoading}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SAT Vencimientos */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Próximos Vencimientos SAT</h2>
            </div>
            <span className="badge-warning">2 pendientes</span>
          </div>
          
          <div className="space-y-4">
            <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-rose-100/50 rounded-xl border border-rose-200/50 cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/30">
                  31
                </div>
                <div>
                  <p className="font-semibold text-rose-900">1ra. Cuota ISR 2026</p>
                  <p className="text-sm text-rose-700">⚠️ Vence hoy • Formulario SAT-2221</p>
                </div>
              </div>
              <span className="text-xl font-bold text-rose-700">Q175,000</span>
            </div>
            
            <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50 cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/30">
                  15
                </div>
                <div>
                  <p className="font-semibold text-amber-900">IVA Marzo 2026</p>
                  <p className="text-sm text-amber-700">En 15 días • Formulario SAT-2231</p>
                </div>
              </div>
              <span className="text-xl font-bold text-amber-700">Q185,000</span>
            </div>
          </div>
          
          <button className="w-full mt-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
            Ver calendario completo →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <BoltIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Acciones Rápidas</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary">
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Nueva Factura
            </button>
            
            <button className="btn-secondary">
              <CalculatorIcon className="w-5 h-5 mr-2" />
              Cierre Mensual
            </button>
            
            <button className="btn-secondary">
              <BanknotesIcon className="w-5 h-5 mr-2" />
              Conciliar Bancos
            </button>
            
            <button className="btn-secondary">
              <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
              Ver Reportes
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
            <p className="text-sm font-semibold text-violet-900 mb-1">💡 Tip del día</p>
            <p className="text-sm text-violet-700">
              Tus ventas han aumentado 6.7% este mes. Considera renegociar tus inventarios con proveedores.
            </p>
          </div>
        </div>

        {/* Activity / Stats */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Actividad Reciente</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Asientos contables', value: 247, change: '+12 hoy', color: 'bg-blue-500' },
              { label: 'Facturas emitidas', value: 145, change: '+8 hoy', color: 'bg-violet-500' },
              { label: 'Transacciones bancarias', value: 89, change: '+23 hoy', color: 'bg-emerald-500' },
              { label: 'Conciliaciones', value: 4, change: 'Completadas', color: 'bg-amber-500' },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-2 h-12 rounded-full ${stat.color}`} />
                <div className="flex-1">
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
