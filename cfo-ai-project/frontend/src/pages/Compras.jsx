import { QoraMark } from '../components/brand/QoraLogo'
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
  ArrowRightIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import PageInsights from '../components/agents/PageInsights'
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
function BarraHistorialProyeccion({ historial, proyeccion, maxValor, color = '#17181B' }) {
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
      case 'Urgente': return 'bg-breach-50 text-breach border-breach-100'
      case 'Alta': return 'bg-copper-50 text-copper border-copper-100'
      case 'Media': return 'bg-copper-50 text-copper border-copper-100'
      default: return 'bg-verified-50 text-verified border-verified-100'
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
    <div className="space-y-6 animate-fade-in">
      {/* ============================================
          HEADER
      ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Compras Inteligentes</h1>
            <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">
              Análisis de ventas · Proyección · Recomendaciones de inventario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Análisis actualizado:</span>
          <span className="badge-success text-[0.75rem] flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            {new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Link al historial de ventas */}
      <div className="flex items-center gap-3 p-4 bg-[var(--accent-blue-subtle)] rounded-card border border-[var(--accent-blue)]/20">
        <ChartBarIcon className="w-5 h-5 text-slate" />
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
          <div className="kpi-value">{lineasEnCritico} líneas</div>
          <span className="text-xs text-[var(--text-muted)]">
            {datosProductos.filter(p => p.estado === 'Crítico').length} productos
          </span>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Compra Recomendada</span>
            <CurrencyDollarIcon className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="kpi-value">{formatGTQ(totalAComprar)}</div>
          <span className="text-xs text-[var(--text-muted)]">Próximo trimestre</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          INSIGHTS DE IA - ALERTAS DE STOCK CRÍTICO
          (Mismo diseño distintivo que PageInsights)
      ═══════════════════════════════════════════ */}
      {alertasCriticas.length > 0 && (
        <section className="rounded-card border border-fog bg-white">
          <div>
            <header className="flex flex-wrap items-center gap-3 border-b border-fog px-6 py-4">
              <QoraMark className="h-4 w-4 shrink-0 text-ink" />
              <h2 className="font-display text-[1rem] font-semibold leading-tight text-ink">
                Hallazgos de compras
              </h2>
              <p className="eyebrow ml-auto text-[0.6875rem]">
                {alertasCriticas.length} {alertasCriticas.length === 1 ? 'hallazgo' : 'hallazgos'}
              </p>
            </header>

            {/* ═══ GRID DE INSIGHTS - 2 COLUMNAS ═══ */}
            <div className="px-3 pb-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
              {alertasCriticas.map((producto) => (
                <div
                  key={producto.id}
                  className="group relative p-3 rounded-card border border-breach/20 bg-breach/10 shadow-red-500/10 hover: transition-all duration-200"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Icono tipo */}
                    <div className="flex-shrink-0 w-7 h-7 rounded-card bg-breach/10 border border-breach/20 flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 text-breach" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded border border-breach/30 bg-breach/20 text-breach uppercase tracking-wider">
                          Crítico
                        </span>
                        <span className="text-[0.6875rem] font-mono text-breach">
                          {producto.diasCobertura} días
                        </span>
                      </div>

                      <h4 className="text-[0.875rem] font-semibold leading-snug text-ink">
                        {producto.nombre}
                      </h4>
                      <p className="text-[0.8125rem] text-slate mt-0.5 line-clamp-2">
                        {producto.linea} · Stock: {producto.stock} und · Reordenar: +{formatNum(producto.cantidadRecomendada)} und
                      </p>

                      {/* Impacto */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[0.75rem] text-slate">Valor compra:</span>
                        <span className="text-[0.75rem] font-semibold text-breach">
                          {formatGTQ(producto.valorCompra)}
                        </span>
                      </div>

                      {/* Acción */}
                      <button className="mt-1.5 text-[0.75rem] font-medium text-cobalt hover:text-cobalt flex items-center gap-0.5 transition-colors">
                        Generar orden
                        <ArrowRightIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
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
                ? 'bg-ink text-white'
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
                  ? 'bg-ink text-white'
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
          <ChartBarIcon className="w-5 h-5 text-slate" />
          <h2 className="font-semibold">Análisis de Ventas por Línea</h2>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            Histórico 6 meses → Proyección 3 meses
          </span>
        </div>

        <div className={`p-5 pt-0 grid gap-4 ${vistaExpandida ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
          {lineasFiltradas.map((linea) => {
            const color = linea.tendencia === 'up' ? '#1F6B45' : linea.tendencia === 'down' ? '#9B3320' : '#3D56C9'
            const totalHistorico = linea.historialVentas.reduce((a, b) => a + b, 0)
            const totalProyeccion = linea.proyeccion3meses.reduce((a, b) => a + b, 0)
            const crecimiento = ((totalProyeccion - totalHistorico / 2) / (totalHistorico / 2) * 100).toFixed(1)

            return (
              <div key={linea.id} className="p-4 bg-[var(--bg-secondary)] rounded-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{linea.nombre}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{linea.descripcion.slice(0, 50)}...</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge text-[0.75rem] ${getPrioridadStyles(linea.prioridad)}`}>
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
                      <span className="text-[0.6875rem] text-[var(--text-muted)]">{m.split(' ')[0]}</span>
                    </div>
                  ))}
                  {demoMesesProyeccion.map((m, i) => (
                    <div key={`p-${i}`} className="flex-1 text-center">
                      <span className="text-[0.6875rem] text-[var(--text-muted)] italic">{m.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded">
                    <p className="text-[0.75rem] text-[var(--text-muted)] uppercase">Histórico 6M</p>
                    <p className="text-sm font-semibold font-mono">{formatNum(totalHistorico)} und</p>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <p className="text-[0.75rem] text-[var(--text-muted)] uppercase">Proyección 3M</p>
                    <p className="text-sm font-semibold font-mono">{formatNum(totalProyeccion)} und</p>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <p className="text-[0.75rem] text-[var(--text-muted)] uppercase">Crecimiento</p>
                    <p className={`text-sm font-semibold font-mono ${parseFloat(crecimiento) > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
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
                <tr key={linea.id} className={linea.prioridad === 'Urgente' ? 'bg-breach-50/50' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{
                        backgroundColor: linea.tendencia === 'up' ? 'var(--success)' : linea.tendencia === 'down' ? 'var(--danger)' : 'var(--accent-blue)'
                      }} />
                      <div>
                        <p className="font-medium text-sm">{linea.nombre}</p>
                        <p className="text-[0.75rem] text-[var(--text-muted)]">Entrega: {linea.tiempoEntregaDias} días</p>
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
                    <span className={`badge text-[0.75rem] ${getPrioridadStyles(linea.prioridad)}`}>
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
          <div className="p-4 bg-[var(--accent-orange-subtle)] rounded-card border border-[var(--accent-orange)]/20">
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
                  <p className="text-lg font-semibold font-mono text-[var(--accent-orange)]">
                    {formatNum(lineasFiltradas.reduce((s, l) => s + l.cantidadRecomendada, 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)]">Inversión Total</p>
                  <p className="text-xl font-semibold font-mono text-[var(--accent-orange)]">
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
            <ArrowPathIcon className="w-5 h-5 text-slate" />
            <h2 className="font-semibold">Productos Prioritarios a Reordenar</h2>
            <span className="ml-auto text-xs text-[var(--text-muted)]">Ordenados por valor de compra</span>
          </div>
          <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {topRecomendaciones.map((producto) => (
              <div key={producto.id} className="p-4 bg-[var(--bg-secondary)] rounded-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.75rem] uppercase font-medium text-[var(--text-muted)]">{producto.linea}</span>
                  <span className={`badge text-[0.75rem] ${getEstadoStyles(producto.estado)}`}>{producto.estado}</span>
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
                <div className="mt-2 flex items-center gap-1 text-[0.75rem] text-[var(--text-muted)]">
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
                  className={producto.estado === 'Crítico' ? 'bg-breach-50/30' : producto.estado === 'Bajo' ? 'bg-copper-50/30' : ''}
                >
                  <td>
                    <p className="font-medium text-sm">{producto.nombre}</p>
                    <p className="text-[0.75rem] text-[var(--text-muted)]">Q {producto.costoUnitario}/und · Entrega: {producto.diasEntrega}d</p>
                  </td>
                  <td>
                    <span className="badge-neutral text-[0.75rem]">{producto.linea}</span>
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
                    <span className={`badge text-[0.75rem] ${getEstadoStyles(producto.estado)}`}>
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
              <div className="w-3 h-3 rounded bg-breach-50 border border-breach-100" />
              <span>Crítico: stock {'<'} mínimo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-copper-50 border border-copper-100" />
              <span>Bajo: cobertura {'<'} 2x entrega</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-paper border border-fog" />
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
