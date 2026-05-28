// Datos de DEMO / Fallback para desarrollo
// Centralizados aquí para evitar hardcodear en componentes

export const demoClientesConcentracion = [
  { id: 1, nombre: 'Constructora Metropolitana', ingresos: 8500000 },
  { id: 2, nombre: 'Grupo Industrial Centroamericano', ingresos: 6200000 },
  { id: 3, nombre: 'Inversiones del Norte', ingresos: 4100000 },
  { id: 4, nombre: 'Distribuidora del Sur', ingresos: 2800000 },
  { id: 5, nombre: 'Comercializadora Maya', ingresos: 1900000 },
  { id: 6, nombre: 'Importadora del Pacífico', ingresos: 1500000 },
  { id: 7, nombre: 'Suministros Industriales', ingresos: 1200000 },
  { id: 8, nombre: 'Ferretería La Unión', ingresos: 800000 },
  { id: 9, nombre: 'Materiales de Construcción XYZ', ingresos: 650000 },
  { id: 10, nombre: 'Otros clientes', ingresos: 1200000 }
];

export const demoLibroDiario = [
  { asiento_id: 1, fecha: '2026-03-01', cuenta_codigo: '1101', cuenta_nombre: 'Caja', descripcion: 'Fondo inicial de caja', debe: 5000, haber: 0, documento: 'FI-001' },
  { asiento_id: 2, fecha: '2026-03-05', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Depósito de ventas', debe: 125000, haber: 0, documento: 'DEP-102' },
  { asiento_id: 3, fecha: '2026-03-05', cuenta_codigo: '4101', cuenta_nombre: 'Ventas', descripcion: 'Ventas del día', debe: 0, haber: 125000, documento: 'VTA-001' },
  { asiento_id: 4, fecha: '2026-03-10', cuenta_codigo: '1201', cuenta_nombre: 'Inventarios', descripcion: 'Compra de mercadería', debe: 45000, haber: 0, documento: 'COM-203' },
  { asiento_id: 4, fecha: '2026-03-10', cuenta_codigo: '2101', cuenta_nombre: 'Proveedores', descripcion: 'Compra a crédito', debe: 0, haber: 45000, documento: 'COM-203' },
  { asiento_id: 5, fecha: '2026-03-15', cuenta_codigo: '1104', cuenta_nombre: 'Cuentas por Cobrar', descripcion: 'Venta a crédito - Cliente XYZ', debe: 100000, haber: 0, documento: 'F001-0023' },
  { asiento_id: 5, fecha: '2026-03-15', cuenta_codigo: '4101', cuenta_nombre: 'Ventas', descripcion: 'Venta a crédito', debe: 0, haber: 100000, documento: 'F001-0023' },
  { asiento_id: 6, fecha: '2026-03-18', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Pago a Proveedor Alfa', debe: 0, haber: 30000, documento: 'CH-045' },
  { asiento_id: 6, fecha: '2026-03-18', cuenta_codigo: '2101', cuenta_nombre: 'Proveedores', descripcion: 'Pago a Proveedor Alfa', debe: 30000, haber: 0, documento: 'CH-045' },
  { asiento_id: 7, fecha: '2026-03-20', cuenta_codigo: '5103', cuenta_nombre: 'Alquiler', descripcion: 'Pago alquiler local comercial', debe: 15000, haber: 0, documento: 'REC-0320' },
  { asiento_id: 7, fecha: '2026-03-20', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Pago alquiler local comercial', debe: 0, haber: 15000, documento: 'REC-0320' },
  { asiento_id: 8, fecha: '2026-03-22', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Cobro a Cliente XYZ', debe: 50000, haber: 0, documento: 'DEP-215' },
  { asiento_id: 8, fecha: '2026-03-22', cuenta_codigo: '1104', cuenta_nombre: 'Cuentas por Cobrar', descripcion: 'Cobro parcial Cliente XYZ', debe: 0, haber: 50000, documento: 'DEP-215' },
  { asiento_id: 9, fecha: '2026-03-25', cuenta_codigo: '5102', cuenta_nombre: 'Servicios', descripcion: 'Electricidad y agua marzo', debe: 3584, haber: 0, documento: 'EEGSA-445' },
  { asiento_id: 9, fecha: '2026-03-25', cuenta_codigo: '1103', cuenta_nombre: 'Banco Industrial', descripcion: 'Electricidad y agua marzo', debe: 0, haber: 3584, documento: 'EEGSA-445' }
];

export const demoBancosConciliacion = [
  { banco: 'Banco Industrial', cuenta: 'Cuenta Corriente', diferencia: 0, dias: 1 },
  { banco: 'Banco G&T', cuenta: 'Cuenta de Ahorros', diferencia: 0, dias: 2 },
  { banco: 'BAC', cuenta: 'Cuenta Corriente USD', diferencia: 1250, dias: 5 },
];

export const demoCierreMensual = {
  mesActual: { mes: 'Marzo', ventas: 2850000, gastos: 2100000, utilidad: 750000 },
  mesAnterior: { mes: 'Febrero', ventas: 2650000, gastos: 2050000, utilidad: 600000 }
};

export const demoMesesCierre = [
  { id: 1, mes: 'Abril', año: 2025, estado: 'abierto', fechaCierre: null, progreso: 0 },
  { id: 2, mes: 'Marzo', año: 2025, estado: 'cerrado', fechaCierre: '2025-04-05', progreso: 100 },
  { id: 3, mes: 'Febrero', año: 2025, estado: 'cerrado', fechaCierre: '2025-03-03', progreso: 100 },
  { id: 4, mes: 'Enero', año: 2025, estado: 'cerrado', fechaCierre: '2025-02-04', progreso: 100 },
  { id: 5, mes: 'Diciembre', año: 2024, estado: 'cerrado', fechaCierre: '2025-01-03', progreso: 100 },
  { id: 6, mes: 'Noviembre', año: 2024, estado: 'cerrado', fechaCierre: '2024-12-02', progreso: 100 },
  { id: 7, mes: 'Octubre', año: 2024, estado: 'cerrado', fechaCierre: '2024-11-04', progreso: 100 },
  { id: 8, mes: 'Septiembre', año: 2024, estado: 'cerrado', fechaCierre: '2024-10-03', progreso: 100 },
  { id: 9, mes: 'Agosto', año: 2024, estado: 'cerrado', fechaCierre: '2024-09-02', progreso: 100 },
  { id: 10, mes: 'Julio', año: 2024, estado: 'cerrado', fechaCierre: '2024-08-02', progreso: 100 },
  { id: 11, mes: 'Junio', año: 2024, estado: 'cerrado', fechaCierre: '2024-07-03', progreso: 100 },
  { id: 12, mes: 'Mayo', año: 2024, estado: 'cerrado', fechaCierre: '2024-06-03', progreso: 100 },
];

export const demoAlertasCierre = [
  { id: 1, tipo: 'warning', mensaje: 'Ajuste de inventario requerido - Diferencia Q12,450', fecha: '2025-04-08' },
  { id: 2, tipo: 'error', mensaje: 'Conciliación bancaria pendiente - Marzo', fecha: '2025-04-05' },
  { id: 3, tipo: 'info', mensaje: 'Nuevos asientos requieren aprobación', count: 12 },
];

// ============================================
// DATOS DE COMPRAS INTELIGENTES
// ============================================

// Líneas de producto con historial de ventas (6 meses)
export const demoLineasProducto = [
  {
    id: 'ELEC-001',
    nombre: 'Eléctrico',
    descripcion: 'Cables, interruptores, focos, accesorios eléctricos',
    stockActual: 3420,
    stockMinimo: 1500,
    costoUnitarioPromedio: 285,
    historialVentas: [2840, 3120, 2980, 3450, 3620, 3890], // últimos 6 meses
    tendencia: 'up',
    margen: 32,
    proveedorPrincipal: 'Elektra Guatemala',
    tiempoEntregaDias: 7,
  },
  {
    id: 'PLOM-001',
    nombre: 'Plomería',
    descripcion: 'Tuberías, llaves de paso, conectores, sanitarios',
    stockActual: 1850,
    stockMinimo: 1200,
    costoUnitarioPromedio: 195,
    historialVentas: [1650, 1720, 1580, 1890, 2100, 2250],
    tendencia: 'up',
    margen: 28,
    proveedorPrincipal: 'Plomería Centroamericana',
    tiempoEntregaDias: 10,
  },
  {
    id: 'CONS-001',
    nombre: 'Construcción',
    descripcion: 'Cemento, láminas, varilla, arena, grava',
    stockActual: 420,
    stockMinimo: 800,
    costoUnitarioPromedio: 420,
    historialVentas: [850, 920, 780, 980, 890, 1020],
    tendencia: 'stable',
    margen: 18,
    proveedorPrincipal: 'Cementos Progreso',
    tiempoEntregaDias: 3,
  },
  {
    id: 'PINT-001',
    nombre: 'Pinturas',
    descripcion: 'Pinturas latex, esmaltes, solventes, brochas',
    stockActual: 1560,
    stockMinimo: 600,
    costoUnitarioPromedio: 310,
    historialVentas: [890, 950, 1100, 1050, 1200, 1350],
    tendencia: 'up',
    margen: 25,
    proveedorPrincipal: 'Pinturas Sherwin Williams',
    tiempoEntregaDias: 5,
  },
  {
    id: 'HERR-001',
    nombre: 'Herramientas',
    descripcion: 'Taladros, sierras, martillos, cintas métricas',
    stockActual: 680,
    stockMinimo: 400,
    costoUnitarioPromedio: 450,
    historialVentas: [420, 480, 510, 490, 580, 620],
    tendencia: 'up',
    margen: 35,
    proveedorPrincipal: 'Black & Decker Centroamérica',
    tiempoEntregaDias: 14,
  },
  {
    id: 'JARD-001',
    nombre: 'Jardinería',
    descripcion: 'Mangueras, aspersores, macetas, fertilizantes',
    stockActual: 2100,
    stockMinimo: 500,
    costoUnitarioPromedio: 125,
    historialVentas: [320, 380, 450, 520, 680, 890],
    tendencia: 'up',
    margen: 40,
    proveedorPrincipal: 'Garden Center GT',
    tiempoEntregaDias: 4,
  },
];

// Productos individuales con estado de stock detallado
export const demoProductosStock = [
  // Eléctrico
  { id: 1, nombre: 'Cable THW 12 AWG (Rollo 100m)', linea: 'Eléctrico', stock: 850, stockMin: 400, stockMax: 1200, costoUnitario: 180, ventaPromedioMensual: 420, tendencia: 'up', proveedor: 'Elektra Guatemala', diasEntrega: 7 },
  { id: 2, nombre: 'Interruptor Breaker 2P 30A', linea: 'Eléctrico', stock: 320, stockMin: 200, stockMax: 600, costoUnitario: 145, ventaPromedioMensual: 185, tendencia: 'up', proveedor: 'Elektra Guatemala', diasEntrega: 7 },
  { id: 3, nombre: 'Foco LED 9W (Caja 10 unds)', linea: 'Eléctrico', stock: 180, stockMin: 150, stockMax: 500, costoUnitario: 95, ventaPromedioMensual: 140, tendencia: 'up', proveedor: 'Elektra Guatemala', diasEntrega: 7 },
  { id: 4, nombre: 'Caja de Breakers 8 espacios', linea: 'Eléctrico', stock: 95, stockMin: 80, stockMax: 200, costoUnitario: 320, ventaPromedioMensual: 55, tendencia: 'stable', proveedor: 'Elektra Guatemala', diasEntrega: 7 },
  { id: 5, nombre: 'Cable THW 10 AWG (Rollo 100m)', linea: 'Eléctrico', stock: 420, stockMin: 250, stockMax: 800, costoUnitario: 240, ventaPromedioMensual: 210, tendencia: 'up', proveedor: 'Elektra Guatemala', diasEntrega: 7 },
  { id: 6, nombre: 'Tomacorriente duplex blanco', linea: 'Eléctrico', stock: 620, stockMin: 300, stockMax: 1000, costoUnitario: 35, ventaPromedioMensual: 280, tendencia: 'stable', proveedor: 'Elektra Guatemala', diasEntrega: 7 },
  { id: 7, nombre: 'Breakers 1P 20A', linea: 'Eléctrico', stock: 280, stockMin: 250, stockMax: 600, costoUnitario: 65, ventaPromedioMensual: 220, tendencia: 'up', proveedor: 'Elektra Guatemala', diasEntrega: 7 },
  { id: 8, nombre: 'Plafón LED 18W cuadrado', linea: 'Eléctrico', stock: 55, stockMin: 80, stockMax: 200, costoUnitario: 125, ventaPromedioMensual: 90, tendencia: 'up', proveedor: 'Elektra Guatemala', diasEntrega: 7 },
  // Plomería
  { id: 9, nombre: 'Tubo PVC 1/2" (Caja 20 unds)', linea: 'Plomería', stock: 480, stockMin: 300, stockMax: 800, costoUnitario: 85, ventaPromedioMensual: 260, tendencia: 'up', proveedor: 'Plomería Centroamericana', diasEntrega: 10 },
  { id: 10, nombre: 'Llave de Paso 1/2"', linea: 'Plomería', stock: 320, stockMin: 200, stockMax: 500, costoUnitario: 75, ventaPromedioMensual: 165, tendencia: 'stable', proveedor: 'Plomería Centroamericana', diasEntrega: 10 },
  { id: 11, nombre: 'Codo PVC 1/2" (Caja 50 unds)', linea: 'Plomería', stock: 290, stockMin: 250, stockMax: 600, costoUnitario: 45, ventaPromedioMensual: 180, tendencia: 'up', proveedor: 'Plomería Centroamericana', diasEntrega: 10 },
  { id: 12, nombre: 'Pegamento PVC 1/4 galón', linea: 'Plomería', stock: 180, stockMin: 150, stockMax: 400, costoUnitario: 55, ventaPromedioMensual: 95, tendencia: 'stable', proveedor: 'Plomería Centroamericana', diasEntrega: 10 },
  { id: 13, nombre: 'Tubo PVC 3/4" (Caja 15 unds)', linea: 'Plomería', stock: 220, stockMin: 200, stockMax: 500, costoUnitario: 110, ventaPromedioMensual: 145, tendencia: 'up', proveedor: 'Plomería Centroamericana', diasEntrega: 10 },
  { id: 14, nombre: 'Llave de chorro 1/2" cromada', linea: 'Plomería', stock: 85, stockMin: 100, stockMax: 250, costoUnitario: 165, ventaPromedioMensual: 75, tendencia: 'down', proveedor: 'Plomería Centroamericana', diasEntrega: 10 },
  { id: 15, nombre: 'Cementarropa 1/2" (Caja 25 unds)', linea: 'Plomería', stock: 150, stockMin: 120, stockMax: 350, costoUnitario: 35, ventaPromedioMensual: 85, tendencia: 'stable', proveedor: 'Plomería Centroamericana', diasEntrega: 10 },
  { id: 16, nombre: 'Sanitario blanco económico', linea: 'Plomería', stock: 45, stockMin: 60, stockMax: 150, costoUnitario: 420, ventaPromedioMensual: 40, tendencia: 'stable', proveedor: 'Plomería Centroamericana', diasEntrega: 10 },
  // Construcción
  { id: 17, nombre: 'Cemento Portland 42.5kg', linea: 'Construcción', stock: 120, stockMin: 200, stockMax: 500, costoUnitario: 85, ventaPromedioMensual: 185, tendencia: 'stable', proveedor: 'Cementos Progreso', diasEntrega: 3 },
  { id: 18, nombre: 'Lámina Galvanizada 3x8 pies', linea: 'Construcción', stock: 45, stockMin: 80, stockMax: 200, costoUnitario: 380, ventaPromedioMensual: 65, tendencia: 'up', proveedor: 'Cementos Progreso', diasEntrega: 3 },
  { id: 19, nombre: 'Varilla corrugada 3/8" (und)', linea: 'Construcción', stock: 850, stockMin: 600, stockMax: 1500, costoUnitario: 28, ventaPromedioMensual: 420, tendencia: 'stable', proveedor: 'Cementos Progreso', diasEntrega: 3 },
  { id: 20, nombre: 'Arena fina (m3)', linea: 'Construcción', stock: 65, stockMin: 50, stockMax: 150, costoUnitario: 120, ventaPromedioMensual: 40, tendencia: 'down', proveedor: 'Materiales El Volcán', diasEntrega: 2 },
  { id: 21, nombre: 'Grava 3/4" (m3)', linea: 'Construcción', stock: 48, stockMin: 40, stockMax: 120, costoUnitario: 135, ventaPromedioMensual: 35, tendencia: 'stable', proveedor: 'Materiales El Volcán', diasEntrega: 2 },
  { id: 22, nombre: 'Block 10x20x40 (und)', linea: 'Construcción', stock: 3200, stockMin: 2000, stockMax: 5000, costoUnitario: 8.5, ventaPromedioMensual: 1800, tendencia: 'up', proveedor: 'Blockera La Unión', diasEntrega: 5 },
  { id: 23, nombre: 'Alambre recocido (kg)', linea: 'Construcción', stock: 180, stockMin: 100, stockMax: 300, costoUnitario: 22, ventaPromedioMensual: 85, tendencia: 'stable', proveedor: 'Cementos Progreso', diasEntrega: 3 },
  { id: 24, nombre: 'Clavo 2" (Caja 25kg)', linea: 'Construcción', stock: 92, stockMin: 80, stockMax: 200, costoUnitario: 95, ventaPromedioMensual: 70, tendencia: 'down', proveedor: 'Ferretería El Clavo', diasEntrega: 4 },
  // Pinturas
  { id: 25, nombre: 'Pintura Latex Blanca 1 Galón', linea: 'Pinturas', stock: 380, stockMin: 200, stockMax: 600, costoUnitario: 165, ventaPromedioMensual: 220, tendencia: 'up', proveedor: 'Pinturas Sherwin Williams', diasEntrega: 5 },
  { id: 26, nombre: 'Pintura Latex Blanca 5 Galones', linea: 'Pinturas', stock: 120, stockMin: 80, stockMax: 250, costoUnitario: 680, ventaPromedioMensual: 75, tendencia: 'up', proveedor: 'Pinturas Sherwin Williams', diasEntrega: 5 },
  { id: 27, nombre: 'Esmalte Brillante Rojo 1/4 galón', linea: 'Pinturas', stock: 95, stockMin: 60, stockMax: 200, costoUnitario: 85, ventaPromedioMensual: 55, tendencia: 'stable', proveedor: 'Pinturas Sherwin Williams', diasEntrega: 5 },
  { id: 28, nombre: 'Brocha 3" profesional', linea: 'Pinturas', stock: 280, stockMin: 150, stockMax: 400, costoUnitario: 45, ventaPromedioMensual: 140, tendencia: 'stable', proveedor: 'Pinturas Sherwin Williams', diasEntrega: 5 },
  { id: 29, nombre: 'Rodillo 9" felpa', linea: 'Pinturas', stock: 145, stockMin: 80, stockMax: 250, costoUnitario: 65, ventaPromedioMensual: 90, tendencia: 'up', proveedor: 'Pinturas Sherwin Williams', diasEntrega: 5 },
  { id: 30, nombre: 'Thinner 1 galón', linea: 'Pinturas', stock: 68, stockMin: 50, stockMax: 150, costoUnitario: 95, ventaPromedioMensual: 45, tendencia: 'down', proveedor: 'Pinturas Sherwin Williams', diasEntrega: 5 },
  { id: 31, nombre: 'Masilla plástica 1kg', linea: 'Pinturas', stock: 195, stockMin: 100, stockMax: 300, costoUnitario: 35, ventaPromedioMensual: 85, tendencia: 'stable', proveedor: 'Pinturas Sherwin Williams', diasEntrega: 5 },
  { id: 32, nombre: 'Cinta masking 2" (rollo)', linea: 'Pinturas', stock: 340, stockMin: 200, stockMax: 600, costoUnitario: 25, ventaPromedioMensual: 185, tendencia: 'up', proveedor: 'Pinturas Sherwin Williams', diasEntrega: 5 },
  // Herramientas
  { id: 33, nombre: 'Taladro percutor 1/2" 650W', linea: 'Herramientas', stock: 35, stockMin: 25, stockMax: 80, costoUnitario: 850, ventaPromedioMensual: 22, tendencia: 'up', proveedor: 'Black & Decker CA', diasEntrega: 14 },
  { id: 34, nombre: 'Sierra caladora 450W', linea: 'Herramientas', stock: 18, stockMin: 15, stockMax: 50, costoUnitario: 720, ventaPromedioMensual: 12, tendencia: 'stable', proveedor: 'Black & Decker CA', diasEntrega: 14 },
  { id: 35, nombre: 'Martillo carpintero 16oz', linea: 'Herramientas', stock: 85, stockMin: 50, stockMax: 150, costoUnitario: 95, ventaPromedioMensual: 45, tendencia: 'stable', proveedor: 'Black & Decker CA', diasEntrega: 14 },
  { id: 36, nombre: 'Cinta métrica 5m profesional', linea: 'Herramientas', stock: 145, stockMin: 80, stockMax: 250, costoUnitario: 65, ventaPromedioMensual: 75, tendencia: 'up', proveedor: 'Black & Decker CA', diasEntrega: 14 },
  { id: 37, nombre: 'Nivel de burbuja 24"', linea: 'Herramientas', stock: 42, stockMin: 30, stockMax: 80, costoUnitario: 185, ventaPromedioMensual: 20, tendencia: 'stable', proveedor: 'Black & Decker CA', diasEntrega: 14 },
  { id: 38, nombre: 'Juego destornilladores 6pzas', linea: 'Herramientas', stock: 95, stockMin: 60, stockMax: 150, costoUnitario: 125, ventaPromedioMensual: 42, tendencia: 'up', proveedor: 'Black & Decker CA', diasEntrega: 14 },
  { id: 39, nombre: 'Amoladora angular 4-1/2" 820W', linea: 'Herramientas', stock: 22, stockMin: 15, stockMax: 50, costoUnitario: 650, ventaPromedioMensual: 14, tendencia: 'up', proveedor: 'Black & Decker CA', diasEntrega: 14 },
  { id: 40, nombre: 'Guantes de cuero (par)', linea: 'Herramientas', stock: 280, stockMin: 150, stockMax: 400, costoUnitario: 45, ventaPromedioMensual: 120, tendencia: 'up', proveedor: 'Black & Decker CA', diasEntrega: 14 },
  // Jardinería
  { id: 41, nombre: 'Manguera 1/2" 20m reforzada', linea: 'Jardinería', stock: 180, stockMin: 80, stockMax: 250, costoUnitario: 165, ventaPromedioMensual: 75, tendencia: 'up', proveedor: 'Garden Center GT', diasEntrega: 4 },
  { id: 42, nombre: 'Aspersor oscillante plástico', linea: 'Jardinería', stock: 95, stockMin: 50, stockMax: 150, costoUnitario: 125, ventaPromedioMensual: 45, tendencia: 'up', proveedor: 'Garden Center GT', diasEntrega: 4 },
  { id: 43, nombre: 'Maceta plástica 12" (und)', linea: 'Jardinería', stock: 420, stockMin: 200, stockMax: 600, costoUnitario: 35, ventaPromedioMensual: 185, tendencia: 'up', proveedor: 'Garden Center GT', diasEntrega: 4 },
  { id: 44, nombre: 'Fertilizante NPK 1kg', linea: 'Jardinería', stock: 280, stockMin: 120, stockMax: 400, costoUnitario: 55, ventaPromedioMensual: 135, tendencia: 'up', proveedor: 'Garden Center GT', diasEntrega: 4 },
  { id: 45, nombre: 'Pala de jardín mango corto', linea: 'Jardinería', stock: 75, stockMin: 40, stockMax: 120, costoUnitario: 85, ventaPromedioMensual: 35, tendencia: 'stable', proveedor: 'Garden Center GT', diasEntrega: 4 },
  { id: 46, nombre: 'Tijeras de podar 8"', linea: 'Jardinería', stock: 65, stockMin: 30, stockMax: 100, costoUnitario: 125, ventaPromedioMensual: 28, tendencia: 'up', proveedor: 'Garden Center GT', diasEntrega: 4 },
  { id: 47, nombre: 'Tierra abonada 10kg', linea: 'Jardinería', stock: 150, stockMin: 80, stockMax: 250, costoUnitario: 45, ventaPromedioMensual: 65, tendencia: 'up', proveedor: 'Garden Center GT', diasEntrega: 4 },
  { id: 48, nombre: 'Rastrillo de jardín 14 dientes', linea: 'Jardinería', stock: 55, stockMin: 25, stockMax: 80, costoUnitario: 95, ventaPromedioMensual: 22, tendencia: 'stable', proveedor: 'Garden Center GT', diasEntrega: 4 },
];

// ============================================
// HISTORIAL DE VENTAS POR PRODUCTO (6 meses)
// ============================================

// Generador consistente: usa ventaPromedioMensual como base
function generarHistorial(promedio, tendencia) {
  const factor = tendencia === 'up' ? [0.85, 0.88, 0.92, 1.0, 1.08, 1.18] :
                 tendencia === 'down' ? [1.15, 1.08, 1.0, 0.95, 0.88, 0.82] :
                 [0.92, 1.05, 0.95, 1.02, 1.08, 0.98]
  return factor.map(f => Math.max(1, Math.round(promedio * f)))
}

export const demoHistorialVentasProducto = [
  // Eléctrico
  { id: 1, nombre: 'Cable THW 12 AWG (Rollo 100m)', linea: 'Eléctrico', precioVenta: 265, costoUnitario: 180, historial: generarHistorial(420, 'up'), margen: 32, proveedor: 'Elektra Guatemala' },
  { id: 2, nombre: 'Interruptor Breaker 2P 30A', linea: 'Eléctrico', precioVenta: 220, costoUnitario: 145, historial: generarHistorial(185, 'up'), margen: 35, proveedor: 'Elektra Guatemala' },
  { id: 3, nombre: 'Foco LED 9W (Caja 10 unds)', linea: 'Eléctrico', precioVenta: 135, costoUnitario: 95, historial: generarHistorial(140, 'up'), margen: 40, proveedor: 'Elektra Guatemala' },
  { id: 4, nombre: 'Caja de Breakers 8 espacios', linea: 'Eléctrico', precioVenta: 450, costoUnitario: 320, historial: generarHistorial(55, 'stable'), margen: 29, proveedor: 'Elektra Guatemala' },
  { id: 5, nombre: 'Cable THW 10 AWG (Rollo 100m)', linea: 'Eléctrico', precioVenta: 360, costoUnitario: 240, historial: generarHistorial(210, 'up'), margen: 33, proveedor: 'Elektra Guatemala' },
  { id: 6, nombre: 'Tomacorriente duplex blanco', linea: 'Eléctrico', precioVenta: 50, costoUnitario: 35, historial: generarHistorial(280, 'stable'), margen: 30, proveedor: 'Elektra Guatemala' },
  { id: 7, nombre: 'Breakers 1P 20A', linea: 'Eléctrico', precioVenta: 90, costoUnitario: 65, historial: generarHistorial(220, 'up'), margen: 28, proveedor: 'Elektra Guatemala' },
  { id: 8, nombre: 'Plafón LED 18W cuadrado', linea: 'Eléctrico', precioVenta: 175, costoUnitario: 125, historial: generarHistorial(90, 'up'), margen: 29, proveedor: 'Elektra Guatemala' },
  // Plomería
  { id: 9, nombre: 'Tubo PVC 1/2" (Caja 20 unds)', linea: 'Plomería', precioVenta: 120, costoUnitario: 85, historial: generarHistorial(260, 'up'), margen: 29, proveedor: 'Plomería Centroamericana' },
  { id: 10, nombre: 'Llave de Paso 1/2"', linea: 'Plomería', precioVenta: 105, costoUnitario: 75, historial: generarHistorial(165, 'stable'), margen: 29, proveedor: 'Plomería Centroamericana' },
  { id: 11, nombre: 'Codo PVC 1/2" (Caja 50 unds)', linea: 'Plomería', precioVenta: 65, costoUnitario: 45, historial: generarHistorial(180, 'up'), margen: 31, proveedor: 'Plomería Centroamericana' },
  { id: 12, nombre: 'Pegamento PVC 1/4 galón', linea: 'Plomería', precioVenta: 78, costoUnitario: 55, historial: generarHistorial(95, 'stable'), margen: 29, proveedor: 'Plomería Centroamericana' },
  { id: 13, nombre: 'Tubo PVC 3/4" (Caja 15 unds)', linea: 'Plomería', precioVenta: 155, costoUnitario: 110, historial: generarHistorial(145, 'up'), margen: 29, proveedor: 'Plomería Centroamericana' },
  { id: 14, nombre: 'Llave de chorro 1/2" cromada', linea: 'Plomería', precioVenta: 230, costoUnitario: 165, historial: generarHistorial(75, 'down'), margen: 28, proveedor: 'Plomería Centroamericana' },
  { id: 15, nombre: 'Cementarropa 1/2" (Caja 25 unds)', linea: 'Plomería', precioVenta: 50, costoUnitario: 35, historial: generarHistorial(85, 'stable'), margen: 30, proveedor: 'Plomería Centroamericana' },
  { id: 16, nombre: 'Sanitario blanco económico', linea: 'Plomería', precioVenta: 580, costoUnitario: 420, historial: generarHistorial(40, 'stable'), margen: 28, proveedor: 'Plomería Centroamericana' },
  // Construcción
  { id: 17, nombre: 'Cemento Portland 42.5kg', linea: 'Construcción', precioVenta: 105, costoUnitario: 85, historial: generarHistorial(185, 'stable'), margen: 19, proveedor: 'Cementos Progreso' },
  { id: 18, nombre: 'Lámina Galvanizada 3x8 pies', linea: 'Construcción', precioVenta: 480, costoUnitario: 380, historial: generarHistorial(65, 'up'), margen: 21, proveedor: 'Cementos Progreso' },
  { id: 19, nombre: 'Varilla corrugada 3/8" (und)', linea: 'Construcción', precioVenta: 35, costoUnitario: 28, historial: generarHistorial(420, 'stable'), margen: 20, proveedor: 'Cementos Progreso' },
  { id: 20, nombre: 'Arena fina (m3)', linea: 'Construcción', precioVenta: 150, costoUnitario: 120, historial: generarHistorial(40, 'down'), margen: 20, proveedor: 'Materiales El Volcán' },
  { id: 21, nombre: 'Grava 3/4" (m3)', linea: 'Construcción', precioVenta: 168, costoUnitario: 135, historial: generarHistorial(35, 'stable'), margen: 20, proveedor: 'Materiales El Volcán' },
  { id: 22, nombre: 'Block 10x20x40 (und)', linea: 'Construcción', precioVenta: 11, costoUnitario: 8.5, historial: generarHistorial(1800, 'up'), margen: 23, proveedor: 'Blockera La Unión' },
  { id: 23, nombre: 'Alambre recocido (kg)', linea: 'Construcción', precioVenta: 28, costoUnitario: 22, historial: generarHistorial(85, 'stable'), margen: 21, proveedor: 'Cementos Progreso' },
  { id: 24, nombre: 'Clavo 2" (Caja 25kg)', linea: 'Construcción', precioVenta: 120, costoUnitario: 95, historial: generarHistorial(70, 'down'), margen: 21, proveedor: 'Ferretería El Clavo' },
  // Pinturas
  { id: 25, nombre: 'Pintura Latex Blanca 1 Galón', linea: 'Pinturas', precioVenta: 220, costoUnitario: 165, historial: generarHistorial(220, 'up'), margen: 25, proveedor: 'Pinturas Sherwin Williams' },
  { id: 26, nombre: 'Pintura Latex Blanca 5 Galones', linea: 'Pinturas', precioVenta: 880, costoUnitario: 680, historial: generarHistorial(75, 'up'), margen: 23, proveedor: 'Pinturas Sherwin Williams' },
  { id: 27, nombre: 'Esmalte Brillante Rojo 1/4 galón', linea: 'Pinturas', precioVenta: 110, costoUnitario: 85, historial: generarHistorial(55, 'stable'), margen: 23, proveedor: 'Pinturas Sherwin Williams' },
  { id: 28, nombre: 'Brocha 3" profesional', linea: 'Pinturas', precioVenta: 58, costoUnitario: 45, historial: generarHistorial(140, 'stable'), margen: 22, proveedor: 'Pinturas Sherwin Williams' },
  { id: 29, nombre: 'Rodillo 9" felpa', linea: 'Pinturas', precioVenta: 82, costoUnitario: 65, historial: generarHistorial(90, 'up'), margen: 21, proveedor: 'Pinturas Sherwin Williams' },
  { id: 30, nombre: 'Thinner 1 galón', linea: 'Pinturas', precioVenta: 120, costoUnitario: 95, historial: generarHistorial(45, 'down'), margen: 21, proveedor: 'Pinturas Sherwin Williams' },
  { id: 31, nombre: 'Masilla plástica 1kg', linea: 'Pinturas', precioVenta: 45, costoUnitario: 35, historial: generarHistorial(85, 'stable'), margen: 22, proveedor: 'Pinturas Sherwin Williams' },
  { id: 32, nombre: 'Cinta masking 2" (rollo)', linea: 'Pinturas', precioVenta: 32, costoUnitario: 25, historial: generarHistorial(185, 'up'), margen: 22, proveedor: 'Pinturas Sherwin Williams' },
  // Herramientas
  { id: 33, nombre: 'Taladro percutor 1/2" 650W', linea: 'Herramientas', precioVenta: 1180, costoUnitario: 850, historial: generarHistorial(22, 'up'), margen: 28, proveedor: 'Black & Decker CA' },
  { id: 34, nombre: 'Sierra caladora 450W', linea: 'Herramientas', precioVenta: 980, costoUnitario: 720, historial: generarHistorial(12, 'stable'), margen: 27, proveedor: 'Black & Decker CA' },
  { id: 35, nombre: 'Martillo carpintero 16oz', linea: 'Herramientas', precioVenta: 128, costoUnitario: 95, historial: generarHistorial(45, 'stable'), margen: 26, proveedor: 'Black & Decker CA' },
  { id: 36, nombre: 'Cinta métrica 5m profesional', linea: 'Herramientas', precioVenta: 88, costoUnitario: 65, historial: generarHistorial(75, 'up'), margen: 26, proveedor: 'Black & Decker CA' },
  { id: 37, nombre: 'Nivel de burbuja 24"', linea: 'Herramientas', precioVenta: 248, costoUnitario: 185, historial: generarHistorial(20, 'stable'), margen: 25, proveedor: 'Black & Decker CA' },
  { id: 38, nombre: 'Juego destornilladores 6pzas', linea: 'Herramientas', precioVenta: 168, costoUnitario: 125, historial: generarHistorial(42, 'up'), margen: 26, proveedor: 'Black & Decker CA' },
  { id: 39, nombre: 'Amoladora angular 4-1/2" 820W', linea: 'Herramientas', precioVenta: 880, costoUnitario: 650, historial: generarHistorial(14, 'up'), margen: 26, proveedor: 'Black & Decker CA' },
  { id: 40, nombre: 'Guantes de cuero (par)', linea: 'Herramientas', precioVenta: 60, costoUnitario: 45, historial: generarHistorial(120, 'up'), margen: 25, proveedor: 'Black & Decker CA' },
  // Jardinería
  { id: 41, nombre: 'Manguera 1/2" 20m reforzada', linea: 'Jardinería', precioVenta: 220, costoUnitario: 165, historial: generarHistorial(75, 'up'), margen: 25, proveedor: 'Garden Center GT' },
  { id: 42, nombre: 'Aspersor oscillante plástico', linea: 'Jardinería', precioVenta: 165, costoUnitario: 125, historial: generarHistorial(45, 'up'), margen: 24, proveedor: 'Garden Center GT' },
  { id: 43, nombre: 'Maceta plástica 12" (und)', linea: 'Jardinería', precioVenta: 48, costoUnitario: 35, historial: generarHistorial(185, 'up'), margen: 27, proveedor: 'Garden Center GT' },
  { id: 44, nombre: 'Fertilizante NPK 1kg', linea: 'Jardinería', precioVenta: 72, costoUnitario: 55, historial: generarHistorial(135, 'up'), margen: 24, proveedor: 'Garden Center GT' },
  { id: 45, nombre: 'Pala de jardín mango corto', linea: 'Jardinería', precioVenta: 110, costoUnitario: 85, historial: generarHistorial(35, 'stable'), margen: 23, proveedor: 'Garden Center GT' },
  { id: 46, nombre: 'Tijeras de podar 8"', linea: 'Jardinería', precioVenta: 162, costoUnitario: 125, historial: generarHistorial(28, 'up'), margen: 23, proveedor: 'Garden Center GT' },
  { id: 47, nombre: 'Tierra abonada 10kg', linea: 'Jardinería', precioVenta: 58, costoUnitario: 45, historial: generarHistorial(65, 'up'), margen: 22, proveedor: 'Garden Center GT' },
  { id: 48, nombre: 'Rastrillo de jardín 14 dientes', linea: 'Jardinería', precioVenta: 118, costoUnitario: 95, historial: generarHistorial(22, 'stable'), margen: 20, proveedor: 'Garden Center GT' },
];

// Meses para labels de historial
export const demoMesesHistorial = ['Dic 2025', 'Ene 2026', 'Feb 2026', 'Mar 2026', 'Abr 2026', 'May 2026'];
export const demoMesesProyeccion = ['Jun 2026', 'Jul 2026', 'Ago 2026'];
