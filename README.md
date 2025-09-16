# Puntalink Pro TS Struct (TypeScript)

Este es un *scaffold* en TypeScript para migrar **puntalink-main**.
Incluye `tsconfig.json`, `package.json` listo para `tsx`, y rutas + servidor
con Express en TS.

## Cómo correr

```bash
npm install
npm run dev      # desarrollo con tsx
# o
npm run build && npm start
```

## Dónde pegar tu lógica
- `src/routes/*` : reemplaza los handlers de ejemplo por tus rutas reales.
- `src/controllers/*` : copia/convierte tus controladores JS aquí y exporta funciones tipadas.
- `src/services/*` : igual que arriba para servicios.
- Las vistas y la carpeta `public` fueron copiadas desde tu proyecto original.

## Notas de migración
- `app.js` -> `src/app.ts`
- `server.js` -> `src/server.ts`
- `require(...)` se cambia por `import ... from '...'` (activado `esModuleInterop`).
- Si tus controladores JS hacían `module.exports = { ... }`, en TS usa `export default { ... }` o `export const foo = ...`.
- Para tipar Express en controladores:
  ```ts
  import { Request, Response } from 'express';
  export const procesar = (req: Request, res: Response) => { ... }
  ```

## Dependencias con tipos
Ya están incluidas `@types/express`, `@types/node`, `@types/morgan`, `@types/cors`, `@types/multer`, `@types/pdfkit`.

## Sugerencias
- Activa `strict: true` en `tsconfig.json` cuando termines de convertir todo.
- Convierte archivo por archivo: rutas → controladores → servicios.
