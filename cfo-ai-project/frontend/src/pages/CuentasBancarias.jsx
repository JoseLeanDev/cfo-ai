import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { endpoints } from '../services/cfoApi'
import { 
  BuildingLibraryIcon, 
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline'

export default function CuentasBancarias() {
  const [filtroMoneda, setFiltroMoneda] = useState('todas')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)
  
  const { data: posicionData, isLoading } = useQuery('bancos-detalle', endpoints.tesoreria.posicion)
  
  const data = posicionData?.data || {}
  const cuentas = data.cuentas || []
  
  // Mock transacciones
  const transacciones = [
    { id: 1, fecha: '2026-04-05', descripcion: 'Depósito cliente Corporación ABC', tipo: 'entrada', monto: 125000, saldo: 1250000, referencia: 'DEP-4521' },
    { id: 2, fecha: '2026-04-04', descripcion: 'Pago proveedor Importaciones del Pacífico', tipo: 'salida', monto: -345000, saldo: 1125000, referencia: 'TRF-8932' },
    { id: 3, fecha: '2026-04-03', descripcion: 'Transferencia entre cuentas', tipo: 'entrada', monto: 200000, saldo: 1470000, referencia: 'TBC-1205' },
    { id: 4, fecha: '2026-04-02', descripcion: 'Pago nómina quincenal', tipo: 'salida', monto: -450000, saldo: 1270000, referencia: 'NOM-045' },
    { id: 5, fecha: '2026-04-01', descripcion: 'Cobro factura #256', tipo: 'entrada', monto: 245000, saldo: 1720000, referencia: 'COB-0256' },
    { id: 6, fecha: '2026-03-31', descripcion: 'Comisión bancaria', tipo: 'salida', monto: -1250, saldo: 1475000, referencia: 'COM-032' },
    { id: 7, fecha: '2026-03-30', descripcion: 'Pago servicios eléctricos', tipo: 'salida', monto: -89000, saldo: 1476250, referencia: 'SER-110' },
    { id: 8, fecha: '2026-03-29', descripcion: 'Depósito ventas efectivo', tipo: 'entrada', monto: 78000, saldo: 1565250, referencia: 'DEP-4520' },
  ]
  
  const cuentasFiltradas = filtroMoneda === 'todas' 
    ? cuentas 
    : cuentas.filter(c => c.moneda === filtroMoneda)

  const cuentasGTQ = cuentas.filter(c => c.moneda === 'GTQ')
  const cuentasUSD = cuentas.filter(c => c.moneda === 'USD')
  
  const totalGTQ = cuentasGTQ.reduce((sum, c) => sum + c.saldo, 0)
  const totalUSD = cuentasUSD.reduce((sum, c) => sum + c.saldo, 0)

  const getEstadoConciliacion = (dias) => {
    if (dias <= 2) return { label: 'Conciliado', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircleIcon }
    if (dias <= 5) return { label: 'Pendiente', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: ClockIcon }
    return { label: 'Sin conciliar', color: 'text-rose-600', bgColor: 'bg-rose-50', icon: ExclamationTriangleIcon }
  }

  const bancosUnicos = [...new Set(cuentas.map(c => c.banco))]

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BuildingLibraryIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cuentas Bancarias</h1>
              <p className="text-slate-500">{cuentas.length} cuentas activas • Tipo de cambio: Q{data.tipo_cambio}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filtroMoneda} 
            onChange={(e) => setFiltroMoneda(e.target.value)}
            className="input py-2.5 px-4"
          >
            <option value="todas">Todas las monedas</option>
            <option value="GTQ">Quetzales (GTQ)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Totales por Moneda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total Consolidado</p>
              <p className="text-3xl font-bold">Q{data.total_consolidado_gtq?.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm">Días de operación: {data.dias_operacion}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-slate-700">Quetzales (GTQ)</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">{cuentasGTQ.length}</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">Q{totalGTQ.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
              <span className="font-semibold text-slate-700">Dólares (USD)</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">{cuentasUSD.length}</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">${totalUSD.toLocaleString()}</p>
          <p className="text-sm text-slate-400 mt-1">≈ Q{(totalUSD * (data.tipo_cambio || 7.75)).toLocaleString()}</p>
        </div>
      </div>

      {/* Lista de Cuentas */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Cuentas Activas</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6">
                <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ))
          ) : cuentasFiltradas.map((cuenta, idx) => {
            const estado = getEstadoConciliacion(cuenta.dias_sin_conciliar)
            const EstadoIcon = estado.icon
            return (
              <div 
                key={idx} 
                className={`p-6 hover:bg-slate-50 transition-all cursor-pointer ${
                  cuentaSeleccionada === idx ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                }`}
                onClick={() => setCuentaSeleccionada(cuentaSeleccionada === idx ? null : idx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      cuenta.moneda === 'USD' 
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      <span className="text-white font-bold">{cuenta.moneda}</span>
                    </div>
                    
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{cuenta.banco}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-500 capitalize">{cuenta.tipo}</span>
                        <span className="text-slate-300">•</span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${estado.bgColor} ${estado.color}`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estado.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {new Intl.NumberFormat('es-GT', {
                        style: 'currency',
                        currency: cuenta.moneda,
                        minimumFractionDigits: 0
                      }).format(cuenta.saldo)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Última conciliación: {new Date(cuenta.ultima_conciliacion).toLocaleDateString('es-GT')}
                    </p>
                  </div>
                </div>
                
                {/* Detalle expandible */}
                {cuentaSeleccionada === idx && (
                  <div className="mt-6 pt-6 border-t border-slate-200 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Estadísticas rápidas */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                          <CreditCardIcon className="w-4 h-4" />
                          Resumen de la Cuenta
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-xs text-slate-500">Entradas (30 días)</p>
                            <p className="text-lg font-bold text-emerald-600">+Q1,245,000</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-xs text-slate-500">Salidas (30 días)</p>
                            <p className="text-lg font-bold text-rose-600">-Q985,000</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-xs text-slate-500">Promedio Diario</p>
                            <p className="text-lg font-bold text-slate-700">Q41,500</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-xs text-slate-500">Variación</p>
                            <p className="text-lg font-bold text-emerald-600">+12.5%</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                          <ArrowsRightLeftIcon className="w-4 h-4" />
                          Acciones Rápidas
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <button className="btn-primary py-3">
                            Ver Estado de Cuenta
                          </button>
                          <button className="btn-secondary py-3">
                            Conciliar Ahora
                          </button>
                          <button className="btn-secondary py-3">
                            Transferir
                          </button>
                          <button className="btn-secondary py-3">
                            Descargar Movimientos
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Últimas Transacciones */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-slate-400" />
            Últimas Transacciones
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver todas →</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Referencia</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacciones.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(tx.fecha).toLocaleDateString('es-GT')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{tx.referencia}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {tx.tipo === 'entrada' ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="text-sm text-slate-700">{tx.descripcion}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-semibold ${tx.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.tipo === 'entrada' ? '+' : ''}Q{Math.abs(tx.monto).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                    Q{tx.saldo.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}