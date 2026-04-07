# 📤 Subir CFO AI a GitHub (para Render.com)

## Método 1: GitHub CLI (Más fácil)

### Paso 1: Instalar GitHub CLI
```bash
# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y
```

### Paso 2: Login
```bash
gh auth login
# Selecciona:
# - GitHub.com
# - HTTPS
# - Login with a web browser (copia el código y pégalo en el navegador)
```

### Paso 3: Crear repo y subir
```bash
cd /root/.openclaw/workspace/cfo-ai-project

# Crear repositorio en GitHub
gh repo create cfo-ai --public --source=. --push
```

---

## Método 2: Git Manual (Sin GitHub CLI)

### Paso 1: Crear repo en GitHub (por web)
1. Ve a https://github.com/new
2. **Repository name:** `cfo-ai`
3. **Description:** `CFO AI - Sistema financiero multi-agente`
4. **Public** (o Private si prefieres)
5. **NO** marques "Add README"
6. Click **"Create repository"**

### Paso 2: Subir código
```bash
cd /root/.openclaw/workspace/cfo-ai-project

# Inicializar git
git init

# Agregar todo
git add .

# Commit
git commit -m "CFO AI v1.0 - Sistema multi-agente completo"

# Conectar con GitHub (reemplaza TU_USUARIO con tu username)
git remote add origin https://github.com/TU_USUARIO/cfo-ai.git

# Subir
git branch -M main
git push -u origin main
```

---

## ✅ Después de subir a GitHub

Tu código estará en:
```
https://github.com/TU_USUARIO/cfo-ai
```

Ahora puedes conectarlo a Render.com:
1. Ve a https://dashboard.render.com
2. New + → Web Service
3. Connect GitHub repository → Selecciona `cfo-ai`
4. Configura y deploy

---

## 🆘 Si tienes problemas

**Error: "fatal: unable to access"**
```bash
# Configura tus credenciales
git config --global user.email "tu@email.com"
git config --global user.name "Tu Nombre"
```

**Error: "rejected: non-fast-forward"**
```bash
# Fuerza el push (cuidado: sobrescribe todo en GitHub)
git push -f origin main
```

**No tienes cuenta GitHub?**
- Crea una gratis en https://github.com/signup

---

## 📁 Estructura del repo

Después de subir, tendrás:
```
cfo-ai/
├── backend/          ← Conecta esto a Render
│   ├── src/
│   ├── database/
│   ├── package.json
│   └── render.yaml
├── frontend/         ← Ya está en Vercel
└── README.md
```

¿Quieres que ejecute los comandos para subirlo ahora? ❤️‍🔥
