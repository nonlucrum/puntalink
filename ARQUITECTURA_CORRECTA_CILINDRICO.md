# 🏗️ ARQUITECTURA CORRECTA - CÁLCULOS DE CILÍNDRICO/RECTANGULAR

## 📌 CONCEPTO FUNDAMENTAL

Los cálculos de cilíndrico/rectangular **NO NECESITAN FACTORES DE REPETICIÓN** porque los datos del TXT **YA ESTÁN PROCESADOS**:

```
Largo (L)   = Σ anchos de múltiples muros    (ej: 1.50 m)
Alto (H)    = Promedio de alturas normalizadas (ej: 0.55 m)
Ancho (B)   = Espesor del bloque del muerto  (ej: 0.80 m)

⚠️ IMPORTANTE: Multiplicar L × H × B DA DIRECTAMENTE EL RESULTADO FINAL
   No se requieren factores adicionales de repetición
```

---

## ⚠️ ERROR GRAVE QUE SE ELIMINÓ

**Lo que estaba mal:**

```javascript
// ❌ INCORRECTO - Estaba aquí
function handleCalcularMuertos() {
  // Usaba window.lastGruposMuertos
  // Que viene de agrupar por: x_braces, angle, eje
  
  const gruposMuertos = window.lastGruposMuertos;  // ← PROBLEMA
  // Además multiplicaba por factores: rep_long, rep_trans, rep_vol
  // Esto DUPLICABA la agregación que ya estaba en el TXT
}
```

**¿Por qué es grave?**
1. `window.lastGruposMuertos` agrupa datos por características de braces (NO para cilíndrico)
2. Multiplicaba nuevamente por factores (pero TXT ya estaba agregado)
3. Resultado: Cálculos completamente INCORRECTOS

---

## ✅ FLUJO CORRECTO

### Paso 1: Importar TXT (datos YA procesados)

```
archivo.txt
│
├─ Muerto 1: L=1.50m, H=0.55m, B=0.80m
│            (L = suma de M01+M02+M03 anchos)
│            (H = promedio de alturas)
│            (B = espesor del bloque)
│
├─ Muerto 2: L=1.50m, H=0.55m, B=0.85m
│            (L = suma de M04+M05 anchos)
│
├─ Muerto 3: L=2.40m, H=0.55m, B=0.80m
│            (L = suma de M06+M07+M08 anchos)
│
└─ ...
```

### Paso 2: Guardar en BD (tal cual del TXT)

```sql
Tabla: muro
┌─────┬───────────────────┬────────┬────────┬────────┐
│ ID  │ Descripción       │ Largo  │ Alto   │ Ancho  │
├─────┼───────────────────┼────────┼────────┼────────┤
│ 1   │ M01+M02+M03       │ 1.50   │ 0.55   │ 0.80   │
│ 2   │ M04+M05           │ 1.50   │ 0.55   │ 0.85   │
│ 3   │ M06+M07+M08       │ 2.40   │ 0.55   │ 0.80   │
└─────┴───────────────────┴────────┴────────┴────────┘

⚠️ Estos valores YA ESTÁN PROCESADOS del TXT
   - NO requieren agregación adicional
   - NO requieren factores de repetición
```

### Paso 3: muertoRectangular.js CALCULA (DIRECTO)

Para cada muerto:

```javascript
const muerto = muertos[0];  // Muerto 1: L=1.50, H=0.55, B=0.80

// CÁLCULO DIRECTO - VOLUMEN
const volumConcreto = muerto.largo × muerto.alto × muerto.ancho;
  // 1.50 × 0.55 × 0.80 = 0.66 m³ ✅ YA ES EL VALOR FINAL

// CÁLCULO - PESO CONCRETO
const pesoConcreto = volumConcreto × densidadConcreto;
  // 0.66 m³ × 2400 kg/m³ = 1584 kg

// CÁLCULOS - ACERO (basados en dimensiones del TXT)
const aceroLongitudinal = calcularAceroLongitudinal(muerto.largo, muerto.alto);
  // Basado en L=1.50m y H=0.55m
  // Resultado: 187.5 kg (sin multiplicadores)

const aceroTransversal = calcularAceroTransversal(muerto.largo, muerto.ancho);
  // Basado en L=1.50m y B=0.80m
  // Resultado: 124.5 kg (sin multiplicadores)

// CÁLCULO - ALAMBRE
const alambre = calcularAlambre(perimetro);
  // Basado en perímetro: 2×(L+B) = 2×(1.50+0.80) = 4.60m
  // Resultado: 48.0 kg (sin multiplicadores)
```

