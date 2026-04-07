import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { endpoints } from '../services/cfoApi'
import { 
  ArrowTrendingUpIcon, 
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

export default function CuentasPorCobrar() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  
  const { data: cxcData, isLoading } = useQuery('cxc-detalle', endpoints.tesoreria.cxc)
  
  const data = cxcData?.data || {}
  const distribucion = data.distribucion_aging || {}
  const topDeudores = data.top_deudores || []
  
  // Mock data extendido para la vista completa
  const todasLasCxC = [
    { cliente: 'Corporación ABC S.A.', nit: '1234567-8', monto: 245000, dias: 15, estado: 'al_corriente', factura: 'FAC-001-256', vencimiento: '2026-04-15', contacto: 'Juan Pérez', telefono: '5555-1234' },
    { cliente: 'Distribuidora XYZ', nit: '8765432-1', monto: 180000, dias: 5, estado: 'al_corriente', factura: 'FAC-001-257', vencimiento: '2026-04-10', contacto: 'María García', telefono: '5555-5678' },
    { cliente: 'Industrias del Sur', nit: '5678901-2', monto: 320000, dias: 45, estado: '_30_dias', factura: 'FAC-001-245', vencimiento: '2026-03-15', contacto: 'Pedro López', telefono: '5555-9012' },
    { cliente: 'Comercial Centroamericana', nit: '1098765-4', monto: 156000, dias: 32, estado: '_30_dias', factura: 'FAC-001-248', vencimiento: '2026-03-20', contacto: 'Ana Morales', telefono: '5555-3456' },
    { cliente: 'Servicios Técnicos S.A.', nit: '3456789-0', monto: 89000, dias: 72, estado: '_60_dias', factura: 'FAC-001-230', vencimiento: '2026-02-25', contacto: 'Luis Hernández', telefono: '5555-7890' },
    { cliente: 'Constructora El Progreso', nit: '6543210-9', monto: 445000, dias: 85, estado: '_60_dias', factura: 'FAC-001-220', vencimiento: '2026-02-10', contacto: 'Carlos Ruiz', telefono: '5555-2345' },
    { cliente: 'Importadora del Norte', nit: '7890123-4', monto: 520000, dias: 95, estado: '_90_dias', factura: 'FAC-001-200', vencimiento: '2026-01-25', contacto: 'Sofia Martínez', telefono: '5555-6789' },
    { cliente: 'Exportaciones Guatemala', nit: '4567890-1', monto: 275000, dias: 110, estado: '_90_dias', factura: 'FAC-001-190', vencimiento: '2026-01-10', contacto: 'Roberto Castillo', telefono: '5555-0123' },
    { cliente: 'Ferretería La Unión', nit: '2345678-9', monto: 67000, dias: 8, estado: 'al_corriente', factura: 'FAC-001-260', vencimiento: '2026-04-12', contacto: 'Diana Flores', telefono: '5555-4567' },
    { cliente: 'Agroindustrias del Valle', nit: '8901234-5', monto: 198000, dias: 22, estado: 'al_corriente', factura: 'FAC-001-255', vencimiento: '2026-04-05', contacto: 'Miguel Torres', telefono: '5555-8901' },
  ]

  const cxcFiltradas = todasLasCxC.filter(cxc => {
    const matchBusqueda = busqueda === '' || 
      cxc.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      cxc.factura.toLowerCase().includes(busqueda.toLowerCase()) ||
      cxc.nit.includes(busqueda)
    const matchEstado = filtroEstado === 'todos' || cxc.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  const getEstadoConfig = (estado) => {
    const configs = {
      al_corriente: { label: 'Al corriente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircleIcon },
      _30_dias: { label: '1-30 días', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: ClockIcon },
      _60_dias: { label: '31-60 días', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ExclamationCircleIcon },
      _90_dias: { label: '60+ días', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: ExclamationCircleIcon }
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
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cuentas por Cobrar</h1>
              <p className="text-slate-500">{todasLasCxC.length} facturas pendientes • Promedio {data.promedio_dias_cobro} días</p>
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
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg shadow-emerald-500/30">
          <p className="text-emerald-100 text-sm mb-1">Total por Cobrar</p>
          <p className="text-3xl font-bold">Q{(data.total_cxc || 0).toLocaleString()}</p>
          <p className="text-emerald-100 text-xs mt-2">{todasLasCxC.length} facturas</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm mb-1">Al Corriente</p>
          <p className="text-2xl font-bold text-emerald-600">Q{(distribucion.al_corriente?.monto || 0).toLocaleString()}</p>
          <p className="text-emerald-600 text-xs mt-2 font-medium">{distribucion.al_corriente?.porcentaje || 0}%</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm mb-1">1-30 días</p>
          <p className="text-2xl font-bold text-amber-600">Q{(distribucion._30_dias?.monto || 0).toLocaleString()}</p>
          <p className="text-amber-600 text-xs mt-2 font-medium">{distribucion._30_dias?.porcentaje || 0}%</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm mb-1">+60 días (Riesgo)</p>
          <p className="text-2xl font-bold text-rose-600">Q{((distribucion._60_dias?.monto || 0) + (distribucion._90_dias?.monto || 0)).toLocaleString()}</p>
          <p className="text-rose-600 text-xs mt-2 font-medium">Atención requerida</p>
        </div>
      </div>

      {/* Aging Chart */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Distribución por Antigüedad</h3>
        <div className="space-y-4">
          {[
            { key: 'al_corriente', label: 'Al corriente', color: 'bg-emerald-500' },
            { key: '_30_dias', label: '1-30 días vencido', color: 'bg-amber-500' },
            { key: '_60_dias', label: '31-60 días vencido', color: 'bg-orange-500' },
            { key: '_90_dias', label: '60+ días vencido', color: 'bg-rose-500' }
          ].map(rango => {
            const val = distribucion[rango.key]
            return (
              <div key={rango.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{rango.label}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    Q{(val?.monto || 0).toLocaleString()} ({val?.porcentaje || 0}%)
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
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
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar cliente, factura, NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input w-full pl-12 pr-4 py-3"
          />
        </div>
        <select 
          value={filtroEstado} 
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="input py-3 px-4 min-w-[180px]"
        >
          <option value="todos">Todos los estados</option>
          <option value="al_corriente">Al corriente</option>
          <option value="_30_dias">1-30 días</option>
          <option value="_60_dias">31-60 días</option>
          <option value="_90_dias">60+ días</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-600">{cxcFiltradas.length} resultados</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            Total: Q{totalFiltrado.toLocaleString()}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Factura</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Días</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Contacto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cxcFiltradas.map((cxc) => {
                const estadoConfig = getEstadoConfig(cxc.estado)
                const EstadoIcon = estadoConfig.icon
                return (
                  <tr key={cxc.factura} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                          <BuildingOfficeIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{cxc.cliente}</p>
                          <p className="text-xs text-slate-500">NIT: {cxc.nit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-slate-700">{cxc.factura}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-lg font-bold text-slate-900">Q{cxc.monto.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${estadoConfig.color}`}>
                        <EstadoIcon className="w-3.5 h-3.5" />
                        {estadoConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-sm font-semibold ${
                        cxc.dias > 60 ? 'text-rose-600' : 
                        cxc.dias > 30 ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {cxc.dias} días
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">{cxc.vencimiento}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-700">{cxc.contacto}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <a href={`tel:${cxc.telefono}`} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3" /> {cxc.telefono}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-violet-100 hover:text-violet-600 flex items-center justify-center transition-colors">
                          <PhoneIcon className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-violet-100 hover:text-violet-600 flex items-center justify-center transition-colors">
                          <EnvelopeIcon className="w-4 h-4" />
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