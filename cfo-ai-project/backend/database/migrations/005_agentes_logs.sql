-- Migration: Tabla de logs de actividades de agentes IA
-- Created: 2026-04-08
-- Description: Registra todas las acciones realizadas por los agentes de IA

CREATE TABLE IF NOT EXISTS agentes_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL DEFAULT 'default',
    
    -- Agente que realizó la acción
    agente_nombre TEXT NOT NULL,
    agente_tipo TEXT NOT NULL CHECK(agente_tipo IN (
        'caja',
        'analisis', 
        'cobranza',
        'contabilidad',
        'orchestrator',
        'Sistema'
    )),
    agente_version TEXT DEFAULT '2.0',
    
    -- Categoría de la acción
    categoria TEXT NOT NULL CHECK(categoria IN (
        'posicion_caja',
        'proyeccion_cashflow',
        'alerta_runway',
        'kpis_diarios',
        'analisis_semanal',
        'analisis_mensual',
        'aging_cartera',
        'metricas_cobranza',
        'importacion_transacciones',
        'conciliacion_bancaria',
        'cierre_mensual',
        'calculos_fiscales',
        'briefing_diario',
        'error_sistema',
        'otro'
    )),
    
    -- Descripción de la acción
    descripcion TEXT NOT NULL,
    detalles_json TEXT, -- Datos adicionales en formato JSON
    
    -- Entidad afectada (opcional)
    entidad_tipo TEXT, -- ej: 'transaccion', 'cuenta', 'cliente', 'asiento'
    entidad_id TEXT,   -- ID de la entidad afectada
    
    -- Impacto/Resultado
    impacto_valor REAL,
    impacto_moneda TEXT DEFAULT 'GTQ',
    resultado_status TEXT CHECK(resultado_status IN ('exito', 'advertencia', 'error', 'en_progreso')),
    
    -- Metadatos
    ip_origen TEXT,
    usuario_id INTEGER,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duracion_ms INTEGER -- Duración de la operación en milisegundos
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_logs_empresa ON agentes_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_logs_agente ON agentes_logs(agente_tipo);
CREATE INDEX IF NOT EXISTS idx_logs_categoria ON agentes_logs(categoria);
CREATE INDEX IF NOT EXISTS idx_logs_created ON agentes_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_status ON agentes_logs(resultado_status);
CREATE INDEX IF NOT EXISTS idx_logs_entidad ON agentes_logs(entidad_tipo, entidad_id);
