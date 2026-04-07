export default function SAT() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cumplimiento SAT</h1>
          <p className="text-slate-500">Calendario, declaraciones y DTE</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Próximos Vencimientos</h2>
            <span className="badge-danger">1 crítico</span>
          </div>

          <div className="space-y-4">
            {[
              { 
                obligacion: '1ra. Cuota ISR 2026', 
                formulario: 'SAT-2221', 
                fecha: '2026-03-31', 
                dias: 0, 
                monto: 175000, 
                nivel: 'critical' 
              },
              { 
                obligacion: 'IVA Marzo 2026', 
                formulario: 'SAT-2231', 
                fecha: '2026-04-15', 
                dias: 15, 
                monto: 185000, 
                nivel: 'warning' 
              },
              { 
                obligacion: 'Retenciones ISR', 
                formulario: 'SAT-2201', 
                fecha: '2026-04-10', 
                dias: 10, 
                monto: 45000, 
                nivel: 'info' 
              },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-xl border ${
                  item.nivel === 'critical' ? 'bg-rose-50 border-rose-200' :
                  item.nivel === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold ${
                      item.nivel === 'critical' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' :
                      item.nivel === 'warning' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                      'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    }`}>
                      {new Date(item.fecha).getDate()}
                    </div>
                    <div>
                      <p className={`font-bold ${
                        item.nivel === 'critical' ? 'text-rose-900' :
                        item.nivel === 'warning' ? 'text-amber-900' :
                        'text-blue-900'
                      }`}>
                        {item.obligacion}
                      </p>
                      <p className="text-sm text-slate-600">Formulario {item.formulario}</p>
                      <p className={`text-sm font-medium mt-1 ${
                        item.nivel === 'critical' ? 'text-rose-700' :
                        item.nivel === 'warning' ? 'text-amber-700' :
                        'text-blue-700'
                      }`}>
                        {item.dias === 0 ? '⚠️ Vence hoy' : `En ${item.dias} días`}
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-xl font-bold text-slate-900">
                    Q{item.monto.toLocaleString()}
                  </span>
                </div>

                {item.nivel === 'critical' && (
                  <div className="mt-4 flex gap-3">
                    <button className="btn-primary flex-1 text-sm">
                      Preparar declaración
                    </button>
                    <button className="btn-secondary text-sm">
                      Postergar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-elevated p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">DTE - Facturación Electrónica</h2>
            
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-emerald-800">Certificado activo</span>
                </div>
                <p className="text-sm text-emerald-700">Vence: 2026-12-31</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-slate-900">247</p>
                  <p className="text-xs text-slate-500">Facturas mes</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-600">100%</p>
                  <p className="text-xs text-slate-500">Aceptadas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Resumen Fiscal</h2>
            
            <div className="space-y-3">
              {[
                { concepto: 'IVA por Pagar', monto: 185000, tipo: 'deuda' },
                { concepto: 'ISR por Pagar', monto: 175000, tipo: 'deuda' },
                { concepto: 'Retenciones a Favor', monto: 45000, tipo: 'credito' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-600">{item.concepto}</span>
                  <span className={`font-medium ${item.tipo === 'deuda' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.tipo === 'deuda' ? '-' : '+'}Q{item.monto.toLocaleString()}
                  </span>
                </div>
              ))}
              
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Saldo Neto</span>
                  <span className="text-xl font-bold text-rose-600">Q315,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
