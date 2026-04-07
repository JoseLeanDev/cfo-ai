# 📦 CFO AI Backend - Listo para Deploy

## 🚀 Deploy Rápido a Render.com (5 minutos)

### Opción 1: Deploy con Blueprint (Automático)

1. **Crea cuenta gratis en** https://render.com
2. **Conecta tu GitHub** (o sube el código directamente)
3. **Crea un nuevo Web Service:**
   - Ve a Dashboard → "New +" → "Web Service"
   - Selecciona este repositorio/carpeta

4. **Configura el servicio:**
   ```
   Name: cfo-ai-backend
   Runtime: Node
   Build Command: npm install && npm run migrate && npm run seed
   Start Command: npm start
   Plan: Free
   ```

5. **Agrega Environment Variable:**
   - Key: `NODE_ENV`
   - Value: `production`

6. **Click "Create Web Service"**

7. **Espera ~2 minutos** a que termine el deploy

8. **Obtendrás una URL como:**
   ```
   https://cfo-ai-backend.onrender.com
   ```

### Opción 2: Deploy con Docker

Si prefieres usar Docker:

```bash
# Build
docker build -t cfo-ai-backend .

# Run
docker run -p 10000:10000 cfo-ai-backend
```

En Render selecciona "Docker" como runtime.

---

## 🔗 Configurar Frontend (Vercel)

Una vez que tengas la URL de Render:

1. Ve a https://vercel.com
2. Entra a tu proyecto `frontend`
3. Settings → Environment Variables
4. Actualiza `VITE_API_URL`:
   ```
   https://cfo-ai-backend.onrender.com/api
   ```
5. Redeploy automático

---

## ✅ URLs Finales

```
Frontend: https://frontend-blond-rho-55.vercel.app
Backend:  https://cfo-ai-backend.onrender.com/api
```

---

## 🆘 Si tienes problemas

**Error: "Database is locked"**
- En Render usa el disco persistente (ya configurado en render.yaml)

**Error: CORS**
- Verifica que VITE_API_URL esté correctamente configurado en Vercel

**Backend no responde:**
- Verifica logs en Render Dashboard → Logs

---

## 📞 Soporte

¿Problemas? Los logs están en:
- Render Dashboard → tu servicio → Logs
