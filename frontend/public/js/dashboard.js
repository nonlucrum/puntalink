// ===== MÓDULO CONSOLIDADO DE BOTONES =====
// import * as Muertos from './muertos.js'; // ELIMINADO - Cálculos cilíndricos ahora son funcionalidades independientes

import {
  prepararGruposParaMuertos,
  calcularMacizosRectangulares,
  generarTablaResultadosMacizos
} from './muertoRectangular.js';

import {mostrarResultadosViento} from '../script.js';

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:4008"   // dev backend
    : "";                       // production (relative)

// ===== MODAL PERSONALIZADO =====
function mostrarModalConfirmacion(titulo, mensaje, opciones = {}) {
  return new Promise((resolve) => {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #2a2a3e;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      color: white;
    `;

    const icono = opciones.tipo === 'warning' ? '⚠️' : opciones.tipo === 'success' ? '✅' : 'ℹ️';
    
    modal.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
        <span style="font-size: 2rem;">${icono}</span>
        <h3 style="margin: 0; font-size: 1.5rem;">${titulo}</h3>
      </div>
      <div style="margin-bottom: 2rem; white-space: pre-wrap; line-height: 1.6;">
        ${mensaje}
      </div>
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        ${opciones.mostrarCancelar !== false ? `
          <button id="btn-modal-cancelar" style="
            padding: 0.75rem 1.5rem;
            background: #6c757d;
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          ">Cancelar</button>
        ` : ''}
        <button id="btn-modal-aceptar" style="
          padding: 0.75rem 1.5rem;
          background: ${opciones.tipo === 'warning' ? '#dc3545' : '#28a745'};
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        ">${opciones.textoAceptar || 'Aceptar'}</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    const btnAceptar = modal.querySelector('#btn-modal-aceptar');
    const btnCancelar = modal.querySelector('#btn-modal-cancelar');

    btnAceptar.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(true);
    });

    if (btnCancelar) {
      btnCancelar.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
    }

    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEsc);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

// ===== FUNCIONES DE VALIDACIÓN =====
export function validateTxtFile(file) {
  console.log('[DASHBOARD] Validando archivo:', file.name);
  
  if (!file.name.toLowerCase().endsWith('.txt')) {
    console.log('[DASHBOARD] Error: Archivo no es .txt');
    return {
      valid: false,
      error: 'Archivo no válido, solo debe subir archivos .txt'
    };
  }
  
  console.log('[DASHBOARD] Archivo .txt válido');
  return { valid: true };
}

// ===== FUNCIÓN PARA CARGAR INFORMACIÓN DEL PROYECTO =====
export async function loadProjectInfo() {

  endEditarProyecto();
  
  try {
    const projectConfig = localStorage.getItem('projectConfig');
    
    if (projectConfig && projectConfig !== 'undefined' && projectConfig !== 'null') {
      try {
        const project = JSON.parse(projectConfig);
        
        // Actualizar elementos del DOM con la información del proyecto
        document.getElementById('proyectoNombre').value = project.nombre || '-';
        document.getElementById('proyectoEmpresa').value = project.empresa || '-';
        document.getElementById('proyectoTipoMuerto').value = project.tipo_muerto || '-';
        document.getElementById('proyectoVelViento').value = project.vel_viento || '-';
        document.getElementById('proyectoTempPromedio').value = project.temp_promedio || '-';
        document.getElementById('proyectoPresionAtm').value = project.presion_atmo || '-';

        if (project.texto_entrada != null && project.texto_entrada !== undefined) {
            console.log('[FRONTEND] Cargando paneles guardados...');
            const murosCompletos = await fetchMurosFromDatabase();
    
            if (murosCompletos.length > 0) {
            globalVars.panelesActuales = murosCompletos;
            console.log('[DASHBOARD] Muros completos obtenidos desde BD:', globalVars.panelesActuales.length);
            console.log('[DASHBOARD] Primer muro con overall_height:', globalVars.panelesActuales[0]);
            } else {
            // Fallback: usar los paneles del response de importación
            globalVars.panelesActuales = json.paneles;
            console.log('[DASHBOARD] Usando paneles del import response:', globalVars.panelesActuales.length);
            }
            // Obtener elementos de UI necesarios
            const tablaPaneles = document.getElementById('tablaPaneles');
            const tablaAccordion = document.getElementById('tablaAccordion');
            const panelesInfo = document.getElementById('panelesInfo');
            const btnCalcular = document.getElementById('btnCalcular');
            
            const uiElements = { tablaPaneles, tablaAccordion, panelesInfo, btnCalcular };
            const callbacks = { openSection: (id) => {} }; // Función dummy para openSection
            
            // Actualizar tabla de paneles usando la función global
            if (typeof updatePanelesDisplay === 'function') {
                updatePanelesDisplay(globalVars.panelesActuales, uiElements, callbacks);
            }
            console.log('[FRONTEND] Paneles restaurados en la UI');
            if (globalVars.panelesActuales.length > 0 && globalVars.panelesActuales[0].x_braces != 0) {
                let tablaCalculada = [];
                globalVars.panelesActuales.forEach(muro => {
                    tablaCalculada.push({
                        pid: muro.pid,
                        id_muro: muro.id_muro,
                        angulo_brace: parseFloat(muro.angulo_brace),
                        npt: parseFloat(muro.npt),
                        factor_w2: parseFloat(muro.factor_w2),
                        tipo_brace_seleccionado: muro.tipo_brace_seleccionado,
                        altura_z_m: parseFloat(muro.overall_height),
                        presion_kPa: parseFloat(muro.presion_kpa),
                        fuerza_kN: parseFloat(muro.fuerza_viento),
                        area_m2: parseFloat(muro.area),
                        peso_ton: parseFloat(muro.peso),
                        YCG: muro.overall_height / 2, //no se tiene en la bd
                        Vd_kmh: 0,
                        qz_kPa: parseFloat(muro.qz_kpa),
                        presion_kPa: parseFloat(muro.presion_kpa),
                        eje: muro.eje,
                        advertencias: []
                    });
                });
                console.log('[FRONTEND] Mostrando resultados de viento desde datos guardados...');
                console.log(tablaCalculada);
                await mostrarResultadosViento(tablaCalculada);
                console.log('[FRONTEND] Resultados de viento mostrados desde datos guardados');
            }
        }
        
        console.log('[FRONTEND] Información del proyecto cargada:', project);
      } catch (parseError) {
        console.error('[FRONTEND] Error al parsear JSON del proyecto:', parseError);
        localStorage.removeItem('projectConfig'); // Limpiar datos corruptos
        console.log('[FRONTEND] Datos corruptos eliminados del localStorage');
      }
    } else {
      console.log('[FRONTEND] No hay información de proyecto guardada');
    }
  } catch (error) {
    console.error('[FRONTEND] Error al cargar información del proyecto:', error);
  }
}

export function editarProyecto(elements) {
  
  const { btnEditProject, btnUpdateProject, btnCancelUpdateProject } = elements;

  btnEditProject.style.display = 'none';
  btnUpdateProject.style.display = '';
  btnCancelUpdateProject.style.display = '';

  document.getElementById('proyectoEmpresa').disabled = false;
  document.getElementById('proyectoTipoMuerto').disabled = false;
  document.getElementById('proyectoVelViento').disabled = false;
  document.getElementById('proyectoTempPromedio').disabled = false;
  document.getElementById('proyectoPresionAtm').disabled = false;

  document.getElementById('proyectoEmpresa').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoTipoMuerto').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoVelViento').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoTempPromedio').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoPresionAtm').classList.replace('project-value-dim', 'project-value');
}

export async function guardarCambiosProyecto() {

  const form = document.getElementById('formProyecto');

  if (!form || !form.reportValidity()) {
    console.log('[FRONTEND] Formulario inválido');
    return;
  }

  const formData = new FormData(form);

  try {
      const projectConfig = localStorage.getItem('projectConfig');
      const updatedProject = {
          pid: projectConfig ? JSON.parse(projectConfig).pid : null,
          pk_usuario: projectConfig ? JSON.parse(projectConfig).pk_usuario : null,
          nombre: document.getElementById('proyectoNombre').value,
          empresa: document.getElementById('proyectoEmpresa').value,
          tipo_muerto: document.getElementById('proyectoTipoMuerto').value,
          vel_viento: parseFloat(document.getElementById('proyectoVelViento').value),
          temp_promedio: parseFloat(document.getElementById('proyectoTempPromedio').value),
          presion_atmo: parseFloat(document.getElementById('proyectoPresionAtm').value)
      };

      await fetch(`${API_BASE}/api/proyecto/actualizar`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedProject)
      })
      .then(res => res.json())
      .then(data => {
          console.log("[FRONTEND] Full response:", data.newest_project);
          // Guardar los datos en localStorage para uso posterior
          localStorage.setItem('projectConfig', JSON.stringify(data.newest_project));
      })

  } catch (error) {
      console.error('[FRONTEND] Error al guardar cambios del proyecto:', error);
      alert('Error al guardar los cambios del proyecto. Por favor, inténtelo de nuevo.');
      return;
  }

  endEditarProyecto();
}

function endEditarProyecto() {

  btnEditProject.style.display = '';
  btnUpdateProject.style.display = 'none';
  btnCancelUpdateProject.style.display = 'none';

  document.getElementById('proyectoEmpresa').disabled = true;
  document.getElementById('proyectoTipoMuerto').disabled = true;
  document.getElementById('proyectoVelViento').disabled = true;
  document.getElementById('proyectoTempPromedio').disabled = true;
  document.getElementById('proyectoPresionAtm').disabled = true;

  document.getElementById('proyectoEmpresa').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoTipoMuerto').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoVelViento').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoTempPromedio').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoPresionAtm').classList.replace('project-value', 'project-value-dim');
}

// ===== FUNCIONES DE UI =====
export function updatePanelesDisplay(panelesActuales, elements, callbacks) {
  const { tablaPaneles, tablaAccordion, panelesInfo, btnCalcular } = elements;
  const { openSection } = callbacks;
  
  if (panelesActuales.length > 0) {
    // Mostrar tabla en el sub-acordeón con Overall Height
    let html = "<table><thead><tr><th>#</th><th>ID Muro</th><th>Grosor</th><th>Área</th><th>Peso</th><th>Volumen</th><th>Overall Height</th></tr></thead><tbody>";
    panelesActuales.forEach((p, i) => {
      html += `<tr>
        <td>${p.num}</td>
        <td>${p.id_muro}</td>
        <td>${p.grosor ?? ''}</td>
        <td>${p.area ?? ''}</td>
        <td>${p.peso ?? ''}</td>
        <td>${p.volumen ?? ''}</td>
        <td>${p.overall_height || 'N/A'}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    tablaPaneles.innerHTML = html;
    
    // Mostrar el sub-acordeón y expandirlo automáticamente
    tablaAccordion.style.display = '';
    tablaAccordion.classList.add('active');
    
    // Actualizar info en la sección de resultados
    panelesInfo.innerHTML = `
      <div class="success-message">
        <p><strong>EXITO: ${panelesActuales.length} paneles importados exitosamente</strong></p>
        <p class="muted">Los paneles están listos para ser calculados.</p>
      </div>
    `;
    
    // Mostrar botón calcular y abrir sección de resultados (si existe)
    if (btnCalcular) {
      btnCalcular.style.display = '';
    }
    openSection('results-section');
  } else if (tablaPaneles.innerHTML !== '') {
    tablaAccordion.style.display = '';
    tablaAccordion.classList.add('active');
  } else {
    // Ocultar sub-acordeón
    tablaAccordion.style.display = 'none';
    tablaAccordion.classList.remove('active');
    tablaPaneles.innerHTML = '';
    panelesInfo.innerHTML = '<p class="muted">Los paneles importados aparecerán aquí después de subir un archivo TXT.</p>';
    if (btnCalcular) {
      btnCalcular.style.display = 'none';
    }
  }
}

export function handleFileValidation(file, elements) {
  const { tablaPaneles, btnUploadTxt, btnClearTxt } = elements;
  
  if (file) {
    console.log('[DASHBOARD] Archivo:', file.name, 'Tamaño:', file.size, 'bytes');
    
    // Mostrar botón cancelar
    btnClearTxt.style.display = '';
    
    // Validar que el archivo sea .txt
    if (!file.name.toLowerCase().endsWith('.txt')) {
      console.log('[DASHBOARD] Error: Archivo no es .txt');
      tablaPaneles.innerHTML = '<p class="error">Archivo no válido, solo debe subir archivos .txt</p>';
      btnUploadTxt.disabled = true;
      btnUploadTxt.style.opacity = '0.5';
      return false;
    } else {
      console.log('[DASHBOARD] Archivo .txt válido');
      tablaPaneles.innerHTML = '';
      btnUploadTxt.disabled = false;
      btnUploadTxt.style.opacity = '1';
      return true;
    }
  } else {
    console.log('[DASHBOARD] No hay archivo seleccionado');
    tablaPaneles.innerHTML = '';
    btnUploadTxt.disabled = false;
    btnUploadTxt.style.opacity = '1';
    btnClearTxt.style.display = 'none';
    return false;
  }
}

// ===== BOTÓN: SUBIR ARCHIVO TXT =====
// Función para obtener muros desde la base de datos
async function fetchMurosFromDatabase() {
  try {
    const pid_proyecto = JSON.parse(localStorage.getItem('projectConfig')).pid;
    console.log('[DASHBOARD] Obteniendo muros desde la base de datos...');
    const response = await fetch(`${API_BASE}/api/importar-muros/muros?pk_proyecto=${pid_proyecto}`);
    const json = await response.json();
    
    if (json.ok && json.muros) {
      console.log('[DASHBOARD] Muros obtenidos desde BD:', json.muros.length);
      return json.muros;
    } else {
      console.log('[DASHBOARD] Error obteniendo muros:', json.error || 'Error desconocido');
      return [];
    }
  } catch (error) {
    console.error('[DASHBOARD] Error en fetchMurosFromDatabase:', error);
    return [];
  }
}

export async function handleUploadTxt(file, elements, callbacks, globalVars) {
  console.log('[DASHBOARD] Preparando subida de archivo:', file.name);
  const { tablaPaneles, resultadosCalculo, btnCalcular, btnInforme } = elements;
  const { updatePanelesDisplay } = callbacks;

  // Verificar que exista un proyecto
  const projectConfig = localStorage.getItem('projectConfig');
  if (!projectConfig) {
    alert('❌ Error: No hay proyecto seleccionado.\n\n📋 Por favor, primero completa la información del proyecto en la parte superior.');
    return;
  }
  
  const pid_proyecto = JSON.parse(projectConfig).pid;
  if (!pid_proyecto) {
    alert('❌ Error: El proyecto no tiene un ID válido.\n\n📋 Por favor, recarga la página e intenta nuevamente.');
    return;
  }
  
  console.log('[DASHBOARD] Usando proyecto:', pid_proyecto);
  
  const formData = new FormData();
  formData.append('pk_proyecto', pid_proyecto);
  formData.append('file', file);

  tablaPaneles.innerHTML = 'Procesando...';
  if (resultadosCalculo) {
    resultadosCalculo.innerHTML = '<p class="muted">Los resultados de cálculo aparecerán aquí después de procesar los paneles.</p>';
  }
  if (btnCalcular) {
    btnCalcular.style.display = 'none';
  }
  if (btnInforme) {
    btnInforme.style.display = 'none';
  }
  console.log('[DASHBOARD] UI actualizada, enviando petición al servidor');

  try {
    console.log('[DASHBOARD] Enviando petición POST a /api/importar-muros');
    const resp = await fetch(`${API_BASE}/api/importar-muros`, {
      method: 'POST',
      body: formData
    });
    console.log('[DASHBOARD] Respuesta recibida:', resp.status, resp.statusText);
    const json = await resp.json();
    console.log('[DASHBOARD] JSON parseado:', json);
    
    if (!resp.ok || !json.ok) {
      console.log('[DASHBOARD] Error en la respuesta:', json.error);
      tablaPaneles.innerHTML = `<p class="error">${json.error || 'Error procesando el TXT.'}</p>`;
      updatePanelesDisplay();
      return;
    }
    
    console.log('[DASHBOARD] Archivo procesado exitosamente');

    console.log('[DASHBOARD] Guardando txt en la base de datos...');
    const saveResp = await fetch(`${API_BASE}/api/proyecto/guardar-txt`, {
        method: 'POST',
        body: formData
    });
    const saveJson = await saveResp.json();
    if (!saveResp.ok || !saveJson.ok) {
        console.log('[DASHBOARD] Error guardando TXT en BD:', saveJson.error);
        tablaPaneles.innerHTML = `<p class="error">${saveJson.error || 'Error guardando el TXT en la base de datos.'}</p>`;
        updatePanelesDisplay();
        return;
    }
    console.log('[DASHBOARD] TXT guardado en la base de datos exitosamente');
    
    // Obtener los muros completos desde la base de datos (incluyendo overall_height)
    console.log('[DASHBOARD] Obteniendo muros completos desde la base de datos...');
    const murosCompletos = await fetchMurosFromDatabase();
    
    if (murosCompletos.length > 0) {
      globalVars.panelesActuales = murosCompletos;
      console.log('[DASHBOARD] Muros completos obtenidos desde BD:', globalVars.panelesActuales.length);
      console.log('[DASHBOARD] Primer muro con overall_height:', globalVars.panelesActuales[0]);
    } else {
      // Fallback: usar los paneles del response de importación
      globalVars.panelesActuales = json.paneles;
      console.log('[DASHBOARD] Usando paneles del import response:', globalVars.panelesActuales.length);
    }
    
    // Mostrar sección de eliminación de muros en lugar de proceder directamente
    console.log('[DASHBOARD] Mostrando sección de eliminación de muros...');
    mostrarSeccionEliminacion(globalVars.panelesActuales);
    
    // Almacenar referencia global para las funciones de eliminación
    window.globalVars = globalVars;
    
  } catch (err) {
    console.log('[DASHBOARD] Error de conexión:', err.message);
    tablaPaneles.innerHTML = `<p class="error">Error procesando el TXT: ${err.message}</p>`;
  }
}

// ===== BOTÓN: CANCELAR SELECCIÓN =====
export async function handleCancelTxt(elements, globalVars) {
  console.log('[DASHBOARD] Botón cancelar clickeado');
  const { 
    txtInput, tablaAccordion, tablaPaneles, resultadosCalculo, 
    btnCalcular, btnInforme, btnClearTxt, panelesInfo 
  } = elements;
  
  try {
    await fetch(`${API_BASE}/api/cancelar-import`, { method: 'DELETE' });
    console.log('[DASHBOARD] Cancelación exitosa');
    
    // Limpiar elementos de la UI
    if (txtInput) txtInput.value = '';
    if (tablaAccordion) {
      tablaAccordion.style.display = 'none';
      tablaAccordion.classList.remove('active');
    }
    if (tablaPaneles) tablaPaneles.innerHTML = '';
    if (resultadosCalculo) {
      resultadosCalculo.innerHTML = '<p class="muted">Los resultados de cálculo aparecerán aquí después de procesar los paneles.</p>';
    }
    if (btnCalcular) btnCalcular.style.display = 'none';
    if (btnInforme) btnInforme.style.display = 'none';
    if (btnClearTxt) btnClearTxt.style.display = 'none';
    if (panelesInfo) {
      panelesInfo.innerHTML = '<p class="muted">Los paneles importados aparecerán aquí después de subir un archivo TXT.</p>';
    }
    
    // Limpiar variables globales
    globalVars.panelesActuales = [];
    globalVars.resultadosActuales = [];
    
    console.log('[DASHBOARD] UI limpiada exitosamente');
  } catch (err) {
    console.log('[DASHBOARD] Error en cancelación:', err.message);
    tablaPaneles.innerHTML = `<p class="error">Error eliminando el TXT: ${err.message}</p>`;
  }
}

// ===== BOTÓN: CALCULAR PANELES =====
export async function handleCalcularPaneles(elements, callbacks, globalVars) {
  console.log('[DASHBOARD] Botón calcular clickeado');
  const { resultadosCalculo, btnInforme } = elements;
  const { openSection } = callbacks;
  
  if (!globalVars.panelesActuales.length) {
    console.log('[DASHBOARD] No hay paneles para calcular');
    return;
  }
  
  console.log('[DASHBOARD] Iniciando cálculos para', globalVars.panelesActuales.length, 'paneles');
  resultadosCalculo.innerHTML = 'Calculando...';
  
  // Abrir sección de cálculos
  openSection('calculations-section');
  
  try {
    // Transformar datos para la nueva API
    const rows = globalVars.panelesActuales.map(p => ({
      idMuro: p.id_muro,
      grosor_mm: p.grosor * 1000, // convertir metros a milímetros
      area_m2: p.area
    }));
    console.log('[DASHBOARD] Datos transformados para API:', rows);
    
    // Obtener parámetros del proyecto desde localStorage
    let parametros = null;
    const projectConfig = localStorage.getItem('projectConfig');
    if (projectConfig) {
      try {
        const projectInfo = JSON.parse(projectConfig);
        parametros = {
          vel_viento: projectInfo.vel_viento,
          temp_promedio: projectInfo.temp_promedio,
          presion_atmo: projectInfo.presion_atmo,
          tipo_muerto: projectInfo.tipo_muerto
        };
        console.log('[DASHBOARD] Parámetros del proyecto obtenidos:', parametros);
      } catch (e) {
        console.warn('[DASHBOARD] Error al parsear projectConfig:', e);
      }
    }
    
    console.log('[DASHBOARD] Enviando petición POST a /api/paneles/calcular');
    const resp = await fetch(`${API_BASE}/api/paneles/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, parametros })
    });
    console.log('[DASHBOARD] Respuesta de cálculo recibida:', resp.status);
    const json = await resp.json();
    console.log('[DASHBOARD] Resultados de cálculo:', json);
    
    if (!resp.ok || !json.ok) {
      console.log('[DASHBOARD] Error en cálculo:', json.error);
      resultadosCalculo.innerHTML = `<p class="error">${json.error || 'Error en cálculo.'}</p>`;
      if (btnInforme) {
        btnInforme.style.display = 'none';
      }
      return;
    }
    
    console.log('[DASHBOARD] Cálculos completados exitosamente');
    globalVars.resultadosActuales = json.data;
    console.log('[DASHBOARD] Resultados obtenidos:', globalVars.resultadosActuales.length);
    
    // Renderizar resultados
    let html = "<h3>Resultados de cálculo</h3>";
    html += "<div class='kpis'>";
    globalVars.resultadosActuales.forEach((res, i) => {
      // Buscar el número original del panel basado en el ID del muro
      const panelOriginal = globalVars.panelesActuales.find(p => p.id_muro === res.idMuro);
      const numeroPanel = panelOriginal ? panelOriginal.num : i + 1;
      
      html += `<div class='kpi'><div class='kpi__label'>Panel #${numeroPanel} (${res.idMuro})</div>
        <div class='kpi__val'>Volumen: ${res.volumen_m3} m³</div>
        <div class='kpi__val'>Peso: ${res.peso_kN} kN</div>
        <div class='kpi__val'>Grúa mín: ${res.gruaMin_kN} kN</div>
        <div class='kpi__val'>Viento: ${res.viento_kN} kN</div>
        <div class='kpi__val'>Tracción puntal: ${res.traccionPuntal_kN} kN</div>
      </div>`;
    });
    html += "</div>";
    resultadosCalculo.innerHTML = html;
    console.log('[DASHBOARD] UI de resultados actualizada');
    
    if (btnInforme) {
      btnInforme.style.display = globalVars.resultadosActuales.length ? '' : 'none';
    }
    console.log('[DASHBOARD] Botón informe mostrado:', globalVars.resultadosActuales.length > 0);
  } catch (err) {
    console.log('[DASHBOARD] Error de conexión en cálculo:', err.message);
    resultadosCalculo.innerHTML = `<p class="error">Error de conexión: ${err.message}</p>`;
    if (btnInforme) {
      btnInforme.style.display = 'none';
    }
  }
}

// ===== BOTÓN: GENERAR PDF =====
export async function handleGenerarPDF(elements, globalVars) {
  console.log('[DASHBOARD] Botón generar informe clickeado');
  const { btnInforme } = elements;
  
  // Declarar la variable en el scope de la función para que esté disponible en todo el proceso
  let murosConBraces = [];
  
  // Verificar si hay resultados de viento (ya no usamos paneles)
  if (!globalVars.resultadosTomoIII || globalVars.resultadosTomoIII.length === 0) {
    alert('No hay resultados de cálculos. Por favor calcula las cargas de viento primero.');
    console.log('[DASHBOARD] No hay resultados de viento para generar informe');
    return;
  }

  // Guardar automáticamente todos los cambios antes de generar el PDF
  console.log('[DASHBOARD] Guardando todos los cambios antes de generar PDF...');
  try {
    // Ejecutar el botón de guardar si existe (simular click)
    const btnGuardarTop = document.getElementById('btnGuardarTodosBracesTop');
    const btnGuardarBottom = document.getElementById('btnGuardarTodosBraces');
    
    if (btnGuardarTop && btnGuardarTop.onclick) {
      console.log('[DASHBOARD] Ejecutando guardar cambios automáticamente...');
      await btnGuardarTop.onclick();
      console.log('[DASHBOARD] Cambios guardados exitosamente');
    } else if (btnGuardarBottom && btnGuardarBottom.onclick) {
      console.log('[DASHBOARD] Ejecutando guardar cambios automáticamente (botón inferior)...');
      await btnGuardarBottom.onclick();
      console.log('[DASHBOARD] Cambios guardados exitosamente');
    } else {
      console.log('[DASHBOARD] No se encontró botón de guardar, intentando función directa...');
      // Intentar llamar la función directamente desde el scope global
      if (window.guardarTodosBraces && typeof window.guardarTodosBraces === 'function') {
        await window.guardarTodosBraces();
        console.log('[DASHBOARD] Cambios guardados con función global');
      }
    }
    
    // Pausa para asegurar que los cambios se han procesado en la BD
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // RECARGAR los datos desde la base de datos para asegurar que tenemos la información más reciente
    console.log('[DASHBOARD] Recargando datos actualizados desde la base de datos...');
    
    try {
      // Obtener el proyecto actual
      const projectConfig = localStorage.getItem('projectConfig');
      if (!projectConfig) {
        alert('No hay proyecto seleccionado');
        return;
      }
      
      const project = JSON.parse(projectConfig);
      console.log('[DASHBOARD] Proyecto actual:', project);
      
      // Usar project.pid si existe, o project.id como fallback
      const pid = project.pid || project.id;
      console.log('[DASHBOARD] PID para cargar muros:', pid);
      
      if (!pid) {
        throw new Error('No se encontró ID del proyecto en la configuración');
      }
      
      // Recargar datos de muros desde la BD
      const response = await fetch(`${API_BASE}/api/importar-muros/muros?pk_proyecto=${pid}`);
      if (!response.ok) {
        throw new Error('Error al recargar datos de muros');
      }
      
      const responseData = await response.json();
      const murosActualizados = responseData.muros || responseData;
      console.log('[DASHBOARD] Datos recargados desde BD:', murosActualizados.length, 'muros');
      console.log('[DASHBOARD] Primer muro de BD (debug):', murosActualizados[0]); // DEBUG
      
      // Usar los datos recargados en lugar de los de la interfaz
      murosConBraces = murosActualizados.map(muro => {
        // Buscar el muro original en resultadosTomoIII para obtener datos de viento
        const muroViento = globalVars.resultadosTomoIII.find(m => m.pid === muro.pid);
        
        if (muroViento) {
          const muroCompleto = {
            ...muroViento, // Datos de viento
            ...muro,       // Datos actualizados de la BD (braces, ejes, grosor, overall_height, etc.)
            // Asegurar que los campos de braces estén presentes
            angulo_brace: muro.angulo || 55,
            npt: muro.npt || 0.350,
            tipo_brace_seleccionado: muro.tipo_brace,
            x_braces: muro.x_braces || 2,
            eje: muro.eje || '',
            // Valores del TXT (IMPORTANTE para macizos)
            grosor: muro.grosor || 0,        // Ancho del muro (del TXT)
            overall_height: muro.overall_height || 0,  // Alto del muro (del TXT)
            // Valores calculados (si existen en la BD)
            fbx: muro.fbx || 0,
            fby: muro.fby || 0,
            fb: muro.fb || 0,
            x_inserto: muro.x_inserto || 0,
            y_inserto: muro.y_inserto || 0,
            cant_b14: muro.cant_b14 || 0,
            cant_b12: muro.cant_b12 || 0,
            cant_b04: muro.cant_b04 || 0,
            cant_b15: muro.cant_b15 || 0
          };
          console.log(`[DASHBOARD] Muro ${muro.id_muro} completo (debug):`, muroCompleto); // DEBUG
          return muroCompleto;
        }
        return null;
      }).filter(Boolean);
      
      console.log('[DASHBOARD] Muros con datos combinados (BD + viento):', murosConBraces.length);
      
    } catch (reloadError) {
      console.error('[DASHBOARD] Error al recargar datos desde BD:', reloadError);
      // Fallback: usar datos de la interfaz como antes
      console.log('[DASHBOARD] Usando datos de interfaz como fallback...');
      murosConBraces = []; // Resetear la variable
      
      const filas = document.querySelectorAll('tr[data-pid]');
      console.log('[DASHBOARD] Procesando', filas.length, 'filas de la interfaz como fallback');
      
      filas.forEach(row => {
        const pid = row.dataset.pid;
        
        // Datos de viento (read-only)
        const nombreMuro = row.querySelector('td:first-child').textContent.trim();
        
        // Datos editables de braces
        const angulo = parseFloat(row.querySelector('[data-field="angulo_brace"]')?.value) || 55;
        const npt = parseFloat(row.querySelector('[data-field="npt"]')?.value) || 0.350;
        const tipoBraceInput = row.querySelector('[data-field="tipo_brace_seleccionado"]')?.value;
        const tipoBrace = tipoBraceInput && tipoBraceInput !== '' ? tipoBraceInput : undefined;
        const xBraces = parseInt(row.querySelector('[data-field="x_braces"]')?.value) || 2;
        
        // Valores calculados
        const fbx = parseFloat(row.querySelector(`.valor-fbx[data-pid="${pid}"]`)?.textContent) || 0;
        const fby = parseFloat(row.querySelector(`.valor-fby[data-pid="${pid}"]`)?.textContent) || 0;
        const fb = parseFloat(row.querySelector(`.valor-fb[data-pid="${pid}"]`)?.textContent) || 0;
        const xInserto = parseFloat(row.querySelector(`.valor-x-inserto[data-pid="${pid}"]`)?.textContent) || 0;
        const yInserto = parseFloat(row.querySelector(`.valor-y-inserto[data-pid="${pid}"]`)?.textContent) || 0;
        
        // Cantidades de braces
        const cantB14 = parseInt(row.querySelector(`.cant-b14[data-pid="${pid}"]`)?.textContent) || 0;
        const cantB12 = parseInt(row.querySelector(`.cant-b12[data-pid="${pid}"]`)?.textContent) || 0;
        const cantB04 = parseInt(row.querySelector(`.cant-b04[data-pid="${pid}"]`)?.textContent) || 0;
        const cantB15 = parseInt(row.querySelector(`.cant-b15[data-pid="${pid}"]`)?.textContent) || 0;
        
        // Buscar el muro original en resultadosTomoIII para obtener datos de viento
        const muroOriginal = globalVars.resultadosTomoIII.find(m => m.pid === parseInt(pid));
        
        if (muroOriginal) {
          murosConBraces.push({
            ...muroOriginal,
            angulo_brace: angulo,
            npt: npt,
            tipo_brace_seleccionado: tipoBrace,
            x_braces: xBraces,
            fbx: fbx,
            fby: fby,
            fb: fb,
            x_inserto: xInserto,
            y_inserto: yInserto,
            cant_b14: cantB14,
            cant_b12: cantB12,
            cant_b04: cantB04,
            cant_b15: cantB15
          });
        }
      });
      
      console.log('[DASHBOARD] Fallback completado:', murosConBraces.length, 'muros procesados desde la interfaz');
    }
    
  } catch (error) {
    console.error('[DASHBOARD] Error al guardar cambios automáticamente:', error);
    
    // Asegurar que murosConBraces esté inicializada en caso de error
    if (!murosConBraces || !Array.isArray(murosConBraces)) {
      console.log('[DASHBOARD] Inicializando murosConBraces como array vacío debido al error');
      murosConBraces = [];
    }
    
    const continuar = confirm('Hubo un problema al guardar los cambios automáticamente. ¿Deseas continuar con la generación del PDF?');
    if (!continuar) {
      return;
    }
  }
  
  console.log('[DASHBOARD] Datos recopilados:', murosConBraces ? murosConBraces.length : 'undefined', 'muros con datos actualizados');
  
  // Verificar que murosConBraces esté definido antes de generar tabla de muertos
  if (!murosConBraces || !Array.isArray(murosConBraces)) {
    console.error('[DASHBOARD] murosConBraces no está definido o no es un array:', murosConBraces);
    alert('Error: No se pudieron cargar los datos de muros. Verifica que el proyecto esté cargado correctamente.');
    return;
  }
  
  if (murosConBraces.length === 0) {
    console.error('[DASHBOARD] murosConBraces está vacío - no hay datos para generar la tabla de muertos');
    alert('Error: No hay datos de muros para generar el PDF. Asegúrate de que el proyecto tenga muros cargados.');
    return;
  }
  
  // Generar tabla de muertos desde los datos actualizados
  let tablaMuertos = [];
  console.log('[DASHBOARD] Generando tabla de muertos desde datos actualizados...');
  
  // Agrupar muros por combinación de x_braces, angulo_brace y eje
  const gruposMuertos = {};
  
  murosConBraces.forEach(muro => {
    // Obtener valores actualizados
    const xBraces = muro.x_braces || 2;
    const angulo = Math.round(muro.angulo_brace || 55); // Redondear para agrupar
    const eje = muro.eje || 1;
    
    // Crear clave única para agrupar
    const clave = `${xBraces}_${angulo}_${eje}`;
    
    if (!gruposMuertos[clave]) {
      gruposMuertos[clave] = {
        x_braces: xBraces,
        angulo: angulo,
        eje: eje,
        muros: []
      };
    }
    
    gruposMuertos[clave].muros.push(muro);
  });
  
  // Convertir grupos a formato de tabla de muertos
  let numeroMuerto = 1;
  Object.keys(gruposMuertos).forEach(clave => {
    const grupo = gruposMuertos[clave];
    
    // Determinar tipo de construcción basado en cantidad de braces
    let tipoConstruccion = 'Estándar';
    if (grupo.x_braces >= 3) {
      tipoConstruccion = 'Reforzado';
    }
    
    // Crear lista de muros incluidos
    const murosIncluidos = grupo.muros.map(m => m.id_muro).join(', ');
    
    tablaMuertos.push({
      numero: numeroMuerto.toString(),
      muerto: `M${numeroMuerto}`,
      x_braces: grupo.x_braces.toString(),
      angulo: `${grupo.angulo}°`,
      eje: grupo.eje.toString(),
      profundidad: '2.0',
      tipo_construccion: tipoConstruccion,
      cantidad_muros: grupo.muros.length.toString(),
      muros_incluidos: murosIncluidos
    });
    
    numeroMuerto++;
  });
  
  console.log('[DASHBOARD] Tabla de muertos generada desde datos actualizados:', tablaMuertos.length, 'grupos');
  
  // Exponer gruposMuertos globalmente para que pueda usarse en calcular macizos de anclaje
  window.gruposMuertosGlobal = gruposMuertos;
  console.log('[DASHBOARD] gruposMuertos expuesto globalmente para macizos de anclaje');
  console.log('[DASHBOARD] Claves de grupos generados:', Object.keys(gruposMuertos));
  console.log('[DASHBOARD] Objeto gruposMuertos completo:', JSON.stringify(gruposMuertos, null, 2));
  
  // ===== Mostrar configuración de grupos después de generar PDF =====
  mostrarConfigGrupos(gruposMuertos);
  console.log('[DASHBOARD] Formulario de configuración de grupos mostrado');
  
  // NOTA: window.lastGruposMuertos se eliminó porque los cálculos cilíndricos
  // deben ser completamente independientes y NO usar la agrupación de braces
  
  // Habilitar acordeón después de agrupar muros
  if (window.enableAccordionAfterGrouping && typeof window.enableAccordionAfterGrouping === 'function') {
    window.enableAccordionAfterGrouping();
  }
  
  // Obtener información del proyecto desde localStorage
  const projectConfig = localStorage.getItem('projectConfig');
  let projectInfo = null;
  
  if (projectConfig) {
    try {
      projectInfo = JSON.parse(projectConfig);
      console.log('[DASHBOARD] Información del proyecto obtenida:', projectInfo);
    } catch (error) {
      console.log('[DASHBOARD] Error parseando información del proyecto:', error);
    }
  }
  
  console.log('[DASHBOARD] Generando PDF para', murosConBraces.length, 'muros con viento y braces');
  
  // Mostrar indicador de progreso
  const progressIndicator = document.createElement('div');
  progressIndicator.id = 'pdf-progress';
  progressIndicator.style.cssText = `
    position: fixed; 
    top: 20px; 
    right: 20px; 
    background: #007acc; 
    color: white; 
    padding: 15px 20px; 
    border-radius: 8px; 
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    max-width: 300px;
  `;
  progressIndicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 20px; height: 20px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <div>
        <div style="font-weight: bold;">Generando PDF...</div>
        <div style="font-size: 12px; opacity: 0.9;">Los cambios se han guardado automáticamente</div>
      </div>
    </div>
  `;
  
  // Agregar animación CSS
  if (!document.querySelector('#spin-animation')) {
    const style = document.createElement('style');
    style.id = 'spin-animation';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(progressIndicator);
  btnInforme.disabled = true;
  
  try {
    console.log('[DASHBOARD] Enviando petición POST a /api/paneles/pdf');
    console.log('[DASHBOARD] Payload:', { 
      paneles: murosConBraces,
      projectInfo: projectInfo,
      tablaMuertos: tablaMuertos
    });
    const resp = await fetch(`${API_BASE}/api/paneles/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paneles: murosConBraces,  // Datos completos de la tabla unificada
        projectInfo: projectInfo,
        tablaMuertos: tablaMuertos // Nueva: tabla de resumen por muertos
      })
    });
    console.log('[DASHBOARD] Respuesta de PDF recibida:', resp.status);
    
    if (!resp.ok) {
      console.log('[DASHBOARD] Error generando PDF');
      alert('Error generando el informe.');
      return;
    }
    
    console.log('[DASHBOARD] PDF generado exitosamente, iniciando descarga');
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'informe_muros_viento_braces.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    console.log('[DASHBOARD] Descarga de PDF completada');
  } catch (err) {
    console.log('[DASHBOARD] Error generando PDF:', err.message);
    alert('Error generando el informe: ' + err.message);
  } finally {
    // Limpiar indicador de progreso
    const progressIndicator = document.getElementById('pdf-progress');
    if (progressIndicator) {
      progressIndicator.remove();
    }
    
    btnInforme.disabled = false;
    console.log('[DASHBOARD] Botón PDF rehabilitado');
  }
}

// Función para recalcular automáticamente todos los tipos de brace
// NOTA: Esta función ya no se usa porque el sistema es automático
// Se mantiene comentada por si se necesita en el futuro
/*
async function recalcularTiposBracesMasivo() {
  try {
    const projectConfig = localStorage.getItem('projectConfig');
    if (!projectConfig) {
      alert('No hay proyecto seleccionado');
      return;
    }

    const proyecto = JSON.parse(projectConfig);
    console.log('[DASHBOARD] Recalculando tipos de brace para proyecto:', proyecto.pid);

    const confirmacion = confirm(
      '¿Deseas recalcular automáticamente el tipo de brace para TODOS los muros?\n\n' +
      'Esto aplicará las fórmulas automáticas basadas en:\n' +
      '• (ALTO - NPT) × FACTOR_W2\n' +
      '• Comparación con umbrales por longitud de brace\n\n' +
      'Solo se actualizarán muros SIN tipo manual especificado.'
    );

    if (!confirmacion) return;

    const response = await fetch(`${API_BASE}/api/calculos/proyectos/${proyecto.pid}/recalcular-tipos-braces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      alert(
        `✅ ${result.mensaje}\n\n` +
        `📊 Resumen:\n` +
        `• Total muros: ${result.resumen.total_muros}\n` +
        `• Muros actualizados: ${result.resumen.muros_actualizados}\n` +
        `• Distribución: ${JSON.stringify(result.resumen.distribucion, null, 2)}`
      );
      
      // Recargar la tabla de braces
      location.reload();
    } else {
      alert('Error: ' + (result.error || 'Error desconocido'));
    }

  } catch (error) {
    console.error('[DASHBOARD] Error recalculando tipos de brace:', error);
    alert('Error ejecutando recálculo masivo: ' + error.message);
  }
}
*/

/**
 * Recalcular automáticamente tipos de braces si es necesario
 */
async function autoRecalcularTiposBraces() {
  try {
    console.log('[DASHBOARD] Verificando si necesita recálculo automático de tipos');
    
    const response = await fetch(`${API_BASE}/api/calculos/auto-recalcular-tipos-braces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success && result.procesados > 0) {
      console.log(`[DASHBOARD] Recálculo automático completado: ${result.procesados} muros actualizados`);
      return true; // Indica que hubo cambios
    } else {
      console.log('[DASHBOARD] No se necesitó recálculo automático');
      return false; // No hubo cambios
    }

  } catch (error) {
    console.error('[DASHBOARD] Error en recálculo automático:', error);
    return false;
  }
}

// ===== FUNCIONES PARA MACIZOS DE ANCLAJE (MUERTOS) =====
// ELIMINADAS - Los cálculos cilíndricos deben ser funcionalidades INDEPENDIENTES
// que reciben datos directamente del TXT sin agrupar por braces.
// NO deben usar window.lastGruposMuertos que agrupa por X, ángulo y eje.
// TODO: Crear nuevas funciones que trabajen con muros sin agrupar

// ===== FUNCIONES PARA ELIMINACIÓN DE MUROS =====

// Variables globales para el proceso de eliminación
let murosOriginales = [];
let rangosEliminacion = [];

// Función para mostrar la sección de eliminación de muros
export function mostrarSeccionEliminacion(muros) {
  console.log('[DASHBOARD] mostrarSeccionEliminacion iniciada');
  murosOriginales = [...muros];
  rangosEliminacion = [];
  
  const accordion = document.getElementById('eliminarMurosAccordion');
  const totalElement = document.getElementById('totalMurosDetectados');
  
  if (accordion && totalElement) {
    accordion.style.display = 'block';
    totalElement.textContent = muros.length;
    
    // Limpiar rangos existentes
    const rangosContainer = document.getElementById('rangosEliminar');
    console.log('[DASHBOARD] Limpiando rangos. Elementos antes:', rangosContainer.children.length);
    rangosContainer.innerHTML = '<p class="muted">No hay rangos definidos. Haz clic en "Agregar Rango" para empezar.</p>';
    console.log('[DASHBOARD] Elementos después de limpiar:', rangosContainer.children.length);
    
    // Limpiar preview
    const preview = document.getElementById('previsualizacionEliminacion');
    preview.style.display = 'none';
    
    console.log('[DASHBOARD] Sección de eliminación mostrada con', muros.length, 'muros');
  }
}

// Función para agregar un nuevo rango de eliminación
export function agregarRangoEliminacion() {
  console.log('[DASHBOARD] agregarRangoEliminacion llamada');
  console.trace('[DASHBOARD] Stack trace de agregarRangoEliminacion');
  
  const rangosContainer = document.getElementById('rangosEliminar');
  
  // Si es el primer rango, limpiar el mensaje inicial
  const existingRangos = rangosContainer.querySelectorAll('.rango-eliminacion-item');
  if (existingRangos.length === 0) {
    rangosContainer.innerHTML = '';
  }
  
  const rangoId = Date.now();
  const rangoDiv = document.createElement('div');
  rangoDiv.className = 'rango-eliminacion-item';
  rangoDiv.setAttribute('data-rango-id', rangoId);
  
  rangoDiv.innerHTML = `
    <div class="rango-inputs">
      <span>Desde muro:</span>
      <input type="number" class="rango-desde-elim" min="1" max="${murosOriginales.length}" placeholder="Ej: 1">
      <span>hasta:</span>
      <input type="number" class="rango-hasta-elim" min="1" max="${murosOriginales.length}" placeholder="Ej: 10">
    </div>
    <div class="rango-info">
      <span class="rango-count">0 muros</span>
    </div>
    <button class="btn-eliminar-rango" onclick="eliminarRango(${rangoId})">🗑️ Quitar</button>
  `;
  
  rangosContainer.appendChild(rangoDiv);
  
  // Agregar event listeners para actualizar el conteo
  const inputDesde = rangoDiv.querySelector('.rango-desde-elim');
  const inputHasta = rangoDiv.querySelector('.rango-hasta-elim');
  
  [inputDesde, inputHasta].forEach(input => {
    input.addEventListener('input', () => actualizarConteoRango(rangoId));
  });
  
  console.log('[DASHBOARD] Nuevo rango agregado:', rangoId, 'Total rangos:', rangosContainer.querySelectorAll('.rango-eliminacion-item').length);
}

// Función para actualizar el conteo de muros en un rango
function actualizarConteoRango(rangoId) {
  const rangoDiv = document.querySelector(`[data-rango-id="${rangoId}"]`);
  if (!rangoDiv) return;
  
  const desde = parseInt(rangoDiv.querySelector('.rango-desde-elim').value) || 0;
  const hasta = parseInt(rangoDiv.querySelector('.rango-hasta-elim').value) || 0;
  const countElement = rangoDiv.querySelector('.rango-count');
  
  if (desde > 0 && hasta > 0 && desde <= hasta && hasta <= murosOriginales.length) {
    const count = hasta - desde + 1;
    countElement.textContent = `${count} muros`;
    countElement.style.color = '#dc3545';
  } else {
    countElement.textContent = 'Rango inválido';
    countElement.style.color = '#6c757d';
  }
}

// Función para eliminar un rango
function eliminarRango(rangoId) {
  const rangoDiv = document.querySelector(`[data-rango-id="${rangoId}"]`);
  if (rangoDiv) {
    rangoDiv.remove();
    rangosEliminacion = rangosEliminacion.filter(r => r.id !== rangoId);
    
    // Si no quedan rangos, mostrar mensaje
    const rangosContainer = document.getElementById('rangosEliminar');
    if (rangosContainer.children.length === 0) {
      rangosContainer.innerHTML = '<p class="muted">No hay rangos definidos. Haz clic en "Agregar Rango" para empezar.</p>';
    }
    
    console.log('[DASHBOARD] Rango eliminado:', rangoId);
  }
}

// Función para previsualizar la eliminación
export function previsualizarEliminacion() {
  console.log('[DASHBOARD] previsualizarEliminacion iniciada');
  const rangosValidos = obtenerRangosEliminacion();
  const murosAEliminar = calcularMurosAEliminar(rangosValidos);
  const murosRestantes = murosOriginales.length - murosAEliminar.length;
  
  const preview = document.getElementById('previsualizacionEliminacion');
  
  let html = `
    <div class="preview-eliminacion">
      <h4>📊 Vista Previa de Eliminación</h4>
      
      <div class="preview-stats">
        <div class="preview-stat">
          <div class="number">${murosOriginales.length}</div>
          <div class="label">Muros originales</div>
        </div>
        <div class="preview-stat">
          <div class="number" style="color: #dc3545;">${murosAEliminar.length}</div>
          <div class="label">A eliminar</div>
        </div>
        <div class="preview-stat">
          <div class="number" style="color: #28a745;">${murosRestantes}</div>
          <div class="label">Resultantes</div>
        </div>
      </div>
  `;
  
  if (murosAEliminar.length > 0) {
    html += `
      <h5>🗑️ Muros que serán eliminados:</h5>
      <div class="muros-eliminados-list">
        ${murosAEliminar.map(muro => `Muro ${muro.id_muro} (#${muro.num})`).join(', ')}
      </div>
    `;
  } else {
    html += `<p class="muted">No hay muros marcados para eliminar.</p>`;
  }
  
  html += `</div>`;
  
  preview.innerHTML = html;
  preview.style.display = 'block';
  
  console.log('[DASHBOARD] Preview generado:', murosAEliminar.length, 'muros a eliminar');
}

// Función auxiliar para obtener rangos válidos (eliminación de muros)
function obtenerRangosEliminacion() {
  // Solo buscar rangos dentro del contenedor de eliminación
  const rangosContainer = document.getElementById('rangosEliminar');
  const rangosDiv = rangosContainer ? rangosContainer.querySelectorAll('.rango-eliminacion-item') : [];
  const rangosValidos = [];
  
  console.log('[DASHBOARD] Elementos .rango-eliminacion-item encontrados en rangosEliminar:', rangosDiv.length);
  
  rangosDiv.forEach((rangoDiv, index) => {
    const desdeInput = rangoDiv.querySelector('.rango-desde-elim');
    const hastaInput = rangoDiv.querySelector('.rango-hasta-elim');
    
    console.log(`[DASHBOARD] Rango ${index + 1}:`, {
      desdeInput: desdeInput?.value,
      hastaInput: hastaInput?.value,
      desdeHasValue: desdeInput?.value !== '',
      hastaHasValue: hastaInput?.value !== ''
    });
    
    if (desdeInput && hastaInput && desdeInput.value !== '' && hastaInput.value !== '') {
      const desde = parseInt(desdeInput.value);
      const hasta = parseInt(hastaInput.value);
      
      if (desde > 0 && hasta > 0 && desde <= hasta && hasta <= murosOriginales.length) {
        rangosValidos.push({ desde, hasta });
        console.log(`[DASHBOARD] Rango válido agregado: ${desde}-${hasta}`);
      } else {
        console.log(`[DASHBOARD] Rango inválido: ${desde}-${hasta}`);
      }
    } else {
      console.log(`[DASHBOARD] Rango ${index + 1} sin valores (inputs vacíos)`);
    }
  });
  
  console.log('[DASHBOARD] Rangos válidos finales:', rangosValidos);
  return rangosValidos;
}

// Función auxiliar para calcular muros a eliminar
function calcularMurosAEliminar(rangos) {
  const murosAEliminar = [];
  
  console.log('[DASHBOARD] Calculando muros a eliminar con rangos:', rangos);
  console.log('[DASHBOARD] Total muros originales:', murosOriginales.length);
  
  rangos.forEach(rango => {
    console.log(`[DASHBOARD] Procesando rango: ${rango.desde} a ${rango.hasta}`);
    for (let numeroMuro = rango.desde; numeroMuro <= rango.hasta; numeroMuro++) {
      // Buscar muro por su número (campo num)
      const muro = murosOriginales.find(m => m.num === numeroMuro);
      if (muro && !murosAEliminar.includes(muro)) {
        murosAEliminar.push(muro);
        console.log(`[DASHBOARD] Muro agregado para eliminar: ${muro.id_muro} (#${muro.num})`);
      } else if (!muro) {
        console.log(`[DASHBOARD] Muro #${numeroMuro} no encontrado`);
      }
    }
  });
  
  console.log('[DASHBOARD] Total muros a eliminar:', murosAEliminar.length);
  return murosAEliminar.sort((a, b) => a.num - b.num);
}

// Función para confirmar la importación con muros filtrados
export async function confirmarImportacionFiltrada() {
  console.log('[DASHBOARD] confirmarImportacionFiltrada - Iniciando proceso');
  console.trace('[DASHBOARD] Stack trace de confirmarImportacionFiltrada');
  
  const rangosValidos = obtenerRangosEliminacion();
  
  // Si no hay rangos definidos, importar todos los muros sin eliminar ninguno
  if (rangosValidos.length === 0) {
    const confirmarSinEliminar = await mostrarModalConfirmacion(
      'Importar sin eliminar',
      '⚠️ No has definido ningún rango de eliminación.\n\n¿Deseas importar TODOS los muros detectados sin eliminar ninguno?',
      { tipo: 'info', textoAceptar: 'Sí, importar todos', textoCancelar: 'Cancelar' }
    );
    
    if (!confirmarSinEliminar) {
      console.log('[DASHBOARD] Usuario canceló importación sin rangos');
      return;
    }
    
    // Importar todos los muros sin eliminar
    console.log('[DASHBOARD] Importando todos los muros sin eliminación');
    finalizarImportacion(murosOriginales);
    
    // Ocultar sección de eliminación
    document.getElementById('eliminarMurosAccordion').style.display = 'none';
    
    await mostrarModalConfirmacion(
      'Mensaje',
      `✅ Importación exitosa!\n\n• Muros importados: ${murosOriginales.length}`,
      { tipo: 'success', mostrarCancelar: false }
    );
    
    return;
  }
  
  const murosAEliminar = calcularMurosAEliminar(rangosValidos);
  const murosRestantes = murosOriginales.filter(muro => 
    !murosAEliminar.some(muroElim => muroElim.pid === muro.pid)
  );
  
  if (murosRestantes.length === 0) {
    await mostrarModalConfirmacion(
      'Error',
      '❌ No puedes eliminar todos los muros. Debe quedar al menos uno.',
      { tipo: 'warning', mostrarCancelar: false }
    );
    return;
  }
  
  // PASO 1: Mostrar modal de confirmación (sin eliminar nada todavía)
  const mensaje = `🔍 ¿Estás seguro de que deseas ELIMINAR estos muros de la base de datos?\n\n📊 Resumen:\n• Muros originales: ${murosOriginales.length}\n• Muros a ELIMINAR: ${murosAEliminar.length}\n• Muros resultantes: ${murosRestantes.length}\n\n⚠️ Esta acción NO se puede deshacer.`;
  
  const confirmacion = await mostrarModalConfirmacion(
    'Confirmación',
    mensaje,
    { tipo: 'warning', textoAceptar: 'Aceptar' }
  );
  
  // PASO 2: Si el usuario cancela, NO hacer nada (mantener rangos editables)
  if (!confirmacion) {
    console.log('[DASHBOARD] Eliminación cancelada por el usuario');
    return;
  }
  
  // PASO 3: Si el usuario confirma, AHORA sí eliminar de la base de datos
  console.log('[DASHBOARD] Usuario confirmó eliminación. Eliminando', murosAEliminar.length, 'muros de BD...');
  
  try {
    const projectConfig = localStorage.getItem('projectConfig');
    if (!projectConfig) {
      await mostrarModalConfirmacion(
        'Error',
        'No se encontró el proyecto actual',
        { tipo: 'warning', mostrarCancelar: false }
      );
      return;
    }
    
    const proyecto = JSON.parse(projectConfig);
    const pidsAEliminar = murosAEliminar.map(m => m.pid);
    
    console.log('[DASHBOARD] PIDs a eliminar:', pidsAEliminar);
    
    // Eliminar muros de la base de datos
    const response = await fetch(`${API_BASE}/api/importar-muros/muros/batch-delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pk_proyecto: proyecto.pid,
        pids: pidsAEliminar
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[DASHBOARD] Respuesta de eliminación:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Error desconocido eliminando muros');
    }
    
    console.log('[DASHBOARD] ✅ Muros eliminados exitosamente de BD');
    
    // PASO 4: Actualizar la variable global con los muros filtrados
    const globalVars = window.globalVars || {};
    globalVars.panelesActuales = murosRestantes;
    
    // Ocultar sección de eliminación
    document.getElementById('eliminarMurosAccordion').style.display = 'none';
    
    // Continuar con el flujo normal de importación
    finalizarImportacion(murosRestantes);
    
    // Limpiar rangos de eliminación después de importar exitosamente
    limpiarRangosEliminacion();
    
    console.log('[DASHBOARD] ✅ Importación confirmada con', murosRestantes.length, 'muros filtrados');
    
    // Mostrar mensaje de éxito
    await mostrarModalConfirmacion(
      'Mensaje',
      `✅ Importación exitosa!\n\n• Muros eliminados: ${murosAEliminar.length}\n• Muros importados: ${murosRestantes.length}`,
      { tipo: 'success', mostrarCancelar: false }
    );
    
  } catch (error) {
    console.error('[DASHBOARD] ❌ Error en confirmación de importación:', error);
    await mostrarModalConfirmacion(
      'Error',
      `❌ Error al eliminar muros de la base de datos:\n\n${error.message}`,
      { tipo: 'warning', mostrarCancelar: false }
    );
  }
}

// Función para finalizar la importación (continuar flujo normal)
function finalizarImportacion(murosFinales) {
  // Actualizar variable global
  if (window.globalVars) {
    window.globalVars.panelesActuales = murosFinales;
  }
  
  // Obtener elementos de UI necesarios
  const tablaPaneles = document.getElementById('tablaPaneles');
  const tablaAccordion = document.getElementById('tablaAccordion');
  const panelesInfo = document.getElementById('panelesInfo');
  const btnCalcular = document.getElementById('btnCalcular');
  
  const uiElements = { tablaPaneles, tablaAccordion, panelesInfo, btnCalcular };
  const callbacks = { openSection: (id) => {} }; // Función dummy para openSection
  
  // Actualizar tabla de paneles usando la función global
  if (typeof updatePanelesDisplay === 'function') {
    updatePanelesDisplay(murosFinales, uiElements, callbacks);
  }
  
  // Mostrar accordion de tabla de paneles
  if (tablaAccordion) {
    tablaAccordion.style.display = 'block';
  }
  
  // Habilitar botones de cálculo
  const btnInforme = document.getElementById('btnGenerarPDF');
  
  if (btnCalcular) btnCalcular.style.display = 'inline-block';
  if (btnInforme) btnInforme.style.display = 'inline-block';
  
  // Mostrar sección de asignación de ejes después de importar
  const ejesPanel = document.getElementById('ejesRangoPanel');
  if (ejesPanel) {
    ejesPanel.style.display = 'block';
    console.log('[DASHBOARD] Sección de asignación de ejes mostrada');
  }
  
  // Cargar tabla de braces después de importar
  console.log('[DASHBOARD] Cargando tabla de braces...');
  if (typeof window.cargarTablaBraces === 'function') {
    window.cargarTablaBraces();
  }
  
  console.log('[DASHBOARD] Importación finalizada con', murosFinales.length, 'muros');
}

// Función para limpiar rangos de eliminación después de importar
function limpiarRangosEliminacion() {
  const rangosContainer = document.getElementById('rangosEliminar');
  if (rangosContainer) {
    rangosContainer.innerHTML = '<p class="muted">Rangos de eliminación limpiados después de la importación.</p>';
    console.log('[DASHBOARD] Rangos de eliminación limpiados');
  }
}

// Función para cancelar la eliminación
export function cancelarEliminacion() {
  // Ocultar sección de eliminación
  document.getElementById('eliminarMurosAccordion').style.display = 'none';
  
  // Continuar con importación normal de todos los muros
  finalizarImportacion(murosOriginales);
}

// ===== ARMADO RECTANGULAR =====

// Cargar el módulo de armado rectangular
import { 
  calcularReporteMuerto
} from './muertoRectangular.js';

// Cargar el módulo de armado cilíndrico
import { 
  calcularReporteCilindrico,
  calcularResumenProyectoCilindrico 
} from './muertoCilindrico.js';

// Configuración global del armado rectangular
let configArmado = {
  // Varillas longitudinales
  tipoVarillaLongitudinal: 4,        // #4 (0.994 kg/m)
  recubrimientoLongitudinal: 4,      // 4 cm (como recomienda)
  separacionLongitudinal: 60,        // 60 cm ✅
  cantVarillasSuperior: 4,           // 4 ✅
  cantVarillasMedias: 2,             // 2 (no null)
  cantVarillasInferior: 2,           // 2 ✅
  
  // Varillas transversales (estribos)
  tipoVarillaTransversal: 3,         // #3 (0.560 kg/m) ✅
  recubrimientoTransversal: 4,       // 4 cm (como recomienda)
  separacionTransversal: 25,         // 25 cm (como recomienda)
  longGanchoEstribo: 0.7,            // 0.7 m ✅
  
  // Construcción
  tipoConcreto: 2400,                // 2400 kg/m³ (como recomienda)
  factorDesperdicio: 1.0,            // 1.0 (como recomienda)
  
  // Alambre de amarre
  diametroAlambre: 1.22,             // 1.22 mm (como recomienda)
  longitudVuelta: 35,                // 35 cm (como recomienda)
  factorDesperdicioAlambre: 1.15     // 1.15 (como recomienda)
};

// Función para inicializar el armado rectangular
function initArmadoRectangular() {
  // Verificar que existan los elementos del DOM
  if (!document.getElementById('btnCalcularArmado')) {
    console.log('[ARMADO] Elementos del armado no encontrados, omitiendo inicialización');
    return;
  }

  // Cargar configuración inicial en los inputs
  document.getElementById('tipoVarillaLongitudinal').value = configArmado.tipoVarillaLongitudinal;
  document.getElementById('recubrimientoLongitudinal').value = configArmado.recubrimientoLongitudinal;
  document.getElementById('separacionLongitudinal').value = configArmado.separacionLongitudinal;
  document.getElementById('cantVarillasSuperior').value = configArmado.cantVarillasSuperior;
  document.getElementById('cantVarillasSuperior').value = configArmado.cantVarillasSuperior;
  if (configArmado.cantVarillasMedias !== null) {
    document.getElementById('cantVarillasMedias').value = configArmado.cantVarillasMedias;
  }
  document.getElementById('cantVarillasInferior').value = configArmado.cantVarillasInferior;
  document.getElementById('tipoVarillaTransversal').value = configArmado.tipoVarillaTransversal;
  document.getElementById('recubrimientoTransversal').value = configArmado.recubrimientoTransversal;
  document.getElementById('separacionTransversal').value = configArmado.separacionTransversal;
  document.getElementById('longGanchoEstribo').value = configArmado.longGanchoEstribo;
  document.getElementById('tipoConcreto').value = configArmado.tipoConcreto;
  document.getElementById('factorDesperdicio').value = configArmado.factorDesperdicio;
  document.getElementById('diametroAlambre').value = configArmado.diametroAlambre;
  document.getElementById('longitudVuelta').value = configArmado.longitudVuelta;
  document.getElementById('factorDesperdicioAlambre').value = configArmado.factorDesperdicioAlambre;
  
  // Event listener para el botón de reagrupar muertos
  const btnReagrupar = document.getElementById('btnReagruparMuertos');
  if (btnReagrupar) {
    btnReagrupar.addEventListener('click', reagruparMuertos);
    console.log('[DASHBOARD] Event listener agregado a btnReagruparMuertos');
  }
  
  // Event listener para el botón de calcular armado
  document.getElementById('btnCalcularArmado').addEventListener('click', ejecutarCalculosArmado);
  
  // Event listeners para actualizar configuración cuando cambien los inputs
  document.querySelectorAll('#armadoRectangular .form-control').forEach(input => {
    input.addEventListener('change', actualizarConfiguracion);
  });
  
  console.log('[ARMADO] Armado rectangular inicializado correctamente');
}

// Función para actualizar la configuración desde los inputs
function actualizarConfiguracion() {
  configArmado.tipoVarillaLongitudinal = parseInt(document.getElementById('tipoVarillaLongitudinal').value);
  configArmado.recubrimientoLongitudinal = parseFloat(document.getElementById('recubrimientoLongitudinal').value);
  configArmado.separacionLongitudinal = parseFloat(document.getElementById('separacionLongitudinal').value);
  configArmado.cantVarillasSuperior = parseInt(document.getElementById('cantVarillasSuperior').value);
  const mediasValue = document.getElementById('cantVarillasMedias').value;
  configArmado.cantVarillasMedias = mediasValue ? parseInt(mediasValue) : null; // null = usar regla automática
  configArmado.cantVarillasInferior = parseInt(document.getElementById('cantVarillasInferior').value);
  configArmado.tipoVarillaTransversal = parseInt(document.getElementById('tipoVarillaTransversal').value);
  configArmado.recubrimientoTransversal = parseFloat(document.getElementById('recubrimientoTransversal').value);
  configArmado.separacionTransversal = parseFloat(document.getElementById('separacionTransversal').value);
  configArmado.longGanchoEstribo = parseFloat(document.getElementById('longGanchoEstribo').value);
  configArmado.tipoConcreto = parseFloat(document.getElementById('tipoConcreto').value);
  configArmado.factorDesperdicio = parseFloat(document.getElementById('factorDesperdicio').value);
  configArmado.diametroAlambre = parseFloat(document.getElementById('diametroAlambre').value);
  configArmado.longitudVuelta = parseFloat(document.getElementById('longitudVuelta').value);
  configArmado.factorDesperdicioAlambre = parseFloat(document.getElementById('factorDesperdicioAlambre').value);
}

// ===== FUNCIONES PARA CONFIGURACIÓN DE GRUPOS DE MUERTOS =====
function mostrarConfigGrupos(gruposMuertos) {
  console.log('[DASHBOARD] mostrarConfigGrupos - Mostrando listado de muertos');
  console.log('[DASHBOARD] Cantidad de grupos recibidos:', Object.keys(gruposMuertos).length);
  console.log('[DASHBOARD] Grupos:', gruposMuertos);
  
  const configContainer = document.getElementById('configGruposContainer');
  
  if (!configContainer) {
    console.error('[DASHBOARD] No se encontró contenedor de configuración');
    return;
  }
  
  // Inicializar almacenamiento global de configuración si no existe
  if (!window.configGruposMuertos) {
    window.configGruposMuertos = {};
  }
  
  // Detectar formato: script.js usa {M1: {...}, M2: {...}} vs dashboard.js usa {'2_55_1': {...}}
  const primeraClave = Object.keys(gruposMuertos)[0];
  const formatoScriptJS = primeraClave && primeraClave.startsWith('M');
  
  console.log('[DASHBOARD] Formato detectado:', formatoScriptJS ? 'script.js (M1, M2)' : 'dashboard.js (x_ang_eje)');
  
  // Crear HTML con tabla simplificada
  let html = `
    <div style="background: var(--card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
      <h3 style="margin-top: 0; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.5rem;">⚙️</span>
        Configuración de Profundidad por Muerto
      </h3>
      
      <p style="color: var(--text-dim); margin-bottom: 1.5rem;">
        Ingresa la profundidad deseada para cada grupo de muertos. 
        Este valor se usará en los cálculos de macizos de anclaje.
        <br><strong>Total de grupos: ${Object.keys(gruposMuertos).length}</strong>
      </p>
      
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="background: var(--primary); color: white;">
            <th style="padding: 0.75rem; text-align: left;">Muerto</th>
            <th style="padding: 0.75rem; text-align: center;">X Braces</th>
            <th style="padding: 0.75rem; text-align: center;">Ángulo</th>
            <th style="padding: 0.75rem; text-align: center;">Eje</th>
            <th style="padding: 0.75rem; text-align: center;">Cant. Muros</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 150px;">Profundidad (m)</th>
          </tr>
        </thead>
        <tbody>`;
  
  if (formatoScriptJS) {
    // Formato de script.js: {M1: {muerto, x, ang, tipo, eje, muros}, M2: {...}}
    Object.keys(gruposMuertos).forEach(clave => {
      const grupo = gruposMuertos[clave];
      const numeroMuerto = grupo.muerto || parseInt(clave.replace('M', ''));
      
      // Construir clave en formato backend: "x_angulo_eje"
      const xBraces = grupo.x || grupo.x_braces || 0;
      const angulo = Math.round(grupo.ang || grupo.angulo || 0);
      const eje = grupo.eje || 0;
      const claveBackend = `${xBraces}_${angulo}_${eje}`;
      
      const valorActual = window.configGruposMuertos[claveBackend]?.profundo || 2.0;
      
      console.log(`[DASHBOARD] Generando fila para ${clave} -> clave backend: ${claveBackend}`, grupo);
      
      html += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 0.75rem; font-weight: bold; color: var(--primary);">${clave}</td>
          <td style="padding: 0.75rem; text-align: center;">${xBraces}</td>
          <td style="padding: 0.75rem; text-align: center;">${angulo}°</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #28a745;">${eje}</td>
          <td style="padding: 0.75rem; text-align: center; color: #6f42c1; font-weight: bold;">${grupo.muros?.length || 0}</td>
          <td style="padding: 0.75rem; text-align: center;">
            <input 
              type="number" 
              class="input-profundidad-muerto" 
              data-muerto="${clave}"
              data-grupo-clave="${claveBackend}"
              value="${valorActual}"
              step="0.1" 
              min="0.5"
              max="10"
              style="width: 100px; padding: 0.5rem; text-align: center; border: 2px solid var(--border); border-radius: 4px; font-size: 1rem; font-weight: bold;"
              placeholder="2.0"
            >
          </td>
        </tr>`;
    });
  } else {
    // Formato de dashboard.js: {'2_55_1': {x_braces, angulo, eje, muros}}
    let indice = 1;
    Object.keys(gruposMuertos).forEach(clave => {
      const grupo = gruposMuertos[clave];
      const valorActual = window.configGruposMuertos[clave]?.profundo || 2.0;
      
      console.log(`[DASHBOARD] Generando fila para M${indice}, clave: ${clave}`, grupo);
      
      html += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 0.75rem; font-weight: bold; color: var(--primary);">M${indice}</td>
          <td style="padding: 0.75rem; text-align: center;">${grupo.x_braces}</td>
          <td style="padding: 0.75rem; text-align: center;">${grupo.angulo}°</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #28a745;">${grupo.eje || 'N/A'}</td>
          <td style="padding: 0.75rem; text-align: center; color: #6f42c1; font-weight: bold;">${grupo.muros.length}</td>
          <td style="padding: 0.75rem; text-align: center;">
            <input 
              type="number" 
              class="input-profundidad-muerto" 
              data-muerto="M${indice}"
              data-grupo-clave="${clave}"
              value="${valorActual}"
              step="0.1" 
              min="0.5"
              max="10"
              style="width: 100px; padding: 0.5rem; text-align: center; border: 2px solid var(--border); border-radius: 4px; font-size: 1rem; font-weight: bold;"
              placeholder="2.0"
            >
          </td>
        </tr>`;
      
      indice++;
    });
  }
  
  html += `
        </tbody>
      </table>
      
      <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
        <button 
          id="btnGuardarProfundidades" 
          class="btn btn-primary"
          style="padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: bold;"
        >
          💾 Guardar Profundidades
        </button>
      </div>
      
      <div id="mensajeGuardado" style="display: none; margin-top: 1rem; padding: 1rem; background: #d4edda; color: #155724; border-radius: 6px; border: 1px solid #c3e6cb;">
        ✅ Profundidades guardadas correctamente
      </div>
    </div>`;
  
  configContainer.innerHTML = html;
  configContainer.style.display = 'block';
  
  // Event listener para el botón de guardar
  document.getElementById('btnGuardarProfundidades').addEventListener('click', guardarProfundidadesMuertos);
  
  console.log('[DASHBOARD] Listado de muertos mostrado:', Object.keys(gruposMuertos).length, 'grupos');
}

// Función para guardar profundidades individuales por muerto
function guardarProfundidadesMuertos() {
  console.log('[DASHBOARD] guardarProfundidadesMuertos - Guardando profundidades individuales');
  
  // Limpiar configuración anterior de profundidades
  if (!window.configGruposMuertos) {
    window.configGruposMuertos = {};
  }
  
  // Obtener todos los inputs de profundidad
  const inputs = document.querySelectorAll('.input-profundidad-muerto');
  
  console.log('[DASHBOARD] Inputs encontrados:', inputs.length);
  
  if (inputs.length === 0) {
    alert('⚠️ No se encontraron inputs de profundidad');
    return;
  }
  
  let profundidadesValidas = 0;
  
  inputs.forEach((input, index) => {
    const clave = input.getAttribute('data-grupo-clave');
    const muerto = input.getAttribute('data-muerto');
    const valor = parseFloat(input.value);
    
    console.log(`[DASHBOARD] Input ${index + 1}:`, { clave, muerto, valor });
    
    if (!clave) {
      console.warn('[DASHBOARD] Input sin clave:', input);
      return;
    }
    
    if (isNaN(valor) || valor <= 0) {
      console.warn(`[DASHBOARD] Valor inválido para ${muerto}: ${input.value}`);
      input.style.borderColor = 'red';
      return;
    }
    
    // Inicializar objeto de configuración para este grupo si no existe
    if (!window.configGruposMuertos[clave]) {
      window.configGruposMuertos[clave] = {
        espaciadoLong: 25,
        espaciadoTrans: 25,
        factorSeguridad: 1.0,
        friccion: 0.3
      };
    }
    
    // Guardar profundidad
    window.configGruposMuertos[clave].profundo = valor;
    input.style.borderColor = '#28a745'; // Verde para indicar guardado
    profundidadesValidas++;
    
    console.log(`[DASHBOARD] ✓ ${muerto} (${clave}): ${valor}m`);
  });
  
  console.log('[DASHBOARD] Total profundidades guardadas:', profundidadesValidas);
  console.log('[DASHBOARD] Configuración completa:', window.configGruposMuertos);
  
  if (profundidadesValidas === 0) {
    alert('⚠️ No se pudo guardar ninguna profundidad. Verifica los valores ingresados.');
    return;
  }
  
  // Mostrar mensaje de éxito
  const mensaje = document.getElementById('mensajeGuardado');
  if (mensaje) {
    mensaje.style.display = 'block';
    setTimeout(() => {
      mensaje.style.display = 'none';
    }, 3000);
  }
  
  // Guardar en backend
  const projectConfig = localStorage.getItem('projectConfig');
  if (projectConfig) {
    const proyecto = JSON.parse(projectConfig);
    
    console.log('[DASHBOARD] Proyecto en localStorage:', proyecto);
    console.log('[DASHBOARD] PID del proyecto:', proyecto.pid);
    console.log('[DASHBOARD] Enviando al backend:', {
      url: `${API_BASE}/api/grupos-muertos/${proyecto.pid}`,
      proyecto: proyecto.pid,
      config: window.configGruposMuertos
    });
    
    fetch(`${API_BASE}/api/grupos-muertos/${proyecto.pid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(window.configGruposMuertos)
    })
    .then(response => {
      console.log('[DASHBOARD] Respuesta HTTP status:', response.status);
      console.log('[DASHBOARD] Respuesta HTTP OK:', response.ok);
      return response.json();
    })
    .then(data => {
      console.log('[DASHBOARD] Datos recibidos del servidor:', data);
      if (data.success) {
        console.log('[DASHBOARD] ✅ Guardado en BD:', data);
        
        // Resetear bordes a normal
        inputs.forEach(input => {
          input.style.borderColor = 'var(--border)';
        });
        
        alert(`✅ Profundidades guardadas exitosamente!\n\n` +
              `📊 Resumen:\n` +
              `• Total muertos: ${profundidadesValidas}\n` +
              `• Guardados en BD: ${data.grupos?.length || profundidadesValidas}\n\n` +
              `Los datos están disponibles para cálculos.`);
      } else {
        console.error('[DASHBOARD] Error guardando:', data.error);
        alert('⚠️ Error al guardar en la base de datos:\n' + data.error + '\n\nLa configuración se guardó en memoria local.');
      }
    })
    .catch(error => {
      console.error('[DASHBOARD] Error en petición:', error);
      alert('⚠️ Error de conexión con el servidor.\n\nLa configuración se guardó en memoria local y podrás usarla en esta sesión.');
    });
  } else {
    alert(`✅ Profundidades guardadas en memoria!\n\n` +
          `📊 Total: ${profundidadesValidas} muertos configurados\n\n` +
          `⚠️ No hay proyecto seleccionado para guardar en BD.`);
  }
}

function guardarConfigGrupos() {
  console.log('[DASHBOARD] guardarConfigGrupos - DEPRECADO: Usar guardarProfundidadesMuertos()');
  
  // Redirigir a la nueva función
  guardarProfundidadesMuertos();
}

// Función para cargar grupos de muertos desde el backend
async function cargarGruposMuertosDesdeBackend(pk_proyecto) {
  try {
    console.log('[DASHBOARD] Cargando grupos desde backend para proyecto:', pk_proyecto);
    
    const response = await fetch(`${API_BASE}/api/grupos-muertos/${pk_proyecto}`);
    const data = await response.json();
    
    if (data.success && data.grupos && data.grupos.length > 0) {
      console.log('[DASHBOARD] Grupos cargados desde BD:', data.grupos);
      
      // Convertir a formato de configuración
      window.configGruposMuertos = {};
      
      data.grupos.forEach(grupo => {
        const clave = `${grupo.x_braces}_${Math.round(grupo.angulo_brace)}_${grupo.eje || ''}`;
        window.configGruposMuertos[clave] = {
          profundo: parseFloat(grupo.profundidad) || 2.0,
          espaciadoLong: 25, // Valores por defecto si no están en BD
          espaciadoTrans: 25,
          factorSeguridad: 1.0,
          friccion: 0.3
        };
      });
      
      console.log('[DASHBOARD] Configuración cargada desde BD:', window.configGruposMuertos);
      return true;
    } else {
      console.log('[DASHBOARD] No hay grupos guardados en BD');
      return false;
    }
  } catch (error) {
    console.error('[DASHBOARD] Error cargando grupos desde backend:', error);
    return false;
  }
}

// ===== FUNCIÓN PARA REAGRUPAR MUERTOS =====
async function reagruparMuertos() {
  console.log('[DASHBOARD] reagruparMuertos - Iniciando reagrupación INDEPENDIENTE del PDF');
  
  // Verificar que globalVars esté disponible
  if (!window.globalVars || !window.globalVars.resultadosTomoIII) {
    alert('⚠️ Error: No hay resultados de cálculos de viento. Por favor:\n1. Importa un archivo TXT\n2. Calcula los braces\nLuego intenta de nuevo.');
    return;
  }
  
  let murosConBraces = [];
  
  console.log('[DASHBOARD] Construyendo murosConBraces desde tabla actual + resultadosTomoIII');
  
  // Obtener las filas de la tabla con datos de braces
  const filas = document.querySelectorAll('tr[data-pid]');
  if (filas.length === 0) {
    alert('⚠️ Error: No hay datos de muros en la tabla. Por favor verifica que los braces estén calculados.');
    return;
  }
  
  console.log('[DASHBOARD] Procesando', filas.length, 'filas de la tabla');
  
  // Construir murosConBraces desde la tabla actual + resultadosTomoIII
  filas.forEach(row => {
    const pidStr = row.dataset.pid;
    const pid = parseInt(pidStr);
    
    console.log(`[DASHBOARD] Procesando fila con pid=${pid}`);
    
    // Obtener valores de braces desde los inputs de la tabla
    const angulo = parseFloat(row.querySelector('[data-field="angulo_brace"]')?.value) || 55;
    const npt = parseFloat(row.querySelector('[data-field="npt"]')?.value) || 0.350;
    const tipoBraceInput = row.querySelector('[data-field="tipo_brace_seleccionado"]')?.value;
    const tipoBrace = tipoBraceInput && tipoBraceInput !== '' ? tipoBraceInput : undefined;
    const xBraces = parseInt(row.querySelector('[data-field="x_braces"]')?.value) || 2;
    
    // Valores calculados (de celdas de solo lectura)
    const fbx = parseFloat(row.querySelector(`.valor-fbx[data-pid="${pidStr}"]`)?.textContent) || 0;
    const fby = parseFloat(row.querySelector(`.valor-fby[data-pid="${pidStr}"]`)?.textContent) || 0;
    const fb = parseFloat(row.querySelector(`.valor-fb[data-pid="${pidStr}"]`)?.textContent) || 0;
    const xInserto = parseFloat(row.querySelector(`.valor-x-inserto[data-pid="${pidStr}"]`)?.textContent) || 0;
    const yInserto = parseFloat(row.querySelector(`.valor-y-inserto[data-pid="${pidStr}"]`)?.textContent) || 0;
    
    // Cantidades de braces
    const cantB14 = parseInt(row.querySelector(`.cant-b14[data-pid="${pidStr}"]`)?.textContent) || 0;
    const cantB12 = parseInt(row.querySelector(`.cant-b12[data-pid="${pidStr}"]`)?.textContent) || 0;
    const cantB04 = parseInt(row.querySelector(`.cant-b04[data-pid="${pidStr}"]`)?.textContent) || 0;
    const cantB15 = parseInt(row.querySelector(`.cant-b15[data-pid="${pidStr}"]`)?.textContent) || 0;
    
    // Obtener datos de viento desde resultadosTomoIII usando pid como número
    const muroViento = window.globalVars.resultadosTomoIII.find(m => m.pid === pid);
    
    if (muroViento) {
      murosConBraces.push({
        ...muroViento,
        pid: pid,
        angulo_brace: angulo,
        npt: npt,
        tipo_brace_seleccionado: tipoBrace,
        x_braces: xBraces,
        fbx: fbx,
        fby: fby,
        fb: fb,
        x_inserto: xInserto,
        y_inserto: yInserto,
        cant_b14: cantB14,
        cant_b12: cantB12,
        cant_b04: cantB04,
        cant_b15: cantB15
      });
      console.log(`[DASHBOARD] ✓ Muro ${pid} agregado a murosConBraces (fb=${fb})`);
    } else {
      console.warn(`[DASHBOARD] ⚠️ Muro ${pid} NO encontrado en resultadosTomoIII`);
      console.log('[DASHBOARD] Miros disponibles:', window.globalVars.resultadosTomoIII.map(m => m.pid));
    }
  });
  
  if (murosConBraces.length === 0) {
    alert('⚠️ Error: No se pudieron cargar los datos de muros. Por favor verifica que los braces estén calculados.');
    return;
  }
  
  console.log('[DASHBOARD] murosConBraces completado:', murosConBraces.length, 'muros');
  
  // ===== USAR GRUPOS DE MUERTOS DE SCRIPT.JS =====
  // En lugar de crear grupos nuevos, usar window.gruposMuertosGlobal que ya viene de script.js
  // con la agrupación correcta (M1, M2, etc.)
  let gruposMuertos;
  
  if (window.gruposMuertosGlobal && Object.keys(window.gruposMuertosGlobal).length > 0) {
    console.log('[DASHBOARD] ✅ Usando window.gruposMuertosGlobal de script.js');
    gruposMuertos = window.gruposMuertosGlobal;
  } else {
    console.log('[DASHBOARD] ⚠️ window.gruposMuertosGlobal no disponible, creando grupos por eje');
    // Fallback: crear grupos por eje si no existe window.gruposMuertosGlobal
    gruposMuertos = {};
    
    murosConBraces.forEach(muro => {
      const xBraces = muro.x_braces || 2;
      const angulo = Math.round(muro.angulo_brace || 55);
      const eje = muro.eje || '1';
      
      // Crear clave única por EJE (no solo por x, ang, eje combinados)
      const clave = `M${eje}`;
      
      if (!gruposMuertos[clave]) {
        gruposMuertos[clave] = {
          muerto: parseInt(eje),
          x: xBraces,
          ang: angulo,
          eje: eje,
          x_braces: xBraces,
          angulo: angulo,
          muros: []
        };
      }
      
      gruposMuertos[clave].muros.push(muro);
    });
  }
  
  console.log('[DASHBOARD] Grupos de muertos disponibles:', Object.keys(gruposMuertos).length);
  Object.keys(gruposMuertos).forEach(clave => {
    const grupo = gruposMuertos[clave];
    console.log(`[DASHBOARD]   ${clave}: ${grupo.muros?.length || 0} muros`);
  });
  
  // Exponer globalmente
  window.gruposMuertosGlobal = gruposMuertos;
  window.murosConBraces = murosConBraces;
  console.log('[DASHBOARD] gruposMuertosGlobal y murosConBraces expuestos globalmente');
  
  // ===== NO MOSTRAR FORMULARIO AQUÍ =====
  // El formulario se mostrará automáticamente cuando script.js dispare el evento 'gruposMuertosActualizados'
  // con los grupos correctos (M1, M2, etc.)
  console.log('[DASHBOARD] ⏳ Esperando que script.js actualice gruposMuertosGlobal y dispare evento...');
  
  // NOTA: No mostramos alert aquí para evitar confusión. El alert se mostrará desde el listener del evento.
}

// Función principal para ejecutar los cálculos de armado
async function ejecutarCalculosArmado() {
  try {
    console.log('[DASHBOARD] ejecutarCalculosArmado - Iniciando cálculos de macizos de anclaje');
    
    // PASO 0: Guardar todos los cambios en la BD antes de calcular
    console.log('[DASHBOARD] Guardando todos los cambios en la BD antes de calcular armado...');
    try {
      // Ejecutar el botón de guardar si existe (simular click)
      const btnGuardarTop = document.getElementById('btnGuardarTodosBracesTop');
      const btnGuardarBottom = document.getElementById('btnGuardarTodosBraces');
      
      if (btnGuardarTop && btnGuardarTop.onclick) {
        console.log('[DASHBOARD] Ejecutando guardar cambios automáticamente...');
        await btnGuardarTop.onclick();
        console.log('[DASHBOARD] Cambios guardados exitosamente');
      } else if (btnGuardarBottom && btnGuardarBottom.onclick) {
        console.log('[DASHBOARD] Ejecutando guardar cambios automáticamente (botón inferior)...');
        await btnGuardarBottom.onclick();
        console.log('[DASHBOARD] Cambios guardados exitosamente');
      } else {
        console.log('[DASHBOARD] No se encontró botón de guardar, intentando función directa...');
        // Intentar llamar la función directamente desde el scope global
        if (window.guardarTodosBraces && typeof window.guardarTodosBraces === 'function') {
          await window.guardarTodosBraces();
          console.log('[DASHBOARD] Cambios guardados con función global');
        }
      }
      
      // Pausa para asegurar que los cambios se han procesado en la BD
      console.log('[DASHBOARD] Esperando 1 segundo para que la BD procese los cambios...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // RECARGAR datos desde la BD para tener los valores actualizados
      console.log('[DASHBOARD] Recargando datos actualizados desde la base de datos...');
      
      const projectConfig = localStorage.getItem('projectConfig');
      if (!projectConfig) {
        throw new Error('No hay proyecto seleccionado');
      }
      
      const project = JSON.parse(projectConfig);
      const pid = project.pid || project.id;
      console.log('[DASHBOARD] PID para cargar muros:', pid);
      
      if (!pid) {
        throw new Error('No se encontró ID del proyecto');
      }
      
      // Recargar datos de muros desde la BD
      const response = await fetch(`${API_BASE}/api/importar-muros/muros?pk_proyecto=${pid}`);
      if (!response.ok) {
        throw new Error('Error al recargar datos de muros');
      }
      
      const responseData = await response.json();
      const murosActualizados = responseData.muros || responseData;
      console.log('[DASHBOARD] Datos recargados desde BD:', murosActualizados.length, 'muros');
      console.log('[DASHBOARD] Primer muro de BD (con fb):', murosActualizados[0]);
      
      // Regenerar gruposMuertosGlobal con los datos actualizados
      console.log('[DASHBOARD] Regenerando gruposMuertosGlobal con datos actualizados...');
      const gruposMuertosActualizados = {};
      
      murosActualizados.forEach(muro => {
        const xBraces = muro.x_braces || 2;
        const angulo = Math.round(muro.angulo_brace || muro.angulo || 55);
        const eje = muro.eje || 1;
        
        // Usar formato script.js (clave: x_ang_eje)
        const clave = `${xBraces}_${angulo}_${eje}`;
        
        if (!gruposMuertosActualizados[clave]) {
          gruposMuertosActualizados[clave] = {
            x_braces: xBraces,
            angulo: angulo,
            eje: eje,
            muros: []
          };
        }
        
        gruposMuertosActualizados[clave].muros.push(muro);
      });
      
      // Actualizar global
      window.gruposMuertosGlobal = gruposMuertosActualizados;
      console.log('[DASHBOARD] gruposMuertosGlobal actualizado con datos de BD');
      console.log('[DASHBOARD] Claves:', Object.keys(gruposMuertosActualizados));
      console.log('[DASHBOARD] Primer grupo (debug):', Object.values(gruposMuertosActualizados)[0]);
      
    } catch (errorGuardar) {
      console.error('[DASHBOARD] Error al guardar/recargar cambios:', errorGuardar);
      alert('⚠️ Advertencia: No se pudieron guardar los cambios automáticamente. Los cálculos pueden usar datos desactualizados.');
    }
    
    console.log('[DASHBOARD] window.gruposMuertosGlobal:', window.gruposMuertosGlobal);
    console.log('[DASHBOARD] window.lastResultadosMuertos:', window.lastResultadosMuertos);
    
    // 1. Obtener datos de gruposMuertos desde el global (ya actualizado)
    const gruposMuertos = window.gruposMuertosGlobal;
    
    if (!gruposMuertos || Object.keys(gruposMuertos).length === 0) {
      console.error('[DASHBOARD] No hay gruposMuertos disponibles');
      alert('⚠️ Error: No hay datos de grupos de muros. Por favor:\n1. Importa un archivo TXT\n2. Calcula los braces\n3. Haz clic en "Reagrupar Muertos"\nLuego intenta de nuevo.');
      return;
    }
    
    console.log('[DASHBOARD] gruposMuertos disponible. Claves:', Object.keys(gruposMuertos));
    
    // 2. Preparar grupos (sumar dimensiones dentro de cada grupo)
    console.log('[DASHBOARD] Preparando grupos para macizos...');
    const gruposPreparados = prepararGruposParaMuertos(gruposMuertos);
    console.log('[DASHBOARD] Grupos preparados:', gruposPreparados.length, gruposPreparados);
    
    // 3. Calcular macizos rectangulares (usando imports directos)
    console.log('[DASHBOARD] Calculando macizos rectangulares...');
    const resultados = calcularMacizosRectangulares(gruposPreparados, configArmado);
    console.log('[DASHBOARD] Macizos calculados:', resultados.length, resultados);
    
    // 4. Generar tabla HTML con resultados
    console.log('[DASHBOARD] Generando tabla de resultados...');
    const tablaHTML = generarTablaResultadosMacizos(resultados);
    console.log('[DASHBOARD] tablaHTML:', tablaHTML.substring(0, 200) + '...');
    
    // 5. Mostrar resultados en la tabla
    const tabla = document.getElementById('tablaArmadoResultados');
    
    console.log('[DASHBOARD] Buscando tabla #tablaArmadoResultados:', !!tabla);
    
    if (tabla) {
      console.log('[DASHBOARD] Tabla encontrada. Insertando tbody y tfoot...');
      
      // La función generarTablaResultadosMacizos() devuelve <tbody>...</tbody><tfoot>...</tfoot>
      // Insertamos directamente en innerHTML de la tabla (mantiene thead intacto)
      tabla.innerHTML = tabla.querySelector('thead').outerHTML + tablaHTML;
      
      console.log('[DASHBOARD] ✅ HTML (thead + tbody + tfoot) insertado en tabla');
      
      // Mostrar la tabla
      tabla.style.display = '';
      console.log('[DASHBOARD] ✅ Tabla visible');
      
    } else {
      console.error('[DASHBOARD] ❌ No se encontró #tablaArmadoResultados');
      alert('Error: No se encontró la tabla para mostrar resultados');
    }
    
    // 6. Guardar resultados globalmente
    window.ultimosResultadosMacizos = resultados;
    console.log('[DASHBOARD] ✅ ejecutarCalculosArmado - Completado');
    
    // 7. LOG DETALLADO: Verificar todos los valores de las tablas del proyecto
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICACIÓN COMPLETA DE DATOS DEL PROYECTO');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Obtener proyecto actual
    const projectConfig = JSON.parse(localStorage.getItem('projectConfig') || '{}');
    console.log('🔧 Proyecto:', projectConfig);
    
    // Verificar muros en la base de datos
    try {
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4008' : '';
      const murosResponse = await fetch(`${API_BASE}/api/importar-muros/muros?pk_proyecto=${projectConfig.pid}`);
      const murosData = await murosResponse.json();
      
      console.log(`📋 TABLA MURO - Total registros: ${murosData.muros?.length || 0}`);
      murosData.muros?.forEach((muro, index) => {
        console.log(`   Muro ${index + 1} (PID: ${muro.pid}):`);
        console.log(`      ID: ${muro.id_muro}`);
        console.log(`      Eje: ${muro.eje || 'sin asignar'}`);
        console.log(`      Ángulo: ${muro.angulo_brace}°`);
        console.log(`      NPT: ${muro.npt}m`);
        console.log(`      Tipo brace: ${muro.tipo_brace_seleccionado}`);
        console.log(`      X braces: ${muro.x_braces}`);
        console.log(`      FB: ${muro.fb} kN`);
        console.log(`      FBX: ${muro.fbx} kN`);
        console.log(`      FBY: ${muro.fby} kN`);
        console.log(`      Cant B14: ${muro.cant_b14}`);
        console.log(`      Cant B12: ${muro.cant_b12}`);
        console.log(`      Cant B04: ${muro.cant_b04}`);
        console.log(`      Cant B15: ${muro.cant_b15}`);
        console.log(`      X inserto: ${muro.x_inserto}m`);
        console.log(`      Y inserto: ${muro.y_inserto}m`);
        console.log(`      Área: ${muro.area}m²`);
        console.log(`      Peso: ${muro.peso} ton`);
        console.log(`      Grosor: ${muro.grosor}m`);
        console.log(`      Altura: ${muro.overall_height}m`);
        console.log(`      FK grupo muerto: ${muro.fk_grupo_muerto || 'sin asignar'}`);
        console.log(`   ───────────────────────────────────────`);
      });
      
      // Verificar grupos de muertos
      const gruposResponse = await fetch(`${API_BASE}/api/grupos-muertos/${projectConfig.pid}`);
      const gruposData = await gruposResponse.json();
      
      console.log(`📦 TABLA GRUPO_MUERTO - Total registros: ${gruposData.grupos?.length || 0}`);
      gruposData.grupos?.forEach((grupo, index) => {
        console.log(`   Grupo ${index + 1} (PID: ${grupo.pid}):`);
        console.log(`      Número muerto: M${grupo.numero_muerto}`);
        console.log(`      Nombre: ${grupo.nombre || 'sin nombre'}`);
        console.log(`      Eje: ${grupo.eje}`);
        console.log(`      X braces: ${grupo.x_braces}`);
        console.log(`      Ángulo: ${grupo.angulo_brace}°`);
        console.log(`      Tipo construcción: ${grupo.tipo_construccion}`);
        console.log(`      Cantidad muros: ${grupo.cantidad_muros}`);
        console.log(`      Profundidad: ${grupo.profundidad}m`);
        console.log(`      Largo: ${grupo.largo}m`);
        console.log(`      Ancho: ${grupo.ancho}m`);
        console.log(`      Fuerza total: ${grupo.fuerza_total} kN`);
        console.log(`      Volumen concreto: ${grupo.volumen_concreto}m³`);
        console.log(`      Peso muerto: ${grupo.peso_muerto} kN`);
        console.log(`   ───────────────────────────────────────`);
      });
      
      // Verificar datos en memoria
      console.log(`💾 DATOS EN MEMORIA:`);
      console.log(`   gruposMuertosGlobal:`, window.gruposMuertosGlobal);
      console.log(`   ultimosResultadosMacizos:`, window.ultimosResultadosMacizos);
      
    } catch (error) {
      console.error('❌ Error al verificar tablas:', error);
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error al calcular armado:', error);
    alert('❌ Error al calcular armado rectangular: ' + error.message);
  }
}

// Función para llenar la tabla de armado
function llenarTablaArmado(reporte) {
  const tbody = document.querySelector('#tablaArmado tbody');
  const tfoot = document.querySelector('#tablaArmado tfoot');
  
  // Limpiar contenido anterior
  tbody.innerHTML = '';
  
  let totales = {
    volumenConcreto: 0,
    pesoConcreto: 0,
    pesoLongitudinal: 0,
    pesoTransversal: 0,
    pesoAlambre: 0,
    longitudTotalLongitudinal: 0,
    longitudTotalTransversal: 0,
    longitudAlambre: 0
  };
  
  // Agregar filas de datos - cada muerto tiene 2 filas (Long. y Trans.)
  reporte.forEach((item, index) => {
    // Fila para acero longitudinal
    const filaLong = document.createElement('tr');
    filaLong.innerHTML = `
      <td rowspan="2">D${index + 1}</td>
      <td rowspan="2">${item.eje}</td>
      <td rowspan="2">${item.cantidadMuros || 1 > 1 ? 'M0' + (item.cantidadMuros || 1) : 'M01'}</td>
      <td rowspan="2">${item.profundidad?.toFixed(2) || 'N/A'}</td>
      <td rowspan="2">${item.alto?.toFixed(2) || 'N/A'}</td>
      <td rowspan="2">${item.ancho?.toFixed(2) || 'N/A'}</td>
      <td>4</td>
      <td>${item.longitudTotalLongitudinal.toFixed(1)}</td>
      <td>${item.pesoLongitudinal.toFixed(1)}</td>
      <td>Long.</td>
      <td rowspan="2">${item.volumenConcreto.toFixed(2)}</td>
      <td rowspan="2">${(item.pesoConcreto / 1000).toFixed(1)}</td>
      <td rowspan="2">${item.longitudAlambre.toFixed(0)}</td>
      <td rowspan="2">${item.pesoAlambre.toFixed(1)}</td>
    `;
    tbody.appendChild(filaLong);
    
    // Fila para acero transversal
    const filaTrans = document.createElement('tr');
    filaTrans.innerHTML = `
      <td>3</td>
      <td>${item.longitudTotalTransversal.toFixed(1)}</td>
      <td>${item.pesoTransversal.toFixed(1)}</td>
      <td>Trans.</td>
    `;
    tbody.appendChild(filaTrans);
    
    // Sumar a totales
    totales.volumenConcreto += item.volumenConcreto;
    totales.pesoConcreto += item.pesoConcreto;
    totales.pesoLongitudinal += item.pesoLongitudinal;
    totales.pesoTransversal += item.pesoTransversal;
    totales.pesoAlambre += item.pesoAlambre;
    totales.longitudTotalLongitudinal += item.longitudTotalLongitudinal;
    totales.longitudTotalTransversal += item.longitudTotalTransversal;
    totales.longitudAlambre += item.longitudAlambre;
  });
  
  // Agregar fila de totales
  if (tfoot) {
    const totalAcero = totales.pesoLongitudinal + totales.pesoTransversal;
    
    tfoot.innerHTML = `
      <tr style="background-color: #f0f8ff; font-weight: bold;">
        <td colspan="6">TOTALES</td>
        <td>-</td>
        <td>${(totales.longitudTotalLongitudinal + totales.longitudTotalTransversal).toFixed(1)}</td>
        <td>${totalAcero.toFixed(1)}</td>
        <td>-</td>
        <td>${totales.volumenConcreto.toFixed(2)}</td>
        <td>${(totales.pesoConcreto / 1000).toFixed(2)}</td>
        <td>${totales.longitudAlambre.toFixed(0)}</td>
        <td>${totales.pesoAlambre.toFixed(1)}</td>
      </tr>
    `;
  }
  
  // Mostrar la tabla
  const tablaContainer = document.getElementById('tablaArmadoContainer');
  if (tablaContainer) {
    tablaContainer.style.display = 'block';
  }
}

// Función para actualizar las tarjetas de resumen
function actualizarResumenArmado(concreto, acero, alambre, metal) {
  document.getElementById('totalConcreto').textContent = `${concreto.toFixed(3)} m³`;
  document.getElementById('totalAcero').textContent = `${acero.toFixed(2)} kg`;
  document.getElementById('totalAlambre').textContent = `${alambre.toFixed(2)} kg`;
  document.getElementById('totalMetal').textContent = `${metal.toFixed(2)} kg`;
}

// Inicializar armado rectangular cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar siempre - el botón debería existir en la sección 6
  if (document.getElementById('btnCalcularArmado')) {
    console.log('[ARMADO] Inicializando armado rectangular...');
    initArmadoRectangular();
  } else {
    console.warn('[ARMADO] ⚠️ Botón btnCalcularArmado no encontrado');
  }
  
  // Listener para detectar cuando script.js actualiza window.gruposMuertosGlobal
  window.addEventListener('gruposMuertosActualizados', function(event) {
    console.log('[DASHBOARD] 🎯 Evento gruposMuertosActualizados recibido desde script.js');
    console.log('[DASHBOARD] Grupos actualizados:', event.detail);
    
    // Actualizar el formulario de configuración con los nuevos grupos
    if (event.detail && Object.keys(event.detail).length > 0) {
      mostrarConfigGrupos(event.detail);
      
      // Mostrar mensaje de confirmación
      const numGrupos = Object.keys(event.detail).length;
      alert(`✅ ${numGrupos} grupo${numGrupos > 1 ? 's' : ''} de muertos detectado${numGrupos > 1 ? 's' : ''}!\n\n` +
            `➡️ Ahora configura la profundidad para cada muerto.\n\n` +
            `Luego haz clic en "💾 Guardar Profundidades".`);
    }
  });
  
  console.log('[DASHBOARD] ✅ Listener de gruposMuertosActualizados registrado');
});

// Exponer funciones globalmente
window.ejecutarCalculosArmado = ejecutarCalculosArmado;
window.eliminarRango = eliminarRango;
window.cargarGruposMuertosDesdeBackend = cargarGruposMuertosDesdeBackend;
window.guardarProfundidadesMuertos = guardarProfundidadesMuertos;

// ELIMINADO: window.exportarTablaDetallada = exportarTablaDetallada;

// Exponer funciones globalmente
window.autoRecalcularTiposBraces = autoRecalcularTiposBraces;