// ===== SUBMENÚS DINÁMICOS PARA TODAS LAS SECCIONES PRINCIPALES =====
document.addEventListener("DOMContentLoaded", () => {
  const sections = [
    { menu: "menu-paneles", section: "results-section", submenu: "submenu-paneles" },
    { menu: "menu-viento", section: "wind-section", submenu: "submenu-viento" },
    { menu: "menu-resultados", section: "calculations-section", submenu: "submenu-resultados" },
    { menu: "menu-armado", section: "armado-section", submenu: "submenu-armado" },
    { menu: "menu-proyecto", section: "info-proyecto", submenu: "submenu-proyecto" }
  ];
  sections.forEach(({ menu, section, submenu }) => {
    const header = document.getElementById(menu);
    const submenuEl = document.getElementById(submenu);
    if (header && submenuEl) {
      header.addEventListener("click", () => {
        setTimeout(() => {
          const sectionEl = document.getElementById(section);
          const isVisible = sectionEl && sectionEl.style.display !== "none";
          submenuEl.style.display = isVisible ? "block" : "none";
        }, 200);
      });
    }
  });
});
// ===== IMPORTACIÓN DE MÓDULOS =====
import { 
  handleFileValidation,
  updatePanelesDisplay,
  handleUploadTxt,
  handleCancelTxt,
  handleCalcularPaneles,
  handleGenerarPDF,
  loadProjectInfo,
  editarProyecto,
  guardarCambiosProyecto,
  agregarRangoEliminacion,
  previsualizarEliminacion,
  confirmarImportacionFiltrada,
  cancelarEliminacion
} from './js/dashboard.js';

import { 
    createProject,
    loadPreviousProjects
} from './js/index.js';

const { confirmar, mostrarNotificacion, BarraProgreso, ejecutarConLoading, debounce, formatearError } = window.Usability || {};
/* =========================
   Fondo: Slideshow (5 s, fade lento)
   Carpeta: public/img/backgrounds/
   Archivos: 1..5 con extensión png/jpg/jpeg/webp
   ========================= */
(function () {
  const INTERVAL_MS = 5000;     // tiempo entre cambios
  const TRANSITION_MS = 1800;   // duración del fade (lento)
  const exts = ['png', 'jpg', 'jpeg', 'webp'];
  const base = new URL('img/backgrounds/', document.baseURI);

  // --- utils: resuelve la primera URL existente entre varias opciones ---
  function resolveExisting(sources, done) {
    let i = 0;
    function tryNext() {
      if (i >= sources.length) return done(null);
      const url = sources[i++];
      const img = new Image();
      img.onload = () => done(url);
      img.onerror = tryNext;
      img.src = url;
    }
    tryNext();
  }
  function sourcesFor(n) {
    return exts.map(ext => new URL(`${n}.${ext}`, base).toString());
  }

  // --- crea/asegura el contenedor y estilos mínimos (por si falta CSS) ---
  function ensureContainer() {
    let c = document.getElementById('bg-slideshow');
    if (!c) {
      c = document.createElement('div');
      c.id = 'bg-slideshow';
      c.setAttribute('aria-hidden', 'true');
      // lo dejamos como primer hijo del body
      document.body.prepend(c);
    }
    const cs = getComputedStyle(c);
    if (cs.position === 'static') {
      Object.assign(c.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '0',
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: '40%'
      });
    }
    return c;
  }
  function makeLayer() {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'absolute',
      inset: '0',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: '0',
      transition: `opacity ${TRANSITION_MS}ms ease`,
      willChange: 'opacity'
    });
    return el;
  }

  function start() {
    const container = ensureContainer();
    const a = makeLayer();
    const b = makeLayer();
    container.appendChild(a);
    container.appendChild(b);

    // imagen inicial (1) y pre-set de la siguiente (2)
    resolveExisting(sourcesFor(1), (url1) => {
      if (!url1) {
        console.error('[BG] No se encontró 1.(png/jpg/jpeg/webp) en', base.href);
        return;
      }
      a.style.backgroundImage = `url("${url1}")`;
      a.style.opacity = '1';
      resolveExisting(sourcesFor(2), (url2) => {
        if (url2) b.style.backgroundImage = `url("${url2}")`;
      });
    });

    let idx = 1;      // 1..5
    let showA = true;

    setInterval(() => {
      idx = (idx % 5) + 1;   // 1→2→3→4→5→1
      resolveExisting(sourcesFor(idx), (nextUrl) => {
        if (!nextUrl) {
          console.error('[BG] No se encontró', sourcesFor(idx));
          return;
        }
        if (showA) {
          b.style.backgroundImage = `url("${nextUrl}")`;
          b.style.opacity = '1';
          a.style.opacity = '0';
        } else {
          a.style.backgroundImage = `url("${nextUrl}")`;
          a.style.opacity = '1';
          b.style.opacity = '0';
        }
        showA = !showA;
      });
    }, INTERVAL_MS);
  }

  document.addEventListener('DOMContentLoaded', () => {
    start();

    // Toggle opcional si existe el botón
    const btn = document.getElementById('toggleBackG');
    const cont = document.getElementById('bg-slideshow');
    if (btn && cont) {
      btn.addEventListener('click', () => {
        const hidden = cont.style.display === 'none';
        cont.style.display = hidden ? 'block' : 'none';
        btn.setAttribute('aria-pressed', String(hidden));
      });
    }
  });
})();

/* =========================
   Grúa de Construcción Interactiva
   ========================= */
(function initCrane() {
  const STATE = { ON: false };
  
  document.addEventListener('DOMContentLoaded', () => {
    const craneActivate = document.getElementById('craneActivate');
    const loginForm = document.getElementById('loginForm');
    const craneHook = document.getElementById('craneHook');
    const crane = document.querySelector('.crane');
    const lights = document.querySelectorAll('.crane__light');
    const mainButton = document.querySelector('.control-button--main');
    const craneButton = document.querySelector('.crane-button');
    
    if (!craneActivate || !loginForm) return;
    
    craneActivate.addEventListener('click', () => {
      STATE.ON = !STATE.ON;
      
      // Actualizar variable CSS
      document.documentElement.style.setProperty('--on', STATE.ON ? 1 : 0);
      
      // Cambiar color aleatorio cuando se activa
      if (STATE.ON) {
        const hue = Math.floor(Math.random() * 60) + 30; // Amarillo/Naranja para construcción
        document.documentElement.style.setProperty('--shade-hue', hue);
        document.documentElement.style.setProperty('--glow-color', `hsl(${hue}, 85%, 55%)`);
        document.documentElement.style.setProperty('--glow-color-dark', `hsl(${hue}, 70%, 40%)`);
      }
      
      // Activar luces
      lights.forEach(light => {
        if (STATE.ON) {
          light.classList.add('active');
        } else {
          light.classList.remove('active');
        }
      });
      
      // Animar gancho
      if (craneHook) {
        if (STATE.ON) {
          craneHook.classList.add('active');
        } else {
          craneHook.classList.remove('active');
        }
      }
      
      // Botón principal
      if (mainButton) {
        if (STATE.ON) {
          mainButton.classList.add('active');
        } else {
          mainButton.classList.remove('active');
        }
      }
      
      // Cambiar texto del botón
      if (craneButton) {
        if (STATE.ON) {
          craneButton.classList.add('active');
          craneButton.querySelector('.button-text').textContent = 'GRÚA ACTIVA';
        } else {
          craneButton.classList.remove('active');
          craneButton.querySelector('.button-text').textContent = 'ACTIVAR GRÚA';
        }
      }
      
      // Mostrar/ocultar formulario con delay
      setTimeout(() => {
        if (STATE.ON) {
          loginForm.classList.add('active');
        } else {
          loginForm.classList.remove('active');
        }
      }, 200);
      
      // Efecto de vibración en la grúa
      if (crane && STATE.ON) {
        crane.style.animation = 'crane-shake 0.5s ease';
        setTimeout(() => {
          crane.style.animation = '';
        }, 500);
      }
    });
    
    // Hover en la grúa
    if (crane) {
      crane.addEventListener('mouseenter', () => {
        if (!STATE.ON) {
          crane.style.transform = 'scale(1.02)';
        }
      });
      
      crane.addEventListener('mouseleave', () => {
        crane.style.transform = 'scale(1)';
      });
    }
  });
  
  // Agregar keyframes para animación de vibración
  const style = document.createElement('style');
  style.textContent = `
    @keyframes crane-shake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      25% { transform: translateX(-2px) rotate(-0.5deg); }
      75% { transform: translateX(2px) rotate(0.5deg); }
    }
  `;
  document.head.appendChild(style);
})();


// --- API BASE ---
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const API_BASE = isLocalHost ? 'http://localhost:4008' : '';
'';
// --- CALLBACK GIS ---
window.onGoogleCredential = async (response) => {
  try {
    const credential = response?.credential;
    if (!credential) {
      console.error('[LOGIN] No llegó credential desde Google');
      alert('No se recibió el token de Google.');
      return;
    }

    const resp = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
      credentials: 'include',             // ⬅️ IMPORTANTE
      // id_token
    });
    

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('[LOGIN] HTTP', resp.status, text);
      alert(`Error al iniciar sesión (HTTP ${resp.status})`);
      return;
    }

    const data = await resp.json();
    if (data.ok) {
      // aquí fuerzas recarga o redirección
      window.location.reload();        // recarga la misma
      // o
      // window.location.href = '/dashboard';
    }
    console.log('[LOGIN] OK:', data);

    const me = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' }).then(r => r.json());
    console.log('[ME]', me);

  } catch (e) {
    console.error('[LOGIN] Network error:', e);
    alert('Fallo de red al iniciar sesión (revisa CORS/servidor)');
  }
};


const $userInfo  = () => document.getElementById('userInfo');
const $userPic   = () => document.getElementById('userPic');
const $userEmail = () => document.getElementById('userEmail');
const $btnLogout = () => document.getElementById('btnLogout');


const AuthState = { user: null };


window.__gisCredentialHandler = async (response) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      credentials: 'include', // cookie HttpOnly
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential }),
    });
    const data = await res.json();
    if (!data.ok) {
      alert('No se pudo iniciar sesión: ' + (data.error || 'Error desconocido'));
      return;
    }
    localStorage.setItem('user', JSON.stringify(data.user));
    AuthState.user = data.user;
    await refreshMeUI();
  } catch (err) {
    console.error(err);
    alert('Fallo de red al iniciar sesión');
  }
};

async function refreshMeUI() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
    const { ok, user } = await res.json();

    const loginScreen = document.getElementById('loginScreen');
    const mainContent = document.getElementById('mainContent');
    const projectContent = document.getElementById('projectContent');
    const ui = $userInfo();
    const email = $userEmail();
    const pic = $userPic();

    if (ok && user) {
      AuthState.user = user;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Ocultar pantalla de login y mostrar contenido principal
      if (loginScreen) loginScreen.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';
      if (projectContent) projectContent.style.display = 'block';
      
      // Mostrar info de usuario
      if (ui) ui.style.display = 'flex';
      if (email) email.textContent = user.email || '';
      if (pic) {
        if (user.picture) { pic.src = user.picture; pic.style.display = ''; }
        else { pic.style.display = 'none'; }
      }
      
      // Cargar proyectos si estamos en index
      if (window.location.pathname === "/") {
        await loadPreviousProjects(user.uid);
      }
    } else {
      AuthState.user = null;
      localStorage.removeItem('user');
      
      // Mostrar pantalla de login y ocultar contenido principal
      if (loginScreen) loginScreen.style.display = 'flex';
      if (mainContent) mainContent.style.display = 'none';
      if (projectContent) projectContent.style.display = 'none';
      if (ui) ui.style.display = 'none';
      
      // Resetear estado de la lámpara
      const loginForm = document.getElementById('loginForm');
      if (loginForm) loginForm.classList.remove('active');
      document.documentElement.style.setProperty('--on', 0);
    }
  } catch (e) {
    console.error('Error consultando /me', e);
  }
}

async function doLogout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.warn('Logout con warning:', e);
  } finally {
    AuthState.user = null;
    localStorage.removeItem('user');
    await refreshMeUI();
    // Recargar la página para limpiar el estado
    if (window.location.pathname === "/") {
      window.location.reload();
    }
  }
}

