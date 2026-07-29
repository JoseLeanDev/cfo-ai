# abaco / CFO AI - Contexto Maestro del Proyecto

> Última actualización: 2026-07-28
> Proyecto: abaco (anteriormente CFO AI)
> Base de datos del PROYECTO: PostgreSQL `cfo_ai_db` en Render
> Base de datos MAESTRA del AGENTE: PostgreSQL `abaco_master` en Render

---

## ⚠️ DISTINCIÓN CRÍTICA: Tres Bases de Datos

| Base de Datos | Propósito | Tablas | Registros |
|---------------|-----------|--------|-----------|
| **`abaco_master`** | **Contexto del agente** — clientes, skills, logs, objetivos | 9 | ~20 |
| **`cfo_ai_db`** | **Datos del negocio** — transacciones, CxC, CxP, insights | 21 | 500K+ |
| **`mission_control_e9jm`** | **Gestión de tareas** — Kanban, proyectos locales | 2+ | Variable |

**NUNCA confundir estas tres.** `abaco_master` es el cerebro del agente. `cfo_ai_db` es el negocio del cliente. `mission_control_e9jm` es el tablero de tareas.

---

## 🗄️ Base de Datos MAESTRA: `abaco_master`

### Tablas (9 total)

| Tabla | Propósito | Registros |
|-------|-----------|-----------|
| `clients` | **Contexto completo de cada cliente** | 3 |
| `projects` | Proyectos por cliente | 0 |
| `skills` | Catálogo de habilidades del agente | 12 |
| `client_skills` | Skills asignados a cada cliente | 13 |
| `context_logs` | Historial de decisiones y acciones | 1 |
| `agent_sessions` | Sesiones del agente por cliente | 0 |
| `deployments` | Deploys tracking | 0 |
| `client_objectives` | **Objetivos de negocio/financieros** | 0 ← NUEVO |
| `client_data_sources` | **Fuentes de datos con sincronización** | 0 ← NUEVO |

### Campos de Contexto en `clients` (JSONB estructurado)

| Campo | Qué contiene | Estado |
|-------|-------------|--------|
| `business_context` | Modelo, industria, misión, visión, mercados, ventajas | ✅ Parcial (3 registros) |
| `financial_context` | SAT NIT, métricas, metas, funding stage | ⚠️ Vacío en todos |
| `operational_context` | Tech stack, integraciones, herramientas | ⚠️ Vacío en todos |
| `project_context` | Fase, features activas, milestones, deuda técnica | ⚠️ Vacío en todos |
| `data_context` | Fuentes de datos, tablas clave, calidad | ⚠️ Vacío en todos |
| `ai_context` | Personalidad, autonomía, canales, frecuencia | ⚠️ Vacío en todos |

### Clientes Registrados en `abaco_master`

| ID | Nombre | Slug | database_name | Status |
|----|--------|------|--------------|--------|
| 1 | **CFO AI / Abaco** | `abaco` | `cfo_ai_db` | active |
| 2 | **Lavanderia Demo** | `lavanderia-demo` | `abaco_lavanderia_db` | active |
| 3 | **Mission Control** | `mission-control` | `mission_control_e9jm` | active |

---

## 🗄️ Base de Datos del PROYECTO: `cfo_ai_db`

### Tablas de Operaciones (21 total, 500K+ registros)

| Tabla | Registros | Propósito |
|-------|-----------|-----------|
| `agentes_logs` | **404,826** | Logs de todos los agentes IA |
| `insights_historico` | **78,462** | Insights generados |
| `transacciones` | **22,344** | Movimientos contables |
| `cuentas_cobrar` | **6,345** | Cuentas por cobrar |
| `cuentas_pagar` | **4,935** | Cuentas por pagar |
| `obligaciones_sat` | **1,974** | Obligaciones tributarias |
| `alertas_financieras` | **4,340** | Alertas activas |
| `briefings_diarios` | **89** | Reportes diarios |
| `snapshots_financieros` | **17,564** | Snapshots por tipo |
| `usuarios` | **1** | Usuario admin |
| `empresas` | **1** | Empresa Demo (enlazada a mc_clients) |

---

## 🗄️ Base de Datos de Mission Control: `mission_control_e9jm`

### Tablas

| Tabla | Propósito | Registros |
|-------|-----------|-----------|
| `mc_clients` | Clientes locales para el dropdown de tareas | 1 ("Black Warrior Security") |
| `mc_tasks` | Tareas del Kanban con `project_id` | 0 |

**⚠️ PROBLEMA:** `mc_clients` en mission_control NO está sincronizado con `abaco_master.clients`. Solo tiene "Black Warrior Security" cuando debería tener CFO AI / Abaco, Lavandería Demo y Mission Control.

---

## 🤖 Sistema de Agentes IA (en `cfo_ai_db`)

### Tipos de Agentes Activos

| Agente | Función |
|--------|---------|
| `caja` | Runway, liquidez |
| `analisis` / `AnalistaFinanciero` | KPIs, análisis |
| `cobranza` | DSO, aging de cartera |
| `contabilidad` | Asientos, libro diario |
| `ChatbotCFO` | Chatbot interactivo |
| `AsistenteSAT` | Obligaciones tributarias |
| `PredictorCashFlow` | Predicciones de flujo |
| `OrchestratorAgent` | Orquestador |

---

## 🔄 WORKFLOW CORRECTO DEL SISTEMA

### Flujo de Match de Proyecto a Base de Datos:

