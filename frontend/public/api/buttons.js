// ===== MÓDULO CONSOLIDADO DE BOTONES =====

// ===== FUNCIONES DE VALIDACIÓN =====
export function validateTxtFile(file) {
  console.log('[BUTTONS] Validando archivo:', file.name);
  
  if (!file.name.toLowerCase().endsWith('.txt')) {
    console.log('[BUTTONS] Error: Archivo no es .txt');
    return {
      valid: false,
      error: 'Archivo no válido, solo debe subir archivos .txt'
    };
  }
  
  console.log('[BUTTONS] Archivo .txt válido');
  return { valid: true };
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
    console.log('[BUTTONS] Archivo:', file.name, 'Tamaño:', file.size, 'bytes');
    
    // Mostrar botón cancelar
    btnClearTxt.style.display = '';
    
    // Validar que el archivo sea .txt
    if (!file.name.toLowerCase().endsWith('.txt')) {
      console.log('[BUTTONS] Error: Archivo no es .txt');
      tablaPaneles.innerHTML = '<p class="error">Archivo no válido, solo debe subir archivos .txt</p>';
      btnUploadTxt.disabled = true;
      btnUploadTxt.style.opacity = '0.5';
      return false;
    } else {
      console.log('[BUTTONS] Archivo .txt válido');
      tablaPaneles.innerHTML = '';
      btnUploadTxt.disabled = false;
      btnUploadTxt.style.opacity = '1';
      return true;
    }
  } else {
    console.log('[BUTTONS] No hay archivo seleccionado');
    tablaPaneles.innerHTML = '';
    btnUploadTxt.disabled = false;
    btnUploadTxt.style.opacity = '1';
    btnClearTxt.style.display = 'none';
    return false;
  }
}

// ===== BOTÓN: SUBIR ARCHIVO TXT =====
export async function handleUploadTxt(file, elements, callbacks, globalVars) {
  console.log('[BUTTONS] Preparando subida de archivo:', file.name);
  const { tablaPaneles, resultadosCalculo, btnCalcular, btnInforme } = elements;
  const { updatePanelesDisplay } = callbacks;
  
  const formData = new FormData();
  formData.append('file', file);

  tablaPaneles.innerHTML = 'Procesando...';
  resultadosCalculo.innerHTML = '<p class="muted">Los resultados de cálculo aparecerán aquí después de procesar los paneles.</p>';
  btnCalcular.style.display = 'none';
  btnInforme.style.display = 'none';
  console.log('[BUTTONS] UI actualizada, enviando petición al servidor');

  try {
    console.log('[BUTTONS] Enviando petición POST a /api/importar-muros');
    const resp = await fetch('http://localhost:4008/api/importar-muros', {
      method: 'POST',
      body: formData
    });
    console.log('[BUTTONS] Respuesta recibida:', resp.status, resp.statusText);
    const json = await resp.json();
    console.log('[BUTTONS] JSON parseado:', json);
    
    if (!resp.ok || !json.ok) {
      console.log('[BUTTONS] Error en la respuesta:', json.error);
      tablaPaneles.innerHTML = `<p class="error">${json.error || 'Error procesando el TXT.'}</p>`;
      return;
    }
    
    console.log('[BUTTONS] Archivo procesado exitosamente');
    globalVars.panelesActuales = json.paneles;
    console.log('[BUTTONS] Paneles obtenidos:', globalVars.panelesActuales.length);
    
    updatePanelesDisplay();
    console.log('[BUTTONS] Display de paneles actualizado');
  } catch (err) {
    console.log('[BUTTONS] Error de conexión:', err.message);
    tablaPaneles.innerHTML = `<p class="error">Error procesando el TXT: ${err.message}</p>`;
  }
}

