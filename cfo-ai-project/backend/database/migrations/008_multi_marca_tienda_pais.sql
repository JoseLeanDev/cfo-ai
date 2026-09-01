-- ============================================
-- MIGRACIÓN: Multi-Marca, Multi-Tienda, Multi-País
-- Para corporación retail centroamericana
-- ============================================

-- ============================================
-- 1. TABLA DE PAISES
-- ============================================
CREATE TABLE IF NOT EXISTS paises (
    id SERIAL PRIMARY KEY,
    codigo_iso CHAR(2) UNIQUE NOT NULL,  -- GT, SV, HN, CR, NI
    nombre VARCHAR(100) NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'GTQ',
    tipo_cambio_usd DECIMAL(10,4) DEFAULT 1.0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO paises (codigo_iso, nombre, moneda, tipo_cambio_usd) VALUES
('GT', 'Guatemala', 'GTQ', 7.75),
('SV', 'El Salvador', 'USD', 1.0),
('HN', 'Honduras', 'HNL', 24.75),
('CR', 'Costa Rica', 'CRC', 520.0),
('NI', 'Nicaragua', 'NIO', 36.5)
ON CONFLICT (codigo_iso) DO NOTHING;

-- ============================================
-- 2. TABLA DE MARCAS
-- ============================================
CREATE TABLE IF NOT EXISTS marcas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL DEFAULT 1,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    segmento VARCHAR(50), -- 'premium', 'masivo', 'outlet'
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marcas_empresa ON marcas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_marcas_activo ON marcas(activo);

-- ============================================
-- 3. TABLA DE TIENDAS / UBICACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS tiendas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL DEFAULT 1,
    marca_id INTEGER REFERENCES marcas(id),
    pais_id INTEGER REFERENCES paises(id),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100),
    direccion TEXT,
    tipo VARCHAR(50) DEFAULT 'tienda', -- 'tienda', 'outlet', 'ecommerce', 'franquicia'
    metros_cuadrados INTEGER,
    activo BOOLEAN DEFAULT TRUE,
    fecha_apertura DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tiendas_empresa ON tiendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tiendas_marca ON tiendas(marca_id);
CREATE INDEX IF NOT EXISTS idx_tiendas_pais ON tiendas(pais_id);
CREATE INDEX IF NOT EXISTS idx_tiendas_activo ON tiendas(activo);

-- ============================================
-- 4. AGREGAR CAMPOS A PRODUCTOS
-- ============================================
ALTER TABLE productos 
    ADD COLUMN IF NOT EXISTS marca_id INTEGER REFERENCES marcas(id),
    ADD COLUMN IF NOT EXISTS pais_origen_id INTEGER REFERENCES paises(id);

CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca_id);

-- ============================================
-- 5. AGREGAR CAMPOS A VENTAS_DETALLE
-- ============================================
ALTER TABLE ventas_detalle
    ADD COLUMN IF NOT EXISTS tienda_id INTEGER REFERENCES tiendas(id),
    ADD COLUMN IF NOT EXISTS marca_id INTEGER REFERENCES marcas(id),
    ADD COLUMN IF NOT EXISTS pais_id INTEGER REFERENCES paises(id);

CREATE INDEX IF NOT EXISTS idx_ventas_tienda ON ventas_detalle(tienda_id);
CREATE INDEX IF NOT EXISTS idx_ventas_marca ON ventas_detalle(marca_id);
CREATE INDEX IF NOT EXISTS idx_ventas_pais ON ventas_detalle(pais_id);

-- ============================================
-- 6. AGREGAR CAMPOS A VENDEDORES
-- ============================================
ALTER TABLE vendedores
    ADD COLUMN IF NOT EXISTS tienda_id INTEGER REFERENCES tiendas(id);

CREATE INDEX IF NOT EXISTS idx_vendedores_tienda ON vendedores(tienda_id);

-- ============================================
-- 7. VISTAS DE MARGEN ACTUALIZADAS (multi-dimensión)
-- ============================================

