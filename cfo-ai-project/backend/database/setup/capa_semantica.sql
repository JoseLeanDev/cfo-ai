-- ============================================================================
-- Capa semántica del demo Qora (Grupo Retail Centroamérica)
--
-- El schema "analitica" es lo único que el agente SQL puede leer. Cada vista
-- traduce las tablas crudas a términos de negocio, y su COMMENT es el manual
-- que el modelo recibe en el prompt: si un comentario dice algo falso, el
-- agente responde mal con toda seguridad. Por eso cada regla de cálculo que
-- importa (qué fecha es "hoy", cómo se suma el margen) está escrita aquí.
--
-- Los hallazgos del panel de agentes salen de estas mismas vistas, de modo que
-- el chat y el panel nunca se contradicen.
--
-- Se aplica en cada deploy desde migrate.js. Es idempotente: borra y recrea las
-- vistas dentro de una transacción y vuelve a otorgar el permiso de lectura al
-- rol agente_ia si existe (el rol se crea aparte, ver rol_agente_ia.sql).
--
-- No usar el signo de cierre de interrogación en este archivo: db.runAsync lo
-- convierte en parámetro posicional. El runner usa el pool directo, pero así
-- el archivo es seguro por cualquiera de los dos caminos.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS analitica;

DROP VIEW IF EXISTS
  analitica.v_meta,
  analitica.v_calidad_datos,
  analitica.v_ventas,
  analitica.v_ventas_mensuales,
  analitica.v_productos_historial,
  analitica.v_tiendas,
  analitica.v_cxc,
  analitica.v_cxp,
  analitica.v_bancos,
  analitica.v_flujo,
  analitica.v_flujo_mensual,
  analitica.v_obligaciones_sat,
  analitica.v_posicion
CASCADE;

-- ---------------------------------------------------------------------------
-- v_meta: de qué fechas y con qué supuestos se habla
-- ---------------------------------------------------------------------------
CREATE VIEW analitica.v_meta AS
SELECT
  'Grupo Retail Centroamérica'::text                     AS empresa,
  'GTQ'::text                                            AS moneda,
  7.75::numeric                                          AS tipo_cambio_usd,
  (SELECT min(fecha) FROM public.ventas_detalle)         AS ventas_desde,
  (SELECT max(fecha) FROM public.ventas_detalle)         AS ventas_hasta,
  (SELECT max(fecha) FROM public.transacciones)          AS fecha_corte,
  (SELECT min(fecha) FROM public.transacciones)          AS flujo_desde;

COMMENT ON VIEW analitica.v_meta IS
'Una sola fila con el contexto de los datos. LEE ESTO ANTES DE USAR FECHAS.
Hay dos marcos de tiempo distintos:
- Ventas y margen (v_ventas, v_ventas_mensuales): de ventas_desde a ventas_hasta, con granularidad mensual (fecha = primer día del mes).
- Tesorería, cartera, pagos y SAT (v_bancos, v_flujo, v_cxc, v_cxp, v_obligaciones_sat, v_posicion): son una foto a fecha_corte.
"Hoy", "este mes", "vencido" y "próximo" se calculan contra fecha_corte, NUNCA contra CURRENT_DATE. Para ventas, "este año" o "el último año" es el año de ventas_hasta.
Todas las cifras están en quetzales (GTQ). tipo_cambio_usd convierte los saldos bancarios en dólares.';

-- ---------------------------------------------------------------------------
-- v_calidad_datos: limitaciones que el agente debe mencionar
-- ---------------------------------------------------------------------------
CREATE VIEW analitica.v_calidad_datos AS
SELECT * FROM (VALUES
  ('ventas', 'alto', 'Periodo cerrado',
   'Las ventas terminan en diciembre de 2025. No hay ventas de 2026: si preguntan por el mes o el año en curso, responder con el último periodo con datos y decirlo.'),
  ('tesoreria', 'alto', 'Foto a la fecha de corte',
   'Bancos, cartera, pagos y SAT son una foto al 31 de marzo de 2026 (ver v_meta.fecha_corte). Vencimientos y antigüedad se miden contra esa fecha, no contra hoy.'),
  ('ventas', 'medio', 'Clientes como texto',
   'En las ventas el cliente es un nombre libre, no un código. Agrupar por el nombre tal cual aparece.'),
  ('tesoreria', 'medio', 'Tipo de cambio fijo',
   'Los saldos en dólares se convierten a Q7.75 por dólar, tipo de cambio fijo de referencia.'),
  ('general', 'bajo', 'Datos de demostración',
   'Es un juego de datos de demostración de una cadena retail en cinco países de Centroamérica.')
) AS t(entidad, severidad, problema, detalle);

