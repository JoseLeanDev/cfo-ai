import { useState } from 'react'
import {
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  ChartPieIcon,
  FunnelIcon,
  CubeIcon,
  MapPinIcon,
  StarIcon
} from '@heroicons/react/24/outline'

// Format currency GTQ
const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

// Datos de ejemplo - En producción vendrían del API
const productosData = [
  { id: 1, nombre: 'Cable THW 12 AWG (Rollo 100m)', categoria: 'Eléctrico', unidadesVendidas: 2450, ingresos: 882000, margen: 32, tendencia: 'up', stock: 'ok' },
  { id: 2, nombre: 'Tubo PVC 1/2" (Caja 20 unds)', categoria: 'Plomería', unidadesVendidas: 1890, ingresos: 567000, margen: 28, tendencia: 'up', stock: 'bajo' },
  { id: 3, nombre: 'Interruptor Breaker 2P 30A', categoria: 'Eléctrico', unidadesVendidas: 1240, ingresos: 496000, margen: 35, tendencia: 'down', stock: 'ok' },
  { id: 4, nombre: 'Pintura Latex Blanca 1 Galón', categoria: 'Pinturas', unidadesVendidas: 1100, ingresos: 385000, margen: 25, tendencia: 'up', stock: 'ok' },
  { id: 5, nombre: 'Cemento Portland 42.5kg', categoria: 'Construcción', unidadesVendidas: 980, ingresos: 441000, margen: 18, tendencia: 'down', stock: 'crítico' },
  { id: 6, nombre: 'Lámina Galvanizada 3x8 pies', categoria: 'Construcción', unidadesVendidas: 750, ingresos: 375000, margen: 22, tendencia: 'up', stock: 'ok' },
  { id: 7, nombre: 'Foco LED 9W (Caja 10 unds)', categoria: 'Eléctrico', unidadesVendidas: 680, ingresos: 204000, margen: 40, tendencia: 'up', stock: 'ok' },
  { id: 8, nombre: 'Llave de Paso 1/2"', categoria: 'Plomería', unidadesVendidas: 620, ingresos: 186000, margen: 30, tendencia: 'stable', stock: 'ok' },
]

const tiendasData = [
  { id: 1, nombre: 'Sede Central - Zona 1', region: 'Guatemala', ventas: 4200000, transacciones: 1840, ticketPromedio: 2282, clientesUnicos: 420, meta: 4000000, cumplimiento: 105 },
  { id: 2, nombre: 'Sucursal Zona 10', region: 'Guatemala', ventas: 3100000, transacciones: 1320, ticketPromedio: 2348, clientesUnicos: 315, meta: 3200000, cumplimiento: 97 },
  { id: 3, nombre: 'Sucursal Quetzaltenango', region: 'Occidente', ventas: 2800000, transacciones: 1280, ticketPromedio: 2187, clientesUnicos: 380, meta: 2600000, cumplimiento: 108 },
  { id: 4, nombre: 'Sucursal Escuintla', region: 'Sur', ventas: 1900000, transacciones: 950, ticketPromedio: 2000, clientesUnicos: 280, meta: 2000000, cumplimiento: 95 },
  { id: 5, nombre: 'Sucursal Puerto Barrios', region: 'Caribe', ventas: 1200000, transacciones: 640, ticketPromedio: 1875, clientesUnicos: 195, meta: 1300000, cumplimiento: 92 },
]

