/**
 * agenteAnalista — el agente que corre el análisis de un área del negocio.
 *
 * Es el mismo patrón que agenteSQL (bucle de herramientas contra el ejecutor
 * de solo lectura dbAgente), pero termina en `entregar_insights` en vez de
 * `responder`: en lugar de un texto para el chat, produce una lista de
 * hallazgos estructurados que analistaDiario guarda en insights_historico.
 *
 * Se mantiene aparte de agenteSQL a propósito: el chat está en uso y no se
 * arriesga. De él se reusa lo sensible (dbAgente: rol de solo lectura,
 * sqlGuard y catálogo), no el bucle.
 */
const openrouter = require('./openrouter');
const db = require('./dbAgente');

const MODELO = process.env.OPENROUTER_MODEL_AGENTE || 'anthropic/claude-sonnet-5';
const MAX_VUELTAS = parseInt(process.env.ANALISTA_MAX_VUELTAS || '14', 10);
const MAX_FILAS_AL_MODELO = 60;
// Los hallazgos caben de sobra; un techo bajo también baja la reserva de
// crédito que OpenRouter exige antes de cada llamada.
const MAX_TOKENS = 6000;

// Respaldo para estimar el costo cuando OpenRouter no lo reporta. USD por millón.
const PRECIOS = {
  'anthropic/claude-opus-5': { entrada: 5, salida: 25, cache: 0.5 },
  'anthropic/claude-opus-5.5': { entrada: 4, salida: 20, cache: 0.2 },
  'anthropic/claude-sonnet-5': { entrada: 2, salida: 10, cache: 0.2 },
  'anthropic/claude-sonnet-4.6': { entrada: 3, salida: 15, cache: 0.3 },
};

// ---------------------------------------------------------------------------
// Reglas comunes a todas las áreas. El encargo de cada área vive en la tabla
// analisis_playbooks.
// ---------------------------------------------------------------------------
const REGLAS_COMUNES = `Eres el analista financiero de Qora para Grupo Retail Centroamérica, una cadena de tiendas con cuatro marcas (Casa & Hogar, SportLife, TechZone y Moda Urbana) en cinco países. Corres el análisis de UN área del negocio consultando la base de datos con SQL. No le hablas a nadie en particular: produces hallazgos que se guardan y se muestran en la página Insights de IA, que lee la gerencia.

## Cómo trabajas
1. Lee el catálogo y decide qué consultar para cubrir los ángulos del encargo. Revisa v_meta para las fechas.
2. Llama a ejecutar_sql. Si falla, lee el error de Postgres, corrige y reintenta.
3. Si vas a filtrar por una columna de texto y no estás seguro de los valores, usa muestrear_valores antes.
4. Cuando tengas evidencia suficiente, llama a entregar_insights UNA sola vez con todos los hallazgos. Siempre terminas ahí.

## Qué hace un buen hallazgo
- Cada número que afirmes viene de una consulta que ejecutaste en esta corrida. No inventas cifras.
- Nombra la entidad real (sucursal, marca, cliente, proveedor, producto) y la cifra en quetzales. Nada genérico como "algunos clientes".
- Prioriza por impacto en quetzales. No rellenes: si solo hay 3 cosas que de verdad importan, entrega 3.
- No repitas el mismo hallazgo con otro ángulo.
- Compara contra el periodo previo cuando se pueda y refléjalo en variacion_pct.
- La recomendación es una acción concreta que alguien pueda hacer esta semana.

## Reglas de datos que no puedes saltarte
- Hay dos marcos de tiempo. Las ventas cubren de v_meta.ventas_desde a v_meta.ventas_hasta, por mes. Tesorería, cartera, pagos y SAT son una foto a v_meta.fecha_corte.
- Nunca uses CURRENT_DATE. "Vencido", "próximo" y "días" se miden contra fecha_corte; ya vienen calculados en dias_vencida y dias_para_vencer.
- Margen de cualquier grupo: sum(margen_bruto) / nullif(sum(ventas), 0) * 100. Nunca promedies porcentajes.
- Efectivo: suma saldo_quetzales de v_bancos, que ya convierte los dólares. v_posicion trae el resumen de liquidez calculado.
- v_cxc y v_cxp solo traen documentos con saldo. Suma la columna saldo, no monto_total.
- Solo puedes leer el schema analitica. Todo en quetzales.

## Cómo escribes
- Español formal y directo. Sin guiones largos. Sin tecnicismos: no escribas "DSO", "pp", "YoY", "erosión" ni siglas en inglés; di "días de cobro", "puntos", "contra el año anterior".
- Cifras en quetzales con separador de miles: Q1,234,567. Porcentajes con un decimal.

## Tipo de cada hallazgo (campo tipo)
- "ingreso": buena noticia de ventas o crecimiento.
- "gasto": mala noticia de costos o egresos (costo que sube, margen que baja, dinero que se pierde).
- "alerta": un riesgo que exige atención (cartera vencida, pagos que superan el efectivo, concentración peligrosa).
- "oportunidad": una acción concreta para mejorar (cobrar, ajustar precios, renegociar, empujar lo rentable).

## Signo del impacto (campo impacto_gtq)
- Positivo: dinero por ganar o que entra.
- Negativo: dinero en riesgo, que se pierde o que hay que pagar.
- 0 si el hallazgo no tiene un monto claro.

## Severidad (campo severidad)
- "critical": exige acción esta semana; mucho dinero o riesgo alto.
- "warning": hay que vigilarlo; impacto medio.
- "info": contexto útil, sin urgencia.`;

