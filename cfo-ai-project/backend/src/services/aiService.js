/**
 * AI Service - Integración con LLM para Agentes de IA
 * Usa API de Kimi/OpenRouter para análisis inteligente
 */

const axios = require('axios');

// Configuración de proveedores LLM
const LLM_CONFIG = {
  // Usar OpenRouter como default (acceso a múltiples modelos)
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || process.env.KIMI_API_KEY,
    model: 'anthropic/claude-3.7-sonnet',
    fallbackModel: 'openai/gpt-4o'
  },
  // Fallback directo a Kimi si está configurado
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKey: process.env.KIMI_API_KEY,
    model: 'kimi-k2.5'
  }
};

class AIService {
  constructor() {
    // Usar Kimi como default si hay KIMI_API_KEY, sino openrouter
    this.provider = process.env.LLM_PROVIDER || 
      (process.env.KIMI_API_KEY ? 'kimi' : 'openrouter');
    this.config = LLM_CONFIG[this.provider];
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Análisis financiero inteligente con LLM
   * @param {Object} data - Datos financieros a analizar
   * @param {string} context - Contexto del análisis
   * @param {string} taskType - Tipo de tarea (auditoria, analisis, conciliacion)
   * @returns {Promise<Object>} - Análisis del LLM
   */
  async analizarDatos(data, context, taskType = 'general') {
    const startTime = Date.now();
    
    try {
      const prompt = this.construirPrompt(data, context, taskType);
      const response = await this.llamarLLM(prompt);
      
      return {
        exito: true,
        analisis: this.parsearRespuesta(response),
        raw: response,
        duracion_ms: Date.now() - startTime,
        tokens_usados: response.usage?.total_tokens || null
      };
    } catch (error) {
      this.errorCount++;
      console.error('[AIService] Error en análisis:', error.message);
      return {
        exito: false,
        error: error.message,
        duracion_ms: Date.now() - startTime,
        analisis: null
      };
    }
  }

  /**
   * Detectar anomalías usando LLM
   * @param {Array} transacciones - Lista de transacciones
   * @param {Array} saldos - Lista de saldos
   * @returns {Promise<Object>} - Anomalías detectadas por IA
   */
  async detectarAnomaliasIA(transacciones, saldos) {
    const prompt = `
Eres un auditor financiero experto. Analiza los siguientes datos y detecta anomalías, patrones sospechosos o riesgos:

## DATOS DE TRANSACCIONES RECIENTES:
${JSON.stringify(transacciones.slice(0, 50), null, 2)}

## SALDOS DE CUENTAS:
${JSON.stringify(saldos, null, 2)}

## TU TAREA:
1. Identifica transacciones atípicas o sospechosas
2. Detecta posibles duplicados
3. Señala montos inusualmente altos o bajos
4. Identifica patrones de fraccionamiento
5. Detecta saldos negativos en cuentas de activo

Responde en formato JSON:
{
  "anomalias": [
    {
      "tipo": "tipo_anomalia",
      "severidad": "alta|media|baja",
      "descripcion": "descripción detallada",
      "transacciones_afectadas": [ids],
      "monto_impacto": 0,
      "recomendacion": "acción recomendada"
    }
  ],
  "resumen": "resumen ejecutivo",
  "riesgo_general": "alto|medio|bajo"
}`;

    return this.analizarDatos({ transacciones, saldos }, prompt, 'auditoria');
  }

  /**
   * Generar insights financieros con LLM
   * @param {Object} metricas - Métricas financieras
   * @param {Array} tendencias - Datos históricos
   * @returns {Promise<Object>} - Insights generados
   */
  async generarInsightsIA(metricas, tendencias) {
    const prompt = `
Eres un CFO (Chief Financial Officer) experto. Analiza las métricas financieras y genera insights accionables.

## MÉTRICAS ACTUALES:
${JSON.stringify(metricas, null, 2)}

## TENDENCIAS HISTÓRICAS:
${JSON.stringify(tendencias, null, 2)}

## TU TAREA:
1. Identifica tendencias preocupantes o alentadoras
2. Detecta desviaciones del presupuesto
3. Sugiere acciones correctivas o preventivas
4. Genera un "CFO Brief" ejecutivo

Responde en formato JSON:
{
  "insights": [
    {
      "categoria": "liquidez|rentabilidad|crecimiento|riesgo",
      "titulo": "título del insight",
      "descripcion": "descripción detallada",
      "accion_recomendada": "qué hacer",
      "prioridad": "alta|media|baja",
      "impacto_estimado": "descripción del impacto"
    }
  ],
  "brief_ejecutivo": "resumen para el CEO",
  "alertas": ["alerta 1", "alerta 2"]
}`;

    return this.analizarDatos({ metricas, tendencias }, prompt, 'analisis');
  }

  /**
   * Analizar conciliaciones bancarias con LLM
   * @param {Array} movimientosBanco - Movimientos del banco
   * @param {Array} transaccionesLibro - Transacciones contables
   * @returns {Promise<Object>} - Análisis de conciliación
   */
  async analizarConciliacionIA(movimientosBanco, transaccionesLibro) {
    const prompt = `
Eres un experto en conciliaciones bancarias. Analiza estos datos y detecta discrepancias.

## MOVIMIENTOS BANCARIOS:
${JSON.stringify(movimientosBanco.slice(0, 30), null, 2)}

## TRANSACCIONES EN LIBROS:
${JSON.stringify(transaccionesLibro.slice(0, 30), null, 2)}

## TU TAREA:
1. Identifica transacciones no conciliadas
2. Detecta diferencias de montos
3. Encuentra transacciones en el banco no registradas en libros
4. Sugiere ajustes necesarios

Responde en formato JSON:
{
  "diferencias": [
    {
      "tipo": "no_en_libros|no_en_banco|monto_diferente",
      "descripcion": "descripción",
      "monto_banco": 0,
      "monto_libro": 0,
      "diferencia": 0,
      "fecha": "YYYY-MM-DD",
      "accion_sugerida": "acción"
    }
  ],
  "resumen": "resumen de la conciliación",
  "saldo_conciliado": false,
  "ajustes_necesarios": [{"descripcion": "", "monto": 0}]
}`;

    return this.analizarDatos({ movimientosBanco, transaccionesLibro }, prompt, 'conciliacion');
  }

  /**
   * Generar respuesta conversacional del agente
   * @param {string} mensaje - Mensaje del usuario
   * @param {Object} contexto - Contexto financiero
   * @returns {Promise<string>} - Respuesta del agente
   */
  async conversar(mensaje, contexto) {
    const systemPrompt = `Eres un CFO AI Agent llamado "Finn". Eres un asistente financiero experto, profesional pero cercano. 
Tienes acceso a datos financieros reales de la empresa.
Responde de forma concisa y accionable. Si no tienes datos específicos, indícalo claramente.
Usa emojis cuando sea apropiado. Responde en español.

Contexto actual de la empresa:
${JSON.stringify(contexto, null, 2)}`;

    try {
      const response = await this.llamarLLM([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: mensaje }
      ], { jsonMode: false });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('[AIService] Error en conversación:', error);
      return "Lo siento, estoy teniendo problemas técnicos. ¿Podrías intentar de nuevo?";
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  construirPrompt(data, context, taskType) {
    return `
${context}

Datos:
${JSON.stringify(data, null, 2)}

Responde únicamente en formato JSON válido.`;
  }

  async llamarLLM(messages, options = {}) {
    this.requestCount++;
    
    const { jsonMode = true } = options;
    
    // Formato unificado para mensajes
    const msgs = Array.isArray(messages) ? messages : [{ role: 'user', content: messages }];
    
    if (this.provider === 'openrouter') {
      const payload = {
        model: this.config.model,
        messages: msgs,
        temperature: 0.3,
        max_tokens: 4000
      };
      
      // Solo forzar JSON mode cuando se solicita explícitamente
      if (jsonMode) {
        payload.response_format = { type: "json_object" };
      }
      
      const response = await axios.post(
        `${this.config.baseUrl}/chat/completions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'CFO AI Agents'
          },
          timeout: 60000
        }
      );
      return response.data;
    }
    
    // Fallback a Kimi API
    const response = await axios.post(
      `${this.config.baseUrl}/chat/completions`,
      {
        model: this.config.model,
        messages: msgs,
        temperature: 0.3,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    return response.data;
  }

  parsearRespuesta(response) {
    try {
      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (e) {
      console.error('[AIService] Error parseando respuesta:', e);
      return { raw: response.choices[0].message.content };
    }
  }

  getStats() {
    return {
      provider: this.provider,
      requests: this.requestCount,
      errors: this.errorCount,
      success_rate: this.requestCount > 0 
        ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }
}

module.exports = new AIService();
