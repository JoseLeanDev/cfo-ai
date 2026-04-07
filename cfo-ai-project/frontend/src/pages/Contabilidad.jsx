export default function Contabilidad() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Contabilidad</h1>
          <p className="text-slate-500">Libros, asientos y cierre mensual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-elevated p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Libro Diario</h2>
          <div className="space-y-3">
            {[
              { fecha: '2026-03-31', cuenta: 'Caja General', debe: 50000, haber: 0 },
              { fecha: '2026-03-31', cuenta: 'Ventas', debe: 0, haber: 50000 },
              { fecha: '2026-03-30', cuenta: 'Proveedores', debe: 25000, haber: 0 },
            ].map((asiento, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
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
          <button className="w-full mt-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
            Ver todo el libro diario →
          </button>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Cierre Mensual</h2>
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
                <span className={`flex-1 ${paso.estado === 'completado' ? 'text-slate-700 line-through' : 'text-slate-900'}`}>
                  {paso.nombre}
                </span>
                {paso.estado === 'completado' && <span className="text-emerald-600">✓</span>}
                {paso.estado === 'en_progreso' && <span className="text-amber-600">⟳</span>}
              </div>
            ))}
          </div>
          <button className="btn-primary w-full mt-6">
            Continuar cierre
          </button>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Conciliación Bancaria</h2>
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
                  <div>
                    <p className="font-semibold text-slate-900">{item.banco}</p>
                    <p className="text-sm text-slate-500">{item.cuenta}</p>
                  </div>
                  <div className="text-right">
                    {item.diferencia > 0 ? (
                      <span className="text-amber-700 font-medium">Diff: Q{item.diferencia.toLocaleString()}</span>
                    ) : (
                      <span className="badge-success">Conciliado</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
