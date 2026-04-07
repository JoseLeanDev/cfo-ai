# 📋 PLAN COMPLETO: CIERRE MENSUAL + CONCILIACIÓN BANCARIA MANUAL
## Diseño para Empresa Guatemalteca - CFO AI

---

## 🎯 FILOSOFÍA DE DISEÑO

**Realidad guatemalteca:**
- Bancos (BI, G&T, BAC, Ficohsa, Promerica) NO ofrecen APIs abiertas para PYMES
- Los estados de cuenta llegan por PDF o se descargan manualmente del portal
- El contador dedica 2-3 días al cierre mensual
- El CFO necesita ver comparativos y tendencias, no solo datos del mes
- La prioridad es **reducir tiempo de cierre** y **aumentar confiabilidad de datos**

**Scope realista:**
- No hacer matching automático de transacciones (imposible sin API)
- Sí: Wizard guiado, checklists, comparativos, alertas de inconsistencias
- Sí: Registro manual de conciliación con evidencia documentada
- Sí: Histórico de estados financieros mensuales generados

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### Nuevas Tablas

```sql
-- ============================================
-- 1. CIERRES MENSUALES
-- ============================================
CREATE TABLE cierres_mensuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL, -- 1-12
    estado TEXT NOT NULL DEFAULT 'abierto', -- abierto, en_proceso, cerrado
    
    -- Fechas importantes
    fecha_inicio_cierre TEXT,
    fecha_cierre TEXT,
    fecha_aprobacion TEXT,
    aprobado_por TEXT,
    
    -- Checklist del proceso
    check_validacion BOOLEAN DEFAULT 0,
    check_asientos_ajuste BOOLEAN DEFAULT 0,
    check_depreciaciones BOOLEAN DEFAULT 0,
    check_conciliacion_bancaria BOOLEAN DEFAULT 0,
    check_conciliacion_cxc BOOLEAN DEFAULT 0,
    check_conciliacion_cxp BOOLEAN DEFAULT 0,
    check_estados_generados BOOLEAN DEFAULT 0,
    check_aprobacion_final BOOLEAN DEFAULT 0,
    
    -- Resumen financiero (snapshot al cierre)
    total_activos REAL,
    total_pasivos REAL,
    total_patrimonio REAL,
    total_ingresos_mes REAL,
    total_gastos_mes REAL,
    utilidad_neta_mes REAL,
    utilidad_acumulada REAL,
    
    -- Métricas de proceso
    tiempo_minutos INTEGER,
    num_alertas_resueltas INTEGER DEFAULT 0,
    num_alertas_pendientes INTEGER DEFAULT 0,
    
    -- Documentos generados
    url_estado_resultados TEXT,
    url_balance_general TEXT,
    url_flujo_efectivo TEXT,
    url_libro_diario TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    UNIQUE(empresa_id, anio, mes)
);

-- ============================================
-- 2. CONCILIACIONES BANCARIAS
-- ============================================
CREATE TABLE conciliaciones_bancarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    cuenta_bancaria_id INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    
    -- Saldos
    saldo_contable_inicial REAL,
    saldo_contable_final REAL,
    saldo_estado_cuenta REAL, -- Lo que dice el PDF del banco
    diferencia REAL,
    
    -- Detalle de ajustes
    total_depositos_transito REAL DEFAULT 0,
    total_cheques_no_cobrados REAL DEFAULT 0,
    total_cargos_no_registrados REAL DEFAULT 0,
    total_creditos_no_registrados REAL DEFAULT 0,
    
    -- Estado
    estado TEXT DEFAULT 'pendiente', -- pendiente, en_proceso, conciliado, con_diferencia
    diferencia_justificada BOOLEAN DEFAULT 0,
    notas_justificacion TEXT,
    
    -- Documentación
    nombre_archivo_estado_cuenta TEXT,
    url_archivo_estado_cuenta TEXT,
    
    -- Auditoría
    elaborado_por TEXT,
    revisado_por TEXT,
    fecha_conciliacion TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    FOREIGN KEY (cuenta_bancaria_id) REFERENCES cuentas_bancarias(id),
    UNIQUE(empresa_id, cuenta_bancaria_id, anio, mes)
);

-- ============================================
-- 3. DETALLE DE CONCILIACIÓN (transacciones identificadas)
-- ============================================
CREATE TABLE conciliacion_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conciliacion_id INTEGER NOT NULL,
    tipo_diferencia TEXT NOT NULL, -- deposito_transito, cheque_no_cobrado, cargo_no_registrado, credito_no_registrado, error
    fecha_transaccion TEXT,
    monto REAL NOT NULL,
    descripcion TEXT,
    referencia_banco TEXT,
    referencia_interna TEXT,
    estado TEXT DEFAULT 'pendiente', -- pendiente, verificado, corregido
    asiento_correccion_id TEXT, -- Referencia al asiento que lo corrige
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conciliacion_id) REFERENCES conciliaciones_bancarias(id)
);

-- ============================================
-- 4. HISTÓRICO DE ESTADOS FINANCIEROS (snapshots mensuales)
-- ============================================
CREATE TABLE estados_financieros_historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    cierre_mensual_id INTEGER,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    tipo_estado TEXT NOT NULL, -- resultados, balance, flujo_efectivo
    
    -- JSON con el estado completo
    contenido_json TEXT NOT NULL,
    
    -- Totales para queries rápidas
    total_activos REAL,
    total_pasivos REAL,
    total_patrimonio REAL,
    ventas_netas REAL,
    utilidad_bruta REAL,
    utilidad_operativa REAL,
    utilidad_neta REAL,
    
    -- Variación vs mes anterior
    variacion_ventas REAL,
    variacion_utilidad REAL,
    variacion_activos REAL,
    
    url_pdf TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    FOREIGN KEY (cierre_mensual_id) REFERENCES cierres_mensuales(id)
);

-- ============================================
-- 5. ALERTAS DE CIERRE (issues detectados)
-- ============================================
CREATE TABLE alertas_cierre (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    cierre_mensual_id INTEGER,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    tipo_alerta TEXT NOT NULL, -- saldo_negativo, asiento_desbalanceado, cuenta_sospechosa, falta_documento, etc
    severidad TEXT NOT NULL, -- critica, alta, media, baja
    descripcion TEXT NOT NULL,
    cuenta_afectada TEXT,
    monto_involucrado REAL,
    estado TEXT DEFAULT 'pendiente', -- pendiente, revisada, resuelta, ignorada
    resuelta_por TEXT,
    notas_resolucion TEXT,
    fecha_resolucion TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    FOREIGN KEY (cierre_mensual_id) REFERENCES cierres_mensuales(id)
);

-- ============================================
-- 6. COMPARATIVOS CONFIGURACIÓN
-- ============================================
CREATE TABLE comparativos_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    -- Qué meses incluye
    mes_actual BOOLEAN DEFAULT 1,
    mes_anterior BOOLEAN DEFAULT 1,
    mismo_mes_anio_anterior BOOLEAN DEFAULT 0,
    promedio_ultimos_3_meses BOOLEAN DEFAULT 0,
    promedio_ytd BOOLEAN DEFAULT 0,
    -- Qué cuentas/categorías
    cuentas_incluir TEXT, -- JSON array de códigos de cuenta
    -- Layout
    tipo_visualizacion TEXT DEFAULT 'tabla', -- tabla, grafica, ambos
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);
```

