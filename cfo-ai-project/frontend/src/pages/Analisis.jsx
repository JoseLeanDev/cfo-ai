import { useMemo } from 'react'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import PageInsights from '../components/agents/PageInsights'
import { useWorkingCapital, useRatiosFinancieros } from '../hooks/useCfoData'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + Math.round(value).toLocaleString('es-GT')
}

const formatNum = (value, dec = 1) => {
  if (!value && value !== 0) return '0'
  return Number(value).toFixed(dec)
}

// Status helper
const getStatus = (value, umbral, inverse = false) => {
  const num = parseFloat(value)
  const thr = parseFloat(umbral)
  if (inverse) {
    if (num <= thr * 0.8) return 'excelente'
    if (num <= thr) return 'bueno'
    if (num <= thr * 1.2) return 'regular'
    return 'critico'
  }
  if (num >= thr * 1.2) return 'excelente'
  if (num >= thr) return 'bueno'
  if (num >= thr * 0.8) return 'regular'
  return 'critico'
}

const statusStyles = {
  excelente: 'text-verified',
  bueno: 'text-verified',
  regular: 'text-copper',
  critico: 'text-breach'
}

const statusBg = {
  excelente: 'bg-verified/10 border-verified/20',
  bueno: 'bg-verified/10 border-verified/20',
  regular: 'bg-copper/10 border-copper/20',
  critico: 'bg-breach/10 border-breach/20'
}