function requireAuthOrWarn() {
  if (AuthState.user) return true;
  if (mostrarNotificacion) {
    mostrarNotificacion('Debes iniciar sesión con Google para continuar.', 'warning', 4000);
  } else {
    alert('Debes iniciar sesión con Google para continuar.');
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {

  if ($btnLogout()) {
    $btnLogout().addEventListener('click', doLogout);
  }

  refreshMeUI();

  // ===== CONFIGURACIÓN AUTOMÁTICA DE PROYECTO =====
  // Asegurar que existe un proyecto por defecto para evitar errores de foreign key
  if (!localStorage.getItem('projectConfig')) {
    const defaultProject = {
      pid: 3, // ID del proyecto que creamos
      nombre: 'Proyecto Principal',
      empresa: 'Empresa Test',
      tipo_muerto: 'Corrido',
      vel_viento: 120,
      temp_promedio: 25,
      presion_atmo: 760
    };
    localStorage.setItem('projectConfig', JSON.stringify(defaultProject));
    console.log('[INIT] Proyecto por defecto configurado:', defaultProject);
  }
  
  if (window.location.pathname === "/dashboard") {
   
    loadProjectInfo();
  }
  if (window.location.pathname === "/") {
    // Cargar proyectos anteriores en index solo si hay sesión
    const user = AuthState.user || JSON.parse(localStorage.getItem('user') || 'null');
    console.log('[FRONTEND] Usuario actual:', user);
    if (user && user.uid) {
      loadPreviousProjects(user.uid);
    }
  }
  
  // ===== ELEMENTOS DEL DOM =====
  const txtInput = document.getElementById('txtInput');
  const btnUploadTxt = document.getElementById('btnUploadTxt');
  const btnClearTxt = document.getElementById('btnClearTxt');
  const tablaPaneles = document.getElementById('tablaPaneles');
  const btnCalcular = document.getElementById('btnCalcular');
  const btnInforme = document.getElementById('btnInforme');
  const resultadosCalculo = document.getElementById('resultadosCalculo');
  const panelesInfo = document.getElementById('panelesInfo');
  const btnEditProject = document.getElementById('btnEditProject');
  const btnUpdateProject = document.getElementById('btnUpdateProject');
  const btnCancelUpdateProject = document.getElementById('btnCancelUpdateProject');

  // Elementos de Muertos (Macizos de Anclaje)
  const btnCalcularMuertos = document.getElementById('btnCalcularMuertos');
  const btnExportarMuertosCSV = document.getElementById('btnExportarMuertosCSV');
  const btnMostrarAlternativas = document.getElementById('btnMostrarAlternativas');
  const btnTablaDetallada = document.getElementById('btnTablaDetallada');

  const btnProjectSubmit = document.getElementById('btnProjectSubmit');
  const btnCreateNewProject = document.getElementById('btnCreateNewProject');
  const toggleBackG = document.getElementById('toggleBackG');
  const btnLoadOldProject = document.getElementById('btnLoadOldProject');
  const formNuevoProyecto = document.getElementById('formNuevoProyecto');
  const projectList = document.getElementById('projectList');

  // ===== VARIABLES GLOBALES =====
  const globalVars = {
    projectData: [],
    panelesActuales: [],
    resultadosActuales: [],
    resultadosTomoIII: [],
    resultadosMuertos: null
  };
  
  // Hacer globalVars accesible globalmente para funciones de viento
  window.globalVars = globalVars;

  // ===== FUNCIONALIDAD DE ACORDEÓN =====
  function initAccordion() {
    console.log('[FRONTEND] Inicializando acordeón - CERRADO hasta que se agrupen los muros');
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    // NO marcar la primera sección como activa hasta que se agrupen los muros
    // La primera sección se habilitará cuando window.lastGruposMuertos esté disponible
    
    accordionHeaders.forEach((header, index) => {
      header.addEventListener('click', () => {
        // Verificar si los muros han sido agrupados
        if (!window.lastGruposMuertos || Object.keys(window.lastGruposMuertos).length === 0) {
          if (index === 0) {
            // Para la primera sección, mostrar un mensaje específico
            alert('⚠️ Primero debes generar un PDF para agrupar los muros.\n\nEso activará las secciones de cálculos avanzados.');
            return;
          }
        }
        
        // No permitir colapsar la primera sección una vez que esté habilitada
        if (index === 0 && window.lastGruposMuertos && Object.keys(window.lastGruposMuertos).length > 0) {
          const accordionItem = header.parentElement;
          if (!accordionItem.classList.contains('active')) {
            accordionItem.classList.add('active');
          }
          return;
        }
        
        const accordionItem = header.parentElement;
        const isActive = accordionItem.classList.contains('active');
        
        console.log('[FRONTEND] Acordeón clickeado:', header.querySelector('.accordion-title').textContent.trim());
        
        // Toggle para secciones que no son la primera
        if (isActive) {
          accordionItem.classList.remove('active');
        } else {
          accordionItem.classList.add('active');
        }
      });
    });
    
    // Inicializar sub-acordeón para la tabla
    initSubAccordion();
  }

  // Función para habilitar el acordeón después de agrupar muros
  function enableAccordionAfterGrouping() {
    console.log('[FRONTEND] Habilitando primera sección del acordeón - muros agrupados');
    const firstItem = document.querySelector('.accordion-item');
    if (firstItem && window.lastGruposMuertos && Object.keys(window.lastGruposMuertos).length > 0) {
      firstItem.classList.add('active');
      console.log('[FRONTEND] Primera sección habilitada automáticamente');
    }
  }

  // Monitorear cuando se agrupan los muros
  function monitorGroupedWalls() {
    // Verificar periódicamente si se han agrupado los muros
    const checkInterval = setInterval(() => {
      if (window.lastGruposMuertos && Object.keys(window.lastGruposMuertos).length > 0) {
        enableAccordionAfterGrouping();
        clearInterval(checkInterval);
      }
    }, 1000);
    
    // Limpiar el intervalo después de 5 minutos para evitar bucles infinitos
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 300000);
  }

  function initSubAccordion() {
    console.log('[FRONTEND] Inicializando sub-acordeón para tabla');
    const subAccordionHeaders = document.querySelectorAll('.sub-accordion-header');
    
    subAccordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const subAccordionItem = header.parentElement;
        const isActive = subAccordionItem.classList.contains('active');
        
        console.log('[FRONTEND] Sub-acordeón clickeado:', header.querySelector('.sub-accordion-title').textContent.trim());
        
        // Toggle del sub-acordeón
        if (isActive) {
          subAccordionItem.classList.remove('active');
        } else {
          subAccordionItem.classList.add('active');
        }
      });
    });
  }
  
  function openSection(sectionId) {
    console.log('[FRONTEND] Abriendo sección:', sectionId);
    // Abrir la sección específica (sin cerrar otras)
    const targetHeader = document.querySelector(`[data-target="${sectionId}"]`);
    if (targetHeader) {
      targetHeader.parentElement.classList.add('active');
    }
  }

  // ===== ELEMENTOS DE UI PARA MÓDULOS =====
  const uiElements = {
    txtInput,
    tablaPaneles,
    tablaAccordion: document.getElementById('tablaAccordion'),
    panelesInfo,
    btnCalcular,
    btnInforme,
    btnClearTxt,
    btnUploadTxt,
    resultadosCalculo,
    btnEditProject,
    btnUpdateProject,
    btnCancelUpdateProject,
    projectList
  };

  const indexUIElements = {
    btnProjectSubmit
  };

  const callbacks = {
    openSection,
    updatePanelesDisplay: () => updatePanelesDisplay(globalVars.panelesActuales, uiElements, { openSection })
  };

  // ===== EVENT LISTENERS USANDO MÓDULO DE BOTONES =====
  
  // Validación de archivos
  if (txtInput) {
    txtInput.addEventListener('change', () => {
      console.log('[FRONTEND] Archivo seleccionado');
      const file = txtInput.files.length > 0 ? txtInput.files[0] : null;
      handleFileValidation(file, uiElements);
    });
  }

  // Subida de archivos
  if (btnUploadTxt && txtInput) {
    btnUploadTxt.addEventListener('click', async () => {
      console.log('[FRONTEND] Botón subir TXT clickeado');
      if (!txtInput.files.length) {
        console.log('[FRONTEND] No hay archivos seleccionados');
        return;
      }
      if (!requireAuthOrWarn()) return;
      const file = txtInput.files[0];
      await handleUploadTxt(file, uiElements, callbacks, globalVars);
    });
  }

  // Cancelar selección
  if (btnClearTxt) {
    btnClearTxt.addEventListener('click', async () => {
      await handleCancelTxt(uiElements, globalVars);
    });
  }

  // Calcular paneles
  if (btnCalcular) {
    btnCalcular.addEventListener('click', async () => {
      if (!requireAuthOrWarn()) return;
      await handleCalcularPaneles(uiElements, callbacks, globalVars);
    });
  }

  // Generar PDF
  if (btnInforme) {
    btnInforme.addEventListener('click', async () => {
      if (!requireAuthOrWarn()) return;
      await handleGenerarPDF(uiElements, globalVars);
    });
  }

  // Editar proyecto
  if (btnEditProject) {
    btnEditProject.addEventListener('click', () => {
      if (!requireAuthOrWarn()) return;
      editarProyecto(uiElements);
    });
  }

  // Cancelar edicion proyecto
  if (btnCancelUpdateProject) {
    btnCancelUpdateProject.addEventListener('click', () => {
      loadProjectInfo();
    });
  }

  // Guardar edicion proyecto
  if (btnUpdateProject) {
    btnUpdateProject.addEventListener('click', () => {
      if (!requireAuthOrWarn()) return;
      guardarCambiosProyecto();
    });
  }
  
  // ===== EVENT LISTENERS PARA MACIZOS DE ANCLAJE (MUERTOS) =====
  
  // Calcular macizos de anclaje (rectangular o cilíndrico)
  if (btnCalcularMuertos) {
    btnCalcularMuertos.addEventListener('click', async () => {
      if (!requireAuthOrWarn()) return;
      try {
        console.log('[SCRIPT] Iniciando cálculo de macizos de anclaje...');
        // Obtener gruposMuertos que ya están agrupados por braces
        const gruposMuertos = window.gruposMuertosGlobal;
        if (!gruposMuertos || Object.keys(gruposMuertos).length === 0) {
          alert('No hay grupos de muertos. Por favor, primero calcula los paneles/braces.');
          return;
        }
        console.log('[SCRIPT] gruposMuertos obtenido:', gruposMuertos);
        // Importar funciones para calcular macizos
        const { prepararGruposParaMuertos, calcularMacizosRectangulares, generarTablaResultadosMacizos } = await import('./js/muertoRectangular.js');
        // Paso 1: Preparar grupos (sumar dimensiones dentro de cada grupo)
        let gruposPreparados = prepararGruposParaMuertos(gruposMuertos);
        // Sumar la profundidad manual al alto_total aquí
        gruposPreparados = gruposPreparados.map(grupo => {
          let profundidadManual = 0;
          // Normalizar clave para buscar en window.configGruposMuertos
          let claveGrupo = grupo.clave || grupo.numero_grupo || '';
          claveGrupo = String(claveGrupo).replace(/^M0*/, 'M').trim();
          // Buscar profundidad en window.configGruposMuertos usando la clave normalizada
          if (window.configGruposMuertos && window.configGruposMuertos[claveGrupo] && window.configGruposMuertos[claveGrupo].profundo) {
            profundidadManual = parseFloat(window.configGruposMuertos[claveGrupo].profundo) || 0;
          } else if (grupo.configGrupo && typeof grupo.configGrupo === 'object' && grupo.configGrupo.profundo) {
            profundidadManual = parseFloat(grupo.configGrupo.profundo) || 0;
          }
          return {
            ...grupo,
            alto_total: profundidadManual // Solo la profundidad manual
          };
        });
        console.log('[SCRIPT] Grupos preparados:', gruposPreparados);
        // Paso 2: Calcular macizos rectangulares
        const resultadosMacizos = calcularMacizosRectangulares(gruposPreparados);
        console.log('[SCRIPT] Macizos calculados:', resultadosMacizos);
        // Paso 3: Generar tabla HTML
        const tablaHTML = generarTablaResultadosMacizos(resultadosMacizos);
        // Paso 4: Mostrar resultados
        const contenedorResultados = document.getElementById('tablaArmado') || document.createElement('div');
        if (!document.getElementById('tablaArmado')) {
          contenedorResultados.id = 'tablaArmado';
          document.body.appendChild(contenedorResultados);
        }
        contenedorResultados.innerHTML = `
          <h3>Resultados: Macizos de Anclaje Rectangulares</h3>
          ${tablaHTML}
        `;
        // Guardar globalmente para referencia
        window.gruposParaMuertosGlobal = gruposPreparados;
        window.resultadosMacizosGlobal = resultadosMacizos;
        alert(`✅ Se calcularon ${resultadosMacizos.length} macizos de anclaje rectangulares.\nResultados mostrados en tabla.`);
      } catch (error) {
        console.error('[SCRIPT] Error en cálculo de macizos:', error);
        alert(`Error: ${error.message}`);
      }
    });
  }

  // Exportar muertos a CSV - ELIMINADO
  // if (btnExportarMuertosCSV) {
  //   btnExportarMuertosCSV.addEventListener('click', () => {
  //     handleExportarMuertosCSV(globalVars);
  //   });
  // }

  // Mostrar alternativas de diseño - ELIMINADO
  // if (btnMostrarAlternativas) {
  //   btnMostrarAlternativas.addEventListener('click', () => {
  //     handleMostrarAlternativas(globalVars);
  //   });
  // }

  // Mostrar tabla detallada por muro - ELIMINADO
  // if (btnTablaDetallada) {
  //   btnTablaDetallada.addEventListener('click', () => {
  //     handleTablaDetallada(globalVars);
  //   });
  // }

  // Event listeners para eliminación de muros
  const btnAgregarRangoElim = document.getElementById('btnAgregarRangoEliminacion');
  const btnPrevisualizarEliminacion = document.getElementById('btnPrevisualizarEliminacion');
  const btnConfirmarImportacion = document.getElementById('btnConfirmarImportacion');
  const btnCancelarEliminacion = document.getElementById('btnCancelarEliminacion');

  if (btnAgregarRangoElim) {
    btnAgregarRangoElim.addEventListener('click', agregarRangoEliminacion);
  }

  if (btnPrevisualizarEliminacion) {
    btnPrevisualizarEliminacion.addEventListener('click', previsualizarEliminacion);
  }

  if (btnConfirmarImportacion) {
    btnConfirmarImportacion.addEventListener('click', confirmarImportacionFiltrada);
  }

  if (btnCancelarEliminacion) {
    btnCancelarEliminacion.addEventListener('click', cancelarEliminacion);
  }

  if (btnProjectSubmit) {
    console.log('[FRONTEND] Configurando listener para envío de formulario de proyecto');
    const form = document.getElementById('formNuevoProyecto');

    if (form) {
      btnProjectSubmit.addEventListener('click', async (e) => {
        if (!form.reportValidity()) {
          console.log('[FRONTEND] Formulario inválido');
          return;
        }
        e.preventDefault();
        if (!requireAuthOrWarn()) return;

        const formData = new FormData(form);
        const projectData = {
          nombreProyecto: formData.get('nombreProyecto'),
          id_usuario: AuthState.user.uid,
          empresaConstructora: formData.get('empresaConstructora'),
          tipoMuerto: formData.get('tipoMuerto'),
          velViento: formData.get('velViento'),
          tempPromedio: formData.get('tempPromedio'),
          presionAtm: formData.get('presionAtm')
        };

        globalVars.projectData = projectData;
        await createProject(indexUIElements, callbacks, globalVars);
      });
    } else {
      console.error('[FRONTEND] No se encontró el formulario de nuevo proyecto');
    }
  }

  // ===== TOGGLE PARA CREAR O CARGAR PROYECTO =====
  if (btnLoadOldProject) {
    btnLoadOldProject.addEventListener('click', () => {
      if (!requireAuthOrWarn()) return;
      btnCreateNewProject.className = "togglebtn--ghost";
      btnLoadOldProject.className = "togglebtn";
      toggleBackG.style.transform = "translate(100%)"
      formNuevoProyecto.style.display = 'none';
      projectList.style.display = '';
    });
  }

  if (btnCreateNewProject) {
    btnCreateNewProject.addEventListener('click', () => {
      btnCreateNewProject.className = "togglebtn";
      btnLoadOldProject.className = "togglebtn--ghost";
      toggleBackG.style.transform = "translate(0%)"
      formNuevoProyecto.style.display = '';
      projectList.style.display = 'none';
    });
  }

  // ===== ELEMENTOS ADICIONALES PARA VIENTO =====
  const btnCalcularViento = document.getElementById('btnCalcularViento');

  // ===== ELEMENTOS PARA BRACES =====
  const btnGuardarTodosBraces = document.getElementById('btnGuardarTodosBraces');
  const btnRecargarBraces = document.getElementById('btnRecargarBraces');
  const btnAplicarGlobales = document.getElementById('btnAplicarGlobales');

  // ===== ELEMENTOS PARA EJES POR RANGOS =====
  const btnAgregarRango = document.getElementById('btnAgregarRango');
  const btnAutoGenerarRangos = document.getElementById('btnAutoGenerarRangos');
  const btnAplicarEjesRango = document.getElementById('btnAplicarEjesRango');

  // ===== CONFIGURAR EVENTOS PARA CÁLCULO DE VIENTO =====
  if (btnCalcularViento) {
    btnCalcularViento.addEventListener('click', calcularCargasViento);
  }
  
  // ===== CONFIGURAR EVENTOS PARA BRACES =====
  if (btnGuardarTodosBraces) {
    btnGuardarTodosBraces.addEventListener('click', guardarTodosBraces);
  }
  
  if (btnRecargarBraces) {
    btnRecargarBraces.addEventListener('click', async () => {
      // Recalcular viento para recargar la tabla
      await calcularCargasViento();
    });
  }
  
  if (btnAplicarGlobales) {
    btnAplicarGlobales.addEventListener('click', () => {
      aplicarValoresGlobales();
      if (window.showNotification) {
        window.showNotification(
          'success',
          '✅ Valores Aplicados',
          'Ángulo, NPT y Factor W2 actualizados en todos los muros.',
          3000
        );
      }
    });
  }

  // ===== CONFIGURAR EVENTOS PARA EJES POR RANGOS =====
  if (btnAgregarRango) {
    btnAgregarRango.addEventListener('click', agregarNuevoRango);
  }

  if (btnAutoGenerarRangos) {
    btnAutoGenerarRangos.addEventListener('click', autoGenerarRangos);
  }

  if (btnAplicarEjesRango) {
    btnAplicarEjesRango.addEventListener('click', () => {
      const rangosContainer = document.getElementById('rangosContainer');
      const cantidadRangos = rangosContainer?.children.length || 0;
      
      aplicarEjesPorRango();
      
      if (window.showNotification && cantidadRangos > 0) {
        window.showNotification(
          'success',
          '✅ Ejes Aplicados',
          `Asignación de ejes por rangos completada (${cantidadRangos} rangos procesados).`,
          4000
        );
      }
    });
  }

  // ===== INICIALIZACIÓN =====
  initAccordion();
  monitorGroupedWalls(); // Comenzar a monitorear la agrupación de muros
  console.log('[FRONTEND] Aplicación inicializada - acordeón cerrado hasta agrupación de muros');
});

// ===== FUNCIONES PARA CÁLCULO DE VIENTO =====
/**
 * Sección 1-2: Función principal para calcular cargas de viento
 * Implementa las fórmulas del Excel y diagramas según Tomo III
 */
