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

// Initialize abaco Core v2.0
async function initializeAgents() {
  try {
    const core = initializeCFOAICore();
    app.set('CFOAICore', core);
    console.log('🤖 abaco Core v2.0 iniciado exitosamente');
    console.log('   Agentes: 💰 Caja • 📊 Análisis • 💵 Cobranza • 📗 Contabilidad');
  } catch (error) {
    console.error('❌ Error inicializando CFO AI Core:', error.message);
  }
}

// Setup auth tables (auto-migration on startup)
async function setupAuthTables() {
  try {
    console.log('🔐 Verificando tabla usuarios...');
    
    // Crear tabla usuarios si no existe
    const createResult = await db.runAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'usuario',
        avatar_url VARCHAR(500),
        activo BOOLEAN DEFAULT TRUE,
        ultimo_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `, []);
    console.log('   CREATE TABLE result:', createResult);
    
    // Verificar si el usuario demo existe
    const demoUser = await db.getAsync(
      'SELECT id FROM usuarios WHERE email = $1',
      ['demo@cfoai.com']
    );
    
    if (!demoUser) {
      const insertResult = await db.runAsync(`
        INSERT INTO usuarios (id, nombre, email, password_hash, rol)
        VALUES (1, 'Usuario Demo', 'demo@cfoai.com', '$2b$10$wZ/MyH.ecgVvcPD3o06n.OYjy1I1c74BQSG0CKvUbVQkEM6Zcm1aC', 'admin')
      `, []);
      console.log('   INSERT demo result:', insertResult);
      console.log('✅ Usuario demo creado');
    } else {
      console.log('   Usuario demo ya existe');
    }
    
    console.log('✅ Tabla usuarios lista');
  } catch (error) {
    console.error('⚠️ Error setup auth tables:', error.message);
    console.error('   Stack:', error.stack);
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
app.use(wakeUpMiddleware());

// Database setup
app.set('db', db);
app.set('CFOAICore', getCFOAICore());

// Routes
app.use('/api/auth', require('./routes/auth'));       // Auth - Login/Logout/Register
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tesoreria', require('./routes/tesoreria'));
app.use('/api/contabilidad', require('./routes/contabilidad'));
app.use('/api/analisis', require('./routes/analisis'));
app.use('/api/sat', require('./routes/sat'));
app.use('/api/alertas', require('./routes/alertas'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/agents/conciliador', require('./routes/conciliador'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/cierre', require('./routes/cierre'));
app.use('/api/scheduler', require('./routes/scheduler'));
app.use('/api/test', require('./routes/test'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/run-all', require('./routes/runAllAgents'));
app.use('/api/debug', require('./routes/debug'));
app.use('/api/debug-schema', require('./routes/debug-schema'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Keep-Alive endpoint
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

// Static files
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
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
║              abaco - Backend API v2.0                 ║
╠══════════════════════════════════════════════════════════╣
║  🚀 Servidor corriendo en puerto ${PORT}                   ║
║  📊 abaco Core v2.0: ACTIVO                             ║
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
  
  // Initialize abaco Core v2.0
  await initializeAgents();
  
  // Setup auth tables
  await setupAuthTables();
  
  // Initialize abaco Scheduler
  try {
    const CFOScheduler = require('./scheduler/CFOScheduler');
    const scheduler = new CFOScheduler({
      apiBaseUrl: `http://localhost:${PORT}/api`,
      empresaId: process.env.DEFAULT_EMPRESA_ID || 1
    });
    await scheduler.init();
    scheduler.start();
    console.log(`\n⏰ abaco Scheduler iniciado: ${scheduler.tasks.length} tareas programadas activas`);
  } catch (error) {
    console.error('❌ Error iniciando abaco Scheduler:', error.message);
  }
});

module.exports = app;
