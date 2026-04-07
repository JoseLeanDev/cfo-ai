#!/bin/bash
# Script para mantener el tunnel del backend activo

TUNNEL_LOG="/tmp/backend_tunnel.log"
BACKEND_URL_FILE="/tmp/current_backend_url.txt"

echo "🔧 Iniciando tunnel permanente para CFO AI..."

while true; do
    # Matar procesos anteriores
    pkill -f "cloudflared.*localhost:3000" 2>/dev/null
    sleep 2
    
    # Iniciar nuevo tunnel
    cloudflared tunnel --url http://localhost:3000 > "$TUNNEL_LOG" 2>&1 &
    TUNNEL_PID=$!
    
    # Esperar a que genere la URL
    sleep 15
    
    # Extraer URL
    NEW_URL=$(grep -oE "https://[^[:space:]]+\.trycloudflare\.com" "$TUNNEL_LOG" | head -1)
    
    if [ -n "$NEW_URL" ]; then
        echo "✅ Tunnel activo: $NEW_URL"
        echo "$NEW_URL" > "$BACKEND_URL_FILE"
        
        # Verificar que funcione
        sleep 5
        if curl -s "${NEW_URL}/api/health" > /dev/null 2>&1; then
            echo "✅ Backend responde correctamente"
            echo "🌐 URL del API: ${NEW_URL}/api"
            
            # Mantener vivo por 45 minutos (los tunnels duran ~1 hora)
            sleep 2700
        else
            echo "⚠️ Backend no responde, reiniciando..."
        fi
    else
        echo "❌ No se pudo obtener URL, reiniciando..."
    fi
    
    kill $TUNNEL_PID 2>/dev/null
    sleep 5
done
