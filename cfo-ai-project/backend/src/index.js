require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { getCFOAICore, initializeCFOAICore } = require('./agents');
const db = require('../database/connection');
const { wakeUpMiddleware, ejecutarTareasPendientesWakeUp } = require('./services/wakeUpScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize CFO AI Core v2.0
async function initializeAgents() {
  try {
    const core = initializeCFOAICore();
    app.set('CFOAICore', core);
    console.log('🤖 CFO AI Core v2.0 iniciado exitosamente');
    console.log('   Agentes: 💰 Caja • 📊 Análisis • 💵 Cobranza • 📗 Contabilidad');
  } catch (error) {
    console.error('❌ Error inicializando CFO AI Core:', error.message);
  }
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['https://frontend-blond-rho-55.vercel.app', 'https://*.vercel.app', 'https://*.onrender.com', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WakeUp Scheduler Middleware v3.0
// Ejecuta tareas pendientes en cada request (con cooldown de 5 min)
// Necesario para Render free tier donde el servidor duerme
app.use(wakeUpMiddleware());

// Database setup
app.set('db', db); // Make db available to routes
app.set('CFOAICore', getCFOAICore());

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tesoreria', require('./routes/tesoreria'));
app.use('/api/contabilidad', require('./routes/contabilidad'));
app.use('/api/analisis', require('./routes/analisis'));
app.use('/api/sat', require('./routes/sat'));
app.use('/api/alertas', require('./routes/alertas'));
app.use('/api/agents', require('./routes/agents')); // Multi-Agent System
app.use('/api/agents/conciliador', require('./routes/conciliador')); // Agente Conciliador Bancario
app.use('/api/cierre', require('./routes/cierre')); // Cierre Mensual y Conciliación
app.use('/api/scheduler', require('./routes/scheduler')); // Scheduler System
app.use('/api/test', require('./routes/test')); // Test endpoints
app.use('/api/admin', require('./routes/admin')); // Admin endpoints (reset, cleanup, schema fix, seed)
app.use('/api/admin/run-all', require('./routes/runAllAgents')); // Ejecutar todos los agentes manualmente
app.use('/api/debug', require('./routes/debug')); // Debug endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Keep-Alive endpoint para cron-job.org o similar
// Fuerza ejecución de tareas pendientes y responde con el resultado
app.get('/api/keep-alive', async (req, res) => {
  try {
    console.log('[Keep-Alive] 🔥 Recibido ping de wake-up');
    const resultado = await ejecutarTareasPendientesWakeUp();
    
    res.json({
      status: 'ok',
      message: 'Wake-up ejecutado',
      timestamp: new Date().toISOString(),
      tareas: resultado
    });
  } catch (error) {
    console.error('[Keep-Alive] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Static files - only serve if frontend dist exists (development only)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint no encontrado',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║              CFO AI - Backend API v2.0                 ║
╠══════════════════════════════════════════════════════════╣
║  🚀 Servidor corriendo en puerto ${PORT}                   ║
║  📊 CFO AI Core v2.0: ACTIVO                             ║
║  🤖 Agentes: 💰 Caja • 📊 Análisis • 📋 Cobranza • 📅 Contabilidad
╠══════════════════════════════════════════════════════════╣
║  Tareas Programadas:                                     ║
║    Caja:        Cada hora 7AM-6PM • 6AM proyección      ║
║    Análisis:    5AM diario • Lun 5AM • Día 1 6AM        ║
║    Cobranza:    Cada hora 7AM-6PM • 6AM • Lun 5:30AM   ║
║    Contabilidad: 5AM diario • Vie 6PM • Día 1 4AM       ║
║    Briefing:    7:00 AM diario                           ║
╚══════════════════════════════════════════════════════════╝
  `);
  console.log(`API disponible en: http://localhost:${PORT}/api`);
  console.log(`Agentes API: http://localhost:${PORT}/api/agents`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  
  // Initialize CFO AI Core v2.0
  await initializeAgents();
});

module.exports = app;
