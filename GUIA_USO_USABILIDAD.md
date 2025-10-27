# 🎓 Guía de Uso - API de Usabilidad

## 📚 Introducción

Este documento explica cómo usar las funciones de usabilidad implementadas en `frontend/public/js/usability.js`.

**Acceso**: Todas las funciones están disponibles en `window.Usability`

---

## 1️⃣ Notificaciones Toast

### Función: `mostrarNotificacion(mensaje, tipo, duracion)`

**Descripción**: Muestra una notificación elegante en la esquina superior derecha.

### Parámetros:
- `mensaje` (string): Texto a mostrar
- `tipo` (string): `'success'` | `'error'` | `'warning'` | `'info'`
- `duracion` (number, opcional): Milisegundos antes de desaparecer (default: 4000)

### Ejemplos:

```javascript
// Success (verde, )
mostrarNotificacion('Datos guardados correctamente', 'success');

// Error (rojo, )
mostrarNotificacion('No se pudo conectar al servidor', 'error');

// Warning (amarillo, )
mostrarNotificacion('Algunos campos están vacíos', 'warning');

// Info (azul, )
mostrarNotificacion('El proceso puede tardar unos minutos', 'info');

// Con duración personalizada (10 segundos)
mostrarNotificacion('Mensaje importante', 'warning', 10000);

// Sin auto-cierre (duración = 0)
mostrarNotificacion('Error crítico - Acción requerida', 'error', 0);
```

### Uso en catch blocks:

```javascript
try {
  const response = await fetch('/api/datos');
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error);
  }
  
  mostrarNotificacion('Datos cargados exitosamente', 'success');
  
} catch (error) {
  console.error('Error:', error);
  mostrarNotificacion(
    formatearError(error), // ← Convierte error técnico a user-friendly
    'error'
  );
}
```

---

## 2️⃣ Diálogos de Confirmación

### Función: `confirmar(mensaje, titulo, opciones)`

**Descripción**: Muestra un modal de confirmación y retorna `Promise<boolean>`

### Parámetros:
- `mensaje` (string): Texto explicativo
- `titulo` (string, opcional): Título del modal (default: "¿Estás seguro?")
- `opciones` (object, opcional):
  - `confirmText` (string): Texto botón confirmar (default: "Confirmar")
  - `cancelText` (string): Texto botón cancelar (default: "Cancelar")
  - `tipo` (string): `'default'` | `'danger'` | `'warning'`

### Ejemplos:

```javascript
// Confirmación simple
const confirmado = await confirmar('Esta acción no se puede deshacer');

if (confirmado) {
  console.log('Usuario confirmó');
} else {
  console.log('Usuario canceló');
}
```

```javascript
// Confirmación de eliminación (botón rojo)
const eliminar = await confirmar(
  'Se eliminarán 50 registros permanentemente',
  '¿Eliminar registros?',
  {
    confirmText: 'Sí, eliminar',
    cancelText: 'No, cancelar',
    tipo: 'danger'
  }
);

if (eliminar) {
  await eliminarRegistros();
  mostrarNotificacion('Registros eliminados', 'success');
}
```

```javascript
// Confirmación de acción masiva
async function aplicarCambiosMasivos() {
  const muros = document.querySelectorAll('.muro');
  
  const ok = await confirmar(
    `Esto cambiará ${muros.length} muros.\n\nEsta acción recalculará todos los valores.`,
    'Aplicar a todos los muros?',
    { tipo: 'warning' }
  );
  
  if (!ok) {
    console.log('Operación cancelada por el usuario');
    return;
  }
  
  // Proceder con cambios...
  for (const muro of muros) {
    // aplicar cambios
  }
  
  mostrarNotificacion('Cambios aplicados correctamente', 'success');
}
```

### Características especiales:
- ✅ Se cierra con tecla `ESC` (retorna `false`)
- ✅ Backdrop blur (desenfoque del fondo)
- ✅ Animación slide-up
- ✅ Tipo `danger` muestra botón rojo

---

## 3️⃣ Formateo de Errores

### Función: `formatearError(error)`

**Descripción**: Convierte errores técnicos en mensajes user-friendly

### Parámetros:
- `error` (Error | object): Objeto de error de JavaScript

### Retorna:
- `string`: Mensaje comprensible para el usuario

### Ejemplos:

