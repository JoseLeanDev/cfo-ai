import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useInsights, useWorkingCapital } from '../hooks/useCfoData'
import RunwayCalculator from '../components/dashboard/RunwayCalculator'
import CustomerConcentrationRisk from '../components/dashboard/CustomerConcentrationRisk'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  TruckIcon,
  ChevronRightIcon,
  SparklesIcon,
  LightBulbIcon,
  CpuChipIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { demoClientesConcentracion } from '../data/demoData'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

// ========== DATOS DEMO GENÉRICOS ==========

const ventasPorLinea = [
  { nombre: 'Línea A - Estándar', ventas: 1062500, presupuesto: 1000000, margen: 45 },
  { nombre: 'Línea B - Envases', ventas: 775000, presupuesto: 800000, margen: 42 },
  { nombre: 'Línea C - Laminados', ventas: 292500, presupuesto: 280000, margen: 52 },
  { nombre: 'Línea D - Polietileno', ventas: 272000, presupuesto: 300000, margen: 38 },
  { nombre: 'Línea E - Farmacéutica', ventas: 168750, presupuesto: 150000, margen: 48 },
  { nombre: 'Línea F - Industrial', ventas: 180000, presupuesto: 200000, margen: 28 },
]

const vendedores = [
  { nombre: 'Vendedor 1', ventas: 1850000, meta: 1700000, clientes: 12, ticket: 41111, cobranza: 98 },
  { nombre: 'Vendedor 2', ventas: 1420000, meta: 1400000, clientes: 10, ticket: 37368, cobranza: 95 },
  { nombre: 'Vendedor 3', ventas: 980000, meta: 1100000, clientes: 8, ticket: 35000, cobranza: 92 },
  { nombre: 'Vendedor 4', ventas: 720000, meta: 800000, clientes: 6, ticket: 28000, cobranza: 88 },
]

const cxcAging = [
  { rango: 'Al Corriente', monto: 1850000, color: '#10b981' },
  { rango: '1-30 días', monto: 420000, color: '#f59e0b' },
  { rango: '31-60 días', monto: 180000, color: '#f97316' },
  { rango: '60+ días', monto: 85000, color: '#ef4444' },
]

const cxpProximas = [
  { proveedor: 'Proveedor Principal A', monto: 285000, vence: '2 días', tipo: 'Materia Prima' },
  { proveedor: 'Proveedor de Equipo', monto: 145000, vence: '5 días', tipo: 'Mantenimiento' },
  { proveedor: 'Transporte y Logística', monto: 95000, vence: '7 días', tipo: 'Logística' },
  { proveedor: 'Servicios Técnicos', monto: 68000, vence: '10 días', tipo: 'Servicios' },
]

const tendenciaVentas = [
  { mes: 'Ene', ventas: 4200000, presupuesto: 4000000 },
  { mes: 'Feb', ventas: 3850000, presupuesto: 4000000 },
  { mes: 'Mar', ventas: 4500000, presupuesto: 4200000 },
  { mes: 'Abr', ventas: 5100000, presupuesto: 4500000 },
  { mes: 'May', ventas: 4800000, presupuesto: 4600000 },
  { mes: 'Jun', ventas: 5200000, presupuesto: 4800000 },
  { mes: 'Jul', ventas: 5358000, presupuesto: 5000000 },
]

