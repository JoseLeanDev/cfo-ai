/**
 * Agents Index v2.0 - Nuevo Sistema de Agentes CFO AI
 * 
 * Agentes especializados:
 * - 💰 Caja: Tesorería, cash flow, runway
 * - 📊 Análisis: KPIs, rentabilidad, RFM, anomalías
 * - 💵 Cobranza: CxC, DSO, CCC, cobro
 * - 📗 Contabilidad: Asientos, cierre, SAT
 * - 🤖 CFO AI Core: Orquestador central
 */

const BaseAgent = require('./BaseAgent');
const { CFOAICore, getInstance } = require('./core/CFOAICore');
const AgenteCaja = require('./caja/AgenteCaja');
const AgenteAnalisis = require('./analisis/AgenteAnalisis');
const AgenteCobranza = require('./cobranza/AgenteCobranza');
const AgenteContabilidad = require('./contabilidad/AgenteContabilidad');

// Crear instancia singleton
let coreInstance = null;

function initializeCFOAICore() {
  if (coreInstance) return coreInstance;

  coreInstance = getInstance();
  
  console.log('[Agents v2.0] 🚀 Sistema multi-agente inicializado');
  console.log('[Agents v2.0] Agentes registrados:');
  console.log('  - 💰 Caja (tesorería)');
  console.log('  - 📊 Análisis (KPIs, rentabilidad)');
  console.log('  - 💵 Cobranza (CxC, DSO, CCC)');
  console.log('  - 📗 Contabilidad (asientos, cierre, SAT)');
  console.log('  - 🤖 CFO AI Core (orquestador)');
  
  return coreInstance;
}

function getCFOAICore() {
  if (!coreInstance) {
    return initializeCFOAICore();
  }
  return coreInstance;
}

module.exports = {
  // Core
  CFOAICore,
  getInstance,
  initializeCFOAICore,
  getCFOAICore,
  
  // Agentes especializados
  AgenteCaja,
  AgenteAnalisis,
  AgenteCobranza,
  AgenteContabilidad,
  BaseAgent,
  
  // Alias para compatibilidad con schedulers existentes
  default: getCFOAICore
};
