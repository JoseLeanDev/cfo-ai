# CFO AI - Scheduler System

Sistema de tareas programadas para agentes de CFO AI.

## 🚀 Inicio Rápido

### Opción 1: Como parte del backend principal
```bash
# El scheduler se inicia automáticamente con el backend
npm run dev
```

### Opción 2: Standalone (proceso separado)
```bash
# Instalar dependencias
npm install

# Ejecutar scheduler standalone
node src/scheduler/run.js

# O con variables de entorno
API_BASE_URL=http://localhost:3000/api EMPRESA_ID=1 node src/scheduler/run.js
```

### Opción 3: Vía API REST
```bash
# Iniciar scheduler
POST /api/scheduler/start
{
  "empresa_id": 1
}

# Ver estado
GET /api/scheduler/status

# Detener scheduler
POST /api/scheduler/stop

# Ver logs
GET /api/scheduler/logs?fecha=2026-04-09

# Ejecutar tarea manualmente
POST /api/scheduler/trigger
{
  "agent": "auditor",
  "task": "alertas-pre-cierre",
  "params": {
    "empresa_id": 1
  }
}
```

## 📋 Tareas Programadas

### Auditor Automático
| Tarea | Frecuencia | Descripción |
|-------|------------|-------------|
| `detectar-anomalias-tiempo-real` | Cada 30 min | Transacciones atípicas, saldos negativos, duplicados |
| `alertas-pre-cierre` | Diario 06:00 | Validar asientos del día anterior |
| `auditoria-cxp-cxc` | Lunes 08:00 | Validar auxiliares vs generales |
| `validacion-apertura-mes` | Día 1, 00:01 | Crear registro de cierre mensual |
| `presion-cierre-tardio` | Día 5, 18:00 | Alertar si mes anterior sigue abierto |

### Analista Financiero
| Tarea | Frecuencia | Descripción |
|-------|------------|-------------|
| `briefing-matutino` | 07:00 L-V | Resumen de ventas, gastos, alertas |
| `snapshot-diario` | 18:00 | Guardar métricas del día |
| `reporte-semanal` | Viernes 17:00 | Comparativo semanal |
| `cierre-mes-anterior` | Día 1, 09:00 | Insights del mes cerrado |
| `proyeccion-trimestral` | Meses 1,4,7,10 | Proyección financiera |

### Conciliador Bancario
| Tarea | Frecuencia | Descripción |
|-------|------------|-------------|
| `alerta-conciliacion-pendiente` | 08:00 diario | Recordar conciliaciones pendientes |
| `iniciar-conciliaciones` | Día 1 | Crear registros para mes que cierra |
| `presion-conciliacion` | Día 3 | Alertar si siguen pendientes |

### Maintenance
| Tarea | Frecuencia | Descripción |
|-------|------------|-------------|
| `limpieza-logs` | 02:00 diario | Archivar logs > 90 días |
| `optimizacion-db` | Domingo 03:00 | VACUUM SQLite |
| `snapshot-archivo` | Día 28, 04:00 | Backup mensual |

## 📝 Logs

Los logs se guardan en:
```
backend/logs/scheduler/YYYY-MM-DD.jsonl
```

Formato:
```json
{
  "timestamp": "2026-04-09T10:30:00.000Z",
  "task": "auditor.detectar-anomalias",
  "success": true,
  "message": "Ejecutado correctamente",
  "duration": 1250
}
```

## ⚙️ Configuración

Variables de entorno:
```bash
API_BASE_URL=http://localhost:3000/api  # URL del backend
EMPRESA_ID=1                            # ID de empresa por defecto
NODE_ENV=production                     # Ambiente
```

## 🔧 Troubleshooting

### El scheduler no inicia
- Verificar que el backend esté corriendo
- Revisar que `node-cron` esté instalado: `npm list node-cron`

### Las tareas no se ejecutan
- Revisar logs: `tail -f backend/logs/scheduler/*.jsonl`
- Verificar zona horaria del servidor
- Probar ejecución manual vía API

### Error de conexión al API
- Verificar `API_BASE_URL`
- Confirmar que el puerto no esté bloqueado
- Probar: `curl http://localhost:3000/api/health`
