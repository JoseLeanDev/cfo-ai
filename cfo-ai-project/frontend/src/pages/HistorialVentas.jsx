import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ChartBarIcon,
  ArrowLeftIcon,
  ShoppingCartIcon,
  MinusIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  CalendarIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import {
  demoHistorialVentasProducto,
  demoMesesHistorial,
} from '../data/demoData'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + Math.round(value).toLocaleString('es-GT')
}

const formatNum = (value) => {
  if (!value && value !== 0) return '0'
  return value.toLocaleString('es-GT')
}

const lineas = ['todas', 'Eléctrico', 'Plomería', 'Construcción', 'Pinturas', 'Herramientas', 'Jardinería']

const coloresLinea = {
  'Eléctrico': '#2563EB',
  'Plomería': '#059669',
  'Construcción': '#D97706',
  'Pinturas': '#7C3AED',
  'Herramientas': '#DC2626',
  'Jardinería': '#0891B2',
}

// ============================================
// GRÁFICA DE BARRAS VERTICAL (histórico por mes)
// ============================================
function GraficaHistorial({ historial, color, maxValor, meses }) {
  const max = maxValor || Math.max(...historial) * 1.1
  return (
    <div className="flex items-end gap-1 h-16">
      {historial.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t transition-all"
            style={{ height: `${(v / max) * 100}%`, backgroundColor: color, opacity: 0.8 }}
          />
          {/* Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#001639] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {formatNum(v)} und
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// GRÁFICA COMPARATIVA POR LÍNEA
// ============================================
function GraficaComparativaLineas({ datosPorLinea, meses }) {
  // Encontrar valor máximo
  let max = 0
  Object.values(datosPorLinea).forEach(arr => {
    max = Math.max(max, ...arr)
  })
  max = max * 1.1

  return (
    <div className="space-y-3">
      {Object.entries(datosPorLinea).map(([linea, valores]) => {
        const total = valores.reduce((a, b) => a + b, 0)
        return (
          <div key={linea} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium" style={{ color: coloresLinea[linea] }}>{linea}</span>
              <span className="font-mono text-[var(--text-muted)]">{formatNum(total)} und</span>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {valores.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all"
                  style={{ height: `${(v / max) * 100}%`, backgroundColor: coloresLinea[linea], opacity: 0.7 }}
                />
              ))}
            </div>
          </div>
        )
      })}
      <div className="flex gap-0.5 pt-1">
        {meses.map((m, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-[var(--text-muted)]">{m.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HistorialVentas() {
  const [lineaSeleccionada, setLineaSeleccionada] = useState('todas')
  const [vista, setVista] = useState('tarjetas') // tarjetas | tabla

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    const base = lineaSeleccionada === 'todas'
      ? demoHistorialVentasProducto
      : demoHistorialVentasProducto.filter(p => p.linea === lineaSeleccionada)
    return base.map(p => {
      const totalUnidades = p.historial.reduce((a, b) => a + b, 0)
      const totalIngresos = p.historial.reduce((a, b) => a + b * p.precioVenta, 0)
      const promedioMensual = Math.round(totalUnidades / 6)
      const tendencia = p.historial[5] > p.historial[0] ? 'up' : p.historial[5] < p.historial[0] ? 'down' : 'stable'
      const crecimiento = p.historial[0] > 0
        ? (((p.historial[5] - p.historial[0]) / p.historial[0]) * 100).toFixed(1)
        : '0.0'
      return { ...p, totalUnidades, totalIngresos, promedioMensual, tendencia, crecimiento: parseFloat(crecimiento) }
    }).sort((a, b) => b.totalIngresos - a.totalIngresos)
  }, [lineaSeleccionada])

  // KPIs globales
  const totalUnidades = productosFiltrados.reduce((s, p) => s + p.totalUnidades, 0)
  const totalIngresos = productosFiltrados.reduce((s, p) => s + p.totalIngresos, 0)
  const totalMargen = productosFiltrados.reduce((s, p) => s + p.totalIngresos * (p.margen / 100), 0)
  const productoTop = productosFiltrados[0]

  // Datos por línea para gráfica comparativa
  const datosPorLinea = useMemo(() => {
    const resultado = {}
    demoHistorialVentasProducto.forEach(p => {
      if (!resultado[p.linea]) resultado[p.linea] = [0, 0, 0, 0, 0, 0]
      p.historial.forEach((v, i) => { resultado[p.linea][i] += v })
    })
    return resultado
  }, [])

  // Totales por mes
  const totalesPorMes = useMemo(() => {
    const meses = [0, 0, 0, 0, 0, 0]
    productosFiltrados.forEach(p => {
      p.historial.forEach((v, i) => { meses[i] += v })
    })
    return meses
  }, [productosFiltrados])

  const maxValorHistorial = useMemo(() => {
    let max = 0
    productosFiltrados.forEach(p => {
      max = Math.max(max, ...p.historial)
    })
    return max * 1.1
  }, [productosFiltrados])

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* ============================================
          BREADCRUMBS + HEADER
      ============================================ */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Link to="/compras" className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
            <ShoppingCartIcon className="w-4 h-4" />
            Compras
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-medium">Historial de Ventas</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#001639] flex items-center justify-center shadow-lg">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Historial de Ventas por Línea</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Análisis de ventas por producto — 6 meses de historial
              </p>
            </div>
          </div>

          <Link
            to="/compras"
            className="btn-secondary text-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver a Compras
          </Link>
        </div>
      </div>

      {/* ============================================
          KPIs
      ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Total Unidades 6M</span>
            <CubeIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatNum(totalUnidades)}</div>
          <span className="text-xs text-[var(--text-muted)]">
            {productosFiltrados.length} productos
          </span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Ingresos Totales 6M</span>
            <CurrencyDollarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatGTQ(totalIngresos)}</div>
          <span className="text-xs text-[var(--text-muted)]">Ventas acumuladas</span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Margen Bruto 6M</span>
            <ChartBarIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value text-[var(--success)]">{formatGTQ(totalMargen)}</div>
          <span className="text-xs text-[var(--text-muted)]">
            {totalIngresos > 0 ? ((totalMargen / totalIngresos) * 100).toFixed(1) : 0}% del ingreso
          </span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Producto #1</span>
            <StarIcon className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="kpi-value text-lg">{productoTop ? formatGTQ(productoTop.totalIngresos) : 'Q 0'}</div>
          <span className="text-xs text-[var(--text-muted)] truncate">
            {productoTop ? productoTop.nombre.slice(0, 25) + '...' : '—'}
          </span>
        </div>
      </div>

      {/* ============================================
          GRÁFICA COMPARATIVA POR LÍNEA
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="section-header">
            <ChartPieIcon className="w-5 h-5 text-[var(--accent-blue)]" />
            <h2 className="font-semibold">Comparativa de Ventas por Línea</h2>
            <span className="ml-auto text-xs text-[var(--text-muted)]">Unidades por mes</span>
          </div>
          <div className="p-5 pt-0">
            <GraficaComparativaLineas datosPorLinea={datosPorLinea} meses={demoMesesHistorial} />
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <CalendarIcon className="w-5 h-5 text-[var(--accent-orange)]" />
            <h2 className="font-semibold">Ventas por Mes</h2>
          </div>
          <div className="p-5 pt-0 space-y-3">
            {totalesPorMes.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-14 text-xs text-[var(--text-muted)]">{demoMesesHistorial[i]}</span>
                <div className="flex-1 h-2.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(v / Math.max(...totalesPorMes)) * 100}%`,
                      backgroundColor: '#001639',
                    }}
                  />
                </div>
                <span className="w-16 text-right text-xs font-mono">{formatNum(v)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-primary)]">Total 6 meses</span>
              <span className="text-sm font-bold font-mono">{formatNum(totalUnidades)} und</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          FILTROS + VISTA
      ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <FunnelIcon className="w-4 h-4 text-[var(--text-muted)]" />
          {lineas.map(linea => (
            <button
              key={linea}
              onClick={() => setLineaSeleccionada(linea)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                lineaSeleccionada === linea
                  ? 'bg-[#001639] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-strong)]'
              }`}
            >
              {linea === 'todas' ? 'Todas' : linea}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVista('tarjetas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              vista === 'tarjetas'
                ? 'bg-[#001639] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-strong)]'
            }`}
          >
            Tarjetas
          </button>
          <button
            onClick={() => setVista('tabla')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              vista === 'tabla'
                ? 'bg-[#001639] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-strong)]'
            }`}
          >
            Tabla detallada
          </button>
        </div>
      </div>

      {/* ============================================
          VISTA TARJETAS
      ============================================ */}
      {vista === 'tarjetas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {productosFiltrados.map((producto, idx) => {
            const color = coloresLinea[producto.linea] || '#001639'
            return (
              <div key={producto.id} className="card card-hover">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
                        <span className="text-xs font-bold" style={{ color }}>{idx + 1}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-medium text-[var(--text-muted)]">{producto.linea}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {producto.tendencia === 'up' ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-[var(--success)]" />
                      ) : producto.tendencia === 'down' ? (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-[var(--danger)]" />
                      ) : (
                        <MinusIcon className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                      <span className={`text-xs font-mono ${producto.crecimiento > 0 ? 'text-[var(--success)]' : producto.crecimiento < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
                        {producto.crecimiento > 0 ? '+' : ''}{producto.crecimiento}%
                      </span>
                    </div>
                  </div>

                  {/* Nombre */}
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-3 line-clamp-2">
                    {producto.nombre}
                  </p>

                  {/* Gráfica */}
                  <GraficaHistorial
                    historial={producto.historial}
                    color={color}
                    maxValor={maxValorHistorial}
                    meses={demoMesesHistorial}
                  />
                  <div className="flex gap-1 mt-1">
                    {demoMesesHistorial.map((m, i) => (
                      <div key={i} className="flex-1 text-center">
                        <span className="text-[9px] text-[var(--text-muted)]">{m.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Total 6M</p>
                      <p className="text-sm font-bold font-mono">{formatNum(producto.totalUnidades)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Prom/Mes</p>
                      <p className="text-sm font-bold font-mono">{formatNum(producto.promedioMensual)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Ingresos</p>
                      <p className="text-sm font-bold font-mono">{formatGTQ(producto.totalIngresos)}</p>
                    </div>
                  </div>

                  {/* Relación con compras */}
                  <div className="mt-3 p-2 bg-[var(--bg-secondary)] rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Margen:</span>
                      <span className="font-mono font-medium" style={{ color }}>{producto.margen}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-[var(--text-muted)]">Precio:</span>
                      <span className="font-mono">Q {producto.precioVenta} / Q {producto.costoUnitario}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-[var(--text-muted)]">Proveedor:</span>
                      <span className="text-[var(--text-secondary)] truncate ml-2">{producto.proveedor}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================
          VISTA TABLA
      ============================================ */}
      {vista === 'tabla' && (
        <div className="card">
          <div className="section-header">
            <ChartBarIcon className="w-5 h-5 text-[var(--text-primary)]" />
            <h2 className="font-semibold">Detalle de Ventas por Producto</h2>
            <span className="ml-auto text-xs text-[var(--text-muted)]">6 meses de historial</span>
          </div>

          <div className="table-container mx-5 mb-5">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Línea</th>
                  {demoMesesHistorial.map(m => (
                    <th key={m} className="text-right">{m.split(' ')[0]}</th>
                  ))}
                  <th className="text-right">Total Und</th>
                  <th className="text-right">Ingresos</th>
                  <th className="text-right">Margen</th>
                  <th className="text-center">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto, idx) => (
                  <tr key={producto.id}>
                    <td>
                      <span className="text-xs text-[var(--text-muted)]">{idx + 1}</span>
                    </td>
                    <td>
                      <p className="font-medium text-sm">{producto.nombre}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Q {producto.precioVenta} venta · Q {producto.costoUnitario} costo
                      </p>
                    </td>
                    <td>
                      <span
                        className="badge text-[10px]"
                        style={{
                          backgroundColor: coloresLinea[producto.linea] + '15',
                          color: coloresLinea[producto.linea],
                        }}
                      >
                        {producto.linea}
                      </span>
                    </td>
                    {producto.historial.map((v, i) => (
                      <td key={i} className="text-right font-mono text-sm">
                        <span className={v > producto.promedioMensual * 1.2 ? 'text-[var(--success)] font-medium' : v < producto.promedioMensual * 0.8 ? 'text-[var(--danger)]' : ''}>
                          {formatNum(v)}
                        </span>
                      </td>
                    ))}
                    <td className="text-right font-mono font-semibold">{formatNum(producto.totalUnidades)}</td>
                    <td className="text-right font-mono font-medium">{formatGTQ(producto.totalIngresos)}</td>
                    <td className="text-right font-mono text-sm">
                      <span className="text-[var(--success)]">{formatGTQ(producto.totalIngresos * (producto.margen / 100))}</span>
                    </td>
                    <td className="text-center">
                      {producto.tendencia === 'up' ? (
                        <span className="badge-success text-[10px] flex items-center justify-center gap-1">
                          <ArrowTrendingUpIcon className="w-3 h-3" /> +{producto.crecimiento}%
                        </span>
                      ) : producto.tendencia === 'down' ? (
                        <span className="badge-danger text-[10px] flex items-center justify-center gap-1">
                          <ArrowTrendingDownIcon className="w-3 h-3" /> {producto.crecimiento}%
                        </span>
                      ) : (
                        <span className="badge-neutral text-[10px]">→ Estable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="px-5 pb-5">
            <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase">Total Unidades</p>
                  <p className="text-lg font-bold font-mono">{formatNum(totalUnidades)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase">Ingresos Totales</p>
                  <p className="text-lg font-bold font-mono text-[var(--accent-orange)]">{formatGTQ(totalIngresos)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase">Margen Bruto</p>
                  <p className="text-lg font-bold font-mono text-[var(--success)]">{formatGTQ(totalMargen)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase">Margen %</p>
                  <p className="text-lg font-bold font-mono">
                    {totalIngresos > 0 ? ((totalMargen / totalIngresos) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
