/**
 * Orchestrator Agent
 * Coordina la comunicación entre todos los agentes
 * Este agente NO tiene interfaz de usuario directa
 */
const BaseAgent = require('../BaseAgent');

class OrchestratorAgent extends BaseAgent {
  constructor() {
    super('Orchestrator', 'coordinator', [
      'route_queries',
      'coordinate_agents',
      'synthesize_responses',
      'manage_context'
    ]);
    
    this.agents = new Map();
    this.conversationHistory = [];
  }

  /**
   * Registra un agente en el orquestador
   */
  registerAgent(agentInstance) {
    this.agents.set(agentInstance.name, agentInstance);
    // Silencio: el registro de agentes es ruido técnico, no valor de negocio
  }

  /**
   * Determina qué agente(es) deben manejar una consulta
   */
  async routeQuery(query, context) {
    const query_lower = query.toLowerCase();
    
    // Palabras clave para routing
    const routingRules = [
      {
        agents: ['AnalistaFinanciero'],
        keywords: ['kpi', 'métrica', 'ratio', 'rentabilidad', 'margen', 'roi', 'análisis', 'dashboard', 'indicador', 'financiero']
      },
      {
        agents: ['AsistenteSAT'],
        keywords: ['sat', 'impuesto', 'iva', 'isr', 'retención', 'obligación', 'fiscal', 'declaración', 'guatemala', 'tributario']
      },
      {
        agents: ['PredictorCashFlow'],
        keywords: ['predicción', 'proyección', 'forecast', 'futuro', 'tendencia', 'quiebra', 'runway', 'meses', 'cash flow', 'pronóstico']
      },
      {
        agents: ['AuditorAutomatico'],
        keywords: ['auditoría', 'anomalía', 'irregularidad', 'error', 'revisión', 'control', 'fraude', 'alerta', 'sospechoso']
      },
      {
        agents: ['ChatbotCFO'],
        keywords: ['hola', 'ayuda', 'qué puedes hacer', 'quién eres', 'menu', 'opciones', 'información general']
      }
    ];

    // Si es una consulta compleja, puede necesitar múltiples agentes
    const matchedAgents = new Set();
    
    for (const rule of routingRules) {
      for (const keyword of rule.keywords) {
        if (query_lower.includes(keyword)) {
          rule.agents.forEach(agent => matchedAgents.add(agent));
          break;
        }
      }
    }

    // Si no hay match, usar ChatbotCFO como default
    if (matchedAgents.size === 0) {
      matchedAgents.add('ChatbotCFO');
    }

    return Array.from(matchedAgents);
  }

  /**
   * Procesa una consulta orquestando múltiples agentes si es necesario
   */
  async process(input, context) {
    const { query, userId, empresaId } = input;
    
    this.addToMemory('user', query, { userId, empresaId });

    try {
      // 1. Determinar qué agentes deben responder
      const targetAgents = await this.routeQuery(query, context);

      // 2. Ejecutar agentes en paralelo
      const agentPromises = targetAgents.map(async (agentName) => {
        const agent = this.agents.get(agentName);
        if (!agent) {
          return null;
        }

        try {
          const response = await agent.process(
            { query, userId, empresaId },
            context
          );
          return { agent: agentName, response };
        } catch (error) {
          return { 
            agent: agentName, 
            response: {
              agent: agentName,
              type: 'error',
              content: `Error procesando consulta: ${error.message}`
            }
          };
        }
      });

      const results = await Promise.all(agentPromises);

      // 3. Sintetizar respuestas
      const synthesizedResponse = await this.synthesizeResponses(results, query);
      
      this.addToMemory('assistant', synthesizedResponse.content, {
        agentsInvolved: targetAgents
      });

      return synthesizedResponse;

    } catch (error) {
      return this.formatResponse(
        'Lo siento, hubo un error procesando tu consulta. Por favor intenta de nuevo.',
        'error'
      );
    }
  }

  /**
   * Combina respuestas de múltiples agentes en una respuesta coherente
   */
  async synthesizeResponses(results, originalQuery) {
    const validResults = results.filter(r => r !== null);
    
    if (validResults.length === 0) {
      return this.formatResponse(
        'No pude procesar tu consulta en este momento. Por favor intenta con otra pregunta.',
        'error'
      );
    }

    // Si solo hay un agente, devolver su respuesta directamente
    if (validResults.length === 1) {
      return validResults[0].response;
    }

    // Si hay múltiples agentes, combinar sus respuestas
    const synthesis = {
      agent: 'Orchestrator',
      role: 'coordinator',
      type: 'synthesis',
      content: '',
      sections: [],
      agentsInvolved: validResults.map(r => r.agent),
      timestamp: new Date().toISOString()
    };

    // Construir respuesta combinada
    let combinedContent = '';
    
    for (const result of validResults) {
      const resp = result.response;
      synthesis.sections.push({
        agent: resp.agent,
        type: resp.type,
        content: resp.content,
        data: resp.data
      });
      
      if (resp.content && resp.content.length > 10) {
        combinedContent += `\n\n**${resp.agent}:**\n${resp.content}`;
      }
    }

    synthesis.content = combinedContent.trim();
    
    // Agregar resumen ejecutivo
    synthesis.summary = `Análisis combinado de ${validResults.length} agentes especializados.`;
    
    return synthesis;
  }

  /**
   * Obtiene el estado de todos los agentes
   */
  getSystemStatus() {
    const status = {
      orchestrator: {
        name: this.name,
        role: this.role,
        memorySize: this.memory.length
      },
      agents: []
    };

    for (const [name, agent] of this.agents) {
      status.agents.push({
        name: agent.name,
        role: agent.role,
        capabilities: agent.capabilities,
        memorySize: agent.memory.length,
        status: 'active'
      });
    }

    return status;
  }

  /**
   * Limpia la memoria de todos los agentes
   */
  clearAllMemory() {
    this.clearMemory();
    for (const agent of this.agents.values()) {
      agent.clearMemory();
    }
  }

  /**
   * Obtiene el estado del sistema (compatible con API)
   * Alias de getSystemStatus para compatibilidad con rutas
   */
  getStatus() {
    const systemStatus = this.getSystemStatus();
    return {
      isRunning: true,
      agentes: systemStatus.agents.map(a => a.name),
      totalAgentes: systemStatus.agents.length,
      ...systemStatus
    };
  }
}

module.exports = OrchestratorAgent;
