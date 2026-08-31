import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useInsights, useWorkingCapital, useMargenCatalogos, useMargenPaises } from '../hooks/useCfoData'
import PageInsights from '../components/agents/PageInsights'
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
  GlobeAltIcon,
  MapPinIcon,
  ChevronRightIcon,
  SparklesIcon,
  CpuChipIcon,
  ArrowPathIcon,
  FireIcon,
  WalletIcon,
  ReceiptRefundIcon,
  ArrowTrendingUpIcon as TrendIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + Math.round(value).toLocaleString('es-GT')
}

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4']

// Datos demo por país para el dashboard corporativo
const ventasPorPais = [
  { pais: 'Guatemala', codigo: 'GT', ventas: 2850000, tiendas: 6, moneda: 'GTQ' },
  { pais: 'El Salvador', codigo: 'SV', ventas: 1950000, tiendas: 3, moneda: 'USD' },
  { pais: 'Honduras', codigo: 'HN', ventas: 1650000, tiendas: 3, moneda: 'HNL' },
  { pais: 'Costa Rica', codigo: 'CR', ventas: 2100000, tiendas: 3, moneda: 'CRC' },
  { pais: 'Nicaragua', codigo: 'NI', ventas: 980000, tiendas: 2, moneda: 'NIO' },
]

const ventasPorMarca = [
  { marca: 'Moda Urbana', segmento: 'masivo', ventas: 3850000, tiendas: 6, color: '#001639' },
  { marca: 'SportLife', segmento: 'premium', ventas: 2100000, tiendas: 4, color: '#10b981' },
  { marca: 'Casa & Hogar', segmento: 'masivo', ventas: 1650000, tiendas: 3, color: '#f59e0b' },
  { marca: 'TechZone', segmento: 'premium', ventas: 1950000, tiendas: 4, color: '#8b5cf6' },
]

const tiendasTop = [
  { nombre: 'Moda Urbana Oakland', pais: 'Guatemala', marca: 'Moda Urbana', ventas: 520000, margen: 42 },
  { nombre: 'SportLife Paseo Cayalá', pais: 'Guatemala', marca: 'SportLife', ventas: 480000, margen: 45 },
  { nombre: 'TechZone Galerías', pais: 'Guatemala', marca: 'TechZone', ventas: 410000, margen: 38 },
  { nombre: 'Moda Urbana Avenida Escazú', pais: 'Costa Rica', marca: 'Moda Urbana', ventas: 395000, margen: 41 },
  { nombre: 'Casa & Hogar Pradera', pais: 'Guatemala', marca: 'Casa & Hogar', ventas: 380000, margen: 35 },
]