---

## 🔌 NUEVOS ENDPOINTS BACKEND

```javascript
// ============================================
// CIERRES MENSUALES
// ============================================

// GET /api/contabilidad/cierres
// Listado de todos los cierres mensuales
router.get('/cierres', async (req, res) => {
    // Query params: anio, estado (abierto|en_proceso|cerrado)
    // Returns: lista con resumen de cada mes
});

// GET /api/contabilidad/cierres/:anio/:mes
// Detalle completo de un cierre específico
router.get('/cierres/:anio/:mes', async (req, res) => {
    // Returns: cierre completo + checklist + alertas + estados financieros
});

// POST /api/contabilidad/cierres/iniciar
// Iniciar proceso de cierre para un mes
router.post('/cierres/iniciar', async (req, res) => {
    // Body: anio, mes
    // Creates: registro en cierres_mensuales con estado 'en_proceso'
    // Runs: validaciones preliminares, genera alertas
    // Returns: lista de alertas detectadas + checklist
});

// POST /api/contabilidad/cierres/:anio/:mes/checklist
// Actualizar check del proceso
router.post('/cierres/:anio/:mes/checklist', async (req, res) => {
    // Body: { campo: 'check_depreciaciones', valor: true }
    // Updates: marca checklist + timestamp
    // Validates: no marcar si hay alertas críticas pendientes
});

// POST /api/contabilidad/cierres/:anio/:mes/generar-estados
// Generar estados financieros
router.post('/cierres/:anio/:mes/generar-estados', async (req, res) => {
    // Requiere: checklist completo (excepto aprobación final)
    // Creates: registros en estados_financieros_historico
    // Generates: PDFs
    // Updates: cierre.estado = 'pendiente_aprobacion'
});

// POST /api/contabilidad/cierres/:anio/:mes/cerrar
// Cierre definitivo del mes
router.post('/cierres/:anio/:mes/cerrar', async (req, res) => {
    // Requiere: estados generados + aprobación
    // Body: aprobado_por, notas
    // Updates: estado = 'cerrado', fecha_cierre, bloquea edición de asientos
    // Creates: backup del período
});

// POST /api/contabilidad/cierres/:anio/:mes/reabrir
// Reabrir un mes cerrado (solo admin)
router.post('/cierres/:anio/:mes/reabrir', async (req, res) => {
    // Requiere: permisos de admin
    // Body: motivo_reapertura
    // Updates: estado = 'abierto', desbloquea asientos
    // Logs: auditoría de quién y por qué
});

// ============================================
// CONCILIACIÓN BANCARIA
// ============================================

// GET /api/contabilidad/conciliacion/pendientes
// Lista de conciliaciones pendientes por mes
router.get('/conciliacion/pendientes', async (req, res) => {
    // Query: anio, mes
    // Returns: cuentas bancarias sin conciliar para el mes
});

// GET /api/contabilidad/conciliacion/:cuentaId/:anio/:mes
// Obtener conciliación específica
router.get('/conciliacion/:cuentaId/:anio/:mes', async (req, res) => {
    // Returns: conciliación + detalle de diferencias
});

// POST /api/contabilidad/conciliacion/iniciar
// Iniciar nueva conciliación
router.post('/conciliacion/iniciar', async (req, res) => {
    // Body: cuenta_bancaria_id, anio, mes, saldo_estado_cuenta
    // Creates: registro en conciliaciones_bancarias
    // Calculates: saldo_contable_inicial del mes
});

// POST /api/contabilidad/conciliacion/:id/diferencias
// Registrar diferencias encontradas
router.post('/conciliacion/:id/diferencias', async (req, res) => {
    // Body: array de diferencias {tipo, fecha, monto, descripcion, referencia}
    // Creates: registros en conciliacion_detalle
    // Updates: totales en conciliacion
});

// POST /api/contabilidad/conciliacion/:id/completar
// Completar conciliación
router.post('/conciliacion/:id/completar', async (req, res) => {
    // Requiere: diferencia = 0 o diferencia_justificada = true
    // Body: notas_justificacion, elaborado_por
    // Updates: estado, fecha_conciliacion
    // Updates: cierre_mensual.check_conciliacion_bancaria = true
});

// POST /api/contabilidad/conciliacion/:id/archivo
// Subir estado de cuenta (PDF/imagen)
router.post('/conciliacion/:id/archivo', upload.single('estado_cuenta'), async (req, res) => {
    // Guarda: archivo en storage
    // Updates: url_archivo_estado_cuenta
});

// ============================================
// ALERTAS DE CIERRE
// ============================================

// GET /api/contabilidad/alertas
// Listado de alertas
router.get('/alertas', async (req, res) => {
    // Query: anio, mes, estado, severidad
    // Returns: alertas con filtros
});

// POST /api/contabilidad/alertas/:id/resolver
// Marcar alerta como resuelta
router.post('/alertas/:id/resolver', async (req, res) => {
    // Body: notas_resolucion
    // Updates: estado = 'resuelta'
});

// ============================================
// COMPARATIVOS Y ANÁLISIS
// ============================================

// GET /api/contabilidad/comparativos/:anio/:mes
// Datos comparativos para un mes
router.get('/comparativos/:anio/:mes', async (req, res) => {
    // Query: incluir_anterior, incluir_ytd, etc.
    // Returns:
    // {
    //   mes_actual: { ventas, gastos, utilidad, margen, activos... },
    //   mes_anterior: { ... },
    //   variacion: { ventas_pct, gastos_pct... },
    //   ytd: { ... },
    //   tendencia_6_meses: [...]
    // }
});

// GET /api/contabilidad/comparativos/cuentas/:cuentaCodigo
// Evolución de una cuenta específica
router.get('/comparativos/cuentas/:cuentaCodigo', async (req, res) => {
    // Query: desde_anio, desde_mes, hasta_anio, hasta_mes
    // Returns: array mensual con saldos
});

// GET /api/contabilidad/dashboard-cierre
// Dashboard específico para proceso de cierre
router.get('/dashboard-cierre', async (req, res) => {
    // Returns:
    // {
    //   meses_abiertos: [...],
    //   meses_en_proceso: [...],
    //   alertas_criticas_activas: count,
    //   conciliaciones_pendientes: count,
    //   proximo_cierre_recomendado: '2026-04',
    //   dias_desde_ultimo_cierre: 12
    // }
});
```