const produccionPipeline = [
  { etapa: 'Órdenes Nuevas', cantidad: 45, monto: 2850000 },
  { etapa: 'En Producción', cantidad: 32, monto: 1950000 },
  { etapa: 'Envasado/Empaque', cantidad: 18, monto: 1120000 },
  { etapa: 'Listo para Entrega', cantidad: 12, monto: 780000 },
]

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard()
  const { data: insightsData, isLoading: isLoadingInsights } = useInsights('dashboard')
  const { data: wcData, isLoading: isLoadingWC } = useWorkingCapital()
  const [animated, setAnimated] = useState(false)
  const [animatedValues, setAnimatedValues] = useState({})

  // Datos reales del backend
  const tesoreria = dashboardData?.data?.tesoreria || {}
  const cxc = dashboardData?.data?.cxc || {}
  const cxp = dashboardData?.data?.cxp || {}
  const operacion = dashboardData?.data?.operacion || {}
  const alertas = dashboardData?.data?.alertas || []
  const insights = insightsData?.insights || []

  // Calculados
  const workingCapital = (cxc.total || 0) - (cxp.total || 0)
  const liquidezRatio = ((tesoreria.total_gtq || 0) + (cxc.total || 0)) / (cxp.total || 1)
  const ccc = wcData?.data?.metricas_principales?.c2c || {}
  const cccValor = ccc.valor || 0
  const cccBenchmark = ccc.benchmark || 33

  // Demo calculados
  const totalVentasMes = ventasPorLinea.reduce((s, l) => s + l.ventas, 0)
  const totalPresupuesto = ventasPorLinea.reduce((s, l) => s + l.presupuesto, 0)
  const cumplimientoVentas = Math.round((totalVentasMes / totalPresupuesto) * 100)
  const margenPromedio = Math.round(ventasPorLinea.reduce((s, l) => s + l.margen, 0) / ventasPorLinea.length)
  const totalCxC = cxc.total || 2535000
  const totalCxP = cxp.total || 1850000
  const efectivo = tesoreria.total_gtq || 1250000
  const totalVencido = cxcAging.slice(1).reduce((s, a) => s + a.monto, 0)
  const pctVencido = Math.round((totalVencido / totalCxC) * 100)

  // Alertas combinadas: reales + demo fallback
  const alertasCFO = alertas.length > 0
    ? alertas.slice(0, 4).map(a => ({
        tipo: a.nivel === 'critico' ? 'critico' : a.nivel === 'warning' ? 'warning' : 'info',
        mensaje: a.mensaje || a.titulo || 'Alerta del sistema',
        accion: a.accion || 'Revisar'
      }))
    : [
        { tipo: 'critico', mensaje: 'CxP Proveedor Principal A vence en 2 días (Q285K)', accion: 'Pagar ahora' },
        { tipo: 'warning', mensaje: 'Vendedor 3 está 8% bajo meta de ventas', accion: 'Revisar pipeline' },
        { tipo: 'warning', mensaje: 'Cartera 60+ días creció 15% (Q85K)', accion: 'Activar cobranza' },
        { tipo: 'info', mensaje: 'Ventas Julio superan presupuesto en 7.2%', accion: 'Ver detalle' },
      ]

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  // Animate numbers
  useEffect(() => {
    const ventasValue = operacion.ventas_mes || operacion.avg_ingresos_mes || totalVentasMes || 0
    if (ventasValue) {
      const duration = 1000
      const steps = 20
      const increment = ventasValue / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= ventasValue) { current = ventasValue; clearInterval(timer) }
        setAnimatedValues(prev => ({ ...prev, ventas: Math.floor(current) }))
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [operacion.ventas_mes, operacion.avg_ingresos_mes])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-[var(--border-default)]">
        <p className="text-xs font-medium text-[var(--text-muted)] mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {formatGTQ(p.value)}
          </p>
        ))}
      </div>
    )
  }

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
    <div className="space-y-6 max-w-7xl">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Ejecutivo</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isLoading ? 'Cargando datos...' : `Panel de control actualizado`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {alertasCFO.filter(a => a.tipo === 'critico').length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--danger-bg)]">
              <ExclamationTriangleIcon className="w-4 h-4 text-[var(--danger)]" />
              <span className="text-xs font-medium text-[var(--danger)]">
                {alertasCFO.filter(a => a.tipo === 'critico').length} crítico(s)
              </span>
            </div>
          )}
          <Link to="/log-actividades" className="btn-secondary text-xs">
            <CpuChipIcon className="w-4 h-4" />
            Agentes IA
          </Link>
        </div>
      </div>

      {/* KPIs PRINCIPALES — con datos reales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Ventas del Mes</span>
            <ChartBarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">
            {isLoading ? '---' : formatGTQ(animatedValues.ventas || operacion.ventas_mes || operacion.avg_ingresos_mes || totalVentasMes)}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {cumplimientoVentas >= 100 ? (
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-[var(--success)]" />
            ) : (
              <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-[var(--warning)]" />
            )}
            <span className={`text-xs font-medium ${cumplimientoVentas >= 100 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
              {cumplimientoVentas}% de presupuesto
            </span>
          </div>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Efectivo Disponible</span>
            <BanknotesIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">
            {isLoading ? '---' : formatGTQ(tesoreria.total_gtq || efectivo)}
          </div>
          <span className="text-xs text-[var(--text-muted)]">Total bancos GTQ</span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Cash Conversion Cycle</span>
            <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">
            {isLoading || isLoadingWC ? '---' : `${cccValor} días`}
          </div>
          <span className={`text-xs ${cccValor > cccBenchmark * 1.5 ? 'text-[var(--danger)]' : cccValor > cccBenchmark ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
            {cccValor > cccBenchmark * 1.5 ? 'Crítico' : cccValor > cccBenchmark ? 'Atención' : 'Óptimo'} (vs {cccBenchmark}d)
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

      {/* ALERTAS CFO */}
      {alertasCFO.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {alertasCFO.map((a, i) => (
            <div key={i} className={`p-3.5 rounded-lg border-l-4 flex items-center gap-3 ${
              a.tipo === 'critico' ? 'bg-red-50 border-red-500' :
              a.tipo === 'warning' ? 'bg-amber-50 border-amber-500' :
              'bg-blue-50 border-blue-500'
            }`}>
              {a.tipo === 'critico' ? <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" /> :
               a.tipo === 'warning' ? <ClockIcon className="w-5 h-5 text-amber-600 flex-shrink-0" /> :
               <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />}
              <div>
                <p className={`text-sm font-medium ${
                  a.tipo === 'critico' ? 'text-red-800' : a.tipo === 'warning' ? 'text-amber-800' : 'text-blue-800'
                }`}>{a.mensaje}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          {/* VENTAS POR LÍNEA + TENDENCIA */}
          <div className="card">
            <div className="section-header">
              <ShoppingBagIcon className="w-5 h-5 text-[var(--accent-blue)]" />
              <h2 className="font-semibold">Ventas por Línea de Producto</h2>
              <Link to="/ventas" className="ml-auto text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1">
                Ver detalle <ChevronRightIcon className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasPorLinea} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ventas" name="Ventas Real" fill="#001639" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="presupuesto" name="Presupuesto" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--border-default)]">
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)]">Margen Promedio</p>
                  <p className="text-lg font-bold text-[var(--success)]">{margenPromedio}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)]">Líneas sobre meta</p>
                  <p className="text-lg font-bold">{ventasPorLinea.filter(l => l.ventas >= l.presupuesto).length}/6</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)]">Mejor línea</p>
                  <p className="text-lg font-bold">Línea A</p>
                </div>
              </div>
            </div>
          </div>

          {/* TENDENCIA MENSUAL */}
          <div className="card">
            <div className="section-header">
              <ChartBarIcon className="w-5 h-5 text-[var(--accent-blue)]" />
              <h2 className="font-semibold">Tendencia de Ventas vs Presupuesto</h2>
            </div>
            <div className="p-5 pt-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tendenciaVentas} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#001639" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#001639" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000000).toFixed(1)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#001639" strokeWidth={2.5} fill="url(#colorVentas)" />
                    <Area type="monotone" dataKey="presupuesto" name="Presupuesto" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* DESARROLLO DE VENDEDORES */}
          <div className="card">
            <div className="section-header">
              <UsersIcon className="w-5 h-5 text-[var(--accent-blue)]" />
              <h2 className="font-semibold">Desempeño de Vendedores</h2>
              <Link to="/ventas" className="ml-auto text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1">
                Ver pipeline <ChevronRightIcon className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {vendedores.map((v, i) => {
                  const cumplimiento = Math.round((v.ventas / v.meta) * 100)
                  return (
                    <div key={i} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#001639] text-white flex items-center justify-center text-xs font-bold">
                            {v.nombre.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{v.nombre}</p>
                            <p className="text-xs text-[var(--text-muted)]">{v.clientes} clientes</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          cumplimiento >= 100 ? 'bg-green-100 text-green-700' :
                          cumplimiento >= 90 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{cumplimiento}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[var(--text-muted)]">Ventas</span>
                        <span className="font-mono font-medium">{formatGTQ(v.ventas)}</span>
                      </div>
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full transition-all duration-1000" style={{
                          width: animated ? `${Math.min(100, cumplimiento)}%` : '0%',
                          backgroundColor: cumplimiento >= 100 ? '#10b981' : cumplimiento >= 90 ? '#f59e0b' : '#ef4444'
                        }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>Ticket: {formatGTQ(v.ticket)}</span>
                        <span>Cobranza: {v.cobranza}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendedores} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 12, fill: '#374151' }} width={75} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="ventas" name="Ventas" fill="#001639" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="meta" name="Meta" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Insights de IA */}
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
                  <div key={idx} className={`p-4 rounded-lg border-l-4 ${getInsightStyles(insight.type)}`}>
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
        </div>

        {/* COLUMNA LATERAL */}
        <div className="space-y-6">
          {/* Customer Concentration Risk */}
          <CustomerConcentrationRisk
            clientes={demoClientesConcentracion}
            umbralAlerta={20}
            umbralCritico={30}
          />

          {/* CxC - AGING */}
          <div className="card">
            <div className="section-header">
              <UsersIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Cuentas por Cobrar</h2>
              <Link to="/tesoreria/cuentas-por-cobrar" className="ml-auto text-xs text-[var(--accent-blue)] hover:underline">Ver →</Link>
            </div>
            <div className="p-5">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cxcAging} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="monto">
                      {cxcAging.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {cxcAging.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="text-[var(--text-secondary)]">{a.rango}</span>
                    </div>
                    <span className="font-mono font-medium">{formatGTQ(a.monto)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Total CxC</span>
                  <span className="font-mono font-semibold">{formatGTQ(totalCxC)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-[var(--text-muted)]">% Vencido</span>
                  <span className={`font-mono font-semibold ${pctVencido > 20 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{pctVencido}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* CxP PRÓXIMAS */}
          <div className="card">
            <div className="section-header">
              <BuildingOfficeIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">CxP Próximas</h2>
              <span className="text-xs text-[var(--text-muted)]">{cxpProximas.length} en 10 días</span>
            </div>
            <div className="p-5 space-y-3">
              {cxpProximas.map((p, i) => (
                <div key={i} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.proveedor}</p>
                      <p className="text-xs text-[var(--text-muted)]">{p.tipo} · Vence {p.vence}</p>
                    </div>
                    <span className="font-mono font-semibold text-sm">{formatGTQ(p.monto)}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/tesoreria/cuentas-por-pagar" className="flex items-center justify-center gap-1 w-full py-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors">
              Ver todas las CxP <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {/* PIPELINE DE PRODUCCIÓN */}
          <div className="card">
            <div className="section-header">
              <TruckIcon className="w-5 h-5 text-[var(--accent-blue)]" />
              <h2 className="font-semibold">Pipeline de Producción</h2>
            </div>
            <div className="p-5 space-y-4">
              {produccionPipeline.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#001639] text-white flex items-center justify-center font-bold text-sm">
                    {p.cantidad}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.etapa}</p>
                    <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-[#001639] rounded-full transition-all duration-1000"
                        style={{ width: animated ? `${(p.cantidad / 45) * 100}%` : '0%' }} />
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold">{formatGTQ(p.monto)}</span>
                </div>
              ))}
            </div>
            <div className="p-5 pt-0">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">Total en pipeline: {formatGTQ(produccionPipeline.reduce((s, p) => s + p.monto, 0))}</p>
                <p className="text-xs text-blue-600 mt-1">{produccionPipeline.reduce((s, p) => s + p.cantidad, 0)} órdenes activas</p>
              </div>
            </div>
          </div>

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
                  <div className="w-9 h-9 rounded bg-[var(--danger)] text-white flex items-center justify-center text-xs font-bold">HOY</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">1ra. Cuota ISR</p>
                    <p className="text-xs text-[var(--text-muted)]">SAT-2221</p>
                  </div>
                  <span className="amount text-[var(--danger)]">Q175K</span>
                </div>
              </div>
              <div className="p-3 bg-[var(--warning-bg)] rounded-lg border border-[var(--warning)]/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[var(--warning)] text-white flex items-center justify-center text-xs font-bold">15d</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">IVA Marzo</p>
                    <p className="text-xs text-[var(--text-muted)]">SAT-2231</p>
                  </div>
                  <span className="amount text-[var(--warning)]">Q185K</span>
                </div>
              </div>
            </div>
            <Link to="/sat" className="flex items-center justify-center gap-1 w-full py-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors">
              Ver calendario completo <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {/* abaco Assistant */}
          <div className="card bg-[#001639] text-white">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold">abaco</h2>
                  <p className="text-xs opacity-70">4 agentes activos</p>
                </div>
              </div>
              <p className="text-sm opacity-80 mb-4">
                Agentes inteligentes para análisis financiero, conciliación y cumplimiento fiscal.
              </p>
              <Link to="/log-actividades" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-[#001639] font-medium rounded-md hover:bg-opacity-90 transition-colors">
                Ver Agentes <ChevronRightIcon className="w-4 h-4" />
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