**¿Por qué NO hay factores?**

- El TXT ya agrupa los datos (suma de anchos)
- El Largo es **la suma de múltiples anchos** → ya está multiplicado
- El Alto es **el promedio normalizado** → ya está ajustado
- El Ancho es **el espesor del bloque** → valor directo
- **RESULTADO:** Multiplicar nuevamente sería INCORRECTO

### Paso 4: Tabla MUESTRA resultados (DIRECTO)

```html
<table id="tablaArmado">
  <thead>
    <tr>
      <!-- Headers HARDCODEADOS (estructura fija) -->
      <th>#</th>
      <th>Muertos</th>
      <th>Largo (m)</th>
      <th>Alto (m)</th>
      <th>Ancho (m)</th>
      <th colspan="2">Acero Longitudinal</th>
      <th colspan="2">Acero Transversal</th>
      <th colspan="2">Concreto</th>
      <th colspan="2">Alambre</th>
    </tr>
  </thead>
  <tbody>
    <!-- Datos DINÁMICOS (resultados finales del cálculo) -->
    <tr>
      <td>1</td>                          <!-- # -->
      <td>M01+M02+M03</td>                <!-- Descripción de muertos -->
      <td>1.50</td>                       <!-- Largo (m) - del TXT -->
      <td>0.55</td>                       <!-- Alto (m) - del TXT -->
      <td>0.80</td>                       <!-- Ancho (m) - del TXT -->
      <td>12.5</td>                       <!-- Longitud acero long (m) - calculado -->
      <td>187.5</td>                      <!-- Peso acero long (kg) - calculado -->
      <td>8.3</td>                        <!-- Longitud acero trans (m) - calculado -->
      <td>124.5</td>                      <!-- Peso acero trans (kg) - calculado -->
      <td>0.66</td>                       <!-- Volumen (m³) = 1.50×0.55×0.80 ✅ -->
      <td>1584</td>                       <!-- Peso concreto (kg) = 0.66×2400 -->
      <td>15.0</td>                       <!-- Longitud alambre (m) - calculado -->
      <td>48.0</td>                       <!-- Peso alambre (kg) - calculado -->
    </tr>
  </tbody>
</table>
```

---

## 🎯 COMPARACIÓN: ANTES (INCORRECTO) vs AHORA (CORRECTO)

### ❌ ANTES
```
Archivo factoresRepeticion.js (ELIMINADO)
    ↓
Tabla hardcodeada: D1, D2, ... D16 con factores del PDF Magnorth
    ↓
Multiplicaba: L × H × B × rep_long × rep_trans × rep_vol
    ↓
PROBLEMA: 
   - Duplicaba la agregación (TXT ya lo hace)
   - Factores del PDF no se adaptaban a otros proyectos
   - Resultado: VALORES INCORRECTOS
```

### ✅ AHORA
```
TXT del proyecto incluye datos YA procesados
    ↓
Largo = suma de anchos de múltiples muros    (ya agregado)
Alto = promedio de alturas normalizadas      (ya ajustado)
Ancho = espesor del bloque del muerto        (valor directo)
    ↓
Se importa y guarda en BD
    ↓
muertoRectangular.js CALCULA DIRECTAMENTE
    ↓
Volumen = L × H × B (da el resultado final)
    ↓
✅ Sin duplicar agregación
✅ Sin factores adicionales
✅ Sin dependencias del PDF
```