```javascript
// Error de red
const error1 = new Error('ECONNREFUSED');
formatearError(error1);
// → "No se puede conectar al servidor. Verifica tu conexión."

// Error de base de datos
const error2 = { code: '23503', message: 'Foreign key violation' };
formatearError(error2);
// → "El proyecto relacionado no existe. Recarga la página."

// Error HTTP
const error3 = { status: 500 };
formatearError(error3);
// → "Error interno del servidor. Intenta más tarde."

// Error desconocido
const error4 = new Error('Algo raro pasó');
formatearError(error4);
// → "Ocurrió un error inesperado. Por favor, intenta nuevamente."
```

### Uso práctico:

```javascript
async function guardarDatos(datos) {
  try {
    const response = await fetch('/api/guardar', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    mostrarNotificacion('Guardado exitoso', 'success');
    
  } catch (error) {
    // En lugar de mostrar error técnico:
    // ❌ alert(error.message); // "Failed to fetch"
    
    // Mostrar mensaje user-friendly:
    // ✅
    mostrarNotificacion(formatearError(error), 'error');
  }
}
```

---

## 4️⃣ Debouncing

### Función: `debounce(func, wait)`

**Descripción**: Retrasa la ejecución de una función hasta que pasen `wait` ms sin nuevas llamadas

### Parámetros:
- `func` (function): Función a ejecutar
- `wait` (number): Milisegundos de espera (default: 300)

### Retorna:
- `function`: Versión "debounced" de la función

### Ejemplos:

```javascript
// Búsqueda en tiempo real
const inputBusqueda = document.getElementById('busqueda');

function realizarBusqueda(termino) {
  console.log('Buscando:', termino);
  fetch(`/api/buscar?q=${termino}`)
    .then(response => response.json())
    .then(resultados => mostrarResultados(resultados));
}

// SIN debounce: se ejecuta por cada tecla
// inputBusqueda.addEventListener('input', (e) => {
//   realizarBusqueda(e.target.value); // ← Muchas llamadas API
// });

// CON debounce: espera 300ms después de dejar de escribir
const buscarDebounced = debounce(realizarBusqueda, 300);

inputBusqueda.addEventListener('input', (e) => {
  buscarDebounced(e.target.value); // ← Solo 1 llamada API
});
```

```javascript
// Validación de formulario en tiempo real
const inputEmail = document.getElementById('email');

async function validarEmail(email) {
  const response = await fetch(`/api/validar-email?email=${email}`);
  const data = await response.json();
  
  if (data.disponible) {
    inputEmail.classList.add('valid');
    inputEmail.classList.remove('invalid');
  } else {
    inputEmail.classList.add('invalid');
    inputEmail.classList.remove('valid');
  }
}

// Validar solo después de 500ms sin escribir
const validarDebounced = debounce(validarEmail, 500);

inputEmail.addEventListener('input', (e) => {
  validarDebounced(e.target.value);
});
```

---

## 5️⃣ Barra de Progreso

### Clase: `BarraProgreso`

**Descripción**: Muestra una barra de progreso animada

### Constructor:
```javascript
new BarraProgreso(contenedorId)
```

### Métodos:
- `actualizar(porcentaje, mensaje)`: Actualiza progreso (0-100)
- `completar(mensaje)`: Marca como completo (100%)
- `error(mensaje)`: Marca como error (barra roja)
- `ocultar()`: Elimina la barra

### Ejemplo completo:

```javascript
async function importarArchivoGrande(archivo) {
  // Crear barra de progreso
  const progress = new BarraProgreso('import-section');
  
  try {
    const lineas = archivo.split('\n');
    const total = lineas.length;
    
    for (let i = 0; i < total; i++) {
      // Procesar línea
      await procesarLinea(lineas[i]);
      
      // Actualizar progreso
      const porcentaje = Math.round((i / total) * 100);
      progress.actualizar(porcentaje, `Procesando línea ${i + 1} de ${total}`);
    }
    
    // Completar
    progress.completar('Importación exitosa');
    mostrarNotificacion('Archivo importado correctamente', 'success');
    
  } catch (error) {
    progress.error('Error en la importación');
    mostrarNotificacion(formatearError(error), 'error');
  }
}
```

```javascript
// Ejemplo con descarga de archivo
async function descargarArchivo(url) {
  const progress = new BarraProgreso('download-container');
  
  const response = await fetch(url);
  const reader = response.body.getReader();
  const contentLength = +response.headers.get('Content-Length');
  
  let receivedLength = 0;
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    chunks.push(value);
    receivedLength += value.length;
    
    // Actualizar progreso
    const porcentaje = Math.round((receivedLength / contentLength) * 100);
    progress.actualizar(porcentaje, `Descargado: ${receivedLength} / ${contentLength} bytes`);
  }
  
  progress.completar('Descarga completa');
}
```

