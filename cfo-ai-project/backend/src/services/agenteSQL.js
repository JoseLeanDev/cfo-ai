/**
 * agenteSQL — El agente que responde consultando la base.
 *
 * No es un chatbot con datos pegados al prompt: es un bucle. El modelo pide una
 * herramienta, el backend la ejecuta y le devuelve el resultado, y el modelo
 * decide si ya puede responder o si necesita otra consulta. Si su SQL falla,
 * recibe el error de Postgres y se corrige.
 *
 * El modelo NUNCA toca la base: solo escribe SQL. Lo ejecuta dbAgente, con el
 * rol de solo lectura y pasando por sqlGuard. Y las gráficas no llevan cifras
 * escritas por el modelo: referencian por id las filas de una consulta real.
 *
 * Transporte: OpenRouter, con el formato de herramientas compatible con OpenAI.
 * Es el proveedor que ya usa el resto de la plataforma y la única llave de
 * modelo configurada en el servicio.
 */
const axios = require('axios');
const db = require('./dbAgente');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELO = process.env.OPENROUTER_MODEL_AGENTE || 'anthropic/claude-opus-5';
const MAX_VUELTAS = parseInt(process.env.AGENTE_MAX_VUELTAS || '8', 10);
const MAX_FILAS_AL_MODELO = 60;

// El modelo piensa antes de responder, y ese razonamiento cuenta contra el
// tope. Con un tope bajo, la llamada a `responder` queda cortada a la mitad y
// el JSON de la respuesta llega roto.
const MAX_TOKENS = 16000;

