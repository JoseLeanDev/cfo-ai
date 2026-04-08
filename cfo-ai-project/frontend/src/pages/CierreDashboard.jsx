import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  CalendarIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  LockClosedIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'

// Datos de ejemplo - últimos 12 meses
const mesesCierre = [
  { id: 1, mes: 'Abril', año: 2025, estado: 'abierto', fechaCierre: null, progreso: 0 },
  { id: 2, mes: 'Marzo', año: 2025, estado: 'cerrado', fechaCierre: '2025-04-05', progreso: 100 },
  { id: 3, mes: 'Febrero', año: 2025, estado: 'cerrado', fechaCierre: '2025-03-03', progreso: 100 },
  { id: 4, mes: 'Enero', año: 2025, estado: 'cerrado', fechaCierre: '2025-02-04', progreso: 100 },
  { id: 5, mes: 'Diciembre', año: 2024, estado: 'cerrado', fechaCierre: '2025-01-03', progreso: 100 },
  { id: 6, mes: 'Noviembre', año: 2024, estado: 'cerrado', fechaCierre: '2024-12-02', progreso: 100 },
  { id: 7, mes: 'Octubre', año: 2024, estado: 'cerrado', fechaCierre: '2024-11-04', progreso: 100 },
  { id: 8, mes: 'Septiembre', año: 2024, estado: 'cerrado', fechaCierre: '2024-10-03', progreso: 100 },
  { id: 9, mes: 'Agosto', año: 2024, estado: 'cerrado', fechaCierre: '2024-09-02', progreso: 100 },
  { id: 10, mes: 'Julio', año: 2024, estado: 'cerrado', fechaCierre: '2024-08-02', progreso: 100 },
  { id: 11, mes: 'Junio', año: 2024, estado: 'cerrado', fechaCierre: '2024-07-03', progreso: 100 },
  { id: 12, mes: 'Mayo', año: 2024, estado: 'cerrado', fechaCierre: '2024-06-03', progreso: 100 },
]

// Alertas activas
const alertasActivas = [
  { id: 1, tipo: 'warning', mensaje: 'Faltan 3 días para cierre de Abril 2025', fecha: '2025-04-10' },
  { id: 2, tipo: 'error', mensaje: 'Conciliación bancaria pendiente - Marzo', fecha: '2025-04-05' },
  { id: 3, tipo: 'info', mensaje: 'Nuevos asientos requieren aprobación', count: 12 },
]

// Datos comparativo
const comparativoData = {
  mesActual: { mes: 'Marzo', ventas: 2850000, gastos: 2100000, utilidad: 750000 },
  mesAnterior: { mes: 'Febrero', ventas: 2650000, gastos: 2050000, utilidad: 600000 },
}

