const express = require('express');
const router = express.Router();

/**
 * GET /api/ventas/resumen?anio=2025
 *
 * Todo lo que muestra la pantalla de Ventas, leído de la capa semántica: las
 * mismas vistas que consulta el chat. Antes la pantalla mostraba arreglos fijos
 * de otra empresa ("Retail Fashion GT", clientes y vendedores inventados) que
 * no existían en la base.
 *
 * Cada corte trae el año pedido y el anterior, para que la variación se calcule
 * contra los mismos meses. Las ventas son mensuales (fecha = primer día del mes).
 */
router.get('/resumen', async (req, res) => {
  try {
    const db = req.app.get('db');
    const una = async (sql, params) => (await db.allAsync(sql, params))[0] || null;

    const rango = await una(`
      SELECT min(anio) AS desde, max(anio) AS hasta,
             (SELECT ventas_hasta FROM analitica.v_meta) AS ventas_hasta
      FROM analitica.v_ventas`);

    const pedido = parseInt(req.query.anio, 10);
    const anio = pedido >= rango.desde && pedido <= rango.hasta ? pedido : rango.hasta;
    const anterior = anio - 1;
    const hayAnterior = anterior >= rango.desde;

    // Variación y participación se calculan aquí con los totales en la mano;
    // el cliente solo formatea.
    const cortePor = (campo, extra = '') => `
      SELECT ${campo},
             sum(ventas) FILTER (WHERE anio = $1)                                     AS ventas,
             sum(ventas) FILTER (WHERE anio = $2)                                     AS ventas_anterior,
             round(sum(margen_bruto) FILTER (WHERE anio = $1)
                   / nullif(sum(ventas) FILTER (WHERE anio = $1), 0) * 100, 1)       AS margen_pct,
             sum(unidades) FILTER (WHERE anio = $1)                                   AS unidades
             ${extra}
      FROM analitica.v_ventas
      WHERE anio IN ($1, $2)
      GROUP BY ${campo}
      HAVING sum(ventas) FILTER (WHERE anio = $1) > 0
      ORDER BY ventas DESC`;

    const p = [anio, anterior];

    const [kpis, mensual, tiendas, vendedores, categorias, productos, paises, marcas, mensualTienda, mensualMarca, paisMarca] =
      await Promise.all([
        una(`
          SELECT sum(ventas) FILTER (WHERE anio = $1)                                 AS ventas,
                 sum(ventas) FILTER (WHERE anio = $2)                                 AS ventas_anterior,
                 sum(margen_bruto) FILTER (WHERE anio = $1)                           AS margen_bruto,
                 round(sum(margen_bruto) FILTER (WHERE anio = $1)
                       / nullif(sum(ventas) FILTER (WHERE anio = $1), 0) * 100, 1)   AS margen_pct,
                 round(sum(margen_bruto) FILTER (WHERE anio = $2)
                       / nullif(sum(ventas) FILTER (WHERE anio = $2), 0) * 100, 1)   AS margen_pct_anterior,
                 sum(unidades) FILTER (WHERE anio = $1)                               AS unidades,
                 sum(unidades) FILTER (WHERE anio = $2)                               AS unidades_anterior,
                 count(DISTINCT tienda) FILTER (WHERE anio = $1)                      AS tiendas,
                 count(DISTINCT vendedor) FILTER (WHERE anio = $1)                    AS vendedores,
                 count(DISTINCT producto) FILTER (WHERE anio = $1)                    AS productos
          FROM analitica.v_ventas WHERE anio IN ($1, $2)`, p),

        // Una fila por mes del año pedido, con el mismo mes del año anterior.
        db.allAsync(`
          SELECT mes,
                 sum(ventas) FILTER (WHERE anio = $1)                                 AS ventas,
                 sum(ventas) FILTER (WHERE anio = $2)                                 AS ventas_anterior,
                 round(sum(margen_bruto) FILTER (WHERE anio = $1)
                       / nullif(sum(ventas) FILTER (WHERE anio = $1), 0) * 100, 1)   AS margen_pct
          FROM analitica.v_ventas WHERE anio IN ($1, $2)
          GROUP BY mes ORDER BY mes`, p),

        db.allAsync(cortePor('tienda, ciudad, pais, marca',
          `, count(DISTINCT vendedor) FILTER (WHERE anio = $1) AS vendedores,
             (SELECT metros_cuadrados FROM analitica.v_tiendas t WHERE t.tienda = v_ventas.tienda LIMIT 1) AS metros`), p),

        // La tienda asignada no está en la capa semántica: sale del catálogo de
        // vendedores. Cada vendedor vende también en las tiendas sin asignado.
        db.allAsync(`
          WITH c AS (${cortePor('vendedor', ', count(DISTINCT tienda) FILTER (WHERE anio = $1) AS tiendas')})
          SELECT c.*, t.nombre AS tienda_asignada, pa.nombre AS pais_asignado, m.nombre AS marca_asignada
          FROM c
          LEFT JOIN public.vendedores ve ON ve.nombre = c.vendedor
          LEFT JOIN public.tiendas t     ON t.id = ve.tienda_id
          LEFT JOIN public.paises pa     ON pa.id = t.pais_id
          LEFT JOIN public.marcas m      ON m.id = t.marca_id
          ORDER BY c.ventas DESC`, p),

        // Cada categoría pertenece a una sola marca, así que la marca viaja con ella.
        db.allAsync(cortePor('categoria, marca'), p),

        db.allAsync(`${cortePor('producto, sku, categoria, marca')} LIMIT 12`, p),

        db.allAsync(cortePor('pais', ', count(DISTINCT tienda) FILTER (WHERE anio = $1) AS tiendas'), p),

        db.allAsync(cortePor('marca, segmento', ', count(DISTINCT tienda) FILTER (WHERE anio = $1) AS tiendas'), p),

        // Serie mensual por tienda para las líneas de tendencia de la tabla.
        db.allAsync(`
          SELECT tienda, mes, sum(ventas) AS ventas
          FROM analitica.v_ventas WHERE anio = $1
          GROUP BY tienda, mes ORDER BY tienda, mes`, [anio]),

        db.allAsync(`
          SELECT mes, marca, sum(ventas) AS ventas
          FROM analitica.v_ventas WHERE anio = $1
          GROUP BY mes, marca`, [anio]),

        db.allAsync(`
          SELECT pais, marca, sum(ventas) AS ventas
          FROM analitica.v_ventas WHERE anio = $1
          GROUP BY pais, marca`, [anio]),
      ]);

    // El mes lleva una columna por marca para apilar las barras.
    const porMes = new Map(mensual.map((m) => [m.mes, m]));
    for (const f of mensualMarca) {
      const fila = porMes.get(f.mes);
      if (fila) fila[f.marca] = f.ventas;
    }

    // Y el país, su mezcla de marcas.
    const mezcla = new Map();
    for (const f of paisMarca) {
      if (!mezcla.has(f.pais)) mezcla.set(f.pais, {});
      mezcla.get(f.pais)[f.marca] = f.ventas;
    }

    const serie = new Map();
    for (const f of mensualTienda) {
      if (!serie.has(f.tienda)) serie.set(f.tienda, Array(12).fill(0));
      serie.get(f.tienda)[f.mes - 1] = f.ventas;
    }

    const total = kpis.ventas || 0;
    const conCalculos = (filas) =>
      filas.map((f) => ({
        ...f,
        participacion: total ? (f.ventas / total) * 100 : null,
        variacion: hayAnterior && f.ventas_anterior > 0 ? (f.ventas / f.ventas_anterior - 1) * 100 : null,
      }));

    res.json({
      status: 'success',
      data: {
        anio,
        anterior: hayAnterior ? anterior : null,
        anios: Array.from({ length: rango.hasta - rango.desde + 1 }, (_, i) => rango.hasta - i),
        ventas_hasta: rango.ventas_hasta,
        kpis: {
          ...kpis,
          variacion: hayAnterior && kpis.ventas_anterior > 0 ? (kpis.ventas / kpis.ventas_anterior - 1) * 100 : null,
          precio_promedio: kpis.unidades ? kpis.ventas / kpis.unidades : null,
        },
        mensual,
        tiendas: conCalculos(tiendas).map((t) => ({
          ...t,
          ventas_m2: t.metros ? t.ventas / t.metros : null,
          serie: serie.get(t.tienda) || [],
        })),
        vendedores: conCalculos(vendedores),
        categorias: conCalculos(categorias),
        productos: conCalculos(productos),
        paises: conCalculos(paises).map((pa) => ({ ...pa, marcas: mezcla.get(pa.pais) || {} })),
        marcas: conCalculos(marcas),
      },
    });
  } catch (error) {
    console.error('[GET /api/ventas/resumen] Error:', error);
    res.status(500).json({ status: 'error', message: 'No se pudo leer ventas' });
  }
});

module.exports = router;
