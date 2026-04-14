const db = require('./connection');

// Detectar si estamos usando PostgreSQL
const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');

const addMissingColumns = async () => {
  if (isPostgres) {
    console.log('  ℹ️  PostgreSQL detectado, omitiendo verificación de columnas (PRAGMA no disponible)');
    return;
  }
  
  console.log('🔄 Verificando columnas faltantes...');
  
  try {
    // Verificar si la columna cliente_id existe en transacciones
    const tableInfo = await db.allAsync(`PRAGMA table_info(transacciones)`);
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('cliente_id')) {
      console.log('  ➕ Agregando columna cliente_id a transacciones...');
      await db.runAsync(`ALTER TABLE transacciones ADD COLUMN cliente_id INTEGER`);
    }
    
    if (!columns.includes('nombre_cliente')) {
      console.log('  ➕ Agregando columna nombre_cliente a transacciones...');
      await db.runAsync(`ALTER TABLE transacciones ADD COLUMN nombre_cliente TEXT`);
    }
    
    console.log('✅ Columnas verificadas');
  } catch (err) {
    console.log('  ⚠️  Tabla transacciones no existe aún, se creará con todas las columnas');
  }
};

const createInsightsTable = async () => {
  console.log('🔄 Verificando tabla de insights histórico...');
  
  if (isPostgres) {
    console.log('  ℹ️  PostgreSQL: tabla creada por migrate-postgres.js');
    return;
  }
  
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS insights_historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT NOT NULL DEFAULT 'default',
      insight_id TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('gasto', 'ingreso', 'alerta', 'oportunidad')),
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      impact REAL DEFAULT 0,
      currency TEXT DEFAULT 'GTQ',
      category TEXT,
      action TEXT,
      action_label TEXT,
      change_percent REAL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'dismissed', 'resolved')),
      dismissed_at DATETIME,
      dismissed_by INTEGER,
      periodo_desde DATE,
      periodo_hasta DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      agent_source TEXT,
      agent_version TEXT
    )
  `);
  
  // Crear índices
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_insights_empresa ON insights_historico(empresa_id)`);
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_insights_type ON insights_historico(type)`);
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_insights_severity ON insights_historico(severity)`);
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_insights_status ON insights_historico(status)`);
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_insights_created ON insights_historico(created_at)`);
  
  console.log('✅ Tabla insights_historico verificada');
};

const createAgentesLogsTable = async () => {
  console.log('🔄 Verificando tabla de logs de agentes...');
  
  if (isPostgres) {
    console.log('  ℹ️  PostgreSQL: tabla creada por migrate-postgres.js');
    return;
  }
  
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS agentes_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id TEXT NOT NULL DEFAULT 'default',
      agente_nombre TEXT NOT NULL,
      agente_tipo TEXT NOT NULL,
      agente_version TEXT DEFAULT '1.0.0',
      categoria TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      detalles_json TEXT,
      entidad_tipo TEXT,
      entidad_id TEXT,
      impacto_valor REAL,
      impacto_moneda TEXT DEFAULT 'GTQ',
      resultado_status TEXT DEFAULT 'exitoso',
      duracion_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Crear índices
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_logs_empresa ON agentes_logs(empresa_id)`);
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_logs_agente ON agentes_logs(agente_tipo)`);
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_logs_categoria ON agentes_logs(categoria)`);
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_logs_created ON agentes_logs(created_at)`);
  await db.runAsync(`CREATE INDEX IF NOT EXISTS idx_logs_status ON agentes_logs(resultado_status)`);
  
  console.log('✅ Tabla agentes_logs verificada');
};

const createTables = async () => {
  console.log('🏗️  Creando tablas...');
  
  if (isPostgres) {
    console.log('🐘 PostgreSQL detectado - usando migrate-postgres.js para tablas principales');
    console.log('   Ejecuta: node database/migrate-postgres.js');
  }
  
  // Primero agregar columnas faltantes a tablas existentes
  await addMissingColumns();
  
  // Crear tabla de insights histórico
  await createInsightsTable();
  
  // Crear tabla de logs de agentes
  await createAgentesLogsTable();

  // Solo crear tablas SQLite si NO estamos en PostgreSQL
  if (isPostgres) {
    console.log('✅ Migración SQLite omitida (PostgreSQL en uso)');
    return;
  }

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
