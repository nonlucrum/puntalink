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
    formData.append('projectInfo', JSON.stringify({
      nombre: projectInfo.nombre || '',
      empresa: projectInfo.empresa || '',
      ubicacion: projectInfo.ubicacion || document.getElementById('proyectoUbicacion')?.value || '',
      tipo_muerto: projectInfo.tipo_muerto || '',
      vel_viento: projectInfo.vel_viento || '',
      temp_promedio: projectInfo.temp_promedio || '',
      presion_atmo: projectInfo.presion_atmo || '',
    }));

    if (selectedImageFile) {
      formData.append('imagen', selectedImageFile);
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
