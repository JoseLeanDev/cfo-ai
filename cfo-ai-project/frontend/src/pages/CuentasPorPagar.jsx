import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { endpoints } from '../services/cfoApi'
import { 
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

export default function CuentasPorPagar() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('todos')

  const { data: cxpData, isLoading } = useQuery('cxp-detalle', endpoints.tesoreria.cxp)

  const data = cxpData?.data || {}
  const proximosPagos = data.proximos_pagos || []

  // Facturas pendientes de la base, con días medidos contra la fecha de corte.
  const todasLasCxP = (data.facturas || []).map((f) => ({
    ...f,
    plazo: Math.round((new Date(f.vencimiento) - new Date(f.emision)) / 864e5),
  }))

  const cxpFiltradas = todasLasCxP.filter(cxp => {
    const matchBusqueda = busqueda === '' || 
      cxp.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      cxp.factura.toLowerCase().includes(busqueda.toLowerCase())

    let matchUrgencia = true
    if (filtroUrgencia === 'vencida') matchUrgencia = cxp.dias_restantes < 0
    else if (filtroUrgencia === 'critico') matchUrgencia = cxp.dias_restantes >= 0 && cxp.dias_restantes <= 5
    else if (filtroUrgencia === 'urgente') matchUrgencia = cxp.dias_restantes > 5 && cxp.dias_restantes <= 10
    else if (filtroUrgencia === 'proximo') matchUrgencia = cxp.dias_restantes > 10 && cxp.dias_restantes <= 20

    return matchBusqueda && matchUrgencia
  })

  const getUrgenciaConfig = (dias) => {
    if (dias < 0) return { color: 'bg-breach', label: 'Vencida', badgeClass: 'badge-danger' }
    if (dias <= 5) return { color: 'bg-breach', label: 'Crítico', badgeClass: 'badge-danger' }
    if (dias <= 10) return { color: 'bg-copper', label: 'Urgente', badgeClass: 'badge-warning' }
    if (dias <= 20) return { color: 'bg-cobalt', label: 'Próximo', badgeClass: 'badge-info' }
    return { color: 'bg-verified', label: 'Normal', badgeClass: 'badge-success' }
  }

  const totalFiltrado = cxpFiltradas.reduce((sum, c) => sum + c.monto, 0)
  const pagosCriticos = todasLasCxP.filter(c => c.dias_restantes <= 5).length
  const proximos30 = todasLasCxP.filter(c => c.dias_restantes >= 0 && c.dias_restantes <= 30)

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
              <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Cuentas por Pagar</h1>
              <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">{todasLasCxP.length} facturas pendientes · vencen en {data.promedio_dias_pago} días en promedio</p>
            </div>
          </div>
        </div>

        <button className="btn-secondary flex items-center gap-2">
          <ArrowDownTrayIcon className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Alert Banner */}
      {pagosCriticos > 0 && (
        <div className="bg-breach-50 border border-breach-100 rounded-card p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-breach"> {pagosCriticos} pagos críticos en los próximos 5 días</p>
            <p className="text-sm text-breach">Revisa las facturas marcadas en rojo para evitar recargos por mora.</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <span className="kpi-label">Total por Pagar</span>
          <p className="kpi-value">Q{(data.total_cxp || 0).toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{todasLasCxP.length} facturas</p>
        </div>

        <div className="kpi-card card-hover">
          <span className="kpi-label">Pagos críticos (5 días o menos)</span>
          <p className="kpi-value">{pagosCriticos}</p>
          <p className="text-xs text-[var(--danger)] mt-1">Atención inmediata</p>
        </div>

        <div className="kpi-card card-hover">
          <span className="kpi-label">Vencen en 30 días</span>
          <p className="kpi-value">Q{proximos30.reduce((s, c) => s + c.monto, 0).toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{proximos30.length} facturas</p>
        </div>

        <div className="kpi-card card-hover">
          <span className="kpi-label">Promedio Días Pago</span>
          <p className="kpi-value">{data.promedio_dias_pago || 0}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">días</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar proveedor o factura"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input w-full pl-12"
          />
        </div>
        <select aria-label="Todos los pagos" 
          value={filtroUrgencia} 
          onChange={(e) => setFiltroUrgencia(e.target.value)}
          className="input min-w-[180px]"
        >
          <option value="todos">Todos los pagos</option>
          <option value="vencida">Vencidas</option>
          <option value="critico">Críticos (0 a 5 días)</option>
          <option value="urgente">Urgentes (6 a 10 días)</option>
          <option value="proximo">Próximos (11 a 20 días)</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">{cxpFiltradas.length} resultados</span>
          </div>
          <span className="text-sm font-semibold">
            Total: Q{totalFiltrado.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Factura</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-muted)] uppercase">Urgencia</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-muted)] uppercase">Días</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {cxpFiltradas.map((cxp) => {
                const urgencia = getUrgenciaConfig(cxp.dias_restantes)
                return (
                  <tr key={cxp.factura} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-card bg-[var(--bg-tertiary)] flex items-center justify-center">
                          <BuildingOfficeIcon className="w-5 h-5 text-[var(--text-muted)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{cxp.proveedor}</p>
                          <p className="text-xs text-[var(--text-muted)]">Crédito a {cxp.plazo} días</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap font-mono text-[0.8125rem]">{cxp.factura}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold tabular-nums">Q{cxp.monto.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`badge ${urgencia.badgeClass}`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${urgencia.color} mr-1`} />
                        {urgencia.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`whitespace-nowrap text-sm font-semibold ${
                        cxp.dias_restantes <= 5 ? 'text-[var(--danger)]' : 
                        cxp.dias_restantes <= 10 ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'
                      }`}>
                        {cxp.dias_restantes < 0 ? `${-cxp.dias_restantes} días de atraso` : `${cxp.dias_restantes} días`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[var(--text-secondary)]">{cxp.vencimiento}</span>
                    </td>
                    <td className="px-4 py-4 max-w-[260px]">
                      <p className="text-xs text-[var(--text-muted)]">{cxp.nota || '—'}</p>
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
