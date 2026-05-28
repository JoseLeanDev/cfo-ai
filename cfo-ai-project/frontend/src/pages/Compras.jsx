import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  TruckIcon,
  CubeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowPathIcon,
  CalculatorIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import {
  demoLineasProducto,
  demoProductosStock,
  demoMesesHistorial,
  demoMesesProyeccion,
} from '../data/demoData'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + Math.round(value).toLocaleString('es-GT')
}

const formatNum = (value) => {
  if (!value && value !== 0) return '0'
  return value.toLocaleString('es-GT')
}

// ============================================
// MOTOR DE PROYECCIÓN Y RECOMENDACIONES
// ============================================

function calcularProyeccion(historial) {
  // Proyección por tendencia lineal simple (últimos 3 meses vs primeros 3)
  const primeros3 = historial.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const ultimos3 = historial.slice(3, 6).reduce((a, b) => a + b, 0) / 3
  const tendencia = (ultimos3 - primeros3) / primeros3 // % de crecimiento
  
  const promedio = historial.reduce((a, b) => a + b, 0) / historial.length
  const proyeccion3meses = [
    Math.round(promedio * (1 + tendencia * 0.3)),
    Math.round(promedio * (1 + tendencia * 0.5)),
    Math.round(promedio * (1 + tendencia * 0.7)),
  ]
  return { proyeccion3meses, tendencia, promedioMensual: Math.round(promedio) }
}

function calcularRecomendacion(linea, proyeccion) {
  const totalProyeccion = proyeccion.proyeccion3meses.reduce((a, b) => a + b, 0)
  const stockSeguridad = Math.round(proyeccion.promedioMensual * (linea.tiempoEntregaDias / 30) * 1.5)
  const cantidadRecomendada = Math.max(0, totalProyeccion + stockSeguridad - linea.stockActual)
  const valorCompra = cantidadRecomendada * linea.costoUnitarioPromedio
  
  // Determinar prioridad
  let prioridad = 'Baja'
  const diasCobertura = linea.stockActual / (proyeccion.promedioMensual / 30)
  
  if (linea.stockActual < linea.stockMinimo) {
    prioridad = 'Urgente'
  } else if (diasCobertura < linea.tiempoEntregaDias * 1.5) {
    prioridad = 'Alta'
  } else if (diasCobertura < linea.tiempoEntregaDias * 3) {
    prioridad = 'Media'
  }
  
  return {
    cantidadRecomendada,
    valorCompra,
    stockSeguridad,
    diasCobertura: Math.round(diasCobertura),
    prioridad,
  }
}

function calcularEstadoProducto(producto) {
  const diasCobertura = producto.stock / (producto.ventaPromedioMensual / 30)
  const cantidadRecomendada = Math.max(0, producto.ventaPromedioMensual + producto.stockMin - producto.stock)
  const valorCompra = cantidadRecomendada * producto.costoUnitario
  
  let estado = 'OK'
  if (producto.stock < producto.stockMin) estado = 'Crítico'
  else if (diasCobertura < producto.diasEntrega * 2) estado = 'Bajo'
  else if (diasCobertura < producto.diasEntrega * 4) estado = 'Atención'
  
  return { diasCobertura: Math.round(diasCobertura), cantidadRecomendada, valorCompra, estado }
}

