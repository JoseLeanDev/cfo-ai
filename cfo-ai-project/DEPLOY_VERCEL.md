# 📦 Guía de Deploy a Vercel

## ⚠️ IMPORTANTE: Arquitectura Separada

Vercel es **frontend-only** (serverless). El backend necesita estar en otro lado.

### Opción A: Frontend en Vercel + Backend en Render/Railway (Recomendado)

```
┌─────────────────┐         ┌──────────────────┐
│  Vercel         │ ──────▶ │  Render/Railway  │
│  (React App)    │   API   │  (Node + SQLite) │
└─────────────────┘         └──────────────────┘
```

### Opción B: Todo en Vercel (Experimental)
- Frontend: Vercel
- Backend: Vercel Serverless Functions (requiere migrar SQLite → PostgreSQL)

---

## 🚀 Deploy Paso a Paso

### 1. Instalar Vercel CLI

```bash
npm i -g vercel
```

### 2. Login en Vercel

```bash
vercel login
# Te abrirá un navegador para autenticar
```

### 3. Deploy del Frontend

```bash
cd cfo-ai-project/frontend

# Primera vez (configura el proyecto)
vercel

# Deploys posteriores
vercel --prod
```

### 4. Configurar Variables de Entorno

En el dashboard de Vercel (vercel.com), ve a tu proyecto:
- **Settings** → **Environment Variables**
- Agrega: `VITE_API_URL=https://tu-backend-url.com/api`

O usa CLI:
```bash
vercel env add VITE_API_URL production
# Valor: https://tu-backend-url.com/api
```

---

## 🔧 Preparar Backend para Producción

### Opción 1: Render (Gratis)

1. Crea cuenta en [render.com](https://render.com)
2. New → Web Service
3. Connecta tu repo GitHub (o sube el código)
4. Configura:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `NODE_ENV=production`

### Opción 2: Railway (Gratis)

1. Crea cuenta en [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Agrega variables de entorno si es necesario

### Opción 3: Quedarse en servidor actual

Si tienes un VPS/servidor propio:
```bash
cd cfo-ai-project/backend
npm install
npm start
# Usa PM2 para mantenerlo corriendo:
npm i -g pm2
pm2 start src/index.js --name "cfo-api"
```

---

## 📁 Archivos de Configuración

### frontend/vercel.json (ya creado)
```json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### backend/package.json scripts
Asegúrate que tenga:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

---

## 🌍 URLs después del deploy

```
Frontend (Vercel):    https://cfo-ai.vercel.app
Backend (Render):     https://cfo-api.onrender.com/api
```

---

## 🔄 Flujo de Trabajo

Desarrollo local:
```
Backend:  http://localhost:3000/api
Frontend: http://localhost:3001
```

Producción:
```
Frontend: https://cfo-ai.vercel.app
Backend:  https://cfo-api.onrender.com/api
```

---

## ⚡ Comando rápido para deploy

```bash
# Frontend
cd cfo-ai-project/frontend && vercel --prod

# Backend (si usas Render, se actualiza automático con git push)
git push origin main
```

---

*¿Preguntas? El deploy debería tomar ~2 minutos.*
