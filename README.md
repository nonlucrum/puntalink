# PuntaLink TS Struct (TypeScript)

Base lista en **TypeScript + Express** para:
- Cargar archivos `.txt/.csv` (`/api/import`).
- Ejecutar **cálculos estructurales básicos** (`/api/estructural/calc`) y servir un front mínimo.

> Nota: Las fórmulas de `src/services/estructural.ts` son **plantillas** para que adaptes con tu **esquema de cálculos** (viento, "muertos" cilíndricos/aislados, etc.).

## Requisitos
- Node 18 o 20

## Uso
```bash
cp .env.example .env
npm i
npm run dev
# http://localhost:3000
```

### Endpoints
- `POST /api/import` → `multipart/form-data` con `file`.
- `POST /api/estructural/calc` → Body JSON de ejemplo:
```json
{
  "velocidadViento": 28,
  "coefForma": 1.2,
  "areaExpuesta": 12.5,
  "alturaPanel": 3.0,
  "anchoPanel": 4.2,
  "densidadHormigon": 2400,
  "seguridad": 1.5
}
```

## Dónde editar tus fórmulas
- `src/services/estructural.ts`: implementa/ajusta:
  - `calcularCargasBasicas()`
  - `dimensionarMuertos()`
  - `calcularEstructural()`

### Siguiente paso
Pásame tu **esquema exacto** (variables + ecuaciones) y te lo dejo integrado.