```
mc_tasks.project_id → mc_clients.id → mc_clients.slug
→ abaco_master.clients.slug → abaco_master.clients.database_name
→ [Conectar a base del cliente]
```

### Pasos para trabajar en una tarea:

1. **Recibir tarea** → Leo `mc_tasks` donde `assignee = 'Jose'`
2. **Obtener `project_id`** de la tarea
3. **Buscar en `mc_clients`** con ese `project_id` → obtengo `slug`
4. **Buscar en `abaco_master.clients`** con ese `slug` → obtengo:
   - Contexto completo del negocio
   - Tech stack, integraciones
   - Fase del proyecto, features activas
   - **`database_name`** → qué base usar
5. **Conectar a `database_name`** (ej: `cfo_ai_db`) → trabajo con datos del negocio
6. **Reportar progreso** → Actualizo status en `mc_tasks`

### Ejemplo de match:

| Paso | Tabla | Campo | Valor |
|------|-------|-------|-------|
| 1 | `mc_tasks` | `project_id` | `1` |
| 2 | `mc_clients` | `id = 1` | `slug = "abaco"` |
| 3 | `abaco_master.clients` | `slug = "abaco"` | `database_name = "cfo_ai_db"` |
| 4 | Conectar a | `cfo_ai_db` | Datos del negocio |

---

## 🏗️ Arquitectura

### Backend CFO AI (Node.js + Express)
- **Ubicación:** `/cfo-ai-project/backend/`
- **DB:** `cfo_ai_db` (PostgreSQL Render)
- **Entry:** `src/index.js`

### Frontend CFO AI (React + Vite + Tailwind)
- **Ubicación:** `/cfo-ai-project/frontend/`
- **Deploy:** Render

### Mission Control (Dashboard de Gestión)
- **Ubicación:** `/mission-control/`
- **DB Local:** `mission_control_e9jm` (PostgreSQL Render)
- **DB Maestra:** `abaco_master` (lectura/escritura)
- **Onboarding:** Captura contexto completo del cliente (8 pasos)
- **Kanban:** `mc_tasks` con `project_id` → `mc_clients.id`

---

## 🎯 Umbrales Financieros (desde `src/config/financiera.js`)

| Métrica | Valor |
|---------|-------|
| Liquidez crítica | Q100,000 |
| Liquidez advertencia | Q500,000 |
| Gasto diario default | Q50,000 |
| CxC crítico vencido | Q500,000 |
| Días atraso crítico | 60 días |
| Concentración cliente crítico | 20% |
| SAT alerta IVA | 15 días |
| SAT alerta ISR | 15 días |

---

## ⚠️ Problemas Activos Identificados

1. **`mc_clients` en mission_control NO sincronizado** con `abaco_master.clients`
   - Solo tiene "Black Warrior Security"
   - Debería tener: CFO AI / Abaco, Lavandería Demo, Mission Control

2. **Campos de contexto vacíos** en los 3 clientes de `abaco_master`
   - `operational_context`, `project_context`, `data_context`, `ai_context` = vacíos

3. **ERROR CRÍTICO:** `function date(unknown, unknown) does not exist`
   - Causa: Código SQLite corriendo en PostgreSQL
   - Impacto: Briefings muestran runway = 0

---

## ✅ Nuevo Flujo de Onboarding (Mission Control)

### Pasos del Wizard (8 steps):

1. **Basic Info** — Nombre, slug, industria, contacto, timezone
2. **Business Context** — Modelo, tamaño, misión, visión, mercados, ventajas competitivas
3. **Financial Context** — Moneda, SAT NIT, régimen fiscal, funding stage, burn rate, metas financieras
4. **Operational Context** — Tech stack (multi-select por categoría), integraciones, herramientas
5. **Data Sources** — SAT FEL, bancos, POS, CRM, ERP, webhooks (con tipo, estado, frecuencia)
6. **Project Context** — Fase actual, features activas/planeadas, milestones con fechas, deuda técnica
7. **AI Preferences** — Personalidad del agente, estilo de comunicación, nivel de autonomía, canales de alerta, frecuencias
8. **Review** — Resumen completo antes de guardar

### Qué se guarda automáticamente:

| Acción | Destino |
|--------|---------|
| Cliente con contexto completo | `abaco_master.clients` |
| Skills según tech stack | `abaco_master.client_skills` |
| Objetivos financieros | `abaco_master.client_objectives` |
| Fuentes de datos | `abaco_master.client_data_sources` |
| Log de onboarding | `abaco_master.context_logs` |
| Mirror para dropdown de tareas | `mission_control.mc_clients` |
| Repo GitHub (opcional) | GitHub + `mc_clients.github_repo` |

---

## 🔐 REGLAS ABSOLUTAS PARA EL AGENTE

1. **NUNCA usar SQLite** — Siempre PostgreSQL
2. **NUNCA mezclar proyectos** — abaco ≠ lavandería ≠ mission-control
3. **SIEMPRE leer `CONTEXT_ABACO.md` antes de cualquier tarea**
4. **SIEMPRE verificar empresa_id = 1** por defecto en `cfo_ai_db`
5. **SIEMPRE usar funciones PostgreSQL** (no SQLite)
6. **SIEMPRE hacer commit y push** después de cambios
7. **SIEMPRE deployar a Render** — no solo localhost
8. **Workflow de tareas:** `mc_tasks.project_id` → `mc_clients.slug` → `abaco_master.clients.slug` → `database_name`

---

*Este archivo es la fuente de verdad. Actualizar después de cada cambio significativo.*
