// ===== MÓDULO CONSOLIDADO DE BOTONES =====
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:4008"   // dev backend
    : "";                       // production (relative)

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
export function loadProjectInfo() {

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
        <td>${i + 1}</td>
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
    
    updatePanelesDisplay();
    console.log('[DASHBOARD] Display de paneles actualizado');
    
    // Cargar tabla de braces después de importar
    console.log('[DASHBOARD] Cargando tabla de braces...');
    if (typeof window.cargarTablaBraces === 'function') {
      await window.cargarTablaBraces();
    }
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
      html += `<div class='kpi'><div class='kpi__label'>Panel #${i + 1} (${res.idMuro})</div>
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
      
      // Usar los datos recargados en lugar de los de la interfaz
      murosConBraces = murosActualizados.map(muro => {
        // Buscar el muro original en resultadosTomoIII para obtener datos de viento
        const muroViento = globalVars.resultadosTomoIII.find(m => m.pid === muro.pid);
        
        if (muroViento) {
          return {
            ...muroViento, // Datos de viento
            ...muro,       // Datos actualizados de la BD (braces, ejes, etc.)
            // Asegurar que los campos de braces estén presentes
            angulo_brace: muro.angulo || 55,
            npt: muro.npt || 0.350,
            tipo_brace_seleccionado: muro.tipo_brace,
            x_braces: muro.x_braces || 2,
            eje: muro.eje || '',
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
      tipo_construccion: tipoConstruccion,
      cantidad_muros: grupo.muros.length.toString(),
      muros_incluidos: murosIncluidos
    });
    
    numeroMuerto++;
  });
  
  console.log('[DASHBOARD] Tabla de muertos generada desde datos actualizados:', tablaMuertos.length, 'grupos');
  
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

// Exponer funciones globalmente
window.autoRecalcularTiposBraces = autoRecalcularTiposBraces;