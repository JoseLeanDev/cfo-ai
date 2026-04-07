export default function Analisis() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Análisis Financiero</h1>
          <p className="text-slate-500">Ratios, rentabilidad y tendencias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { titulo: 'ROI', valor: '18.5%', benchmark: '15.2%', status: 'positive' },
          { titulo: 'Margen Bruto', valor: '42.3%', benchmark: '38.0%', status: 'positive' },
          { titulo: 'Margen Neto', valor: '12.1%', benchmark: '10.5%', status: 'positive' },
          { titulo: 'EBITDA', valor: 'Q2.4M', benchmark: 'Q2.1M', status: 'positive' },
        ].map((kpi, idx) => (
          <div key={idx} className="card-elevated p-6">
            <p className="text-sm font-medium text-slate-500">{kpi.titulo}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{kpi.valor}</span>
              <span className="text-xs text-emerald-600 font-medium">▲ vs sector</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">Benchmark: {kpi.benchmark}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elevated p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Rentabilidad por Dimensión</h2>
          <div className="space-y-4">
            {[
              { dimension: 'Por Producto', producto: 'Producto A', rentabilidad: 35, unidades: 1250 },
              { dimension: 'Por Línea', producto: 'Línea Industrial', rentabilidad: 28, unidades: 890 },
              { dimension: 'Por Cliente', producto: 'Cliente XYZ', rentabilidad: 42, unidades: 45 },
              { dimension: 'Por Sucursal', producto: 'Sede Central', rentabilidad: 38, unidades: 2100 },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">{item.dimension}</span>
                  <span className="text-lg font-bold text-slate-900">{item.rentabilidad}%</span>
                </div>
                <p className="text-sm text-slate-700">{item.producto}</p>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                    style={{ width: `${item.rentabilidad}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Ratios Financieros vs Sector</h2>
          <div className="space-y-4">
            {[
              { nombre: 'Liquidez Corriente', valor: 1.85, sector: 1.5, status: 'above_average' },
              { nombre: 'Prueba Ácida', valor: 1.32, sector: 1.1, status: 'above_average' },
              { nombre: 'Endeudamiento', valor: 0.45, sector: 0.55, status: 'best_in_class' },
              { nombre: 'ROE', valor: 22.5, sector: 18.0, status: 'best_in_class' },
              { nombre: 'Rotación de Activos', valor: 1.65, sector: 1.4, status: 'above_average' },
            ].map((ratio, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">{ratio.nombre}</p>
                  <p className="text-sm text-slate-500">Sector promedio: {ratio.sector}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${
                    ratio.status === 'best_in_class' ? 'text-emerald-600' : 'text-primary-600'
                  }`}>
                    {ratio.valor}
                  </span>
                  <span className={`block text-xs ${
                    ratio.status === 'best_in_class' ? 'text-emerald-600' : 'text-slate-500'
                  }`}>
                    {ratio.status === 'best_in_class' ? '★ Mejor del sector' : '▲ Sobre promedio'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