// Componente de tarjeta de mes
const TarjetaMes = ({ data, onAction }) => {
  const estadosConfig = {
    abierto: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-700',
      label: 'ABIERTO',
      Icon: PlayCircleIcon,
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    'en proceso': {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-700',
      label: 'EN PROCESO',
      Icon: ClockIcon,
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    cerrado: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      textColor: 'text-slate-600',
      label: 'CERRADO',
      Icon: LockClosedIcon,
      btnClass: 'bg-slate-200 hover:bg-slate-300 text-slate-700'
    }
  }

  const config = estadosConfig[data.estado]
  const { Icon } = config

  return (
    <div className={`${config.bg} ${config.border} rounded-xl p-4 border transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center`}>
          <CalendarIcon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bg} ${config.textColor} border ${config.border}`}>
          {config.label}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        {data.mes} {data.año}
      </h3>
      
      {data.estado === 'cerrado' ? (
        <p className="text-xs text-slate-500 mb-3">
          Cerrado: {data.fechaCierre}
        </p>
      ) : data.estado === 'en proceso' ? (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Progreso</span>
            <span className="font-medium text-amber-600">{data.progreso}%</span>
          </div>
          <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${data.progreso}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-emerald-600 mb-3">
          Listo para iniciar cierre
        </p>
      )}
      
      <button 
        onClick={() => onAction(data)}
        className={`w-full py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${config.btnClass}`}
      >
        {data.estado === 'cerrado' ? (
          <>
            <DocumentTextIcon className="w-4 h-4" />
            Ver Reporte
          </>
        ) : data.estado === 'en proceso' ? (
          <>
            <ClockIcon className="w-4 h-4" />
            Continuar
          </>
        ) : (
          <>
            <PlayCircleIcon className="w-4 h-4" />
            Iniciar Cierre
          </>
        )}
      </button>
    </div>
  )
}

// Componente de alerta
const AlertaCard = ({ alerta }) => {
  const config = {
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: 'text-rose-500',
      text: 'text-rose-800'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      text: 'text-amber-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      text: 'text-blue-800'
    }
  }

  const { bg, border, icon, text } = config[alerta.tipo]

  return (
    <div className={`${bg} ${border} border rounded-lg p-3 flex items-center gap-3`}>
      <ExclamationTriangleIcon className={`w-5 h-5 ${icon} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${text} truncate`}>
          {alerta.mensaje}
        </p>
        {alerta.fecha && (
          <p className="text-xs text-slate-500">{alerta.fecha}</p>
        )}
      </div>
      {alerta.count && (
        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-700">
          {alerta.count}
        </span>
      )}
    </div>
  )
}

// Formatear moneda GTQ
const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q0'
  return 'Q' + value.toLocaleString('es-GT')
}

export default function CierreDashboard() {
  const navigate = useNavigate()
  const [meses, setMeses] = useState(mesesCierre)
  const [alertas, setAlertas] = useState(alertasActivas)

  const handleAction = (mesData) => {
    if (mesData.estado === 'cerrado') {
      // Ver reporte del cierre
      navigate(`/contabilidad/cierre/${mesData.año}/${String(meses.indexOf(mesData) + 1).padStart(2, '0')}`)
    } else {
      // Iniciar o continuar cierre
      navigate(`/contabilidad/cierre/${mesData.año}/${String(meses.indexOf(mesData) + 1).padStart(2, '0')}`)
    }
  }

  const handleNuevoCierre = () => {
    // Buscar el primer mes abierto o crear nuevo
    const mesAbierto = meses.find(m => m.estado === 'abierto')
    if (mesAbierto) {
      navigate(`/contabilidad/cierre/${mesAbierto.año}/${String(mesAbierto.id).padStart(2, '0')}`)
    }
  }

  // Calcular variaciones
  const varVentas = ((comparativoData.mesActual.ventas - comparativoData.mesAnterior.ventas) / comparativoData.mesAnterior.ventas * 100).toFixed(1)
  const varGastos = ((comparativoData.mesActual.gastos - comparativoData.mesAnterior.gastos) / comparativoData.mesAnterior.gastos * 100).toFixed(1)
  const varUtilidad = ((comparativoData.mesActual.utilidad - comparativoData.mesAnterior.utilidad) / comparativoData.mesAnterior.utilidad * 100).toFixed(1)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cierre Mensual</h1>
          <p className="text-sm text-slate-500">
            Gestión de períodos contables y reportes de cierre
          </p>
        </div>
        
        <button 
          onClick={handleNuevoCierre}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Cierre
        </button>
      </div>

      {/* Alertas Activas */}
      {alertas.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationCircleIcon className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Alertas Activas</h2>
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
              {alertas.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alertas.map(alerta => (
              <AlertaCard key={alerta.id} alerta={alerta} />
            ))}
          </div>
        </div>
      )}

      {/* Grid de Meses */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Períodos Contables</h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Abierto
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              En Proceso
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <span className="w-2 h-2 bg-slate-400 rounded-full" />
              Cerrado
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {meses.map(mes => (
            <TarjetaMes 
              key={mes.id} 
              data={mes} 
              onAction={handleAction}
            />
          ))}
        </div>
      </div>

      {/* Comparativo Rápido */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Comparativo Rápido</h2>
            <p className="text-sm text-slate-500">
              {comparativoData.mesActual.mes} vs {comparativoData.mesAnterior.mes}
            </p>
          </div>
          <Link 
            to="/reportes/comparativos"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            Ver detalle
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ventas */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Ventas</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatGTQ(comparativoData.mesActual.ventas)}
                </p>
                <p className="text-xs text-slate-400">
                  vs {formatGTQ(comparativoData.mesAnterior.ventas)}
                </p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                parseFloat(varVentas) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {parseFloat(varVentas) >= 0 ? (
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3" />
                )}
                {parseFloat(varVentas) > 0 ? '+' : ''}{varVentas}%
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Gastos</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatGTQ(comparativoData.mesActual.gastos)}
                </p>
                <p className="text-xs text-slate-400">
                  vs {formatGTQ(comparativoData.mesAnterior.gastos)}
                </p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                parseFloat(varGastos) <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {parseFloat(varGastos) <= 0 ? (
                  <ArrowTrendingDownIcon className="w-3 h-3" />
                ) : (
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                )}
                {parseFloat(varGastos) > 0 ? '+' : ''}{varGastos}%
              </div>
            </div>
          </div>

          {/* Utilidad */}
          <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
            <p className="text-sm text-primary-700 mb-1">Utilidad Neta</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-primary-700">
                  {formatGTQ(comparativoData.mesActual.utilidad)}
                </p>
                <p className="text-xs text-primary-500">
                  vs {formatGTQ(comparativoData.mesAnterior.utilidad)}
                </p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                parseFloat(varUtilidad) >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}>
                {parseFloat(varUtilidad) >= 0 ? (
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3" />
                )}
                {parseFloat(varUtilidad) > 0 ? '+' : ''}{varUtilidad}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}