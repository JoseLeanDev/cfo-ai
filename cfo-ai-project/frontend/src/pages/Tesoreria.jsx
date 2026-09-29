import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { prepararContexto, calcular, fq, pct, suma } from '../lib/proyeccionCaja'
import { useTesoreriaPosicion, useTesoreriaCxC, useTesoreriaCxP, useTesoreriaProyeccion, useWorkingCapital } from '../hooks/useCfoData'
import PageInsights from '../components/agents/PageInsights'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
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
  const { data: proyeccion, isLoading: loadingProy } = useTesoreriaProyeccion()
  const { data: workingCapital, isLoading: loadingWC } = useWorkingCapital({ meses: 6 })

  const posicionData = posicion?.data || {}
  const cxcData = cxc?.data || {}
  const cxpData = cxp?.data || {}
  const proy = useMemo(() => {
    if (!proyeccion?.data) return null
    const ctx = prepararContexto(proyeccion.data)
    return { ctx, ...calcular(ctx, 'base', {}, 13) }
  }, [proyeccion])
  const wcData = workingCapital?.data || {}
  const metricas = wcData.metricas_principales || {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Tesorería</h1>
          <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">
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
            <span className="kpi-label">Días de caja</span>
            <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">
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
            <span className={`text-2xl font-semibold ${
              (metricas.c2c?.valor || 0) < 30 ? 'text-verified' : 
              (metricas.c2c?.valor || 0) < 60 ? 'text-copper' : 
              (metricas.c2c?.valor || 0) < 90 ? 'text-copper' : 'text-breach'
            }`}>
              {loadingWC ? '—' : `${metricas.c2c?.valor || 0} días`}
            </span>
          </div>
        </div>

        <div className="p-5 pt-0">
          {loadingWC ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* CCC Visualization */}
              <div className="flex items-center justify-between mb-6">
                {/* DIO */}
                <div className="flex-1 text-center">
                  <div className="text-3xl font-semibold text-cobalt">{metricas.dio?.valor || 0}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">DIO</div>
                  <div className="text-[0.75rem] text-[var(--text-muted)]">Días Inventario</div>
                </div>

                <div className="text-2xl text-[var(--text-muted)]">+</div>

                {/* DSO */}
                <div className="flex-1 text-center">
                  <div className="text-3xl font-semibold text-cobalt">{metricas.dso?.valor || 0}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">DSO</div>
                  <div className="text-[0.75rem] text-[var(--text-muted)]">Días Cobro</div>
                </div>

                <div className="text-2xl text-[var(--text-muted)]">−</div>

                {/* DPO */}
                <div className="flex-1 text-center">
                  <div className="text-3xl font-semibold text-verified">{metricas.dpo?.dias_real || 0}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">DPO</div>
                  <div className="text-[0.75rem] text-[var(--text-muted)]">Días Pago</div>
                </div>

                <div className="text-2xl text-[var(--text-muted)]">=</div>

                {/* C2C */}
                <div className="flex-1 text-center">
                  <div className={`text-3xl font-semibold ${
                    (metricas.c2c?.valor || 0) < 30 ? 'text-verified' : 
                    (metricas.c2c?.valor || 0) < 60 ? 'text-copper' : 
                    (metricas.c2c?.valor || 0) < 90 ? 'text-copper' : 'text-breach'
                  }`}>
                    {metricas.c2c?.valor || 0}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">CCC</div>
                  <div className="text-[0.75rem] text-[var(--text-muted)]">Ciclo de Efectivo</div>
                </div>
              </div>

              {/* Progress bar visualization */}
              <div className="relative h-4 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-4">
                <div className="absolute left-0 h-full bg-cobalt" style={{ width: `${Math.min((metricas.dio?.valor || 0) / 120 * 100, 33)}%` }} />
                <div className="absolute h-full bg-cobalt" style={{ left: `${Math.min((metricas.dio?.valor || 0) / 120 * 100, 33)}%`, width: `${Math.min((metricas.dso?.valor || 0) / 120 * 100, 33)}%` }} />
                <div className="absolute h-full bg-verified" style={{ right: '0', width: `${Math.min((metricas.dpo?.dias_real || 0) / 120 * 100, 33)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-6">
                <span className="text-cobalt">Inventario</span>
                <span className="text-cobalt">Cobro</span>
                <span className="text-verified">Pago</span>
              </div>

              {/* Recommendations */}
              {wcData.recomendaciones?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <LightBulbIcon className="w-4 h-4 text-copper" />
                    Acciones Recomendadas
                  </h3>
                  {wcData.recomendaciones.slice(0, 2).map((rec, idx) => (
                    <div key={idx} className="bg-[var(--bg-secondary)] p-3 rounded-card">
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
                          <span className="text-xs font-medium text-verified bg-verified-50 px-2 py-1 rounded">
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
                    <div key={idx} className={`p-3 rounded-card flex items-start gap-2 ${
                      alerta.severidad === 'critica' ? 'bg-breach-50 border border-breach-100' : 'bg-copper-50 border border-copper-100'
                    }`}>
                      <ExclamationTriangleIcon className={`w-4 h-4 flex-shrink-0 ${
                        alerta.severidad === 'critica' ? 'text-breach' : 'text-copper'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${
                          alerta.severidad === 'critica' ? 'text-breach' : 'text-copper'
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
                <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded-card animate-pulse" />
              ))
            ) : (
              posicionData.cuentas?.map((cuenta, idx) => (
                <div 
                  key={`${cuenta.banco}-${cuenta.moneda}-${idx}`}
                  className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-card hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-card flex items-center justify-center ${
                      cuenta.moneda === 'USD' ? 'bg-verified-50 text-verified' : 'bg-paper text-cobalt'
                    }`}>
                      <span className="font-semibold text-sm">{cuenta.moneda}</span>
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
                al_corriente: { label: 'Al corriente', color: 'bg-verified' },
                _30_dias: { label: '1-30 días', color: 'bg-copper' },
                _60_dias: { label: '31-60 días', color: 'bg-copper' },
                _90_dias: { label: '60+ días', color: 'bg-breach' }
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
                <div key={idx} className="flex items-center justify-between gap-3 py-2 px-3 rounded-card bg-[var(--bg-secondary)]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-white text-[var(--text-muted)] text-xs font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">{deudor.cliente}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`text-sm font-medium tabular-nums ${deudor.dias > 60 ? 'text-[var(--danger)]' : ''}`}>
                      Q{deudor.monto.toLocaleString()}
                    </span>
                    <span className={`badge text-[0.75rem] ${deudor.dias > 60 ? 'badge-danger' : deudor.dias > 30 ? 'badge-warning' : 'badge-success'}`}>
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
              <div key={idx} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-card">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-card flex items-center justify-center ${
                    pago.dias_restantes <= 5 ? 'bg-breach-50 text-breach' : 
                    pago.dias_restantes <= 10 ? 'bg-copper-50 text-copper' : 
                    'bg-verified-50 text-verified'
                  }`}>
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{pago.proveedor}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {pago.dias_restantes < 0 ? `Venció hace ${-pago.dias_restantes} días` : pago.dias_restantes === 0 ? 'Vence hoy' : `Vence en ${pago.dias_restantes} días`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="amount">Q{pago.monto.toLocaleString()}</p>
                  {pago.descuento_pronto_pago && (
                    <span className="badge-success text-[0.75rem] mt-1">
                       Desc: {pago.descuento_pronto_pago}
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

        {/* Proyección de caja: el mismo modelo de la página de Proyecciones */}
        <div className="lg:col-span-2 card">
          <div className="section-header">
            <ArrowTrendingUpIcon className="w-5 h-5 text-slate" />
            <div className="flex-1">
              <h2 className="font-semibold">Proyección de caja</h2>
              <p className="text-xs text-[var(--text-muted)]">13 semanas · escenario base</p>
            </div>
            <Link to="/tesoreria/proyecciones" className="text-sm text-[var(--accent-blue)] hover:underline flex items-center gap-1">
              Ver proyección <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          {loadingProy || !proy ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 pt-0">
              {[
                ['Entra en 13 semanas', fq(suma(proy.S.inn.slice(0, 13))), 'text-[var(--success)]'],
                ['Sale en 13 semanas', fq(suma(proy.S.out.slice(0, 13))), 'text-[var(--danger)]'],
                ['Saldo mínimo', fq(proy.M.min), '', `Semana ${proy.M.wmin + 1} · ${proy.ctx.cal.rango(proy.M.wmin)}`],
                ['Saldo en 13 semanas', fq(proy.M.fin), '', `${pct(proy.M.docPct)} con documento`],
              ].map(([l, v, c, n]) => (
                <div key={l} className="p-3 bg-[var(--bg-secondary)] rounded-card">
                  <p className="text-[0.75rem] text-[var(--text-muted)] uppercase tracking-wider">{l}</p>
                  <p className={`text-lg font-semibold font-mono ${c}`}>{v}</p>
                  {n ? <p className="text-[0.75rem] text-[var(--text-muted)]">{n}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
