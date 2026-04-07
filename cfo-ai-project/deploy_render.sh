#!/bin/bash
# Deploy CFO AI Backend a Render.com

echo "═══════════════════════════════════════════════════════════"
echo "       DEPLOY CFO AI BACKEND A RENDER.COM"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar que Render CLI está instalado
if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI no encontrado. Instalando..."
    npm install -g @render/cli 2>/dev/null || {
        echo "❌ No se pudo instalar Render CLI"
        echo ""
        echo "Instálalo manualmente:"
        echo "  npm install -g @render/cli"
        exit 1
    }
fi

# Verificar login
render whoami > /dev/null 2>&1 || {
    echo "🔐 Necesitas hacer login en Render:"
    echo "  render login"
    exit 1
}

echo "✅ Render CLI instalado y autenticado"
echo ""

# Crear servicio
echo "🚀 Creando servicio en Render..."
cd /root/.openclaw/workspace/cfo-ai-project/backend

# Deploy usando blueprints
render blueprint apply render.yaml || {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  MANUAL: Crea el servicio en https://dashboard.render.com"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Paso 1: Ve a https://dashboard.render.com"
    echo "Paso 2: Click 'New +' → 'Web Service'"
    echo "Paso 3: Conecta tu repo o sube el código"
    echo "Paso 4: Configura:"
    echo "  • Name: cfo-ai-backend"
    echo "  • Runtime: Node"
    echo "  • Build Command: npm install && npm run migrate && npm run seed"
    echo "  • Start Command: npm start"
    echo "  • Plan: Free"
    echo ""
    echo "Paso 5: Agrega Environment Variables:"
    echo "  • NODE_ENV = production"
    echo ""
    echo "Paso 6: Click 'Create Web Service'"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    exit 1
}

echo ""
echo "✅ Servicio creado exitosamente"
echo ""
echo "Render te dará una URL como:"
echo "  https://cfo-ai-backend.onrender.com"
echo ""
echo "Usa esa URL para actualizar el frontend en Vercel:"
echo "  VITE_API_URL=https://cfo-ai-backend.onrender.com/api"
