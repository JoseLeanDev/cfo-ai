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
    if (dias <= 2) return { label: 'Conciliado', badgeClass: 'badge-success', icon: CheckCircleIcon }
    if (dias <= 5) return { label: 'Pendiente', badgeClass: 'badge-warning', icon: ClockIcon }
    return { label: 'Sin conciliar', badgeClass: 'badge-danger', icon: ExclamationTriangleIcon }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/tesoreria" 
            className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <BuildingLibraryIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Cuentas Bancarias</h1>
              <p className="text-sm text-[var(--text-muted)]">{cuentas.length} cuentas activas • Tipo de cambio: Q{data.tipo_cambio}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filtroMoneda} 
            onChange={(e) => setFiltroMoneda(e.target.value)}
            className="input"
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
        <div className="kpi-card card-hover">
          <div className="flex items-center gap-3 mb-2">
            <BanknotesIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span className="kpi-label">Total Consolidado</span>
          </div>
          <p className="kpi-value">Q{data.total_consolidado_gtq?.toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Días de operación: {data.dias_operacion}</p>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Quetzales (GTQ)</span>
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">Q</span>
          </div>
          <p className="kpi-value">Q{totalGTQ.toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{cuentasGTQ.length} cuentas</p>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Dólares (USD)</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">$</span>
          </div>
          <p className="kpi-value">${totalUSD.toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">≈ Q{(totalUSD * (data.tipo_cambio || 7.75)).toLocaleString()}</p>
        </div>
      </div>

      {/* Lista de Cuentas */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-[var(--border-default)]">
          <h2 className="font-semibold">Cuentas Activas</h2>
        </div>
        
        <div className="divide-y divide-[var(--border-default)]">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5">
                <div className="h-16 bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
              </div>
            ))
          ) : cuentasFiltradas.map((cuenta, idx) => {
            const estado = getEstadoConciliacion(cuenta.dias_sin_conciliar)
            const EstadoIcon = estado.icon
            return (
              <div 
                key={idx} 
                className={`p-5 hover:bg-[var(--bg-secondary)] transition-all cursor-pointer ${
                  cuentaSeleccionada === idx ? 'bg-blue-50 border-l-4 border-black' : 'border-l-4 border-transparent'
                }`}
                onClick={() => setCuentaSeleccionada(cuentaSeleccionada === idx ? null : idx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      cuenta.moneda === 'USD' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <span className="font-bold">{cuenta.moneda}</span>
                    </div>
                    
                    <div>
                      <p className="font-bold text-lg">{cuenta.banco}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-[var(--text-muted)] capitalize">{cuenta.tipo}</span>
                        <span className="text-[var(--border-default)]">•</span>
                        <span className={`inline-flex items-center gap-1.5 ${estado.badgeClass} text-[10px]`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estado.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold tabular-nums">
                      {new Intl.NumberFormat('es-GT', {
                        style: 'currency',
                        currency: cuenta.moneda,
                        minimumFractionDigits: 0
                      }).format(cuenta.saldo)}
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Última conciliación: {new Date(cuenta.ultima_conciliacion).toLocaleDateString('es-GT')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Últimas Transacciones */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-[var(--border-default)] flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-[var(--text-muted)]" />
            Últimas Transacciones
          </h2>
          <button className="text-sm text-[var(--accent-blue)] hover:underline">Ver todas →</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Referencia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase">Monto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {transacciones.map((tx) => (
                <tr key={tx.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {new Date(tx.fecha).toLocaleDateString('es-GT')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded">{tx.referencia}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {tx.tipo === 'entrada' ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-[var(--success)]" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-[var(--danger)]" />
                      )}
                      <span className="text-sm">{tx.descripcion}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${tx.tipo === 'entrada' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {tx.tipo === 'entrada' ? '+' : ''}Q{Math.abs(tx.monto).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium tabular-nums">
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
