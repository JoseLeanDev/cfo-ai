require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Multi-Agent System
const { initializeOrchestrator } = require('./agents');
const agentsOrchestrator = initializeOrchestrator();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['https://frontend-blond-rho-55.vercel.app', 'https://*.vercel.app', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
const db = require('../database/connection');
app.set('db', db); // Make db available to routes

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tesoreria', require('./routes/tesoreria'));
app.use('/api/contabilidad', require('./routes/contabilidad'));
app.use('/api/analisis', require('./routes/analisis'));
app.use('/api/sat', require('./routes/sat'));
app.use('/api/alertas', require('./routes/alertas'));
app.use('/api/agents', require('./routes/agents')); // Multi-Agent System

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

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║              CFO AI - Backend API                        ║
╠══════════════════════════════════════════════════════════╣
║  🚀 Servidor corriendo en puerto ${PORT}                   ║
║  📊 Base de datos: SQLite                                ║
║  🤖 Multi-Agent System: ACTIVO                           ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                           ║
╠══════════════════════════════════════════════════════════╣
║  Agentes registrados:                                    ║
║    • Orchestrator    • Analista Financiero              ║
║    • Asistente SAT   • Predictor Cash Flow              ║
║    • Auditor Auto    • Chatbot CFO                      ║
╚══════════════════════════════════════════════════════════╝
  `);
  console.log(`API disponible en: http://localhost:${PORT}/api`);
  console.log(`Agentes API: http://localhost:${PORT}/api/agents`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
