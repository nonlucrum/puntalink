# IMPLEMENTACIÓN DEL SISTEMA DE BRACES
## Fecha: 2025-10-24

## RESUMEN DE CAMBIOS

### 1. MODELO DE DATOS (Muro.ts)
✅ **Agregados nuevos campos a la interfaz `Muro`:**
- `angulo_brace`: Ángulo manual editable por muro (grados)
- `npt`: Nivel de Piso Terminado manual editable (metros)
- `x_braces`: Cantidad total de braces
- `fbx`, `fby`, `fb`: Fuerzas calculadas del brace (kN)
- `cant_b14`, `cant_b12`, `cant_b04`, `cant_b15`: Cantidades por tipo de brace
- `muertos`: Valor fijo = 1 (para conteo de muertos)
- `tipo_construccion`: TILT-UP o PRECAZT

✅ **Nuevas funciones creadas:**
- `addMuro()`: Actualizada para incluir todos los campos nuevos
- `getMurosByProject()`: Actualizada para retornar campos nuevos
- `updateMuroEditableFields()`: Para actualizar ángulo, NPT, X y tipo
- `updateMuroBraceCalculations()`: Para actualizar fuerzas y cantidades calculadas

### 2. BASE DE DATOS
✅ **Scripts SQL creados:**
- `migration_add_brace_fields.sql`: Migración para agregar columnas a tabla existente
- `puntalink.sql`: Schema principal actualizado con nuevos campos

✅ **Nuevas columnas en tabla `muro`:**
```sql
angulo_brace DECIMAL(10,2)       -- Ángulo manual
npt DECIMAL(10,3)                -- NPT manual
x_braces INT DEFAULT 0           -- Cantidad de braces
fbx DECIMAL(10,2) DEFAULT 0      -- Fuerza X
fby DECIMAL(10,2) DEFAULT 0      -- Fuerza Y
fb DECIMAL(10,2) DEFAULT 0       -- Fuerza total
cant_b14 INT DEFAULT 0           -- Cantidad B14
cant_b12 INT DEFAULT 0           -- Cantidad B12
cant_b04 INT DEFAULT 0           -- Cantidad B04
cant_b15 INT DEFAULT 0           -- Cantidad B15
muertos INT DEFAULT 1            -- Siempre 1
tipo_construccion VARCHAR(20) DEFAULT 'TILT-UP'
```

### 3. SERVICIO DE CÁLCULOS (calculosService.ts)
✅ **Nueva interfaz creada:**
```typescript
interface BraceCalculationResult {
  x_braces: number;
  fbx: number;
  fby: number;
  fb: number;
  cant_b14: number;
  cant_b12: number;
  cant_b04: number;
  cant_b15: number;
  observaciones: string[];
}
```

✅ **Nueva función implementada:**
```typescript
calculateBraceForces(
  fuerza_viento_kN: number,
  x_braces: number,
  angulo_grados: number
): BraceCalculationResult
```

**Lógica de cálculo:**
1. `FB = Fuerza_viento / X` (fuerza por brace)
2. `FBx = FB × cos(ángulo) × X` (componente horizontal)
3. `FBy = FB × sin(ángulo) × X` (componente vertical)

**Distribución por tipo:**
- B15: FB ≥ 100 kN (alta capacidad)
- B14: 75 ≤ FB < 100 kN (media-alta)
- B12: 50 ≤ FB < 75 kN (media)
- B04: FB < 50 kN (estándar)

**Validaciones:**
- Ángulo < 30°: Advertencia (componente horizontal muy alta)
- Ángulo > 60°: Advertencia (componente vertical muy alta)
- 30° ≤ Ángulo ≤ 60°: Rango óptimo

### 4. FLUJO DE TRABAJO NUEVO

#### Entrada de Datos:
1. Usuario ingresa **ángulo** y **NPT** globalmente
2. Sistema aplica estos valores a todos los muros
3. Usuario puede **editar** ángulo y NPT para cada muro individualmente
4. Usuario ingresa **X** (cantidad de braces) para cada muro

#### Cálculos Automáticos:
1. Sistema calcula **fuerza de viento** por muro
2. Sistema calcula **FB, FBx, FBy** usando `calculateBraceForces()`
3. Sistema determina **tipo de brace** (B14/B12/B04/B15) según capacidad
4. Sistema asigna **muertos = 1** (fijo)
5. Sistema guarda todo en base de datos

## PRÓXIMOS PASOS PENDIENTES

### 🔴 CRÍTICO - Ejecutar Migración:
```bash
# Cuando Docker esté corriendo:
docker-compose up -d
docker-compose exec db psql -U postgres -f /docker-entrypoint-initdb.d/migration_add_brace_fields.sql
```

### 🟡 BACKEND - Actualizar Controllers:
- [ ] Actualizar `calculosController.ts` para usar `calculateBraceForces()`
- [ ] Crear endpoint para actualizar campos editables: `PUT /api/muros/:pid/editable`
- [ ] Integrar cálculo de braces en el flujo de cálculos de viento

### 🟢 FRONTEND - Crear Interfaces:
- [ ] Formulario global para ángulo y NPT iniciales
- [ ] Tabla editable con columnas:
  - Ángulo (editable)
  - NPT (editable)
  - X - Cantidad braces (editable)
  - FBx, FBy, FB (calculados, read-only)
  - B14, B12, B04, B15 (calculados, read-only)
  - Muertos (fijo = 1)
  - Tipo construcción (editable: dropdown TILT-UP/PRECAZT)
- [ ] Botón "Aplicar a todos" para ángulo y NPT
- [ ] Auto-cálculo al cambiar X o ángulo

### 🔵 DOCUMENTACIÓN:
- [ ] Actualizar README con nuevas funcionalidades
- [ ] Documentar fórmulas de cálculo de braces
- [ ] Crear guía de usuario para ingreso manual de datos

## NOTAS IMPORTANTES

1. **Muertos siempre = 1**: Este campo NO debe cambiar, es para conteo
2. **Ángulo y NPT**: Son manuales, NO se calculan automáticamente
3. **Tipos de braces**: B14, B12, B04, B15 (fijos, no personalizables)
4. **Distribución**: Solo se asigna UN tipo de brace por muro según capacidad

## COMPATIBILIDAD

✅ Los cambios son **retrocompatibles**:
- Columnas nuevas tienen valores DEFAULT
- Muros existentes se actualizan con defaults
- Funciones antiguas siguen funcionando
- No se eliminó ninguna funcionalidad existente
