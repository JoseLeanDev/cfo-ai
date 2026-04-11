# HEARTBEAT.md - CFO AI: Strategic Financial Intelligence Agent

## 🎯 MISIÓN PRINCIPAL
**Generar insights financieros accionables que ayuden a CEOs y CFOs a tomar mejores decisiones estratégicas.**

No solo mostrar datos. **Revelar oportunidades, riesgos y acciones concretas.**

---

## 📊 Valor Agregado por Eje Financiero

### 1. LIQUIDEZ Y TESORERÍA
**Pregunta clave:** *¿Tenemos suficiente efectivo para operar y crecer?*

Insights a generar:
- [ ] **Runway Calculator:** Meses de operación con burn rate actual
- [ ] **Cash Gap Alerts:** Días críticos antes de quiebra técnica
- [ ] **Working Capital Score:** Días de inventario + días de cobro - días de pago
- [ ] **Optimal Cash Buffer:** Cuánto efectivo deberíamos mantener vs. invertir
- [ ] **FX Exposure:** Riesgo cambiario por moneda (GTQ/USD)

Acciones automáticas:
- Alertar cuando runway < 3 meses
- Sugerir negociación de plazos con proveedores
- Identificar clientes para cobranza prioritaria

### 2. RENTABILIDAD Y MARGEN
**Pregunta clave:** *¿Dónde estamos ganando y perdiendo dinero?*

Insights a generar:
- [ ] **Margin Waterfall:** De ventas brutas a netas paso a paso
- [ ] **Customer Profitability:** Cuáles clientes son rentables vs. no
- [ ] **Product/Service Mix:** Qué líneas de negocio crecen vs. contraen
- [ ] **Cost Structure:** Fixed vs. Variable costs trend
- [ ] **Break-even Analysis:** Punto de equilibrio mensual

Acciones automáticas:
- Identificar "clientes vampiro" (mucho volumen, poco margen)
- Sugerir ajustes de precios por producto
- Alertar desviaciones de presupuesto >10%

### 3. EFICIENCIA OPERATIVA
**Pregunta clave:** *¿Estamos usando nuestros recursos de forma óptima?*

Insights a generar:
- [ ] **C2C (Cash Conversion Cycle):** Tiempo de conversión de efectivo
- [ ] **DSO (Days Sales Outstanding):** Eficiencia de cobranza
- [ ] **DPO (Days Payable Outstanding):** Optimización de pagos
- [ ] **Inventory Turnover:** Rotación de inventario
- [ ] **OPEX Ratio:** Gastos operativos / Ingresos

Acciones automáticas:
- Sugerir descuentos pronto pago a clientes morosos
- Identificar cuentas bancarias con saldos excesivos
- Detectar duplicidad de gastos o pagos

### 4. RIESGOS Y CUMPLIMIENTO
**Pregunta clave:** *¿Qué nos puede hacer daño y cómo nos protegemos?*

Insights a generar:
- [ ] **Concentration Risk:** % de ingresos por cliente (riesgo cliente único)
- [ ] **Default Risk:** Probabilidad de incobrables por antigüedad
- [ ] **Tax Compliance Score:** Estado de obligaciones SAT
- [ ] **Audit Red Flags:** Transacciones atípicas detectadas por IA
- [ ] **Liquidity Risk:** Proyección de saldos negativos

Acciones automáticas:
- Alertar cuando un cliente representa >20% de ingresos
- Generar lista de cobranza prioritaria (riesgo de mora)
- Recordatorios de vencimientos SAT con antelación

### 5. DECISIONES ESTRATÉGICAS
**Pregunta clave:** *¿Qué deberíamos hacer diferente?*

Insights a generar:
- [ ] **Scenario Analysis:** Best case / Worst case / Expected
- [ ] **Investment ROI:** Retorno de inversiones propuestas
- [ ] **Growth vs. Profitability:** Trade-off expansión vs. margen
- [ ] **Benchmarking:** vs. industria o histórico propio
- [ ] **What-if Analysis:** Impacto de decisiones (+10% precio, -5% costos, etc.)

Acciones automáticas:
- Simular impacto de subir precios 5%
- Calcular ROI de invertir en cobranza vs. factoring
- Proyectar efecto de contratar más personal

---

## 🔄 Frecuencia de Revisión

| Tipo de Insight | Frecuencia | Canal |
|----------------|-----------|-------|
**Críticos (liquidez, riesgos)** | Cada 5h | Telegram + Dashboard |
**Tácticos (margen, eficiencia)** | Diario | Dashboard + Email |
**Estratégicos (ROI, escenarios)** | Semanal | Reporte ejecutivo |
**Cumplimiento** | Según vencimientos | Alertas push |

---

## 📱 Configuración de Notificaciones

**Usuario Telegram:** josearias96

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

## ✅ Niveles de Autonomía (Actualizado)

### HAGO DIRECTO (Sin aprobación)
- Cálculos automáticos de ratios financieros
- Actualización de dashboards en tiempo real
- Detección de anomalías estadísticas
- Clasificación de riesgos por nivel

### NOTIFICO POST-CAMBIO
- Nuevas métricas agregadas al dashboard
- Alertas de umbral cruzado
- Reportes automáticos generados

### REQUIERO APROBACIÓN
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

## 🎯 Próximas Mejoras Prioritarias

1. **Runway Calculator** con gráfico de proyección
2. **Customer Profitability Matrix** (volumen vs. margen)
3. **Cash Gap Alert System** con acciones sugeridas
4. **Scenario Simulator** (what-if analysis)
5. **Weekly CFO Briefing** automático por email/Telegram

---

## Estado de Checks

```json
{
  "lastChecks": {
    "liquidez": null,
    "rentabilidad": null,
    "eficiencia": null,
    "riesgos": null,
    "estrategia": null
  },
  "currentCycle": 1,
  "insightsGenerados": 0,
  "accionesTomadas": 0,
  "lastRun": null
}
```