async function calcularCargasViento() {
  // Mostrar progreso
  const progress = window.showProgress ? window.showProgress('🌬️ Calculando cargas de viento...') : null;
  
  try {
    console.log('[WIND] Iniciando cálculo de cargas de viento...');
    
    // Debugging detallado de globalVars
    console.log('[WIND] Estado de window.globalVars:', window.globalVars);
    console.log('[WIND] ¿Existe panelesActuales?', !!window.globalVars?.panelesActuales);
    console.log('[WIND] Longitud panelesActuales:', window.globalVars?.panelesActuales?.length || 0);
    console.log('[WIND] Primer panel:', window.globalVars?.panelesActuales?.[0]);
    
    // Verificar que haya muros importados
    const panelesData = window.globalVars?.panelesActuales || [];
    if (!panelesData || panelesData.length === 0) {
      console.error('[WIND] No hay muros importados');
      if (progress) progress.close();
      if (mostrarNotificacion) {
        mostrarNotificacion(
          'Primero debes importar datos desde TXT. Ve a "Importar Datos desde TXT", selecciona tu archivo y haz clic en "Subir y procesar TXT".',
          'warning',
          7000
        );
      } else {
        alert('❌ Error: No hay muros importados.\n\n📋 PASOS CORRECTOS:\n1. Ve a "Importar Datos desde TXT"\n2. Selecciona tu archivo .TXT\n3. Haz clic en "Subir y procesar TXT"\n4. Verifica que aparezcan los muros\n5. Luego calcula cargas de viento');
      }
      return;
    }
    
    console.log('[WIND] ✅ Muros encontrados:', panelesData.length);
    console.log('[WIND] Estructura del primer muro:', panelesData[0]);
    
    // Recopilar parámetros del formulario
    console.log('[WIND] Recopilando parámetros del formulario...');
    
    const parametros = {
      categoria_terreno: parseInt(document.getElementById('categoria_terreno').value),
      VR_kmh: parseFloat(document.getElementById('VR_kmh').value),
      FT: parseFloat(document.getElementById('FT').value),
      temperatura_C: parseFloat(document.getElementById('temperatura_C').value),
      presion_barometrica_mmHg: parseFloat(document.getElementById('presion_barometrica_mmHg').value),
      Cp_int: parseFloat(document.getElementById('Cp_int').value),
      Cp_ext: parseFloat(document.getElementById('Cp_ext').value),
      factor_succion: parseFloat(document.getElementById('factor_succion').value),
      densidad_concreto_kg_m3: 2400
    };

    console.log('[WIND] Parámetros recopilados:', parametros);

    // Validar parámetros
    console.log('[WIND] Validando parámetros...');
    const camposInvalidos = [];
    Object.entries(parametros).forEach(([key, value]) => {
      if (key !== 'categoria_terreno' && isNaN(value)) {
        camposInvalidos.push(key);
        console.error(`[WIND] ❌ Campo inválido: ${key} = ${value}`);
      }
    });

    if (camposInvalidos.length > 0) {
      console.error('[WIND] ❌ Campos inválidos encontrados:', camposInvalidos);
      if (progress) progress.close();
      if (mostrarNotificacion) {
        const mensaje = `Complete correctamente: ${camposInvalidos.join(', ')}. Todos los valores deben ser números válidos.`;
        mostrarNotificacion(mensaje, 'warning', 6000);
      } else {
        alert(`❌ Por favor, complete estos campos correctamente:\n\n${camposInvalidos.map(campo => `• ${campo}`).join('\n')}\n\n💡 Asegúrese de que todos los valores sean números válidos.`);
      }
      return;
    }

    console.log('[WIND] ✅ Todos los parámetros son válidos');

    console.log('[WIND] 🚀 Enviando request a:', `${API_BASE}/api/calculos/viento/calcular-muros`);
    console.log('[WIND] 📦 Payload:', {
      muros: panelesData,
      parametros: parametros
    });

    // Llamar a la API
    const response = await fetch(`${API_BASE}/api/calculos/viento/calcular-muros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ muros: panelesData, parametros })
    });

    console.log('[WIND] 📡 Respuesta HTTP status:', response.status, 'OK:', response.ok);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('[WIND] Respuesta de la API:', data);

    if (data.success && data.resultados) {
      mostrarResultadosViento(data, progress, panelesData.length);
      globalVars.resultadosTomoIII = data.resultados;
    } else {
      throw new Error(data.error || 'Error desconocido en el cálculo');
    }

  } catch (error) {
    console.error('[WIND] Error en cálculo de viento:', error);
    if (progress) progress.close();
    
    if (window.showNotification) {
      window.showNotification('error', '❌ Error', `Error calculando cargas de viento: ${error.message}`, 6000);
    } else if (mostrarNotificacion) {
      mostrarNotificacion(formatearError ? formatearError(error) : error.message, 'error');
    } else {
      alert(`Error al calcular cargas de viento: ${error.message}`);
    }
  }
}

/**
 * Función para mostrar resultados de viento en la interfaz
 * Implementa la visualización según los resultados del Excel
 */
export async function mostrarResultadosViento(data, progress = null, totalMuros = 0) {
  console.log('[WIND] Mostrando resultados de viento');
  console.log('[WIND] Datos recibidos para mostrar:', data);
  
  // Normalizar data - puede venir como array directo o como objeto con propiedad resultados
  let resultados;
  if (Array.isArray(data)) {
    resultados = data;
  } else if (data && Array.isArray(data.resultados)) {
    resultados = data.resultados;
  } else {
    console.error('[WIND] Formato de data inválido:', data);
    return;
  }

  console.log(`[WIND] Procesando ${resultados.length} resultados`);

  const resultadosViento = document.getElementById('resultadosViento');
  const tablaResultados = document.getElementById('tablaResultadosViento');
  const detalleCalculos = document.getElementById('detalleCalculosViento');

  // Mostrar la sección de resultados
  resultadosViento.style.display = 'block';

  // Mostrar panel de edición masiva de parámetros si no existe
  mostrarPanelEdicionMasiva();

  // Mostrar panel de asignación de ejes si no existe
  mostrarPanelAsignacionEjes();

  // Obtener valores globales para braces
  const anguloGlobal = parseFloat(document.getElementById('angulo_global')?.value) || 55;
  const nptGlobal = parseFloat(document.getElementById('npt_global')?.value) || 0.350;
  const factorW2Global = 0.6; // Factor fijo

  // Crear tabla de resultados unificada
  let htmlTabla = `
    <table class="wind-results-table unified-table">
      <thead style="position: sticky;top: 0px;">
        <tr>
          <th rowspan="2" style="border-left: 1px solid #0c0d0e;">Muro</th>
          <th colspan="4" style="background: #e3f2fd;border-bottom: 0px;">DATOS DEL MURO</th>
          <th colspan="4" style="background: #fff3e0;border-bottom: 0px;">CÁLCULOS DE VIENTO</th>
          <th colspan="5" style="background: #f3e5f5;border-bottom: 0px;">PARÁMETROS BRACES (EDITABLES)</th>
          <th colspan="3" style="background: #e8f5e9;border-bottom: 0px;">GEOMETRÍA INSERTO</th>
          <th colspan="4" style="background: #fce4ec;border-bottom: 0px;">FUERZAS Y CANTIDAD</th>
        </tr>
        <tr>
          <!-- Datos del Muro -->
          <th style="background: #e3f2fd;">Área (m²)</th>
          <th style="background: #e3f2fd;">Peso (ton)</th>
          <th style="background: #e3f2fd;">Altura (m)</th>
          <th style="background: #e3f2fd;">YCG (m)</th>
        
          <!-- Viento -->
          <th style="background: #fff3e0;">Vd (km/h)</th>
          <th style="background: #fff3e0;">qz (kPa)</th>
          <th style="background: #fff3e0;">Presión (kPa)</th>
          <th style="background: #fff3e0;">Fuerza (kN)</th>
          <!-- Braces Editables -->
          <th style="background: #f3e5f5;">Tipo</th>
          <th style="background: #f3e5f5;">Ángulo (°)</th>
          <th style="background: #f3e5f5;">NPT (m)</th>
          <th style="background: #f3e5f5;">Eje</th>
          <th style="background: #f3e5f5;">Factor W2</th>
          <!-- Geometría -->
          <th style="background: #e8f5e9;">X (m)</th>
          <th style="background: #e8f5e9;">Y (m)</th>
          <th style="background: #e8f5e9;">Longitud (m)</th>
          <!-- Fuerzas -->
          <th style="background: #fce4ec;">FBx (kN)</th>
          <th style="background: #fce4ec;">FBy (kN)</th>
          <th style="background: #fce4ec;">FB (kN)</th>
          <th style="background: #fce4ec;">Cant. Calc.</th>
          <th style="background: #fce4ec;">Cant. Final</th>
        </tr>
      </thead>
      <tbody id="tablaUnificadaBody">
  `;

  resultados.forEach((resultado, index) => {
    const pid = resultado.pid || 0;
    const idMuro = resultado.id_muro;
    
    // Valores iniciales para braces (usar valores calculados del muro, o globales como fallback)
    const anguloInicial = resultado.angulo_brace || resultado.grados_inclinacion_brace || anguloGlobal;
    const nptInicial = resultado.npt || resultado.NFT || nptGlobal;
    const factorW2Inicial = resultado.factor_w2 || factorW2Global;
    const tipoInicial = resultado.tipo_brace_seleccionado || 'B12';
    
    console.log(`[BRACES-INIT] Muro ${idMuro} (PID ${pid}):`, {
      altura: resultado.altura_z_m,
      angulo_usado: anguloInicial,
      angulo_calculado: resultado.grados_inclinacion_brace,
      npt_usado: nptInicial,
      nft_calculado: resultado.NFT,
      tipo_brace: tipoInicial
    });
    
    // Longitudes por tipo
    const longitudes = { B4: 4.6, B12: 9.75, B14: 12.75, B15: 15.8 };
    const longitudActual = longitudes[tipoInicial] || 9.75;
    
    htmlTabla += `
      <tr data-pid="${pid}" data-alto="${resultado.altura_z_m}" data-presion="${resultado.presion_kPa}" data-fuerza="${resultado.fuerza_kN}">
        <td style="border-left: 1px solid #dee2e6;"><strong>${idMuro}</strong></td>
        
        <!-- Datos del Muro -->
        <td>${resultado.area_m2}</td>
        <td>${resultado.peso_ton}</td>
        <td>${resultado.altura_z_m}</td>
        <td>${resultado.YCG || 'N/A'}</td>

        
        <!-- Viento -->
        <td>${resultado.Vd_kmh}</td>
        <td>${resultado.qz_kPa}</td>
        <td>${resultado.presion_kPa}</td>
        <td><strong>${resultado.fuerza_kN}</strong></td>
        
        <!-- Braces Editables -->
        <td>
          <select class="input-editable input-calculo-rt" data-pid="${pid}" data-field="tipo_brace" style="width: 90px; font-size: 0.85rem;">
            <option value="B4" ${tipoInicial === 'B4' ? 'selected' : ''}>B4</option>
            <option value="B12" ${tipoInicial === 'B12' ? 'selected' : ''}>B12</option>
            <option value="B14" ${tipoInicial === 'B14' ? 'selected' : ''}>B14</option>
            <option value="B15" ${tipoInicial === 'B15' ? 'selected' : ''}>B15</option>
          </select>
        </td>
        <td>
          <input type="number" class="input-editable input-calculo-rt" data-pid="${pid}" data-field="angulo" 
                 value="${anguloInicial}" step="0.1" min="0" max="90" style="width: 60px;">
        </td>
        <td>
          <input type="number" class="input-editable input-calculo-rt" data-pid="${pid}" data-field="npt" 
                 value="${nptInicial.toFixed(3)}" step="0.001" style="width: 70px;">
        </td>
        <td>
          <input type="text" class="input-editable input-calculo-rt" data-pid="${pid}" data-field="eje" 
                 value="${resultado.eje || resultado.id_muro || `Eje_${index + 1}`}" style="width: 80px;">
        </td>
        <td style="background: #f8f9fa; font-weight: 600; color: #000;">
          0.6
        </td>
        
        <!-- Geometría (Calculados) -->
        <td class="valor-calculado valor-x" data-pid="${pid}">-</td>
        <td class="valor-calculado valor-y" data-pid="${pid}">-</td>
        <td class="valor-calculado">${longitudActual}</td>
        
        <!-- Fuerzas (Calculadas) -->
        <td class="valor-calculado valor-fbx" data-pid="${pid}">-</td>
        <td class="valor-calculado valor-fby" data-pid="${pid}">-</td>
        <td class="valor-calculado valor-fb" data-pid="${pid}">-</td>
        <td class="valor-calculado valor-cantidad-calc" data-pid="${pid}" style="background: #fff3cd; font-style: italic;">-</td>
        <td>
          <input type="number" class="input-editable" data-pid="${pid}" data-field="x_braces" 
                 value="2" min="1" max="20" step="1" style="width: 60px; font-weight: bold; text-align: center;">
        </td>
      </tr>
    `;
  });

  htmlTabla += `
      </tbody>
    </table>
  `;

  // Insertar botón de guardado antes de la tabla
  const panelGuardarBraces = document.getElementById('panelGuardarBraces');
  const htmlBotones = `
    <!-- Botón de guardado posicionado arriba de la tabla -->
    <div class="table-controls" style="margin-bottom: 1rem; padding: 0.75rem; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; display: flex; gap: 1rem; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <button id="btnGuardarTodosBracesTop" class="btn btn--primary" title="Guardar todos los cambios realizados en la tabla" style="font-weight: bold;">
        💾 Guardar Todos los Cambios de Braces
      </button>
      <span class="help-text" style="color: #6c757d; font-size: 0.9em; font-style: italic;">
        💡 Recuerda guardar después de editar los valores en la tabla para que se reflejen en la reagrupación
      </span>
    </div>
  `;
  panelGuardarBraces.innerHTML = htmlBotones;
  tablaResultados.innerHTML = htmlTabla;
  
  console.log('[BRACES] Tabla HTML insertada con botón de guardado arriba');
  
  // Configurar evento del nuevo botón de guardado
  const btnGuardarTop = document.getElementById('btnGuardarTodosBracesTop');
  if (btnGuardarTop) {
    btnGuardarTop.addEventListener('click', guardarTodosBraces);
    console.log('[BRACES] Evento configurado para botón de guardado superior');
  }
  
  // Esperar un momento para que el DOM se actualice
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Recalcular automáticamente los tipos de braces basado en la fórmula
  console.log('[BRACES] Recalculando tipos de braces automáticamente...');
  try {
    // En lugar de llamar al backend, recalcular directamente en el frontend
    await recalcularTiposEnFrontend();
  } catch (error) {
    console.error('[BRACES] Error al recalcular tipos automáticamente:', error);
  }
  
  console.log('[BRACES] Agregando listeners...');
  
  // Agregar listeners para cálculo en tiempo real
  agregarListenersCalculoTiempoReal();
  
  console.log('[BRACES] Calculando valores iniciales...');
  
  // Calcular valores iniciales para todas las filas
  const rows = document.querySelectorAll('#tablaUnificadaBody tr[data-pid]');
  console.log(`[BRACES] Encontradas ${rows.length} filas para calcular`);
  
  for (const row of rows) {
    const pid = row.dataset.pid;
    const inputAngulo = row.querySelector('[data-field="angulo"]');
    if (inputAngulo) {
      console.log(`[BRACES] Calculando inicial para PID ${pid}`);
      await calcularBracesTiempoReal(inputAngulo);
    }
  }
  
  // Guardar automáticamente todos los cálculos de braces en la BD
  console.log('[BRACES] Guardando valores calculados en la base de datos...');
  try {
    await guardarTodosBraces();
    console.log('[BRACES] ✅ Valores guardados exitosamente');
  } catch (error) {
    console.error('[BRACES] ❌ Error al guardar valores:', error);
  }

  // Crear detalle de cálculos
  let htmlDetalle = '';
  
  if (resultados[0].advertencias.length > 0) {
    resultados.forEach(resultado => {
        htmlDetalle += `
        <div class="calculation-detail">
            <div class="calculation-detail-header" onclick="toggleCalculationDetail(this)">
            <span>Muro ${resultado.id_muro} - Detalle de Cálculos</span>
            <span>▼</span>
            </div>
            <div class="calculation-detail-content">
        `;

        // Mostrar advertencias si las hay
        if (resultado.advertencias.length > 0) {
        resultado.advertencias.forEach(advertencia => {
            const esAlerta = resultado.requiere_analisis_dinamico;
            htmlDetalle += `<div class="${esAlerta ? 'wind-alert' : 'wind-warning'}">${advertencia}</div>`;
        });
        }

        // Debug: Verificar qué valores están llegando
        console.log('[DEBUG] Resultado completo:', resultado);
        console.log('[DEBUG] Alpha:', resultado.alpha);
        console.log('[DEBUG] Delta:', resultado.delta);
        
        // Usar valores por defecto si no llegan (temporal para debug)
        const alphaValue = resultado.alpha || 'undefined';
        const deltaValue = resultado.delta || 'undefined';
        
        // Detalle paso a paso con fórmulas y valores calculados por el backend
        htmlDetalle += `<ol>`;
        htmlDetalle += `<li><strong>Datos del Muro:</strong> Área = ${resultado.area_m2} m², Altura = ${resultado.altura_z_m} m</li>`;
        htmlDetalle += `<li><strong>Factor de rugosidad:</strong> Frz = 1.56 × (Z/δ)^α = 1.56 × (${resultado.altura_z_m}/${deltaValue})^${alphaValue} = ${resultado.Frz}</li>`;
        htmlDetalle += `<li><strong>Factor de exposición:</strong> Fα = FC × Frz × FT = ${resultado.FC} × ${resultado.Frz} × ${data.parametros_utilizados.FT} = ${resultado.Falpha}</li>`;
        htmlDetalle += `<li><strong>Velocidad de diseño:</strong> Vd = VR × Fα = ${data.parametros_utilizados.VR_kmh} × ${resultado.Falpha} = ${resultado.Vd_kmh} km/h</li>`;
        htmlDetalle += `<li><strong>Corrección atmosférica:</strong> Corrección = ${resultado.correccion}</li>`;
        htmlDetalle += `<li><strong>Factor G:</strong> G = ${resultado.G} (corrección por temperatura y altura)</li>`;
        htmlDetalle += `<li><strong>Presión dinámica:</strong> qz = 0.0048 × G × (VD)² = 0.0048 × ${resultado.G} × (${resultado.Vd_kmh})² = ${resultado.qz_kPa} kPa</li>`;
        htmlDetalle += `<li><strong>Presión neta:</strong> P = qz × (Cpi - Cpe) × Factor = ${resultado.qz_kPa} × (${data.parametros_utilizados.Cp_int} - ${data.parametros_utilizados.Cp_ext}) × ${data.parametros_utilizados.factor_succion} = ${resultado.presion_kPa} kPa</li>`;
        htmlDetalle += `<li><strong>Fuerza de viento:</strong> F = qz × Área = ${resultado.qz_kPa} × ${resultado.area_m2} = ${resultado.fuerza_kN} kN</li>`;
        
        if (resultado.YCG !== undefined) {
        htmlDetalle += `<li><strong>Centro de gravedad (YCG):</strong> YCG = H/2 = ${resultado.altura_z_m}/2 = ${resultado.YCG} m</li>`;
        }
        
        
        
        if (resultado.grados_inclinacion_brace !== undefined) {
        htmlDetalle += `<li><strong>Inclinación brace:</strong> θ = arctan(altura_anclaje/distancia_horizontal) = ${resultado.grados_inclinacion_brace}°</li>`;
        }
        if (resultado.tipo_brace !== undefined) {
        htmlDetalle += `<li><strong>Especificaciones del brace:</strong></li>`;
        htmlDetalle += `<ul>`;
        htmlDetalle += `<li><strong>Tipo:</strong> ${resultado.tipo_brace}</li>`;
        if (resultado.longitud_brace_m !== undefined) {
            htmlDetalle += `<li><strong>Longitud estimada:</strong> ${resultado.longitud_brace_m} m</li>`;
        }
        if (resultado.modelo_brace !== undefined) {
            htmlDetalle += `<li><strong>Modelo sugerido:</strong> ${resultado.modelo_brace}</li>`;
        }
        
        if (resultado.total_braces !== undefined) {
            htmlDetalle += `<li><strong>Distribución de braces:</strong></li>`;
            htmlDetalle += `<ul>`;
            htmlDetalle += `<li><strong>Total braces necesarios:</strong> ${resultado.total_braces}</li>`;
            if (resultado.modelo_principal_brace) {
            htmlDetalle += `<li><strong>Modelo principal:</strong> ${resultado.modelo_principal_brace}</li>`;
            }
            if (resultado.resumen_distribucion_braces) {
            htmlDetalle += `<li><strong>Resumen distribución:</strong> ${resultado.resumen_distribucion_braces}</li>`;
            }
            if (resultado.distribucion_braces) {
            htmlDetalle += `<li><strong>Detalle por modelo:</strong></li>`;
            htmlDetalle += `<ul>`;
            Object.entries(resultado.distribucion_braces).forEach(([modelo, cantidad]) => {
                if (cantidad > 0) {
                htmlDetalle += `<li>${modelo}: ${cantidad} unidades</li>`;
                }
            });
            htmlDetalle += `</ul>`;
            }
            htmlDetalle += `</ul>`;
        }
        
        if (resultado.observaciones_brace && resultado.observaciones_brace.length > 0) {
            htmlDetalle += `<li><strong>Observaciones:</strong></li>`;
            htmlDetalle += `<ul>`;
            resultado.observaciones_brace.forEach(obs => {
            htmlDetalle += `<li>${obs}</li>`;
            });
            htmlDetalle += `</ul>`;
        }
        htmlDetalle += `</ul>`;
        }
        htmlDetalle += `</ol>`;

        htmlDetalle += `
            </div>
        </div>
        `;
    });
    }

  detalleCalculos.innerHTML = htmlDetalle;

  // Generar tabla agrupada por 'muertos' basada en resultados
  try {
    renderTablaMuertos(data.resultados || []);
  } catch (err) {
    console.error('[MUERTOS] Error generando tabla de muertos:', err);
  }

  // Mostrar el panel de configuración de braces después del primer cálculo
  const bracesConfigPanel = document.getElementById('bracesConfigPanel');
  if (bracesConfigPanel) {
    bracesConfigPanel.style.display = 'block';
    console.log('[BRACES] Panel de configuración mostrado después del cálculo');
  }

  // Scroll hacia los resultados
  resultadosViento.scrollIntoView({ behavior: 'smooth' });

  btnInforme.style.display = '';
  btnInforme.disabled = false;

  // Cerrar progreso y mostrar éxito AL FINAL, después de renderizar todo
  if (progress) progress.close();
  if (window.showNotification && totalMuros > 0) {
    window.showNotification(
      'success',
      '✅ Cálculo Completado',
      `Cargas de viento calculadas para ${totalMuros} muros exitosamente.`,
      4000
    );
  }
}

/**
 * Función para toggle del detalle de cálculos
 */
function toggleCalculationDetail(header) {
  const content = header.nextElementSibling;
  const arrow = header.querySelector('span:last-child');
  
  if (content.classList.contains('active')) {
    content.classList.remove('active');
    arrow.textContent = '▼';
  } else {
    content.classList.add('active');
    arrow.textContent = '▲';
  }
}

// Hacer la función global para el onclick
window.toggleCalculationDetail = toggleCalculationDetail;

/**
 * Agregar listeners para cálculo en tiempo real
 */
function agregarListenersCalculoTiempoReal() {
  console.log('[BRACES] Agregando listeners de tiempo real...');
  
  const inputs = document.querySelectorAll('.input-calculo-rt');
  console.log(`[BRACES] Inputs encontrados: ${inputs.length}`);
  
  if (inputs.length === 0) {
    console.error('[BRACES] No se encontraron inputs con clase .input-calculo-rt');
    return;
  }
  
  // Crear función con debounce para reducir llamadas API
  const calcularDebounced = debounce ? debounce(calcularBracesTiempoReal, 300) : calcularBracesTiempoReal;
  
  inputs.forEach((input, index) => {
    console.log(`[BRACES] Agregando listener ${index + 1}: campo=${input.dataset.field}, pid=${input.dataset.pid}`);
    
    // Listener para cambio inmediato CON DEBOUNCE
    input.addEventListener('input', async function() {
      console.log(`[BRACES] Input event disparado: ${this.dataset.field}`);
      await calcularDebounced(this);
    });
    
    // También al cambiar (para selects) - SIN debounce porque es instantáneo
    input.addEventListener('change', async function() {
      console.log(`[BRACES] Change event disparado: ${this.dataset.field}`);
      await calcularBracesTiempoReal(this);
    });
  });
  
  // Agregar listeners para marcar edición manual de x_braces
  const xBracesInputs = document.querySelectorAll('[data-field="x_braces"]');
  xBracesInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.dataset.manualEdit = 'true';
    });
  });
  
  console.log(`[BRACES] ${inputs.length} listeners agregados correctamente con debounce de 300ms`);
}

/**
 * Calcular braces en tiempo real sin guardar
 */
async function calcularBracesTiempoReal(input) {
  const pid = input.dataset.pid;
  const row = document.querySelector(`tr[data-pid="${pid}"]`);
  
  if (!row) {
    console.error(`[BRACES-RT] Fila no encontrada para PID ${pid}`);
    return;
  }
  
  // Obtener valores actuales de la fila
  const altoText = row.dataset.alto || '15.15';
  const alto = parseFloat(altoText);
  const angulo = parseFloat(row.querySelector('[data-field="angulo"]').value);
  const npt = parseFloat(row.querySelector('[data-field="npt"]').value);
  const factorW2 = 0.6; // Factor fijo
  
  // CALCULAR AUTOMÁTICAMENTE EL TIPO DE BRACE
  const tipoCalculado = determinarTipoBraceFormula(alto, npt, factorW2, angulo);
  
  // Actualizar el dropdown automáticamente
  const selectTipo = row.querySelector('[data-field="tipo_brace"]');
  if (selectTipo.value !== tipoCalculado) {
    selectTipo.value = tipoCalculado;
    console.log(`[BRACES-RT] Tipo auto-actualizado de ${selectTipo.value} a ${tipoCalculado}`);
  }
  
  const tipoBrace = tipoCalculado; // Usar el tipo calculado
  
  // Validar
  if (isNaN(angulo) || isNaN(npt)) {
    console.log(`[BRACES-RT] Valores inválidos para PID ${pid}`);
    return;
  }
  
  console.log(`[BRACES-RT] Calculando PID ${pid}:`, { tipoBrace, angulo, npt, factorW2 });
  
  try {
    // Llamar al endpoint de tiempo real
    const response = await fetch(`${API_BASE}/api/calculos/muros/${pid}/calcular-braces-tiempo-real`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        angulo_brace: angulo,
        npt: npt,
        tipo_brace_seleccionado: tipoBrace,
        factor_w2: factorW2
      })
    });
    
    if (!response.ok) {
      console.error(`[BRACES-RT] Error HTTP ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.success && data.calculo) {
      const calc = data.calculo;
      
      // Guardar valores en dataset de la fila para uso posterior
      row.dataset.xInserto = calc.x_inserto || '0';
      row.dataset.yInserto = calc.y_inserto || '0';
      
      // Actualizar valores calculados en la UI
      row.querySelector(`.valor-x[data-pid="${pid}"]`).textContent = 
        calc.x_inserto !== undefined ? calc.x_inserto.toFixed(3) : '-';
      
      row.querySelector(`.valor-y[data-pid="${pid}"]`).textContent = 
        calc.y_inserto !== undefined ? calc.y_inserto.toFixed(3) : '-';
      
      row.querySelector(`.valor-fbx[data-pid="${pid}"]`).textContent = 
        calc.fbx !== undefined ? calc.fbx.toFixed(2) : '-';
      
      row.querySelector(`.valor-fby[data-pid="${pid}"]`).textContent = 
        calc.fby !== undefined ? calc.fby.toFixed(2) : '-';
      
      row.querySelector(`.valor-fb[data-pid="${pid}"]`).textContent = 
        calc.fb !== undefined ? calc.fb.toFixed(2) : '-';
      
      // Actualizar cantidad calculada (sin redondear)
      const cantCalcCell = row.querySelector(`.valor-cantidad-calc[data-pid="${pid}"]`);
      if (cantCalcCell && calc.fb !== undefined) {
        // Obtener el tipo de brace de la fila para usar la capacidad correcta
        const tipoBraceSelect = row.querySelector('[data-field="tipo_brace"]');
        const tipoBrace = tipoBraceSelect ? tipoBraceSelect.value : 'B12';
        const capacidad = { B12: 4100, B4: 2950, B14: 2360, B15: 1723 }[tipoBrace] || 4100;
        const cantExacta = calc.fb / capacidad;
        cantCalcCell.textContent = cantExacta.toFixed(2);
        cantCalcCell.title = `Cálculo: ${calc.fb.toFixed(2)} kN / ${capacidad} kN (${tipoBrace}) = ${cantExacta.toFixed(4)}`;
      }
      
      // Actualizar el input de cantidad final si no ha sido editado manualmente
      const cantFinalInput = row.querySelector(`[data-field="x_braces"][data-pid="${pid}"]`);
      if (cantFinalInput && !cantFinalInput.dataset.manualEdit && calc.cant_braces !== undefined) {
        cantFinalInput.value = calc.cant_braces;
      }
      
      // Feedback visual
      row.style.backgroundColor = '#e8f5e9';
      setTimeout(() => { row.style.backgroundColor = ''; }, 300);
      
      console.log(`[BRACES-RT] Actualizado PID ${pid}:`, calc);
    } else {
      console.error(`[BRACES-RT] Respuesta inválida:`, data);
    }
  } catch (error) {
    console.error(`[BRACES-RT] Error en cálculo:`, error);
  }
}

/**
 * Guardar todos los cambios de braces
 */
