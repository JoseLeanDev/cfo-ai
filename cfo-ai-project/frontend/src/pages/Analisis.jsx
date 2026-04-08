import PageInsights from '../components/agents/PageInsights'

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

      {/* AI Insights Section */}
      <PageInsights context="analisis" maxInsights={3} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { titulo: 'ROI', valor: '18.5%', anterior: '16.2%', meta: '20%', tendencia: 'up' },
          { titulo: 'Margen Bruto', valor: '42.3%', anterior: '40.1%', meta: '45%', tendencia: 'up' },
          { titulo: 'Margen Neto', valor: '12.1%', anterior: '10.8%', meta: '15%', tendencia: 'up' },
          { titulo: 'EBITDA', valor: 'Q2.4M', anterior: 'Q2.1M', meta: 'Q2.8M', tendencia: 'up' },
        ].map((kpi, idx) => (
          <div key={idx} className="card-elevated p-6">
            <p className="text-sm font-medium text-slate-500">{kpi.titulo}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{kpi.valor}</span>
              <span className="text-xs text-emerald-600 font-medium">↑ vs mes ant.</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">Meta: {kpi.meta} · Ant: {kpi.anterior}</p>
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
          <h2 className="text-lg font-bold text-slate-900 mb-6">Análisis vs Mes Anterior</h2>
          <div className="space-y-4">
            {[
              { nombre: 'Liquidez Corriente', actual: 1.85, anterior: 1.62, umbral: 1.5, unidad: '' },
              { nombre: 'Prueba Ácida', actual: 1.32, anterior: 1.15, umbral: 1.0, unidad: '' },
              { nombre: 'Endeudamiento', actual: 0.45, anterior: 0.52, umbral: 0.6, unidad: '' },
              { nombre: 'ROE', actual: 22.5, anterior: 19.8, umbral: 15.0, unidad: '%' },
              { nombre: 'Rotación de Inventario', actual: 8.5, anterior: 7.2, umbral: 6.0, unidad: 'x' },
            ].map((ratio, idx) => {
              const variacion = ((ratio.actual - ratio.anterior) / ratio.anterior * 100).toFixed(1)
              const esPositivo = ratio.actual > ratio.anterior
              const saludable = ratio.nombre === 'Endeudamiento' ? ratio.actual < ratio.umbral : ratio.actual > ratio.umbral
              
              return (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">{ratio.nombre}</p>
                    <p className="text-sm text-slate-500">Mes anterior: {ratio.anterior}{ratio.unidad}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${saludable ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {ratio.actual}{ratio.unidad}
                    </span>
                    <span className={`block text-xs ${esPositivo ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {esPositivo ? '↑' : '↓'} {Math.abs(variacion)}% vs mes ant.
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>💡 Insight:</strong> Todos los ratios muestran mejora vs el mes anterior. 
              La reducción de endeudamiento del 13.5% es la variación más significativa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
