# 🛡️ Guía Completa: Crear Nuevo Cliente/Proyecto en la Plataforma

> **Basado en:** Experiencia creando Black Warrior Security (agosto 2026)
> **Propósito:** Documentar TODO el proceso para que el siguiente cliente se cree SIN fricción

---

## 📋 PRE-REQUISITOS

Antes de empezar, necesitas:
- [ ] Repositorio base (cfo-ai-project o abaco-demo-lavanderia)
- [ ] Acceso a GitHub (token en `~/.git-credentials`)
- [ ] Acceso a Render (cuenta de JoseLeanDev)
- [ ] Acceso a PostgreSQL en Render (usuario `cfo_ai_db_user`)
- [ ] Nombre del cliente y slug (ej: `black-warrior`)

---

## 🚀 PASO 1: Clonar el Repositorio Base

```bash
# Navegar al workspace
cd /root/.openclaw/workspace

# Clonar desde el repo que funciona (preferir cfo-ai-project)
git clone https://github.com/JoseLeanDev/cfo-ai-project.git nuevo-cliente
cd nuevo-cliente

# Cambiar remote origin al nuevo repo de GitHub
git remote set-url origin https://github.com/JoseLeanDev/nuevo-cliente.git

# Push inicial
git push -u origin main
```

**⚠️ CRÍTICO:** El repo base DEBE tener:
- `backend/node_modules/` commiteado (Render NO ejecuta `npm install`)
- `frontend/dist/` commiteado (para servir frontend estático)
- `render.yaml` configurado

---

## 🗄️ PASO 2: Crear la Base de Datos

### Opción A: Crear DB en servidor PostgreSQL existente (RECOMENDADO)

```bash
# Usar la misma instancia PostgreSQL que CFO AI
psql "postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com/cfo_ai_db" \
  -c "CREATE DATABASE nuevo_cliente_db;"
```

### Opción B: Usar `fromDatabase` en render.yaml (Render crea automáticamente)

```yaml
databases:
  - name: nuevo-cliente-db
    plan: starter
    databaseName: nuevo_cliente_db
    user: nuevo_cliente_db_user
```

**⚠️ NOTA:** La Opción A es más rápida y da más control. La Opción B requiere que Render maneje la DB.

---

## 🏗️ PASO 3: Crear Tablas y Schema

```bash
cd nuevo-cliente/backend

# Ejecutar migración PostgreSQL
DATABASE_URL="postgresql://cfo_ai_db_user:.../nuevo_cliente_db" \
  node database/migrate-postgres.js

# Ejecutar migraciones adicionales
for f in database/migrations/*.sql; do
  psql "postgresql://.../nuevo_cliente_db" -f "$f"
done

# Insertar datos demo
psql "postgresql://.../nuevo_cliente_db" -c "
  UPDATE empresas SET nombre = 'Nuevo Cliente', nit = 'XXX-2026-001' WHERE id = 1;
  UPDATE usuarios SET nombre = 'Admin', email = 'admin@nuevocliente.com' WHERE id = 1;
"
```

---

## ⚙️ PASO 4: Configurar Variables de Entorno

### 4.1 Backend `.env`

```bash
# Crear .env
DATABASE_URL=postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com/nuevo_cliente_db
JWT_SECRET=nuevo-cliente-jwt-secret-2026
NODE_ENV=production
PORT=10000
```

### 4.2 Render Dashboard (MANUAL — NO automático)

**⚠️ REGLA DE ORO:** Render NO lee el `.env` del repo. DEBES configurar las variables en el dashboard:

1. Ve a https://dashboard.render.com
2. Entra al servicio web
3. Tab **Environment**
4. Agrega cada variable:
   - `DATABASE_URL` = `postgresql://...`
   - `JWT_SECRET` = tu secreto
   - `OPENROUTER_API_KEY` = API key
   - `APP_URL` = URL del servicio

**⚠️ NUNCA confiar en `sync: false` en render.yaml — NO funciona si ya existe el servicio.**

---

## 🎨 PASO 5: Compilar Frontend

```bash
cd nuevo-cliente/frontend

# Instalar dependencias
npm install

# Compilar para producción
npm run build

# Verificar que dist/ se generó
ls -la dist/
```

**⚠️ CRÍTICO:** El `frontend/dist/` DEBE estar commiteado en Git porque:
- Render sirve el frontend como archivos estáticos
- El backend hace `express.static('../../frontend/dist')`
- Render NO compila automáticamente el frontend

---

## 🔧 PASO 6: Actualizar `render.yaml`

