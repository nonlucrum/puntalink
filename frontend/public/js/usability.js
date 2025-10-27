// ========================================
// UTILIDADES DE USABILIDAD
// ========================================

/**
 * Sistema de confirmación mejorado
 * Reemplaza los alert() nativos con diálogos personalizados
 */
export function confirmar(mensaje, titulo = '¿Estás seguro?', opciones = {}) {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    
    const {
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      tipo = 'default' // 'default', 'danger', 'warning'
    } = opciones;
    
    const btnClass = tipo === 'danger' ? 'confirm-dialog__btn--danger' : 'confirm-dialog__btn--confirm';
    
    dialog.innerHTML = `
      <div class="confirm-dialog__content">
        <h3 class="confirm-dialog__title">${titulo}</h3>
        <p class="confirm-dialog__message">${mensaje}</p>
        <div class="confirm-dialog__actions">
          <button class="confirm-dialog__btn confirm-dialog__btn--cancel">${cancelText}</button>
          <button class="confirm-dialog__btn ${btnClass}">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const btnCancel = dialog.querySelector('.confirm-dialog__btn--cancel');
    const btnConfirm = dialog.querySelector('.confirm-dialog__btn--confirm, .confirm-dialog__btn--danger');
    
    const cleanup = () => {
      dialog.remove();
    };
    
    btnCancel.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    btnConfirm.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    
    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

/**
 * Sistema de notificaciones toast
 * Muestra mensajes no intrusivos en la esquina
 */
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function mostrarNotificacion(mensaje, tipo = 'info', duracion = 4000) {
  const container = getToastContainer();
  
  const iconos = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const titulos = {
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${tipo}`;
  toast.innerHTML = `
    <span class="toast__icon">${iconos[tipo]}</span>
    <div class="toast__content">
      <div class="toast__title">${titulos[tipo]}</div>
      <div class="toast__message">${mensaje}</div>
    </div>
    <button class="toast__close">×</button>
  `;
  
  container.appendChild(toast);
  
  const closeBtn = toast.querySelector('.toast__close');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'slideInRight 0.3s reverse';
    setTimeout(() => toast.remove(), 300);
  });
  
  if (duracion > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
      }
    }, duracion);
  }
}

/**
 * Barra de progreso para operaciones largas
 */
export class BarraProgreso {
  constructor(contenedorId) {
    this.contenedor = document.getElementById(contenedorId);
    if (!this.contenedor) {
      console.error(`Contenedor ${contenedorId} no encontrado`);
      return;
    }
    
    this.elemento = document.createElement('div');
    this.elemento.className = 'progress-container';
    this.elemento.innerHTML = `
      <div class="progress-bar">
        <div class="progress-bar__fill" style="width: 0%"></div>
      </div>
      <div class="progress-text">0%</div>
    `;
    
    this.contenedor.appendChild(this.elemento);
    this.fill = this.elemento.querySelector('.progress-bar__fill');
    this.text = this.elemento.querySelector('.progress-text');
  }
  
  actualizar(porcentaje, mensaje = '') {
    if (!this.fill) return;
    
    porcentaje = Math.min(100, Math.max(0, porcentaje));
    this.fill.style.width = `${porcentaje}%`;
    this.text.textContent = mensaje || `${Math.round(porcentaje)}%`;
  }
  
  completar(mensaje = 'Completado') {
    this.actualizar(100, mensaje);
    setTimeout(() => this.ocultar(), 1500);
  }
  
  error(mensaje = 'Error en la operación') {
    this.text.textContent = mensaje;
    this.fill.style.background = '#ef4444';
  }
  
  ocultar() {
    if (this.elemento) {
      this.elemento.remove();
    }
  }
}

/**
 * Agregar tooltip a un elemento
 */
export function agregarTooltip(elemento, texto) {
  if (typeof elemento === 'string') {
    elemento = document.querySelector(elemento);
  }
  
  if (!elemento) return;
  
  const icon = document.createElement('span');
  icon.className = 'tooltip-icon';
  icon.textContent = 'i';
  icon.setAttribute('data-tooltip', texto);
  
  // Insertar después del label si existe
  if (elemento.tagName === 'LABEL') {
    elemento.appendChild(icon);
  } else {
    elemento.insertAdjacentElement('afterend', icon);
  }
}

/**
 * Deshabilitar botón durante operación
 */