---

## 🖥️ NUEVAS PANTALLAS FRONTEND

### 1. Dashboard de Cierre Mensual
**Ruta:** `/contabilidad/cierre`

**Contenido:**
```
┌─────────────────────────────────────────────────────────────────┐
│ CIERRE MENSUAL - Dashboard                              [Nuevo+]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Marzo 2026  │ │ Abril 2026  │ │ Mayo 2026   │ │ ...         ││
│  │ ✓ CERRADO   │ │ 🔄 EN PROC. │ │ ○ ABIERTO   │ │             ││
│  │ Ver estados │ │ Continuar   │ │ Iniciar     │ │             ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⚠️ ALERTAS ACTIVAS (5)                                    │   │
│  │ • Cuenta 1101 con saldo negativo en Marzo (CRÍTICA)       │   │
│  │ • Diferencia en conciliación BAC (ALTA)                   │   │
│  │ • Falta asiento de depreciación Febrero (MEDIA)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📊 COMPARATIVO RÁPIDO: Marzo vs Febrero                   │   │
│  │ Ventas:    Q2.4M → Q2.8M  (+16%) 📈                       │   │
│  │ Utilidad:  Q380K → Q420K  (+11%) 📈                       │   │
│  │ Gastos:    Q1.9M → Q2.1M  (+11%) ⚠️                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Wizard de Cierre (Paso a paso)
**Ruta:** `/contabilidad/cierre/:anio/:mes/proceso`

**7 Pasos del Wizard:**

**Paso 1: Validación Preliminar**
- Lista de verificación automática:
  - [x] Todas las facturas del mes registradas
  - [ ] Asientos pendientes de autorización (3)
  - [x] Saldos de bancos actualizados
  - [x] Inventario fisico cuadrado
- Tabla de alertas detectadas con acciones

**Paso 2: Asientos de Ajuste**
- Lista de ajustes sugeridos por el sistema:
  - Diferencial cambiario USD: calculado automático
  - Redondeos: sugerencia
  - Ajustes de inventario: si aplica
- Formulario para crear asientos de ajuste
- Preview del impacto en estados

**Paso 3: Depreciaciones**
- Tabla de activos fijos con cálculo de depreciación mensual
- Botón "Generar asiento de depreciación"
- Preview: Activo | Valor Original | Dep. Acumulada | Dep. Mes

**Paso 4: Conciliación Bancaria**
- Grid de cuentas bancarias:
```
Banco        │ Moneda │ Saldo Contable │ Saldo Banco │ Diferencia │ Estado      │ Acción
─────────────┼────────┼────────────────┼─────────────┼────────────┼─────────────┼────────
BI Monetaria │ GTQ    │ Q1,245,000     │ Q1,240,500  │ Q4,500     │ ⚠️ Dif.     │ [Conciliar]
G&T Principal│ GTQ    │ Q875,000       │ Q875,000    │ Q0         │ ✓ OK        │ [Ver]
BAC Negocios │ GTQ    │ Q520,000       │ —           │ —          │ ⏳ Pendiente │ [Iniciar]
```

**Paso 5: Conciliación CxC / CxP**
- Validación de saldos vs auxiliares
- Alertas de clientes/proveedores con saldos inconsistentes

**Paso 6: Generación de Estados**
- Preview de:
  - Estado de Resultados (comparativo mes anterior)
  - Balance General (cambios en activos/pasivos)
  - Flujo de Efectivo
- Botones: Generar PDF, Descargar Excel

**Paso 7: Cierre y Aprobación**
- Resumen ejecutivo del mes
- Checkbox: "He revisado todos los estados financieros"
- Firma digital/aprobación
- Botón: CERRAR MES (bloquea edición)

### 3. Pantalla de Conciliación Bancaria Detalle
**Ruta:** `/contabilidad/conciliacion/:cuentaId/:anio/:mes`

```
┌─────────────────────────────────────────────────────────────────┐
│ Conciliación: Banco Industrial - Abril 2026           [Guardar] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SALDOS                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Contable Inicial │  │ Estado de Cuenta │  │ Diferencia   │  │
│  │ Q1,245,000       │  │ [____________]   │  │ —            │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                  │
│  [📎 Subir Estado de Cuenta PDF]                                │
│                                                                  │
│  DIFERENCIAS IDENTIFICADAS                                      │
│  ┌────────────┬────────────┬──────────┬────────────────────────┐│
│  │ Tipo       │ Fecha      │ Monto    │ Descripción            ││
│  ├────────────┼────────────┼──────────┼────────────────────────┤│
│  │ Chq. No Cob│ 2026-04-15 │ Q12,500  │ Chq. #4521 a ProveedorX││
│  │ Dep. Trans │ 2026-04-28 │ Q45,000  │ Depósito venta fin mes ││
│  │ Cargo Banco│ 2026-04-30 │ Q250     │ Comisión ACH           ││
│  │ [+ Agregar]                                                    │
│  └────────────┴────────────┴──────────┴────────────────────────┘│
│                                                                  │
│  AJUSTE AUTOMÁTICO                                              │
│  [Generar asiento de ajuste por diferencias]                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Comparativos y Análisis Histórico
**Ruta:** `/contabilidad/comparativos`

