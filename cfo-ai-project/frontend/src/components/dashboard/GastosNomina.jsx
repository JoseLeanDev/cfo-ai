import { useState } from 'react'
import {
  ReceiptPercentIcon,
  UsersIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  TruckIcon,
  WrenchIcon,
  LightBulbIcon,
  ArrowPathIcon,
  ChartBarIcon,
  PercentBadgeIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'

// Format currency GTQ
const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

// ========== DATOS DE EJEMPLO - GASTOS ==========
const gastosData = [
  { id: 1, categoria: 'Costos de Ventas', subcategoria: 'Materia Prima', monto: 2850000, presupuesto: 2800000, mesAnterior: 2700000, tendencia: 'up', frecuencia: 'Mensual', criticidad: 'alta' },
  { id: 2, categoria: 'Costos de Ventas', subcategoria: 'Mano de Obra Directa', monto: 980000, presupuesto: 950000, mesAnterior: 920000, tendencia: 'up', frecuencia: 'Mensual', criticidad: 'media' },
  { id: 3, categoria: 'Gastos Operativos', subcategoria: 'Alquiler Local', monto: 450000, presupuesto: 450000, mesAnterior: 450000, tendencia: 'stable', frecuencia: 'Mensual', criticidad: 'baja' },
  { id: 4, categoria: 'Gastos Operativos', subcategoria: 'Servicios Públicos', monto: 185000, presupuesto: 160000, mesAnterior: 170000, tendencia: 'up', frecuencia: 'Mensual', criticidad: 'media' },
  { id: 5, categoria: 'Gastos Operativos', subcategoria: 'Transporte y Logística', monto: 320000, presupuesto: 300000, mesAnterior: 280000, tendencia: 'up', frecuencia: 'Mensual', criticidad: 'media' },
  { id: 6, categoria: 'Gastos Administrativos', subcategoria: 'Salarios Administrativos', monto: 680000, presupuesto: 680000, mesAnterior: 680000, tendencia: 'stable', frecuencia: 'Mensual', criticidad: 'baja' },
  { id: 7, categoria: 'Gastos Administrativos', subcategoria: 'Servicios Profesionales', monto: 145000, presupuesto: 120000, mesAnterior: 135000, tendencia: 'up', frecuencia: 'Mensual', criticidad: 'media' },
  { id: 8, categoria: 'Gastos Administrativos', subcategoria: 'Seguros', monto: 95000, presupuesto: 95000, mesAnterior: 95000, tendencia: 'stable', frecuencia: 'Mensual', criticidad: 'baja' },
  { id: 9, categoria: 'Gastos de Ventas', subcategoria: 'Publicidad y Marketing', monto: 210000, presupuesto: 200000, mesAnterior: 180000, tendencia: 'up', frecuencia: 'Mensual', criticidad: 'media' },
  { id: 10, categoria: 'Gastos de Ventas', subcategoria: 'Comisiones', monto: 175000, presupuesto: 150000, mesAnterior: 160000, tendencia: 'up', frecuencia: 'Mensual', criticidad: 'media' },
  { id: 11, categoria: 'Gastos Financieros', subcategoria: 'Intereses Bancarios', monto: 125000, presupuesto: 120000, mesAnterior: 120000, tendencia: 'stable', frecuencia: 'Mensual', criticidad: 'alta' },
  { id: 12, categoria: 'Gastos Financieros', subcategoria: 'Comisiones Bancarias', monto: 45000, presupuesto: 40000, mesAnterior: 42000, tendencia: 'stable', frecuencia: 'Mensual', criticidad: 'baja' },
]

const gastosHistoricos = [
  { mes: 'Ene', gastos: 4850000, presupuesto: 4800000 },
  { mes: 'Feb', gastos: 4920000, presupuesto: 4800000 },
  { mes: 'Mar', gastos: 5100000, presupuesto: 4900000 },
  { mes: 'Abr', gastos: 5250000, presupuesto: 5000000 },
  { mes: 'May', gastos: 5180000, presupuesto: 5000000 },
  { mes: 'Jun', gastos: 5350000, presupuesto: 5100000 },
  { mes: 'Jul', gastos: 5420000, presupuesto: 5200000 },
  { mes: 'Ago', gastos: 5580000, presupuesto: 5300000 },
  { mes: 'Sep', gastos: 5620000, presupuesto: 5300000 },
  { mes: 'Oct', gastos: 5780000, presupuesto: 5400000 },
  { mes: 'Nov', gastos: 5920000, presupuesto: 5500000 },
  { mes: 'Dic', gastos: 6085000, presupuesto: 5600000 },
]

// ========== DATOS DE EJEMPLO - NÓMINA ==========
const empleadosData = [
  { id: 1, nombre: 'Carlos Méndez', cargo: 'Gerente General', departamento: 'Administración', salario: 28000, bonificacion: 5000, bono14: 28000, aguinaldo: 28000, igss: 3360, irtra: 280, cuotaPatronal: 7280, totalCosto: 71860, antiguedad: '8 años' },
  { id: 2, nombre: 'Ana López', cargo: 'Gerente de Ventas', departamento: 'Ventas', salario: 22000, bonificacion: 4000, bono14: 22000, aguinaldo: 22000, igss: 2640, irtra: 220, cuotaPatronal: 5720, totalCosto: 56580, antiguedad: '6 años' },
  { id: 3, nombre: 'Luis Hernández', cargo: 'Contador', departamento: 'Contabilidad', salario: 18000, bonificacion: 2500, bono14: 18000, aguinaldo: 18000, igss: 2160, irtra: 180, cuotaPatronal: 4680, totalCosto: 46120, antiguedad: '5 años' },
  { id: 4, nombre: 'María Castillo', cargo: 'Analista Financiero', departamento: 'Finanzas', salario: 16000, bonificacion: 2000, bono14: 16000, aguinaldo: 16000, igss: 1920, irtra: 160, cuotaPatronal: 4160, totalCosto: 41040, antiguedad: '3 años' },
  { id: 5, nombre: 'Pedro Ruiz', cargo: 'Jefe de Almacén', departamento: 'Operaciones', salario: 15000, bonificacion: 2000, bono14: 15000, aguinaldo: 15000, igss: 1800, irtra: 150, cuotaPatronal: 3900, totalCosto: 38450, antiguedad: '7 años' },
  { id: 6, nombre: 'Sofía Reyes', cargo: 'Vendedora', departamento: 'Ventas', salario: 8500, bonificacion: 1500, bono14: 8500, aguinaldo: 8500, igss: 1020, irtra: 85, cuotaPatronal: 2210, totalCosto: 21815, antiguedad: '2 años' },
  { id: 7, nombre: 'Jorge Castañeda', cargo: 'Vendedor', departamento: 'Ventas', salario: 8500, bonificacion: 1500, bono14: 8500, aguinaldo: 8500, igss: 1020, irtra: 85, cuotaPatronal: 2210, totalCosto: 21815, antiguedad: '1 año' },
  { id: 8, nombre: 'Diana Flores', cargo: 'Asistente Administrativa', departamento: 'Administración', salario: 7500, bonificacion: 1000, bono14: 7500, aguinaldo: 7500, igss: 900, irtra: 75, cuotaPatronal: 1950, totalCosto: 19250, antiguedad: '4 años' },
  { id: 9, nombre: 'Roberto Díaz', cargo: 'Operario', departamento: 'Operaciones', salario: 5500, bonificacion: 800, bono14: 5500, aguinaldo: 5500, igss: 660, irtra: 55, cuotaPatronal: 1430, totalCosto: 14045, antiguedad: '3 años' },
  { id: 10, nombre: 'Carmen Soto', cargo: 'Operaria', departamento: 'Operaciones', salario: 5500, bonificacion: 800, bono14: 5500, aguinaldo: 5500, igss: 660, irtra: 55, cuotaPatronal: 1430, totalCosto: 14045, antiguedad: '2 años' },
  { id: 11, nombre: 'Miguel Ángel Pérez', cargo: 'Conductor / Repartidor', departamento: 'Logística', salario: 6500, bonificacion: 1000, bono14: 6500, aguinaldo: 6500, igss: 780, irtra: 65, cuotaPatronal: 1690, totalCosto: 16635, antiguedad: '5 años' },
  { id: 12, nombre: 'Laura Jiménez', cargo: 'Recepcionista', departamento: 'Administración', salario: 5500, bonificacion: 600, bono14: 5500, aguinaldo: 5500, igss: 660, irtra: 55, cuotaPatronal: 1430, totalCosto: 13845, antiguedad: '1 año' },
]

const departamentosData = [
  { nombre: 'Administración', empleados: 3, salarios: 41000, cargas: 11830, total: 104970, pctTotal: 16.5 },
  { nombre: 'Ventas', empleados: 3, salarios: 39000, cargas: 11310, total: 100230, pctTotal: 15.8 },
  { nombre: 'Contabilidad', empleados: 1, salarios: 18000, cargas: 5220, total: 46120, pctTotal: 7.3 },
  { nombre: 'Finanzas', empleados: 1, salarios: 16000, cargas: 4640, total: 41040, pctTotal: 6.5 },
  { nombre: 'Operaciones', empleados: 3, salarios: 26000, cargas: 7530, total: 66540, pctTotal: 10.5 },
  { nombre: 'Logística', empleados: 1, salarios: 6500, cargas: 1885, total: 16635, pctTotal: 2.6 },
]

const insightsGastos = [
  {
    tipo: 'alerta',
    titulo: 'Gastos 8.7% sobre presupuesto este mes',
    descripcion: 'Se han gastado Q6.08M vs Q5.6M presupuestados. Principal desviación: Materia Prima (+Q50K) y Servicios Públicos (+Q25K).',
    icono: ExclamationTriangleIcon
  },
  {
    tipo: 'oportunidad',
    titulo: 'Transporte y Logística creció 14% consecutivo',
    descripcion: 'Los gastos de logística subieron de Q280K a Q320K en 2 meses. Evaluar renegociar contrato con transportista o analizar rutas.',
    icono: TruckIcon
  },
  {
    tipo: 'insight',
    titulo: 'Costo por empleado: Q52,700/mes promedio',
    descripcion: 'Incluyendo salario, bonificaciones y cargas sociales. 12 empleados generan costo total mensual de Q632,400.',
    icono: CalculatorIcon
  },
  {
    tipo: 'alerta',
    titulo: 'Intereses bancarios consumen 2.1% de ingresos',
    descripcion: 'Q125K mensuales en intereses. Considerar refinanciación de deuda o negociar tasas con banco actual.',
    icono: BanknotesIcon
  }
]

export default function GastosNomina() {
  const [activeTab, setActiveTab] = useState('gastos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [mostrarDetalleNomina, setMostrarDetalleNomina] = useState(false)

  // Totales
  const totalGastosMes = gastosData.reduce((sum, g) => sum + g.monto, 0)
  const totalPresupuestoMes = gastosData.reduce((sum, g) => sum + g.presupuesto, 0)
  const totalMesAnterior = gastosData.reduce((sum, g) => sum + g.mesAnterior, 0)
  const variacionGastos = ((totalGastosMes - totalMesAnterior) / totalMesAnterior * 100).toFixed(1)
  const desviacionPresupuesto = ((totalGastosMes - totalPresupuestoMes) / totalPresupuestoMes * 100).toFixed(1)

  const totalNominaMensual = empleadosData.reduce((sum, e) => sum + e.salario, 0)
  const totalCargasSociales = empleadosData.reduce((sum, e) => sum + e.igss + e.irtra + e.cuotaPatronal, 0)
  const totalBonificaciones = empleadosData.reduce((sum, e) => sum + e.bonificacion, 0)
  const totalCostoEmpleados = empleadosData.reduce((sum, e) => sum + e.totalCosto, 0)
  const costoPromedioPorEmpleado = Math.round(totalCostoEmpleados / empleadosData.length)

  // Filtrar gastos
  const gastosFiltrados = filtroCategoria === 'todas'
    ? gastosData
    : gastosData.filter(g => g.categoria === filtroCategoria)

  // Filtrar empleados
  const empleadosFiltrados = filtroDepartamento === 'todos'
    ? empleadosData
    : empleadosData.filter(e => e.departamento === filtroDepartamento)

  const getInsightStyles = (tipo) => {
    switch (tipo) {
      case 'oportunidad': return 'border-l-[var(--success)] bg-[var(--success-bg)]'
      case 'alerta': return 'border-l-[var(--warning)] bg-[var(--warning-bg)]'
      case 'insight': return 'border-l-[var(--accent-blue)] bg-[var(--info-bg)]'
      default: return 'border-l-[var(--accent-blue)] bg-[var(--info-bg)]'
    }
  }

  const tabs = [
    { id: 'gastos', label: 'Gastos Operativos', icon: ReceiptPercentIcon },
    { id: 'nomina', label: 'Nómina y Personal', icon: UsersIcon },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Gastos del Mes</span>
            <ReceiptPercentIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatGTQ(totalGastosMes)}</div>
          <span className={`text-xs ${Number(variacionGastos) > 5 ? 'text-[var(--danger)]' : Number(variacionGastos) > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
            {Number(variacionGastos) > 0 ? '↑' : '↓'} {Math.abs(variacionGastos)}% vs mes ant.
          </span>
        </div>
        
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Desv. Presupuesto</span>
            <PercentBadgeIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className={`kpi-value ${Number(desviacionPresupuesto) > 5 ? 'text-[var(--danger)]' : Number(desviacionPresupuesto) > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
            {desviacionPresupuesto > 0 ? '+' : ''}{desviacionPresupuesto}%
          </div>
          <span className="text-xs text-[var(--text-muted)]">Meta: {formatGTQ(totalPresupuestoMes)}</span>
        </div>
        
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Costo Nómina</span>
            <UsersIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatGTQ(totalNominaMensual)}</div>
          <span className="text-xs text-[var(--text-muted)]">{empleadosData.length} empleados</span>
        </div>
        
        <div className="kpi-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="kpi-label">Cargas Sociales</span>
            <BanknotesIcon className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="kpi-value">{formatGTQ(totalCargasSociales)}</div>
          <span className="text-xs text-[var(--text-muted)]">
            {((totalCargasSociales / totalNominaMensual) * 100).toFixed(1)}% sobre salarios
          </span>
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <div className="section-header">
          <SparklesIcon className="w-5 h-5 text-[var(--accent-blue)]" />
          <h2 className="font-semibold">Insights de Gastos y Nómina</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-5 pt-0">
          {insightsGastos.map((insight, idx) => {
            const Icon = insight.icono
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${getInsightStyles(insight.tipo)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[var(--text-primary)] text-sm">{insight.titulo}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{insight.descripcion}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-[var(--text-muted)]" />
            {activeTab === 'gastos' && (
              <select 
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="input text-xs py-1.5 w-auto"
              >
                <option value="todas">Todas las categorías</option>
                <option value="Costos de Ventas">Costos de Ventas</option>
                <option value="Gastos Operativos">Gastos Operativos</option>
                <option value="Gastos Administrativos">Gastos Administrativos</option>
                <option value="Gastos de Ventas">Gastos de Ventas</option>
                <option value="Gastos Financieros">Gastos Financieros</option>
              </select>
            )}
            {activeTab === 'nomina' && (
              <select 
                value={filtroDepartamento}
                onChange={(e) => setFiltroDepartamento(e.target.value)}
                className="input text-xs py-1.5 w-auto"
              >
                <option value="todos">Todos los departamentos</option>
                <option value="Administración">Administración</option>
                <option value="Ventas">Ventas</option>
                <option value="Contabilidad">Contabilidad</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Logística">Logística</option>
              </select>
            )}
          </div>
        </div>

        {/* ========== TAB: GASTOS ========== */}
        {activeTab === 'gastos' && (
          <div className="p-5 space-y-6">
            {/* Evolución histórica */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-[var(--text-muted)]" />
                Evolución Mensual: Gastos vs Presupuesto
              </h3>
              <div className="flex items-end gap-1 h-40 px-2">
                {gastosHistoricos.map((h, idx) => {
                  const maxGasto = Math.max(...gastosHistoricos.map(g => g.gastos))
                  const alturaGasto = (h.gastos / maxGasto) * 100
                  const alturaPresupuesto = (h.presupuesto / maxGasto) * 100
                  const sobrePresupuesto = h.gastos > h.presupuesto
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center relative" style={{ height: '128px' }}>
                        {/* Presupuesto (línea) */}
                        <div 
                          className="absolute w-full border-t-2 border-dashed border-[var(--text-muted)]/40"
                          style={{ bottom: `${alturaPresupuesto}%` }}
                        />
                        {/* Gasto (barra) */}
                        <div 
                          className={`w-full rounded-t transition-all ${sobrePresupuesto ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`}
                          style={{ height: `${alturaGasto}%`, marginTop: 'auto' }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">{h.mes}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[var(--success)]"></div>
                  <span>Dentro presupuesto</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[var(--warning)]"></div>
                  <span>Sobre presupuesto</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 border-t-2 border-dashed border-[var(--text-muted)]/40"></div>
                  <span>Presupuesto</span>
                </div>
              </div>
            </div>

            {/* Tabla de gastos detallados */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Subcategoría</th>
                    <th className="text-right">Monto</th>
                    <th className="text-right">Presupuesto</th>
                    <th className="text-right">Desv.</th>
                    <th className="text-right">Mes Ant.</th>
                    <th className="text-center">Tend.</th>
                    <th className="text-center">Alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosFiltrados.map((gasto) => {
                    const desviacion = ((gasto.monto - gasto.presupuesto) / gasto.presupuesto * 100).toFixed(1)
                    const variacionMes = ((gasto.monto - gasto.mesAnterior) / gasto.mesAnterior * 100).toFixed(1)
                    const esSobrePresupuesto = gasto.monto > gasto.presupuesto
                    return (
                      <tr key={gasto.id}>
                        <td>
                          <span className={`badge text-[10px] ${
                            gasto.categoria === 'Costos de Ventas' ? 'badge-info' :
                            gasto.categoria === 'Gastos Operativos' ? 'badge-neutral' :
                            gasto.categoria === 'Gastos Administrativos' ? 'badge-warning' :
                            gasto.categoria === 'Gastos de Ventas' ? 'badge-success' :
                            'badge-neutral'
                          }`}>
                            {gasto.categoria}
                          </span>
                        </td>
                        <td>
                          <p className="text-sm font-medium">{gasto.subcategoria}</p>
                        </td>
                        <td className="text-right font-mono font-medium">{formatGTQ(gasto.monto)}</td>
                        <td className="text-right font-mono text-sm">{formatGTQ(gasto.presupuesto)}</td>
                        <td className="text-right">
                          <span className={`text-xs font-mono ${esSobrePresupuesto ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                            {esSobrePresupuesto ? '+' : ''}{desviacion}%
                          </span>
                        </td>
                        <td className="text-right font-mono text-sm">{formatGTQ(gasto.mesAnterior)}</td>
                        <td className="text-center">
                          {gasto.tendencia === 'up' ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-[var(--danger)] mx-auto" />
                          ) : gasto.tendencia === 'down' ? (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-[var(--success)] mx-auto" />
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">→</span>
                          )}
                        </td>
                        <td className="text-center">
                          {gasto.criticidad === 'alta' || esSobrePresupuesto ? (
                            <span className="badge-danger text-[10px]">⚠️</span>
                          ) : gasto.criticidad === 'media' ? (
                            <span className="badge-warning text-[10px]">!</span>
                          ) : (
                            <span className="text-xs text-[var(--success)]">✓</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-[var(--bg-secondary)]">
                    <td colSpan="2" className="text-sm">TOTALES</td>
                    <td className="text-right font-mono">{formatGTQ(totalGastosMes)}</td>
                    <td className="text-right font-mono">{formatGTQ(totalPresupuestoMes)}</td>
                    <td className="text-right">
                      <span className={`text-xs font-mono ${Number(desviacionPresupuesto) > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                        {desviacionPresupuesto > 0 ? '+' : ''}{desviacionPresupuesto}%
                      </span>
                    </td>
                    <td className="text-right font-mono">{formatGTQ(totalMesAnterior)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Resumen por categoría */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Distribución por Categoría</h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {['Costos de Ventas', 'Gastos Operativos', 'Gastos Administrativos', 'Gastos de Ventas', 'Gastos Financieros'].map(cat => {
                  const gastosCat = gastosData.filter(g => g.categoria === cat)
                  const totalCat = gastosCat.reduce((sum, g) => sum + g.monto, 0)
                  const pctTotal = ((totalCat / totalGastosMes) * 100).toFixed(1)
                  return (
                    <div key={cat} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                      <p className="text-xs text-[var(--text-muted)] uppercase font-medium truncate">{cat}</p>
                      <p className="text-lg font-bold mt-1">{formatGTQ(totalCat)}</p>
                      <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${pctTotal}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{pctTotal}% del total</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB: NÓMINA ========== */}
        {activeTab === 'nomina' && (
          <div className="p-5 space-y-6">
            {/* Resumen por departamento */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4 text-[var(--text-muted)]" />
                Costo por Departamento
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {departamentosData.map((dept) => (
                  <div key={dept.nombre} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--text-muted)] uppercase font-medium">{dept.nombre}</p>
                      <span className="text-[10px] badge-neutral">{dept.empleados} emp.</span>
                    </div>
                    <p className="text-lg font-bold mt-1">{formatGTQ(dept.total)}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Salarios: {formatGTQ(dept.salarios)}</span>
                      <span className="text-[var(--text-muted)]">{dept.pctTotal}%</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-white rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black rounded-full"
                        style={{ width: `${dept.pctTotal * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggle detalle */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-[var(--text-muted)]" />
                Detalle por Empleado
              </h3>
              <button
                onClick={() => setMostrarDetalleNomina(!mostrarDetalleNomina)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                {mostrarDetalleNomina ? 'Ocultar cargas' : 'Ver cargas completas'}
              </button>
            </div>

            {/* Tabla empleados */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Empleado</th>
                    <th>Cargo</th>
                    <th>Depto.</th>
                    <th className="text-right">Salario</th>
                    <th className="text-right">Bonif.</th>
                    {mostrarDetalleNomina && (
                      <>
                        <th className="text-right">IGSS</th>
                        <th className="text-right">IRTRA</th>
                        <th className="text-right">Cuota Pat.</th>
                      </>
                    )}
                    <th className="text-right font-semibold">Costo Total</th>
                    <th className="text-center">Antig.</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosFiltrados.map((emp, idx) => (
                    <tr key={emp.id}>
                      <td><span className="text-xs text-[var(--text-muted)]">{idx + 1}</span></td>
                      <td>
                        <p className="text-sm font-medium">{emp.nombre}</p>
                      </td>
                      <td>
                        <span className="text-xs text-[var(--text-muted)]">{emp.cargo}</span>
                      </td>
                      <td>
                        <span className="badge-neutral text-[10px]">{emp.departamento}</span>
                      </td>
                      <td className="text-right font-mono">{formatGTQ(emp.salario)}</td>
                      <td className="text-right font-mono text-sm">{formatGTQ(emp.bonificacion)}</td>
                      {mostrarDetalleNomina && (
                        <>
                          <td className="text-right font-mono text-sm text-[var(--text-muted)]">{formatGTQ(emp.igss)}</td>
                          <td className="text-right font-mono text-sm text-[var(--text-muted)]">{formatGTQ(emp.irtra)}</td>
                          <td className="text-right font-mono text-sm text-[var(--text-muted)]">{formatGTQ(emp.cuotaPatronal)}</td>
                        </>
                      )}
                      <td className="text-right font-mono font-medium">{formatGTQ(emp.totalCosto)}</td>
                      <td className="text-center">
                        <span className="text-xs text-[var(--text-muted)]">{emp.antiguedad}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-[var(--bg-secondary)]">
                    <td colSpan={mostrarDetalleNomina ? 4 : 4}>TOTALES</td>
                    <td className="text-right font-mono">{formatGTQ(totalNominaMensual)}</td>
                    <td className="text-right font-mono">{formatGTQ(totalBonificaciones)}</td>
                    {mostrarDetalleNomina && (
                      <>
                        <td className="text-right font-mono">{formatGTQ(empleadosFiltrados.reduce((sum, e) => sum + e.igss, 0))}</td>
                        <td className="text-right font-mono">{formatGTQ(empleadosFiltrados.reduce((sum, e) => sum + e.irtra, 0))}</td>
                        <td className="text-right font-mono">{formatGTQ(empleadosFiltrados.reduce((sum, e) => sum + e.cuotaPatronal, 0))}</td>
                      </>
                    )}
                    <td className="text-right font-mono">{formatGTQ(empleadosFiltrados.reduce((sum, e) => sum + e.totalCosto, 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Resumen anual nómina */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)] uppercase font-medium">Costo Anual Nómina</p>
                <p className="text-xl font-bold mt-1">{formatGTQ(totalCostoEmpleados * 12)}</p>
                <p className="text-xs text-[var(--text-muted)]">Incluye aguinaldo y bono 14</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)] uppercase font-medium">Costo Promedio / Empleado</p>
                <p className="text-xl font-bold mt-1">{formatGTQ(costoPromedioPorEmpleado)}/mes</p>
                <p className="text-xs text-[var(--text-muted)]">Salario + cargas + beneficios</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)] uppercase font-medium">% Cargas Sociales</p>
                <p className="text-xl font-bold mt-1">{((totalCargasSociales / totalNominaMensual) * 100).toFixed(1)}%</p>
                <p className="text-xs text-[var(--text-muted)]">IGSS + IRTRA + Cuota Patronal</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
