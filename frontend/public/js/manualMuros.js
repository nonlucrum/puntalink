/**
 * MÓDULO DE MUROS MANUALES
 * Permite agregar, editar, eliminar y reordenar muros manualmente.
 */

(function() {
  'use strict';

  const API_BASE =
    window.location.hostname === 'localhost'
      ? 'http://localhost:4008'
      : '';

  // ===== INICIALIZACIÓN =====
  document.addEventListener('DOMContentLoaded', () => {
    initManualMuros();
  });

  function initManualMuros() {
    // Botón agregar muro
    const btnAdd = document.getElementById('btnAddManualMuro');
    if (btnAdd) btnAdd.addEventListener('click', handleAddManualMuro);

    // Botón limpiar formulario
    const btnClear = document.getElementById('btnClearManualForm');
    if (btnClear) btnClear.addEventListener('click', clearManualForm);

    // Selector de posición: mostrar/ocultar referencia
    const posSelect = document.getElementById('manual_position');
    if (posSelect) {
      posSelect.addEventListener('change', () => {
        const refRow = document.getElementById('manual_reference_row');
        if (posSelect.value === 'after' || posSelect.value === 'before') {
          refRow.style.display = '';
          populateReferenceSelect();
        } else {
          refRow.style.display = 'none';
        }
      });
    }

    // Cargar muros existentes al inicio
    setTimeout(() => refreshMurosTable(), 500);
  }

  // ===== VALIDACIÓN DEL FORMULARIO =====
  function validateMuroForm() {
    const errors = [];
    const data = {};

    // Campos obligatorios texto
    const id_muro = document.getElementById('manual_id_muro')?.value?.trim();
    if (!id_muro) {
      errors.push('El nombre/ID del muro es obligatorio');
      markFieldError('manual_id_muro', true);
    } else {
      markFieldError('manual_id_muro', false);
      data.id_muro = id_muro;
    }

    // Tipo de construcción
    data.tipo_construccion = document.getElementById('manual_tipo_construccion')?.value || 'TILT-UP';

    // Campos numéricos obligatorios
    const requiredNumeric = [
      { id: 'manual_grosor', key: 'grosor', label: 'Grosor' },
      { id: 'manual_area', key: 'area', label: 'Área' },
      { id: 'manual_peso', key: 'peso', label: 'Peso' },
      { id: 'manual_volumen', key: 'volumen', label: 'Volumen' },
      { id: 'manual_overall_height', key: 'overall_height', label: 'Alto (Overall Height)', isString: true },
    ];

    for (const field of requiredNumeric) {
      const val = document.getElementById(field.id)?.value?.trim();
      if (!val || isNaN(Number(val)) || Number(val) <= 0) {
        errors.push(`${field.label} debe ser un número positivo`);
        markFieldError(field.id, true);
      } else {
        markFieldError(field.id, false);
        data[field.key] = field.isString ? val : Number(val);
      }
    }

    // Campos numéricos opcionales
    const optionalNumeric = [
      { id: 'manual_overall_width', key: 'overall_width', label: 'Ancho (Overall Width)', isString: true },
      { id: 'manual_cgx', key: 'cgx', label: 'CGx' },
      { id: 'manual_cgy', key: 'cgy', label: 'CGy' },
    ];

    for (const field of optionalNumeric) {
      const val = document.getElementById(field.id)?.value?.trim();
      if (val && val !== '') {
        if (isNaN(Number(val))) {
          errors.push(`${field.label} debe ser numérico`);
          markFieldError(field.id, true);
        } else {
          markFieldError(field.id, false);
          data[field.key] = field.isString ? val : Number(val);
        }
      } else {
        markFieldError(field.id, false);
        if (field.isString) data[field.key] = 'S/N';
      }
    }

    // Posición
    const position = {
      position: document.getElementById('manual_position')?.value || 'end'
    };
    if (position.position === 'after' || position.position === 'before') {
      const refPid = document.getElementById('manual_reference_pid')?.value;
      if (!refPid) {
        errors.push('Debe seleccionar un muro de referencia');
      } else {
        position.reference_pid = Number(refPid);
      }
    }

    return { valid: errors.length === 0, errors, data, position };
  }

  function markFieldError(fieldId, isError) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    if (isError) {
      el.style.borderColor = '#e74c3c';
      el.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.2)';
    } else {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }
  }

  // ===== AGREGAR MURO MANUAL =====
  async function handleAddManualMuro() {
    const validation = validateMuroForm();
    if (!validation.valid) {
      window.showNotification('error', 'Campos inválidos', validation.errors.join('<br>'), 6000);
      return;
    }

    const projectConfig = JSON.parse(localStorage.getItem('projectConfig') || '{}');
    if (!projectConfig.pid) {
      window.showNotification('error', 'Sin proyecto', 'Debe seleccionar o crear un proyecto primero.', 5000);
      return;
    }

    const btnAdd = document.getElementById('btnAddManualMuro');
    if (btnAdd) {
      btnAdd.disabled = true;
      btnAdd.textContent = 'Guardando...';
    }

    try {
      const response = await fetch(`${API_BASE}/api/muros/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pk_proyecto: projectConfig.pid,
          muro: validation.data,
          position: validation.position
        })
      });

      const json = await response.json();
      if (json.ok) {
        window.showNotification('success', 'Muro agregado', `Muro "${validation.data.id_muro}" agregado correctamente.`);
        clearManualForm();
        await refreshMurosTable();
        enableCalculationSections();
      } else {
        const errorMsg = json.details
          ? json.details.map(d => `${d.campo}: ${d.mensaje}`).join('<br>')
          : json.error;
        window.showNotification('error', 'Error al guardar', errorMsg, 6000);
      }
    } catch (error) {
      window.showNotification('error', 'Error de conexión', error.message, 5000);
    } finally {
      if (btnAdd) {
        btnAdd.disabled = false;
        btnAdd.textContent = 'Agregar Muro';
      }
    }
  }

  // ===== EDITAR MURO MANUAL =====
  function fillFormForEdit(muro) {
    document.getElementById('manual_id_muro').value = muro.id_muro || '';
    document.getElementById('manual_tipo_construccion').value = muro.tipo_construccion || 'TILT-UP';
    document.getElementById('manual_grosor').value = muro.grosor || '';
    document.getElementById('manual_area').value = muro.area || '';
    document.getElementById('manual_peso').value = muro.peso || '';
    document.getElementById('manual_volumen').value = muro.volumen || '';
    document.getElementById('manual_overall_width').value = (muro.overall_width && muro.overall_width !== 'S/N') ? muro.overall_width : '';
    document.getElementById('manual_overall_height').value = (muro.overall_height && muro.overall_height !== 'S/N') ? muro.overall_height : '';
    document.getElementById('manual_cgx').value = muro.cgx || '';
    document.getElementById('manual_cgy').value = muro.cgy || '';

    // Cambiar botón a modo edición
    const btnAdd = document.getElementById('btnAddManualMuro');
    btnAdd.textContent = 'Guardar Cambios';
    btnAdd.dataset.editPid = muro.pid;
    btnAdd.removeEventListener('click', handleAddManualMuro);
    btnAdd.addEventListener('click', handleUpdateManualMuro);

    // Scroll al formulario
    document.getElementById('formManualMuro').scrollIntoView({ behavior: 'smooth' });
  }

  async function handleUpdateManualMuro() {
    const btnAdd = document.getElementById('btnAddManualMuro');
    const pid = Number(btnAdd.dataset.editPid);
    if (!pid) return;

    const validation = validateMuroForm();
    if (!validation.valid) {
      window.showNotification('error', 'Campos inválidos', validation.errors.join('<br>'), 6000);
      return;
    }

    const projectConfig = JSON.parse(localStorage.getItem('projectConfig') || '{}');

    btnAdd.disabled = true;
    btnAdd.textContent = 'Guardando...';

    try {
      const response = await fetch(`${API_BASE}/api/muros/manual/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pk_proyecto: projectConfig.pid,
          muro: validation.data
        })
      });

      const json = await response.json();
      if (json.ok) {
        window.showNotification('success', 'Muro actualizado', `Muro "${validation.data.id_muro}" actualizado correctamente.`);
        exitEditMode();
        await refreshMurosTable();
      } else {
        window.showNotification('error', 'Error al actualizar', json.error, 6000);
      }
    } catch (error) {
      window.showNotification('error', 'Error de conexión', error.message, 5000);
    } finally {
      btnAdd.disabled = false;
    }
  }

  function exitEditMode() {
    const btnAdd = document.getElementById('btnAddManualMuro');
    btnAdd.textContent = 'Agregar Muro';
    delete btnAdd.dataset.editPid;
    btnAdd.removeEventListener('click', handleUpdateManualMuro);
    btnAdd.addEventListener('click', handleAddManualMuro);
    clearManualForm();
  }

  // ===== ELIMINAR MURO =====
  async function handleDeleteMuro(pid) {
    if (!confirm('¿Está seguro de que desea eliminar este muro?')) return;

    const projectConfig = JSON.parse(localStorage.getItem('projectConfig') || '{}');

    try {
      const response = await fetch(`${API_BASE}/api/muros/manual/${pid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pk_proyecto: projectConfig.pid })
      });

      const json = await response.json();
      if (json.ok) {
        window.showNotification('success', 'Muro eliminado', 'El muro ha sido eliminado correctamente.');
        await refreshMurosTable();
      } else {
        window.showNotification('error', 'Error al eliminar', json.error, 5000);
      }
    } catch (error) {
      window.showNotification('error', 'Error de conexión', error.message, 5000);
    }
  }

  // ===== REORDENAR MUROS =====
  async function handleMoveMuro(pid, direction) {
    const projectConfig = JSON.parse(localStorage.getItem('projectConfig') || '{}');
    const muros = window._murosProyecto || [];

    const idx = muros.findIndex(m => m.pid === pid);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= muros.length) return;

    // Intercambiar posiciones
    const ordering = muros.map((m, i) => ({ pid: m.pid, num: m.num }));
    const tempNum = ordering[idx].num;
    ordering[idx].num = ordering[targetIdx].num;
    ordering[targetIdx].num = tempNum;

    try {
      const response = await fetch(`${API_BASE}/api/muros/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pk_proyecto: projectConfig.pid,
          ordering: ordering
        })
      });

      const json = await response.json();
      if (json.ok) {
        await refreshMurosTable();
      } else {
        window.showNotification('error', 'Error al reordenar', json.error, 5000);
      }
    } catch (error) {
      window.showNotification('error', 'Error de conexión', error.message, 5000);
    }
  }

  // ===== CARGAR Y RENDERIZAR TABLA DE MUROS =====
  async function refreshMurosTable() {
    const projectConfig = JSON.parse(localStorage.getItem('projectConfig') || '{}');
    if (!projectConfig.pid) return;

    try {
      const response = await fetch(`${API_BASE}/api/muros/project/${projectConfig.pid}`, {
        credentials: 'include'
      });
      const json = await response.json();

      if (json.ok) {
        window._murosProyecto = json.muros;
        renderMurosTable(json.muros);
        populateReferenceSelect();

        // Actualizar globalVars para que los cálculos los vean
        if (window.globalVars) {
          window.globalVars.panelesActuales = json.muros;
        }

        // Habilitar secciones de cálculo si hay muros
        if (json.muros.length > 0) {
          enableCalculationSections();
        }
      }
    } catch (error) {
      console.error('[MANUAL_MUROS] Error cargando muros:', error);
    }
  }

  function renderMurosTable(muros) {
    const container = document.getElementById('tablaMurosContainer');
    const counter = document.getElementById('contadorMuros');

    if (!container) return;

    if (!muros || muros.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); font-style: italic;">No hay muros en este proyecto. Importe un archivo TXT o agregue muros manualmente.</p>';
      if (counter) counter.textContent = '';
      return;
    }

    const txtCount = muros.filter(m => m.origen === 'TXT').length;
    const manualCount = muros.filter(m => m.origen === 'MANUAL').length;
    if (counter) {
      counter.textContent = `Total: ${muros.length} muros (${txtCount} importados, ${manualCount} manuales)`;
    }

    let html = `
      <div style="overflow-x: auto;">
        <table class="results-table" style="width: 100%; font-size: 0.85rem;">
          <thead>
            <tr>
              <th style="width: 50px;">Orden</th>
              <th style="width: 50px;">N°</th>
              <th>ID Muro</th>
              <th>Origen</th>
              <th>Tipo</th>
              <th>Grosor (mm)</th>
              <th>Área (m²)</th>
              <th>Peso (ton)</th>
              <th>Vol (m³)</th>
              <th>Ancho (m)</th>
              <th>Alto (m)</th>
              <th style="width: 130px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    muros.forEach((muro, idx) => {
      const isManual = muro.origen === 'MANUAL';
      const badgeClass = isManual ? 'badge-origen--manual' : 'badge-origen--txt';
      const badgeLabel = isManual ? 'Manual' : 'TXT';
      const width = muro.overall_width && muro.overall_width !== 'S/N' ? Number(muro.overall_width).toFixed(3) : '-';
      const height = muro.overall_height && muro.overall_height !== 'S/N' ? Number(muro.overall_height).toFixed(3) : '-';

      html += `
        <tr data-pid="${muro.pid}">
          <td style="text-align: center;">
            <button class="btn-move" title="Mover arriba" ${idx === 0 ? 'disabled' : ''} onclick="window._moveMuro(${muro.pid}, 'up')">&#9650;</button>
            <button class="btn-move" title="Mover abajo" ${idx === muros.length - 1 ? 'disabled' : ''} onclick="window._moveMuro(${muro.pid}, 'down')">&#9660;</button>
          </td>
          <td style="text-align: center;">${muro.num}</td>
          <td><strong>${muro.id_muro}</strong></td>
          <td><span class="badge-origen ${badgeClass}">${badgeLabel}</span></td>
          <td>${muro.tipo_construccion || 'TILT-UP'}</td>
          <td style="text-align: right;">${muro.grosor != null ? Number(muro.grosor).toFixed(1) : '-'}</td>
          <td style="text-align: right;">${muro.area != null ? Number(muro.area).toFixed(2) : '-'}</td>
          <td style="text-align: right;">${muro.peso != null ? Number(muro.peso).toFixed(2) : '-'}</td>
          <td style="text-align: right;">${muro.volumen != null ? Number(muro.volumen).toFixed(2) : '-'}</td>
          <td style="text-align: right;">${width}</td>
          <td style="text-align: right;">${height}</td>
          <td style="text-align: center;">
            ${isManual ? `<button class="btn btn--ghost btn--sm" onclick="window._editMuro(${muro.pid})">Editar</button>` : ''}
            <button class="btn btn--ghost btn--sm btn--danger" onclick="window._deleteMuro(${muro.pid})">Eliminar</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  // ===== UTILIDADES =====
  function clearManualForm() {
    const fields = [
      'manual_id_muro', 'manual_grosor', 'manual_area', 'manual_peso',
      'manual_volumen', 'manual_overall_width', 'manual_overall_height',
      'manual_cgx', 'manual_cgy'
    ];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = '';
        markFieldError(id, false);
      }
    });
    document.getElementById('manual_tipo_construccion').value = 'TILT-UP';
    document.getElementById('manual_position').value = 'end';
    document.getElementById('manual_reference_row').style.display = 'none';

    // Si estaba en modo edición, salir
    const btnAdd = document.getElementById('btnAddManualMuro');
    if (btnAdd.dataset.editPid) {
      exitEditMode();
    }
  }

  function populateReferenceSelect() {
    const select = document.getElementById('manual_reference_pid');
    if (!select) return;

    const muros = window._murosProyecto || [];
    select.innerHTML = muros.map(m =>
      `<option value="${m.pid}">${m.num}. ${m.id_muro} (${m.origen})</option>`
    ).join('');
  }

  function enableCalculationSections() {
    const menuAccordions = document.getElementsByClassName('accordion-item');
    for (const item of menuAccordions) {
      item.classList.remove('disabled');
    }
  }

  // ===== EXPONER FUNCIONES GLOBALMENTE (para onclick en HTML generado) =====
  window._moveMuro = function(pid, direction) { handleMoveMuro(pid, direction); };
  window._editMuro = function(pid) {
    const muros = window._murosProyecto || [];
    const muro = muros.find(m => m.pid === pid);
    if (muro) {
      if (muro.origen !== 'MANUAL') {
        window.showNotification('warning', 'No editable', 'Solo los muros manuales pueden editarse.', 4000);
        return;
      }
      fillFormForEdit(muro);
    }
  };
  window._deleteMuro = function(pid) { handleDeleteMuro(pid); };

  // Exponer refreshMurosTable globalmente para que dashboard.js pueda llamarla
  window.refreshMurosTable = refreshMurosTable;

})();
