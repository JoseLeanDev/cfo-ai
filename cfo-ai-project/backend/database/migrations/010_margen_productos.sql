-- Migración: Tablas para análisis de margen por producto
-- Crea tablas de productos, historial de precios/costos, y ventas por producto

-- ============================================
-- 1. TABLA DE PRODUCTOS (SKUs)
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL DEFAULT 1,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    unidad_medida VARCHAR(50) DEFAULT 'unidad',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- ============================================
-- 2. TABLA DE HISTORIAL DE PRECIOS Y COSTOS
-- ============================================
CREATE TABLE IF NOT EXISTS productos_historial (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    precio_promedio_realizado DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,2) NOT NULL,
    costo_tipo VARCHAR(50) DEFAULT 'cpp', -- cpp = costo promedio ponderado, reposicion = última compra
    unidades_vendidas INTEGER DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producto_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_productos_historial_producto ON productos_historial(producto_id);
CREATE INDEX IF NOT EXISTS idx_productos_historial_fecha ON productos_historial(fecha);

-- ============================================
-- 3. TABLA DE ALERTAS DE MARGEN
-- ============================================
CREATE TABLE IF NOT EXISTS alertas_margen (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL DEFAULT 1,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(50) NOT NULL, -- 'erosion_3pp_90d', 'erosion_5pp_12m', 'precio_sugerido'
    puntos_perdidos DECIMAL(5,2),
    margen_anterior DECIMAL(5,2),
    margen_actual DECIMAL(5,2),
    precio_sugerido DECIMAL(12,2),
    quetzales_perdidos DECIMAL(12,2),
    periodo_desde DATE,
    periodo_hasta DATE,
    status VARCHAR(20) DEFAULT 'activa', -- activa, revisada, descartada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_margen_empresa ON alertas_margen(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alertas_margen_status ON alertas_margen(status);
CREATE INDEX IF NOT EXISTS idx_alertas_margen_created ON alertas_margen(created_at);

-- ============================================
-- 4. VISTA DE MARGEN POR PRODUCTO (últimos 12 meses vs mes mismo año anterior)
-- ============================================
CREATE OR REPLACE VIEW vw_margen_productos AS
WITH ultimo_mes AS (
    SELECT 
        ph.producto_id,
        DATE_TRUNC('month', MAX(ph.fecha))::date as mes_actual
    FROM productos_historial ph
    GROUP BY ph.producto_id
),
margen_actual AS (
    SELECT 
        ph.producto_id,
        AVG(ph.precio_promedio_realizado) as precio_actual,
        AVG(ph.costo_unitario) as costo_actual,
        AVG((ph.precio_promedio_realizado - ph.costo_unitario) / NULLIF(ph.precio_promedio_realizado, 0) * 100) as margen_pct_actual,
        SUM(ph.unidades_vendidas) as unidades_12m
    FROM productos_historial ph
    JOIN ultimo_mes um ON ph.producto_id = um.producto_id
    WHERE ph.fecha >= um.mes_actual - INTERVAL '12 months'
      AND ph.fecha < um.mes_actual
    GROUP BY ph.producto_id
),
margen_historico AS (
    SELECT 
        ph.producto_id,
        AVG((ph.precio_promedio_realizado - ph.costo_unitario) / NULLIF(ph.precio_promedio_realizado, 0) * 100) as margen_pct_historico
    FROM productos_historial ph
    JOIN ultimo_mes um ON ph.producto_id = um.producto_id
    WHERE ph.fecha >= um.mes_actual - INTERVAL '24 months'
      AND ph.fecha < um.mes_actual - INTERVAL '12 months'
    GROUP BY ph.producto_id
)
SELECT 
    p.id,
    p.sku,
    p.nombre,
    p.categoria,
    COALESCE(ma.precio_actual, 0) as precio_actual,
    COALESCE(ma.costo_actual, 0) as costo_actual,
    COALESCE(ma.margen_pct_actual, 0) as margen_pct_actual,
    COALESCE(mh.margen_pct_historico, ma.margen_pct_actual) as margen_pct_historico,
    COALESCE(ma.margen_pct_actual, 0) - COALESCE(mh.margen_pct_historico, ma.margen_pct_actual) as delta_puntos,
    COALESCE(ma.unidades_12m, 0) as unidades_12m,
    CASE 
        WHEN COALESCE(ma.margen_pct_actual, 0) - COALESCE(mh.margen_pct_historico, ma.margen_pct_actual) <= -5 THEN 'rojo'
        WHEN COALESCE(ma.margen_pct_actual, 0) - COALESCE(mh.margen_pct_historico, ma.margen_pct_actual) <= -2 THEN 'ambar'
        ELSE 'verde'
    END as semaforo,
    CASE 
        WHEN mh.margen_pct_historico > 0 AND ma.margen_pct_actual > 0 
        THEN ((mh.margen_pct_historico - ma.margen_pct_actual) / 100) * COALESCE(ma.precio_actual, 0) * COALESCE(ma.unidades_12m, 0)
        ELSE 0 
    END as quetzales_perdidos,
    CASE 
        WHEN ma.costo_actual > 0 AND mh.margen_pct_historico > 0
        THEN ma.costo_actual / (1 - (mh.margen_pct_historico / 100))
        ELSE ma.precio_actual 
    END as precio_sugerido
FROM productos p
LEFT JOIN margen_actual ma ON p.id = ma.producto_id
LEFT JOIN margen_historico mh ON p.id = mh.producto_id
WHERE p.activo = TRUE;
