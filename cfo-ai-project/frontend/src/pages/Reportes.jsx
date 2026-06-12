import { useState, useEffect, useCallback } from 'react'
import {
  DocumentChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  BanknotesIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ReceiptRefundIcon,
  ScaleIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  PresentationChartBarIcon as LucBarChartIcon,
  ChartPieIcon as LucPieChartIcon
} from '@heroicons/react/24/outline'
import cfoApi from '../services/cfoApi'
import * as XLSX from 'xlsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#001639', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']

const reportTemplates = [
  {
    id: 'estado-resultados',
    name: 'Estado de Resultados',
    description: 'Ingresos, gastos y utilidad neta por período.',
    icon: DocumentChartBarIcon,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    iconBg: 'bg-blue-100',
    filters: ['fecha_desde', 'fecha_hasta'],
    hasResumen: true,
    chartType: 'bar'
  },
  {
    id: 'balance-general',
    name: 'Balance General',
    description: 'Activos, pasivos y capital en una fecha determinada.',
    icon: ScaleIcon,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    iconBg: 'bg-emerald-100',
    filters: ['fecha_hasta'],
    hasResumen: true,
    chartType: 'pie'
  },
  {
    id: 'libro-diario',
    name: 'Libro Diario',
    description: 'Todas las transacciones contables detalladas.',
    icon: BookOpenIcon,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    iconBg: 'bg-amber-100',
    filters: ['fecha_desde', 'fecha_hasta', 'cuenta_id', 'estado'],
    hasResumen: false
  },
  {
    id: 'cxc-aging',
    name: 'Cuentas por Cobrar (Aging)',
    description: 'Detalle de facturas pendientes por rango de vencimiento.',
    icon: UsersIcon,
    color: 'bg-violet-50 text-violet-600 border-violet-200',
    iconBg: 'bg-violet-100',
    filters: ['fecha_hasta'],
    hasResumen: true,
    chartType: 'bar'
  },
  {
    id: 'cxp-aging',
    name: 'Cuentas por Pagar (Aging)',
    description: 'Obligaciones con proveedores por rango de vencimiento.',
    icon: BuildingOfficeIcon,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    iconBg: 'bg-rose-100',
    filters: ['fecha_hasta'],
    hasResumen: true,
    chartType: 'bar'
  },
  {
    id: 'movimientos-bancarios',
    name: 'Movimientos Bancarios',
    description: 'Todas las transacciones bancarias con filtros.',
    icon: BuildingLibraryIcon,
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    iconBg: 'bg-cyan-100',
    filters: ['fecha_desde', 'fecha_hasta', 'cuenta_bancaria_id', 'tipo'],
    hasResumen: false
  },
  {
    id: 'ventas-cliente',
    name: 'Ventas por Cliente',
    description: 'Resumen de ventas agrupado por cliente.',
    icon: ReceiptRefundIcon,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    iconBg: 'bg-teal-100',
    filters: ['fecha_desde', 'fecha_hasta'],
    hasResumen: false,
    chartType: 'bar'
  },
  {
    id: 'ventas-cuenta',
    name: 'Ventas por Cuenta/Producto',
    description: 'Ventas agrupadas por cuenta contable.',
    icon: DocumentTextIcon,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    iconBg: 'bg-indigo-100',
    filters: ['fecha_desde', 'fecha_hasta'],
    hasResumen: false,
    chartType: 'pie'
  },
  {
    id: 'conciliaciones',
    name: 'Conciliaciones Bancarias',
    description: 'Estado de conciliaciones por período y banco.',
    icon: CheckCircleIcon,
    color: 'bg-sky-50 text-sky-600 border-sky-200',
    iconBg: 'bg-sky-100',
    filters: ['fecha_desde', 'fecha_hasta', 'banco', 'estado'],
    hasResumen: false
  },
  {
    id: 'ratios-financieros',
    name: 'Ratios Financieros',
    description: 'Indicadores clave: liquidez, endeudamiento, ROE, margen.',
    icon: BanknotesIcon,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    iconBg: 'bg-orange-100',
    filters: ['fecha_hasta'],
    hasResumen: true,
    chartType: 'bar'
  },
  {
    id: 'cuentas-bancarias',
    name: 'Catálogo de Cuentas Bancarias',
    description: 'Listado de bancos con saldos y estados.',
    icon: BuildingLibraryIcon,
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    iconBg: 'bg-slate-100',
    filters: [],
    hasResumen: false,
    chartType: 'pie'
  },
  {
    id: 'cuentas-contables',
    name: 'Catálogo de Cuentas Contables',
    description: 'Plan de cuentas con saldos por período.',
    icon: BookOpenIcon,
    color: 'bg-stone-50 text-stone-600 border-stone-200',
    iconBg: 'bg-stone-100',
    filters: ['periodo'],
    hasResumen: false
  },
  {
    id: 'obligaciones-sat',
    name: 'Obligaciones SAT',
    description: 'Obligaciones fiscales por vencimiento y estado.',
    icon: DocumentTextIcon,
    color: 'bg-red-50 text-red-600 border-red-200',
    iconBg: 'bg-red-100',
    filters: ['fecha_desde', 'fecha_hasta', 'estado'],
    hasResumen: false
  }
]

