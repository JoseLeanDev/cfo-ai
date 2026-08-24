import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FireIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BeakerIcon,
  WrenchIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  FlagIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

const formatNum = (value) => {
  if (!value && value !== 0) return '0'
  return value.toLocaleString('es-GT')
}

// ═══════════════════════════════════════════════════════════
// DATOS DEMO - ÓRDENES DE PRODUCCIÓN
// ═══════════════════════════════════════════════════════════

const ETAPAS_PIPELINE = [
  { id: 'nueva', nombre: 'Órdenes Nuevas', color: '#3b82f6', icono: ClipboardDocumentListIcon },
  { id: 'materiales', nombre: 'En Espera de Materiales', color: '#f59e0b', icono: BeakerIcon },
  { id: 'produccion', nombre: 'En Producción', color: '#8b5cf6', icono: WrenchIcon },
  { id: 'qa', nombre: 'Control de Calidad', color: '#ec4899', icono: CheckCircleIcon },
  { id: 'empaque', nombre: 'Envasado/Empaque', color: '#10b981', icono: TruckIcon },
  { id: 'entrega', nombre: 'Listo para Entrega', color: '#001639', icono: FlagIcon },
]

const ORDENES_DEMO = [
  {
    id: 'OP-2026-0842',
    cliente: 'Distribuidora Centroamericana S.A.',
    producto: 'Línea A - SKU-1042',
    cantidad: 2500,
    unidad: 'unidades',
    etapa: 'produccion',
    etapaProgreso: 65,
    fechaOrden: '2026-08-20',
    fechaEntrega: '2026-09-05',
    diasRestantes: 11,
    valor: 485000,
    costoMateriales: 195000,
    responsable: 'Ing. Carlos Ruiz',
    prioridad: 'alta',
    maquina: 'Línea de Producción #3',
    eficiencia: 87,
    notas: 'Cliente VIP - entrega prioritaria',
  },
  {
    id: 'OP-2026-0841',
    cliente: 'Supermercados La Bodeguita',
    producto: 'Línea B - SKU-2051',
    cantidad: 5000,
    unidad: 'unidades',
    etapa: 'empaque',
    etapaProgreso: 90,
    fechaOrden: '2026-08-18',
    fechaEntrega: '2026-08-30',
    diasRestantes: 5,
    valor: 320000,
    costoMateriales: 128000,
    responsable: 'Ing. Ana López',
    prioridad: 'media',
    maquina: 'Línea de Producción #1',
    eficiencia: 92,
    notas: 'Pedido recurrente mensual',
  },
  {
    id: 'OP-2026-0840',
    cliente: 'Exportadora del Sur',
    producto: 'Línea C - SKU-3089',
    cantidad: 1200,
    unidad: 'unidades',
    etapa: 'qa',
    etapaProgreso: 80,
    fechaOrden: '2026-08-19',
    fechaEntrega: '2026-09-10',
    diasRestantes: 16,
    valor: 780000,
    costoMateriales: 312000,
    responsable: 'Ing. María Torres',
    prioridad: 'alta',
    maquina: 'Línea de Producción #2',
    eficiencia: 95,
    notas: 'Exportación - requiere certificación extra',
  },
  {
    id: 'OP-2026-0839',
    cliente: 'Cadenas Regional S.A.',
    producto: 'Línea D - SKU-4015',
    cantidad: 8000,
    unidad: 'unidades',
    etapa: 'nueva',
    etapaProgreso: 10,
    fechaOrden: '2026-08-24',
    fechaEntrega: '2026-09-15',
    diasRestantes: 21,
    valor: 275000,
    costoMateriales: 110000,
    responsable: 'Ing. Pedro Morales',
    prioridad: 'baja',
    maquina: 'Sin asignar',
    eficiencia: 0,
    notas: 'Nueva orden - pendiente de asignación',
  },
  {
    id: 'OP-2026-0838',
    cliente: 'Industrias Metálicas GT',
    producto: 'Línea E - SKU-5067',
    cantidad: 3500,
    unidad: 'unidades',
    etapa: 'materiales',
    etapaProgreso: 25,
    fechaOrden: '2026-08-21',
    fechaEntrega: '2026-09-08',
    diasRestantes: 14,
    valor: 420000,
    costoMateriales: 168000,
    responsable: 'Ing. Sofía Reyes',
    prioridad: 'media',
    maquina: 'Línea de Producción #3',
    eficiencia: 0,
    notas: 'Esperando materia prima importada',
  },
  {
    id: 'OP-2026-0837',
    cliente: 'Farmacéutica Centroamericana',
    producto: 'Línea F - SKU-6102',
    cantidad: 1800,
    unidad: 'unidades',
    etapa: 'entrega',
    etapaProgreso: 100,
    fechaOrden: '2026-08-10',
    fechaEntrega: '2026-08-25',
    diasRestantes: 0,
    valor: 650000,
    costoMateriales: 260000,
    responsable: 'Ing. Carlos Ruiz',
    prioridad: 'urgente',
    maquina: 'Línea de Producción #2',
    eficiencia: 98,
    notas: 'Lote para validación regulatoria',
  },
  {
    id: 'OP-2026-0836',
    cliente: 'Distribuidora Centroamericana S.A.',
    producto: 'Línea A - SKU-1043',
    cantidad: 4000,
    unidad: 'unidades',
    etapa: 'produccion',
    etapaProgreso: 45,
    fechaOrden: '2026-08-22',
    fechaEntrega: '2026-09-12',
    diasRestantes: 18,
    valor: 560000,
    costoMateriales: 224000,
    responsable: 'Ing. Ana López',
    prioridad: 'alta',
    maquina: 'Línea de Producción #1',
    eficiencia: 83,
    notas: 'Segunda orden del mes - mismo cliente',
  },
  {
    id: 'OP-2026-0835',
    cliente: 'Tiendas El Puerto',
    producto: 'Línea B - SKU-2052',
    cantidad: 6000,
    unidad: 'unidades',
    etapa: 'empaque',
    etapaProgreso: 88,
    fechaOrden: '2026-08-17',
    fechaEntrega: '2026-08-28',
    diasRestantes: 3,
    valor: 385000,
    costoMateriales: 154000,
    responsable: 'Ing. María Torres',
    prioridad: 'media',
    maquina: 'Línea de Producción #3',
    eficiencia: 91,
    notas: 'Empaque especial para temporada',
  },
]