---

## 6️⃣ Loading State en Botones

### Función: `ejecutarConLoading(boton, operacion)`

**Descripción**: Ejecuta una función async mostrando spinner en el botón

### Parámetros:
- `boton` (string | HTMLElement): Selector CSS o elemento del botón
- `operacion` (async function): Función a ejecutar

### Ejemplos:

```javascript
// Con selector CSS
await ejecutarConLoading('#btnGuardar', async () => {
  await guardarDatos();
});

// Con elemento del DOM
const btnExportar = document.getElementById('btnExportar');

await ejecutarConLoading(btnExportar, async () => {
  const data = await generarReporte();
  descargarPDF(data);
});
```

```javascript
// Uso en event listener
document.getElementById('btnGuardarTodos').addEventListener('click', async () => {
  await ejecutarConLoading('#btnGuardarTodos', async () => {
    const muros = obtenerMuros();
    
    for (const muro of muros) {
      await guardarMuro(muro);
    }
    
    mostrarNotificacion('Todos los muros guardados', 'success');
  });
});
```

---

## 7️⃣ Tooltips

### Función: `agregarTooltip(elemento, texto)`

**Descripción**: Agrega un tooltip a un elemento existente

### Parámetros:
- `elemento` (string | HTMLElement): Selector CSS o elemento
- `texto` (string): Texto del tooltip

### Ejemplos:

```javascript
// Con selector CSS
agregarTooltip('#factor_w2', 'Factor de reducción según NSR-10');

// Con elemento del DOM
const labelAngulo = document.querySelector('label[for="angulo"]');
agregarTooltip(labelAngulo, 'Ángulo de inclinación del brace (30-60°)');

// Múltiples tooltips
const tooltips = [
  { selector: '#velocidad', texto: 'Velocidad básica del viento' },
  { selector: '#temperatura', texto: 'Temperatura promedio anual' },
  { selector: '#altura', texto: 'Altura total del edificio' }
];

tooltips.forEach(({ selector, texto }) => {
  agregarTooltip(selector, texto);
});
```

### Método alternativo (HTML directo):

```html
<label>
  Factor W2:
  <span class="tooltip-icon" data-tooltip="Texto del tooltip aquí">i</span>
</label>
```

---

## 8️⃣ Validación de Formularios

### Función: `validarFormulario(formulario, reglas)`

**Descripción**: Valida campos de formulario y muestra errores visuales

### Parámetros:
- `formulario` (string | HTMLElement): Selector CSS o elemento del form
- `reglas` (object): Objeto con reglas de validación

### Reglas disponibles:
- `requerido`: Campo no puede estar vacío
- `min`: Valor mínimo (numérico)
- `max`: Valor máximo (numérico)
- `patron`: RegExp de validación
- `mensajePatron`: Mensaje si no cumple patrón

### Retorna:
```javascript
{
  valido: boolean,
  errores: [
    { campo: 'nombre', mensaje: 'Campo requerido' },
    // ...
  ]
}
```

### Ejemplo completo:

```javascript
// HTML del formulario
/*
<form id="formProyecto">
  <input type="text" name="nombre">
  <input type="number" name="velocidad">
  <input type="email" name="email">
  <button type="submit">Guardar</button>
</form>
*/

document.getElementById('formProyecto').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Definir reglas de validación
  const reglas = {
    nombre: {
      requerido: true
    },
    velocidad: {
      requerido: true,
      min: 0,
      max: 500
    },
    email: {
      requerido: true,
      patron: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      mensajePatron: 'Email inválido'
    }
  };
  
  // Validar
  const { valido, errores } = validarFormulario('#formProyecto', reglas);
  
  if (!valido) {
    console.log('Errores encontrados:', errores);
    mostrarNotificacion('Por favor, corrija los campos marcados', 'warning');
    return;
  }
  
  // Formulario válido, proceder a guardar
  await ejecutarConLoading('#btnGuardar', async () => {
    const datos = new FormData(e.target);
    await guardarProyecto(datos);
    mostrarNotificacion('Proyecto guardado correctamente', 'success');
  });
});
```

---

## 🎨 Ejemplos de Flujos Completos

### Flujo 1: Importar datos con validación y progreso