const clientesData = [
  { id: 1, nombre: 'Constructora Metropolitana', tipo: 'Empresarial', compras: 8500000, transacciones: 45, ticketPromedio: 188888, frecuencia: 'Semanal', tendencia: 'up' },
  { id: 2, nombre: 'Grupo Industrial Centroamericano', tipo: 'Empresarial', compras: 6200000, transacciones: 38, ticketPromedio: 163157, frecuencia: 'Quincenal', tendencia: 'up' },
  { id: 3, nombre: 'Inversiones del Norte', tipo: 'Empresarial', compras: 4100000, transacciones: 28, ticketPromedio: 146428, frecuencia: 'Mensual', tendencia: 'stable' },
  { id: 4, nombre: 'Distribuidora del Sur', tipo: 'Distribuidor', compras: 2800000, transacciones: 52, ticketPromedio: 53846, frecuencia: 'Semanal', tendencia: 'down' },
  { id: 5, nombre: 'Comercializadora Maya', tipo: 'Pyme', compras: 1900000, transacciones: 85, ticketPromedio: 22352, frecuencia: 'Semanal', tendencia: 'up' },
  { id: 6, nombre: 'Importadora del Pacífico', tipo: 'Empresarial', compras: 1500000, transacciones: 18, ticketPromedio: 83333, frecuencia: 'Mensual', tendencia: 'stable' },
  { id: 7, nombre: 'Ferretería La Unión', tipo: 'Pyme', compras: 1200000, transacciones: 120, ticketPromedio: 10000, frecuencia: '2x semana', tendencia: 'up' },
  { id: 8, nombre: 'Suministros Industriales', tipo: 'Pyme', compras: 950000, transacciones: 42, ticketPromedio: 22619, frecuencia: 'Semanal', tendencia: 'down' },
]

const insightsData = [
  {
    tipo: 'oportunidad',
    titulo: 'Cable THW lidera ventas con 32% margen',
    descripcion: 'El producto estrella genera Q882K mensuales. Considerar negociar volumen con proveedor para mejorar margen al 35%.',
    icono: TrophyIcon
  },
  {
    tipo: 'alerta',
    titulo: 'Stock crítico en Cemento Portland',
    descripcion: 'Solo quedan 45 unidades. El producto tiene alta rotación (980/mes). Reordenar inmediatamente para evitar pérdida de ventas.',
    icono: CubeIcon
  },
  {
    tipo: 'insight',
    titulo: 'Sucursal Quetzaltenango supera meta en 8%',
    descripcion: 'Aunque es la 3ra en volumen, tiene el mejor cumplimiento (108%). Replicar estrategia de atención en otras sucursales.',
    icono: MapPinIcon
  },
  {
    tipo: 'alerta',
    titulo: 'Cliente "Distribuidora del Sur" en tendencia negativa',
    descripcion: 'Compras bajaron 15% vs mes anterior. Contactar para evaluar satisfacción y ofrecer incentivos de volumen.',
    icono: UsersIcon
  }
]

