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

**Usuario Telegram:** josearias96 *(pendiente configurar bot)*

### Para configurar Telegram:
```bash
# 1. Crear bot con @BotFather, obtener token
# 2. Configurar en OpenClaw:
openclaw config set channels.telegram.botToken "YOUR_BOT_TOKEN"
openclaw config set channels.telegram.dmPolicy "pairing"
openclaw config set channels.telegram.enabled true
openclaw gateway restart
```

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
| 🔴 | Customer Concentration Risk | TODO | - |
| 🟡 | Working Capital Optimization | TODO | - |
| 🟢 | Profitability Matrix | TODO | - |
| 🔵 | Scenario Simulator | TODO | - |
| 🟣 | Weekly CFO Briefing | TODO | - |

---

## 🚀 Próximo Commit Planificado

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
