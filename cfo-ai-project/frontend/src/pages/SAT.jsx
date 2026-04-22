import { useState } from 'react'
import {
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CalculatorIcon,
  ReceiptPercentIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  BellAlertIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  DocumentMagnifyingGlassIcon,
  DocumentArrowDownIcon,
  CircleStackIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const formatGTQ = (value) => {
  if (!value && value !== 0) return 'Q 0'
  return 'Q ' + value.toLocaleString('es-GT')
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('es-GT', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// ─── CALENDARIO FISCAL HARD-CODEADO ──────────────────────────
const calendarioFiscal = [
  { fecha: '2026-04-30', obligacion: 'IVA Marzo 2026', formulario: 'SAT-2231', tipo: 'IVA', diasAlerta: [15, 7, 3], montoEstimado: 185000 },
  { fecha: '2026-04-15', obligacion: 'Retenciones IVA Marzo', formulario: 'SAT-1331', tipo: 'Retención', diasAlerta: [7, 3], montoEstimado: 45000 },
  { fecha: '2026-04-30', obligacion: 'IGSS/IRTRA/INTECAP Marzo', formulario: 'Planilla', tipo: 'Laboral', diasAlerta: [7, 3], montoEstimado: 320000 },
  { fecha: '2026-04-30', obligacion: 'ISR 1er Trimestre 2026', formulario: 'SAT-2221', tipo: 'ISR', diasAlerta: [15, 7, 3], montoEstimado: 525000 },
  { fecha: '2026-04-30', obligacion: 'ISO 1er Trimestre 2026', formulario: 'SAT-2293', tipo: 'ISO', diasAlerta: [15, 7, 3], montoEstimado: 85000 },
  { fecha: '2026-05-15', obligacion: 'Retenciones ISR Q1', formulario: 'SAT-2201', tipo: 'Retención', diasAlerta: [7, 3], montoEstimado: 78000 },
  { fecha: '2026-05-31', obligacion: 'IVA Abril 2026', formulario: 'SAT-2231', tipo: 'IVA', diasAlerta: [15, 7, 3], montoEstimado: 210000 },
  { fecha: '2026-06-30', obligacion: 'IVA Mayo 2026', formulario: 'SAT-2231', tipo: 'IVA', diasAlerta: [15, 7, 3], montoEstimado: 195000 },
  { fecha: '2026-06-30', obligacion: 'IGSS/IRTRA/INTECAP Mayo', formulario: 'Planilla', tipo: 'Laboral', diasAlerta: [7, 3], montoEstimado: 320000 },
  { fecha: '2026-07-31', obligacion: 'IVA Junio 2026', formulario: 'SAT-2231', tipo: 'IVA', diasAlerta: [15, 7, 3], montoEstimado: 230000 },
  { fecha: '2026-07-31', obligacion: 'ISR 2do Trimestre 2026', formulario: 'SAT-2221', tipo: 'ISR', diasAlerta: [15, 7, 3], montoEstimado: 612000 },
  { fecha: '2026-07-31', obligacion: 'ISO 2do Trimestre 2026', formulario: 'SAT-2293', tipo: 'ISO', diasAlerta: [15, 7, 3], montoEstimado: 92000 },
]

function calcularDiasVencimiento(fecha) {
  const hoy = new Date('2026-04-22')
  const venc = new Date(fecha)
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
  return diff
}

function getNivelVencimiento(dias) {
  if (dias < 0) return 'vencido'
  if (dias <= 3) return 'critical'
  if (dias <= 7) return 'warning'
  return 'info'
}

// ─── DATOS DE EJEMPLO: DTE / FACTURAS ──────────────────────
const facturasEmitidas = [
  { id: 'F001-0001', fecha: '2026-04-01', cliente: 'Comercial XYZ', nit: '12345678-9', monto: 45000, iva: 5400, estado: 'valida', tipo: 'FC' },
  { id: 'F001-0002', fecha: '2026-04-03', cliente: 'Industrias ABC', nit: '98765432-1', monto: 125000, iva: 15000, estado: 'valida', tipo: 'FC' },
  { id: 'F001-0003', fecha: '2026-04-05', cliente: 'Servicios LMN', nit: 'INVALIDO', monto: 2800, iva: 336, estado: 'error_nit', tipo: 'FC' },
  { id: 'F001-0004', fecha: '2026-04-08', cliente: 'Constructora QRS', nit: '45678901-2', monto: 89000, iva: 10680, estado: 'valida', tipo: 'FC' },
  { id: 'F001-0005', fecha: '2026-04-10', cliente: 'Pequeño Contrib', nit: '11111111-1', monto: 3500, iva: 420, estado: 'advertencia_monto', tipo: 'FC' },
  { id: 'F001-0006', fecha: '2026-04-12', cliente: 'Exportadora UVW', nit: '22222222-2', monto: 180000, iva: 0, estado: 'valida', tipo: 'FPE' },
  { id: 'NC001-0001', fecha: '2026-04-15', cliente: 'Comercial XYZ', nit: '12345678-9', monto: -9000, iva: -1080, estado: 'valida', tipo: 'NC' },
]

const facturasRecibidas = [
  { id: 'A001-4521', fecha: '2026-04-02', proveedor: 'Proveedor Alfa', nit: '33333333-3', monto: 25000, iva: 3000, estado: 'valida', tipo: 'FC' },
  { id: 'A001-4522', fecha: '2026-04-04', proveedor: 'Servicios Beta', nit: '44444444-4', monto: 15000, iva: 1800, estado: 'valida', tipo: 'FC' },
  { id: 'A001-4523', fecha: '2026-04-06', proveedor: 'Materiales Gamma', nit: '55555555-5', monto: 68000, iva: 8160, estado: 'valida', tipo: 'FC' },
  { id: 'A001-4524', fecha: '2026-04-09', proveedor: 'Transporte Delta', nit: '66666666-6', monto: 8000, iva: 960, estado: 'valida', tipo: 'FC' },
  { id: 'A001-4525', fecha: '2026-04-11', proveedor: 'Asesorías Epsilon', nit: '77777777-7', monto: 12000, iva: 1440, estado: 'valida', tipo: 'FC' },
]

// ─── CÁLCULOS IVA ────────────────────────────────────────────
function calcularIVA() {
  const ventasTotal = facturasEmitidas.filter(f => f.estado === 'valida' && (f.tipo === 'FC' || f.tipo === 'FPE')).reduce((sum, f) => sum + f.monto, 0)
  const ventasIVA = facturasEmitidas.filter(f => f.estado === 'valida' && f.tipo === 'FC').reduce((sum, f) => sum + f.iva, 0)
  const comprasIVA = facturasRecibidas.filter(f => f.estado === 'valida').reduce((sum, f) => sum + f.iva, 0)
  const retenciones = 45000 // Retenciones recibidas (ejemplo)
  const ivaPagar = ventasIVA - comprasIVA - retenciones
  return { ventasTotal, ventasIVA, comprasIVA, retenciones, ivaPagar }
}

// ─── CÁLCULOS ISR ────────────────────────────────────────────
function calcularISR() {
  const ingresos = facturasEmitidas.filter(f => f.estado === 'valida').reduce((sum, f) => sum + f.monto, 0)
  const gastos = facturasRecibidas.filter(f => f.estado === 'valida').reduce((sum, f) => sum + f.monto, 0)
  const utilidad = ingresos - gastos
  const isrR25 = utilidad * 0.25
  const isrS5 = ingresos * 0.05
  const isrMenor = Math.min(isrR25, isrS5)
  const regimenRecomendado = isrR25 < isrS5 ? 'Sobre Utilidades (25%)' : 'Simplificado (5%)'
  return { ingresos, gastos, utilidad, isrR25, isrS5, isrMenor, regimenRecomendado }
}

// ─── CÁLCULOS ISO ────────────────────────────────────────────
function calcularISO() {
  const activos = 8500000 // Ejemplo: activos totales
  const ingresosAnuales = 5200000
  const isoActivos = activos * 0.01
  const isoIngresos = ingresosAnuales * 0.01
  const isoMayor = Math.max(isoActivos, isoIngresos)
  const { isrMenor } = calcularISR()
  const acreditamiento = Math.min(isoMayor, isrMenor)
  const isoNeto = isoMayor - acreditamiento
  return { isoMayor, acreditamiento, isoNeto, base: isoActivos > isoIngresos ? 'Activos' : 'Ingresos' }
}

// ─── RETENCIONES ─────────────────────────────────────────────
const retencionesData = [
  { tipo: 'IVA 15% a Especial', monto: 28000, acumulado: 112000, formulario: 'SAT-1331' },
  { tipo: 'IVA 5% a Pequeño >Q2,500', monto: 12000, acumulado: 48000, formulario: 'SAT-1331' },
  { tipo: 'ISR 5% a Pequeño >Q30,000', monto: 15000, acumulado: 60000, formulario: 'SAT-2201' },
  { tipo: 'ISR 7% a Especial', monto: 22000, acumulado: 88000, formulario: 'SAT-2201' },
]

export default function SAT() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filtroFacturas, setFiltroFacturas] = useState('todas')

  const iva = calcularIVA()
  const isr = calcularISR()
  const iso = calcularISO()
  const hoy = new Date('2026-04-22')

  const vencimientos = calendarioFiscal.map(v => {
    const dias = calcularDiasVencimiento(v.fecha)
    const nivel = getNivelVencimiento(dias)
    return { ...v, dias, nivel }
  }).sort((a, b) => a.dias - b.dias)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard SAT', icon: ShieldCheckIcon },
    { id: 'iva', label: 'IVA Mensual', icon: ReceiptPercentIcon },
    { id: 'libros', label: 'Libros Compras/Ventas', icon: BookOpenIcon },
    { id: 'isr', label: 'Estimación ISR', icon: CalculatorIcon },
    { id: 'iso', label: 'Cálculo ISO', icon: CircleStackIcon },
    { id: 'retenciones', label: 'Retenciones', icon: DocumentTextIcon },
    { id: 'facturas', label: 'Revisión DTEs', icon: DocumentMagnifyingGlassIcon },
    { id: 'calendario', label: 'Calendario Fiscal', icon: CalendarDaysIcon },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
            <BuildingLibraryIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Módulo SAT</h1>
            <p className="text-sm text-[var(--text-muted)]">Cálculos, libros, alertas y cumplimiento fiscal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-success text-xs flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            Conectado FEL
          </span>
          <span className="badge-warning text-xs flex items-center gap-1">
            <BellAlertIcon className="w-3 h-3" />
            {vencimientos.filter(v => v.dias <= 7 && v.dias >= 0).length} alertas
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-black text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── DASHBOARD ─────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">IVA a Pagar (Abr)</p>
              <p className={`text-xl font-bold tabular-nums ${iva.ivaPagar >= 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                {iva.ivaPagar >= 0 ? '-' : '+'} {formatGTQ(Math.abs(iva.ivaPagar))}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Vence: 30 Abr</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">ISR Trimestral Q1</p>
              <p className="text-xl font-bold text-[var(--danger)] tabular-nums">- {formatGTQ(isr.isrMenor)}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{isr.regimenRecomendado}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">ISO Q1 (acreditado)</p>
              <p className="text-xl font-bold text-[var(--danger)] tabular-nums">- {formatGTQ(iso.isoNeto)}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Base: {iso.base}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Retenciones Q1</p>
              <p className="text-xl font-bold tabular-nums">{formatGTQ(retencionesData.reduce((s, r) => s + r.acumulado, 0))}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">4 tipos registrados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vencimientos próximos */}
            <div className="lg:col-span-2 card">
              <div className="section-header">
                <ExclamationTriangleIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Próximos Vencimientos</h2>
              </div>
              <div className="p-5 pt-0 space-y-3">
                {vencimientos.filter(v => v.dias >= 0 && v.dias <= 30).slice(0, 5).map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    item.nivel === 'critical' ? 'bg-rose-50 border-rose-200' :
                    item.nivel === 'warning' ? 'bg-amber-50 border-amber-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                          item.nivel === 'critical' ? 'bg-rose-500 text-white' :
                          item.nivel === 'warning' ? 'bg-amber-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {item.dias === 0 ? '!' : item.dias}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.obligacion}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.formulario} • {formatDate(item.fecha)}</p>
                          <p className={`text-xs font-medium mt-0.5 ${
                            item.nivel === 'critical' ? 'text-rose-700' :
                            item.nivel === 'warning' ? 'text-amber-700' :
                            'text-blue-700'
                          }`}>
                            {item.dias === 0 ? '⚠️ Vence hoy' : `En ${item.dias} días`}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold tabular-nums">{formatGTQ(item.montoEstimado)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen DTE */}
            <div className="space-y-6">
              <div className="card">
                <div className="section-header">
                  <DocumentCheckIcon className="w-5 h-5 text-[var(--text-muted)]" />
                  <h2 className="font-semibold">Estado DTEs Abril</h2>
                </div>
                <div className="p-5 pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
                      <p className="text-2xl font-bold tabular-nums">{facturasEmitidas.length}</p>
                      <p className="text-xs text-[var(--text-muted)]">Emitidas</p>
                    </div>
                    <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
                      <p className="text-2xl font-bold text-[var(--danger)]">
                        {facturasEmitidas.filter(f => f.estado !== 'valida').length}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">Con problemas</p>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Certificado FEL activo</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">Vence: 2026-12-31</p>
                  </div>
                </div>
              </div>

              {/* Alertas rápidas */}
              <div className="card">
                <div className="section-header">
                  <InformationCircleIcon className="w-5 h-5 text-[var(--text-muted)]" />
                  <h2 className="font-semibold">Insights del Mes</h2>
                </div>
                <div className="p-5 pt-0 space-y-3">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">💡 Régimen ISR recomendado</p>
                    <p className="text-xs text-amber-700 mt-1">
                      {isr.regimenRecomendado} ahorra {formatGTQ(Math.abs(isr.isrR25 - isr.isrS5))} este período
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">📊 ISO acreditado al 100%</p>
                    <p className="text-xs text-blue-700 mt-1">
                      El ISR del período cubre completamente el ISO. Sin pago adicional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── IVA MENSUAL ───────────────────────────── */}
      {activeTab === 'iva' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="section-header">
                <ReceiptPercentIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Cálculo IVA Abril 2026</h2>
              </div>
              <div className="p-5 pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">Ventas gravadas (base)</span>
                    <span className="font-medium tabular-nums">{formatGTQ(iva.ventasTotal)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">Débito fiscal (12% ventas)</span>
                    <span className="font-medium text-[var(--danger)] tabular-nums">+ {formatGTQ(iva.ventasIVA)}</span>
                  </div>
                  <div className="border-t border-dashed border-[var(--border-default)] pt-2">
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-[var(--text-secondary)]">Crédito fiscal (compras)</span>
                      <span className="font-medium text-[var(--success)] tabular-nums">- {formatGTQ(iva.comprasIVA)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-[var(--text-secondary)]">Retenciones recibidas</span>
                      <span className="font-medium text-[var(--success)] tabular-nums">- {formatGTQ(iva.retenciones)}</span>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-default)] pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">IVA a Pagar</span>
                      <span className={`text-xl font-bold tabular-nums ${iva.ivaPagar >= 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                        {iva.ivaPagar >= 0 ? formatGTQ(iva.ivaPagar) : formatGTQ(Math.abs(iva.ivaPagar)) + ' a favor'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Vencimiento:</strong> 30 de abril de 2026
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Formulario SAT-2231. Este cálculo se actualiza automáticamente con cada factura FEL emitida/recibida.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-header">
                <BookOpenIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Detalle por Tipo de Documento</h2>
              </div>
              <div className="p-5 pt-0 space-y-3">
                {[
                  { tipo: 'Facturas (FC)', emitidas: facturasEmitidas.filter(f => f.tipo === 'FC').length, iva: facturasEmitidas.filter(f => f.tipo === 'FC').reduce((s, f) => s + f.iva, 0) },
                  { tipo: 'Facturas Pequeño (FPE)', emitidas: facturasEmitidas.filter(f => f.tipo === 'FPE').length, iva: facturasEmitidas.filter(f => f.tipo === 'FPE').reduce((s, f) => s + f.iva, 0) },
                  { tipo: 'Notas Crédito (NC)', emitidas: facturasEmitidas.filter(f => f.tipo === 'NC').length, iva: facturasEmitidas.filter(f => f.tipo === 'NC').reduce((s, f) => s + f.iva, 0) },
                  { tipo: 'Facturas Recibidas', emitidas: facturasRecibidas.length, iva: facturasRecibidas.reduce((s, f) => s + f.iva, 0) },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">{item.tipo}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{item.emitidas} docs</span>
                      <span className="text-sm text-[var(--text-muted)] ml-2 tabular-nums">IVA: {formatGTQ(item.iva)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIBROS COMPRAS/VENTAS ─────────────────── */}
      {activeTab === 'libros' && (
        <div className="space-y-6">
          <div className="flex gap-4 mb-4">
            <button className={`px-4 py-2 rounded-lg text-sm font-medium ${filtroFacturas === 'ventas' ? 'bg-black text-white' : 'bg-[var(--bg-secondary)]'}`} onClick={() => setFiltroFacturas('ventas')}>
              Libro Ventas
            </button>
            <button className={`px-4 py-2 rounded-lg text-sm font-medium ${filtroFacturas === 'compras' ? 'bg-black text-white' : 'bg-[var(--bg-secondary)]'}`} onClick={() => setFiltroFacturas('compras')}>
              Libro Compras
            </button>
            <button className={`px-4 py-2 rounded-lg text-sm font-medium ${filtroFacturas === 'todas' ? 'bg-black text-white' : 'bg-[var(--bg-secondary)]'}`} onClick={() => setFiltroFacturas('todas')}>
              Ambos
            </button>
          </div>

          {(filtroFacturas === 'ventas' || filtroFacturas === 'todas') && (
            <div className="card">
              <div className="section-header">
                <DocumentArrowDownIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Libro de Ventas — Abril 2026</h2>
                <span className="badge text-xs">{facturasEmitidas.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-secondary)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">DTE</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Cliente</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">NIT</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-muted)]">Monto</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-muted)]">IVA</th>
                      <th className="px-4 py-2 text-center font-medium text-[var(--text-muted)]">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasEmitidas.map((f, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-default)]">
                        <td className="px-4 py-3">{f.fecha}</td>
                        <td className="px-4 py-3 font-mono text-xs">{f.id}</td>
                        <td className="px-4 py-3">{f.cliente}</td>
                        <td className="px-4 py-3 font-mono text-xs">{f.nit}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(f.monto)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(f.iva)}</td>
                        <td className="px-4 py-3 text-center">
                          {f.estado === 'valida' ? (
                            <span className="badge-success text-xs">Válida</span>
                          ) : f.estado === 'error_nit' ? (
                            <span className="badge-danger text-xs">NIT inválido</span>
                          ) : (
                            <span className="badge-warning text-xs">Advertencia</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[var(--bg-secondary)] font-semibold">
                    <tr>
                      <td className="px-4 py-3" colSpan="4">TOTALES</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(facturasEmitidas.reduce((s, f) => s + f.monto, 0))}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(facturasEmitidas.reduce((s, f) => s + f.iva, 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {(filtroFacturas === 'compras' || filtroFacturas === 'todas') && (
            <div className="card">
              <div className="section-header">
                <DocumentArrowDownIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Libro de Compras — Abril 2026</h2>
                <span className="badge text-xs">{facturasRecibidas.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-secondary)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">DTE</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Proveedor</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">NIT</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-muted)]">Monto</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-muted)]">IVA (Crédito)</th>
                      <th className="px-4 py-2 text-center font-medium text-[var(--text-muted)]">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasRecibidas.map((f, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-default)]">
                        <td className="px-4 py-3">{f.fecha}</td>
                        <td className="px-4 py-3 font-mono text-xs">{f.id}</td>
                        <td className="px-4 py-3">{f.proveedor}</td>
                        <td className="px-4 py-3 font-mono text-xs">{f.nit}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(f.monto)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[var(--success)]">{formatGTQ(f.iva)}</td>
                        <td className="px-4 py-3 text-center"><span className="badge-success text-xs">Válida</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[var(--bg-secondary)] font-semibold">
                    <tr>
                      <td className="px-4 py-3" colSpan="4">TOTALES</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(facturasRecibidas.reduce((s, f) => s + f.monto, 0))}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--success)]">{formatGTQ(facturasRecibidas.reduce((s, f) => s + f.iva, 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ESTIMACIÓN ISR ────────────────────────── */}
      {activeTab === 'isr' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="section-header">
                <CalculatorIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Estimación ISR — 1er Trimestre 2026</h2>
              </div>
              <div className="p-5 pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">Ingresos gravados</span>
                    <span className="font-medium tabular-nums">{formatGTQ(isr.ingresos)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">Gastos deducibles</span>
                    <span className="font-medium text-[var(--success)] tabular-nums">- {formatGTQ(isr.gastos)}</span>
                  </div>
                  <div className="border-t border-[var(--border-default)] pt-2">
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">Utilidad neta estimada</span>
                      <span className="font-bold tabular-nums">{formatGTQ(isr.utilidad)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)]">
                  <p className="text-sm font-medium mb-3">Comparación de Régimenes</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">Sobre Utilidades (25%)</p>
                        <p className="text-xs text-[var(--text-muted)]">25% de la utilidad neta</p>
                      </div>
                      <span className={`font-bold tabular-nums ${isr.isrR25 < isr.isrS5 ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                        {formatGTQ(isr.isrR25)} {isr.isrR25 < isr.isrS5 && '✓'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">Simplificado (5%)</p>
                        <p className="text-xs text-[var(--text-muted)]">5% de los ingresos brutos</p>
                      </div>
                      <span className={`font-bold tabular-nums ${isr.isrS5 < isr.isrR25 ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                        {formatGTQ(isr.isrS5)} {isr.isrS5 < isr.isrR25 && '✓'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">ISR estimado a pagar</span>
                      <span className="text-xl font-bold text-[var(--danger)] tabular-nums">{formatGTQ(isr.isrMenor)}</span>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${isr.isrR25 < isr.isrS5 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <p className="text-sm font-medium">
                    💡 Recomendación: <strong>{isr.regimenRecomendado}</strong>
                  </p>
                  <p className="text-xs mt-1">
                    Ahorro estimado vs el otro régimen: {formatGTQ(Math.abs(isr.isrR25 - isr.isrS5))}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-header">
                <CalendarDaysIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Calendario ISR 2026</h2>
              </div>
              <div className="p-5 pt-0 space-y-3">
                {[
                  { periodo: '1er Trimestre', fecha: '30 Abr 2026', monto: isr.isrMenor, estado: 'pendiente' },
                  { periodo: '2do Trimestre', fecha: '31 Jul 2026', monto: 612000, estado: 'futuro' },
                  { periodo: '3er Trimestre', fecha: '31 Oct 2026', monto: 580000, estado: 'futuro' },
                  { periodo: '4to Trimestre', fecha: '31 Ene 2027', monto: 650000, estado: 'futuro' },
                  { periodo: 'ISR Anual', fecha: '31 Mar 2027', monto: 0, estado: 'futuro' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    item.estado === 'pendiente' ? 'bg-amber-50 border-amber-200' : 'bg-[var(--bg-secondary)] border-[var(--border-default)]'
                  }`}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.periodo}</p>
                        <p className="text-xs text-[var(--text-muted)]">Vence: {item.fecha}</p>
                      </div>
                      <span className="font-bold tabular-nums">{formatGTQ(item.monto)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CÁLCULO ISO ───────────────────────────── */}
      {activeTab === 'iso' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="section-header">
                <CircleStackIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Cálculo ISO — 1er Trimestre 2026</h2>
              </div>
              <div className="p-5 pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">Activos totales</span>
                    <span className="font-medium tabular-nums">{formatGTQ(8500000)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">ISO sobre activos (1%)</span>
                    <span className="font-medium tabular-nums">{formatGTQ(iso.isoMayor === 8500000 * 0.01 ? 85000 : 0)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">Ingresos anuales</span>
                    <span className="font-medium tabular-nums">{formatGTQ(5200000)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[var(--text-secondary)]">ISO sobre ingresos (1%)</span>
                    <span className="font-medium tabular-nums">{formatGTQ(iso.isoMayor === 5200000 * 0.01 ? 52000 : 0)}</span>
                  </div>
                  <div className="border-t border-[var(--border-default)] pt-2">
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">ISO mayor (base: {iso.base})</span>
                      <span className="font-bold tabular-nums">{formatGTQ(iso.isoMayor)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <p className="text-sm font-medium text-blue-800 mb-2">Acreditamiento contra ISR</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">ISR del período</span>
                      <span className="text-sm font-medium tabular-nums">{formatGTQ(isr.isrMenor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">ISO a acreditar (menor de ambos)</span>
                      <span className="text-sm font-medium text-[var(--success)] tabular-nums">- {formatGTQ(iso.acreditamiento)}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="flex justify-between">
                      <span className="font-semibold text-blue-800">ISO neto a pagar</span>
                      <span className="text-lg font-bold text-[var(--danger)] tabular-nums">{formatGTQ(iso.isoNeto)}</span>
                    </div>
                  </div>
                </div>

                {iso.isoNeto === 0 && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-800">
                      ✅ ISO cubierto al 100% por ISR
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      No hay pago adicional de ISO este período. Todo se acredita contra el ISR.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="section-header">
                <InformationCircleIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">¿Qué es el ISO?</h2>
              </div>
              <div className="p-5 pt-0 space-y-3 text-sm text-[var(--text-secondary)]">
                <p>
                  El <strong>Impuesto Sobre Organización (ISO)</strong> es un impuesto del 1% sobre el mayor de:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Activos totales de la empresa</li>
                  <li>Ingresos brutos anuales</li>
                </ul>
                <p>
                  Se puede <strong>acreditar</strong> contra el ISR del mismo período fiscal, 
                  pero no genera saldo a favor si el ISR es menor.
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-4">
                  Formulario SAT-2293 • Vence el último día hábil del mes siguiente al trimestre
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── RETENCIONES ───────────────────────────── */}
      {activeTab === 'retenciones' && (
        <div className="space-y-6">
          <div className="card">
            <div className="section-header">
              <DocumentTextIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Control de Retenciones — Q1 2026</h2>
            </div>
            <div className="p-5 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-secondary)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Tipo de Retención</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Formulario</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-muted)]">Monto Mes</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-muted)]">Acumulado Q1</th>
                      <th className="px-4 py-2 text-center font-medium text-[var(--text-muted)]">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retencionesData.map((r, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-default)]">
                        <td className="px-4 py-3">{r.tipo}</td>
                        <td className="px-4 py-3 font-mono text-xs">{r.formulario}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(r.monto)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{formatGTQ(r.acumulado)}</td>
                        <td className="px-4 py-3 text-center"><span className="badge-success text-xs">Registrada</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[var(--bg-secondary)] font-semibold">
                    <tr>
                      <td className="px-4 py-3" colSpan="3">TOTAL RETENCIONES Q1</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(retencionesData.reduce((s, r) => s + r.acumulado, 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="section-header">
                <ExclamationTriangleIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Reglas de Retención IVA</h2>
              </div>
              <div className="p-5 pt-0 space-y-3 text-sm">
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="font-medium">15% — Contribuyente Especial</p>
                  <p className="text-xs text-[var(--text-muted)]">Cuando compras a contribuyentes especiales (grandes empresas)</p>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="font-medium">5% — Pequeño Contribuyente</p>
                  <p className="text-xs text-[var(--text-muted)]">Cuando compras a pequeños contribuyentes y el monto excede Q2,500</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-header">
                <ClockIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="font-semibold">Vencimientos Retenciones</h2>
              </div>
              <div className="p-5 pt-0 space-y-3">
                {[
                  { tipo: 'IVA 15% / 5%', formulario: 'SAT-1331', vence: '15 de cada mes' },
                  { tipo: 'ISR 5% / 7%', formulario: 'SAT-2201', vence: '15 de cada mes' },
                ].map((r, idx) => (
                  <div key={idx} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="font-medium text-sm">{r.tipo}</p>
                    <p className="text-xs text-[var(--text-muted)]">{r.formulario} • {r.vence}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REVISIÓN DTEs ─────────────────────────── */}
      {activeTab === 'facturas' && (
        <div className="space-y-6">
          <div className="card">
            <div className="section-header">
              <DocumentMagnifyingGlassIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Detección de Problemas en DTEs</h2>
              <span className="badge-danger text-xs">{facturasEmitidas.filter(f => f.estado !== 'valida').length} problemas</span>
            </div>
            <div className="p-5 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-secondary)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Estado</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">DTE</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Cliente</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">NIT</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-muted)]">Monto</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Problema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasEmitidas.map((f, idx) => (
                      <tr key={idx} className={`border-b border-[var(--border-default)] ${f.estado !== 'valida' ? 'bg-rose-50' : ''}`}>
                        <td className="px-4 py-3">
                          {f.estado === 'valida' ? (
                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-rose-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{f.id}</td>
                        <td className="px-4 py-3">{f.fecha}</td>
                        <td className="px-4 py-3">{f.cliente}</td>
                        <td className="px-4 py-3 font-mono text-xs">{f.nit}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(f.monto)}</td>
                        <td className="px-4 py-3">
                          {f.estado === 'valida' ? (
                            <span className="text-xs text-emerald-600">Sin problemas</span>
                          ) : f.estado === 'error_nit' ? (
                            <span className="badge-danger text-xs">NIT inválido</span>
                          ) : f.estado === 'advertencia_monto' ? (
                            <span className="badge-warning text-xs">Monto bajo pequeño contrib.</span>
                          ) : (
                            <span className="badge-warning text-xs">Otro problema</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircleIcon className="w-5 h-5 text-rose-500" />
                <span className="font-medium">NIT Inválido</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                El NIT no cumple el formato guatemalteco (8 dígitos + guion + 1 dígito verificador).
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Monto Inconsistente</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Facturas a pequeños contribuyentes por debajo de Q2,500 no generan retención. Verificar clasificación.
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Sin Crédito Fiscal</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Facturas que no cumplen requisitos para crédito fiscal (FPE, NC sin soporte, etc.).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── CALENDARIO FISCAL ─────────────────────── */}
      {activeTab === 'calendario' && (
        <div className="space-y-6">
          <div className="card">
            <div className="section-header">
              <CalendarDaysIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Calendario Fiscal Completo 2026</h2>
            </div>
            <div className="p-5 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-secondary)]">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Obligación</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Formulario</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Tipo</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-muted)]">Monto Est.</th>
                      <th className="px-4 py-2 text-center font-medium text-[var(--text-muted)]">Días restantes</th>
                      <th className="px-4 py-2 text-center font-medium text-[var(--text-muted)]">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vencimientos.map((item, idx) => (
                      <tr key={idx} className={`border-b border-[var(--border-default)] ${
                        item.dias < 0 ? 'opacity-50' :
                        item.nivel === 'critical' ? 'bg-rose-50' :
                        item.nivel === 'warning' ? 'bg-amber-50' : ''
                      }`}>
                        <td className="px-4 py-3">{formatDate(item.fecha)}</td>
                        <td className="px-4 py-3 font-medium">{item.obligacion}</td>
                        <td className="px-4 py-3 font-mono text-xs">{item.formulario}</td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs ${
                            item.tipo === 'IVA' ? 'bg-blue-100 text-blue-800' :
                            item.tipo === 'ISR' ? 'bg-purple-100 text-purple-800' :
                            item.tipo === 'ISO' ? 'bg-orange-100 text-orange-800' :
                            item.tipo === 'Retención' ? 'bg-rose-100 text-rose-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{item.tipo}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatGTQ(item.montoEstimado)}</td>
                        <td className="px-4 py-3 text-center">
                          {item.dias < 0 ? (
                            <span className="text-xs text-[var(--text-muted)]">Vencido</span>
                          ) : item.dias === 0 ? (
                            <span className="badge-danger text-xs">Hoy</span>
                          ) : (
                            <span className={item.dias <= 7 ? 'text-amber-600 font-medium' : ''}>{item.dias} días</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.dias < 0 ? (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          ) : item.dias <= 7 ? (
                            <BellAlertIcon className="w-4 h-4 text-amber-500 mx-auto" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4 text-emerald-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <InformationCircleIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Reglas del Calendario Fiscal</h2>
            </div>
            <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <p className="font-medium">IVA Mensual</p>
                <p className="text-xs text-[var(--text-muted)]">Último día hábil del mes siguiente</p>
                <p className="text-xs text-[var(--text-muted)]">Formulario: SAT-2231</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <p className="font-medium">ISR Trimestral</p>
                <p className="text-xs text-[var(--text-muted)]">Último día hábil del mes siguiente al trimestre</p>
                <p className="text-xs text-[var(--text-muted)]">Formulario: SAT-2221</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <p className="font-medium">ISR Anual</p>
                <p className="text-xs text-[var(--text-muted)]">31 de marzo del año siguiente</p>
                <p className="text-xs text-[var(--text-muted)]">Formulario: SAT-2221</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <p className="font-medium">ISO Trimestral</p>
                <p className="text-xs text-[var(--text-muted)]">Último día hábil del mes siguiente al trimestre</p>
                <p className="text-xs text-[var(--text-muted)]">Formulario: SAT-2293</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <p className="font-medium">Retenciones IVA</p>
                <p className="text-xs text-[var(--text-muted)]">Primeros 15 días hábiles del mes siguiente</p>
                <p className="text-xs text-[var(--text-muted)]">Formulario: SAT-1331</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <p className="font-medium">IGSS/IRTRA/INTECAP</p>
                <p className="text-xs text-[var(--text-muted)]">Día 20 de cada mes</p>
                <p className="text-xs text-[var(--text-muted)]">Planilla mensual</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
