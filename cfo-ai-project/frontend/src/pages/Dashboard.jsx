import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useInsights, useWorkingCapital } from '../hooks/useCfoData'
import RunwayCalculator from '../components/dashboard/RunwayCalculator'
import CustomerConcentrationRisk from '../components/dashboard/CustomerConcentrationRisk'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line
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
  ArrowPathIcon,
  FireIcon,
  WalletIcon,
  ReceiptRefundIcon,
  DocumentCurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { demoClientesConcentracion } from '../data/demoData'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

// ========== DATOS DEMO GENÉRICOS ==========
const ventasPorLinea = [
  { nombre: 'Línea A', ventas: 1062500, presupuesto: 1000000, margen: 45 },
  { nombre: 'Línea B', ventas: 775000, presupuesto: 800000, margen: 42 },
  { nombre: 'Línea C', ventas: 292500, presupuesto: 280000, margen: 52 },
  { nombre: 'Línea D', ventas: 272000, presupuesto: 300000, margen: 38 },
  { nombre: 'Línea E', ventas: 168750, presupuesto: 150000, margen: 48 },
  { nombre: 'Línea F', ventas: 180000, presupuesto: 200000, margen: 28 },
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
  { proveedor: 'Proveedor A', monto: 285000, vence: '2 días', tipo: 'Materia Prima' },
  { proveedor: 'Proveedor B', monto: 145000, vence: '5 días', tipo: 'Mantenimiento' },
  { proveedor: 'Proveedor C', monto: 95000, vence: '7 días', tipo: 'Logística' },
  { proveedor: 'Proveedor D', monto: 68000, vence: '10 días', tipo: 'Servicios' },
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
    ? alertas.slice(0, 5).map(a => ({
        tipo: a.nivel === 'critico' ? 'critico' : a.nivel === 'warning' ? 'warning' : 'info',
        mensaje: a.mensaje || a.titulo || 'Alerta del sistema',
        accion: a.accion || 'Revisar'
      }))
    : [
        { tipo: 'critico', mensaje: 'CxP Proveedor A vence en 2 días (Q285K)', accion: 'Pagar ahora' },
        { tipo: 'warning', mensaje: 'Vendedor 3 está 11% bajo meta de ventas', accion: 'Revisar pipeline' },
        { tipo: 'warning', mensaje: 'Cartera 60+ días creció 15% (Q85K)', accion: 'Activar cobranza' },
        { tipo: 'info', mensaje: 'Ventas Julio superan presupuesto en 7.2%', accion: 'Ver detalle' },
        { tipo: 'info', mensaje: 'Línea C alcanzó margen récord del 52%', accion: 'Analizar' },
      ]

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  useEffect(() => {
    const ventasValue = operacion.ventas_mes || operacion.avg_ingresos_mes || totalVentasMes || 0
    if (ventasValue) {
      const duration = 1000, steps = 20, increment = ventasValue / steps
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

  const getAlertaIcon = (tipo) => {
    if (tipo === 'critico') return <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
    if (tipo === 'warning') return <ClockIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
    return <CheckCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
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

  // ─── KPI Mini card helper ───
  const KpiMini = ({ label, value, icon: Icon, color = 'text-[var(--text-primary)]', subtext }) => (
    <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
      <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[var(--text-muted)] uppercase font-medium leading-tight">{label}</p>
        <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
        {subtext && <p className="text-[10px] text-[var(--text-muted)]">{subtext}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-7xl">
      {/* ═══════════════════════════════════════
          HEADER
          ═══════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Ejecutivo</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {isLoading ? 'Cargando datos...' : `Vista general del negocio · Actualizado`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {alertasCFO.filter(a => a.tipo === 'critico').length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50">
              <FireIcon className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-medium text-red-700">
                {alertasCFO.filter(a => a.tipo === 'critico').length} crítico(s)
              </span>
            </div>
          )}
          <Link to="/log-actividades" className="btn-secondary text-xs py-1.5">
            <CpuChipIcon className="w-3.5 h-3.5" />
            Agentes IA
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECCIÓN 1: KPIs CRÍTICOS (4 tarjetas)
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-1.5">
            <span className="kpi-label">Ventas del Mes</span>
            <ArrowTrendingUpIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value text-xl">
            {isLoading ? '---' : formatGTQ(animatedValues.ventas || operacion.ventas_mes || operacion.avg_ingresos_mes || totalVentasMes)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {cumplimientoVentas >= 100 ? (
              <ArrowTrendingUpIcon className="w-3 h-3 text-[var(--success)]" />
            ) : (
              <ArrowTrendingDownIcon className="w-3 h-3 text-[var(--warning)]" />
            )}
            <span className={`text-[11px] font-medium ${cumplimientoVentas >= 100 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
              {cumplimientoVentas}% meta
            </span>
          </div>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-1.5">
            <span className="kpi-label">Efectivo</span>
            <WalletIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value text-xl">
            {isLoading ? '---' : formatGTQ(tesoreria.total_gtq || efectivo)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Disponible bancos GTQ</span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-1.5">
            <span className="kpi-label">CCC</span>
            <ArrowPathIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value text-xl">
            {isLoading || isLoadingWC ? '---' : `${cccValor}d`}
          </div>
          <span className={`text-[11px] ${cccValor > cccBenchmark * 1.5 ? 'text-[var(--danger)]' : cccValor > cccBenchmark ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
            {cccValor > cccBenchmark * 1.5 ? 'Crítico' : cccValor > cccBenchmark ? 'Atención' : 'Óptimo'} vs {cccBenchmark}d
          </span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-1.5">
            <span className="kpi-label">Working Capital</span>
            <ReceiptRefundIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className={`kpi-value text-xl ${workingCapital < 0 ? 'text-[var(--danger)]' : ''}`}>
            {isLoading ? '---' : formatGTQ(workingCapital)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">CxC − CxP</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECCIÓN 2: ALERTAS CFO (compacto, accionable)
          ═══════════════════════════════════════ */}
      {alertasCFO.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
          {alertasCFO.map((a, i) => (
            <div key={i} className={`p-2.5 rounded-lg border-l-3 flex items-start gap-2 ${
              a.tipo === 'critico' ? 'bg-red-50 border-l-red-500' :
              a.tipo === 'warning' ? 'bg-amber-50 border-l-amber-500' :
              'bg-blue-50 border-l-blue-500'
            }`}>
              {getAlertaIcon(a.tipo)}
              <div className="min-w-0">
                <p className={`text-xs font-medium leading-snug ${
                  a.tipo === 'critico' ? 'text-red-800' : a.tipo === 'warning' ? 'text-amber-800' : 'text-blue-800'
                }`}>{a.mensaje}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════
          SECCIÓN 3: TENDENCIA DEL NEGOCIO
          (2 columnas: Ventas vs Presupuesto + Ventas por Línea)
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tendencia Ventas */}
        <div className="card">
          <div className="section-header pb-3">
            <ChartBarIcon className="w-5 h-5 text-[var(--accent-blue)]" />
            <h2 className="font-semibold">Tendencia Ventas vs Presupuesto</h2>
            <span className="ml-auto text-xs text-[var(--text-muted)]">7 meses</span>
          </div>
          <div className="p-5 pt-0">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tendenciaVentas} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#001639" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#001639" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000000).toFixed(1)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#001639" strokeWidth={2.5} fill="url(#colorVentas)" />
                  <Area type="monotone" dataKey="presupuesto" name="Presupuesto" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[var(--border-default)]">
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Acumulado YTD</p>
                <p className="text-base font-bold">Q30.1M</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">vs Presupuesto</p>
                <p className="text-base font-bold text-[var(--success)]">+4.2%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Meses +Meta</p>
                <p className="text-base font-bold">5/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ventas por Línea */}
        <div className="card">
          <div className="section-header pb-3">
            <ShoppingBagIcon className="w-5 h-5 text-[var(--accent-blue)]" />
            <h2 className="font-semibold">Ventas por Línea de Producto</h2>
            <Link to="/ventas" className="ml-auto text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-0.5">
              Ver detalle <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 pt-0">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasPorLinea} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ventas" name="Ventas" fill="#001639" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="presupuesto" name="Meta" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[var(--border-default)]">
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Margen Prom.</p>
                <p className="text-base font-bold text-[var(--success)]">{margenPromedio}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Sobre Meta</p>
                <p className="text-base font-bold">{ventasPorLinea.filter(l => l.ventas >= l.presupuesto).length}/6</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Mejor Margen</p>
                <p className="text-base font-bold">Línea C 52%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECCIÓN 4: RIESGO + COBRANZA
          (Concentración + CxC Aging + CxP — 3 columnas)
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer Concentration */}
        <CustomerConcentrationRisk
          clientes={demoClientesConcentracion}
          umbralAlerta={20}
          umbralCritico={30}
        />

        {/* CxC Aging */}
        <div className="card">
          <div className="section-header pb-3">
            <UsersIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Cuentas por Cobrar</h2>
            <Link to="/tesoreria/cuentas-por-cobrar" className="ml-auto text-xs text-[var(--accent-blue)] hover:underline">Ver →</Link>
          </div>
          <div className="p-5 pt-0">
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cxcAging} cx="50%" cy="50%" innerRadius={28} outerRadius={45} paddingAngle={2} dataKey="monto">
                      {cxcAging.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {cxcAging.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="text-[var(--text-secondary)]">{a.rango}</span>
                    </div>
                    <span className="font-mono font-medium">{formatGTQ(a.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 p-2.5 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Total CxC</p>
                <p className="text-sm font-bold font-mono">{formatGTQ(totalCxC)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">% Vencido</p>
                <p className={`text-sm font-bold font-mono ${pctVencido > 20 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{pctVencido}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* CxP Próximas */}
        <div className="card">
          <div className="section-header pb-3">
            <BuildingOfficeIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Cuentas por Pagar</h2>
            <span className="text-xs text-[var(--text-muted)]">{cxpProximas.length} en 10 días</span>
          </div>
          <div className="p-5 pt-0 space-y-2">
            {cxpProximas.map((p, i) => (
              <div key={i} className="p-2.5 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.proveedor}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{p.tipo} · <span className={p.vence === '2 días' ? 'text-[var(--danger)] font-medium' : ''}>{p.vence}</span></p>
                </div>
                <span className="font-mono font-semibold text-sm flex-shrink-0">{formatGTQ(p.monto)}</span>
              </div>
            ))}
            <div className="mt-2 p-2.5 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Total CxP</p>
              <p className="text-sm font-bold font-mono">{formatGTQ(totalCxP)}</p>
            </div>
          </div>
          <Link to="/tesoreria/cuentas-por-pagar" className="flex items-center justify-center gap-1 w-full py-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors">
            Ver todas <ChevronRightIcon className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECCIÓN 5: EQUIPO + OPERACIONES
          (Vendedores + Pipeline — 2 columnas)
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Desempeño Vendedores */}
        <div className="card">
          <div className="section-header pb-3">
            <UsersIcon className="w-5 h-5 text-[var(--accent-blue)]" />
            <h2 className="font-semibold">Desempeño de Vendedores</h2>
            <Link to="/ventas" className="ml-auto text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-0.5">
              Pipeline <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 pt-0">
            {/* Cards compactos */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {vendedores.map((v, i) => {
                const cumplimiento = Math.round((v.ventas / v.meta) * 100)
                return (
                  <div key={i} className="p-2.5 bg-[var(--bg-secondary)] rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold truncate">{v.nombre}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        cumplimiento >= 100 ? 'bg-green-100 text-green-700' :
                        cumplimiento >= 90 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{cumplimiento}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full transition-all duration-1000" style={{
                        width: animated ? `${Math.min(100, cumplimiento)}%` : '0%',
                        backgroundColor: cumplimiento >= 100 ? '#10b981' : cumplimiento >= 90 ? '#f59e0b' : '#ef4444'
                      }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>{formatGTQ(v.ventas)}</span>
                      <span>{v.clientes} cli · {v.cobranza}% cob</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Gráfica */}
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendedores} layout="vertical" margin={{ top: 0, right: 10, left: 70, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: '#374151' }} width={65} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ventas" name="Ventas" fill="#001639" radius={[0, 3, 3, 0]} barSize={14} />
                  <Bar dataKey="meta" name="Meta" fill="#cbd5e1" radius={[0, 3, 3, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pipeline de Producción */}
        <div className="card">
          <div className="section-header pb-3">
            <TruckIcon className="w-5 h-5 text-[var(--accent-blue)]" />
            <h2 className="font-semibold">Pipeline de Órdenes</h2>
            <span className="ml-auto text-xs text-[var(--text-muted)]">{produccionPipeline.reduce((s, p) => s + p.cantidad, 0)} activas</span>
          </div>
          <div className="p-5 pt-0">
            <div className="space-y-3">
              {produccionPipeline.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#001639] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {p.cantidad}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-medium">{p.etapa}</p>
                      <span className="font-mono text-xs font-semibold">{formatGTQ(p.monto)}</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#001639] rounded-full transition-all duration-1000"
                        style={{ width: animated ? `${(p.cantidad / 45) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-[#001639] text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] opacity-70 uppercase">Valor en Pipeline</p>
                  <p className="text-lg font-bold">{formatGTQ(produccionPipeline.reduce((s, p) => s + p.monto, 0))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-70 uppercase">Conversión Est.</p>
                  <p className="text-lg font-bold">78%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECCIÓN 6: INSIGHTS + SAT + HERRAMIENTAS
          (3 columnas: Insights | SAT Vencimientos | Mini herramientas)
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Insights de IA */}
        <div className="card lg:col-span-1">
          <div className="section-header pb-3">
            <SparklesIcon className="w-5 h-5 text-[var(--accent-blue)]" />
            <h2 className="font-semibold">Insights de IA</h2>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">{insights.length} detectados</span>
          </div>
          {isLoadingInsights ? (
            <div className="space-y-2 p-5 pt-0">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded animate-pulse" />)}
            </div>
          ) : insights.length === 0 ? (
            <div className="empty-state py-6">
              <LightBulbIcon className="w-6 h-6 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)] mt-1">No hay insights nuevos</p>
            </div>
          ) : (
            <div className="space-y-2 p-5 pt-0">
              {insights.slice(0, 4).map((insight, idx) => (
                <div key={idx} className={`p-3 rounded-lg border-l-3 ${getInsightStyles(insight.type)}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`badge-${insight.severity === 'critical' ? 'danger' : insight.severity === 'warning' ? 'warning' : 'info'} text-[10px] px-1.5 py-0.5`}>
                      {insight.severity === 'critical' ? 'alta' : insight.severity === 'warning' ? 'media' : 'baja'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">{insight.category}</span>
                  </div>
                  <h3 className="font-medium text-[var(--text-primary)] text-xs leading-snug">{insight.title}</h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{insight.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SAT Vencimientos */}
        <div className="card">
          <div className="section-header pb-3">
            <BuildingOfficeIcon className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="font-semibold text-sm">SAT — Vencimientos</h2>
            <span className="badge-warning text-[10px] ml-auto">2 urgentes</span>
          </div>
          <div className="p-5 pt-0 space-y-2">
            <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-red-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">HOY</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">1ra. Cuota ISR</p>
                  <p className="text-[10px] text-[var(--text-muted)]">SAT-2221</p>
                </div>
                <span className="font-mono text-sm font-bold text-red-600 flex-shrink-0">Q175K</span>
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">15d</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">IVA Marzo</p>
                  <p className="text-[10px] text-[var(--text-muted)]">SAT-2231</p>
                </div>
                <span className="font-mono text-sm font-bold text-amber-600 flex-shrink-0">Q185K</span>
              </div>
            </div>
            <Link to="/sat" className="flex items-center justify-center gap-1 w-full py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors mt-2">
              Ver calendario <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Mini herramientas + Agentes */}
        <div className="space-y-4">
          {/* Runway Calculator — compacto, al final */}
          <RunwayCalculator
            saldoActual={tesoreria.total_gtq || 0}
            promedioIngresosMensual={operacion.avg_ingresos_mes || 0}
            promedioGastosMensual={operacion.avg_gastos_mes || 0}
            proyeccionMeses={12}
          />

          {/* abaco Assistant */}
          <div className="card bg-[#001639] text-white">
            <div className="p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">abaco Assistant</h2>
                  <p className="text-[10px] opacity-70">4 agentes activos</p>
                </div>
              </div>
              <Link to="/log-actividades" className="flex items-center justify-center gap-1.5 w-full py-2 bg-white text-[#001639] text-xs font-medium rounded-md hover:bg-opacity-90 transition-colors">
                Ver Agentes <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <KpiMini label="Agentes Activos" value="4" icon={CpuChipIcon} color="text-[var(--accent-blue)]" subtext="Todos operando" />
            <KpiMini label="Insights Hoy" value={insights.length} icon={LightBulbIcon} color="text-[var(--warning)]" subtext="+2 nuevos" />
            <KpiMini label="Ratio Liquidez" value={liquidezRatio.toFixed(2)} icon={BanknotesIcon} color={liquidezRatio < 1 ? 'text-[var(--danger)]' : 'text-[var(--success)]'} subtext={liquidezRatio < 1 ? 'Bajo' : 'Sano'} />
            <KpiMini label="Ticket Prom." value="Q35,200" icon={DocumentCurrencyDollarIcon} color="text-[var(--accent-blue)]" subtext="↑ 3% vs mes ant." />
          </div>
        </div>
      </div>
    </div>
  )
}
