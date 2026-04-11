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

  const data = libroData?.data || {}
  const asientos = data.asientos || []
  
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
              <p className="text-sm text-[var(--text-muted)]">{data.total_asientos || 0} asientos • {meses.find(m => m.value === mes)?.label}</p>
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
        data.balanceado 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex items-center gap-3">
          {data.balanceado ? (
            <CheckCircleIcon className="w-6 h-6 text-[var(--success)]" />
          ) : (
            <ExclamationTriangleIcon className="w-6 h-6 text-[var(--danger)]" />
          )}
          <div>
            <p className={`font-semibold ${data.balanceado ? 'text-emerald-800' : 'text-rose-800'}`}>
              {data.balanceado ? 'Libro balanceado' : 'Diferencia detectada'}
            </p>
            <p className={`text-sm ${data.balanceado ? 'text-emerald-600' : 'text-rose-600'}`}>
              Debe: Q{(data.debe_total || 0).toLocaleString()} | Haber: Q{(data.haber_total || 0).toLocaleString()}
            </p>
          </div>
        </div>
        
        {data.balanceado && (
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
                  Q{(data.debe_total || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-bold text-[var(--danger)]">
                  Q{(data.haber_total || 0).toLocaleString()}
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
          <p className="kpi-value">{data.total_asientos || 0}</p>
        </div>
        
        <div className="kpi-card">
          <span className="kpi-label">Promedio por Asiento</span>
          <p className="kpi-value">
            Q{data.total_asientos ? Math.round((data.debe_total || 0) / data.total_asientos).toLocaleString() : 0}
          </p>
        </div>
        
        <div className="kpi-card">
          <span className="kpi-label">Diferencia</span>
          <p className={`kpi-value ${data.balanceado ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            Q{Math.abs((data.debe_total || 0) - (data.haber_total || 0)).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
