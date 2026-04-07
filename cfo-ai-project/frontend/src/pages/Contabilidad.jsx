import { Link } from 'react-router-dom'
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <BookOpenIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Contabilidad</h1>
          <p className="text-slate-500">Libros, asientos y cierre mensual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Libro Diario */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <DocumentCheckIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Libro Diario</h2>
            </div>
            <span className="badge-success text-xs">Balanceado</span>
          </div>
          
          <div className="space-y-3">
            {[
              { fecha: '2026-03-31', cuenta: 'Caja General', debe: 50000, haber: 0 },
              { fecha: '2026-03-31', cuenta: 'Ventas', debe: 0, haber: 50000 },
              { fecha: '2026-03-30', cuenta: 'Proveedores', debe: 25000, haber: 0 },
            ].map((asiento, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">{asiento.cuenta}</p>
                  <p className="text-sm text-slate-500">{asiento.fecha}</p>
                </div>
                <div className="text-right">
                  {asiento.debe > 0 && <span className="text-emerald-600 font-medium">Q{asiento.debe.toLocaleString()}</span>}
                  {asiento.haber > 0 && <span className="text-rose-600 font-medium">Q{asiento.haber.toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
          
          <Link 
            to="/contabilidad/libro-diario" 
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors border border-transparent hover:border-violet-200"
          >
            Ver todo el libro diario
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {/* Cierre Mensual */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <ArrowPathIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Cierre Mensual</h2>
            </div>
            <span className="text-sm text-slate-500">Mar 2026</span>
          </div>
          
          <div className="space-y-4">
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
                  'bg-slate-100 text-slate-400'
                }`}>
                  {paso.paso}
                </div>
                <span className={`flex-1 text-sm ${paso.estado === 'completado' ? 'text-slate-700 line-through' : 'text-slate-900'}`}>
                  {paso.nombre}
                </span>
                {paso.estado === 'completado' && <CheckCircleIcon className="w-5 h-5 text-emerald-600" />}
                {paso.estado === 'en_progreso' && <span className="text-amber-600">⟳</span>}
              </div>
            ))}
          </div>
          
          <Link to="/contabilidad/cierre" className="btn-primary w-full mt-6 block text-center">
            Ir a Cierre Mensual
          </Link>
        </div>

        {/* Conciliación Bancaria */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BuildingLibraryIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Conciliación</h2>
            </div>
            <span className="text-sm text-slate-500">Última: Hoy</span>
          </div>
          
          <div className="space-y-3">
            {[
              { banco: 'Banco Industrial', cuenta: 'Monetaria GTQ', diferencia: 0, estado: 'conciliado' },
              { banco: 'Banco Industrial', cuenta: 'Monetaria USD', diferencia: 1250, estado: 'diferencia' },
              { banco: 'G&T Continental', cuenta: 'Ahorro GTQ', diferencia: 0, estado: 'conciliado' },
            ].map((item, idx) => (
              <div key={idx} className={`p-4 rounded-xl border ${
                item.estado === 'conciliado' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.estado === 'conciliado' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {item.estado === 'conciliado' ? <CheckCircleIcon className="w-4 h-4" /> : <ExclamationTriangleIcon className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{item.banco}</p>
                      <p className="text-xs text-slate-500">{item.cuenta}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.diferencia > 0 ? (
                      <span className="text-amber-700 font-medium text-sm">Diff: Q{item.diferencia.toLocaleString()}</span>
                    ) : (
                      <span className="text-xs text-emerald-700 font-medium">✓ OK</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Link 
            to="/tesoreria/cuentas-bancarias" 
            className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200"
          >
            Ver todas las cuentas
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}