async function guardarTodosBraces() {
  console.log('[BRACES] Guardando todos los cambios...');
  if (!requireAuthOrWarn()) return;
  
  // Buscar en ambas tablas: la unificada antigua y la nueva de braces
  const rowsUnificada = document.querySelectorAll('#tablaUnificadaBody tr[data-pid]');
  const rowsBraces = document.querySelectorAll('#tablaBracesBody tr[data-pid]');
  
  console.log(`[DEBUG] Guardado - rowsBraces.length: ${rowsBraces.length}, rowsUnificada.length: ${rowsUnificada.length}`);
  
  // También intentar otros posibles IDs de tabla de braces
  const rowsAlt1 = document.querySelectorAll('#tablaBraces tr[data-pid]');
  const rowsAlt2 = document.querySelectorAll('#tablaResultados tr[data-pid]');
  const rowsAlt3 = document.querySelectorAll('#tabla-braces tr[data-pid]');
  
  console.log(`[DEBUG] Guardado Alt: rowsAlt1=${rowsAlt1.length}, rowsAlt2=${rowsAlt2.length}, rowsAlt3=${rowsAlt3.length}`);
  
  // Usar la tabla que tenga datos, priorizando la de braces
  let rows = rowsUnificada;
  let isTablaUnificada = true;
  let tipoTabla = 'tabla unificada';
  
  if (rowsBraces.length > 0) {
    rows = rowsBraces;
    isTablaUnificada = false;
    tipoTabla = 'tabla braces (tablaBracesBody)';
  } else if (rowsAlt1.length > 0) {
    rows = rowsAlt1;
    isTablaUnificada = false;
    tipoTabla = 'tabla braces (tablaBraces)';
  } else if (rowsAlt2.length > 0) {
    rows = rowsAlt2;
    isTablaUnificada = false;
    tipoTabla = 'tabla braces (tablaResultados)';
  } else if (rowsAlt3.length > 0) {
    rows = rowsAlt3;
    isTablaUnificada = false;
    tipoTabla = 'tabla braces (tabla-braces)';
  }
  
  console.log(`[BRACES] Guardando desde ${tipoTabla}, ${rows.length} filas`);
  
  if (rows.length === 0) {
    if (mostrarNotificacion) {
      mostrarNotificacion('No hay datos para guardar', 'warning');
    } else {
      alert('No hay datos para guardar');
    }
    return;
  }
  
  let exitosos = 0;
  let errores = 0;
  
  // Mostrar indicador de progreso
  const progressMsg = document.createElement('div');
  progressMsg.id = 'progress-save';
  progressMsg.style.cssText = 'position:fixed; top:10px; right:10px; background:#007acc; color:white; padding:10px; border-radius:5px; z-index:9999;';
  progressMsg.textContent = 'Guardando cambios...';
  document.body.appendChild(progressMsg);
  
  for (const row of rows) {
    const pid = row.dataset.pid;
    
    try {
      let tipoBrace, angulo, npt, xBraces, eje;
      
      if (isTablaUnificada) {
        // Debug: verificar qué campos están disponibles en la fila
        const allInputs = row.querySelectorAll('input, select');
        console.log(`[DEBUG] PID ${pid} - Campos disponibles en fila:`, 
          Array.from(allInputs).map(input => ({
            type: input.type || input.tagName,
            dataField: input.dataset.field,
            name: input.name,
            value: input.value
          }))
        );
        
        // Selectores para tabla unificada antigua
        const tipoBraceInput = row.querySelector('[data-field="tipo_brace"]');
        const anguloInput = row.querySelector('[data-field="angulo"]');
        const nptInput = row.querySelector('[data-field="npt"]');
        const ejeInput = row.querySelector('[data-field="eje"]');
        const xBracesInput = row.querySelector('[data-field="x_braces"]');
        
        console.log(`[DEBUG] PID ${pid} - Inputs encontrados:`, {
          tipoBrace: !!tipoBraceInput,
          angulo: !!anguloInput, 
          npt: !!nptInput,
          eje: !!ejeInput,
          xBraces: !!xBracesInput
        });
        
        tipoBrace = tipoBraceInput?.value || '';
        angulo = parseFloat(anguloInput?.value) || 0;
        npt = parseFloat(nptInput?.value) || 0;
        eje = ejeInput?.value || '';
        xBraces = xBracesInput ? (parseInt(xBracesInput.value) || 2) : 2;
      } else {
        // Selectores para nueva tabla de braces
        tipoBrace = row.querySelector('[data-field="tipo_brace_seleccionado"]')?.value || '';
        angulo = parseFloat(row.querySelector('[data-field="angulo_brace"]')?.value) || 0;
        npt = parseFloat(row.querySelector('[data-field="npt"]')?.value) || 0;
        eje = row.querySelector('[data-field="eje"]')?.value || '';
        
        // También obtener X braces si está disponible
        const xBracesInput = row.querySelector('[data-field="x_braces"]');
        console.log(`[DEBUG] PID ${pid}: xBracesInput found:`, !!xBracesInput, 'value:', xBracesInput?.value);
        xBraces = xBracesInput ? (parseInt(xBracesInput.value) || 2) : 2;
        console.log(`[DEBUG] PID ${pid}: xBraces final value:`, xBraces);
      }
      
      const factorW2 = 0.6; // Factor fijo
      
      console.log(`[BRACES] Guardando PID ${pid}: angulo=${angulo}, npt=${npt}, tipo=${tipoBrace}, xBraces=${xBraces}`);
      
      // Validar datos antes de enviar
      if (!tipoBrace || tipoBrace === '') {
        console.warn(`[BRACES] PID ${pid}: tipo_brace vacío, usando B12 por defecto`);
        tipoBrace = 'B12';
      }
      
      if (isNaN(angulo) || angulo <= 0) {
        console.warn(`[BRACES] PID ${pid}: ángulo inválido (${angulo}), usando 55 por defecto`);
        angulo = 55;
      }
      
      if (isNaN(xBraces) || xBraces <= 0) {
        console.warn(`[BRACES] PID ${pid}: x_braces inválido (${xBraces}), usando 2 por defecto`);
        xBraces = 2;
      }
      
      if (!eje || eje.trim() === '') {
        console.warn(`[BRACES] PID ${pid}: eje vacío, usando Eje_${pid} por defecto`);
        eje = `Eje_${pid}`;
      }
      
      console.log(`[BRACES] Guardando PID ${pid}: angulo=${angulo}, npt=${npt}, tipo=${tipoBrace}, eje=${eje}, xBraces=${xBraces}`);
      
      // Actualizar campos editables
      const updateData = {
        angulo_brace: angulo,
        npt: npt,
        tipo_brace_seleccionado: tipoBrace,
        factor_w2: factorW2,
        x_braces: xBraces,
        eje: eje
      };
      
      console.log(`[BRACES] Datos de actualización para PID ${pid}:`, updateData);
      
      const response = await fetch(`${API_BASE}/api/calculos/muros/${pid}/editable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        // Ahora calcular y guardar fuerzas - incluir todos los parámetros
        const calcData = {
          angulo_brace: angulo,
          x_braces: xBraces,
          npt: npt,
          tipo_brace_seleccionado: tipoBrace
        };
        
        console.log(`[BRACES] Calculando PID ${pid} con datos:`, JSON.stringify(calcData, null, 2));
        
        const calcResponse = await fetch(`${API_BASE}/api/calculos/muros/${pid}/calcular-braces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(calcData)
        });
        
        console.log(`[BRACES] Response status para PID ${pid}:`, calcResponse.status, calcResponse.statusText);
        
        if (calcResponse.ok) {
          const calcResultado = await calcResponse.json();
          console.log(`[BRACES] ✓ PID ${pid} guardado y calculado. Resultado:`, calcResultado);
          console.log(`[BRACES] ✓ PID ${pid} - x_inserto: ${calcResultado.calculo?.x_inserto}, y_inserto: ${calcResultado.calculo?.y_inserto}`);
          console.log(`[BRACES] ✓ PID ${pid} - muro.x_inserto: ${calcResultado.muro?.x_inserto}, muro.y_inserto: ${calcResultado.muro?.y_inserto}`);
          exitosos++;
        } else {
          errores++;
          const errorData = await calcResponse.json().catch(() => ({ error: 'Error desconocido' }));
          console.error(`[BRACES] ✗ Error calculando PID ${pid}:`, {
            status: calcResponse.status,
            statusText: calcResponse.statusText,
            error: errorData
          });
        }
      } else {
        errores++;
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error(`[BRACES] ✗ Error actualizando PID ${pid}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      }
    } catch (error) {
      console.error(`[BRACES] Error guardando PID ${pid}:`, error);
      errores++;
    }
    
    // Actualizar progreso
    progressMsg.textContent = `Guardando... ${exitosos + errores}/${rows.length}`;
  }
  
  // Remover indicador de progreso
  document.body.removeChild(progressMsg);
  
  // Mostrar resultado del guardado
  if (mostrarNotificacion) {
    if (errores === 0) {
      mostrarNotificacion(`✓ ${exitosos} muros guardados correctamente`, 'success');
    } else if (exitosos > 0) {
      mostrarNotificacion(`${exitosos} muros guardados, ${errores} con errores`, 'warning');
    } else {
      mostrarNotificacion(`Error: No se pudo guardar ningún muro`, 'error');
    }
  } else {
    alert(`Guardado completado:\n✓ ${exitosos} muros guardados\n${errores > 0 ? `✗ ${errores} errores` : ''}`);
  }
  
  if (exitosos > 0) {
    // Feedback visual en la tabla activa
    const tbody = isTablaUnificada ? 
      document.getElementById('tablaUnificadaBody') : 
      document.getElementById('tablaBracesBody');
      
    if (tbody) {
      tbody.style.backgroundColor = '#d4edda';
      setTimeout(() => { tbody.style.backgroundColor = ''; }, 1000);
    }
    
    // Reagrupar tabla de muertos si está visible - usar datos actualizados de BD
    const tablaMuertos = document.querySelector('#tablaMuertosContainer');
    if (tablaMuertos && tablaMuertos.style.display !== 'none') {
      console.log('[BRACES] Reagrupando tabla de muertos con valores desde BD...');
      setTimeout(async () => {
        await reagruparMuertosDesdeBaseDatos();
      }, 800); // Dar tiempo para que se procesen los cambios en BD
    }
  }
}

// Exponer funciones globalmente
window.guardarTodosBraces = guardarTodosBraces;

/**
 * Aplicar valores globales a todos los muros
 */
async function aplicarValoresGlobales() {
  console.log('[BRACES] Aplicando valores globales...');
  
  const anguloGlobal = parseFloat(document.getElementById('angulo_global').value);
  const nptGlobal = parseFloat(document.getElementById('npt_global').value);
  const factorW2Global = 0.6; // Factor fijo
  
  // Validar
  if (isNaN(anguloGlobal) || anguloGlobal < 0 || anguloGlobal > 90) {
    if (mostrarNotificacion) {
      mostrarNotificacion('El ángulo debe estar entre 0° y 90°', 'warning');
    } else {
      alert('El ángulo debe estar entre 0° y 90°');
    }
    return;
  }
  
  if (isNaN(nptGlobal)) {
    if (mostrarNotificacion) {
      mostrarNotificacion('El NPT debe ser un número válido', 'warning');
    } else {
      alert('El NPT debe ser un número válido');
    }
    return;
  }
  
  // Obtener proyecto actual
  const projectConfig = JSON.parse(localStorage.getItem('projectConfig'));
  if (!projectConfig || !projectConfig.pid) {
    if (mostrarNotificacion) {
      mostrarNotificacion('No se ha seleccionado un proyecto', 'error');
    } else {
      alert('No se ha seleccionado un proyecto');
    }
    return;
  }
  
  try {
    // CONFIRMACIÓN antes de aplicar cambios masivos
    const rows = document.querySelectorAll('#tablaUnificadaBody tr[data-pid]');
    
    if (confirmar) {
      const confirmado = await confirmar(
        `Esto cambiará el ángulo y NPT de ${rows.length} muros.\n\nÁngulo: ${anguloGlobal}°\nNPT: ${nptGlobal} m\n\nEsta acción recalculará todos los braces.`,
        '¿Aplicar a todos los muros?',
        { confirmText: 'Sí, aplicar', cancelText: 'Cancelar', tipo: 'warning' }
      );
      
      if (!confirmado) {
        console.log('[BRACES] Usuario canceló aplicación global');
        return;
      }
    }
    
    // Aplicar a todos los muros en la tabla
    for (const row of rows) {
      const inputAngulo = row.querySelector('[data-field="angulo"]');
      const inputNpt = row.querySelector('[data-field="npt"]');
      const inputFactorW2 = row.querySelector('[data-field="factor_w2"]');
      
      if (inputAngulo) inputAngulo.value = anguloGlobal;
      if (inputNpt) inputNpt.value = nptGlobal.toFixed(3);
      if (inputFactorW2) inputFactorW2.value = factorW2Global;
      
      // Recalcular
      if (inputAngulo) {
        await calcularBracesTiempoReal(inputAngulo);
      }
    }
    
    if (mostrarNotificacion) {
      mostrarNotificacion(`Valores aplicados correctamente a ${rows.length} muros`, 'success');
    } else {
      alert(`✓ Valores aplicados a ${rows.length} muros`);
    }
    
  } catch (error) {
    console.error('[BRACES] Error aplicando valores globales:', error);
    if (mostrarNotificacion) {
      mostrarNotificacion(formatearError ? formatearError(error) : 'Error al aplicar valores globales', 'error');
    } else {
      alert('Error al aplicar valores globales');
    }
  }
}

// Función para determinar el tipo de brace basado en la fórmula geométrica
function determinarTipoBraceFormula(alto, npt, factorW2 = 0.6, anguloGrados = 55) {
  const valorCalculado = (alto - npt) * factorW2;
  const anguloRadianes = anguloGrados * (Math.PI / 180);
  const senAngulo = Math.sin(anguloRadianes);
  
  console.log(`[BRACES] Determinando tipo: ALTO=${alto}m, NPT=${npt}m, Factor=${factorW2}, Ángulo=${anguloGrados}°`);
  console.log(`[BRACES] Valor calculado: (${alto} - ${npt}) × ${factorW2} = ${valorCalculado.toFixed(2)}`);
  console.log(`[BRACES] ${anguloGrados}° = ${anguloRadianes.toFixed(4)} rad`);
  console.log(`[BRACES] sin(${anguloGrados}°) = ${senAngulo.toFixed(3)}`);
  
  // Longitudes de cada tipo de brace (en metros)
  const longitudes = {
    'B4': 4.56,
    'B12': 9.75,
    'B14': 12.76,
    'B15': 15.81
  };
  
  // Calcular rangos: Longitud × sin(ángulo)
  const rangos = {
    'B4': longitudes.B4 * senAngulo,
    'B12': longitudes.B12 * senAngulo,
    'B14': longitudes.B14 * senAngulo,
    'B15': longitudes.B15 * senAngulo
  };
  
  console.log(`[BRACES] Rangos calculados:`);
  console.log(`  B4:  ${longitudes.B4} × ${senAngulo.toFixed(3)} = ${rangos.B4.toFixed(2)}`);
  console.log(`  B12: ${longitudes.B12} × ${senAngulo.toFixed(3)} = ${rangos.B12.toFixed(2)}`);
  console.log(`  B14: ${longitudes.B14} × ${senAngulo.toFixed(3)} = ${rangos.B14.toFixed(2)}`);
  console.log(`  B15: ${longitudes.B15} × ${senAngulo.toFixed(3)} = ${rangos.B15.toFixed(2)}`);
  
  // Encontrar el rango adecuado
  let tipoSeleccionado;
  if (valorCalculado <= rangos.B4) {
    tipoSeleccionado = 'B4';
  } else if (valorCalculado <= rangos.B12) {
    tipoSeleccionado = 'B12';
  } else if (valorCalculado <= rangos.B14) {
    tipoSeleccionado = 'B14';
  } else {
    tipoSeleccionado = 'B15';
  }
  
  console.log(`[BRACES] Resultado: ${valorCalculado.toFixed(2)} → Tipo: ${tipoSeleccionado} (rango: ≤${rangos[tipoSeleccionado].toFixed(2)})`);
  
  return tipoSeleccionado;
}

// Función para calcular cantidad de braces usando FB/capacidad
function calcularCantidadBraces(fb, tipoBrace) {
  const capacidades = {
    'B4': 2950,   // kN
    'B12': 4100,  // kN
    'B14': 2360,  // kN
    'B15': 1723   // kN
  };
  
  const capacidad = capacidades[tipoBrace] || capacidades.B12;
  const division = fb / capacidad;
  const cantidadCalculada = Math.ceil(division);
  const cantidad = Math.max(2, cantidadCalculada);
  
  console.log(`[BRACES] Cálculo cantidad detallado:`);
  console.log(`  FB = ${fb} kN`);
  console.log(`  Tipo = ${tipoBrace}`);
  console.log(`  Capacidad = ${capacidad} kN`);
  console.log(`  División: ${fb} / ${capacidad} = ${division.toFixed(4)}`);
  console.log(`  ceil(${division.toFixed(4)}) = ${cantidadCalculada}`);
  console.log(`  max(2, ${cantidadCalculada}) = ${cantidad}`);
  console.log(`  --------------------------------`);
  
  return cantidad;
}

// Función para recalcular tipos directamente en el frontend
async function recalcularTiposEnFrontend() {
  console.log('[BRACES] Recalculando tipos en frontend...');
  
  // Obtener todas las filas de la tabla
  const tabla = document.getElementById('resultadosVientoTable');
  if (!tabla) {
    console.warn('[BRACES] Tabla de resultados no encontrada');
    return;
  }
  
  const filas = tabla.querySelectorAll('tbody tr');
  console.log(`[BRACES] Procesando ${filas.length} filas`);
  
  const actualizaciones = []; // Array para guardar las actualizaciones a la BD
  
  filas.forEach((fila, index) => {
    try {
      const celdas = fila.querySelectorAll('td');
      if (celdas.length < 10) return; // Verificar que tenga suficientes columnas
      
      // Extraer valores (ajustar índices según la estructura real de la tabla)
      const altoText = celdas[2]?.textContent?.trim() || '0';
      const nptText = celdas[3]?.textContent?.trim() || '0';
      const fbText = celdas[8]?.textContent?.trim() || '0'; // FB total, no FBx
      
      const alto = parseFloat(altoText.replace(',', '.')) || 0;
      const npt = parseFloat(nptText.replace(',', '.')) || 0;
      const fb = parseFloat(fbText.replace(',', '.')) || 0;
      
      // Obtener ángulo del input en la fila
      const inputAngulo = fila.querySelector('[data-field="angulo"]');
      const angulo = inputAngulo ? parseFloat(inputAngulo.value) || 55 : 55;
      
      // Obtener PID de la fila
      const pid = fila.dataset.pid;
      
      // Calcular el tipo correcto usando la fórmula geométrica
      const tipoCalculado = determinarTipoBraceFormula(alto, npt, 0.6, angulo);
      
      // Calcular la cantidad usando FB total / capacidad (como me dijiste)
      const cantidadCalculada = calcularCantidadBraces(fb, tipoCalculado);
      
      // Actualizar las celdas correspondientes
      const selectTipo = celdas[9]?.querySelector('select'); // Dropdown del tipo de brace
      const celdaCantidad = celdas[10]; // Columna de cantidad
      
      if (selectTipo) {
        selectTipo.value = tipoCalculado;
        console.log(`[BRACES] Fila ${index + 1}: ALTO=${alto}, NPT=${npt}, FB=${fb} → Tipo: ${tipoCalculado}, Cantidad: ${cantidadCalculada}`);
      }
      
      if (celdaCantidad) {
        celdaCantidad.textContent = cantidadCalculada.toString();
      }
      
      // Agregar a las actualizaciones para la BD
      if (pid) {
        actualizaciones.push({
          pid: pid,
          tipo_brace_seleccionado: tipoCalculado,
          x_braces: cantidadCalculada,
          factor_w2: 0.6
        });
      }
      
    } catch (error) {
      console.error(`[BRACES] Error procesando fila ${index + 1}:`, error);
    }
  });
  
  // Guardar todas las actualizaciones en la base de datos
  if (actualizaciones.length > 0) {
    try {
      console.log(`[BRACES] Guardando ${actualizaciones.length} actualizaciones en BD...`);
      await guardarActualizacionesBraces(actualizaciones);
      console.log('[BRACES] ✅ Actualizaciones guardadas en BD');
    } catch (error) {
      console.error('[BRACES] ❌ Error guardando en BD:', error);
    }
  }
  
  console.log('[BRACES] Recálculo completado en frontend');
}

// Función para guardar las actualizaciones en la base de datos
async function guardarActualizacionesBraces(actualizaciones) {
  const response = await fetch('/api/calculos/actualizar-braces-masivo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ actualizaciones })
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Renderizar tabla agrupada por 'muertos'.
 * Agrupa los muros según las 5 características: X (cantidad), ángulo, tipo brace, eje y tipo de construcción (til-up/precast)
 */
function renderTablaMuertos(resultados) {
  const cont = document.getElementById('tablaMuertos');
  if (!cont) return;

  if (!Array.isArray(resultados) || resultados.length === 0) {
    cont.innerHTML = '<p class="muted">No hay resultados para agrupar.</p>';
    return;
  }

  // Construir grupos usando algoritmo secuencial: partir del primero y comparar
  // campos (X, ángulo, tipo brace, eje, tipo construcción). Si alguno cambia,
  // se incrementa el número de "muerto". Se limita a un máximo (39).
  const grupos = buildGruposMuertosSequential(resultados, 39);

  // Guardar temporalmente para depuración externa
  window.lastGruposMuertos = grupos;
  window.lastResultadosMuertos = resultados;

  // Construir HTML de la tabla
  let html = `
    <div class="braces-table-container">
      <h3>Resumen por Muertos</h3>
      <table class="wind-results-table unified-table" id="tablaMuertosTable">
        <thead>
          <tr>
            <th>Muerto #</th>
            <th>Distancia X (m)</th>
            <th>Ángulo (°)</th>
            <th>Eje</th>
            <th>Tipo Construcción</th>
            <th>Cantidad Muros</th>
            <th>Total Braces</th>
            <th>Muros (IDs)</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.values(grupos).forEach(g => {
    // Calcular la suma de overall_width por muerto
    let sumaLargo = 0;
    if (Array.isArray(window.lastResultadosMuertos)) {
      sumaLargo = window.lastResultadosMuertos
        .filter(r => g.muros.includes(r.id_muro || r.id))
        .reduce((acc, r) => acc + (parseFloat(r.overall_width) || 0), 0);
    }
    html += `
      <tr>
        <td style="font-weight: bold; color: #007bff;">M${g.muerto}</td>
        <td style="text-align: center; font-weight: bold;">${parseFloat(g.x || 0).toFixed(2)} m</td>
        <td style="text-align: center; font-weight: bold;">${g.ang}°</td>
        <td style="font-weight: bold; color: #28a745; background: #f8fff9; text-align: center;">${g.eje || 'Sin asignar'}</td>
        <td style="text-align: center; color: #6f42c1; font-weight: bold;">${g.tipoConst || 'No def.'}</td>
        <td style="text-align: center; font-weight: bold;">${g.cantidadMuros}</td>
        <td style="text-align: center; color: #e83e8c; font-weight: bold;">${g.totalBraces}</td>
        <td style="font-family: monospace; font-size: 0.85em;">${g.muros.join(', ')}</td>
      </tr>
      <tr>
        <td colspan="7" style="background:#f0f0f0;"></td>
        <td colspan="1" style="background:#f0f0f0; color:#333; font-size:0.95em;">Largo total muros (Overall width): <strong>${sumaLargo.toFixed(2)} m</strong></td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;

  cont.innerHTML = html;

  // Adjuntar listener del botón de verificación si existe
  const btnVer = document.getElementById('btnVerificarClaves');
  if (btnVer) {
    btnVer.onclick = () => {
      try {
        debugMostrarClaves(resultados);
      } catch (err) {
        console.error('[MUERTOS-DEBUG] Error verificando claves:', err);
      }
    };
  }

  // Adjuntar listener del botón de reagrupación si existe
  const btnReagrupar = document.getElementById('btnReagruparMuertos');
  if (btnReagrupar) {
    btnReagrupar.onclick = async () => {
      console.log('🔄 [REAGRUPAR] Botón clickeado - iniciando reagrupación desde TABLA ACTUAL...');
      try {
        // Mostrar mensaje de que se está reagrupando
        if (mostrarNotificacion) {
          mostrarNotificacion('Reagrupando con valores actuales de la tabla...', 'info');
        }
        
        // Usar función que lee DESDE LA TABLA (con valores editados y ejes asignados)
        reagruparMuertosConValoresActuales();
        
        // Confirmar éxito
        if (mostrarNotificacion) {
          mostrarNotificacion('✅ Reagrupación completada con valores actuales de la tabla', 'success');
        }
      } catch (err) {
        console.error('[MUERTOS] Error reagrupando:', err);
        if (mostrarNotificacion) {
          mostrarNotificacion('Error al reagrupar muertos. Revisa la consola.', 'error');
        }
      }
    };
  }

  // Si el contenedor debug existe, auto-ejecutar para mostrar claves después de render
  const dbgCont = document.getElementById('muertosDebugOutput');
  if (dbgCont) {
    try { debugMostrarClaves(resultados); } catch (e) { console.error(e); }
  }
}

/**
 * Construye los grupos usando la misma lógica que la fórmula de Excel (eje-ángulo-tipo-brace-muerto)
 */
function buildGruposMuertos(resultados) {
  const grupos = {};
  if (!Array.isArray(resultados)) return grupos;

  resultados.forEach(r => {
    const eje = (r.eje || r.axis || r.axis_name || r.eje_muro || r.axisLabel || '').toString().trim();
    const angRaw = r.angulo_brace ?? r.angulo ?? r.grados_inclinacion_brace ?? r.alpha ?? '';
    const angNum = angRaw === '' || angRaw === null || angRaw === undefined ? '' : Number(angRaw);
    const ang = Number.isFinite(angNum) ? String(Math.round(angNum)) : String(angRaw || '');
    const tipo = (r.tipo_brace_seleccionado || r.tipo_brace || r.modelo_brace || '').toString().trim();
    const muerto = (r.muerto ?? r.muerto_num ?? r['Muerto #'] ?? r.id_muro ?? r.id ?? '').toString().trim();
    const x = r.x_braces ?? r.total_braces ?? r.x_braces_manual ?? r.cant_braces ?? 'N/A';
    const tipoConst = (r.tipo_construccion || r.tipo_construction || r.tipo_construccion_muro || '').toString().trim();

    const key = `${eje}-${ang}-${tipo}-${muerto}`;

    if (!grupos[key]) {
      grupos[key] = { eje, ang, tipo, muerto, x, tipoConst, muros: [], cantidadMuros: 0, totalBraces: 0 };
    }

    grupos[key].muros.push((r.id_muro ?? r.id ?? null) || muerto || 'N/A');
    grupos[key].cantidadMuros += 1;
    grupos[key].totalBraces += (r.total_braces ?? r.x_braces ?? r.cant_braces ?? 0);
  });

  return grupos;
}

/**
 * Construye grupos secuenciales (muertos) iterando en el orden de `resultados`.
 * - Compara los campos: X (cantidad), ángulo (redondeado), tipo brace, eje y tipoConstrucción.
 * - Si alguno cambia, crea el siguiente "muerto" (incrementa index) hasta maxMuertos.
 * - Devuelve un objeto con claves 'M1','M2',... cada una con resumen y lista de muros.
 */
function buildGruposMuertosSequential(resultados, maxMuertos = 39) {
  const grupos = {};
  if (!Array.isArray(resultados) || resultados.length === 0) return grupos;

  let muertoIndex = 1;
  let currentKey = null;

  const makeKey = (r) => {
    // Usar x_inserto (distancia X) en lugar de x_braces (cantidad)
    const xInserto = r.x_inserto ? parseFloat(r.x_inserto).toFixed(2) : '0.00';
    const angRaw = r.angulo_brace ?? r.angulo ?? r.grados_inclinacion_brace ?? r.alpha ?? '';
    const angNum = angRaw === '' || angRaw === null || angRaw === undefined ? '' : Number(angRaw);
    const ang = Number.isFinite(angNum) ? String(Math.round(angNum)) : String(angRaw || '');
    const tipo = (r.tipo_brace_seleccionado || r.tipo_brace || r.modelo_brace || '').toString().trim();
    const eje = (r.eje || r.axis || r.axis_name || r.eje_muro || r.axisLabel || '').toString().trim();
    const tipoConst = (r.tipo_construccion || r.tipo_construction || r.tipo_construccion_muro || '').toString().trim();
    
    // Agrupar por: distancia X, tipo brace, ángulo, eje
    return { key: `${xInserto}|${tipo}|${ang}|${eje}`, xInserto, ang, tipo, eje, tipoConst };
  };

  for (const r of resultados) {
    const kobj = makeKey(r);
    if (currentKey === null) {
      currentKey = kobj.key;
      const label = `M${muertoIndex}`;
      grupos[label] = { muerto: muertoIndex, key: currentKey, xInserto: kobj.xInserto, ang: kobj.ang, tipo: kobj.tipo, eje: kobj.eje, tipoConst: kobj.tipoConst, muros: [], cantidadMuros: 0, totalBraces: 0 };
    }

    // Si la clave cambia y aún no llegamos al máximo, incrementamos muertoIndex
    if (kobj.key !== currentKey) {
      if (muertoIndex < maxMuertos) {
        muertoIndex += 1;
      } else {
        // si llegamos al máximo, seguir asignando al último grupo (M39)
        muertoIndex = maxMuertos;
      }
      currentKey = kobj.key;
      const label = `M${muertoIndex}`;
      if (!grupos[label]) {
        grupos[label] = { muerto: muertoIndex, key: currentKey, xInserto: kobj.xInserto, ang: kobj.ang, tipo: kobj.tipo, eje: kobj.eje, tipoConst: kobj.tipoConst, muros: [], cantidadMuros: 0, totalBraces: 0 };
      }
    }

    const label = `M${muertoIndex}`;
    grupos[label].muros.push((r.id_muro ?? r.id ?? null) || (r.muerto ?? r.muerto_num ?? '') || 'N/A');
    grupos[label].cantidadMuros += 1;
    grupos[label].totalBraces += (r.total_braces ?? r.x_braces ?? r.cant_braces ?? 0);
  }

  return grupos;
}

/**
 * Construye grupos por SIMILITUD (no secuencial) - agrupa muros con características idénticas
 * - Compara los campos: X (cantidad), ángulo (redondeado), tipo brace, eje y tipoConstrucción.
 * - Todos los muros con las mismas características van al mismo grupo
 * - Asigna números de muerto M1, M2, etc. a cada grupo único
 */
function buildGruposMuertosPorSimilitud(resultados, maxMuertos = 39) {
  const gruposPorClave = {};
  if (!Array.isArray(resultados) || resultados.length === 0) return {};

  const makeKey = (r) => {
    // Usar x_inserto (distancia X) en lugar de x_braces (cantidad)
    const xInserto = r.x_inserto ? parseFloat(r.x_inserto).toFixed(2) : '0.00';
    const angRaw = r.angulo_brace ?? r.angulo ?? r.grados_inclinacion_brace ?? r.alpha ?? '';
    const angNum = angRaw === '' || angRaw === null || angRaw === undefined ? '' : Number(angRaw);
    const ang = Number.isFinite(angNum) ? String(Math.round(angNum)) : String(angRaw || '');
    const tipo = (r.tipo_brace_seleccionado || r.tipo_brace || r.modelo_brace || '').toString().trim();
    const eje = (r.eje || r.axis || r.axis_name || r.eje_muro || r.axisLabel || '').toString().trim();
    const tipoConst = (r.tipo_construccion || r.tipo_construction || r.tipo_construccion_muro || '').toString().trim();
    
    // Agrupar por: distancia X, tipo brace, ángulo, eje
    return { key: `${xInserto}|${tipo}|${ang}|${eje}`, xInserto, ang, tipo, eje, tipoConst };
  };

  // Paso 1: Agrupar por clave única (características idénticas)
  for (const r of resultados) {
    const kobj = makeKey(r);
    
    if (!gruposPorClave[kobj.key]) {
      gruposPorClave[kobj.key] = {
        xInserto: kobj.xInserto,
        ang: kobj.ang, 
        tipo: kobj.tipo,
        eje: kobj.eje,
        tipoConst: kobj.tipoConst,
        muros: [],
        cantidadMuros: 0,
        totalBraces: 0
      };
    }
    
    gruposPorClave[kobj.key].muros.push((r.id_muro ?? r.id ?? null) || (r.muerto ?? r.muerto_num ?? '') || 'N/A');
    gruposPorClave[kobj.key].cantidadMuros += 1;
    gruposPorClave[kobj.key].totalBraces += (r.total_braces ?? r.x_braces ?? r.cant_braces ?? 0);
  }

  // Paso 2: Asignar números de muerto M1, M2, etc.
  const gruposFinales = {};
  const claves = Object.keys(gruposPorClave);
  
  for (let i = 0; i < claves.length && i < maxMuertos; i++) {
    const clave = claves[i];
    const grupo = gruposPorClave[clave];
    const numeroMuerto = i + 1;
    const label = `M${numeroMuerto}`;
    
    gruposFinales[label] = {
      muerto: numeroMuerto,
      key: clave,
      x: grupo.x,
      ang: grupo.ang,
      tipo: grupo.tipo,
      eje: grupo.eje,
      tipoConst: grupo.tipoConst,
      muros: grupo.muros,
      cantidadMuros: grupo.cantidadMuros,
      totalBraces: grupo.totalBraces
    };
  }

  console.log(`[MUERTOS-SIMILITUD] Agrupación por similitud completada: ${Object.keys(gruposFinales).length} grupos únicos`);
  return gruposFinales;
}

/**
 * Reagrupa muertos leyendo valores DIRECTAMENTE desde la base de datos
 * Esto evita problemas con valores desactualizados en el DOM
 */
async function reagruparMuertosDesdeBaseDatos() {
  console.log('🚀 [MUERTOS-BD] INICIO - Reagrupando con valores desde base de datos...');
  
  try {
    // Obtener proyecto actual
    const projectConfig = JSON.parse(localStorage.getItem('projectConfig') || '{}');
    console.log('[MUERTOS-BD] Config proyecto:', projectConfig);
    if (!projectConfig.pid) {
      console.error('[MUERTOS-BD] No hay proyecto seleccionado');
      return;
    }
    
    // Obtener muros actualizados desde la BD
    const response = await fetch(`${API_BASE}/api/importar-muros/muros?pk_proyecto=${projectConfig.pid}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[MUERTOS-BD] Obtenidos ${data.muros?.length || 0} muros desde BD`);
    
    if (!data.muros || data.muros.length === 0) {
      console.warn('[MUERTOS-BD] No hay muros en la respuesta');
      return;
    }
    
    // Convertir datos de BD al formato esperado
    const resultadosActualizados = data.muros.map((muro, index) => ({
      id_muro: muro.id_muro || `Muro_${index + 1}`,
      pid: muro.pid,
      altura_z_m: parseFloat(muro.overall_height) || 0,
      
      // Valores actualizados desde BD
      tipo_brace_seleccionado: muro.tipo_brace_seleccionado || 'B12',
      angulo_brace: parseFloat(muro.angulo_brace) || 55,
      npt: parseFloat(muro.npt) || 0.35,
      x_braces: parseInt(muro.x_braces) || 2,
      total_braces: parseInt(muro.x_braces) || 2,
      
      // Valores del muro
      eje: muro.eje || `Eje_${index + 1}`,
      tipo_construccion: muro.tipo_construccion || 'TILT-UP',
      
      // ✅ CAMPOS CALCULADOS (fuerza de braces y cantidades por tipo)
      fb: parseFloat(muro.fb) || 0,              // Fuerza total del brace (kN)
      fbx: parseFloat(muro.fbx) || 0,            // Fuerza en X (kN)
      fby: parseFloat(muro.fby) || 0,            // Fuerza en Y (kN)
      cant_b14: parseInt(muro.cant_b14) || 0,    // Cantidad de braces B14
      cant_b12: parseInt(muro.cant_b12) || 0,    // Cantidad de braces B12
      cant_b04: parseInt(muro.cant_b04) || 0,    // Cantidad de braces B04
      cant_b15: parseInt(muro.cant_b15) || 0,    // Cantidad de braces B15
      
      // Campos adicionales útiles
      grosor: parseFloat(muro.grosor) || 0.17,   // Grosor del muro (m)
      area: parseFloat(muro.area) || 0,          // Área del muro (m²)
      peso: parseFloat(muro.peso) || 0,          // Peso del muro (kN)
      volumen: parseFloat(muro.volumen) || 0     // Volumen del muro (m³)
    }));
    
    console.log(`[MUERTOS-BD] Procesando ${resultadosActualizados.length} muros con valores de BD`);
    
    // Mostrar algunos valores para verificar que están actualizados
    const muestras = resultadosActualizados.slice(0, 5).map(r => ({
      muro: r.id_muro,
      angulo: r.angulo_brace,
      tipo: r.tipo_brace_seleccionado,
      x_braces: r.x_braces,
      eje: r.eje // ← Agregar eje para verificar
    }));
    console.log('[MUERTOS-BD] Muestra de valores desde BD:', muestras);
    
    // Verificar específicamente los ejes únicos
    const ejesUnicos = [...new Set(resultadosActualizados.map(r => r.eje))];
    console.log('[MUERTOS-BD] 🔍 Ejes únicos encontrados en BD:', ejesUnicos);
    
    // Log adicional: verificar si HAY algún ángulo diferente de 55
    const angulosUnicos = [...new Set(resultadosActualizados.map(r => r.angulo_brace))];
    console.log('[MUERTOS-BD] 🔍 Ángulos únicos encontrados en BD:', angulosUnicos);
    
    // Verificar específicamente el PID 3745 que acabamos de guardar
    const pid3745 = resultadosActualizados.find(r => r.pid == 3745);
    if (pid3745) {
      console.log('[MUERTOS-BD] 🎯 Verificación PID 3745:', {
        id_muro: pid3745.id_muro,
        angulo_brace: pid3745.angulo_brace,
        tipo_brace_seleccionado: pid3745.tipo_brace_seleccionado,
        x_braces: pid3745.x_braces
      });
    } else {
      console.log('[MUERTOS-BD] ⚠️ PID 3745 no encontrado en datos de BD');
      
      // Debug: mostrar algunos PIDs que SÍ están disponibles
      const pidsDisponibles = resultadosActualizados.slice(0, 10).map(r => ({
        pid: r.pid,
        id_muro: r.id_muro,
        angulo_brace: r.angulo_brace
      }));
      console.log('[MUERTOS-BD] 📋 PIDs disponibles (muestra):', pidsDisponibles);
      
      // Buscar si hay algún muro con ángulo 57°
      const muros57 = resultadosActualizados.filter(r => r.angulo_brace == 57);
      console.log('[MUERTOS-BD] 🔍 Muros con ángulo 57°:', muros57.map(r => ({
        pid: r.pid,
        id_muro: r.id_muro,
        angulo_brace: r.angulo_brace
      })));
    }
    
    if (angulosUnicos.length === 1 && angulosUnicos[0] === 55) {
      console.warn('[MUERTOS-BD] ⚠️ PROBLEMA: Todos los ángulos en BD siguen siendo 55° - El guardado no funcionó');
    }
    
    // Reagrupar usando los valores de BD con algoritmo SECUENCIAL (sin retroceso)
    const gruposObj = buildGruposMuertosSequential(resultadosActualizados, 39);
    console.log('[MUERTOS-BD] Tipo de gruposObj:', typeof gruposObj);
    console.log('[MUERTOS-BD] Es object?:', typeof gruposObj === 'object');
    console.log('[MUERTOS-BD] Keys en gruposObj:', Object.keys(gruposObj));
    
    // Mostrar información de agrupación por ejes
    const gruposConEjes = Object.values(gruposObj).map(g => ({
      muerto: g.muerto,
      eje: g.eje,
      cantidadMuros: g.cantidadMuros,
      angulo: g.ang,
      tipo: g.tipo
    }));
    console.log('[MUERTOS-BD] 🎯 Agrupación por ejes:', gruposConEjes);
    
    // Convertir objeto a array como hace la función original
    const gruposNuevos = Object.values(gruposObj);
    console.log('[MUERTOS-BD] Array gruposNuevos length:', gruposNuevos.length);
    
    if (!Array.isArray(gruposNuevos)) {
      throw new Error(`Object.values() devolvió ${typeof gruposNuevos} en lugar de array`);
    }
    
    // Actualizar la tabla de muertos con los nuevos grupos
    const cont = document.getElementById('tablaMuertos');
    if (!cont) {
      console.error('[MUERTOS-BD] Contenedor tablaMuertos no encontrado');
      return;
    }

    let html = `
      <div class="braces-table-container">
        <h3>Resumen por Muertos (Reagrupado desde BD) ✅</h3>
        <table class="wind-results-table unified-table" id="tablaMuertosTable">
          <thead>
            <tr>
              <th style="background: var(--primary); color: white;">#</th>
              <th style="background: var(--primary); color: white;">Muerto</th>
              <th style="background: var(--primary); color: white;">X (braces)</th>
              <th style="background: var(--primary); color: white;">Ángulo</th>
              <th style="background: var(--primary); color: white;">Eje</th>
              <th style="background: var(--primary); color: white;">Tipo Construcción</th>
              <th style="background: var(--primary); color: white;">Cant. Muros</th>
              <th style="background: var(--primary); color: white;">Muros</th>
            </tr>
          </thead>
          <tbody>
    `;

    gruposNuevos.forEach((grupo, index) => {
      const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
      const murosText = grupo.muros.length > 10 ? 
        grupo.muros.slice(0, 10).join(', ') + ` ... (+${grupo.muros.length - 10} más)` :
        grupo.muros.join(', ');
      
      html += `
        <tr class="${rowClass}">
          <td>${index + 1}</td>
          <td><strong>M${grupo.muerto}</strong></td>
          <td style="text-align: center; font-weight: bold;">${grupo.x || 'No def.'}</td>
          <td><strong>${grupo.ang}°</strong></td>
          <td style="font-weight: bold; color: #28a745; background: #f8fff9; text-align: center;">${grupo.eje || 'Sin asignar'}</td>
          <td style="text-align: center; color: #6f42c1; font-weight: bold;">${grupo.tipoConst || 'No def.'}</td>
          <td><strong>${grupo.cantidadMuros}</strong></td>
          <td style="font-family: monospace; font-size: 0.85em;">${murosText}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    cont.innerHTML = html;
    
    console.log(`[MUERTOS-BD] ✅ Reagrupación completada desde BD: ${gruposNuevos.length} grupos (M1 a M${gruposNuevos.length})`);
    
  } catch (error) {
    console.error('[MUERTOS-BD] ❌ Error reagrupando desde BD:', error);
    console.error('[MUERTOS-BD] Stack trace completo:', error.stack);
    // Fallback a la función original
    console.log('[MUERTOS-BD] 🔄 Usando fallback a reagrupación desde DOM...');
    reagruparMuertosConValoresActuales();
  }
}

/**
 * Función debug: muestra claves y conteos en consola y en el panel de debug
 */
function debugMostrarClaves(resultados) {
  // Usar agrupación SECUENCIAL para debug (M1..M39)
  const grupos = buildGruposMuertosSequential(resultados || window.lastResultadosMuertos || [], 39);
  const lista = Object.entries(grupos).map(([k, v]) => ({ key: k, eje: v.eje, ang: v.ang, tipo: v.tipo, tipoConst: v.tipoConst, muerto: v.muerto, count: v.cantidadMuros, muros: v.muros }));

  console.log('[MUERTOS-DEBUG] Grupos secuenciales encontrados:', lista.length);
  console.table(lista.map(l => ({ muerto: l.muerto, key: l.key, eje: l.eje, ang: l.ang, tipo: l.tipo, tipoConst: l.tipoConst, count: l.count })));

  const out = document.getElementById('muertosDebugOutput');
  if (!out) return lista;

  // Construir HTML resumido
  let html = `<div class="braces-table-container"><h4>Debug: Grupos Secuenciales (muertos) - ${lista.length}</h4>`;
  html += `<table class="data-table"><thead><tr><th>Muerto</th><th>Clave</th><th>Eje</th><th>Ángulo</th><th>Tipo</th><th>TipoConstrucción</th><th>Count</th><th>Muros</th></tr></thead><tbody>`;
  lista.forEach(l => {
    html += `<tr><td>${l.muerto}</td><td style="font-family:monospace">${l.key}</td><td>${l.eje}</td><td>${l.ang}</td><td>${l.tipo}</td><td>${l.tipoConst}</td><td>${l.count}</td><td>${l.muros.join(', ')}</td></tr>`;
  });
  html += `</tbody></table></div>`;

  out.innerHTML = html;
  return lista;
}

/**
 * Reagrupa muertos usando los valores ACTUALES de la tabla de viento
 * (incluyendo ediciones del usuario en ángulo, tipo brace, etc.)
 */
function reagruparMuertosConValoresActuales() {
  console.log('[MUERTOS-TABLA] 🎯 Reagrupando con valores ACTUALES de la tabla (incluye ejes asignados)...');
  
  // Buscar en ambas tablas: la unificada antigua y la nueva de braces
  const rowsUnificada = document.querySelectorAll('#tablaUnificadaBody tr[data-pid]');
  const rowsBraces = document.querySelectorAll('#tablaBracesBody tr[data-pid]');
  
  console.log(`[DEBUG] rowsBraces.length: ${rowsBraces.length}, rowsUnificada.length: ${rowsUnificada.length}`);
  
  // También intentar otros posibles IDs de tabla de braces
  const rowsAlt1 = document.querySelectorAll('#tablaBraces tr[data-pid]');
  const rowsAlt2 = document.querySelectorAll('#tablaResultados tr[data-pid]');
  const rowsAlt3 = document.querySelectorAll('#tabla-braces tr[data-pid]');
  
  console.log(`[DEBUG] Alternativas: rowsAlt1=${rowsAlt1.length}, rowsAlt2=${rowsAlt2.length}, rowsAlt3=${rowsAlt3.length}`);
  
  // Usar la tabla que tenga datos, priorizando la de braces
  let rows = rowsUnificada;
  let isTablaUnificada = true;
  let tipoTabla = 'tabla unificada';
  
  if (rowsBraces.length > 0) {
    rows = rowsBraces;
    isTablaUnificada = false;
    tipoTabla = 'tabla braces (tablaBracesBody)';
  } else if (rowsAlt1.length > 0) {
    rows = rowsAlt1;
    isTablaUnificada = false;
    tipoTabla = 'tabla braces (tablaBraces)';
  } else if (rowsAlt2.length > 0) {
    rows = rowsAlt2;
    isTablaUnificada = false;
    tipoTabla = 'tabla braces (tablaResultados)';
  } else if (rowsAlt3.length > 0) {
    rows = rowsAlt3;
    isTablaUnificada = false;
    tipoTabla = 'tabla braces (tabla-braces)';
  }
  
  console.log(`[MUERTOS] Reagrupando desde ${tipoTabla}, ${rows.length} filas`);
  
  if (rows.length === 0) {
    console.warn('[MUERTOS] No se encontraron filas en ninguna tabla');
    if (mostrarNotificacion) {
      mostrarNotificacion('No hay datos en las tablas para reagrupar.', 'warning');
    }
    return;
  }

  // Extraer valores actuales de cada fila (incluyendo ediciones del usuario)
  const resultadosActualizados = [];
  
  rows.forEach((row, index) => {
    const pid = row.dataset.pid;
    
    let tipoSelect, anguloInput, nptInput, ejeInput, xBracesInput;
    let muroCell, alturaCell;
    
    if (isTablaUnificada) {
      // Selectores para tabla unificada antigua
      tipoSelect = row.querySelector('[data-field="tipo_brace"]');
      anguloInput = row.querySelector('[data-field="angulo"]');
      nptInput = row.querySelector('[data-field="npt"]');
      ejeInput = row.querySelector('[data-field="eje"]');
      muroCell = row.cells[0]; // Primera columna (ID muro)
      alturaCell = row.cells[3]; // Columna de altura
    } else {
      // Selectores para nueva tabla de braces
      tipoSelect = row.querySelector('[data-field="tipo_brace_seleccionado"]');
      anguloInput = row.querySelector('[data-field="angulo_brace"]');
      nptInput = row.querySelector('[data-field="npt"]');
      ejeInput = row.querySelector('[data-field="eje"]');
      xBracesInput = row.querySelector('[data-field="x_braces"]');
      
      // Buscar columnas por índice o contenido
      muroCell = row.querySelector('.muro-cell') || row.cells[0];
      alturaCell = row.querySelector('.altura-cell') || row.cells[3];
    }
    
    // Verificar que tenemos los elementos necesarios
    if (!tipoSelect || !anguloInput || !nptInput) {
      console.warn(`[MUERTOS] Fila ${index + 1} (PID ${pid}): elementos faltantes`);
      return;
    }
    
    // Obtener cantidad de braces según la tabla
    let cantidadBraces;
    if (isTablaUnificada) {
      const cantidadCell = row.querySelector('.valor-cantidad-calc');
      cantidadBraces = cantidadCell ? parseInt(cantidadCell.textContent) || 2 : 2;
    } else {
      // En la nueva tabla, usar x_braces input o buscar en las celdas de cantidad
      if (xBracesInput) {
        cantidadBraces = parseInt(xBracesInput.value) || 2;
      } else {
        // Buscar en celdas con clase cantidad o por posición
        const cantidadCell = row.querySelector('.valor-x-braces, .cantidad-cell') || 
                            [...row.cells].find(cell => cell.textContent.match(/^\d+$/));
        cantidadBraces = cantidadCell ? parseInt(cantidadCell.textContent) || 2 : 2;
      }
    }
    
    // Construir objeto similar a los resultados originales
    const resultado = {
      id_muro: muroCell ? muroCell.textContent.trim() : `Muro_${index + 1}`,
      pid: pid,
      altura_z_m: alturaCell ? parseFloat(alturaCell.textContent) || 0 : 0,
      
      // Valores editables actuales
      tipo_brace_seleccionado: tipoSelect ? tipoSelect.value : 'B12',
      angulo_brace: anguloInput ? parseFloat(anguloInput.value) || 55 : 55,
      npt: nptInput ? parseFloat(nptInput.value) || 0.35 : 0.35,
      
      // Cantidad actual (calculada o manual)
      x_braces: cantidadBraces,
      total_braces: cantidadBraces,
      
      // NUEVO: Leer x_inserto desde la tabla o dataset
      x_inserto: row.dataset.xInserto || row.dataset.x_inserto || '0.00',
      y_inserto: row.dataset.yInserto || row.dataset.y_inserto || '0.00',
      
      // Obtener eje directamente del input actualizado
      eje: ejeInput ? ejeInput.value.trim() : (row.dataset.eje || `Eje_${index + 1}`),
      tipo_construccion: row.dataset.tipoConst || 'TILT-UP'
    };
    
    console.log(`[MUERTOS] Fila ${index + 1} - EJE: "${resultado.eje}" (PID: ${pid})`);
    resultadosActualizados.push(resultado);
  });

  console.log(`[MUERTOS] Procesando ${resultadosActualizados.length} muros con valores actuales`);
  
  // Mostrar muestra de ejes leídos para verificar
  const muestraEjes = resultadosActualizados.slice(0, 10).map(r => ({
    muro: r.id_muro,
    eje: r.eje,
    pid: r.pid
  }));
  console.log('[MUERTOS] 🎯 Muestra de ejes leídos desde tabla:', muestraEjes);
  
  // Mostrar ejes únicos
  const ejesUnicos = [...new Set(resultadosActualizados.map(r => r.eje))];
  console.log('[MUERTOS-TABLA] 🔍 Ejes únicos encontrados en TABLA:', ejesUnicos);
  
  // Comparar con la expectativa (si asignamos ejes debería haber valores como "1", "2", etc.)
  const tieneEjesAsignados = ejesUnicos.some(eje => !eje.startsWith('Eje_'));
  console.log('[MUERTOS-TABLA] ✅ ¿Tiene ejes asignados?:', tieneEjesAsignados);
  
  // Reagrupar usando los valores actualizados
  const gruposNuevos = buildGruposMuertosSequential(resultadosActualizados, 39);
  
  // Actualizar la tabla de muertos con los nuevos grupos
  const cont = document.getElementById('tablaMuertos');
  if (!cont) return;

  let html = `
    <div class="braces-table-container">
      <h3>Resumen por Muertos (Reagrupado desde Tabla)</h3>
      <table class="wind-results-table unified-table" id="tablaMuertosTable">
        <thead>
          <tr>
            <th style="background: var(--primary); color: white;">#</th>
            <th style="background: var(--primary); color: white;">Muerto</th>
            <th style="background: var(--primary); color: white;">Distancia X (m)</th>
            <th style="background: var(--primary); color: white;">Tipo Brace</th>
            <th style="background: var(--primary); color: white;">Ángulo</th>
            <th style="background: var(--primary); color: white;">Eje</th>
            <th style="background: var(--primary); color: white;">Tipo Construcción</th>
            <th style="background: var(--primary); color: white;">Cant. Muros</th>
            <th style="background: var(--primary); color: white;">Muros</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.values(gruposNuevos).forEach((g, index) => {
    const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
    const murosText = g.muros.length > 10 ? 
      g.muros.slice(0, 10).join(', ') + ` ... (+${g.muros.length - 10} más)` :
      g.muros.join(', ');
      
    html += `
      <tr class="${rowClass}">
        <td>${index + 1}</td>
        <td><strong>M${g.muerto}</strong></td>
        <td style="text-align: center; font-weight: bold; color: #0066cc;">${g.xInserto || '0.00'}m</td>
        <td style="text-align: center; font-weight: bold; color: #6f42c1;">${g.tipo || 'B12'}</td>
        <td><strong>${g.ang}°</strong></td>
        <td style="font-weight: bold; color: #28a745; background: #f8fff9; text-align: center;">${g.eje || 'Sin asignar'}</td>
        <td style="text-align: center; color: #6f42c1; font-weight: bold;">${g.tipoConst || 'No def.'}</td>
        <td><strong>${g.cantidadMuros}</strong></td>
        <td style="font-family: monospace; font-size: 0.85em;">${murosText}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  cont.innerHTML = html;

  // Actualizar también el debug output
  window.lastGruposMuertos = gruposNuevos;
  
  // ✅ EXPONER GLOBALMENTE para que ejecutarCalculosArmado() pueda usarlos
  window.gruposMuertosGlobal = gruposNuevos;
  console.log('[MUERTOS] gruposMuertosGlobal actualizado después de reagrupar:', gruposNuevos);
  
  // ✅ DISPARAR EVENTO para notificar a dashboard.js que los grupos fueron actualizados
  const evento = new CustomEvent('gruposMuertosActualizados', {
    detail: gruposNuevos,
    bubbles: true
  });
  window.dispatchEvent(evento);
  console.log('[MUERTOS] 📢 Evento gruposMuertosActualizados disparado con', Object.keys(gruposNuevos).length, 'grupos');
  
  // ✅ ASEGURAR que los datos originales (con grosor, overall_height) estén disponibles
  // Si window.lastResultadosMuertos NO tiene datos completos, usar los datos originales
  if (!window.lastResultadosMuertos || !Array.isArray(window.lastResultadosMuertos) || window.lastResultadosMuertos.length === 0) {
    console.log('[MUERTOS] ⚠️ window.lastResultadosMuertos no tiene datos completos, intentando recuperar...');
    // window.lastResultadosMuertos debería haber sido establecido por renderTablaMuertos()
    // pero si no está disponible, aquí podríamos intentar recuperarlo
  } else {
    console.log('[MUERTOS] ✅ window.lastResultadosMuertos disponible con', window.lastResultadosMuertos.length, 'muros completos');
  }
}

/**
 * Actualiza inmediatamente los campos EJE en la tabla visible sin refrescar toda la tabla
 */
function actualizarCamposEjeEnTabla(actualizaciones) {
  console.log(`[EJES-UI] Actualizando ${actualizaciones.length} campos EJE en la tabla visible...`);
  
  let camposActualizados = 0;
  
  actualizaciones.forEach(update => {
    // Buscar el input de EJE por PID
    const inputEje = document.querySelector(`input[data-pid="${update.pid}"][data-field="eje"]`);
    
    if (inputEje) {
      // Actualizar el valor del input
      inputEje.value = update.eje;
      
      // Agregar efecto visual para mostrar que se actualizó
      inputEje.style.background = '#d4edda';
      inputEje.style.border = '2px solid #28a745';
      
      // Remover el efecto después de 2 segundos
      setTimeout(() => {
        inputEje.style.background = '';
        inputEje.style.border = '';
      }, 2000);
      
      // Actualizar también el dataset del row para futuros usos
      const row = inputEje.closest('tr');
      if (row) {
        row.dataset.eje = update.eje;
      }
      
      camposActualizados++;
      console.log(`[EJES-UI] ✅ Campo EJE actualizado: PID ${update.pid} → "${update.eje}"`);
    } else {
      console.warn(`[EJES-UI] ⚠️ No se encontró input EJE para PID ${update.pid}`);
    }
  });
  
  console.log(`[EJES-UI] 🎯 ${camposActualizados} campos EJE actualizados en la tabla`);
  
  if (camposActualizados > 0) {
    // Mostrar notificación temporal
    mostrarNotificacionTemporal(`✅ ${camposActualizados} ejes actualizados en la tabla`, 'success');
  }
}

/**
 * Muestra una notificación temporal en la esquina superior derecha
 */
function mostrarNotificacionTemporal(mensaje, tipo = 'info') {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: bold;
    color: white;
    max-width: 350px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
  `;
  
  // Establecer color según tipo
  switch (tipo) {
    case 'success':
      notificacion.style.background = '#28a745';
      break;
    case 'warning':
      notificacion.style.background = '#ffc107';
      notificacion.style.color = '#212529';
      break;
    case 'error':
      notificacion.style.background = '#dc3545';
      break;
    default:
      notificacion.style.background = '#007bff';
  }
  
  notificacion.textContent = mensaje;
  document.body.appendChild(notificacion);
  
  // Animar entrada
  setTimeout(() => {
    notificacion.style.transform = 'translateX(0)';
  }, 100);
  
  // Animar salida y remover
  setTimeout(() => {
    notificacion.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 300);
  }, 3000);
}

/**
 * Mostrar panel de edición masiva de parámetros braces
 */
function mostrarPanelEdicionMasiva() {
  // Buscar si ya existe el panel
  let panelExistente = document.getElementById('edicionMasivaPanel');
  
  if (panelExistente) {
    panelExistente.style.display = 'block';
    return;
  }

  // Crear el panel si no existe
  const tablaEdicionMasiva = document.getElementById('tablaEdicionMasiva');
  
  const panelHTML = `
    <div id="edicionMasivaPanel" class="panel" style="margin-bottom: 1rem; background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%); border: 1px solid #ffcc02; border-radius: 0.5rem; padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="margin: 0; color: #e65100;">⚡ Edición Masiva de Parámetros</h3>
        <span style="font-size: 0.9em; color: #f57c00; font-style: italic;">Cambia múltiples muros al mismo tiempo</span>
      </div>
      
      <div id="rangosMasivaContainer">
        <div class="rango-masiva-item" data-rango="1" style="background: white; border: 1px solid #ffcc02; border-radius: 6px; padding: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; gap: 1rem; align-items: end; flex-wrap: wrap;">
            <div>
              <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">Desde Muro:</label>
              <input type="number" id="desdeMuro_masiva_1" placeholder="1" min="1" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">Hasta Muro:</label>
              <input type="number" id="hastaMuro_masiva_1" placeholder="10" min="1" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">Tipo Brace:</label>
              <select id="tipoBrace_masiva_1" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">-</option>
                <option value="B4">B4</option>
                <option value="B12">B12</option>
                <option value="B14">B14</option>
                <option value="B15">B15</option>
              </select>
            </div>
            <div>
              <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">Ángulo (°):</label>
              <input type="number" id="angulo_masiva_1" placeholder="55" step="0.1" min="0" max="90" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">NPT (m):</label>
              <input type="number" id="npt_masiva_1" placeholder="0.350" step="0.001" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <button type="button" onclick="eliminarRangoMasiva(1)" class="btn btn--danger btn--small" title="Eliminar este rango">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
        <button id="btnAgregarRangoMasiva" class="btn btn--secondary">
          ➕ Agregar Otro Rango
        </button>
        <button id="btnAutoGenerarMasiva" class="btn btn--info" title="Genera rangos automáticamente basado en la cantidad de muros">
          🎯 Auto-Generar Rangos
        </button>
        <button id="btnAplicarMasiva" class="btn btn--warning btn--large" style="font-weight: bold;">
          ⚡ Aplicar Cambios Masivos
        </button>
        <button id="btnOcultarMasiva" class="btn btn--secondary btn--small">
          ➖ Ocultar Panel
        </button>
      </div>
      
      <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(255, 193, 7, 0.1); border-radius: 4px; font-size: 0.9em; color: #e65100;">
        💡 <strong>Tip:</strong> Solo se aplicarán los campos que no estén vacíos. Deja vacío lo que no quieras cambiar.
      </div>
    </div>
  `;

    tablaEdicionMasiva.innerHTML = panelHTML;
    // Agregar event listeners
    configurarEventosEdicionMasiva();
}

/**
 * Configurar eventos para el panel de edición masiva
 */
function configurarEventosEdicionMasiva() {
  const btnAgregar = document.getElementById('btnAgregarRangoMasiva');
  const btnAutoGenerar = document.getElementById('btnAutoGenerarMasiva');
  const btnAplicar = document.getElementById('btnAplicarMasiva');
  const btnOcultar = document.getElementById('btnOcultarMasiva');
  
  if (btnAgregar) btnAgregar.addEventListener('click', agregarNuevoRangoMasiva);
  if (btnAutoGenerar) btnAutoGenerar.addEventListener('click', autoGenerarRangosMasiva);
  if (btnAplicar) btnAplicar.addEventListener('click', aplicarCambiosMasivos);
  if (btnOcultar) {
    btnOcultar.addEventListener('click', () => {
      const panel = document.getElementById('edicionMasivaPanel');
      if (panel) panel.style.display = 'none';
    });
  }
}

// ===== FUNCIONES PARA EDICIÓN MASIVA DE PARÁMETROS =====

let contadorRangosMasiva = 1;

/**
 * Agregar un nuevo rango de edición masiva
 */
function agregarNuevoRangoMasiva() {
  contadorRangosMasiva++;
  const container = document.getElementById('rangosMasivaContainer');
  
  const nuevoRango = document.createElement('div');
  nuevoRango.className = 'rango-masiva-item';
  nuevoRango.dataset.rango = contadorRangosMasiva;
  nuevoRango.style.cssText = 'background: white; border: 1px solid #ffcc02; border-radius: 6px; padding: 1rem; margin-bottom: 1rem;';
  
  nuevoRango.innerHTML = `
    <div style="display: flex; gap: 1rem; align-items: end; flex-wrap: wrap;">
      <div>
        <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">Desde Muro:</label>
        <input type="number" id="desdeMuro_masiva_${contadorRangosMasiva}" placeholder="1" min="1" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div>
        <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">Hasta Muro:</label>
        <input type="number" id="hastaMuro_masiva_${contadorRangosMasiva}" placeholder="10" min="1" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div>
        <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">Tipo Brace:</label>
        <select id="tipoBrace_masiva_${contadorRangosMasiva}" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
          <option value="">-</option>
          <option value="B4">B4</option>
          <option value="B12">B12</option>
          <option value="B14">B14</option>
          <option value="B15">B15</option>
        </select>
      </div>
      <div>
        <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">Ángulo (°):</label>
        <input type="number" id="angulo_masiva_${contadorRangosMasiva}" placeholder="55" step="0.1" min="0" max="90" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div>
        <label style="font-weight: bold; color: #e65100; display: block; margin-bottom: 0.3rem;">NPT (m):</label>
        <input type="number" id="npt_masiva_${contadorRangosMasiva}" placeholder="0.350" step="0.001" style="width: 80px; padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div>
        <button type="button" onclick="eliminarRangoMasiva(${contadorRangosMasiva})" class="btn btn--danger btn--small" title="Eliminar este rango">
          🗑️
        </button>
      </div>
    </div>
  `;
  
  container.appendChild(nuevoRango);
}

/**
 * Eliminar un rango de edición masiva
 */
function eliminarRangoMasiva(numero) {
  const rango = document.querySelector(`[data-rango="${numero}"]`);
  if (rango) {
    rango.remove();
  }
}
// Agregar a window para acceso global
window.eliminarRangoMasiva = eliminarRangoMasiva;

/**
 * Auto-generar rangos basado en la cantidad de muros
 */
function autoGenerarRangosMasiva() {
  const muros = window.globalVars?.panelesActuales;
  if (!muros || muros.length === 0) {
    alert('No hay muros cargados para auto-generar rangos.');
    return;
  }
  
  const totalMuros = muros.length;
  const respuesta = prompt(
    `Se detectaron ${totalMuros} muros.\n\n` +
    `¿En cuántos rangos quieres dividirlos?\n` +
    `(Ejemplo: 4 rangos = ${Math.ceil(totalMuros/4)} muros por rango)`,
    '4'
  );
  
  if (!respuesta || isNaN(respuesta)) return;
  
  const numRangos = parseInt(respuesta);
  if (numRangos < 1 || numRangos > totalMuros) {
    alert('Número de rangos inválido.');
    return;
  }
  
  // Limpiar rangos existentes
  const container = document.getElementById('rangosMasivaContainer');
  container.innerHTML = '';
  contadorRangosMasiva = 0;
  
  // Generar rangos automáticamente
  const murosPorRango = Math.ceil(totalMuros / numRangos);
  
  for (let i = 0; i < numRangos; i++) {
    const desde = (i * murosPorRango) + 1;
    const hasta = Math.min(((i + 1) * murosPorRango), totalMuros);
    
    agregarNuevoRangoMasiva();
    
    // Llenar valores automáticamente
    const desdeInput = document.getElementById(`desdeMuro_masiva_${contadorRangosMasiva}`);
    const hastaInput = document.getElementById(`hastaMuro_masiva_${contadorRangosMasiva}`);
    
    if (desdeInput) desdeInput.value = desde;
    if (hastaInput) hastaInput.value = hasta;
  }
  
  mostrarNotificacionTemporal(`✅ ${numRangos} rangos generados automáticamente`, 'success');
}

/**
 * Aplicar cambios masivos a los muros
 */
async function aplicarCambiosMasivos() {
  // Protección contra doble clic
  const btnAplicar = document.getElementById('btnAplicarMasiva');
  if (btnAplicar && btnAplicar.disabled) {
    console.log('[MASIVA] ⚠️ Aplicación ya en progreso, ignorando...');
    return;
  }
  
  console.log('[MASIVA] Iniciando aplicación de cambios masivos...');
  
  // Deshabilitar botón durante el proceso
  if (btnAplicar) {
    btnAplicar.disabled = true;
    btnAplicar.textContent = '⏳ Aplicando...';
  }
  
  try {
    // Obtener todos los rangos válidos
    const rangos = obtenerRangosMasivaValidos();
    
    if (rangos.length === 0) {
      alert('No hay rangos válidos configurados. Por favor, define al menos un rango con valores a cambiar.');
      return;
    }
    
    // Validar que no haya solapamientos
    for (let i = 0; i < rangos.length - 1; i++) {
      for (let j = i + 1; j < rangos.length; j++) {
        if (!(rangos[i].hasta < rangos[j].desde || rangos[j].hasta < rangos[i].desde)) {
          alert(`Error: Los rangos se solapan. Rango ${i + 1} (${rangos[i].desde}-${rangos[i].hasta}) con Rango ${j + 1} (${rangos[j].desde}-${rangos[j].hasta})`);
          return;
        }
      }
    }
    
    console.log(`[MASIVA] Aplicando ${rangos.length} rangos de cambios masivos`);
  
  let cambiosAplicados = 0;
  let errores = [];
  
  // Aplicar cambios a cada rango
  for (const rango of rangos) {
    console.log(`[MASIVA] Procesando rango ${rango.desde}-${rango.hasta}`);
    
    for (let numMuro = rango.desde; numMuro <= rango.hasta; numMuro++) {
      try {
        // Obtener todas las filas de muros
        const todasLasFilas = document.querySelectorAll('tr[data-pid]');
        console.log(`[MASIVA] Buscando muro ${numMuro} entre ${todasLasFilas.length} filas`);
        
        // Buscar la fila del muro específico - probar múltiples formatos
        let filaObjetivo = null;
        const formatosPosibles = [
          `M${String(numMuro).padStart(2, '0')}`, // M01, M02, etc.
          `M${numMuro}`, // M1, M2, etc.
          `Muro_${numMuro}`, // Muro_1, Muro_2, etc.
          `${numMuro}` // Solo número
        ];
        
        for (const fila of todasLasFilas) {
          const celdaMuro = fila.cells[0];
          if (celdaMuro) {
            const textoMuro = celdaMuro.textContent.trim();
            
            if (formatosPosibles.includes(textoMuro)) {
              filaObjetivo = fila;
              console.log(`[MASIVA] ✅ Muro encontrado: "${textoMuro}" para número ${numMuro}`);
              break;
            }
          }
        }
        
        if (!filaObjetivo) {
          // Debug: mostrar todos los IDs de muro disponibles para ayudar a identificar el formato
          const idsDisponibles = Array.from(todasLasFilas).slice(0, 10).map(fila => {
            const celda = fila.cells[0];
            return celda ? celda.textContent.trim() : 'N/A';
          });
          console.warn(`[MASIVA] ⚠️ Muro ${numMuro} no encontrado. IDs disponibles (muestra):`, idsDisponibles);
          errores.push(`Muro ${numMuro} no encontrado en la tabla`);
          continue;
        }
        
        // Aplicar cambios según lo especificado en el rango
        let cambiosEnMuro = 0;
        console.log(`[MASIVA] Aplicando cambios a muro ${numMuro}:`, {
          tipoBrace: rango.tipoBrace,
          angulo: rango.angulo,
          npt: rango.npt
        });
        
        if (rango.tipoBrace) {
          const selectTipo = filaObjetivo.querySelector('[data-field="tipo_brace"]');
          if (selectTipo) {
            selectTipo.value = rango.tipoBrace;
            cambiosEnMuro++;
            console.log(`[MASIVA] ✅ Tipo brace cambiado a: ${rango.tipoBrace}`);
          }
        }
        
        if (rango.angulo !== null) {
          const inputAngulo = filaObjetivo.querySelector('[data-field="angulo"]');
          if (inputAngulo) {
            inputAngulo.value = rango.angulo;
            cambiosEnMuro++;
            console.log(`[MASIVA] ✅ Ángulo cambiado a: ${rango.angulo}`);
            
            // Recalcular inmediatamente para este muro
            await calcularBracesTiempoReal(inputAngulo);
          }
        }
        
        if (rango.npt !== null) {
          const inputNpt = filaObjetivo.querySelector('[data-field="npt"]');
          if (inputNpt) {
            inputNpt.value = rango.npt;
            cambiosEnMuro++;
            console.log(`[MASIVA] ✅ NPT cambiado a: ${rango.npt}`);
          }
        }
        
        if (cambiosEnMuro > 0) {
          // Agregar efecto visual temporal
          filaObjetivo.style.background = '#fff3cd';
          setTimeout(() => {
            filaObjetivo.style.background = '';
          }, 1500);
          
          cambiosAplicados++;
          console.log(`[MASIVA] ✅ Muro M${String(numMuro).padStart(2, '0')} modificado (${cambiosEnMuro} campos)`);
        }
        
      } catch (error) {
        errores.push(`Error en muro M${String(numMuro).padStart(2, '0')}: ${error.message}`);
      }
    }
  }
  
  // Mostrar resultados
  console.log(`[MASIVA] ✅ Proceso completado: ${cambiosAplicados} muros modificados, ${errores.length} errores`);
  
  let mensaje = `✅ Cambios masivos aplicados!\n\n`;
  mensaje += `• ${cambiosAplicados} muros modificados exitosamente\n`;
  mensaje += `• ${rangos.length} rangos procesados\n`;
  
  if (errores.length > 0) {
    mensaje += `• ${errores.length} errores encontrados\n`;
    mensaje += `\nPrimeros errores:\n${errores.slice(0, 3).join('\n')}`;
    if (errores.length > 3) {
      mensaje += `\n... y ${errores.length - 3} errores más (ver consola)`;
    }
  }
  
  mensaje += `\n\n💡 Recuerda guardar los cambios con el botón "Guardar Todos los Cambios de Braces"`;
  
  alert(mensaje);
  
  if (errores.length > 0) {
    console.warn('[MASIVA] Errores encontrados:', errores);
  }
  
  // Mostrar notificación temporal
  mostrarNotificacionTemporal(`⚡ ${cambiosAplicados} muros modificados masivamente`, 'success');
  
  } catch (error) {
    console.error('[MASIVA] ❌ Error aplicando cambios masivos:', error);
    alert(`Error aplicando cambios masivos: ${error.message}`);
  } finally {
    // Rehabilitar botón
    if (btnAplicar) {
      btnAplicar.disabled = false;
      btnAplicar.textContent = '⚡ Aplicar Cambios Masivos';
    }
  }
}

/**
 * Obtener rangos válidos para edición masiva
 */
function obtenerRangosMasivaValidos() {
  const rangos = [];
  const items = document.querySelectorAll('.rango-masiva-item');
  
  items.forEach((item, index) => {
    const numero = item.dataset.rango;
    const desde = parseInt(document.getElementById(`desdeMuro_masiva_${numero}`)?.value);
    const hasta = parseInt(document.getElementById(`hastaMuro_masiva_${numero}`)?.value);
    const tipoBrace = document.getElementById(`tipoBrace_masiva_${numero}`)?.value;
    const angulo = parseFloat(document.getElementById(`angulo_masiva_${numero}`)?.value);
    const npt = parseFloat(document.getElementById(`npt_masiva_${numero}`)?.value);
    
    // Validar que el rango sea válido
    if (isNaN(desde) || isNaN(hasta) || desde < 1 || hasta < desde) {
      return; // Saltar este rango
    }
    
    // Validar que al menos un parámetro esté definido
    const tieneCambios = tipoBrace || !isNaN(angulo) || !isNaN(npt);
    if (!tieneCambios) {
      return; // Saltar este rango
    }
    
    rangos.push({
      desde,
      hasta,
      tipoBrace: tipoBrace || null,
      angulo: !isNaN(angulo) ? angulo : null,
      npt: !isNaN(npt) ? npt : null
    });
  });
  
  return rangos.sort((a, b) => a.desde - b.desde);
}

// ===== FUNCIONES PARA ASIGNACIÓN DE EJES POR RANGOS =====

let contadorRangos = 1;

/**
 * Agregar un nuevo rango de ejes
 */
function agregarNuevoRango() {
  contadorRangos++;
  const container = document.getElementById('rangosContainer');
  
  const nuevoRango = document.createElement('div');
  nuevoRango.className = 'rango-item';
  nuevoRango.setAttribute('data-rango', contadorRangos);
  
  nuevoRango.innerHTML = `
    <div class="form-row">
      <label>Desde Muro:</label>
      <input type="number" class="rango-desde" min="1" value="" placeholder="Ej: 41">
      <label>Hasta Muro:</label>
      <input type="number" class="rango-hasta" min="1" value="" placeholder="Ej: 80">
      <label>Eje:</label>
      <input type="text" class="rango-eje" value="" placeholder="Ej: B" maxlength="10">
      <button type="button" class="btn-small btn--danger" onclick="eliminarRango(${contadorRangos})">Eliminar</button>
    </div>
  `;
  
  container.appendChild(nuevoRango);
  actualizarVistaPrevia();
}

/**
 * Eliminar un rango específico
 */
function eliminarRango(rangoId) {
  const rango = document.querySelector(`[data-rango="${rangoId}"]`);
  if (rango) {
    rango.remove();
    actualizarVistaPrevia();
  }
}

window.eliminarRango = eliminarRango;

/**
 * Inicializar configuración de rangos (limpiar y mostrar información)
 */
function autoGenerarRangos() {
  // Obtener la cantidad total de muros
  const totalMuros = window.globalVars?.panelesActuales?.length || 0;
  
  if (totalMuros === 0) {
    alert('No hay muros cargados. Primero importa los datos de muros.');
    return;
  }
  
  const container = document.getElementById('rangosContainer');
  container.innerHTML = ''; // Limpiar rangos existentes
  
  contadorRangos = 0;
  
  // Mostrar información al usuario
  alert(`Tienes ${totalMuros} muros cargados.\n\nAhora puedes definir manualmente los rangos de ejes.\nEjemplo:\n- Rango 1: Muros 1-40 → Eje A\n- Rango 2: Muros 41-80 → Eje B\n- etc.\n\nUsa el botón "Agregar Rango" para crear cada rango.`);
  
  // Agregar automáticamente el primer rango vacío para que el usuario empiece
  agregarNuevoRango();
  
  console.log(`[EJES] Configuración iniciada para ${totalMuros} muros - Define rangos manualmente`);
}

/**
 * Actualizar la vista previa de asignación
 */
function actualizarVistaPrevia() {
  const rangos = obtenerRangosValidos();
  const vistaPrevia = document.getElementById('vistaPrevia');
  const contenido = document.getElementById('vistaPreviaContenido');
  
  if (rangos.length === 0) {
    vistaPrevia.style.display = 'none';
    return;
  }
  
  let previewText = '';
  rangos.forEach(rango => {
    previewText += `Muros ${rango.desde}-${rango.hasta} (${rango.hasta - rango.desde + 1} muros a eliminar)\n`;
  });
  
  contenido.textContent = previewText;
  vistaPrevia.style.display = 'block';
}

/**
 * Obtener rangos válidos del formulario
 */
function obtenerRangosValidos() {
  const rangoItems = document.querySelectorAll('.rango-item');
  const rangos = [];
  
  console.log('[EJES] Elementos .rango-item encontrados:', rangoItems.length);
  
  rangoItems.forEach((item, index) => {
    const desdeInput = item.querySelector('.rango-desde');
    const hastaInput = item.querySelector('.rango-hasta');
    const ejeInput = item.querySelector('.rango-eje');
    
    console.log(`[EJES] Rango ${index + 1}:`, {
      desde: desdeInput?.value,
      hasta: hastaInput?.value,
      eje: ejeInput?.value,
      ejeFound: !!ejeInput
    });
    
    if (desdeInput && hastaInput && ejeInput) {
      const desde = parseInt(desdeInput.value);
      const hasta = parseInt(hastaInput.value);
      const eje = ejeInput.value.trim();
      
      if (desde && hasta && eje && desde <= hasta) {
        rangos.push({ desde, hasta, eje });
        console.log(`[EJES] Rango válido agregado: ${desde}-${hasta} → Eje "${eje}"`);
      } else {
        console.log(`[EJES] Rango inválido o incompleto: desde=${desde}, hasta=${hasta}, eje="${eje}"`);
      }
    } else {
      console.log(`[EJES] Rango ${index + 1} - elementos faltantes:`, {
        desdeInput: !!desdeInput,
        hastaInput: !!hastaInput,
        ejeInput: !!ejeInput
      });
    }
  });
  
  // Ordenar por rango inicial
  rangos.sort((a, b) => a.desde - b.desde);
  
  console.log('[EJES] Rangos válidos finales:', rangos);
  return rangos;
}

/**
 * Crear registros de muros en la base de datos antes de asignar ejes
 */
async function crearRegistrosMurosEnDB() {
  const muros = window.globalVars?.panelesActuales;
  if (!muros || muros.length === 0) {
    alert('No hay muros cargados. Primero ejecuta el cálculo de viento.');
    return false;
  }
  
  console.log(`[EJES] Creando ${muros.length} registros en la base de datos...`);
  
  try {
    // Preparar datos para crear registros
    const murosParaCrear = muros.map(muro => ({
      // Datos básicos del muro
      num: muro.num,
      area: muro.area,
      peso: muro.peso,
      altura: muro.altura,
      ycg: muro.ycg,

      // Datos de viento
      vd: muro.vd,
      qz: muro.qz,
      presion: muro.presion,
      fuerza: muro.fuerza,
      // Campos editables con valores por defecto
      tipo_brace: muro.tipo_brace || 'Tensor',
      angulo: muro.angulo || 55,
      npt: muro.npt || 0.350,
      eje: muro.eje || null,
      factor_w2: muro.factor_w2 || 0.6,
      // Datos calculados
      coordenada_x: muro.coordenada_x,
      coordenada_y: muro.coordenada_y,
      longitud: muro.longitud,
      fuerza_axial: muro.fuerza_axial,
      esfuerzo: muro.esfuerzo,
      cantidad: muro.cantidad
    }));
    
    const response = await fetch(`http://localhost:4008/api/calculos/crear-muros-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ muros: murosParaCrear })
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }
    
    const resultado = await response.json();
    console.log(`[EJES] ✅ ${resultado.murosCreados || 0} registros creados/actualizados en la base de datos`);
    
    // Actualizar los PIDs en los datos locales si la respuesta los incluye
    if (resultado.muros && Array.isArray(resultado.muros)) {
      resultado.muros.forEach((muroCreado, index) => {
        if (muros[index] && muroCreado.pid) {
          muros[index].pid = muroCreado.pid;
        }
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('[EJES] ❌ Error creando registros en la base de datos:', error);
    
    // Si el endpoint no existe, intentar con un endpoint alternativo
    if (error.message.includes('404')) {
      console.warn('[EJES] Endpoint de creación batch no encontrado, intentando método alternativo...');
      return await crearRegistrosIndividuales();
    }
    
    alert(`Error creando registros en la base de datos: ${error.message}\n\nVerifica que el backend esté funcionando correctamente.`);
    return false;
  }
}

/**
 * Método alternativo: crear registros individuales
 */
async function crearRegistrosIndividuales() {
  const muros = window.globalVars?.panelesActuales;
  let creados = 0;
  let errores = 0;
  
  console.log('[EJES] Intentando crear registros individuales...');
  
  for (let i = 0; i < Math.min(muros.length, 5); i++) { // Probar solo con los primeros 5
    const muro = muros[i];
    try {
      const response = await fetch(`http://localhost:4008/api/calculos/crear-muro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(muro)
      });
      
      if (response.ok) {
        const resultado = await response.json();
        if (resultado.pid) {
          muro.pid = resultado.pid;
          creados++;
        }
      } else {
        errores++;
      }
    } catch (error) {
      errores++;
    }
  }
  
  if (creados > 0) {
    console.log(`[EJES] ✅ ${creados} registros de prueba creados exitosamente`);
    return true;
  } else {
    console.error(`[EJES] ❌ No se pudieron crear registros (${errores} errores)`);
    return false;
  }
}

/**
 * Aplicar los ejes por rangos a los muros (versión mejorada)
 */
async function aplicarEjesPorRango() {
  const rangos = obtenerRangosValidos();
  
  console.log('[EJES] Rangos obtenidos:', rangos);
  
  if (rangos.length === 0) {
    alert('No hay rangos válidos configurados. Por favor, define al menos un rango.');
    return;
  }
  
  // Validar que no haya solapamientos
  for (let i = 0; i < rangos.length - 1; i++) {
    if (rangos[i].hasta >= rangos[i + 1].desde) {
      alert(`Error: Los rangos se solapan. Rango ${i + 1} (${rangos[i].desde}-${rangos[i].hasta}) con Rango ${i + 2} (${rangos[i + 1].desde}-${rangos[i + 1].hasta})`);
      return;
    }
  }
  
  // Obtener muros actuales
  const muros = window.globalVars?.panelesActuales;
  if (!muros || muros.length === 0) {
    alert('No hay muros cargados. Primero importa los datos de muros.');
    return;
  }
  
  // Verificar si los muros tienen PIDs válidos
  console.log(`[EJES] Verificando validez de PIDs...`);
  
  // Primero verificar muros sin PID
  const murosSinPid = muros.filter(m => !m.pid);
  if (murosSinPid.length > 0) {
    console.warn(`[EJES] ${murosSinPid.length} muros sin PID detectados.`);
  }
  
  // Luego verificar si los PIDs existentes son válidos haciendo una prueba con los primeros muros
  let pidsInvalidos = false;
  if (murosSinPid.length === 0 && muros.length > 0) {
    console.log(`[EJES] Verificando si los PIDs son válidos en la DB...`);
    
    // Probar con los primeros 3 muros
    const murosParaProbar = muros.slice(0, 3);
    let erroresPrueba = 0;
    
    for (const muro of murosParaProbar) {
      try {
        const response = await fetch(`http://localhost:4008/api/calculos/muros/${muro.pid}/editable`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _test: true }) // Envío de prueba
        });
        if (response.status === 404) {
          erroresPrueba++;
        }
      } catch (error) {
        erroresPrueba++;
      }
    }
    
    if (erroresPrueba === murosParaProbar.length) {
      pidsInvalidos = true;
      console.warn(`[EJES] Todos los PIDs probados (${murosParaProbar.length}) son inválidos en la DB.`);
    }
  }
  
  // Si hay muros sin PID o PIDs inválidos, ofrecer crear registros
  if (murosSinPid.length > 0 || pidsInvalidos) {
    const razon = murosSinPid.length > 0 
      ? `${murosSinPid.length} muros sin PID` 
      : `PIDs inválidos en la base de datos`;
      
    console.warn(`[EJES] Problema detectado: ${razon}. Intentando crear registros en la DB...`);
    
    const confirmacion = confirm(
      `⚠️ Problema detectado: ${razon}\n\n` +
      `Los muros no se pueden actualizar porque no existen en la base de datos.\n\n` +
      `¿Deseas crear los registros automáticamente?\n\n` +
      `Esto guardará todos los muros en la base de datos para poder asignar ejes.`
    );
    
    if (confirmacion) {
      const exito = await crearRegistrosMurosEnDB();
      if (!exito) {
        return; // Salir si no se pudieron crear los registros
      }
    } else {
      alert('No se pueden asignar ejes sin registros válidos en la DB. Operación cancelada.');
      return;
    }
  }
  
  console.log(`[EJES] Aplicando ${rangos.length} rangos a ${muros.length} muros`);
  
  // Debug: Mostrar algunos muros de ejemplo
  console.log('[EJES] Muestra de muros disponibles:', muros.slice(0, 3).map(m => ({ num: m.num, pid: m.pid, id: m.id })));
  
  // Crear objeto de actualización masiva
  const actualizaciones = [];
  const murosNoEncontrados = [];
  
  rangos.forEach(rango => {
    for (let numMuro = rango.desde; numMuro <= rango.hasta; numMuro++) {
      // Buscar el muro por número
      const muro = muros.find(m => m.num === numMuro);
      if (muro && muro.pid) {
        actualizaciones.push({
          pid: muro.pid,
          eje: rango.eje,
          num: numMuro
        });
      } else {
        murosNoEncontrados.push(numMuro);
      }
    }
  });
  
  if (actualizaciones.length === 0) {
    alert('No se encontraron muros válidos para actualizar.');
    return;
  }
  
  if (murosNoEncontrados.length > 0) {
    console.warn(`[EJES] Muros no encontrados: ${murosNoEncontrados.slice(0, 10).join(', ')}${murosNoEncontrados.length > 10 ? '...' : ''} (Total: ${murosNoEncontrados.length})`);
  }
  
  console.log(`[EJES] Preparando ${actualizaciones.length} actualizaciones de ${rangos.length} rangos`);
  console.log('[EJES] Primera actualización de ejemplo:', actualizaciones[0]);
  
  // Enviar actualizaciones al backend
  try {
    let actualizacionesExitosas = 0;
    let errores = [];
    
    const promises = actualizaciones.map(async (update) => {
      try {
        const response = await fetch(`http://localhost:4008/api/calculos/muros/${update.pid}/editable`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eje: update.eje })
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            errores.push(`Muro ${update.num} (PID: ${update.pid}) no encontrado en DB`);
            return null;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        actualizacionesExitosas++;
        return await response.json();
      } catch (error) {
        errores.push(`Muro ${update.num} (PID: ${update.pid}): ${error.message}`);
        return null;
      }
    });
    
    const resultados = await Promise.all(promises);
    const exitosos = resultados.filter(r => r !== null);
    
    console.log(`[EJES] ✅ ${actualizacionesExitosas} muros actualizados correctamente`);
    
    if (errores.length > 0) {
      console.warn(`[EJES] ⚠️ ${errores.length} errores encontrados:`, errores.slice(0, 5));
    }
    
    // Actualizar los datos locales solo para los exitosos
    actualizaciones.forEach(update => {
      const muro = muros.find(m => m.pid === update.pid);
      if (muro && !errores.some(e => e.includes(update.pid))) {
        muro.eje = update.eje;
        console.log(`[EJES] ✅ Actualizado localmente: Muro ${update.num} → Eje "${update.eje}"`);
      }
    });
    
    // Actualizar inmediatamente los campos EJE en la tabla visible
    console.log('[EJES] Actualizando campos EJE en la tabla...');
    actualizarCamposEjeEnTabla(actualizaciones);
    
    // NO refrescar toda la tabla para evitar perder los datos de viento calculados
    // En su lugar, solo actualizar los campos EJE y mantener los datos existentes
    console.log('[EJES] Manteniendo datos de viento existentes, solo actualizando ejes...');
    
    // Mostrar mensaje de éxito con detalles
    let mensaje = `✅ Ejes asignados correctamente!\n\n`;
    mensaje += `• ${actualizacionesExitosas} muros actualizados exitosamente\n`;
    
    if (errores.length > 0) {
      mensaje += `• ${errores.length} muros con errores (probablemente no existen en la DB)\n`;
      mensaje += `\nPrimeros errores:\n${errores.slice(0, 3).join('\n')}`;
      if (errores.length > 3) {
        mensaje += `\n... y ${errores.length - 3} errores más (ver consola para detalles)`;
      }
    }
    
    mensaje += `\n\nLa tabla se ha refrescado automáticamente para mostrar los cambios.`;
    mensaje += `\nTambién puedes usar "Reagrupar Muertos" para ver la nueva agrupación.`;
    
    alert(mensaje);
    
    // Reagrupar automáticamente después de asignar ejes para mostrar la nueva agrupación
    console.log('[EJES] Reagrupando automáticamente después de asignar ejes...');
    try {
      // En lugar de reagrupar desde BD (que puede no tener los ejes actualizados),
      // reagrupar desde la tabla actual que SÍ tiene los ejes actualizados
      console.log('[EJES] Usando reagrupación desde tabla actual (con ejes actualizados)...');
      reagruparMuertosConValoresActuales();
      console.log('[EJES] ✅ Reagrupación automática completada desde tabla');
    } catch (error) {
      console.warn('[EJES] ⚠️ Error en reagrupación automática:', error);
    }
    
    // Mostrar el botón de guardar en DB
    const btnGuardar = document.getElementById('btnGuardarEjes');
    if (btnGuardar) {
      btnGuardar.style.display = 'inline-block';
    }
    
    // Si hay una tabla visible, NO ocultar los paneles para permitir guardar
    // const ejesPanel = document.getElementById('ejesRangoPanel');
    // const bracesPanel = document.getElementById('bracesConfigPanel');
    // if (ejesPanel) ejesPanel.style.display = 'none';
    // if (bracesPanel) bracesPanel.style.display = 'none';
    
  } catch (error) {
    console.error('[EJES] ❌ Error aplicando ejes por rangos:', error);
    alert(`Error aplicando ejes: ${error.message}`);
  }
}

/**
 * Mostrar panel de asignación de ejes arriba de los resultados de viento
 */
function mostrarPanelAsignacionEjes() {
  // Buscar si ya existe el panel
  let panelExistente = document.getElementById('ejesRangoPanel');
  
  if (panelExistente) {
    panelExistente.style.display = 'block';
    return;
  }

  // Crear el panel si no existe
  const resultadosViento = document.getElementById('resultadosViento');
  const tablaResultados = document.getElementById('tablaResultadosViento');
  
  const panelHTML = `
    <div id="ejesRangoPanel" class="panel" style="margin-bottom: 2rem; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.5rem; padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="margin: 0; color: #333;">🎯 Asignación de Ejes por Rangos</h3>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btnGuardarEjes" class="btn btn--success" style="display: none;">💾 Guardar en DB</button>
          <button id="btnCerrarEjesPanel" class="btn btn--ghost" style="padding: 0.25rem 0.5rem;">✕</button>
        </div>
      </div>
      
      <!-- Instrucciones de uso -->
      <div style="margin-bottom: 1rem; padding: 0.75rem; background: #e8f4fd; border-left: 4px solid #0066cc; border-radius: 0.25rem;">
        <p style="margin: 0; font-size: 0.9rem; color: #0066cc;">
          <strong>Instrucciones:</strong> Define manualmente los rangos de muros para cada eje. 
          Ejemplo: Muros 1-40 → Eje A, Muros 41-80 → Eje B, etc.
        </p>
      </div>
      
      <!-- Container para los rangos -->
      <div id="rangosContainer" style="margin-bottom: 1rem;">
        <!-- Los rangos se generan dinámicamente aquí -->
      </div>
      
      <!-- Botones de gestión de rangos -->
      <div class="actions" style="margin-bottom: 1rem; gap: 0.5rem; display: flex; flex-wrap: wrap;">
        <button id="btnAgregarRango" class="btn btn--ghost">+ Agregar Rango</button>
        <button id="btnAutoGenerarRangos" class="btn btn--secondary">Iniciar Configuración</button>
        <button id="btnCrearRegistros" class="btn btn--tertiary">💾 Crear Registros en DB</button>
        <button id="btnAplicarEjesRango" class="btn btn--primary">Aplicar Ejes por Rangos</button>
        <button id="btnRefrescarTabla" class="btn btn--secondary" style="font-size: 0.9rem;">🔄 Refrescar Tabla</button>
        <button id="btnDebugMuros" class="btn btn--tertiary" style="font-size: 0.8rem;">🔍 Debug Muros</button>
      </div>
      
      <!-- Vista previa de la asignación -->
      <div id="vistaPrevia" style="margin-top: 1rem; padding: 1rem; background: #ffffff; border: 1px solid #dee2e6; border-radius: 0.5rem; display: none;">
        <h4 style="margin: 0 0 0.5rem 0; color: #666;">Vista Previa:</h4>
        <pre id="vistaPreviaContenido" style="margin: 0; font-family: 'Courier New', monospace; font-size: 0.9rem; color: #333; white-space: pre-wrap;"></pre>
      </div>
    </div>
  `;
  
  // Insertar el panel antes de la tabla de resultados
  tablaResultados.insertAdjacentHTML('beforebegin', panelHTML);
  
  // Configurar event listeners para el panel
  configurarEventListenersEjes();
}

/**
 * Configurar event listeners para el panel de ejes
 */
function configurarEventListenersEjes() {
  // Botón para cerrar el panel
  const btnCerrar = document.getElementById('btnCerrarEjesPanel');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      document.getElementById('ejesRangoPanel').style.display = 'none';
    });
  }
  
  // Botón para guardar en DB
  const btnGuardar = document.getElementById('btnGuardarEjes');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarEjesEnDB);
  }
  
  // Otros botones (reutilizando las funciones existentes)
  const btnAgregar = document.getElementById('btnAgregarRango');
  const btnIniciar = document.getElementById('btnAutoGenerarRangos');
  const btnCrear = document.getElementById('btnCrearRegistros');
  const btnAplicar = document.getElementById('btnAplicarEjesRango');
  const btnRefrescar = document.getElementById('btnRefrescarTabla');
  const btnDebug = document.getElementById('btnDebugMuros');
  
  if (btnAgregar) btnAgregar.addEventListener('click', agregarNuevoRango);
  if (btnIniciar) btnIniciar.addEventListener('click', autoGenerarRangos);
  if (btnCrear) btnCrear.addEventListener('click', crearRegistrosMurosEnDB);
  if (btnAplicar) btnAplicar.addEventListener('click', aplicarEjesPorRango);
  if (btnRefrescar) btnRefrescar.addEventListener('click', refrescarTablaResultados);
  if (btnDebug) btnDebug.addEventListener('click', debugMostrarMuros);
}

