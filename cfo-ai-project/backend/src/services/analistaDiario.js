/**
 * analistaDiario — corre los playbooks del analista y guarda sus hallazgos.
 *
 * Para cada playbook activo:
 *   1. corre agenteAnalista sobre las vistas de analitica (solo lectura),
 *   2. recibe de 3 a 4 hallazgos estructurados,
 *   3. marca como 'resolved' los hallazgos vigentes de ese playbook,
 *   4. inserta los nuevos en insights_historico como 'active'.
 *
 * Si un área no entrega hallazgos o falla, sus hallazgos anteriores se quedan:
 * una corrida fallida no deja la página vacía.
 *
 * Lo llaman la agenda (cada dos días) y scripts/correr-playbooks.js.
 */
const analista = require('./agenteAnalista');

const EMPRESA_ID = 1;
const AGENT_VERSION = 'playbook-1.0';

const hoyGT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });

async function cargarPlaybooks(pool, slug) {
  const { rows } = await pool.query(
    `SELECT slug, nombre, prompt, max_insights
       FROM analisis_playbooks
      WHERE activo = TRUE ${slug ? 'AND slug = $1' : ''}
      ORDER BY orden, id`,
    slug ? [slug] : []
  );
  return rows;
}

async function guardarInsights(pool, playbook, insights, fecha) {
  const source = `playbook:${playbook.slug}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE insights_historico SET status = 'resolved', updated_at = NOW()
        WHERE agent_source = $1 AND status = 'active' AND empresa_id = $2`,
      [source, EMPRESA_ID]
    );

    for (const [i, ins] of insights.entries()) {
      // La recomendación va en su propia columna: la tarjeta la muestra aparte.
      await client.query(
        `INSERT INTO insights_historico
           (insight_id, empresa_id, type, severity, title, description, impact, currency,
            category, action, action_label, change_percent, periodo_hasta,
            agent_source, agent_version, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'GTQ',$8,$9,'Recomendación',$10,$11,$12,$13,'active')
         ON CONFLICT (insight_id) DO UPDATE SET
           type = EXCLUDED.type, severity = EXCLUDED.severity, title = EXCLUDED.title,
           description = EXCLUDED.description, impact = EXCLUDED.impact,
           category = EXCLUDED.category, action = EXCLUDED.action,
           change_percent = EXCLUDED.change_percent, status = 'active', updated_at = NOW()`,
        [
          `pb:${playbook.slug}:${fecha}:${i + 1}`,
          EMPRESA_ID,
          ins.tipo,
          ins.severidad,
          ins.titulo,
          ins.descripcion,
          Number(ins.impacto_gtq) || 0,
          ins.categoria || playbook.nombre,
          ins.recomendacion || null,
          ins.variacion_pct != null && !Number.isNaN(Number(ins.variacion_pct)) ? Number(ins.variacion_pct) : null,
          fecha,
          source,
          AGENT_VERSION,
        ]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Una fila en agentes_logs por área, para el registro de actividad. */
async function registrarLog(pool, playbook, insights, meta, status, errorMsg) {
  const impacto = insights.reduce((s, i) => s + Math.abs(Number(i.impacto_gtq) || 0), 0);
  const descripcion =
    status === 'error'
      ? `Falló el análisis de ${playbook.nombre}: ${errorMsg || 'error desconocido'}`
      : insights.length
        ? `${insights.length} hallazgos de ${playbook.nombre}. Principal: ${insights[0].titulo}`
        : `Análisis de ${playbook.nombre}: sin hallazgos nuevos`;
  try {
    await pool.query(
      `INSERT INTO agentes_logs
         (empresa_id, agente_nombre, agente_tipo, agente_version, categoria, descripcion,
          detalles_json, impacto_valor, impacto_moneda, resultado_status, duracion_ms)
       VALUES ($1, 'Análisis', $2, $3, 'insights_ia', $4, $5, $6, 'GTQ', $7, $8)`,
      [
        EMPRESA_ID,
        playbook.slug,
        AGENT_VERSION,
        descripcion,
        JSON.stringify({
          area: playbook.slug,
          hallazgos: insights.map((i) => ({ titulo: i.titulo, severidad: i.severidad, impacto_gtq: i.impacto_gtq })),
          meta: meta || null,
        }),
        impacto,
        status,
        meta?.ms || null,
      ]
    );
  } catch (e) {
    console.error(`[analista] no se pudo registrar el log de ${playbook.slug}:`, e.message);
  }
}

/**
 * @param {object} opts
 * @param {import('pg').Pool} opts.pool  pool con permiso de escritura
 * @param {string}  [opts.slug]          correr solo un área
 * @param {boolean} [opts.dryRun]        analizar sin escribir
 * @param {function} [opts.log]
 */
async function correrPlaybooks({ pool, slug = null, dryRun = false, log = console.log }) {
  const playbooks = await cargarPlaybooks(pool, slug);
  if (!playbooks.length) {
    log('[analista] no hay playbooks activos');
    return { resultados: [], costo_usd: 0 };
  }

  const fecha = hoyGT();
  const resultados = [];
  let costo = 0;

  for (const pb of playbooks) {
    log(`[analista] ▶ ${pb.nombre}`);
    try {
      const { insights, meta } = await analista.analizar(pb);
      costo += meta.costo_usd || 0;

      if (!insights.length) {
        log(`[analista]   sin hallazgos (${meta.incidencia || 'el modelo no entregó ninguno'}); se conservan los anteriores`);
        if (!dryRun) await registrarLog(pool, pb, [], meta, 'advertencia');
        resultados.push({ slug: pb.slug, estado: 'sin_hallazgos', insights: [], meta });
        continue;
      }

      log(`[analista]   ${insights.length} hallazgos · ${meta.num_consultas} consultas · ${(meta.ms / 1000).toFixed(1)} s · $${meta.costo_usd}`);
      if (!dryRun) {
        await guardarInsights(pool, pb, insights, fecha);
        await registrarLog(pool, pb, insights, meta, 'exitoso');
      }
      resultados.push({ slug: pb.slug, estado: 'ok', insights, meta });
    } catch (e) {
      const detalle = e.response?.status === 402 ? 'la cuenta de OpenRouter no tiene saldo' : e.message;
      log(`[analista]   ✖ ${pb.slug}: ${detalle}`);
      if (!dryRun) await registrarLog(pool, pb, [], null, 'error', detalle);
      resultados.push({ slug: pb.slug, estado: 'error', error: detalle, insights: [] });
      // Sin saldo, las demás áreas van a fallar igual: no se gastan más llamadas.
      if (e.response?.status === 402) break;
    }
  }

  log(`[analista] listo · costo total ~$${costo.toFixed(4)}`);
  return { resultados, costo_usd: costo };
}

module.exports = { correrPlaybooks, cargarPlaybooks };