const tendenciaMensual = [
  { mes: 'Ene', gt: 420000, sv: 280000, hn: 240000, cr: 310000, ni: 145000 },
  { mes: 'Feb', gt: 385000, sv: 265000, hn: 220000, cr: 295000, ni: 130000 },
  { mes: 'Mar', gt: 450000, sv: 310000, hn: 260000, cr: 340000, ni: 155000 },
  { mes: 'Abr', gt: 510000, sv: 350000, hn: 295000, cr: 385000, ni: 180000 },
  { mes: 'May', gt: 480000, sv: 330000, hn: 275000, cr: 360000, ni: 165000 },
  { mes: 'Jun', gt: 520000, sv: 360000, hn: 300000, cr: 395000, ni: 190000 },
  { mes: 'Jul', gt: 535000, sv: 370000, hn: 310000, cr: 410000, ni: 195000 },
]

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard()
  const { data: insightsData } = useInsights('dashboard')
  const { data: wcData, isLoading: isLoadingWC } = useWorkingCapital()
  const { data: catalogosData } = useMargenCatalogos()
  const { data: paisesData } = useMargenPaises()
  
  const [animated, setAnimated] = useState(false)
  const [animatedValues, setAnimatedValues] = useState({})

  const tesoreria = dashboardData?.data?.tesoreria || {}
  const cxc = dashboardData?.data?.cxc || {}
  const cxp = dashboardData?.data?.cxp || {}
  const operacion = dashboardData?.data?.operacion || {}
  const alertas = dashboardData?.data?.alertas || []
  const insights = insightsData?.insights || []
  
  const paisesReales = paisesData?.data || []
  const catalogos = catalogosData?.data || {}

  const workingCapital = (cxc.total || 0) - (cxp.total || 0)
  const ccc = wcData?.data?.metricas_principales?.c2c || {}
  const cccValor = ccc.valor || 0
  const cccBenchmark = ccc.benchmark || 33

  const totalVentasMes = ventasPorPais.reduce((s, p) => s + p.ventas, 0)
  const totalTiendas = ventasPorPais.reduce((s, p) => s + p.tiendas, 0)
  const totalMarcas = ventasPorMarca.length
  const totalPaises = ventasPorPais.length

  const alertasCFO = alertas.length > 0
    ? alertas.slice(0, 5).map(a => ({
        tipo: a.nivel === 'critico' ? 'critico' : a.nivel === 'warning' ? 'warning' : 'info',
        mensaje: a.mensaje || a.titulo || 'Alerta',
      }))
    : [
        { tipo: 'critico', mensaje: 'Tienda TechZone Metrocentro SV: margen cayó 8 pts este mes' },
        { tipo: 'warning', mensaje: 'Inventario bajo en 3 tiendas de Nicaragua' },
        { tipo: 'info', mensaje: 'Ventas Julio: Guatemala +7.2% vs mismo mes año anterior' },
      ]

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

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

  // Preparar datos reales si existen
  const paisesChartData = paisesReales.length > 0 ? paisesReales.map(p => ({
    name: p.nombre,
    ventas: parseFloat(p.total_ventas_q) || 0,
    margen: parseFloat(p.margen_pct) || 0,
    tiendas: parseInt(p.num_tiendas) || 0,
  })) : ventasPorPais.map(p => ({
    name: p.pais,
    ventas: p.ventas,
    margen: 40 + Math.random() * 10,
    tiendas: p.tiendas,
  }))

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Dashboard Corporativo</h1>
          <p className="text-xs text-[var(--text-muted)]">Grupo Retail Centroamérica, S.A. — {totalTiendas} tiendas en {totalPaises} países</p>
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

      {/* ═══ KPIs CORPORATIVOS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="kpi-card card-hover p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Ventas Mes</span>
            <TrendIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold">{formatGTQ(totalVentasMes)}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <ArrowTrendingUpIcon className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-600">+4.2% vs LY</span>
          </div>
        </div>

        <div className="kpi-card card-hover p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Tiendas</span>
            <BuildingStorefrontIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold">{totalTiendas}</div>
          <span className="text-[11px] text-[var(--text-muted)]">{totalMarcas} marcas</span>
        </div>

        <div className="kpi-card card-hover p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Países</span>
            <GlobeAltIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold">{totalPaises}</div>
          <span className="text-[11px] text-[var(--text-muted)]">CA + GTQ/USD/HNL/CRC/NIO</span>
        </div>

        <div className="kpi-card card-hover p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Efectivo</span>
            <WalletIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
          <div className="text-lg font-bold">{isLoading ? '---' : formatGTQ(tesoreria.total_gtq || 1250000)}</div>
          <span className="text-[11px] text-[var(--text-muted)]">Disponible consolidado</span>
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
      </div>

      {/* ═══ INSIGHTS DE IA ═══ */}
      <PageInsights context="dashboard" maxInsights={4} title="Insights Inteligentes" />

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

      {/* ═══ SECCIÓN 1: VENTAS POR PAÍS (ANCHO COMPLETO) ═══ */}
      <div className="card">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <GlobeAltIcon className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="font-semibold text-sm">Ventas por País</h2>
          </div>
          <Link to="/margenes" className="text-[11px] text-[var(--accent-blue)] hover:underline">Ver márgenes →</Link>
        </div>
        <div className="px-4 pb-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendenciaMensual} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="gt" name="Guatemala" stackId="1" stroke="#001639" fill="#001639" fillOpacity={0.6} />
                <Area type="monotone" dataKey="cr" name="Costa Rica" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="sv" name="El Salvador" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="hn" name="Honduras" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="ni" name="Nicaragua" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-5 gap-3 mt-3 pt-3 border-t border-[var(--border-default)]">
            {paisesChartData.map((p, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">{p.name}</p>
                <p className="text-sm font-bold">{formatGTQ(p.ventas)}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{p.tiendas} tiendas</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN 2: VENTAS POR MARCA + TOP TIENDAS (2 COLS) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ventas por Marca */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="font-semibold text-sm">Ventas por Marca</h2>
            </div>
            <Link to="/margenes" className="text-[11px] text-[var(--accent-blue)] hover:underline">Ver detalle →</Link>
          </div>
          <div className="px-4 pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasPorMarca} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="marca" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `Q${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ventas" name="Ventas" radius={[3, 3, 0, 0]}>
                    {ventasPorMarca.map((m, i) => (
                      <Cell key={i} fill={m.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border-default)]">
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Marcas</p>
                <p className="text-sm font-bold">{totalMarcas}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Premium</p>
                <p className="text-sm font-bold">2</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Masivo</p>
                <p className="text-sm font-bold">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Tiendas */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="font-semibold text-sm">Top Tiendas por Ventas</h2>
            </div>
            <Link to="/margenes" className="text-[11px] text-[var(--accent-blue)] hover:underline">Ver todas →</Link>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-2.5">
              {tiendasTop.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#001639] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium truncate">{t.nombre}</span>
                      <span className="font-mono text-xs font-semibold">{formatGTQ(t.ventas)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)]">{t.pais}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">•</span>
                      <span className="text-[10px] text-emerald-600">{t.margen}% margen</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN 3: RIESGO + CxC + CxP (3 COLS) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alertas por región */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="font-semibold text-sm">Alertas por Región</h2>
            </div>
          </div>
          <div className="px-4 pb-4 space-y-2">
            <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-red-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">GT</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">TechZone Galerías — Margen en caída</p>
                  <p className="text-[10px] text-[var(--text-muted)]">-8 pts vs mes anterior</p>
                </div>
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">NI</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Inventario bajo en 3 tiendas</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Stock < mínimo en Casa & Hogar</p>
                </div>
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">CR</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Apertura nueva tienda planificada</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Q3 2026 — Avenida Escazú</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CxC Consolidado */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="font-semibold text-sm">CxC Consolidado</h2>
            </div>
            <Link to="/tesoreria" className="text-[11px] text-[var(--accent-blue)]">Ver →</Link>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs">Al Corriente</span>
                </div>
                <span className="font-mono text-xs font-semibold">{formatGTQ(1850000)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs">1-30 días</span>
                </div>
                <span className="font-mono text-xs font-semibold">{formatGTQ(420000)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-xs">31-60 días</span>
                </div>
                <span className="font-mono text-xs font-semibold">{formatGTQ(180000)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-red-700">60+ días</span>
                </div>
                <span className="font-mono text-xs font-semibold text-red-600">{formatGTQ(85000)}</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Total CxC</p>
                <p className="text-sm font-bold font-mono">{formatGTQ(2535000)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--text-muted)] uppercase">Vencido</p>
                <p className="text-sm font-bold font-mono text-amber-600">23.8%</p>
              </div>
            </div>
          </div>
        </div>

        {/* CxP Próximas */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="font-semibold text-sm">CxP Consolidado</h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">4 proveedores en 10 días</span>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {[
              { proveedor: 'Proveedor Textil Centroamérica', monto: 285000, vence: '2 días', pais: 'GT' },
              { proveedor: 'Importadora Electrónica SV', monto: 145000, vence: '5 días', pais: 'SV' },
              { proveedor: 'Logística Express Honduras', monto: 95000, vence: '7 días', pais: 'HN' },
              { proveedor: 'Servicios Retail Costa Rica', monto: 68000, vence: '10 días', pais: 'CR' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded-lg">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.proveedor}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{p.pais} · <span className={p.vence === '2 días' ? 'text-red-500 font-medium' : ''}>{p.vence}</span></p>
                </div>
                <span className="font-mono font-semibold text-xs flex-shrink-0">{formatGTQ(p.monto)}</span>
              </div>
            ))}
            <div className="p-2 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Total CxP</span>
              <span className="text-sm font-bold font-mono">{formatGTQ(1850000)}</span>
            </div>
          </div>
          <Link to="/tesoreria" className="flex items-center justify-center gap-1 w-full py-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors">
            Ver tesorería <ChevronRightIcon className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ═══ SECCIÓN 4: RUNWAY + abaco (2 COLS) ═══ */}
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
                  <p className="text-[10px] opacity-70">4 agentes monitoreando {totalTiendas} tiendas</p>
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
            <div className="p-3 bg-white rounded-lg border border-[var(--border-default)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Países</p>
              <p className="text-base font-bold">{totalPaises}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[var(--border-default)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Marcas</p>
              <p className="text-base font-bold">{totalMarcas}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
