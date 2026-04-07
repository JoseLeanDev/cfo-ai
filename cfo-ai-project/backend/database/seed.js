const db = require('./connection');

// ============================================
// CONFIGURACIÓN EMPRESARIAL REALISTA
// ============================================
const EMPRESA = {
  nombre: 'Distribuidora Industrial Centroamericana, S.A.',
  nit: '1234567-8',
  direccion: 'Calzada Roosevelt 34-45, Zona 11, Guatemala',
  telefono: '+502 2320-4500',
  email: 'admin@dicsa.com.gt',
  industria: 'Distribución mayorista',
  empleados: 45
};

// Catalogo de clientes realistas
const CLIENTES = [
  { nombre: 'Supermercados La Bodeguita, S.A.', credito: 500000, terminos: 30 },
  { nombre: 'Corporación El Sol, S.A.', credito: 750000, terminos: 45 },
  { nombre: 'Tiendas El Mercado, S.A.', credito: 400000, terminos: 30 },
  { nombre: 'Abarrotería Central, S.A.', credito: 300000, terminos: 15 },
  { nombre: 'Cafetería El Buen Café', credito: 75000, terminos: 15 },
  { nombre: 'Restaurante Los 3 Tiempos', credito: 120000, terminos: 15 },
  { nombre: 'Hotel Casa Grande', credito: 200000, terminos: 30 },
  { nombre: 'Farmacias del Pueblo', credito: 350000, terminos: 30 },
  { nombre: 'Dist. Bebidas del Sur', credito: 280000, terminos: 30 },
  { nombre: 'Comercial El Triunfo', credito: 180000, terminos: 15 },
  { nombre: 'Minisúper La Esquina', credito: 45000, terminos: 7 },
  { nombre: 'Puesto de Flores María', credito: 25000, terminos: 7 },
  { nombre: 'Tienda La Bendición', credito: 60000, terminos: 15 },
  { nombre: 'Despensa Familiar', credito: 85000, terminos: 15 },
  { nombre: 'Comercial Santa Clara', credito: 150000, terminos: 30 },
];

// Catalogo de proveedores
const PROVEEDORES = [
  { nombre: 'Importadora Centroamericana, S.A.', terminos: '2/10 n/30', descuento: '2%' },
  { nombre: 'Industrias La Constancia, S.A.', terminos: 'n/30', descuento: null },
  { nombre: 'Papelera Nacional, S.A.', terminos: '1/15 n/45', descuento: '1%' },
  { nombre: 'Transportes del Sur, S.A.', terminos: 'contado', descuento: null },
  { nombre: 'Servicios Eléctricos de Guatemala', terminos: 'n/15', descuento: null },
  { nombre: 'Telefónica Guatemala, S.A.', terminos: 'n/15', descuento: null },
  { nombre: 'Agua y Saneamiento, S.A.', terminos: 'n/15', descuento: null },
  { nombre: 'Alquileres Metropolitanos', terminos: 'n/5', descuento: null },
  { nombre: 'Seguros El Roble, S.A.', terminos: 'n/30', descuento: null },
  { nombre: 'Seguridad Privada Orion', terminos: 'n/15', descuento: null },
  { nombre: 'Mantenimiento Industrial GT', terminos: 'n/15', descuento: null },
  { nombre: 'Suministros de Oficina G&T', terminos: 'n/30', descuento: null },
  { nombre: 'Laboratorio de Análisis QMC', terminos: 'n/30', descuento: null },
  { nombre: 'Consultoría Financiera SIGMA', terminos: 'n/30', descuento: null },
  { nombre: 'Publicidad y Marketing 360°', terminos: 'n/15', descuento: null },
];

// Cuentas bancarias
const CUENTAS_BANCARIAS = [
  { banco: 'Banco Industrial', tipo: 'monetaria', numero: '019-012345-6', saldo: 1250000, moneda: 'GTQ' },
  { banco: 'Banco G&T Continental', tipo: 'monetaria', numero: '045-098765-4', saldo: 875000, moneda: 'GTQ' },
  { banco: 'BAC Credomatic', tipo: 'monetaria', numero: '789-456123-0', saldo: 520000, moneda: 'GTQ' },
  { banco: 'Banco Agromercantil', tipo: 'ahorro', numero: '156-789234-1', saldo: 185000, moneda: 'USD' },
  { banco: 'Banco Promerica', tipo: 'plazo_fijo', numero: '267-345678-9', saldo: 450000, moneda: 'GTQ' },
  { banco: 'Ficohsa Guatemala', tipo: 'monetaria', numero: '378-567890-2', saldo: 320000, moneda: 'GTQ' },
];

