/**
 * Base Agent Class
 * Todos los agentes heredan de esta clase
 */
class BaseAgent {
  constructor(name, role, capabilities = []) {
    this.name = name;
    this.role = role;
    this.capabilities = capabilities;
    this.memory = []; // Memoria corta de la conversación
  }

  /**
   * Método principal que cada agente debe implementar
   * @param {Object} input - Datos de entrada
   * @param {Object} context - Contexto adicional (db, user, etc.)
   * @returns {Object} Respuesta estructurada
   */
  async process(input, context) {
    throw new Error('process() must be implemented by subclass');
  }

  /**
   * Agrega un mensaje a la memoria del agente
   */
  addToMemory(role, content, metadata = {}) {
    this.memory.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    
    // Mantener solo los últimos 20 mensajes
    if (this.memory.length > 20) {
      this.memory = this.memory.slice(-20);
    }
  }

  /**
   * Limpia la memoria del agente
   */
  clearMemory() {
    this.memory = [];
  }

  /**
   * Formatea una respuesta estándar
   */
  formatResponse(content, type = 'text', data = null, actions = []) {
    return {
      agent: this.name,
      role: this.role,
      type, // 'text', 'analysis', 'alert', 'recommendation', 'data'
      content,
      data,
      actions, // Acciones sugeridas
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseAgent;
