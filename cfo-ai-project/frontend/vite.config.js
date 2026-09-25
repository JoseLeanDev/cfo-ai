import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En producción el backend de cfo-ai sirve este build desde su propio proceso,
// así que `/api` es mismo origen y no hay nada que configurar.
//
// En desarrollo Vite hace proxy de `/api`. Por defecto apunta al backend local
// (`npm start` en ../backend, puerto 3000). Para trabajar solo el frontend
// contra el demo desplegado:
//   VITE_API_PROXY_TARGET=https://cfo-ai-backend-4n29.onrender.com npm run dev
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:3000'
  const proxy = {
    '/api': { target, changeOrigin: true, secure: target.startsWith('https') },
  }

  return {
    plugins: [react()],
    server: { port: 3001, proxy },
    preview: { port: 3001, proxy },
    build: { outDir: 'dist', sourcemap: true },
  }
})