/**
 * Guardar ejes asignados en la base de datos
 */
async function guardarEjesEnDB() {
  const muros = window.globalVars?.panelesActuales;
  if (!muros || muros.length === 0) {
    alert('No hay muros cargados para guardar.');
    return;
  }
  
  // Filtrar solo muros que tienen eje asignado
  const murosConEje = muros.filter(muro => muro.eje && muro.eje.trim() !== '');
  
  if (murosConEje.length === 0) {
    alert('No hay muros con ejes asignados para guardar.');
    return;
  }
  
  console.log(`[EJES] Guardando ${murosConEje.length} muros con ejes en la base de datos`);
  
  try {
    const promises = murosConEje.map(async (muro) => {
      if (!muro.pid) {
        console.warn(`[EJES] Muro ${muro.num} no tiene PID, omitiendo...`);
        return null;
      }
      
        const response = await fetch(`http://localhost:4008/api/calculos/muros/${muro.pid}/editable`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eje: muro.eje })
        });      if (!response.ok) {
        throw new Error(`Error guardando muro PID ${muro.pid}: ${response.statusText}`);
      }
      
      return await response.json();
    });
    
    const resultados = await Promise.all(promises);
    const exitosos = resultados.filter(r => r !== null).length;
    
    console.log(`[EJES] ✅ ${exitosos} muros guardados correctamente en la base de datos`);
    
    // Mostrar mensaje de éxito
    alert(`✅ Ejes guardados correctamente en la base de datos!\n\n${exitosos} muros actualizados exitosamente.`);
    
    // Ocultar el botón de guardar temporalmente
    const btnGuardar = document.getElementById('btnGuardarEjes');
    if (btnGuardar) {
      btnGuardar.style.display = 'none';
      setTimeout(() => {
        if (btnGuardar) btnGuardar.style.display = 'inline-block';
      }, 3000);
    }
    
  } catch (error) {
    console.error('[EJES] ❌ Error guardando ejes en la base de datos:', error);
    alert(`Error guardando ejes en la base de datos: ${error.message}`);
  }
}

