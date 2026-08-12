-- Migración: Vistas para margen por vendedor, cliente y línea de producto
-- Usa tabla ventas_detalle existente

-- ============================================
-- 1. TABLA DE VENDEDORES (si no existe)
-- ============================================
CREATE TABLE IF NOT EXISTS vendedores (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL DEFAULT 1,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    meta_mensual DECIMAL(12,2),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendedores_empresa ON vendedores(empresa_id);

-- ============================================
-- 2. TABLA DE CLIENTES (si no existe)
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL DEFAULT 1,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'regular',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);

-- ============================================
-- 3. VISTA: MARGEN POR VENDEDOR
-- ============================================
DROP VIEW IF EXISTS vw_margen_vendedor;
CREATE VIEW vw_margen_vendedor AS
WITH periodos AS (
    SELECT 
        DATE_TRUNC('month', MAX(fecha))::date as mes_actual,
        DATE_TRUNC('month', MAX(fecha))::date - INTERVAL '12 months' as inicio_actual,
        DATE_TRUNC('month', MAX(fecha))::date - INTERVAL '24 months' as inicio_historico
    FROM ventas_detalle
),
actual AS (
    SELECT 
        v.vendedor_id as id,
        COALESCE(ve.nombre, 'Vendedor ' || v.vendedor_id) as nombre,
        SUM(v.cantidad) as unidades_12m,
        SUM(v.total_venta) as ventas_12m,
        SUM(v.total_costo) as costos_12m,
        CASE WHEN SUM(v.total_venta) > 0 
            THEN ((SUM(v.total_venta) - SUM(v.total_costo)) / SUM(v.total_venta) * 100)
            ELSE 0 END as margen_pct_actual
    FROM ventas_detalle v
    LEFT JOIN vendedores ve ON v.vendedor_id = ve.id
    CROSS JOIN periodos p
    WHERE v.fecha >= p.inicio_actual AND v.fecha < p.mes_actual
      AND v.vendedor_id IS NOT NULL
    GROUP BY v.vendedor_id, ve.nombre
),
historico AS (
    SELECT 
        v.vendedor_id as id,
        CASE WHEN SUM(v.total_venta) > 0 
            THEN ((SUM(v.total_venta) - SUM(v.total_costo)) / SUM(v.total_venta) * 100)
            ELSE 0 END as margen_pct_historico
    FROM ventas_detalle v
    CROSS JOIN periodos p
    WHERE v.fecha >= p.inicio_historico AND v.fecha < p.inicio_actual
      AND v.vendedor_id IS NOT NULL
    GROUP BY v.vendedor_id
)
SELECT 
    a.id,
    a.nombre,
    ROUND(COALESCE(a.margen_pct_actual, 0)::numeric, 2) as margen_pct_actual,
    ROUND(COALESCE(h.margen_pct_historico, a.margen_pct_actual)::numeric, 2) as margen_pct_historico,
    ROUND((COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual))::numeric, 2) as delta_puntos,
    COALESCE(a.unidades_12m, 0) as unidades_12m,
    COALESCE(a.ventas_12m, 0) as ventas_12m,
    COALESCE(a.costos_12m, 0) as costos_12m,
    CASE 
        WHEN COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual) <= -5 THEN 'rojo'
        WHEN COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual) <= -2 THEN 'ambar'
        ELSE 'verde'
    END as semaforo,
    ROUND(CASE 
        WHEN h.margen_pct_historico > 0 AND a.margen_pct_actual > 0 
        THEN ((h.margen_pct_historico - a.margen_pct_actual) / 100) * COALESCE(a.ventas_12m, 0)
        ELSE 0 
    END::numeric, 2) as quetzales_perdidos
FROM actual a
LEFT JOIN historico h ON a.id = h.id;

