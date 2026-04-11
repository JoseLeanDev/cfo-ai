import { DocumentCheckIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function SAT() {
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
          <DocumentCheckIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Cumplimiento SAT</h1>
          <p className="text-sm text-[var(--text-muted)]">Calendario, declaraciones y DTE</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="section-header">
            <ExclamationTriangleIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <h2 className="font-semibold">Próximos Vencimientos</h2>
            <span className="badge-danger text-xs">1 crítico</span>
          </div>

          <div className="space-y-4 p-5 pt-0">
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
                className={`p-4 rounded-lg border ${
                  item.nivel === 'critical' ? 'bg-rose-50 border-rose-200' :
                  item.nivel === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                      item.nivel === 'critical' ? 'bg-rose-500 text-white' :
                      item.nivel === 'warning' ? 'bg-amber-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {new Date(item.fecha).getDate()}
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        item.nivel === 'critical' ? 'text-rose-900' :
                        item.nivel === 'warning' ? 'text-amber-900' :
                        'text-blue-900'
                      }`}>
                        {item.obligacion}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">Formulario {item.formulario}</p>
                      <p className={`text-sm font-medium mt-1 ${
                        item.nivel === 'critical' ? 'text-rose-700' :
                        item.nivel === 'warning' ? 'text-amber-700' :
                        'text-blue-700'
                      }`}>
                        {item.dias === 0 ? '⚠️ Vence hoy' : `En ${item.dias} días`}
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-xl font-bold tabular-nums">
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
          <div className="card">
            <div className="section-header">
              <CheckCircleIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">DTE - Facturación</h2>
            </div>
            
            <div className="p-5 pt-0 space-y-3">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-sm font-medium text-emerald-800">Certificado activo</span>
                </div>
                <p className="text-sm text-emerald-700">Vence: 2026-12-31</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
                  <p className="text-2xl font-bold tabular-nums">247</p>
                  <p className="text-xs text-[var(--text-muted)]">Facturas mes</p>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
                  <p className="text-2xl font-bold text-[var(--success)]">100%</p>
                  <p className="text-xs text-[var(--text-muted)]">Aceptadas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <DocumentCheckIcon className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="font-semibold">Resumen Fiscal</h2>
            </div>
            
            <div className="p-5 pt-0 space-y-3">
              {[
                { concepto: 'IVA por Pagar', monto: 185000, tipo: 'deuda' },
                { concepto: 'ISR por Pagar', monto: 175000, tipo: 'deuda' },
                { concepto: 'Retenciones a Favor', monto: 45000, tipo: 'credito' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-secondary)]">{item.concepto}</span>
                  <span className={`font-medium tabular-nums ${item.tipo === 'deuda' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                    {item.tipo === 'deuda' ? '-' : '+'}Q{item.monto.toLocaleString()}
                  </span>
                </div>
              ))}
              
              <div className="pt-3 border-t border-[var(--border-default)]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Saldo Neto</span>
                  <span className="text-xl font-bold text-[var(--danger)]">Q315,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
