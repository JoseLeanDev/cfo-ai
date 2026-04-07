import { Link } from 'react-router-dom'
import { useTesoreriaPosicion, useTesoreriaCxC, useTesoreriaCxP, useTesoreriaProyeccion } from '../hooks/useCfoData'
import KpiCard from '../components/common/KpiCard'
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ClockIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function Tesoreria() {
  const { data: posicion, isLoading: loadingPos } = useTesoreriaPosicion()
  const { data: cxc, isLoading: loadingCxC } = useTesoreriaCxC()
  const { data: cxp, isLoading: loadingCxP } = useTesoreriaCxP()
  const { data: proyeccion, isLoading: loadingProy } = useTesoreriaProyeccion(13)

  const posicionData = posicion?.data || {}
  const cxcData = cxc?.data || {}
  const cxpData = cxp?.data || {}
  const proyeccionData = proyeccion?.data || {}

  const distribucion = cxcData.distribucion_aging || {}
  const datosProyeccion = proyeccionData.proyeccion || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <BanknotesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tesorería</h1>
            <p className="text-slate-500">Posición al {posicionData.fecha_corte} • Tipo de cambio: Q{posicionData.tipo_cambio}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Disponible GTQ"
          value={posicionData.total_disponible_gtq}
          currency="GTQ"
          loading={loadingPos}
          variant="positive"
        />
        
        <KpiCard
          title="Disponible USD"
          value={posicionData.total_disponible_usd}
          currency="USD"
          loading={loadingPos}
        />
        
        <KpiCard
          title="Total Consolidado"
          value={posicionData.total_consolidado_gtq}
          currency="GTQ"
          loading={loadingPos}
          variant="positive"
        />
        
        <KpiCard
          title="Días Operación"
          value={posicionData.dias_operacion}
          unit="días"
          loading={loadingPos}
          variant={posicionData.dias_operacion < 30 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuentas Bancarias */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BuildingLibraryIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Cuentas Bancarias</h2>
            </div>
            <Link to="/tesoreria/cuentas-bancarias" className="btn-secondary text-sm flex items-center gap-1">
              Ver todas
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {posicionData.cuentas?.map((cuenta, idx) => (
              <div 
                key={idx} 
                className="group flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    cuenta.moneda === 'USD' 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-600' 
                      : 'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>
                    <span className="text-white font-bold text-sm">{cuenta.moneda}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{cuenta.banco}</p>
                    <p className="text-sm text-slate-500 capitalize">{cuenta.tipo}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">
                    {new Intl.NumberFormat('es-GT', {
                      style: 'currency',
                      currency: cuenta.moneda,
                      minimumFractionDigits: 0
                    }).format(cuenta.saldo)}
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    {cuenta.dias_sin_conciliar > 2 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <ExclamationTriangleIcon className="w-3 h-3" />
                        Sin conciliar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircleIcon className="w-3 h-3" />
                        Conciliado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CxC Aging */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">CxC - Aging</h2>
                <p className="text-sm text-slate-500">Promedio {cxcData.promedio_dias_cobro} días</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('es-GT', {
                  style: 'currency',
                  currency: 'GTQ',
                  minimumFractionDigits: 0
                }).format(cxcData.total_cxc || 0)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(distribucion).map(([key, val]) => {
              const labels = { 
                al_corriente: { label: 'Al corriente', color: 'bg-emerald-500', text: 'text-emerald-700' },
                _30_dias: { label: '1-30 días', color: 'bg-amber-500', text: 'text-amber-700' },
                _60_dias: { label: '31-60 días', color: 'bg-orange-500', text: 'text-orange-700' },
                _90_dias: { label: '60+ días', color: 'bg-rose-500', text: 'text-rose-700' }
              }
              const config = labels[key] || { label: key, color: 'bg-slate-500', text: 'text-slate-700' }
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${config.text}`}>{config.label}</span>
                    <span className="font-semibold text-slate-900">
                      Q{(val.monto || 0).toLocaleString()} ({val.porcentaje}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${config.color} transition-all duration-700`}
                      style={{ width: `${val.porcentaje}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Top Deudores</p>
              <Link to="/tesoreria/cuentas-por-cobrar" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                Ver todas
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-2">
              {cxcData.top_deudores?.slice(0, 3).map((deudor, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700 truncate max-w-[180px]">{deudor.cliente}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${deudor.dias > 60 ? 'text-rose-600' : 'text-slate-900'}`}>
                      Q{deudor.monto.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      deudor.dias > 60 
                        ? 'bg-rose-100 text-rose-700' 
                        : deudor.dias > 30 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {deudor.dias} días
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CxP */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <ArrowTrendingDownIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">CxP Próximos</h2>
                <p className="text-sm text-slate-500">Promedio {cxpData.promedio_dias_pago} días</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('es-GT', {
                  style: 'currency',
                  currency: 'GTQ',
                  minimumFractionDigits: 0
                }).format(cxpData.total_cxp || 0)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {cxpData.proximos_pagos?.slice(0, 5).map((pago, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    pago.dias_restantes <= 5 
                      ? 'bg-rose-100 text-rose-600' 
                      : pago.dias_restantes <= 10 
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{pago.proveedor}</p>
                    <p className="text-sm text-slate-500">Vence en {pago.dias_restantes} días</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    Q{pago.monto.toLocaleString()}
                  </p>
                  {pago.descuento_pronto_pago && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      💰 Desc: {pago.descuento_pronto_pago}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <Link 
            to="/tesoreria/cuentas-por-pagar" 
            className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
          >
            Ver todos los pagos
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Cash Flow Projection - CON DATOS REALES */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Proyección Cash Flow</h2>
                <p className="text-sm text-slate-500">13 semanas</p>
              </div>
            </div>
            {proyeccionData.resumen?.riesgo_quiebra_tecnica && (
              <span className="badge-error text-xs">⚠️ Riesgo detectado</span>
            )}
          </div>

          {loadingProy ? (
            <div className="h-48 flex items-center justify-center">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          ) : datosProyeccion.length > 0 ? (
            <>
              <div className="relative h-48">
                <div className="absolute inset-0 flex items-end justify-between gap-1">
                  {datosProyeccion.slice(0, 12).map((semana, i) => {
                    const maxSaldo = Math.max(...datosProyeccion.map(s => s.saldo_acumulado))
                    const minSaldo = Math.min(...datosProyeccion.map(s => s.saldo_acumulado))
                    const rango = maxSaldo - minSaldo || 1
                    const altura = Math.max(((semana.saldo_acumulado - minSaldo) / rango) * 80 + 10, 5)
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            semana.certeza === 'baja' 
                              ? 'bg-gradient-to-t from-cyan-300 to-cyan-400 opacity-60' 
                              : semana.certeza === 'media'
                                ? 'bg-gradient-to-t from-cyan-400 to-cyan-500 opacity-80'
                                : 'bg-gradient-to-t from-cyan-500 to-cyan-600'
                          } ${semana.alerta ? 'ring-2 ring-rose-400' : ''}`}
                          style={{ height: `${altura}%` }}
                          title={`Semana ${semana.semana}: Q${semana.saldo_acumulado.toLocaleString()}${semana.alerta ? '\n' + semana.alerta : ''}`}
                        />
                        {i % 3 === 0 && (
                          <span className="text-xs text-slate-400">S{i + 1}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                <div className="absolute bottom-6 left-0 right-0 h-px bg-slate-200" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">Saldo Mínimo</p>
                  <p className={`text-lg font-bold ${proyeccionData.resumen?.riesgo_quiebra_tecnica ? 'text-rose-600' : 'text-slate-900'}`}>
                    Q{(proyeccionData.resumen?.saldo_minimo_proyectado || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">Saldo Máximo</p>
                  <p className="text-lg font-bold text-slate-900">
                    Q{(proyeccionData.resumen?.saldo_maximo_proyectado || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs text-slate-500">Semana Crítica</p>
                  <p className={`text-lg font-bold ${proyeccionData.resumen?.semana_critica < 8 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {proyeccionData.resumen?.semana_critica || '—'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-600"></div>
                    <span className="text-slate-600">Alta certeza</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                    <span className="text-slate-600">Baja certeza</span>
                  </div>
                </div>
                <span className="text-slate-500">
                  Saldo proyectado: Q{datosProyeccion[datosProyeccion.length - 1]?.saldo_acumulado.toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">
              No hay datos de proyección disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}