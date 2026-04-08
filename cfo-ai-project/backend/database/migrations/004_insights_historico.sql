-- Migration: Tabla de histórico de insights de IA
-- Created: 2026-04-08
-- Description: Almacena insights generados por IA para consulta histórica

CREATE TABLE IF NOT EXISTS insights_historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL DEFAULT 'default',
    
    -- Identificación del insight
    insight_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('gasto', 'ingreso', 'alerta', 'oportunidad')),
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
    
    -- Contenido
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Impacto financiero
    impact REAL DEFAULT 0,
    currency TEXT DEFAULT 'GTQ',
    category TEXT,
    
    -- Acción sugerida
    action TEXT,
    action_label TEXT,
    
    -- Metadata de cambios
    change_percent REAL,
    
    -- Estado
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'dismissed', 'resolved')),
    dismissed_at DATETIME,
    dismissed_by INTEGER,
    
    -- Período de análisis
    periodo_desde DATE,
    periodo_hasta DATE,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Agentes que generaron el insight
    agent_source TEXT,
    agent_version TEXT
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_insights_empresa ON insights_historico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights_historico(type);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON insights_historico(severity);
CREATE INDEX IF NOT EXISTS idx_insights_status ON insights_historico(status);
CREATE INDEX IF NOT EXISTS idx_insights_created ON insights_historico(created_at);
CREATE INDEX IF NOT EXISTS idx_insights_periodo ON insights_historico(periodo_desde, periodo_hasta);

-- Trigger para actualizar updated_at
CREATE TRIGGER IF NOT EXISTS trg_insights_updated_at
AFTER UPDATE ON insights_historico
FOR EACH ROW
BEGIN
    UPDATE insights_historico SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
