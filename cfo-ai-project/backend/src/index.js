require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const CFOAICore = require('../agents/index');
const db = require('../database/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize CFO AI Core v2.0
async function initializeAgents() {
  try {
    await CFOAICore.iniciar();
    app.set('CFOAICore', CFOAICore);
    console.log('🤖 CFO AI Core v2.0 iniciado exitosamente');
    console.log('   Agentes: Caja, Análisis, Cobranza, Contabilidad');
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

// Database setup
app.set('db', db); // Make db available to routes
app.set('agentsOrchestrator', agentsOrchestrator);

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
app.use('/api/admin', require('./routes/admin')); // Admin endpoints (reset, cleanup)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
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
║              CFO AI - Backend API                        ║
╠══════════════════════════════════════════════════════════╣
║  🚀 Servidor corriendo en puerto ${PORT}                   ║
║  📊 Base de datos: SQLite                                ║
║  🤖 Multi-Agent System: ACTIVO                           ║
║  ⏰ Scheduler System: ACTIVO                             ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                           ║
╠══════════════════════════════════════════════════════════╣
║  Agentes de IA Programados:                              ║
║    • Auditor Automático     • Analista Financiero       ║
║    • Conciliador Bancario   • Maintenance Agent         ║
╠══════════════════════════════════════════════════════════╣
║  Tareas Programadas Activas:                             ║
║    Auditor:    45min • 06:00 • Lun 08:00 • Día 1/5      ║
║    Analista:   07:00/18:00 • Vie 17:00 • Día 1 • Trim   ║
║    Conciliador: 08:00 • Día 1 06:00 • Día 3 09:00       ║
║    Maintenance: 02:00 • Dom 03:00 • Día 15 04:00        ║
╚══════════════════════════════════════════════════════════╝
  `);
  console.log(`API disponible en: http://localhost:${PORT}/api`);
  console.log(`Agentes API: http://localhost:${PORT}/api/agents`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  
  // Inicializar agentes después de que el servidor esté listo
  await initializeAgents();
});

module.exports = app;