-- ============================================
-- 4. VISTA: MARGEN POR CLIENTE
-- ============================================
DROP VIEW IF EXISTS vw_margen_cliente;
CREATE VIEW vw_margen_cliente AS
WITH periodos AS (
    SELECT 
        DATE_TRUNC('month', MAX(fecha))::date as mes_actual,
        DATE_TRUNC('month', MAX(fecha))::date - INTERVAL '12 months' as inicio_actual,
        DATE_TRUNC('month', MAX(fecha))::date - INTERVAL '24 months' as inicio_historico
    FROM ventas_detalle
),
actual AS (
    SELECT 
        v.cliente_nombre as id,
        v.cliente_nombre as nombre,
        SUM(v.cantidad) as unidades_12m,
        SUM(v.total_venta) as ventas_12m,
        SUM(v.total_costo) as costos_12m,
        CASE WHEN SUM(v.total_venta) > 0 
            THEN ((SUM(v.total_venta) - SUM(v.total_costo)) / SUM(v.total_venta) * 100)
            ELSE 0 END as margen_pct_actual
    FROM ventas_detalle v
    CROSS JOIN periodos p
    WHERE v.fecha >= p.inicio_actual AND v.fecha < p.mes_actual
      AND v.cliente_nombre IS NOT NULL
    GROUP BY v.cliente_nombre
),
historico AS (
    SELECT 
        v.cliente_nombre as id,
        CASE WHEN SUM(v.total_venta) > 0 
            THEN ((SUM(v.total_venta) - SUM(v.total_costo)) / SUM(v.total_venta) * 100)
            ELSE 0 END as margen_pct_historico
    FROM ventas_detalle v
    CROSS JOIN periodos p
    WHERE v.fecha >= p.inicio_historico AND v.fecha < p.inicio_actual
      AND v.cliente_nombre IS NOT NULL
    GROUP BY v.cliente_nombre
)
SELECT 
    a.id,
    a.nombre,
    ROUND(COALESCE(a.margen_pct_actual, 0)::numeric, 2) as margen_pct_actual,
    ROUND(COALESCE(h.margen_pct_historico, a.margen_pct_actual)::numeric, 2) as margen_pct_historico,
    ROUND((COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual))::numeric, 2) as delta_puntos,
    COALESCE(a.unidades_12m, 0) as unidades_12m,
    COALESCE(a.ventas_12m, 0) as ventas_12m,
    COALESCE(a.costos_12m, 0) as costos_12m,
    CASE 
        WHEN COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual) <= -5 THEN 'rojo'
        WHEN COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual) <= -2 THEN 'ambar'
        ELSE 'verde'
    END as semaforo,
    ROUND(CASE 
        WHEN h.margen_pct_historico > 0 AND a.margen_pct_actual > 0 
        THEN ((h.margen_pct_historico - a.margen_pct_actual) / 100) * COALESCE(a.ventas_12m, 0)
        ELSE 0 
    END::numeric, 2) as quetzales_perdidos
FROM actual a
LEFT JOIN historico h ON a.id = h.id;

-- ============================================
-- 5. VISTA: MARGEN POR LÍNEA DE PRODUCTO (categoría)
-- ============================================
DROP VIEW IF EXISTS vw_margen_linea;
CREATE VIEW vw_margen_linea AS
WITH periodos AS (
    SELECT 
        DATE_TRUNC('month', MAX(ph.fecha))::date as mes_actual,
        DATE_TRUNC('month', MAX(ph.fecha))::date - INTERVAL '12 months' as inicio_actual,
        DATE_TRUNC('month', MAX(ph.fecha))::date - INTERVAL '24 months' as inicio_historico
    FROM productos_historial ph
),
actual AS (
    SELECT 
        p.categoria as id,
        p.categoria as nombre,
        SUM(ph.unidades_vendidas) as unidades_12m,
        SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) as ventas_12m,
        SUM(ph.costo_unitario * ph.unidades_vendidas) as costos_12m,
        CASE WHEN SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) > 0 
            THEN ((SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) - SUM(ph.costo_unitario * ph.unidades_vendidas)) / SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) * 100)
            ELSE 0 END as margen_pct_actual
    FROM productos p
    JOIN productos_historial ph ON p.id = ph.producto_id
    CROSS JOIN periodos pe
    WHERE ph.fecha >= pe.inicio_actual AND ph.fecha < pe.mes_actual
      AND p.activo = TRUE
    GROUP BY p.categoria
),
historico AS (
    SELECT 
        p.categoria as id,
        CASE WHEN SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) > 0 
            THEN ((SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) - SUM(ph.costo_unitario * ph.unidades_vendidas)) / SUM(ph.precio_promedio_realizado * ph.unidades_vendidas) * 100)
            ELSE 0 END as margen_pct_historico
    FROM productos p
    JOIN productos_historial ph ON p.id = ph.producto_id
    CROSS JOIN periodos pe
    WHERE ph.fecha >= pe.inicio_historico AND ph.fecha < pe.inicio_actual
      AND p.activo = TRUE
    GROUP BY p.categoria
)
SELECT 
    a.id,
    a.nombre,
    ROUND(COALESCE(a.margen_pct_actual, 0)::numeric, 2) as margen_pct_actual,
    ROUND(COALESCE(h.margen_pct_historico, a.margen_pct_actual)::numeric, 2) as margen_pct_historico,
    ROUND((COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual))::numeric, 2) as delta_puntos,
    COALESCE(a.unidades_12m, 0) as unidades_12m,
    COALESCE(a.ventas_12m, 0) as ventas_12m,
    COALESCE(a.costos_12m, 0) as costos_12m,
    CASE 
        WHEN COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual) <= -5 THEN 'rojo'
        WHEN COALESCE(a.margen_pct_actual, 0) - COALESCE(h.margen_pct_historico, a.margen_pct_actual) <= -2 THEN 'ambar'
        ELSE 'verde'
    END as semaforo,
    ROUND(CASE 
        WHEN h.margen_pct_historico > 0 AND a.margen_pct_actual > 0 
        THEN ((h.margen_pct_historico - a.margen_pct_actual) / 100) * COALESCE(a.ventas_12m, 0)
        ELSE 0 
    END::numeric, 2) as quetzales_perdidos
FROM actual a
LEFT JOIN historico h ON a.id = h.id;
