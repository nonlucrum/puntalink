# 🗑️ DATOS HARDCODEADOS ELIMINADOS

## RESUMEN

Se identificaron y **ELIMINARON todos los datos hardcodeados que venían del PDF de Magnorth**. 

### ACLARACIÓN IMPORTANTE

Los "factores de repetición" NO son datos de entrada del usuario, sino **MULTIPLICADORES que se aplican a los RESULTADOS** calculados por `muertoRectangular.js`:

- `muertoRectangular.js` → **CALCULA** los valores base (acero, concreto, alambre)
- Factores de repetición → **MULTIPLICAN** esos resultados (factor × valor calculado)
- Tabla de resultados → **MUESTRA** los valores finales (con factores aplicados)

---

## 🗑️ QUÉ FUE ELIMINADO

### Archivo: `factoresRepeticion.js` (ELIMINADO)

**Ubicación anterior:** `frontend/public/js/factoresRepeticion.js`

**Contenido que tenía:**
```javascript
const FACTORES_REPETICION = {
  'D1':  { repLong: 1.2470588235, repTrans: 0.8880000000, repVol: 0.3135832877, repAlambre: 0.5828571429 },
  'D2':  { repLong: 4.8100000000, repTrans: 3.3500000000, repVol: 0.4657745034, repAlambre: 1.4285714286 },
  ... (D3-D16)
};
```

**¿Por qué estaba MAL?**
- ❌ Factores hardcodeados de UN PDF específico (Magnorth)
- ❌ No se podían cambiar sin modificar código
- ❌ No estaban en la BD
- ❌ No podían venir del TXT
- ❌ Eran específicos de UN proyecto en particular

---

## ✅ SOLUCIÓN CORRECTA

Los factores de repetición **DEBEN VENIR DEL TXT**, no de un PDF:

### Flujo correcto:

```
1. Importar TXT
   ↓
2. TXT contiene para CADA MUERTO (YA PROCESADO):
   - Largo (L): suma de anchos de múltiples muros
   - Alto (H): promedio de alturas normalizadas
   - Ancho (B): espesor del bloque
   
   ⚠️ IMPORTANTE: NO CONTIENE FACTORES
      Porque los datos YA ESTÁN AGREGADOS
   ↓
3. Guardar en BD
   ↓
4. muertoRectangular.js CALCULA
   L × H × B = Volumen final
   (Sin factores adicionales)
   ↓
5. Tabla MUESTRA resultados
```
   - Dimensiones (ancho, alto, largo)
   - Factores de repetición:
     * rep_long (multiplicador acero longitudinal)
     * rep_trans (multiplicador acero transversal)
     * rep_vol (multiplicador volumen concreto)
     * rep_alambre (multiplicador alambre)
   ↓
3. Calcular en muertoRectangular.js:
   - Longitud acero longitudinal
   - Longitud acero transversal
   - Volumen concreto
   - Longitud alambre
   ↓
4. Aplicar FACTORES DEL TXT:
   - pesoLong final = pesoLong_base × rep_long (del TXT)
   - pesoTrans final = pesoTrans_base × rep_trans (del TXT)
   - etc.
   ↓
5. Mostrar en tabla
```

---

## 📝 CAMBIOS REALIZADOS

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `factoresRepeticion.js` | ❌ Eliminado | ✅ Done |
| `factoresRepeticion.DEPRECATED.js` | ℹ️ Creado (referencia) | ✅ Done |
| `muertoRectangular.js` | Eliminado import | ✅ Done |
| `dashboard.html` | Eliminado script tag | ✅ Done |

---

## 🔧 COMPORTAMIENTO AHORA

```javascript
// En muertoRectangular.js
const factorLongitudinal = config.repLong ?? 1;    // Si no viene del TXT, usa 1.0
const factorTransversal = config.repTrans ?? 1;
const factorVolumen = config.repVol ?? 1;
const factorAlambre = config.repAlambre ?? 1;
```

**Actualmente:**
- ✅ Factores con valor 1.0 (sin multiplicación = valores base)
- ⏳ Esperando que vengan del TXT

---

## 📋 TODO - PRÓXIMOS PASOS

### Paso 1: Actualizar estructura del TXT

El TXT importado debe incluir para CADA MURO:

```
ID | Grosor | Area | Peso | Volumen | rep_long | rep_trans | rep_vol | rep_alambre
 1 |  0.15  | ...  | ...  | ...     | 1.247    | 0.888     | 0.314   | 0.583
 2 |  0.15  | ...  | ...  | ...     | 4.810    | 3.350     | 0.466   | 1.429
 ...
