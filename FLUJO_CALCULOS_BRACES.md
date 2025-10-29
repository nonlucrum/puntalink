# Flujo de Cálculos de Braces - Sistema de Tiempo Real

##  Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vanilla JS)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  dashboard.html - Tabla Unificada                      │ │
│  │  - Muestra datos del muro + resultados viento + braces │ │
│  │  - Campos editables: Tipo, Ángulo, NPT                │ │
│  │  - Factor W2: FIJO en 0.6 (no editable)               │ │
│  │  - Valores calculados: X, Y, FBx, FBy, FB, Cantidad   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓ event listeners                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  script.js                                             │ │
│  │  - agregarListenersCalculoTiempoReal()                 │ │
│  │  - calcularBracesTiempoReal()                          │ │
│  │  - guardarTodosBraces()                                │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP POST
                         │ /api/calculos/muros/:pid/calcular-braces-tiempo-real
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (TypeScript/Node)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  routes/calculosRoutes.ts                              │ │
│  │  - POST /muros/:pid/calcular-braces-tiempo-real       │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  controllers/calculosController.ts                     │ │
│  │  - calcularBracesTiempoReal()                          │ │
│  │  - Obtiene muro de BD (área, altura)                  │ │
│  │  - Calcula fuerza viento simplificada                 │ │
│  │  - Llama a calculateBraceForces()                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  services/calculosService.ts                           │ │
│  │  - calculateBraceForces()                              │ │
│  │  - Implementa fórmulas de normativa                    │ │
│  │  - Retorna resultados SIN guardar en BD               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura de Archivos

### **Frontend**

| Archivo | Ubicación | Responsabilidad |
|---------|-----------|----------------|
| `dashboard.html` | `frontend/public/` | Estructura HTML de la tabla unificada |
| `script.js` | `frontend/public/` | Lógica de eventos y comunicación con API |
| `styles.css` | `frontend/public/` | Estilos de tabla, inputs editables y scroll |

### **Backend**

| Archivo | Ubicación | Responsabilidad |
|---------|-----------|----------------|
| `calculosRoutes.ts` | `backend/src/routes/` | Define ruta POST para cálculo en tiempo real |
| `calculosController.ts` | `backend/src/controllers/` | Endpoint HTTP que coordina el flujo |
| `calculosService.ts` | `backend/src/services/` | Lógica de cálculo (fórmulas de normativa) |
| `Muro.ts` | `backend/src/models/` | Modelo de datos con campos de braces |

---

##  Flujo de Ejecución Detallado

### **1. Inicio - Carga de Datos**

```
Usuario abre dashboard.html
  ↓
Importa muros desde TXT
  ↓
Presiona "Calcular Viento"
  ↓
Backend calcula: FV, Presión, YCG, etc.
  ↓
Frontend muestra tabla unificada con:
  - Datos del muro (ID, Alto, Ancho, etc.)
  - Resultados de viento (Fuerza, Presión, YCG)
  - Campos editables iniciales (Tipo=B12, Ángulo=55°, NPT=0.35, Factor W2=0.6)
  - Valores calculados vacíos (-, -, -, -, -, -)
  ↓
agregarListenersCalculoTiempoReal() se ejecuta
  - Busca todos los .input-calculo-rt
  - Agrega listeners de 'input' y 'change'
```

### **2. Edición en Tiempo Real**