// Helper functions
const formatDate = (date) => date.toISOString().split('T')[0];
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const seedData = async () => {
  console.log('🌱 INICIANDO CARGA DE DATOS EMPRESARIALES...\n');
  const startTime = Date.now();

  // ============================================
  // 1. EMPRESA
  // ============================================
  console.log('🏢 Creando empresa...');
  let empresaId;
  
  // Verificar si la empresa ya existe
  const existingEmpresa = await db.getAsync('SELECT id FROM empresas WHERE nit = ?', [EMPRESA.nit]);
  if (existingEmpresa) {
    empresaId = existingEmpresa.id;
    console.log(`   ℹ️ Empresa ya existe (ID: ${empresaId}), usando existente`);
  } else {
    const empresaResult = await db.runAsync(`
      INSERT INTO empresas (nombre, nit, direccion, telefono, email)
      VALUES (?, ?, ?, ?, ?)
    `, [EMPRESA.nombre, EMPRESA.nit, EMPRESA.direccion, EMPRESA.telefono, EMPRESA.email]);
    empresaId = empresaResult.id;
    console.log(`   ✅ ${EMPRESA.nombre} (ID: ${empresaId})`);
  }

  // ============================================
  // 2. CUENTAS BANCARIAS
  // ============================================
  console.log('\n💳 Creando cuentas bancarias...');
  const hoy = new Date('2026-03-31');
  const fechaConciliacion = formatDate(addDays(hoy, -3));
  
  for (const cuenta of CUENTAS_BANCARIAS) {
    await db.runAsync(`
      INSERT INTO cuentas_bancarias 
      (empresa_id, banco, tipo, numero_cuenta, saldo, moneda, ultima_conciliacion, activa)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [empresaId, cuenta.banco, cuenta.tipo, cuenta.numero, cuenta.saldo, cuenta.moneda, fechaConciliacion]);
    console.log(`   ✅ ${cuenta.banco} - ${cuenta.moneda} ${cuenta.saldo.toLocaleString()}`);
  }

  // ============================================
  // 3. CUENTAS POR COBRAR (CxC) - 45 documentos
  // ============================================
  console.log('\n📄 Creando Cuentas por Cobrar (45 documentos)...');
  
  let cxcStats = { total: 0, al_corriente: 0, atrasadas: 0, cobradas: 0 };
  
  // Documentos al corriente (15)
  for (let i = 0; i < 15; i++) {
    const cliente = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
    const monto = Math.floor(Math.random() * 45000) + 5000;
    const diasCredito = cliente.terminos;
    const fechaEmision = addDays(hoy, -Math.floor(Math.random() * (diasCredito - 5)));
    const fechaVencimiento = addDays(fechaEmision, diasCredito);
    const diasAtraso = Math.max(0, Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24)));
    const factura = `F-${2026}${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    await db.runAsync(`
      INSERT INTO cuentas_cobrar 
      (empresa_id, cliente, factura, monto, fecha_emision, fecha_vencimiento, dias_atraso, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [empresaId, cliente.nombre, factura, monto, formatDate(fechaEmision), formatDate(fechaVencimiento), diasAtraso, 'al_corriente']);
    
    cxcStats.total += monto;
    cxcStats.al_corriente += monto;
  }
  
  // Documentos atrasadas 1-30 días (12)
  for (let i = 0; i < 12; i++) {
    const cliente = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
    const monto = Math.floor(Math.random() * 65000) + 15000;
    const diasAtraso = Math.floor(Math.random() * 30) + 1;
    const fechaVencimiento = addDays(hoy, -diasAtraso);
    const fechaEmision = addDays(fechaVencimiento, -30);
    const factura = `F-${2026}${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    await db.runAsync(`
      INSERT INTO cuentas_cobrar 
      (empresa_id, cliente, factura, monto, fecha_emision, fecha_vencimiento, dias_atraso, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [empresaId, cliente.nombre, factura, monto, formatDate(fechaEmision), formatDate(fechaVencimiento), diasAtraso, 'atrasada']);
    
    cxcStats.total += monto;
    cxcStats.atrasadas += monto;
  }
  
  // Documentos atrasadas 31-60 días (10)
  for (let i = 0; i < 10; i++) {
    const cliente = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
    const monto = Math.floor(Math.random() * 85000) + 25000;
    const diasAtraso = Math.floor(Math.random() * 30) + 31;
    const fechaVencimiento = addDays(hoy, -diasAtraso);
    const fechaEmision = addDays(fechaVencimiento, -30);
    const factura = `F-${2026}${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    await db.runAsync(`
      INSERT INTO cuentas_cobrar 
      (empresa_id, cliente, factura, monto, fecha_emision, fecha_vencimiento, dias_atraso, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [empresaId, cliente.nombre, factura, monto, formatDate(fechaEmision), formatDate(fechaVencimiento), diasAtraso, 'atrasada']);
    
    cxcStats.total += monto;
    cxcStats.atrasadas += monto;
  }
  
  // Documentos atrasadas 60+ días (8)
  for (let i = 0; i < 8; i++) {
    const cliente = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
    const monto = Math.floor(Math.random() * 120000) + 40000;
    const diasAtraso = Math.floor(Math.random() * 60) + 61;
    const fechaVencimiento = addDays(hoy, -diasAtraso);
    const fechaEmision = addDays(fechaVencimiento, -30);
    const factura = `F-${2026}${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    await db.runAsync(`
      INSERT INTO cuentas_cobrar 
      (empresa_id, cliente, factura, monto, fecha_emision, fecha_vencimiento, dias_atraso, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [empresaId, cliente.nombre, factura, monto, formatDate(fechaEmision), formatDate(fechaVencimiento), diasAtraso, 'atrasada']);
    
    cxcStats.total += monto;
    cxcStats.atrasadas += monto;
  }
  
  console.log(`   ✅ Total CxC: Q${cxcStats.total.toLocaleString()}`);
  console.log(`      • Al corriente: Q${cxcStats.al_corriente.toLocaleString()}`);
  console.log(`      • Atrasadas: Q${cxcStats.atrasadas.toLocaleString()}`);

  // ============================================
  // 4. CUENTAS POR PAGAR (CxP) - 35 documentos
  // ============================================
  console.log('\n📑 Creando Cuentas por Pagar (35 documentos)...');
  
  let cxpStats = { total: 0, pendientes: 0, proximos: 0 };
  
  // Documentos vencidos (5)
  for (let i = 0; i < 5; i++) {
    const proveedor = PROVEEDORES[Math.floor(Math.random() * PROVEEDORES.length)];
    const monto = Math.floor(Math.random() * 80000) + 20000;
    const diasVencido = Math.floor(Math.random() * 20) + 5;
    const fechaVencimiento = addDays(hoy, -diasVencido);
    const fechaEmision = addDays(fechaVencimiento, -30);
    const factura = `NC-${2026}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    await db.runAsync(`
      INSERT INTO cuentas_pagar 
      (empresa_id, proveedor, factura, monto, fecha_emision, fecha_vencimiento, descuento_pronto_pago, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [empresaId, proveedor.nombre, factura, monto, formatDate(fechaEmision), formatDate(fechaVencimiento), proveedor.descuento, 'pendiente']);
    
    cxpStats.total += monto;
    cxpStats.pendientes += monto;
  }
  
  // Documentos próximos a vencer 1-15 días (15)
  for (let i = 0; i < 15; i++) {
    const proveedor = PROVEEDORES[Math.floor(Math.random() * PROVEEDORES.length)];
    const monto = Math.floor(Math.random() * 120000) + 30000;
    const diasRestantes = Math.floor(Math.random() * 15) + 1;
    const fechaVencimiento = addDays(hoy, diasRestantes);
    const fechaEmision = addDays(fechaVencimiento, -30);
    const factura = `NC-${2026}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    await db.runAsync(`
      INSERT INTO cuentas_pagar 
      (empresa_id, proveedor, factura, monto, fecha_emision, fecha_vencimiento, descuento_pronto_pago, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [empresaId, proveedor.nombre, factura, monto, formatDate(fechaEmision), formatDate(fechaVencimiento), proveedor.descuento, 'pendiente']);
    
    cxpStats.total += monto;
    cxpStats.pendientes += monto;
    cxpStats.proximos += monto;
  }
  
  // Documentos vencen en 16-45 días (15)
  for (let i = 0; i < 15; i++) {
    const proveedor = PROVEEDORES[Math.floor(Math.random() * PROVEEDORES.length)];
    const monto = Math.floor(Math.random() * 250000) + 50000;
    const diasRestantes = Math.floor(Math.random() * 30) + 16;
    const fechaVencimiento = addDays(hoy, diasRestantes);
    const fechaEmision = addDays(fechaVencimiento, -30);
    const factura = `NC-${2026}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    await db.runAsync(`
      INSERT INTO cuentas_pagar 
      (empresa_id, proveedor, factura, monto, fecha_emision, fecha_vencimiento, descuento_pronto_pago, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [empresaId, proveedor.nombre, factura, monto, formatDate(fechaEmision), formatDate(fechaVencimiento), proveedor.descuento, 'pendiente']);
    
    cxpStats.total += monto;
    cxpStats.pendientes += monto;
  }
  
  console.log(`   ✅ Total CxP: Q${cxpStats.total.toLocaleString()}`);
  console.log(`      • Próximos 15 días: Q${cxpStats.proximos.toLocaleString()}`);

  // ============================================
  // 5. TRANSACCIONES (6 meses de historia)
  // ============================================
  console.log('\n💰 Creando historial de transacciones (6 meses)...');
  
  const categoriasEntrada = [
    { cat: 'Ventas mayoristas', prob: 0.6, min: 25000, max: 125000 },
    { cat: 'Ventas minoristas', prob: 0.3, min: 5000, max: 35000 },
    { cat: 'Cobros CxC', prob: 0.5, min: 15000, max: 85000 },
    { cat: 'Intereses bancarios', prob: 0.1, min: 500, max: 3500 },
    { cat: 'Otros ingresos', prob: 0.05, min: 1000, max: 15000 },
  ];
  
  const categoriasSalida = [
    { cat: 'Compras inventario', prob: 0.5, min: 20000, max: 150000 },
    { cat: 'Nómina', prob: 0.25, min: 85000, max: 95000 },
    { cat: 'Servicios públicos', prob: 0.2, min: 8000, max: 25000 },
    { cat: 'Alquiler', prob: 0.08, min: 45000, max: 45000 },
    { cat: 'Marketing', prob: 0.1, min: 5000, max: 30000 },
    { cat: 'Transporte', prob: 0.15, min: 3000, max: 15000 },
    { cat: 'Mantenimiento', prob: 0.08, min: 5000, max: 35000 },
    { cat: 'Impuestos', prob: 0.05, min: 25000, max: 125000 },
    { cat: 'Seguros', prob: 0.03, min: 15000, max: 45000 },
    { cat: 'Pagos CxP', prob: 0.4, min: 15000, max: 75000 },
  ];
  
  let totalTransacciones = 0;
  let totalEntradas = 0;
  let totalSalidas = 0;
  
  // Generar 6 meses de transacciones
  for (let mes = 5; mes >= 0; mes--) {
    const mesBase = addMonths(hoy, -mes);
    const diasEnMes = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 0).getDate();
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(mesBase.getFullYear(), mesBase.getMonth(), dia);
      if (fecha > hoy) continue;
      
      // Días hábiles tienen más actividad
      const esDiaHabil = fecha.getDay() !== 0 && fecha.getDay() !== 6;
      const numTrans = esDiaHabil ? Math.floor(Math.random() * 4) + 3 : Math.floor(Math.random() * 2);
      
      for (let t = 0; t < numTrans; t++) {
        const esEntrada = Math.random() > 0.45; // 55% entradas
        
        if (esEntrada) {
          const cat = categoriasEntrada[Math.floor(Math.random() * categoriasEntrada.length)];
          if (Math.random() > cat.prob) continue;
          
          const monto = Math.floor(Math.random() * (cat.max - cat.min)) + cat.min;
          const descripcion = `${cat.cat} - ${formatDate(fecha)}`;
          
          await db.runAsync(`
            INSERT INTO transacciones (empresa_id, fecha, tipo, categoria, descripcion, monto)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [empresaId, formatDate(fecha), 'entrada', cat.cat, descripcion, monto]);
          
          totalEntradas += monto;
        } else {
          const cat = categoriasSalida[Math.floor(Math.random() * categoriasSalida.length)];
          if (Math.random() > cat.prob) continue;
          
          const monto = Math.floor(Math.random() * (cat.max - cat.min)) + cat.min;
          const descripcion = `${cat.cat} - ${formatDate(fecha)}`;
          
          await db.runAsync(`
            INSERT INTO transacciones (empresa_id, fecha, tipo, categoria, descripcion, monto)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [empresaId, formatDate(fecha), 'salida', cat.cat, descripcion, monto]);
          
          totalSalidas += monto;
        }
        
        totalTransacciones++;
      }
    }
  }
  
  console.log(`   ✅ ${totalTransacciones.toLocaleString()} transacciones creadas`);
  console.log(`      • Entradas: Q${totalEntradas.toLocaleString()}`);
  console.log(`      • Salidas: Q${totalSalidas.toLocaleString()}`);
  console.log(`      • Neto: Q${(totalEntradas - totalSalidas).toLocaleString()}`);

  // ============================================
  // 6. OBLIGACIONES SAT (2026)
  // ============================================
  console.log('\n📋 Creando obligaciones SAT 2026...');
  
  const obligacionesSAT = [
    // IVA Mensual
    { obligacion: 'Declaración IVA Enero 2026', formulario: 'SAT-2231', fecha: '2026-02-15', monto: 78500 },
    { obligacion: 'Declaración IVA Febrero 2026', formulario: 'SAT-2231', fecha: '2026-03-15', monto: 92300 },
    { obligacion: 'Declaración IVA Marzo 2026', formulario: 'SAT-2231', fecha: '2026-04-15', monto: 87500 },
    { obligacion: 'Declaración IVA Abril 2026', formulario: 'SAT-2231', fecha: '2026-05-15', monto: 0 },
    { obligacion: 'Declaración IVA Mayo 2026', formulario: 'SAT-2231', fecha: '2026-06-15', monto: 0 },
    { obligacion: 'Declaración IVA Junio 2026', formulario: 'SAT-2231', fecha: '2026-07-15', monto: 0 },
    
    // ISR Trimestral
    { obligacion: '1ra. Cuota ISR 2026 (Ene-Mar)', formulario: 'SAT-2221', fecha: '2026-03-31', monto: 125000 },
    { obligacion: '2da. Cuota ISR 2026 (Abr-Jun)', formulario: 'SAT-2221', fecha: '2026-06-30', monto: 0 },
    { obligacion: '3ra. Cuota ISR 2026 (Jul-Sep)', formulario: 'SAT-2221', fecha: '2026-09-30', monto: 0 },
    { obligacion: '4ta. Cuota ISR 2026 (Oct-Dic)', formulario: 'SAT-2221', fecha: '2026-12-31', monto: 0 },
    
    // IETU (si aplica)
    { obligacion: 'IETU 1er. Trimestre 2026', formulario: 'SAT-2225', fecha: '2026-03-31', monto: 0 },
    { obligacion: 'IETU 2do. Trimestre 2026', formulario: 'SAT-2225', fecha: '2026-06-30', monto: 0 },
    
    // Anual
    { obligacion: 'Declaración Anual ISR 2025', formulario: 'SAT-2101', fecha: '2026-03-31', monto: 245000 },
    { obligacion: 'Formulario Anual de Beneficiarios', formulario: 'SAT-2201', fecha: '2026-03-31', monto: 0 },
  ];
  
  let totalObligaciones = 0;
  for (const obl of obligacionesSAT) {
    const fechaVenc = new Date(obl.fecha);
    const estado = fechaVenc < hoy ? (obl.monto > 0 ? 'atrasada' : 'presentada') : 'pendiente';
    
    await db.runAsync(`
      INSERT INTO obligaciones_sat 
      (empresa_id, obligacion, formulario, fecha_vencimiento, monto_estimado, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [empresaId, obl.obligacion, obl.formulario, obl.fecha, obl.monto, estado]);
    
    if (estado !== 'presentada') totalObligaciones += obl.monto;
  }
  
  console.log(`   ✅ ${obligacionesSAT.length} obligaciones creadas`);
  console.log(`      • Monto pendiente: Q${totalObligaciones.toLocaleString()}`);

  // ============================================
  // 7. ASIENTOS CONTABLES (último mes + histórico)
  // ============================================
  console.log('\n📒 Creando asientos contables...');
  
  const cuentasContables = [
    { codigo: '1101', nombre: 'Bancos Monetarios' },
    { codigo: '1102', nombre: 'Bancos Ahorros' },
    { codigo: '1103', nombre: 'Inversiones Temporales' },
    { codigo: '1201', nombre: 'CxC Clientes' },
    { codigo: '1202', nombre: 'Documentos por Cobrar' },
    { codigo: '1301', nombre: 'Inventarios' },
    { codigo: '2101', nombre: 'CxP Proveedores' },
    { codigo: '2102', nombre: 'Documentos por Pagar' },
    { codigo: '2201', nombre: 'Préstamos Bancarios' },
    { codigo: '3101', nombre: 'Capital Social' },
    { codigo: '3201', nombre: 'Reservas' },
    { codigo: '4101', nombre: 'Ventas' },
    { codigo: '4201', nombre: 'Costo de Ventas' },
    { codigo: '5101', nombre: 'Gastos de Venta' },
    { codigo: '5201', nombre: 'Gastos Administrativos' },
  ];
  
  let numAsientos = 0;
  
  // Asientos contables (90 asientos individuales)
  let asientoCounter = 1;
  for (let i = 1; i <= 30; i++) {
    const fecha = addDays(hoy, -30 + i);
    
    // 3 asientos por día
    for (let a = 0; a < 3; a++) {
      const asientoId = `LD-${fecha.getFullYear()}${String(fecha.getMonth()+1).padStart(2,'0')}${String(fecha.getDate()).padStart(2,'0')}-${String(asientoCounter).padStart(4, '0')}`;
      
      // Cada asiento tiene par debe/haber
      const monto = Math.floor(Math.random() * 45000) + 5000;
      const cuentaDebe = cuentasContables[Math.floor(Math.random() * cuentasContables.length)];
      let cuentaHaber = cuentasContables[Math.floor(Math.random() * cuentasContables.length)];
      while (cuentaHaber.codigo === cuentaDebe.codigo) {
        cuentaHaber = cuentasContables[Math.floor(Math.random() * cuentasContables.length)];
      }
      
      // Insertar lado DEBE
      await db.runAsync(`
        INSERT OR IGNORE INTO asientos (empresa_id, asiento_id, fecha, cuenta_codigo, cuenta_nombre, descripcion, debe, haber)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `, [empresaId, asientoId, formatDate(fecha), cuentaDebe.codigo, cuentaDebe.nombre, `Asiento contable ${asientoId}`, monto]);
      
      // Insertar lado HABER  
      await db.runAsync(`
        INSERT OR IGNORE INTO asientos (empresa_id, asiento_id, fecha, cuenta_codigo, cuenta_nombre, descripcion, debe, haber)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `, [empresaId, `${asientoId}-H`, formatDate(fecha), cuentaHaber.codigo, cuentaHaber.nombre, `Contra-asiento ${asientoId}`, monto]);
      
      numAsientos++;
      asientoCounter++;
    }
  }
  
  console.log(`   ✅ ${numAsientos} asientos contables creados`);
  console.log(`      • Total movimientos: ~${numAsientos * 3}`);

  // ============================================
  // RESUMEN FINAL
  // ============================================
  const tiempoTotal = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ CARGA DE DATOS COMPLETADA EXITOSAMENTE');
  console.log('='.repeat(50));
  console.log(`\n📊 RESUMEN EJECUTIVO:`);
  console.log(`   Empresa: ${EMPRESA.nombre}`);
  console.log(`   NIT: ${EMPRESA.nit}`);
  console.log(`\n💰 POSICIÓN FINANCIERA:`);
  console.log(`   • Disponible bancario: Q${CUENTAS_BANCARIAS.filter(c => c.moneda === 'GTQ').reduce((a, c) => a + c.saldo, 0).toLocaleString()} + $${CUENTAS_BANCARIAS.filter(c => c.moneda === 'USD').reduce((a, c) => a + c.saldo, 0).toLocaleString()}`);
  console.log(`   • CxC Total: Q${cxcStats.total.toLocaleString()}`);
  console.log(`   • CxP Total: Q${cxpStats.total.toLocaleString()}`);
  console.log(`   • Working Capital: Q${(cxcStats.total - cxpStats.total).toLocaleString()}`);
  console.log(`\n📈 OPERACIÓN 6 MESES:`);
  console.log(`   • Ingresos: Q${totalEntradas.toLocaleString()}`);
  console.log(`   • Egresos: Q${totalSalidas.toLocaleString()}`);
  console.log(`   • Margen operativo: ${((totalEntradas - totalSalidas) / totalEntradas * 100).toFixed(1)}%`);
  console.log(`\n⚠️  ALERTAS ACTIVAS:`);
  console.log(`   • CxC vencido: Q${cxcStats.atrasadas.toLocaleString()} (${((cxcStats.atrasadas/cxcStats.total)*100).toFixed(1)}%)`);
  console.log(`   • Obligaciones SAT pendientes: ${obligacionesSAT.filter(o => o.monto > 0 && new Date(o.fecha) >= hoy).length}`);
  console.log(`\n⏱️  Tiempo total: ${tiempoTotal}s`);
  console.log('='.repeat(50));
};

// Ejecutar
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('\n🎉 DEMO LISTO PARA PRESENTACIÓN A CLIENTES\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error en seed:', err);
      process.exit(1);
    });
}

module.exports = { seedData };
