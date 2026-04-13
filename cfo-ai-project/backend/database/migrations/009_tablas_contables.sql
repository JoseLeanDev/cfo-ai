-- Migración 009: Tablas contables para agentes IA
-- Crea tablas de cuentas contables y transacciones con la estructura correcta

-- Tabla de cuentas contables (catálogo de cuentas)
CREATE TABLE IF NOT EXISTS cuentas_contables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('activo', 'pasivo', 'capital', 'ingreso', 'gasto')),
    parent_id INTEGER,
    nivel INTEGER DEFAULT 1,
    activa BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES cuentas_contables(id)
);

-- Tabla de saldos por cuenta y período
CREATE TABLE IF NOT EXISTS saldos_cuentas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cuenta_id INTEGER NOT NULL,
    periodo TEXT NOT NULL, -- Formato YYYY-MM
    saldo_inicial DECIMAL(15,2) DEFAULT 0,
    saldo_actual DECIMAL(15,2) DEFAULT 0,
    total_debe DECIMAL(15,2) DEFAULT 0,
    total_haber DECIMAL(15,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cuenta_id, periodo),
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_contables(id)
);

-- Tabla de transacciones contables (estructura completa)
CREATE TABLE IF NOT EXISTS transacciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    cuenta_id INTEGER NOT NULL,
    tipo TEXT CHECK(tipo IN ('debe', 'haber')) NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    descripcion TEXT,
    referencia TEXT,
    documento TEXT,
    empresa_id INTEGER,
    cliente_id INTEGER,
    nombre_cliente TEXT,
    categoria TEXT,
    moneda TEXT DEFAULT 'GTQ',
    tasa_cambio DECIMAL(10,6) DEFAULT 1,
    asiento_id TEXT,
    conciliacion_id INTEGER,
    estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'anulado')),
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas_contables(id)
);

-- Índices para optimizar consultas de agentes
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_cuenta ON transacciones(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_cuentas_codigo ON cuentas_contables(codigo);
CREATE INDEX IF NOT EXISTS idx_cuentas_tipo ON cuentas_contables(tipo);
CREATE INDEX IF NOT EXISTS idx_saldos_periodo ON saldos_cuentas(periodo);
CREATE INDEX IF NOT EXISTS idx_saldos_cuenta ON saldos_cuentas(cuenta_id);

-- Insertar cuentas contables básicas
INSERT OR IGNORE INTO cuentas_contables (codigo, nombre, tipo, nivel) VALUES
('1000', 'ACTIVOS', 'activo', 1),
('1100', 'Activos Corrientes', 'activo', 2),
('1110', 'Caja', 'activo', 3),
('1120', 'Bancos', 'activo', 3),
('1130', 'Clientes', 'activo', 3),
('1140', 'Inventarios', 'activo', 3),
('1150', 'Documentos por Cobrar', 'activo', 3),
('1200', 'Activos Fijos', 'activo', 2),
('2000', 'PASIVOS', 'pasivo', 1),
('2100', 'Pasivos Corrientes', 'pasivo', 2),
('2110', 'Proveedores', 'pasivo', 3),
('2120', 'Documentos por Pagar', 'pasivo', 3),
('2130', 'Préstamos Bancarios', 'pasivo', 3),
('3000', 'CAPITAL', 'capital', 1),
('3100', 'Capital Social', 'capital', 2),
('3200', 'Reservas', 'capital', 2),
('3300', 'Resultados del Ejercicio', 'capital', 2),
('4000', 'INGRESOS', 'ingreso', 1),
('4100', 'Ventas', 'ingreso', 2),
('4200', 'Otros Ingresos', 'ingreso', 2),
('5000', 'GASTOS', 'gasto', 1),
('5100', 'Costo de Ventas', 'gasto', 2),
('5200', 'Gastos Operativos', 'gasto', 2),
('5300', 'Gastos Administrativos', 'gasto', 2);

-- Insertar saldos iniciales para el período actual
INSERT OR IGNORE INTO saldos_cuentas (cuenta_id, periodo, saldo_inicial, saldo_actual, total_debe, total_haber)
SELECT id, strftime('%Y-%m', 'now'), 0, 0, 0, 0 FROM cuentas_contables;

-- Insertar algunas transacciones de ejemplo
INSERT OR IGNORE INTO transacciones (fecha, cuenta_id, tipo, monto, descripcion, referencia, categoria)
SELECT 
    date('now', '-' || abs(random()) % 10 || ' days'),
    c.id,
    CASE WHEN abs(random()) % 2 = 0 THEN 'debe' ELSE 'haber' END,
    abs(random()) % 10000 + 100,
    'Transacción de ejemplo',
    'REF-' || abs(random()) % 10000,
    'general'
FROM cuentas_contables c
WHERE c.codigo IN ('1110', '1120', '1130', '2110', '4100', '5100')
LIMIT 20;
