/**
 * reportes.js — Lógica de generación de informes (DOCX / PDF)
 */

const API_BASE_REPORT = window.location.hostname === 'localhost'
  ? 'http://localhost:4008'
  : '';

document.addEventListener('DOMContentLoaded', () => {
  const btnGenerar = document.getElementById('btnGenerarInforme');
  const inputImagen = document.getElementById('imagenInforme');
  const uploadArea = document.getElementById('imageUploadArea');
  const placeholder = document.getElementById('imagePlaceholder');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('imagePreview');
  const btnRemove = document.getElementById('btnRemoveImage');

  const inputNombreArchivo = document.getElementById('nombreArchivoInforme');
  const extensionLabel = document.getElementById('extensionInforme');
  const radiosFormato = document.querySelectorAll('input[name="formatoInforme"]');

  if (!btnGenerar) return;

  // ── Update extension label when format changes ──
  radiosFormato.forEach(radio => {
    radio.addEventListener('change', () => {
      if (extensionLabel) {
        extensionLabel.textContent = radio.value === 'pdf' ? '.pdf' : '.docx';
      }
    });
  });

  // ── Image Upload Handling ──
  let selectedImageFile = null;

  // Click to open file dialog
  if (placeholder) {
    placeholder.addEventListener('click', () => inputImagen.click());
  }

  // Drag & Drop
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleImageSelected(files[0]);
      }
    });
  }

  // File input change
  if (inputImagen) {
    inputImagen.addEventListener('change', () => {
      if (inputImagen.files.length > 0) {
        handleImageSelected(inputImagen.files[0]);
      }
    });
  }

  function handleImageSelected(file) {
    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      placeholder.style.display = 'none';
      previewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  // Remove image
  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      selectedImageFile = null;
      inputImagen.value = '';
      previewImg.src = '';
      previewContainer.style.display = 'none';
      placeholder.style.display = 'flex';
    });
  }

  // ── Collect wind table data from DOM ──
  function collectWindTableData() {
    const table = document.querySelector('#tablaResultadosViento table');
    if (!table) return null;

    const rows = table.querySelectorAll('tbody tr');
    if (!rows.length) return null;

    const tableRows = [];
    let totalVolumen = 0;
    let totalPeso = 0;
    let maxFb = 0;

    rows.forEach(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length < 20) return;

      // Extract text or input values from each cell
      const getText = (td) => {
        const input = td.querySelector('input');
        if (input) return input.value || '';
        const select = td.querySelector('select');
        if (select) return select.value || '';
        const span = td.querySelector('span.valor-calculado');
        if (span) return span.textContent.trim();
        return td.textContent.trim();
      };

      // Muro name (strip any badge text)
      const muroCell = tds[0];
      const badge = muroCell.querySelector('.badge');
      let muroName = muroCell.textContent.trim();
      if (badge) {
        muroName = muroName.replace(badge.textContent.trim(), '').trim();
      }

      const area = getText(tds[1]);
      const peso = getText(tds[2]);
      const altura = getText(tds[3]);
      const ycg = getText(tds[4]);
      const vd = getText(tds[5]);
      const qz = getText(tds[6]);
      const presion = getText(tds[7]);
      const fuerza = getText(tds[8]);
      const tipoBrace = getText(tds[9]);
      const angulo = getText(tds[10]);
      const npt = getText(tds[11]);
      const eje = getText(tds[12]);
      const factorW2 = getText(tds[13]);
      const xInserto = getText(tds[14]);
      const yInserto = getText(tds[15]);
      const longitud = getText(tds[16]);
      const fbx = getText(tds[17]);
      const fby = getText(tds[18]);
      const fb = getText(tds[19]);
      const cantCalc = getText(tds[20]);
      const cantFinal = tds[21] ? getText(tds[21]) : '';

      // Accumulate summary stats
      const pesoNum = parseFloat(peso) || 0;
      const fbNum = parseFloat(fb) || 0;
      // Volume: area * grosor (from data attribute) — we approximate from weight/density
      // Actually, volume = area * grosor, but we can get it from the row data-attributes
      // For simplicity, we'll compute volume as peso / 23.54 (concrete density kN/m³ ≈ 23.54)
      // Or better: get from the global data if available
      totalPeso += pesoNum;
      if (fbNum > maxFb) maxFb = fbNum;

      tableRows.push({
        muro: muroName, area, peso, altura, ycg,
        vd, qz, presion, fuerza,
        tipoBrace, angulo, npt, eje, factorW2,
        xInserto, yInserto, longitud,
        fbx, fby, fb, cantCalc, cantFinal
      });
    });

    // Try to get volume from globalVars if available
    if (window.globalVars && window.globalVars.resultadosTomoIII) {
      window.globalVars.resultadosTomoIII.forEach(r => {
        totalVolumen += parseFloat(r.volumen_m3 || r.volumen || 0);
      });
    } else {
      // Estimate: concrete ~23.54 kN/m³, peso is in ton (kN/9.81 ≈ ton)
      // Actually from the data: peso is displayed as ton but stored as kN
      // We'll pass what we have and let the user see the values
      totalVolumen = 0;
    }

    return {
      summary: {
        totalPaneles: tableRows.length,
        volumenTotal: totalVolumen.toFixed(2),
        pesoTotal: totalPeso.toFixed(2),
        maxGrua: maxFb.toFixed(2),
      },
      rows: tableRows,
    };
  }

  // ── Generate Report ──
  btnGenerar.addEventListener('click', async () => {
    const formato = document.querySelector('input[name="formatoInforme"]:checked')?.value;
    if (!formato) {
      alert('Selecciona un formato de salida.');
      return;
    }

    // Get project info from localStorage
    const projectConfig = localStorage.getItem('projectConfig');
    if (!projectConfig) {
      alert('No hay proyecto seleccionado. Carga un proyecto primero.');
      return;
    }

    let projectInfo;
    try {
      projectInfo = JSON.parse(projectConfig);
    } catch {
      alert('Error al leer la información del proyecto.');
      return;
    }

    // Build FormData (for multipart with optional image)
    const formData = new FormData();
    formData.append('formato', formato);
    formData.append('projectId', projectInfo.pid || projectInfo.id || '');
    formData.append('userId', projectInfo.pk_usuario || '');
    // Get creator name from dashboard header
    const creadorNombre = document.getElementById('userEmailDashboard')?.textContent || '';

    formData.append('projectInfo', JSON.stringify({
      nombre: projectInfo.nombre || '',
      empresa: projectInfo.empresa || '',
      ubicacion: projectInfo.ubicacion || document.getElementById('proyectoUbicacion')?.value || '',
      tipo_muerto: projectInfo.tipo_muerto || '',
      vel_viento: projectInfo.vel_viento || '',
      temp_promedio: projectInfo.temp_promedio || '',
      presion_atmo: projectInfo.presion_atmo || '',
      creadorProyecto: creadorNombre,
      version: projectInfo.version_proyecto || projectInfo.version || '',
    }));

    if (selectedImageFile) {
      formData.append('imagen', selectedImageFile);
    }

    // ── Collect wind results table data from DOM ──
    const windTableData = collectWindTableData();
    if (windTableData) {
      formData.append('windTableData', JSON.stringify(windTableData));
    }

    // Show progress
    btnGenerar.disabled = true;
    const originalText = btnGenerar.textContent;
    btnGenerar.textContent = 'Generando...';

    const progressIndicator = document.createElement('div');
    progressIndicator.style.cssText = 'position:fixed;top:20px;right:20px;background:#007acc;color:white;padding:15px;border-radius:8px;z-index:10000;';
    progressIndicator.textContent = `Generando informe ${formato.toUpperCase()}...`;
    document.body.appendChild(progressIndicator);

    try {
      const resp = await fetch(`${API_BASE_REPORT}/api/reportes/generar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error en el servidor');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = formato === 'docx' ? 'docx' : 'pdf';
      const customName = (inputNombreArchivo?.value || '').trim();
      const baseName = customName
        ? customName.replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*]/g, '_')
        : `informe_${(projectInfo.nombre || 'proyecto').replace(/\s+/g, '_')}`;
      a.download = `${baseName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[reportes] Error generando informe:', err);
      alert('Error generando informe: ' + err.message);
    } finally {
      progressIndicator.remove();
      btnGenerar.disabled = false;
      btnGenerar.textContent = originalText;
    }
  });
});
