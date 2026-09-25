require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { getCFOAICore, initializeCFOAICore } = require('./agents');
const db = require('../database/connection');
const { iniciarAgenda } = require('./scheduler/agenda');

const app = express();
const PORT = process.env.PORT || 3000;

// En producción el JWT_SECRET no puede faltar: sin él la firma de los tokens
// cae al valor de desarrollo, que está escrito en el código de un repo público,
// y cualquiera podría forjar una sesión válida. Preferimos no arrancar antes
// que arrancar inseguro.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: falta JWT_SECRET en producción. El servidor no arranca.');
  process.exit(1);
}

async function initializeAgents() {
  try {
    const core = initializeCFOAICore();
    app.set('CFOAICore', core);
    console.log('Qora Core iniciado: Caja · Análisis · Cobranza · Contabilidad');
  } catch (error) {
    console.error('Error inicializando Qora Core:', error.message);
  }
}

// Tabla de usuarios y usuario de demostración.
async function setupAuthTables() {
  try {
    await db.runAsync(`
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

    const demoUser = await db.getAsync(
      'SELECT id FROM usuarios WHERE email = $1',
      ['demo@cfoai.com']
    );

    if (!demoUser) {
      await db.runAsync(`
        INSERT INTO usuarios (id, nombre, email, password_hash, rol)
        VALUES (1, 'Usuario Demo', 'demo@cfoai.com', '$2b$10$wZ/MyH.ecgVvcPD3o06n.OYjy1I1c74BQSG0CKvUbVQkEM6Zcm1aC', 'admin')
      `, []);
      console.log('Usuario demo creado');
    }
  } catch (error) {
    console.error('Error preparando la tabla de usuarios:', error.message);
  }
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());

// El frontend se sirve desde este mismo proceso, así que en producción todo es
// mismo origen y CORS no interviene. La lista solo importa para desarrollo o
// para un cliente externo que se agregue a propósito.
const ORIGENES = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001,http://localhost:5173')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: ORIGENES, credentials: true }));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('db', db);
app.set('CFOAICore', getCFOAICore());

// ── Rutas públicas ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Algún monitor externo puede seguir haciendo ping aquí. Antes este endpoint
// disparaba todas las tareas de los agentes en cada llamada; ahora las tareas
// viven en la agenda y esto solo confirma que el proceso responde.
app.get('/api/keep-alive', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Compuerta de autenticación ───────────────────────────────────────────────
// Todo lo que cuelga de /api exige un token válido, salvo las rutas públicas de
// la lista. La regla vive en un solo lugar para que un router nuevo quede
// protegido por defecto y haya que optar explícitamente por abrirlo.
//
// Antes ningún router lo pedía: la pantalla de login era decorativa y las
// cifras, el esquema de la base y hasta un endpoint para volver a sembrar datos
// se servían a cualquiera con la URL.
const { authenticate } = require('./middleware/auth');
const RUTAS_PUBLICAS = [/^\/health$/, /^\/keep-alive$/, /^\/auth(\/|$)/];
app.use('/api', (req, res, next) => {
  if (RUTAS_PUBLICAS.some((re) => re.test(req.path))) return next();
  return authenticate(req, res, next);
});

// ── Rutas protegidas ─────────────────────────────────────────────────────────
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tesoreria', require('./routes/tesoreria'));
app.use('/api/contabilidad', require('./routes/contabilidad'));
app.use('/api/analisis', require('./routes/analisis'));
app.use('/api/margen-productos', require('./routes/margen-productos'));
app.use('/api/margenes', require('./routes/margenes'));
app.use('/api/sat', require('./routes/sat'));
app.use('/api/alertas', require('./routes/alertas'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/cierre', require('./routes/cierre'));

// ── Frontend ─────────────────────────────────────────────────────────────────
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // React Router usa history: toda ruta que no sea de la API devuelve el index.
  // Las rutas /api desconocidas siguen de largo hasta el 404. Antes este
  // manejador no respondía ni llamaba a next() para ellas, y el request quedaba
  // colgado hasta el timeout del cliente.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// ── Errores ──────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint no encontrado',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, async () => {
  console.log(`Qora backend escuchando en el puerto ${PORT}`);
  await initializeAgents();
  await setupAuthTables();
  iniciarAgenda(getCFOAICore());
});

module.exports = app;
