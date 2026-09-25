import React, { useState, useMemo } from 'react';

const ConciliacionBancaria = () => {
  // Estados principales
  const [banco] = useState('Banco Santander');
  const [mesAnio] = useState('Marzo 2026');
  const [estado, setEstado] = useState('pendiente'); // pendiente, en_proceso, completada

  // Saldos
  const [saldoContable, setSaldoContable] = useState(125000.00);
  const [saldoEstadoCuenta, setSaldoEstadoCuenta] = useState('');

  // Diferencias
  const [diferencias, setDiferencias] = useState([
    { id: 1, tipo: 'Cheque en tránsito', fecha: '2026-03-28', monto: 5000.00, descripcion: 'Cheque #1234 no cobrado' },
    { id: 2, tipo: 'Depósito pendiente', fecha: '2026-03-30', monto: -3500.00, descripcion: 'Depósito en tránsito' },
  ]);

  // Modal de agregar diferencia
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaDiferencia, setNuevaDiferencia] = useState({
    tipo: '',
    fecha: '',
    monto: '',
    descripcion: ''
  });

  // PDF
  const [pdfSubido, setPdfSubido] = useState(null);

  // Cálculo de diferencia total
  const diferenciaCalculada = useMemo(() => {
    const saldoEC = parseFloat(saldoEstadoCuenta) || 0;
    const totalDiferencias = diferencias.reduce((sum, diff) => sum + diff.monto, 0);
    return saldoContable - saldoEC - totalDiferencias;
  }, [saldoContable, saldoEstadoCuenta, diferencias]);

  // Handlers
  const handleSubirPDF = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfSubido(file);
      // Aquí se procesaría el PDF
    }
  };

  const handleAgregarDiferencia = () => {
    if (nuevaDiferencia.tipo && nuevaDiferencia.fecha && nuevaDiferencia.monto) {
      const diferencia = {
        id: Date.now(),
        tipo: nuevaDiferencia.tipo,
        fecha: nuevaDiferencia.fecha,
        monto: parseFloat(nuevaDiferencia.monto),
        descripcion: nuevaDiferencia.descripcion
      };
      setDiferencias([...diferencias, diferencia]);
      setNuevaDiferencia({ tipo: '', fecha: '', monto: '', descripcion: '' });
      setMostrarModal(false);
    }
  };

  const handleEliminarDiferencia = (id) => {
    setDiferencias(diferencias.filter(d => d.id !== id));
  };

  const handleGenerarAsiento = () => {
    alert('Generando asiento de ajuste...');
    // Aquí se implementaría la lógica para generar el asiento
  };

  const handleCompletarConciliacion = () => {
    if (Math.abs(diferenciaCalculada) > 0.01) {
      alert('No se puede completar: existe diferencia pendiente');
      return;
    }
    setEstado('completada');
    alert('¡Conciliación completada exitosamente!');
  };

  // Renderizar estado con color
  const renderEstado = () => {
    const estados = {
      pendiente: { color: 'bg-copper-50 text-copper', label: 'Pendiente' },
      en_proceso: { color: 'bg-paper text-cobalt', label: 'En Proceso' },
      completada: { color: 'bg-verified-50 text-verified', label: 'Completada' }
    };
    const config = estados[estado];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="">
        {/* Header */}
        <div className="bg-white rounded-card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">{banco}</h1>
              <p className="text-slate mt-1">{mesAnio}</p>
            </div>
            <div className="flex items-center gap-4">
              {renderEstado()}
              <label className="cursor-pointer bg-cobalt hover:bg-cobalt text-white px-4 py-2 rounded-card font-medium transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {pdfSubido ? 'Cambiar PDF' : 'Subir Estado de Cuenta'}
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={handleSubirPDF}
                />
              </label>
            </div>
          </div>
          {pdfSubido && (
            <p className="text-sm text-verified mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              PDF cargado: {pdfSubido.name}
            </p>
          )}
        </div>

        {/* Cards de Saldos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Saldo Contable */}
          <div className="bg-white rounded-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate">Saldo Contable</h3>
              <div className="bg-paper p-2 rounded-card">
                <svg className="w-5 h-5 text-cobalt" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 3.666V14m-3.667 3.333h7.334c.644 0 1.167-.522 1.167-1.167V8.167c0-.644-.523-1.167-1.167-1.167H8.833c-.644 0-1.167.523-1.167 1.167v8.333c0 .645.523 1.167 1.167 1.167z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-semibold text-ink">
              ${saldoContable.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate mt-1">Según libros contables</p>
          </div>

          {/* Estado de Cuenta */}
          <div className="bg-white rounded-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate">Estado de Cuenta</h3>
              <div className="bg-paper p-2 rounded-card">
                <svg className="w-5 h-5 text-cobalt" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <input
              type="number"
              value={saldoEstadoCuenta}
              onChange={(e) => setSaldoEstadoCuenta(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-semibold text-ink border-b-2 border-fog focus:border-cobalt outline-none bg-transparent py-1"
            />
            <p className="text-xs text-slate mt-1">Ingrese saldo del banco</p>
          </div>

          {/* Diferencia */}
          <div className={`rounded-card p-6 ${Math.abs(diferenciaCalculada) < 0.01 ? 'bg-verified-50 border border-verified-100' : 'bg-breach-50 border border-breach-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${Math.abs(diferenciaCalculada) < 0.01 ? 'text-verified' : 'text-breach'}`}>
                Diferencia
              </h3>
              <div className={`p-2 rounded-card ${Math.abs(diferenciaCalculada) < 0.01 ? 'bg-verified-50' : 'bg-breach-50'}`}>
                <svg className={`w-5 h-5 ${Math.abs(diferenciaCalculada) < 0.01 ? 'text-verified' : 'text-breach'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className={`text-2xl font-semibold ${Math.abs(diferenciaCalculada) < 0.01 ? 'text-verified' : 'text-breach'}`}>
              ${Math.abs(diferenciaCalculada).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-xs mt-1 ${Math.abs(diferenciaCalculada) < 0.01 ? 'text-verified' : 'text-breach'}`}>
              {Math.abs(diferenciaCalculada) < 0.01 ? 'Conciliado' : diferenciaCalculada > 0 ? 'Falta por justificar' : 'Sobregiro por justificar'}
            </p>
          </div>
        </div>

        {/* Tabla de Diferencias */}
        <div className="bg-white rounded-card mb-6">
          <div className="p-6 border-b border-fog">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Diferencias Identificadas</h2>
              <button
                onClick={() => setMostrarModal(true)}
                className="bg-cobalt hover:bg-cobalt text-white px-4 py-2 rounded-card font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Diferencia
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-paper">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {diferencias.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate">
                      No hay diferencias registradas. Haga clic en "Agregar Diferencia" para comenzar.
                    </td>
                  </tr>
                ) : (
                  diferencias.map((diff) => (
                    <tr key={diff.id} className="hover:bg-paper">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">{diff.tipo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate">{diff.fecha}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${diff.monto >= 0 ? 'text-breach' : 'text-verified'}`}>
                        {diff.monto >= 0 ? '+' : ''}${Math.abs(diff.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate">{diff.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEliminarDiferencia(diff.id)}
                          className="text-breach hover:text-breach transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-paper font-medium">
                <tr>
                  <td colSpan="2" className="px-6 py-3 text-right text-graphite">Total Diferencias:</td>
                  <td className="px-6 py-3 text-right text-ink">
                    ${diferencias.reduce((sum, d) => sum + d.monto, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleGenerarAsiento}
            disabled={diferencias.length === 0}
            className="bg-ink hover:bg-ink disabled:bg-fog disabled:cursor-not-allowed text-white px-6 py-3 rounded-card font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar Asiento de Ajuste
          </button>
          <button
            onClick={handleCompletarConciliacion}
            disabled={Math.abs(diferenciaCalculada) > 0.01 || estado === 'completada'}
            className="btn-primary flex-1 justify-center px-6 py-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completar Conciliación
          </button>
        </div>

        {/* Modal de Agregar Diferencia */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-ink bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-card max-w-md w-full">
              <div className="p-6 border-b border-fog">
                <h3 className="text-lg font-semibold text-ink">Agregar Diferencia</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-graphite mb-1">Tipo de Diferencia</label>
                  <select aria-label="Tipo de Diferencia"
                    value={nuevaDiferencia.tipo}
                    onChange={(e) => setNuevaDiferencia({...nuevaDiferencia, tipo: e.target.value})}
                    className="w-full border border-fog rounded-card px-3 py-2 focus:ring-2 focus:ring-cobalt focus:border-cobalt"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Cheque en tránsito">Cheque en tránsito</option>
                    <option value="Depósito pendiente">Depósito pendiente</option>
                    <option value="Cargo no registrado">Cargo no registrado</option>
                    <option value="Abono no registrado">Abono no registrado</option>
                    <option value="Error en registro">Error en registro</option>
                    <option value="Comisión bancaria">Comisión bancaria</option>
                    <option value="Intereses ganados">Intereses ganados</option>
                    <option value="Nota de crédito">Nota de crédito</option>
                    <option value="Nota de débito">Nota de débito</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite mb-1">Fecha</label>
                  <input
                    type="date"
                    value={nuevaDiferencia.fecha}
                    onChange={(e) => setNuevaDiferencia({...nuevaDiferencia, fecha: e.target.value})}
                    className="w-full border border-fog rounded-card px-3 py-2 focus:ring-2 focus:ring-cobalt focus:border-cobalt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite mb-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevaDiferencia.monto}
                    onChange={(e) => setNuevaDiferencia({...nuevaDiferencia, monto: e.target.value})}
                    placeholder="Use positivo para sumar, negativo para restar"
                    className="w-full border border-fog rounded-card px-3 py-2 focus:ring-2 focus:ring-cobalt focus:border-cobalt"
                  />
                  <p className="text-xs text-slate mt-1">Positivo: Aumenta el saldo contable | Negativo: Disminuye el saldo contable</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-graphite mb-1">Descripción</label>
                  <textarea
                    value={nuevaDiferencia.descripcion}
                    onChange={(e) => setNuevaDiferencia({...nuevaDiferencia, descripcion: e.target.value})}
                    rows="2"
                    placeholder="Descripción detallada de la diferencia..."
                    className="w-full border border-fog rounded-card px-3 py-2 focus:ring-2 focus:ring-cobalt focus:border-cobalt"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-fog flex gap-3 justify-end">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 text-graphite hover:bg-paper rounded-card transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarDiferencia}
                  className="bg-cobalt hover:bg-cobalt text-white px-4 py-2 rounded-card transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConciliacionBancaria;
