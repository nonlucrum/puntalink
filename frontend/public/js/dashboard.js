// === FUNCIÓN PARA PREPARAR DATOS DE MUERTOS CILÍNDRICOS ===
/**
 * Prepara los datos de entrada para el cálculo de muertos cilíndricos.
 * Agrupa por eje, suma fuerzas y lee los parámetros de la UI.
 * Devuelve un arreglo de grupos listos para calcular.
 */
import { toggleCalculationDetail } from '../script.js';

function prepararDatosCilindricos() {
  // Obtener los grupos de muertos globales
  const grupos = window.gruposMuertosGlobal || {};
  const resultado = [];
  let idx = 1;
  for (const clave in grupos) {
    const grupo = grupos[clave];
    // Sumar la fuerza total requerida (FBy) de los muros del grupo
    let sumaFBy = 0;
    let murosList = [];
    (grupo.muros || []).forEach(muro => {
      let m = typeof muro === 'object' ? muro : (window.lastResultadosMuertos || []).find(x => x.id_muro === muro || x.id === muro);
      if (m && (m.fby || m.FBy)) {
        sumaFBy += parseFloat(m.fby || m.FBy) || 0;
      }
      if (m && (m.id_muro || m.id)) {
        murosList.push(m.id_muro || m.id);
      }
    });
    // Leer profundidad desde la UI (si existe input por grupo)
    let profundidad = 2.0;
    if (window.configGruposMuertos && window.configGruposMuertos[clave] && window.configGruposMuertos[clave].profundo) {
      profundidad = parseFloat(window.configGruposMuertos[clave].profundo) || 2.0;
    }
    // Leer diámetro desde la UI global (puede ser único para todos)
    const diametro = parseFloat(document.getElementById('cil_diametro')?.value) || 0.6;
    resultado.push({
      clave,
      numero_grupo: idx,
      eje: grupo.eje || '',
      muros_list: murosList.join(', '),
      sumaFBy,
      profundidad,
      diametro
    });
    idx++;
  }
  return resultado;
}
console.log('[DEPURACIÓN] dashboard.js cargado correctamente');

// ===== IMPORTS =====
import {
  prepararGruposParaMuertos,
  calcularMacizosRectangulares,
  generarTablaResultadosMacizos
} from './muertoRectangular.js';

import {
  calcularMacizosCilindricos,
  generarTablaResultadosCilindricos,
  obtenerProfundidadRecomendada
} from './muertoCilindrico.js';

import {
  calcularMacizosTriangulares,
  generarTablaResultadosTriangulares
} from './muertoTriangular.js';

import {mostrarResultadosViento} from '../script.js';
// === EVENT HANDLERS PARA CÁLCULOS CILÍNDRICO Y TRIANGULAR ===
document.addEventListener('DOMContentLoaded', () => {
  // Cálculo Cilíndrico
  if (document.getElementById('btnCalcularArmado')) {
    console.log('[ARMADO] Inicializando armado rectangular...');
    initArmadoRectangular();
  }


  // ==========================================
  // 🕳️ LÓGICA DE MUERTOS CILÍNDRICOS
  // ==========================================

  const tbodyCilindrico = document.querySelector('#tablaInputsCilindrico tbody');

  // 1. Botón para CARGAR los muros en la Tabla de Diseño (MURO POR MURO)
  const btnCargarCil = document.getElementById('btnCargarMurosCil');
  
  if (btnCargarCil) {
    btnCargarCil.addEventListener('click', () => {
      
      // Validación: Verificar que existan resultados de viento
      if (!window.lastResultadosMuertos || window.lastResultadosMuertos.length === 0) {
        alert("⚠️ No hay muros calculados. Primero calcula el Viento.");
        return;
      }

      // Validación: Verificar que la tabla exista en el HTML
      if (!tbodyCilindrico) {
          console.error("❌ Error: No se encontró el elemento #tablaInputsCilindrico tbody en el HTML");
          return;
      }

      const numMuros = window.lastResultadosMuertos.length;
      tbodyCilindrico.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#666; padding: 20px;">
        ✅ ${numMuros} muro${numMuros !== 1 ? 's' : ''} cargado${numMuros !== 1 ? 's' : ''}.<br>
        <small>Selecciona los diámetros arriba y presiona "Calcular Materiales Cilíndricos".</small>
      </td></tr>`;
      
      console.log(`[CILINDRICO] ✅ ${numMuros} muros cargados`);
    });
  }

  // Listener simplificado - ya no necesario porque no hay inputs dinámicos
  if (tbodyCilindrico) {
      tbodyCilindrico.addEventListener('change', (e) => {
          if (e.target && e.target.classList.contains('trigger-recalc-cil')) {
              const select = e.target;
              const row = select.closest('tr');
              const inputProf = row.querySelector('.input-prof');
              
              // Recuperar datos almacenados
              const fuerzaTotal = parseFloat(row.dataset.fuerza || 0);
              const braces = parseFloat(row.dataset.braces || 1);
              const cargaPorMuerto = fuerzaTotal / braces;
              const nuevoDiametro = parseFloat(select.value);

              // Buscar profundidad en tabla para el nuevo diámetro
              const nuevaProfundidad = obtenerProfundidadRecomendada(cargaPorMuerto, nuevoDiametro);

              // Actualizar UI
              inputProf.value = nuevaProfundidad;
              
              // Efecto visual (flash verde) para indicar recálculo
              inputProf.style.transition = "background-color 0.3s";
              inputProf.style.backgroundColor = "#d1e7dd";
              setTimeout(() => inputProf.style.backgroundColor = "", 500);
          }
      });
  }

  // Botón "Calcular Resultados"
  const btnCalcularResultados = document.getElementById('btnCalcularCilindrico');

  if (btnCalcularResultados) {
      btnCalcularResultados.addEventListener('click', () => {
          
          if (!window.lastResultadosMuertos || window.lastResultadosMuertos.length === 0) {
              alert("⚠️ No hay muros cargados. Primero presiona 'Cargar Muros'.");
              return;
          }

          // Obtener diámetros seleccionados
          const diametrosSeleccionados = Array.from(document.querySelectorAll('.diametro-checkbox:checked'))
            .map(cb => parseInt(cb.value));

          if (diametrosSeleccionados.length === 0) {
              alert("⚠️ Selecciona al menos un diámetro para calcular.");
              return;
          }

          // Obtener configuración
          const densidad = parseFloat(document.getElementById('cil_densidad_concreto')?.value || 2400);
          const desperdicio = parseFloat(document.getElementById('cil_desperdicio')?.value || 1.05);
          const cantVert = parseInt(document.getElementById('cil_cant_vert')?.value || 4);
          const tipoVert = document.getElementById('cil_tipo_vert')?.value || '#4';
          const tipoAnillo = document.getElementById('cil_tipo_anillo')?.value || '#3';
          const modoAnillos = document.getElementById('cil_modo_anillos')?.value || 'fijo';
          const datoAnillos = parseFloat(document.getElementById('cil_dato_anillos')?.value || 3);

          const containerTablas = document.getElementById('containerTablasCilindrico');
          if (!containerTablas) {
              console.error('❌ No se encontró #containerTablasCilindrico');
              return;
          }
          containerTablas.innerHTML = '';

          // Objeto para acumular totales por diámetro
          const totalesPorDiametro = {};

          // Crear una tabla por cada diámetro seleccionado
          diametrosSeleccionados.forEach(diametro => {
              // Inicializar acumuladores para este diámetro
              totalesPorDiametro[diametro] = {
                  concreto: 0,
                  varillas: 0,
                  anillos: 0,
                  alambre: 0
              };

              // Crear contenedor para esta tabla
              const divTabla = document.createElement('div');
              divTabla.className = 'cilindrico-detail';
              divTabla.style.marginBottom = '30px';
              
              window.toggleCalculationDetail = toggleCalculationDetail;
              
              // Título con el diámetro
              const titulo = document.createElement('div');
              titulo.className = 'cilindrico-detail-header';
              titulo.setAttribute('onclick', 'toggleCalculationDetail(this)');
              titulo.style.cssText = 'background: #2c3e50; color: white; padding: 10px; margin: 0; border-radius: 8px 8px 0 0;';
              titulo.innerHTML = `🕳️ Ø ${diametro} mm`;
              divTabla.appendChild(titulo);

              const toggle = document.createElement('span');
              toggle.innerHTML = '▼';
              titulo.appendChild(toggle);

              const tablaContent = document.createElement('div');
              tablaContent.className = 'cilindrico-detail-content';
              divTabla.appendChild(tablaContent);
              
              // Crear tabla
              const tabla = document.createElement('table');
              tabla.className = 'results-table';
              tabla.style.marginTop = '0';
              
              // Header
              tabla.innerHTML = `
                  <thead>
                      <tr>
                          <th>Muro</th>
                          <th>X (mm)</th>
                          <th>Cantidad M.</th>
                          <th>Altura (mm)</th>
                          <th>Concreto (ton)</th>
                          <th>Acero Varillas (kg)</th>
                          <th>Acero anillos (kg)</th>
                      </tr>
                  </thead>
                  <tbody></tbody>
              `;
              
              const tbody = tabla.querySelector('tbody');
              
              // Para cada muro, calcular con este diámetro
              window.lastResultadosMuertos.forEach((muro, index) => {
                  const muroId = muro.id_muro || muro.pid || `M${index+1}`;
                  
                  // Obtener FB: prioridad a fb/FB, fallback a fuerza_kN
                  const fbTotal = parseFloat(muro.fb || muro.FB || muro.fuerza_kN || 0);
                  const numBraces = parseInt(muro.total_braces || 1);
                  const cargaPorMuerto = fbTotal / numBraces;

                  // DEBUG: Ver valores de FB y carga
                  console.log(`[CILINDRICO-DEBUG] Muro ${muroId}: FB = ${fbTotal.toFixed(2)} kN (fuerza_kN: ${muro.fuerza_kN}), Braces = ${numBraces}, Carga/muerto = ${cargaPorMuerto.toFixed(2)} kN`);

                  // Calcular profundidad recomendada
                  const profundidad = obtenerProfundidadRecomendada(cargaPorMuerto, diametro);
                  console.log(`[CILINDRICO-DEBUG] Muro ${muroId}: Diámetro ${diametro} mm → Profundidad ${profundidad} mm`);

                  // Calcular materiales para este muerto específico
                  const resultado = calcularMacizosCilindricos([{
                      id: muroId,
                      fuerza_total: fbTotal,
                      cantidad_muertos: numBraces,
                      diametro_mm: diametro,
                      profundidad_mm: profundidad
                  }])[0];

                  // Acumular totales
                  totalesPorDiametro[diametro].concreto += resultado.total_muro.peso_concreto_ton;
                  totalesPorDiametro[diametro].varillas += resultado.unitario.acero_long_kg;
                  totalesPorDiametro[diametro].anillos += resultado.unitario.acero_trans_kg;
                  totalesPorDiametro[diametro].alambre += resultado.unitario.alambre_kg || 0;

                  // Crear fila con los datos calculados
                  const tr = document.createElement('tr');
                  tr.innerHTML = `
                      <td class="text-center align-middle fw-bold">${muroId}</td>
                      <td class="text-center align-middle">${diametro}</td>
                      <td class="text-center align-middle">${numBraces}</td>
                      <td class="text-center align-middle">${profundidad}</td>
                      <td class="text-center align-middle">${resultado.total_muro.peso_concreto_ton.toFixed(3)}</td>
                      <td class="text-center align-middle">${resultado.unitario.acero_long_kg.toFixed(2)}</td>
                      <td class="text-center align-middle">${resultado.unitario.acero_trans_kg.toFixed(2)}</td>
                  `;
                  tbody.appendChild(tr);
              });
              
              tablaContent.appendChild(tabla);
              containerTablas.appendChild(divTabla);
          });

          // Generar tabla resumen (transpuesta: opciones arriba, materiales a la izquierda)
          const resumenContainer = document.getElementById('resumenCilindricoContainer');
          const tablaResumen = document.getElementById('tablaResumenCilindrico');
          
          if (resumenContainer && tablaResumen) {
              const thead = tablaResumen.querySelector('thead');
              const tbody = tablaResumen.querySelector('tbody');
              
              // Limpiar tabla
              thead.innerHTML = '';
              tbody.innerHTML = '';
              
              // Fila 1: "Opción" + números
              const trOpcion = document.createElement('tr');
              trOpcion.innerHTML = '<th></th>'; // Celda vacía superior izquierda
              diametrosSeleccionados.forEach((diametro, idx) => {
                  trOpcion.innerHTML += `<th class="text-center" style="background: #34495e; color: white;">${idx + 1}</th>`;
              });
              thead.appendChild(trOpcion);
              
              // Fila 2: "Diámetro (mm)" + valores
              const trDiametro = document.createElement('tr');
              trDiametro.innerHTML = '<th style="background: #34495e; color: white;">Diámetro (mm)</th>';
              diametrosSeleccionados.forEach(diametro => {
                  trDiametro.innerHTML += `<th class="text-center" style="background: #34495e; color: white;">${diametro}</th>`;
              });
              thead.appendChild(trDiametro);
              
              // Filas de materiales
              const materiales = [
                  { label: 'Total Concreto (ton)', key: 'concreto', decimales: 3 },
                  { label: 'Total Acero (#4) (kg)', key: 'varillas', decimales: 2 },
                  { label: 'Total Acero (#3) (kg)', key: 'anillos', decimales: 2 },
                  { label: 'Total alambre (kg)', key: 'alambre', decimales: 2 }
              ];
              
              materiales.forEach(material => {
                  const tr = document.createElement('tr');
                  tr.innerHTML = `<td class="fw-bold" style="background: #ecf0f1;">${material.label}</td>`;
                  diametrosSeleccionados.forEach(diametro => {
                      const valor = totalesPorDiametro[diametro][material.key];
                      tr.innerHTML += `<td class="text-center align-middle" style="padding:0.85rem 2rem;">${valor.toFixed(material.decimales)}</td>`;
                  });
                  tbody.appendChild(tr);
              });
              
              resumenContainer.style.display = 'block';
          }
      });
  }

  // ==========================================
  // 🔺 LÓGICA DE MUERTOS TRIANGULARES (CORREGIDA)
  // ==========================================
  const btnTri = document.getElementById('btnCalcularTriangular');
  if (btnTri) {
    btnTri.addEventListener('click', () => {
      
      // 1. Validaciones
      if (!window.gruposMuertosGlobal || Object.keys(window.gruposMuertosGlobal).length === 0) {
          alert("⚠️ No hay grupos generados. Primero realiza el cálculo de Viento/Braces.");
          return;
      }

      if (typeof prepararGruposParaMuertos !== 'function') {
          console.error("Falta la función 'prepararGruposParaMuertos'. Verifica los imports.");
          return;
      }

      // 2. Preparar los grupos
      const grupos = prepararGruposParaMuertos(window.gruposMuertosGlobal);
      
      // 3. RECOLECCIÓN DE DATOS DEL FORMULARIO (IMAGEN)
      // Aquí "robamos" los datos que el usuario llenó en la sección Rectangular
      const inputsUI = {
        construccion: {
          // Lee: Resistencia del Concreto (kg/m3)
          resistenciaConcreto: parseFloat(document.getElementById('tipoConcreto')?.value) || 2400,
          // Lee: Factor desperdicio
          factorDesperdicio: parseFloat(document.getElementById('factorDesperdicio')?.value) || 1
        },
        longitudinal: {
          // Lee: Tipo de varilla
          tipoVarilla: document.getElementById('tipoVarillaLongitudinal')?.value,
          // Lee: Recubrimiento (cm)
          recubrimiento: parseFloat(document.getElementById('recubrimientoLongitudinal')?.value) || 4
        },
        transversal: {
          // Lee: Tipo de varilla (Estribos)
          tipoVarilla: document.getElementById('tipoVarillaTransversal')?.value,
          // Lee: Recubrimiento (cm)
          recubrimiento: parseFloat(document.getElementById('recubrimientoTransversal')?.value) || 4,
          // Lee: Longitud ganchos (m) -> ESTE ES CLAVE
          longitudGanchos: parseFloat(document.getElementById('longGanchoEstribo')?.value) || 0.20,
          
          // Nota: La separación en triangular suele ser específica, intentamos leer el input específico triangular
          // Si no existe, usamos el del rectangular por defecto.
          separacion: parseFloat(document.getElementById('tri_sep_estribos')?.value) || parseFloat(document.getElementById('separacionTransversal')?.value) || 20
        },
        alambre: {
          // Lee: Diámetro alambre (mm)
          diametroAlambre: parseFloat(document.getElementById('diametroAlambre')?.value) || 1.22,
          // Lee: Longitud por vuelta (cm)
          longitudPorVuelta: parseFloat(document.getElementById('longitudVuelta')?.value) || 35,
          // Lee: Factor desperdicio alambre
          factorDesperdicioAlambre: parseFloat(document.getElementById('factorDesperdicioAlambre')?.value) || 1
        },
        triangular: {
          // Estos son los únicos inputs "nuevos" específicos para la forma triangular
          base: parseFloat(document.getElementById('tri_base')?.value) || 0.80,
          cantVarillas: parseInt(document.getElementById('tri_cant_long')?.value) || 3
        }
      };

      try {
          // 4. Calcular
          const resultados = calcularMacizosTriangulares(grupos, inputsUI);
          
          // 5. Renderizar Tabla
          const tabla = document.getElementById('tablaTriangular');
          if (tabla) {
            const thead = tabla.querySelector('thead');
            tabla.innerHTML = ''; 
            if(thead) tabla.appendChild(thead);
            
            tabla.insertAdjacentHTML('beforeend', generarTablaResultadosTriangulares(resultados));
          }

          // 6. Actualizar Totales
          window.ultimosResultadosMacizos = resultados; 
          actualizarTotalesCards(resultados);
          
          alert("✅ Cálculo Triangular completado usando los datos del formulario.");

      } catch (e) {
          console.error(e);
          alert("Error al calcular triangulares: " + e.message);
      }
    });
  }
  }) ;

function actualizarTotalesCards(resultados) {
    let tVol = 0, tPesoConc = 0, tAcero = 0;
    resultados.forEach(r => {
        tVol += r.volumen_m3 || r.volumenConcreto_m3 || 0;
        tPesoConc += r.peso_concreto_kg || r.pesoConcreto_kg || 0;
        // Sumar aceros (la estructura de propiedad puede variar ligeramente entre módulos, aseguramos fallback)
        let acero = (r.acero_long?.peso_kg || r.pesoLongitudinal_kg || 0) + 
                    (r.acero_trans?.peso_kg || r.pesoEstribos_kg || 0);
        tAcero += acero;
    });

    const elTotalConcreto = document.getElementById('totalConcreto');
    const elTotalAcero = document.getElementById('totalAcero');
    
    if (elTotalConcreto) elTotalConcreto.textContent = `${tVol.toFixed(2)} m³ / ${(tPesoConc/1000).toFixed(2)} T`;
    if (elTotalAcero) elTotalAcero.textContent = `${tAcero.toFixed(1)} kg`;
}

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:4008"   // dev backend
    : "";                       // production (relative)

// ===== MODAL PERSONALIZADO =====
function mostrarModalConfirmacion(titulo, mensaje, opciones = {}) {
  return new Promise((resolve) => {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #2a2a3e;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      color: white;
    `;

    const icono = opciones.tipo === 'warning' ? '⚠️' : opciones.tipo === 'success' ? '✅' : 'ℹ️';
    
    modal.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
        <span style="font-size: 2rem;">${icono}</span>
        <h3 style="margin: 0; font-size: 1.5rem;">${titulo}</h3>
      </div>
      <div style="margin-bottom: 2rem; white-space: pre-wrap; line-height: 1.6;">
        ${mensaje}
      </div>
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        ${opciones.mostrarCancelar !== false ? `
          <button id="btn-modal-cancelar" style="
            padding: 0.75rem 1.5rem;
            background: #6c757d;
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          ">Cancelar</button>
        ` : ''}
        <button id="btn-modal-aceptar" style="
          padding: 0.75rem 1.5rem;
          background: ${opciones.tipo === 'warning' ? '#dc3545' : '#28a745'};
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        ">${opciones.textoAceptar || 'Aceptar'}</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    const btnAceptar = modal.querySelector('#btn-modal-aceptar');
    const btnCancelar = modal.querySelector('#btn-modal-cancelar');

    btnAceptar.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(true);
    });

    if (btnCancelar) {
      btnCancelar.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
    }

    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEsc);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

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
export async function loadProjectInfo() {

  endEditarProyecto();
  
  try {
    const projectConfig = localStorage.getItem('projectConfig');
    
    if (projectConfig && projectConfig !== 'undefined' && projectConfig !== 'null') {
      try {
        const project = JSON.parse(projectConfig);
        
        // Actualizar elementos del DOM con la información del proyecto
        document.getElementById('projectNameHeader').textContent = `Información de "${project.nombre}"` || '-';
        document.getElementById('projectVersionHeader').textContent = project.version_proyecto > 1 ? `Versión ${project.version_proyecto || '-'}` : '';
        document.getElementById('proyectoNombre').value = project.nombre || '-';
        document.getElementById('proyectoEmpresa').value = project.empresa || '-';
        document.getElementById('proyectoTipoMuerto').value = project.tipo_muerto || '-';
        document.getElementById('proyectoVelViento').value = project.vel_viento || '-';
        document.getElementById('proyectoTempPromedio').value = project.temp_promedio || '-';
        document.getElementById('proyectoPresionAtm').value = project.presion_atmo || '-';
        document.getElementById('proyectoUbicacion').value = project.ubicacion || '-';
        document.getElementById('proyectoVersion').value = project.version_proyecto || '-';

        // Mostrar seccion de armado de muertos según tipo
        const tipoMuerto = project.tipo_muerto || 'Corrido';
        document.getElementById('section-armado-deadman').style.display = tipoMuerto === 'Corrido' ? '' : 'none';
        document.getElementById('section-armado-cilindrico').style.display = tipoMuerto === 'Cilindrico' ? '' : 'none';
        document.getElementById('section-armado-triangular').style.display = tipoMuerto === 'Triangular' ? '' : 'none';

        // Mostrar boton de dock según tipo
        document.getElementById('dock-rect').style.display = tipoMuerto === 'Corrido' ? '' : 'none';
        document.getElementById('dock-cil').style.display = tipoMuerto === 'Cilindrico' ? '' : 'none';
        document.getElementById('dock-tri').style.display = tipoMuerto === 'Triangular' ? '' : 'none';

        // Mostrar tabla de agrupación por muertos según tipo
        document.getElementById('tablaMuertosAccordion').style.display = tipoMuerto === 'Corrido' || tipoMuerto === 'Triangular' ? '' : 'none';

        // Sincronizar valores del proyecto con los campos de cálculo de viento
        const velViento = parseFloat(project.vel_viento) || 128;
        const temperatura = parseFloat(project.temp_promedio) || 30;
        const presion = parseFloat(project.presion_atmo) || 760;
        
        document.getElementById('VR_kmh').value = velViento;
        document.getElementById('temperatura_C').value = temperatura;
        document.getElementById('presion_barometrica_mmHg').value = presion;
        
        console.log('[DASHBOARD] Valores sincronizados - VR:', velViento, 'Temp:', temperatura, 'Presión:', presion);

        if (project.texto_entrada != null && project.texto_entrada !== undefined) {
            console.log('[FRONTEND] Cargando paneles guardados...');
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
            // Obtener elementos de UI necesarios
            const tablaPaneles = document.getElementById('tablaPaneles');
            const tablaAccordion = document.getElementById('tablaAccordion');
            const panelesInfo = document.getElementById('panelesInfo');
            const btnCalcular = document.getElementById('btnCalcular');
            
            const uiElements = { tablaPaneles, tablaAccordion, panelesInfo, btnCalcular };
            const callbacks = { openSection: (id) => {} }; // Función dummy para openSection
            
            // Actualizar tabla de paneles usando la función global
            if (typeof updatePanelesDisplay === 'function') {
                updatePanelesDisplay(globalVars.panelesActuales, uiElements, callbacks);
            }
            console.log('[FRONTEND] Paneles restaurados en la UI');
            if (globalVars.panelesActuales.length > 0 && globalVars.panelesActuales[0].x_braces != 0) {
                let tablaCalculada = [];
                globalVars.panelesActuales.forEach(muro => {
                    tablaCalculada.push({
                        pid: muro.pid,
                        id_muro: muro.id_muro,
                        angulo_brace: parseFloat(muro.angulo_brace),
                        npt: parseFloat(muro.npt),
                        factor_w2: parseFloat(muro.factor_w2),
                        tipo_brace_seleccionado: muro.tipo_brace_seleccionado,
                        altura_z_m: parseFloat(muro.overall_height),
                        presion_kPa: parseFloat(muro.presion_kpa),
                        fuerza_kN: parseFloat(muro.fuerza_viento),
                        area_m2: parseFloat(muro.area),
                        peso_ton: parseFloat(muro.peso),
                        YCG: muro.overall_height / 2, //no se tiene en la bd
                        Vd_kmh: 0,
                        qz_kPa: parseFloat(muro.qz_kpa),
                        presion_kPa: parseFloat(muro.presion_kpa),
                        eje: muro.eje,
                        origen: muro.origen || 'TXT',
                        advertencias: []
                    });
                });
                console.log('[FRONTEND] Mostrando resultados de viento desde datos guardados...');
                console.log(tablaCalculada);
                await mostrarResultadosViento(tablaCalculada);
                globalVars.resultadosTomoIII = tablaCalculada;
                console.log('[FRONTEND] Resultados de viento mostrados desde datos guardados');
            }
        }
        
        // Refrescar tabla de muros manuales
        if (typeof window.refreshMurosTable === 'function') {
          window.refreshMurosTable();
        }

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
  document.getElementById('proyectoUbicacion').disabled = false;

  document.getElementById('proyectoEmpresa').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoTipoMuerto').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoVelViento').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoTempPromedio').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoPresionAtm').classList.replace('project-value-dim', 'project-value');
  document.getElementById('proyectoUbicacion').classList.replace('project-value-dim', 'project-value');
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
          presion_atmo: parseFloat(document.getElementById('proyectoPresionAtm').value),
          ubicacion: document.getElementById('proyectoUbicacion').value
      };

      // Mostrar seccion de armado de muertos según tipo
        const tipoMuerto = document.getElementById('proyectoTipoMuerto').value || 'Corrido';
        document.getElementById('section-armado-deadman').style.display = tipoMuerto === 'Corrido' ? '' : 'none';
        document.getElementById('section-armado-cilindrico').style.display = tipoMuerto === 'Cilindrico' ? '' : 'none';
        document.getElementById('section-armado-triangular').style.display = tipoMuerto === 'Triangular' ? '' : 'none';

        // Mostrar boton de dock según tipo
        document.getElementById('dock-rect').style.display = tipoMuerto === 'Corrido' ? '' : 'none';
        document.getElementById('dock-cil').style.display = tipoMuerto === 'Cilindrico' ? '' : 'none';
        document.getElementById('dock-tri').style.display = tipoMuerto === 'Triangular' ? '' : 'none';

        // Mostrar tabla de agrupación por muertos según tipo
        document.getElementById('tablaMuertosAccordion').style.display = tipoMuerto === 'Corrido' || tipoMuerto === 'Triangular' ? '' : 'none';

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
  document.getElementById('proyectoUbicacion').disabled = true;

  document.getElementById('proyectoEmpresa').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoTipoMuerto').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoVelViento').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoTempPromedio').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoPresionAtm').classList.replace('project-value', 'project-value-dim');
  document.getElementById('proyectoUbicacion').classList.replace('project-value', 'project-value-dim');
}

