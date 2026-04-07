FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar código
COPY . .

# Crear directorio para la base de datos
RUN mkdir -p database

# Puerto
EXPOSE 10000

# Comando de inicio
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]