// Precio por millón de tokens en OpenRouter, para estimar el costo cuando la
// respuesta no trae el costo real.
const PRECIOS = {
  'anthropic/claude-opus-5': { entrada: 5, salida: 25, cache: 0.5 },
  'anthropic/claude-opus-5.5': { entrada: 4, salida: 20, cache: 0.2 },
  'anthropic/claude-sonnet-5': { entrada: 2, salida: 10, cache: 0.2 },
  'anthropic/claude-sonnet-4.6': { entrada: 3, salida: 15, cache: 0.3 },
};

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
        'Si la consulta falla, devuelve el error de Postgres para que la corrijas y vuelvas a intentar.',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'La consulta. Solo SELECT o WITH, una sola sentencia, solo sobre vistas de analitica.' },
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
        'Úsalo antes de filtrar por una columna de texto, para no inventar un valor que no existe.',
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
      name: 'responder',
      description: 'Entrega la respuesta final al usuario y termina. Úsalo solo cuando ya tengas los datos que necesitas.',
      parameters: {
        type: 'object',
        properties: {
          texto: {
            type: 'string',
            description: 'La respuesta en español, en markdown. Concisa y directa, con las cifras clave escritas.',
          },
          bloques: {
            type: 'array',
            description: 'Visualizaciones opcionales. Los datos NO se escriben aquí: se referencian con datos_de.',
            items: {
              type: 'object',
              properties: {
                tipo: { type: 'string', enum: ['tabla', 'linea', 'barras', 'pastel', 'kpi'] },
                titulo: { type: 'string' },
                datos_de: { type: 'integer', description: 'El id de la consulta cuyas filas se muestran (lo devuelve ejecutar_sql).' },
                x: { type: 'string', description: 'Para gráficas: columna del eje horizontal.' },
                y: { type: 'array', items: { type: 'string' }, description: 'Para gráficas: columnas numéricas a graficar.' },
                columnas: { type: 'array', items: { type: 'string' }, description: 'Para tablas: columnas a mostrar. Vacío = todas.' },
              },
              required: ['tipo', 'datos_de'],
            },
          },
        },
        required: ['texto'],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Instrucciones
// ---------------------------------------------------------------------------
async function construirSystemPrompt() {
  const catalogo = await db.catalogoComoTexto();

  // Las advertencias críticas se leen de la vista, así que si mañana cambia
  // v_calidad_datos este prompt cambia solo.
  let advertencias = '';
  try {
    const r = await db.ejecutarSQL(
      "SELECT entidad, problema, detalle FROM analitica.v_calidad_datos WHERE severidad = 'alto'"
    );
    if (r.ok && r.filas.length) {
      advertencias = r.filas.map((f) => `- **${f.entidad}**: ${f.problema}. ${f.detalle}`).join('\n');
    }
  } catch (e) {
    console.warn('[agenteSQL] no se pudieron leer las advertencias de calidad:', e.message);
  }

  return `Eres el analista financiero de Qora para Grupo Retail Centroamérica, una cadena de tiendas con cuatro marcas en cinco países.

Respondes consultando la base de datos con SQL. No inventas cifras: todo número que digas tiene que venir de una consulta que ejecutaste en esta conversación.

## Cómo trabajas
1. Lee el catálogo de abajo y decide qué consultar. Si la pregunta usa fechas, revisa v_meta.
2. Llama a ejecutar_sql. Si falla, lee el error, corrige y reintenta (máximo tres intentos por idea).
3. Si vas a filtrar por una columna de texto y no estás seguro de los valores, llama antes a muestrear_valores.
4. Cuando tengas los datos, llama a responder. Siempre terminas con responder.

## Reglas que no puedes saltarte
- **Fechas**: hay dos marcos de tiempo. Las ventas cubren de v_meta.ventas_desde a v_meta.ventas_hasta. Tesorería, cartera, pagos y SAT son una foto a v_meta.fecha_corte. Nunca uses CURRENT_DATE: "hoy", "este mes", "vencido" y "próximo" se miden contra fecha_corte; "este año" en ventas es el año de ventas_hasta.
- **Margen %**: para cualquier grupo es sum(margen_bruto) / nullif(sum(ventas), 0) * 100. Nunca promedies porcentajes.
- **Efectivo**: suma saldo_quetzales de v_bancos, que ya convierte los dólares.
- **Cartera y pagos**: v_cxc y v_cxp solo traen documentos con saldo pendiente. Suma la columna saldo, no monto_total.
- **Resumen de la posición**: v_posicion ya trae efectivo, cartera, pagos, capital de trabajo, días de caja, flujo neto mensual y runway (NULL si el negocio no consume caja). Úsala antes de recalcular.
- Todo está en quetzales (GTQ).
- Solo puedes leer el schema analitica.
- Si los datos no alcanzan para responder, dilo. Es mejor que inventar.

## Limitaciones conocidas
Si la pregunta toca alguna, menciónala en una frase. No las repitas cuando no vengan al caso.

${advertencias || '- (sin advertencias registradas)'}

## Cómo respondes
- Español, trato de usted, markdown. Declarativo y con evidencia: di qué pasa, cuánto, y de dónde sale.
- Sin rodeos, sin relleno, sin adjetivos de venta. No uses guiones largos.
- Cifras en quetzales con separador de miles: Q1,234,567. Porcentajes con un decimal.
- **El texto responde la pregunta por sí solo**, con las cifras clave escritas. Los bloques son un complemento visual, nunca un sustituto: no dejes frases colgadas esperando que el bloque las complete.
- Para listados de varias filas usa un bloque de tipo tabla en vez de escribir la tabla en markdown. En el texto resume el hallazgo (el total, los primeros, la conclusión).
- Agrega una gráfica cuando haya tendencia o comparación; no para un solo número.
- Si mencionas algunas filas de un resultado más grande, di cuántas de cuántas (por ejemplo "las 5 más grandes de 23").
- Los datos de los bloques se referencian con datos_de. No reescribas las filas.

## Catálogo de datos

${catalogo}`;
}

let cacheSystem = null;

// ---------------------------------------------------------------------------
// OpenRouter
// ---------------------------------------------------------------------------
async function llamarModelo(messages, apiKey) {
  const { data } = await axios.post(
    OPENROUTER_URL,
    {
      model: MODELO,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      max_tokens: MAX_TOKENS,
      // Pide a OpenRouter el costo real de la llamada en la respuesta.
      usage: { include: true },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://cfo-ai-backend-4n29.onrender.com',
        'X-Title': 'Qora Agente SQL',
      },
      timeout: 90000,
    }
  );
  return data;
}

