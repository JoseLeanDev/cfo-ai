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

  // Estado para el paso 4: Conciliación Bancaria
  const [cuentasBancarias, setCuentasBancarias] = useState([
    { id: 1, banco: 'Banco de Crédito', cuenta: '194-1234567-0-55', saldoLibro: 125000.50, saldoBanco: 124500.00, diferencia: 500.50, estado: 'conciliado' },
    { id: 2, banco: 'BBVA Continental', cuenta: '0011-0123-4567890123', saldoLibro: 87500.00, saldoBanco: 88000.00, diferencia: -500.00, estado: 'pendiente' },
    { id: 3, banco: 'Scotiabank', cuenta: '009-1234567', saldoLibro: 45000.00, saldoBanco: 45000.00, diferencia: 0, estado: 'conciliado' },
  ]);

  // Estado para el paso 5: Conciliación CxC/CxP
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

  // Estado para el paso 6: Estados Financieros
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

  // Estado para el paso 7: Resumen
  const [cerrando, setCerrando] = useState(false);
  const [cerrado, setCerrado] = useState(false);

  const steps = [
    { id: 1, nombre: 'Validación Preliminar', icono: '✓' },
    { id: 2, nombre: 'Asientos de Ajuste', icono: '📝' },
    { id: 3, nombre: 'Depreciaciones', icono: '🏭' },
    { id: 4, nombre: 'Conciliación Bancaria', icono: '🏦' },
    { id: 5, nombre: 'Conciliación CxC/CxP', icono: '🔄' },
    { id: 6, nombre: 'Generación de Estados', icono: '📊' },
    { id: 7, nombre: 'Cierre y Aprobación', icono: '🔒' },
  ];

  const handleNext = () => {
    if (currentStep < 7) {
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
      setCompletedSteps([...completedSteps, 7]);
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
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md transition-colors duration-200 ${
                completedSteps.includes(step.id)
                  ? 'bg-green-500 text-white'
                  : currentStep === step.id
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {completedSteps.includes(step.id) ? '✓' : step.icono}
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {step.nombre}
            </span>
          </button>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-1 mx-2 transition-colors duration-200 ${
                completedSteps.includes(step.id) ? 'bg-green-400' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderValidacionPreliminar = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">✓</span>
          Validación Preliminar del Periodo
        </h3>
        <p className="text-gray-600 mb-6">Revise las validaciones antes de proceder con el cierre del periodo.</p>
        
        <div className="space-y-3">
          {validaciones.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                item.estado === 'ok'
                  ? 'bg-green-50 border-green-500'
                  : item.estado === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                    item.estado === 'ok'
                      ? 'bg-green-500'
                      : item.estado === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                >
                  {item.estado === 'ok' ? '✓' : item.estado === 'warning' ? '!' : '✕'}
                </span>
                <span className="font-medium text-gray-800">{item.nombre}</span>
              </div>
              {item.mensaje && (
                <span
                  className={`text-sm font-medium ${
                    item.estado === 'warning' ? 'text-yellow-700' : 'text-red-700'
                  }`}
                >
                  {item.mensaje}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Resumen</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-2xl font-bold text-green-600">3</span>
              <p className="text-sm text-gray-600">Validaciones OK</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-yellow-600">1</span>
              <p className="text-sm text-gray-600">Advertencias</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-red-600">1</span>
              <p className="text-sm text-gray-600">Errores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAsientosAjuste = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">📝</span>
          Asientos de Ajuste Sugeridos
        </h3>
        <p className="text-gray-600 mb-6">Revise y apruebe los asientos de ajuste propuestos por el sistema.</p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cuenta</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Debe</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Haber</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {asientosAjuste.map((asiento) => (
                <tr key={asiento.id} className={asiento.sugerido ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3 font-mono text-sm text-gray-800">{asiento.cuenta}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{asiento.descripcion}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-gray-800">
                    {asiento.debe > 0 ? asiento.debe.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-gray-800">
                    {asiento.haber > 0 ? asiento.haber.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {asiento.sugerido && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Sugerido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3" colSpan="2">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono text-green-700">
                  {asientosAjuste.reduce((sum, a) => sum + a.debe, 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-green-700">
                  {asientosAjuste.reduce((sum, a) => sum + a.haber, 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
            Editar Asientos
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Aprobar Todos
          </button>
        </div>
      </div>
    </div>
  );

  const renderDepreciaciones = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">🏭</span>
          Depreciación de Activos Fijos
        </h3>
        <p className="text-gray-600 mb-6">Calcule y registre la depreciación del periodo para los activos fijos.</p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Activo</th>
                <th className="px-3 py-3 text-right text-sm font-semibold text-gray-700">Valor Inicial</th>
                <th className="px-3 py-3 text-right text-sm font-semibold text-gray-700">Dep. Acumulada</th>
                <th className="px-3 py-3 text-right text-sm font-semibold text-gray-700">Dep. Mes</th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">Vida Útil</th>
                <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700">Años Rest.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activos.map((activo) => (
                <tr key={activo.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-mono text-sm text-gray-800">{activo.codigo}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{activo.nombre}</td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-gray-800">
                    {activo.valorInicial.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-gray-800">
                    {activo.valorDepreciado.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-green-600 font-semibold">
                    {activo.depreciacionMes.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">{activo.vidaUtil} años</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">{activo.anosRestantes} años</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr>
                <td className="px-3 py-3" colSpan="4">TOTAL DEPRECIACIÓN DEL MES</td>
                <td className="px-3 py-3 text-right font-mono text-green-700">
                  {activos.reduce((sum, a) => sum + a.depreciacionMes, 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">ℹ️ Nota:</span> La depreciación será registrada automáticamente con la fecha de cierre del periodo.
          </p>
        </div>
      </div>
    </div>
  );

  const renderConciliacionBancaria = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">🏦</span>
          Conciliación Bancaria
        </h3>
        <p className="text-gray-600 mb-6">Verifique la conciliación de las cuentas bancarias.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {cuentasBancarias.map((cuenta) => (
            <div
              key={cuenta.id}
              className={`p-4 rounded-lg border-2 ${
                cuenta.estado === 'conciliado'
                  ? 'border-green-200 bg-green-50'
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{cuenta.banco}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cuenta.estado === 'conciliado'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {cuenta.estado === 'conciliado' ? '✓ Conciliado' : '⏳ Pendiente'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{cuenta.cuenta}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo Libros:</span>
                  <span className="font-mono">{cuenta.saldoLibro.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo Banco:</span>
                  <span className="font-mono">{cuenta.saldoBanco.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-700 font-medium">Diferencia:</span>
                  <span
                    className={`font-mono font-semibold ${
                      cuenta.diferencia === 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {cuenta.diferencia.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Estado General</h4>
          <div className="flex items-center justify-between">
            <div className="flex space-x-6">
              <div>
                <span className="text-2xl font-bold text-green-600">2</span>
                <p className="text-sm text-gray-600">Cuentas Conciliadas</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-yellow-600">1</span>
                <p className="text-sm text-gray-600">Cuentas Pendientes</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ver Detalle de Diferencias
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConciliacionCxCCxP = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">🔄</span>
          Conciliación Cuentas por Cobrar / Pagar
        </h3>
        <p className="text-gray-600 mb-6">Valide la concordancia entre los saldos contables y los auxiliares.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CxC */}
          <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
            <h4 className="text-lg font-bold text-blue-800 mb-4">📥 Cuentas por Cobrar</h4>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saldo Libros:</span>
                <span className="font-mono">{conciliacion.cxc.saldoLibro.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saldo Auxiliar:</span>
                <span className="font-mono">{conciliacion.cxc.saldoAuxiliar.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                <span className="text-gray-700 font-medium">Diferencia:</span>
                <span
                  className={`font-mono font-semibold ${
                    conciliacion.cxc.diferencia === 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {conciliacion.cxc.diferencia.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Items en discrepancia:</p>
              {conciliacion.cxc.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{item.tipo}</span>
                  <span className={`font-mono ${item.monto < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.monto.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CxP */}
          <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
            <h4 className="text-lg font-bold text-purple-800 mb-4">📤 Cuentas por Pagar</h4>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saldo Libros:</span>
                <span className="font-mono">{conciliacion.cxp.saldoLibro.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saldo Auxiliar:</span>
                <span className="font-mono">{conciliacion.cxp.saldoAuxiliar.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-purple-200">
                <span className="text-gray-700 font-medium">Diferencia:</span>
                <span
                  className={`font-mono font-semibold ${
                    conciliacion.cxp.diferencia === 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {conciliacion.cxp.diferencia.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Items en discrepancia:</p>
              {conciliacion.cxp.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{item.tipo}</span>
                  <span className={`font-mono ${item.monto < 0 ? 'text-red-600' : 'text-green-600'}`}>
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          Vista Previa de Estados Financieros
        </h3>
        <p className="text-gray-600 mb-6">Revise los estados financieros generados para el periodo.</p>

        {/* Balance General */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-bold text-gray-800 mb-4">📋 Balance General</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <p className="text-sm text-gray-600 mb-1">Activo Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {estadosPreview.balance.activoTotal.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <p className="text-sm text-gray-600 mb-1">Pasivo Total</p>
              <p className="text-2xl font-bold text-red-600">
                {estadosPreview.balance.pasivoTotal.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <p className="text-sm text-gray-600 mb-1">Patrimonio</p>
              <p className="text-2xl font-bold text-green-600">
                {estadosPreview.balance.patrimonio.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
              </p>
            </div>
          </div>
        </div>

        {/* Estado de Resultados */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-bold text-gray-800 mb-4">📈 Estado de Resultados</h4>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ventas</span>
                <span className="font-mono font-semibold">
                  {estadosPreview.resultados.ventas.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Costos</span>
                <span className="font-mono text-red-600">
                  -{estadosPreview.resultados.costos.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-gray-300 font-semibold">
                <span className="text-gray-700">Utilidad Bruta</span>
                <span className="font-mono text-green-600">
                  {estadosPreview.resultados.utilidadBruta.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Gastos Operativos</span>
                <span className="font-mono text-red-600">
                  -{estadosPreview.resultados.gastosOperativos.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
              <div className="flex justify-between py-3 bg-green-50 px-2 rounded font-bold">
                <span className="text-green-800">Utilidad Neta</span>
                <span className="font-mono text-green-700">
                  {estadosPreview.resultados.utilidadNeta.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ratios */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-bold text-gray-800 mb-4">📐 Ratios Financieros</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">Liquidez</p>
              <p className="text-xl font-bold text-blue-600">{estadosPreview.ratios.liquidez.toFixed(2)}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">Endeudamiento</p>
              <p className="text-xl font-bold text-yellow-600">{(estadosPreview.ratios.endeudamiento * 100).toFixed(0)}%</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">ROA</p>
              <p className="text-xl font-bold text-green-600">{(estadosPreview.ratios.roa * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">ROE</p>
              <p className="text-xl font-bold text-purple-600">{(estadosPreview.ratios.roe * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCierreAprobacion = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">🔒</span>
          Cierre y Aprobación del Periodo
        </h3>
        <p className="text-gray-600 mb-6">Revise el resumen del cierre antes de finalizar el periodo.</p>

        {!cerrado ? (
          <>
            {/* Resumen del Cierre */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-bold text-gray-800 mb-4">📋 Resumen del Periodo</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <p className="text-2xl font-bold text-blue-600">5</p>
                  <p className="text-xs text-gray-600">Validaciones OK</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <p className="text-2xl font-bold text-green-600">4</p>
                  <p className="text-xs text-gray-600">Asientos de Ajuste</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <p className="text-2xl font-bold text-yellow-600">4</p>
                  <p className="text-xs text-gray-600">Activos Depreciados</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <p className="text-2xl font-bold text-purple-600">3</p>
                  <p className="text-xs text-gray-600">Cuentas Conciliadas</p>
                </div>
              </div>
            </div>

            {/* Checklist Final */}
            <div className="mb-6 space-y-2">
              <h4 className="text-lg font-bold text-gray-800 mb-3">✓ Checklist de Cierre</h4>
              <label className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-green-600 rounded" />
                <span className="text-gray-700">Todas las validaciones preliminares completadas</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-green-600 rounded" />
                <span className="text-gray-700">Asientos de ajuste revisados y aprobados</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-green-600 rounded" />
                <span className="text-gray-700">Depreciaciones calculadas y registradas</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-green-600 rounded" />
                <span className="text-gray-700">Conciliaciones bancarias completadas</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked readOnly className="w-5 h-5 text-green-600 rounded" />
                <span className="text-gray-700">Conciliación CxC/CxP validada</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                <span className="text-gray-700">Confirmo que los estados financieros son correctos</span>
              </label>
            </div>

            {/* Botón de Cierre */}
            <div className="flex justify-center">
              <button
                onClick={handleCerrarPeriodo}
                disabled={cerrando}
                className={`px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                  cerrando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:scale-105 text-white shadow-lg'
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
                  '🔒 CERRAR PERIODO CONTABLE'
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✓</span>
            </div>
            <h4 className="text-2xl font-bold text-green-700 mb-2">¡Periodo Cerrado Exitosamente!</h4>
            <p className="text-gray-600 mb-6">El periodo contable ha sido cerrado y los estados financieros han sido generados.</p>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Descargar Estados Financieros
              </button>
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
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
        return renderConciliacionBancaria();
      case 5:
        return renderConciliacionCxCCxP();
      case 6:
        return renderGeneracionEstados();
      case 7:
        return renderCierreAprobacion();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🤖 CFO AI - Wizard de Cierre Contable</h1>
              <p className="text-gray-600 mt-1">Periodo: Abril 2026 | Empresa: Corporación Demo S.A.C.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Progreso</p>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${(completedSteps.length / 7) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {Math.round((completedSteps.length / 7) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {renderStepIndicator()}
        </div>

        {/* Content */}
        {renderCurrentStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            ← Anterior
          </button>
          
          <div className="flex space-x-3">
            <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
              💾 Guardar Progreso
            </button>
            {currentStep < 7 && (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