COMMENT ON VIEW analitica.v_calidad_datos IS
'Limitaciones conocidas de los datos. Las de severidad alto ya vienen en tus instrucciones; consulta esta vista para ver las de severidad medio y bajo cuando la pregunta toque esas entidades.';

-- ---------------------------------------------------------------------------
-- Ventas
-- ---------------------------------------------------------------------------
CREATE VIEW analitica.v_ventas AS
SELECT
  v.fecha,
  extract(year FROM v.fecha)::int               AS anio,
  extract(month FROM v.fecha)::int              AS mes,
  to_char(v.fecha, 'YYYY-MM')                   AS periodo,
  pa.nombre                                     AS pais,
  m.nombre                                      AS marca,
  m.segmento                                    AS segmento,
  t.nombre                                      AS tienda,
  t.ciudad                                      AS ciudad,
  ve.nombre                                     AS vendedor,
  pr.sku                                        AS sku,
  pr.nombre                                     AS producto,
  pr.categoria                                  AS categoria,
  v.cliente_nombre                              AS cliente,
  v.cantidad                                    AS unidades,
  v.precio_unitario,
  v.costo_unitario,
  v.total_venta                                 AS ventas,
  v.total_costo                                 AS costo,
  v.margen_q                                    AS margen_bruto
FROM public.ventas_detalle v
LEFT JOIN public.paises     pa ON pa.id = v.pais_id
LEFT JOIN public.marcas     m  ON m.id  = v.marca_id
LEFT JOIN public.tiendas    t  ON t.id  = v.tienda_id
LEFT JOIN public.vendedores ve ON ve.id = v.vendedor_id
LEFT JOIN public.productos  pr ON pr.id = v.producto_id;

COMMENT ON VIEW analitica.v_ventas IS
'Una fila por línea de venta mensual (fecha = primer día del mes). Fuente de ventas, costo y margen por país, marca, segmento, tienda, vendedor, producto, categoría y cliente. Es la misma fuente de la página de Márgenes.
Reglas:
- Ventas: sum(ventas). Costo: sum(costo). Margen en quetzales: sum(margen_bruto).
- Margen % de cualquier grupo: sum(margen_bruto) / nullif(sum(ventas), 0) * 100. NUNCA promediar porcentajes.
- Todo en GTQ ya consolidado, aunque el país tenga otra moneda.
- Periodo cubierto: ver v_meta (ventas_desde a ventas_hasta).';

CREATE VIEW analitica.v_ventas_mensuales AS
SELECT
  date_trunc('month', fecha)::date                                  AS mes,
  to_char(fecha, 'YYYY-MM')                                         AS periodo,
  sum(total_venta)                                                  AS ventas,
  sum(total_costo)                                                  AS costo,
  sum(margen_q)                                                     AS margen_bruto,
  round(sum(margen_q) / nullif(sum(total_venta), 0) * 100, 1)       AS margen_pct,
  sum(cantidad)                                                     AS unidades
FROM public.ventas_detalle
GROUP BY 1, 2;

COMMENT ON VIEW analitica.v_ventas_mensuales IS
'Ventas consolidadas por mes, todos los países y marcas. Úsala para tendencias y comparaciones entre meses o años. margen_pct ya viene calculado correctamente como margen/ventas del mes. Para cortes por país, marca o tienda usa v_ventas.';

CREATE VIEW analitica.v_productos_historial AS
SELECT
  h.fecha,
  to_char(h.fecha, 'YYYY-MM')                                        AS periodo,
  p.sku,
  p.nombre                                                           AS producto,
  p.categoria,
  m.nombre                                                           AS marca,
  h.precio_promedio_realizado                                        AS precio,
  h.costo_unitario                                                   AS costo,
  h.unidades_vendidas                                                AS unidades,
  round((h.precio_promedio_realizado - h.costo_unitario)
        / nullif(h.precio_promedio_realizado, 0) * 100, 1)           AS margen_pct
FROM public.productos_historial h
JOIN public.productos p ON p.id = h.producto_id
LEFT JOIN public.marcas m ON m.id = p.marca_id;

COMMENT ON VIEW analitica.v_productos_historial IS
'Precio realizado, costo unitario y margen por producto y mes. Úsala para ver si un producto perdió margen (subió el costo y no se ajustó el precio): compara margen_pct entre el primer y el último periodo del producto.';

CREATE VIEW analitica.v_tiendas AS
SELECT
  t.codigo, t.nombre AS tienda, t.ciudad, pa.nombre AS pais,
  m.nombre AS marca, m.segmento, t.tipo, t.metros_cuadrados,
  t.fecha_apertura, t.activo
