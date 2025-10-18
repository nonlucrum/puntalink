// ===== IMPORTACIÓN DEL MÓDULO DE BOTONES =====
import { 
  handleFileValidation,
  updatePanelesDisplay,
  handleUploadTxt,
  handleCancelTxt,
  handleCalcularPaneles,
  handleGenerarPDF,
  loadProjectInfo,
  editarProyecto,
  guardarCambiosProyecto
} from './js/dashboard.js';

import { createProject } from './js/index.js';

document.addEventListener('DOMContentLoaded', () => {
  // ===== CARGAR INFORMACIÓN DEL PROYECTO =====
  if (window.location.pathname === "/dashboard") {
    loadProjectInfo();
  }
  
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
  const btnUpdateProject = document.getElementById('btnUpdateProject');
  const btnCancelUpdateProject = document.getElementById('btnCancelUpdateProject');

  const btnProjectSubmit = document.getElementById('btnProjectSubmit');

  // ===== VARIABLES GLOBALES =====
  const globalVars = {
    projectData: [],
    panelesActuales: [],
    resultadosActuales: []
  };
  
  // Hacer globalVars accesible globalmente para funciones de viento
  window.globalVars = globalVars;

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
    resultadosCalculo,
    btnEditProject,
    btnUpdateProject,
    btnCancelUpdateProject
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
      editarProyecto(uiElements);
    });
  }

  // Cancelar edicion proyecto
  if (btnCancelUpdateProject) {
    btnCancelUpdateProject.addEventListener('click', () => {
      loadProjectInfo();
    });
  }

    // Guardar edicion proyecto
  if (btnUpdateProject) {
    btnUpdateProject.addEventListener('click', () => {
      guardarCambiosProyecto();
    });
  }
  
  if (btnProjectSubmit) {
    console.log('[FRONTEND] Configurando listener para envío de formulario de proyecto');
    const form = document.getElementById('formNuevoProyecto');

    if (form) {
        btnProjectSubmit.addEventListener('click', async (e) => {

            if (!form.reportValidity()) {
                console.log('[FRONTEND] Formulario inválido');
                return;
            }
            
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

  // ===== ELEMENTOS ADICIONALES PARA VIENTO =====
  const btnCalcularViento = document.getElementById('btnCalcularViento');

  // ===== CONFIGURAR EVENTOS PARA CÁLCULO DE VIENTO =====
  if (btnCalcularViento) {
    btnCalcularViento.addEventListener('click', calcularCargasViento);
  }

  // ===== INICIALIZACIÓN =====
  initAccordion();
  console.log('[FRONTEND] Aplicación inicializada con módulo de botones consolidado');
});

// ===== FUNCIONES PARA CÁLCULO DE VIENTO =====
/**
 * Sección 1-2: Función principal para calcular cargas de viento
 * Implementa las fórmulas del Excel y diagramas según Tomo III
 */
async function calcularCargasViento() {
  try {
    console.log('[WIND] Iniciando cálculo de cargas de viento...');
    
    // Configuración API_BASE (igual que en dashboard.js) - FORZAR LOCALHOST:4008
    const API_BASE = "http://localhost:4008";
    console.log('[WIND] 🔗 API_BASE configurado como:', API_BASE);
    
    // Debugging detallado de globalVars
    console.log('[WIND] Estado de window.globalVars:', window.globalVars);
    console.log('[WIND] ¿Existe panelesActuales?', !!window.globalVars?.panelesActuales);
    console.log('[WIND] Longitud panelesActuales:', window.globalVars?.panelesActuales?.length || 0);
    console.log('[WIND] Primer panel:', window.globalVars?.panelesActuales?.[0]);
    
    // Verificar que haya muros importados
    const panelesData = window.globalVars?.panelesActuales || [];
    if (!panelesData || panelesData.length === 0) {
      console.error('[WIND] No hay muros importados');
      alert('❌ Error: No hay muros importados.\n\n📋 PASOS CORRECTOS:\n1. Ve a "Importar Datos desde TXT"\n2. Selecciona tu archivo .TXT\n3. Haz clic en "Subir y procesar TXT"\n4. Verifica que aparezcan los muros\n5. Luego calcula cargas de viento');
      return;
    }
    
    console.log('[WIND] ✅ Muros encontrados:', panelesData.length);
    console.log('[WIND] Estructura del primer muro:', panelesData[0]);
    
    // Recopilar parámetros del formulario
    console.log('[WIND] Recopilando parámetros del formulario...');
    
    const parametros = {
      categoria_terreno: parseInt(document.getElementById('categoria_terreno').value),
      VR_kmh: parseFloat(document.getElementById('VR_kmh').value),
      FT: parseFloat(document.getElementById('FT').value),
      temperatura_C: parseFloat(document.getElementById('temperatura_C').value),
      presion_barometrica_mmHg: parseFloat(document.getElementById('presion_barometrica_mmHg').value),
      Cp_int: parseFloat(document.getElementById('Cp_int').value),
      Cp_ext: parseFloat(document.getElementById('Cp_ext').value),
      factor_succion: parseFloat(document.getElementById('factor_succion').value),
      densidad_concreto_kg_m3: 2400
    };

    console.log('[WIND] Parámetros recopilados:', parametros);

    // Validar parámetros
    console.log('[WIND] Validando parámetros...');
    const camposInvalidos = [];
    Object.entries(parametros).forEach(([key, value]) => {
      if (key !== 'categoria_terreno' && isNaN(value)) {
        camposInvalidos.push(key);
        console.error(`[WIND] ❌ Campo inválido: ${key} = ${value}`);
      }
    });

    if (camposInvalidos.length > 0) {
      console.error('[WIND] ❌ Campos inválidos encontrados:', camposInvalidos);
      alert(`❌ Por favor, complete estos campos correctamente:\n\n${camposInvalidos.map(campo => `• ${campo}`).join('\n')}\n\n💡 Asegúrese de que todos los valores sean números válidos.`);
      return;
    }

    console.log('[WIND] ✅ Todos los parámetros son válidos');

    console.log('[WIND] 🚀 Enviando request a:', `${API_BASE}/api/calculos/viento/calcular-muros`);
    console.log('[WIND] 📦 Payload:', {
      muros: panelesData,
      parametros: parametros
    });

    // Llamar a la API con API_BASE
    const response = await fetch(`${API_BASE}/api/calculos/viento/calcular-muros`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        muros: panelesData,
        parametros: parametros
      })
    });

    console.log('[WIND] 📡 Respuesta HTTP status:', response.status);
    console.log('[WIND] 📡 Respuesta OK:', response.ok);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('[WIND] Respuesta de la API:', data);
    console.log('[WIND] Primer resultado:', data.resultados ? data.resultados[0] : 'No hay resultados');
    console.log('[WIND] Alpha del primer resultado:', data.resultados ? data.resultados[0]?.alpha : 'undefined');
    console.log('[WIND] Delta del primer resultado:', data.resultados ? data.resultados[0]?.delta : 'undefined');

    if (data.success && data.resultados) {
      mostrarResultadosViento(data);
    } else {
      throw new Error(data.error || 'Error desconocido en el cálculo');
    }

  } catch (error) {
    console.error('[WIND] Error en cálculo de viento:', error);
    alert(`Error al calcular cargas de viento: ${error.message}`);
  }
}

