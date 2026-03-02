# Usa una imagen oficial de Node.js
FROM node:20

# Instala LibreOffice headless para conversión DOCX → PDF
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice-core libreoffice-writer && \
    rm -rf /var/lib/apt/lists/*

# Crea el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código
COPY . .

ENV PORT=4008
# Expone el puerto
EXPOSE 4008

RUN npm run build

# Comando para iniciar la app
CMD ["npm", "start"]