FROM public.tiendas t
LEFT JOIN public.paises pa ON pa.id = t.pais_id
LEFT JOIN public.marcas m  ON m.id  = t.marca_id;

COMMENT ON VIEW analitica.v_tiendas IS
'Catálogo de tiendas con país, marca, segmento, tipo y metros cuadrados. Para ventas por tienda usa v_ventas agrupando por tienda.';

-- ---------------------------------------------------------------------------
-- Tesorería
-- ---------------------------------------------------------------------------
CREATE VIEW analitica.v_bancos AS
SELECT
  b.banco,
  b.tipo,
  b.moneda,
  b.numero_cuenta,
  b.saldo,
  CASE WHEN b.moneda = 'USD' THEN b.saldo * 7.75 ELSE b.saldo END  AS saldo_quetzales
FROM public.cuentas_bancarias b
WHERE coalesce(b.activa, true);

COMMENT ON VIEW analitica.v_bancos IS
'Cuentas bancarias activas a la fecha de corte. saldo está en la moneda de la cuenta; saldo_quetzales ya lo convierte (dólares a 7.75). Para el efectivo total usa sum(saldo_quetzales).';

CREATE VIEW analitica.v_flujo AS
SELECT
  t.fecha,
  to_char(t.fecha, 'YYYY-MM')                                   AS periodo,
  t.tipo,
  t.monto,
  CASE WHEN t.tipo = 'salida' THEN -t.monto ELSE t.monto END    AS monto_neto,
  t.concepto,
  t.estado
FROM public.transacciones t;

COMMENT ON VIEW analitica.v_flujo IS
'Movimientos de efectivo de los seis meses previos a la fecha de corte. tipo es entrada o salida; monto siempre es positivo y monto_neto lleva signo (salidas negativas). Para el gasto promedio diario: sum(monto) de salidas dividido entre los días del periodo.';

CREATE VIEW analitica.v_flujo_mensual AS
SELECT
  date_trunc('month', fecha)::date                                    AS mes,
  to_char(fecha, 'YYYY-MM')                                           AS periodo,
  sum(monto) FILTER (WHERE tipo = 'entrada')                          AS entradas,
  sum(monto) FILTER (WHERE tipo = 'salida')                           AS salidas,
  sum(CASE WHEN tipo = 'salida' THEN -monto ELSE monto END)           AS neto
FROM public.transacciones
GROUP BY 1, 2;

COMMENT ON VIEW analitica.v_flujo_mensual IS
'Entradas, salidas y flujo neto de efectivo por mes. Úsala para responder cómo viene el flujo de caja o si el negocio quema efectivo.';

-- ---------------------------------------------------------------------------
-- Cartera y pagos
-- ---------------------------------------------------------------------------
CREATE VIEW analitica.v_cxc AS
SELECT
  c.cliente_nombre                                           AS cliente,
  c.factura_numero                                           AS factura,
  c.fecha_emision,
  c.fecha_vencimiento,
  c.monto_total,
  c.monto_pendiente                                          AS saldo,
  c.estado,
  greatest(m.fecha_corte - c.fecha_vencimiento, 0)           AS dias_vencida,
  CASE
    WHEN m.fecha_corte <= c.fecha_vencimiento      THEN 'al corriente'
    WHEN m.fecha_corte - c.fecha_vencimiento <= 30 THEN '1 a 30 días'
    WHEN m.fecha_corte - c.fecha_vencimiento <= 60 THEN '31 a 60 días'
    WHEN m.fecha_corte - c.fecha_vencimiento <= 90 THEN '61 a 90 días'
    ELSE 'más de 90 días'
  END                                                        AS antiguedad
FROM public.cuentas_cobrar c
CROSS JOIN analitica.v_meta m
WHERE c.monto_pendiente > 0;

COMMENT ON VIEW analitica.v_cxc IS
'Cuentas por cobrar con saldo pendiente, a la fecha de corte. Cartera total: sum(saldo). Cartera vencida: filtra dias_vencida > 0. antiguedad agrupa en rangos (al corriente, 1 a 30, 31 a 60, 61 a 90, más de 90 días). Para "quién me debe más", agrupa por cliente y ordena por sum(saldo).';

