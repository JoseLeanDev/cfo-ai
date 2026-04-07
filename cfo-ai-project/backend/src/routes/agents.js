/**
 * Agents Routes - API endpoints para el sistema multi-agente
 */
const express = require('express');
const router = express.Router();
const { getOrchestrator } = require('../agents');

// POST /api/agents/chat - Enviar mensaje al sistema de agentes
router.post('/chat', async (req, res) => {
  try {
    const { message, userId = 'anonymous', empresaId = 1 } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const orchestrator = getOrchestrator();
    const db = req.app.get('db');

    const response = await orchestrator.process(
      { query: message, userId, empresaId },
      { db, req }
    );

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('[Agents API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/agents/status - Estado del sistema de agentes
router.get('/status', (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    const status = orchestrator.getSystemStatus();
    
    res.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('[Agents API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/agents/clear - Limpiar memoria de todos los agentes
router.post('/clear', (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    orchestrator.clearAllMemory();
    
    res.json({
      success: true,
      message: 'Memoria de agentes limpiada'
    });

  } catch (error) {
    console.error('[Agents API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/agents/history - Historial de conversación
router.get('/history', (req, res) => {
  try {
    const orchestrator = getOrchestrator();
    
    res.json({
      success: true,
      history: orchestrator.memory
    });

  } catch (error) {
    console.error('[Agents API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