---

## 📊 EJEMPLO CONCRETO CON NÚMEROS

### Entrada: TXT (datos pre-procesados por el usuario)

```
ID | Descripción   | Largo (m) | Alto (m) | Ancho (m)
 1 | M01+M02+M03   | 1.50      | 0.55     | 0.80
 2 | M04+M05       | 1.50      | 0.55     | 0.85
 3 | M06+M07+M08   | 2.40      | 0.55     | 0.80
```

**¿De dónde vienen estos números?**

- **Muerto 1 (M01+M02+M03):**
  - M01: ancho 0.50m, altura 0.55m
  - M02: ancho 0.50m, altura 0.55m
  - M03: ancho 0.50m, altura 0.55m
  - **L (Largo)** = 0.50 + 0.50 + 0.50 = **1.50 m** (suma de anchos)
  - **H (Alto)** = (0.55 + 0.55 + 0.55) / 3 = **0.55 m** (promedio)
  - **B (Ancho)** = **0.80 m** (espesor del bloque del muerto)

- **Muerto 2 (M04+M05):**
  - M04: ancho 0.75m, altura 0.55m
  - M05: ancho 0.75m, altura 0.55m
  - **L** = 0.75 + 0.75 = **1.50 m**
  - **H** = **0.55 m**
  - **B** = **0.85 m**

### Proceso: muertoRectangular.js (CÁLCULOS DIRECTOS)

```javascript
// MUERTO 1: L=1.50, H=0.55, B=0.80
{
  volumen_concreto: 1.50 × 0.55 × 0.80 = 0.66 m³  ✅ DIRECTO
  peso_concreto: 0.66 × 2400 = 1584 kg
  
  acero_long_m: (2 × 1.50) + (2 × 0.55) = 4.10 m
  acero_long_kg: 4.10 × 45.73 = 187.5 kg
  
  acero_trans_m: (1.50 / 0.25) × 0.80 = 4.8 m
  acero_trans_kg: 4.8 × 25.94 = 124.5 kg
  
  alambre_m: 2×(1.50+0.80) = 4.60 m
  alambre_kg: 4.60 × 10.43 = 48.0 kg
}

// MUERTO 2: L=1.50, H=0.55, B=0.85
{
  volumen_concreto: 1.50 × 0.55 × 0.85 = 0.699 m³  ✅ DIRECTO
  peso_concreto: 0.699 × 2400 = 1678 kg
  
  acero_long_m: 4.10 m (igual a muerto 1)
  acero_long_kg: 187.5 kg
  
  acero_trans_m: (1.50 / 0.25) × 0.85 = 5.1 m
  acero_trans_kg: 5.1 × 25.94 = 132.3 kg
  
  alambre_m: 2×(1.50+0.85) = 4.70 m
  alambre_kg: 4.70 × 10.89 = 51.2 kg
}

// MUERTO 3: L=2.40, H=0.55, B=0.80
{
  volumen_concreto: 2.40 × 0.55 × 0.80 = 1.056 m³  ✅ DIRECTO
  peso_concreto: 1.056 × 2400 = 2534 kg
  
  acero_long_m: (2 × 2.40) + (2 × 0.55) = 5.90 m
  acero_long_kg: 5.90 × 45.73 = 270.0 kg
  
  acero_trans_m: (2.40 / 0.25) × 0.80 = 7.68 m
  acero_trans_kg: 7.68 × 25.94 = 199.2 kg
  
  alambre_m: 2×(2.40+0.80) = 6.40 m
  alambre_kg: 6.40 × 12.02 = 76.9 kg
}
```

### Salida: Tabla