**Tabs:**
- **Vista General:** Dashboard con KPIs mes a mes
- **Estado de Resultados:** Tabla comparativa 12 meses
- **Balance General:** Evolución de activos/pasivos
- **Cuenta Específica:** Buscador de cuenta + gráfica de evolución

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPARATIVOS                                          [⚙ Config]│
├─────────────────────────────────────────────────────────────────┤
│  [General] [Estado Resultados] [Balance] [Flujo Efectivo] [Custom]
│                                                                  │
│  Período: [Enero 2026 ▼] a [Marzo 2026 ▼]   vs   [Mismo período 2025 ▼]
│                                                                  │
│  ESTADO DE RESULTADOS COMPARATIVO                               │
│  ┌─────────────────┬────────────┬────────────┬────────────┬────────┐
│  │ Concepto        │ Mar 2026   │ Feb 2026   │ Mar 2025   │ Var %  │
│  ├─────────────────┼────────────┼────────────┼────────────┼────────┤
│  │ VENTAS          │ Q2,845,000 │ Q2,456,000 │ Q2,234,000 │ +27%   │
│  │ Costo de Ventas │ Q1,987,000 │ Q1,712,000 │ Q1,563,000 │ +27%   │
│  │ UTILIDAD BRUTA  │ Q858,000   │ Q744,000   │ Q671,000   │ +28%   │
│  │ Margen Bruto    │ 30.1%      │ 30.3%      │ 30.0%      │ +0.1pp │
│  ├─────────────────┼────────────┼────────────┼────────────┼────────┤
│  │ Gastos Op.      │ Q438,000   │ Q412,000   │ Q398,000   │ +10%   │
│  │ UTILIDAD OP.    │ Q420,000   │ Q332,000   │ Q273,000   │ +54%   │
│  ├─────────────────┼────────────┼────────────┼────────────┼────────┤
│  │ UTILIDAD NETA   │ Q378,000   │ Q298,800   │ Q245,700   │ +54%   │
│  │ Margen Neto     │ 13.3%      │ 12.2%      │ 11.0%      │ +2.3pp │
│  └─────────────────┴────────────┴────────────┴────────────┴────────┘
│                                                                  │
│  [📊 Ver Gráfica] [📥 Exportar Excel] [📄 Exportar PDF]          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Histórico de Estados Financieros
**Ruta:** `/contabilidad/historico`

