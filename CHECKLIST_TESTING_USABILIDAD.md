# ✅ Checklist de Testing - Mejoras de Usabilidad

## 🎯 Objetivo
Verificar que todas las mejoras de usabilidad funcionen correctamente en el navegador.

---

## 📋 TESTS OBLIGATORIOS

### ✨ TEST 1: Tooltips Contextuales

#### Pasos:
1. [ ] Abrir `http://localhost:3008/dashboard`
2. [ ] Scroll hasta la sección "Configuración de Braces"
3. [ ] Buscar el campo **"Factor W2"**
4. [ ] Pasar el cursor sobre el icono **`i`** junto al label

#### ✅ Resultado Esperado:
```
┌─────────────────────────────────────────────┐
│ Factor de reducción según normativa NSR-10  │
│ Título J. Valor fijo de 0.6 para cálculo   │
│ de tipo de brace requerido. Este valor no  │
│ es editable.                                 │
└─────────────────────────────────────────────┘
```

#### 🔍 Verificar:
- [ ] Tooltip aparece al hover
- [ ] Tooltip desaparece al quitar cursor
- [ ] Texto es legible (fondo oscuro, texto blanco)
- [ ] Tooltip NO se sale de la pantalla

---

### ⚠️ TEST 2: Confirmación de Acciones Masivas

#### Pasos:
1. [ ] Primero calcular cargas de viento (debe haber muros en la tabla)
2. [ ] En "Configuración de Braces", cambiar:
   - Ángulo global: `60`
   - NPT global: `0.400`
3. [ ] Clic en **"Aplicar a Todos los Muros"**

#### ✅ Resultado Esperado:
```
┌─────────────────────────────────────────────┐
│              ¿Aplicar a todos los muros?    │
│                                              │
│  Esto cambiará el ángulo y NPT de 232 muros.│
│                                              │
│  Ángulo: 60°                                 │
│  NPT: 0.4 m                                  │
│                                              │
│  Esta acción recalculará todos los braces.  │
│                                              │
│         [Cancelar]     [Sí, aplicar]        │
└─────────────────────────────────────────────┘
```

#### 🔍 Verificar:
- [ ] Modal aparece centrado
- [ ] Fondo blur visible detrás del modal
- [ ] Número de muros correcto (según tu proyecto)
- [ ] Valores mostrados coinciden con inputs
- [ ] Presionar **ESC** cierra el modal SIN aplicar cambios
- [ ] Clic en **"Cancelar"** cierra modal SIN aplicar
- [ ] Clic en **"Sí, aplicar"** ejecuta la acción

---

### 🔔 TEST 3: Notificaciones Toast - Success

#### Pasos:
1. [ ] Con muros en tabla y valores globales configurados
2. [ ] Clic en **"Aplicar a Todos los Muros"**
3. [ ] Confirmar en el modal

#### ✅ Resultado Esperado:
En **esquina superior derecha** aparece:
```
┌─────────────────────────────────────┐
│ ✅ Éxito                        [×] │
│ Valores aplicados correctamente a   │
│ 232 muros                           │
└─────────────────────────────────────┘
```

#### 🔍 Verificar:
- [ ] Toast aparece en esquina superior derecha
- [ ] Color verde (success)
- [ ] Icono ✅ visible
- [ ] Texto claro y legible
- [ ] **Se oculta solo después de ~4 segundos**
- [ ] Botón `×` cierra el toast manualmente

---

### ❌ TEST 4: Notificaciones Toast - Error

#### Pasos:
1. [ ] En la sección "Parámetros de Viento"
2. [ ] **Dejar vacío** el campo "Velocidad del Viento"
3. [ ] Clic en **"Calcular Cargas de Viento y Braces"**

#### ✅ Resultado Esperado:
```
┌─────────────────────────────────────┐
│ ⚠️ Advertencia                  [×] │
│ Complete correctamente:             │
│ velocidad_viento. Todos los valores │
│ deben ser números válidos.          │
└─────────────────────────────────────┘
```

