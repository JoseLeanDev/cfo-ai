-- Migration 006: Tablas para sistema de agentes programados
-- Crear tablas necesarias para el funcionamiento de los agentes de IA

-- Tabla para snapshots financieros diarios
CREATE TABLE IF NOT EXISTS snapshots_financieros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    metricas_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_fecha ON snapshots_financieros(fecha);

-- Tabla para control de cierres mensuales
CREATE TABLE IF NOT EXISTS cierres_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes TEXT NOT NULL UNIQUE,
    estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_proceso', 'cerrado')),
    fecha_cierre DATETIME,
    observaciones TEXT,
    cerrado_por INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cerrado_por) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_cierres_mes ON cierres_mensuales(mes);
CREATE INDEX IF NOT EXISTS idx_cierres_estado ON cierres_mensuales(estado);

-- Tabla para documentos de soporte (si no existe)
CREATE TABLE IF NOT EXISTS documentos_soporte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaccion_id INTEGER,
    tipo_documento TEXT,
    numero_documento TEXT,
    archivo_path TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validado', 'rechazado')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaccion_id) REFERENCES transacciones(id)
);

CREATE INDEX IF NOT EXISTS idx_docs_transaccion ON documentos_soporte(transaccion_id);
CREATE INDEX IF NOT EXISTS idx_docs_estado ON documentos_soporte(estado);

-- Tabla para auxiliares de terceros (CxP/CxC)
CREATE TABLE IF NOT EXISTS auxiliares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tercero_id INTEGER NOT NULL,
    tipo TEXT CHECK (tipo IN ('cliente', 'proveedor')),
    saldo_pendiente REAL DEFAULT 0,
    fecha_ultimo_movimiento DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tercero_id) REFERENCES terceros(id)
);

CREATE INDEX IF NOT EXISTS idx_auxiliares_tercero ON auxiliares(tercero_id);

-- Tabla para items temporales de conciliación
CREATE TABLE IF NOT EXISTS temp_conciliacion_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conciliacion_id INTEGER NOT NULL,
    tipo TEXT CHECK (tipo IN ('banco_no_contable', 'contable_no_banco', 'diferencia')),
    descripcion TEXT,
    monto REAL,
    fecha DATE,
    referencia TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'reconciliado', 'ignorado')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conciliacion_id) REFERENCES conciliaciones(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_temp_items_conciliacion ON temp_conciliacion_items(conciliacion_id);
CREATE INDEX IF NOT EXISTS idx_temp_items_estado ON temp_conciliacion_items(estado);

-- Insertar cierre para el mes actual si no existe
INSERT OR IGNORE INTO cierres_mensuales (mes, estado)
VALUES (strftime('%Y-%m', 'now'), 'abierto');

-- Seed data: Insertar algunos auxiliares de ejemplo si no existen
INSERT OR IGNORE INTO auxiliares (tercero_id, tipo, saldo_pendiente)
SELECT id, 'cliente', 0 FROM terceros WHERE tipo = 'cliente';

INSERT OR IGNORE INTO auxiliares (tercero_id, tipo, saldo_pendiente)
SELECT id, 'proveedor', 0 FROM terceros WHERE tipo = 'proveedor';
