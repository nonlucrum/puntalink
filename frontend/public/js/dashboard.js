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
    
    if (projectConfig) {
      const project = JSON.parse(projectConfig);
      
      // Actualizar elementos del DOM con la información del proyecto
      document.getElementById('proyectoNombre').value = project.nombre || '-';
      document.getElementById('proyectoEmpresa').value = project.empresa || '-';
      document.getElementById('proyectoTipoMuerto').value = project.tipo_muerto || '-';
      document.getElementById('proyectoVelViento').value = project.vel_viento || '-';
      document.getElementById('proyectoTempPromedio').value = project.temp_promedio || '-';
      document.getElementById('proyectoPresionAtm').value = project.presion_atmo || '-';
      
      console.log('[FRONTEND] Información del proyecto cargada:', project);
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

  document.getElementById('proyectoNombre').disabled = false;
  document.getElementById('proyectoEmpresa').disabled = false;
  document.getElementById('proyectoTipoMuerto').disabled = false;
  document.getElementById('proyectoVelViento').disabled = false;
  document.getElementById('proyectoTempPromedio').disabled = false;
  document.getElementById('proyectoPresionAtm').disabled = false;

  document.getElementById('proyectoNombre').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoEmpresa').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoTipoMuerto').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoVelViento').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoTempPromedio').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoPresionAtm').classList.replace('project-value-dim', 'project-value');
}

export async function guardarCambiosProyecto() {

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

  document.getElementById('proyectoNombre').disabled = true;
  document.getElementById('proyectoEmpresa').disabled = true;
  document.getElementById('proyectoTipoMuerto').disabled = true;
  document.getElementById('proyectoVelViento').disabled = true;
  document.getElementById('proyectoTempPromedio').disabled = true;
  document.getElementById('proyectoPresionAtm').disabled = true;

  document.getElementById('proyectoNombre').classList.replace('project-value', 'project-value-dim');
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
    // Mostrar tabla en el sub-acordeón
    let html = "<table><thead><tr><th>#</th><th>ID Muro</th><th>Grosor</th><th>Área</th><th>Peso</th><th>Volumen</th></tr></thead><tbody>";
    panelesActuales.forEach((p, i) => {
      html += `<tr>
        <td>${i + 1}</td>
        <td>${p.id_muro}</td>
        <td>${p.grosor ?? ''}</td>
        <td>${p.area ?? ''}</td>
        <td>${p.peso ?? ''}</td>
        <td>${p.volumen ?? ''}</td>
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
        <p><strong>✅ ${panelesActuales.length} paneles importados exitosamente</strong></p>
        <p class="muted">Los paneles están listos para ser calculados.</p>
      </div>
    `;
    
    // Mostrar botón calcular y abrir sección de resultados
    btnCalcular.style.display = '';
    openSection('results-section');
  } else {
    // Ocultar sub-acordeón
    tablaAccordion.style.display = 'none';
    tablaAccordion.classList.remove('active');
    tablaPaneles.innerHTML = '';
    panelesInfo.innerHTML = '<p class="muted">Los paneles importados aparecerán aquí después de subir un archivo TXT.</p>';
    btnCalcular.style.display = 'none';
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
export async function handleUploadTxt(file, elements, callbacks, globalVars) {
  console.log('[DASHBOARD] Preparando subida de archivo:', file.name);
  const { tablaPaneles, resultadosCalculo, btnCalcular, btnInforme } = elements;
  const { updatePanelesDisplay } = callbacks;
  
  const formData = new FormData();
  formData.append('file', file);

  tablaPaneles.innerHTML = 'Procesando...';
  resultadosCalculo.innerHTML = '<p class="muted">Los resultados de cálculo aparecerán aquí después de procesar los paneles.</p>';
  btnCalcular.style.display = 'none';
  btnInforme.style.display = 'none';
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
      return;
    }
    
    console.log('[DASHBOARD] Archivo procesado exitosamente');
    globalVars.panelesActuales = json.paneles;
    console.log('[DASHBOARD] Paneles obtenidos:', globalVars.panelesActuales.length);
    
    updatePanelesDisplay();
    console.log('[DASHBOARD] Display de paneles actualizado');
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
    
    console.log('[DASHBOARD] Enviando petición POST a /api/paneles/calcular');
    const resp = await fetch(`${API_BASE}/api/paneles/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    console.log('[DASHBOARD] Respuesta de cálculo recibida:', resp.status);
    const json = await resp.json();
    console.log('[DASHBOARD] Resultados de cálculo:', json);
    
    if (!resp.ok || !json.ok) {
      console.log('[DASHBOARD] Error en cálculo:', json.error);
      resultadosCalculo.innerHTML = `<p class="error">${json.error || 'Error en cálculo.'}</p>`;
      btnInforme.style.display = 'none';
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
    
    btnInforme.style.display = globalVars.resultadosActuales.length ? '' : 'none';
    console.log('[DASHBOARD] Botón informe mostrado:', globalVars.resultadosActuales.length > 0);
  } catch (err) {
    console.log('[DASHBOARD] Error de conexión en cálculo:', err.message);
    resultadosCalculo.innerHTML = `<p class="error">Error de conexión: ${err.message}</p>`;
    btnInforme.style.display = 'none';
  }
}

// ===== BOTÓN: GENERAR PDF =====
export async function handleGenerarPDF(elements, globalVars) {
  console.log('[DASHBOARD] Botón generar informe clickeado');
  const { btnInforme } = elements;
  
  if (!globalVars.panelesActuales.length) {
    console.log('[DASHBOARD] No hay paneles para generar informe');
    return;
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
  
  console.log('[DASHBOARD] Generando PDF para', globalVars.resultadosActuales.length, 'paneles');
  btnInforme.disabled = true;
  
  try {
    console.log('[DASHBOARD] Enviando petición POST a /api/paneles/pdf');
    const resp = await fetch(`${API_BASE}/api/paneles/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paneles: globalVars.resultadosActuales,
        projectInfo: projectInfo
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
    a.download = 'informe_paneles.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    console.log('[DASHBOARD] Descarga de PDF completada');
  } catch (err) {
    console.log('[DASHBOARD] Error generando PDF:', err.message);
    alert('Error generando el informe: ' + err.message);
  } finally {
    btnInforme.disabled = false;
    console.log('[DASHBOARD] Botón PDF rehabilitado');
  }
}