-- Migration: Add missing columns to transacciones table for AI insights
-- Created: 2026-04-08
-- Description: Add cliente_id and nombre_cliente columns to support AI analysis

-- Agregar columnas faltantes a transacciones
ALTER TABLE transacciones ADD COLUMN cliente_id INTEGER;
ALTER TABLE transacciones ADD COLUMN nombre_cliente TEXT;

-- Actualizar índices para mejorar performance de queries
CREATE INDEX IF NOT EXISTS idx_transacciones_cliente ON transacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones(categoria);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha);