CREATE VIEW analitica.v_cxp AS
SELECT
  p.proveedor_nombre                                         AS proveedor,
  p.factura_numero                                           AS factura,
  p.fecha_emision,
  p.fecha_vencimiento,
  p.monto_total,
  p.monto_pendiente                                          AS saldo,
  p.fecha_vencimiento - m.fecha_corte                        AS dias_para_vencer,
  CASE
    WHEN p.fecha_vencimiento <  m.fecha_corte      THEN 'vencida'
    WHEN p.fecha_vencimiento - m.fecha_corte <= 7  THEN 'vence en 7 días'
    WHEN p.fecha_vencimiento - m.fecha_corte <= 30 THEN 'vence en 30 días'
    ELSE 'más de 30 días'
  END                                                        AS plazo
FROM public.cuentas_pagar p
CROSS JOIN analitica.v_meta m
WHERE p.monto_pendiente > 0;

COMMENT ON VIEW analitica.v_cxp IS
'Cuentas por pagar a proveedores con saldo pendiente, a la fecha de corte. dias_para_vencer es negativo si ya venció. plazo agrupa en vencida, vence en 7 días, vence en 30 días, más de 30 días. Para el calendario de pagos, ordena por fecha_vencimiento.';

CREATE VIEW analitica.v_obligaciones_sat AS
SELECT
  o.tipo                                                     AS obligacion,
  o.periodo,
  o.fecha_vencimiento,
  o.monto_estimado,
  o.estado,
  o.fecha_vencimiento - m.fecha_corte                        AS dias_para_vencer
FROM public.obligaciones_sat o
CROSS JOIN analitica.v_meta m;

COMMENT ON VIEW analitica.v_obligaciones_sat IS
'Calendario de obligaciones fiscales ante la SAT (IVA mensual, cuotas de ISR, IETU, declaración anual). dias_para_vencer se mide contra la fecha de corte; negativo si ya venció. estado es pendiente o atrasada.';

-- ---------------------------------------------------------------------------
-- Posición: el resumen de una fila del que salen los hallazgos
-- ---------------------------------------------------------------------------
CREATE VIEW analitica.v_posicion AS
WITH
  efectivo AS (SELECT coalesce(sum(saldo_quetzales), 0) AS q FROM analitica.v_bancos),
  cxc AS (
    SELECT coalesce(sum(saldo), 0)                               AS total,
           coalesce(sum(saldo) FILTER (WHERE dias_vencida > 0), 0)  AS vencida,
           coalesce(sum(saldo) FILTER (WHERE dias_vencida > 45), 0) AS vencida_45
    FROM analitica.v_cxc
  ),
  cxp AS (
    SELECT coalesce(sum(saldo), 0)                                         AS total,
           coalesce(sum(saldo) FILTER (WHERE dias_para_vencer BETWEEN 0 AND 30), 0) AS proximos_30
    FROM analitica.v_cxp
  ),
  gasto AS (
    SELECT coalesce(sum(monto) FILTER (WHERE tipo = 'salida'), 0)
           / nullif(max(fecha) - min(fecha) + 1, 0)                 AS diario
    FROM public.transacciones
  )
SELECT
  m.fecha_corte,
  e.q                                                AS efectivo,
  x.total                                            AS cxc_total,
  x.vencida                                          AS cxc_vencida,
  round(x.vencida / nullif(x.total, 0) * 100, 1)     AS cxc_vencida_pct,
  x.vencida_45                                       AS cxc_vencida_45,
  round(x.vencida_45 / nullif(x.total, 0) * 100, 1)  AS cxc_vencida_45_pct,
  p.total                                            AS cxp_total,
  p.proximos_30                                      AS cxp_proximos_30,
  e.q + x.total - p.total                            AS capital_de_trabajo,
  round(g.diario, 0)                                 AS gasto_diario,
  floor(e.q / nullif(g.diario, 0))::int              AS runway_dias
FROM analitica.v_meta m, efectivo e, cxc x, cxp p, gasto g;

COMMENT ON VIEW analitica.v_posicion IS
'Una fila con la posición financiera a la fecha de corte: efectivo total en quetzales, cartera total y vencida (y su porcentaje), cartera vencida a más de 45 días, cuentas por pagar total y de los próximos 30 días, capital de trabajo (efectivo + cartera - pagos), gasto diario promedio de los últimos seis meses y runway_dias (cuántos días alcanza el efectivo al gasto diario promedio, sin contar cobros futuros). Es la fuente de los hallazgos del panel de agentes.';

-- ---------------------------------------------------------------------------
-- Permisos del rol del agente (si ya fue creado)
-- ---------------------------------------------------------------------------
DO $permisos$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agente_ia') THEN
    GRANT USAGE ON SCHEMA analitica TO agente_ia;
    GRANT SELECT ON ALL TABLES IN SCHEMA analitica TO agente_ia;
  END IF;
END
$permisos$;

COMMIT;
