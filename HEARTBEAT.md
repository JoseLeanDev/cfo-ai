# HEARTBEAT.md - CFO AI Agent Coordination

## Tareas cada ~30 minutos (rotativas)

### Ciclo 1: Auditoría en Tiempo Real
- [ ] Detectar transacciones atípicas últimas 4h
- [ ] Verificar saldos negativos en cuentas de activo
- [ ] Chequear duplicados de facturas

### Ciclo 2: Alertas Operativas
- [ ] Cuentas bancarias sin conciliar
- [ ] Alertas de cierre críticas sin resolver
- [ ] Transacciones > Q50,000 sin categorizar

### Ciclo 3: Métricas
- [ ] Actualizar dashboard de liquidez
- [ ] Calcular runway (meses de operación)

## Reglas de Alerta

ALERTAR cuando:
- Transacción > Q50,000 sin categorizar
- Saldo bancario < Q10,000
- Mes anterior sigue abierto después del día 5

SILENCIO (HEARTBEAT_OK) cuando:
- Todo dentro de parámetros normales
- Fin de semana (salvo urgencias de cierre mensual)

## Estado de Checks

```json
{
  "lastChecks": {
    "auditoria": null,
    "alertas": null,
    "metricas": null
  },
  "currentCycle": 1
}
```
