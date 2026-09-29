/**
 * openrouter — llamada a chat/completions con respaldo gratuito.
 *
 * Si la cuenta se queda sin saldo, OpenRouter responde 402 al modelo de pago.
 * En ese caso la misma llamada se repite con modelos gratuitos que soportan
 * herramientas, pasados en `models`: si el primero está saturado (429) o se
 * retira, OpenRouter prueba el siguiente.
 *
 * Probados el 29 de septiembre de 2026 con el agente SQL sobre el demo:
 *   - dots-studio/dots-3-note-preview:free  la respuesta más completa (~40 s)
 *   - qwen/qwen3.8-27b:free                 correcta, a veces saturada (~45 s)
 *   - inclusionai/ling-3.0-flash-sante:free correcta y la más rápida (~12 s)
 * Los modelos gratuitos que entrenan con los datos quedan fuera por la
 * política de privacidad de la cuenta de OpenRouter; no hay que cambiarla.
 * OPENROUTER_MODELOS_GRATIS reemplaza la lista (separada por comas).
 *
 * Límites: con menos de USD 10 comprados en total, 50 llamadas gratuitas al
 * día; con 10 o más, 1000. Cada pregunta del chat usa de 3 a 6 llamadas.
 * OpenRouter advierte que con saldo negativo puede bloquear también los
 * modelos gratuitos; con -0.02 aún respondían.
 */
const axios = require('axios');

const URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELOS_GRATIS = (
  process.env.OPENROUTER_MODELOS_GRATIS ||
  'dots-studio/dots-3-note-preview:free,qwen/qwen3.8-27b:free,inclusionai/ling-3.0-flash-sante:free'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

// Después de un 402 no tiene caso reintentar el modelo de pago en cada
// llamada: se va directo al respaldo durante un rato.
const PAUSA_SIN_SALDO_MS = 10 * 60 * 1000;
let sinSaldoHasta = 0;

/**
 * @param {object} body     cuerpo de chat/completions con `model`
 * @param {object} opts
 * @param {string} opts.titulo  X-Title para el panel de OpenRouter
 * @param {number} opts.timeout
 * @returns {Promise<object>} la respuesta; `data.model` dice qué modelo contestó
 */
async function completar(body, { titulo, timeout }) {
  const enviar = (cuerpo) =>
    axios
      .post(URL, cuerpo, {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://cfo-ai-backend-4n29.onrender.com',
          'X-Title': titulo,
        },
        timeout,
      })
      .then((r) => r.data);

  if (Date.now() >= sinSaldoHasta || !MODELOS_GRATIS.length) {
    try {
      return await enviar(body);
    } catch (e) {
      if (e.response?.status !== 402 || !MODELOS_GRATIS.length) throw e;
      sinSaldoHasta = Date.now() + PAUSA_SIN_SALDO_MS;
      console.warn(`[openrouter] ${body.model} sin saldo (402); se usa el respaldo gratuito`);
    }
  }
  const { model, ...resto } = body;
  return enviar({ ...resto, model: MODELOS_GRATIS[0], models: MODELOS_GRATIS });
}

module.exports = { completar, MODELOS_GRATIS };
