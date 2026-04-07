-- Migration: Cierre Mensual y Conciliación Bancaria
-- Created: 2026-04-08
-- Description: Tablas para control de cierre contable y conciliación bancaria

-- =====================================================
-- 1. CIERRES MENSUALES
-- Control del proceso de cierre contable mensual
-- =====================================================
CREATE TABLE IF NOT EXISTS cierres_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    fecha_inicio DATE,
    fecha_cierre DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cerrado', 'reabierto')),
    responsable_id INTEGER,
    saldo_inicial DECIMAL(15, 2) DEFAULT 0,
    saldo_final DECIMAL(15, 2) DEFAULT 0,
    diferencia DECIMAL(15, 2) DEFAULT 0,
    observaciones TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    UNIQUE(anio, mes)
);

CREATE INDEX IF NOT EXISTS idx_cierres_estado ON cierres_mensuales(estado);
CREATE INDEX IF NOT EXISTS idx_cierres_fecha ON cierres_mensuales(anio, mes);
CREATE INDEX IF NOT EXISTS idx_cierres_responsable ON cierres_mensuales(responsable_id);

-- =====================================================
-- 2. CONCILIACIONES BANCARIAS
-- Encabezado de conciliaciones bancarias
-- =====================================================
CREATE TABLE IF NOT EXISTS conciliaciones_bancarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cierre_mensual_id INTEGER,
    cuenta_bancaria_id INTEGER NOT NULL,
    banco VARCHAR(100) NOT NULL,
    cuenta_numero VARCHAR(50) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    
    -- Saldos
    saldo_contable DECIMAL(15, 2) NOT NULL DEFAULT 0,
    saldo_bancario DECIMAL(15, 2) NOT NULL DEFAULT 0,
    diferencia DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Fechas
    fecha_conciliacion DATE NOT NULL,
    fecha_corte DATE NOT NULL,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_proceso', 'conciliado', 'diferencias', 'aprobado')),
    
    -- Metadatos
    elaborado_por INTEGER,
    revisado_por INTEGER,
    aprobado_por INTEGER,
    observaciones TEXT,
    archivo_adjunto VARCHAR(255),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cierre_mensual_id) REFERENCES cierres_mensuales(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_conciliaciones_cierre ON conciliaciones_bancarias(cierre_mensual_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_cuenta ON conciliaciones_bancarias(cuenta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_estado ON conciliaciones_bancarias(estado);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_fecha ON conciliaciones_bancarias(fecha_conciliacion);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_banco ON conciliaciones_bancarias(banco, cuenta_numero);

-- =====================================================
-- 3. CONCILIACION DETALLE
-- Items de diferencia en conciliaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS conciliacion_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conciliacion_id INTEGER NOT NULL,
    
    -- Tipo de diferencia
    tipo_diferencia VARCHAR(30) NOT NULL
        CHECK (tipo_diferencia IN (
            'cheque_pendiente',
            'deposito_transito',
            'nota_credito_no_registrada',
            'nota_debito_no_registrada',
            'error_transcripcion',
            'comision_bancaria',
            'intereses_ganados',
            'cheque_rechazado',
            'duplicado',
            'omision',
            'otro'
        )),
    
    -- Montos
    monto_contable DECIMAL(15, 2) DEFAULT 0,
    monto_bancario DECIMAL(15, 2) DEFAULT 0,
    diferencia DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    -- Descripción
    descripcion TEXT NOT NULL,
    referencia VARCHAR(100),
    fecha_transaccion DATE,
    
    -- Estado de ajuste
    ajustado BOOLEAN DEFAULT 0,
    fecha_ajuste DATE,
    asiento_contable_id INTEGER,
    
    -- Origen
    es_transaccion_sistema BOOLEAN DEFAULT 0,
    transaccion_id INTEGER,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conciliacion_id) REFERENCES conciliaciones_bancarias(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conciliacion_detalle_conciliacion ON conciliacion_detalle(conciliacion_id);
CREATE INDEX IF NOT EXISTS idx_conciliacion_detalle_tipo ON conciliacion_detalle(tipo_diferencia);
CREATE INDEX IF NOT EXISTS idx_conciliacion_detalle_ajustado ON conciliacion_detalle(ajustado);
CREATE INDEX IF NOT EXISTS idx_conciliacion_detalle_fecha ON conciliacion_detalle(fecha_transaccion);

-- =====================================================
-- 4. ESTADOS FINANCIEROS HISTORICO
-- Snapshots mensuales de estados financieros
-- =====================================================
CREATE TABLE IF NOT EXISTS estados_financieros_historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cierre_mensual_id INTEGER,
    
    -- Período
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    
    -- Tipo de estado
    tipo_estado VARCHAR(30) NOT NULL
        CHECK (tipo_estado IN ('balance_general', 'estado_resultados', 'flujo_efectivo', 'cambios_patrimonio')),
    
    -- Versionado
    version INTEGER DEFAULT 1,
    es_definitivo BOOLEAN DEFAULT 0,
    
    -- Datos del estado financiero (JSON)
    datos_json TEXT NOT NULL,
    
    -- Totales principales (para consultas rápidas)
    total_activos DECIMAL(15, 2) DEFAULT 0,
    total_pasivos DECIMAL(15, 2) DEFAULT 0,
    total_patrimonio DECIMAL(15, 2) DEFAULT 0,
    ingresos DECIMAL(15, 2) DEFAULT 0,
    gastos DECIMAL(15, 2) DEFAULT 0,
    utilidad_neta DECIMAL(15, 2) DEFAULT 0,
    
    -- Metadatos
    generado_por INTEGER,
    fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    aprobado_por INTEGER,
    fecha_aprobacion DATETIME,
    observaciones TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cierre_mensual_id) REFERENCES cierres_mensuales(id) ON DELETE SET NULL,
    UNIQUE(anio, mes, tipo_estado, version)
);

CREATE INDEX IF NOT EXISTS idx_estados_cierre ON estados_financieros_historico(cierre_mensual_id);
CREATE INDEX IF NOT EXISTS idx_estados_periodo ON estados_financieros_historico(anio, mes);
CREATE INDEX IF NOT EXISTS idx_estados_tipo ON estados_financieros_historico(tipo_estado);
CREATE INDEX IF NOT EXISTS idx_estados_definitivo ON estados_financieros_historico(es_definitivo);

-- =====================================================
-- 5. ALERTAS CIERRE
-- Problemas detectados durante el cierre
-- =====================================================
CREATE TABLE IF NOT EXISTS alertas_cierre (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cierre_mensual_id INTEGER,
    
    -- Clasificación
    nivel VARCHAR(10) NOT NULL DEFAULT 'media'
        CHECK (nivel IN ('baja', 'media', 'alta', 'critica')),
    categoria VARCHAR(30) NOT NULL
        CHECK (categoria IN (
            'diferencia_conciliacion',
            'asiento_descuadrado',
            'cuenta_saldo_anormal',
            'documento_pendiente',
            'autorizacion_requerida',
            'limite_superado',
            'fecha_invalida',
            'datos_incompletos',
            'otro'
        )),
    
    -- Descripción
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    
    -- Referencias
    tabla_origen VARCHAR(50),
    registro_id INTEGER,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'en_revision', 'resuelta', 'ignorada')),
    
    -- Resolución
    resuelta_por INTEGER,
    fecha_resolucion DATETIME,
    solucion_aplicada TEXT,
    
    -- Metadatos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    
    FOREIGN KEY (cierre_mensual_id) REFERENCES cierres_mensuales(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alertas_cierre ON alertas_cierre(cierre_mensual_id);
CREATE INDEX IF NOT EXISTS idx_alertas_nivel ON alertas_cierre(nivel);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas_cierre(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_categoria ON alertas_cierre(categoria);
CREATE INDEX IF NOT EXISTS idx_alertas_created ON alertas_cierre(created_at);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

-- Trigger para cierres_mensuales
CREATE TRIGGER IF NOT EXISTS trg_cierres_updated_at
AFTER UPDATE ON cierres_mensuales
FOR EACH ROW
BEGIN
    UPDATE cierres_mensuales SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para conciliaciones_bancarias
CREATE TRIGGER IF NOT EXISTS trg_conciliaciones_updated_at
AFTER UPDATE ON conciliaciones_bancarias
FOR EACH ROW
BEGIN
    UPDATE conciliaciones_bancarias SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para conciliacion_detalle
CREATE TRIGGER IF NOT EXISTS trg_conciliacion_detalle_updated_at
AFTER UPDATE ON conciliacion_detalle
FOR EACH ROW
BEGIN
    UPDATE conciliacion_detalle SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para estados_financieros_historico
CREATE TRIGGER IF NOT EXISTS trg_estados_updated_at
AFTER UPDATE ON estados_financieros_historico
FOR EACH ROW
BEGIN
    UPDATE estados_financieros_historico SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para alertas_cierre
CREATE TRIGGER IF NOT EXISTS trg_alertas_updated_at
AFTER UPDATE ON alertas_cierre
FOR EACH ROW
BEGIN
    UPDATE alertas_cierre SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