export default function Analisis() {
  // Real data from API
  const { data: wcData, isLoading: wcLoading } = useWorkingCapital({ empresaId: 1, meses: 6 })
  const { data: ratiosData, isLoading: ratiosLoading } = useRatiosFinancieros({ empresaId: 1 })

  const workingCapital = wcData?.data
  const ratios = ratiosData?.data
  const resumen = ratiosData?.resumen

  // KPIs calculados
  const kpis = useMemo(() => {
    const items = []

    // Liquidez
    if (ratios) {
      const liquidez = ratios.find(r => r.nombre === 'Liquidez Corriente')
      if (liquidez) {
        items.push({
          titulo: 'Liquidez Corriente',
          valor: liquidez.valor,
          unidad: '',
          umbral: liquidez.umbral,
          icon: ScaleIcon,
          descripcion: 'Capacidad de pagar deudas corto plazo'
        })
      }
    }

    // ROE
    if (ratios) {
      const roe = ratios.find(r => r.nombre === 'ROE')
      if (roe) {
        items.push({
          titulo: 'ROE',
          valor: roe.valor,
          unidad: '%',
          umbral: roe.umbral,
          icon: ArrowTrendingUpIcon,
          descripcion: 'Retorno sobre patrimonio'
        })
      }
    }

    // Margen Neto
    if (ratios) {
      const margen = ratios.find(r => r.nombre === 'Margen Neto')
      if (margen) {
        items.push({
          titulo: 'Margen Neto',
          valor: margen.valor,
          unidad: '%',
          umbral: margen.umbral,
          icon: BanknotesIcon,
          descripcion: 'Utilidad neta sobre ingresos'
        })
      }
    }

    // C2C
    if (workingCapital?.metricas_principales?.c2c) {
      const c2c = workingCapital.metricas_principales.c2c
      items.push({
        titulo: 'Cash Conversion',
        valor: c2c.valor,
        unidad: 'días',
        umbral: 60,
        icon: ArrowPathIcon,
        descripcion: 'Días efectivo atrapado en operaciones',
        inverse: true
      })
    }

    return items
  }, [ratios, workingCapital])

  const isLoading = wcLoading || ratiosLoading

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Análisis Financiero</h1>
          <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-slate">Ratios, rentabilidad y eficiencia operativa</p>
        </div>
      </div>

      {/* AI Insights */}
      <PageInsights context="analisis" maxInsights={3} />

      {/* Loading */}
      {isLoading && (
        <div className="card p-8 text-center">
          <ArrowPathIcon className="w-8 h-8 text-cobalt animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Analizando datos financieros...</p>
        </div>
      )}

      {/* KPIs Principales */}
      {!isLoading && kpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => {
            const status = getStatus(kpi.valor, kpi.umbral, kpi.inverse)
            const Icon = kpi.icon
            return (
              <div key={idx} className="kpi-card">
                {/* La tarjeta no se tiñe: el color vive en el estado contra el
                    umbral, no en la superficie ni en el nivel. */}
                <span className="kpi-label">{kpi.titulo}</span>
                <div className="kpi-value">
                  {kpi.valor}
                  {kpi.unidad ? <span className="ml-0.5">{kpi.unidad}</span> : null}
                </div>
                <p className={`mt-2 font-mono text-[0.75rem] tabular-nums ${statusStyles[status]}`}>
                  Umbral {kpi.umbral}
                  {kpi.unidad}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-snug text-slate">{kpi.descripcion}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Resumen Ejecutivo */}
      {!isLoading && resumen && (
        <div className="card">
          <div className="section-header">
            <BanknotesIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Resumen Financiero</h2>
          </div>
          <div className="p-5 pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
                <p className="text-xs text-[var(--text-muted)]">Activos Totales</p>
                <p className="text-lg font-semibold text-[var(--success)]">{formatGTQ(resumen.activos)}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
                <p className="text-xs text-[var(--text-muted)]">Pasivos Totales</p>
                <p className="text-lg font-semibold text-[var(--danger)]">{formatGTQ(resumen.pasivos)}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
                <p className="text-xs text-[var(--text-muted)]">Patrimonio</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{formatGTQ(resumen.patrimonio)}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
                <p className="text-xs text-[var(--text-muted)]">Utilidad Neta</p>
                <p className={`text-lg font-semibold ${resumen.utilidad >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {formatGTQ(resumen.utilidad)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ratios Financieros */}
        {!isLoading && ratios && ratios.length > 0 && (
          <div className="card">
            <div className="section-header">
              <ScaleIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Ratios Financieros</h2>
            </div>
            <div className="space-y-3 p-5 pt-0">
              {ratios.map((ratio, idx) => {
                const status = ratio.estado || getStatus(ratio.valor, ratio.umbral, ratio.nombre === 'Endeudamiento')
                const valor = parseFloat(ratio.valor)
                const umbral = parseFloat(ratio.umbral)
                const porcentaje = Math.min((valor / (umbral * 1.5)) * 100, 100)

                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-card">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{ratio.nombre}</p>
                        <span className={`text-xs font-semibold ${statusStyles[status]}`}>
                          {ratio.valor}{ratio.unidad}
                        </span>
                      </div>
                      <p className="text-[0.75rem] text-[var(--text-muted)]">{ratio.formula}</p>
                      <div className="mt-2 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === 'excelente' || status === 'bueno' ? 'bg-verified' :
                            status === 'regular' ? 'bg-copper' : 'bg-breach'
                          }`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <span className={`text-[0.6875rem] px-1.5 py-0.5 rounded ${
                        status === 'saludable' || status === 'excelente' || status === 'bueno'
                          ? 'bg-verified/10 text-verified'
                          : 'bg-copper/10 text-copper'
                      }`}>
                        {status === 'saludable' ? 'OK' : status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Working Capital - DSO / DPO / C2C */}
        {!isLoading && workingCapital?.metricas_principales && (
          <div className="card">
            <div className="section-header">
              <ArrowPathIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Working Capital</h2>
            </div>
            <div className="space-y-4 p-5 pt-0">
              {(() => {
                const { dso, dpo, c2c } = workingCapital.metricas_principales
                return (
                  <>
                    {/* DSO */}
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">DSO — Días de Cobro</p>
                          <p className="text-[0.75rem] text-[var(--text-muted)]">Days Sales Outstanding</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${dso.valor <= dso.benchmark ? 'text-verified' : 'text-copper'}`}>
                            {dso.valor} días
                          </p>
                          <p className="text-[0.75rem] text-[var(--text-muted)]">Benchmark: {dso.benchmark}</p>
                        </div>
                      </div>
                      {dso.monto_vencido > 0 && (
                        <div className="mt-2 p-2 bg-breach/10 rounded border border-breach/20">
                          <p className="text-xs text-breach">
                            <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
                            {formatGTQ(dso.monto_vencido)} vencido ({dso.porcentaje_vencido}%)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* DPO */}
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">DPO — Días de Pago</p>
                          <p className="text-[0.75rem] text-[var(--text-muted)]">Days Payable Outstanding</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${dpo.dias_real >= dpo.benchmark ? 'text-verified' : 'text-copper'}`}>
                            {dpo.dias_real} días
                          </p>
                          <p className="text-[0.75rem] text-[var(--text-muted)]">Benchmark: {dpo.benchmark}</p>
                        </div>
                      </div>
                      {dpo.monto_vencido > 0 && (
                        <div className="mt-2 p-2 bg-breach/10 rounded border border-breach/20">
                          <p className="text-xs text-breach">
                            <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
                            {formatGTQ(dpo.monto_vencido)} vencido con proveedores
                          </p>
                        </div>
                      )}
                    </div>

                    {/* C2C */}
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">C2C — Cash Conversion Cycle</p>
                          <p className="text-[0.75rem] text-[var(--text-muted)]">{c2c.formula}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${
                            c2c.valor < 30 ? 'text-verified' :
                            c2c.valor < 60 ? 'text-verified' :
                            c2c.valor < 90 ? 'text-copper' : 'text-breach'
                          }`}>
                            {c2c.valor} días
                          </p>
                          <p className="text-[0.75rem] text-[var(--text-muted)]">{c2c.interpretacion}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c2c.valor < 60 ? 'bg-verified' :
                              c2c.valor < 90 ? 'bg-copper' : 'bg-breach'
                            }`}
                            style={{ width: `${Math.min((c2c.valor / 120) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[0.6875rem] text-[var(--text-muted)]">0 días</span>
                          <span className="text-[0.6875rem] text-[var(--text-muted)]">60 días</span>
                          <span className="text-[0.6875rem] text-[var(--text-muted)]">120 días</span>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Recomendaciones de Working Capital */}
      {!isLoading && workingCapital?.recomendaciones && workingCapital.recomendaciones.length > 0 && (
        <div className="card">
          <div className="section-header">
            <LightBulbIcon className="w-5 h-5 text-[var(--accent-orange)]" />
            <h2 className="font-semibold">Recomendaciones de Optimización</h2>
          </div>
          <div className="p-5 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {workingCapital.recomendaciones.map((rec, idx) => (
              <div key={idx} className="p-4 bg-[var(--bg-secondary)] rounded-card border-l-4 border-[var(--accent-orange)]">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{rec.titulo}</h4>
                  <span className={`text-[0.75rem] px-2 py-0.5 rounded ${
                    rec.prioridad === 'alta' ? 'bg-breach/10 text-breach' :
                    rec.prioridad === 'media' ? 'bg-copper/10 text-copper' :
                    'bg-cobalt/10 text-cobalt'
                  }`}>
                    {rec.prioridad}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">{rec.descripcion}</p>
                {rec.impacto_efectivo > 0 && (
                  <p className="text-xs text-[var(--success)] font-medium">
                     Impacto estimado: +{formatGTQ(rec.impacto_efectivo)}
                  </p>
                )}
                <div className="mt-2 space-y-1">
                  {rec.acciones?.map((accion, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircleIcon className="w-3 h-3 text-[var(--accent-orange)] mt-0.5 flex-shrink-0" />
                      <p className="text-[0.8125rem] text-[var(--text-muted)]">{accion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas */}
      {!isLoading && workingCapital?.alertas && workingCapital.alertas.length > 0 && (
        <div className="space-y-2">
          {workingCapital.alertas.map((alerta, idx) => (
            <div key={idx} className="p-4 rounded-card bg-breach/10 border border-breach/20 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-breach flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-breach">{alerta.mensaje}</p>
                <p className="text-xs text-breach mt-1">{alerta.accion_urgente}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
