// Datos de DEMO / Fallback para desarrollo
// Centralizados aquí para evitar hardcodear en componentes
// ACTUALIZADO: Datos de RETAIL para tiendas en Guatemala

export const demoClientesConcentracion = [
  { id: 1, nombre: 'Tienda Moda Express Zona 10', ingresos: 8500000 },
  { id: 2, nombre: 'Outlet Centroamérica', ingresos: 6200000 },
  { id: 3, nombre: 'Fashion Plus Miraflores', ingresos: 4100000 },
  { id: 4, nombre: 'Boutique El Paseo Cayalá', ingresos: 2800000 },
  { id: 5, nombre: 'Tienda Urbana Roosevelt', ingresos: 1900000 },
  { id: 6, nombre: 'Style Center Xela', ingresos: 1500000 },
  { id: 7, nombre: 'Moda Joven Quetzaltenango', ingresos: 1200000 },
  { id: 8, nombre: 'Fashion Mall Escuintla', ingresos: 800000 },
  { id: 9, nombre: 'Boutique Premium Antigua', ingresos: 650000 },
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
// DATOS DE COMPRAS INTELIGENTES - RETAIL
// ============================================

// Líneas de producto con historial de ventas (6 meses) - RETAIL
export const demoLineasProducto = [
  {
    id: 'RH-001',
    nombre: 'Ropa Hombre',
    descripcion: 'Camisas, pantalones, chaquetas, ropa interior masculina',
    stockActual: 3420,
    stockMinimo: 1500,
    costoUnitarioPromedio: 285,
    historialVentas: [2840, 3120, 2980, 3450, 3620, 3890],
    tendencia: 'up',
    margen: 45,
    proveedorPrincipal: 'DistriModa Centroamérica',
    tiempoEntregaDias: 7,
  },
  {
    id: 'RM-001',
    nombre: 'Ropa Mujer',
    descripcion: 'Blusas, vestidos, pantalones, faldas, ropa interior femenina',
    stockActual: 4200,
    stockMinimo: 1800,
    costoUnitarioPromedio: 195,
    historialVentas: [3650, 3820, 3580, 4190, 4500, 4850],
    tendencia: 'up',
    margen: 48,
    proveedorPrincipal: 'Fashion Import Guatemala',
    tiempoEntregaDias: 10,
  },
  {
    id: 'CAL-001',
    nombre: 'Calzado',
    descripcion: 'Zapatos, tenis, sandalias, botas para hombre y mujer',
    stockActual: 1850,
    stockMinimo: 800,
    costoUnitarioPromedio: 420,
    historialVentas: [1250, 1380, 1180, 1490, 1620, 1750],
    tendencia: 'up',
    margen: 42,
    proveedorPrincipal: 'Calzados Centroamérica',
    tiempoEntregaDias: 5,
  },
  {
    id: 'ACC-001',
    nombre: 'Accesorios',
    descripcion: 'Bolsos, carteras, cinturones, gafas, joyería, relojes',
    stockActual: 2560,
    stockMinimo: 800,
    costoUnitarioPromedio: 125,
    historialVentas: [1890, 1950, 2100, 2050, 2300, 2550],
    tendencia: 'up',
    margen: 55,
    proveedorPrincipal: 'Accesorios Premium GT',
    tiempoEntregaDias: 5,
  },
  {
    id: 'ELEC-001',
    nombre: 'Electrónica',
    descripcion: 'Audífonos, cargadores, cables, protectores, smartwatches',
    stockActual: 1680,
    stockMinimo: 600,
    costoUnitarioPromedio: 450,
    historialVentas: [1420, 1580, 1510, 1690, 1820, 1950],
    tendencia: 'up',
    margen: 35,
    proveedorPrincipal: 'TechZone Guatemala',
    tiempoEntregaDias: 7,
  },
  {
    id: 'PERF-001',
    nombre: 'Perfumería',
    descripcion: 'Perfumes, colonias, cremas, maquillaje, productos de belleza',
    stockActual: 1200,
    stockMinimo: 400,
    costoUnitarioPromedio: 310,
    historialVentas: [980, 1050, 1120, 1080, 1250, 1380],
    tendencia: 'up',
    margen: 50,
    proveedorPrincipal: 'Beauty World Guatemala',
    tiempoEntregaDias: 4,
  },
  {
    id: 'HOG-001',
    nombre: 'Hogar',
    descripcion: 'Artículos de decoración, utensilios, textiles para el hogar',
    stockActual: 980,
    stockMinimo: 350,
    costoUnitarioPromedio: 185,
    historialVentas: [720, 780, 690, 850, 920, 1050],
    tendencia: 'up',
    margen: 40,
    proveedorPrincipal: 'Hogar y Estilo GT',
    tiempoEntregaDias: 6,
  },
  {
    id: 'NIN-001',
    nombre: 'Niños',
    descripcion: 'Ropa, calzado, juguetes y accesorios para niños',
    stockActual: 1450,
    stockMinimo: 500,
    costoUnitarioPromedio: 155,
    historialVentas: [1050, 1180, 1280, 1150, 1320, 1450],
    tendencia: 'up',
    margen: 44,
    proveedorPrincipal: 'Kids World Guatemala',
    tiempoEntregaDias: 5,
  },
];

// Productos individuales con estado de stock detallado - RETAIL
export const demoProductosStock = [
  // Ropa Hombre
  { id: 1, nombre: 'Camisa Oxford Manga Larga Blanca', linea: 'Ropa Hombre', stock: 850, stockMin: 400, stockMax: 1200, costoUnitario: 180, ventaPromedioMensual: 420, tendencia: 'up', proveedor: 'DistriModa Centroamérica', diasEntrega: 7 },
  { id: 2, nombre: 'Pantalón Chino Slim Fit Caqui', linea: 'Ropa Hombre', stock: 320, stockMin: 200, stockMax: 600, costoUnitario: 220, ventaPromedioMensual: 185, tendencia: 'up', proveedor: 'DistriModa Centroamérica', diasEntrega: 7 },
  { id: 3, nombre: 'Polo Piqué Algodón Negro', linea: 'Ropa Hombre', stock: 580, stockMin: 300, stockMax: 900, costoUnitario: 95, ventaPromedioMensual: 340, tendencia: 'up', proveedor: 'DistriModa Centroamérica', diasEntrega: 7 },
  { id: 4, nombre: 'Chaqueta Denim Clásica', linea: 'Ropa Hombre', stock: 95, stockMin: 80, stockMax: 200, costoUnitario: 320, ventaPromedioMensual: 55, tendencia: 'stable', proveedor: 'DistriModa Centroamérica', diasEntrega: 7 },
  { id: 5, nombre: 'Camiseta Básica Algodón Gris', linea: 'Ropa Hombre', stock: 720, stockMin: 400, stockMax: 1100, costoUnitario: 65, ventaPromedioMensual: 480, tendencia: 'stable', proveedor: 'DistriModa Centroamérica', diasEntrega: 7 },
  { id: 6, nombre: 'Jeans Slim Fit Azul Oscuro', linea: 'Ropa Hombre', stock: 420, stockMin: 250, stockMax: 700, costoUnitario: 185, ventaPromedioMensual: 310, tendencia: 'up', proveedor: 'DistriModa Centroamérica', diasEntrega: 7 },
  { id: 7, nombre: 'Suéter Tejido Cuello V Azul', linea: 'Ropa Hombre', stock: 280, stockMin: 150, stockMax: 450, costoUnitario: 165, ventaPromedioMensual: 120, tendencia: 'up', proveedor: 'DistriModa Centroamérica', diasEntrega: 7 },
  { id: 8, nombre: 'Short Casual Bermuda Caqui', linea: 'Ropa Hombre', stock: 195, stockMin: 120, stockMax: 350, costoUnitario: 85, ventaPromedioMensual: 140, tendencia: 'up', proveedor: 'DistriModa Centroamérica', diasEntrega: 7 },
  // Ropa Mujer
  { id: 9, nombre: 'Blusa Elegante Seda Blanca', linea: 'Ropa Mujer', stock: 480, stockMin: 250, stockMax: 750, costoUnitario: 145, ventaPromedioMensual: 320, tendencia: 'up', proveedor: 'Fashion Import Guatemala', diasEntrega: 10 },
  { id: 10, nombre: 'Vestido Casual Floral', linea: 'Ropa Mujer', stock: 320, stockMin: 180, stockMax: 500, costoUnitario: 175, ventaPromedioMensual: 210, tendencia: 'stable', proveedor: 'Fashion Import Guatemala', diasEntrega: 10 },
  { id: 11, nombre: 'Jeans Skinny Fit Mujer Negro', linea: 'Ropa Mujer', stock: 390, stockMin: 220, stockMax: 600, costoUnitario: 155, ventaPromedioMensual: 280, tendencia: 'up', proveedor: 'Fashion Import Guatemala', diasEntrega: 10 },
  { id: 12, nombre: 'Falda Lápiz Negra', linea: 'Ropa Mujer', stock: 220, stockMin: 120, stockMax: 350, costoUnitario: 115, ventaPromedioMensual: 160, tendencia: 'stable', proveedor: 'Fashion Import Guatemala', diasEntrega: 10 },
  { id: 13, nombre: 'Top Deportivo Negro', linea: 'Ropa Mujer', stock: 450, stockMin: 250, stockMax: 700, costoUnitario: 75, ventaPromedioMensual: 310, tendencia: 'up', proveedor: 'Fashion Import Guatemala', diasEntrega: 10 },
  { id: 14, nombre: 'Cardigan Tejido Rosado', linea: 'Ropa Mujer', stock: 185, stockMin: 100, stockMax: 300, costoUnitario: 165, ventaPromedioMensual: 95, tendencia: 'down', proveedor: 'Fashion Import Guatemala', diasEntrega: 10 },
  { id: 15, nombre: 'Blazer Formal Negro', linea: 'Ropa Mujer', stock: 120, stockMin: 80, stockMax: 200, costoUnitario: 285, ventaPromedioMensual: 65, tendencia: 'stable', proveedor: 'Fashion Import Guatemala', diasEntrega: 10 },
  { id: 16, nombre: 'Leggings Básicos Negros', linea: 'Ropa Mujer', stock: 520, stockMin: 300, stockMax: 800, costoUnitario: 55, ventaPromedioMensual: 380, tendencia: 'up', proveedor: 'Fashion Import Guatemala', diasEntrega: 10 },
  // Calzado
  { id: 17, nombre: 'Tenis Running Hombre Negro', linea: 'Calzado', stock: 320, stockMin: 180, stockMax: 500, costoUnitario: 385, ventaPromedioMensual: 185, tendencia: 'up', proveedor: 'Calzados Centroamérica', diasEntrega: 5 },
  { id: 18, nombre: 'Zapatilla Casual Mujer Blanca', linea: 'Calzado', stock: 280, stockMin: 150, stockMax: 450, costoUnitario: 295, ventaPromedioMensual: 155, tendencia: 'up', proveedor: 'Calzados Centroamérica', diasEntrega: 5 },
  { id: 19, nombre: 'Sandalia Plataforma Mujer', linea: 'Calzado', stock: 220, stockMin: 120, stockMax: 350, costoUnitario: 165, ventaPromedioMensual: 120, tendencia: 'stable', proveedor: 'Calzados Centroamérica', diasEntrega: 5 },
  { id: 20, nombre: 'Zapato Formal Hombre Negro', linea: 'Calzado', stock: 150, stockMin: 80, stockMax: 250, costoUnitario: 420, ventaPromedioMensual: 75, tendencia: 'stable', proveedor: 'Calzados Centroamérica', diasEntrega: 5 },
  { id: 21, nombre: 'Botín Cuero Mujer Marrón', linea: 'Calzado', stock: 95, stockMin: 60, stockMax: 180, costoUnitario: 485, ventaPromedioMensual: 45, tendencia: 'up', proveedor: 'Calzados Centroamérica', diasEntrega: 5 },
  { id: 22, nombre: 'Tenis Urbano Unisex Gris', linea: 'Calzado', stock: 380, stockMin: 200, stockMax: 550, costoUnitario: 245, ventaPromedioMensual: 220, tendencia: 'up', proveedor: 'Calzados Centroamérica', diasEntrega: 5 },
  { id: 23, nombre: 'Sandalia Hombre Café', linea: 'Calzado', stock: 180, stockMin: 100, stockMax: 300, costoUnitario: 125, ventaPromedioMensual: 95, tendencia: 'stable', proveedor: 'Calzados Centroamérica', diasEntrega: 5 },
  { id: 24, nombre: 'Zapatilla Niño Velcro Azul', linea: 'Calzado', stock: 150, stockMin: 80, stockMax: 250, costoUnitario: 145, ventaPromedioMensual: 85, tendencia: 'up', proveedor: 'Calzados Centroamérica', diasEntrega: 5 },
  // Accesorios
  { id: 25, nombre: 'Bolso Crossbody Negro', linea: 'Accesorios', stock: 280, stockMin: 150, stockMax: 400, costoUnitario: 185, ventaPromedioMensual: 160, tendencia: 'up', proveedor: 'Accesorios Premium GT', diasEntrega: 5 },
  { id: 26, nombre: 'Cinturón Cuero Genuino Café', linea: 'Accesorios', stock: 220, stockMin: 120, stockMax: 350, costoUnitario: 125, ventaPromedioMensual: 130, tendencia: 'stable', proveedor: 'Accesorios Premium GT', diasEntrega: 5 },
  { id: 27, nombre: 'Gafas de Sol UV400', linea: 'Accesorios', stock: 320, stockMin: 150, stockMax: 450, costoUnitario: 95, ventaPromedioMensual: 185, tendencia: 'up', proveedor: 'Accesorios Premium GT', diasEntrega: 5 },
  { id: 28, nombre: 'Cartera Bifold Cuero Negro', linea: 'Accesorios', stock: 180, stockMin: 100, stockMax: 280, costoUnitario: 115, ventaPromedioMensual: 110, tendencia: 'stable', proveedor: 'Accesorios Premium GT', diasEntrega: 5 },
  { id: 29, nombre: 'Reloj Analógico Clásico Plata', linea: 'Accesorios', stock: 95, stockMin: 50, stockMax: 150, costoUnitario: 485, ventaPromedioMensual: 35, tendencia: 'stable', proveedor: 'Accesorios Premium GT', diasEntrega: 5 },
  { id: 30, nombre: 'Collar Cadena Acero Inox', linea: 'Accesorios', stock: 250, stockMin: 120, stockMax: 350, costoUnitario: 65, ventaPromedioMensual: 145, tendencia: 'up', proveedor: 'Accesorios Premium GT', diasEntrega: 5 },
  { id: 31, nombre: 'Mochila Casual Negra', linea: 'Accesorios', stock: 165, stockMin: 80, stockMax: 250, costoUnitario: 155, ventaPromedioMensual: 85, tendencia: 'up', proveedor: 'Accesorios Premium GT', diasEntrega: 5 },
  { id: 32, nombre: 'Pulsera Piedras Naturales', linea: 'Accesorios', stock: 340, stockMin: 180, stockMax: 500, costoUnitario: 45, ventaPromedioMensual: 195, tendencia: 'up', proveedor: 'Accesorios Premium GT', diasEntrega: 5 },
  // Electrónica
  { id: 33, nombre: 'Audífonos Bluetooth InEar Negros', linea: 'Electrónica', stock: 420, stockMin: 200, stockMax: 650, costoUnitario: 125, ventaPromedioMensual: 280, tendencia: 'up', proveedor: 'TechZone Guatemala', diasEntrega: 7 },
  { id: 34, nombre: 'Cargador Rápido USB-C 20W', linea: 'Electrónica', stock: 380, stockMin: 200, stockMax: 600, costoUnitario: 65, ventaPromedioMensual: 320, tendencia: 'up', proveedor: 'TechZone Guatemala', diasEntrega: 7 },
  { id: 35, nombre: 'Smartwatch Deportivo Negro', linea: 'Electrónica', stock: 150, stockMin: 80, stockMax: 250, costoUnitario: 385, ventaPromedioMensual: 75, tendencia: 'up', proveedor: 'TechZone Guatemala', diasEntrega: 7 },
  { id: 36, nombre: 'Cable USB-C a Lightning 2m', linea: 'Electrónica', stock: 520, stockMin: 300, stockMax: 800, costoUnitario: 35, ventaPromedioMensual: 410, tendencia: 'stable', proveedor: 'TechZone Guatemala', diasEntrega: 7 },
  { id: 37, nombre: 'Powerbank 10000mAh Slim', linea: 'Electrónica', stock: 220, stockMin: 120, stockMax: 350, costoUnitario: 145, ventaPromedioMensual: 165, tendencia: 'up', proveedor: 'TechZone Guatemala', diasEntrega: 7 },
  { id: 38, nombre: 'Funda Silicona iPhone Negro', linea: 'Electrónica', stock: 480, stockMin: 250, stockMax: 700, costoUnitario: 45, ventaPromedioMensual: 350, tendencia: 'stable', proveedor: 'TechZone Guatemala', diasEntrega: 7 },
  { id: 39, nombre: 'Audífonos OverEar Inalámbricos', linea: 'Electrónica', stock: 85, stockMin: 50, stockMax: 150, costoUnitario: 485, ventaPromedioMensual: 40, tendencia: 'up', proveedor: 'TechZone Guatemala', diasEntrega: 7 },
  { id: 40, nombre: 'Tripode para Celular 1.2m', linea: 'Electrónica', stock: 180, stockMin: 100, stockMax: 300, costoUnitario: 85, ventaPromedioMensual: 95, tendencia: 'stable', proveedor: 'TechZone Guatemala', diasEntrega: 7 },
  // Perfumería
  { id: 41, nombre: 'Perfume Hombre 100ml Fresh', linea: 'Perfumería', stock: 180, stockMin: 80, stockMax: 280, costoUnitario: 285, ventaPromedioMensual: 75, tendencia: 'up', proveedor: 'Beauty World Guatemala', diasEntrega: 4 },
  { id: 42, nombre: 'Perfume Mujer 100ml Floral', linea: 'Perfumería', stock: 220, stockMin: 100, stockMax: 320, costoUnitario: 325, ventaPromedioMensual: 85, tendencia: 'up', proveedor: 'Beauty World Guatemala', diasEntrega: 4 },
  { id: 43, nombre: 'Crema Hidratante Facial 50ml', linea: 'Perfumería', stock: 320, stockMin: 150, stockMax: 450, costoUnitario: 95, ventaPromedioMensual: 185, tendencia: 'up', proveedor: 'Beauty World Guatemala', diasEntrega: 4 },
  { id: 44, nombre: 'Labial Matte Rojo Intenso', linea: 'Perfumería', stock: 420, stockMin: 200, stockMax: 600, costoUnitario: 65, ventaPromedioMensual: 265, tendencia: 'up', proveedor: 'Beauty World Guatemala', diasEntrega: 4 },
  { id: 45, nombre: 'Set de Maquillaje Básico', linea: 'Perfumería', stock: 150, stockMin: 80, stockMax: 250, costoUnitario: 185, ventaPromedioMensual: 65, tendencia: 'stable', proveedor: 'Beauty World Guatemala', diasEntrega: 4 },
  { id: 46, nombre: 'Colonia Infantil 200ml', linea: 'Perfumería', stock: 180, stockMin: 100, stockMax: 280, costoUnitario: 75, ventaPromedioMensual: 105, tendencia: 'up', proveedor: 'Beauty World Guatemala', diasEntrega: 4 },
  { id: 47, nombre: 'Shampoo Sin Sulfatos 400ml', linea: 'Perfumería', stock: 250, stockMin: 120, stockMax: 350, costoUnitario: 85, ventaPromedioMensual: 145, tendencia: 'up', proveedor: 'Beauty World Guatemala', diasEntrega: 4 },
  { id: 48, nombre: 'Base Líquida SPF30 30ml', linea: 'Perfumería', stock: 180, stockMin: 100, stockMax: 280, costoUnitario: 125, ventaPromedioMensual: 95, tendencia: 'stable', proveedor: 'Beauty World Guatemala', diasEntrega: 4 },
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
  // Ropa Hombre
  { id: 1, nombre: 'Camisa Oxford Manga Larga Blanca', linea: 'Ropa Hombre', precioVenta: 325, costoUnitario: 180, historial: generarHistorial(420, 'up'), margen: 45, proveedor: 'DistriModa Centroamérica' },
  { id: 2, nombre: 'Pantalón Chino Slim Fit Caqui', linea: 'Ropa Hombre', precioVenta: 395, costoUnitario: 220, historial: generarHistorial(185, 'up'), margen: 44, proveedor: 'DistriModa Centroamérica' },
  { id: 3, nombre: 'Polo Piqué Algodón Negro', linea: 'Ropa Hombre', precioVenta: 175, costoUnitario: 95, historial: generarHistorial(340, 'up'), margen: 46, proveedor: 'DistriModa Centroamérica' },
  { id: 4, nombre: 'Chaqueta Denim Clásica', linea: 'Ropa Hombre', precioVenta: 585, costoUnitario: 320, historial: generarHistorial(55, 'stable'), margen: 45, proveedor: 'DistriModa Centroamérica' },
  { id: 5, nombre: 'Camiseta Básica Algodón Gris', linea: 'Ropa Hombre', precioVenta: 120, costoUnitario: 65, historial: generarHistorial(480, 'stable'), margen: 46, proveedor: 'DistriModa Centroamérica' },
  { id: 6, nombre: 'Jeans Slim Fit Azul Oscuro', linea: 'Ropa Hombre', precioVenta: 335, costoUnitario: 185, historial: generarHistorial(310, 'up'), margen: 45, proveedor: 'DistriModa Centroamérica' },
  { id: 7, nombre: 'Suéter Tejido Cuello V Azul', linea: 'Ropa Hombre', precioVenta: 295, costoUnitario: 165, historial: generarHistorial(120, 'up'), margen: 44, proveedor: 'DistriModa Centroamérica' },
  { id: 8, nombre: 'Short Casual Bermuda Caqui', linea: 'Ropa Hombre', precioVenta: 155, costoUnitario: 85, historial: generarHistorial(140, 'up'), margen: 45, proveedor: 'DistriModa Centroamérica' },
  // Ropa Mujer
  { id: 9, nombre: 'Blusa Elegante Seda Blanca', linea: 'Ropa Mujer', precioVenta: 275, costoUnitario: 145, historial: generarHistorial(320, 'up'), margen: 47, proveedor: 'Fashion Import Guatemala' },
  { id: 10, nombre: 'Vestido Casual Floral', linea: 'Ropa Mujer', precioVenta: 325, costoUnitario: 175, historial: generarHistorial(210, 'stable'), margen: 46, proveedor: 'Fashion Import Guatemala' },
  { id: 11, nombre: 'Jeans Skinny Fit Mujer Negro', linea: 'Ropa Mujer', precioVenta: 285, costoUnitario: 155, historial: generarHistorial(280, 'up'), margen: 46, proveedor: 'Fashion Import Guatemala' },
  { id: 12, nombre: 'Falda Lápiz Negra', linea: 'Ropa Mujer', precioVenta: 215, costoUnitario: 115, historial: generarHistorial(160, 'stable'), margen: 47, proveedor: 'Fashion Import Guatemala' },
  { id: 13, nombre: 'Top Deportivo Negro', linea: 'Ropa Mujer', precioVenta: 145, costoUnitario: 75, historial: generarHistorial(310, 'up'), margen: 48, proveedor: 'Fashion Import Guatemala' },
  { id: 14, nombre: 'Cardigan Tejido Rosado', linea: 'Ropa Mujer', precioVenta: 315, costoUnitario: 165, historial: generarHistorial(95, 'down'), margen: 48, proveedor: 'Fashion Import Guatemala' },
  { id: 15, nombre: 'Blazer Formal Negro', linea: 'Ropa Mujer', precioVenta: 525, costoUnitario: 285, historial: generarHistorial(65, 'stable'), margen: 46, proveedor: 'Fashion Import Guatemala' },
  { id: 16, nombre: 'Leggings Básicos Negros', linea: 'Ropa Mujer', precioVenta: 105, costoUnitario: 55, historial: generarHistorial(380, 'up'), margen: 48, proveedor: 'Fashion Import Guatemala' },
  // Calzado
  { id: 17, nombre: 'Tenis Running Hombre Negro', linea: 'Calzado', precioVenta: 665, costoUnitario: 385, historial: generarHistorial(185, 'up'), margen: 42, proveedor: 'Calzados Centroamérica' },
  { id: 18, nombre: 'Zapatilla Casual Mujer Blanca', linea: 'Calzado', precioVenta: 510, costoUnitario: 295, historial: generarHistorial(155, 'up'), margen: 42, proveedor: 'Calzados Centroamérica' },
  { id: 19, nombre: 'Sandalia Plataforma Mujer', linea: 'Calzado', precioVenta: 285, costoUnitario: 165, historial: generarHistorial(120, 'stable'), margen: 42, proveedor: 'Calzados Centroamérica' },
  { id: 20, nombre: 'Zapato Formal Hombre Negro', linea: 'Calzado', precioVenta: 725, costoUnitario: 420, historial: generarHistorial(75, 'stable'), margen: 42, proveedor: 'Calzados Centroamérica' },
  { id: 21, nombre: 'Botín Cuero Mujer Marrón', linea: 'Calzado', precioVenta: 840, costoUnitario: 485, historial: generarHistorial(45, 'up'), margen: 42, proveedor: 'Calzados Centroamérica' },
  { id: 22, nombre: 'Tenis Urbano Unisex Gris', linea: 'Calzado', precioVenta: 425, costoUnitario: 245, historial: generarHistorial(220, 'up'), margen: 42, proveedor: 'Calzados Centroamérica' },
  { id: 23, nombre: 'Sandalia Hombre Café', linea: 'Calzado', precioVenta: 215, costoUnitario: 125, historial: generarHistorial(95, 'stable'), margen: 42, proveedor: 'Calzados Centroamérica' },
  { id: 24, nombre: 'Zapatilla Niño Velcro Azul', linea: 'Calzado', precioVenta: 250, costoUnitario: 145, historial: generarHistorial(85, 'up'), margen: 42, proveedor: 'Calzados Centroamérica' },
  // Accesorios
  { id: 25, nombre: 'Bolso Crossbody Negro', linea: 'Accesorios', precioVenta: 410, costoUnitario: 185, historial: generarHistorial(160, 'up'), margen: 55, proveedor: 'Accesorios Premium GT' },
  { id: 26, nombre: 'Cinturón Cuero Genuino Café', linea: 'Accesorios', precioVenta: 275, costoUnitario: 125, historial: generarHistorial(130, 'stable'), margen: 55, proveedor: 'Accesorios Premium GT' },
  { id: 27, nombre: 'Gafas de Sol UV400', linea: 'Accesorios', precioVenta: 210, costoUnitario: 95, historial: generarHistorial(185, 'up'), margen: 55, proveedor: 'Accesorios Premium GT' },
  { id: 28, nombre: 'Cartera Bifold Cuero Negro', linea: 'Accesorios', precioVenta: 255, costoUnitario: 115, historial: generarHistorial(110, 'stable'), margen: 55, proveedor: 'Accesorios Premium GT' },
  { id: 29, nombre: 'Reloj Analógico Clásico Plata', linea: 'Accesorios', precioVenta: 1085, costoUnitario: 485, historial: generarHistorial(35, 'stable'), margen: 55, proveedor: 'Accesorios Premium GT' },
  { id: 30, nombre: 'Collar Cadena Acero Inox', linea: 'Accesorios', precioVenta: 145, costoUnitario: 65, historial: generarHistorial(145, 'up'), margen: 55, proveedor: 'Accesorios Premium GT' },
  { id: 31, nombre: 'Mochila Casual Negra', linea: 'Accesorios', precioVenta: 345, costoUnitario: 155, historial: generarHistorial(85, 'up'), margen: 55, proveedor: 'Accesorios Premium GT' },
  { id: 32, nombre: 'Pulsera Piedras Naturales', linea: 'Accesorios', precioVenta: 100, costoUnitario: 45, historial: generarHistorial(195, 'up'), margen: 55, proveedor: 'Accesorios Premium GT' },
  // Electrónica
  { id: 33, nombre: 'Audífonos Bluetooth InEar Negros', linea: 'Electrónica', precioVenta: 190, costoUnitario: 125, historial: generarHistorial(280, 'up'), margen: 34, proveedor: 'TechZone Guatemala' },
  { id: 34, nombre: 'Cargador Rápido USB-C 20W', linea: 'Electrónica', precioVenta: 98, costoUnitario: 65, historial: generarHistorial(320, 'up'), margen: 34, proveedor: 'TechZone Guatemala' },
  { id: 35, nombre: 'Smartwatch Deportivo Negro', linea: 'Electrónica', precioVenta: 585, costoUnitario: 385, historial: generarHistorial(75, 'up'), margen: 34, proveedor: 'TechZone Guatemala' },
  { id: 36, nombre: 'Cable USB-C a Lightning 2m', linea: 'Electrónica', precioVenta: 53, costoUnitario: 35, historial: generarHistorial(410, 'stable'), margen: 34, proveedor: 'TechZone Guatemala' },
  { id: 37, nombre: 'Powerbank 10000mAh Slim', linea: 'Electrónica', precioVenta: 220, costoUnitario: 145, historial: generarHistorial(165, 'up'), margen: 34, proveedor: 'TechZone Guatemala' },
  { id: 38, nombre: 'Funda Silicona iPhone Negro', linea: 'Electrónica', precioVenta: 68, costoUnitario: 45, historial: generarHistorial(350, 'stable'), margen: 34, proveedor: 'TechZone Guatemala' },
  { id: 39, nombre: 'Audífonos OverEar Inalámbricos', linea: 'Electrónica', precioVenta: 735, costoUnitario: 485, historial: generarHistorial(40, 'up'), margen: 34, proveedor: 'TechZone Guatemala' },
  { id: 40, nombre: 'Tripode para Celular 1.2m', linea: 'Electrónica', precioVenta: 128, costoUnitario: 85, historial: generarHistorial(95, 'stable'), margen: 34, proveedor: 'TechZone Guatemala' },
  // Perfumería
  { id: 41, nombre: 'Perfume Hombre 100ml Fresh', linea: 'Perfumería', precioVenta: 570, costoUnitario: 285, historial: generarHistorial(75, 'up'), margen: 50, proveedor: 'Beauty World Guatemala' },
  { id: 42, nombre: 'Perfume Mujer 100ml Floral', linea: 'Perfumería', precioVenta: 650, costoUnitario: 325, historial: generarHistorial(85, 'up'), margen: 50, proveedor: 'Beauty World Guatemala' },
  { id: 43, nombre: 'Crema Hidratante Facial 50ml', linea: 'Perfumería', precioVenta: 190, costoUnitario: 95, historial: generarHistorial(185, 'up'), margen: 50, proveedor: 'Beauty World Guatemala' },
  { id: 44, nombre: 'Labial Matte Rojo Intenso', linea: 'Perfumería', precioVenta: 130, costoUnitario: 65, historial: generarHistorial(265, 'up'), margen: 50, proveedor: 'Beauty World Guatemala' },
  { id: 45, nombre: 'Set de Maquillaje Básico', linea: 'Perfumería', precioVenta: 370, costoUnitario: 185, historial: generarHistorial(65, 'stable'), margen: 50, proveedor: 'Beauty World Guatemala' },
  { id: 46, nombre: 'Colonia Infantil 200ml', linea: 'Perfumería', precioVenta: 150, costoUnitario: 75, historial: generarHistorial(105, 'up'), margen: 50, proveedor: 'Beauty World Guatemala' },
  { id: 47, nombre: 'Shampoo Sin Sulfatos 400ml', linea: 'Perfumería', precioVenta: 170, costoUnitario: 85, historial: generarHistorial(145, 'up'), margen: 50, proveedor: 'Beauty World Guatemala' },
  { id: 48, nombre: 'Base Líquida SPF30 30ml', linea: 'Perfumería', precioVenta: 250, costoUnitario: 125, historial: generarHistorial(95, 'stable'), margen: 50, proveedor: 'Beauty World Guatemala' },
];

// Meses para labels de historial
export const demoMesesHistorial = ['Dic 2025', 'Ene 2026', 'Feb 2026', 'Mar 2026', 'Abr 2026', 'May 2026'];
export const demoMesesProyeccion = ['Jun 2026', 'Jul 2026', 'Ago 2026'];
