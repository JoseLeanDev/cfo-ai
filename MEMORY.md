# MEMORY.md - Memoria a Largo Plazo

## Reglas de Deploy en Render (MEMORIZAR)

### ⚠️ REGLA CRÍTICA: Render NO ejecuta `npm install`

**El servicio `mission-control-new` en Render tiene el build command configurado como `echo skip`.**
Esto significa que NUNCA ejecuta `npm install` automáticamente.

### ✅ Cómo hacer deploys correctamente:
1. **Siempre** incluir `node_modules` en el repositorio Git
2. **Nunca** depender de `npm install` durante el build
3. Si se agrega una nueva dependencia:
   - Instalar localmente: `npm install <paquete>`
   - Hacer commit de `node_modules`, `package.json` y `package-lock.json`
   - Push a GitHub
   - Render deployará automáticamente con los módulos incluidos

### ❌ Lo que NO funciona:
- Cambiar `package.json` scripts → Render ignora el build command del package.json
- Crear `render.yaml` → Render no lo usa si el servicio ya está configurado
- Depender de variables de entorno para instalar paquetes

### 📋 Checklist antes de cada deploy:
- [ ] `node_modules` está commiteado y pusheado
- [ ] Nuevas dependencias están en `node_modules/`
- [ ] `package.json` y `package-lock.json` actualizados

---

## Proceso de Retrieval de Contexto (CRÍTICO)

### Al iniciar CUALQUIER tarea:

1. **LEER PRIMERO:** `/root/.openclaw/workspace/CONTEXT_ABACO.md`
   - Este es el contexto maestro del proyecto abaco/CFO AI
   - Contiene: estructura de BD, agentes, problemas conocidos, configuración
   
2. **LEER SEGUNDO:** `/root/.openclaw/workspace/HEARTBEAT.md`
   - Estado actual de implementación
   - Tareas pendientes y prioridades

3. **LEER TERCERO:** `/root/.openclaw/workspace/USER.md`
   - Preferencias del usuario
   - Reglas absolutas (PostgreSQL, no SQLite, etc.)

4. **VERIFICAR:** Últimos `memory/YYYY-MM-DD.md` para contexto reciente

### ¿Qué NUNCA hacer?
- ❌ NUNCA asumir que estoy en otro proyecto (lavandería, demos, etc.)
- ❌ NUNCA mezclar código/configuración entre proyectos
- ❌ NUNCA usar SQLite — PostgreSQL siempre
- ❌ NUNCA preguntar "¿qué proyecto?" si ya leí el contexto

### ¿Qué SIEMPRE hacer?
- ✅ SIEMPRE leer CONTEXT_ABACO.md antes de codificar
- ✅ SIEMPRE verificar empresa_id = 1 para datos demo
- ✅ SIEMPRE usar funciones PostgreSQL (no SQLite)
- ✅ SIEMPRE documentar cambios significativos en CONTEXT_ABACO.md

---

## Contexto del Proyecto Principal

**Proyecto:** abaco (antes CFO AI)
**Tipo:** Plataforma de inteligencia financiera para CEOs/CFOs
**Stack:** Node.js + React + PostgreSQL (Render)
**Cliente:** Empresa Demo (Guatemala, GTQ)
**Usuario principal:** josearias96 (Telegram)

### Estructura BD clave:
- 21 tablas en PostgreSQL
- 404,826 logs de agentes
- 78,462 insights históricos
- 6,345 CxC, 4,935 CxP, 22,344 transacciones
- `mc_clients` está VACÍA — necesita contexto del cliente real

### Problemas activos:
1. Error recurrente: `function date(unknown, unknown) does not exist` (SQLite→PostgreSQL)
2. Briefings diarios muestran runway=0 (relacionado con error de arriba)
3. Tabla mc_clients vacía — no hay contexto centralizado

---

## Aprendizajes y Decisiones

### 2026-07-28 - Proceso de Retrieval
- Usuario enfatizó que el retrieval de contexto debe ser "extremadamente efectivo"
- Creé `CONTEXT_ABACO.md` como fuente de verdad única
- Documenté toda la estructura de BD (21 tablas, campos, registros)
- Identifiqué que `mc_clients` está vacía y es la causa del retrieval débil

### Reglas establecidas:
- Todo deploy va a Render (no solo localhost)
- Todo cambio hace commit y push
- PostgreSQL siempre, NUNCA SQLite
- No mezclar con otros proyectos del workspace

---

*Actualizar este archivo con cada aprendizaje significativo.*