**Vista tipo biblioteca:**
```
2026
├── Marzo 2026          [Estados] [Libro Diario] [✓ Cerrado]
│   └─ Cerrado el 2026-04-05 por Lic. María González
├── Febrero 2026        [Estados] [Libro Diario] [✓ Cerrado]
│   └─ Cerrado el 2026-03-04 por Lic. María González
└── Enero 2026          [Estados] [Libro Diario] [✓ Cerrado]
    └─ Cerrado el 2026-02-05 por Lic. María González

2025
├── Diciembre 2025      [Estados] [Libro Diario] [✓ Cerrado]
├── Noviembre 2025      [Estados] [Libro Diario] [✓ Cerrado]
...
```

---

## 🤖 INTEGRACIÓN CON MULTI-AGENTE

### Agente Auditor Automático (extensión)
**Nuevas capacidades:**

```javascript
// Detectar problemas pre-cierre
async detectarProblemasCierre(anio, mes) {
  const alertas = [];
  
  // 1. Saldos negativos en cuentas de activo
  const saldosNegativos = await db.allAsync(`
    SELECT cuenta_codigo, cuenta_nombre, saldo 
    FROM saldos_cuentas 
    WHERE anio = ? AND mes = ? 
    AND cuenta_codigo LIKE '1%' AND saldo < 0
  `, [anio, mes]);
  
  // 2. Desbalance en asientos
  const asientosDesbalanceados = await db.allAsync(`
    SELECT asiento_id, SUM(debe) as total_debe, SUM(haber) as total_haber
    FROM asientos 
    WHERE strftime('%Y-%m', fecha) = ?
    GROUP BY asiento_id
    HAVING ABS(total_debe - total_haber) > 0.01
  `, [`${anio}-${String(mes).padStart(2,'0')}`]);
  
  // 3. Cuentas con movimientos inusuales
  const variacionesInusuales = await detectarVariaciones(anio, mes);
  
  return { alertas: [...saldosNegativos, ...asientosDesbalanceados, ...variacionesInusuales] };
}

// Validar conciliación
async validarConciliacion(conciliacionId) {
  const conciliacion = await obtenerConciliacion(conciliacionId);
  
  // Verificar que diferencia = suma de diferencias identificadas
  const sumaDiferencias = await calcularSumaDiferencias(conciliacionId);
  
  if (Math.abs(conciliacion.diferencia - sumaDiferencias) > 0.01) {
    return { 
      valido: false, 
      mensaje: 'La diferencia no cuadra con los items identificados' 
    };
  }
  
  // Verificar que no haya diferencias viejas sin resolver
  const diferenciasViejas = await detectarDiferenciasViejas(conciliacionId);
  
  return { valido: true, diferenciasViejas };
}
```

