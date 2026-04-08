const db = require('./connection');

const createTables = async () => {
  console.log('🏗️  Creando tablas...');

  // Empresa
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      nit TEXT UNIQUE NOT NULL,
      direccion TEXT,
      telefono TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cuentas bancarias
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS cuentas_bancarias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      banco TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('monetaria', 'ahorro', 'plazo_fijo')),
      numero_cuenta TEXT,
      saldo REAL DEFAULT 0,
      moneda TEXT DEFAULT 'GTQ',
      ultima_conciliacion DATE,
      activa BOOLEAN DEFAULT 1,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    )
  `);

  // Asientos contables
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS asientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      asiento_id TEXT UNIQUE NOT NULL,
      fecha DATE NOT NULL,
      cuenta_codigo TEXT NOT NULL,
      cuenta_nombre TEXT NOT NULL,
      descripcion TEXT,
      debe REAL DEFAULT 0,
      haber REAL DEFAULT 0,
      documento TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    )
  `);

  // Cuentas por cobrar
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS cuentas_cobrar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      cliente TEXT NOT NULL,
      factura TEXT,
      monto REAL NOT NULL,
      fecha_emision DATE NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      dias_atraso INTEGER DEFAULT 0,
      estado TEXT CHECK(estado IN ('al_corriente', 'atrasada', 'cobrada')),
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    )
  `);

  // Cuentas por pagar
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS cuentas_pagar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      proveedor TEXT NOT NULL,
      factura TEXT,
      monto REAL NOT NULL,
      fecha_emision DATE NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      descuento_pronto_pago TEXT,
      estado TEXT CHECK(estado IN ('pendiente', 'pagada')),
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    )
  `);

  // Transacciones (para cash flow)
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS transacciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      tipo TEXT CHECK(tipo IN ('entrada', 'salida')),
      categoria TEXT,
      descripcion TEXT,
      monto REAL NOT NULL,
      moneda TEXT DEFAULT 'GTQ',
      cliente_id INTEGER,
      nombre_cliente TEXT,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    )
  `);

  // Obligaciones SAT
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS obligaciones_sat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      obligacion TEXT NOT NULL,
      formulario TEXT NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      monto_estimado REAL,
      estado TEXT CHECK(estado IN ('pendiente', 'presentada', 'atrasada')),
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    )
  `);

  console.log('✅ Tablas creadas exitosamente');
};

// Ejecutar si se llama directamente
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Migración completada');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error en migración:', err);
      process.exit(1);
    });
}

module.exports = { createTables };