// ---------------------------------------------------------------------------
// Herramientas
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'ejecutar_sql',
      description:
        'Ejecuta una consulta SELECT de solo lectura contra el schema analitica y devuelve las filas. ' +
        'Si la consulta falla, devuelve el error de Postgres para que la corrijas.',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'Solo SELECT o WITH, una sola sentencia, solo vistas de analitica.' },
          proposito: { type: 'string', description: 'En una frase corta, qué buscas con esta consulta.' },
        },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'muestrear_valores',
      description:
        'Devuelve los valores que existen en una columna, con su frecuencia. ' +
        'Úsalo antes de filtrar por una columna de texto, para no inventar un valor.',
      parameters: {
        type: 'object',
        properties: {
          vista: { type: 'string', description: 'Nombre de la vista, por ejemplo v_ventas' },
          columna: { type: 'string', description: 'Nombre de la columna' },
        },
        required: ['vista', 'columna'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'entregar_insights',
      description:
        'Entrega los hallazgos del análisis y termina. Úsalo UNA sola vez, cuando ya tengas la evidencia.',
      parameters: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            description: 'Entre 3 y 4 hallazgos, del más importante al menos importante.',
            items: {
              type: 'object',
              properties: {
                titulo: { type: 'string', description: 'Frase corta y concreta, máximo unos 80 caracteres.' },
                descripcion: { type: 'string', description: 'El hallazgo en 2 a 4 frases, con las cifras en quetzales y las entidades reales.' },
                recomendacion: { type: 'string', description: 'Una acción concreta y ejecutable.' },
                severidad: { type: 'string', enum: ['critical', 'warning', 'info'] },
                tipo: { type: 'string', enum: ['ingreso', 'gasto', 'alerta', 'oportunidad'] },
                impacto_gtq: { type: 'number', description: 'Monto en GTQ. Positivo entra o se gana; negativo está en riesgo o se paga; 0 si no aplica.' },
                variacion_pct: { type: 'number', description: 'Opcional: variación % contra el periodo previo (ej. -12.5).' },
                categoria: { type: 'string', description: 'Opcional: la entidad principal del hallazgo.' },
              },
              required: ['titulo', 'descripcion', 'recomendacion', 'severidad', 'tipo'],
            },
          },
        },
        required: ['insights'],
      },
    },
  },
];

let cacheSystem = null;

async function construirSystemPrompt() {
  const catalogo = await db.catalogoComoTexto();
  return `${REGLAS_COMUNES}\n\n## Catálogo de datos\n\n${catalogo}`;
}

// Con respaldo gratuito si la cuenta se queda sin saldo (ver openrouter.js).
async function llamarModelo(messages) {
  return openrouter.completar(
    {
      model: MODELO,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      max_tokens: MAX_TOKENS,
      // Pide a OpenRouter el costo real de la llamada en la respuesta.
      usage: { include: true },
    },
    { titulo: 'Qora Analista', timeout: 120000 }
  );
}

/**
 * Corre el análisis de un área.
 *
 * @param {object} playbook  { slug, nombre, prompt, max_insights }
 * @returns {Promise<{ insights: Array, consultas: Array, meta: object }>}
 */