```

### Paso 2: Actualizar parseador del TXT

En `dashboard.js` → `handleUploadTxt()`:
- Leer columnas de factores del TXT
- Guardar en BD cuando se importa

### Paso 3: Pasar factores a muertoRectangular.js

Cuando se calcule el armado:
```javascript
for (const muro of muros) {
  const config = {
    ...basConfig,
    repLong: muro.rep_long,      // ← Del TXT
    repTrans: muro.rep_trans,    // ← Del TXT
    repVol: muro.rep_vol,        // ← Del TXT
    repAlambre: muro.rep_alambre // ← Del TXT
  };
  
  const resultado = calcularReporteMuerto(dimensiones, config);
}
```

### Paso 4: Mostrar en tabla

La tabla mostrará los resultados CON factores aplicados:

```
Muerto | Acero Long (m) | Acero Trans (m) | Concreto (m³) | Alambre (m)
       | (base × rep_long) | (base × rep_trans) | (base × rep_vol) | (base × rep_alambre)
```

---

## 📊 TABLA DE RESULTADOS - ESTRUCTURA

**Header HARDCODEADO (NO cambia):**
```html
<tr>
  <th>#</th>
  <th>Eje</th>
  <th>Muros</th>
  <th colspan="3">DEADMAN</th>
  <th colspan="4">Acero</th>
  <th colspan="2">Concreto</th>
  <th colspan="2">Alambre</th>
</tr>
```

**Datos (vienen de cálculo + factores del TXT):**
```
Largo (m) | Alto (m) | Ancho (m) | # | Long (m) | Peso | Trans (m) | Peso | Vol (m³) | Peso | Long (m) | Peso
```

---

## 🎯 FLUJO COMPLETO (CORRECTO)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. IMPORTAR TXT (con factores)                                  │
│    - Muros + Dimensiones + FACTORES DE REPETICIÓN               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. GUARDAR EN BD                                                │
│    - Tabla: muro                                                │
│      - pid, id_muro, ancho, alto, largo                         │
│      - rep_long, rep_trans, rep_vol, rep_alambre (DEL TXT)     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CALCULAR EN muertoRectangular.js                            │
│    - Toma: dimensiones (ancho, alto, largo)                    │
│    - Calcula: acero, concreto, alambre VALORES BASE            │
│    - Toma: factores (del muro en BD)                           │
│    - MULTIPLICA: resultado × factor                            │
│    - Retorna: valores finales                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. MOSTRAR EN TABLA                                             │
│    - Headers hardcodeados                                       │
│    - Datos calculados (con factores aplicados)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ CONCLUSIÓN

**Lo que se eliminó:**
- ❌ Factores hardcodeados del PDF en `factoresRepeticion.js`

**Lo que debe suceder ahora:**
- ✅ Factores vienen del TXT en cada muro
- ✅ Se guardan en BD con el muro
- ✅ Se pasan a `muertoRectangular.js` para ser aplicados
- ✅ Se muestran en tabla los resultados finales

**Tabla de resultados:** Solo muestra datos, está CORRECTAMENTE HARDCODEADA (estructura)

---

**Fecha:** Noviembre 6, 2025  
**Estado:** ✅ ELIMINADOS - Listos para recibir factores del TXT

