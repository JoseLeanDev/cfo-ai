# HEARTBEAT.md - CFO AI: Strategic Financial Intelligence Agent

## 🎯 MISIÓN PRINCIPAL
**Generar insights financieros accionables que ayuden a CEOs y CFOs a tomar mejores decisiones estratégicas.**

No solo mostrar datos. **Revelar oportunidades, riesgos y acciones concretas.**

---

## 📋 TAREAS PROGRAMADAS (Prioridad CEO/CFO)

### 🔴 PRIORIDAD 1: Customer Concentration Risk
**Pregunta:** ¿Dependemos demasiado de 1-2 clientes?

**Implementar:**
- [ ] Widget de concentración de ingresos por cliente
- [ ] Alerta cuando cliente >20% de ingresos
- [ ] Visualización tipo Pareto (80/20)
- [ ] Recomendación de diversificación

**Valor:** Mitigar riesgo existencial de perder cliente mayoritario

---

### 🟡 PRIORIDAD 2: Working Capital Optimization  
**Pregunta:** ¿Cuánto dinero tenemos atado en operaciones?

**Implementar:**
- [ ] C2C (Cash Conversion Cycle) calculator
- [ ] DSO (Days Sales Outstanding) trend
- [ ] DPO (Days Payable Outstanding) benchmark
- [ ] Acciones sugeridas: descuentos pronto pago, negociar plazos

**Valor:** Liberar efectivo atrapado en CxC e inventario

---

### 🟠 PRIORIDAD 6: Reactivar Chatbot AI Assistant
**Problema:** El componente AgentChat existe pero no está integrado en el layout

**Implementar:**
- [ ] Importar AgentChat en DashboardLayout
- [ ] Agregar burbuja flotante en todas las páginas
- [ ] Verificar conexión con backend /api/agents/chat
- [ ] Quick actions: "¿Cuál es mi runway?", "KPIs", "Obligaciones SAT"

**Valor:** Acceso instantáneo a insights financieros vía chat

---

### 🟢 PRIORIDAD 3: Profitability Matrix
**Pregunta:** ¿Qué clientes/productos son realmente rentables?

**Implementar:**
- [ ] Matriz volumen vs. margen (4 cuadrantes)
- [ ] Identificar "clientes vampiro" (alto volumen, bajo margen)
- [ ] Identificar "estrellas" (alto volumen, alto margen)
- [ ] Sugerencias de repricing por segmento

**Valor:** Enfocar recursos en clientes rentables, ajustar precios

---

### 🔵 PRIORIDAD 4: Scenario Simulator
**Pregunta:** ¿Qué pasa si...?

**Implementar:**
- [ ] Simulador de escenarios (what-if analysis)
- [ ] Impacto de +5% precio, -10% costos, +20% volumen
- [ ] Break-even analysis dinámico
- [ ] Proyección de múltiples escenarios

**Valor:** Tomar decisiones con datos, no con intuición

---

### 🟣 PRIORIDAD 5: Weekly CFO Briefing Automático
**Pregunta:** ¿Qué pasó esta semana y qué viene?

**Implementar:**
- [ ] Reporte ejecutivo semanal por email/Telegram
- [ ] Top 3 insights de la semana
- [ ] Métricas clave vs. semana anterior
- [ ] Acciones pendientes y próximos vencimientos

**Valor:** Mantener al CEO/CFO informado sin saturar

---

## 📊 Valor Agregado por Eje Financiero

### 1. LIQUIDEZ Y TESORERÍA ✅ (Runway Calculator - DONE)
**Pregunta clave:** *¿Tenemos suficiente efectivo para operar y crecer?*

### 2. RENTABILIDAD Y MARGEN
**Pregunta clave:** *¿Dónde estamos ganando y perdiendo dinero?*

### 3. EFICIENCIA OPERATIVA
**Pregunta clave:** *¿Estamos usando nuestros recursos de forma óptima?*

### 4. RIESGOS Y CUMPLIMIENTO
**Pregunta clave:** *¿Qué nos puede hacer daño y cómo nos protegemos?*

### 5. DECISIONES ESTRATÉGICAS
**Pregunta clave:** *¿Qué deberíamos hacer diferente?*

---

## 🔄 Frecuencia de Revisión

| Tipo de Insight | Frecuencia | Canal |
|----------------|-----------|-------|
| **Críticos (liquidez, riesgos)** | Cada 5h | Telegram + Dashboard |
| **Tácticos (margen, eficiencia)** | Diario | Dashboard + Email |
| **Estratégicos (ROI, escenarios)** | Semanal | Reporte ejecutivo |
| **Cumplimiento** | Según vencimientos | Alertas push |