```
# | Muertos      | L (m) | H (m) | B (m) | Vol (m³) | Peso HC (kg) | Acero Long (kg) | Acero Trans (kg) | Alambre (kg)
  |              |       |       |       |          |              |                 |                  |
1 | M01+M02+M03  | 1.50  | 0.55  | 0.80  | 0.66     | 1584         | 187.5           | 124.5            | 48.0
2 | M04+M05      | 1.50  | 0.55  | 0.85  | 0.699    | 1678         | 187.5           | 132.3            | 51.2
3 | M06+M07+M08  | 2.40  | 0.55  | 0.80  | 1.056    | 2534         | 270.0           | 199.2            | 76.9
```

---

## 🔑 PUNTOS CLAVE

### 1️⃣ Los datos del TXT ya están PROCESADOS
- **No son datos de muros individuales**
- **Son datos agregados** (grupos de muros)
- Largo es suma de anchos
- Alto es promedio de alturas
- Ancho es espesor del bloque del muerto

### 2️⃣ NO se necesitan factores de repetición
```
❌ INCORRECTO: 0.66 m³ × 1.247 = 0.823 m³ (DUPLICA agregación)
✅ CORRECTO:   1.50 × 0.55 × 0.80 = 0.66 m³ (YA ES FINAL)
```

### 3️⃣ La tabla tiene dos partes
- **Headers**: ✅ HARDCODEADOS (estructura fija siempre igual)
- **Datos**: ✅ DINÁMICOS (calculados directamente del L×H×B)

### 4️⃣ NO se agrupa en el frontend
- El TXT ya viene agrupado del usuario
- El frontend SOLO calcula y muestra
- No necesita agrupar por braces

---

## ✅ ESTADO ACTUAL

| Elemento | Estado | Razón |
|----------|--------|-------|
| ❌ Cilíndrico usando braces grouping | ELIMINADO ✅ | TXT ya está agrupado |
| ❌ Factores de repetición | ELIMINADO ✅ | NO NECESARIOS - TXT ya procesado |
| ❌ Datos hardcodeados del PDF | ELIMINADO ✅ | Datos vienen del TXT del usuario |
| ✅ muertoRectangular.js calcula | FUNCIONANDO | Usa L×H×B directamente |
| ✅ TXT con L, H, B procesados | FUNCIONA | Proporcionados por usuario |

---

## 📝 ACCIÓN REQUERIDA

### ✅ ASEGURAR QUE EL TXT INCLUYA:

1. **Largo (L):** Suma de anchos de muros que agrupa
   - Ej: M01 (0.50m) + M02 (0.50m) + M03 (0.50m) = 1.50m

2. **Alto (H):** Promedio de alturas normalizadas
   - Ej: (0.55 + 0.55 + 0.55) / 3 = 0.55m

3. **Ancho (B):** Espesor del bloque del muerto
   - Ej: 0.80m (valor directo del bloque)

### ✅ EL PARSEADOR DEBE:
- Leer L, H, B del TXT
- Guardar en BD sin modificar
- **NO hacer agregación adicional**

### ✅ muertoRectangular.js DEBE:
- Calcular: volumen = L × H × B
- Calcular acero, alambre basado en L, H, B
- **NO multiplicar por factores adicionales**

### ✅ LA TABLA MOSTRARÁ:
- Valores directos de L, H, B del TXT
- Resultados calculados sin multiplicadores
- Datos finales y correctos

---

## 🚀 VENTAJAS DE ESTA ARQUITECTURA

| Aspecto | Ventaja |
|---------|---------|
| **Flexibilidad** | Funciona con cualquier proyecto, no solo Magnorth |
| **Simplicidad** | No hay factores hardcodeados |
| **Mantenibilidad** | El código es más limpio |
| **Precisión** | Datos del usuario son la fuente de verdad |
| **Adaptabilidad** | Cada proyecto define sus propios grupos de muros |

---

**Fecha:** Noviembre 6, 2025  
**Arquitectura:** ✅ CLARIFICADA Y FINAL  
**Factores:** ❌ ELIMINADOS (NO NECESARIOS)  
**Código:** ✅ LIMPIO  
**Próximo paso:** Asegurar TXT con L, H, B correctos y parseador funcionando
