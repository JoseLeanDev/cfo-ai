-- Migración 007: Tablas para Agentes de IA
-- Crea tablas adicionales para soportar el sistema de agentes de IA

-- Tabla de alertas financieras detectadas por IA
CREATE TABLE IF NOT EXISTS alertas_financieras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    nivel TEXT CHECK(nivel IN ('baja', 'media', 'alta', 'critica')),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    monto_afectado DECIMAL(15,2) DEFAULT 0,
    estado TEXT DEFAULT 'activa' CHECK(estado IN ('activa', 'resuelta', 'ignorada')),
    metadata TEXT, -- JSON con detalles
    resuelta_por TEXT,
    resuelta_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de briefings diarios generados por IA
CREATE TABLE IF NOT EXISTS briefings_diarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE UNIQUE NOT NULL,
    resumen_ejecutivo TEXT,
    insights_json TEXT, -- Array de insights en JSON
    alertas_count INTEGER DEFAULT 0,
    estado TEXT DEFAULT 'generado' CHECK(estado IN ('generado', 'revisado', 'archivado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de snapshots diarios
CREATE TABLE IF NOT EXISTS snapshots_diarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE UNIQUE NOT NULL,
    datos_json TEXT, -- Datos brutos del snapshot
    analisis_ia TEXT, -- Análisis generado por IA
    estado TEXT DEFAULT 'completado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sugerencias de conciliación por IA
CREATE TABLE IF NOT EXISTS sugerencias_conciliacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movimiento_id INTEGER NOT NULL,
    transaccion_id INTEGER NOT NULL,
    confianza TEXT CHECK(confianza IN ('alta', 'media', 'baja')),
    razon TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aplicada', 'rechazada')),
    aplicada_por TEXT,
    aplicada_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movimiento_id) REFERENCES movimientos_bancarios(id),
    FOREIGN KEY (transaccion_id) REFERENCES transacciones(id)
);

-- Tabla de movimientos bancarios (si no existe)
CREATE TABLE IF NOT EXISTS movimientos_bancarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cuenta_bancaria_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    monto DECIMAL(15,2) NOT NULL,
    tipo TEXT CHECK(tipo IN ('debito', 'credito')),
    referencia TEXT,
    estado TEXT DEFAULT 'no_conciliado' CHECK(estado IN ('no_conciliado', 'conciliado')),
    transaccion_id INTEGER,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuenta_bancaria_id) REFERENCES cuentas_bancarias(id),
    FOREIGN KEY (transaccion_id) REFERENCES transacciones(id)
);

-- Tabla de cuentas bancarias (si no existe)
CREATE TABLE IF NOT EXISTS cuentas_bancarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    banco TEXT NOT NULL,
    numero_cuenta TEXT,
    tipo TEXT CHECK(tipo IN ('monetaria', 'ahorro', 'plazo_fijo')),
    moneda TEXT DEFAULT 'GTQ',
    cuenta_contable_id INTEGER,
    saldo_actual DECIMAL(15,2) DEFAULT 0,
    activa BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuenta_contable_id) REFERENCES cuentas_contables(id)
);

-- Tabla de cierres mensuales (si no existe)
CREATE TABLE IF NOT EXISTS cierres_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes TEXT UNIQUE NOT NULL, -- Formato YYYY-MM
    estado TEXT DEFAULT 'abierto' CHECK(estado IN ('abierto', 'en_proceso', 'cerrado')),
    cerrado_por TEXT,
    cerrado_at TIMESTAMP,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas_financieras(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_nivel ON alertas_financieras(nivel);
CREATE INDEX IF NOT EXISTS idx_alertas_created ON alertas_financieras(created_at);
CREATE INDEX IF NOT EXISTS idx_movimientos_estado ON movimientos_bancarios(estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON movimientos_bancarios(cuenta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_sugerencias_estado ON sugerencias_conciliacion(estado);

-- Insertar datos de ejemplo para testing
INSERT OR IGNORE INTO cuentas_bancarias (id, nombre, banco, numero_cuenta, tipo, moneda) 
VALUES 
    (1, 'Cuenta Principal', 'Banco Industrial', '1234567890', 'monetaria', 'GTQ'),
    (2, 'Cuenta Dólares', 'Banco Industrial', '0987654321', 'monetaria', 'USD');

-- Insertar cierre del mes actual si no existe
INSERT OR IGNORE INTO cierres_mensuales (mes, estado, created_at)
VALUES (
    strftime('%Y-%m', 'now'), 
    'abierto', 
    datetime('now')
);
