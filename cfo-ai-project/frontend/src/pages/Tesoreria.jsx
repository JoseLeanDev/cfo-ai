import { Link } from 'react-router-dom'
import { useTesoreriaPosicion, useTesoreriaCxC, useTesoreriaCxP, useTesoreriaProyeccion, useWorkingCapital } from '../hooks/useCfoData'
import PageInsights from '../components/agents/PageInsights'
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ClockIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

// Format currency
const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

export default function Tesoreria() {
  const { data: posicion, isLoading: loadingPos } = useTesoreriaPosicion()
  const { data: cxc, isLoading: loadingCxC } = useTesoreriaCxC()
  const { data: cxp, isLoading: loadingCxP } = useTesoreriaCxP()
  const { data: proyeccion, isLoading: loadingProy } = useTesoreriaProyeccion(13)
  const { data: workingCapital, isLoading: loadingWC } = useWorkingCapital({ meses: 6 })

  const posicionData = posicion?.data || {}
  const cxcData = cxc?.data || {}
  const cxpData = cxp?.data || {}
  const proyeccionData = proyeccion?.data || {}
  const wcData = workingCapital?.data || {}
  const metricas = wcData.metricas_principales || {}

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
          <BanknotesIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Tesorería</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Posición al {posicionData.fecha_corte} • Tipo de cambio: Q{posicionData.tipo_cambio}
          </p>
        </div>
      </div>

      {/* AI Insights */}
      <PageInsights context="tesoreria" maxInsights={3} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Disponible GTQ</span>
            <span className="badge-success">Local</span>
          </div>
          <div className="kpi-value">
            {loadingPos ? '---' : formatGTQ(posicionData.total_disponible_gtq)}
          </div>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Disponible USD</span>
            <span className="badge-info">USD</span>
          </div>
          <div className="kpi-value">
            {loadingPos ? '---' : new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(posicionData.total_disponible_usd)}
          </div>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Total Consolidado</span>
            <ArrowTrendingUpIcon className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="kpi-value">
            {loadingPos ? '---' : formatGTQ(posicionData.total_consolidado_gtq)}
          </div>
        </div>

        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Días Operación</span>
            <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className={`kpi-value ${posicionData.dias_operacion < 30 ? 'text-[var(--danger)]' : ''}`}>
            {loadingPos ? '---' : `${posicionData.dias_operacion} días`}
          </div>
          {posicionData.dias_operacion < 30 && (
            <span className="text-xs text-[var(--danger)]">Atención</span>
          )}
        </div>
      </div>

      {/* Cash Conversion Cycle Section */}
      <div className="card">
        <div className="section-header">
          <ArrowPathIcon className="w-5 h-5 text-[var(--text-muted)]" />
          <div className="flex-1">
            <h2 className="font-semibold">Cash Conversion Cycle</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {metricas.c2c?.interpretacion || 'Calculando...'} • Benchmark: {metricas.c2c?.benchmark || '—'} días
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${
              (metricas.c2c?.valor || 0) < 30 ? 'text-emerald-600' : 
              (metricas.c2c?.valor || 0) < 60 ? 'text-amber-600' : 
              (metricas.c2c?.valor || 0) < 90 ? 'text-orange-600' : 'text-rose-600'
            }`}>
              {loadingWC ? '—' : `${metricas.c2c?.valor || 0} días`}
            </span>
          </div>
        </div>
        
        <div className="p-5 pt-0">
          {loadingWC ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* CCC Visualization */}
              <div className="flex items-center justify-between mb-6">
                {/* DIO */}
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-blue-600">{metricas.dio?.valor || 0}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">DIO</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Días Inventario</div>
                </div>
                
                <div className="text-2xl text-[var(--text-muted)]">+</div>
                
                {/* DSO */}
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-purple-600">{metricas.dso?.valor || 0}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">DSO</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Días Cobro</div>
                </div>
                
                <div className="text-2xl text-[var(--text-muted)]">−</div>
                
                {/* DPO */}
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-emerald-600">{metricas.dpo?.dias_real || 0}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">DPO</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Días Pago</div>
                </div>
                
                <div className="text-2xl text-[var(--text-muted)]">=</div>
                
                {/* C2C */}
                <div className="flex-1 text-center">
                  <div className={`text-3xl font-bold ${
                    (metricas.c2c?.valor || 0) < 30 ? 'text-emerald-600' : 
                    (metricas.c2c?.valor || 0) < 60 ? 'text-amber-600' : 
                    (metricas.c2c?.valor || 0) < 90 ? 'text-orange-600' : 'text-rose-600'
                  }`}>
                    {metricas.c2c?.valor || 0}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">CCC</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Ciclo de Efectivo</div>
                </div>
              </div>
              
              {/* Progress bar visualization */}
              <div className="relative h-4 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-4">
                <div className="absolute left-0 h-full bg-blue-500" style={{ width: `${Math.min((metricas.dio?.valor || 0) / 120 * 100, 33)}%` }} />
                <div className="absolute h-full bg-purple-500" style={{ left: `${Math.min((metricas.dio?.valor || 0) / 120 * 100, 33)}%`, width: `${Math.min((metricas.dso?.valor || 0) / 120 * 100, 33)}%` }} />
                <div className="absolute h-full bg-emerald-500" style={{ right: '0', width: `${Math.min((metricas.dpo?.dias_real || 0) / 120 * 100, 33)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-6">
                <span className="text-blue-600">Inventario</span>
                <span className="text-purple-600">Cobro</span>
                <span className="text-emerald-600">Pago</span>
              </div>
              
              {/* Recommendations */}
              {wcData.recomendaciones?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <LightBulbIcon className="w-4 h-4 text-amber-500" />
                    Acciones Recomendadas
                  </h3>
                  {wcData.recomendaciones.slice(0, 2).map((rec, idx) => (
                    <div key={idx} className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{rec.titulo}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{rec.descripcion}</p>
                          {rec.acciones?.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {rec.acciones.slice(0, 2).map((acc, i) => (
                                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-[var(--accent-blue)]" />
                                  {acc}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {rec.impacto_efectivo > 0 && (
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            +Q{rec.impacto_efectivo.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Alertas */}
              {wcData.alertas?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {wcData.alertas.map((alerta, idx) => (
                    <div key={idx} className={`p-3 rounded-lg flex items-start gap-2 ${
                      alerta.severidad === 'critica' ? 'bg-rose-50 border border-rose-200' : 'bg-amber-50 border border-amber-200'
                    }`}>
                      <ExclamationTriangleIcon className={`w-4 h-4 flex-shrink-0 ${
                        alerta.severidad === 'critica' ? 'text-rose-500' : 'text-amber-500'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${
                          alerta.severidad === 'critica' ? 'text-rose-700' : 'text-amber-700'
                        }`}>
                          {alerta.mensaje}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{alerta.accion_urgente}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuentas Bancarias */}
        <div className="card">
          <div className="section-header">
            <BuildingLibraryIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Cuentas Bancarias</h2>
            <Link to="/tesoreria/cuentas-bancarias" className="ml-auto btn-secondary text-xs">
              Ver todas
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3 p-5 pt-0">
            {loadingPos ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
              ))
            ) : (
              posicionData.cuentas?.map((cuenta, idx) => (
                <div 
                  key={`${cuenta.banco}-${cuenta.moneda}-${idx}`}
                  className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      cuenta.moneda === 'USD' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <span className="font-bold text-sm">{cuenta.moneda}</span>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{cuenta.banco}</p>
                      <p className="text-sm text-[var(--text-muted)] capitalize">{cuenta.tipo}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="amount">
                      {new Intl.NumberFormat('es-GT', {
                        style: 'currency',
                        currency: cuenta.moneda,
                        minimumFractionDigits: 0
                      }).format(cuenta.saldo)}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {cuenta.dias_sin_conciliar > 2 ? (
                        <span className="badge-warning text-[10px]">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Sin conciliar
                        </span>
                      ) : (
                        <span className="badge-success text-[10px]">
                          <CheckCircleIcon className="w-3 h-3" />
                          Conciliado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CxC Aging */}
        <div className="card">
          <div className="section-header">
            <ArrowTrendingUpIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <div className="flex-1">
              <h2 className="font-semibold">CxC - Aging</h2>
              <p className="text-xs text-[var(--text-muted)]">Promedio {cxcData.promedio_dias_cobro} días</p>
            </div>
            <span className="amount">{formatGTQ(cxcData.total_cxc)}</span>
          </div>
          
          <div className="space-y-4 p-5 pt-0">
            {Object.entries(cxcData.distribucion_aging || {}).map(([rango, datos]) => {
              const config = {
                al_corriente: { label: 'Al corriente', color: 'bg-emerald-500' },
                _30_dias: { label: '1-30 días', color: 'bg-amber-500' },
                _60_dias: { label: '31-60 días', color: 'bg-orange-500' },
                _90_dias: { label: '60+ días', color: 'bg-rose-500' }
              }[rango] || { label: rango, color: 'bg-gray-500' }

              return (
                <div key={rango} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--text-secondary)]">{config.label}</span>
                    <span className="font-semibold tabular-nums">
                      Q{(datos.monto || 0).toLocaleString()} ({datos.porcentaje}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${config.color}`} style={{ width: `${datos.porcentaje}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Top Deudores */}
          <div className="mt-4 p-5 pt-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Top Deudores</p>
              <Link to="/tesoreria/cuentas-por-cobrar" className="text-xs text-[var(--accent-blue)] hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-2">
              {cxcData.top_deudores?.slice(0, 3).map((deudor, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white text-[var(--text-muted)] text-xs font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-[var(--text-primary)] truncate max-w-[180px]">{deudor.cliente}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium tabular-nums ${deudor.dias > 60 ? 'text-[var(--danger)]' : ''}`}>
                      Q{deudor.monto.toLocaleString()}
                    </span>
                    <span className={`badge text-[10px] ${deudor.dias > 60 ? 'badge-danger' : deudor.dias > 30 ? 'badge-warning' : 'badge-success'}`}>
                      {deudor.dias} días
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CxP Próximos */}
        <div className="card">
          <div className="section-header">
            <ArrowTrendingDownIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <div className="flex-1">
              <h2 className="font-semibold">CxP Próximos</h2>
              <p className="text-xs text-[var(--text-muted)]">Promedio {cxpData.promedio_dias_pago} días</p>
            </div>
            <span className="amount">{formatGTQ(cxpData.total_cxp)}</span>
          </div>
          
          <div className="space-y-3 p-5 pt-0">
            {cxpData.proximos_pagos?.slice(0, 5).map((pago, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    pago.dias_restantes <= 5 ? 'bg-rose-100 text-rose-700' : 
                    pago.dias_restantes <= 10 ? 'bg-amber-100 text-amber-700' : 
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{pago.proveedor}</p>
                    <p className="text-sm text-[var(--text-muted)]">Vence en {pago.dias_restantes} días</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="amount">Q{pago.monto.toLocaleString()}</p>
                  {pago.descuento_pronto_pago && (
                    <span className="badge-success text-[10px] mt-1">
                      💰 Desc: {pago.descuento_pronto_pago}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <Link to="/tesoreria/cuentas-por-pagar" className="flex items-center justify-center gap-2 w-full py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors">
            Ver todos los pagos
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Proyección Cash Flow */}
        <div className="card">
          <div className="section-header">
            <ArrowTrendingUpIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <div className="flex-1">
              <h2 className="font-semibold">Proyección Cash Flow</h2>
              <p className="text-xs text-[var(--text-muted)]">13 semanas</p>
            </div>
            {proyeccionData.resumen?.riesgo_quiebra_tecnica && (
              <span className="badge-danger text-xs">⚠️ Riesgo</span>
            )}
          </div>
          
          {loadingProy ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : proyeccionData.proyeccion?.length > 0 ? (
            <div className="p-5 pt-0">
              <div className="h-48 flex items-end justify-between gap-1">
                {proyeccionData.proyeccion.slice(0, 12).map((semana, idx) => {
                  const saldos = proyeccionData.proyeccion.map(s => s.saldo_acumulado || 0)
                  const maxSaldo = Math.max(...saldos)
                  const minSaldo = Math.min(...saldos)
                  const range = maxSaldo - minSaldo || maxSaldo || 1
                  const altura = ((semana.saldo_acumulado - minSaldo) / range * 75) + 15

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full flex items-end justify-center" style={{ height: '140px' }}>
                        <div className={`w-full rounded-t transition-all ${
                          semana.certeza === 'baja' ? 'bg-blue-300' :
                          semana.certeza === 'media' ? 'bg-blue-400' :
                          'bg-blue-500'
                        } ${semana.alerta ? 'ring-2 ring-rose-400' : ''}`}
                          style={{ height: `${Math.max(altura, 8)}%`, minHeight: '8px' }}
                        />
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1.5 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          S{semana.semana}: Q{semana.saldo_acumulado.toLocaleString()}
                          {semana.alerta && <span className="block text-rose-400">⚠️ {semana.alerta}</span>}
                        </div>
                      </div>
                      {idx % 3 === 0 && (
                        <span className="text-xs text-[var(--text-muted)]">S{idx + 1}</span>
                      )}
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-muted)]">Saldo Mínimo</p>
                  <p className={`text-lg font-bold tabular-nums ${proyeccionData.resumen?.riesgo_quiebra_tecnica ? 'text-[var(--danger)]' : ''}`}>
                    Q{(proyeccionData.resumen?.saldo_minimo_proyectado || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-muted)]">Saldo Máximo</p>
                  <p className="text-lg font-bold tabular-nums">
                    Q{(proyeccionData.resumen?.saldo_maximo_proyectado || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-muted)]">Semana Crítica</p>
                  <p className={`text-lg font-bold tabular-nums ${proyeccionData.resumen?.semana_critica < 8 ? 'text-[var(--danger)]' : ''}`}>
                    {proyeccionData.resumen?.semana_critica || '—'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-[var(--text-muted)]">Alta certeza</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-300" />
                    <span className="text-[var(--text-muted)]">Baja certeza</span>
                  </div>
                </div>
                <span className="text-[var(--text-muted)]">
                  Saldo proyectado: Q{proyeccionData.proyeccion[proyeccionData.proyeccion.length - 1]?.saldo_acumulado.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--text-muted)]">
              No hay datos de proyección disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
