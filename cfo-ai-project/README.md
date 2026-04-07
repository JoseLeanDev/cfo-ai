# 🚀 CFO AI - Instrucciones de Instalación

## Requisitos Previos

- Node.js v18+ 
- npm o yarn

---

## ⚡ Instalación Rápida (3 pasos)

### 1. Instalar dependencias

```bash
# Backend
cd cfo-ai-project/backend
npm install

# Frontend (en otra terminal)
cd cfo-ai-project/frontend
npm install
```

### 2. Configurar base de datos

```bash
# En la carpeta backend
npm run migrate
npm run seed
```

### 3. Iniciar servidores

```bash
# Backend (puerto 3000)
npm run dev

# Frontend (puerto 3001)
npm run dev
```

---

## 🌐 Acceder a la aplicación

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health

---

## 📁 Estructura del Proyecto

```
cfo-ai-project/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── index.js         # Entry point
│   │   └── ...
│   ├── database/
│   │   ├── connection.js    # SQLite config
│   │   ├── migrate.js       # Crear tablas
│   │   └── seed.js          # Datos demo
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── hooks/           # Custom hooks
    │   ├── services/        # API client
    │   └── ...
    └── package.json
```

---

## 🛠️ Comandos Útiles

### Backend
```bash
npm run dev         # Desarrollo con hot-reload
npm start           # Producción
npm run migrate     # Crear tablas
npm run seed        # Insertar datos demo
```

### Frontend
```bash
npm run dev         # Servidor de desarrollo
npm run build       # Build para producción
npm run preview     # Previsualizar build
```

---

## 🎨 Características del Diseño (2026 Edition)

- ✅ Glassmorphism en cards
- ✅ Gradientes modernos
- ✅ Animaciones fluidas (60fps)
- ✅ Micro-interacciones
- ✅ Tipografía premium (Inter)
- ✅ Colores semánticos suaves
- ✅ Layout responsive
- ✅ Iconografía consistente

---

## 📊 Datos Demo Incluidos

La base de datos incluye:
- 1 empresa (DICSA Demo)
- 4 cuentas bancarias (GTQ/USD)
- 5 cuentas por cobrar
- 4 cuentas por pagar
- ~270 transacciones (3 meses)
- 4 obligaciones SAT
- 30 asientos contables

---

## 🔧 Solución de Problemas

### Error: Puerto ocupado
```bash
# Cambiar puerto del backend
PORT=3002 npm run dev

# Cambiar puerto del frontend
# Editar vite.config.js
```

### Error: SQLite no instalado
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Limpiar base de datos
```bash
rm database/cfo_ai.db
npm run migrate
npm run seed
```

---

## 🚢 Deploy a Vercel (Frontend)

```bash
cd frontend
npm run build

# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 📞 Soporte

¿Problemas? Verifica:
1. Node.js >= 18 (`node --version`)
2. Puertos 3000 y 3001 disponibles
3. Dependencias instaladas (`npm list`)

---

*CFO AI v1.0 - Plataforma Financiera Inteligente*