### Agente Analista Financiero (extensión)
**Nuevas capacidades:**

```javascript
// Analizar tendencias para comparativos
async analizarTendencia(cuentaCodigo, meses = 12) {
  const historico = await obtenerHistorico(cuentaCodigo, meses);
  
  // Calcular tendencia
  const tendencia = calcularTendenciaLineal(historico);
  
  // Detectar anomalías
  const anomalias = detectarAnomalias(historico);
  
  // Proyectar próximo mes
  const proyeccion = proyectarMesSiguiente(historico);
  
  return { tendencia, anomalias, proyeccion };
}

// Generar insights de cierre
async generarInsightsCierre(anio, mes) {
  const insights = [];
  
  // Comparar con mes anterior
  const actual = await obtenerResultados(anio, mes);
  const anterior = await obtenerResultados(anio, mes - 1 || 12);
  
  if (actual.utilidadNeta > anterior.utilidadNeta * 1.2) {
    insights.push({
      tipo: 'positivo',
      mensaje: `Utilidad creció ${((actual.utilidadNeta/anterior.utilidadNeta - 1) * 100).toFixed(1)}% vs mes anterior`
    });
  }
  
  // Comparar con mismo mes año anterior
  const mismoMesAnioAnterior = await obtenerResultados(anio - 1, mes);
  // ... análisis year-over-year
  
  return insights;
}
```

---

## 📱 FLUJO DE USUARIO REALISTA

### Escenario: Contador haciendo cierre de Marzo 2026

**Día 1 - Preparación (30 min)**
1. Entra a Dashboard de Cierre → ve que Marzo está "En Proceso"
2. Revisa las 5 alertas detectadas automáticamente
3. Resuelve 3 alertas simples (asientos faltantes)
4. Marca Paso 1 como completo

