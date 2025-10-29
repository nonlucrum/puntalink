# Implementación de Cálculo de Braces en Tiempo Real

## Cambios Implementados

### 1. Base de Datos y Modelos (Backend)
-  Agregados 4 nuevos campos al modelo `Muro`:
  - `tipo_brace_seleccionado` (VARCHAR): Tipo de brace (B4, B12, B14, B15)
  - `factor_w2` (NUMERIC): Factor multiplicador para selección de tipo
  - `x_inserto` (NUMERIC): Coordenada X del inserto (calculada)
  - `y_inserto` (NUMERIC): Coordenada Y del inserto (calculada)

-  Script de migración SQL: `backend/migration_add_brace_fields.sql`

### 2. Servicio de Cálculos (Backend)
-  **Nueva función `determinarTipoBrace()`**: Selecciona automáticamente el tipo de brace usando:
  - Fórmula: `(ALTO - NPT) * Factor_W2`
  - Umbrales: `Longitud_tipo * sen(ángulo)`
  - Tipos disponibles: B4, B12, B14, B15

-  **Función `calculateBraceForces()` reescrita** con nuevo flujo:
  1. Determinar TIPO (automático o manual)
  2. Calcular X = Longitud_tipo × cos(V)
  3. Calcular Y = NPT + Longitud_tipo × sen(V)
  4. Calcular FBx = (FV × Presión) / X
  5. Calcular FBy = FBx × sen(V)
  6. Calcular FB = √(FBx² + FBy²)
  7. Calcular CANTIDAD = max(2, ceil(FBx / Capacidad_tipo))

-  Capacidades definidas por tipo:
  - B12: 4100 kN
  - B4: 2950 kN
  - B14: 2360 kN
  - B15: 1723 kN

### 3. API (Backend)
-  **Nuevo endpoint**: `POST /api/calculos/muros/:pid/calcular-braces-tiempo-real`
  - Recibe: `angulo_brace`, `npt`, `tipo_brace_seleccionado` (opcional), `factor_w2`
  - Retorna: Todos los valores calculados SIN guardar en BD
  - Usado para cálculos en tiempo real tipo Excel

### 4. Interfaz de Usuario (Frontend)
-  **Configuración Global de Braces** actualizada:
  - Ángulo de Brace (0-90°)
  - NPT (Nivel de Piso Terminado)
  - Factor W2 (nuevo)
  - Botón "Aplicar a Todos los Muros"

-  **Nueva Tabla Editable de Braces** con columnas:
  
  **Parámetros Editables:**
  - Tipo Brace (dropdown: B4/B12/B14/B15)
  - Ángulo (°)
  - NPT (m)
  - Factor W2
  
  **Geometría del Inserto (calculados):**
  - X (m) - distancia horizontal
  - Y (m) - altura del inserto
  - Alto (m) - altura del muro
  
  **Fuerzas en Braces (calculadas):**
  - FBx (kN) - componente horizontal
  - FBy (kN) - componente vertical
  - FB (kN) - fuerza resultante
  
  **Cantidad (calculada):**
  - Braces - número total
  - Modelo - tipo principal con cantidad

### 5. Funcionalidad en Tiempo Real (Frontend)
- **Cálculo automático al editar**: Al cambiar cualquier valor editable (tipo, ángulo, NPT, factor), se dispara cálculo inmediato
-  **Sin guardar automático**: Los cambios solo se guardan al presionar "Guardar Todos los Cambios"
-  **Feedback visual**: Fila se resalta en verde al actualizar valores
-  **Aplicar valores globales**: Copia los valores de configuración a todos los muros y recalcula

### 6. Estilos (Frontend)
-  Tabla responsive con colores por sección
-  Inputs editables con hover y focus states
-  Valores calculados con fondo gris claro
-  Headers con colores para distinguir secciones

## Instrucciones de Despliegue

### Paso 1: Migrar la Base de Datos
```bash
# Desde Docker o terminal con acceso a PostgreSQL
psql -U <usuario> -d <base_de_datos> -f backend/migration_add_brace_fields.sql
```

### Paso 2: Compilar Backend
```bash
cd backend
npm run build
npm start
```

### Paso 3: Probar Frontend
1. Abrir `dashboard.html`
2. Crear/seleccionar proyecto
3. Importar paneles
4. Configurar parámetros de viento y braces globales
5. Hacer clic en "Calcular Cargas de Viento y Braces"
6. Editar valores en la tabla de braces (los cálculos se actualizan en tiempo real)
7. Hacer clic en "Guardar Todos los Cambios" para persistir

## Flujo de Trabajo

```
Usuario edita valor → 
  ↓
Event listener detecta cambio →
  ↓
calcularBracesTiempoReal() →
  ↓
POST /api/calculos/muros/:pid/calcular-braces-tiempo-real →
  ↓
calculateBraceForces() (con nueva lógica) →
  ↓
Retorna valores calculados →
  ↓
UI actualiza celdas calculadas →
  ↓
Feedback visual (verde)
```
##  Reglas de Cálculo

### Selección de Tipo de Brace
```
Magnitud = (ALTO - NPT) * Factor_W2
Umbral_tipo = Longitud_tipo * sen(ángulo)

Si magnitud ≥ Umbral_B15 → B15
Si magnitud ≥ Umbral_B14 → B14
Si magnitud ≥ Umbral_B12 → B12
Sino → B4
```

### Geometría del Inserto
```
X = Longitud_tipo * cos(ángulo)
Y = NPT + Longitud_tipo * sen(ángulo)
```

### Fuerzas
```
FBx = (Fuerza_Viento * Presión) / X
FBy = FBx * sen(ángulo)
FB = √(FBx² + FBy²)
```

### Cantidad de Braces
```
Cantidad = max(2, ceil(FBx / Capacidad_tipo))
Mínimo 2 por criterio de seguridad/simetría
```

## Validaciones

- Ángulo debe estar entre 0° y 90°
- X inserto debe ser > 0 (protección contra división por cero)
- Factor W2 debe ser > 0
- NPT puede ser cualquier número (incluso negativo)
- Advertencias si ángulo < 30° o > 60°

## Debug y Logs

Todos los cálculos tienen logs detallados:
- Frontend: `[BRACES-RT]` para cálculos en tiempo real
- Backend: `[CALCULOS]` para cálculos y `[BRACES]` para selección de tipo

## Ejemplo de Uso

1. **Configurar valores globales:**
   - Ángulo: 55°
   - NPT: 0.350 m
   - Factor W2: 1.0

2. **Calcular viento** → Se genera tabla editable

3. **Editar muro específico:**
   - Cambiar ángulo a 45° → Se recalculan X, Y, FBx, FBy, FB, Cantidad
   - Cambiar tipo a B14 → Se recalculan X, Y (nueva longitud)
   - Cambiar NPT a 0.500 → Se recalcula Y, posible cambio de tipo

4. **Guardar cambios** → Se persisten en base de datos
