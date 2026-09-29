-- ============================================================================
-- playbooks_analisis.sql
--
-- Playbooks del analista: cada fila es un área del negocio con las
-- instrucciones que el agente analista ejecuta en cada corrida. La corrida
-- (services/analistaDiario.js, desde la agenda o scripts/correr-playbooks.js)
-- lee las filas activas, corre el agente sobre las vistas de analitica y
-- guarda los hallazgos en insights_historico con agent_source = 'playbook:<slug>'.
-- La página Insights de IA muestra solo esos.
--
-- El prompt guardado aquí es solo la parte específica del área. Las reglas
-- comunes (rol, fechas de corte, no rellenar, formato) las antepone el agente
-- desde el código.
--
-- Editar un prompt en esta tabla no requiere redeploy: cada corrida lee el
-- valor vigente. El seed usa ON CONFLICT DO NOTHING, así que volver a aplicar
-- el archivo no pisa ediciones hechas en la base.
--
-- Idempotente. Lo aplica database/migrate.js en cada build.
-- ============================================================================

CREATE TABLE IF NOT EXISTS analisis_playbooks (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(50)  UNIQUE NOT NULL,
  nombre        VARCHAR(120) NOT NULL,
  descripcion   VARCHAR(200),
  prompt        TEXT         NOT NULL,
  max_insights  INTEGER      NOT NULL DEFAULT 4,
  orden         INTEGER      NOT NULL DEFAULT 0,
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    DEFAULT NOW(),
  updated_at    TIMESTAMP    DEFAULT NOW()
);

INSERT INTO analisis_playbooks (slug, nombre, descripcion, orden, prompt) VALUES
(
  'caja', 'Caja y pagos', 'Efectivo, pagos a proveedores y obligaciones con la SAT', 1,
$prompt$Analiza la liquidez a la fecha de corte. Usa v_posicion (una fila con efectivo, días de caja, flujo neto y totales), v_bancos, v_cxp, v_flujo_mensual y v_obligaciones_sat. Cubre estos ángulos y quédate con los de mayor impacto:

- Efectivo disponible contra lo que hay que pagar a proveedores en los próximos 30 días (v_cxp con dias_para_vencer entre 0 y 30). Si los pagos superan el efectivo, es crítico: di cuánto falta.
- Los proveedores con los pagos más grandes que vencen primero: nómbralos con monto y fecha.
- Facturas de proveedor ya vencidas (dias_para_vencer < 0): cuánto suman y con quién.
- Días de caja, flujo neto mensual y runway (v_posicion; runway es NULL si el flujo neto es positivo, y entonces no hay quema que reportar). Compáralo con el ritmo de los últimos meses (v_flujo_mensual).
- Obligaciones con la SAT pendientes (estado distinto de presentada) que vencen pronto, con su monto.
- Concentración del efectivo: en qué bancos y monedas está (v_bancos).$prompt$
),
(
  'cartera', 'Cartera y cobranza', 'Cuentas por cobrar, antigüedad y concentración de crédito', 2,
$prompt$Analiza las cuentas por cobrar a la fecha de corte (v_cxc; ya trae solo facturas con saldo). Cubre estos ángulos y quédate con los de mayor impacto:

- Cartera total (sum(saldo)) y qué porcentaje está vencida (dias_vencida > 0). Si el porcentaje vencido es alto, es alerta.
- Los clientes con más saldo vencido, sobre todo en los rangos 61 a 90 y más de 90 días: nómbralos y di cuánto deben y hace cuántos días.
- Facturas individuales grandes y vencidas que urge cobrar ya: factura, cliente, saldo y días vencida.
- Concentración: qué porcentaje de la cartera está en los 3 a 5 clientes más grandes.
- Deterioro: saldo que ya pasó de 90 días, con riesgo de no cobrarse.$prompt$
),
(
  'ventas', 'Ventas y crecimiento', 'Sucursales, marcas, países y vendedores', 3,
$prompt$Analiza el desempeño de ventas. Usa v_ventas_mensuales para la tendencia y v_ventas para el detalle por sucursal (tienda), marca, país, vendedor y categoría; v_tiendas trae los metros cuadrados. Cubre estos ángulos y quédate con los de mayor impacto:

- Ventas del último trimestre con datos contra el mismo trimestre del año anterior, y del último año completo contra el anterior. ¿Crece el negocio y a qué ritmo?
- Sucursales que crecen bastante menos que su propia marca o que caen: nómbralas con su venta y su variación. Son la alerta principal.
- Marcas y países que más empujan el crecimiento y los que se quedan atrás.
- Venta por metro cuadrado: qué sucursales rinden mucho más o mucho menos que las demás de su marca.
- Vendedores que destacan y los que vienen cayendo contra el año anterior.$prompt$
),
(
  'margenes', 'Márgenes y rentabilidad', 'Margen bruto por marca, sucursal, categoría y producto', 4,
$prompt$Analiza la rentabilidad. Usa v_ventas (margen de cualquier grupo = sum(margen_bruto) / sum(ventas) * 100) y v_productos_historial (precio, costo y margen por producto y mes). Cubre estos ángulos y quédate con los de mayor impacto:

- Margen bruto global en quetzales y porcentaje del último año contra el anterior. ¿Sube, baja o se mantiene?
- Productos que perdieron margen: compara margen_pct del primer y el último periodo en v_productos_historial y di si fue porque subió el costo o bajó el precio. Nómbralos con cuántos puntos perdieron y cuánto venden.
- Sucursales o categorías con mucha venta y margen por debajo del promedio: es la mayor oportunidad de ajustar precios.
- Dónde están los mejores márgenes (marca, categoría, producto) para empujar ahí.
- Si los márgenes son muy parejos entre marcas y sucursales, dilo como hallazgo informativo en lugar de forzar diferencias.$prompt$
)
ON CONFLICT (slug) DO NOTHING;
