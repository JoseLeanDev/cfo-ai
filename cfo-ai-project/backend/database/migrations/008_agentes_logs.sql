-- Migración 008: Tabla de logs de agentes IA
-- Crea la tabla para almacenar actividades de los agentes

CREATE TABLE IF NOT EXISTS agentes_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agente_nombre TEXT NOT NULL,
    agente_tipo TEXT NOT NULL,
    agente_version TEXT DEFAULT '1.0.0',
    categoria TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    detalles_json TEXT,
    impacto_valor DECIMAL(15,2),
    impacto_moneda TEXT DEFAULT 'GTQ',
    resultado_status TEXT DEFAULT 'exitoso' CHECK(resultado_status IN ('exitoso', 'error', 'advertencia')),
    duracion_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_agentes_logs_tipo ON agentes_logs(agente_tipo);
CREATE INDEX IF NOT EXISTS idx_agentes_logs_categoria ON agentes_logs(categoria);
CREATE INDEX IF NOT EXISTS idx_agentes_logs_status ON agentes_logs(resultado_status);
CREATE INDEX IF NOT EXISTS idx_agentes_logs_created ON agentes_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agentes_logs_agente_created ON agentes_logs(agente_tipo, created_at);