// ============================================
// COMPONENTE BARRA DE PROGRESO (histórico + proyección)
// ============================================
function BarraHistorialProyeccion({ historial, proyeccion, maxValor, color = '#001639' }) {
  const todos = [...historial, ...proyeccion]
  const max = maxValor || Math.max(...todos) * 1.1
  
  return (
    <div className="flex items-end gap-1 h-16">
      {historial.map((v, i) => (
        <div key={`h-${i}`} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(v / max) * 100}%`,
              backgroundColor: color,
              opacity: 0.8,
            }}
          />
        </div>
      ))}
      {proyeccion.map((v, i) => (
        <div key={`p-${i}`} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t transition-all border-2 border-dashed"
            style={{
              height: `${(v / max) * 100}%`,
              backgroundColor: color,
              opacity: 0.35,
              borderColor: color,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================
export default function Compras() {
  const [lineaSeleccionada, setLineaSeleccionada] = useState('todas')
  const [vistaExpandida, setVistaExpandida] = useState(false)
  const [mostrarSoloCriticos, setMostrarSoloCriticos] = useState(false)

  // Calcular proyecciones y recomendaciones
  const datosLineas = useMemo(() => {
    return demoLineasProducto.map(linea => {
      const proyeccion = calcularProyeccion(linea.historialVentas)
      const recomendacion = calcularRecomendacion(linea, proyeccion)
      return { ...linea, ...proyeccion, ...recomendacion }
    })
  }, [])

  const datosProductos = useMemo(() => {
    return demoProductosStock.map(p => {
      const estado = calcularEstadoProducto(p)
      return { ...p, ...estado }
    })
  }, [])

  // Filtrar
  const lineasFiltradas = lineaSeleccionada === 'todas'
    ? datosLineas
    : datosLineas.filter(l => l.id === lineaSeleccionada)

  const productosFiltrados = lineaSeleccionada === 'todas'
    ? datosProductos
    : datosProductos.filter(p => p.linea === datosLineas.find(l => l.id === lineaSeleccionada)?.nombre)

  const productosCriticos = mostrarSoloCriticos
    ? productosFiltrados.filter(p => p.estado === 'Crítico' || p.estado === 'Bajo')
    : productosFiltrados

  // KPIs globales
  const valorInventarioTotal = datosProductos.reduce((s, p) => s + p.stock * p.costoUnitario, 0)
  const lineasEnCritico = datosLineas.filter(l => l.stockActual < l.stockMinimo).length
  const totalAComprar = datosLineas.reduce((s, l) => s + l.valorCompra, 0)
  const coberturaPromedio = Math.round(
    datosLineas.reduce((s, l) => s + l.diasCobertura, 0) / datosLineas.length
  )
  const rotacionPromedio = (
    datosLineas.reduce((s, l) => s + l.promedioMensual * 6, 0) / valorInventarioTotal * 12
  ).toFixed(1)

  // Alertas de stock crítico (top 5 productos más urgentes)
  const alertasCriticas = [...datosProductos]
    .filter(p => p.estado === 'Crítico')
    .sort((a, b) => a.diasCobertura - b.diasCobertura)
    .slice(0, 5)

  // Productos con mayor cantidad recomendada
  const topRecomendaciones = [...datosProductos]
    .filter(p => p.cantidadRecomendada > 0)
    .sort((a, b) => b.valorCompra - a.valorCompra)
    .slice(0, 8)

  const getPrioridadStyles = (prioridad) => {
    switch (prioridad) {
      case 'Urgente': return 'bg-red-50 text-red-700 border-red-200'
      case 'Alta': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'Media': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default: return 'bg-green-50 text-green-700 border-green-200'
    }
  }

  const getEstadoStyles = (estado) => {
    switch (estado) {
      case 'Crítico': return 'badge-danger'
      case 'Bajo': return 'badge-warning'
      case 'Atención': return 'badge-info'
      default: return 'badge-success'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* ============================================
          HEADER
      ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#001639] flex items-center justify-center shadow-lg">
            <ShoppingCartIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Compras Inteligentes</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Análisis de ventas · Proyección · Recomendaciones de inventario
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Análisis actualizado:</span>
          <span className="badge-success text-[10px] flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            {new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Link al historial de ventas */}
      <div className="flex items-center gap-3 p-4 bg-[var(--accent-blue-subtle)] rounded-lg border border-[var(--accent-blue)]/20">
        <ChartBarIcon className="w-5 h-5 text-[var(--accent-blue)]" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            ¿Necesitas ver el detalle de ventas por producto?
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Análisis completo de ventas históricas por línea y producto individual
          </p>
        </div>
        <Link
          to="/compras/historial-ventas"
          className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap"
        >
          <ChartBarIcon className="w-4 h-4" />
          Ver Historial de Ventas
        </Link>
      </div>

      {/* ============================================
          KPIs PRINCIPALES
      ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Valor Inventario</span>
            <CubeIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatGTQ(valorInventarioTotal)}</div>
          <span className="text-xs text-[var(--text-muted)]">{datosProductos.length} productos</span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Cobertura Promedio</span>
            <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{coberturaPromedio} días</div>
          <span className="text-xs text-[var(--text-muted)]">Stock vs ventas</span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Stock Crítico</span>
            <ExclamationTriangleIcon className="w-4 h-4 text-[var(--danger)]" />
          </div>
          <div className="kpi-value text-[var(--danger)]">{lineasEnCritico} líneas</div>
          <span className="text-xs text-[var(--text-muted)]">
            {datosProductos.filter(p => p.estado === 'Crítico').length} productos
          </span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Compra Recomendada</span>
            <CurrencyDollarIcon className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="kpi-value text-[var(--accent-orange)]">{formatGTQ(totalAComprar)}</div>
          <span className="text-xs text-[var(--text-muted)]">Próximo trimestre</span>
        </div>
      </div>

      {/* ============================================
          ALERTAS DE STOCK CRÍTICO
      ============================================ */}
      {alertasCriticas.length > 0 && (
        <div className="card border-l-4 border-l-[var(--danger)]">
          <div className="section-header">
            <ExclamationTriangleIcon className="w-5 h-5 text-[var(--danger)]" />
            <h2 className="font-semibold text-[var(--danger)]">⚠️ Alertas de Stock Crítico — Reordenar Urgente</h2>
            <span className="ml-auto badge-danger text-[10px]">{alertasCriticas.length} productos</span>
          </div>
          <div className="p-5 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {alertasCriticas.map((producto) => (
                <div key={producto.id} className="p-4 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger)]/20">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-[var(--danger)] uppercase">{producto.linea}</span>
                    <span className="badge-danger text-[10px]">{producto.diasCobertura} días</span>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">{producto.nombre}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Stock: <b>{producto.stock}</b> und</span>
                    <span className="text-xs font-mono text-[var(--danger)] font-medium">
                      +{formatNum(producto.cantidadRecomendada)} und
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    Valor: <span className="font-mono text-[var(--text-primary)]">{formatGTQ(producto.valorCompra)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          FILTRO POR LÍNEA + VISTAS
      ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setLineaSeleccionada('todas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              lineaSeleccionada === 'todas'
                ? 'bg-[#001639] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-strong)]'
            }`}
          >
            Todas las líneas
          </button>
          {datosLineas.map(linea => (
            <button
              key={linea.id}
              onClick={() => setLineaSeleccionada(linea.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                lineaSeleccionada === linea.id
                  ? 'bg-[#001639] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-strong)]'
              }`}
            >
              {linea.nombre}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarSoloCriticos(!mostrarSoloCriticos)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              mostrarSoloCriticos
                ? 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-strong)]'
            }`}
          >
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            Solo críticos
          </button>
          <button
            onClick={() => setVistaExpandida(!vistaExpandida)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-strong)] transition-all"
          >
            {vistaExpandida ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
            {vistaExpandida ? 'Compactar' : 'Expandir'}
          </button>
        </div>
      </div>

      {/* ============================================
          ANÁLISIS POR LÍNEA: HISTÓRICO + PROYECCIÓN
      ============================================ */}
      <div className="card">
        <div className="section-header">
          <ChartBarIcon className="w-5 h-5 text-[var(--accent-blue)]" />
          <h2 className="font-semibold">Análisis de Ventas por Línea</h2>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            Histórico 6 meses → Proyección 3 meses
          </span>
        </div>
        
        <div className={`p-5 pt-0 grid gap-4 ${vistaExpandida ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
          {lineasFiltradas.map((linea) => {
            const color = linea.tendencia === 'up' ? '#059669' : linea.tendencia === 'down' ? '#DC2626' : '#2563EB'
            const totalHistorico = linea.historialVentas.reduce((a, b) => a + b, 0)
            const totalProyeccion = linea.proyeccion3meses.reduce((a, b) => a + b, 0)
            const crecimiento = ((totalProyeccion - totalHistorico / 2) / (totalHistorico / 2) * 100).toFixed(1)
            
            return (
              <div key={linea.id} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{linea.nombre}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{linea.descripcion.slice(0, 50)}...</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge text-[10px] ${getPrioridadStyles(linea.prioridad)}`}>
                      {linea.prioridad}
                    </span>
                  </div>
                </div>
                
                {/* Gráfica mini */}
                <BarraHistorialProyeccion
                  historial={linea.historialVentas}
                  proyeccion={linea.proyeccion3meses}
                  color={color}
                />
                
                {/* Labels */}
                <div className="flex gap-1 mt-1 mb-3">
                  {demoMesesHistorial.map((m, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[9px] text-[var(--text-muted)]">{m.split(' ')[0]}</span>
                    </div>
                  ))}
                  {demoMesesProyeccion.map((m, i) => (
                    <div key={`p-${i}`} className="flex-1 text-center">
                      <span className="text-[9px] text-[var(--text-muted)] italic">{m.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Histórico 6M</p>
                    <p className="text-sm font-bold font-mono">{formatNum(totalHistorico)} und</p>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Proyección 3M</p>
                    <p className="text-sm font-bold font-mono">{formatNum(totalProyeccion)} und</p>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Crecimiento</p>
                    <p className={`text-sm font-bold font-mono ${parseFloat(crecimiento) > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {parseFloat(crecimiento) > 0 ? '+' : ''}{crecimiento}%
                    </p>
                  </div>
                </div>
                
                {/* Stock actual vs proyección */}
                <div className="mt-3 p-2 bg-white rounded">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-muted)]">Stock actual vs necesidad trimestral</span>
                    <span className="font-mono font-medium">
                      {linea.stockActual} / {formatNum(totalProyeccion + linea.stockSeguridad)} und
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (linea.stockActual / (totalProyeccion + linea.stockSeguridad)) * 100)}%`,
                        backgroundColor: linea.stockActual < totalProyeccion + linea.stockSeguridad ? 'var(--danger)' : 'var(--success)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ============================================
          TABLA DE RECOMENDACIONES POR LÍNEA
      ============================================ */}
      <div className="card">
        <div className="section-header">
          <CalculatorIcon className="w-5 h-5 text-[var(--accent-orange)]" />
          <h2 className="font-semibold">Recomendaciones de Compra por Línea</h2>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            <SparklesIcon className="w-3.5 h-3.5 inline mr-1" />
            Calculado con proyección + stock de seguridad
          </span>
        </div>
        
        <div className="table-container mx-5 mb-5">
          <table className="table">
            <thead>
              <tr>
                <th>Línea</th>
                <th className="text-right">Stock Actual</th>
                <th className="text-right">Prom. Mensual</th>
                <th className="text-right">Proyección 3M</th>
                <th className="text-right">Stock Seg.</th>
                <th className="text-right">Cantidad a Comprar</th>
                <th className="text-right">Valor Estimado</th>
                <th className="text-center">Prioridad</th>
                <th className="text-center">Cobertura</th>
                <th>Proveedor</th>
              </tr>
            </thead>
            <tbody>
              {lineasFiltradas.map((linea) => (
                <tr key={linea.id} className={linea.prioridad === 'Urgente' ? 'bg-red-50/50' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{
                        backgroundColor: linea.tendencia === 'up' ? 'var(--success)' : linea.tendencia === 'down' ? 'var(--danger)' : 'var(--accent-blue)'
                      }} />
                      <div>
                        <p className="font-medium text-sm">{linea.nombre}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Entrega: {linea.tiempoEntregaDias} días</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right font-mono text-sm">{formatNum(linea.stockActual)}</td>
                  <td className="text-right font-mono text-sm">{formatNum(linea.promedioMensual)}</td>
                  <td className="text-right font-mono text-sm">{formatNum(linea.proyeccion3meses.reduce((a, b) => a + b, 0))}</td>
                  <td className="text-right font-mono text-sm text-[var(--text-muted)]">{formatNum(linea.stockSeguridad)}</td>
                  <td className="text-right font-mono font-semibold text-[var(--accent-orange)]">
                    {linea.cantidadRecomendada > 0 ? formatNum(linea.cantidadRecomendada) : <span className="text-[var(--success)] text-xs">Suficiente</span>}
                  </td>
                  <td className="text-right font-mono font-medium">
                    {linea.valorCompra > 0 ? formatGTQ(linea.valorCompra) : <span className="text-[var(--success)] text-xs">—</span>}
                  </td>
                  <td className="text-center">
                    <span className={`badge text-[10px] ${getPrioridadStyles(linea.prioridad)}`}>
                      {linea.prioridad}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`font-mono text-xs ${linea.diasCobertura < linea.tiempoEntregaDias * 2 ? 'text-[var(--danger)]' : linea.diasCobertura < 30 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                      {linea.diasCobertura} d
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <TruckIcon className="w-3 h-3 text-[var(--text-muted)]" />
                      {linea.proveedorPrincipal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Resumen del pedido recomendado */}
        <div className="px-5 pb-5">
          <div className="p-4 bg-[var(--accent-orange-subtle)] rounded-lg border border-[var(--accent-orange)]/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalculatorIcon className="w-5 h-5 text-[var(--accent-orange)]" />
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">Pedido Recomendado Consolidado</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {lineasFiltradas.filter(l => l.cantidadRecomendada > 0).length} líneas necesitan reabastecimiento
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Total Unidades</p>
                  <p className="text-lg font-bold font-mono text-[var(--accent-orange)]">
                    {formatNum(lineasFiltradas.reduce((s, l) => s + l.cantidadRecomendada, 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Inversión Total</p>
                  <p className="text-xl font-bold font-mono text-[var(--accent-orange)]">
                    {formatGTQ(lineasFiltradas.reduce((s, l) => s + l.valorCompra, 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          TOP PRODUCTOS A REORDENAR
      ============================================ */}
      {topRecomendaciones.length > 0 && (
        <div className="card">
          <div className="section-header">
            <ArrowPathIcon className="w-5 h-5 text-[var(--accent-blue)]" />
            <h2 className="font-semibold">Productos Prioritarios a Reordenar</h2>
            <span className="ml-auto text-xs text-[var(--text-muted)]">Ordenados por valor de compra</span>
          </div>
          <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {topRecomendaciones.map((producto) => (
              <div key={producto.id} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-medium text-[var(--text-muted)]">{producto.linea}</span>
                  <span className={`badge text-[10px] ${getEstadoStyles(producto.estado)}`}>{producto.estado}</span>
                </div>
                <p className="text-sm font-medium line-clamp-2 mb-2">{producto.nombre}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Stock actual:</span>
                    <span className="font-mono">{producto.stock} und</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">A ordenar:</span>
                    <span className="font-mono font-semibold text-[var(--accent-orange)]">+{formatNum(producto.cantidadRecomendada)} und</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Cobertura:</span>
                    <span className={`font-mono ${producto.diasCobertura < 15 ? 'text-[var(--danger)]' : 'text-[var(--warning)]'}`}>
                      {producto.diasCobertura} días
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[var(--border-default)]">
                    <span className="text-[var(--text-muted)]">Inversión:</span>
                    <span className="font-mono font-medium">{formatGTQ(producto.valorCompra)}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                  <TruckIcon className="w-3 h-3" />
                  {producto.proveedor} · {producto.diasEntrega} días
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          TABLA DETALLADA POR PRODUCTO
      ============================================ */}
      <div className="card">
        <div className="section-header">
          <CubeIcon className="w-5 h-5 text-[var(--text-primary)]" />
          <h2 className="font-semibold">Inventario Detallado por Producto</h2>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {productosCriticos.length} productos
          </span>
        </div>
        
        <div className="table-container mx-5 mb-5">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Línea</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Mínimo</th>
                <th className="text-right">Venta/Mes</th>
                <th className="text-right">Cobertura</th>
                <th className="text-center">Estado</th>
                <th className="text-right">Cantidad a Ordenar</th>
                <th className="text-right">Valor Compra</th>
                <th>Proveedor</th>
              </tr>
            </thead>
            <tbody>
              {productosCriticos.map((producto) => (
                <tr 
                  key={producto.id} 
                  className={producto.estado === 'Crítico' ? 'bg-red-50/30' : producto.estado === 'Bajo' ? 'bg-orange-50/30' : ''}
                >
                  <td>
                    <p className="font-medium text-sm">{producto.nombre}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Q {producto.costoUnitario}/und · Entrega: {producto.diasEntrega}d</p>
                  </td>
                  <td>
                    <span className="badge-neutral text-[10px]">{producto.linea}</span>
                  </td>
                  <td className="text-right font-mono text-sm">{producto.stock}</td>
                  <td className="text-right font-mono text-sm text-[var(--text-muted)]">{producto.stockMin}</td>
                  <td className="text-right font-mono text-sm">{producto.ventaPromedioMensual}</td>
                  <td className="text-right font-mono text-sm">
                    <span className={producto.diasCobertura < 15 ? 'text-[var(--danger)] font-medium' : producto.diasCobertura < 30 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
                      {producto.diasCobertura} d
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`badge text-[10px] ${getEstadoStyles(producto.estado)}`}>
                      {producto.estado}
                    </span>
                  </td>
                  <td className="text-right font-mono font-semibold">
                    {producto.cantidadRecomendada > 0 ? (
                      <span className="text-[var(--accent-orange)]">+{formatNum(producto.cantidadRecomendada)}</span>
                    ) : (
                      <span className="text-[var(--success)] text-xs">OK</span>
                    )}
                  </td>
                  <td className="text-right font-mono font-medium">
                    {producto.valorCompra > 0 ? formatGTQ(producto.valorCompra) : <span className="text-[var(--success)] text-xs">—</span>}
                  </td>
                  <td>
                    <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <TruckIcon className="w-3 h-3 text-[var(--text-muted)]" />
                      {producto.proveedor}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Leyenda */}
        <div className="px-5 pb-5">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              <span>Crítico: stock {'<'} mínimo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
              <span>Bajo: cobertura {'<'} 2x entrega</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <span>Atención: cobertura {'<'} 4x entrega</span>
            </div>
            <div className="flex items-center gap-1.5">
              <InformationCircleIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Proyección basada en tendencia de los últimos 6 meses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
