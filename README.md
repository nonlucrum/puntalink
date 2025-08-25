# ✅ Resumen de Cambios Realizados a la Plantilla

---

## 📁 Backend

### 🔧 Cambios en el archivo `.env`
- Se dejó el siguiente valor para el usuario de base de datos:
  ```env
  DB_USER=root
  DB_PASSWORD=<usa MYSQL_ROOT_PASSWORD del archivo docker-compose.yml>
  ```
- Se reemplazó el valor de `DB_HOST` que decía `"localhost"` por `"db_test"`, que es el nombre del servicio de MariaDB en `docker-compose.yml`.

---

### 🕒 Agregado de archivo `wait-for-db.sh`
- Se detectó que el backend intentaba conectarse a la base de datos antes de que estuviera lista.
- Se creó el script `wait-for-db.sh` para esperar a que MariaDB esté accesible antes de iniciar el backend.

**Contenido del archivo:**
```sh
#!/bin/sh

echo "Esperando a que MariaDB esté disponible en $DB_HOST:$DB_PORT..."

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "MariaDB está disponible, iniciando backend..."
exec "$@"
```

---

### 🐳 Cambios en el `Dockerfile`
Se modificó el `Dockerfile` para:

1. Instalar `netcat`.
2. Copiar y dar permisos al script `wait-for-db.sh`.
3. Usar el script como punto de entrada del contenedor.

**Nuevo Dockerfile:**
```dockerfile
FROM node:14

WORKDIR /app

COPY Backend/package*.json ./

RUN apt-get update && apt-get install -y netcat

RUN npm install

COPY Backend ./

COPY Backend/wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

EXPOSE 3000

CMD ["/wait-for-db.sh", "npm", "start"]
```

---

### 🌐 Corrección de CORS en `app.js`
- Se resolvió un error de CORS usando el paquete `cors`, aceptando el origen `http://127.0.0.1:3000`.

**Configuración en el `.env`:**
```env
ORIGIN=http://127.0.0.1:3000
```

**Uso en `app.js`:**
```js
import cors from 'cors';

app.use(cors({
  origin: process.env.ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

### ⚠️ Corrección de IP en servidor Express
- Se identificó que `process.env.IP` estaba definido como `"localhost"`, lo cual impedía conexiones externas.
- Se eliminó el uso de esa variable y se forzó el backend a escuchar en `0.0.0.0`.

**Código actualizado:**
```js
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
```

---

## 📁 Frontend

### 🌍 Cambios en el archivo `.env`
- Se reemplazó:
  ```env
  VITE_APP_HOST=localhost
  ```
  por:
  ```env
  VITE_APP_HOST=0.0.0.0
  ```

- Se añadió la variable:
  ```env
  VITE_BACKEND_URL=http://127.0.0.1:4000
  ```

---

### 🧩 Corrección de importaciones sensibles a mayúsculas
En el archivo `src/components/User.jsx` se encontraron importaciones como:

```js
import Formulario from './User/Formulario';
import ListaUsuarios from './User/ListaUsuario';
```

Pero la carpeta correcta es `user` (en minúsculas). En sistemas Linux esto genera errores.

**Soluciones:**

1. Renombrar la carpeta a `User`, o
2. Corregir las importaciones:

```js
import Formulario from './user/Formulario';
import ListaUsuarios from './user/ListaUsuario';
```