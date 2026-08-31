import { useState, useMemo } from 'react'
import {
  ChartBarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  TagIcon,
  GlobeAltIcon,
  FlagIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { 
  useMargenes, 
  useMargenProductoDetalle,
  useMargenVendedores,
  useMargenClientes,
  useMargenLineas,
  useMargenMarcas,
  useMargenTiendas,
  useMargenPaises,
  useMargenCatalogos,
} from '../hooks/useCfoData'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + Math.round(value).toLocaleString('es-GT')
}

const formatNum = (value, decimals = 1) => {
  if (!value && value !== 0) return '-'
  return Number(value).toFixed(decimals)
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6']

// ===== COMPONENTE: FILTROS MULTI-DIMENSIÓN =====
function DimensionFilters({ catalogos, filters, onChange }) {
  const { marcas = [], tiendas = [], paises = [] } = catalogos?.data || {}
  
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <FunnelIcon className="w-4 h-4" />
        <span>Filtrar por:</span>
      </div>
      
      {/* Filtro Marca */}
      <select
        value={filters.marca_id || ''}
        onChange={(e) => onChange({ ...filters, marca_id: e.target.value || undefined })}
        className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
      >
        <option value="">Todas las marcas</option>
        {marcas.map(m => (
          <option key={m.id} value={m.id}>{m.nombre}</option>
        ))}
      </select>
      
      {/* Filtro País */}
      <select
        value={filters.pais_id || ''}
        onChange={(e) => onChange({ ...filters, pais_id: e.target.value || undefined })}
        className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
      >
        <option value="">Todos los países</option>
        {paises.map(p => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      
      {/* Filtro Tienda */}
      <select
        value={filters.tienda_id || ''}
        onChange={(e) => onChange({ ...filters, tienda_id: e.target.value || undefined })}
        className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
      >
        <option value="">Todas las tiendas</option>
        {tiendas
          .filter(t => !filters.marca_id || t.marca_id === parseInt(filters.marca_id))
          .filter(t => !filters.pais_id || t.pais_id === parseInt(filters.pais_id))
          .map(t => (
          <option key={t.id} value={t.id}>{t.nombre} ({t.ciudad})</option>
        ))}
      </select>
      
      {(filters.marca_id || filters.tienda_id || filters.pais_id) && (
        <button
          onClick={() => onChange({})}
          className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

// Componente de filtro por semáforo
function SemaforoFilter({ value, onChange, counts }) {
  const opciones = [
    { key: 'todos', label: 'Todos', color: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' },
    { key: 'verde', label: 'Verde', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
    { key: 'ambar', label: 'Ámbar', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
    { key: 'rojo', label: 'Rojo', color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500' },
  ]

  return (
    <div className="flex items-center gap-2">
      <FunnelIcon className="w-4 h-4 text-[var(--text-muted)]" />
      <div className="flex gap-1.5">
        {opciones.map(op => (
          <button
            key={op.key}
            onClick={() => onChange(op.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              value === op.key ? op.color : 'bg-transparent text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            {op.dot && <span className={`w-2 h-2 rounded-full ${op.dot}`} />}
            {op.label}
            {counts?.[op.key] !== undefined && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${value === op.key ? 'bg-white/20' : 'bg-[var(--bg-tertiary)]'}`}>
                {counts[op.key]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Tabla genérica sorteable
function SortableTable({ columns, data, onRowClick, keyField = 'id' }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const va = parseFloat(a[sortKey]) || a[sortKey] || 0
      const vb = parseFloat(b[sortKey]) || b[sortKey] || 0
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va > vb ? -1 : 1)
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                className={`text-left py-3 px-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:text-[var(--text-primary)]' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr
              key={row[keyField] || idx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-tertiary)]/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map(col => (
                <td key={col.key} className={`py-3 px-3 ${col.className || ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== KPI CARD =====
function KpiCard({ label, value, subtext, color = 'text-[var(--accent-primary)]' }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-[var(--text-muted)]">{subtext}</p>}
    </div>
  )
}

export default function Margenes() {
  const [filters, setFilters] = useState({})
  const [activeTab, setActiveTab] = useState('productos')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  
  // Estados de filtro por semáforo para cada sección
  const [filtroSemaforoProductos, setFiltroSemaforoProductos] = useState('todos')
  const [filtroSemaforoVendedores, setFiltroSemaforoVendedores] = useState('todos')
  const [filtroSemaforoClientes, setFiltroSemaforoClientes] = useState('todos')
  const [filtroSemaforoLineas, setFiltroSemaforoLineas] = useState('todos')
  
  // Fetch data con filtros
  const { data, isLoading, error } = useMargenes(filters)
  const { data: vendedoresData } = useMargenVendedores(filters)
  const { data: clientesData } = useMargenClientes(filters)
  const { data: lineasData } = useMargenLineas(filters)
  const { data: marcasData } = useMargenMarcas(filters)
  const { data: tiendasData } = useMargenTiendas(filters)
  const { data: paisesData } = useMargenPaises(filters)
  const { data: catalogosData } = useMargenCatalogos()
  const { data: detalleData } = useMargenProductoDetalle(productoSeleccionado?.id)

  if (isLoading) return <div className="p-6 text-[var(--text-muted)]">Cargando análisis de márgenes...</div>
  if (error) return <div className="p-6 text-red-400">Error cargando datos: {error.message}</div>
  if (!data?.data) return <div className="p-6 text-[var(--text-muted)]">No hay datos disponibles</div>

  const { resumen, productos } = data.data
  const vendedores = vendedoresData?.data || []
  const clientes = clientesData?.data || []
  const lineas = lineasData?.data || []
  const marcas = marcasData?.data || []
  const tiendas = tiendasData?.data || []
  const paises = paisesData?.data || []

  const contarPorSemaforo = (items) => ({
    todos: items.length,
    verde: items.filter(i => i.semaforo === 'verde').length,
    ambar: items.filter(i => i.semaforo === 'ambar').length,
    rojo: items.filter(i => i.semaforo === 'rojo').length,
  })

  const filtrarPorSemaforo = (items, filtro) => {
    if (filtro === 'todos') return items
    return items.filter(i => i.semaforo === filtro)
  }

  const productosFiltrados = filtrarPorSemaforo(productos || [], filtroSemaforoProductos)
  const vendedoresFiltrados = filtrarPorSemaforo(vendedores, filtroSemaforoVendedores)
  const clientesFiltrados = filtrarPorSemaforo(clientes, filtroSemaforoClientes)
  const lineasFiltradas = filtrarPorSemaforo(lineas, filtroSemaforoLineas)

  const chartData = detalleData?.data?.historial?.map(h => ({
    fecha: h.fecha.slice(0, 7),
    precio: h.precio_promedio_realizado,
    costo: h.costo_unitario,
    margen: h.margen_pct,
  })) || []

  // Determinar qué filtros están activos para mostrar contexto
  const filtrosActivos = []
  if (filters.marca_id && catalogosData?.data?.marcas) {
    const m = catalogosData.data.marcas.find(x => x.id === parseInt(filters.marca_id))
    if (m) filtrosActivos.push(`Marca: ${m.nombre}`)
  }
  if (filters.pais_id && catalogosData?.data?.paises) {
    const p = catalogosData.data.paises.find(x => x.id === parseInt(filters.pais_id))
    if (p) filtrosActivos.push(`País: ${p.nombre}`)
  }
  if (filters.tienda_id && catalogosData?.data?.tiendas) {
    const t = catalogosData.data.tiendas.find(x => x.id === parseInt(filters.tienda_id))
    if (t) filtrosActivos.push(`Tienda: ${t.nombre}`)
  }

  const tabs = [
    { id: 'productos', label: 'Productos', icon: TagIcon },
    { id: 'vendedores', label: 'Vendedores', icon: UsersIcon },
    { id: 'clientes', label: 'Clientes', icon: BuildingStorefrontIcon },
    { id: 'lineas', label: 'Líneas', icon: ChartBarIcon },
    { id: 'marcas', label: 'Marcas', icon: TagIcon },
    { id: 'tiendas', label: 'Tiendas', icon: BuildingStorefrontIcon },
    { id: 'paises', label: 'Países', icon: GlobeAltIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-[var(--accent-primary)]" />
          Márgenes
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Análisis de márgenes por producto, vendedor, cliente, línea, marca, tienda y país
        </p>
      </div>

      {/* Filtros multi-dimensión */}
      <DimensionFilters 
        catalogos={catalogosData} 
        filters={filters} 
        onChange={setFilters} 
      />

      {/* Contexto de filtros activos */}
      {filtrosActivos.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)]">Vista filtrada:</span>
          {filtrosActivos.map((f, i) => (
            <span key={i} className="px-2 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full text-xs font-medium">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* KPIs globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Margen Bruto Total" 
          value={formatGTQ(resumen?.total_margen_bruto_q || 0)}
          subtext={`${formatNum(resumen?.margen_global_pct)}% sobre ventas`}
          color="text-emerald-400"
        />
        <KpiCard 
          label="Dejaste de ganar (12m)" 
          value={formatGTQ(resumen?.total_margen_perdido_12m || 0)}
          subtext="Productos que no ajustaron precio"
          color="text-red-400"
        />
        <KpiCard 
          label="Necesitan ajuste" 
          value={`${resumen?.productos_rojo || 0} 🔴 + ${resumen?.productos_ambar || 0} 🟡`}
          subtext={`De ${resumen?.total_productos || 0} totales`}
          color="text-amber-400"
        />
        <KpiCard 
          label="Total Ventas" 
          value={formatGTQ(resumen?.total_ventas_q || 0)}
          subtext="Últimos 12 meses"
        />
      </div>

      {/* KPIs multi-dimensión */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Marcas Activas" value={marcas.length} subtext="Segmentos: masivo, premium" />
        <KpiCard label="Tiendas" value={tiendas.length} subtext="5 países centroamericanos" />
        <KpiCard label="Países" value={paises.length} subtext="Guatemala, El Salvador, Honduras, CR, NI" />
        <KpiCard label="Vendedores" value={vendedores.length} subtext="Activos en todas las tiendas" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)]">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ===== CONTENIDO POR TAB ===== */}

      {/* TAB: PRODUCTOS */}
      {activeTab === 'productos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2">
                      <TagIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                      Margen por Producto
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      {productos?.filter(p => p.semaforo !== 'verde').length || 0} productos con margen menor al año pasado
                    </p>
                  </div>
                  <SemaforoFilter 
                    value={filtroSemaforoProductos} 
                    onChange={setFiltroSemaforoProductos}
                    counts={contarPorSemaforo(productos || [])}
                  />
                </div>
              </div>
              <SortableTable
                columns={[
                  { key: 'nombre', label: 'Producto', sortable: false, render: r => (
                    <div>
                      <div className="font-medium">{r.nombre}</div>
                      <div className="text-xs text-[var(--text-muted)]">{r.sku}</div>
                    </div>
                  )},
                  { key: 'precio_actual', label: 'Precio', className: 'text-right', render: r => `Q ${formatNum(r.precio_actual, 2)}` },
                  { key: 'costo_actual', label: 'Costo', className: 'text-right', render: r => `Q ${formatNum(r.costo_actual, 2)}` },
                  { key: 'margen_pct_actual', label: 'Margen', className: 'text-right', render: r => `${formatNum(r.margen_pct_actual)}%` },
                  { key: 'unidades_12m', label: 'Unidades', className: 'text-right', render: r => (r.unidades_12m || 0).toLocaleString() },
                  { key: 'semaforo', label: '', className: 'text-center', sortable: false, render: r => (
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      r.semaforo === 'rojo' ? 'bg-red-500' :
                      r.semaforo === 'ambar' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  )},
                ]}
                data={productosFiltrados}
                onRowClick={row => setProductoSeleccionado(row)}
                keyField="sku"
              />
            </div>
          </div>

          {/* Panel de Detalle Producto */}
          <div className="card p-6">
            {productoSeleccionado ? (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg">{productoSeleccionado.nombre}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{productoSeleccionado.sku}</p>
                  </div>
                  <button onClick={() => setProductoSeleccionado(null)} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
                    <XMarkIcon className="w-4 h-4 text-[var(--text-muted)]" />
                  </button>
                </div>

                {chartData.length > 0 && (
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="precio" fill="#10b981" name="Precio" />
                        <Bar dataKey="costo" fill="#ef4444" name="Costo" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)]">Margen Actual</p>
                    <p className={`text-lg font-bold ${parseFloat(productoSeleccionado.margen_pct_actual) < 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {formatNum(productoSeleccionado.margen_pct_actual)}%
                    </p>
                  </div>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)]">Unidades (12m)</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{(productoSeleccionado.unidades_12m || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
                <TagIcon className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Selecciona un producto para ver detalle</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: VENDEDORES */}
      {activeTab === 'vendedores' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                      Margen por Vendedor
                    </h2>
                  </div>
                  <SemaforoFilter 
                    value={filtroSemaforoVendedores} 
                    onChange={setFiltroSemaforoVendedores}
                    counts={contarPorSemaforo(vendedores)}
                  />
                </div>
              </div>
              <SortableTable
                columns={[
                  { key: 'nombre', label: 'Vendedor', sortable: false, render: r => (
                    <div>
                      <div className="font-medium">{r.nombre}</div>
                      {r.tienda && <div className="text-xs text-[var(--text-muted)]">{r.tienda} {r.pais && `(${r.pais})`}</div>}
                    </div>
                  )},
                  { key: 'ventas_12m', label: 'Ventas 12m', className: 'text-right', render: r => formatGTQ(r.ventas_12m) },
                  { key: 'margen_pct_actual', label: 'Margen', className: 'text-right', render: r => `${formatNum(r.margen_pct_actual)}%` },
                  { key: 'unidades_vendidas', label: 'Unidades', className: 'text-right', render: r => (r.unidades_vendidas || 0).toLocaleString() },
                  { key: 'num_ventas', label: 'Trans.', className: 'text-right', render: r => (r.num_ventas || 0).toLocaleString() },
                  { key: 'semaforo', label: '', className: 'text-center', sortable: false, render: r => (
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      r.semaforo === 'rojo' ? 'bg-red-500' :
                      r.semaforo === 'ambar' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  )},
                ]}
                data={vendedoresFiltrados}
                keyField="id"
              />
            </div>
          </div>
          <div className="space-y-4">
            <KpiCard label="Mejor Vendedor" value={vendedores[0]?.nombre || '-'} subtext={`${formatNum(vendedores[0]?.margen_pct_actual)}% margen`} color="text-emerald-400" />
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Ventas por Vendedor</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={vendedores} dataKey="ventas_12m" nameKey="nombre" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name?.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                      {vendedores.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2">
                      <BuildingStorefrontIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                      Margen por Cliente
                    </h2>
                  </div>
                  <SemaforoFilter 
                    value={filtroSemaforoClientes} 
                    onChange={setFiltroSemaforoClientes}
                    counts={contarPorSemaforo(clientes)}
                  />
                </div>
              </div>
              <SortableTable
                columns={[
                  { key: 'nombre', label: 'Cliente', sortable: false },
                  { key: 'ventas_12m', label: 'Comprado 12m', className: 'text-right', render: r => formatGTQ(r.ventas_12m) },
                  { key: 'margen_pct_actual', label: 'Margen', className: 'text-right', render: r => `${formatNum(r.margen_pct_actual)}%` },
                  { key: 'num_compras', label: 'Compras', className: 'text-right', render: r => (r.num_compras || 0).toLocaleString() },
                  { key: 'semaforo', label: '', className: 'text-center', sortable: false, render: r => (
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      r.semaforo === 'rojo' ? 'bg-red-500' :
                      r.semaforo === 'ambar' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  )},
                ]}
                data={clientesFiltrados}
                keyField="id"
              />
            </div>
          </div>
          <div className="space-y-4">
            <KpiCard label="Top Cliente" value={clientes[0]?.nombre || '-'} subtext={formatGTQ(clientes[0]?.ventas_12m)} color="text-emerald-400" />
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Ventas por Cliente</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={clientes} dataKey="ventas_12m" nameKey="nombre" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name?.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                      {clientes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LÍNEAS */}
      {activeTab === 'lineas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                      Margen por Línea
                    </h2>
                  </div>
                  <SemaforoFilter 
                    value={filtroSemaforoLineas} 
                    onChange={setFiltroSemaforoLineas}
                    counts={contarPorSemaforo(lineas)}
                  />
                </div>
              </div>
              <SortableTable
                columns={[
                  { key: 'nombre', label: 'Línea', sortable: false },
                  { key: 'num_skus', label: 'SKUs', className: 'text-right', render: r => (r.num_skus || 0).toLocaleString() },
                  { key: 'ventas_12m', label: 'Ventas', className: 'text-right', render: r => formatGTQ(r.ventas_12m) },
                  { key: 'margen_pct_actual', label: 'Margen', className: 'text-right', render: r => `${formatNum(r.margen_pct_actual)}%` },
                  { key: 'semaforo', label: '', className: 'text-center', sortable: false, render: r => (
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      r.semaforo === 'rojo' ? 'bg-red-500' :
                      r.semaforo === 'ambar' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  )},
                ]}
                data={lineasFiltradas}
                keyField="id"
              />
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Margen por Línea</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lineas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="margen_pct_actual" fill="#10b981" name="Margen %" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MARCAS */}
      {activeTab === 'marcas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="p-4 border-b border-[var(--border-color)]">
                <h2 className="font-semibold flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                  Margen por Marca
                </h2>
              </div>
              <SortableTable
                columns={[
                  { key: 'nombre', label: 'Marca', sortable: false, render: r => (
                    <div>
                      <div className="font-medium">{r.nombre}</div>
                      <div className="text-xs text-[var(--text-muted)]">{r.segmento} | {r.codigo}</div>
                    </div>
                  )},
                  { key: 'num_ventas', label: 'Ventas', className: 'text-right', render: r => (r.num_ventas || 0).toLocaleString() },
                  { key: 'unidades_vendidas', label: 'Unidades', className: 'text-right', render: r => (r.unidades_vendidas || 0).toLocaleString() },
                  { key: 'total_ventas_q', label: 'Ventas Q', className: 'text-right', render: r => formatGTQ(r.total_ventas_q) },
                  { key: 'margen_bruto_q', label: 'Margen Q', className: 'text-right', render: r => formatGTQ(r.margen_bruto_q) },
                  { key: 'margen_pct', label: 'Margen %', className: 'text-right', render: r => `${formatNum(r.margen_pct)}%` },
                ]}
                data={marcas}
                keyField="id"
              />
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Ventas por Marca</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={marcas} dataKey="total_ventas_q" nameKey="nombre" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {marcas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TIENDAS */}
      {activeTab === 'tiendas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="p-4 border-b border-[var(--border-color)]">
                <h2 className="font-semibold flex items-center gap-2">
                  <BuildingStorefrontIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                  Margen por Tienda
                </h2>
              </div>
              <SortableTable
                columns={[
                  { key: 'nombre', label: 'Tienda', sortable: false, render: r => (
                    <div>
                      <div className="font-medium">{r.nombre}</div>
                      <div className="text-xs text-[var(--text-muted)]">{r.ciudad}, {r.pais} | {r.marca}</div>
                    </div>
                  )},
                  { key: 'metros_cuadrados', label: 'm²', className: 'text-right', render: r => (r.metros_cuadrados || 0).toLocaleString() },
                  { key: 'num_ventas', label: 'Ventas', className: 'text-right', render: r => (r.num_ventas || 0).toLocaleString() },
                  { key: 'total_ventas_q', label: 'Ventas Q', className: 'text-right', render: r => formatGTQ(r.total_ventas_q) },
                  { key: 'margen_bruto_q', label: 'Margen Q', className: 'text-right', render: r => formatGTQ(r.margen_bruto_q) },
                  { key: 'margen_pct', label: 'Margen %', className: 'text-right', render: r => `${formatNum(r.margen_pct)}%` },
                  { key: 'ventas_por_m2', label: 'Q/m²', className: 'text-right', render: r => `Q ${formatNum(r.ventas_por_m2, 0)}` },
                ]}
                data={tiendas}
                keyField="id"
              />
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Ventas por Tienda</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tiendas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="total_ventas_q" fill="#10b981" name="Ventas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PAISES */}
      {activeTab === 'paises' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="p-4 border-b border-[var(--border-color)]">
                <h2 className="font-semibold flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                  Margen por País
                </h2>
              </div>
              <SortableTable
                columns={[
                  { key: 'nombre', label: 'País', sortable: false, render: r => (
                    <div className="flex items-center gap-2">
                      <FlagIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                      <div>
                        <div className="font-medium">{r.nombre}</div>
                        <div className="text-xs text-[var(--text-muted)]">{r.moneda} | TC: {r.tipo_cambio_usd}</div>
                      </div>
                    </div>
                  )},
                  { key: 'num_tiendas', label: 'Tiendas', className: 'text-right', render: r => (r.num_tiendas || 0).toLocaleString() },
                  { key: 'num_ventas', label: 'Ventas', className: 'text-right', render: r => (r.num_ventas || 0).toLocaleString() },
                  { key: 'total_ventas_q', label: 'Ventas Q', className: 'text-right', render: r => formatGTQ(r.total_ventas_q) },
                  { key: 'margen_bruto_q', label: 'Margen Q', className: 'text-right', render: r => formatGTQ(r.margen_bruto_q) },
                  { key: 'margen_pct', label: 'Margen %', className: 'text-right', render: r => `${formatNum(r.margen_pct)}%` },
                ]}
                data={paises}
                keyField="id"
              />
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Ventas por País</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paises} dataKey="total_ventas_q" nameKey="nombre" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paises.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
