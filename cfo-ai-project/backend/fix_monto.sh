#!/bin/bash
# Fix monto → monto_pendiente for cuentas_cobrar and cuentas_pagar tables

# Active agents v2.0
sed -i "s/SUM(monto) as total FROM cuentas_cobrar/SUM(monto_pendiente) as total FROM cuentas_cobrar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/agents/caja/AgenteCaja.js \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/agents/analisis/AgenteAnalisis.js

sed -i "s/SUM(monto) as total FROM cuentas_pagar/SUM(monto_pendiente) as total FROM cuentas_pagar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/agents/analisis/AgenteAnalisis.js

# Routes
sed -i "s/SUM(monto) as total FROM cuentas_cobrar/SUM(monto_pendiente) as total FROM cuentas_cobrar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/dashboard.js \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/agents.js \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/analisis.js \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/analisis-working-capital.js

sed -i "s/SUM(monto) as total FROM cuentas_pagar/SUM(monto_pendiente) as total FROM cuentas_pagar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/agents.js

# Fix COALESCE(SUM(monto)) too
sed -i "s/COALESCE(SUM(monto), 0) as total FROM cuentas_cobrar/COALESCE(SUM(monto_pendiente), 0) as total FROM cuentas_cobrar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/analisis.js \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/analisis-working-capital.js

# Fix SELECT cliente, monto... FROM cuentas_cobrar
sed -i "s/SELECT cliente, monto, dias_atraso FROM cuentas_cobrar/SELECT cliente_nombre as cliente, monto_pendiente as monto, dias_atraso FROM cuentas_cobrar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/agents.js

# Fix SUM(monto) as total_mes FROM cuentas_cobrar
sed -i "s/SUM(monto) as total_mes FROM cuentas_cobrar/SUM(monto_pendiente) as total_mes FROM cuentas_cobrar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/routes/runAllAgents.js

# Fix agenteAnalisis COUNT/SUM
sed -i "s/COUNT(\*) as count, COALESCE(SUM(monto), 0) as total FROM cuentas_cobrar/COUNT(*) as count, COALESCE(SUM(monto_pendiente), 0) as total FROM cuentas_cobrar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/agents/analisis/AgenteAnalisis.js

sed -i "s/COUNT(\*) as count, COALESCE(SUM(monto), 0) as total FROM cuentas_pagar/COUNT(*) as count, COALESCE(SUM(monto_pendiente), 0) as total FROM cuentas_pagar/g" \
  /root/.openclaw/workspace/cfo-ai-project/backend/src/agents/analisis/AgenteAnalisis.js

echo "Done fixing monto → monto_pendiente for cxc/cxp tables"