// Métricas por máquina/línea
const METRICAS_LINEAS = [
  { linea: 'Línea #1', oee: 89, disponibilidad: 94, rendimiento: 92, calidad: 99, ordenes: 12, throughput: 850 },
  { linea: 'Línea #2', oee: 94, disponibilidad: 97, rendimiento: 96, calidad: 99, ordenes: 8, throughput: 620 },
  { linea: 'Línea #3', oee: 82, disponibilidad: 88, rendibilidad: 90, calidad: 98, ordenes: 15, throughput: 1100 },
]

// Tendencia de producción (últimos 7 días)
const TENDENCIA_PRODUCCION = [
  { dia: 'Lun', unidades: 3200, meta: 3500, eficiencia: 91 },
  { dia: 'Mar', unidades: 3800, meta: 3500, eficiencia: 109 },
  { dia: 'Mie', unidades: 2900, meta: 3500, eficiencia: 83 },
  { dia: 'Jue', unidades: 4100, meta: 3500, eficiencia: 117 },
  { dia: 'Vie', unidades: 3600, meta: 3500, eficiencia: 103 },
  { dia: 'Sab', unidades: 1800, meta: 2000, eficiencia: 90 },
  { dia: 'Dom', unidades: 1200, meta: 1500, eficiencia: 80 },
]

// Distribución de órdenes por prioridad
const DIST_PRIORIDAD = [
  { nombre: 'Urgente', valor: 1, color: '#ef4444' },
  { nombre: 'Alta', valor: 3, color: '#f97316' },
  { nombre: 'Media', valor: 3, color: '#3b82f6' },
  { nombre: 'Baja', valor: 1, color: '#10b981' },
]

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']

// ═══════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════