```
Usuario cambia un valor (ej: Ángulo de 55° a 60°)
  ↓
Event listener detecta el cambio
  ↓
calcularBracesTiempoReal(pid) se ejecuta
  ↓
Frontend envía POST a:
  /api/calculos/muros/:pid/calcular-braces-tiempo-real
  
  Body: {
    angulo_brace: 60,
    npt: 0.35,
    tipo_brace_seleccionado: 'B12',
    factor_w2: 0.6  // FIJO - siempre 0.6
  }
  ↓
Backend:
  1. Obtiene muro de BD (SELECT * FROM muro WHERE pid = :pid)
  2. Lee área y altura del muro
  3. Calcula fuerza viento: FV = 0.85 kPa × área
  4. Llama a calculateBraceForces() con:
     - fuerza_viento_kN
     - presion_kPa (0.85)
     - alto_m
     - angulo_grados (60)
     - npt (0.35)
     - factor_w2 (0.6) - CONSTANTE
     - tipo_manual ('B12')
  ↓
calculateBraceForces() ejecuta cálculos:
  1. Determina tipo de brace (si no es manual)
  2. Calcula X = Longitud_tipo × cos(ángulo)
  3. Calcula Y = NPT + Longitud_tipo × sen(ángulo)
  4. Calcula YCG = alto / 2
  5. Calcula FBx = (FV × YCG) / Y
  6. Calcula FBy = FBx × sen(ángulo)
  7. Calcula FB = √(FBx² + FBy²)
  8. Calcula Cantidad = max(2, ceil(FBx / Capacidad_tipo))
  ↓
Backend retorna JSON:
  {
    success: true,
    calculo: {
      tipo_brace: 'B12',
      x_inserto: 4.875,
      y_inserto: 8.797,
      fbx: 45.23,
      fby: 39.05,
      fb: 59.71,
      cant_braces: 2
    }
  }
  ↓
Frontend actualiza DOM:
  - Busca celdas con data-pid=":pid"
  - Actualiza valores de X, Y, FBx, FBy, FB, Cantidad
  - Aplica formato (2 decimales)
```

### **3. Guardado en Base de Datos**

```
Usuario presiona "Guardar Todos los Braces"
  ↓
guardarTodosBraces() se ejecuta
  ↓
Frontend recolecta datos de TODAS las filas:
  - Lee valores editables de cada muro
  - Lee valores calculados mostrados
  ↓
Envía PUT a: /api/calculos/muros/:pid/editable
  Para cada muro con Body: {
    angulo_brace: valor,
    npt: valor,
    tipo_brace_seleccionado: valor,
    factor_w2: valor,
    x_inserto: valor_calculado,
    y_inserto: valor_calculado
  }
  ↓
Backend ejecuta UPDATE en tabla muro
  ↓
Frontend muestra mensaje de éxito
```

---

## Fórmulas Implementadas

### **Paso 1: Determinar Tipo de Brace (Automático)**
```typescript
const umbral = (alto_m - npt) * factor_w2;
const longitud_sen = longitud_brace * Math.sin(angulo_rad);

if (umbral >= longitud_sen) {
  // B14, B15, o B12 según disponibilidad
} else {
  tipo = 'B4';
}
```

### **Paso 2: Calcular Coordenadas del Inserto**
```typescript
X = Longitud_tipo × cos(ángulo)
Y = NPT + Longitud_tipo × sen(ángulo)
```

**Longitudes por tipo:**
- B4: 4.6 m
- B12: 9.75 m
- B14: 12.75 m
- B15: 15.8 m

### **Paso 3: Calcular Centro de Gravedad**
```typescript
YCG = alto_muro / 2
```

### **Paso 4: Calcular Fuerza Horizontal (FBx)**
```typescript
FBx = (Fuerza_viento × YCG) / Y
```
 **FÓRMULA CORREGIDA** (antes estaba mal como `(FV × Presión) / X`)

### **Paso 5: Calcular Fuerza Vertical (FBy)**
```typescript
FBy = FBx × sen(ángulo)
```

### **Paso 6: Calcular Fuerza Resultante (FB)**
```typescript
FB = √(FBx² + FBy²)
```

### **Paso 7: Calcular Cantidad de Braces**
```typescript
Cantidad = max(2, ceil(FBx / Capacidad_tipo))
```

**Capacidades por tipo:**
- B12: 4100 kN
- B4: 2950 kN
- B14: 2360 kN
- B15: 1723 kN

---

##  Endpoints API

### **POST** `/api/calculos/muros/:pid/calcular-braces-tiempo-real`

