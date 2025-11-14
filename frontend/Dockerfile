FROM node:20-alpine

WORKDIR /app

# Instala serve globalmente
RUN npm install -g serve

# Copia el contenido de la carpeta actual al contenedor
COPY . .

EXPOSE 3008

# Usar serve.json para configuración sin cache
CMD ["serve", "public", "-l", "3008"]