```javascript
async function importarDatos(archivo) {
  // 1. Validar archivo
  if (!archivo.name.endsWith('.txt')) {
    mostrarNotificacion('Solo se permiten archivos .txt', 'warning');
    return;
  }
  
  // 2. Confirmar importación
  const confirmar = await confirmar(
    `Se importará el archivo "${archivo.name}".\n\nEsto puede tomar varios minutos.`,
    'Confirmar importación'
  );
  
  if (!confirmar) {
    return;
  }
  
  // 3. Crear barra de progreso
  const progress = new BarraProgreso('import-container');
  
  try {
    // 4. Procesar archivo
    const contenido = await archivo.text();
    const lineas = contenido.split('\n');
    
    for (let i = 0; i < lineas.length; i++) {
      await procesarLinea(lineas[i]);
      
      const porcentaje = Math.round((i / lineas.length) * 100);
      progress.actualizar(porcentaje, `Línea ${i + 1} de ${lineas.length}`);
    }
    
    // 5. Completar
    progress.completar('Importación exitosa');
    mostrarNotificacion(`${lineas.length} líneas importadas correctamente`, 'success');
    
  } catch (error) {
    progress.error('Error en importación');
    mostrarNotificacion(formatearError(error), 'error');
  }
}
```

### Flujo 2: Editar y guardar con validación

```javascript
async function guardarCambios() {
  // 1. Validar formulario
  const { valido, errores } = validarFormulario('#formEdicion', {
    angulo: { requerido: true, min: 0, max: 90 },
    npt: { requerido: true, min: 0 }
  });
  
  if (!valido) {
    mostrarNotificacion(
      `Errores en: ${errores.map(e => e.campo).join(', ')}`,
      'warning'
    );
    return;
  }
  
  // 2. Confirmar si es acción masiva
  const muros = document.querySelectorAll('.muro-editado');
  if (muros.length > 10) {
    const ok = await confirmar(
      `Se guardarán cambios en ${muros.length} muros`,
      'Guardar cambios masivos',
      { tipo: 'warning' }
    );
    
    if (!ok) return;
  }
  
  // 3. Guardar con loading state
  await ejecutarConLoading('#btnGuardar', async () => {
    let guardados = 0;
    let errores = 0;
    
    for (const muro of muros) {
      try {
        await guardarMuro(muro);
        guardados++;
      } catch (error) {
        console.error('Error guardando muro:', error);
        errores++;
      }
    }
    
    // 4. Mostrar resultado
    if (errores === 0) {
      mostrarNotificacion(`${guardados} muros guardados correctamente`, 'success');
    } else {
      mostrarNotificacion(
        `${guardados} guardados, ${errores} errores`,
        'warning'
      );
    }
  });
}
```

---

## 📖 Referencia Rápida

| Función | Uso Principal | Retorno |
|---------|---------------|---------|
| `mostrarNotificacion()` | Feedback al usuario | void |
| `confirmar()` | Prevenir acciones accidentales | Promise<boolean> |
| `formatearError()` | Mensajes user-friendly | string |
| `debounce()` | Optimizar performance | function |
| `BarraProgreso` | Operaciones largas | class instance |
| `ejecutarConLoading()` | Loading states | Promise<any> |
| `agregarTooltip()` | Ayuda contextual | void |
| `validarFormulario()` | Validación de inputs | { valido, errores } |

---

## 🎯 Buenas Prácticas

### ✅ DO:
- Usar `mostrarNotificacion()` en lugar de `alert()`
- Pedir confirmación antes de acciones destructivas
- Formatear errores con `formatearError()`
- Aplicar debounce en inputs de búsqueda/filtro
- Mostrar progreso en operaciones > 2 segundos
- Agregar tooltips a campos técnicos

### ❌ DON'T:
- No usar `alert()` o `confirm()` nativos
- No mostrar stack traces al usuario
- No hacer llamadas API sin debounce en inputs
- No ejecutar operaciones largas sin feedback visual
- No usar términos técnicos en mensajes

---

## 🐛 Troubleshooting

### Problema: `window.Usability` es undefined
**Solución**: Verificar que `usability.js` se carga antes de `script.js`
```html
<script src="js/usability.js"></script>
<script src="script.js"></script>
```

### Problema: Tooltips no se ven
**Solución**: Verificar z-index del contenedor padre
```css
.contenedor {
  position: relative;
  z-index: 1;
}
```

### Problema: Modal no se cierra con ESC
**Solución**: Verificar que no hay otros listeners de teclado bloqueando

---

**Fin de la guía** 🎉

Para más detalles, ver:
- `MEJORAS_USABILIDAD.md` (documentación técnica completa)
- `RESUMEN_MEJORAS_USABILIDAD.md` (resumen ejecutivo)
- `CHECKLIST_TESTING_USABILIDAD.md` (guía de testing)

