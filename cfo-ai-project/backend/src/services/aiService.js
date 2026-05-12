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
    apiKey: process.env.OPENROUTER_API_KEY,
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
    // Determinar proveedor activo basado en keys disponibles
    this.availableProviders = [];
    
    if (process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('placeholder')) {
      this.availableProviders.push('openrouter');
    }
    if (process.env.KIMI_API_KEY && !process.env.KIMI_API_KEY.includes('placeholder')) {
      this.availableProviders.push('kimi');
    }
    
    // Usar el provider configurado o el primero disponible
    this.provider = process.env.LLM_PROVIDER || this.availableProviders[0] || 'openrouter';
    this.config = LLM_CONFIG[this.provider];
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Verifica conectividad con los proveedores LLM
   * @returns {Promise<Object>} - Estado de cada proveedor
   */
  async healthcheck() {
    const results = {};
    
    for (const providerName of ['openrouter', 'kimi']) {
      const cfg = LLM_CONFIG[providerName];
      if (!cfg.apiKey || cfg.apiKey.includes('placeholder')) {
        results[providerName] = { available: false, reason: 'No API key configured' };
        continue;
      }
      
      try {
        const response = await axios.post(
          `${cfg.baseUrl}/chat/completions`,
          {
            model: cfg.model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
          },
          {
            headers: {
              'Authorization': `Bearer ${cfg.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        results[providerName] = { 
          available: true, 
          model: cfg.model,
          status: response.status 
        };
      } catch (error) {
        results[providerName] = { 
          available: false, 
          error: error.response?.data?.error?.message || error.message,
          status: error.response?.status 
        };
      }
    }
    
    return {
      activeProvider: this.provider,
      availableProviders: this.availableProviders,
      providers: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Intenta llamar al LLM con fallback automático entre proveedores
   */
  async llamarLLMConFallback(messages, options = {}) {
    const errors = [];
    
    // Intentar proveedores en orden de preferencia
    for (const providerName of this.availableProviders) {
      try {
        const cfg = LLM_CONFIG[providerName];
        const payload = {
          model: cfg.model,
          messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
          temperature: 0.3,
          max_tokens: 4000
        };
        
        if (options.jsonMode) {
          payload.response_format = { type: "json_object" };
        }
        
        const response = await axios.post(
          `${cfg.baseUrl}/chat/completions`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${cfg.apiKey}`,
              'Content-Type': 'application/json',
              ...(providerName === 'openrouter' ? {
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'CFO AI Agents'
              } : {})
            },
            timeout: 60000
          }
        );
        
        this.provider = providerName; // Actualizar provider activo
        return response.data;
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        errors.push(`${providerName}: ${errorMsg}`);
        console.warn(`[AIService] ${providerName} failed: ${errorMsg}`);
      }
    }
    
    // Si llegamos aquí, todos los proveedores fallaron
    throw new Error(`All LLM providers failed: ${errors.join('; ')}`);
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
    const systemPrompt = `Eres Finn, CFO AI Agent — un asistente financiero experto, profesional pero cercano. Tienes acceso EN TIEMPO REAL a los datos financieros de la empresa.

## TU MISIÓN
Responde cualquier consulta financiera usando los datos reales que tienes abajo. NO inventes números. Si un dato está en el contexto, úsalo. Si no lo tienes, dilo claramente.

## DATOS DISPONIBLES (contexto actual al ${contexto.fecha_actual || new Date().toISOString().split('T')[0]})

### 💰 LIQUIDEZ
- Efectivo GTQ: Q${(contexto.liquidez?.gtq || 0).toLocaleString()}
- Efectivo USD: $${(contexto.liquidez?.usd || 0).toLocaleString()}
- Cuentas bancarias activas: ${contexto.liquidez?.total_cuentas || 0}
- Runway: ${contexto.runway?.dias || 0} días (gasto diario estimado Q${(contexto.runway?.gasto_diario_estimado || 50000).toLocaleString()})

### 👥 CUENTAS POR COBRAR (CxC)
- Total pendiente: Q${(contexto.cxc?.total || 0).toLocaleString()} (${contexto.cxc?.facturas || 0} facturas)
- Días promedio de cobro (DSO): ${contexto.cxc?.dias_promedio || 0} días
- Aging: ${JSON.stringify(contexto.cxc?.aging || [])}
- Top deudores: ${JSON.stringify(contexto.cxc?.top_deudores || []).slice(0, 500)}

### 💳 CUENTAS POR PAGAR (CxP)
- Total pendiente: Q${(contexto.cxp?.total || 0).toLocaleString()} (${contexto.cxp?.facturas || 0} facturas)
- Próximos pagos (14 días): ${JSON.stringify(contexto.cxp?.proximos_pagos || []).slice(0, 500)}
- Días promedio de pago (DPO): ${contexto.ccc?.dpo || 30} días

### 🔄 CASH CONVERSION CYCLE (CCC)
- Fórmula: DIO + DSO − DPO
- DIO (Inventario): ${contexto.ccc?.dio || 45} días *(estimado, sin datos de inventario real)*
- DSO (Cobro): ${contexto.ccc?.dso || 0} días
- DPO (Pago): ${contexto.ccc?.dpo || 0} días
- CCC total: ${contexto.ccc?.valor || 0} días
- Interpretación: ${contexto.ccc?.interpretacion || 'N/A'}

### 📈 VENTAS Y GASTOS (últimos 30 días)
- Ventas: Q${(contexto.ventas_30d || 0).toLocaleString()}
- Gastos: Q${(contexto.gastos_30d || 0).toLocaleString()}
- Margen: ${contexto.margen_30d || 0}%

### 📅 OBLIGACIONES SAT
${JSON.stringify(contexto.obligaciones_sat || []).slice(0, 400)}

### 🏦 BANCOS
${JSON.stringify(contexto.bancos || []).slice(0, 400)}

### 📝 TRANSACCIONES RECIENTES
${JSON.stringify(contexto.transacciones_recientes || []).slice(0, 600)}

## REGLAS DE RESPUESTA
1. Usa los datos del contexto. NO inventes.
2. Responde en español. Sé conciso pero completo.
3. Si preguntan por CCC, explica qué es y da los números reales del contexto.
4. Si preguntan por runway, usa los días reales del contexto.
5. Si preguntan por KPIs, menciona CxC, CxP, CCC, runway, ventas, gastos.
6. Si no tienes un dato específico, dilo: "No tengo ese dato en este momento".
7. Incluye emojis para hacer la respuesta legible.
8. Si detectas riesgos (ej: runway < 30 días, CxC > 60 días, CCC > 90), menciónalos como alertas.
9. Para preguntas generales ("¿qué es CCC?"), explica el concepto Y da los números de la empresa.`;

    try {
      const response = await this.llamarLLMConFallback([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: mensaje }
      ], { jsonMode: false });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('[AIService] Error en conversación:', error.message);
      return "Lo siento, estoy teniendo problemas técnicos con el servicio de IA. ¿Podrías intentar de nuevo en unos segundos?";
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
    // Delegar al método con fallback automático
    return this.llamarLLMConFallback(messages, options);
  }

  async llamarLLMConFallback(messages, options = {}) {
    this.requestCount++;
    
    const { jsonMode = true } = options;
    const errors = [];
    
    // Formato unificado para mensajes
    const msgs = Array.isArray(messages) ? messages : [{ role: 'user', content: messages }];
    
    // Intentar cada proveedor disponible
    for (const providerName of this.availableProviders) {
      const cfg = LLM_CONFIG[providerName];
      
      try {
        const payload = {
          model: cfg.model,
          messages: msgs,
          temperature: 0.3,
          max_tokens: 4000
        };
        
        if (jsonMode) {
          payload.response_format = { type: "json_object" };
        }
        
        const response = await axios.post(
          `${cfg.baseUrl}/chat/completions`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${cfg.apiKey}`,
              'Content-Type': 'application/json',
              ...(providerName === 'openrouter' ? {
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'CFO AI Agents'
              } : {})
            },
            timeout: 60000
          }
        );
        
        // Actualizar provider activo al que funcionó
        this.provider = providerName;
        this.config = cfg;
        return response.data;
        
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        errors.push(`${providerName}: ${errorMsg}`);
        console.warn(`[AIService] ${providerName} failed: ${errorMsg}`);
      }
    }
    
    // Si llegamos aquí, todos los proveedores fallaron
    this.errorCount++;
    throw new Error(`All LLM providers failed: ${errors.join('; ')}`);
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
      availableProviders: this.availableProviders,
      requests: this.requestCount,
      errors: this.errorCount,
      success_rate: this.requestCount > 0 
        ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }
}

module.exports = new AIService();
