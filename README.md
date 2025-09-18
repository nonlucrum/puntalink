# PuntaLink

**PuntaLink** es un sistema web para el análisis y gestión de proyectos estructurales, permitiendo importar archivos `.TXT`, procesar y visualizar datos de muros, braces y pilares, y generar reportes.

Desarrollado en Node.js + Express (backend), PostgreSQL (base de datos), y HTML/CSS/JS puro (frontend).

---

## Características principales

- Importación de datos estructurales desde archivos `.TXT`.
- Visualización de paneles y resultados en tabla.
- Cálculo y manejo de muros, braces y pilares.
- Exportación de reportes.
- Separación clara de backend y frontend.

---

## Requisitos

- **Node.js** v18+ (LTS recomendado)  
- **npm** (incluido con Node.js)
- **PostgreSQL** v13+  
- (Opcional) **pgAdmin 4** o similar para administrar la BD
- **`serve`** o **`http-server`** para frontend (se instala con npm)

---

## Estructura del proyecto

puntalink/
│
├── backend/ # API REST, lógica servidor, conexión BD
│ ├── src/
│ ├── routes/
│ └── ...
│
├── frontend/
│ └── public/ # Interfaz web (index.html, script.js, styles.css)
│
├── docs/ # Manuales, diagramas, SQL (opcional)
├── README.md
├── .env.example # Ejemplo de configuración env
└── ...


## ⚙ Instalación y ejecución

### 1. Clonar el repositorio

git clone https://github.com/nonlucrum/puntalink.git
cd puntalink


## 2. Configurar la base de datos
Instala PostgreSQL y crea una base de datos llamada puntalink.

Ejecuta el script SQL de creación de tablas (ver /docs/estructura.sql o ejemplo abajo):

-- Ejemplo tabla usuario
CREATE TABLE usuario (
    pid SERIAL PRIMARY KEY,
    nombre VARCHAR(240) NOT NULL,
    correo VARCHAR(240) UNIQUE NOT NULL,
    password VARCHAR(45) NOT NULL
);
-- ... (agrega las otras tablas según corresponda)
Crea un usuario con permisos y anota el usuario/clave.

## 3. Configurar variables de entorno (.env)
Copia el ejemplo y edítalo:

cp backend/.env.example backend/.env

Edita los valores:
PGUSER=postgres
PGPASSWORD=tu_contraseña
PGDATABASE=puntalink
PGHOST=localhost
PGPORT=5432

4. Backend (API)

cd backend
npm install
npm run dev         # desarrollo con tsx (hot-reload)
# o para producción:
npm run build && npm start

Por defecto, corre en http://localhost:3000
Verifica en: http://localhost:3000/health

## 5. Frontend (Web)
En otra terminal:

cd frontend/public
npx serve . -l 5173

Abre: http://localhost:5173
Alternativa: Usa Live Server de VSCode.

## Notas de desarrollo y migración a TypeScript
Cómo correr el backend

npm install
npm run dev         

npm run build && npm start

Dónde pegar tu lógica
src/routes/* : reemplaza los handlers de ejemplo por tus rutas reales.
src/controllers/* : copia/convierte tus controladores JS aquí y exporta funciones tipadas.
src/services/* : igual que arriba para servicios y lógica reutilizable.
Las vistas y la carpeta public se copiaron desde el proyecto original.

## Notas de migración
app.js → src/app.ts
server.js → src/server.ts
Cambia require(...) por import ... from '...' (activado esModuleInterop en TS).
Si tus controladores JS usaban module.exports = { ... }, en TS usa export default { ... } o export const foo = ....

Para tipar Express en controladores:

import { Request, Response } from 'express';
export const procesar = (req: Request, res: Response) => { ... }
Dependencias con tipos ya incluidas: @types/express, @types/node, @types/morgan, @types/cors, @types/multer, @types/pdfkit.

## Sugerencias
Activa strict: true en tsconfig.json cuando termines de convertir todo el proyecto.

Convierte archivo por archivo: rutas → controladores → servicios.

## Uso básico
Abre el frontend en tu navegador.
Importa un archivo .TXT desde la sección correspondiente.
Visualiza los paneles y resultados.
Explora las funciones de cálculo y exportación.

Endpoints API principales
Ruta	Método	Descripción
/api/importar-muros	POST	Importa archivo TXT y procesa datos
/api/health	GET	Verifica si el backend está online
...	...	(Agrega los endpoints relevantes)

Casos de prueba recomendados
Importar archivo TXT válido → muestra datos en tabla.
Importar archivo TXT inválido → muestra error, no modifica datos previos.
Visualizar datos después de actualización o edición.
Intentar importar sin archivo → muestra mensaje de error.
Chequear que el backend y frontend corran por separado y se comuniquen correctamente.

Autores y contacto
Equipo PuntaLink / nonlucrum

Contacto: 
Ninoska Toledo (Product Owner): ninoska.toledo@outlook.com

GitHub: https://github.com/nonlucrum/puntalink

Herramientas recomendadas
Visual Studio Code + extensiones: ESLint, Prettier, Live Server.
pgAdmin 4 para gestión de base de datos.
Docker ( para despliegue en servidor).

Notas
No subas archivos .env reales ni claves sensibles al repo público.
Si tienes problemas de CORS, revisa la configuración en backend (usa cors).
Abre el frontend SIEMPRE usando un servidor local, no como archivo file:///.