export async function ejecutarConLoading(boton, operacion) {
  if (typeof boton === 'string') {
    boton = document.querySelector(boton);
  }
  
  if (!boton) {
    console.error('Botón no encontrado');
    return await operacion();
  }
  
  const textoOriginal = boton.textContent;
  const disabledOriginal = boton.disabled;
  
  boton.classList.add('btn--loading');
  boton.disabled = true;
  
  try {
    const resultado = await operacion();
    return resultado;
  } finally {
    boton.classList.remove('btn--loading');
    boton.textContent = textoOriginal;
    boton.disabled = disabledOriginal;
  }
}

/**
 * Debounce para inputs
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Validar formulario con feedback visual
 */
export function validarFormulario(formulario, reglas) {
  if (typeof formulario === 'string') {
    formulario = document.querySelector(formulario);
  }
  
  let valido = true;
  const errores = [];
  
  Object.entries(reglas).forEach(([campo, validacion]) => {
    const input = formulario.querySelector(`[name="${campo}"]`);
    if (!input) return;
    
    const valor = input.value.trim();
    
    // Limpiar errores previos
    input.classList.remove('input-error');
    const errorExistente = input.parentElement.querySelector('.error-message');
    if (errorExistente) errorExistente.remove();
    
    // Validar
    if (validacion.requerido && !valor) {
      mostrarErrorCampo(input, 'Este campo es requerido');
      valido = false;
      errores.push({ campo, mensaje: 'Campo requerido' });
    } else if (validacion.min && parseFloat(valor) < validacion.min) {
      mostrarErrorCampo(input, `El valor mínimo es ${validacion.min}`);
      valido = false;
      errores.push({ campo, mensaje: `Valor mínimo: ${validacion.min}` });
    } else if (validacion.max && parseFloat(valor) > validacion.max) {
      mostrarErrorCampo(input, `El valor máximo es ${validacion.max}`);
      valido = false;
      errores.push({ campo, mensaje: `Valor máximo: ${validacion.max}` });
    } else if (validacion.patron && !validacion.patron.test(valor)) {
      mostrarErrorCampo(input, validacion.mensajePatron || 'Formato inválido');
      valido = false;
      errores.push({ campo, mensaje: 'Formato inválido' });
    }
  });
  
  return { valido, errores };
}

function mostrarErrorCampo(input, mensaje) {
  input.classList.add('input-error');
  const error = document.createElement('div');
  error.className = 'error-message';
  error.textContent = mensaje;
  error.style.color = '#ef4444';
  error.style.fontSize = '12px';
  error.style.marginTop = '4px';
  input.parentElement.appendChild(error);
}

/**
 * Formatear mensajes de error técnicos a mensajes user-friendly
 */
export function formatearError(error) {
  const mensajesUsuario = {
    'ECONNREFUSED': 'No se puede conectar al servidor. Por favor, verifica tu conexión e intenta nuevamente.',
    'ETIMEDOUT': 'La operación tomó demasiado tiempo. Por favor, intenta nuevamente.',
    'ENOTFOUND': 'No se pudo encontrar el servidor. Verifica tu conexión a internet.',
    '23503': 'El proyecto relacionado no existe. Por favor, recarga la página.',
    '42703': 'Hay un problema con la configuración. Contacta al administrador.',
    '23505': 'Este registro ya existe en la base de datos.',
    'Network request failed': 'Error de red. Verifica tu conexión a internet.',
    '401': 'No estás autorizado para realizar esta acción.',
    '403': 'No tienes permisos suficientes.',
    '404': 'El recurso solicitado no fue encontrado.',
    '500': 'Error interno del servidor. Intenta nuevamente más tarde.',
    '503': 'El servicio no está disponible temporalmente.'
  };
  
  // Intentar extraer código de error
  const codigo = error.code || error.status || (error.message && error.message.match(/\d{3}/)?.[0]);
  
  if (codigo && mensajesUsuario[codigo]) {
    return mensajesUsuario[codigo];
  }
  
  // Buscar en el mensaje
  for (const [clave, mensaje] of Object.entries(mensajesUsuario)) {
    if (error.message && error.message.includes(clave)) {
      return mensaje;
    }
  }
  
  // Mensaje genérico
  return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
}

/**
 * Inicializar tooltips automáticamente basándose en data-attributes
 */
export function inicializarTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(elemento => {
    if (!elemento.querySelector('.tooltip-icon')) {
      agregarTooltip(elemento, elemento.getAttribute('data-tooltip'));
    }
  });
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.Usability = {
    confirmar,
    mostrarNotificacion,
    BarraProgreso,
    agregarTooltip,
    ejecutarConLoading,
    debounce,
    validarFormulario,
    formatearError,
    inicializarTooltips
  };
}
