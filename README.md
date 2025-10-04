# PuntaLink

**PuntaLink** es un sistema web para el análisis y gestión de proyectos estructurales, permitiendo importar archivos `.TXT`, procesar y visualizar datos de muros, realizar cálculos para braces y deadman, y generar reportes.

Desarrollado en Node.js + Express (backend), PostgreSQL (base de datos), y HTML/CSS/JS puro (frontend).


## Características principales

- Importación de datos estructurales desde archivos `.TXT`.
- Visualización de paneles y resultados en tabla.
- Cálculo y manejo de muros, braces y deadman.
- Exportación de reportes.

## Requisitos

- **Node.js** v18+ (LTS recomendado)
- **Docker Desktop** v4.46+


## Estructura del proyecto

```
puntalink/
│
├── backend/ # API REST, lógica servidor, conexión BD
│ ├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
│
├── frontend/
│ └── public/ # Interfaz web (*.html, *.js, *.css)
│
├── data/ # Manuales, diagramas, SQL (opcional)
└── ...
```

## Descarga y despliegue de la aplicación

### 1. Preparar directorio del proyecto

El proyecto se puede descargar como un .zip o clonarse por medio de git.

### 2. Iniciar Docker Desktop

Docker Desktop se puede iniciar con la interfaz gráfica del sistema operativo o por medio de la consola.

- Linux:
    ```bat
    sudo systemctl start docker
    ```
- Windows:
    ```cmd
    docker desktop start
    ```

### 3. Levantar la aplicación

Estos comandos y los del paso 4 se realizan desde la carpeta raíz del proyecto.

- Para correr el proceso en foreground y ver los logs en la consola (pero dejar la consola anclada al proceso):
    ```cmd
    docker compose up --build
    ```
- Para correr el proceso en background (la consola queda liberada y puede ejecutar otros comandos):
    ```cmd
    docker compose up --build -d
    ```
    - Los logs se pueden ver en Docker Desktop o con el siguiente comando:
        ```cmd
        docker compose logs -f
        ```

### 4. Detener la aplicación

- Si está corriendo en foreground, usar la combinación de teclas <kbd>Ctrl</kbd> + <kbd>C</kbd>
    - Puede requerirse presionar otra tecla antes de que la detención se lleve a cabo.

- Si está corriendo en background:
    ```cmd
    docker compose down
    ```


## Contacto
Equipo Nonlucrum

Product Owner:\
Ninoska Toledo\
ninoska.toledo@outlook.com