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

  // ── Collect cylindrical deadman data from DOM ──
  function collectCilindricoData() {
    const container = document.getElementById('containerTablasCilindrico');
    const resumenContainer = document.getElementById('resumenCilindricoContainer');
    if (!container) return null;

    // Configuration values
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? (el.value || '') : '';
    };
    const config = {
      densidad: getVal('cil_densidad_concreto'),
      desperdicio: getVal('cil_desperdicio'),
      cantVert: getVal('cil_cant_vert'),
      tipoVert: getVal('cil_tipo_vert'),
      tipoAnillo: getVal('cil_tipo_anillo'),
      modoAnillos: getVal('cil_modo_anillos'),
      datoAnillos: getVal('cil_dato_anillos'),
    };

    // Per-diameter tables
    const tables = [];
    const details = container.querySelectorAll('.cilindrico-detail');
    details.forEach(detail => {
      const header = detail.querySelector('.cilindrico-detail-header');
      const diametro = header ? header.textContent.trim() : '';
      const table = detail.querySelector('table');
      if (!table) return;

      const rows = [];
      table.querySelectorAll('tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length < 7) return;
        rows.push({
          muro: tds[0].textContent.trim(),
          x: tds[1].textContent.trim(),
          cantMuertos: tds[2].textContent.trim(),
          altura: tds[3].textContent.trim(),
          concreto: tds[4].textContent.trim(),
          aceroVarillas: tds[5].textContent.trim(),
          aceroAnillos: tds[6].textContent.trim(),
        });
      });

      if (rows.length > 0) {
        tables.push({ diametro, rows });
      }
    });

    // If no per-diameter tables, try the static table
    if (tables.length === 0) {
      const staticTable = document.getElementById('tablaInputsCilindrico');
      if (staticTable) {
        const rows = [];
        staticTable.querySelectorAll('tbody tr').forEach(tr => {
          const tds = tr.querySelectorAll('td');
          if (tds.length < 7) return;
          rows.push({
            muro: tds[0].textContent.trim(),
            x: tds[1].textContent.trim(),
            cantMuertos: tds[2].textContent.trim(),
            altura: tds[3].textContent.trim(),
            concreto: tds[4].textContent.trim(),
            aceroVarillas: tds[5].textContent.trim(),
            aceroAnillos: tds[6].textContent.trim(),
          });
        });
        if (rows.length > 0) {
          tables.push({ diametro: 'General', rows });
        }
      }
    }

    if (tables.length === 0) return null;

    // Summary table
    const summary = { diameters: [], materiales: [] };
    if (resumenContainer && resumenContainer.style.display !== 'none') {
      const resumenTable = document.getElementById('tablaResumenCilindrico');
      if (resumenTable) {
        // Header row 2 has diameters
        const headerRows = resumenTable.querySelectorAll('thead tr');
        if (headerRows.length >= 2) {
          headerRows[1].querySelectorAll('th').forEach((th, i) => {
            if (i > 0) summary.diameters.push(th.textContent.trim());
          });
        }
        // Body rows have material totals
        resumenTable.querySelectorAll('tbody tr').forEach(tr => {
          const tds = tr.querySelectorAll('td');
          if (tds.length < 2) return;
          const label = tds[0].textContent.trim();
          const values = [];
          for (let i = 1; i < tds.length; i++) {
            values.push(tds[i].textContent.trim());
          }
          summary.materiales.push({ label, values });
        });
      }
    }

    return { config, tables, summary };
  }

  // ── Collect rectangular deadman data from DOM ──
  function collectRectangularData() {
    const result = {};

    // Helper: scrape any table into { headers, rows }
    function scrapeTable(tableEl) {
      if (!tableEl) return null;
      const headers = [];
      const thRow = tableEl.querySelector('thead tr:last-child') || tableEl.querySelector('thead tr');
      if (thRow) {
        thRow.querySelectorAll('th').forEach(th => headers.push(th.textContent.trim()));
      }
      const rows = [];
      tableEl.querySelectorAll('tbody tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('td').forEach(td => {
          const input = td.querySelector('input');
          cells.push(input ? input.value : td.textContent.trim());
        });
        if (cells.length > 0 && cells.some(c => c !== '')) rows.push(cells);
      });
      return (rows.length > 0) ? { headers, rows } : null;
    }

    // 1. Grouped walls table (#tablaMuertosTable)
    const muertosTable = document.getElementById('tablaMuertosTable');
    if (muertosTable) {
      result.gruposMuertos = scrapeTable(muertosTable);
    }

    // 2. Sequential groups debug table (inside #muertosDebugOutput)
    const debugOut = document.getElementById('muertosDebugOutput');
    if (debugOut) {
      const debugTable = debugOut.querySelector('table');
      if (debugTable) {
        result.gruposSecuenciales = scrapeTable(debugTable);
      }
    }

    // 3. Config groups table (inside #configGruposContainer)
    const configContainer = document.getElementById('configGruposContainer');
    if (configContainer) {
      const configTable = configContainer.querySelector('table');
      if (configTable) {
        result.configGrupos = scrapeTable(configTable);
      }
    }

    // 4. Configuración Global (inputs from .configuracion-global in armado-section)
    const armadoSection = document.getElementById('armado-section');
    if (armadoSection) {
      const getVal = (id) => {
        const el = document.getElementById(id);
        if (!el) return '';
        if (el.tagName === 'SELECT') {
          return el.options[el.selectedIndex]?.text || el.value || '';
        }
        return el.value || '';
      };
      result.configGlobal = {
        varillasLong: {
          tipo: getVal('tipoVarillaLongitudinal'),
          recubrimiento: getVal('recubrimientoLongitudinal'),
          superiores: getVal('cantVarillasSuperior'),
          medias: getVal('cantVarillasMedias') || 'Auto',
          inferiores: getVal('cantVarillasInferior'),
        },
        varillasTrans: {
          tipo: getVal('tipoVarillaTransversal'),
          recubrimiento: getVal('recubrimientoTransversal'),
          ganchos: getVal('longGanchoEstribo'),
        },
        construccion: {
          resistenciaConcreto: getVal('tipoConcreto'),
          factorDesperdicio: getVal('factorDesperdicio'),
        },
        alambre: {
          diametro: getVal('diametroAlambre'),
          longitudVuelta: getVal('longitudVuelta'),
          factorDesperdicio: getVal('factorDesperdicioAlambre'),
        },
      };
    }

    // 5. Config por Muerto table (#tablaInfoMuertos)
    const infoMuertosTable = document.getElementById('tablaInfoMuertos');
    if (infoMuertosTable) {
      result.infoMuertos = scrapeTable(infoMuertosTable);
    }

    // 5. Armado rectangular results (#tablaArmadoResultados)
    const armadoTable = document.getElementById('tablaArmadoResultados');
    if (armadoTable && armadoTable.style.display !== 'none') {
      const armadoGrupos = [];
      const bodyRows = armadoTable.querySelectorAll('tbody tr');
      // Each group = 2 consecutive rows (row1 has rowspan=2 cells, row2 has acero transversal)
      for (let i = 0; i < bodyRows.length; i += 2) {
        const row1 = bodyRows[i];
        const row2 = bodyRows[i + 1];
        if (!row1) break;
        const tds1 = row1.querySelectorAll('td');
        // Row1: [#, Eje, Muros, Largo, Alto, Ancho, AceroTipo, AceroLong, AceroPeso, AceroDir, ConcVol, ConcPeso, AlamLong, AlamPeso]
        if (tds1.length < 14) continue;
        const grupo = {
          numero: tds1[0].textContent.trim(),
          eje: tds1[1].textContent.trim(),
          muros: tds1[2].textContent.trim(),
          largo: tds1[3].textContent.trim(),
          alto: tds1[4].textContent.trim(),
          ancho: tds1[5].textContent.trim(),
          aceroLongTipo: tds1[6].textContent.trim(),
          aceroLongLong: tds1[7].textContent.trim(),
          aceroLongPeso: tds1[8].textContent.trim(),
          concretoVol: tds1[10].textContent.trim(),
          concretoPeso: tds1[11].textContent.trim(),
          alambreLong: tds1[12].textContent.trim(),
          alambrePeso: tds1[13].textContent.trim(),
          aceroTransTipo: '',
          aceroTransLong: '',
          aceroTransPeso: '',
        };
        if (row2) {
          const tds2 = row2.querySelectorAll('td');
          if (tds2.length >= 3) {
            grupo.aceroTransTipo = tds2[0].textContent.trim();
            grupo.aceroTransLong = tds2[1].textContent.trim();
            grupo.aceroTransPeso = tds2[2].textContent.trim();
          }
        }
        armadoGrupos.push(grupo);
      }
      // Footer totals
      const footerRow = armadoTable.querySelector('tfoot tr');
      let totales = null;
      if (footerRow) {
        const ftds = footerRow.querySelectorAll('td');
        if (ftds.length >= 14) {
          totales = {
            aceroTotal: ftds[8].textContent.trim(),
            concretoVol: ftds[10].textContent.trim(),
            concretoPeso: ftds[11].textContent.trim(),
            alambreLong: ftds[12].textContent.trim(),
            alambrePeso: ftds[13].textContent.trim(),
          };
        }
      }
      if (armadoGrupos.length > 0) {
        result.armadoResultados = { grupos: armadoGrupos, totales };
      }
    }

    // 6. Resumen de totales (totalConcreto, totalAcero, totalAlambre, totalMetal)
    const totalConcreto = document.getElementById('totalConcreto')?.textContent?.trim();
    const totalAcero = document.getElementById('totalAcero')?.textContent?.trim();
    const totalAlambre = document.getElementById('totalAlambre')?.textContent?.trim();
    const totalMetal = document.getElementById('totalMetal')?.textContent?.trim();
    if (totalConcreto || totalAcero || totalAlambre || totalMetal) {
      result.resumenTotales = {
        concreto: totalConcreto || '—',
        acero: totalAcero || '—',
        alambre: totalAlambre || '—',
        metal: totalMetal || '—',
      };
    }

    // Return null if nothing collected
    if (!result.gruposMuertos && !result.configGrupos && !result.armadoResultados) return null;
    return result;
  }

  // ── Collect triangular deadman data from DOM ──
  function collectTriangularData() {
    const result = {};

    // Helper: scrape any table into { headers, rows }
    function scrapeTable(tableEl) {
      if (!tableEl) return null;
      const headers = [];
      const thRow = tableEl.querySelector('thead tr:last-child') || tableEl.querySelector('thead tr');
      if (thRow) {
        thRow.querySelectorAll('th').forEach(th => headers.push(th.textContent.trim()));
      }
      const rows = [];
      tableEl.querySelectorAll('tbody tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('td').forEach(td => {
          const inp = td.querySelector('input');
          cells.push(inp ? inp.value.trim() : td.textContent.trim());
        });
        if (cells.length > 0) rows.push(cells);
      });
      if (headers.length === 0 && rows.length === 0) return null;
      return { headers, rows };
    }

    // 1. Grouped walls table (#tablaMuertosTable)
    const muertosTable = document.getElementById('tablaMuertosTable');
    if (muertosTable) {
      result.gruposMuertos = scrapeTable(muertosTable);
    }

    // 2. Sequential groups debug table
    const debugOut = document.getElementById('muertosDebugOutput');
    if (debugOut) {
      const debugTable = debugOut.querySelector('table');
      if (debugTable) {
        result.gruposSecuenciales = scrapeTable(debugTable);
      }
    }

    // 3. Config groups table (#configGruposContainer)
    const configContainer = document.getElementById('configGruposContainer');
    if (configContainer) {
      const configTable = configContainer.querySelector('table');
      if (configTable) {
        result.configGrupos = scrapeTable(configTable);
      }
    }

    // 4. Configuración Global (inputs from .configuracion-global in armado-triangular-section)
    const triSection = document.getElementById('armado-triangular-section');
    if (triSection) {
      const getVal = (id) => {
        const el = document.getElementById(id);
        if (!el) return '';
        if (el.tagName === 'SELECT') {
          return el.options[el.selectedIndex]?.text || el.value || '';
        }
        return el.value || '';
      };
      result.configGlobal = {
        geometria: {
          base: getVal('tri_base'),
          cantVarillasLong: getVal('tri_cant_long'),
        },
        varillasLong: {
          tipo: getVal('tri_tipoVarillaLongitudinal'),
        },
        varillasTrans: {
          tipo: getVal('tri_tipoVarillaTransversal'),
          recubrimiento: getVal('tri_recubrimientoTransversal'),
          separacion: getVal('tri_separacionTransversal'),
          ganchos: getVal('tri_longGanchoEstribo'),
        },
        construccion: {
          resistenciaConcreto: getVal('tri_tipoConcreto'),
          factorDesperdicio: getVal('tri_factorDesperdicio'),
        },
        alambre: {
          diametro: getVal('tri_diametroAlambre'),
          longitudVuelta: getVal('tri_longitudVuelta'),
          factorDesperdicio: getVal('tri_factorDesperdicioAlambre'),
        },
      };
    }

    // 5. Armado Triangular results (#tablaTriangular) - paired rows like rectangular
    const armadoTable = document.getElementById('tablaTriangular');
    if (armadoTable && armadoTable.querySelector('tbody tr')) {
      const armadoGrupos = [];
      const bodyRows = armadoTable.querySelectorAll('tbody tr');
      for (let i = 0; i < bodyRows.length; i += 2) {
        const row1 = bodyRows[i];
        const row2 = bodyRows[i + 1];
        if (!row1) break;
        const tds1 = row1.querySelectorAll('td');
        if (tds1.length < 12) continue;
        const grupo = {
          numero: tds1[0].textContent.trim(),
          eje: tds1[1].textContent.trim(),
          muros: tds1[2].textContent.trim(),
          dimensiones: tds1[3].textContent.trim(),
          aceroLongTipo: tds1[4].textContent.trim(),
          aceroLongLong: tds1[5].textContent.trim(),
          aceroLongPeso: tds1[6].textContent.trim(),
          concretoVol: tds1[8].textContent.trim(),
          concretoPeso: tds1[9].textContent.trim(),
          alambreLong: tds1[10].textContent.trim(),
          alambrePeso: tds1[11].textContent.trim(),
          aceroTransTipo: '',
          aceroTransLong: '',
          aceroTransPeso: '',
        };
        if (row2) {
          const tds2 = row2.querySelectorAll('td');
          if (tds2.length >= 3) {
            grupo.aceroTransTipo = tds2[0].textContent.trim();
            grupo.aceroTransLong = tds2[1].textContent.trim();
            grupo.aceroTransPeso = tds2[2].textContent.trim();
          }
        }
        armadoGrupos.push(grupo);
      }

      // Footer totals (tfoot uses colspan so indices differ)
      const footerRow = armadoTable.querySelector('tfoot tr');
      let totales = null;
      if (footerRow) {
        const ftds = footerRow.querySelectorAll('td');
        if (ftds.length >= 8) {
          totales = {
            aceroTotal: ftds[2].textContent.trim(),
            concretoVol: ftds[4].textContent.trim(),
            concretoPeso: ftds[5].textContent.trim(),
            alambreLong: ftds[6].textContent.trim(),
            alambrePeso: ftds[7].textContent.trim(),
          };
        }
      }

      if (armadoGrupos.length > 0) {
        result.armadoResultados = { grupos: armadoGrupos, totales };
      }
    }

    // 6. Summary totals (shared elements)
    const totalConcreto = document.getElementById('totalConcreto')?.textContent?.trim();
    const totalAcero = document.getElementById('totalAcero')?.textContent?.trim();
    const totalAlambre = document.getElementById('totalAlambre')?.textContent?.trim();
    const totalMetal = document.getElementById('totalMetal')?.textContent?.trim();
    if (totalConcreto || totalAcero || totalAlambre || totalMetal) {
      result.resumenTotales = {
        concreto: totalConcreto || '—',
        acero: totalAcero || '—',
        alambre: totalAlambre || '—',
        metal: totalMetal || '—',
      };
    }

    // Return null if nothing collected
    if (!result.gruposMuertos && !result.configGrupos && !result.armadoResultados) return null;
    return result;
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

    // ── Collect cylindrical deadman data if applicable ──
    if ((projectInfo.tipo_muerto || '').toLowerCase() === 'cilindrico') {
      const cilData = collectCilindricoData();
      if (cilData) {
        formData.append('cilindricoData', JSON.stringify(cilData));
      }
    }

    // ── Collect rectangular deadman data if applicable ──
    if ((projectInfo.tipo_muerto || '').toLowerCase() === 'corrido') {
      const rectData = collectRectangularData();
      if (rectData) {
        formData.append('rectangularData', JSON.stringify(rectData));
      }
    }

    // ── Collect triangular deadman data if applicable ──
    if ((projectInfo.tipo_muerto || '').toLowerCase() === 'triangular') {
      const triData = collectTriangularData();
      if (triData) {
        formData.append('triangularData', JSON.stringify(triData));
      }
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
