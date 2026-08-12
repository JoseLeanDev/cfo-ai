-- Migración: Tablas y vistas para análisis de margen por vendedor, cliente y línea

-- ============================================
-- 1. TABLA DE VENDEDORES
-- ============================================
CREATE TABLE IF NOT EXISTS vendedores (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL DEFAULT 1,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    meta_mensual DECIMAL(12,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendedores_empresa ON vendedores(empresa_id);

-- ============================================
-- 2. TABLA DE VENTAS DETALLE (transaccional)
-- ============================================
CREATE TABLE IF NOT EXISTS ventas_detalle (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL DEFAULT 1,
    fecha DATE NOT NULL,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cliente_nombre VARCHAR(255) NOT NULL,
    vendedor_id INTEGER REFERENCES vendedores(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,2) NOT NULL,
    total_venta DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    total_costo DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
    margen_q DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * (precio_unitario - costo_unitario)) STORED,
    margen_pct DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN precio_unitario > 0 
        THEN ROUND(((precio_unitario - costo_unitario) / precio_unitario * 100)::numeric, 2)
        ELSE 0 END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventas_empresa ON ventas_detalle(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas_detalle(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_producto ON ventas_detalle(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas_detalle(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas_detalle(cliente_nombre);

-- ============================================
-- 3. VISTA: MARGEN POR VENDEDOR
-- ============================================
CREATE OR REPLACE VIEW vw_margen_vendedor AS
SELECT 
    v.id as vendedor_id,
    v.nombre as vendedor_nombre,
    v.meta_mensual,
    COUNT(DISTINCT vd.id) as num_ventas,
    SUM(vd.cantidad) as unidades_vendidas,
    SUM(vd.total_venta) as total_ventas_q,
    SUM(vd.total_costo) as total_costos_q,
    SUM(vd.margen_q) as margen_bruto_q,
    ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct,
    ROUND((SUM(vd.total_venta) / NULLIF(v.meta_mensual, 0) * 100)::numeric, 2) as cumplimiento_meta_pct
FROM vendedores v
LEFT JOIN ventas_detalle vd ON v.id = vd.vendedor_id AND vd.empresa_id = v.empresa_id
WHERE v.activo = TRUE
GROUP BY v.id, v.nombre, v.meta_mensual;

-- ============================================
-- 4. VISTA: MARGEN POR CLIENTE
-- ============================================
CREATE OR REPLACE VIEW vw_margen_cliente AS
SELECT 
    vd.cliente_nombre,
    COUNT(DISTINCT vd.id) as num_compras,
    COUNT(DISTINCT vd.producto_id) as sku_distintos,
    SUM(vd.cantidad) as unidades_compradas,
    SUM(vd.total_venta) as total_comprado_q,
    SUM(vd.total_costo) as total_costo_q,
    SUM(vd.margen_q) as margen_generado_q,
    ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct,
    MIN(vd.fecha) as primera_compra,
    MAX(vd.fecha) as ultima_compra,
    CASE 
        WHEN MAX(vd.fecha) >= CURRENT_DATE - INTERVAL '30 days' THEN 'activo'
        WHEN MAX(vd.fecha) >= CURRENT_DATE - INTERVAL '90 days' THEN 'inactivo'
        ELSE 'perdido'
    END as estado_cliente
FROM ventas_detalle vd
WHERE vd.empresa_id = 1
GROUP BY vd.cliente_nombre
ORDER BY SUM(vd.total_venta) DESC;

-- ============================================
-- 5. VISTA: MARGEN POR LÍNEA DE PRODUCTO
-- ============================================
CREATE OR REPLACE VIEW vw_margen_linea AS
SELECT 
    p.categoria as linea,
    COUNT(DISTINCT p.id) as num_skus,
    COUNT(DISTINCT vd.id) as num_ventas,
    SUM(vd.cantidad) as unidades_vendidas,
    SUM(vd.total_venta) as total_ventas_q,
    SUM(vd.total_costo) as total_costos_q,
    SUM(vd.margen_q) as margen_bruto_q,
    ROUND((SUM(vd.margen_q) / NULLIF(SUM(vd.total_venta), 0) * 100)::numeric, 2) as margen_pct,
    ROUND(AVG(vd.margen_pct)::numeric, 2) as margen_promedio_por_venta
FROM productos p
LEFT JOIN ventas_detalle vd ON p.id = vd.producto_id
WHERE p.activo = TRUE AND p.empresa_id = 1
GROUP BY p.categoria
ORDER BY SUM(vd.total_venta) DESC;
