import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { endpoints } from '../services/cfoApi'
import { 
  ArrowTrendingUpIcon, 
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function CuentasPorCobrar() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const { data: cxcData, isLoading } = useQuery('cxc-detalle', endpoints.tesoreria.cxc)

  const data = cxcData?.data || {}
  const distribucion = data.distribucion_aging || {}
  const topDeudores = data.top_deudores || []

  // Facturas pendientes de la base, con días medidos contra la fecha de corte.
  const tramo = (d) => (d <= 0 ? 'al_corriente' : d <= 30 ? '_30_dias' : d <= 60 ? '_60_dias' : '_90_dias')
  const todasLasCxC = (data.facturas || []).map((f) => ({
    ...f,
    estado: tramo(f.dias_vencida),
    plazo: Math.round((new Date(f.vencimiento) - new Date(f.emision)) / 864e5),
  }))
  const vencidas = todasLasCxC.filter((c) => c.dias_vencida > 0).length

  const cxcFiltradas = todasLasCxC.filter(cxc => {
    const matchBusqueda = busqueda === '' || 
      cxc.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      cxc.factura.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || cxc.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  const getEstadoConfig = (estado) => {
    const configs = {
      al_corriente: { label: 'Al corriente', color: 'badge-success', icon: CheckCircleIcon },
      _30_dias: { label: '1-30 días', color: 'badge-warning', icon: ClockIcon },
      _60_dias: { label: '31-60 días', color: 'badge-danger', icon: ExclamationCircleIcon },
      _90_dias: { label: '60+ días', color: 'badge-danger', icon: ExclamationCircleIcon }
    }
    return configs[estado] || configs.al_corriente
  }

  const totalFiltrado = cxcFiltradas.reduce((sum, c) => sum + c.monto, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/tesoreria" 
                        aria-label="Volver"
className="w-10 h-10 rounded-card bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Cuentas por Cobrar</h1>
              <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">{todasLasCxC.length} facturas pendientes · {vencidas} vencidas</p>
            </div>
          </div>
        </div>

        <button className="btn-secondary flex items-center gap-2">
          <ArrowDownTrayIcon className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <span className="kpi-label">Total por Cobrar</span>
          <p className="kpi-value">Q{(data.total_cxc || 0).toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{todasLasCxC.length} facturas</p>
        </div>

        <div className="kpi-card card-hover">
          <span className="kpi-label">Al Corriente</span>
          <p className="kpi-value">Q{(distribucion.al_corriente?.monto || 0).toLocaleString()}</p>
          <p className="text-xs text-[var(--success)] mt-1">{distribucion.al_corriente?.porcentaje || 0}%</p>
        </div>

        <div className="kpi-card card-hover">
          <span className="kpi-label">1-30 días</span>
          <p className="kpi-value">Q{(distribucion._30_dias?.monto || 0).toLocaleString()}</p>
          <p className="text-xs text-[var(--warning)] mt-1">{distribucion._30_dias?.porcentaje || 0}%</p>
        </div>

        <div className="kpi-card card-hover">
          <span className="kpi-label">Más de 60 días</span>
          <p className="kpi-value">Q{(distribucion._90_dias?.monto || 0).toLocaleString()}</p>
          <p className="text-xs text-[var(--danger)] mt-1">{distribucion._90_dias?.porcentaje || 0}% del total</p>
        </div>
      </div>

      {/* Aging Chart */}
      <div className="card">
        <div className="section-header">
          <ChartBarIcon className="w-5 h-5 text-[var(--text-muted)]" />
          <h2 className="font-semibold">Distribución por Antigüedad</h2>
        </div>

        <div className="p-5 pt-0 space-y-4">
          {[
            { key: 'al_corriente', label: 'Al corriente', color: 'bg-verified' },
            { key: '_30_dias', label: '1-30 días vencido', color: 'bg-copper' },
            { key: '_60_dias', label: '31-60 días vencido', color: 'bg-copper' },
            { key: '_90_dias', label: '60+ días vencido', color: 'bg-breach' }
          ].map(rango => {
            const val = distribucion[rango.key]
            return (
              <div key={rango.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{rango.label}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    Q{(val?.monto || 0).toLocaleString()} ({val?.porcentaje || 0}%)
                  </span>
                </div>
                <div className="h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${rango.color} transition-all duration-700`}
                    style={{ width: `${val?.porcentaje || 0}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar cliente o factura"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input w-full pl-12"
          />
        </div>
        <select aria-label="Todos los estados" 
          value={filtroEstado} 
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="input min-w-[180px]"
        >
          <option value="todos">Todos los estados</option>
          <option value="al_corriente">Al corriente</option>
          <option value="_30_dias">1-30 días</option>
          <option value="_60_dias">31-60 días</option>
          <option value="_90_dias">60+ días</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">{cxcFiltradas.length} resultados</span>
          </div>
          <span className="text-sm font-semibold">
            Total: Q{totalFiltrado.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Factura</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-muted)] uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-muted)] uppercase">Días</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {cxcFiltradas.map((cxc) => {
                const estadoConfig = getEstadoConfig(cxc.estado)
                const EstadoIcon = estadoConfig.icon
                return (
                  <tr key={cxc.factura} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-card bg-[var(--bg-tertiary)] flex items-center justify-center">
                          <BuildingOfficeIcon className="w-5 h-5 text-[var(--text-muted)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{cxc.cliente}</p>
                          <p className="text-xs text-[var(--text-muted)]">Crédito a {cxc.plazo} días</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap font-mono text-[0.8125rem]">{cxc.factura}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold tabular-nums">Q{cxc.monto.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 ${estadoConfig.color}`}>
                        <EstadoIcon className="w-3.5 h-3.5" />
                        {estadoConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`whitespace-nowrap text-sm font-semibold ${
                        cxc.dias_vencida > 60 ? 'text-[var(--danger)]' :
                        cxc.dias_vencida > 0 ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'
                      }`}>
                        {cxc.dias_vencida > 0 ? `${cxc.dias_vencida} días de atraso` : `En ${cxc.dias_para_vencer} días`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[var(--text-secondary)]">{cxc.vencimiento}</span>
                    </td>
                    <td className="px-4 py-4 max-w-[260px]">
                      <p className="text-xs text-[var(--text-muted)]">{cxc.nota || '—'}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
