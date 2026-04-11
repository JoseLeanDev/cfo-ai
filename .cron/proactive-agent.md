# Proactive Agent Configuration

## Cron Setup (Cada 5 horas)

Para activar el modo proactivo, añadir al crontab o configuración de OpenClaw:

```bash
# Ejecutar cada 5 horas
0 */5 * * * cd /root/.openclaw/workspace && openclaw agent heartbeat
```

## Manual Trigger (para testing)

```bash
# Simular heartbeat manual
openclaw agent heartbeat --prompt "Read HEARTBEAT.md and execute proactive development tasks"
```

## Comandos Disponibles

### Revisar código
```bash
# Frontend
cd cfo-ai-project/frontend && npm run lint 2>&1 | grep -E "(error|warning)"

# Backend
cd cfo-ai-project/backend && npm run lint 2>&1 | grep -E "(error|warning)"
```

### Check duplicados
```bash
# Buscar funciones duplicadas
jscpd cfo-ai-project/frontend/src --reporters console
```

### Check dependencias
```bash
cd cfo-ai-project/frontend && npm outdated
cd cfo-ai-project/backend && npm outdated
```

## Telegram Notifications

Configurar canal para notificaciones:
- Channel: `kimi-claw` (actual)
- O usar: Telegram directo si está configurado

## Recordatorios

### Scope: Fullstack
- Frontend: React/Vite en `cfo-ai-project/frontend/`
- Backend: Node/Express en `cfo-ai-project/backend/`

### Prioridades
1. Fix bugs obvios (null checks, errores silenciosos)
2. Mejorar UX (loading states, mensajes de error)
3. Optimizar performance (queries, renders)
4. Refactoring de código duplicado
5. Documentación y tests

### No Tocar
- Variables de entorno en producción
- Credenciales o secrets
- Configuración de infraestructura
- Cambios que requieren migración de BD sin aprobación
