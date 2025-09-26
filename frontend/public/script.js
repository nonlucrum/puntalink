// ===== IMPORTACIÓN DEL MÓDULO DE BOTONES =====
import { 
  handleFileValidation,
  updatePanelesDisplay,
  handleUploadTxt,
  handleCancelTxt,
  handleCalcularPaneles,
  handleGenerarPDF,
  loadProjectInfo
} from './api/dashboard.js';

import { createProject } from './api/index.js';

document.addEventListener('DOMContentLoaded', () => {
  // ===== CARGAR INFORMACIÓN DEL PROYECTO =====
  loadProjectInfo();
  
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

  const btnProjectSubmit = document.getElementById('btnProjectSubmit');

  // ===== VARIABLES GLOBALES =====
  const globalVars = {
    projectData: [],
    panelesActuales: [],
    resultadosActuales: []
  };

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
    resultadosCalculo
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
      await handleCalcularPaneles(uiElements, callbacks, globalVars);
    });
  }

  // Generar PDF
  if (btnInforme) {
    btnInforme.addEventListener('click', async () => {
      await handleGenerarPDF(uiElements, globalVars);
    });
  }

  // Editar proyecto
  if (btnEditProject) {
    btnEditProject.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
  
  if (btnProjectSubmit) {
    console.log('[FRONTEND] Configurando listener para envío de formulario de proyecto');
    const form = document.getElementById('formNuevoProyecto');

    if (form) {
        btnProjectSubmit.addEventListener('click', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const projectData = {
            nombreProyecto: formData.get('nombreProyecto'),
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

  // ===== INICIALIZACIÓN =====
  initAccordion();
  console.log('[FRONTEND] Aplicación inicializada con módulo de botones consolidado');
});

