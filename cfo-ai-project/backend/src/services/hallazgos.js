/**
 * Hallazgos de los agentes.
 *
 * Se calculan de las vistas de la capa semántica (schema analitica), las mismas
 * que consulta el agente SQL del chat. Así el panel y el chat nunca se
 * contradicen: si el panel dice 240 días de runway, el chat también.
 *
 * Reemplaza a una lista de hallazgos escritos a mano que se servían con la
 * etiqueta "real-time" ("Runway: 42 días" cuando eran 240) y que incluía textos
 * de otro cliente industrial ("reordenar Polietileno HDPE") en un demo retail.
 *
 * Cada hallazgo tiene un id estable por fecha de corte: al guardarse en el
 * histórico actualiza su fila en vez de insertar una nueva en cada visita.
 *
 * Tono: declarativo y con evidencia. Cada texto dice qué pasa, cuánto y contra
 * qué se mide. Sin recomendaciones inventadas: lo que no sale de los datos no
 * se afirma.
 */

const q = (n) => 'Q' + Math.round(Number(n) || 0).toLocaleString('en-US');
const pct = (n, d = 1) => (Number(n) || 0).toFixed(d);
const fechaLarga = (f) =>
  new Date(f).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
// Los nombres de mes se arman aquí: el lc_time de Postgres en Render es inglés.
const mesAnio = (f) =>
  new Date(f).toLocaleDateString('es-GT', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const mes = (f) => new Date(f).toLocaleDateString('es-GT', { month: 'long', timeZone: 'UTC' });

async function una(db, sql) {
  const filas = await db.allAsync(sql);
  return filas[0] || null;
}

async function generarHallazgos(db) {
  const h = [];
  const meta = await una(db, 'SELECT fecha_corte, ventas_desde, ventas_hasta FROM analitica.v_meta');
  if (!meta) return h;
  const corte = new Date(meta.fecha_corte).toISOString().slice(0, 10);
  const id = (clave) => `${clave}.${corte}`;

  // ── Posición: efectivo, pagos, cartera, runway ────────────────────────────
  const p = await una(db, 'SELECT * FROM analitica.v_posicion');
  if (p) {
    const brecha = p.cxp_proximos_30 - p.efectivo;
    if (brecha > 0) {
      h.push({
        id: id('pagos_vs_efectivo'),
        type: 'alerta',
        severity: 'critical',
        title: `Los pagos de 30 días superan el efectivo en ${q(brecha)}`,
        description: `Vencen ${q(p.cxp_proximos_30)} con proveedores en los próximos 30 días y hay ${q(p.efectivo)} en bancos. La cartera por cobrar, de ${q(p.cxc_total)}, cubriría la diferencia solo si se cobra a tiempo.`,
        impact: -brecha,
        category: 'tesoreria',
        contexts: ['dashboard', 'tesoreria', 'contabilidad'],
        actionLabel: 'Ver pagos',
        href: '/tesoreria/cuentas-por-pagar',
      });
    }

    if (p.runway_dias != null) {
      const d = p.runway_dias;
      h.push({
        id: id('runway'),
        type: 'alerta',
        severity: d < 60 ? 'critical' : d < 120 ? 'warning' : 'info',
        title: `El efectivo alcanza para ${d} días al gasto actual`,
        description: `${q(p.efectivo)} en bancos contra un gasto promedio de ${q(p.gasto_diario)} diarios en los últimos seis meses. No cuenta los cobros por entrar ni los pagos ya comprometidos.`,
        impact: 0,
        category: 'tesoreria',
        contexts: ['dashboard', 'tesoreria', 'analisis'],
        actionLabel: 'Ver proyección',
        href: '/tesoreria/proyecciones',
      });
    }

    if (p.cxc_total > 0 && p.cxc_vencida_pct >= 15) {
      h.push({
        id: id('cartera_vencida'),
        type: 'alerta',
        severity: p.cxc_vencida_pct >= 50 ? 'critical' : 'warning',
        title: `El ${pct(p.cxc_vencida_pct)}% de la cartera está vencida`,
        description: `${q(p.cxc_vencida)} de ${q(p.cxc_total)} por cobrar ya pasaron su fecha de pago; ${q(p.cxc_vencida_45)} (${pct(p.cxc_vencida_45_pct)}%) llevan más de 45 días.`,
        impact: -p.cxc_vencida,
        category: 'cobranza',
        contexts: ['dashboard', 'tesoreria', 'ventas', 'analisis'],
        actionLabel: 'Ver cartera',
        href: '/tesoreria/cuentas-por-cobrar',
      });
    }
  }

  // ── Concentración de la cartera ──────────────────────────────────────────
  const top = await una(db, `
    SELECT cliente, sum(saldo) AS saldo,
           sum(saldo) / nullif((SELECT sum(saldo) FROM analitica.v_cxc), 0) * 100 AS parte
    FROM analitica.v_cxc GROUP BY cliente ORDER BY 2 DESC LIMIT 1`);
  if (top && top.parte >= 20) {
    h.push({
      id: id('concentracion_cartera'),
      type: 'alerta',
      severity: top.parte >= 35 ? 'warning' : 'info',
      title: `${top.cliente} concentra el ${pct(top.parte)}% de la cartera`,
      description: `Debe ${q(top.saldo)}. Un atraso de ese cliente mueve por sí solo la posición de cobranza.`,
      impact: 0,
      category: 'cobranza',
      contexts: ['tesoreria', 'ventas'],
      actionLabel: 'Ver cartera',
      href: '/tesoreria/cuentas-por-cobrar',
    });
  }

  // ── Ventas: último trimestre contra el mismo trimestre del año anterior ──
  const trimestre = await una(db, `
    WITH m AS (SELECT max(mes) AS fin FROM analitica.v_ventas_mensuales)
    SELECT
      sum(ventas) FILTER (WHERE mes >  (SELECT fin FROM m) - interval '3 months')                       AS actual,
      sum(ventas) FILTER (WHERE mes >  (SELECT fin FROM m) - interval '15 months'
                            AND mes <= (SELECT fin FROM m) - interval '12 months')                      AS anterior,
      ((SELECT fin FROM m) - interval '2 months')::date              AS desde,
      (SELECT fin FROM m)                                            AS hasta
    FROM analitica.v_ventas_mensuales`);
  if (trimestre && trimestre.anterior > 0) {
    const cambio = (trimestre.actual / trimestre.anterior - 1) * 100;
    h.push({
      id: id('ventas_trimestre'),
      type: cambio >= 0 ? 'ingreso' : 'alerta',
      severity: cambio <= -5 ? 'warning' : 'info',
      title: `Ventas del último trimestre ${cambio >= 0 ? 'arriba' : 'abajo'} ${pct(Math.abs(cambio))}% contra el año anterior`,
      description: `${q(trimestre.actual)} de ${mes(trimestre.desde)} a ${mesAnio(trimestre.hasta)}, contra ${q(trimestre.anterior)} en los mismos meses del año previo. Los datos de ventas terminan en ${mesAnio(meta.ventas_hasta)}.`,
      impact: trimestre.actual - trimestre.anterior,
      category: 'ventas',
      contexts: ['dashboard', 'ventas', 'analisis'],
      actionLabel: 'Ver ventas',
      href: '/ventas',
    });
  }

  // ── Margen: último año contra el anterior ────────────────────────────────
  const margen = await una(db, `
    WITH a AS (SELECT extract(year FROM max(mes))::int AS y FROM analitica.v_ventas_mensuales)
    SELECT
      (SELECT y FROM a) AS anio,
      sum(margen_bruto) FILTER (WHERE extract(year FROM mes) = (SELECT y FROM a))
        / nullif(sum(ventas) FILTER (WHERE extract(year FROM mes) = (SELECT y FROM a)), 0) * 100     AS actual,
      sum(margen_bruto) FILTER (WHERE extract(year FROM mes) = (SELECT y FROM a) - 1)
        / nullif(sum(ventas) FILTER (WHERE extract(year FROM mes) = (SELECT y FROM a) - 1), 0) * 100 AS anterior,
      sum(ventas) FILTER (WHERE extract(year FROM mes) = (SELECT y FROM a))                          AS ventas
    FROM analitica.v_ventas_mensuales`);
  if (margen && margen.anterior != null) {
    const pp = margen.actual - margen.anterior;
    const plano = Math.abs(pp) < 0.1;
    h.push({
      id: id('margen_anual'),
      type: pp >= 0 ? 'ingreso' : 'alerta',
      severity: pp <= -1 ? 'warning' : 'info',
      title: plano
        ? `Margen bruto de ${pct(margen.actual)}% en ${margen.anio}, sin cambio contra ${margen.anio - 1}`
        : `Margen bruto de ${pct(margen.actual)}% en ${margen.anio}, ${pp > 0 ? '+' : '−'}${pct(Math.abs(pp))} puntos contra ${margen.anio - 1}`,
      description: `Sobre ${q(margen.ventas)} vendidos en ${margen.anio}. Cada punto de margen equivale a ${q(margen.ventas / 100)} al año.`,
      impact: plano ? 0 : (pp / 100) * margen.ventas,
      category: 'analisis',
      contexts: ['dashboard', 'analisis', 'ventas'],
      actionLabel: 'Ver márgenes',
      href: '/margenes',
    });
  }

  // ── País con menor margen ────────────────────────────────────────────────
  const paises = await db.allAsync(`
    SELECT pais, sum(margen_bruto) / nullif(sum(ventas), 0) * 100 AS margen, sum(ventas) AS ventas
    FROM analitica.v_ventas
    WHERE anio = (SELECT extract(year FROM ventas_hasta) FROM analitica.v_meta)
    GROUP BY pais ORDER BY 2`);
  if (paises.length >= 2) {
    const peor = paises[0];
    const mejor = paises[paises.length - 1];
    const brecha = mejor.margen - peor.margen;
    if (brecha >= 1.5) {
      h.push({
        id: id('margen_pais'),
        type: 'oportunidad',
        severity: brecha >= 4 ? 'warning' : 'info',
        title: `${peor.pais} tiene el margen más bajo: ${pct(peor.margen)}%`,
        description: `${pct(brecha)} puntos debajo de ${mejor.pais} (${pct(mejor.margen)}%). Llevar ${peor.pais} al margen promedio de los demás países sobre sus ${q(peor.ventas)} de ventas vale ${q((brecha / 2 / 100) * peor.ventas)} al año.`,
        impact: (brecha / 2 / 100) * peor.ventas,
        category: 'analisis',
        contexts: ['analisis', 'ventas'],
        actionLabel: 'Ver márgenes',
        href: '/margenes',
      });
    }
  }

  // ── Productos que perdieron margen ───────────────────────────────────────
  const erosion = await una(db, `
    WITH extremos AS (
      SELECT sku, producto,
             (array_agg(margen_pct ORDER BY fecha))[1]           AS margen_inicio,
             (array_agg(margen_pct ORDER BY fecha DESC))[1]      AS margen_fin,
             (array_agg(precio * unidades ORDER BY fecha DESC))[1] AS venta_fin
      FROM analitica.v_productos_historial
      GROUP BY sku, producto
    )
    SELECT count(*) FILTER (WHERE margen_inicio - margen_fin >= 3)                                AS productos,
           sum((margen_inicio - margen_fin) / 100 * venta_fin) FILTER (WHERE margen_inicio - margen_fin >= 3) AS perdida,
           (array_agg(producto ORDER BY margen_inicio - margen_fin DESC))[1]                      AS peor,
           max(margen_inicio - margen_fin)                                                        AS peor_pp
    FROM extremos`);
  if (erosion && erosion.productos > 0) {
    h.push({
      id: id('erosion_margen'),
      type: 'alerta',
      severity: erosion.productos >= 5 ? 'warning' : 'info',
      title: `${erosion.productos} ${erosion.productos === 1 ? 'producto perdió' : 'productos perdieron'} más de 3 puntos de margen`,
      description: `Subió el costo y no se ajustó el precio. El caso más marcado es ${erosion.peor}, con ${pct(erosion.peor_pp)} puntos menos. Al margen original, el último mes habría dejado ${q(erosion.perdida)} más.`,
      impact: -erosion.perdida,
      category: 'analisis',
      contexts: ['analisis', 'dashboard'],
      actionLabel: 'Ver productos',
      href: '/margenes',
    });
  }

  // ── SAT ──────────────────────────────────────────────────────────────────
  const sat = await una(db, `
    SELECT count(*) FILTER (WHERE dias_para_vencer < 0)                         AS vencidas,
           coalesce(sum(monto_estimado) FILTER (WHERE dias_para_vencer < 0), 0) AS monto_vencidas,
           count(*) FILTER (WHERE dias_para_vencer BETWEEN 0 AND 15)            AS proximas,
           coalesce(sum(monto_estimado) FILTER (WHERE dias_para_vencer BETWEEN 0 AND 15), 0) AS monto_proximas,
           (array_agg(obligacion ORDER BY fecha_vencimiento) FILTER (WHERE dias_para_vencer BETWEEN 0 AND 15))[1] AS siguiente
    FROM analitica.v_obligaciones_sat`);
  if (sat && sat.vencidas > 0) {
    h.push({
      id: id('sat_vencidas'),
      type: 'alerta',
      severity: 'critical',
      title: `${sat.vencidas} ${sat.vencidas === 1 ? 'obligación SAT vencida' : 'obligaciones SAT vencidas'} por ${q(sat.monto_vencidas)}`,
      description: `Pasaron su fecha de vencimiento al ${fechaLarga(meta.fecha_corte)} sin estar presentadas. Acumulan multa e intereses mientras sigan pendientes.`,
      impact: -sat.monto_vencidas,
      category: 'contabilidad',
      contexts: ['contabilidad', 'dashboard'],
      actionLabel: 'Ver calendario SAT',
      href: '/sat',
    });
  }
  if (sat && sat.proximas > 0) {
    h.push({
      id: id('sat_proximas'),
      type: 'alerta',
      severity: 'info',
      title: `${sat.proximas} ${sat.proximas === 1 ? 'obligación SAT vence' : 'obligaciones SAT vencen'} en los próximos 15 días`,
      description: `Suman ${q(sat.monto_proximas)} estimados. La primera es ${sat.siguiente}.`,
      impact: 0,
      category: 'contabilidad',
      contexts: ['contabilidad'],
      actionLabel: 'Ver calendario SAT',
      href: '/sat',
    });
  }

  const orden = { critical: 0, warning: 1, info: 2 };
  return h
    .map((x) => ({ currency: 'GTQ', action: x.actionLabel, isNew: false, ...x }))
    .sort((a, b) => orden[a.severity] - orden[b.severity]);
}

/**
 * Filtra por contexto. Si una pantalla no tiene hallazgos propios, recibe los
 * dos más urgentes de la empresa: son hechos de toda la operación, no ruido.
 */
function filtrarPorContexto(hallazgos, contexto) {
  if (!contexto || contexto === 'all' || contexto === 'dashboard') {
    return hallazgos.filter((x) => x.contexts.includes('dashboard'));
  }
  const propios = hallazgos.filter((x) => x.contexts.includes(contexto));
  return propios.length ? propios : hallazgos.slice(0, 2);
}

module.exports = { generarHallazgos, filtrarPorContexto };