export async function guardarNuevaVersionProyecto() {

  try {
      const projectConfigJson = JSON.parse(localStorage.getItem('projectConfig'));

      // Pedir input para guardar notas de la versión
      const notasVersion = prompt("Ingrese notas o descripción para la nueva versión del proyecto:", "Actualización de datos");
      if (notasVersion === null) {
          console.log('[FRONTEND] Usuario canceló la entrada de notas de versión. Operación abortada.');
          return;
      }
      projectConfigJson.notas_version = notasVersion;

      const projectConfig = JSON.stringify(projectConfigJson);

      await fetch(`${API_BASE}/api/proyecto/guardar-version`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: projectConfig
      })
      .then(res => res.json())
      .then(data => {
          console.log("[FRONTEND] Full response:", data);
          window.location.href = 'index.html';
      })

  } catch (error) {
        console.error('[FRONTEND] Error al guardar nueva versión del proyecto:', error);
        alert('Error al guardar la nueva versión del proyecto. Por favor, inténtelo de nuevo.');
      return;
  }
}

const btnSaveProjectNewVersion = document.getElementById('btnSaveProjectNewVersion');

if (btnSaveProjectNewVersion) {
  btnSaveProjectNewVersion.addEventListener('click', async () => {
      await guardarNuevaVersionProyecto();
  });
}