**Descripción:** Calcula fuerzas de braces en tiempo real SIN guardar en BD

**Parámetros:**
- `:pid` (path param): ID del muro

**Body (JSON):**
```json
{
  "angulo_brace": 55,
  "npt": 0.35,
  "tipo_brace_seleccionado": "B12",
  "factor_w2": 0.6
}
```

**Respuesta (JSON):**
```json
{
  "success": true,
  "calculo": {
    "tipo_brace": "B12",
    "x_inserto": 5.592,
    "y_inserto": 8.337,
    "fbx": 50.90,
    "fby": 41.69,
    "fb": 65.79,
    "cant_braces": 2,
    "cant_b14": 0,
    "cant_b12": 2,
    "cant_b04": 0,
    "cant_b15": 0,
    "observaciones": [
      "Tipo de brace: B12 (manual)",
      "Demanda: 50.90 kN, Capacidad B12: 4100 kN",
      "Cantidad de braces: 2 (mínimo 2 por criterio de seguridad)",
      "Ángulo 55° en rango óptimo (30°-60°)"
    ]
  }
}
```

**Errores:**
- `400`: PID inválido o parámetros faltantes
- `404`: Muro no encontrado
- `500`: Error interno del servidor

---

### **PUT** `/api/calculos/muros/:pid/editable`

**Descripción:** Guarda valores editables y calculados en la base de datos

**Parámetros:**
- `:pid` (path param): ID del muro

**Body (JSON):**
```json
{
  "angulo_brace": 55,
  "npt": 0.35,
  "tipo_brace_seleccionado": "B12",
  "factor_w2": 0.6,  // FIJO - siempre 0.6
  "x_inserto": 5.592,
  "y_inserto": 8.337
}
```

**Respuesta (JSON):**
```json
{
  "message": "Campos editables actualizados correctamente",
  "muro": {
    "pid": 3000,
    "angulo_brace": 55,
    "npt": 0.35,
    // ... otros campos
  }
}
```

---

##  Elementos de UI

### **Inputs Editables** (`.input-editable`)
- **Tipo de Brace** (`<select>`): B4, B12, B14, B15
- **Ángulo** (`<input type="number">`): 0-90 grados
- **NPT** (`<input type="number">`): Metros
- **Factor W2** (`<input type="number">`): Adimensional (típico 0.6)

### **Valores Calculados** (`.valor-calculado`)
- **X (m)**: Distancia horizontal del inserto
- **Y (m)**: Altura del inserto
- **FBx (kN)**: Fuerza horizontal
- **FBy (kN)**: Fuerza vertical
- **FB (kN)**: Fuerza resultante
- **Cantidad**: Número de braces necesarios

**Estilos:**
- Fondo: `#e8f4fd` (azul claro)
- Texto: `#000` (negro)
- Font-weight: `600`
- Solo lectura (no editables)

---

## 🔍 Funciones Clave

### **Frontend** (`script.js`)

#### `agregarListenersCalculoTiempoReal()`
```javascript
// Ubicación: frontend/public/script.js (línea ~760)
// Responsabilidad: Adjuntar event listeners a todos los inputs editables
// Ejecuta: calcularBracesTiempoReal(pid) en cada cambio
```

#### `calcularBracesTiempoReal(pid)`
```javascript
// Ubicación: frontend/public/script.js (línea ~790)
// Responsabilidad: 
//   1. Leer valores actuales de inputs
//   2. POST a /api/calculos/muros/:pid/calcular-braces-tiempo-real
//   3. Actualizar DOM con resultados
// Parámetros: pid (number) - ID del muro
```

#### `guardarTodosBraces()`
```javascript
// Ubicación: frontend/public/script.js (línea ~850)
// Responsabilidad:
//   1. Recolectar datos de todas las filas
//   2. PUT a /api/calculos/muros/:pid/editable para cada muro
//   3. Mostrar mensaje de éxito/error
```

### **Backend** (`calculosController.ts`)

