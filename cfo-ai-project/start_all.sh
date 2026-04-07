#!/bin/bash
# Iniciar CFO AI completamente

echo "🚀 Iniciando CFO AI..."

# 1. Verificar backend
cd /root/.openclaw/workspace/cfo-ai-project/backend

# Matar procesos viejos
pkill -f "nodemon.*cfo" 2>/dev/null
pkill -9 -f "node.*3000" 2>/dev/null
sleep 2

# Iniciar backend
npm run dev > /tmp/backend.log 2>&1 &
echo "✅ Backend iniciando en puerto 3000..."

# Esperar a que esté listo
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Backend listo"
        break
    fi
    sleep 1
done

# 2. Iniciar tunnel
pkill -f "cloudflared.*3000" 2>/dev/null
sleep 2

cloudflared tunnel --url http://localhost:3000 > /tmp/tunnel.log 2>&1 &
echo "🌐 Iniciando tunnel..."

# Esperar URL
for i in {1..20}; do
    URL=$(grep -oE "https://[^[:space:]]+\.trycloudflare\.com" /tmp/tunnel.log 2>/dev/null | head -1)
    if [ -n "$URL" ]; then
        echo ""
        echo "=========================================="
        echo "🎉 CFO AI LISTO"
        echo "=========================================="
        echo ""
        echo "🌐 Frontend (Vercel):"
        echo "   https://frontend-blond-rho-55.vercel.app"
        echo ""
        echo "⚙️  Backend API:"
        echo "   $URL/api"
        echo ""
        echo "📊 Health Check:"
        echo "   $URL/api/health"
        echo ""
        echo "🤖 Agentes API:"
        echo "   $URL/api/agents"
        echo ""
        echo "⚠️  El tunnel expira en ~1 hora"
        echo "=========================================="
        
        # Guardar URL para referencia
        echo "$URL" > /tmp/current_backend_url.txt
        break
    fi
    sleep 1
done

echo ""
echo "Logs disponibles en:"
echo "  Backend: /tmp/backend.log"
echo "  Tunnel:  /tmp/tunnel.log"