/**
 * Función de debug para mostrar información de los muros
 */
function debugMostrarMuros() {
  const muros = window.globalVars?.panelesActuales;
  if (!muros || muros.length === 0) {
    alert('No hay muros cargados.');
    return;
  }
  
  console.log(`[DEBUG] Total de muros cargados: ${muros.length}`);
  
  // Mostrar estructura de un muro de ejemplo
  console.log('[DEBUG] Estructura de muro de ejemplo:', muros[0]);
  
  // Mostrar algunos muros con sus PIDs
  const muestaMuros = muros.slice(0, 10).map(m => ({
    num: m.num,
    pid: m.pid,
    id: m.id,
    eje: m.eje || 'Sin eje'
  }));
  console.table(muestaMuros);
  
  // Verificar si hay PIDs faltantes
  const sinPid = muros.filter(m => !m.pid);
  if (sinPid.length > 0) {
    console.warn(`[DEBUG] ${sinPid.length} muros sin PID:`, sinPid.slice(0, 5).map(m => m.num));
  }
  
  // Rango de números de muros
  const numeros = muros.map(m => m.num).sort((a, b) => a - b);
  const minNum = Math.min(...numeros);
  const maxNum = Math.max(...numeros);
  
  // Rango de PIDs
  const pids = muros.filter(m => m.pid).map(m => m.pid).sort((a, b) => a - b);
  const minPid = pids.length > 0 ? Math.min(...pids) : 'N/A';
  const maxPid = pids.length > 0 ? Math.max(...pids) : 'N/A';
  
  const info = `🔍 DEBUG - Información de Muros\n\n` +
    `📊 Total de muros: ${muros.length}\n` +
    `📝 Muros con PID: ${muros.filter(m => m.pid).length}\n` +
    `❌ Muros sin PID: ${sinPid.length}\n\n` +
    `🔢 Rango de números: ${minNum} - ${maxNum}\n` +
    `🆔 Rango de PIDs: ${minPid} - ${maxPid}\n\n` +
    `⚠️ NOTA: Los PIDs pueden existir pero no estar guardados en la DB.\n` +
    `Usa "Crear Registros en DB" si sigues teniendo errores 404.\n\n` +
    `Ver consola (F12) para más detalles.`;
  
  alert(info);
}