// ===== FUNCIONES DE UI =====
export function updatePanelesDisplay(panelesActuales, elements, callbacks) {
  const { tablaPaneles, tablaAccordion, panelesInfo, btnCalcular } = elements;
  const { openSection } = callbacks;
  
  if (panelesActuales.length > 0) {
    // Mostrar tabla en el sub-acordeón con Overall Height
    let html = "<table><thead><tr><th>#</th><th>ID Muro</th><th>Grosor</th><th>Área</th><th>Peso</th><th>Volumen</th><th>Overall Width</th><th>Overall Height</th><th>CGx</th><th>CGy</th></thead><tbody>";
    panelesActuales.forEach((p, i) => {
      html += `<tr>
        <td>${p.num}</td>
        <td>${p.id_muro}</td>
        <td>${p.grosor ?? ''}</td>
        <td>${p.area ?? ''}</td>
        <td>${p.peso ?? ''}</td>
        <td>${p.volumen ?? ''}</td>
        <td>${p.overall_width || 'N/A'}</td>
        <td>${p.overall_height || 'N/A'}</td>
        <td>${p.cgx || 'N/A'}</td>
        <td>${p.cgy || 'N/A'}</td>
      

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

    // Habilitar todos los desplegables del menú
    const menuAccordions = document.getElementsByClassName("accordion-item");
    for (const item of menuAccordions) {
      item.classList.remove("disabled");
    }
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
  
  console.log('[DASHBOARD] Usando proyecto:', pid_proyecto);

  // Verificar si hay muros manuales existentes y advertir al usuario
  try {
    const checkResp = await fetch(`${API_BASE}/api/muros/project/${pid_proyecto}`, { credentials: 'include' });
    const checkJson = await checkResp.json();
    if (checkJson.ok && checkJson.muros) {
      const murosManual = checkJson.muros.filter(m => m.origen === 'MANUAL');
      if (murosManual.length > 0) {
        const confirmar = await mostrarModalConfirmacion(
          'Muros manuales existentes',
          `Este proyecto tiene ${murosManual.length} muro(s) manual(es). La importación reemplazará los muros importados previamente. Los muros manuales se mantendrán al final del listado.\n\n¿Desea continuar?`,
          { tipo: 'warning', mostrarCancelar: true }
        );
        if (!confirmar) {
          tablaPaneles.innerHTML = '';
          return;
        }
      }
    }
  } catch (e) {
    console.log('[DASHBOARD] No se pudo verificar muros manuales, continuando con importación');
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
  updateReportSectionState(globalVars);
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

    console.log('[DASHBOARD] Guardando txt en la base de datos...');
    const saveResp = await fetch(`${API_BASE}/api/proyecto/guardar-txt`, {
        method: 'POST',
        body: formData
    });
    const saveJson = await saveResp.json();
    if (!saveResp.ok || !saveJson.ok) {
        console.log('[DASHBOARD] Error guardando TXT en BD:', saveJson.error);
        tablaPaneles.innerHTML = `<p class="error">${saveJson.error || 'Error guardando el TXT en la base de datos.'}</p>`;
        updatePanelesDisplay();
        return;
    }
    console.log('[DASHBOARD] TXT guardado en la base de datos exitosamente');
    
    // Obtener los muros completos desde la base de datos (incluyendo overall_height)
    console.log('[DASHBOARD] Obteniendo muros completos desde la base de datos...');
    const murosCompletos = await fetchMurosFromDatabase();
    
    if (murosCompletos.length > 0) {
      globalVars.panelesActuales = murosCompletos;
      console.log('[DASHBOARD] Muros completos obtenidos desde BD:', globalVars.panelesActuales.length);
      
      // Notificación de éxito
      if (window.showNotification) {
        window.showNotification(
          'success',
          '✅ Muros Procesados',
          `Se importaron exitosamente ${murosCompletos.length} muros del archivo TXT.`,
          5000
        );
      }
      console.log('[DASHBOARD] Primer muro con overall_height:', globalVars.panelesActuales[0]);
    } else {
      // Fallback: usar los paneles del response de importación
      globalVars.panelesActuales = json.paneles;
      console.log('[DASHBOARD] Usando paneles del import response:', globalVars.panelesActuales.length);
    }
    
    // Mostrar sección de eliminación de muros en lugar de proceder directamente
    console.log('[DASHBOARD] Mostrando sección de eliminación de muros...');
    mostrarSeccionEliminacion(globalVars.panelesActuales);
    
    // Almacenar referencia global para las funciones de eliminación
    window.globalVars = globalVars;
    
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
    if (btnClearTxt) btnClearTxt.style.display = 'none';
    if (panelesInfo) {
      panelesInfo.innerHTML = '<p class="muted">Los paneles importados aparecerán aquí después de subir un archivo TXT.</p>';
    }

    // Limpiar variables globales
    globalVars.panelesActuales = [];
    globalVars.resultadosActuales = [];
    updateReportSectionState(globalVars);
    
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
      updateReportSectionState(globalVars);
      return;
    }

    console.log('[DASHBOARD] Cálculos completados exitosamente');
    globalVars.resultadosActuales = json.data;
    console.log('[DASHBOARD] Resultados obtenidos:', globalVars.resultadosActuales.length);

    // Renderizar resultados
    let html = "<h3>Resultados de cálculo</h3>";
    html += "<div class='kpis'>";
    globalVars.resultadosActuales.forEach((res, i) => {
      // Buscar el número original del panel basado en el ID del muro
      const panelOriginal = globalVars.panelesActuales.find(p => p.id_muro === res.idMuro);
      const numeroPanel = panelOriginal ? panelOriginal.num : i + 1;

      html += `<div class='kpi'><div class='kpi__label'>Panel #${numeroPanel} (${res.idMuro})</div>
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

    updateReportSectionState(globalVars);
    console.log('[DASHBOARD] Report section state updated');
  } catch (err) {
    console.log('[DASHBOARD] Error de conexión en cálculo:', err.message);
    resultadosCalculo.innerHTML = `<p class="error">Error de conexión: ${err.message}</p>`;
    updateReportSectionState(globalVars);
  }
}

// ===== BOTÓN: GENERAR INFORME (PDF / DOCX) =====
// Backward compat alias
export const handleGenerarPDF = handleGenerarInforme;

export async function handleGenerarInforme(elements, globalVars) {
  console.log('[DASHBOARD] Botón generar informe clickeado');
  const btnInforme = document.getElementById('btnInforme');

  // Read selected format
  const formatSelect = document.getElementById('reportFormat');
  const format = formatSelect ? formatSelect.value : 'pdf';
  const formatLabel = format === 'docx' ? 'DOCX' : 'PDF';

  // Read selected image file (if any)
  const imageInput = document.getElementById('reportImageInput');
  const imageFile = imageInput && imageInput.files && imageInput.files.length > 0 ? imageInput.files[0] : null;

  // 1. Declaramos las variables AQUÍ ARRIBA para que existan en toda la función
  let murosConBraces = [];
  let projectInfo = null;

  // Validate project exists at minimum
  const projectConfig = localStorage.getItem('projectConfig');
  if (!projectConfig) {
    alert('No hay proyecto seleccionado. Por favor selecciona un proyecto primero.');
    return;
  }

  // Guardar cambios pendientes
  console.log('[DASHBOARD] Guardando todos los cambios antes de generar informe...');
  try {
    const btnGuardarTop = document.getElementById('btnGuardarTodosBracesTop');
    const btnGuardarBottom = document.getElementById('btnGuardarTodosBraces');

    if (btnGuardarTop && btnGuardarTop.onclick) {
      await btnGuardarTop.onclick();
    } else if (btnGuardarBottom && btnGuardarBottom.onclick) {
      await btnGuardarBottom.onclick();
    } else if (window.guardarTodosBraces && typeof window.guardarTodosBraces === 'function') {
      await window.guardarTodosBraces();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // RECARGAR datos
    projectInfo = JSON.parse(projectConfig);

    // Usar projectInfo.pid o projectInfo.id según corresponda
    const pid = projectInfo.pid || projectInfo.id;

    const response = await fetch(`${API_BASE}/api/importar-muros/muros?pk_proyecto=${pid}`);
    if (!response.ok) throw new Error('Error al recargar datos de muros');

    const responseData = await response.json();
    const murosActualizados = responseData.muros || responseData;

    // Fusionar datos — si hay resultados de viento se fusionan, si no se usan los muros tal cual
    const hasViento = globalVars.resultadosTomoIII && globalVars.resultadosTomoIII.length > 0;
    murosConBraces = murosActualizados.map(muro => {
      const muroViento = hasViento ? globalVars.resultadosTomoIII.find(m => m.pid === muro.pid) : null;
      return {
        ...(muroViento || {}),
        ...muro,
        angulo_brace: muro.angulo_brace || muro.angulo || 55,
        npt: muro.npt || 0.350,
        tipo_brace_seleccionado: muro.tipo_brace_seleccionado || muro.tipo_brace || 'B12',
        x_braces: muro.x_braces || 2,
        x_inserto: muro.x_inserto || 0,
        eje: muro.eje || '',
        grosor: muro.grosor || 0,
        overall_height: muro.overall_height || 0,
        fbx: parseFloat(muro.fbx || 0),
        fby: parseFloat(muro.fby || 0),
        fb: parseFloat(muro.fb || 0)
      };
    });

  } catch (error) {
    console.error('[DASHBOARD] Error preparando datos:', error);
    alert('Error preparando datos para el informe: ' + error.message);
    return;
  }

  // USAR LOS GRUPOS YA CALCULADOS DE script.js en lugar de regenerarlos
  let gruposMuertos, tablaMuertos;

  if (window.gruposMuertosGlobal && Object.keys(window.gruposMuertosGlobal).length > 0) {
    console.log('[DASHBOARD] Usando grupos pre-calculados de script.js:', Object.keys(window.gruposMuertosGlobal).length, 'grupos');
    gruposMuertos = window.gruposMuertosGlobal;

    // Generar tablaMuertos desde los grupos pre-calculados
    tablaMuertos = [];
    let numeroMuerto = 1;
    Object.keys(gruposMuertos).forEach(clave => {
      const grupo = gruposMuertos[clave];
      tablaMuertos.push({
        numero: numeroMuerto.toString(),
        muerto: `M${numeroMuerto}`,
        x_inserto: typeof grupo.xInserto === 'number' ? `${grupo.xInserto.toFixed(2)}m` : `${grupo.x_inserto?.toFixed(2) || '0.00'}m`,
        tipo_brace: grupo.tipo || grupo.tipo_brace || 'B12',
        angulo: `${grupo.ang || grupo.angulo || 55}°`,
        eje: (grupo.eje || 1).toString(),
        cantidad_muros: (grupo.cantidadMuros || grupo.muros?.length || 0).toString(),
        muros_incluidos: grupo.muros?.join?.(', ') || ''
      });
      numeroMuerto++;
    });

    console.log('[DASHBOARD] tablaMuertos generada con', tablaMuertos.length, 'muertos');
  } else {
    console.log('[DASHBOARD] No hay grupos pre-calculados, generando desde murosConBraces...');
    // Fallback: Generar grupos desde cero (código original)
    gruposMuertos = {};
    tablaMuertos = [];

    murosConBraces.forEach(muro => {
    const xInserto = parseFloat(muro.x_inserto || 0).toFixed(2);
    const tipoBrace = muro.tipo_brace_seleccionado || 'B12';
    const anguloVal = Math.round(muro.angulo_brace || 55);
    const ejeVal = muro.eje || 1;
    const clave = `${xInserto}|${tipoBrace}|${anguloVal}|${ejeVal}`;

    console.log(`[GRUPOS] Muro ${muro.id_muro}: x_inserto=${muro.x_inserto}, xInserto=${xInserto}, tipo=${tipoBrace}, angulo=${anguloVal}, eje=${ejeVal}, clave=${clave}`);

    if (!gruposMuertos[clave]) {
      gruposMuertos[clave] = {
        x_inserto: parseFloat(xInserto),
        tipo_brace: tipoBrace,
        angulo: anguloVal,
        eje: ejeVal,
        muros: []
      };
    }
    gruposMuertos[clave].muros.push(muro);
  });

  window.gruposMuertosGlobal = gruposMuertos;
  console.log('[DASHBOARD] Grupos actualizados:', Object.keys(gruposMuertos));
  console.log('[DASHBOARD] Total de grupos (muertos únicos):', Object.keys(gruposMuertos).length);
  Object.keys(gruposMuertos).forEach(clave => {
    console.log(`[DASHBOARD]   - Grupo "${clave}": ${gruposMuertos[clave].muros.length} muros`);
  });

  // Tabla resumen
  let numeroMuerto = 1;
  Object.keys(gruposMuertos).forEach(clave => {
    const grupo = gruposMuertos[clave];
    const primerMuro = grupo.muros[0];
    tablaMuertos.push({
      numero: numeroMuerto.toString(),
      muerto: `M${numeroMuerto}`,
      x_braces: (primerMuro.x_braces || 2).toString(),
      tipo_brace: grupo.tipo_brace,
      angulo: `${grupo.angulo}°`,
      x_inserto: `${grupo.x_inserto.toFixed(2)}m`,
      eje: grupo.eje.toString(),
      profundidad: '2.0',
      tipo_construccion: (primerMuro.x_braces || 2) >= 3 ? 'Reforzado' : 'Estándar',
      cantidad_muros: grupo.muros.length.toString(),
      muros_incluidos: grupo.muros.map(m => m.id_muro).join(', ')
    });
    numeroMuerto++;
  });
  } // Cierre del else

  mostrarConfigGrupos(gruposMuertos);

  // Recalcular macizos para asegurar sincronización
  console.log('[DASHBOARD] Recalculando macizos antes de enviar informe...');
  if (typeof window.ejecutarCalculosArmado === 'function') {
     await window.ejecutarCalculosArmado();
  }

  // Configuración UI
  const configArmadoActual = {
    construccion: {
        resistenciaConcreto: document.getElementById('tipoConcreto')?.value || 2400,
        factorDesperdicio: document.getElementById('factorDesperdicio')?.value || 1.0
    },
    longitudinal: {
        tipoVarilla: document.getElementById('tipoVarillaLongitudinal')?.value,
        recubrimiento: document.getElementById('recubrimientoLongitudinal')?.value,
        separacion: document.getElementById('separacionLongitudinal')?.value,
        varillasSuperiores: document.getElementById('cantVarillasSuperior')?.value,
        varillasMedias: document.getElementById('cantVarillasMedias')?.value,
        varillasInferiores: document.getElementById('cantVarillasInferior')?.value
    },
    transversal: {
        tipoVarilla: document.getElementById('tipoVarillaTransversal')?.value,
        recubrimiento: document.getElementById('recubrimientoTransversal')?.value,
        separacion: document.getElementById('separacionTransversal')?.value,
        longitudGanchos: document.getElementById('longGanchoEstribo')?.value
    },
    alambre: {
        diametroAlambre: document.getElementById('diametroAlambre')?.value,
        longitudPorVuelta: document.getElementById('longitudVuelta')?.value,
        factorDesperdicioAlambre: document.getElementById('factorDesperdicioAlambre')?.value
    }
  };

  // Enviar informe
  const progressIndicator = document.createElement('div');
  progressIndicator.style.cssText = "position: fixed; top: 20px; right: 20px; background: #007acc; color: white; padding: 15px; border-radius: 8px; z-index: 10000;";
  progressIndicator.textContent = `Generando ${formatLabel}...`;
  document.body.appendChild(progressIndicator);
  btnInforme.disabled = true;

  try {
    console.log('[DASHBOARD] Enviando reporteMacizos:', window.ultimosResultadosMacizos);

    const payload = {
        format: format,
        paneles: murosConBraces,
        projectInfo: projectInfo,
        tablaMuertos: tablaMuertos,
        reporteMacizos: window.ultimosResultadosMacizos,
        configArmado: configArmadoActual
    };

    let resp;
    if (imageFile) {
      // Use FormData for multipart upload
      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));
      formData.append('format', format);
      formData.append('image', imageFile);
      resp = await fetch(`${API_BASE}/api/informe/generar`, {
        method: 'POST',
        body: formData
      });
    } else {
      resp = await fetch(`${API_BASE}/api/informe/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!resp.ok) {
      let errorMsg = 'Error en respuesta del servidor';
      try {
        const errBody = await resp.json();
        if (errBody.errors) errorMsg = errBody.errors.join('\n');
        else if (errBody.error) errorMsg = errBody.error;
      } catch (_) { /* ignore parse error */ }
      throw new Error(errorMsg);
    }

    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'docx' ? 'informe_proyecto.docx' : 'informe_proyecto.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert(`Error generando ${formatLabel}: ` + err.message);
  } finally {
    progressIndicator.remove();
    btnInforme.disabled = false;
  }
}

// Client-side validation before sending
function validateReportData(muros) {
  const errors = [];
  if (!muros || muros.length === 0) {
    errors.push('- No hay muros con datos de cálculo.');
  } else {
    // Verify geometry and brace data
    const badGeometry = muros.filter(m => {
      const grosor = Number(m.grosor) || 0;
      const area = Number(m.area) || 0;
      return grosor <= 0 || area <= 0;
    });
    if (badGeometry.length > 0) {
      errors.push(`- ${badGeometry.length} muro(s) con grosor o área inválidos.`);
    }
    const noFb = muros.filter(m => !m.fb || Number(m.fb) <= 0);
    if (noFb.length > 0) {
      errors.push(`- ${noFb.length} muro(s) sin fuerza de brace (fb) calculada.`);
    }
    const noXBraces = muros.filter(m => !m.x_braces || Number(m.x_braces) <= 0);
    if (noXBraces.length > 0) {
      errors.push(`- ${noXBraces.length} muro(s) sin cantidad de braces asignada.`);
    }
    const noId = muros.filter(m => !m.id_muro && !m.idMuro);
    if (noId.length > 0) {
      errors.push(`- ${noId.length} muro(s) sin identificador.`);
    }
  }
  const projectConfig = localStorage.getItem('projectConfig');
  if (projectConfig) {
    try {
      const pi = JSON.parse(projectConfig);
      if (!pi.nombre) errors.push('- El proyecto no tiene nombre asignado.');
    } catch (_) {
      errors.push('- No se pudo leer la configuración del proyecto.');
    }
  } else {
    errors.push('- No hay proyecto seleccionado.');
  }
  return errors;
}

// === Report section state management ===

/**
 * Updates the "Generar Informe" section readiness state.
 * Checks prerequisites and enables/disables the section accordingly.
 */
export function updateReportSectionState(globalVars) {
  const section = document.getElementById('section-generar-informe');
  const btnInforme = document.getElementById('btnInforme');
  const readyMuros = document.getElementById('ready-muros');
  const readyViento = document.getElementById('ready-viento');
  const readyBraces = document.getElementById('ready-braces');
  const errorPanel = document.getElementById('reportErrorPanel');
  const errorList = document.getElementById('reportErrorList');

  if (!section) return;

  // Check prerequisites
  const hasMuros = globalVars.panelesActuales && globalVars.panelesActuales.length > 0;
  const hasViento = globalVars.resultadosTomoIII && globalVars.resultadosTomoIII.length > 0;
  const hasBraces = hasViento && globalVars.resultadosTomoIII.some(m => m.fb && Number(m.fb) > 0);

  // Update checklist items
  if (readyMuros) {
    readyMuros.classList.toggle('ready', hasMuros);
    readyMuros.classList.toggle('pending', !hasMuros);
  }
  if (readyViento) {
    readyViento.classList.toggle('ready', hasViento);
    readyViento.classList.toggle('pending', !hasViento);
  }
  if (readyBraces) {
    readyBraces.classList.toggle('ready', hasBraces);
    readyBraces.classList.toggle('pending', !hasBraces);
  }

  // Section and button are always enabled — report generates with whatever data is available
  section.classList.remove('disabled');
  if (btnInforme) {
    btnInforme.disabled = false;
  }

  // Hide error panel when updating state (will be shown on generation attempt)
  if (errorPanel) {
    errorPanel.style.display = 'none';
  }
  if (errorList) {
    errorList.innerHTML = '';
  }
}

/**
 * Shows validation errors in the report error panel.
 */
function showReportErrors(errors) {
  const errorPanel = document.getElementById('reportErrorPanel');
  const errorList = document.getElementById('reportErrorList');
  if (!errorPanel || !errorList) return;
  if (errors.length === 0) {
    errorPanel.style.display = 'none';
    errorList.innerHTML = '';
    return;
  }
  errorList.innerHTML = errors.map(e => `<li>${e}</li>`).join('');
  errorPanel.style.display = '';
}

// Expose for script.js
window.updateReportSectionState = updateReportSectionState;

// Image selection handlers (called from script.js setupImageSelector)
export function setupReportImageSelector() {
  const btnSelect = document.getElementById('btnSelectImage');
  const btnRemove = document.getElementById('btnRemoveImage');
  const imageInput = document.getElementById('reportImageInput');
  const fileNameSpan = document.getElementById('imageFileName');
  const previewDiv = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');

  if (!btnSelect || !imageInput) return;

  btnSelect.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) return;

    // Validate type
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert('Solo se permiten imágenes PNG o JPEG.');
      imageInput.value = '';
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB.');
      imageInput.value = '';
      return;
    }

    if (fileNameSpan) fileNameSpan.textContent = file.name;
    if (btnRemove) btnRemove.style.display = '';

    // Show preview
    if (previewDiv && previewImg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewDiv.style.display = '';
      };
      reader.readAsDataURL(file);
    }
  });

  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      imageInput.value = '';
      if (fileNameSpan) fileNameSpan.textContent = '';
      btnRemove.style.display = 'none';
      if (previewDiv) previewDiv.style.display = 'none';
      if (previewImg) previewImg.src = '';
    });
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

// ===== FUNCIONES PARA MACIZOS DE ANCLAJE (MUERTOS) =====
// ELIMINADAS - Los cálculos cilíndricos deben ser funcionalidades INDEPENDIENTES
// que reciben datos directamente del TXT sin agrupar por braces.
// NO deben usar window.lastGruposMuertos que agrupa por X, ángulo y eje.
// TODO: Crear nuevas funciones que trabajen con muros sin agrupar

// ===== FUNCIONES PARA ELIMINACIÓN DE MUROS =====

// Variables globales para el proceso de eliminación
let murosOriginales = [];
let rangosEliminacion = [];

// Función para mostrar la sección de eliminación de muros
export function mostrarSeccionEliminacion(muros) {
  console.log('[DASHBOARD] mostrarSeccionEliminacion iniciada');
  murosOriginales = [...muros];
  rangosEliminacion = [];
  
  const accordion = document.getElementById('eliminarMurosAccordion');
  const totalElement = document.getElementById('totalMurosDetectados');
  
  if (accordion && totalElement) {
    accordion.style.display = 'block';
    totalElement.textContent = muros.length;
    
    // Limpiar rangos existentes
    const rangosContainer = document.getElementById('rangosEliminar');
    console.log('[DASHBOARD] Limpiando rangos. Elementos antes:', rangosContainer.children.length);
    rangosContainer.innerHTML = '<p class="muted">No hay rangos definidos. Haz clic en "Agregar Rango" para empezar.</p>';
    console.log('[DASHBOARD] Elementos después de limpiar:', rangosContainer.children.length);
    
    // Limpiar preview
    const preview = document.getElementById('previsualizacionEliminacion');
    preview.style.display = 'none';
    
    console.log('[DASHBOARD] Sección de eliminación mostrada con', muros.length, 'muros');
  }
}

// Función para agregar un nuevo rango de eliminación
export function agregarRangoEliminacion() {
  console.log('[DASHBOARD] agregarRangoEliminacion llamada');
  console.trace('[DASHBOARD] Stack trace de agregarRangoEliminacion');
  
  const rangosContainer = document.getElementById('rangosEliminar');
  
  // Si es el primer rango, limpiar el mensaje inicial
  const existingRangos = rangosContainer.querySelectorAll('.rango-eliminacion-item');
  if (existingRangos.length === 0) {
    rangosContainer.innerHTML = '';
  }
  
  const rangoId = Date.now();
  const rangoDiv = document.createElement('div');
  rangoDiv.className = 'rango-eliminacion-item';
  rangoDiv.setAttribute('data-rango-id', rangoId);
  
  rangoDiv.innerHTML = `
    <div class="rango-inputs">
      <span>Desde muro:</span>
      <input type="number" class="rango-desde-elim" min="1" max="${murosOriginales.length}" placeholder="Ej: 1">
      <span>hasta:</span>
      <input type="number" class="rango-hasta-elim" min="1" max="${murosOriginales.length}" placeholder="Ej: 10">
    </div>
    <div class="rango-info">
      <span class="rango-count">0 muros</span>
    </div>
    <button class="btn-eliminar-rango" onclick="eliminarRango(${rangoId})">🗑️ Quitar</button>
  `;
  
  rangosContainer.appendChild(rangoDiv);
  
  // Agregar event listeners para actualizar el conteo
  const inputDesde = rangoDiv.querySelector('.rango-desde-elim');
  const inputHasta = rangoDiv.querySelector('.rango-hasta-elim');
  
  [inputDesde, inputHasta].forEach(input => {
    input.addEventListener('input', () => actualizarConteoRango(rangoId));
  });
  
  console.log('[DASHBOARD] Nuevo rango agregado:', rangoId, 'Total rangos:', rangosContainer.querySelectorAll('.rango-eliminacion-item').length);
}

// Función para actualizar el conteo de muros en un rango
function actualizarConteoRango(rangoId) {
  const rangoDiv = document.querySelector(`[data-rango-id="${rangoId}"]`);
  if (!rangoDiv) return;
  
  const desde = parseInt(rangoDiv.querySelector('.rango-desde-elim').value) || 0;
  const hasta = parseInt(rangoDiv.querySelector('.rango-hasta-elim').value) || 0;
  const countElement = rangoDiv.querySelector('.rango-count');
  
  if (desde > 0 && hasta > 0 && desde <= hasta && hasta <= murosOriginales.length) {
    const count = hasta - desde + 1;
    countElement.textContent = `${count} muros`;
    countElement.style.color = '#dc3545';
  } else {
    countElement.textContent = 'Rango inválido';
    countElement.style.color = '#6c757d';
  }
}

// Función para eliminar un rango
function eliminarRango(rangoId) {
  const rangoDiv = document.querySelector(`[data-rango-id="${rangoId}"]`);
  if (rangoDiv) {
    rangoDiv.remove();
    rangosEliminacion = rangosEliminacion.filter(r => r.id !== rangoId);
    
    // Si no quedan rangos, mostrar mensaje
    const rangosContainer = document.getElementById('rangosEliminar');
    if (rangosContainer.children.length === 0) {
      rangosContainer.innerHTML = '<p class="muted">No hay rangos definidos. Haz clic en "Agregar Rango" para empezar.</p>';
    }
    
    console.log('[DASHBOARD] Rango eliminado:', rangoId);
  }
}

// Función para previsualizar la eliminación
export function previsualizarEliminacion() {
  console.log('[DASHBOARD] previsualizarEliminacion iniciada');
  const rangosValidos = obtenerRangosEliminacion();
  const murosAEliminar = calcularMurosAEliminar(rangosValidos);
  const murosRestantes = murosOriginales.length - murosAEliminar.length;
  
  const preview = document.getElementById('previsualizacionEliminacion');
  
  let html = `
    <div class="preview-eliminacion">
      <h4>📊 Vista Previa de Eliminación</h4>
      
      <div class="preview-stats">
        <div class="preview-stat">
          <div class="number">${murosOriginales.length}</div>
          <div class="label">Muros originales</div>
        </div>
        <div class="preview-stat">
          <div class="number" style="color: #dc3545;">${murosAEliminar.length}</div>
          <div class="label">A eliminar</div>
        </div>
        <div class="preview-stat">
          <div class="number" style="color: #28a745;">${murosRestantes}</div>
          <div class="label">Resultantes</div>
        </div>
      </div>
  `;
  
  if (murosAEliminar.length > 0) {
    html += `
      <h5>🗑️ Muros que serán eliminados:</h5>
      <div class="muros-eliminados-list">
        ${murosAEliminar.map(muro => `Muro ${muro.id_muro} (#${muro.num})`).join(', ')}
      </div>
    `;
  } else {
    html += `<p class="muted">No hay muros marcados para eliminar.</p>`;
  }
  
  html += `</div>`;
  
  preview.innerHTML = html;
  preview.style.display = 'block';
  
  console.log('[DASHBOARD] Preview generado:', murosAEliminar.length, 'muros a eliminar');
}

// Función auxiliar para obtener rangos válidos (eliminación de muros)
function obtenerRangosEliminacion() {
  // Solo buscar rangos dentro del contenedor de eliminación
  const rangosContainer = document.getElementById('rangosEliminar');
  const rangosDiv = rangosContainer ? rangosContainer.querySelectorAll('.rango-eliminacion-item') : [];
  const rangosValidos = [];
  
  console.log('[DASHBOARD] Elementos .rango-eliminacion-item encontrados en rangosEliminar:', rangosDiv.length);
  
  rangosDiv.forEach((rangoDiv, index) => {
    const desdeInput = rangoDiv.querySelector('.rango-desde-elim');
    const hastaInput = rangoDiv.querySelector('.rango-hasta-elim');
    
    console.log(`[DASHBOARD] Rango ${index + 1}:`, {
      desdeInput: desdeInput?.value,
      hastaInput: hastaInput?.value,
      desdeHasValue: desdeInput?.value !== '',
      hastaHasValue: hastaInput?.value !== ''
    });
    
    if (desdeInput && hastaInput && desdeInput.value !== '' && hastaInput.value !== '') {
      const desde = parseInt(desdeInput.value);
      const hasta = parseInt(hastaInput.value);
      
      if (desde > 0 && hasta > 0 && desde <= hasta && hasta <= murosOriginales.length) {
        rangosValidos.push({ desde, hasta });
        console.log(`[DASHBOARD] Rango válido agregado: ${desde}-${hasta}`);
      } else {
        console.log(`[DASHBOARD] Rango inválido: ${desde}-${hasta}`);
      }
    } else {
      console.log(`[DASHBOARD] Rango ${index + 1} sin valores (inputs vacíos)`);
    }
  });
  
  console.log('[DASHBOARD] Rangos válidos finales:', rangosValidos);
  return rangosValidos;
}

// Función auxiliar para calcular muros a eliminar
function calcularMurosAEliminar(rangos) {
  const murosAEliminar = [];
  
  console.log('[DASHBOARD] Calculando muros a eliminar con rangos:', rangos);
  console.log('[DASHBOARD] Total muros originales:', murosOriginales.length);
  
  rangos.forEach(rango => {
    console.log(`[DASHBOARD] Procesando rango: ${rango.desde} a ${rango.hasta}`);
    for (let numeroMuro = rango.desde; numeroMuro <= rango.hasta; numeroMuro++) {
      // Buscar muro por su número (campo num)
      const muro = murosOriginales.find(m => m.num === numeroMuro);
      if (muro && !murosAEliminar.includes(muro)) {
        murosAEliminar.push(muro);
        console.log(`[DASHBOARD] Muro agregado para eliminar: ${muro.id_muro} (#${muro.num})`);
      } else if (!muro) {
        console.log(`[DASHBOARD] Muro #${numeroMuro} no encontrado`);
      }
    }
  });
  
  console.log('[DASHBOARD] Total muros a eliminar:', murosAEliminar.length);
  return murosAEliminar.sort((a, b) => a.num - b.num);
}

// Función para confirmar la importación con muros filtrados
export async function confirmarImportacionFiltrada() {
  console.log('[DASHBOARD] confirmarImportacionFiltrada - Iniciando proceso');
  console.trace('[DASHBOARD] Stack trace de confirmarImportacionFiltrada');
  
  const rangosValidos = obtenerRangosEliminacion();
  
  // Si no hay rangos definidos, importar todos los muros sin eliminar ninguno
  if (rangosValidos.length === 0) {
    const confirmarSinEliminar = await mostrarModalConfirmacion(
      'Importar sin eliminar',
      '⚠️ No has definido ningún rango de eliminación.\n\n¿Deseas importar TODOS los muros detectados sin eliminar ninguno?',
      { tipo: 'info', textoAceptar: 'Sí, importar todos', textoCancelar: 'Cancelar' }
    );
    
    if (!confirmarSinEliminar) {
      console.log('[DASHBOARD] Usuario canceló importación sin rangos');
      return;
    }
    
    // Importar todos los muros sin eliminar
    console.log('[DASHBOARD] Importando todos los muros sin eliminación');
    finalizarImportacion(murosOriginales);
    
    // Ocultar sección de eliminación
    document.getElementById('eliminarMurosAccordion').style.display = 'none';
    
    await mostrarModalConfirmacion(
      'Mensaje',
      `✅ Importación exitosa!\n\n• Muros importados: ${murosOriginales.length}`,
      { tipo: 'success', mostrarCancelar: false }
    );
    
    return;
  }
  
  const murosAEliminar = calcularMurosAEliminar(rangosValidos);
  const murosRestantes = murosOriginales.filter(muro => 
    !murosAEliminar.some(muroElim => muroElim.pid === muro.pid)
  );
  
  if (murosRestantes.length === 0) {
    await mostrarModalConfirmacion(
      'Error',
      '❌ No puedes eliminar todos los muros. Debe quedar al menos uno.',
      { tipo: 'warning', mostrarCancelar: false }
    );
    return;
  }
  
  // PASO 1: Mostrar modal de confirmación (sin eliminar nada todavía)
  const mensaje = `🔍 ¿Estás seguro de que deseas ELIMINAR estos muros de la base de datos?\n\n📊 Resumen:\n• Muros originales: ${murosOriginales.length}\n• Muros a ELIMINAR: ${murosAEliminar.length}\n• Muros resultantes: ${murosRestantes.length}\n\n⚠️ Esta acción NO se puede deshacer.`;
  
  const confirmacion = await mostrarModalConfirmacion(
    'Confirmación',
    mensaje,
    { tipo: 'warning', textoAceptar: 'Aceptar' }
  );
  
  // PASO 2: Si el usuario cancela, NO hacer nada (mantener rangos editables)
  if (!confirmacion) {
    console.log('[DASHBOARD] Eliminación cancelada por el usuario');
    return;
  }
  
  // PASO 3: Si el usuario confirma, AHORA sí eliminar de la base de datos
  console.log('[DASHBOARD] Usuario confirmó eliminación. Eliminando', murosAEliminar.length, 'muros de BD...');
  
  try {
    const projectConfig = localStorage.getItem('projectConfig');
    if (!projectConfig) {
      await mostrarModalConfirmacion(
        'Error',
        'No se encontró el proyecto actual',
        { tipo: 'warning', mostrarCancelar: false }
      );
      return;
    }
    
    const proyecto = JSON.parse(projectConfig);
    const pidsAEliminar = murosAEliminar.map(m => m.pid);
    
    console.log('[DASHBOARD] PIDs a eliminar:', pidsAEliminar);
    
    // Eliminar muros de la base de datos
    const response = await fetch(`${API_BASE}/api/importar-muros/muros/batch-delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pk_proyecto: proyecto.pid,
        pids: pidsAEliminar
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[DASHBOARD] Respuesta de eliminación:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Error desconocido eliminando muros');
    }
    
    console.log('[DASHBOARD] ✅ Muros eliminados exitosamente de BD');
    
    // PASO 4: Actualizar la variable global con los muros filtrados
    const globalVars = window.globalVars || {};
    globalVars.panelesActuales = murosRestantes;
    
    // Ocultar sección de eliminación
    document.getElementById('eliminarMurosAccordion').style.display = 'none';
    
    // Continuar con el flujo normal de importación
    finalizarImportacion(murosRestantes);
    
    // Limpiar rangos de eliminación después de importar exitosamente
    limpiarRangosEliminacion();
    
    console.log('[DASHBOARD] ✅ Importación confirmada con', murosRestantes.length, 'muros filtrados');
    
    // Mostrar mensaje de éxito
    await mostrarModalConfirmacion(
      'Mensaje',
      `✅ Importación exitosa!\n\n• Muros eliminados: ${murosAEliminar.length}\n• Muros importados: ${murosRestantes.length}`,
      { tipo: 'success', mostrarCancelar: false }
    );
    
  } catch (error) {
    console.error('[DASHBOARD] ❌ Error en confirmación de importación:', error);
    await mostrarModalConfirmacion(
      'Error',
      `❌ Error al eliminar muros de la base de datos:\n\n${error.message}`,
      { tipo: 'warning', mostrarCancelar: false }
    );
  }
}

// Función para finalizar la importación (continuar flujo normal)
function finalizarImportacion(murosFinales) {
  // Actualizar variable global
  if (window.globalVars) {
    window.globalVars.panelesActuales = murosFinales;
  }
  
  // Obtener elementos de UI necesarios
  const tablaPaneles = document.getElementById('tablaPaneles');
  const tablaAccordion = document.getElementById('tablaAccordion');
  const panelesInfo = document.getElementById('panelesInfo');
  const btnCalcular = document.getElementById('btnCalcular');
  
  const uiElements = { tablaPaneles, tablaAccordion, panelesInfo, btnCalcular };
  const callbacks = { openSection: (id) => {} }; // Función dummy para openSection
  
  // Actualizar tabla de paneles usando la función global
  if (typeof updatePanelesDisplay === 'function') {
    updatePanelesDisplay(murosFinales, uiElements, callbacks);
  }
  
  // Mostrar accordion de tabla de paneles
  if (tablaAccordion) {
    tablaAccordion.style.display = 'block';
  }
  
  // Habilitar botones de cálculo
  const btnInforme = document.getElementById('btnGenerarPDF');
  
  if (btnCalcular) btnCalcular.style.display = 'inline-block';
  if (btnInforme) btnInforme.style.display = 'inline-block';
  
  // Mostrar sección de asignación de ejes después de importar
  const ejesPanel = document.getElementById('ejesRangoPanel');
  if (ejesPanel) {
    ejesPanel.style.display = 'block';
    console.log('[DASHBOARD] Sección de asignación de ejes mostrada');
  }

  // Refrescar tabla de muros manuales para reflejar la importación
  if (typeof window.refreshMurosTable === 'function') {
    window.refreshMurosTable();
  }
  
  // Cargar tabla de braces después de importar
  console.log('[DASHBOARD] Cargando tabla de braces...');
  if (typeof window.cargarTablaBraces === 'function') {
    window.cargarTablaBraces();
  }
  
  console.log('[DASHBOARD] Importación finalizada con', murosFinales.length, 'muros');
}

// Función para limpiar rangos de eliminación después de importar
function limpiarRangosEliminacion() {
  const rangosContainer = document.getElementById('rangosEliminar');
  if (rangosContainer) {
    rangosContainer.innerHTML = '<p class="muted">Rangos de eliminación limpiados después de la importación.</p>';
    console.log('[DASHBOARD] Rangos de eliminación limpiados');
  }
}

// Función para cancelar la eliminación
export function cancelarEliminacion() {
  // Ocultar sección de eliminación
  document.getElementById('eliminarMurosAccordion').style.display = 'none';
  
  // Continuar con importación normal de todos los muros
  finalizarImportacion(murosOriginales);
}

// ===== ARMADO RECTANGULAR =====


// Configuración global del armado rectangular
let configArmado = {
  // Varillas longitudinales
  tipoVarillaLongitudinal: 4,        // #4 (0.994 kg/m)
  recubrimientoLongitudinal: 4,      // 4 cm (como recomienda)
  separacionLongitudinal: 60,        // 60 cm ✅
  cantVarillasSuperior: 4,           // 4 ✅
  cantVarillasMedias: 2,             // 2 (no null)
  cantVarillasInferior: 2,           // 2 ✅
  
  // Varillas transversales (estribos)
  tipoVarillaTransversal: 3,         // #3 (0.560 kg/m) ✅
  recubrimientoTransversal: 4,       // 4 cm (como recomienda)
  separacionTransversal: 25,         // 25 cm (como recomienda)
  longGanchoEstribo: 0.7,            // 0.7 m ✅
  
  // Construcción
  tipoConcreto: 2400,                // 2400 kg/m³ (como recomienda)
  factorDesperdicio: 1.0,            // 1.0 (como recomienda)
  
  // Alambre de amarre
  diametroAlambre: 1.22,             // 1.22 mm (como recomienda)
  longitudVuelta: 35,                // 35 cm (como recomienda)
  factorDesperdicioAlambre: 1.15     // 1.15 (como recomienda)
};

// Función para inicializar el armado rectangular
function initArmadoRectangular() {
  // Verificar que existan los elementos del DOM
  if (!document.getElementById('btnCalcularArmado')) {
    console.log('[ARMADO] Elementos del armado no encontrados, omitiendo inicialización');
    return;
  }

  // Cargar configuración inicial en los inputs
  document.getElementById('tipoVarillaLongitudinal').value = configArmado.tipoVarillaLongitudinal;
  document.getElementById('recubrimientoLongitudinal').value = configArmado.recubrimientoLongitudinal;
  // Ocultar inputs globales de separación, ya que ahora se configuran por grupo
  const sepLongInput = document.getElementById('separacionLongitudinal');
  if (sepLongInput) sepLongInput.closest('.form-group, .mb-3, .col, div').style.display = 'none';
  const sepTransInput = document.getElementById('separacionTransversal');
  if (sepTransInput) sepTransInput.closest('.form-group, .mb-3, .col, div').style.display = 'none';

  document.getElementById('cantVarillasSuperior').value = configArmado.cantVarillasSuperior;
  if (configArmado.cantVarillasMedias !== null) {
    document.getElementById('cantVarillasMedias').value = configArmado.cantVarillasMedias;
  }
  document.getElementById('cantVarillasInferior').value = configArmado.cantVarillasInferior;
  document.getElementById('tipoVarillaTransversal').value = configArmado.tipoVarillaTransversal;
  document.getElementById('recubrimientoTransversal').value = configArmado.recubrimientoTransversal;
  document.getElementById('longGanchoEstribo').value = configArmado.longGanchoEstribo;
  document.getElementById('tipoConcreto').value = configArmado.tipoConcreto;
  document.getElementById('factorDesperdicio').value = configArmado.factorDesperdicio;
  document.getElementById('diametroAlambre').value = configArmado.diametroAlambre;
  document.getElementById('longitudVuelta').value = configArmado.longitudVuelta;
  document.getElementById('factorDesperdicioAlambre').value = configArmado.factorDesperdicioAlambre;
  
  // Event listener para el botón de reagrupar muertos
  const btnReagrupar = document.getElementById('btnReagruparMuertos');
  if (btnReagrupar) {
    btnReagrupar.addEventListener('click', reagruparMuertos);
    console.log('[DASHBOARD] Event listener agregado a btnReagruparMuertos');
  }
  
  // Event listener para el botón de calcular armado
  document.getElementById('btnCalcularArmado').addEventListener('click', ejecutarCalculosArmado);
  
  // Event listeners para actualizar configuración cuando cambien los inputs
  document.querySelectorAll('#armadoRectangular .form-control').forEach(input => {
    input.addEventListener('change', actualizarConfiguracion);
  });
  
  console.log('[ARMADO] Armado rectangular inicializado correctamente');
}

// Función para actualizar la configuración desde los inputs
function actualizarConfiguracion() {
  // Usar valores del formulario si existen, si no mantener los defaults
  const tipoVarLong = document.getElementById('tipoVarillaLongitudinal');
  if (tipoVarLong) configArmado.tipoVarillaLongitudinal = parseInt(tipoVarLong.value);
  
  const recubLong = document.getElementById('recubrimientoLongitudinal');
  if (recubLong) configArmado.recubrimientoLongitudinal = parseFloat(recubLong.value);
  
  const sepLong = document.getElementById('separacionLongitudinal');
  if (sepLong) configArmado.separacionLongitudinal = parseFloat(sepLong.value);
  
  const varSup = document.getElementById('cantVarillasSuperior');
  if (varSup) configArmado.cantVarillasSuperior = parseInt(varSup.value);
  
  const varMed = document.getElementById('cantVarillasMedias');
  if (varMed) {
    const mediasValue = varMed.value;
    configArmado.cantVarillasMedias = mediasValue ? parseInt(mediasValue) : null;
  }
  
  const varInf = document.getElementById('cantVarillasInferior');
  if (varInf) configArmado.cantVarillasInferior = parseInt(varInf.value);
  
  const tipoVarTrans = document.getElementById('tipoVarillaTransversal');
  if (tipoVarTrans) configArmado.tipoVarillaTransversal = parseInt(tipoVarTrans.value);
  
  const recubTrans = document.getElementById('recubrimientoTransversal');
  if (recubTrans) configArmado.recubrimientoTransversal = parseFloat(recubTrans.value);
  
  const sepTrans = document.getElementById('separacionTransversal');
  if (sepTrans) configArmado.separacionTransversal = parseFloat(sepTrans.value);
  
  const gancho = document.getElementById('longGanchoEstribo');
  if (gancho) configArmado.longGanchoEstribo = parseFloat(gancho.value);
  
  const tipoConc = document.getElementById('tipoConcreto');
  if (tipoConc) configArmado.tipoConcreto = parseFloat(tipoConc.value);
  
  const factDesp = document.getElementById('factorDesperdicio');
  if (factDesp) configArmado.factorDesperdicio = parseFloat(factDesp.value);
  
  const diamAlamb = document.getElementById('diametroAlambre');
  if (diamAlamb) configArmado.diametroAlambre = parseFloat(diamAlamb.value);
  
  const longVuelta = document.getElementById('longitudVuelta');
  if (longVuelta) configArmado.longitudVuelta = parseFloat(longVuelta.value);
  
  const factDespAlamb = document.getElementById('factorDesperdicioAlambre');
  if (factDespAlamb) configArmado.factorDesperdicioAlambre = parseFloat(factDespAlamb.value);
}

// ===== FUNCIONES PARA CONFIGURACIÓN DE GRUPOS DE MUERTOS =====
function mostrarConfigGrupos(gruposMuertos) {
  console.log('[DASHBOARD] mostrarConfigGrupos - Mostrando listado de muertos');
  console.log('[DASHBOARD] Cantidad de grupos recibidos:', Object.keys(gruposMuertos).length);
  console.log('[DASHBOARD] Grupos:', gruposMuertos);
  
  const configContainer = document.getElementById('configGruposContainer');
  
  if (!configContainer) {
    console.error('[DASHBOARD] No se encontró contenedor de configuración');
    return;
  }
  
  // Inicializar almacenamiento global de configuración si no existe
  if (!window.configGruposMuertos) {
    window.configGruposMuertos = {};
  }
  
  // Detectar formato: script.js usa {M1: {...}, M2: {...}} vs dashboard.js usa {'2_55_1': {...}}
  const primeraClave = Object.keys(gruposMuertos)[0];
  const formatoScriptJS = primeraClave && primeraClave.startsWith('M');
  
  console.log('[DASHBOARD] Formato detectado:', formatoScriptJS ? 'script.js (M1, M2)' : 'dashboard.js (x_ang_eje)');
  
  // Crear HTML con tabla simplificada
  let html = `
    <div style="background: var(--card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
      <h3 style="margin-top: 0; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.5rem;">⚙️</span>
        Configuración de Grupo por Muerto
      </h3>
      
      <p style="color: var(--muted); margin-bottom: 1rem; font-size: 0.9rem;">
        💡 <strong>Tip:</strong> El ancho del macizo se calcula automáticamente según: <code style="background: var(--bg); padding: 0.2rem 0.4rem; border-radius: 3px;">ancho = volumen / (largo × profundidad)</code><br>
        ⚠️ <strong>Importante:</strong> Cuando el <strong>Ancho (A<sub>n</sub>) &gt; 0.80 m</strong>, las columnas <strong style="color: #dc3545;">V<sub>N</sub></strong> (Volumen Nuevo) y <strong style="color: #dc3545;">P<sub>N</sub></strong> (Peso Nuevo) se activan y <strong>reemplazan los valores tabulados anteriores</strong> usando las fórmulas:<br>
        <code style="background: var(--bg); padding: 0.2rem 0.4rem; border-radius: 3px; margin-left: 1rem;">V<sub>N</sub> = ΣF<sub>By</sub> / 2400 kg/m³</code> (basado en fuerzas, no en geometría) y 
        <code style="background: var(--bg); padding: 0.2rem 0.4rem; border-radius: 3px;">P<sub>N</sub> = V<sub>N</sub> × 2400 kg/m³</code>
      </p>
      
      <p style="color: var(--text-dim); margin-bottom: 1.5rem;">
        Ingresa la <b>profundidad</b> y las <b>separaciones de acero</b> (longitudinal y transversal) para cada grupo de muertos.<br>
        Estos valores se usarán en los cálculos de macizos de anclaje y armado.<br>
        <strong>Total de grupos: ${Object.keys(gruposMuertos).length}</strong>
      </p>
      
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="background: var(--primary); color: white;">
            <th style="padding: 0.75rem; text-align: left;">Muerto</th>
            <th style="padding: 0.75rem; text-align: center;">Distancia X (m)</th>
            <th style="padding: 0.75rem; text-align: center;">X Braces</th>
            <th style="padding: 0.75rem; text-align: center;">Ángulo</th>
            <th style="padding: 0.75rem; text-align: center;">Eje</th>
            <th style="padding: 0.75rem; text-align: center;">Cant. Muros</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 100px;">Largo Total (m)</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 120px; background: rgba(255,193,7,0.2);">Profundidad (m)</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 100px; background: rgba(40,167,69,0.2);">Ancho Calc. (m)</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 100px; background: rgba(13,110,253,0.2);">Largo Actualizado L<sub>a</sub> (m)</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 100px; background: rgba(220,53,69,0.2);">Volumen Nuevo V<sub>N</sub> (m³)</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 100px; background: rgba(220,53,69,0.2);">Peso Nuevo P<sub>N</sub> (kg)</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 120px;">Sep. Long. (m)</th>
            <th style="padding: 0.75rem; text-align: center; min-width: 120px;">Sep. Trans. (m)</th>
          </tr>
        </thead>
        <tbody>`;
  
  if (formatoScriptJS) {
    // Formato de script.js: {M1: {muerto, x, ang, tipo, eje, muros}, M2: {...}}
    Object.keys(gruposMuertos).forEach(clave => {
      const grupo = gruposMuertos[clave];
      const numeroMuerto = grupo.muerto || parseInt(clave.replace('M', ''));
      const distanciaX = grupo.xInserto || grupo.x_inserto || grupo.x || 0;
      const angulo = Math.round(grupo.ang || grupo.angulo || 0);
      const eje = grupo.eje || 0;
      // Usar la clave del grupo muerto directamente para config y para el input
      const valorActual = window.configGruposMuertos[clave]?.profundo || 2.0;
      const sepLong = window.configGruposMuertos[clave]?.separacionLongitudinal || 25;
      const sepTrans = window.configGruposMuertos[clave]?.separacionTransversal || 25;
      const sepLongM = (sepLong / 100).toFixed(2);
      const sepTransM = (sepTrans / 100).toFixed(2);
      
      // Calcular largo total, FBy y x_braces reales desde los muros
      let largoTotal = 0;
      let sumaFBy = 0;
      let xBracesArray = [];
      let xBracesTotal = 0;

      console.group(`[DEBUG SUMA] Grupo ${clave}`);

      if (grupo.muros && Array.isArray(grupo.muros)) {
        grupo.muros.forEach(muroId => {
          const muroObj = window.lastResultadosMuertos?.find(m => m.id_muro === muroId || m.id === muroId);
          if (muroObj) {

            let anchoRaw = parseFloat(muroObj.overall_width) || 0;
            
            console.log(`👉 Muro ${muroId}: Valor en memoria = ${muroObj.overall_width} -> Parseado = ${anchoRaw}`);
            
            
            largoTotal += anchoRaw;

            // ✅ Obtener x_braces FINAL desde la tabla (valor editado por usuario)
            const pid = muroObj.pid || muroObj.id_muro;
            const xBracesInput = document.querySelector(`[data-field="x_braces"][data-pid="${pid}"]`);
            const muroXBraces = xBracesInput ? (parseInt(xBracesInput.value) || 2) : (parseInt(muroObj.x_braces) || 2);
            xBracesArray.push(muroXBraces);
            xBracesTotal += muroXBraces;

            let fby = parseFloat(muroObj.fby) || parseFloat(muroObj.FBy) || 0;
            
            // ✅ Si fby es 0, intentar obtenerlo desde la tabla de cálculos
            if (fby === 0) {
              const pid = muroObj.pid;
              const tablaCalculo = document.querySelector('.wind-results-table, .tabla-braces, #tablaBraces, #tablaResultados');
              if (tablaCalculo && pid) {
                const fbyCell = tablaCalculo.querySelector(`.valor-fby[data-pid="${pid}"]`);
                if (fbyCell) {
                  const fbyTabla = parseFloat(fbyCell.textContent);
                  if (!isNaN(fbyTabla) && fbyTabla > 0) {
                    fby = fbyTabla;
                    muroObj.fby = fby;
                    console.log(`[DASHBOARD-INIT-1] ✅ FBy recuperado de tabla para ${muroId}: ${fby.toFixed(2)} kN`);
                  }
                }
              }
            }
            
            sumaFBy += fby;
          }
        });
      }
      

      console.log(`💰 Suma Bruta Total: ${largoTotal}`);


      // ✅ FORZAR redondeo correcto: 8.816 → 8.82 (no 8.81)
      largoTotal = Math.round((largoTotal + 0.0001) * 100) / 100;
      console.log(`🏁 Suma Final Redondeada: ${largoTotal}`);
      console.groupEnd();

      // ✅ Calcular display de x_braces (total si más de un muro, individual si uno solo)
      const xBracesDisplay = xBracesArray.length > 1 
        ? `${xBracesTotal} (${xBracesArray.join('+')})` 
        : xBracesTotal.toString();

      const volumenRequerido = sumaFBy / 2400; // Densidad del concreto
      const ANCHO_EFECTIVO_MAX = 0.80; // m - Tope definido por cliente
      let anchoCalculado = 0;
      let anchoParaMostrar = 0; // Ancho con tope aplicado para display
      
      if (largoTotal > 0 && valorActual > 0) {
        const valorBase = volumenRequerido / (largoTotal * valorActual);
        anchoCalculado = Math.ceil(valorBase * 20) / 20; // Redondeo a 0.05m
        // ⚠️ APLICAR TOPE: Si >= 0.80m, mostrar 0.80m
        anchoParaMostrar = anchoCalculado >= ANCHO_EFECTIVO_MAX ? ANCHO_EFECTIVO_MAX : anchoCalculado;
      }
      
      // ✅ LÓGICA CONDICIONAL HÍBRIDA según Excel con REGLA DEL TOPE
      // REGLA DEL TOPE: Ancho efectivo máximo = 0.80m para cálculos de volumen
      const DENSIDAD_CONCRETO = 2400; // kg/m³
      let largoNuevo = 0;     // Columna N: Nuevo Largo
      let volumenNuevo = 0;   // Columna P: Nuevo Volumen
      let pesoNuevo = 0;      // Columna O: Nuevo Peso
      let mostrarCalculosNuevos = false;
      
      // COLUMNA N: Nuevo Largo - Lógica Dual
      // Condición A: SI Ancho >= 0.80 → usar largo geométrico real (K7)
      if (anchoCalculado >= ANCHO_EFECTIVO_MAX) {
        largoNuevo = largoTotal;
        mostrarCalculosNuevos = true;
        console.log(`[DASHBOARD] Condición A: Ancho >= 0.80m para ${clave} → Usar largo geométrico`);
      } 
      // Condición B: SI Ancho = 0.40 → calcular largo teórico con fórmula J7/(M7*L7)*1.1
      else if (Math.abs(anchoCalculado - 0.40) < 0.01) { // Tolerancia de 0.01m
        largoNuevo = (volumenRequerido / (anchoCalculado * valorActual)) * 1.1;
        mostrarCalculosNuevos = true;
        console.log(`[DASHBOARD] Condición B: Ancho = 0.40m para ${clave} → Calcular largo teórico`);
      }
      // Condición C: Cualquier otro caso → vacío
      else {
        largoNuevo = 0;
        mostrarCalculosNuevos = false;
      }
      
      // COLUMNA P: Nuevo Volumen - Cálculo Resultante con TOPE
      // ⚠️ REGLA: Si ancho >= 0.80, usar 0.80 fijo en volumen
      if (largoNuevo > 0) {
        const anchoEfectivo = anchoCalculado >= ANCHO_EFECTIVO_MAX ? ANCHO_EFECTIVO_MAX : anchoCalculado;
        volumenNuevo = largoNuevo * anchoEfectivo * valorActual;
      } else {
        volumenNuevo = 0;
      }
      
      // COLUMNA O: Nuevo Peso - Actualización
      if (volumenNuevo > 0) {
        pesoNuevo = volumenNuevo * DENSIDAD_CONCRETO;
      } else {
        pesoNuevo = 0;
      }
      
      // ✅ Guardar valores nuevos en config para uso en armado
      if (largoNuevo > 0) {
        window.configGruposMuertos[clave].volumenNuevo = volumenNuevo;
        window.configGruposMuertos[clave].pesoNuevo = pesoNuevo;
        window.configGruposMuertos[clave].largoNuevo = largoNuevo;
        console.log(`[DASHBOARD] ✅ Valores NUEVOS guardados para armado inicial:`, {
          grupo: clave,
          volumenNuevo: volumenNuevo.toFixed(3),
          pesoNuevo: pesoNuevo.toFixed(1),
          largoNuevo: largoNuevo.toFixed(2)
        });
      }
      
      console.log(`[DASHBOARD] Cálculos híbridos para ${clave}:`, {
        anchoCalculadoOriginal: anchoCalculado,
        anchoParaMostrar: anchoParaMostrar,
        anchoEfectivo: anchoCalculado >= ANCHO_EFECTIVO_MAX ? ANCHO_EFECTIVO_MAX : anchoCalculado,
        reglaTope: anchoCalculado >= ANCHO_EFECTIVO_MAX ? '✅ Aplicado 0.80m máximo' : 'N/A',
        largoOriginal: largoTotal,
        profundidad: valorActual,
        volumenRequerido,
        largoNuevo,
        volumenNuevo,
        pesoNuevo,
        mostrarCalculosNuevos
      });
      
      console.log(`[DASHBOARD] Generando fila para grupo muerto:`, {
        claveGrupo: clave,
        valorActual,
        largoTotal,
        anchoCalculado,
        mostrarCalculosNuevos,
        config: window.configGruposMuertos[clave],
        grupo
      });
      html += `
        <tr style="border-bottom: 1px solid var(--border);" data-grupo="${clave}">
          <td style="padding: 0.75rem; font-weight: bold; color: var(--primary);">${clave}</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #0066cc;">${parseFloat(distanciaX).toFixed(2)}m</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #ff6b35;" title="Total braces: ${xBracesTotal}">${xBracesDisplay}</td>
          <td style="padding: 0.75rem; text-align: center;">${angulo}°</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #28a745;">${eje}</td>
          <td style="padding: 0.75rem; text-align: center; color: #6f42c1; font-weight: bold;">${grupo.muros?.length || 0}</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #007bff;" data-largo-total="${largoTotal}">
            ${largoTotal.toFixed(2)}
          </td>
          <td style="padding: 0.75rem; text-align: center;">
            <input 
              type="number" 
              class="input-profundidad-muerto" 
              data-muerto="${clave}"
              data-grupo-clave="${clave}"
              value="${valorActual}"
              step="0.1" 
              min="0.5"
              max="10"
              style="width: 90px; padding: 0.5rem; text-align: center; border: 2px solid #ffc107; border-radius: 4px; font-size: 1rem; font-weight: bold; background: rgba(255,193,7,0.1);"
              placeholder="2.0"
            >
          </td>
          <td style="padding: 0.75rem; text-align: center;">
            <span class="ancho-calculado-display" data-grupo="${clave}" style="display: inline-block; padding: 0.5rem 1rem; background: rgba(40,167,69,0.15); border: 2px solid #28a745; border-radius: 4px; font-weight: bold; color: #000000ff; min-width: 80px;" title="${anchoCalculado > anchoParaMostrar ? `Ancho calculado: ${anchoCalculado.toFixed(2)}m (limitado a ${ANCHO_EFECTIVO_MAX}m)` : ''}">
              ${anchoParaMostrar.toFixed(2)} m
            </span>
          </td>
          <td style="padding: 0.75rem; text-align: center;" data-largo-nuevo="${largoNuevo}">
            <span class="largo-actualizado-display" data-grupo="${clave}" style="display: inline-block; padding: 0.4rem 0.8rem; ${mostrarCalculosNuevos ? 'background: rgba(13,110,253,0.15); border: 2px solid #0d6efd; color: #0d6efd;' : 'background: rgba(108,117,125,0.1); border: 1px solid #6c757d; color: #6c757d;'} border-radius: 4px; font-weight: ${mostrarCalculosNuevos ? 'bold' : 'normal'}; min-width: 70px;">
              ${largoNuevo > 0 ? largoNuevo.toFixed(2) : (Math.round(largoTotal * 100) / 100).toFixed(2)} m
            </span>
          </td>
          <td style="padding: 0.75rem; text-align: center;" data-volumen-nuevo="${volumenNuevo}">
            <span class="volumen-nuevo-display" data-grupo="${clave}" style="display: inline-block; padding: 0.4rem 0.8rem; ${mostrarCalculosNuevos ? 'background: rgba(220,53,69,0.15); border: 2px solid #dc3545; color: #dc3545;' : 'background: rgba(108,117,125,0.1); border: 1px dashed #6c757d; color: #adb5bd;'} border-radius: 4px; font-weight: ${mostrarCalculosNuevos ? 'bold' : 'normal'}; min-width: 70px;">
              ${mostrarCalculosNuevos ? volumenNuevo.toFixed(3) + ' m³' : '—'}
            </span>
          </td>
          <td style="padding: 0.75rem; text-align: center;" data-peso-nuevo="${pesoNuevo}">
            <span class="peso-nuevo-display" data-grupo="${clave}" style="display: inline-block; padding: 0.4rem 0.8rem; ${mostrarCalculosNuevos ? 'background: rgba(220,53,69,0.15); border: 2px solid #dc3545; color: #dc3545;' : 'background: rgba(108,117,125,0.1); border: 1px dashed #6c757d; color: #adb5bd;'} border-radius: 4px; font-weight: ${mostrarCalculosNuevos ? 'bold' : 'normal'}; min-width: 70px;">
              ${mostrarCalculosNuevos ? pesoNuevo.toFixed(1) + ' kg' : '—'}
            </span>
          </td>
          <td style="padding: 0.75rem; text-align: center;">
            <input 
              type="number" 
              class="input-sep-long-muerto" 
              data-muerto="${clave}"
              data-grupo-clave="${clave}"
              value="${sepLongM}"
              step="0.01" 
              min="0.10"
              max="0.50"
              style="width: 70px; padding: 0.5rem; text-align: center; border: 2px solid var(--border); border-radius: 4px; font-size: 1rem; font-weight: bold;"
              placeholder="0.25"
            >
          </td>
          <td style="padding: 0.75rem; text-align: center;">
            <input 
              type="number" 
              class="input-sep-trans-muerto" 
              data-muerto="${clave}"
              data-grupo-clave="${clave}"
              value="${sepTransM}"
              step="0.01" 
              min="0.10"
              max="0.50"
              style="width: 70px; padding: 0.5rem; text-align: center; border: 2px solid var(--border); border-radius: 4px; font-size: 1rem; font-weight: bold;"
              placeholder="0.25"
            >
          </td>
        </tr>`;
    });
  } else {
    // Formato de dashboard.js: {'2_55_1': {x_braces, angulo, eje, muros}}
    let indice = 1;
    Object.keys(gruposMuertos).forEach(clave => {
      const grupo = gruposMuertos[clave];
      const distanciaX = grupo.xInserto || grupo.x_inserto || 0;
      const valorActual = window.configGruposMuertos[clave]?.profundo || 2.0;
      const sepLong = window.configGruposMuertos[clave]?.separacionLongitudinal || 25;
      const sepTrans = window.configGruposMuertos[clave]?.separacionTransversal || 25;
      const sepLongM = (sepLong / 100).toFixed(2);
      const sepTransM = (sepTrans / 100).toFixed(2);
      
      // Calcular largo total y ancho del macizo
      let largoTotal = 0;
      let sumaFBy = 0;
      if (grupo.muros && Array.isArray(grupo.muros)) {
        grupo.muros.forEach(muroId => {
          const muroObj = window.lastResultadosMuertos?.find(m => m.id_muro === muroId || m.id === muroId);
          if (muroObj) {
            largoTotal += parseFloat(muroObj.overall_width) || 0;
            let fby = parseFloat(muroObj.fby) || parseFloat(muroObj.FBy) || 0;
            
            // ✅ Si fby es 0, intentar obtenerlo desde la tabla de cálculos
            if (fby === 0) {
              const pid = muroObj.pid;
              const tablaCalculo = document.querySelector('.wind-results-table, .tabla-braces, #tablaBraces, #tablaResultados');
              if (tablaCalculo && pid) {
                const fbyCell = tablaCalculo.querySelector(`.valor-fby[data-pid="${pid}"]`);
                if (fbyCell) {
                  const fbyTabla = parseFloat(fbyCell.textContent);
                  if (!isNaN(fbyTabla) && fbyTabla > 0) {
                    fby = fbyTabla;
                    muroObj.fby = fby;
                    console.log(`[DASHBOARD-INIT-2] ✅ FBy recuperado de tabla para ${muroId}: ${fby.toFixed(2)} kN`);
                  }
                }
              }
            }
            
            sumaFBy += fby;
          }
        });
      }
      
      // ✅ FORZAR redondeo correcto: 8.816 → 8.82 (no 8.81)
      largoTotal = parseFloat(largoTotal.toFixed(2));
      
      const volumenRequerido = sumaFBy / 2400; // Densidad del concreto
      const ANCHO_EFECTIVO_MAX = 0.80; // m - Tope definido por cliente
      let anchoCalculado = 0;
      let anchoParaMostrar = 0; // Ancho con tope aplicado para display
      
      if (largoTotal > 0 && valorActual > 0) {
        const valorBase = volumenRequerido / (largoTotal * valorActual);
        anchoCalculado = Math.ceil(valorBase * 20) / 20; // Redondeo a 0.05m
        // ⚠️ APLICAR TOPE: Si >= 0.80m, mostrar 0.80m
        anchoParaMostrar = anchoCalculado >= ANCHO_EFECTIVO_MAX ? ANCHO_EFECTIVO_MAX : anchoCalculado;
      }
      
      // ✅ CÁLCULO CONDICIONAL HÍBRIDO (3 condiciones basadas en Excel N7, P7, O7)
      // REGLA DEL TOPE: Ancho efectivo máximo = 0.80m para cálculos de volumen
      const DENSIDAD_CONCRETO = 2400; // kg/m³
      let largoNuevo = 0;
      let volumenNuevo = 0;
      let pesoNuevo = 0;
      let mostrarCalculosNuevos = false;
      
      // Condición A: Si A_n >= 0.80m → usar largo real + ancho fijo 0.80m
      if (anchoCalculado >= ANCHO_EFECTIVO_MAX) {
        largoNuevo = largoTotal;
        mostrarCalculosNuevos = true;
      }
      // Condición B: Si A_n = 0.40m (±0.01) → calcular largo teórico con factor 1.1
      else if (Math.abs(anchoCalculado - 0.40) < 0.01) {
        largoNuevo = (volumenRequerido / (anchoCalculado * valorActual)) * 1.1;
        mostrarCalculosNuevos = true;
      }
      // Condición C: Otros valores → no mostrar cálculos nuevos
      else {
        largoNuevo = 0;
        mostrarCalculosNuevos = false;
      }
      
      // Calcular volumen y peso solo si tenemos largoNuevo válido
      if (largoNuevo > 0) {
        // ⚠️ REGLA DEL TOPE: Si ancho >= 0.80, usar 0.80 fijo en volumen
        const anchoEfectivo = anchoCalculado >= ANCHO_EFECTIVO_MAX ? ANCHO_EFECTIVO_MAX : anchoCalculado;
        volumenNuevo = largoNuevo * anchoEfectivo * valorActual;
        pesoNuevo = volumenNuevo * DENSIDAD_CONCRETO;
        console.log(`[DASHBOARD-2] ✅ Cálculos híbridos para M${indice}:`, {
          condicion: anchoCalculado >= 0.80 ? 'A (>=0.80)' : 'B (=0.40)',
          sumaFBy,
          volumenRequerido,
          anchoCalculado: anchoCalculado,
          anchoEfectivo: anchoEfectivo,
          reglaTope: anchoCalculado >= 0.80 ? '✅ Aplicado 0.80m máximo' : 'N/A',
          largoTotal,
          profundidad: valorActual,
          largoNuevo,
          volumenNuevo,
          pesoNuevo
        });
      }
      
      console.log(`[DASHBOARD] Generando fila para M${indice}, clave: ${clave}`, grupo);
      
      html += `
        <tr style="border-bottom: 1px solid var(--border);" data-grupo="${clave}">
          <td style="padding: 0.75rem; font-weight: bold; color: var(--primary);">M${indice}</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #0066cc;">${parseFloat(distanciaX).toFixed(2)}m</td>
          <td style="padding: 0.75rem; text-align: center;">${grupo.x_braces}</td>
          <td style="padding: 0.75rem; text-align: center;">${grupo.angulo}°</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #28a745;">${grupo.eje || 'N/A'}</td>
          <td style="padding: 0.75rem; text-align: center; color: #6f42c1; font-weight: bold;">${grupo.muros.length}</td>
          <td style="padding: 0.75rem; text-align: center; font-weight: bold; color: #007bff;" data-largo-total="${largoTotal}">
            ${largoTotal.toFixed(2)}
          </td>
          <td style="padding: 0.75rem; text-align: center;">
            <input 
              type="number" 
              class="input-profundidad-muerto" 
              data-muerto="M${indice}"
              data-grupo-clave="${clave}"
              value="${valorActual}"
              step="0.1" 
              min="0.5"
              max="10"
              style="width: 90px; padding: 0.5rem; text-align: center; border: 2px solid #ffc107; border-radius: 4px; font-size: 1rem; font-weight: bold; background: rgba(255,193,7,0.1);"
              placeholder="2.0"
            >
          </td>
          <td style="padding: 0.75rem; text-align: center;">
            <span class="ancho-calculado-display" data-grupo="${clave}" style="display: inline-block; padding: 0.5rem 1rem; background: rgba(40,167,69,0.15); border: 2px solid #28a745; border-radius: 4px; font-weight: bold; color: #28a745; min-width: 80px;" title="${anchoCalculado > anchoParaMostrar ? `Ancho calculado: ${anchoCalculado.toFixed(2)}m (limitado a ${ANCHO_EFECTIVO_MAX}m)` : ''}">
              ${anchoParaMostrar.toFixed(2)} m
            </span>
          </td>
          <td style="padding: 0.75rem; text-align: center;" data-largo-nuevo="${largoNuevo}">
            <span class="largo-actualizado-display" data-grupo="${clave}" style="display: inline-block; padding: 0.4rem 0.8rem; ${mostrarCalculosNuevos ? 'background: rgba(13,110,253,0.15); border: 2px solid #0d6efd; color: #0d6efd;' : 'background: rgba(108,117,125,0.1); border: 1px solid #6c757d; color: #6c757d;'} border-radius: 4px; font-weight: ${mostrarCalculosNuevos ? 'bold' : 'normal'}; min-width: 70px;">
              ${largoNuevo > 0 ? largoNuevo.toFixed(2) : largoTotal.toFixed(2)} m
            </span>
          </td>
          <td style="padding: 0.75rem; text-align: center;" data-volumen-nuevo="${volumenNuevo}">
            <span class="volumen-nuevo-display" data-grupo="${clave}" style="display: inline-block; padding: 0.4rem 0.8rem; ${mostrarCalculosNuevos ? 'background: rgba(220,53,69,0.15); border: 2px solid #dc3545; color: #dc3545;' : 'background: rgba(108,117,125,0.1); border: 1px dashed #6c757d; color: #adb5bd;'} border-radius: 4px; font-weight: ${mostrarCalculosNuevos ? 'bold' : 'normal'}; min-width: 70px;">
              ${mostrarCalculosNuevos ? volumenNuevo.toFixed(3) + ' m³' : '—'}
            </span>
          </td>
          <td style="padding: 0.75rem; text-align: center;" data-peso-nuevo="${pesoNuevo}">
            <span class="peso-nuevo-display" data-grupo="${clave}" style="display: inline-block; padding: 0.4rem 0.8rem; ${mostrarCalculosNuevos ? 'background: rgba(220,53,69,0.15); border: 2px solid #dc3545; color: #dc3545;' : 'background: rgba(108,117,125,0.1); border: 1px dashed #6c757d; color: #adb5bd;'} border-radius: 4px; font-weight: ${mostrarCalculosNuevos ? 'bold' : 'normal'}; min-width: 70px;">
              ${mostrarCalculosNuevos ? pesoNuevo.toFixed(1) + ' kg' : '—'}
            </span>
          </td>
          <td style="padding: 0.75rem; text-align: center;">
            <input 
              type="number" 
              class="input-sep-long-muerto" 
              data-muerto="M${indice}"
              data-grupo-clave="${clave}"
              value="${sepLongM}"
              step="0.01" 
              min="0.10"
              max="0.50"
              style="width: 70px; padding: 0.5rem; text-align: center; border: 2px solid var(--border); border-radius: 4px; font-size: 1rem; font-weight: bold;"
              placeholder="0.25"
            >
          </td>
          <td style="padding: 0.75rem; text-align: center;">
            <input 
              type="number" 
              class="input-sep-trans-muerto" 
              data-muerto="M${indice}"
              data-grupo-clave="${clave}"
              value="${sepTransM}"
              step="0.01" 
              min="0.10"
              max="0.50"
              style="width: 70px; padding: 0.5rem; text-align: center; border: 2px solid var(--border); border-radius: 4px; font-size: 1rem; font-weight: bold;"
              placeholder="0.25"
            >
          </td>
        </tr>`;
      
      indice++;
    });
  }
  
  html += `
        </tbody>
      </table>
      
      <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
        <button 
          id="btnGuardarProfundidades" 
          class="btn btn-primary"
          style="padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: bold;"
        >
          💾 Guardar Configuración
        </button>
      </div>
      
      <div id="mensajeGuardado" style="display: none; margin-top: 1rem; padding: 1rem; background: #d4edda; color: #155724; border-radius: 6px; border: 1px solid #c3e6cb;">
        ✅ Configuración guardada correctamente
      </div>
    </div>`;
  
  configContainer.innerHTML = html;
  configContainer.style.display = 'block';
  
  // Event listener para el botón de guardar
  document.getElementById('btnGuardarProfundidades').addEventListener('click', guardarProfundidadesMuertos);
  
  // Event listener para recalcular ancho en tiempo real al cambiar profundidad
  document.querySelectorAll('.input-profundidad-muerto').forEach(input => {
    input.addEventListener('input', function() {
      const grupoClave = this.getAttribute('data-grupo-clave');
      const row = this.closest('tr[data-grupo]');
      
      console.log('[ANCHO-RT] Input detectado:', {
        grupoClave,
        valor: this.value,
        rowEncontrado: !!row
      });
      
      if (!row) {
        console.error('[ANCHO-RT] No se encontró la fila');
        return;
      }
      
      const largoTotal = parseFloat(row.querySelector('[data-largo-total]').getAttribute('data-largo-total')) || 0;
      const profundidad = parseFloat(this.value) || 0;
      
      // ✅ GUARDAR AUTOMÁTICAMENTE en configGruposMuertos cuando cambia el valor
      if (!window.configGruposMuertos) {
        window.configGruposMuertos = {};
      }
      if (!window.configGruposMuertos[grupoClave]) {
        window.configGruposMuertos[grupoClave] = {};
      }
      window.configGruposMuertos[grupoClave].profundo = profundidad;
      window.configGruposMuertos[grupoClave].profundidad = profundidad; // Ambos nombres por compatibilidad
      console.log(`[ANCHO-RT] ✅ Profundidad guardada en config: ${profundidad}m para ${grupoClave}`);
      
      console.log('[ANCHO-RT] Valores iniciales:', { largoTotal, profundidad });
      
      // Obtener suma de FBy del grupo
      let sumaFBy = 0;
      const grupo = window.gruposMuertosGlobal?.[grupoClave];
      
      console.log('[ANCHO-RT] Grupo encontrado:', !!grupo, 'Muros:', grupo?.muros?.length);
      console.log('[ANCHO-RT] window.lastResultadosMuertos disponible:', !!window.lastResultadosMuertos, 'Cantidad:', window.lastResultadosMuertos?.length);
      
      if (grupo && grupo.muros && Array.isArray(grupo.muros)) {
        grupo.muros.forEach(muroId => {
          const muroObj = window.lastResultadosMuertos?.find(m => m.id_muro === muroId || m.id === muroId);
          if (muroObj) {
            let fby = parseFloat(muroObj.fby) || parseFloat(muroObj.FBy) || 0;
            
            // ✅ Si fby es 0, intentar obtenerlo desde la tabla de cálculos
            if (fby === 0) {
              const pid = muroObj.pid;
              const tablaCalculo = document.querySelector('.wind-results-table, .tabla-braces, #tablaBraces, #tablaResultados');
              if (tablaCalculo && pid) {
                const fbyCell = tablaCalculo.querySelector(`.valor-fby[data-pid="${pid}"]`);
                if (fbyCell) {
                  const fbyTabla = parseFloat(fbyCell.textContent);
                  if (!isNaN(fbyTabla) && fbyTabla > 0) {
                    fby = fbyTabla;
                    // Actualizar el objeto en memoria para futuros cálculos
                    muroObj.fby = fby;
                    console.log(`[ANCHO-RT] ✅ FBy recuperado de tabla para ${muroId}: ${fby.toFixed(2)} kN`);
                  }
                }
              }
            }
            
            sumaFBy += fby;
            console.log(`[ANCHO-RT] Muro ${muroId}: FBy = ${fby.toFixed(2)} kN`);
          } else {
            console.warn(`[ANCHO-RT] ⚠️ Muro ${muroId} NO encontrado en lastResultadosMuertos`);
          }
        });
      }
      
      console.log('[ANCHO-RT] Suma FBy total:', sumaFBy);
      
      // ⚠️ ADVERTENCIA: Si la suma es 0, significa que no se han calculado las fuerzas
      if (sumaFBy === 0 && grupo.muros && grupo.muros.length > 0) {
        console.warn('[ANCHO-RT] ⚠️ ADVERTENCIA: FBy = 0. Necesitas calcular las fuerzas de viento primero.');
        console.warn('[ANCHO-RT] Ve a la tabla de Braces y modifica algún parámetro (ángulo, tipo, NPT) para disparar el cálculo.');
      }
      
      // Calcular ancho del macizo
      const volumenRequerido = sumaFBy / 2400;
      const ANCHO_EFECTIVO_MAX = 0.80;
      let anchoCalculado = 0;
      let anchoParaMostrar = 0;
      
      if (largoTotal > 0 && profundidad > 0) {
        const valorBase = volumenRequerido / (largoTotal * profundidad);
        anchoCalculado = Math.ceil(valorBase * 20) / 20; // Redondeo a 0.05m
        // ⚠️ APLICAR TOPE: Si >= 0.80m, mostrar 0.80m
        anchoParaMostrar = anchoCalculado >= ANCHO_EFECTIVO_MAX ? ANCHO_EFECTIVO_MAX : anchoCalculado;
      }
      
      console.log('[ANCHO-RT] Ancho calculado:', anchoCalculado, '→ Mostrar:', anchoParaMostrar);
      
      // ✅ GUARDAR el ancho calculado en configGruposMuertos
      // ⚠️ APLICAR TOPE: Si ancho >= 0.80m, guardar 0.80m para uso en armado rectangular
      if (anchoCalculado > 0) {
        window.configGruposMuertos[grupoClave].ancho = anchoParaMostrar; // Ya tiene tope aplicado
        console.log(`[ANCHO-RT] ✅ Ancho guardado en config: ${anchoParaMostrar}m para ${grupoClave}`, 
          anchoCalculado > anchoParaMostrar ? `(tope aplicado desde ${anchoCalculado.toFixed(2)}m)` : '');
      }
      
      // ✅ CALCULAR VALORES CONDICIONALES HÍBRIDOS (3 condiciones)
      // REGLA DEL TOPE: Ancho efectivo máximo = 0.80m para cálculos de volumen
      const DENSIDAD_CONCRETO = 2400; // kg/m³
      let largoNuevo = 0;
      let volumenNuevo = 0;
      let pesoNuevo = 0;
      let mostrarCalculosNuevos = false;
      
      // Condición A: Si A_n >= 0.80m → usar largo real + ancho fijo 0.80m
      if (anchoCalculado >= ANCHO_EFECTIVO_MAX) {
        largoNuevo = largoTotal;
        mostrarCalculosNuevos = true;
      }
      // Condición B: Si A_n = 0.40m (±0.01) → calcular largo teórico con factor 1.1
      else if (Math.abs(anchoCalculado - 0.40) < 0.01) {
        largoNuevo = (volumenRequerido / (anchoCalculado * profundidad)) * 1.1;
        mostrarCalculosNuevos = true;
      }
      // Condición C: Otros valores → no mostrar cálculos nuevos
      else {
        largoNuevo = 0;
        mostrarCalculosNuevos = false;
      }
      
      // Calcular volumen y peso solo si tenemos largoNuevo válido
      if (largoNuevo > 0) {
        // ⚠️ REGLA DEL TOPE: Si ancho >= 0.80, usar 0.80 fijo en volumen
        const anchoEfectivo = anchoCalculado >= ANCHO_EFECTIVO_MAX ? ANCHO_EFECTIVO_MAX : anchoCalculado;
        volumenNuevo = largoNuevo * anchoEfectivo * profundidad;
        pesoNuevo = volumenNuevo * DENSIDAD_CONCRETO;
        console.log(`[ANCHO-RT] ✅ Cálculos híbridos en tiempo real:`, {
          condicion: anchoCalculado >= 0.80 ? 'A (>=0.80)' : 'B (=0.40)',
          sumaFBy,
          volumenRequerido,
          anchoCalculado: anchoCalculado,
          anchoEfectivo: anchoEfectivo,
          reglaTope: anchoCalculado >= 0.80 ? '✅ Aplicado 0.80m máximo' : 'N/A',
          largoTotal,
          profundidad,
          largoNuevo,
          volumenNuevo,
          pesoNuevo
        });
        
        // Guardar en config para uso posterior
        window.configGruposMuertos[grupoClave].volumenNuevo = volumenNuevo;
        window.configGruposMuertos[grupoClave].pesoNuevo = pesoNuevo;
        window.configGruposMuertos[grupoClave].largoNuevo = largoNuevo;
        console.log(`[ANCHO-RT] ✅ Valores NUEVOS guardados para armado:`, {
          grupo: grupoClave,
          volumenNuevo: volumenNuevo.toFixed(3),
          pesoNuevo: pesoNuevo.toFixed(1),
          largoNuevo: largoNuevo.toFixed(2)
        });
      }
      
      // Actualizar display del ancho
      const anchoDisplay = row.querySelector(`.ancho-calculado-display[data-grupo="${grupoClave}"]`);
      if (anchoDisplay) {
        if (sumaFBy === 0) {
          anchoDisplay.textContent = '⚠️ Sin calcular';
          anchoDisplay.style.background = 'rgba(255,193,7,0.2)';
          anchoDisplay.style.color = '#856404';
          anchoDisplay.title = 'Las fuerzas de viento no están calculadas. Ve a la tabla de Braces y modifica algún parámetro.';
        } else {
          anchoDisplay.textContent = `${anchoParaMostrar.toFixed(2)} m`;
          anchoDisplay.title = anchoCalculado > anchoParaMostrar ? `Ancho calculado: ${anchoCalculado.toFixed(2)}m (limitado a ${ANCHO_EFECTIVO_MAX}m)` : '';
          anchoDisplay.style.color = '#155724';
          anchoDisplay.title = '';
          // Animación de actualización
          anchoDisplay.style.transform = 'scale(1.1)';
          anchoDisplay.style.background = 'rgba(40,167,69,0.3)';
          setTimeout(() => {
            anchoDisplay.style.transform = 'scale(1)';
            anchoDisplay.style.background = 'rgba(40,167,69,0.15)';
          }, 200);
        }
        console.log('[ANCHO-RT] ✅ Display actualizado');
      } else {
        console.error('[ANCHO-RT] ❌ No se encontró el display del ancho');
      }
      
      // ✅ ACTUALIZAR DISPLAYS de L_a, V_N, P_N
      const largoDisplay = row.querySelector(`.largo-actualizado-display[data-grupo="${grupoClave}"]`);
      const volumenDisplay = row.querySelector(`.volumen-nuevo-display[data-grupo="${grupoClave}"]`);
      const pesoDisplay = row.querySelector(`.peso-nuevo-display[data-grupo="${grupoClave}"]`);
      
      if (largoDisplay) {
        largoDisplay.textContent = `${largoNuevo > 0 ? largoNuevo.toFixed(2) : largoTotal.toFixed(2)} m`;
        if (mostrarCalculosNuevos) {
          largoDisplay.style.background = 'rgba(13,110,253,0.15)';
          largoDisplay.style.border = '2px solid #0d6efd';
          largoDisplay.style.color = '#0d6efd';
          largoDisplay.style.fontWeight = 'bold';
        } else {
          largoDisplay.style.background = 'rgba(108,117,125,0.1)';
          largoDisplay.style.border = '1px solid #6c757d';
          largoDisplay.style.color = '#6c757d';
          largoDisplay.style.fontWeight = 'normal';
        }
      }
      
      if (volumenDisplay) {
        if (mostrarCalculosNuevos) {
          volumenDisplay.textContent = `${volumenNuevo.toFixed(3)} m³`;
          volumenDisplay.style.background = 'rgba(220,53,69,0.15)';
          volumenDisplay.style.border = '2px solid #dc3545';
          volumenDisplay.style.color = '#dc3545';
          volumenDisplay.style.fontWeight = 'bold';
          // Animación
          volumenDisplay.style.transform = 'scale(1.1)';
          setTimeout(() => volumenDisplay.style.transform = 'scale(1)', 200);
        } else {
          volumenDisplay.textContent = '—';
          volumenDisplay.style.background = 'rgba(108,117,125,0.1)';
          volumenDisplay.style.border = '1px dashed #6c757d';
          volumenDisplay.style.color = '#adb5bd';
          volumenDisplay.style.fontWeight = 'normal';
        }
      }
      
      if (pesoDisplay) {
        if (mostrarCalculosNuevos) {
          pesoDisplay.textContent = `${pesoNuevo.toFixed(1)} kg`;
          pesoDisplay.style.background = 'rgba(220,53,69,0.15)';
          pesoDisplay.style.border = '2px solid #dc3545';
          pesoDisplay.style.color = '#dc3545';
          pesoDisplay.style.fontWeight = 'bold';
          // Animación
          pesoDisplay.style.transform = 'scale(1.1)';
          setTimeout(() => pesoDisplay.style.transform = 'scale(1)', 200);
        } else {
          pesoDisplay.textContent = '—';
          pesoDisplay.style.background = 'rgba(108,117,125,0.1)';
          pesoDisplay.style.border = '1px dashed #6c757d';
          pesoDisplay.style.color = '#adb5bd';
          pesoDisplay.style.fontWeight = 'normal';
        }
      }
    });
  });
  
  console.log('[DASHBOARD] Listado de muertos mostrado:', Object.keys(gruposMuertos).length, 'grupos');
}

// Función para guardar profundidades individuales por muerto
function guardarProfundidadesMuertos() {
  console.log('[DASHBOARD] guardarProfundidadesMuertos - Guardando profundidades individuales');
  
  // Función auxiliar para guardar profundidades con PUT
  function guardarProfundidadesConPUT(pidProyecto, inputs, profundidadesValidas) {
    let guardados = 0;
    const promises = [];
    inputs.forEach(input => {
      const clave = input.getAttribute('data-grupo-clave');
      const valor = parseFloat(input.value);
      if (!clave || isNaN(valor) || valor <= 0) return;
      const grupo = window.gruposMuertosGlobal[clave];
      if (!grupo || !grupo.pid) return;
      promises.push(
        fetch(`${API_BASE}/api/grupos-muertos/${grupo.pid}/profundidad`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profundidad: valor })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) guardados++;
        })
        .catch(error => {
          console.error(`[DASHBOARD] Error guardando profundidad para grupo ${clave}:`, error);
        })
      );
    });
    Promise.all(promises).then(() => {
      // Resetear bordes a normal
      inputs.forEach(input => {
        input.style.borderColor = 'var(--border)';
      });
      alert(`✅ Profundidades guardadas exitosamente!\n\n` +
            `📊 Resumen:\n` +
            `• Total muertos: ${profundidadesValidas}\n` +
            `• Guardados en BD: ${guardados}\n\n` +
            `✨ Ahora puedes hacer clic en 'Calcular Armado Rectangular'`);
    });
  }
  
  // Limpiar configuración anterior de profundidades
  if (!window.configGruposMuertos) {
    window.configGruposMuertos = {};
  }
  
  // Obtener todos los inputs de profundidad y separaciones
  const inputsProf = document.querySelectorAll('.input-profundidad-muerto');
  const inputsSepLong = document.querySelectorAll('.input-sep-long-muerto');
  const inputsSepTrans = document.querySelectorAll('.input-sep-trans-muerto');

  console.log('[DASHBOARD] Inputs encontrados:', inputsProf.length, 'profundidad,', inputsSepLong.length, 'sepLong,', inputsSepTrans.length, 'sepTrans');

  if (inputsProf.length === 0) {
    alert('⚠️ No se encontraron inputs de configuración');
    return;
  }

  let configuracionesValidas = 0;

  // Mapear inputs de separaciones por clave y convertir de metros a cm
  const mapSepLong = {};
  const mapSepTrans = {};
  inputsSepLong.forEach(input => {
    const clave = input.getAttribute('data-grupo-clave');
    mapSepLong[clave] = parseFloat(input.value) * 100; // m → cm
  });
  inputsSepTrans.forEach(input => {
    const clave = input.getAttribute('data-grupo-clave');
    mapSepTrans[clave] = parseFloat(input.value) * 100; // m → cm
  });

  inputsProf.forEach((input, index) => {
    const clave = input.getAttribute('data-grupo-clave');
    const muerto = input.getAttribute('data-muerto');
    const valor = parseFloat(input.value);
    const sepLong = mapSepLong[clave] || 25;
    const sepTrans = mapSepTrans[clave] || 25;

    console.log(`[DASHBOARD] Input ${index + 1}:`, { clave, muerto, valor, sepLong, sepTrans });

    if (!clave) {
      console.warn('[DASHBOARD] Input sin clave:', input);
      return;
    }

    if (isNaN(valor) || valor <= 0) {
      console.warn(`[DASHBOARD] Valor inválido para ${muerto}: ${input.value}`);
      input.style.borderColor = 'red';
      return;
    }
    if (isNaN(sepLong) || sepLong < 10 || sepLong > 50) {
      console.warn(`[DASHBOARD] Sep. Longitudinal inválido para ${muerto}: ${sepLong}`);
      return;
    }
    if (isNaN(sepTrans) || sepTrans < 10 || sepTrans > 50) {
      console.warn(`[DASHBOARD] Sep. Transversal inválido para ${muerto}: ${sepTrans}`);
      return;
    }

    // Inicializar objeto de configuración para este grupo si no existe
    if (!window.configGruposMuertos[clave]) {
      window.configGruposMuertos[clave] = {
        factorSeguridad: 1.0,
        friccion: 0.3
      };
    }

    // Guardar configuración bajo la clave del grupo muerto
    window.configGruposMuertos[clave].profundo = valor;
    window.configGruposMuertos[clave].separacionLongitudinal = sepLong;
    window.configGruposMuertos[clave].separacionTransversal = sepTrans;
    input.style.borderColor = '#28a745'; // Verde para indicar guardado
    configuracionesValidas++;

    console.log(`[DASHBOARD] ✓ ${muerto} (${clave}): Profundidad=${valor}m, SepLong=${(sepLong/100).toFixed(2)}m (${sepLong}cm), SepTrans=${(sepTrans/100).toFixed(2)}m (${sepTrans}cm)`);
  });

  console.log('[DASHBOARD] Total configuraciones guardadas:', configuracionesValidas);
  console.log('[DASHBOARD] Configuración completa:', window.configGruposMuertos);

  if (configuracionesValidas === 0) {
    alert('⚠️ No se pudo guardar ninguna configuración. Verifica los valores ingresados.');
    return;
  }

  // Mostrar mensaje de éxito
  const mensaje = document.getElementById('mensajeGuardado');
  if (mensaje) {
    mensaje.style.display = 'block';
    setTimeout(() => {
      mensaje.style.display = 'none';
    }, 3000);
  }

  const configParaBackend = {};
  Object.keys(window.configGruposMuertos).forEach(clave => { // 👈 Iteramos sobre la configuración completa
    // 1. OMITIR CLAVES "M1", "M2", etc.
    if (clave.startsWith('M') && clave.length <= 3) {
        return; // No incluir claves de frontend (M1, M2, etc.) en el payload del backend
    }
    
    // 2. Incluir y parsear solo claves de backend (ej: "7.31|PUNTALES|55|M01")
    const partes = clave.split('|');

    // Solo procesar claves que se vean como x_inserto|tipo|angulo|eje (4 partes)
    if (partes.length >= 4) {
        const x_inserto_clave = parseFloat(partes[0]);
        const tipo_brace_clave = partes[1];
        const angulo_clave = parseFloat(partes[2]);
        const eje_clave = partes[3]; 

        if (!isNaN(x_inserto_clave) && !isNaN(angulo_clave)) {
            // Creamos un nuevo objeto de configuración limpio
            configParaBackend[clave] = {
                profundo: window.configGruposMuertos[clave].profundo,
                x_inserto: x_inserto_clave,
                tipo_brace_seleccionado: tipo_brace_clave,
                angulo_brace: angulo_clave,
                eje: eje_clave,
                // Puedes añadir aquí otras propiedades de configuración que necesites guardar
            };
        }
    }
});

  // Guardar en backend usando PUT por grupo
  const projectConfig = localStorage.getItem('projectConfig');
  if (projectConfig) {
    const proyecto = JSON.parse(projectConfig);
    // Verificar si existen grupos en BD
    fetch(`${API_BASE}/api/grupos-muertos/${proyecto.pid}`)
      .then(response => response.json())
      .then(data => {
        if (!data.success || !data.grupos || data.grupos.length === 0) {
          // Si no existen, crear los grupos primero
          console.log('[DASHBOARD] No existen grupos en BD, creando...');
          fetch(`${API_BASE}/api/grupos-muertos/${proyecto.pid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configParaBackend)
          })
          .then(res => res.json())
          .then(postData => {
            if (postData.success) {
              // Actualizar window.gruposMuertosGlobal con los nuevos grupos
              postData.grupos.forEach(grupo => {
                const xInserto = parseFloat(grupo.x_inserto || 0).toFixed(2);
                const tipoBrace = grupo.tipo_brace_seleccionado || 'PUNTALES';
                const angulo = Math.round(grupo.angulo_brace);
                const eje = grupo.eje || '';
                const clave = `${xInserto}|${tipoBrace}|${angulo}|${eje}`;
                window.gruposMuertosGlobal[clave] = grupo;
              });
              console.log('[DASHBOARD] ✅ Grupos creados en BD');
            } else {
              alert('Error creando grupos en BD: ' + postData.error);
            }
          });
        } else {
          // Los grupos existen, actualizar profundidades directamente
          data.grupos.forEach(grupo => {
            const xInserto = parseFloat(grupo.x_inserto || 0).toFixed(2);
            const tipoBrace = grupo.tipo_brace_seleccionado || 'PUNTALES';
            const angulo = Math.round(grupo.angulo_brace);
            const eje = grupo.eje || '';
            const clave = `${xInserto}|${tipoBrace}|${angulo}|${eje}`;
            window.gruposMuertosGlobal[clave] = grupo;
          });
          console.log('[DASHBOARD] ✅ Grupos ya existen en BD');
        }
      });
  } else {
    alert(`✅ Profundidades guardadas en memoria!\n\n` +
          `📊 Total: ${profundidadesValidas} muertos configurados\n\n` +
          `⚠️ No hay proyecto seleccionado para guardar en BD.\n` +
          `✨ Ahora puedes hacer clic en 'Calcular Armado Rectangular'`);
  }
}