#### `calcularBracesTiempoReal()`
```typescript
// Ubicación: backend/src/controllers/calculosController.ts (línea ~305)
// Responsabilidad:
//   1. Validar parámetros
//   2. Obtener muro de BD
//   3. Calcular fuerza viento
//   4. Llamar a calculateBraceForces()
//   5. Retornar JSON con resultados
```

### **Backend** (`calculosService.ts`)

#### `calculateBraceForces()`
```typescript
// Ubicación: backend/src/services/calculosService.ts (línea ~880)
// Responsabilidad: Implementar las 8 fórmulas de normativa
// Parámetros:
//   - fuerza_viento_kN: number
//   - presion_kPa: number
//   - alto_m: number
//   - angulo_grados: number
//   - npt?: number (default 0)
//   - factor_w2?: number (default 1.0)
//   - tipo_manual?: string (opcional)
// Retorna: BraceCalculationResult
```

#### `determinarTipoBrace()`
```typescript
// Ubicación: backend/src/services/calculosService.ts (línea ~830)
// Responsabilidad: Selección automática de tipo según umbrales
// Parámetros: alto_m, npt, angulo_grados, factor_w2
// Retorna: 'B4' | 'B12' | 'B14' | 'B15'
```

---

##  Modelo de Datos

### **Tabla: `muro`**

**Columnas para Braces:**
```sql
-- Valores editables por el usuario
angulo_brace REAL DEFAULT 55,
npt REAL DEFAULT 0,
tipo_brace_seleccionado VARCHAR(10),
factor_w2 NUMERIC(10,4) DEFAULT 0.6,  -- FIJO en 0.6

-- Valores calculados
x_inserto NUMERIC(10,3),
y_inserto NUMERIC(10,3),

-- Valores legacy (mantener compatibilidad)
x_braces INTEGER,
fbx NUMERIC(10,2),
fby NUMERIC(10,2),
fb NUMERIC(10,2),
cant_b14 INTEGER,
cant_b12 INTEGER,
cant_b04 INTEGER,
cant_b15 INTEGER
```

---

## Optimizaciones

### **1. Cálculo Sin Guardar**
- Los cálculos en tiempo real NO tocan la base de datos
- Solo el botón "Guardar" persiste los cambios
- Reduce latencia y carga del servidor

### **2. Event Debouncing**
- Los listeners reaccionan inmediatamente (`input` event)
- No hay throttling/debouncing para sensación instantánea
- El servidor puede manejar ~20-30 requests/segundo sin problema

### **3. Actualización Selectiva del DOM**
- Solo se actualizan las celdas del muro modificado
- Se usa `querySelector` específico con `data-pid`
- No se re-renderiza toda la tabla

---

##  Debugging

### **Logs del Frontend**
```javascript
console.log('[BRACES] Inputs encontrados:', inputs.length);
console.log('[BRACES] Agregando listener:', { campo, pid });
console.log('[BRACES] Input event disparado:', { pid, campo, valor });
```

### **Logs del Backend**
```typescript
console.log('[CALCULOS-RT] Calculando braces en tiempo real para muro PID:', pid);
console.log('[CALCULOS-RT] Parámetros:', { angulo_brace, npt, tipo_brace_seleccionado, factor_w2 });
console.log('[CALCULOS-RT] Datos del muro: área=...m², alto=...m, FV=...kN');
console.log('[CALCULOS] CALCULO DE BRACES (Nuevo método):');
console.log('  - Fuerza viento: ... kN');
console.log('  - YCG: ... / 2 = ... m');
console.log('  - FBx: (...  × ...) / ... = ... kN');
```


---

##  Validaciones

### **Frontend**
- Ángulo: 0° < ángulo < 90°
- NPT: NPT ≥ 0
- Factor W2: Factor ≥ 0
- Advertencia si ángulo < 30° o > 60°

### **Backend**
- Validación de PID
- Validación de área y altura del muro
- División por cero en X e Y
- Valores numéricos válidos

---