/**
 * Corre el agente.
 *
 * @param {string} pregunta
 * @param {object} opts
 * @param {Array}  opts.historial  mensajes previos [{ role, content }]
 * @param {function} opts.onPaso   callback por paso, para streaming futuro
 */
async function correr(pregunta, opts = {}) {
  const { onPaso = () => {}, historial = [] } = opts;
  const t0 = Date.now();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.includes('placeholder') || apiKey.includes('tu-api-key')) {
    throw new Error('OPENROUTER_API_KEY no está configurada en el servidor.');
  }

  if (!cacheSystem) cacheSystem = await construirSystemPrompt();

  const messages = [
    // El system prompt es idéntico en todas las vueltas y todas las preguntas:
    // cachearlo baja el costo de esas lecturas a una décima parte.
    { role: 'system', content: [{ type: 'text', text: cacheSystem, cache_control: { type: 'ephemeral' } }] },
    ...historial,
    { role: 'user', content: pregunta },
  ];

  const consultas = []; // { id, sql, proposito, filas, num_filas }
  const pasos = [];
  const uso = { entrada: 0, salida: 0, cacheadas: 0, costo: 0, costoReal: true };

  for (let vuelta = 1; vuelta <= MAX_VUELTAS; vuelta++) {
    const data = await llamarModelo(messages, apiKey);

    if (data.usage) {
      uso.entrada += data.usage.prompt_tokens || 0;
      uso.salida += data.usage.completion_tokens || 0;
      uso.cacheadas += data.usage.prompt_tokens_details?.cached_tokens || 0;
      if (typeof data.usage.cost === 'number') uso.costo += data.usage.cost;
      else uso.costoReal = false;
    }

    const eleccion = data.choices?.[0];
    const msg = eleccion?.message;
    if (!msg) throw new Error('Respuesta vacía del modelo.');

    // Respuesta cortada por el tope de tokens: los argumentos de la herramienta
    // pueden venir incompletos. Mejor decirlo que devolver algo roto.
    if (eleccion.finish_reason === 'length') {
      pasos.push({ vuelta, accion: 'cortado_por_longitud' });
      return terminar(
        {
          texto: 'La respuesta se extendió más de lo previsto y quedó incompleta. Intente con una pregunta más acotada.',
          bloques: consultas.length ? [{ tipo: 'tabla', datos_de: consultas.length, titulo: 'Último resultado obtenido' }] : [],
        },
        consultas, pasos, uso, t0
      );
    }

    const llamadas = msg.tool_calls || [];

    // Sin herramientas: el modelo contestó en texto plano. Se acepta.
    if (!llamadas.length) {
      pasos.push({ vuelta, accion: 'texto_libre' });
      return terminar({ texto: msg.content || 'Sin respuesta.', bloques: [] }, consultas, pasos, uso, t0);
    }

    // Se devuelve el mensaje completo, con su razonamiento, para que el modelo
    // conserve el hilo entre vueltas.
    messages.push(msg);

    for (const lc of llamadas) {
      const nombre = lc.function?.name;
      let args = {};
      try { args = JSON.parse(lc.function?.arguments || '{}'); } catch { args = {}; }

      if (nombre === 'responder') {
        pasos.push({ vuelta, accion: 'responder' });
        onPaso({ tipo: 'respondiendo' });
        return terminar(args, consultas, pasos, uso, t0);
      }

      if (nombre === 'ejecutar_sql') {
        onPaso({ tipo: 'consultando', proposito: args.proposito || 'consultando la base' });
        const r = await db.ejecutarSQL(args.sql || '');
        let contenido;

        if (r.ok) {
          const id = consultas.length + 1;
          consultas.push({ id, sql: r.sql, proposito: args.proposito || null, filas: r.filas, num_filas: r.num_filas });
          pasos.push({ vuelta, accion: 'sql_ok', filas: r.num_filas, ms: r.ms, proposito: args.proposito || null });

          const recorte = r.filas.slice(0, MAX_FILAS_AL_MODELO);
          contenido = JSON.stringify({
            consulta_id: id,
            num_filas: r.num_filas,
            filas: recorte,
            nota: r.filas.length > MAX_FILAS_AL_MODELO
              ? `Se muestran ${MAX_FILAS_AL_MODELO} de ${r.num_filas} filas. El bloque visual usará todas. Si necesitas un resumen, agrega en SQL.`
              : undefined,
          });
        } else {
          pasos.push({ vuelta, accion: 'sql_error', tipo: r.tipo, error: r.error });
          onPaso({ tipo: 'corrigiendo', error: r.error });
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
        onPaso({ tipo: 'explorando', vista: args.vista, columna: args.columna });
        const r = await db.muestrearValores(args.vista, args.columna);
        pasos.push({ vuelta, accion: 'muestreo', vista: args.vista, columna: args.columna, ok: r.ok });
        messages.push({ role: 'tool', tool_call_id: lc.id, name: nombre, content: JSON.stringify(r) });
        continue;
      }

      messages.push({
        role: 'tool',
        tool_call_id: lc.id,
        name: nombre || 'desconocida',
        content: JSON.stringify({ error: `No existe la herramienta "${nombre}". Usa ejecutar_sql, muestrear_valores o responder.` }),
      });
    }
  }

  // Se acabaron las vueltas sin que llamara a responder.
  pasos.push({ accion: 'limite_de_vueltas' });
  return terminar(
    {
      texto: consultas.length
        ? 'Consulté los datos pero no logré cerrar el análisis. Esto es lo que alcancé a obtener; intente con una pregunta más específica.'
        : 'No logré resolver la consulta. Intente reformular la pregunta.',
      bloques: consultas.length ? [{ tipo: 'tabla', datos_de: consultas.length, titulo: 'Último resultado obtenido' }] : [],
    },
    consultas, pasos, uso, t0
  );
}