```yaml
services:
  - type: web
    name: nuevo-cliente
    env: node
    plan: starter
    buildCommand: cd backend && npm install && npm run migrate:postgres && npm run seed
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      # SI la DB ya existe:
      - key: DATABASE_URL
        value: postgresql://cfo_ai_db_user:.../nuevo_cliente_db
      # SI quieres que Render la cree:
      # - key: DATABASE_URL
      #   fromDatabase:
      #     name: nuevo-cliente-db
      #     property: connectionString
      - key: JWT_SECRET
        value: tu-jwt-secreto
    healthCheckPath: /api/health
```

---

## 📝 PASO 7: Registrar en ábaco máster

```sql
psql "postgresql://abaco_master_user:.../abaco_master" -c "
INSERT INTO clients (
  name, slug, database_url, database_name, 
  repository, repository_branch, local_path,
  render_service_id, status, currency, timezone
) VALUES (
  'Nuevo Cliente', 'nuevo-cliente',
  'postgresql://cfo_ai_db_user:.../nuevo_cliente_db',
  'nuevo_cliente_db',
  'https://github.com/JoseLeanDev/nuevo-cliente.git',
  'main',
  '/root/.openclaw/workspace/nuevo-cliente',
  'nuevo-cliente',
  'active', 'GTQ', 'America/Guatemala'
);
"
```

---

## 🚀 PASO 8: Commit y Deploy

```bash
# Agregar TODO
git add -A

# Commit
git commit -m "init: setup nuevo cliente - [nombre del cliente]"

# Push
git push origin main
```

Render detecta el push y redeploya automáticamente.

---

## ✅ PASO 9: Verificar Deploy

```bash
# Verificar health check
curl https://nuevo-cliente.onrender.com/api/health

# Verificar login
curl -X POST https://nuevo-cliente.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@cfoai.com","password":"demo123"}'
```

---

## 🔑 DATOS IMPORTANTES (NO COMPARTIR)

### PostgreSQL Connection String Base:
```
postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com/[DATABASE_NAME]
```

### Repositorios Base:
- CFO AI: `https://github.com/JoseLeanDev/cfo-ai-project.git`
- Lavandería Demo: `https://github.com/JoseLeanDev/abaco-demo-lavanderia.git`

### GitHub Token:
- Ubicación: `~/.git-credentials`
- NO preguntar por el token al usuario — ya está configurado

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### Error: `Cannot find module 'dotenv'`
**Causa:** `backend/node_modules/` no está en el repo  
**Solución:** Ejecutar `npm install` en backend, luego `git add backend/node_modules/` + commit + push

### Error: `getaddrinfo ENOTFOUND dpg-xxx`
**Causa:** Render tiene una DATABASE_URL vieja en su dashboard  
**Solución:** Ir al dashboard de Render → Environment → Actualizar DATABASE_URL manualmente

### Error 401 al login
**Causa:** El usuario demo no existe en la base de datos  
**Solución:** Verificar que `migrate-postgres.js` insertó el usuario demo con email `demo@cfoai.com`

### Tab/Página no aparece
**Causa:** `frontend/dist/` no está actualizado  
**Solución:** `cd frontend && npm install && npm run build`, luego commit del `dist/` folder

### Render no aplica cambios de render.yaml
**Causa:** El servicio ya existe, Render ignora cambios en render.yaml  
**Solución:** Actualizar variables MANUALMENTE en el dashboard de Render

---

## 📁 ESTRUCTURA DE ARCHIVOS A COMMITEAR

```
nuevo-cliente/
├── backend/
│   ├── node_modules/          ← DEBE estar en Git (Render no ejecuta npm install)
│   ├── .env                   ← Opcional (fallback)
│   ├── src/
│   └── database/
├── frontend/
│   ├── dist/                  ← DEBE estar en Git (archivos estáticos compilados)
│   ├── src/
│   └── node_modules/          ← NO en Git (muy grande)
├── render.yaml                ← Configuración de deploy
└── .gitignore                 ← Ignorar frontend/node_modules
```

---

## 🎯 CHECKLIST RÁPIDO

- [ ] Clonar repo base
- [ ] Crear DB PostgreSQL
- [ ] Ejecutar migraciones
- [ ] Configurar variables en Render dashboard
- [ ] Compilar frontend (`npm run build`)
- [ ] Commit de `backend/node_modules/`
- [ ] Commit de `frontend/dist/`
- [ ] Push a GitHub
- [ ] Registrar en ábaco máster
- [ ] Verificar login funciona
- [ ] Verificar página carga correctamente

---

## 🔗 RECURSOS

- Dashboard Render: https://dashboard.render.com
- GitHub Repo: https://github.com/JoseLeanDev
- PostgreSQL Host: `dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com`
- Abaco Master DB: `abaco_master`

---

*Documento creado: 2026-08-26*  
*Última actualización: después de crear Black Warrior Security*  
*Autor: Agente IA de Desarrollo*