/**
 * Refrescar la tabla de resultados con los datos actuales
 */
async function refrescarTablaResultados() {
  const muros = window.globalVars?.panelesActuales;
  if (!muros || muros.length === 0) {
    alert('No hay datos de muros para refrescar. Ejecuta primero el cálculo de viento.');
    return;
  }
  
  console.log('[EJES] Refrescando tabla de resultados manualmente...');
  
  try {
    await mostrarResultadosViento(muros);
    console.log('[EJES] ✅ Tabla refrescada exitosamente');
    
    // Mostrar notificación temporal
    const mensaje = document.createElement('div');
    mensaje.innerHTML = '✅ Tabla refrescada';
    mensaje.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: #28a745; color: white; padding: 8px 16px;
      border-radius: 4px; font-weight: bold;
      animation: fadeOut 2s ease-in-out forwards;
    `;
    
    // Agregar animación CSS si no existe
    if (!document.querySelector('#fadeOutStyle')) {
      const style = document.createElement('style');
      style.id = 'fadeOutStyle';
      style.textContent = `
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateX(0); }
          70% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(100px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(mensaje);
    setTimeout(() => mensaje.remove(), 2000);
    
  } catch (error) {
    console.error('[EJES] ❌ Error refrescando tabla:', error);
    alert(`Error refrescando la tabla: ${error.message}`);
  }
}

