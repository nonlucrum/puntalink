/**
 * SISTEMA DE NOTIFICACIONES MEJORADO
 * Reemplaza alert(), confirm() y proporciona toasts modernos
 */

// Crear contenedor para notificaciones
const createNotificationContainer = () => {
  let container = document.getElementById('notification-system');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-system';
    container.className = 'notification-system';
    document.body.appendChild(container);
  }
  return container;
};

/**
 * Muestra una notificación toast (esquina superior derecha)
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje descriptivo
 * @param {number} duration - Duración en ms (0 = permanente)
 */
window.showNotification = function(type = 'info', title = '', message = '', duration = 4000) {
  const container = createNotificationContainer();
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.innerHTML = `
    <div class="notification__icon">${icons[type]}</div>
    <div class="notification__content">
      ${title ? `<div class="notification__title">${title}</div>` : ''}
      ${message ? `<div class="notification__message">${message}</div>` : ''}
    </div>
    <button class="notification__close" aria-label="Cerrar">✕</button>
  `;
  
  container.appendChild(notification);
  
  // Evento para cerrar
  const closeBtn = notification.querySelector('.notification__close');
  closeBtn.addEventListener('click', () => {
    notification.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  });
  
  // Auto-cerrar después de la duración especificada
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
  
  return notification;
};

/**
 * Muestra un modal de alerta
 * @param {string} title - Título
 * @param {string} message - Mensaje (puede contener HTML)
 * @param {object} options - Opciones adicionales
 */
window.showAlert = function(title, message = '', options = {}) {
  return new Promise((resolve) => {
    const {
      type = 'info',
      buttonText = 'Aceptar'
    } = options;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal-dialog';
    modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-icon modal-icon--${type}">${icons[type]}</div>
        <div class="modal-header-text">
          <h2 class="modal-title">${title}</h2>
        </div>
      </div>
      <div class="modal-body">${message}</div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn--primary">${buttonText}</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const btn = modal.querySelector('.modal-btn');
    const closeModal = () => {
      overlay.style.animation = 'fadeOut 0.2s ease forwards';
      setTimeout(() => overlay.remove(), 200);
      resolve(true);
    };
    
    btn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    // Enfoque automático al botón
    setTimeout(() => btn.focus(), 100);
  });
};

/**
 * Muestra un modal de confirmación
 * @param {string} title - Título
 * @param {string} message - Mensaje (puede contener HTML)
 * @param {object} options - Opciones adicionales
 */
window.showConfirm = function(title, message = '', options = {}) {
  return new Promise((resolve) => {
    const {
      type = 'info',
      confirmText = 'Aceptar',
      cancelText = 'Cancelar',
      isDangerous = false
    } = options;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal-dialog';
    modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-icon modal-icon--${type}">${icons[type]}</div>
        <div class="modal-header-text">
          <h2 class="modal-title">${title}</h2>
        </div>
      </div>
      <div class="modal-body">${message}</div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn--cancel">${cancelText}</button>
        <button class="modal-btn ${isDangerous ? 'modal-btn--danger' : 'modal-btn--primary'}">${confirmText}</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const [cancelBtn, confirmBtn] = modal.querySelectorAll('.modal-btn');
    
    const closeModal = (result) => {
      overlay.style.animation = 'fadeOut 0.2s ease forwards';
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };
    
    cancelBtn.addEventListener('click', () => closeModal(false));
    confirmBtn.addEventListener('click', () => closeModal(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(false);
    });
    
    // Enfoque automático al botón de confirmación
    setTimeout(() => confirmBtn.focus(), 100);
  });
};

/**
 * Muestra un modal con lista de opciones
 * @param {string} title - Título
 * @param {string} message - Mensaje inicial
 * @param {array} items - Array de opciones {label, value}
 */
window.showChoice = function(title, message = '', items = []) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal-dialog';
    
    let itemsHTML = '';
    if (items.length > 0) {
      itemsHTML = `<ul style="margin-top: 1rem;">
        ${items.map((item, i) => `<li><strong>${item.label}</strong></li>`).join('')}
      </ul>`;
    }
    
    modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-icon modal-icon--info">ℹ️</div>
        <div class="modal-header-text">
          <h2 class="modal-title">${title}</h2>
        </div>
      </div>
      <div class="modal-body">${message}${itemsHTML}</div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn--cancel">Cerrar</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const closeBtn = modal.querySelector('.modal-btn--cancel');
    const closeModal = () => {
      overlay.style.animation = 'fadeOut 0.2s ease forwards';
      setTimeout(() => overlay.remove(), 200);
      resolve(null);
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  });
};

/**
 * Muestra un indicador de progreso
 * @param {string} message - Mensaje a mostrar
 * @returns {object} Objeto con método close()
 */
window.showProgress = function(message = 'Procesando...') {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.background = 'rgba(5, 10, 20, 0.4)';
  
  const modal = document.createElement('div');
  modal.className = 'modal-dialog';
  modal.style.textAlign = 'center';
  modal.innerHTML = `
    <div class="modal-body">
      <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
        <div style="width: 40px; height: 40px; border: 3px solid var(--border); border-top: 3px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <div style="color: var(--text); font-weight: 600;">${message}</div>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  return {
    close: () => {
      overlay.style.animation = 'fadeOut 0.2s ease forwards';
      setTimeout(() => overlay.remove(), 200);
    }
  };
};

/**
 * Función auxiliar para reemplazar alert() nativo
 */
window.alert = async function(message) {
  const title = '⚠️ Mensaje';
  const type = message.includes('Error') || message.includes('error') ? 'error' : 'info';
  await showAlert(title, message, { type });
};

/**
 * Función auxiliar para reemplazar confirm() nativo
 */
window.confirm = async function(message) {
  const type = message.includes('¿') ? 'info' : 'warning';
  const isDangerous = message.toLowerCase().includes('eliminar') || 
                      message.toLowerCase().includes('borrar') ||
                      message.toLowerCase().includes('danger');
  return await showConfirm('Confirmación', message, { 
    type,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    isDangerous
  });
};

// Agregar animación slideOutRight si no existe
if (!document.querySelector('#slideOutRight-animation')) {
  const style = document.createElement('style');
  style.id = 'slideOutRight-animation';
  style.textContent = `
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
    
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);
}

console.log('[NOTIFICATIONS] Sistema de notificaciones cargado correctamente');