/**
 * Función para mostrar resultados de viento en la interfaz
 * Implementa la visualización según los resultados del Excel
 */
function mostrarResultadosViento(data) {
  console.log('[WIND] Mostrando resultados de viento');
  
  const resultadosViento = document.getElementById('resultadosViento');
  const tablaResultados = document.getElementById('tablaResultadosViento');
  const detalleCalculos = document.getElementById('detalleCalculosViento');

  // Mostrar la sección de resultados
  resultadosViento.style.display = 'block';

  // Crear tabla de resultados
  let htmlTabla = `
    <table class="wind-results-table">
      <thead>
        <tr>
          <th>Muro</th>
          <th>Área (m²)</th>
          <th>Peso (ton)</th>
          <th>Altura (m)</th>
          <th>Vd (km/h)</th>
          <th>G</th>
          <th>qz (kPa)</th>
          <th>Presión (kPa)</th>
          <th>Fuerza (kN)</th>
          <th>YCG (m)</th>
          <th>NFT (Nivel Piso)</th>
          <th>Tipo Brace</th>
          <th>Ángulo (°)</th>
          <th>Altura Anclaje (m)</th>
          <th>Distribución Braces</th>
          <th>Análisis Dinámico</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.resultados.forEach(resultado => {
    const requiereAnalisis = resultado.requiere_analisis_dinamico ? 
      '<span class="wind-alert">Sí - Requerido</span>' : 
      '<span class="wind-warning">No</span>';
    
    // Separar información del brace en campos distintos
    const tipoBrace = resultado.tipo_brace || 'N/A';
    const anguloBrace = resultado.grados_inclinacion_brace || 'N/A';
    const alturaAnclaje = resultado.altura_z_m ? ((resultado.altura_z_m * 2/3).toFixed(2)) : 'N/A';
    
    // Información de distribución de braces (solo B12 y B14 como en el Excel)
    const distribucionBraces = `
      <div class="brace-distribution">
        <div class="brace-total">Total: ${resultado.total_braces || 0}</div>
        <div class="brace-model">Modelo: ${resultado.modelo_principal_brace || 'N/A'}</div>
        <div class="brace-summary">${resultado.resumen_distribucion_braces || 'N/A'}</div>
        <div class="brace-detail">
          B14:${resultado.distribucion_braces?.B14 || 0} | B12:${resultado.distribucion_braces?.B12 || 0}
        </div>
      </div>
    `;
    
    // Información NFT (Nivel de Piso Terminado)
    const infoNFT = `
      <div class="nft-info">
        <div class="nft-valor">${resultado.NFT?.toFixed(3) || 'N/A'}m</div>
        <div class="nft-detalle">
          ${resultado.componentes_nft ? 
            `NNT: ${resultado.componentes_nft.nivel_natural}m<br>
             Losa: ${resultado.componentes_nft.espesor_losa}m<br>
             Acabado: ${resultado.componentes_nft.acabado}m` : 
            'Datos no disponibles'
          }
        </div>
      </div>
    `;
    
    htmlTabla += `
      <tr>
        <td><strong>${resultado.id_muro}</strong></td>
        <td>${resultado.area_m2}</td>
        <td>${resultado.peso_ton}</td>
        <td>${resultado.altura_z_m}</td>
        <td>${resultado.Vd_kmh}</td>
        <td>${resultado.G || 'N/A'}</td>
        <td>${resultado.qz_kPa}</td>
        <td>${resultado.presion_kPa}</td>
        <td><strong>${resultado.fuerza_kN}</strong></td>
        <td>${resultado.YCG || 'N/A'}</td>
        <td>${infoNFT}</td>
        <td>${tipoBrace}</td>
        <td>${anguloBrace}</td>
        <td>${alturaAnclaje}</td>
        <td>${distribucionBraces}</td>
        <td>${requiereAnalisis}</td>
      </tr>
    `;
  });

  htmlTabla += `
      </tbody>
    </table>
  `;

  tablaResultados.innerHTML = htmlTabla;

  // Crear detalle de cálculos
  let htmlDetalle = '';
  
  data.resultados.forEach(resultado => {
    htmlDetalle += `
      <div class="calculation-detail">
        <div class="calculation-detail-header" onclick="toggleCalculationDetail(this)">
          <span>Muro ${resultado.id_muro} - Detalle de Cálculos</span>
          <span>▼</span>
        </div>
        <div class="calculation-detail-content">
    `;

    // Mostrar advertencias si las hay
    if (resultado.advertencias.length > 0) {
      resultado.advertencias.forEach(advertencia => {
        const esAlerta = resultado.requiere_analisis_dinamico;
        htmlDetalle += `<div class="${esAlerta ? 'wind-alert' : 'wind-warning'}">${advertencia}</div>`;
      });
    }

    // Debug: Verificar qué valores están llegando
    console.log('[DEBUG] Resultado completo:', resultado);
    console.log('[DEBUG] Alpha:', resultado.alpha);
    console.log('[DEBUG] Delta:', resultado.delta);
    
    // Usar valores por defecto si no llegan (temporal para debug)
    const alphaValue = resultado.alpha || 'undefined';
    const deltaValue = resultado.delta || 'undefined';
    
    // Detalle paso a paso con fórmulas y valores calculados por el backend
    htmlDetalle += `<ol>`;
    htmlDetalle += `<li><strong>Datos del Muro:</strong> Área = ${resultado.area_m2} m², Altura = ${resultado.altura_z_m} m</li>`;
    htmlDetalle += `<li><strong>Factor de rugosidad:</strong> Frz = 1.56 × (Z/δ)^α = 1.56 × (${resultado.altura_z_m}/${deltaValue})^${alphaValue} = ${resultado.Frz}</li>`;
    htmlDetalle += `<li><strong>Factor de exposición:</strong> Fα = FC × Frz × FT = ${resultado.FC} × ${resultado.Frz} × ${data.parametros_utilizados.FT} = ${resultado.Falpha}</li>`;
    htmlDetalle += `<li><strong>Velocidad de diseño:</strong> Vd = VR × Fα = ${data.parametros_utilizados.VR_kmh} × ${resultado.Falpha} = ${resultado.Vd_kmh} km/h</li>`;
    htmlDetalle += `<li><strong>Corrección atmosférica:</strong> Corrección = ${resultado.correccion}</li>`;
    htmlDetalle += `<li><strong>Factor G:</strong> G = ${resultado.G} (corrección por temperatura y altura)</li>`;
    htmlDetalle += `<li><strong>Presión dinámica:</strong> qz = 0.0048 × G × (VD)² = 0.0048 × ${resultado.G} × (${resultado.Vd_kmh})² = ${resultado.qz_kPa} kPa</li>`;
    htmlDetalle += `<li><strong>Presión neta:</strong> P = qz × (Cpi - Cpe) × Factor = ${resultado.qz_kPa} × (${data.parametros_utilizados.Cp_int} - ${data.parametros_utilizados.Cp_ext}) × ${data.parametros_utilizados.factor_succion} = ${resultado.presion_kPa} kPa</li>`;
    htmlDetalle += `<li><strong>Fuerza de viento:</strong> F = qz × Área = ${resultado.qz_kPa} × ${resultado.area_m2} = ${resultado.fuerza_kN} kN</li>`;
    
    // Nuevos parámetros calculados con fórmulas
    if (resultado.YCG !== undefined) {
      htmlDetalle += `<li><strong>Centro de gravedad (YCG):</strong> YCG = H/2 = ${resultado.altura_z_m}/2 = ${resultado.YCG} m</li>`;
    }
    
    // NFT: Nivel de Piso Terminado (elevación física)
    if (resultado.NFT !== undefined) {
      htmlDetalle += `<li><strong>📏 NFT - Nivel de Piso Terminado:</strong></li>`;
      htmlDetalle += `<ul>`;
      htmlDetalle += `<li><strong>Nivel final:</strong> ${resultado.NFT.toFixed(3)}m</li>`;
      
      if (resultado.componentes_nft) {
        htmlDetalle += `<li><strong>Componentes del cálculo:</strong></li>`;
        htmlDetalle += `<li style="margin-left: 20px;">• Nivel Natural Terreno: ${resultado.componentes_nft.nivel_natural}m</li>`;
        htmlDetalle += `<li style="margin-left: 20px;">• Excavación: ${resultado.componentes_nft.excavacion}m</li>`;
        htmlDetalle += `<li style="margin-left: 20px;">• Espesor losa: ${resultado.componentes_nft.espesor_losa}m (${(resultado.componentes_nft.espesor_losa * 39.37).toFixed(1)}")</li>`;
        htmlDetalle += `<li style="margin-left: 20px;">• Acabado superficial: ${resultado.componentes_nft.acabado}m</li>`;
        htmlDetalle += `<li><strong>Fórmula:</strong> NFT = NNT - Excavación + Espesor_Losa + Acabado</li>`;
      }
      htmlDetalle += `</ul>`;
    }
    
    if (resultado.grados_inclinacion_brace !== undefined) {
      htmlDetalle += `<li><strong>Inclinación brace:</strong> θ = arctan(altura_anclaje/distancia_horizontal) = ${resultado.grados_inclinacion_brace}°</li>`;
    }
    if (resultado.tipo_brace !== undefined) {
      htmlDetalle += `<li><strong>Especificaciones del brace:</strong></li>`;
      htmlDetalle += `<ul>`;
      htmlDetalle += `<li><strong>Tipo:</strong> ${resultado.tipo_brace}</li>`;
      if (resultado.longitud_brace_m !== undefined) {
        htmlDetalle += `<li><strong>Longitud estimada:</strong> ${resultado.longitud_brace_m} m</li>`;
      }
      if (resultado.modelo_brace !== undefined) {
        htmlDetalle += `<li><strong>Modelo sugerido:</strong> ${resultado.modelo_brace}</li>`;
      }
      
      // Agregar información de distribución de braces
      if (resultado.total_braces !== undefined) {
        htmlDetalle += `<li><strong>Distribución de braces:</strong></li>`;
        htmlDetalle += `<ul>`;
        htmlDetalle += `<li><strong>Total braces necesarios:</strong> ${resultado.total_braces}</li>`;
        if (resultado.modelo_principal_brace) {
          htmlDetalle += `<li><strong>Modelo principal:</strong> ${resultado.modelo_principal_brace}</li>`;
        }
        if (resultado.resumen_distribucion_braces) {
          htmlDetalle += `<li><strong>Resumen distribución:</strong> ${resultado.resumen_distribucion_braces}</li>`;
        }
        if (resultado.distribucion_braces) {
          htmlDetalle += `<li><strong>Detalle por modelo:</strong></li>`;
          htmlDetalle += `<ul>`;
          Object.entries(resultado.distribucion_braces).forEach(([modelo, cantidad]) => {
            if (cantidad > 0) {
              htmlDetalle += `<li>${modelo}: ${cantidad} unidades</li>`;
            }
          });
          htmlDetalle += `</ul>`;
        }
        htmlDetalle += `</ul>`;
      }
      
      if (resultado.observaciones_brace && resultado.observaciones_brace.length > 0) {
        htmlDetalle += `<li><strong>Observaciones:</strong></li>`;
        htmlDetalle += `<ul>`;
        resultado.observaciones_brace.forEach(obs => {
          htmlDetalle += `<li>${obs}</li>`;
        });
        htmlDetalle += `</ul>`;
      }
      htmlDetalle += `</ul>`;
    }
    htmlDetalle += `</ol>`;

    htmlDetalle += `
        </div>
      </div>
    `;
  });

  detalleCalculos.innerHTML = htmlDetalle;

  // Scroll hacia los resultados
  resultadosViento.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Función para toggle del detalle de cálculos
 */
function toggleCalculationDetail(header) {
  const content = header.nextElementSibling;
  const arrow = header.querySelector('span:last-child');
  
  if (content.classList.contains('active')) {
    content.classList.remove('active');
    arrow.textContent = '▼';
  } else {
    content.classList.add('active');
    arrow.textContent = '▲';
  }
}

// Hacer la función global para el onclick
window.toggleCalculationDetail = toggleCalculationDetail;

