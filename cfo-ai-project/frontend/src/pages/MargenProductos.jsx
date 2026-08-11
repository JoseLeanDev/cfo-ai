import { useState, useMemo } from 'react'
import {
  ChartBarIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MinusIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useMargenProductos, useMargenProductoDetalle } from '../hooks/useCfoData'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + Math.round(value).toLocaleString('es-GT')
}

const formatNum = (value, dec = 1) => {
  if (!value && value !== 0) return '0'
  return Number(value).toFixed(dec)
}

const SEMAFORO_STYLES = {
  rojo: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: ExclamationTriangleIcon, label: 'Erosión > 5pp' },
  ambar: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: MinusIcon, label: 'Erosión 2-5pp' },
  verde: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircleIcon, label: 'Estable/Mejoró' },
}

export default function MargenProductos() {
  const { data, isLoading } = useMargenProductos()
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [filtroSemaforo, setFiltroSemaforo] = useState('todos')

  const { data: detalleData } = useMargenProductoDetalle(productoSeleccionado?.id)

  const productos = data?.data?.productos || []
  const resumen = data?.data?.resumen || {}

  const productosFiltrados = useMemo(() => {
    if (filtroSemaforo === 'todos') return productos
    return productos.filter(p => p.semaforo === filtroSemaforo)
  }, [productos, filtroSemaforo])

  const chartData = useMemo(() => {
    if (!detalleData?.data?.historial) return []
    return detalleData.data.historial.map(h => ({
      fecha: h.fecha.slice(0, 7),
      precio: parseFloat(h.precio_promedio_realizado),
      costo: parseFloat(h.costo_unitario),
      margen: parseFloat(h.margen_pct),
    }))
  }, [detalleData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
          <ChartBarIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Margen por Producto</h1>
          <p className="text-sm text-[var(--text-muted)]">Erosión de margen detectada por SKU</p>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-red-500/5 border-red-500/20">
          <div className="p-5">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Margen Perdido (12 meses)</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{formatGTQ(resumen.total_margen_perdido_12m)}</p>
            <p className="text-xs text-red-400/70 mt-1">Productos que no ajustaron precio</p>
          </div>
        </div>
        <div className="card bg-amber-500/5 border-amber-500/20">
          <div className="p-5">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Productos en Riesgo</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">{resumen.productos_rojo || 0} <span className="text-sm font-normal text-[var(--text-muted)]">rojo</span></p>
            <p className="text-xs text-amber-400/70 mt-1">+ {resumen.productos_ambar || 0} en ámbar</p>
          </div>
        </div>
        <div className="card bg-emerald-500/5 border-emerald-500/20">
          <div className="p-5">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Productos Estables</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">{resumen.productos_verde || 0}</p>
            <p className="text-xs text-emerald-400/70 mt-1">De {resumen.total_productos || 0} totales</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {['todos', 'rojo', 'ambar', 'verde'].map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroSemaforo(tipo)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtroSemaforo === tipo
                ? tipo === 'rojo' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : tipo === 'ambar' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : tipo === 'verde' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent hover:border-[var(--border-color)]'
            }`}
          >
            {tipo === 'todos' ? 'Todos' : tipo === 'rojo' ? '🔴 Erosión >5pp' : tipo === 'ambar' ? '🟡 Erosión 2-5pp' : '🟢 Estable'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Productos */}
        <div className="lg:col-span-2 card">
          <div className="section-header">
            <ChartBarIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Semáforo de Erosión</h2>
            <span className="text-xs text-[var(--text-muted)] ml-auto">{productosFiltrados.length} productos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left p-3 text-[var(--text-muted)] font-medium">Producto</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Precio</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Costo</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Margen Hoy</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Hace 12m</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Δ Puntos</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Unidades</th>
                  <th className="text-right p-3 text-[var(--text-muted)] font-medium">Q Perdidos</th>
                  <th className="text-center p-3 text-[var(--text-muted)] font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => {
                  const style = SEMAFORO_STYLES[producto.semaforo]
                  const Icon = style.icon
                  return (
                    <tr
                      key={producto.id}
                      onClick={() => setProductoSeleccionado(producto)}
                      className={`border-b border-[var(--border-color)]/50 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors ${
                        productoSeleccionado?.id === producto.id ? 'bg-[var(--bg-secondary)]' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{producto.nombre}</p>
                          <p className="text-xs text-[var(--text-muted)]">{producto.sku}</p>
                        </div>
                      </td>
                      <td className="text-right p-3">Q {formatNum(producto.precio_actual, 2)}</td>
                      <td className="text-right p-3">Q {formatNum(producto.costo_actual, 2)}</td>
                      <td className="text-right p-3 font-medium">{formatNum(producto.margen_pct_actual)}%</td>
                      <td className="text-right p-3 text-[var(--text-muted)]">{formatNum(producto.margen_pct_historico)}%</td>
                      <td className="text-right p-3">
                        <span className={producto.delta_puntos < 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {producto.delta_puntos > 0 ? '+' : ''}{formatNum(producto.delta_puntos)}
                        </span>
                      </td>
                      <td className="text-right p-3">{producto.unidades_12m?.toLocaleString('es-GT')}</td>
                      <td className="text-right p-3 text-red-400">{producto.quetzales_perdidos > 0 ? formatGTQ(producto.quetzales_perdidos) : '-'}</td>
                      <td className="text-center p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${style.bg} ${style.text} border ${style.border}`}>
                          <Icon className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Detalle */}
        <div className="card p-6">
          {productoSeleccionado ? (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-lg">{productoSeleccionado.nombre}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{productoSeleccionado.sku}</p>
                </div>
                <button
                  onClick={() => setProductoSeleccionado(null)}
                  className="p-1 hover:bg-[var(--bg-tertiary)] rounded"
                >
                  <XMarkIcon className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Precio sugerido */}
              {productoSeleccionado.precio_sugerido > productoSeleccionado.precio_actual && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                  <p className="text-xs text-red-400 uppercase tracking-wider">Precio sugerido para recuperar margen</p>
                  <p className="text-xl font-bold text-red-400">Q {formatNum(productoSeleccionado.precio_sugerido, 2)}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    vs Q {formatNum(productoSeleccionado.precio_actual, 2)} actual 
                    (+{formatNum((productoSeleccionado.precio_sugerido / productoSeleccionado.precio_actual - 1) * 100)}%)
                  </p>
                </div>
              )}

              {/* Gráfico */}
              {chartData.length > 0 && (
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line type="monotone" dataKey="precio" stroke="#10b981" strokeWidth={2} dot={false} name="Precio" />
                      <Line type="monotone" dataKey="costo" stroke="#ef4444" strokeWidth={2} dot={false} name="Costo" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Métricas del producto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)]">Margen Actual</p>
                  <p className={`text-lg font-bold ${productoSeleccionado.margen_pct_actual < 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatNum(productoSeleccionado.margen_pct_actual)}%
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)]">Margen Hace 12m</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {formatNum(productoSeleccionado.margen_pct_historico)}%
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)]">Δ Puntos</p>
                  <p className={`text-lg font-bold ${productoSeleccionado.delta_puntos < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {productoSeleccionado.delta_puntos > 0 ? '+' : ''}{formatNum(productoSeleccionado.delta_puntos)}
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)]">Q Perdidos</p>
                  <p className="text-lg font-bold text-red-400">
                    {productoSeleccionado.quetzales_perdidos > 0 ? formatGTQ(productoSeleccionado.quetzales_perdidos) : '-'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
              <ChartBarIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Selecciona un producto para ver detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
