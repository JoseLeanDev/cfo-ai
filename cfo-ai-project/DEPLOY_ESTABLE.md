# CFO AI - Solución Estable

## 🚨 PROBLEMA: Tunnels temporales son inestables
Los tunnels de Cloudflare gratuitos expiran en ~1 hora y caen frecuentemente.

## ✅ SOLUCIÓN PERMANENTE: Deploy a Render.com

### Paso 1: Crear cuenta en Render
1. Ve a https://render.com
2. Regístrate con GitHub o email
3. Es gratis (plan Starter)

### Paso 2: Crear Web Service para el Backend
1. En Render Dashboard, clic **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub (o sube el código)
3. Configura:
   - **Name:** `cfo-ai-backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run migrate && npm run seed`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. Agrega Environment Variable:
   - `NODE_ENV` = `production`

5. Clic **"Create Web Service"**

### Paso 3: Obtener URL permanente
Render te dará una URL como:
```
https://cfo-ai-backend.onrender.com
```

### Paso 4: Actualizar Frontend en Vercel
1. Ve a https://vercel.com
2. Entra a tu proyecto `frontend`
3. Settings → Environment Variables
4. Actualiza `VITE_API_URL`:
   ```
   https://cfo-ai-backend.onrender.com/api
   ```
5. Redeploy (Vercel lo hace automático)

### Paso 5: Listo
Tu app estará funcionando 24/7 con:
- Frontend: `https://frontend-blond-rho-55.vercel.app`
- Backend: `https://cfo-ai-backend.onrender.com`

---

## 🔧 ALTERNATIVA RÁPIDA: Todo en Local

Si necesitas una demo AHORA sin configurar nada externo:

```bash
# Terminal 1 - Backend
cd cfo-ai-project/backend
npm run dev

# Terminal 2 - Frontend
cd cfo-ai-project/frontend
npm run dev

# Abre en tu navegador:
# http://localhost:3001
```

Esto funciona perfectamente en tu máquina local.

---

## 📁 Archivos ya configurados

| Archivo | Propósito |
|---------|-----------|
| `backend/render.yaml` | Config para Render.com |
| `backend/package.json` | Scripts y dependencias |
| `start_all.sh` | Inicia backend + tunnel local |

---

## ⚡ Demo Inmediata (Local)

Para mostrar a un cliente AHORA:

```bash
cd /root/.openclaw/workspace/cfo-ai-project
bash start_all.sh
```

Esto inicia:
- Backend en http://localhost:3000
- Tunnel temporal (URL mostrada en consola)
- Frontend en Vercel

**Limitación:** El tunnel dura ~1 hora. Para demo profesional, usa Render.com.

---

## 🎯 Resumen de URLs Actuales

| Servicio | URL | Estado |
|----------|-----|--------|
| Frontend | https://frontend-blond-rho-55.vercel.app | ✅ Estable |
| Backend Local | http://localhost:3000 | ✅ Funciona |
| Backend Tunnel | (cambia cada hora) | ⚠️ Temporal |

---

## 💡 Recomendación

Para una **herramienta de ventas profesional**:

1. **Deploy backend a Render** (5 minutos, gratuito)
2. **Frontend ya está en Vercel** (listo)
3. **Tendrás URLs permanentes** que nunca cambian
4. **Funciona 24/7** sin intervención

¿Necesitas ayuda con el deploy a Render? Puedo guiarte paso a paso. ❤️‍🔥
