import React, { useState } from 'react';

const CierreWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Estado para el paso 1: Validación Preliminar
  const [validaciones, setValidaciones] = useState([
    { id: 1, nombre: 'Periodo contable cerrado', estado: 'ok', mensaje: '' },
    { id: 2, nombre: 'Asientos pendientes de aprobación', estado: 'warning', mensaje: '3 asientos pendientes' },
    { id: 3, nombre: 'Documentos sin conciliar', estado: 'error', mensaje: '12 documentos' },
    { id: 4, nombre: 'Tipos de cambio actualizados', estado: 'ok', mensaje: '' },
    { id: 5, nombre: 'Inventarios físicos registrados', estado: 'ok', mensaje: '' },
  ]);

  // Estado para el paso 2: Asientos de Ajuste
  const [asientosAjuste, setAsientosAjuste] = useState([
    { id: 1, cuenta: '60.01.01', descripcion: 'Diferencia cambiaria proveedores', debe: 1250.00, haber: 0, sugerido: true },
    { id: 2, cuenta: '42.01.01', descripcion: 'Ajuste por redondeo', debe: 0, haber: 1250.00, sugerido: true },
    { id: 3, cuenta: '65.01.01', descripcion: 'Provisiones por garantías', debe: 5000.00, haber: 0, sugerido: true },
    { id: 4, cuenta: '48.01.01', descripcion: 'Provisiones por garantías', debe: 0, haber: 5000.00, sugerido: true },
  ]);

  // Estado para el paso 3: Depreciaciones
  const [activos, setActivos] = useState([
    { id: 1, codigo: 'ACT-001', nombre: 'Edificio Principal', valorInicial: 500000, valorDepreciado: 125000, depreciacionMes: 2083, vidaUtil: 20, anosRestantes: 15 },
    { id: 2, codigo: 'ACT-002', nombre: 'Maquinaria Línea A', valorInicial: 150000, valorDepreciado: 45000, depreciacionMes: 2500, vidaUtil: 5, anosRestantes: 3 },
    { id: 3, codigo: 'ACT-003', nombre: 'Vehículos Flota', valorInicial: 80000, valorDepreciado: 32000, depreciacionMes: 1333, vidaUtil: 5, anosRestantes: 2 },
    { id: 4, codigo: 'ACT-004', nombre: 'Equipos de Computo', valorInicial: 25000, valorDepreciado: 15000, depreciacionMes: 417, vidaUtil: 3, anosRestantes: 1 },
  ]);

  // Estado para el paso 4: Conciliación CxC/CxP
  const [conciliacion, setConciliacion] = useState({
    cxc: {
      saldoLibro: 450000,
      saldoAuxiliar: 448500,
      diferencia: -1500,
      items: [
        { tipo: 'Cobranza no registrada', monto: 2000, accion: 'Registrar cobranza' },
        { tipo: 'Nota de crédito pendiente', monto: -500, accion: 'Aplicar nota de crédito' },
      ]
    },
    cxp: {
      saldoLibro: 320000,
      saldoAuxiliar: 322000,
      diferencia: 2000,
      items: [
        { tipo: 'Pago no conciliado', monto: 1500, accion: 'Conciliar pago' },
        { tipo: 'Factura duplicada', monto: 500, accion: 'Eliminar duplicado' },
      ]
    }
  });

  // Estado para el paso 5: Estados Financieros
  const [estadosPreview, setEstadosPreview] = useState({
    balance: {
      activoTotal: 2450000,
      pasivoTotal: 980000,
      patrimonio: 1470000,
    },
    resultados: {
      ventas: 3200000,
      costos: 1920000,
      utilidadBruta: 1280000,
      gastosOperativos: 850000,
      utilidadNeta: 280000,
    },
    ratios: {
      liquidez: 1.85,
      endeudamiento: 0.40,
      roa: 0.114,
      roe: 0.19,
    }
  });

  // Estado para el paso 6: Resumen
  const [cerrando, setCerrando] = useState(false);
  const [cerrado, setCerrado] = useState(false);

  const steps = [
    { id: 1, nombre: 'Validación Preliminar', icono: '✓' },
    { id: 2, nombre: 'Asientos de Ajuste', icono: '' },
    { id: 3, nombre: 'Depreciaciones', icono: '' },
    { id: 4, nombre: 'Conciliación CxC/CxP', icono: '' },
    { id: 5, nombre: 'Generación de Estados', icono: '' },
    { id: 6, nombre: 'Cierre y Aprobación', icono: '' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId) => {
    setCurrentStep(stepId);
  };

  const handleCerrarPeriodo = () => {
    setCerrando(true);
    setTimeout(() => {
      setCerrando(false);
      setCerrado(true);
      setCompletedSteps([...completedSteps, steps.length]);
    }, 2000);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <button
            onClick={() => handleStepClick(step.id)}
            className={`flex flex-col items-center focus:outline-none transition-all duration-200 ${
              currentStep === step.id
                ? 'scale-110'
                : 'hover:scale-105'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-colors duration-200 ${
                completedSteps.includes(step.id)
                  ? 'bg-verified text-white'
                  : currentStep === step.id
                  ? 'bg-cobalt text-white ring-4 ring-cobalt'
                  : 'bg-fog text-graphite'
              }`}
            >
              {completedSteps.includes(step.id) ? '✓' : step.icono}
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                currentStep === step.id ? 'text-cobalt' : 'text-slate'
              }`}
            >
              {step.nombre}
            </span>
          </button>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-1 mx-2 transition-colors duration-200 ${
                completedSteps.includes(step.id) ? 'bg-verified' : 'bg-fog'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderValidacionPreliminar = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-card p-6">
        <h3 className="text-xl font-semibold text-ink mb-4 flex items-center">
          <span className="text-2xl mr-2">✓</span>
          Validación Preliminar del Periodo
        </h3>
        <p className="text-graphite mb-6">Revise las validaciones antes de proceder con el cierre del periodo.</p>

        <div className="space-y-3">
          {validaciones.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-card border-l-4 ${
                item.estado === 'ok'
                  ? 'bg-verified-50 border-verified'
                  : item.estado === 'warning'
                  ? 'bg-copper-50 border-copper'
                  : 'bg-breach-50 border-breach'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                    item.estado === 'ok'
                      ? 'bg-verified'
                      : item.estado === 'warning'
                      ? 'bg-copper'
                      : 'bg-breach'
                  }`}
                >
                  {item.estado === 'ok' ? '✓' : item.estado === 'warning' ? '!' : '✕'}
                </span>
                <span className="font-medium text-ink">{item.nombre}</span>
              </div>
              {item.mensaje && (
                <span
                  className={`text-sm font-medium ${
                    item.estado === 'warning' ? 'text-copper' : 'text-breach'
                  }`}
                >
                  {item.mensaje}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-paper rounded-card">
          <h4 className="font-semibold text-cobalt mb-2">Resumen</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-2xl font-semibold text-verified">3</span>
              <p className="text-sm text-graphite">Validaciones OK</p>
            </div>
            <div>
              <span className="text-2xl font-semibold text-copper">1</span>
              <p className="text-sm text-graphite">Advertencias</p>
            </div>
            <div>
              <span className="text-2xl font-semibold text-breach">1</span>
              <p className="text-sm text-graphite">Errores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAsientosAjuste = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-card p-6">
        <h3 className="text-xl font-semibold text-ink mb-4 flex items-center">
          <span className="text-2xl mr-2"></span>
          Asientos de Ajuste Sugeridos
        </h3>
        <p className="text-graphite mb-6">Revise y apruebe los asientos de ajuste propuestos por el sistema.</p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-paper">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-graphite">Cuenta</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-graphite">Descripción</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-graphite">Debe</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-graphite">Haber</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-graphite">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {asientosAjuste.map((asiento) => (
                <tr key={asiento.id} className={asiento.sugerido ? 'bg-paper' : ''}>
                  <td className="px-4 py-3 font-mono text-sm text-ink">{asiento.cuenta}</td>
                  <td className="px-4 py-3 text-sm text-graphite">{asiento.descripcion}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-ink">
                    {asiento.debe > 0 ? asiento.debe.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-ink">
                    {asiento.haber > 0 ? asiento.haber.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {asiento.sugerido && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-paper text-cobalt">
                        Sugerido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-paper font-semibold">
              <tr>
                <td className="px-4 py-3" colSpan="2">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono text-verified">
                  {asientosAjuste.reduce((sum, a) => sum + a.debe, 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-verified">
                  {asientosAjuste.reduce((sum, a) => sum + a.haber, 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button className="px-4 py-2 bg-fog text-graphite rounded-card hover:bg-fog transition-colors">
            Editar Asientos
          </button>
          <button className="px-4 py-2 bg-cobalt text-white rounded-card hover:bg-cobalt transition-colors">
            Aprobar Todos
          </button>
        </div>
      </div>
    </div>
  );

  const renderDepreciaciones = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-card p-6">
        <h3 className="text-xl font-semibold text-ink mb-4 flex items-center">
          <span className="text-2xl mr-2"></span>
          Depreciación de Activos Fijos
        </h3>
        <p className="text-graphite mb-6">Calcule y registre la depreciación del periodo para los activos fijos.</p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-paper">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-semibold text-graphite">Código</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-graphite">Activo</th>
                <th className="px-3 py-3 text-right text-sm font-semibold text-graphite">Valor Inicial</th>
                <th className="px-3 py-3 text-right text-sm font-semibold text-graphite">Dep. Acumulada</th>
                <th className="px-3 py-3 text-right text-sm font-semibold text-graphite">Dep. Mes</th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-graphite">Vida Útil</th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-graphite">Años Rest.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {activos.map((activo) => (
                <tr key={activo.id} className="hover:bg-paper">
                  <td className="px-3 py-3 font-mono text-sm text-ink">{activo.codigo}</td>
                  <td className="px-3 py-3 text-sm text-graphite">{activo.nombre}</td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-ink">
                    {activo.valorInicial.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-ink">
                    {activo.valorDepreciado.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-verified font-semibold">
                    {activo.depreciacionMes.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-graphite">{activo.vidaUtil} años</td>
                  <td className="px-3 py-3 text-center text-sm text-graphite">{activo.anosRestantes} años</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-paper font-semibold">
              <tr>
                <td className="px-3 py-3" colSpan="4">TOTAL DEPRECIACIÓN DEL MES</td>
                <td className="px-3 py-3 text-right font-mono text-verified">
                  {activos.reduce((sum, a) => sum + a.depreciacionMes, 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 p-4 bg-copper-50 rounded-card border border-copper-100">
          <p className="text-sm text-copper">
            <span className="font-semibold">ℹ Nota:</span> La depreciación será registrada automáticamente con la fecha de cierre del periodo.
          </p>
        </div>
      </div>
    </div>
  );

  const renderConciliacionCxCCxP = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-card p-6">
        <h3 className="text-xl font-semibold text-ink mb-4 flex items-center">
          <span className="text-2xl mr-2"></span>
          Conciliación Cuentas por Cobrar / Pagar
        </h3>
        <p className="text-graphite mb-6">Valide la concordancia entre los saldos contables y los auxiliares.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CxC */}
          <div className="p-4 rounded-card border-2 border-fog bg-paper">
            <h4 className="text-lg font-semibold text-cobalt mb-4"> Cuentas por Cobrar</h4>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-graphite">Saldo Libros:</span>
                <span className="font-mono">{conciliacion.cxc.saldoLibro.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-graphite">Saldo Auxiliar:</span>
                <span className="font-mono">{conciliacion.cxc.saldoAuxiliar.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-fog">
                <span className="text-graphite font-medium">Diferencia:</span>
                <span
                  className={`font-mono font-semibold ${
                    conciliacion.cxc.diferencia === 0 ? 'text-verified' : 'text-breach'
                  }`}
                >
                  {conciliacion.cxc.diferencia.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm font-semibold text-graphite mb-2">Items en discrepancia:</p>
              {conciliacion.cxc.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-graphite">{item.tipo}</span>
                  <span className={`font-mono ${item.monto < 0 ? 'text-breach' : 'text-verified'}`}>
                    {item.monto.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CxP */}
          <div className="p-4 rounded-card border-2 border-fog bg-paper">
            <h4 className="text-lg font-semibold text-cobalt mb-4"> Cuentas por Pagar</h4>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-graphite">Saldo Libros:</span>
                <span className="font-mono">{conciliacion.cxp.saldoLibro.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-graphite">Saldo Auxiliar:</span>
                <span className="font-mono">{conciliacion.cxp.saldoAuxiliar.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-fog">
                <span className="text-graphite font-medium">Diferencia:</span>
                <span
                  className={`font-mono font-semibold ${
                    conciliacion.cxp.diferencia === 0 ? 'text-verified' : 'text-breach'
                  }`}
                >
                  {conciliacion.cxp.diferencia.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm font-semibold text-graphite mb-2">Items en discrepancia:</p>
              {conciliacion.cxp.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-graphite">{item.tipo}</span>
                  <span className={`font-mono ${item.monto < 0 ? 'text-breach' : 'text-verified'}`}>
                    {item.monto.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeneracionEstados = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-card p-6">
        <h3 className="text-xl font-semibold text-ink mb-4 flex items-center">
          <span className="text-2xl mr-2"></span>
          Vista Previa de Estados Financieros
        </h3>
        <p className="text-graphite mb-6">Revise los estados financieros generados para el periodo.</p>

        {/* Balance General */}
        <div className="mb-6 p-4 bg-paper rounded-card">
          <h4 className="text-lg font-semibold text-ink mb-4"> Balance General</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-card text-center">
              <p className="text-sm text-graphite mb-1">Activo Total</p>
              <p className="text-2xl font-semibold text-cobalt">
                {estadosPreview.balance.activoTotal.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-card text-center">
              <p className="text-sm text-graphite mb-1">Pasivo Total</p>
              <p className="text-2xl font-semibold text-breach">
                {estadosPreview.balance.pasivoTotal.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-card text-center">
              <p className="text-sm text-graphite mb-1">Patrimonio</p>
              <p className="text-2xl font-semibold text-verified">
                {estadosPreview.balance.patrimonio.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
              </p>
            </div>
          </div>
        </div>

        {/* Estado de Resultados */}
        <div className="mb-6 p-4 bg-paper rounded-card">
          <h4 className="text-lg font-semibold text-ink mb-4"> Estado de Resultados</h4>
          <div className="bg-white p-4 rounded-card">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-fog">
                <span className="text-graphite">Ventas</span>
                <span className="font-mono font-semibold">
                  {estadosPreview.resultados.ventas.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-fog">
                <span className="text-graphite">Costos</span>
                <span className="font-mono text-breach">
                  -{estadosPreview.resultados.costos.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-fog font-semibold">
                <span className="text-graphite">Utilidad Bruta</span>
                <span className="font-mono text-verified">
                  {estadosPreview.resultados.utilidadBruta.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-fog">
                <span className="text-graphite">Gastos Operativos</span>
                <span className="font-mono text-breach">
                  -{estadosPreview.resultados.gastosOperativos.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
              <div className="flex justify-between py-3 bg-verified-50 px-2 rounded font-semibold">
                <span className="text-verified">Utilidad Neta</span>
                <span className="font-mono text-verified">
                  {estadosPreview.resultados.utilidadNeta.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ratios */}
        <div className="p-4 bg-paper rounded-card">
          <h4 className="text-lg font-semibold text-ink mb-4"> Ratios Financieros</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-card text-center">
              <p className="text-xs text-slate mb-1">Liquidez</p>
              <p className="text-xl font-semibold text-cobalt">{estadosPreview.ratios.liquidez.toFixed(2)}</p>
            </div>
            <div className="bg-white p-3 rounded-card text-center">
              <p className="text-xs text-slate mb-1">Endeudamiento</p>
              <p className="text-xl font-semibold text-copper">{(estadosPreview.ratios.endeudamiento * 100).toFixed(0)}%</p>
            </div>
            <div className="bg-white p-3 rounded-card text-center">
              <p className="text-xs text-slate mb-1">ROA</p>
              <p className="text-xl font-semibold text-verified">{(estadosPreview.ratios.roa * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white p-3 rounded-card text-center">
              <p className="text-xs text-slate mb-1">ROE</p>
              <p className="text-xl font-semibold text-cobalt">{(estadosPreview.ratios.roe * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCierreAprobacion = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-card p-6">
        <h3 className="text-xl font-semibold text-ink mb-4 flex items-center">
          <span className="text-2xl mr-2"></span>
          Cierre y Aprobación del Periodo
        </h3>
        <p className="text-graphite mb-6">Revise el resumen del cierre antes de finalizar el periodo.</p>

        {!cerrado ? (
          <>
            {/* Resumen del Cierre */}
            <div className="mb-6 p-4 bg-paper rounded-card">
              <h4 className="text-lg font-semibold text-ink mb-4"> Resumen del Periodo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-card text-center">
                  <p className="text-2xl font-semibold text-cobalt">5</p>
                  <p className="text-xs text-graphite">Validaciones OK</p>
                </div>
                <div className="bg-white p-3 rounded-card text-center">
                  <p className="text-2xl font-semibold text-verified">4</p>
                  <p className="text-xs text-graphite">Asientos de Ajuste</p>
                </div>
                <div className="bg-white p-3 rounded-card text-center">
                  <p className="text-2xl font-semibold text-copper">4</p>
                  <p className="text-xs text-graphite">Activos Depreciados</p>
                </div>
              </div>
            </div>

            {/* Checklist Final */}
            <div className="mb-6 space-y-2">
              <h4 className="text-lg font-semibold text-ink mb-3">✓ Checklist de Cierre</h4>
              <label className="flex items-center space-x-3 p-3 bg-verified-50 rounded-card cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-verified rounded" />
                <span className="text-graphite">Todas las validaciones preliminares completadas</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-verified-50 rounded-card cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-verified rounded" />
                <span className="text-graphite">Asientos de ajuste revisados y aprobados</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-verified-50 rounded-card cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-verified rounded" />
                <span className="text-graphite">Depreciaciones calculadas y registradas</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-verified-50 rounded-card cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-verified rounded" />
                <span className="text-graphite">Conciliación CxC/CxP validada</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-paper rounded-card cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-cobalt rounded" />
                <span className="text-graphite">Confirmo que los estados financieros son correctos</span>
              </label>
            </div>

            {/* Botón de Cierre */}
            <div className="flex justify-center">
              <button
                onClick={handleCerrarPeriodo}
                disabled={cerrando}
                className={`px-8 py-4 rounded-card font-semibold text-lg transition-all duration-200 ${
                  cerrando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-verified hover:bg-verified hover:scale-105 text-white '
                }`}
              >
                {cerrando ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando Cierre...
                  </span>
                ) : (
                  ' CERRAR PERIODO CONTABLE'
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-verified-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✓</span>
            </div>
            <h4 className="text-2xl font-semibold text-verified mb-2">¡Periodo Cerrado Exitosamente!</h4>
            <p className="text-graphite mb-6">El periodo contable ha sido cerrado y los estados financieros han sido generados.</p>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-2 bg-cobalt text-white rounded-card hover:bg-cobalt transition-colors">
                Descargar Estados Financieros
              </button>
              <button className="px-6 py-2 bg-fog text-graphite rounded-card hover:bg-fog transition-colors">
                Ver Reporte Completo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderValidacionPreliminar();
      case 2:
        return renderAsientosAjuste();
      case 3:
        return renderDepreciaciones();
      case 4:
        return renderConciliacionCxCCxP();
      case 5:
        return renderGeneracionEstados();
      case 6:
        return renderCierreAprobacion();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-paper py-8 px-4">
      <div className="">
        {/* Header */}
        <div className="bg-white rounded-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Cierre contable</h1>
              <p className="text-graphite mt-1">Periodo: Abril 2026 | Empresa: Corporación Demo S.A.C.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate">Progreso</p>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-3 bg-fog rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cobalt transition-all duration-500"
                    style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-graphite">
                  {Math.round((completedSteps.length / steps.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-card p-6 mb-6">
          {renderStepIndicator()}
        </div>

        {/* Content */}
        {renderCurrentStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-card font-semibold transition-all duration-200 ${
              currentStep === 1
                ? 'bg-fog text-slate cursor-not-allowed'
                : 'bg-graphite text-white hover:bg-graphite'
            }`}
          >
            ← Anterior
          </button>

          <div className="flex space-x-3">
            <button className="px-6 py-3 bg-fog text-graphite rounded-card font-semibold hover:bg-fog transition-colors">
               Guardar Progreso
            </button>
            {currentStep < steps.length && (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-cobalt text-white rounded-card font-semibold hover:bg-cobalt transition-colors"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CierreWizard;
