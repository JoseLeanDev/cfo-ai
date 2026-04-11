# HEARTBEAT.md - CFO AI Proactive Development Agent

## Configuración
- **Frecuencia**: Cada 5 horas
- **Scope**: Fullstack (frontend + backend)
- **Notificaciones**: Telegram para aprobaciones
- **Autonomía**: Refactoring menor sin aprobación, features con aprobación

## Tareas Proactivas (Cada 5h)

### Ciclo 1: Code Quality Review
- [ ] Revisar código duplicado en frontend (components, pages)
- [ ] Revisar código duplicado en backend (routes, services)
- [ ] Identificar funciones sin manejo de errores
- [ ] Detectar imports no utilizados
- [ ] Verificar consistencia de nombres

### Ciclo 2: UX/UI Improvements
- [ ] Revisar loading states faltantes
- [ ] Detectar mensajes de error genéricos
- [ ] Identificar falta de validaciones en formularios
- [ ] Verificar responsive design issues
- [ ] Revisar accesibilidad (alt tags, labels)

### Ciclo 3: Performance & Optimización
- [ ] Revisar queries N+1 en backend
- [ ] Identificar renders innecesarios en React
- [ ] Detectar imágenes sin optimización
- [ ] Verificar uso de useMemo/useCallback
- [ ] Revisar tamaño de bundles

### Ciclo 4: Testing & Documentación
- [ ] Identificar funciones sin tests
- [ ] Detectar JSDoc faltante en funciones públicas
- [ ] Revisar README desactualizado
- [ ] Verificar .env.example completo

## Reglas de Autonomía

### ✅ Hacer sin Aprobación (Directo)
- Refactoring menor (renombrar variables privadas)
- Eliminar código muerto
- Formatear código (prettier/eslint)
- Agregar JSDoc simple
- Optimizar imports
- Fix typos

### ⚠️ Notificar Post-Cambio
- Optimización de queries SQL
- Simplificación de lógica compleja
- Extracción de componentes reutilizables
- Mejoras de tipado TypeScript

### ✅ Requerir Aprobación Previa (Telegram)
- Nueva feature (filtros, exports, etc.)
- Cambio en schema de BD
- Refactoring de arquitectura
- Actualización de dependencias
- Cambio en API endpoints
- Deploy a producción

## Proceso de Trabajo

```
1. ESCANEAR → Revisar código según ciclo actual
2. IDENTIFICAR → Encontrar mejoras/oportunidades  
3. CLASIFICAR → Decidir si requiere aprobación
4. EJECUTAR o SOLICITAR → Hacer o pedir aprobación
5. DOCUMENTAR → Actualizar este archivo con findings
```

## Plantilla de Notificación Telegram

```
🔍 CFO AI - Mejora Detectada

Tipo: [refactoring/feature/bugfix]
Archivo: [ruta]
Descripción: [qué encontré]

¿Implementar? 
✅ Responder "sí" para aprobar
❌ Responder "no" para ignorar
💬 Responder con cambios para ajustar
```

## Estado de Ciclos

```json
{
  "lastChecks": {
    "code_quality": null,
    "ux_ui": null,
    "performance": null,
    "testing_docs": null
  },
  "currentCycle": 1,
  "pendingApprovals": [],
  "lastRun": null
}
```

## Log de Acciones Proactivas

### 2026-04-12
- [INICIO] Configuración de agente proactivo cada 5h