// ===== BOTÓN: CANCELAR SELECCIÓN =====
export async function handleCancelTxt(elements, globalVars) {
  console.log('[BUTTONS] Botón cancelar clickeado');
  const { 
    txtInput, tablaAccordion, tablaPaneles, resultadosCalculo, 
    btnCalcular, btnInforme, btnClearTxt, panelesInfo 
  } = elements;
  
  try {
    await fetch('http://localhost:4008/api/cancelar-import', { method: 'DELETE' });
    console.log('[BUTTONS] Cancelación exitosa');
    
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
    
    console.log('[BUTTONS] UI limpiada exitosamente');
  } catch (err) {
    console.log('[BUTTONS] Error en cancelación:', err.message);
    tablaPaneles.innerHTML = `<p class="error">Error eliminando el TXT: ${err.message}</p>`;
  }
}

// ===== BOTÓN: CALCULAR PANELES =====
export async function handleCalcularPaneles(elements, callbacks, globalVars) {
  console.log('[BUTTONS] Botón calcular clickeado');
  const { resultadosCalculo, btnInforme } = elements;
  const { openSection } = callbacks;
  
  if (!globalVars.panelesActuales.length) {
    console.log('[BUTTONS] No hay paneles para calcular');
    return;
  }
  
  console.log('[BUTTONS] Iniciando cálculos para', globalVars.panelesActuales.length, 'paneles');
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
    console.log('[BUTTONS] Datos transformados para API:', rows);
    
    console.log('[BUTTONS] Enviando petición POST a /api/paneles/calcular');
    const resp = await fetch('http://localhost:4008/api/paneles/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    console.log('[BUTTONS] Respuesta de cálculo recibida:', resp.status);
    const json = await resp.json();
    console.log('[BUTTONS] Resultados de cálculo:', json);
    
    if (!resp.ok || !json.ok) {
      console.log('[BUTTONS] Error en cálculo:', json.error);
      resultadosCalculo.innerHTML = `<p class="error">${json.error || 'Error en cálculo.'}</p>`;
      btnInforme.style.display = 'none';
      return;
    }
    
    console.log('[BUTTONS] Cálculos completados exitosamente');
    globalVars.resultadosActuales = json.data;
    console.log('[BUTTONS] Resultados obtenidos:', globalVars.resultadosActuales.length);
    
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
    console.log('[BUTTONS] UI de resultados actualizada');
    
    btnInforme.style.display = globalVars.resultadosActuales.length ? '' : 'none';
    console.log('[BUTTONS] Botón informe mostrado:', globalVars.resultadosActuales.length > 0);
  } catch (err) {
    console.log('[BUTTONS] Error de conexión en cálculo:', err.message);
    resultadosCalculo.innerHTML = `<p class="error">Error de conexión: ${err.message}</p>`;
    btnInforme.style.display = 'none';
  }
}

// ===== BOTÓN: GENERAR PDF =====
export async function handleGenerarPDF(elements, globalVars) {
  console.log('[BUTTONS] Botón generar informe clickeado');
  const { btnInforme } = elements;
  
  if (!globalVars.panelesActuales.length) {
    console.log('[BUTTONS] No hay paneles para generar informe');
    return;
  }
  
  console.log('[BUTTONS] Generando PDF para', globalVars.resultadosActuales.length, 'paneles');
  btnInforme.disabled = true;
  
  try {
    console.log('[BUTTONS] Enviando petición POST a /api/paneles/pdf');
    const resp = await fetch('http://localhost:4008/api/paneles/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paneles: globalVars.resultadosActuales })
    });
    console.log('[BUTTONS] Respuesta de PDF recibida:', resp.status);
    
    if (!resp.ok) {
      console.log('[BUTTONS] Error generando PDF');
      alert('Error generando el informe.');
      return;
    }
    
    console.log('[BUTTONS] PDF generado exitosamente, iniciando descarga');
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'informe_paneles.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    console.log('[BUTTONS] Descarga de PDF completada');
  } catch (err) {
    console.log('[BUTTONS] Error generando PDF:', err.message);
    alert('Error generando el informe: ' + err.message);
  } finally {
    btnInforme.disabled = false;
    console.log('[BUTTONS] Botón PDF rehabilitado');
  }
}