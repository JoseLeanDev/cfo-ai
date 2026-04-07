/**
 * Chatbot CFO Agent
 * Interfaz conversacional principal
 * Maneja consultas generales y da la bienvenida
 */
const BaseAgent = require('../BaseAgent');

class ChatbotCFO extends BaseAgent {
  constructor() {
    super('ChatbotCFO', 'conversational_interface', [
      'general_qa',
      'welcome',
      'help',
      'navigation',
      'small_talk'
    ]);
    
    this.welcomeGiven = false;
  }

  async process(input, context) {
    const { query, userId } = input;
    
    this.addToMemory('user', query);

    const query_lower = query.toLowerCase();

    // Saludos y bienvenida
    if (this.isGreeting(query_lower)) {
      return this.giveWelcome();
    }

    // Ayuda / Qué puedes hacer
    if (query_lower.includes('ayuda') || query_lower.includes('help') || 
        query_lower.includes('qué puedes hacer') || query_lower.includes('menú') ||
        query_lower.includes('opciones')) {
      return this.showHelp();
    }

    // Información sobre agentes
    if (query_lower.includes('agente') || query_lower.includes('quién eres') ||
        query_lower.includes('cómo funciona')) {
      return this.explainAgents();
    }

    // Agradecimientos / despedida
    if (this.isGoodbye(query_lower)) {
      return this.sayGoodbye();
    }

    // Fallback: Consulta no reconocida
    return this.fallbackResponse();
  }

  isGreeting(query) {
    const greetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 
                       'hey', 'hi', 'hello', 'qué tal', 'cómo estás'];
    return greetings.some(g => query.includes(g));
  }

  isGoodbye(query) {
    const goodbyes = ['adiós', 'chao', 'hasta luego', 'bye', 'nos vemos', 
                      'gracias', 'thank', 'perfecto', 'excelente'];
    return goodbyes.some(g => query.includes(g));
  }

  giveWelcome() {
    this.welcomeGiven = true;
    
    const hour = new Date().getHours();
    let saludo = '¡Hola';
    if (hour < 12) saludo = '¡Buenos días';
    else if (hour < 18) saludo = '¡Buenas tardes';
    else saludo = '¡Buenas noches';

    const response = `${saludo}! Soy **CFO AI**, tu asistente financiero inteligente. 🤖💼\n\n` +
      `Puedo ayudarte con:\n\n` +
      `📊 **Análisis Financiero** - KPIs, ratios, rentabilidad\n` +
      `🏛️ **Obligaciones SAT** - Impuestos y cumplimiento fiscal\n` +
      `🛫 **Predicciones** - Runway, proyecciones de cash flow\n` +
      `🔍 **Auditoría** - Detección de anomalías\n\n` +
      `¿Qué necesitas saber hoy?`;

    return this.formatResponse(response, 'welcome');
  }

  showHelp() {
    const response = `📚 **Menú de Ayuda - CFO AI**\n\n` +
      `**Ejemplos de consultas que puedes hacer:**\n\n` +
      `💰 *"¿Cuál es mi runway?"* - Análisis de supervivencia\n` +
      `📈 *"Muéstrame los KPIs"* - Indicadores financieros\n` +
      `📋 *"¿Qué obligaciones tengo pendientes?"* - SAT Guatemala\n` +
      `🔍 *"Audita mis transacciones"* - Detección de anomalías\n` +
      `📊 *"Análisis de rentabilidad"* - Margen y utilidad\n` +
      `🎯 *"Proyección de tendencias"* - Forecast financiero\n\n` +
      `También puedes preguntar por:\n` +
      `• Ratios de liquidez (ratio actual, prueba ácida)\n` +
      `• IVA, ISR y retenciones\n` +
      `• Duplicados en transacciones\n` +
      `• Cualquier duda sobre tus finanzas\n\n` +
      `¿Qué te gustaría consultar?`;

    return this.formatResponse(response, 'help');
  }

  explainAgents() {
    const response = `🤖 **Nuestro Equipo de Agentes de IA**\n\n` +
      `CFO AI funciona con 5 agentes especializados coordinados por un Orchestrator:\n\n` +
      `1️⃣ **Analista Financiero** 📊\n` +
      `   • KPIs, ratios de liquidez, rentabilidad\n` +
      `   • Análisis de métricas financieras\n\n` +
      `2️⃣ **Asistente SAT** 🏛️\n` +
      `   • Obligaciones fiscales de Guatemala\n` +
      `   • IVA, ISR, retenciones\n\n` +
      `3️⃣ **Predictor Cash Flow** 🛫\n` +
      `   • Runway (meses de supervivencia)\n` +
      `   • Proyecciones y tendencias\n\n` +
      `4️⃣ **Auditor Automático** 🔍\n` +
      `   • Detección de anomalías\n` +
      `   • Duplicados y fraudes potenciales\n\n` +
      `5️⃣ **Chatbot CFO** 💬 (yo)\n` +
      `   • Interfaz conversacional\n` +
      `   • Ayuda y navegación\n\n` +
      `🎛️ **Orchestrator** (detrás de escena)\n` +
      `   Coordina todos los agentes y decide cuál responde a cada consulta.`;

    return this.formatResponse(response, 'info');
  }

  sayGoodbye() {
    const responses = [
      '¡Hasta luego! Estaré aquí cuando necesites ayuda con tus finanzas. 📊',
      'Gracias por usar CFO AI. ¡Que tengas un excelente día! 💼',
      'Nos vemos. Recuerda que puedes consultarme cuando quieras sobre tu runway, KPIs o impuestos. 🚀',
      '¡Adiós! No olvides revisar tus obligaciones SAT pendientes. 🏛️'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return this.formatResponse(randomResponse, 'goodbye');
  }

  fallbackResponse() {
    const response = `Hmm... no estoy seguro de entender completamente. 🤔\n\n` +
      `Puedo ayudarte con:\n` +
      `• Análisis financiero (KPIs, ratios, rentabilidad)\n` +
      `• Obligaciones SAT (iva, isr, vencimientos)\n` +
      `• Predicciones (runway, proyecciones)\n` +
      `• Auditoría (anomalías, duplicados)\n\n` +
      `Escribe **"ayuda"** para ver ejemplos de consultas, o intenta reformular tu pregunta.`;

    return this.formatResponse(response, 'fallback');
  }
}

module.exports = ChatbotCFO;
