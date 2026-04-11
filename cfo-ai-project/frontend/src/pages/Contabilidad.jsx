import { Link } from 'react-router-dom'
import PageInsights from '../components/agents/PageInsights'
import { 
  BookOpenIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  CalculatorIcon,
  DocumentCheckIcon,
  ArrowRightIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function Contabilidad() {
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
          <BookOpenIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Contabilidad</h1>
          <p className="text-sm text-[var(--text-muted)]">Libros, asientos y cierre mensual</p>
        </div>
      </div>

      {/* AI Insights */}
      <PageInsights context="contabilidad" maxInsights={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Libro Diario */}
        <div className="card">
          <div className="section-header">
            <DocumentCheckIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Libro Diario</h2>
            <span className="badge-success text-xs">Balanceado</span>
          </div>
          
          <div className="space-y-3 p-5 pt-0">
            {[
              { fecha: '2026-03-31', cuenta: 'Caja General', debe: 50000, haber: 0 },
              { fecha: '2026-03-31', cuenta: 'Ventas', debe: 0, haber: 50000 },
              { fecha: '2026-03-30', cuenta: 'Proveedores', debe: 25000, haber: 0 },
            ].map((asiento, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{asiento.cuenta}</p>
                  <p className="text-sm text-[var(--text-muted)]">{asiento.fecha}</p>
                </div>
                <div className="text-right">
                  {asiento.debe > 0 && <span className="text-[var(--success)] font-medium tabular-nums">Q{asiento.debe.toLocaleString()}</span>}
                  {asiento.haber > 0 && <span className="text-[var(--danger)] font-medium tabular-nums">Q{asiento.haber.toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
          
          <Link 
            to="/contabilidad/libro-diario" 
            className="flex items-center justify-center gap-2 w-full py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Ver todo el libro diario
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Cierre Mensual */}
        <div className="card">
          <div className="section-header">
            <ArrowPathIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Cierre Mensual</h2>
            <span className="text-xs text-[var(--text-muted)]">Mar 2026</span>
          </div>
          
          <div className="space-y-4 p-5 pt-0">
            {[
              { paso: 1, nombre: 'Validación preliminar', estado: 'completado' },
              { paso: 2, nombre: 'Asientos de ajuste', estado: 'completado' },
              { paso: 3, nombre: 'Depreciaciones', estado: 'en_progreso' },
              { paso: 4, nombre: 'Conciliación final', estado: 'pendiente' },
              { paso: 5, nombre: 'Generación de estados', estado: 'pendiente' },
            ].map((paso) => (
              <div key={paso.paso} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  paso.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                  paso.estado === 'en_progreso' ? 'bg-amber-100 text-amber-700' :
                  'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                }`}>
                  {paso.estado === 'completado' ? <CheckCircleIcon className="w-4 h-4" /> : paso.paso}
                </div>
                <span className={`flex-1 text-sm ${paso.estado === 'completado' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                  {paso.nombre}
                </span>
              </div>
            ))}
          </div>
          
          <Link 
            to="/contabilidad/cierre" 
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium bg-black text-white rounded-md hover:bg-[var(--brand-secondary)] transition-colors"
          >
            Continuar cierre
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Conciliaciones */}
        <div className="card">
          <div className="section-header">
            <BuildingLibraryIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Conciliaciones</h2>
            <span className="badge-warning text-xs">2 pendientes</span>
          </div>
          
          <div className="space-y-3 p-5 pt-0">
            {[
              { banco: 'Banco Industrial', cuenta: 'Cuenta Corriente', diferencia: 0, dias: 1 },
              { banco: 'Banco G&T', cuenta: 'Cuenta de Ahorros', diferencia: 0, dias: 2 },
              { banco: 'BAC', cuenta: 'Cuenta Corriente USD', diferencia: 1250, dias: 5 },
            ].map((cuenta, idx) => (
              <Link 
                key={idx}
                to={`/contabilidad/conciliacion/${idx + 1}/2026/3`}
                className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    cuenta.diferencia === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {cuenta.diferencia === 0 ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{cuenta.banco}</p>
                    <p className="text-sm text-[var(--text-muted)]">{cuenta.cuenta}</p>
                  </div>
                </div>
                
                {cuenta.diferencia > 0 ? (
                  <span className="text-sm font-medium text-[var(--danger)]">
                    Dif: Q{cuenta.diferencia.toLocaleString()}
                  </span>
                ) : (
                  <span className="badge-success text-[10px]">Conciliado</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