**Día 1 - Asientos (45 min)**
1. Paso 2: Revisa ajustes sugeridos por el sistema
2. Genera asiento de diferencial cambiario (automático)
3. Crea manualmente 2 ajustes adicionales
4. Marca Paso 2 completo

**Día 2 - Depreciaciones (15 min)**
1. Paso 3: Revisa tabla de activos
2. Genera asiento de depreciación con un click
3. Marca Paso 3 completo

**Día 2 - Conciliaciones (90 min)**
1. Paso 4: Ve 4 cuentas bancarias
2. Descarga estados de cuenta de portales bancarios
3. Sube PDFs al sistema
4. Para cada cuenta:
   - Ingresa saldo según estado de cuenta
   - Identifica diferencias manualmente
   - Registra cheques no cobrados, depósitos en tránsito
5. Genera asientos de ajuste por diferencias
6. Marca Paso 4 completo

**Día 3 - Revisión Final (30 min)**
1. Paso 5 y 6: Valida CxC/CxP (ya cuadran)
2. Genera Estados Financieros
3. Revisa comparativos con febrero
4. Marca Pasos 5 y 6 completos

**Día 3 - Cierre (15 min)**
1. Paso 7: Revisa resumen ejecutivo
2. Aprueba y cierra mes
3. Sistema bloquea edición de asientos de marzo
4. PDFs quedan disponibles en Histórico

**Total: ~3.5 horas distribuidas en 3 días**

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Base de Datos (1 día)
- [ ] Crear migración con 6 nuevas tablas
- [ ] Actualizar `seed.js` con datos de cierre de prueba
- [ ] Índices para queries de comparativos

### Fase 2: Backend (3 días)
- [ ] Endpoints de cierres mensuales
- [ ] Endpoints de conciliación bancaria
- [ ] Endpoints de alertas
- [ ] Endpoints de comparativos
- [ ] Lógica de bloqueo de períodos

### Fase 3: Frontend (4 días)
- [ ] Dashboard de Cierre
- [ ] Wizard de 7 pasos
- [ ] Pantalla de Conciliación Detalle
- [ ] Pantalla de Comparativos
- [ ] Pantalla de Histórico

### Fase 4: Multi-Agente (2 días)
- [ ] Extender Auditor para detectar problemas de cierre
- [ ] Extender Analista para insights comparativos
- [ ] Entrenar prompts para Guatemala

### Fase 5: Testing (2 días)
- [ ] Flujo completo de cierre con datos reales
- [ ] Conciliación con diferencias
- [ ] Reapertura de mes cerrado
- [ ] Exportación de PDFs

**Total estimado: 12 días de desarrollo**

---

## 🎁 VALOR AGREGADO IDENTIFICADO

| Para quién | Valor |
|------------|-------|
| **Contador** | Reduce cierre de 5-6 días a 2-3 días. Checklist garantiza que no se olvide nada. |
| **CFO** | Tiene comparativos automáticos para tomar decisiones. Histórico de estados siempre disponible. |
| **Auditor** | Trail completo de quién hizo qué y cuándo. Conciliaciones documentadas con evidencia. |
| **Bancos** | Mejor relación al tener conciliaciones ordenadas y justificadas. |
| **Empresa** | Cierres más rápidos = información financiera más oportuna para decisiones estratégicas. |

---

## ❓ DECISIONES PENDIENTES

1. **¿Permitir reapertura de meses cerrados?**
   - Recomendación: Sí, pero solo con permiso de admin y log de auditoría

2. **¿Generar asientos de ajuste automáticamente?**
   - Recomendación: Pre-generar en borrador, requieren aprobación manual antes de contabilizar

3. **¿Qué tan atrás permitir ver comparativos?**
   - Recomendación: Mínimo 24 meses, ideal 36 meses (3 años)

4. **¿Exportación a Excel nativo o CSV?**
   - Recomendación: Excel con formato usando librería `xlsx`

5. **¿Integrar con SAT para declaraciones?**
   - Fase 2: No por ahora. Pero sí alertar obligaciones pendientes del mes.

---

*Documento preparado para CFO AI - Empresa modelo: Distribuidora Industrial Centroamericana, S.A. (DICSA)*
*Fecha: Abril 2026*
*Elaborado por: CFO AI System*