function guardarConfigGrupos() {
  console.log('[DASHBOARD] guardarConfigGrupos - DEPRECADO: Usar guardarProfundidadesMuertos()');
  
  // Redirigir a la nueva función
  guardarProfundidadesMuertos();
}

// Función para cargar grupos de muertos desde el backend
async function cargarGruposMuertosDesdeBackend(pk_proyecto) {
  try {
    console.log('[DASHBOARD] Cargando grupos desde backend para proyecto:', pk_proyecto);
    
    const response = await fetch(`${API_BASE}/api/grupos-muertos/${pk_proyecto}`);
    const data = await response.json();
    
    if (data.success && data.grupos && data.grupos.length > 0) {
      console.log('[DASHBOARD] Grupos cargados desde BD:', data.grupos);
      
      // Convertir a formato de configuración
      window.configGruposMuertos = {};
      
      data.grupos.forEach(grupo => {
        const xInserto = parseFloat(grupo.x_inserto || 0).toFixed(2);
        const tipoBrace = grupo.tipo_brace_seleccionado || 'PUNTALES';
        const angulo = Math.round(grupo.angulo_brace);
        const eje = grupo.eje || '';
        const clave = `${xInserto}|${tipoBrace}|${angulo}|${eje}`;
        window.configGruposMuertos[clave] = {
          profundo: parseFloat(grupo.profundidad) || 2.0,
          espaciadoLong: 25, // Valores por defecto si no están en BD
          espaciadoTrans: 25,
          factorSeguridad: 1.0,
          friccion: 0.3
        };
      });
      
      console.log('[DASHBOARD] Configuración cargada desde BD:', window.configGruposMuertos);
      return true;
    } else {
      console.log('[DASHBOARD] No hay grupos guardados en BD');
      return false;
    }
  } catch (error) {
    console.error('[DASHBOARD] Error cargando grupos desde backend:', error);
    return false;
  }
}