#### 🔍 Verificar:
- [ ] Toast aparece (color amarillo/naranja)
- [ ] Icono ⚠️ visible
- [ ] Mensaje menciona campos faltantes
- [ ] Se oculta después de ~6 segundos

---

### ⚡ TEST 5: Debouncing en Inputs

#### Pasos:
1. [ ] Abrir **Consola del navegador** (F12 → Console)
2. [ ] Tener tabla de resultados visible
3. [ ] En la tabla, buscar columna "Ángulo"
4. [ ] Cambiar valor escribiendo rápidamente: `55` → `60` → `65`

#### ✅ Resultado Esperado en Consola:
```
[BRACES] Input event disparado: angulo
[BRACES] Input event disparado: angulo
[BRACES] Input event disparado: angulo
... (esperando 300ms) ...
[BRACES] Calculando braces en tiempo real...
```

#### 🔍 Verificar:
- [ ] NO se ejecuta cálculo por cada tecla presionada
- [ ] Se ejecuta cálculo **solo DESPUÉS de 300ms** de dejar de escribir
- [ ] Consola muestra logs de input events
- [ ] Cálculo final es correcto (valores actualizados en tabla)

---

### 📊 TEST 6: Múltiples Tooltips

#### Pasos:
1. [ ] Probar tooltip en **"Ángulo de Brace"**
2. [ ] Probar tooltip en **"NPT"**
3. [ ] Probar tooltip en **"Velocidad del Viento"**
4. [ ] Probar tooltip en **"Temperatura Promedio"**

#### ✅ Resultado Esperado:
Cada tooltip debe:
- [ ] Mostrar información relevante al campo
- [ ] Aparecer al hover
- [ ] Desaparecer al quitar cursor
- [ ] No solaparse con otros elementos

---

### 🛠️ TEST 7: Errores User-Friendly

#### Pasos:
1. [ ] **Detener el backend** (cerrar servidor Docker/Node)
2. [ ] En el navegador, intentar calcular cargas de viento
3. [ ] Observar el mensaje de error

#### ✅ Resultado Esperado:
```
┌─────────────────────────────────────┐
│ ❌ Error                        [×] │
│ No se puede conectar al servidor.   │
│ Por favor, verifica tu conexión e   │
│ intenta nuevamente.                 │
└─────────────────────────────────────┘
```

#### ❌ NO debe mostrar:
```
❌ Error: ECONNREFUSED 127.0.0.1:4008
❌ TypeError: Cannot read property 'data' of undefined
❌ Network request failed at line 342
```

#### 🔍 Verificar:
- [ ] Mensaje es comprensible (sin tecnicismos)
- [ ] Usuario sabe qué hacer ("verifica tu conexión")
- [ ] Toast tipo error (rojo)
- [ ] No se muestra stack trace

---

### 🔄 TEST 8: Múltiples Notificaciones

#### Pasos:
1. [ ] Abrir consola del navegador
2. [ ] Ejecutar en consola:
```javascript
mostrarNotificacion('Mensaje 1', 'info');
mostrarNotificacion('Mensaje 2', 'success');
mostrarNotificacion('Mensaje 3', 'warning');
mostrarNotificacion('Mensaje 4', 'error');
```

#### ✅ Resultado Esperado:
Esquina superior derecha muestra **stack de 4 notificaciones**:
```
┌─────────────────────┐
│ ℹ️ Info        [×] │
│ Mensaje 1           │
└─────────────────────┘
┌─────────────────────┐
│ ✅ Éxito       [×] │
│ Mensaje 2           │
└─────────────────────┘
┌─────────────────────┐
│ ⚠️ Advertencia [×] │
│ Mensaje 3           │
└─────────────────────┘
┌─────────────────────┐
│ ❌ Error       [×] │
│ Mensaje 4           │
└─────────────────────┘
```

#### 🔍 Verificar:
- [ ] Las 4 notificaciones son visibles
- [ ] Se apilan verticalmente
- [ ] Cada una tiene su color correcto
- [ ] Desaparecen en orden (primero la más antigua)

---

## 🎨 TESTS VISUALES

### TEST 9: Responsive Design