-- Vista de margen por MARCA
CREATE OR REPLACE VIEW vw_margen_marca AS
WITH margen_actual AS (
    SELECT 
        m.id AS marca_id,
        m.nombre,
        COUNT(DISTINCT vd.id) AS num_ventas,
        SUM(vd.cantidad) AS unidades_vendidas,
        SUM(vd.total_venta) AS total_ventas_q,
        SUM(vd.total_costo) AS total_costos_q,
        SUM(vd.margen_q) AS margen_bruto_q,
        ROUND(AVG(vd.margen_pct)::numeric, 2) AS margen_pct
    FROM marcas m
    LEFT JOIN ventas_detalle vd ON m.id = vd.marca_id
    WHERE m.activo = TRUE
    GROUP BY m.id, m.nombre
)
SELECT * FROM margen_actual;

-- Vista de margen por TIENDA
CREATE OR REPLACE VIEW vw_margen_tienda AS
WITH margen_actual AS (
    SELECT 
        t.id AS tienda_id,
        t.nombre,
        t.ciudad,
        p.nombre AS pais,
        m.nombre AS marca,
        COUNT(DISTINCT vd.id) AS num_ventas,
        SUM(vd.cantidad) AS unidades_vendidas,
        SUM(vd.total_venta) AS total_ventas_q,
        SUM(vd.total_costo) AS total_costos_q,
        SUM(vd.margen_q) AS margen_bruto_q,
        ROUND(AVG(vd.margen_pct)::numeric, 2) AS margen_pct
    FROM tiendas t
    JOIN paises p ON t.pais_id = p.id
    JOIN marcas m ON t.marca_id = m.id
    LEFT JOIN ventas_detalle vd ON t.id = vd.tienda_id
    WHERE t.activo = TRUE
    GROUP BY t.id, t.nombre, t.ciudad, p.nombre, m.nombre
)
SELECT * FROM margen_actual;

-- Vista de margen por PAIS
CREATE OR REPLACE VIEW vw_margen_pais AS
WITH margen_actual AS (
    SELECT 
        p.id AS pais_id,
        p.codigo_iso,
        p.nombre,
        p.moneda,
        COUNT(DISTINCT vd.id) AS num_ventas,
        SUM(vd.cantidad) AS unidades_vendidas,
        SUM(vd.total_venta) AS total_ventas_q,
        SUM(vd.total_costo) AS total_costos_q,
        SUM(vd.margen_q) AS margen_bruto_q,
        ROUND(AVG(vd.margen_pct)::numeric, 2) AS margen_pct
    FROM paises p
    LEFT JOIN ventas_detalle vd ON p.id = vd.pais_id
    WHERE p.activo = TRUE
    GROUP BY p.id, p.codigo_iso, p.nombre, p.moneda
)
SELECT * FROM margen_actual;

-- ============================================
-- 8. TABLA DE INVENTARIO POR TIENDA
-- ============================================
CREATE TABLE IF NOT EXISTS inventario_tienda (
    id SERIAL PRIMARY KEY,
    tienda_id INTEGER NOT NULL REFERENCES tiendas(id),
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL DEFAULT 0,
    cantidad_minima INTEGER DEFAULT 10,
    cantidad_maxima INTEGER DEFAULT 1000,
    ultima_entrada DATE,
    ultima_salida DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tienda_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_inventario_tienda ON inventario_tienda(tienda_id);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario_tienda(producto_id);

-- ============================================
-- 9. TABLA DE METAS POR TIENDA/MARCA
-- ============================================
CREATE TABLE IF NOT EXISTS metas_ventas (
    id SERIAL PRIMARY KEY,
    tienda_id INTEGER REFERENCES tiendas(id),
    marca_id INTEGER REFERENCES marcas(id),
    pais_id INTEGER REFERENCES paises(id),
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    meta_ventas_q DECIMAL(15,2) NOT NULL DEFAULT 0,
    meta_margen_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
    meta_unidades INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tienda_id, marca_id, pais_id, anio, mes)
);

-- ============================================
-- 10. ACTUALIZAR EMPRESA
-- ============================================
UPDATE empresas SET 
    nombre = 'Grupo Retail Centroamérica, S.A.',
    nit = '1234567-8',
    direccion = 'Zona 10, Guatemala City, Guatemala',
    telefono = '+502 2320-4500',
    email = 'corporativo@gruporetail.com',
    industria = 'Retail Multi-Marca Centroamericano'
WHERE id = 1;