const PrioridadBadge = ({ prioridad }) => {
  const styles = {
    urgente: 'bg-red-500/10 text-red-600 border-red-200',
    alta: 'bg-orange-500/10 text-orange-600 border-orange-200',
    media: 'bg-blue-500/10 text-blue-600 border-blue-200',
    baja: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${styles[prioridad] || styles.media}`}>
      {prioridad.toUpperCase()}
    </span>
  )
}

const EtapaBadge = ({ etapa }) => {
  const etapaInfo = ETAPAS_PIPELINE.find(e => e.id === etapa)
  return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: etapaInfo?.color || '#6b7280' }}>
      {etapaInfo && <etapaInfo.icono className="w-3.5 h-3.5" />}
      {etapaInfo?.nombre || etapa}
    </span>
  )
}

export default function Produccion() {
  const [filtroEtapa, setFiltroEtapa] = useState('todas')
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)

  // Métricas calculadas
  const metricas = useMemo(() => {
    const totalOrdenes = ORDENES_DEMO.length
    const ordenesActivas = ORDENES_DEMO.filter(o => o.etapa !== 'entrega').length
    const ordenesCompletadas = ORDENES_DEMO.filter(o => o.etapa === 'entrega').length
    const valorTotal = ORDENES_DEMO.reduce((s, o) => s + o.valor, 0)
    const valorWIP = ORDENES_DEMO.filter(o => o.etapa !== 'entrega' && o.etapa !== 'nueva').reduce((s, o) => s + o.costoMateriales, 0)
    const eficienciaPromedio = Math.round(ORDENES_DEMO.filter(o => o.eficiencia > 0).reduce((s, o) => s + o.eficiencia, 0) / ORDENES_DEMO.filter(o => o.eficiencia > 0).length)
    const ordenesUrgentes = ORDENES_DEMO.filter(o => o.prioridad === 'urgente' || (o.diasRestantes <= 3 && o.etapa !== 'entrega')).length
    const onTimeDelivery = Math.round((ordenesCompletadas / totalOrdenes) * 100)
    
    return { totalOrdenes, ordenesActivas, ordenesCompletadas, valorTotal, valorWIP, eficienciaPromedio, ordenesUrgentes, onTimeDelivery }
  }, [])

  // Pipeline resumen
  const pipelineResumen = useMemo(() => {
    return ETAPAS_PIPELINE.map(etapa => ({
      ...etapa,
      ordenes: ORDENES_DEMO.filter(o => o.etapa === etapa.id),
      cantidad: ORDENES_DEMO.filter(o => o.etapa === etapa.id).length,
      valor: ORDENES_DEMO.filter(o => o.etapa === etapa.id).reduce((s, o) => s + o.valor, 0),
    }))
  }, [])

  // Filtrar órdenes
  const ordenesFiltradas = useMemo(() => {
    return ORDENES_DEMO.filter(o => {
      const matchEtapa = filtroEtapa === 'todas' || o.etapa === filtroEtapa
      const matchPrioridad = filtroPrioridad === 'todas' || o.prioridad === filtroPrioridad
      return matchEtapa && matchPrioridad
    })
  }, [filtroEtapa, filtroPrioridad])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
        <p className="text-xs font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? formatNum(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pipeline de Producción</h1>
          <p className="text-sm text-[var(--text-muted)]">Órdenes de producción y control de operaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* ═══ KPIs PRINCIPALES ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardDocumentListIcon className="w-4 h-4 text-[var(--accent-blue)]" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Órdenes Activas</span>
          </div>
          <p className="text-2xl font-bold font-mono">{metricas.ordenesActivas}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{metricas.ordenesCompletadas} completadas</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="w-4 h-4 text-[var(--success)]" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Valor Pipeline</span>
          </div>
          <p className="text-2xl font-bold font-mono">{formatGTQ(metricas.valorTotal)}</p>
          <p className="text-[10px] text-[var(--text-muted)]">WIP: {formatGTQ(metricas.valorWIP)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowPathIcon className="w-4 h-4 text-[var(--accent-orange)]" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Eficiencia Prom.</span>
          </div>
          <p className="text-2xl font-bold font-mono">{metricas.eficienciaPromedio}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">OEE objetivo: 85%</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-[var(--text-muted)] uppercase">On-Time Delivery</span>
          </div>
          <p className="text-2xl font-bold font-mono">{metricas.onTimeDelivery}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">Meta: 95%</p>
        </div>
      </div>

      {/* ═══ PIPELINE VISUAL + TENDENCIA ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline por etapa */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="font-semibold text-sm">Pipeline por Etapa</h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">{metricas.totalOrdenes} órdenes totales</span>
          </div>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {pipelineResumen.map((etapa) => (
                <div 
                  key={etapa.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    filtroEtapa === etapa.id ? 'border-[var(--accent-blue)] bg-blue-50' : 'border-transparent bg-[var(--bg-secondary)]'
                  }`}
                  onClick={() => setFiltroEtapa(filtroEtapa === etapa.id ? 'todas' : etapa.id)}
                >
                  <etapa.icono className="w-5 h-5 mb-2" style={{ color: etapa.color }} />
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">{etapa.nombre}</p>
                  <p className="text-lg font-bold font-mono">{etapa.cantidad}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatGTQ(etapa.valor)}</p>
                </div>
              ))}
            </div>
            
            {/* Barra de progreso visual */}
            <div className="mt-4">
              <div className="flex h-3 rounded-full overflow-hidden">
                {pipelineResumen.map((etapa) => (
                  <div 
                    key={etapa.id}
                    className="h-full transition-all"
                    style={{ 
                      width: `${metricas.totalOrdenes > 0 ? (etapa.cantidad / metricas.totalOrdenes) * 100 : 0}%`,
                      backgroundColor: etapa.color 
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {pipelineResumen.map((etapa) => (
                  <span key={etapa.id} className="text-[9px]" style={{ color: etapa.color }}>
                    {Math.round(metricas.totalOrdenes > 0 ? (etapa.cantidad / metricas.totalOrdenes) * 100 : 0)}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alertas y Urgencias */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <FireIcon className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-sm">Requieren Atención</h2>
            </div>
            <span className="badge-danger text-[10px]">{metricas.ordenesUrgentes} urgentes</span>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {ORDENES_DEMO.filter(o => o.prioridad === 'urgente' || (o.diasRestantes <= 3 && o.etapa !== 'entrega')).slice(0, 4).map((orden) => (
              <div key={orden.id} className="p-2.5 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{orden.id}</span>
                  <PrioridadBadge prioridad={orden.prioridad} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{orden.cliente}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-red-600 font-medium">
                    {orden.diasRestantes === 0 ? 'VENCE HOY' : `${orden.diasRestantes} días restantes`}
                  </span>
                  <span className="text-[10px] font-mono">{formatGTQ(orden.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ GRÁFICOS: TENDENCIA + OEE ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia de producción */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="font-semibold text-sm">Producción Diaria (Unidades)</h2>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TENDENCIA_PRODUCCION}>
                  <defs>
                    <linearGradient id="colorUnidades" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#001639" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#001639" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => formatNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="unidades" name="Producido" stroke="#001639" fill="url(#colorUnidades)" strokeWidth={2} />
                  <Area type="monotone" dataKey="meta" name="Meta" stroke="#94a3b8" fill="none" strokeDasharray="5 5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* OEE por Línea */}
        <div className="card">
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-[var(--accent-orange)]" />
              <h2 className="font-semibold text-sm">OEE por Línea de Producción</h2>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-3">
              {METRICAS_LINEAS.map((linea) => (
                <div key={linea.linea} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{linea.linea}</span>
                    <span className={`text-sm font-bold font-mono ${linea.oee >= 90 ? 'text-emerald-600' : linea.oee >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                      {linea.oee}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full rounded-full transition-all" 
                      style={{ width: `${linea.oee}%`, backgroundColor: linea.oee >= 90 ? '#10b981' : linea.oee >= 80 ? '#f59e0b' : '#ef4444' }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)]">Disponibilidad</p>
                      <p className="text-xs font-mono">{linea.disponibilidad}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)]">Rendimiento</p>
                      <p className="text-xs font-mono">{linea.rendimiento}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-muted)]">Calidad</p>
                      <p className="text-xs font-mono">{linea.calidad}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2.5 bg-[#001639] text-white rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] opacity-70">OEE Promedio Planta</span>
                <span className="text-lg font-bold font-mono">
                  {Math.round(METRICAS_LINEAS.reduce((s, l) => s + l.oee, 0) / METRICAS_LINEAS.length)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FILTROS + TABLA DE ÓRDENES ═══ */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 pb-2 gap-3">
          <div className="flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="font-semibold text-sm">Órdenes de Producción</h2>
            <span className="text-[10px] text-[var(--text-muted)]">({ordenesFiltradas.length} órdenes)</span>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={filtroEtapa} 
              onChange={(e) => setFiltroEtapa(e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1"
            >
              <option value="todas">Todas las etapas</option>
              {ETAPAS_PIPELINE.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <select 
              value={filtroPrioridad} 
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1"
            >
              <option value="todas">Todas las prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                <th className="text-left px-4 py-2 font-medium">Orden</th>
                <th className="text-left px-4 py-2 font-medium">Cliente</th>
                <th className="text-left px-4 py-2 font-medium">Producto</th>
                <th className="text-right px-4 py-2 font-medium">Cantidad</th>
                <th className="text-left px-4 py-2 font-medium">Etapa</th>
                <th className="text-center px-4 py-2 font-medium">Progreso</th>
                <th className="text-right px-4 py-2 font-medium">Valor</th>
                <th className="text-center px-4 py-2 font-medium">Entrega</th>
                <th className="text-center px-4 py-2 font-medium">Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((orden) => (
                <tr 
                  key={orden.id} 
                  className="border-b border-[var(--border-default)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"
                  onClick={() => setOrdenSeleccionada(orden)}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-medium">{orden.id}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="truncate max-w-[120px]">{orden.cliente}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[var(--text-secondary)]">{orden.producto}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {formatNum(orden.cantidad)} <span className="text-[10px] text-[var(--text-muted)]">{orden.unidad}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <EtapaBadge etapa={orden.etapa} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#001639]" 
                          style={{ width: `${orden.etapaProgreso}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono">{orden.etapaProgreso}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">
                    {formatGTQ(orden.valor)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] ${orden.diasRestantes <= 3 && orden.etapa !== 'entrega' ? 'text-red-500 font-medium' : 'text-[var(--text-muted)]'}`}>
                      {orden.diasRestantes === 0 ? 'HOY' : `${orden.diasRestantes}d`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <PrioridadBadge prioridad={orden.prioridad} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ MODAL DETALLE ORDEN ═══ */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOrdenSeleccionada(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{ordenSeleccionada.id}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{ordenSeleccionada.cliente}</p>
                </div>
                <button onClick={() => setOrdenSeleccionada(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <ChevronRightIcon className="w-5 h-5 rotate-90" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Producto</p>
                  <p className="text-sm font-medium">{ordenSeleccionada.producto}</p>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Cantidad</p>
                  <p className="text-sm font-medium">{formatNum(ordenSeleccionada.cantidad)} {ordenSeleccionada.unidad}</p>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Valor Total</p>
                  <p className="text-sm font-bold text-[var(--success)]">{formatGTQ(ordenSeleccionada.valor)}</p>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Costo Materiales</p>
                  <p className="text-sm font-medium">{formatGTQ(ordenSeleccionada.costoMateriales)}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <EtapaBadge etapa={ordenSeleccionada.etapa} />
                  <PrioridadBadge prioridad={ordenSeleccionada.prioridad} />
                </div>
                
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#001639] transition-all" 
                    style={{ width: `${ordenSeleccionada.etapaProgreso}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] text-center">{ordenSeleccionada.etapaProgreso}% completado</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Entrega: {ordenSeleccionada.fechaEntrega}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${ordenSeleccionada.diasRestantes <= 3 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {ordenSeleccionada.diasRestantes} días restantes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Responsable: {ordenSeleccionada.responsable}</span>
                </div>
                <div className="flex items-center gap-2">
                  <WrenchIcon className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Máquina: {ordenSeleccionada.maquina}</span>
                </div>
                {ordenSeleccionada.eficiencia > 0 && (
                  <div className="flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>Eficiencia actual: {ordenSeleccionada.eficiencia}%</span>
                  </div>
                )}
              </div>

              {ordenSeleccionada.notas && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">{ordenSeleccionada.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
