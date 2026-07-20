import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useInsights, useWorkingCapital } from '../hooks/useCfoData'
import RunwayCalculator from '../components/dashboard/RunwayCalculator'
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
  ArrowPathIcon,
  FireIcon,
  WalletIcon,
  ReceiptRefundIcon,
  DocumentCurrencyDollarIcon,
  ArrowTrendingUpIcon as TrendIcon
} from '@heroicons/react/24/outline'
import { demoClientesConcentracion } from '../data/demoData'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

// ========== DATOS DEMO ==========
const ventasPorLinea = [
  { nombre: 'Línea A', ventas: 1062500, presupuesto: 1000000, margen: 45 },
  { nombre: 'Línea B', ventas: 775000, presupuesto: 800000, margen: 42 },
  { nombre: 'Línea C', ventas: 292500, presupuesto: 280000, margen: 52 },
  { nombre: 'Línea D', ventas: 272000, presupuesto: 300000, margen: 38 },
  { nombre: 'Línea E', ventas: 168750, presupuesto: 150000, margen: 48 },
  { nombre: 'Línea F', ventas: 180000, presupuesto: 200000, margen: 28 },
]

const vendedores = [
  { nombre: 'Carlos Méndez', ventas: 1850000, meta: 1700000, clientes: 12, ticket: 41111, cobranza: 98 },
  { nombre: 'Ana López', ventas: 1420000, meta: 1400000, clientes: 10, ticket: 37368, cobranza: 95 },
  { nombre: 'Sofía Reyes', ventas: 980000, meta: 1100000, clientes: 8, ticket: 35000, cobranza: 92 },
  { nombre: 'Jorge Castañeda', ventas: 720000, meta: 800000, clientes: 6, ticket: 28000, cobranza: 88 },
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

// ─── Análisis de concentración inline ───
function ConcentracionInline({ clientes }) {
  const analisis = useMemo(() => {
    if (!clientes.length) return null
    const sorted = [...clientes].sort((a, b) => b.ingresos - a.ingresos)
    const total = sorted.reduce((s, c) => s + c.ingresos, 0)
    const mayor = sorted[0]
    const top3 = sorted.slice(0, 3)
    const top3Pct = top3.reduce((s, c) => s + (c.ingresos / total) * 100, 0)
    const mayorPct = (mayor.ingresos / total) * 100
    const riesgo = mayorPct >= 30 || top3Pct >= 60 ? 'extremo' : mayorPct >= 20 || top3Pct >= 50 ? 'alto' : 'moderado'
    return { mayor, mayorPct, top3Pct, riesgo, lista: sorted.slice(0, 6) }
  }, [clientes])

  if (!analisis) return null
  const { mayor, mayorPct, top3Pct, riesgo, lista } = analisis
  const esRiesgo = riesgo === 'extremo' || riesgo === 'alto'

  return (
    <div className={`p-3 rounded-lg border-l-4 ${esRiesgo ? 'bg-red-50 border-l-red-500' : 'bg-amber-50 border-l-amber-500'}`}>
      <div className="flex items-center gap-2 mb-2">
        <ExclamationTriangleIcon className={`w-4 h-4 ${esRiesgo ? 'text-red-600' : 'text-amber-600'}`} />
        <span className={`text-xs font-bold uppercase ${esRiesgo ? 'text-red-700' : 'text-amber-700'}`}>
          {esRiesgo ? 'Riesgo Concentración' : 'Atención'}
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">Top 3 = {top3Pct.toFixed(1)}%</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-2">
        <strong>{mayor.nombre}</strong> representa el <strong>{mayorPct.toFixed(1)}%</strong> de ingresos
      </p>
      <div className="space-y-1">
        {lista.map((c, i) => {
          const pct = (c.ingresos / lista.reduce((s, x) => s + x.ingresos, 0) * 100 * (lista.reduce((s, x) => s + x.ingresos, 0) / clientes.reduce((s, x) => s + x.ingresos, 0))) // recalcular % real
          const realPct = (c.ingresos / clientes.reduce((s, x) => s + x.ingresos, 0)) * 100
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)] w-4">{i + 1}</span>
              <span className="text-xs flex-1 truncate">{c.nombre}</span>
              <div className="w-20 h-1.5 bg-white rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${realPct >= 20 ? 'bg-red-400' : realPct >= 10 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min(realPct, 100)}%` }} />
              </div>
              <span className={`text-xs font-medium w-10 text-right ${realPct >= 20 ? 'text-red-600' : ''}`}>{realPct.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
      <Link to="/ventas" className="text-[10px] text-[var(--accent-blue)] hover:underline mt-2 inline-block">
        Ver análisis completo →
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard()
  const { data: insightsData, isLoading: isLoadingInsights } = useInsights('dashboard')
  const { data: wcData, isLoading: isLoadingWC } = useWorkingCapital()
  const [animated, setAnimated] = useState(false)
  const [animatedValues, setAnimatedValues] = useState({})

  const tesoreria = dashboardData?.data?.tesoreria || {}
  const cxc = dashboardData?.data?.cxc || {}
  const cxp = dashboardData?.data?.cxp || {}
  const operacion = dashboardData?.data?.operacion || {}
  const alertas = dashboardData?.data?.alertas || []
  const insights = insightsData?.insights || []

  const workingCapital = (cxc.total || 0) - (cxp.total || 0)
  const ccc = wcData?.data?.metricas_principales?.c2c || {}
  const cccValor = ccc.valor || 0
  const cccBenchmark = ccc.benchmark || 33

  const totalVentasMes = ventasPorLinea.reduce((s, l) => s + l.ventas, 0)
  const totalPresupuesto = ventasPorLinea.reduce((s, l) => s + l.presupuesto, 0)
  const cumplimientoVentas = Math.round((totalVentasMes / totalPresupuesto) * 100)
  const margenPromedio = Math.round(ventasPorLinea.reduce((s, l) => s + l.margen, 0) / ventasPorLinea.length)
  const totalCxC = cxc.total || 2535000
  const totalCxP = cxp.total || 1850000
  const totalVencido = cxcAging.slice(1).reduce((s, a) => s + a.monto, 0)
  const pctVencido = Math.round((totalVencido / totalCxC) * 100)

  const alertasCFO = alertas.length > 0
    ? alertas.slice(0, 5).map(a => ({
        tipo: a.nivel === 'critico' ? 'critico' : a.nivel === 'warning' ? 'warning' : 'info',
        mensaje: a.mensaje || a.titulo || 'Alerta',
      }))
    : [
        { tipo: 'critico', mensaje: 'CxP Proveedor A vence en 2 días (Q285K)' },
        { tipo: 'warning', mensaje: 'Cartera 60+ días creció 15% (Q85K)' },
        { tipo: 'info', mensaje: 'Ventas Julio superan presupuesto en 7.2%' },
      ]

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  useEffect(() => {
    const ventasValue = operacion.ventas_mes || operacion.avg_ingresos_mes || totalVentasMes || 0
    if (ventasValue) {
      const duration = 800, steps = 16, increment = ventasValue / steps
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
      <div className="bg-white p-2.5 rounded-lg shadow-lg border border-[var(--border-default)]">
        <p className="text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
            {p.name}: {formatGTQ(p.value)}
          </p>
        ))}
      </div>
    )
  }

  const getAlertaIcon = (tipo) => {
    if (tipo === 'critico') return <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
    if (tipo === 'warning') return <ClockIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
    return <CheckCircleIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
  }

  const getInsightStyles = (tipo) => {
    switch (tipo) {
      case 'oportunidad': return 'border-l-emerald-400 bg-emerald-50/50'
      case 'alerta': return 'border-l-amber-400 bg-amber-50/50'
      case 'gasto': return 'border-l-red-400 bg-red-50/50'
      case 'ingreso': return 'border-l-emerald-400 bg-emerald-50/50'
      default: return 'border-l-blue-400 bg-blue-50/50'
    }
  }

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Dashboard Ejecutivo</h1>
          <p className="text-xs text-[var(--text-muted)]">Vista general del negocio</p>
        </div>
        <div className="flex items-center gap-2">
          {alertasCFO.filter(a => a.tipo === 'critico').length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50">
              <FireIcon className="w-3 h-3 text-red-600" />
              <span className="text-[11px] font-medium text-red-700">{alertasCFO.filter(a => a.tipo === 'critico').length} crítico</span>
            </div>
          )}
          <Link to="/log-actividades" className="btn-secondary text-[11px] py-1 px-2">
            <CpuChipIcon className="w-3 h-3" /> Agentes
          </Link>
        </div>
      </div>

      {/* ═══ KPIs ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card card-hover p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Ventas del Mes</span>
            <TrendIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold">
            {isLoading ? '---' : formatGTQ(animatedValues.ventas || operacion.ventas_mes || operacion.avg_ingresos_mes || totalVentasMes)}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {cumplimientoVentas >= 100
              ? <ArrowTrendingUpIcon className="w-3 h-3 text-emerald-500" />
              : <ArrowTrendingDownIcon className="w-3 h-3 text-amber-500" />}
            <span className={`text-[11px] font-medium ${cumplimientoVentas >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {cumplimientoVentas}% meta
            </span>
          </div>
        </div>

        <div className="kpi-card card-hover p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Efectivo</span>
            <WalletIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold">{isLoading ? '---' : formatGTQ(tesoreria.total_gtq || 1250000)}</div>
          <span className="text-[11px] text-[var(--text-muted)]">Disponible bancos</span>
        </div>

        <div className="kpi-card card-hover p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">CCC</span>
            <ArrowPathIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold">{isLoading || isLoadingWC ? '---' : `${cccValor}d`}</div>
          <span className={`text-[11px] ${cccValor > cccBenchmark * 1.5 ? 'text-red-500' : cccValor > cccBenchmark ? 'text-amber-500' : 'text-emerald-500'}`}>
            {cccValor > cccBenchmark * 1.5 ? 'Crítico' : cccValor > cccBenchmark ? 'Atención' : 'Óptimo'} vs {cccBenchmark}d
          </span>
        </div>

        <div className="kpi-card card-hover p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Working Capital</span>
            <ReceiptRefundIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
          <div className={`text-lg font-bold ${workingCapital < 0 ? 'text-red-500' : ''}`}>
            {isLoading ? '---' : formatGTQ(workingCapital)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">CxC − CxP</span>
        </div>
      </div>

      {/* ═══ ALERTAS ═══ */}
      {alertasCFO.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alertasCFO.map((a, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border-l-3 text-[11px] ${
              a.tipo === 'critico' ? 'bg-red-50 border-l-red-500 text-red-800' :
              a.tipo === 'warning' ? 'bg-amber-50 border-l-amber-500 text-amber-800' :
              'bg-blue-50 border-l-blue-500 text-blue-800'
            }`}>
              {getAlertaIcon(a.tipo)}
              <span className="font-medium">{a.mensaje}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ SECCIÓN 1: TENDENCIA (ANCHO COMPLETO) ═══ */}
      <div className="card">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="font-semibold text-sm">Tendencia Ventas vs Presupuesto</h2>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">7 meses YTD</span>
        </div>
        <div className="px-4 pb-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendenciaVentas} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#001639" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#001639" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#001639" strokeWidth={2} fill="url(#colorVentas)" />
                <Area type="monotone" dataKey="presupuesto" name="Presupuesto" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[var(--border-default)]">
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Acumulado YTD</p>
              <p className="text-sm font-bold">Q30.1M</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">vs Presupuesto</p>
              <p className="text-sm font-bold text-emerald-600">+4.2%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Meses +Meta</p>
              <p className="text-sm font-bold">5/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN 2: VENTAS + VENDEDORES (2 COLS) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ventas por Línea */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <ShoppingBagIcon className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="font-semibold text-sm">Ventas por Línea</h2>
            </div>
            <Link to="/ventas" className="text-[11px] text-[var(--accent-blue)] hover:underline">Ver detalle →</Link>
          </div>
          <div className="px-4 pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasPorLinea} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border-default)]">
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Margen</p>
                <p className="text-sm font-bold text-emerald-600">{margenPromedio}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Sobre Meta</p>
                <p className="text-sm font-bold">{ventasPorLinea.filter(l => l.ventas >= l.presupuesto).length}/6</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Mejor</p>
                <p className="text-sm font-bold">Línea C 52%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vendedores */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="font-semibold text-sm">Desempeño Vendedores</h2>
            </div>
            <Link to="/ventas" className="text-[11px] text-[var(--accent-blue)] hover:underline">Pipeline →</Link>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-2 mb-3">
              {vendedores.map((v, i) => {
                const cumplimiento = Math.round((v.ventas / v.meta) * 100)
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#001639] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {v.nombre.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">{v.nombre}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          cumplimiento >= 100 ? 'bg-emerald-100 text-emerald-700' :
                          cumplimiento >= 90 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{cumplimiento}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mt-0.5">
                        <div className="h-full rounded-full transition-all duration-1000" style={{
                          width: animated ? `${Math.min(100, cumplimiento)}%` : '0%',
                          backgroundColor: cumplimiento >= 100 ? '#10b981' : cumplimiento >= 90 ? '#f59e0b' : '#ef4444'
                        }} />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-medium flex-shrink-0">{formatGTQ(v.ventas)}</span>
                  </div>
                )
              })}
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendedores} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: '#374151' }} width={75} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ventas" name="Ventas" fill="#001639" radius={[0, 3, 3, 0]} barSize={12} />
                  <Bar dataKey="meta" name="Meta" fill="#cbd5e1" radius={[0, 3, 3, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN 3: RIESGO + CxC + CxP (3 COLS balanceadas) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Concentración — compacto inline */}
        <ConcentracionInline clientes={demoClientesConcentracion} />

        {/* CxC Aging */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="font-semibold text-sm">CxC Aging</h2>
            </div>
            <Link to="/tesoreria/cuentas-por-cobrar" className="text-[11px] text-[var(--accent-blue)]">Ver →</Link>
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cxcAging} cx="50%" cy="50%" innerRadius={24} outerRadius={40} paddingAngle={2} dataKey="monto">
                      {cxcAging.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1">
                {cxcAging.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="text-[var(--text-secondary)]">{a.rango}</span>
                    </div>
                    <span className="font-mono font-medium">{formatGTQ(a.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 p-2 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Total CxC</p>
                <p className="text-sm font-bold font-mono">{formatGTQ(totalCxC)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Vencido</p>
                <p className={`text-sm font-bold font-mono ${pctVencido > 20 ? 'text-red-500' : 'text-emerald-500'}`}>{pctVencido}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* CxP Próximas */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="font-semibold text-sm">CxP Próximas</h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">{cxpProximas.length} en 10 días</span>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {cxpProximas.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded-lg">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.proveedor}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{p.tipo} · <span className={p.vence === '2 días' ? 'text-red-500 font-medium' : ''}>{p.vence}</span></p>
                </div>
                <span className="font-mono font-semibold text-xs flex-shrink-0">{formatGTQ(p.monto)}</span>
              </div>
            ))}
            <div className="p-2 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Total CxP</span>
              <span className="text-sm font-bold font-mono">{formatGTQ(totalCxP)}</span>
            </div>
          </div>
          <Link to="/tesoreria/cuentas-por-pagar" className="flex items-center justify-center gap-1 w-full py-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors">
            Ver todas <ChevronRightIcon className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ═══ SECCIÓN 4: PIPELINE + SAT (2 COLS) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="font-semibold text-sm">Pipeline de Órdenes</h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">{produccionPipeline.reduce((s, p) => s + p.cantidad, 0)} activas</span>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-2.5">
              {produccionPipeline.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#001639] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {p.cantidad}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-medium">{p.etapa}</p>
                      <span className="font-mono text-xs font-semibold">{formatGTQ(p.monto)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#001639] rounded-full transition-all duration-1000"
                        style={{ width: animated ? `${(p.cantidad / 45) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2.5 bg-[#001639] text-white rounded-lg flex items-center justify-between">
              <div>
                <p className="text-[10px] opacity-70 uppercase">Valor Pipeline</p>
                <p className="text-base font-bold">{formatGTQ(produccionPipeline.reduce((s, p) => s + p.monto, 0))}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-70 uppercase">Conversión Est.</p>
                <p className="text-base font-bold">78%</p>
              </div>
            </div>
          </div>
        </div>

        {/* SAT Vencimientos */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="font-semibold text-sm">SAT — Vencimientos</h2>
            </div>
            <span className="badge-warning text-[10px]">2 urgentes</span>
          </div>
          <div className="px-4 pb-4 space-y-2">
            <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-red-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">HOY</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">1ra. Cuota ISR <span className="text-[10px] text-[var(--text-muted)]">SAT-2221</span></p>
                </div>
                <span className="font-mono text-sm font-bold text-red-600 flex-shrink-0">Q175K</span>
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">15d</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">IVA Marzo <span className="text-[10px] text-[var(--text-muted)]">SAT-2231</span></p>
                </div>
                <span className="font-mono text-sm font-bold text-amber-600 flex-shrink-0">Q185K</span>
              </div>
            </div>
            <Link to="/sat" className="flex items-center justify-center gap-1 w-full py-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors">
              Ver calendario <ChevronRightIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN 5: INSIGHTS (ANCHO COMPLETO, COMPACTO) ═══ */}
      {insights.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="font-semibold text-sm">Insights de IA</h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">{insights.length} detectados</span>
          </div>
          <div className="px-4 pb-4">
            {isLoadingInsights ? (
              <div className="flex gap-3">
                {[1, 2, 3].map(i => <div key={i} className="flex-1 h-16 bg-[var(--bg-secondary)] rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {insights.slice(0, 6).map((insight, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border-l-3 ${getInsightStyles(insight.type)}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        insight.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        insight.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {insight.severity === 'critical' ? 'alta' : insight.severity === 'warning' ? 'media' : 'baja'}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase">{insight.category}</span>
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)] text-xs leading-snug">{insight.title}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{insight.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SECCIÓN 6: RUNWAY + abaco (2 COLS) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RunwayCalculator
            saldoActual={tesoreria.total_gtq || 0}
            promedioIngresosMensual={operacion.avg_ingresos_mes || 0}
            promedioGastosMensual={operacion.avg_gastos_mes || 0}
            proyeccionMeses={12}
          />
        </div>
        <div className="space-y-3">
          <div className="card bg-[#001639] text-white">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4" />
                <div>
                  <h2 className="font-semibold text-sm">abaco Assistant</h2>
                  <p className="text-[10px] opacity-70">4 agentes activos</p>
                </div>
              </div>
              <Link to="/log-actividades" className="flex items-center justify-center gap-1 w-full py-2 bg-white text-[#001639] text-xs font-medium rounded-md hover:bg-opacity-90 transition-colors">
                Ver Agentes <ChevronRightIcon className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white rounded-lg border border-[var(--border-default)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Agentes</p>
              <p className="text-base font-bold">4 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-1"></span></p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[var(--border-default)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Insights</p>
              <p className="text-base font-bold">{insights.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