---

## 📱 Configuración de Notificaciones

**Usuario Telegram:** josearias96 ✅ (Pairing aprobado - esperando primer mensaje)

**Bot configurado:** `8645687152:AAGJ3hLfYVsvtgC7DqUl6tVJfL8eN63e8M4`
**Tu Telegram ID:** `7148683500` ✅
**Estado:** Configurado y aprobado. Para activar, envía mensaje a tu bot en Telegram.

### Para completar la configuración:
1. Abre Telegram
2. Busca tu bot o usa: `t.me/cfoai_bot`  
3. Envía: `/start` o cualquier mensaje
4. Yo responderé y podré enviarte alertas automáticas

**Plantilla de Alertas de Valor:**

```
🚨 CFO AI - Insight Crítico Detectado

📊 Métrica: Runway de efectivo
⚠️  Valor: 2.3 meses (umbral: 3 meses)
💰 Impacto: Riesgo de quiebra técnica en Agosto

🎯 Acción Recomendada:
Acelerar cobranza de Q450,000 pendiente o
negociar línea de crédito por Q300,000

¿Implementar plan de acción?
✅ Sí - Generar tareas automáticas
💬 Modificar - Ajustar parámetros
❌ Ignorar - Marcar como revisado
```

---

## ✅ Niveles de Autonomía

### HAGO DIRECTO (Sin aprobación)
- Cálculos automáticos de ratios financieros
- Actualización de dashboards en tiempo real
- Detección de anomalías estadísticas
- Clasificación de riesgos por nivel

### NOTIFICO POST-CAMBIO
- Nuevas métricas agregadas al dashboard
- Alertas de umbral cruzado
- Reportes automáticos generados

### REQUIERO APROBACIÓN (Telegram)
- Cambios en fórmulas de cálculo clave
- Nuevas integraciones (bancos, SAT)
- Deploy a producción
- Cambios en umbrales de alerta

---

## 📈 Métricas de Éxito del Agente

- [ ] **Tiempo de detección:** Insight crítico < 4h de ocurrir
- [ ] **Acción tomada:** >70% de insights generan acción
- [ ] **Precisión:** <5% falsos positivos en alertas
- [ ] **Adopción:** Usuario revisa dashboard diariamente
- [ ] **ROI:** Decisiones basadas en insights mejoran métricas clave

---

## 🎯 Estado de Implementación

| Prioridad | Tarea | Estado | Commit |
|-----------|-------|--------|--------|
| ✅ | Runway Calculator | DONE | 999b188 |
| ✅ | Customer Concentration Risk | DONE | a0fdc65 |
| ✅ | Fix cuentas duplicadas | DONE | fc0d5d8 |
| ✅ | Fix CCC mostrando 0 | FIXED | ead49d8 |
| ✅ | Fix Chatbot error estructura respuesta | FIXED | 2f53658 |
| 🟡 | Cash Conversion Cycle (CCC) - Mejoras | NEXT | - |
| 🟡 | Chatbot/AI Assistant (burbuja) - Testing | TODO | - |
| 🟢 | Working Capital Optimization | TODO | - |
| 🔵 | Profitability Matrix | TODO | - |
| 🟣 | Scenario Simulator | TODO | - |
| 🟤 | Weekly CFO Briefing | TODO | - |

---

## 🚀 Próximo Commit Planificado

**feat: Cash Conversion Cycle Dashboard**
- Sección dedicada CCC en Tesorería
- Gráfica de evolución temporal (DSO + DIO + DPO)
- Benchmark vs industria
- Acciones sugeridas para optimizar

---

## 📝 Notas de Trabajo

**⚠️ IMPORTANTE:** Todo trabajo de frontend debe:
1. Ser deployado a Render (no solo localhost)
2. Hacer commit y push a GitHub
3. Verificar en https://cfo-ai-backend-4n29.onrender.com/

**feat: Customer Concentration Risk Widget**
- Análisis de ingresos por cliente
- Alerta de concentración >20%
- Visualización Pareto (80/20)
- Recomendaciones de diversificación

---

## Estado de Checks

```json
{
  "lastChecks": {
    "liquidez": "2026-04-12T01:54:00Z",
    "rentabilidad": null,
    "eficiencia": null,
    "riesgos": null,
    "estrategia": null
  },
  "currentCycle": 2,
  "insightsGenerados": 1,
  "accionesTomadas": 0,
  "lastRun": "2026-04-12T01:54:00Z",
  "telegramConfigured": false,
  "telegramUsername": "josearias96"
}
```