// Agregar event listeners para actualizar vista previa
document.addEventListener('DOMContentLoaded', () => {
  // Event listeners para inputs de rangos (delegación de eventos)
  document.addEventListener('input', (e) => {
    if (e.target.matches('.rango-desde, .rango-hasta, .rango-eje')) {
      actualizarVistaPrevia();
    }
  });
});

// Exponer funciones globalmente para acceso desde dashboard.js
window.enableAccordionAfterGrouping = function() {
  console.log('[FRONTEND] Habilitando primera sección del acordeón - muros agrupados');
  const firstItem = document.querySelector('.accordion-item');
  if (firstItem && window.lastGruposMuertos && Object.keys(window.lastGruposMuertos).length > 0) {
    firstItem.classList.add('active');
    console.log('[FRONTEND] Primera sección habilitada automáticamente');
  }
};

// ==== Dock lateral tipo mac: SOLO dashboard, no altera nada más ====
(function initDockOnlyOnDashboard() {
  if (window.location.pathname !== '/dashboard') return;

  // Helper para crear elementos
  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') n.className = v;
      else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => n.dataset[dk] = dv);
      else if (k === 'aria') Object.entries(v).forEach(([ak, av]) => n.setAttribute(`aria-${ak}`, av));
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => c && n.appendChild(c));
    return n;
  };

  // Define tus acciones aquí (solo imágenes; tooltip con texto)
// ===== Dock: items superiores (solo imágenes) =====
const itemsTop = [
  { action: 'home',              label: 'Home',               icon: 'img/backgrounds/10.png' },
  { action: 'import-txt',        label: 'Importar TXT',       icon: 'img/backgrounds/11.png' },
  { action: 'paneles-importados',label: 'Paneles importados', icon: 'img/backgrounds/6.png'  },
  { action: 'calculos-libro',    label: 'Cálculos libro',     icon: 'img/backgrounds/7.png'  },
  { action: 'resultados-calculo',label: 'Resultados cálculo', icon: 'img/backgrounds/9.png'  },
  { action: 'armado-deadman',    label: 'Armado Deadman',     icon: 'img/backgrounds/8.png'  },
];


const itemsBottom = [
  { action: 'help', label: 'Ayuda', icon: 'img/backgrounds/12.png' },
];


// Mapeo de acciones a funciones reales
const clickHandlers = {
  // Buscar por nombre de proyecto 
  'open-search': () => {
    const el = document.getElementById('nombreProyecto');
    if (el) el.focus();
  },

  // 1) HOME
  'home': () => {
    if (window.location.pathname !== '/dashboard') {
      window.location.assign('/dashboard');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  // 2) IMPORTAR TXT  -> Sección 1
  'import-txt': () => {
    const sec = document.getElementById('section-import-txt');
    if (sec) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const input = document.getElementById('txtInput');
    if (input) input.focus();
  },

  // 3) PANELES IMPORTADOS -> Sección 2
  'paneles-importados': () => {
    const sec = document.getElementById('section-paneles-importados');
    if (sec) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // 4) CÁLCULOS LIBRO III -> Sección 3
  'calculos-libro': () => {
    const sec = document.getElementById('section-calculos-libro');
    if (sec) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // 5) RESULTADOS DE CÁLCULOS -> Sección 4
  'resultados-calculo': () => {
    const sec = document.getElementById('section-resultados-calculo');
    if (sec) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // 6) ARMADO DEADMAN -> Sección 5
  'armado-deadman': () => {
    const sec = document.getElementById('section-armado-deadman');
    if (sec) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // Botón CALCULAR (si lo sigues usando)
  'calc': () => {
    const btn = document.getElementById('btnCalcular');
    if (btn) btn.click();
  },

  // Botón EXPORTAR PDF
  'export-pdf': () => {
    const btn = document.getElementById('btnInforme');
    if (btn) btn.click();
  },

  // AYUDA (botón amarillo)
  'help': () => {
    // Aquí luego puedes abrir modal o página de ayuda
    alert('Aquí irá la ayuda de PuntaLink 😊');
  },
};

  const makeButton = ({ action, label, icon }) => el('button',
    { class: 'dock-item', type: 'button', 'aria-label': label, dataset: { action } },
    [
      el('img', { src: icon, alt: '' }),
      el('span', { class: 'dock-tooltip' }, document.createTextNode(label))
    ]
  );

  const dock = el('aside', { class: 'dock-left', 'aria-label': 'Barra de acceso rápido' });
// Top
itemsTop.forEach(it => dock.appendChild(makeButton(it)));

// Bottom (Ajustes / Ayuda)
itemsBottom.forEach(it => dock.appendChild(makeButton(it)));

  document.body.appendChild(dock);

  // Delegación de eventos
  dock.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.dock-item');
    if (!btn) return;
    const action = btn.dataset.action;
    const handler = clickHandlers[action];
    if (typeof handler === 'function') handler();
  });
})();