export default function AnalisisVentas() {
  const [activeTab, setActiveTab] = useState('productos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroRegion, setFiltroRegion] = useState('todas')
  const [filtroTipoCliente, setFiltroTipoCliente] = useState('todos')

  // Calcular totales
  const totalIngresosProductos = productosData.reduce((sum, p) => sum + p.ingresos, 0)
  const totalVentasTiendas = tiendasData.reduce((sum, t) => sum + t.ventas, 0)
  const totalComprasClientes = clientesData.reduce((sum, c) => sum + c.compras, 0)
  const ticketPromedioGlobal = Math.round(totalVentasTiendas / tiendasData.reduce((sum, t) => sum + t.transacciones, 0))

  // Filtrar datos
  const productosFiltrados = filtroCategoria === 'todas' 
    ? productosData 
    : productosData.filter(p => p.categoria === filtroCategoria)
  
  const tiendasFiltradas = filtroRegion === 'todas'
    ? tiendasData
    : tiendasData.filter(t => t.region === filtroRegion)
    
  const clientesFiltrados = filtroTipoCliente === 'todos'
    ? clientesData
    : clientesData.filter(c => c.tipo === filtroTipoCliente)

  // Ordenar por ingresos/ventas
  const productosOrdenados = [...productosFiltrados].sort((a, b) => b.ingresos - a.ingresos)
  const tiendasOrdenadas = [...tiendasFiltradas].sort((a, b) => b.ventas - a.ventas)
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => b.compras - a.compras)

  const getInsightStyles = (tipo) => {
    switch (tipo) {
      case 'oportunidad': return 'border-l-[var(--success)] bg-[var(--success-bg)]'
      case 'alerta': return 'border-l-[var(--warning)] bg-[var(--warning-bg)]'
      case 'insight': return 'border-l-[var(--accent-blue)] bg-[var(--info-bg)]'
      default: return 'border-l-[var(--accent-blue)] bg-[var(--info-bg)]'
    }
  }

  const tabs = [
    { id: 'productos', label: 'Productos', icon: ShoppingBagIcon },
    { id: 'tiendas', label: 'Tiendas / Sucursales', icon: BuildingStorefrontIcon },
    { id: 'clientes', label: 'Clientes', icon: UsersIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header con KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Ingresos Productos</span>
            <ShoppingBagIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatGTQ(totalIngresosProductos)}</div>
          <span className="text-xs text-[var(--text-muted)]">Top 8 productos</span>
        </div>
        
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Ventas por Tienda</span>
            <BuildingStorefrontIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatGTQ(totalVentasTiendas)}</div>
          <span className="text-xs text-[var(--text-muted)]">{tiendasData.length} sucursales</span>
        </div>
        
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Ticket Promedio</span>
            <ChartPieIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatGTQ(ticketPromedioGlobal)}</div>
          <span className="text-xs text-[var(--success)]">↑ 8.3% vs mes ant.</span>
        </div>
        
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Top Cliente</span>
            <StarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value text-lg">{formatGTQ(clientesData[0].compras)}</div>
          <span className="text-xs text-[var(--text-muted)]">{clientesData[0].nombre.slice(0, 20)}...</span>
        </div>
      </div>

      {/* Insights automáticos */}
      <div className="card">
        <div className="section-header">
          <SparklesIcon className="w-5 h-5 text-[var(--accent-blue)]" />
          <h2 className="font-semibold">Insights de Ventas</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-5 pt-0">
          {insightsData.map((insight, idx) => {
            const Icon = insight.icono
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${getInsightStyles(insight.tipo)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[var(--text-primary)] text-sm">{insight.titulo}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{insight.descripcion}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-[var(--text-muted)]" />
            {activeTab === 'productos' && (
              <select 
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="input text-xs py-1.5 w-auto"
              >
                <option value="todas">Todas las categorías</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Plomería">Plomería</option>
                <option value="Construcción">Construcción</option>
                <option value="Pinturas">Pinturas</option>
              </select>
            )}
            {activeTab === 'tiendas' && (
              <select 
                value={filtroRegion}
                onChange={(e) => setFiltroRegion(e.target.value)}
                className="input text-xs py-1.5 w-auto"
              >
                <option value="todas">Todas las regiones</option>
                <option value="Guatemala">Guatemala</option>
                <option value="Occidente">Occidente</option>
                <option value="Sur">Sur</option>
                <option value="Caribe">Caribe</option>
              </select>
            )}
            {activeTab === 'clientes' && (
              <select 
                value={filtroTipoCliente}
                onChange={(e) => setFiltroTipoCliente(e.target.value)}
                className="input text-xs py-1.5 w-auto"
              >
                <option value="todos">Todos los tipos</option>
                <option value="Empresarial">Empresarial</option>
                <option value="Distribuidor">Distribuidor</option>
                <option value="Pyme">Pyme</option>
              </select>
            )}
          </div>
        </div>

        {/* Contenido de Productos */}
        {activeTab === 'productos' && (
          <div className="p-5 space-y-4">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="text-right">Unidades</th>
                    <th className="text-right">Ingresos</th>
                    <th className="text-right">Margen</th>
                    <th className="text-center">Tendencia</th>
                    <th className="text-center">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productosOrdenados.map((producto, idx) => (
                    <tr key={producto.id} className="group">
                      <td>
                        {idx < 3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-600' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {idx + 1}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] ml-2">{idx + 1}</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-sm">{producto.nombre}</p>
                          <div className="mt-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden w-32">
                            <div 
                              className="h-full bg-black rounded-full transition-all"
                              style={{ width: `${(producto.ingresos / productosOrdenados[0].ingresos) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-neutral text-[10px]">{producto.categoria}</span>
                      </td>
                      <td className="text-right font-mono text-sm">{producto.unidadesVendidas.toLocaleString()}</td>
                      <td className="text-right font-mono font-medium">{formatGTQ(producto.ingresos)}</td>
                      <td className="text-right">
                        <span className={`font-mono text-sm ${producto.margen >= 30 ? 'text-[var(--success)]' : producto.margen >= 20 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'}`}>
                          {producto.margen}%
                        </span>
                      </td>
                      <td className="text-center">
                        {producto.tendencia === 'up' ? (
                          <ArrowTrendingUpIcon className="w-4 h-4 text-[var(--success)] mx-auto" />
                        ) : producto.tendencia === 'down' ? (
                          <ArrowTrendingDownIcon className="w-4 h-4 text-[var(--danger)] mx-auto" />
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">→</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge text-[10px] ${
                          producto.stock === 'ok' ? 'badge-success' :
                          producto.stock === 'bajo' ? 'badge-warning' :
                          'badge-danger'
                        }`}>
                          {producto.stock === 'ok' ? 'OK' : producto.stock === 'bajo' ? 'Bajo' : 'Crítico'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Resumen por categoría */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {['Eléctrico', 'Plomería', 'Construcción', 'Pinturas'].map(cat => {
                const productosCat = productosData.filter(p => p.categoria === cat)
                const totalCat = productosCat.reduce((sum, p) => sum + p.ingresos, 0)
                const margenPromedio = productosCat.length > 0 
                  ? Math.round(productosCat.reduce((sum, p) => sum + p.margen, 0) / productosCat.length)
                  : 0
                return (
                  <div key={cat} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)] uppercase font-medium">{cat}</p>
                    <p className="text-lg font-bold mt-1">{formatGTQ(totalCat)}</p>
                    <p className="text-xs text-[var(--text-muted)]">Margen promedio: {margenPromedio}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Contenido de Tiendas */}
        {activeTab === 'tiendas' && (
          <div className="p-5 space-y-4">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Sucursal</th>
                    <th>Región</th>
                    <th className="text-right">Ventas</th>
                    <th className="text-right">Trans.</th>
                    <th className="text-right">Ticket Prom.</th>
                    <th className="text-right">Clientes</th>
                    <th className="text-center">Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {tiendasOrdenadas.map((tienda, idx) => (
                    <tr key={tienda.id}>
                      <td>
                        <span className="text-xs text-[var(--text-muted)] ml-2">{idx + 1}</span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-sm">{tienda.nombre}</p>
                          <div className="mt-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden w-32">
                            <div 
                              className="h-full bg-black rounded-full"
                              style={{ width: `${(tienda.ventas / tiendasOrdenadas[0].ventas) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-neutral text-[10px]">{tienda.region}</span>
                      </td>
                      <td className="text-right font-mono font-medium">{formatGTQ(tienda.ventas)}</td>
                      <td className="text-right font-mono text-sm">{tienda.transacciones}</td>
                      <td className="text-right font-mono text-sm">{formatGTQ(tienda.ticketPromedio)}</td>
                      <td className="text-right font-mono text-sm">{tienda.clientesUnicos}</td>
                      <td className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-medium ${tienda.cumplimiento >= 100 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                            {tienda.cumplimiento}%
                          </span>
                          <div className="w-12 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${tienda.cumplimiento >= 100 ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'}`}
                              style={{ width: `${Math.min(100, tienda.cumplimiento)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Comparativa de sucursales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)] uppercase font-medium">Mejor Ticket Promedio</p>
                <p className="text-lg font-bold mt-1">{formatGTQ(Math.max(...tiendasData.map(t => t.ticketPromedio)))}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {tiendasData.find(t => t.ticketPromedio === Math.max(...tiendasData.map(t => t.ticketPromedio)))?.nombre}
                </p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)] uppercase font-medium">Mayor Cumplimiento</p>
                <p className="text-lg font-bold mt-1">{Math.max(...tiendasData.map(t => t.cumplimiento))}%</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {tiendasData.find(t => t.cumplimiento === Math.max(...tiendasData.map(t => t.cumplimiento)))?.nombre}
                </p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)] uppercase font-medium">Más Clientes Únicos</p>
                <p className="text-lg font-bold mt-1">{Math.max(...tiendasData.map(t => t.clientesUnicos))}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {tiendasData.find(t => t.clientesUnicos === Math.max(...tiendasData.map(t => t.clientesUnicos)))?.nombre}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de Clientes */}
        {activeTab === 'clientes' && (
          <div className="p-5 space-y-4">
            {/* Concentración de clientes - Pareto */}
            <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
              <h3 className="text-sm font-semibold mb-3">Concentración de Ingresos (Regla 80/20)</h3>
              <div className="space-y-2">
                {clientesOrdenados.map((cliente, idx) => {
                  const porcentaje = (cliente.compras / totalComprasClientes * 100).toFixed(1)
                  const acumulado = clientesOrdenados
                    .slice(0, idx + 1)
                    .reduce((sum, c) => sum + c.compras, 0) / totalComprasClientes * 100
                  return (
                    <div key={cliente.id} className="flex items-center gap-3">
                      <span className="w-6 text-xs text-[var(--text-muted)] text-right">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm truncate">{cliente.nombre}</span>
                          <span className="text-xs font-mono">{porcentaje}%</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${porcentaje * 3}%`,
                              backgroundColor: idx < 2 ? 'var(--danger)' : idx < 4 ? 'var(--warning)' : 'var(--success)'
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[var(--text-muted)] w-12 text-right">
                        {acumulado.toFixed(0)}%
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--danger)]"></div>
                  <span>Alto riesgo {'>'}15%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--warning)]"></div>
                  <span>Medio riesgo 8-15%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--success)]"></div>
                  <span>Bajo riesgo {'<'}8%</span>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th className="text-right">Compras</th>
                    <th className="text-right">Trans.</th>
                    <th className="text-right">Ticket Prom.</th>
                    <th className="text-center">Frecuencia</th>
                    <th className="text-center">Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesOrdenados.map((cliente, idx) => (
                    <tr key={cliente.id}>
                      <td>
                        {idx < 3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-600' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {idx + 1}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] ml-2">{idx + 1}</span>
                        )}
                      </td>
                      <td>
                        <p className="font-medium text-sm">{cliente.nombre}</p>
                      </td>
                      <td>
                        <span className={`badge text-[10px] ${
                          cliente.tipo === 'Empresarial' ? 'badge-info' :
                          cliente.tipo === 'Distribuidor' ? 'badge-success' :
                          'badge-neutral'
                        }`}>
                          {cliente.tipo}
                        </span>
                      </td>
                      <td className="text-right font-mono font-medium">{formatGTQ(cliente.compras)}</td>
                      <td className="text-right font-mono text-sm">{cliente.transacciones}</td>
                      <td className="text-right font-mono text-sm">{formatGTQ(cliente.ticketPromedio)}</td>
                      <td className="text-center">
                        <span className="text-xs text-[var(--text-muted)]">{cliente.frecuencia}</span>
                      </td>
                      <td className="text-center">
                        {cliente.tendencia === 'up' ? (
                          <span className="badge-success text-[10px]">↑ Creciendo</span>
                        ) : cliente.tendencia === 'down' ? (
                          <span className="badge-danger text-[10px]">↓ Baja</span>
                        ) : (
                          <span className="badge-neutral text-[10px]">→ Estable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
