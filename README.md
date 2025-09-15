# PuntaLink Pro (mejorado)

Repositorio base (TypeScript + Express) para cargar archivos `.txt`/`.csv` con datos de paneles y ejecutar cálculos (frecuencias y estadísticos) útiles para el flujo de **PuntaLink**.

## Características
- API REST con Express (TypeScript).
- Endpoint para **subir y parsear** archivos `.txt`/`.csv` (`/api/import`).
- Endpoint para **procesar cálculos** a partir de datos tabulares (`/api/calculos/procesar`).
- Parser tolerante a coma decimal, separador coma o tab.
- Estructura modular (routes/controllers/services/lib).
- Lista para Docker y CI mínimo.

## Rutas
- `POST /api/import` → `multipart/form-data` con `file`: `.txt`/`.csv`. Responde filas parseadas.
- `POST /api/calculos/procesar` → JSON como:
  ```json
  {
    "datos": [
      {"Variable": 10, "Frecuencia": 3},
      {"Variable": 12, "Frecuencia": 2}
    ]
  }
  ```
  Devuelve resumen (media, mediana, moda, varianza, etc.) y frecuencias acumuladas.

## Uso local
```bash
cp .env.example .env
npm i
npm run dev
# Abrir http://localhost:3000
```

## Docker
```bash
docker compose up --build
```

## Estructura
```
src/
  app.ts
  server.ts
  routes/
    import.ts
    calculos.ts
  controllers/
    calculosController.ts
  services/
    calculos.ts
  lib/
    parser.ts
public/
  index.html
```

## Notas
- Adapta `src/lib/parser.ts` si tu TXT tiene encabezados distintos.
- Conecta tu lógica estructural a partir de `src/services/calculos.ts`.
