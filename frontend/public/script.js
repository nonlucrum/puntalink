document.addEventListener('DOMContentLoaded', () => {
  const txtInput = document.getElementById('txtInput');
  const btnUploadTxt = document.getElementById('btnUploadTxt');
  const btnClearTxt = document.getElementById('btnClearTxt');
  const tablaPaneles = document.getElementById('tablaPaneles');
  const btnCalcular = document.getElementById('btnCalcular');
  const btnInforme = document.getElementById('btnInforme');
  const resultadosCalculo = document.getElementById('resultadosCalculo');

  let panelesActuales = [];
  let resultadosActuales = [];

  // Mostrar el botón cancelar cuando se selecciona archivo y validar formato
  if (txtInput) {
    txtInput.addEventListener('change', () => {
      console.log('[FRONTEND] Archivo seleccionado');
      const hasFile = txtInput.files.length > 0;
      btnClearTxt.style.display = hasFile ? '' : 'none';
      
      if (hasFile) {
        const file = txtInput.files[0];
        console.log('[FRONTEND] Archivo:', file.name, 'Tamaño:', file.size, 'bytes');
        // Validar que el archivo sea .txt
        if (!file.name.toLowerCase().endsWith('.txt')) {
          console.log('[FRONTEND] Error: Archivo no es .txt');
          tablaPaneles.innerHTML = '<p class="error">Archivo no válido, solo debe subir archivos .txt</p>';
          btnUploadTxt.disabled = true;
          btnUploadTxt.style.opacity = '0.5';
          return;
        } else {
          console.log('[FRONTEND] Archivo .txt válido');
          // Archivo válido
          tablaPaneles.innerHTML = '';
          btnUploadTxt.disabled = false;
          btnUploadTxt.style.opacity = '1';
        }
      } else {
        console.log('[FRONTEND] No hay archivo seleccionado');
        // No hay archivo seleccionado
        tablaPaneles.innerHTML = '';
        btnUploadTxt.disabled = false;
        btnUploadTxt.style.opacity = '1';
      }
    });
  }

  // Subir y procesar TXT
  if (btnUploadTxt && txtInput) {
    btnUploadTxt.addEventListener('click', async () => {
      console.log('[FRONTEND] Botón subir TXT clickeado');
      if (!txtInput.files.length) {
        console.log('[FRONTEND] No hay archivos seleccionados');
        return;
      }
      const file = txtInput.files[0];
      console.log('[FRONTEND] Preparando subida de archivo:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);

      tablaPaneles.innerHTML = 'Procesando...';
      resultadosCalculo.innerHTML = '';
      btnCalcular.style.display = 'none';
      btnInforme.style.display = 'none';
      console.log('[FRONTEND] UI actualizada, enviando petición al servidor');

      try {
        console.log('[FRONTEND] Enviando petición POST a /api/importar-muros');
        const resp = await fetch('http://localhost:4008/api/importar-muros', {
          method: 'POST',
          body: formData
        });
        console.log('[FRONTEND] Respuesta recibida:', resp.status, resp.statusText);
        const json = await resp.json();
        console.log('[FRONTEND] JSON parseado:', json);
        if (!resp.ok || !json.ok) {
          console.log('[FRONTEND] Error en la respuesta:', json.error);
          tablaPaneles.innerHTML = `<p class="error">${json.error || 'Error procesando el TXT.'}</p>`;
          return;
        }
        console.log('[FRONTEND] Archivo procesado exitosamente');
        panelesActuales = json.paneles;
        console.log('[FRONTEND] Paneles obtenidos:', panelesActuales.length);
        // Mostrar tabla de paneles
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
        console.log('[FRONTEND] Tabla de paneles generada');
        btnCalcular.style.display = panelesActuales.length ? '' : 'none';
        btnInforme.style.display = 'none';
        console.log('[FRONTEND] Botón calcular mostrado:', panelesActuales.length > 0);
      } catch (err) {
        console.log('[FRONTEND] Error de conexión:', err.message);
        tablaPaneles.innerHTML = `<p class="error">Error procesando el TXT: ${err.message}</p>`;
      }
    });

    // Botón cancelar selección
    if (btnClearTxt) {
      btnClearTxt.addEventListener('click', () => {
        try {
          fetch('http://localhost:4008/api/cancelar-import', { method: 'DELETE' });
        
        if (txtInput) txtInput.value = '';
        tablaPaneles.innerHTML = '';
        resultadosCalculo.innerHTML = '';
        btnCalcular.style.display = 'none';
        btnInforme.style.display = 'none';
        btnClearTxt.style.display = 'none';
        panelesActuales = [];
        resultadosActuales = [];
        } catch (err) {
          tablaPaneles.innerHTML = `<p class="error">Error eliminando el TXT: ${err.message}</p>`;
        }
      });
    }
  }

  // Calcular paneles
  if (btnCalcular) {
    btnCalcular.addEventListener('click', async () => {
      console.log('[FRONTEND] Botón calcular clickeado');
      if (!panelesActuales.length) {
        console.log('[FRONTEND] No hay paneles para calcular');
        return;
      }
      console.log('[FRONTEND] Iniciando cálculos para', panelesActuales.length, 'paneles');
      resultadosCalculo.innerHTML = 'Calculando...';
      try {
        // Transformar datos para la nueva API
        const rows = panelesActuales.map(p => ({
          idMuro: p.id_muro,
          grosor_mm: p.grosor * 1000, // convertir metros a milímetros
          area_m2: p.area
        }));
        console.log('[FRONTEND] Datos transformados para API:', rows);
        
        console.log('[FRONTEND] Enviando petición POST a /api/paneles/calcular');
        const resp = await fetch('http://localhost:4008/api/paneles/calcular', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows })
        });
        console.log('[FRONTEND] Respuesta de cálculo recibida:', resp.status);
        const json = await resp.json();
        console.log('[FRONTEND] Resultados de cálculo:', json);
        if (!resp.ok || !json.ok) {
          console.log('[FRONTEND] Error en cálculo:', json.error);
          resultadosCalculo.innerHTML = `<p class="error">${json.error || 'Error en cálculo.'}</p>`;
          btnInforme.style.display = 'none';
          return;
        }
        console.log('[FRONTEND] Cálculos completados exitosamente');
        resultadosActuales = json.data;
        console.log('[FRONTEND] Resultados obtenidos:', resultadosActuales.length);
        let html = "<h3>Resultados de cálculo</h3>";
        html += "<div class='kpis'>";
        resultadosActuales.forEach((res, i) => {
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
        console.log('[FRONTEND] UI de resultados actualizada');
        btnInforme.style.display = resultadosActuales.length ? '' : 'none';
        console.log('[FRONTEND] Botón informe mostrado:', resultadosActuales.length > 0);
      } catch (err) {
        console.log('[FRONTEND] Error de conexión en cálculo:', err.message);
        resultadosCalculo.innerHTML = `<p class="error">Error de conexión: ${err.message}</p>`;
        btnInforme.style.display = 'none';
      }
    });
  }

  // Generar informe PDF
  if (btnInforme) {
    btnInforme.addEventListener('click', async () => {
      console.log('[FRONTEND] Botón generar informe clickeado');
      if (!panelesActuales.length) {
        console.log('[FRONTEND] No hay paneles para generar informe');
        return;
      }
      console.log('[FRONTEND] Generando PDF para', resultadosActuales.length, 'paneles');
      btnInforme.disabled = true;
      try {
        console.log('[FRONTEND] Enviando petición POST a /api/paneles/pdf');
        const resp = await fetch('http://localhost:4008/api/paneles/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paneles: resultadosActuales })
        });
        console.log('[FRONTEND] Respuesta de PDF recibida:', resp.status);
        if (!resp.ok) {
          console.log('[FRONTEND] Error generando PDF');
          alert('Error generando el informe.');
          btnInforme.disabled = false;
          return;
        }
        console.log('[FRONTEND] PDF generado exitosamente, iniciando descarga');
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'informe_paneles.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        console.log('[FRONTEND] Descarga de PDF completada');
      } catch (err) {
        console.log('[FRONTEND] Error generando PDF:', err.message);
        alert('Error generando el informe: ' + err.message);
      } finally {
        btnInforme.disabled = false;
        console.log('[FRONTEND] Botón PDF rehabilitado');
      }
    });
  }
});