const formatGTQ = (v) => {
  if (v === undefined || v === null || isNaN(v)) return 'Q 0'
  return 'Q ' + parseFloat(v).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const today = () => new Date().toISOString().split('T')[0]
const firstDayOfMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
const firstDayOfLastMonth = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
const lastDayOfLastMonth = () => {
  const d = new Date()
  d.setDate(0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Reportes() {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [filters, setFilters] = useState({
    fecha_desde: firstDayOfLastMonth(),
    fecha_hasta: lastDayOfLastMonth(),
    periodo: new Date().toISOString().slice(0, 7),
    cuenta_id: '',
    estado: '',
    tipo: '',
    banco: '',
    cuenta_bancaria_id: ''
  })
  const [reportData, setReportData] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const runReport = useCallback(async (tpl, customFilters) => {
    const template = tpl || selectedTemplate
    if (!template) return
    setLoading(true)
    setError(null)
    setPage(0)
    try {
      const params = {}
      const activeFilters = customFilters || filters
      template.filters.forEach(f => {
        if (activeFilters[f] !== undefined && activeFilters[f] !== '') {
          params[f] = activeFilters[f]
        }
      })
      params.limit = 5000
      params.offset = 0

      const res = await cfoApi.get(`/reportes/${template.id}`, { params })
      setReportData(res.data || res)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }, [selectedTemplate, filters])

  // Auto-run default report on mount (Estado de Resultados, último mes)
  useEffect(() => {
    const defaultTpl = reportTemplates[0]
    const defaultFilters = {
      fecha_desde: firstDayOfLastMonth(),
      fecha_hasta: lastDayOfLastMonth(),
      periodo: new Date().toISOString().slice(0, 7),
      cuenta_id: '',
      estado: '',
      tipo: '',
      banco: '',
      cuenta_bancaria_id: ''
    }
    setSelectedTemplate(defaultTpl)
    setFilters(defaultFilters)
    
    // Execute directly without useCallback dependency issues
    const runDefaultReport = async () => {
      setLoading(true)
      setError(null)
      setPage(0)
      try {
        const params = { fecha_desde: defaultFilters.fecha_desde, fecha_hasta: defaultFilters.fecha_hasta, limit: 5000, offset: 0 }
        const res = await cfoApi.get(`/reportes/${defaultTpl.id}`, { params })
        setReportData(res.data || res)
      } catch (e) {
        setError(e.response?.data?.error || e.message)
      } finally {
        setLoading(false)
      }
    }
    runDefaultReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTemplateHover = (tpl) => {
    // Pre-cargar datos al hacer hover para preview rápido
    if (selectedTemplate?.id === tpl.id) return
    
    const params = {}
    tpl.filters.forEach(f => {
      if (filters[f] !== undefined && filters[f] !== '') {
        params[f] = filters[f]
      }
    })
    params.limit = 50
    params.offset = 0

    cfoApi.get(`/reportes/${tpl.id}`, { params })
      .then(res => {
        if (res.data?.data?.length > 0) {
          setPreviewData({ template: tpl, data: res.data })
        }
      })
      .catch(() => {
        // Silenciar errores en hover
      })
  }

  const handleTemplateClick = (tpl) => {
    const defaultFilters = { ...filters }
    // Reset date filters to last month for new template
    if (tpl.filters.includes('fecha_desde')) {
      defaultFilters.fecha_desde = firstDayOfLastMonth()
    }
    if (tpl.filters.includes('fecha_hasta')) {
      defaultFilters.fecha_hasta = lastDayOfLastMonth()
    }
    if (tpl.filters.includes('periodo')) {
      defaultFilters.periodo = new Date().toISOString().slice(0, 7)
    }
    setFilters(defaultFilters)
    setSelectedTemplate(tpl)
    // Ejecutar el reporte inmediatamente con el template seleccionado
    setLoading(true)
    setError(null)
    setPage(0)
    setReportData(null)
    
    const params = {}
    tpl.filters.forEach(f => {
      if (defaultFilters[f] !== undefined && defaultFilters[f] !== '') {
        params[f] = defaultFilters[f]
      }
    })
    params.limit = 5000
    params.offset = 0

    cfoApi.get(`/reportes/${tpl.id}`, { params })
      .then(res => {
        setReportData(res.data || res)
      })
      .catch(e => {
        setError(e.response?.data?.error || e.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const exportToExcel = () => {
    if (!reportData || !reportData.data) return
    const ws = XLSX.utils.json_to_sheet(reportData.data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, selectedTemplate.name)
    XLSX.writeFile(wb, `${selectedTemplate.id}_${today()}.xlsx`)
  }

  const pagedData = reportData?.data?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) || []
  const totalPages = Math.ceil((reportData?.data?.length || 0) / PAGE_SIZE)

  const isDateField = (col) => /fecha|periodo|created_at|updated_at/.test(col)
  const isNumberField = (col) => /monto|total|saldo|dias|valor|precio|costo/.test(col)

  const renderCell = (col, val) => {
    if (val === undefined || val === null) return '-'
    if (isDateField(col)) return val?.split('T')[0] || val
    if (isNumberField(col) && typeof val === 'number') return formatGTQ(val)
    if (typeof val === 'boolean') return val ? 'Sí' : 'No'
    return String(val)
  }

  const renderResumen = () => {
    if (!reportData?.resumen) return null
    const r = reportData.resumen
    const entries = Object.entries(r)
    if (!entries.length) return null
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        {entries.map(([k, v]) => (
          <div key={k} className="bg-white rounded-lg border border-[var(--border-default)] p-3">
            <p className="text-[10px] uppercase text-[var(--text-muted)] font-semibold tracking-wider">{k.replace(/_/g, ' ')}</p>
            <p className={`text-lg font-bold tabular-nums ${typeof v === 'number' && v < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
              {typeof v === 'number' ? formatGTQ(v) : String(v)}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const renderChart = () => {
    if (!reportData?.data || !selectedTemplate?.chartType) return null

    const data = reportData.data.filter(row =>
      !['TOTAL', 'resumen', ''].includes(row.tipo || '') &&
      Object.values(row).some(v => typeof v === 'number' && v !== 0)
    )

    if (!data.length) return null

    if (selectedTemplate.chartType === 'pie') {
      const keyField = Object.keys(data[0]).find(k => /nombre|cliente|cuenta|banco/.test(k)) || Object.keys(data[0])[1]
      const valueField = Object.keys(data[0]).find(k => /monto|total|saldo|neto/.test(k)) || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')
      const chartData = data.slice(0, 8).map(d => ({ name: d[keyField] || 'Sin nombre', value: parseFloat(d[valueField] || 0) }))
      return (
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <LucPieChartIcon className="w-4 h-4 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Distribución</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatGTQ(val)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }

    if (selectedTemplate.chartType === 'bar') {
      const keyField = Object.keys(data[0]).find(k => /nombre|cliente|cuenta|banco|codigo/.test(k)) || Object.keys(data[0])[1]
      const valueField = Object.keys(data[0]).find(k => /monto|total|saldo|neto|dias/.test(k)) || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')
      const chartData = data.slice(0, 12).map(d => ({ name: String(d[keyField] || '').slice(0, 20), value: parseFloat(d[valueField] || 0) }))
      return (
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <LucBarChartIcon className="w-4 h-4 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Vista Gráfica</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => formatGTQ(val)} />
                <Bar dataKey="value" fill="#001639" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#001639] flex items-center justify-center">
          <DocumentChartBarIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Reportes Financieros</h1>
          <p className="text-sm text-[var(--text-muted)]">Genera reportes contables, tributarios y de gestión. Exporta a Excel.</p>
        </div>
      </div>

      {/* Selector de plantillas - siempre visible arriba */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {reportTemplates.map((tpl) => {
          const Icon = tpl.icon
          const isActive = selectedTemplate?.id === tpl.id
          return (
            <button
              key={tpl.id}
              onClick={() => handleTemplateClick(tpl)}
              onMouseEnter={() => handleTemplateHover(tpl)}
              className={`group text-left p-3 rounded-xl border transition-all hover:shadow-md ${
                isActive
                  ? 'ring-2 ring-[#001639] shadow-md bg-[#001639]/5'
                  : `${tpl.color} bg-white hover:-translate-y-0.5`
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${isActive ? 'bg-[#001639]' : tpl.iconBg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
              </div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{tpl.name}</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight hidden sm:block">{tpl.description}</p>
            </button>
          )
        })}
      </div>

      {/* Preview rápido en hover */}
      {previewData && previewData.template?.id !== selectedTemplate?.id && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 mb-2">
          <p className="text-xs text-blue-700 font-medium">
            Preview: {previewData.template.name} — {previewData.data?.data?.length || 0} registros disponibles
          </p>
        </div>
      )}

      {selectedTemplate && (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">{selectedTemplate.name}</span>
            <span className="text-xs text-[var(--text-muted)]">
              ({filters.fecha_desde || '...'} → {filters.fecha_hasta || '...'})
            </span>
          </div>

          {/* Filtros */}
          <div className="card">
            <div className="section-header">
              <FunnelIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Filtros</h2>
            </div>
            <div className="p-5 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedTemplate.filters.includes('fecha_desde') && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Fecha desde</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="date"
                        value={filters.fecha_desde}
                        onChange={e => setFilters(f => ({ ...f, fecha_desde: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#001639]/20 focus:border-[#001639]"
                      />
                    </div>
                  </div>
                )}
                {selectedTemplate.filters.includes('fecha_hasta') && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Fecha hasta</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="date"
                        value={filters.fecha_hasta}
                        onChange={e => setFilters(f => ({ ...f, fecha_hasta: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#001639]/20 focus:border-[#001639]"
                      />
                    </div>
                  </div>
                )}
                {selectedTemplate.filters.includes('periodo') && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Período (YYYY-MM)</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="2024-01"
                        value={filters.periodo}
                        onChange={e => setFilters(f => ({ ...f, periodo: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#001639]/20 focus:border-[#001639]"
                      />
                    </div>
                  </div>
                )}
                {selectedTemplate.filters.includes('cuenta_id') && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Cuenta contable</label>
                    <input
                      type="text"
                      placeholder="ID de cuenta"
                      value={filters.cuenta_id}
                      onChange={e => setFilters(f => ({ ...f, cuenta_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#001639]/20 focus:border-[#001639]"
                    />
                  </div>
                )}
                {selectedTemplate.filters.includes('estado') && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Estado</label>
                    <select
                      value={filters.estado}
                      onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#001639]/20 focus:border-[#001639]"
                    >
                      <option value="">Todos</option>
                      <option value="activa">Activo</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="completado">Completado</option>
                      <option value="conciliado">Conciliado</option>
                      <option value="diferencias">Diferencias</option>
                      <option value="anulado">Anulado</option>
                    </select>
                  </div>
                )}
                {selectedTemplate.filters.includes('tipo') && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Tipo</label>
                    <select
                      value={filters.tipo}
                      onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#001639]/20 focus:border-[#001639]"
                    >
                      <option value="">Todos</option>
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                      <option value="debe">Debe</option>
                      <option value="haber">Haber</option>
                    </select>
                  </div>
                )}
                {selectedTemplate.filters.includes('banco') && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Banco</label>
                    <input
                      type="text"
                      placeholder="Nombre del banco"
                      value={filters.banco}
                      onChange={e => setFilters(f => ({ ...f, banco: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#001639]/20 focus:border-[#001639]"
                    />
                  </div>
                )}
                {selectedTemplate.filters.includes('cuenta_bancaria_id') && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Cuenta bancaria ID</label>
                    <input
                      type="text"
                      placeholder="ID de cuenta bancaria"
                      value={filters.cuenta_bancaria_id}
                      onChange={e => setFilters(f => ({ ...f, cuenta_bancaria_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#001639]/20 focus:border-[#001639]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => runReport()}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TableCellsIcon className="w-4 h-4" />}
                  {loading ? 'Generando...' : 'Actualizar Reporte'}
                </button>
                {reportData && (
                  <button
                    onClick={exportToExcel}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Exportar Excel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <p className="font-medium">Error al generar reporte:</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
              <ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />
              Generando reporte...
            </div>
          )}

          {/* Sin datos */}
          {!loading && selectedTemplate && !reportData && (
            <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
              <TableCellsIcon className="w-6 h-6 mr-2" />
              Haz clic en "Actualizar Reporte" para generar los datos
            </div>
          )}

          {/* Charts + Preview */}
          {reportData && !loading && (
            <>
              {selectedTemplate.hasResumen && renderResumen()}
              {renderChart()}

              <div className="card overflow-hidden">
                <div className="section-header">
                  <EyeIcon className="w-5 h-5 text-[var(--text-muted)]" />
                  <h2 className="font-semibold">Vista Previa — {selectedTemplate.name}</h2>
                  <span className="ml-auto text-xs text-[var(--text-muted)]">
                    {reportData.data?.length?.toLocaleString() || 0} registros
                  </span>
                </div>

                {reportData.data && reportData.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
                        <tr>
                          {(reportData.columnas || Object.keys(reportData.data[0] || {})).map(col => (
                            <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">
                              {String(col).replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-default)]">
                        {pagedData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-secondary)] transition-colors">
                            {(reportData.columnas || Object.keys(row)).map(col => (
                              <td key={col} className={`px-4 py-2.5 whitespace-nowrap ${isNumberField(col) ? 'text-right tabular-nums' : ''}`}>
                                {renderCell(col, row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
                    <TableCellsIcon className="w-5 h-5 mr-2" />
                    No hay registros para este período
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-default)]">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-[var(--border-default)] disabled:opacity-40 hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <ChevronLeftIcon className="w-4 h-4" /> Anterior
                    </button>
                    <span className="text-xs text-[var(--text-muted)]">
                      Página {page + 1} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-[var(--border-default)] disabled:opacity-40 hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      Siguiente <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
