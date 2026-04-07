/**
 * Agents Index - Exporta todos los agentes y el sistema
 */
const BaseAgent = require('./BaseAgent');
const OrchestratorAgent = require('./orchestrator/OrchestratorAgent');
const AnalistaFinanciero = require('./analista/AnalistaFinanciero');
const AsistenteSAT = require('./asistente-sat/AsistenteSAT');
const PredictorCashFlow = require('./predictor/PredictorCashFlow');
const AuditorAutomatico = require('./auditor/AuditorAutomatico');
const ChatbotCFO = require('./chatbot/ChatbotCFO');

// Crear instancia singleton del orchestrator
let orchestratorInstance = null;

function initializeOrchestrator() {
  if (orchestratorInstance) return orchestratorInstance;

  orchestratorInstance = new OrchestratorAgent();
  
  // Registrar todos los agentes
  orchestratorInstance.registerAgent(new AnalistaFinanciero());
  orchestratorInstance.registerAgent(new AsistenteSAT());
  orchestratorInstance.registerAgent(new PredictorCashFlow());
  orchestratorInstance.registerAgent(new AuditorAutomatico());
  orchestratorInstance.registerAgent(new ChatbotCFO());

  console.log('[Agents] Sistema multi-agente inicializado');
  console.log(`[Agents] Agentes registrados: ${orchestratorInstance.agents.size}`);
  
  return orchestratorInstance;
}

function getOrchestrator() {
  if (!orchestratorInstance) {
    return initializeOrchestrator();
  }
  return orchestratorInstance;
}

module.exports = {
  BaseAgent,
  OrchestratorAgent,
  AnalistaFinanciero,
  AsistenteSAT,
  PredictorCashFlow,
  AuditorAutomatico,
  ChatbotCFO,
  initializeOrchestrator,
  getOrchestrator
};
