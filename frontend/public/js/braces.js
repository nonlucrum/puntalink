// ===== MÓDULO DE CONFIGURACIÓN DE BRACES =====
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:4008' 
  : 'http://192.168.1.10:4008';

/**
 * Aplicar valores globales de ángulo y NPT a todos los muros
 */
export async function aplicarValoresGlobales() {
  const anguloGlobal = parseFloat(document.getElementById('angulo_global').value);
  const nptGlobal = parseFloat(document.getElementById('npt_global').value);

  console.log('[BRACES] Aplicando valores globales:', { anguloGlobal, nptGlobal });

  // Validaciones
  if (isNaN(anguloGlobal) || anguloGlobal < 0 || anguloGlobal > 90) {
    alert('El ángulo debe estar entre 0° y 90°');
    return;
  }

  if (isNaN(nptGlobal)) {
    alert('El NPT debe ser un número válido');
    return;
  }

  try {
    // Obtener proyecto actual desde localStorage
    const projectConfig = JSON.parse(localStorage.getItem('projectConfig'));
    if (!projectConfig || !projectConfig.pid) {
      alert('No se ha seleccionado un proyecto');
      return;
    }
    const pid_proyecto = projectConfig.pid;

    const response = await fetch(`${API_BASE}/api/calculos/proyectos/${pid_proyecto}/aplicar-globales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        angulo_brace: anguloGlobal,
        npt: nptGlobal
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('[BRACES] Valores aplicados:', data);
      alert(`✓ Valores aplicados a ${data.muros_actualizados} muros`);
      
      // Recargar tabla de braces
      await cargarTablaBraces();
    } else {
      alert('Error: ' + (data.error || 'No se pudieron aplicar los valores'));
    }
  } catch (error) {
    console.error('[BRACES] Error aplicando valores globales:', error);
    alert('Error de conexión al aplicar valores globales');
  }
}

/**
 * Cargar la tabla de braces con los muros actuales
 * NOTA: Esta función ya no se usa porque ahora usamos tabla unificada en mostrarResultadosViento
 */
export async function cargarTablaBraces() {
  console.log('[BRACES] Función deprecada - ahora usamos tabla unificada');
  // No hacer nada - la tabla ahora se genera en mostrarResultadosViento()
  return;
}

/**
 * Guardar cambios de un muro específico
 */
window.guardarMuroBraces = async function(pid) {
  console.log('[BRACES] Guardando muro PID:', pid);

  const row = document.querySelector(`tr[data-pid="${pid}"]`);
  if (!row) {
    console.error('[BRACES] Fila no encontrada');
    return;
  }

  // Obtener valores de los inputs
  const inputs = row.querySelectorAll('.input-editable');
  const valores = {};
  
  inputs.forEach(input => {
    const field = input.dataset.field;
    let value = input.value;
    
    if (input.type === 'number') {
      value = parseFloat(value);
      if (isNaN(value)) value = null;
    }
    
    valores[field] = value;
  });

  console.log('[BRACES] Valores a guardar:', valores);

  try {
    // Actualizar campos editables
    const response = await fetch(`${API_BASE}/api/calculos/muros/${pid}/editable`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(valores)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log('[BRACES] Muro actualizado:', data.muro);
      
      // Mostrar feedback visual
      row.style.backgroundColor = '#d4edda';
      setTimeout(() => {
        row.style.backgroundColor = '';
      }, 1000);

      // Recargar la fila para mostrar valores actualizados
      await cargarTablaBraces();
    } else {
      alert('Error: ' + (data.error || 'No se pudo actualizar el muro'));
    }
  } catch (error) {
    console.error('[BRACES] Error guardando muro:', error);
    alert('Error de conexión al guardar cambios');
  }
};

/**
 * Guardar todos los cambios de la tabla
 */
export async function guardarTodosBraces() {
  console.log('[BRACES] Guardando todos los cambios...');

  const rows = document.querySelectorAll('#tablaBracesBody tr[data-pid]');
  let exitosos = 0;
  let errores = 0;

  for (const row of rows) {
    const pid = row.dataset.pid;
    try {
      await window.guardarMuroBraces(parseInt(pid));
      exitosos++;
    } catch (error) {
      console.error(`[BRACES] Error en muro ${pid}:`, error);
      errores++;
    }
  }

  alert(`Guardado completado:\n✓ ${exitosos} muros actualizados\n${errores > 0 ? `✗ ${errores} errores` : ''}`);
}

/**
 * Agregar listeners para cálculo en tiempo real (estilo Excel)
 */
function agregarListenersCalculoTiempoReal() {
  console.log('[BRACES] Agregando listeners para cálculo en tiempo real...');

  // Listeners para inputs que disparan cálculo: ángulo, X braces, tipo brace, NPT
  const inputsCalculo = document.querySelectorAll('.input-calculo');
  const inputsNpt = document.querySelectorAll('[data-field="npt"]');
  
  // Función común de cálculo
  const calcularBraces = async function(input) {
    const pid = input.dataset.pid;
    const row = document.querySelector(`tr[data-pid="${pid}"]`);
    
    // Obtener valores actuales
    const anguloInput = row.querySelector('[data-field="angulo_brace"]');
    const xBracesInput = row.querySelector('[data-field="x_braces"]');
    const tipoBraceInput = row.querySelector('[data-field="tipo_brace_seleccionado"]');
    const nptInput = row.querySelector('[data-field="npt"]');
    
    const angulo = parseFloat(anguloInput.value);
    const xBraces = parseInt(xBracesInput.value);
    const tipoBrace = tipoBraceInput.value;
    const npt = parseFloat(nptInput.value) || 0;
    const fuerzaViento = parseFloat(row.dataset.fuerza) || 0;

    // Validar que tengamos todos los valores mínimos (ángulo y X braces son obligatorios)
    if (isNaN(angulo) || isNaN(xBraces) || xBraces <= 0 || fuerzaViento <= 0) {
      // Limpiar valores calculados si faltan datos
      row.querySelector(`.valor-fbx[data-pid="${pid}"]`).textContent = '-';
      row.querySelector(`.valor-fby[data-pid="${pid}"]`).textContent = '-';
      row.querySelector(`.valor-fb[data-pid="${pid}"]`).textContent = '-';
      row.querySelector(`.valor-x-inserto[data-pid="${pid}"]`).textContent = '-';
      row.querySelector(`.valor-y-inserto[data-pid="${pid}"]`).textContent = '-';
      row.querySelector(`.cant-b14[data-pid="${pid}"]`).textContent = '0';
      row.querySelector(`.cant-b12[data-pid="${pid}"]`).textContent = '0';
      row.querySelector(`.cant-b04[data-pid="${pid}"]`).textContent = '0';
      row.querySelector(`.cant-b15[data-pid="${pid}"]`).textContent = '0';
      return;
    }

    // Calcular en el backend
    try {
      const response = await fetch(`${API_BASE}/api/calculos/muros/${pid}/calcular-braces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          angulo_brace: angulo,
          x_braces: xBraces,
          tipo_brace_seleccionado: tipoBrace,
          npt: npt
        })
      });

      if (!response.ok) {
        console.error(`[BRACES] Error HTTP ${response.status} al calcular muro ${pid}`);
        return;
      }

      const data = await response.json();

      if (data.success && data.calculo) {
        const calc = data.calculo;
        
        // Actualizar valores calculados en la UI
        row.querySelector(`.valor-fbx[data-pid="${pid}"]`).textContent = calc.fbx.toFixed(2);
        row.querySelector(`.valor-fby[data-pid="${pid}"]`).textContent = calc.fby.toFixed(2);
        row.querySelector(`.valor-fb[data-pid="${pid}"]`).textContent = calc.fb.toFixed(2);
        
        // Actualizar coordenadas de inserto (X e Y)
        if (calc.x_inserto !== undefined && calc.x_inserto !== null) {
          row.querySelector(`.valor-x-inserto[data-pid="${pid}"]`).textContent = calc.x_inserto.toFixed(3);
        } else {
          row.querySelector(`.valor-x-inserto[data-pid="${pid}"]`).textContent = '-';
        }
        
        if (calc.y_inserto !== undefined && calc.y_inserto !== null) {
          row.querySelector(`.valor-y-inserto[data-pid="${pid}"]`).textContent = calc.y_inserto.toFixed(3);
        } else {
          row.querySelector(`.valor-y-inserto[data-pid="${pid}"]`).textContent = '-';
        }
        
        row.querySelector(`.cant-b14[data-pid="${pid}"]`).textContent = calc.cant_b14;
        row.querySelector(`.cant-b12[data-pid="${pid}"]`).textContent = calc.cant_b12;
        row.querySelector(`.cant-b04[data-pid="${pid}"]`).textContent = calc.cant_b04;
        row.querySelector(`.cant-b15[data-pid="${pid}"]`).textContent = calc.cant_b15;

        console.log(`[BRACES] Muro ${pid} calculado:`, calc);
      } else {
        console.error(`[BRACES] Respuesta inválida del servidor para muro ${pid}:`, data);
      }
    } catch (error) {
      console.error(`[BRACES] Error calculando muro ${pid}:`, error);
    }
  };
  
  // Agregar listeners a inputs que disparan cálculo (ángulo, X braces, tipo brace)
  inputsCalculo.forEach(input => {
    input.addEventListener('input', function() {
      calcularBraces(this);
    });
  });
  
  // Agregar listeners a NPT (también dispara cálculo porque afecta Y)
  inputsNpt.forEach(input => {
    input.addEventListener('input', function() {
      calcularBraces(this);
    });
  });
}


/**
 * Inicializar módulo de braces
 */
export function initBracesModule() {
  console.log('[BRACES] Inicializando módulo de braces...');

  // Exponer cargarTablaBraces globalmente para que script.js pueda usarla
  window.cargarTablaBraces = cargarTablaBraces;

  // Botón aplicar valores globales
  const btnAplicarGlobales = document.getElementById('btnAplicarGlobales');
  if (btnAplicarGlobales) {
    btnAplicarGlobales.addEventListener('click', aplicarValoresGlobales);
  }

  // Botón guardar todos
  const btnGuardarTodos = document.getElementById('btnGuardarTodosBraces');
  if (btnGuardarTodos) {
    btnGuardarTodos.addEventListener('click', guardarTodosBraces);
  }

  console.log('[BRACES] Módulo de braces inicializado');
}
