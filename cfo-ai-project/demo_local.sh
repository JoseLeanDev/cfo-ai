#!/bin/bash
# CFO AI - Demo Local Completo

clear
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                CFO AI - DEMO LOCAL                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Verificar que los puertos estén libres
echo "📋 Verificando puertos..."
pkill -f "nodemon.*cfo" 2>/dev/null
pkill -9 -f "node.*3000" 2>/dev/null
sleep 2

# Iniciar Backend
echo "🚀 Iniciando Backend..."
cd /root/.openclaw/workspace/cfo-ai-project/backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Esperar backend
for i in {1..20}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "   ✅ Backend listo en http://localhost:3000"
        break
    fi
    sleep 1
done

# Verificar datos
echo "📊 Cargando datos..."
DASHBOARD=$(curl -s http://localhost:3000/api/dashboard 2>/dev/null)
if [ -n "$DASHBOARD" ]; then
    echo "   ✅ Datos cargados correctamente"
else
    echo "   ⚠️  Datos no disponibles"
fi

# Iniciar Frontend Local
echo "🎨 Iniciando Frontend Local..."
cd /root/.openclaw/workspace/cfo-ai-project/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Esperar frontend
for i in {1..15}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "   ✅ Frontend listo en http://localhost:3001"
        break
    fi
    sleep 1
done

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ TODO LISTO PARA DEMO                     ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  🌐 Abre en tu navegador:                               ║"
echo "║     http://localhost:3001                               ║"
echo "║                                                          ║"
echo "║  📊 O usa el frontend en Vercel:                        ║"
echo "║     https://frontend-blond-rho-55.vercel.app            ║"
echo "║                                                          ║"
echo "║  ⚙️  API Local: http://localhost:3000/api               ║"
echo "║                                                          ║"
echo "║  🤖 Agentes disponibles:                                ║"
echo "║     • Analista Financiero  • Asistente SAT             ║"
echo "║     • Predictor Cash Flow  • Auditor Automático        ║"
echo "║     • Chatbot CFO                                       ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Presiona Ctrl+C para detener todo"
echo ""

# Mantener script corriendo
wait $BACKEND_PID $FRONTEND_PID