/** Arma la respuesta final: pega los datos reales a cada bloque. */
function terminar(args, consultas, pasos, uso, t0) {
  const bloques = (args.bloques || [])
    .map((b) => {
      const c = consultas.find((q) => q.id === b.datos_de);
      if (!c) return null;
      return {
        tipo: b.tipo,
        titulo: b.titulo || null,
        x: b.x || null,
        y: b.y || null,
        columnas: b.columnas && b.columnas.length ? b.columnas : null,
        datos: c.filas,
        num_filas: c.num_filas,
      };
    })
    .filter(Boolean);

  let costo = uso.costo;
  if (!uso.costoReal) {
    const p = PRECIOS[MODELO] || PRECIOS['anthropic/claude-opus-5'];
    const noCacheadas = Math.max(uso.entrada - uso.cacheadas, 0);
    costo = (noCacheadas / 1e6) * p.entrada + (uso.cacheadas / 1e6) * p.cache + (uso.salida / 1e6) * p.salida;
  }

  return {
    texto: args.texto || '',
    bloques,
    consultas: consultas.map((c) => ({ id: c.id, sql: c.sql, proposito: c.proposito, num_filas: c.num_filas })),
    pasos,
    meta: {
      modelo: MODELO,
      vueltas: pasos.filter((p) => p.vuelta).length,
      tokens_entrada: uso.entrada,
      tokens_cacheados: uso.cacheadas,
      tokens_salida: uso.salida,
      costo_usd: Number(costo.toFixed(5)),
      costo_estimado: !uso.costoReal,
      ms: Date.now() - t0,
    },
  };
}

function limpiarCache() { cacheSystem = null; }

module.exports = { correr, limpiarCache, TOOLS, MODELO };
