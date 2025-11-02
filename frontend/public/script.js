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
  guardarCambiosProyecto
} from './js/dashboard.js';

import { 
    createProject,
    loadPreviousProjects
} from './js/index.js';

const { confirmar, mostrarNotificacion, BarraProgreso, ejecutarConLoading, debounce, formatearError } = window.Usability || {};

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
      credentials: 'include',             // ⬅️ IMPORTANTE
      body: JSON.stringify({ credential })// id_token
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('[LOGIN] HTTP', resp.status, text);
      alert(`Error al iniciar sesión (HTTP ${resp.status})`);
      return;
    }

    const data = await resp.json();
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

    const signinDiv = document.querySelector('.g_id_signin');
    const ui = $userInfo();
    const email = $userEmail();
    const pic = $userPic();

    if (ok && user) {
      AuthState.user = user;
      localStorage.setItem('user', JSON.stringify(user));
      if (signinDiv) signinDiv.style.display = 'none';
      if (ui) ui.style.display = 'flex';
      if (email) email.textContent = user.email || '';
      if (pic) {
        if (user.picture) { pic.src = user.picture; pic.style.display = ''; }
        else { pic.style.display = 'none'; }
      }
      if (window.location.pathname === "/") {
        await loadPreviousProjects(user.uid);
        }
    } else {
      AuthState.user = null;
      localStorage.removeItem('user');
      if (signinDiv) signinDiv.style.display = '';
      if (ui) ui.style.display = 'none';
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
    resultadosActuales: []
  };
  
  // Hacer globalVars accesible globalmente para funciones de viento
  window.globalVars = globalVars;

  // ===== FUNCIONALIDAD DE ACORDEÓN =====
  function initAccordion() {
    console.log('[FRONTEND] Inicializando acordeón con primera sección siempre visible');
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    // Marcar la primera sección como siempre activa
    const firstItem = document.querySelector('.accordion-item');
    if (firstItem) {
      firstItem.classList.add('active');
    }
    
    accordionHeaders.forEach((header, index) => {
      header.addEventListener('click', () => {
        // No permitir colapsar la primera sección
        if (index === 0) return;
        
        const accordionItem = header.parentElement;
        const isActive = accordionItem.classList.contains('active');
        
        console.log('[FRONTEND] Acordeón clickeado:', header.querySelector('.accordion-title').textContent.trim());
        
        // Toggle solo para secciones que no son la primera
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
    btnAplicarGlobales.addEventListener('click', aplicarValoresGlobales);
  }

  // ===== INICIALIZACIÓN =====
  initAccordion();
  console.log('[FRONTEND] Aplicación inicializada con módulo de botones consolidado');
});

// ===== FUNCIONES PARA CÁLCULO DE VIENTO =====
/**
 * Sección 1-2: Función principal para calcular cargas de viento
 * Implementa las fórmulas del Excel y diagramas según Tomo III
 */
async function calcularCargasViento() {
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
      mostrarResultadosViento(data);
    } else {
      throw new Error(data.error || 'Error desconocido en el cálculo');
    }

  } catch (error) {
    console.error('[WIND] Error en cálculo de viento:', error);
    if (mostrarNotificacion) {
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
async function mostrarResultadosViento(data) {
  console.log('[WIND] Mostrando resultados de viento');
  
  const resultadosViento = document.getElementById('resultadosViento');
  const tablaResultados = document.getElementById('tablaResultadosViento');
  const detalleCalculos = document.getElementById('detalleCalculosViento');

  // Mostrar la sección de resultados
  resultadosViento.style.display = 'block';

  // Obtener valores globales para braces
  const anguloGlobal = parseFloat(document.getElementById('angulo_global')?.value) || 55;
  const nptGlobal = parseFloat(document.getElementById('npt_global')?.value) || 0.350;
  const factorW2Global = 0.6; // Factor fijo

  // Crear tabla de resultados unificada
  let htmlTabla = `
    <table class="wind-results-table unified-table">
      <thead>
        <tr>
          <th rowspan="2">Muro</th>
          <th colspan="5" style="background: #e3f2fd;">Datos del Muro</th>
          <th colspan="4" style="background: #fff3e0;">Cálculos de Viento</th>
          <th colspan="4" style="background: #f3e5f5;">Parámetros Braces (Editables)</th>
          <th colspan="3" style="background: #e8f5e9;">Geometría Inserto</th>
          <th colspan="4" style="background: #fce4ec;">Fuerzas y Cantidad</th>
        </tr>
        <tr>
          <!-- Datos del Muro -->
          <th style="background: #e3f2fd;">Área (m²)</th>
          <th style="background: #e3f2fd;">Peso (ton)</th>
          <th style="background: #e3f2fd;">Altura (m)</th>
          <th style="background: #e3f2fd;">YCG (m)</th>
          <th style="background: #e3f2fd;">NFT (m)</th>
          <!-- Viento -->
          <th style="background: #fff3e0;">Vd (km/h)</th>
          <th style="background: #fff3e0;">qz (kPa)</th>
          <th style="background: #fff3e0;">Presión (kPa)</th>
          <th style="background: #fff3e0;">Fuerza (kN)</th>
          <!-- Braces Editables -->
          <th style="background: #f3e5f5;">Tipo</th>
          <th style="background: #f3e5f5;">Ángulo (°)</th>
          <th style="background: #f3e5f5;">NPT (m)</th>
          <th style="background: #f3e5f5;">Factor W2</th>
          <!-- Geometría -->
          <th style="background: #e8f5e9;">X (m)</th>
          <th style="background: #e8f5e9;">Y (m)</th>
          <th style="background: #e8f5e9;">Longitud (m)</th>
          <!-- Fuerzas -->
          <th style="background: #fce4ec;">FBx (kN)</th>
          <th style="background: #fce4ec;">FBy (kN)</th>
          <th style="background: #fce4ec;">FB (kN)</th>
          <th style="background: #fce4ec;">Cantidad</th>
        </tr>
      </thead>
      <tbody id="tablaUnificadaBody">
  `;

  data.resultados.forEach(resultado => {
    const pid = resultado.pid || 0;
    const idMuro = resultado.id_muro;
    
    // Valores iniciales para braces (usar globales si no existen en resultado)
    const anguloInicial = resultado.angulo_brace || anguloGlobal;
    const nptInicial = resultado.npt || nptGlobal;
    const factorW2Inicial = resultado.factor_w2 || factorW2Global;
    const tipoInicial = resultado.tipo_brace_seleccionado || 'B12';
    
    // Longitudes por tipo
    const longitudes = { B4: 4.6, B12: 9.75, B14: 12.75, B15: 15.8 };
    const longitudActual = longitudes[tipoInicial] || 9.75;
    
    htmlTabla += `
      <tr data-pid="${pid}" data-alto="${resultado.altura_z_m}" data-presion="${resultado.presion_kPa}" data-fuerza="${resultado.fuerza_kN}">
        <td><strong>${idMuro}</strong></td>
        
        <!-- Datos del Muro -->
        <td>${resultado.area_m2}</td>
        <td>${resultado.peso_ton}</td>
        <td>${resultado.altura_z_m}</td>
        <td>${resultado.YCG || 'N/A'}</td>
        <td>${resultado.NFT?.toFixed(3) || 'N/A'}</td>
        
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
        <td class="valor-calculado valor-cantidad" data-pid="${pid}">-</td>
      </tr>
    `;
  });

  htmlTabla += `
      </tbody>
    </table>
  `;

  tablaResultados.innerHTML = htmlTabla;
  
  console.log('[BRACES] Tabla HTML insertada');
  
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

  // Crear detalle de cálculos
  let htmlDetalle = '';
  
  data.resultados.forEach(resultado => {
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
    
    if (resultado.NFT !== undefined) {
      htmlDetalle += `<li><strong>📏 NFT - Nivel de Piso Terminado:</strong></li>`;
      htmlDetalle += `<ul>`;
      htmlDetalle += `<li><strong>Nivel final:</strong> ${resultado.NFT.toFixed(3)}m</li>`;
      if (resultado.componentes_nft) {
        htmlDetalle += `<li><strong>Componentes del cálculo:</strong></li>`;
        htmlDetalle += `<li style="margin-left: 20px;">• Nivel Natural Terreno: ${resultado.componentes_nft.nivel_natural}m</li>`;
        htmlDetalle += `<li style="margin-left: 20px;">• Excavación: ${resultado.componentes_nft.excavacion}m</li>`;
        htmlDetalle += `<li style="margin-left: 20px;">• Espesor losa: ${resultado.componentes_nft.espesor_losa}m (${(resultado.componentes_nft.espesor_losa * 39.37).toFixed(1)}")</li>`;
        htmlDetalle += `<li style="margin-left: 20px;">• Acabado superficial: ${resultado.componentes_nft.acabado}m</li>`;
        htmlDetalle += `<li><strong>Fórmula:</strong> NFT = NNT - Excavación + Espesor_Losa + Acabado</li>`;
      }
      htmlDetalle += `</ul>`;
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

  detalleCalculos.innerHTML = htmlDetalle;

  // Mostrar el panel de configuración de braces después del primer cálculo
  const bracesConfigPanel = document.getElementById('bracesConfigPanel');
  if (bracesConfigPanel) {
    bracesConfigPanel.style.display = 'block';
    console.log('[BRACES] Panel de configuración mostrado después del cálculo');
  }

  // Scroll hacia los resultados
  resultadosViento.scrollIntoView({ behavior: 'smooth' });
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
      
      row.querySelector(`.valor-cantidad[data-pid="${pid}"]`).textContent = 
        calc.cant_braces !== undefined ? calc.cant_braces : '-';
      
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
  
  const rows = document.querySelectorAll('#tablaUnificadaBody tr[data-pid]');
  let exitosos = 0;
  let errores = 0;
  
  for (const row of rows) {
    const pid = row.dataset.pid;
    
    try {
      // Obtener valores de la fila
      const tipoBrace = row.querySelector('[data-field="tipo_brace"]').value;
      const angulo = parseFloat(row.querySelector('[data-field="angulo"]').value);
      const npt = parseFloat(row.querySelector('[data-field="npt"]').value);
      const factorW2 = 0.6; // Factor fijo
      
      // Actualizar campos editables
      const response = await fetch(`${API_BASE}/api/calculos/muros/${pid}/editable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angulo_brace: angulo,
          npt: npt,
          tipo_brace_seleccionado: tipoBrace,
          factor_w2: factorW2
        })
      });
      
      if (response.ok) {
        // Ahora calcular y guardar fuerzas
        const calcResponse = await fetch(`${API_BASE}/api/calculos/muros/${pid}/calcular-braces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            angulo_brace: angulo,
            npt: npt,
            tipo_brace_seleccionado: tipoBrace
          })
        });
        
        if (calcResponse.ok) {
          exitosos++;
        } else {
          errores++;
        }
      } else {
        errores++;
      }
    } catch (error) {
      console.error(`[BRACES] Error guardando PID ${pid}:`, error);
      errores++;
    }
  }
  
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
    // Feedback visual
    const tbody = document.getElementById('tablaUnificadaBody');
    if (tbody) {
      tbody.style.backgroundColor = '#d4edda';
      setTimeout(() => { tbody.style.backgroundColor = ''; }, 1000);
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