#### Pasos:
1. [ ] Abrir DevTools (F12)
2. [ ] Cambiar tamaño de ventana a diferentes resoluciones
3. [ ] Probar tooltips y modales en cada tamaño

#### 🔍 Verificar:
- [ ] Tooltips se ajustan a la pantalla (no se salen)
- [ ] Modales centrados en todas las resoluciones
- [ ] Toast notifications visibles en mobile
- [ ] Texto legible en pantallas pequeñas

---

### TEST 10: Animaciones

#### Pasos:
1. [ ] Observar animación de **modal de confirmación** (slide-up)
2. [ ] Observar animación de **toast** (slide-in desde derecha)
3. [ ] Observar animación de **tooltip** (fade-in)

#### 🔍 Verificar:
- [ ] Modal aparece con efecto "subir" (slideUp)
- [ ] Toast entra desde la derecha (slideInRight)
- [ ] Tooltip aparece suavemente (fadeIn)
- [ ] Todas las animaciones son fluidas (no se ven entrecortadas)

---

## 🐛 TESTS DE REGRESIÓN

### TEST 11: Funcionalidad NO afectada

#### 🔍 Verificar que SIGUE funcionando:
- [ ] Importación de TXT
- [ ] Cálculo de cargas de viento
- [ ] Edición de ángulo/NPT por muro
- [ ] Guardado de braces
- [ ] Generación de PDF
- [ ] Edición de proyecto

---

## 📊 CHECKLIST FINAL

### ✅ Completar antes de dar por terminado:

- [ ] Todos los tooltips funcionan
- [ ] Confirmación funciona en "Aplicar a todos"
- [ ] Toast success se muestra correctamente
- [ ] Toast warning/error se muestran correctamente
- [ ] Debouncing reduce llamadas API
- [ ] Errores se formatean a mensajes user-friendly
- [ ] Múltiples toasts se apilan correctamente
- [ ] Animaciones son fluidas
- [ ] Funcionalidad previa NO se rompió
- [ ] Consola del navegador NO muestra errores

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: Tooltips no aparecen
**Solución**:
- Verificar que `usability.js` se carga correctamente
- Abrir consola, escribir `window.Usability` → debe mostrar objeto

### Problema 2: Toast notifications no se ven
**Solución**:
- Verificar CSS de `.toast-container` (debe tener z-index alto)
- Verificar que no haya errores en consola

### Problema 3: Modal de confirmación no aparece
**Solución**:
- Verificar que función `confirmar` está disponible
- En consola: `typeof confirmar` → debe mostrar "function"

### Problema 4: Debouncing no funciona
**Solución**:
- Verificar en consola logs: `[BRACES] listeners agregados con debounce`
- Si no aparece, `debounce` puede ser `undefined`

---

## 📝 Reporte de Resultados

### Formato:

```
FECHA: __________
NAVEGADOR: Chrome / Firefox / Safari / Edge
VERSIÓN: __________

✅ TESTS PASADOS: __ / 11
❌ TESTS FALLIDOS: __

DETALLES:
- TEST 1 (Tooltips): ✅ / ❌
- TEST 2 (Confirmación): ✅ / ❌
- TEST 3 (Toast Success): ✅ / ❌
- TEST 4 (Toast Error): ✅ / ❌
- TEST 5 (Debouncing): ✅ / ❌
- TEST 6 (Múltiples Tooltips): ✅ / ❌
- TEST 7 (Errores User-Friendly): ✅ / ❌
- TEST 8 (Múltiples Toasts): ✅ / ❌
- TEST 9 (Responsive): ✅ / ❌
- TEST 10 (Animaciones): ✅ / ❌
- TEST 11 (No regresión): ✅ / ❌

OBSERVACIONES:
_________________________________
_________________________________
_________________________________
```

---

## 🎓 NOTAS

- **Tiempo estimado de testing**: 15-20 minutos
- **Requiere**: Backend ejecutándose (para algunos tests)
- **Browser recomendado**: Chrome 90+ o Firefox 88+
- **Consola abierta**: F12 → Console (para ver logs)

**¡Éxito en el testing!** 🚀

