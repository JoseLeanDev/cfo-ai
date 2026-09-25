import { useMemo } from 'react'
import { 
  UsersIcon, 
  ExclamationTriangleIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

/**
 * CustomerConcentrationRisk - Análisis de concentración de ingresos por cliente
 * 
 * Detecta riesgo existencial: dependencia de 1-2 clientes mayores
 * 
 * Umbrales:
 * -  >30%: Riesgo EXTREMO (acción inmediata)
 * -  20-30%: Riesgo ALTO (diversificar urgentemente)
 * -  15-20%: Atención (monitorear)
 * -  <15%: Saludable
 * 
 * Basado en principio Pareto: 80/20 de ingresos
 */
export default function CustomerConcentrationRisk({ 
  clientes = [],
  umbralAlerta = 20, // % que dispara alerta
  umbralCritico = 30 // % que dispara acción inmediata
}) {

  const analisis = useMemo(() => {
    if (!clientes.length) return null

    // Ordenar por ingresos descendente
    const sorted = [...clientes].sort((a, b) => b.ingresos - a.ingresos)
    const totalIngresos = sorted.reduce((sum, c) => sum + c.ingresos, 0)

    // Calcular % acumulado (Pareto)
    let acumulado = 0
    const conPorcentaje = sorted.map(c => {
      const porcentaje = (c.ingresos / totalIngresos) * 100
      acumulado += porcentaje
      return {
        ...c,
        porcentaje,
        acumulado
      }
    })

    // Identificar riesgos
    const clienteMayor = conPorcentaje[0]
    const top3 = conPorcentaje.slice(0, 3)
    const top3Total = top3.reduce((sum, c) => sum + c.porcentaje, 0)

    // Calcular diversificación (índice de Herfindahl simplificado)
    const hhi = conPorcentaje.reduce((sum, c) => sum + Math.pow(c.porcentaje / 100, 2), 0)
    const diversificacion = hhi < 0.15 ? 'excelente' : hhi < 0.25 ? 'buena' : hhi < 0.35 ? 'moderada' : 'concentrada'

    // Determinar nivel de riesgo
    let riesgo = 'bajo'
    if (clienteMayor.porcentaje >= umbralCritico || top3Total >= 60) {
      riesgo = 'extremo'
    } else if (clienteMayor.porcentaje >= umbralAlerta || top3Total >= 50) {
      riesgo = 'alto'
    } else if (clienteMayor.porcentaje >= 15 || top3Total >= 40) {
      riesgo = 'moderado'
    }

    return {
      clientes: conPorcentaje,
      totalIngresos,
      clienteMayor,
      top3,
      top3Total,
      hhi,
      diversificacion,
      riesgo,
      clientes80: conPorcentaje.filter(c => c.acumulado <= 80).length
    }
  }, [clientes, umbralAlerta, umbralCritico])

  if (!analisis) {
    return (
      <div className="card p-6">
        <div className="text-center text-[var(--text-muted)]">
          <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay datos de clientes disponibles</p>
        </div>
      </div>
    )
  }

  const { 
    clientes: clientesProcesados, 
    totalIngresos, 
    clienteMayor, 
    top3, 
    top3Total, 
    diversificacion, 
    riesgo,
    clientes80 
  } = analisis

  const configRiesgo = {
    extremo: {
      color: 'text-breach',
      bg: 'bg-breach-50',
      border: 'border-breach-100',
      icon: ExclamationTriangleIcon,
      label: 'RIESGO EXTREMO',
      mensaje: 'Depencencia crítica detectada. Acción inmediata requerida.'
    },
    alto: {
      color: 'text-copper',
      bg: 'bg-copper-50',
      border: 'border-copper-100',
      icon: ExclamationTriangleIcon,
      label: 'RIESGO ALTO',
      mensaje: 'Alta concentración. Diversificación urgente recomendada.'
    },
    moderado: {
      color: 'text-copper',
      bg: 'bg-copper-50',
      border: 'border-copper-100',
      icon: ArrowTrendingUpIcon,
      label: 'ATENCIÓN',
      mensaje: 'Concentración moderada. Monitorear y planificar diversificación.'
    },
    bajo: {
      color: 'text-verified',
      bg: 'bg-verified-50',
      border: 'border-verified-100',
      icon: ChartPieIcon,
      label: 'DIVERSIFICADO',
      mensaje: 'Cartera de clientes saludable y diversificada.'
    }
  }

  const config = configRiesgo[riesgo]
  const Icon = config.icon

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="section-header">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-semibold">Customer Concentration Risk</h2>
            <p className="text-sm text-[var(--text-muted)]">Análisis de dependencia de ingresos por cliente</p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${config.border} border`}>
          {config.label}
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Alerta Principal */}
        <div className={`p-4 rounded-card border ${config.bg} ${config.border}`}>
          <div className="flex items-start gap-3">
            <Icon className={`w-6 h-6 ${config.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className={`font-semibold ${config.color}`}>{config.mensaje}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {clienteMayor.nombre} representa el <strong>{clienteMayor.porcentaje.toFixed(1)}%</strong> de ingresos totales.
                Los top 3 clientes suman <strong>{top3Total.toFixed(1)}%</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
            <span className="text-sm text-[var(--text-muted)]">Cliente Mayor</span>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{clienteMayor.porcentaje.toFixed(1)}%</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{clienteMayor.nombre}</p>
          </div>

          <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
            <span className="text-sm text-[var(--text-muted)]">Top 3 Clientes</span>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{top3Total.toFixed(1)}%</p>
            <p className="text-xs text-[var(--text-muted)]">Concentración</p>
          </div>

          <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
            <span className="text-sm text-[var(--text-muted)]">Principio 80/20</span>
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{clientes80}</p>
            <p className="text-xs text-[var(--text-muted)]">Clientes = 80% ingresos</p>
          </div>

          <div className="p-4 bg-[var(--bg-secondary)] rounded-card">
            <span className="text-sm text-[var(--text-muted)]">Diversificación</span>
            <p className={`text-lg font-semibold capitalize ${
              diversificacion === 'excelente' ? 'text-verified' :
              diversificacion === 'buena' ? 'text-cobalt' :
              diversificacion === 'moderada' ? 'text-copper' : 'text-breach'
            }`}>{diversificacion}</p>
            <p className="text-xs text-[var(--text-muted)]">Índice de cartera</p>
          </div>
        </div>

        {/* Gráfico de Pareto */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Distribución de Ingresos (Pareto)</h3>

          <div className="space-y-2">
            {clientesProcesados.slice(0, 8).map((cliente, i) => {
              const esRiesgo = cliente.porcentaje >= umbralAlerta
              return (
                <div key={cliente.id || i} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)] w-6">{i + 1}</span>
                  <span className="text-sm flex-1 truncate">{cliente.nombre}</span>

                  <div className="flex-1 max-w-[200px]">
                    <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          esRiesgo ? 'bg-breach' : 
                          cliente.porcentaje >= 10 ? 'bg-copper' : 'bg-verified'
                        }`}
                        style={{ width: `${Math.min(cliente.porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>

                  <span className={`text-sm font-medium w-16 text-right ${
                    esRiesgo ? 'text-breach' : ''
                  }`}>
                    {cliente.porcentaje.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>          
          {clientesProcesados.length > 8 && (
            <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
              +{clientesProcesados.length - 8} clientes más
            </p>
          )}
        </div>

        {/* Acciones Sugeridas */}
        {(riesgo === 'extremo' || riesgo === 'alto') && (
          <div className="border-t border-[var(--border-default)] pt-4">
            <h3 className="text-sm font-medium mb-3"> Plan de Diversificación Recomendado</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { 
                  accion: 'Adquirir 2-3 clientes medianos', 
                  impacto: `Reducir ${clienteMayor.nombre} a <20%`, 
                  tiempo: '3-6 meses',
                  prioridad: 'Alta'
                },
                { 
                  accion: 'Renegociar contrato con mayor cliente', 
                  impacto: 'Escalar volumen con otros', 
                  tiempo: '1-2 meses',
                  prioridad: 'Media'
                },
                { 
                  accion: 'Campaña de prospección sector B', 
                  impacto: '+Q500K ingresos diversificados', 
                  tiempo: '2-4 meses',
                  prioridad: 'Alta'
                },
                { 
                  accion: 'Crear paquetes/servicios nuevos', 
                  impacto: 'Atraer segmentos diferentes', 
                  tiempo: '1-3 meses',
                  prioridad: 'Media'
                }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-[var(--bg-secondary)] rounded-card hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{item.accion}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.prioridad === 'Alta' ? 'bg-breach-50 text-breach' : 'bg-copper-50 text-copper'
                    }`}>
                      {item.prioridad}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[var(--success)]">{item.impacto}</span>
                    <span className="text-xs text-[var(--text-muted)]">{item.tiempo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benchmark */}
        <div className="pt-4 border-t border-[var(--border-default)]">
          <h3 className="text-sm font-medium mb-2"> Benchmark de Industria</h3>          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-verified-50 rounded-card">
              <p className="text-xs text-[var(--text-muted)]">Saludable</p>
              <p className="font-semibold text-verified">&lt; 15%</p>
              <p className="text-xs text-verified">Mayor cliente</p>
            </div>            
            <div className="p-3 bg-copper-50 rounded-card">
              <p className="text-xs text-[var(--text-muted)]">Atención</p>
              <p className="font-semibold text-copper">15-20%</p>
              <p className="text-xs text-copper">Mayor cliente</p>
            </div>            
            <div className="p-3 bg-breach-50 rounded-card">
              <p className="text-xs text-[var(--text-muted)]">Crítico</p>
              <p className="font-semibold text-breach">&gt; 20%</p>
              <p className="text-xs text-breach">Mayor cliente</p>
            </div>
          </div> </div>
      </div>
    </div>
  )
}
