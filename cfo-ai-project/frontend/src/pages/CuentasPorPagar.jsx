import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { endpoints } from '../services/cfoApi'
import { 
  ArrowTrendingDownIcon, 
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckIcon,
  CreditCardIcon,
  TagIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

export default function CuentasPorPagar() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('todos')
  
  const { data: cxpData, isLoading } = useQuery('cxp-detalle', () => endpoints.tesoreria.cxp({ proximos_dias: 90 }))
  
  const data = cxpData?.data || {}
  const proximosPagos = data.proximos_pagos || []
  
  // Mock data extendido
  const todasLasCxP = [
    { proveedor: 'Importaciones del Pacífico', nit: '1234567-8', monto: 345000, dias_restantes: 3, descuento_pronto_pago: true, factura: 'FAC-PROV-452', vencimiento: '2026-04-10', tipo: 'Importación', condicion: '2% a 7 días' },
    { proveedor: 'Servicios Eléctricos S.A.', nit: '8765432-1', monto: 89000, dias_restantes: 5, descuento_pronto_pago: false, factura: 'FAC-PROV-453', vencimiento: '2026-04-12', tipo: 'Servicios', condicion: 'Neto 30' },
    { proveedor: 'Papelera Nacional', nit: '5678901-2', monto: 45000, dias_restantes: 8, descuento_pronto_pago: true, factura: 'FAC-PROV-450', vencimiento: '2026-04-15', tipo: 'Insumos', condicion: '3% a 10 días' },
    { proveedor: 'Tecnología Avanzada S.A.', nit: '1098765-4', monto: 275000, dias_restantes: 12, descuento_pronto_pago: false, factura: 'FAC-PROV-448', vencimiento: '2026-04-20', tipo: 'Equipos', condicion: 'Neto 30' },
    { proveedor: 'Transporte Rápido', nit: '3456789-0', monto: 28000, dias_restantes: 15, descuento_pronto_pago: false, factura: 'FAC-PROV-455', vencimiento: '2026-04-23', tipo: 'Logística', condicion: 'Neto 15' },
    { proveedor: 'Químicos Industriales', nit: '6543210-9', monto: 156000, dias_restantes: 18, descuento_pronto_pago: true, factura: 'FAC-PROV-445', vencimiento: '2026-04-25', tipo: 'Materia Prima', condicion: '5% a 15 días' },
    { proveedor: 'Seguridad Corporativa', nit: '7890123-4', monto: 45000, dias_restantes: 22, descuento_pronto_pago: false, factura: 'FAC-PROV-460', vencimiento: '2026-04-30', tipo: 'Servicios', condicion: 'Neto 30' },
    { proveedor: 'Marketing Digital Pro', nit: '4567890-1', monto: 72000, dias_restantes: 25, descuento_pronto_pago: false, factura: 'FAC-PROV-462', vencimiento: '2026-05-02', tipo: 'Marketing', condicion: 'Neto 30' },
    { proveedor: 'Mantenimiento Industrial', nit: '2345678-9', monto: 125000, dias_restantes: 28, descuento_pronto_pago: false, factura: 'FAC-PROV-440', vencimiento: '2026-05-05', tipo: 'Servicios', condicion: 'Neto 30' },
    { proveedor: 'Consultoría Estratégica', nit: '8901234-5', monto: 180000, dias_restantes: 35, descuento_pronto_pago: false, factura: 'FAC-PROV-435', vencimiento: '2026-05-15', tipo: 'Consultoría', condicion: 'Neto 45' },
  ]

  const cxpFiltradas = todasLasCxP.filter(cxp => {
    const matchBusqueda = busqueda === '' || 
      cxp.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      cxp.factura.toLowerCase().includes(busqueda.toLowerCase()) ||
      cxp.nit.includes(busqueda)
    
    let matchUrgencia = true
    if (filtroUrgencia === 'critico') matchUrgencia = cxp.dias_restantes <= 5
    else if (filtroUrgencia === 'urgente') matchUrgencia = cxp.dias_restantes > 5 && cxp.dias_restantes <= 10
    else if (filtroUrgencia === 'descuento') matchUrgencia = cxp.descuento_pronto_pago
    else if (filtroUrgencia === 'proximo') matchUrgencia = cxp.dias_restantes > 10 && cxp.dias_restantes <= 20
    
    return matchBusqueda && matchUrgencia
  })

  const getUrgenciaConfig = (dias) => {
    if (dias <= 5) return { color: 'bg-rose-500', label: 'Crítico', textColor: 'text-rose-600', bgColor: 'bg-rose-50' }
    if (dias <= 10) return { color: 'bg-amber-500', label: 'Urgente', textColor: 'text-amber-600', bgColor: 'bg-amber-50' }
    if (dias <= 20) return { color: 'bg-blue-500', label: 'Próximo', textColor: 'text-blue-600', bgColor: 'bg-blue-50' }
    return { color: 'bg-emerald-500', label: 'Normal', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' }
  }

  const totalFiltrado = cxpFiltradas.reduce((sum, c) => sum + c.monto, 0)
  const totalDescuentos = cxpFiltradas
    .filter(c => c.descuento_pronto_pago)
    .reduce((sum, c) => sum + (c.monto * 0.03), 0)

  const pagosCriticos = todasLasCxP.filter(c => c.dias_restantes <= 5).length
  const pagosConDescuento = todasLasCxP.filter(c => c.descuento_pronto_pago).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/tesoreria" 
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cuentas por Pagar</h1>
              <p className="text-slate-500">{todasLasCxP.length} facturas pendientes • Promedio {data.promedio_dias_pago} días</p>
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
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-rose-800">⚠️ {pagosCriticos} pagos críticos en los próximos 5 días</p>
            <p className="text-sm text-rose-600">Revisa las facturas marcadas en rojo para evitar recargos por mora.</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-5 rounded-2xl text-white shadow-lg shadow-rose-500/30">
          <p className="text-rose-100 text-sm mb-1">Total por Pagar</p>
          <p className="text-3xl font-bold">Q{(data.total_cxp || 0).toLocaleString()}</p>
          <p className="text-rose-100 text-xs mt-2">{todasLasCxP.length} facturas</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-rose-200">
          <p className="text-slate-500 text-sm mb-1">Pagos Críticos (&lt;5 días)</p>
          <p className="text-2xl font-bold text-rose-600">{pagosCriticos}</p>
          <p className="text-rose-600 text-xs mt-2 font-medium">Atención inmediata</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-emerald-200">
          <p className="text-slate-500 text-sm mb-1">Descuentos Disponibles</p>
          <p className="text-2xl font-bold text-emerald-600">{pagosConDescuento}</p>
          <p className="text-emerald-600 text-xs mt-2 font-medium">Ahorro potencial: Q{Math.round(totalDescuentos).toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm mb-1">Promedio Días Pago</p>
          <p className="text-2xl font-bold text-slate-900">{data.promedio_dias_pago || 0}</p>
          <p className="text-slate-500 text-xs mt-2 font-medium">días</p>
        </div>
      </div>

      {/* Timeline View */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-400" />
          Línea de Tiempo de Pagos
        </h3>
        
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-4">
            {[
              { dias: 'Hoy', pagos: todasLasCxP.filter(c => c.dias_restantes === 0).length, monto: 0 },
              { dias: '3 días', pagos: todasLasCxP.filter(c => c.dias_restantes <= 3).length, monto: 345000 },
              { dias: '7 días', pagos: todasLasCxP.filter(c => c.dias_restantes <= 7).length, monto: 434000 },
              { dias: '15 días', pagos: todasLasCxP.filter(c => c.dias_restantes <= 15).length, monto: 764000 },
              { dias: '30 días', pagos: todasLasCxP.length, monto: 1360000 },
            ].map((periodo, idx) => (
              <div key={idx} className="relative flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-500' : 'bg-slate-300'
                }`}>
                  <span className="text-white text-xs font-bold">{periodo.dias[0]}</span>
                </div>
                <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">En {periodo.dias.toLowerCase()}</span>
                    <span className="text-sm text-slate-500">{periodo.pagos} pagos</span>
                  </div>                  
                  {periodo.monto > 0 && (
                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        style={{ width: `${(periodo.monto / 1360000) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar proveedor, factura, NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input w-full pl-12 pr-4 py-3"
          />
        </div>
        <select 
          value={filtroUrgencia} 
          onChange={(e) => setFiltroUrgencia(e.target.value)}
          className="input py-3 px-4 min-w-[180px]"
        >
          <option value="todos">Todos los pagos</option>
          <option value="critico">🚨 Críticos (&lt;5 días)</option>
          <option value="urgente">⚠️ Urgentes (5-10 días)</option>
          <option value="descuento">💰 Con descuento PP</option>
          <option value="proximo">📅 Próximos (10-20 días)</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-600">{cxpFiltradas.length} resultados</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            Total: Q{totalFiltrado.toLocaleString()}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Factura</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Urgencia</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Días</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Descuento</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cxpFiltradas.map((cxp) => {
                const urgencia = getUrgenciaConfig(cxp.dias_restantes)
                const ahorro = cxp.descuento_pronto_pago ? cxp.monto * 0.03 : 0
                return (
                  <tr key={cxp.factura} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                          <BuildingOfficeIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{cxp.proveedor}</p>
                          <p className="text-xs text-slate-500">NIT: {cxp.nit} • {cxp.tipo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-slate-700">{cxp.factura}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-lg font-bold text-slate-900">Q{cxp.monto.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${urgencia.bgColor} ${urgencia.textColor}`}>
                        <span className={`w-2 h-2 rounded-full ${urgencia.color}`} />
                        {urgencia.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-sm font-semibold ${
                        cxp.dias_restantes <= 5 ? 'text-rose-600' : 
                        cxp.dias_restantes <= 10 ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {cxp.dias_restantes} días
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">{cxp.vencimiento}</span>
                      <p className="text-xs text-slate-400">{cxp.condicion}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {cxp.descuento_pronto_pago ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                          <TagIcon className="w-3.5 h-3.5" />
                          <span>Ahorro: Q{ahorro.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center transition-colors">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors">
                          <CreditCardIcon className="w-4 h-4" />
                        </button>
                      </div>
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