// ===== FUNCIÓN PARA REAGRUPAR MUERTOS =====
async function reagruparMuertos() {
  console.log('[DASHBOARD] reagruparMuertos - Iniciando reagrupación INDEPENDIENTE del PDF');
  
  // Verificar que globalVars esté disponible
  if (!window.globalVars || !window.globalVars.resultadosTomoIII) {
    alert('⚠️ Error: No hay resultados de cálculos de viento. Por favor:\n1. Importa un archivo TXT\n2. Calcula los braces\nLuego intenta de nuevo.');
    return;
  }
  
  let murosConBraces = [];
  
  console.log('[DASHBOARD] Construyendo murosConBraces desde tabla actual + resultadosTomoIII');
  
  // Obtener las filas de la tabla con datos de braces
  const filas = document.querySelectorAll('tr[data-pid]');
  if (filas.length === 0) {
    alert('⚠️ Error: No hay datos de muros en la tabla. Por favor verifica que los braces estén calculados.');
    return;
  }
  
  console.log('[DASHBOARD] Procesando', filas.length, 'filas de la tabla');
  
  // Construir murosConBraces desde la tabla actual + resultadosTomoIII
  filas.forEach(row => {
    const pidStr = row.dataset.pid;
    const pid = parseInt(pidStr);
    
    console.log(`[DASHBOARD] Procesando fila con pid=${pid}`);
    
    // Obtener valores de braces desde los inputs de la tabla
    const angulo = parseFloat(row.querySelector('[data-field="angulo_brace"]')?.value) || 55;
    const npt = parseFloat(row.querySelector('[data-field="npt"]')?.value) || 0.350;
    const tipoBraceInput = row.querySelector('[data-field="tipo_brace_seleccionado"]')?.value;
    const tipoBrace = tipoBraceInput && tipoBraceInput !== '' ? tipoBraceInput : undefined;
    const xBraces = parseInt(row.querySelector('[data-field="x_braces"]')?.value) || 2;
    
    // Valores calculados (de celdas de solo lectura)
    const fbx = parseFloat(row.querySelector(`.valor-fbx[data-pid="${pidStr}"]`)?.textContent) || 0;
    const fby = parseFloat(row.querySelector(`.valor-fby[data-pid="${pidStr}"]`)?.textContent) || 0;
    const fb = parseFloat(row.querySelector(`.valor-fb[data-pid="${pidStr}"]`)?.textContent) || 0;
    const xInserto = parseFloat(row.querySelector(`.valor-x-inserto[data-pid="${pidStr}"]`)?.textContent) || 0;
    const yInserto = parseFloat(row.querySelector(`.valor-y-inserto[data-pid="${pidStr}"]`)?.textContent) || 0;
    
    // Cantidades de braces
    const cantB14 = parseInt(row.querySelector(`.cant-b14[data-pid="${pidStr}"]`)?.textContent) || 0;
    const cantB12 = parseInt(row.querySelector(`.cant-b12[data-pid="${pidStr}"]`)?.textContent) || 0;
    const cantB04 = parseInt(row.querySelector(`.cant-b04[data-pid="${pidStr}"]`)?.textContent) || 0;
    const cantB15 = parseInt(row.querySelector(`.cant-b15[data-pid="${pidStr}"]`)?.textContent) || 0;
    
    // Obtener datos de viento desde resultadosTomoIII usando pid como número
    const muroViento = window.globalVars.resultadosTomoIII.find(m => m.pid === pid);
    
    if (muroViento) {
      murosConBraces.push({
        ...muroViento,
        pid: pid,
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
      console.log(`[DASHBOARD] ✓ Muro ${pid} agregado a murosConBraces (fb=${fb})`);
    } else {
      console.warn(`[DASHBOARD] ⚠️ Muro ${pid} NO encontrado en resultadosTomoIII`);
      console.log('[DASHBOARD] Miros disponibles:', window.globalVars.resultadosTomoIII.map(m => m.pid));
    }
  });
  
  if (murosConBraces.length === 0) {
    alert('⚠️ Error: No se pudieron cargar los datos de muros. Por favor verifica que los braces estén calculados.');
    return;
  }
  
  console.log('[DASHBOARD] murosConBraces completado:', murosConBraces.length, 'muros');
  
  // ===== USAR GRUPOS DE MUERTOS DE SCRIPT.JS =====
  // En lugar de crear grupos nuevos, usar window.gruposMuertosGlobal que ya viene de script.js
  // con la agrupación correcta (M1, M2, etc.)
  let gruposMuertos;
  
  if (window.gruposMuertosGlobal && Object.keys(window.gruposMuertosGlobal).length > 0) {
    console.log('[DASHBOARD] ✅ Usando window.gruposMuertosGlobal de script.js');
    gruposMuertos = window.gruposMuertosGlobal;
  } else {
    console.log('[DASHBOARD] ⚠️ window.gruposMuertosGlobal no disponible, creando grupos por eje');
    // Fallback: crear grupos por x_inserto, tipo, angulo, eje si no existe window.gruposMuertosGlobal
    gruposMuertos = {};
    
    murosConBraces.forEach(muro => {
      const xInserto = parseFloat(muro.x_inserto || 0).toFixed(2);
      const tipoBrace = muro.tipo_brace_seleccionado || 'PUNTALES';
      const angulo = Math.round(muro.angulo_brace || 55);
      const eje = muro.eje || '1';
      
      // Crear clave única por X_INSERTO|TIPO|ANGULO|EJE
      const clave = `${xInserto}|${tipoBrace}|${angulo}|${eje}`;
      
      if (!gruposMuertos[clave]) {
        gruposMuertos[clave] = {
          xInserto: xInserto,
          tipo: tipoBrace,
          angulo: angulo,
          eje: eje,
          muros: []
        };
      }
      
      gruposMuertos[clave].muros.push(muro);
    });
  }
  
  console.log('[DASHBOARD] Grupos de muertos disponibles:', Object.keys(gruposMuertos).length);
  Object.keys(gruposMuertos).forEach(clave => {
    const grupo = gruposMuertos[clave];
    console.log(`[DASHBOARD]   ${clave}: ${grupo.muros?.length || 0} muros`);
  });
  
  // Exponer globalmente
  window.gruposMuertosGlobal = gruposMuertos;
  window.murosConBraces = murosConBraces;
  console.log('[DASHBOARD] gruposMuertosGlobal y murosConBraces expuestos globalmente');
  
  // ===== NO MOSTRAR FORMULARIO AQUÍ =====
  // El formulario se mostrará automáticamente cuando script.js dispare el evento 'gruposMuertosActualizados'
  // con los grupos correctos (M1, M2, etc.)
  console.log('[DASHBOARD] ⏳ Esperando que script.js actualice gruposMuertosGlobal y dispare evento...');
  
  // NOTA: No mostramos alert aquí para evitar confusión. El alert se mostrará desde el listener del evento.
}

// ============================================
// FUNCIÓN: Generar Tabla Informativa de Muertos
// ============================================
function generarTablaInfoMuertos(gruposMuertos) {
  const tbody = document.getElementById('tablaInfoMuertosBody');
  if (!tbody) {
    console.warn('[DASHBOARD] No se encontró tbody #tablaInfoMuertosBody');
    return;
  }

  let html = '';

  Object.keys(gruposMuertos).forEach((clave, index) => {
    const grupo = gruposMuertos[clave];
    const eje = grupo.eje || '-';
    const distanciaX = grupo.xInserto || grupo.x_inserto || grupo.x || 0;
    
    // Obtener configuración
    const sepLong = window.configGruposMuertos?.[clave]?.separacionLongitudinal || 25;
    const sepTrans = window.configGruposMuertos?.[clave]?.separacionTransversal || 25;
    const sepLongM = (sepLong / 100).toFixed(2);
    const sepTransM = (sepTrans / 100).toFixed(2);
    
    // Obtener lista de muros
    let murosLista = '-';
    if (grupo.muros && Array.isArray(grupo.muros)) {
      murosLista = grupo.muros.map(muroId => {
        const muroObj = window.lastResultadosMuertos?.find(m => m.id_muro === muroId || m.id === muroId);
        return muroObj?.id_muro || muroId;
      }).join(', ');
    }
    
    html += `
      <tr>
        <td style="font-weight: bold;">${clave}</td>
        <td style="text-align: center; font-weight: 600;">${eje}</td>
        <td class="text-left">${murosLista}</td>
        <td style="text-align: center;">${sepLongM}</td>
        <td style="text-align: center;">${sepTransM}</td>
        <td style="text-align: center; font-weight: bold;">${parseFloat(distanciaX).toFixed(2)}</td>
      </tr>`;
  });

  tbody.innerHTML = html;
  console.log('[DASHBOARD] ✅ Tabla informativa de muertos generada');
}

// Función principal para ejecutar los cálculos de armado
// Función principal para ejecutar los cálculos de armado (RECTANGULAR)
async function ejecutarCalculosArmado() {
  console.log('[DEPURACIÓN] Iniciando ejecutarCalculosArmado (Rectangular)');

  // 🔥 CRÍTICO: Actualizar configuración desde UI ANTES de calcular
  actualizarConfiguracion();
  console.log('[DASHBOARD] ✅ Configuración actualizada desde UI:', {
    superior: configArmado.cantVarillasSuperior,
    inferior: configArmado.cantVarillasInferior,
    medias: configArmado.cantVarillasMedias,
    sepLong: configArmado.separacionLongitudinal
  });

  try {
    // =================================================================
    // PASO 0: GUARDADO Y SINCRONIZACIÓN CON BASE DE DATOS
    // =================================================================
    console.log('[DASHBOARD] Guardando todos los cambios en la BD antes de calcular armado...');
    
    try {
      // 1. Intentar guardar cambios pendientes en la UI
      const btnGuardarTop = document.getElementById('btnGuardarTodosBracesTop');
      const btnGuardarBottom = document.getElementById('btnGuardarTodosBraces');

      if (btnGuardarTop && btnGuardarTop.onclick) {
        console.log('[DASHBOARD] Ejecutando guardar cambios automáticamente...');
        await btnGuardarTop.onclick();
      } else if (btnGuardarBottom && btnGuardarBottom.onclick) {
        console.log('[DASHBOARD] Ejecutando guardar cambios automáticamente (botón inferior)...');
        await btnGuardarBottom.onclick();
      } else if (window.guardarTodosBraces && typeof window.guardarTodosBraces === 'function') {
        // Fallback a función global
        await window.guardarTodosBraces();
      }

      // 2. Esperar propagación en BD
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Recargar datos frescos desde el Backend
      console.log('[DASHBOARD] Recargando datos actualizados desde la base de datos...');
      const projectConfig = localStorage.getItem('projectConfig');
      
      if (!projectConfig) throw new Error('No hay proyecto seleccionado');
      
      const project = JSON.parse(projectConfig);
      const pid = project.pid || project.id;

      if (!pid) throw new Error('No se encontró ID del proyecto');

      const response = await fetch(`${API_BASE}/api/importar-muros/muros?pk_proyecto=${pid}`);
      if (!response.ok) throw new Error('Error al recargar datos de muros');

      const responseData = await response.json();
      const murosActualizados = responseData.muros || responseData;

      // 4. SOLO regenerar si no hay grupos válidos en memoria
      // Si script.js ya hizo la agrupación secuencial, NO la sobreescribimos
      const gruposExistentes = window.gruposMuertosGlobal || {};
      const tieneGruposSecuenciales = Object.keys(gruposExistentes).some(k => k.startsWith('M'));
      
      if (tieneGruposSecuenciales && Object.keys(gruposExistentes).length > 0) {
        console.log('[DASHBOARD] ✅ Usando grupos secuenciales pre-calculados de script.js:', Object.keys(gruposExistentes).length, 'grupos');
        // No regenerar, mantener los grupos secuenciales que ya están correctos
      } else {
        console.log('[DASHBOARD] ⚠️ No hay grupos secuenciales, regenerando desde BD...');
        // Regenerar agrupación en memoria (window.gruposMuertosGlobal)
        const gruposMuertosActualizados = {};

        console.log('[DASHBOARD] Regenerando grupos desde BD. Total muros:', murosActualizados.length);
        murosActualizados.forEach((muro, idx) => {
          // Usar x_inserto (distancia) en lugar de x_braces (cantidad)
          const xInserto = parseFloat(muro.x_inserto || 0).toFixed(2);
          const tipoBrace = muro.tipo_brace_seleccionado || 'PUNTALES';
          const angulo = Math.round(muro.angulo_brace || muro.angulo || 55);
          const eje = muro.eje || '1';
          
          if (idx < 3) { // Log primeros 3 muros para debugging
            console.log(`[DASHBOARD] Muro ${idx}: PID=${muro.pid}, eje="${muro.eje}", x_inserto=${muro.x_inserto}, tipo=${muro.tipo_brace_seleccionado}`);
          }
          
          // Clave única de agrupación: X_INSERTO|TIPO|ANGULO|EJE
          const clave = `${xInserto}|${tipoBrace}|${angulo}|${eje}`;

          if (!gruposMuertosActualizados[clave]) {
            gruposMuertosActualizados[clave] = {
              xInserto: xInserto,
              tipo: tipoBrace,
              angulo: angulo,
              eje: eje,
              muros: []
            };
          }
          gruposMuertosActualizados[clave].muros.push(muro);
        });

        window.gruposMuertosGlobal = gruposMuertosActualizados;
        console.log('[DASHBOARD] Grupos sincronizados con BD:', Object.keys(gruposMuertosActualizados));
      }

    } catch (errorGuardar) {
      console.error('[DASHBOARD] Advertencia en sincronización:', errorGuardar);
      // No detenemos el flujo, intentamos calcular con lo que hay en memoria
    }

    // =================================================================
    // PASO 1: PREPARACIÓN DE DATOS
    // =================================================================
    const gruposMuertos = window.gruposMuertosGlobal;

    if (!gruposMuertos || Object.keys(gruposMuertos).length === 0) {
      alert('⚠️ Error: No hay datos de grupos. Por favor calcula las cargas de viento primero.');
      return;
    }

    console.log('[DASHBOARD] Preparando grupos para macizos rectangulares...');

    // Sincronización de profundidades manuales (Configuración específica por grupo)
    if (window.configGruposMuertos) {
      Object.keys(gruposMuertos).forEach(clave => {
        let profundidadManual = null;
        const grupo = gruposMuertos[clave];

        // Prioridad 1: Configuración por clave exacta (ej: '2_55_A')
        if (window.configGruposMuertos[clave]?.profundo) {
          profundidadManual = window.configGruposMuertos[clave].profundo;
        }
        
        // Prioridad 2: Configuración por Eje simple (ej: 'MA')
        if (!profundidadManual && grupo.eje) {
          const claveCorta = `M${grupo.eje}`; // Asumiendo eje es 'A', '1', etc.
          if (window.configGruposMuertos[claveCorta]?.profundo) {
            profundidadManual = window.configGruposMuertos[claveCorta].profundo;
          }
        }

        // Aplicar si se encontró configuración manual
        if (profundidadManual) {
          gruposMuertos[clave].configGrupo = gruposMuertos[clave].configGrupo || {};
          gruposMuertos[clave].configGrupo.profundo = profundidadManual;
        }
      });
    }

    // Preparar la estructura plana para el cálculo
    const gruposPreparados = prepararGruposParaMuertos(gruposMuertos);

    // =================================================================
    // INSERTAR TABLA INFORMATIVA DE MUERTOS
    // =================================================================
    console.log('[DASHBOARD] Llamando generarTablaInfoMuertos con:', gruposMuertos);
    generarTablaInfoMuertos(gruposMuertos);

    // =================================================================
    // PASO 2: CÁLCULO RECTANGULAR
    // =================================================================
    console.log('[DASHBOARD] Ejecutando cálculo rectangular...');
    
    // configArmado es la variable global definida en dashboard.js con los inputs del usuario
    const resultados = calcularMacizosRectangulares(gruposPreparados, configArmado);

    // =================================================================
    // PASO 3: RENDERIZADO Y TOTALES
    // =================================================================
    
    // 3.1. Calcular Totales para las tarjetas
    let totalVolumenConcreto = 0;
    let totalPesoConcreto = 0;
    let totalPesoAcero = 0;
    let totalPesoAlambre = 0;

    resultados.forEach(res => {
      totalVolumenConcreto += res.volumenConcreto_m3 || 0;
      totalPesoConcreto += res.pesoConcreto_kg || 0;
      
      const aceroLong = res.pesoLongitudinal_kg || 0;
      const aceroTrans = res.pesoEstribos_kg || 0;
      totalPesoAcero += (aceroLong + aceroTrans);
      
      totalPesoAlambre += res.pesoAlambre_kg || 0;
    });

    const totalMetal = totalPesoAcero + totalPesoAlambre;

    // 3.2. Actualizar UI (Tarjetas de resumen)
    const elTotalConcreto = document.getElementById('totalConcreto');
    const elTotalAcero = document.getElementById('totalAcero');
    const elTotalAlambre = document.getElementById('totalAlambre');
    const elTotalMetal = document.getElementById('totalMetal');

    if (elTotalConcreto) elTotalConcreto.textContent = `${totalVolumenConcreto.toFixed(2)} m³ / ${(totalPesoConcreto / 1000).toFixed(2)} ton`;
    if (elTotalAcero) elTotalAcero.textContent = `${totalPesoAcero.toFixed(1)} kg / ${(totalPesoAcero / 1000).toFixed(3)} ton`;
    if (elTotalAlambre) elTotalAlambre.textContent = `${totalPesoAlambre.toFixed(1)} kg / ${(totalPesoAlambre / 1000).toFixed(3)} ton`;
    if (elTotalMetal) elTotalMetal.textContent = `${totalMetal.toFixed(1)} kg / ${(totalMetal / 1000).toFixed(3)} ton`;

    // 3.3. Generar e inyectar Tabla HTML
    const tablaHTML = generarTablaResultadosMacizos(resultados);
    const tabla = document.getElementById('tablaArmadoResultados');

    if (tabla) {
      // Mantenemos el thead original y reemplazamos tbody/tfoot
      tabla.innerHTML = tabla.querySelector('thead').outerHTML + tablaHTML;
      tabla.style.display = ''; // Asegurar visibilidad
      console.log('[DASHBOARD] Tabla rectangular actualizada correctamente');
    } else {
      console.error('[DASHBOARD] No se encontró la tabla #tablaArmadoResultados en el DOM');
    }

    // =================================================================
    // PASO 4: FINALIZACIÓN
    // =================================================================
    
    // Guardar en variable global para la generación de PDF
    // Enriquecer resultados con x_inserto y espaciado del grupo para Tabla 2 del PDF
    if (window.gruposMuertosGlobal) {
      const claves = Object.keys(window.gruposMuertosGlobal);
      resultados.forEach((res) => {
        const clave = res.grupo_clave || claves.find(c => {
          const g = window.gruposMuertosGlobal[c];
          return g && g.numero_grupo === res.grupo_numero;
        });
        if (clave) {
          const grupo = window.gruposMuertosGlobal[clave];
          const config = window.configGruposMuertos?.[clave] || {};
          res.x_inserto = parseFloat(grupo.xInserto || grupo.x_inserto || grupo.x || 0);
          res.espaciadoLong_m = (config.separacionLongitudinal || 25) / 100;
          res.espaciadoTrans_m = (config.separacionTransversal || 25) / 100;
        }
      });
    }
    window.ultimosResultadosMacizos = resultados;

    console.log('[DASHBOARD] ✅ Cálculo Rectangular completado exitosamente');

  } catch (error) {
    console.error('[DASHBOARD] ❌ Error crítico en cálculo rectangular:', error);
    alert('Ocurrió un error al calcular el armado rectangular: ' + error.message);
  }
}







// Función para llenar la tabla de armado
function llenarTablaArmado(reporte) {
  const tbody = document.querySelector('#tablaArmado tbody');
  const tfoot = document.querySelector('#tablaArmado tfoot');
  
  // Limpiar contenido anterior
  tbody.innerHTML = '';
  
  let totales = {
    volumenConcreto: 0,
    pesoConcreto: 0,
    pesoLongitudinal: 0,
    pesoTransversal: 0,
    pesoAlambre: 0,
    longitudTotalLongitudinal: 0,
    longitudTotalTransversal: 0,
    longitudAlambre: 0
  };
  
  // Agregar filas de datos - cada muerto tiene 2 filas (Long. y Trans.)
  reporte.forEach((item, index) => {
    // Fila para acero longitudinal
    const filaLong = document.createElement('tr');
    filaLong.innerHTML = `
      <td rowspan="2">D${index + 1}</td>
      <td rowspan="2">${item.eje}</td>
      <td rowspan="2">${item.cantidadMuros || 1 > 1 ? 'M0' + (item.cantidadMuros || 1) : 'M01'}</td>
      <td rowspan="2">${item.profundidad?.toFixed(2) || 'N/A'}</td>
      <td rowspan="2">${item.alto?.toFixed(2) || 'N/A'}</td>
      <td rowspan="2">${item.ancho?.toFixed(2) || 'N/A'}</td>
      <td>4</td>
      <td>${item.longitudTotalLongitudinal.toFixed(1)}</td>
      <td>${item.pesoLongitudinal.toFixed(1)}</td>
      <td>Long.</td>
      <td rowspan="2">${item.volumenConcreto.toFixed(2)}</td>
      <td rowspan="2">${(item.pesoConcreto / 1000).toFixed(1)}</td>
      <td rowspan="2">${item.longitudAlambre.toFixed(0)}</td>
      <td rowspan="2">${item.pesoAlambre.toFixed(1)}</td>
    `;
    tbody.appendChild(filaLong);
    
    // Fila para acero transversal
    const filaTrans = document.createElement('tr');
    filaTrans.innerHTML = `
      <td>3</td>
      <td>${item.longitudTotalTransversal.toFixed(1)}</td>
      <td>${item.pesoTransversal.toFixed(1)}</td>
      <td>Trans.</td>
    `;
    tbody.appendChild(filaTrans);
    
    // Sumar a totales
    totales.volumenConcreto += item.volumenConcreto;
    totales.pesoConcreto += item.pesoConcreto;
    totales.pesoLongitudinal += item.pesoLongitudinal;
    totales.pesoTransversal += item.pesoTransversal;
    totales.pesoAlambre += item.pesoAlambre;
    totales.longitudTotalLongitudinal += item.longitudTotalLongitudinal;
    totales.longitudTotalTransversal += item.longitudTotalTransversal;
    totales.longitudAlambre += item.longitudAlambre;
  });
  
  // Agregar fila de totales
  if (tfoot) {
    const totalAcero = totales.pesoLongitudinal + totales.pesoTransversal;
    
    tfoot.innerHTML = `
      <tr style="background-color: #f0f8ff; font-weight: bold;">
        <td colspan="6">TOTALES</td>
        <td>-</td>
        <td>${(totales.longitudTotalLongitudinal + totales.longitudTotalTransversal).toFixed(1)}</td>
        <td>${totalAcero.toFixed(1)}</td>
        <td>-</td>
        <td>${totales.volumenConcreto.toFixed(2)}</td>
        <td>${(totales.pesoConcreto / 1000).toFixed(2)}</td>
        <td>${totales.longitudAlambre.toFixed(0)}</td>
        <td>${totales.pesoAlambre.toFixed(1)}</td>
      </tr>
    `;
  }
  
  // Mostrar la tabla
  const tablaContainer = document.getElementById('tablaArmadoContainer');
  if (tablaContainer) {
    tablaContainer.style.display = 'block';
  }
}

// Función para actualizar las tarjetas de resumen
function actualizarResumenArmado(concreto, acero, alambre, metal) {
  document.getElementById('totalConcreto').textContent = `${concreto.toFixed(3)} m³`;
  document.getElementById('totalAcero').textContent = `${acero.toFixed(2)} kg`;
  document.getElementById('totalAlambre').textContent = `${alambre.toFixed(2)} kg`;
  document.getElementById('totalMetal').textContent = `${metal.toFixed(2)} kg`;
}

// Inicializar armado rectangular cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar siempre - el botón debería existir en la sección 6
  if (document.getElementById('btnCalcularArmado')) {
    console.log('[ARMADO] Inicializando armado rectangular...');
    initArmadoRectangular();
  } else {
    console.warn('[ARMADO] ⚠️ Botón btnCalcularArmado no encontrado');
  }
  
  // ===== ACTUALIZAR CATEGORÍA NSR-10 =====
  function actualizarCategoriaNSR10() {
    const selectorCategoria = document.getElementById('categoria_estructura_nsr10');
    const display = document.getElementById('categoria_nsr10_display');
    
    if (selectorCategoria && display) {
      const categoriaNSR = selectorCategoria.value;
      display.textContent = categoriaNSR;
      console.log('[DASHBOARD] Categoría NSR-10 actualizada:', categoriaNSR);
    }
  }
  
  // Event listener para actualizar categoría al cambiar selector
  const selectorCategoriaNSR = document.getElementById('categoria_estructura_nsr10');
  if (selectorCategoriaNSR) {
    selectorCategoriaNSR.addEventListener('change', actualizarCategoriaNSR10);
    // Actualizar al cargar
    actualizarCategoriaNSR10();
  }
  
  // Listener para detectar cuando script.js actualiza window.gruposMuertosGlobal
  window.addEventListener('gruposMuertosActualizados', function(event) {
    console.log('[DASHBOARD] 🎯 Evento gruposMuertosActualizados recibido desde script.js');
    console.log('[DASHBOARD] Grupos actualizados:', event.detail);
    
    // Actualizar el formulario de configuración con los nuevos grupos
    if (event.detail && Object.keys(event.detail).length > 0) {
      mostrarConfigGrupos(event.detail);
      
      // Mostrar mensaje de confirmación
      const numGrupos = Object.keys(event.detail).length;
      alert(`✅ ${numGrupos} grupo${numGrupos > 1 ? 's' : ''} de muertos detectado${numGrupos > 1 ? 's' : ''}!\n\n` +
            `➡️ Ahora configura la profundidad para cada muerto.\n\n` +
            `Luego haz clic en "💾 Guardar Profundidades".`);
    }
  });
  
  console.log('[DASHBOARD] ✅ Listener de gruposMuertosActualizados registrado');
});

// Exponer funciones globalmente
window.ejecutarCalculosArmado = ejecutarCalculosArmado;
window.eliminarRango = eliminarRango;
window.cargarGruposMuertosDesdeBackend = cargarGruposMuertosDesdeBackend;
window.guardarProfundidadesMuertos = guardarProfundidadesMuertos;

// ELIMINADO: window.exportarTablaDetallada = exportarTablaDetallada;

// Exponer funciones globalmente
window.autoRecalcularTiposBraces = autoRecalcularTiposBraces;