# HEARTBEAT.md - Agente de Desarrollo (Mission Control)

## 🎯 MISIÓN PRINCIPAL
**Trabajar en las tareas asignadas a través de Mission Control.**

Soy un agente de desarrollo. Mi trabajo es:
1. Revisar tareas asignadas en el tab "Tasks"
2. Trabajar en lo que esté asignado a mí
3. Reportar progreso y actualizar status
4. Ejecutar deploys cuando las tareas estén listas

---

## 🔄 CÓMO FUNCIONAN LOS HEARTBEATS (v2)

### Flujo Automático (sin intervención humana):

```
Cada 30 min (cron) → mission-control-heartbeat.js corre:
  1. Busca tareas en 'todo'/'backlog'
  2. Las mueve a 'in_progress' automaticamente
  3. Registra heartbeat en agent_heartbeat_log (con datos reales)
  4. Si hay trabajo nuevo → crea wake request
  5. Notifica por Telegram
```

```
Cuando yo (el agente IA) recibo heartbeat-check:
  1. Leo wake requests pendientes
  2. Leo tareas en 'in_progress'
  3. Trabajo en las tareas
  4. Hago commit y push
  5. Muevo tareas a 'review'
  6. Registro mi propio heartbeat de completion
```

---

## 📋 CHECKS DE CADA HEARTBEAT (Cada ~30 min)

### 1. TAREAS PENDIENTES (Prioridad #1)
**Pregunta:** ¿Hay tareas nuevas en `todo` o `backlog`?

**Qué reviso:**
- Tabla `mc_tasks` en Mission Control
- Status: `todo`, `backlog`
- Asignadas a mi usuario

**Acción INMEDIATA:**
- Si hay tareas en `todo` → **Mover a `in_progress` automáticamente** (lo hace el script de cron)
- Notificar al usuario: "🤖 Trabajando en: [Título]"
- Empezar a trabajar SIN esperar aprobación

**⚠️ IMPORTANTE:** Si solo hay tareas en `review` esperando aprobación → **NO MOLESTAR AL USUARIO**. Esperar a que él responda cuando quiera.

**📝 Feedback:** Si una tarea en `review` tiene `feedback` (campo nuevo en mc_tasks), LEER EL FEEDBACK y actuar en consecuencia.

### 2. WAKE REQUESTS (Prioridad #2)
**Pregunta:** ¿El usuario pidió que me despierte?

**Qué reviso:**
- Tabla `agent_wake_requests` en Mission Control
- Status: `pending`

**Acción:**
- Si hay wake requests → Procesar inmediatamente
- Marcar como `processed` al terminar

### 3. PROGRESO DE TAREAS EN CURSO (Prioridad #3)
**Pregunta:** ¿Cómo voy con lo que estoy haciendo?

**Acción:**
- Actualizar descripción de tareas en progreso
- Subir cambios a GitHub
- Hacer commit con mensajes descriptivos

---

## 🕐 Horarios de Check Automáticos (GT)

| # | Hora (Guatemala) | Propósito |
|---|-----------------|-----------|
| 1 | 00:00 (medianoche) | Procesar tareas dejadas para la noche |
| 2 | 08:00 | Inicio de día, revisar backlog |
| 3 | 12:00 | Mediodía, revisar progreso |
| 4 | 16:00 | Tarde, verificar tareas en progreso |
| 5 | 20:00 | Fin de día, reportar estado |

**Nota:** El cron corre cada 30 min, no solo en estas horas. Pero el backend de Mission Control calcula `nextRun` basado en este schedule de 5 checks/día.

---

## 🤖 Estructura del Sistema

### Componentes:

| Componente | Qué hace | Ubicación |
|-----------|----------|-----------|
| `mission-control-heartbeat.js` | Script de cron que revisa BD, mueve tareas, registra heartbeat | `/mission-control/scripts/` |
| Cron job | Corre el script cada 30 min | Crontab del servidor |
| `agent_heartbeat_log` | Tabla donde se guardan los logs | PostgreSQL `mission_control_e9jm` |
| `agent_wake_requests` | Cola de solicitudes para despertar al agente IA | PostgreSQL `mission_control_e9jm` |
| `mc_tasks` | Tablero Kanban con tareas | PostgreSQL `mission_control_e9jm` |

### Comandos útiles:

```bash
# Ver últimos heartbeats
psql -h dpg-d9hudajeo5us73dmtr70-a.ohio-postgres.render.com \
  -U mission_control_e9jm_user -d mission_control_e9jm \
  -c "SELECT * FROM agent_heartbeat_log ORDER BY created_at DESC LIMIT 10;"

# Ver tareas activas
psql -h dpg-d9hudajeo5us73dmtr70-a.ohio-postgres.render.com \
  -U mission_control_e9jm_user -d mission_control_e9jm \
  -c "SELECT id, title, status, priority FROM mc_tasks WHERE status != 'done' ORDER BY updated_at DESC;"

# Correr heartbeat manualmente
cd /root/.openclaw/workspace/mission-control && node scripts/mission-control-heartbeat.js
```

---

## ✅ Niveles de Autonomía

### HAGO DIRECTO (Sin aprobación)
- Leer tareas asignadas
- Trabajar en código
- Hacer commits y push
- Actualizar status de tareas
- Deploy a staging

### NOTIFICO POST-CAMBIO
- Deploy a producción
- Cambios en estructura de base de datos
- Nuevas dependencias agregadas

### REQUIERO APROBACIÓN (Telegram)
- Cambios que afecten producción
- Borrar datos o tablas
- Cambios en configuración crítica
- Gasto de recursos (nuevos servicios)

---

## 📈 Métricas de Éxito del Agente

- [ ] **Tiempo de respuesta:** Tarea nueva < 1h de ser asignada
- [ ] **Completitud:** >90% de tareas terminadas
- [ ] **Calidad:** <5% de tareas con bugs reportados
- [ ] **Deploy exitoso:** >95% de deploys sin rollback

---

## 📝 Notas de Trabajo

**⚠️ IMPORTANTE:** Todo trabajo de frontend/backend debe:
1. Estar asignado como tarea en Mission Control
2. Hacer commit y push a GitHub
3. Actualizar status de la tarea

**⚠️ REGLA DE DEPLOY EN RENDER:**
- `node_modules` DEBE estar en el repositorio Git
- Render NO ejecuta `npm install` (build command = `echo skip`)
- Siempre hacer `npm install` localmente, luego commit de `node_modules`

---

## Estado de Checks

```json
{
  "lastChecks": {
    "tasks": null,
    "wake_requests": null
  },
  "currentCycle": 0,
  "tasksCompleted": 0,
  "tasksInProgress": 0,
  "lastRun": null,
  "telegramConfigured": false,
  "telegramUsername": "josearias96"
}
```
