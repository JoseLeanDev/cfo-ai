import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { endpoints } from '../services/cfoApi'
import { 
  BookOpenIcon, 
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

export default function LibroDiario() {
  const [mes, setMes] = useState('2026-03')
  const [busqueda, setBusqueda] = useState('')
  
  const { data: libroData, isLoading } = useQuery(
    ['libro-diario', mes], 
    () => endpoints.contabilidad.libroDiario({ mes, limit: 500 }),
    { keepPreviousData: true }
  )

// Datos de ejemplo para demostración
const ASIENTOS_EJEMPLO = [
  { asiento_id: 1, fecha: '2026-03-01', cuenta_codigo: '1101', cuenta_nombre: 'Caja General', descripcion: 'Apertura de caja - fondo inicial', debe: 50000, haber: 0, documento: 'AP-001' },
  { asiento_id: 1, fecha: '2026-03-01', cuenta_codigo: '3101', cuenta_nombre: 'Capital Social', descripcion: 'Apertura de caja - fondo inicial', debe: 0, haber: 50000, documento: 'AP-001' },
  { asiento_id: 2, fecha: '2026-03-05', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Depósito de ventas', debe: 125000, haber: 0, documento: 'DEP-102' },
  { asiento_id: 2, fecha: '2026-03-05', cuenta_codigo: '4101', cuenta_nombre: 'Ventas', descripcion: 'Depósito de ventas', debe: 0, haber: 111607, documento: 'DEP-102' },
  { asiento_id: 2, fecha: '2026-03-05', cuenta_codigo: '2108', cuenta_nombre: 'IVA por Pagar', descripcion: 'Depósito de ventas', debe: 0, haber: 13393, documento: 'DEP-102' },
  { asiento_id: 3, fecha: '2026-03-08', cuenta_codigo: '5101', cuenta_nombre: 'Costo de Ventas', descripcion: 'Compra de mercadería', debe: 45000, haber: 0, documento: 'FC-4521' },
  { asiento_id: 3, fecha: '2026-03-08', cuenta_codigo: '1107', cuenta_nombre: 'IVA Crédito Fiscal', descripcion: 'Compra de mercadería', debe: 5400, haber: 0, documento: 'FC-4521' },
  { asiento_id: 3, fecha: '2026-03-08', cuenta_codigo: '2101', cuenta_nombre: 'Proveedores', descripcion: 'Compra de mercadería', debe: 0, haber: 50400, documento: 'FC-4521' },
  { asiento_id: 4, fecha: '2026-03-12', cuenta_codigo: '5102', cuenta_nombre: 'Gastos de Sueldos', descripcion: 'Nómina quincenal', debe: 35000, haber: 0, documento: 'NOM-0312' },
  { asiento_id: 4, fecha: '2026-03-12', cuenta_codigo: '2102', cuenta_nombre: 'Sueldos por Pagar', descripcion: 'Nómina quincenal', debe: 0, haber: 35000, documento: 'NOM-0312' },
  { asiento_id: 5, fecha: '2026-03-15', cuenta_codigo: '4101', cuenta_nombre: 'Ventas', descripcion: 'Venta a crédito - Cliente XYZ', debe: 0, haber: 89286, documento: 'F001-0023' },
  { asiento_id: 5, fecha: '2026-03-15', cuenta_codigo: '2108', cuenta_nombre: 'IVA por Pagar', descripcion: 'Venta a crédito - Cliente XYZ', debe: 0, haber: 10714, documento: 'F001-0023' },
  { asiento_id: 5, fecha: '2026-03-15', cuenta_codigo: '1104', cuenta_nombre: 'Cuentas por Cobrar', descripcion: 'Venta a crédito - Cliente XYZ', debe: 100000, haber: 0, documento: 'F001-0023' },
  { asiento_id: 6, fecha: '2026-03-18', cuenta_codigo: '2101', cuenta_nombre: 'Proveedores', descripcion: 'Pago a Proveedor Alfa', debe: 30000, haber: 0, documento: 'CH-045' },
  { asiento_id: 6, fecha: '2026-03-18', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Pago a Proveedor Alfa', debe: 0, haber: 30000, documento: 'CH-045' },
  { asiento_id: 7, fecha: '2026-03-20', cuenta_codigo: '5103', cuenta_nombre: 'Alquiler', descripcion: 'Pago alquiler local comercial', debe: 15000, haber: 0, documento: 'REC-0320' },
  { asiento_id: 7, fecha: '2026-03-20', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Pago alquiler local comercial', debe: 0, haber: 15000, documento: 'REC-0320' },
  { asiento_id: 8, fecha: '2026-03-22', cuenta_codigo: '1104', cuenta_nombre: 'Cuentas por Cobrar', descripcion: 'Cobro a Cliente XYZ', debe: 0, haber: 50000, documento: 'DEP-215' },
  { asiento_id: 8, fecha: '2026-03-22', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Cobro a Cliente XYZ', debe: 50000, haber: 0, documento: 'DEP-215' },
  { asiento_id: 9, fecha: '2026-03-25', cuenta_codigo: '5201', cuenta_nombre: 'Servicios Públicos', descripcion: 'Electricidad y agua marzo', debe: 3200, haber: 0, documento: 'EEGSA-445' },
  { asiento_id: 9, fecha: '2026-03-25', cuenta_codigo: '1107', cuenta_nombre: 'IVA Crédito Fiscal', descripcion: 'Electricidad y agua marzo', debe: 384, haber: 0, documento: 'EEGSA-445' },
  { asiento_id: 9, fecha: '2026-03-25', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Electricidad y agua marzo', debe: 0, haber: 3584, documento: 'EEGSA-445' },
  { asiento_id: 10, fecha: '2026-03-28', cuenta_codigo: '5202', cuenta_nombre: 'Publicidad', descripcion: 'Campaña redes sociales', debe: 8000, haber: 0, documento: 'FC-8891' },
  { asiento_id: 10, fecha: '2026-03-28', cuenta_codigo: '1107', cuenta_nombre: 'IVA Crédito Fiscal', descripcion: 'Campaña redes sociales', debe: 960, haber: 0, documento: 'FC-8891' },
  { asiento_id: 10, fecha: '2026-03-28', cuenta_codigo: '2101', cuenta_nombre: 'Proveedores', descripcion: 'Campaña redes sociales', debe: 0, haber: 8960, documento: 'FC-8891' },
]

function getAsientosEjemplo(mes) {
  // Simplemente devolvemos los asientos de ejemplo para cualquier mes
  // En producción esto vendría del backend
  return ASIENTOS_EJEMPLO
}

  const data = libroData?.data || {}
  const asientosAPI = data.asientos || []
  const asientos = asientosAPI.length > 0 ? asientosAPI : getAsientosEjemplo(mes)
  
  // Calcular totales (de API o de ejemplo)
  const debeTotal = asientos.reduce((sum, a) => sum + (a.debe || 0), 0)
  const haberTotal = asientos.reduce((sum, a) => sum + (a.haber || 0), 0)
  const totalAsientos = [...new Set(asientos.map(a => a.asiento_id))].length
  const balanceado = Math.abs(debeTotal - haberTotal) < 0.01
  
  const asientosFiltrados = busqueda 
    ? asientos.filter(a => 
        a.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.cuenta_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.cuenta_codigo?.includes(busqueda) ||
        a.documento?.includes(busqueda)
      )
    : asientos

  const meses = [
    { value: '2026-03', label: 'Marzo 2026' },
    { value: '2026-02', label: 'Febrero 2026' },
    { value: '2026-01', label: 'Enero 2026' },
    { value: '2025-12', label: 'Diciembre 2025' },
    { value: '2025-11', label: 'Noviembre 2025' },
    { value: '2025-10', label: 'Octubre 2025' },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/contabilidad" 
            className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
              <BookOpenIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Libro Diario</h1>
              <p className="text-sm text-[var(--text-muted)]">{totalAsientos} asientos • {meses.find(m => m.value === mes)?.label}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarIcon className="w-5 h-5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <select 
              value={mes} 
              onChange={(e) => setMes(e.target.value)}
              className="input pl-10 pr-8 py-2.5 appearance-none cursor-pointer"
            >
              {meses.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Balance Status Card */}
      <div className={`p-4 rounded-lg border flex items-center justify-between ${
        balanceado 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex items-center gap-3">
          {balanceado ? (
            <CheckCircleIcon className="w-6 h-6 text-[var(--success)]" />
          ) : (
            <ExclamationTriangleIcon className="w-6 h-6 text-[var(--danger)]" />
          )}
          <div>
            <p className={`font-semibold ${balanceado ? 'text-emerald-800' : 'text-rose-800'}`}>
              {balanceado ? 'Libro balanceado' : 'Diferencia detectada'}
            </p>
            <p className={`text-sm ${balanceado ? 'text-emerald-600' : 'text-rose-600'}`}>
              Debe: Q{debeTotal.toLocaleString()} | Haber: Q{haberTotal.toLocaleString()}
            </p>
          </div>
        </div>
        
        {balanceado && (
          <span className="badge-success">✓ Balanceado</span>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por cuenta, descripción, documento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input w-full pl-12 pr-4 py-3"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Asiento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Cuenta</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase">Debe</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase">Haber</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-muted)] uppercase">Doc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-8 bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : asientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <DocumentTextIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-muted)]">No se encontraron asientos</p>
                    {busqueda && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">Intenta con otra búsqueda</p>
                    )}
                  </td>
                </tr>
              ) : (
                asientosFiltrados.map((asiento, idx) => (
                  <tr 
                    key={asiento.asiento_id} 
                    className="hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(asiento.fecha).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded">
                        #{asiento.asiento_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{asiento.cuenta_nombre}</p>
                        <p className="text-xs text-[var(--text-muted)]">{asiento.cuenta_codigo}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-xs truncate">
                      {asiento.descripcion}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {asiento.debe > 0 && (
                        <span className="text-sm font-semibold text-[var(--success)]">
                          Q{asiento.debe.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {asiento.haber > 0 && (
                        <span className="text-sm font-semibold text-[var(--danger)]">
                          Q{asiento.haber.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {asiento.documento && (
                        <span className="text-xs text-[var(--text-muted)]">{asiento.documento}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-[var(--bg-secondary)] border-t-2 border-[var(--border-default)]">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                  Totales del período:
                </td>
                <td className="px-4 py-3 text-right font-bold text-[var(--success)]">
                  Q{debeTotal.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-bold text-[var(--danger)]">
                  Q{haberTotal.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <span className="kpi-label">Total Asientos</span>
          <p className="kpi-value">{totalAsientos}</p>
        </div>
        
        <div className="kpi-card">
          <span className="kpi-label">Promedio por Asiento</span>
          <p className="kpi-value">
            Q{totalAsientos ? Math.round(debeTotal / totalAsientos).toLocaleString() : 0}
          </p>
        </div>
        
        <div className="kpi-card">
          <span className="kpi-label">Diferencia</span>
          <p className={`kpi-value ${balanceado ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            Q{Math.abs(debeTotal - haberTotal).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