async function analizar(playbook) {
  const t0 = Date.now();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.includes('placeholder') || apiKey.includes('tu-api-key')) {
    throw new Error('OPENROUTER_API_KEY no está configurada.');
  }

  if (!cacheSystem) cacheSystem = await construirSystemPrompt();

  const maxIns = playbook.max_insights || 4;
  const encargo =
    `## Tu área de hoy: ${playbook.nombre}\n\n${playbook.prompt}\n\n` +
    `Entrega entre 3 y ${maxIns} hallazgos. Empieza a consultar la base y termina con entregar_insights.`;

  const messages = [
    // El catálogo es igual para las cuatro áreas: cachearlo abarata las
    // corridas siguientes.
    { role: 'system', content: [{ type: 'text', text: cacheSystem, cache_control: { type: 'ephemeral' } }] },
    { role: 'user', content: encargo },
  ];

  const consultas = [];
  const uso = { entrada: 0, salida: 0, cacheadas: 0, costo: 0, costoReal: true };

  for (let vuelta = 1; vuelta <= MAX_VUELTAS; vuelta++) {
    const data = await llamarModelo(messages);
    // Qué modelo contestó: con el respaldo gratuito no es MODELO.
    if (data.model) uso.modelo = data.model;

    if (data.usage) {
      uso.entrada += data.usage.prompt_tokens || 0;
      uso.salida += data.usage.completion_tokens || 0;
      uso.cacheadas += data.usage.prompt_tokens_details?.cached_tokens || 0;
      if (typeof data.usage.cost === 'number') uso.costo += data.usage.cost;
      else uso.costoReal = false;
    }

    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('Respuesta vacía del modelo.');

    const llamadas = msg.tool_calls || [];

    // Sin herramientas: el modelo no cerró bien. Se le pide que entregue.
    if (!llamadas.length) {
      messages.push(msg);
      messages.push({
        role: 'user',
        content: 'No entregaste los hallazgos con la herramienta. Llama a entregar_insights con la lista.',
      });
      continue;
    }

    messages.push(msg);

    for (const lc of llamadas) {
      const nombre = lc.function?.name;
      let args = {};
      try {
        args = JSON.parse(lc.function?.arguments || '{}');
      } catch {
        args = {};
      }

      if (nombre === 'entregar_insights') {
        const insights = Array.isArray(args.insights) ? args.insights : [];
        return terminar(insights, consultas, uso, t0);
      }

      if (nombre === 'ejecutar_sql') {
        const r = await db.ejecutarSQL(args.sql || '');
        let contenido;
        if (r.ok) {
          const id = consultas.length + 1;
          consultas.push({ id, sql: r.sql, proposito: args.proposito || null, num_filas: r.num_filas });
          contenido = JSON.stringify({
            consulta_id: id,
            num_filas: r.num_filas,
            filas: r.filas.slice(0, MAX_FILAS_AL_MODELO),
            nota:
              r.filas.length > MAX_FILAS_AL_MODELO
                ? `Se muestran ${MAX_FILAS_AL_MODELO} de ${r.num_filas} filas. Agrega en SQL si necesitas el total.`
                : undefined,
          });
        } else {
          contenido = JSON.stringify({
            error: r.error,
            detalle: r.detalle || undefined,
            instruccion: 'La consulta falló. Corrige el SQL según este error y vuelve a intentar.',
          });
        }
        messages.push({ role: 'tool', tool_call_id: lc.id, name: nombre, content: contenido });
        continue;
      }

      if (nombre === 'muestrear_valores') {
        const r = await db.muestrearValores(args.vista, args.columna);
        messages.push({ role: 'tool', tool_call_id: lc.id, name: nombre, content: JSON.stringify(r) });
        continue;
      }

      messages.push({
        role: 'tool',
        tool_call_id: lc.id,
        name: nombre || 'desconocida',
        content: JSON.stringify({
          error: `No existe la herramienta "${nombre}". Usa ejecutar_sql, muestrear_valores o entregar_insights.`,
        }),
      });
    }
  }

  return terminar([], consultas, uso, t0, 'limite_de_vueltas');
}

function terminar(insights, consultas, uso, t0, incidencia) {
  let costo = uso.costo;
  if (!uso.costoReal) {
    const p = PRECIOS[MODELO] || PRECIOS['anthropic/claude-sonnet-5'];
    const noCacheadas = Math.max(uso.entrada - uso.cacheadas, 0);
    costo = (noCacheadas / 1e6) * p.entrada + (uso.cacheadas / 1e6) * p.cache + (uso.salida / 1e6) * p.salida;
  }
  return {
    insights,
    consultas,
    meta: {
      modelo: uso.modelo || MODELO,
      incidencia: incidencia || null,
      num_consultas: consultas.length,
      tokens_entrada: uso.entrada,
      tokens_cacheados: uso.cacheadas,
      tokens_salida: uso.salida,
      costo_usd: Number(costo.toFixed(5)),
      costo_estimado: !uso.costoReal,
      ms: Date.now() - t0,
    },
  };
}

function limpiarCache() {
  cacheSystem = null;
}

module.exports = { analizar, limpiarCache, REGLAS_COMUNES, MODELO };
