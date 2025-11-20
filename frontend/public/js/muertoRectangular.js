/**
 * CÁLCULOS DE ARMADO RECTANGULAR PARA MUERTOS
 *
 * Versión ajustada para coincidir con el informe PDF (tipo Magnorth)
 * - Solo muerto rectangular
 * - Usa #4 para longitudinal y #3 para estribos por defecto
 * - Descuenta recubrimientos
 * - Suma 2 ganchos en estribos
 * - Alambre = (todas las barras longitudinales) × (n° estribos)
 *
 * Unidades:
 *  - Longitudes en m
 *  - Pesos en kg
 */

// ================== IMPORTS ==================
// ELIMINADO: import { obtenerConfiguracionMuerto } from './factoresRepeticion.js';
// Los factores de repetición (repLong, repTrans, repVol) son datos ESPECÍFICOS del proyecto
// y NO deben venir hardcodeados de archivos externos. Deben ser:
// 1. Ingresados por el usuario en la interfaz
// 2. Almacenados en la base de datos del proyecto
// 3. Recuperados desde la base de datos cuando sea necesario

// ================== CONSTANTES ==================

const PESO_ESPECIFICO_KG_M = {
  '#3': 0.560 , // Ajustado para precisión exacta del PDF Magnorth
  '#4': 0.994, // Ajustado para precisión exacta del PDF Magnorth
  '#5': 1.552 , // Ajustado para precisión exacta del PDF Magnorth
  '#6': 2.235 , // Ajustado para precisión exacta del PDF Magnorth
};

const DENSIDAD_ACERO_KG_M3 = 7850;
const DENSIDAD_CONCRETO_KG_M3_DEFAULT = 2400;

const RECUBRIMIENTO_DEFAULT_M = 0.04;           // 4 cm (como recomienda)
const ESPACIAMIENTO_ESTRIBO_DEFAULT_M = 0.25;   // 25 cm (como recomienda)
const LONG_GANCHO_ESTRIBO_DEFAULT_M = 0.7;      // 0.7 m ✅
const LONG_AMARRE_DEFAULT_M = 0.35;             // 35 cm (como recomienda)
const DIAMETRO_ALAMBRE_DEFAULT_M = 0.00122;     // 1.22 mm (como recomienda)

// ================== AUXILIARES ==================

function obtenerPesoEspecifico(tipoVarilla = 4) {
  // acepta 4 o "#4"
  const key = String(tipoVarilla).startsWith('#')
    ? String(tipoVarilla)
    : `#${tipoVarilla}`;
  return PESO_ESPECIFICO_KG_M[key] ?? PESO_ESPECIFICO_KG_M['#4'];
}

// ================== CONCRETO ==================

function calcularConcreto(dimensiones, densidad = DENSIDAD_CONCRETO_KG_M3_DEFAULT, factorDesperdicio = 1) {
  const { ancho, alto, profundidad } = dimensiones; // profundidad = largo del muerto
  const volumen_m3 = ancho * alto * profundidad;
  const peso_kg = volumen_m3 * densidad * factorDesperdicio;

  return {
    volumen_m3,
    peso_kg,
  };
}

// ====== LONGITUDINAL IGUAL AL EXCEL ======
function calcularLongitudinal(dimensiones, config = {}) {
  // largo de referencia del muerto (el Excel usa K o N; nosotros usamos profundidad)
  const L = dimensiones.profundidad; 

  // ancho del muerto (columna M en Excel)
  const b = dimensiones.ancho;

  // recubrimiento (C2 en el Excel = 0.04 m)
  const r = config.recubrimientoLongitudinal !== undefined
    ? config.recubrimientoLongitudinal / 100
    : RECUBRIMIENTO_DEFAULT_M;

  // separación que usa el Excel para las varillas superiores (Q5 = 0.25 m)
  const sepSup_m = config.separacionLongitudinal !== undefined
    ? config.separacionLongitudinal / 100
    : 0.25; // 25 cm como en el libro de cálculo

  // peso específico de la varilla (X5/Y5/Z5 en el Excel)
  const pesoVarillaLong_kgm = obtenerPesoEspecifico(config.tipoVarillaLongitudinal || 4);

  // === BARRAS SUPERIORES (T5) ===
  // mismo criterio que la fila 5 del Excel:
  // R5 = número de barras = ((ancho - 2*rec) / sep) + 1, mínimo 3
  const anchoUtil_m = Math.max(b - 2 * r, 0);
  const cantSup = Math.max(
    3,
    Math.round(anchoUtil_m / sepSup_m + 1)
  );

  // === BARRAS MEDIAS E INFERIORES (U5 y V5) ===
  // el Excel usa valores fijos en U2 y V2 (=2), así que los dejamos así por defecto
  const cantMed = config.cantVarillasMedias ?? 2;
  const cantInf = config.cantVarillasInferior ?? 2;

  // en el Excel las tres longitudes se multiplican por el mismo largo (K o N)
  const largoSup_m = cantSup * L;
  const largoMed_m = cantMed * L;
  const largoInf_m = cantInf * L;

  const largoTotal_m = largoSup_m + largoMed_m + largoInf_m;
  const peso_kg = largoTotal_m * pesoVarillaLong_kgm;

  return {
    cantSup,
    cantMed,
    cantInf,
    largoTotal_m,
    peso_kg,
    // esto lo usa el alambre
    totalBarrasLong: cantSup + cantMed + cantInf,
  };
}

// ====== TRANSVERSAL (ESTRIBOS) IGUAL AL EXCEL ======
function calcularTransversal(dimensiones, config = {}) {
  const L = dimensiones.profundidad;   // largo donde van los estribos
  const b = dimensiones.ancho;         // este es el que usa el Excel para armar el estribo

  const r = config.recubrimientoTransversal !== undefined
    ? config.recubrimientoTransversal / 100
    : RECUBRIMIENTO_DEFAULT_M;

  // separación entre estribos (AA5) → 0.25 m
  const espaciamiento_m = config.separacionTransversal !== undefined
    ? config.separacionTransversal / 100
    : ESPACIAMIENTO_ESTRIBO_DEFAULT_M; // ya la tienes en 0.25

  const pesoVarillaEstribo_kgm = obtenerPesoEspecifico(config.tipoVarillaTransversal || 3);

  // largo útil donde realmente se ponen estribos (como hace el Excel con (K-2*rec))
  const largoUtil_m = Math.max(L - 2 * r, 0);

  // cantidad de estribos = ROUNDUP((largoUtil / espaciamiento)) + 1
  const cantidad = Math.ceil(largoUtil_m / espaciamiento_m) + 1;

  // espaciamiento real (AC5) = largoUtil / cantidad
  const espaciamientoReal_m = cantidad > 0 ? (largoUtil_m / cantidad) : 0;

  // *** ESTA ES LA PARTE QUE NO TENÍAS IGUAL ***
  // AD5 = (M5 - 2*rec)*3 + 0.2
  const anchoUtil_m = Math.max(b - 2 * r, 0);
  const longitudEstribo_m = Math.max(anchoUtil_m * 3 + 0.2, 0);

  // total de acero de estribos (AE5) = longitud estribo * cantidad
  const totalLongitudEstribos_m = longitudEstribo_m * cantidad;
  const peso_kg = totalLongitudEstribos_m * pesoVarillaEstribo_kgm;

  return {
    cantidad,
    espaciamientoReal_m,
    longitudPorEstribo_m: longitudEstribo_m,
    longitudTotal_m: totalLongitudEstribos_m,
    peso_kg,
  };
}

// ====== ALAMBRE (esto ya lo tenías igual al Excel) ======
function calcularAlambre(dimensiones, config = {}, longitudinal, transversal) {
  const longAmarre_m = config.longitudVuelta !== undefined
    ? config.longitudVuelta / 100
    : LONG_AMARRE_DEFAULT_M; // 0.35 m, igual que AJ5

  const diametro_m = config.diametroAlambre !== undefined
    ? config.diametroAlambre / 1000
    : DIAMETRO_ALAMBRE_DEFAULT_M;

  // nodos = cantidad de estribos × total de barras longitudinales (AI5)
  const nodos = transversal.cantidad * longitudinal.totalBarrasLong;

  const longitudTotal_m = nodos * longAmarre_m * (config.factorDesperdicioAlambre ?? 1);

  // peso del alambre como lo hacías tú
  const radio = diametro_m / 2;
  const area = Math.PI * Math.pow(radio, 2);
  const peso_kg = DENSIDAD_ACERO_KG_M3 * area * longitudTotal_m;

  return {
    nodos,
    longitudTotal_m,
    peso_kg,
  };
}

// ================== FUNCIÓN PRINCIPAL ==================

function calcularReporteMuerto(dimensiones, config = {}) {
  // 1. concreto
  const concreto = calcularConcreto(
    dimensiones,
    config.densidadConcreto ?? DENSIDAD_CONCRETO_KG_M3_DEFAULT,
    config.factorDesperdicio ?? 1
  );

  // 2. longitudinal
  const longitudinal = calcularLongitudinal(dimensiones, config);

  // 3. transversal
  const transversal = calcularTransversal(dimensiones, config);

  // 4. alambre
  const alambre = calcularAlambre(dimensiones, config, longitudinal, transversal);

  // ===== APLICAR FACTORES DE REPETICIÓN ESPECÍFICOS =====
  // Factores del Excel: repLong, repTrans, repVol (diferentes para cada muerto)
  const factorLongitudinal = config.repLong ?? 1;
  const factorTransversal = config.repTrans ?? 1; 
  const factorVolumen = config.repVol ?? 1;
  const factorAlambre = config.repAlambre ?? factorTransversal; // alambre usa mismo factor que transversal

  return {
    // dimensiones
    ancho: dimensiones.ancho,
    alto: dimensiones.alto,
    largo: dimensiones.profundidad,
    profundidad: dimensiones.profundidad,

    // concreto (aplicar factorVolumen)
    volumenConcreto: concreto.volumen_m3 * factorVolumen,
    pesoConcreto: concreto.peso_kg * factorVolumen,

    // acero longitudinal (aplicar factorLongitudinal)
    longitudTotalLongitudinal: longitudinal.largoTotal_m * factorLongitudinal,
    pesoLongitudinal: longitudinal.peso_kg * factorLongitudinal,

    // acero transversal (aplicar factorTransversal)
    cantEstribos: transversal.cantidad,
    longitudTotalTransversal: transversal.longitudTotal_m * factorTransversal,
    pesoTransversal: transversal.peso_kg * factorTransversal,

    // alambre (aplicar factorAlambre)
    nodos: alambre.nodos,
    longitudAlambre: alambre.longitudTotal_m * factorAlambre,
    pesoAlambre: alambre.peso_kg * factorAlambre,

    // total materiales (con factores aplicados)
    pesoTotal: (concreto.peso_kg * factorVolumen) + 
               (longitudinal.peso_kg * factorLongitudinal) + 
               (transversal.peso_kg * factorTransversal) + 
               (alambre.peso_kg * factorAlambre),
    
    // También mantener nombres alternativos para compatibilidad (con factores)
    volumenConcreto_m3: concreto.volumen_m3 * factorVolumen,
    pesoConcreto_kg: concreto.peso_kg * factorVolumen,
    longLongitudinal_m: longitudinal.largoTotal_m * factorLongitudinal,
    pesoLongitudinal_kg: longitudinal.peso_kg * factorLongitudinal,
    longEstribos_m: transversal.longitudTotal_m * factorTransversal,
    pesoEstribos_kg: transversal.peso_kg * factorTransversal,
    longAlambre_m: alambre.longitudTotal_m * factorAlambre,
    pesoAlambre_kg: alambre.peso_kg * factorAlambre,
    pesoTotal_kg: (concreto.peso_kg * factorVolumen) + 
                  (longitudinal.peso_kg * factorLongitudinal) + 
                  (transversal.peso_kg * factorTransversal) + 
                  (alambre.peso_kg * factorAlambre),
    
    // Tipos de varillas usadas (para tabla de resultados)
    tipoVarillaLong: config.tipoVarillaLongitudinal || 4,
    tipoVarillaTrans: config.tipoVarillaTransversal || 3,
  };
}

// ================== EXPORTS ==================

export {
  calcularConcreto,
  calcularLongitudinal,
  calcularTransversal,
  calcularAlambre,
  calcularReporteMuerto,
  PESO_ESPECIFICO_KG_M,
};

// ================== FUNCIÓN DE AGRUPACIÓN Y SUMA ==================
/**
 * Prepara datos de grupos de muros para cálculo de macizos de anclaje rectangulares
 * Suma los valores dentro de cada grupo (agrupado por x_braces, ángulo, eje)
 * 
 * @param {Object} gruposMuertos - Objeto con grupos agrupados por braces
 *   Estructura: { "x_braces_angulo_eje": { x_braces, angulo, eje, muros: [...] } }
 * 
 * @returns {Array} Array de grupos preparados para cálculos
 *   Cada grupo contiene:
 *   - largo_total: suma de grosor (ancho) de todos los muros
 *   - alto_total: suma de overall_height de todos los muros
 *   - espesor_bloque: espesor del bloque del muerto
 *   - x_braces, angulo, eje: datos del grupo
 *   - cantidad_muros: cantidad de muros en el grupo
 *   - muros_list: lista de ids de muros
 *   - cant_b14, cant_b12, cant_b04, cant_b15: cantidades de braces
 */
export function prepararGruposParaMuertos(gruposMuertos) {
  console.log('[MUERTO-RECTANGULAR] prepararGruposParaMuertos - Inicio');
  console.log('[MUERTO-RECTANGULAR] gruposMuertos recibido:', gruposMuertos);
  
  const gruposPreparados = [];
  
  Object.keys(gruposMuertos).forEach((clave, indice) => {
    const grupo = gruposMuertos[clave];
    
    console.log(`[MUERTO-RECTANGULAR] Procesando grupo ${indice + 1}: ${clave}`);
    console.log(`[MUERTO-RECTANGULAR]   Muros en grupo: ${grupo.muros.length}`);
    
    // SUMAR valores dentro del grupo
      let largoTotal = 0;  // suma de overall_width de los muros
    let altoTotal = 0;   // suma de overall_height
    let espesorBloque = 0.80; // valor por defecto, se puede ajustar
    let murosIds = [];  // Para llenar muros_list
    
    // Sumar dimensiones de cada muro SOLO si no existen ya en el grupo preparado
    // Si el grupo ya tiene los muros con FBy, no recalcular ni modificar esos datos
    if (!grupo.largo_total || !grupo.muros_list) {
      grupo.muros.forEach(muro => {
        let muroObj = muro;
        let muroId = '?';
        if (typeof muro === 'string') {
          muroId = muro;
          if (window.lastResultadosMuertos && Array.isArray(window.lastResultadosMuertos)) {
            muroObj = window.lastResultadosMuertos.find(m => m.id_muro === muro || m.id === muro);
          }
          if (!muroObj) {
            console.warn(`[MUERTO-RECTANGULAR]   ⚠️ Muro ${muroId} no encontrado en lastResultadosMuertos`);
            return;
          }
        } else if (muro && typeof muro === 'object') {
          muroId = muro.id_muro || muro.id || '?';
        } else {
          console.warn(`[MUERTO-RECTANGULAR]   ⚠️ Muro inválido:`, muro);
          return;
        }
        if (muroObj && typeof muroObj === 'object') {
          let grosor = 0;
          grosor = parseFloat(muroObj.grosor);
          if (!grosor || grosor === 0) {
            const area = parseFloat(muroObj.area_m2) || parseFloat(muroObj.area) || 0;
            const h = parseFloat(muroObj.overall_height) || parseFloat(muroObj.altura_z_m) || 0;
            grosor = h > 0 ? area / h : 0;
          }
          largoTotal += parseFloat(muroObj.overall_width) || 0;
          murosIds.push(muroId);
          console.log(`[MUERTO-RECTANGULAR]   Muro ${muroId}: grosor=${grosor}`);
        } else {
          console.warn(`[MUERTO-RECTANGULAR]   ⚠️ Muro inválido (no es objeto):`, muro);
        }
      });
    } else {
      largoTotal = grupo.largo_total;
      murosIds = grupo.muros_list.split(',');
    }
    
    console.log(`[MUERTO-RECTANGULAR]   Totales sumados: largo=${largoTotal}m`);
    
    // Calcular ancho del muerto correctamente
    const configGrupoManual = window.configGruposMuertos?.[clave] || {};
    const profundo = configGrupoManual.profundo || 0.80;
    const densidadConcreto = configGrupoManual.densidadConcreto || 2400;
    // Sumar FBy de todos los muros
    let sumaFBy = 0;
    grupo.muros.forEach(muro => {
      let muroObj = muro;
      if (typeof muro === 'string') {
        if (window.lastResultadosMuertos && Array.isArray(window.lastResultadosMuertos)) {
          muroObj = window.lastResultadosMuertos.find(m => m.id_muro === muro || m.id === muro);
        }
      }
      sumaFBy += muroObj?.FBy || 0;
    });
    const volumenMuerto = sumaFBy / densidadConcreto;
    let anchoMuerto = 0;
    if (largoTotal > 0 && profundo > 0) {
      anchoMuerto = volumenMuerto / (largoTotal * profundo);
      anchoMuerto = Math.round(anchoMuerto * 100) / 100;
    }
    const grupoPreparado = {
      clave: clave,
      numero_grupo: indice + 1,
      largo_total: largoTotal,
      alto_total: profundo,
      espesor_bloque: espesorBloque,
      x_braces: grupo.x_braces || 0,
      angulo: grupo.angulo || 0,
      eje: grupo.eje || '',
      cant_b14: grupo.muros[0]?.cant_b14 || 0,
      cant_b12: grupo.muros[0]?.cant_b12 || 0,
      cant_b04: grupo.muros[0]?.cant_b04 || 0,
      cant_b15: grupo.muros[0]?.cant_b15 || 0,
      cantidad_muros: grupo.muros.length,
      muros_list: murosIds.join(', '),
      muros: grupo.muros,
      configGrupo: {
        ...configGrupoManual,
        profundo: profundo,
      },
      sumaFBy,
      densidadConcreto,
      volumenMuerto,
      anchoMuerto,
    };
    gruposPreparados.push(grupoPreparado);
    console.log(`[MUERTO-RECTANGULAR]   Grupo preparado:`, grupoPreparado);
  });
  
  console.log('[MUERTO-RECTANGULAR] prepararGruposParaMuertos - Total grupos preparados:', gruposPreparados.length);
  return gruposPreparados;
}

// ================== FUNCIÓN DE CÁLCULO DE MACIZOS RECTANGULARES ==================
/**
 * Calcula macizos de anclaje rectangulares para cada grupo de muros
 * Utiliza datos sumados dentro de cada grupo (largo_total, alto_total, espesor_bloque)
 * 
 * @param {Array} gruposPreparados - Array retornado por prepararGruposParaMuertos()
 * @param {Object} config - Configuración de cálculo (opcional)
 *   - tipoVarillaLong: tipo de varilla longitudinal (default: 4)
 *   - tipoVarillaTrans: tipo de varilla transversal (default: 3)
 *   - espaciamientoEstribo: espaciamiento entre estribos en m (default: 0.25)
 *   - densidadConcreto: kg/m³ (default: 2400)
 * 
 * @returns {Array} Array con cálculos de macizos para cada grupo
 */
export function calcularMacizosRectangulares(gruposPreparados, config = {}) {
  console.log('[MUERTO-RECTANGULAR] calcularMacizosRectangulares - Inicio');
  console.log('[MUERTO-RECTANGULAR] gruposPreparados:', gruposPreparados.length);
  
  // Config por defecto
  const configDefault = {
    tipoVarillaLong: 4,
    tipoVarillaTrans: 3,
    espaciamientoEstribo: 0.25,
    densidadConcreto: 2400,
    ...config
  };
  
  const resultados = [];
  
  gruposPreparados.forEach((grupo, indice) => {
    console.log(`[MUERTO-RECTANGULAR] Calculando macizo grupo ${indice + 1}/${gruposPreparados.length}`);
    
    // ===== OBTENER CONFIGURACIÓN ESPECÍFICA DEL GRUPO =====
    const configGrupo = grupo.configGrupo || {
      profundo: 0.80,
      espaciadoLong: 25,
      espaciadoTrans: 25,
      factorSeguridad: 1.0,
      friccion: 0.3
    };
    
    console.log(`[MUERTO-RECTANGULAR]   Config del grupo:`, configGrupo);
    
    // ===== PASO 1: CALCULAR FUERZA TOTAL DEL BRACE =====
    let fuerzaBraceTotal_kN = 0;
    grupo.muros.forEach(muro => {
      console.log(`[MUERTO-RECTANGULAR]     Diagnóstico muro:`, {
        id: muro.id_muro || muro.id,
        fb: muro.fb,
        fuerza_brace: muro.fuerza_brace,
        fuerza_braces_kN: muro.fuerza_braces_kN,
        campos_disponibles: Object.keys(muro)
      });
      
      // Intentar múltiples campos posibles para la fuerza
      const fuerzaMuro = parseFloat(muro.fuerza_braces_kN) || 
                         parseFloat(muro.fuerza_brace) || 
                         parseFloat(muro.fb) || 0;
      fuerzaBraceTotal_kN += fuerzaMuro;
    });
    
    console.log(`[MUERTO-RECTANGULAR]   Fuerza total brace: ${fuerzaBraceTotal_kN} kN`);
    
    // ===== PASO 2: CALCULAR PESO DEL MUERTO =====
    // Fórmula: pesoMuerto = fuerza * (sin(ángulo) - fricción * cos(ángulo))
    const anguloRad = (grupo.angulo || 0) * Math.PI / 180;
    const sin_ang = Math.sin(anguloRad);
    const cos_ang = Math.cos(anguloRad);
    const friccion = configGrupo.friccion || 0.3;
    
    // Convertir kN a N para el cálculo
    const fuerzaBrace_N = fuerzaBraceTotal_kN * 1000;
    const pesoMuerto_N = fuerzaBrace_N * (sin_ang - friccion * cos_ang);
    const pesoMuerto_kg = pesoMuerto_N / 9.81;

    console.log(`[MUERTO-RECTANGULAR]   Cálculo peso muerto:`);
    console.log(`[MUERTO-RECTANGULAR]     Ángulo (rad): ${anguloRad.toFixed(4)}`);
    console.log(`[MUERTO-RECTANGULAR]     sin(ángulo): ${sin_ang.toFixed(4)}`);
    console.log(`[MUERTO-RECTANGULAR]     cos(ángulo): ${cos_ang.toFixed(4)}`);
    console.log(`[MUERTO-RECTANGULAR]     Fuerza brace (N): ${fuerzaBrace_N.toFixed(2)}`);
    console.log(`[MUERTO-RECTANGULAR]     Peso muerto (N): ${pesoMuerto_N.toFixed(2)} N`);
    console.log(`[MUERTO-RECTANGULAR]     Peso muerto (kg): ${pesoMuerto_kg.toFixed(2)} kg`);
    console.log(`[MUERTO-RECTANGULAR]     Fuerza total brace: ${fuerzaBraceTotal_kN}`);
    
    console.log(`[MUERTO-RECTANGULAR]   Peso del muerto: ${pesoMuerto_kg.toFixed(2)} kg`);
    
    // ===== PASO 3: CALCULAR VOLUMEN DEL MUERTO =====
      // Usar sumaFBy y densidadConcreto para volumen y ancho, igual que prepararGruposParaMuertos
      const densidadConcreto = configDefault.densidadConcreto || 2400;
      const sumaFBy = grupo.sumaFBy || 0;
      const volumenMuerto_m3 = sumaFBy / densidadConcreto;
      console.log(`[MUERTO-RECTANGULAR]   Volumen del muerto (por sumaFBy): ${volumenMuerto_m3.toFixed(4)} m³`);

      // Dimensiones
      const L = grupo.largo_total;  // Largo (m)
      const H = grupo.alto_total;   // Alto (m)
      const profundo = configGrupo.profundo; // Profundo (m) - del usuario
      let B = 0;
      if (L > 0 && profundo > 0) {
        B = volumenMuerto_m3 / (L * profundo);
        B = Math.round(B * 100) / 100;
      }
      console.log(`[MUERTO-RECTANGULAR]   Dimensiones corregidas: L=${L.toFixed(3)}m, H=${H.toFixed(3)}m, B=${B.toFixed(3)}m, Profundo=${profundo.toFixed(3)}m`);
    
    // ===== PASO 5: CALCULAR ACERO LONGITUDINAL =====
    // Fórmula de tu tabla: Long_acero_long = (L / 1.50) × 12
    // Peso_acero_long = (L / 1.50) × 11.9
    const longAceroLong_m = (L / 1.50) * 12;
    const pesoAceroLong_kg = (L / 1.50) * 11.9;
    
    // Número de barras longitudinales (N_SUP + N_MED + N_INF)
    const nBarrasLong = 8; // Como en tu tabla: 4 + 2 + 2 = 8
    
    console.log(`[MUERTO-RECTANGULAR]   Acero longitudinal: Long=${longAceroLong_m.toFixed(2)}m, Peso=${pesoAceroLong_kg.toFixed(2)}kg, #Barras=${nBarrasLong}`);
    
    // ===== PASO 6: CALCULAR ACERO TRANSVERSAL (ESTRIBOS) - FÓRMULA DETALLADA =====
    // n_estribos = ceil((L - 2×REC) / (SEP_cm/100)) + 1
    const REC = 0.04; // Recubrimiento (m) = 4 cm
    const SEP_m = configGrupo.espaciadoTrans / 100; // Espaciado transversal convertido a m
    const n_estribos = Math.ceil((L - 2 * REC) / SEP_m) + 1;
    
    // Longitud de un estribo:
    // L_estribo = 2×(B - 2×REC) + 2×(H - 2×REC) + 2×GANCHO
    const GANCHO = 0.7; // Longitud de gancho (m)
    const L_estribo = 2 * Math.max(B - 2 * REC, 0) + 2 * Math.max(H - 2 * REC, 0) + 2 * GANCHO;
    
    // Longitud total de estribos
    const longEstribos_m = n_estribos * L_estribo;
    
    // Peso de estribos (tipo #3 = 0.560 kg/m)
    const pesoEstribos_kg = longEstribos_m * 0.560;
    
    console.log(`[MUERTO-RECTANGULAR]   Estribos detallado:`);
    console.log(`[MUERTO-RECTANGULAR]     n_estribos = ceil((${L.toFixed(3)} - 2×${REC}) / ${SEP_m.toFixed(3)}) + 1 = ${n_estribos}`);
    console.log(`[MUERTO-RECTANGULAR]     L_estribo = 2×(${B.toFixed(3)} - 2×${REC}) + 2×(${H.toFixed(3)} - 2×${REC}) + 2×${GANCHO} = ${L_estribo.toFixed(3)}m`);
    console.log(`[MUERTO-RECTANGULAR]     L_total = ${n_estribos} × ${L_estribo.toFixed(3)} = ${longEstribos_m.toFixed(2)}m`);
    console.log(`[MUERTO-RECTANGULAR]     Peso = ${longEstribos_m.toFixed(2)} × 0.560 = ${pesoEstribos_kg.toFixed(2)}kg`);
    
    // ===== PASO 7: CALCULAR ALAMBRE - FÓRMULA DETALLADA =====
    // n_nudos = n_barras_long × n_estribos
    // L_alambre = n_nudos × LONG_NUDO_M
    // Peso_alambre = L_alambre × A × densidad_acero
    // donde A = π × (d/2)²
    
    const LONG_NUDO = 0.35; // Longitud de nudo (m)
    const DIAM_ALAMBRE = 0.00122; // Diámetro alambre (m)
    const n_nudos = nBarrasLong * n_estribos;
    const longAlambre_m = n_nudos * LONG_NUDO;
    
    // Cálculo del peso del alambre
    const radio_alambre = DIAM_ALAMBRE / 2;
    const area_alambre = Math.PI * Math.pow(radio_alambre, 2);
    const DENSIDAD_ACERO = 7850; // kg/m³
    const pesoAlambre_kg = longAlambre_m * area_alambre * DENSIDAD_ACERO;
    
    console.log(`[MUERTO-RECTANGULAR]   Alambre detallado:`);
    console.log(`[MUERTO-RECTANGULAR]     n_nudos = ${nBarrasLong} barras × ${n_estribos} estribos = ${n_nudos}`);
    console.log(`[MUERTO-RECTANGULAR]     L_alambre = ${n_nudos} × ${LONG_NUDO} = ${longAlambre_m.toFixed(2)}m`);
    console.log(`[MUERTO-RECTANGULAR]     d = ${DIAM_ALAMBRE} m, A = π × (${radio_alambre})² = ${area_alambre.toFixed(8)} m²`);
    console.log(`[MUERTO-RECTANGULAR]     Peso = ${longAlambre_m.toFixed(2)} × ${area_alambre.toFixed(8)} × ${DENSIDAD_ACERO} = ${pesoAlambre_kg.toFixed(2)}kg`);
    
    // ===== PASO 8: CALCULAR CONCRETO =====
    // V = L × H × B
    // Peso_conc = V × DENS_CONC × FACTOR_DESP ÷ 1000
    
    const volumenConcreto_m3 = L * H * B;
    const FACTOR_DESP_CONC = 1.0; // Factor de desperdicio concreto
    const pesoConcreto_kg = volumenConcreto_m3 * densidadConcreto * FACTOR_DESP_CONC;
    
    console.log(`[MUERTO-RECTANGULAR]   Concreto: V=${volumenConcreto_m3.toFixed(3)}m³, Peso=${pesoConcreto_kg.toFixed(2)}kg`);
    
    // ===== PASO 9: APLICAR FACTOR DE SEGURIDAD =====
    const factorSeg = configGrupo.factorSeguridad || 1.0;
    const pesoAceroLong_kg_final = pesoAceroLong_kg * factorSeg;
    const pesoEstribos_kg_final = pesoEstribos_kg * factorSeg;
    const pesoAlambre_kg_final = pesoAlambre_kg * factorSeg;
    
    // ===== PASO 10: CREAR OBJETO RESULTADO =====
    const resultado = {
      // DEADMAN - Dimensiones
      grupo_numero: grupo.numero_grupo,
      grupo_clave: grupo.clave,
      eje: grupo.eje,
        // ...existing code...
      muros_list: grupo.muros_list,
      largo_total: L,
      alto_total: H,
      espesor_bloque: B,  // Ancho calculado
      profundo: profundo,
      
      // Datos de cálculo del peso del muerto
      fuerzaBrace_kN: fuerzaBraceTotal_kN / 1000,
      pesoMuerto_kg: pesoMuerto_kg,
      volumenMuerto_m3: volumenMuerto_m3,
      friccion: friccion,
      anguloBrace: grupo.angulo,
      
      // ACERO LONGITUDINAL
      tipoVarillaLong: 4,
      nBarrasLong: nBarrasLong,
      longLongitudinal_m: longAceroLong_m,
      pesoLongitudinal_kg: pesoAceroLong_kg_final,
      
      // ACERO TRANSVERSAL
      tipoVarillaTrans: 3,
      nEstribos: n_estribos,
      longEstribos_m: longEstribos_m,
      pesoEstribos_kg: pesoEstribos_kg_final,
      
      // CONCRETO
      volumenConcreto_m3: volumenConcreto_m3,
      pesoConcreto_kg: pesoConcreto_kg,
      
      // ALAMBRE
      nNudos: n_nudos,
      longAlambre_m: longAlambre_m,
      pesoAlambre_kg: pesoAlambre_kg_final,
      
      // Totales
      pesoTotal_kg: pesoAceroLong_kg_final + pesoEstribos_kg_final + pesoAlambre_kg_final + pesoConcreto_kg,
      
      // Datos del grupo (referencia)
      cantidad_muros: grupo.cantidad_muros,
      x_braces: grupo.x_braces,
      angulo: grupo.angulo,
      cant_b14: grupo.cant_b14,
      cant_b12: grupo.cant_b12,
      cant_b04: grupo.cant_b04,
      cant_b15: grupo.cant_b15,
      
      // Para compatibilidad con tabla anterior
      factorSeguridad: factorSeg,
      espaciadoLong: configGrupo.espaciadoLong,
      espaciadoTrans: configGrupo.espaciadoTrans
    };
    
    console.log(`[MUERTO-RECTANGULAR] Resultado grupo ${indice + 1}:`, resultado);
    resultados.push(resultado);
  });
  
  console.log('[MUERTO-RECTANGULAR] calcularMacizosRectangulares - Total macizos calculados:', resultados.length);
  return resultados;
}

// ================== FUNCIÓN PARA GENERAR TABLA HTML ==================
/**
 * Genera tabla HTML con resultados de macizos rectangulares
 * 
 * @param {Array} resultados - Array retornado por calcularMacizosRectangulares()
 * @returns {String} HTML de la tabla
 */
export function generarTablaResultadosMacizos(resultados) {
  console.log('[MUERTO-RECTANGULAR] generarTablaResultadosMacizos - Inicio');
  
  if (!resultados || resultados.length === 0) {
    return '<p>No hay resultados para mostrar</p>';
  }

  // Calcular totales EXACTAMENTE según tu tabla
  let totalAceroLongLong = 0, totalAceroLongPeso = 0;
  let totalAceroTransLong = 0, totalAceroTransPeso = 0;
  let totalVoluConcreto = 0, totalPesoConcreto = 0;
  let totalAlambreLong = 0, totalAlambrePeso = 0;

  resultados.forEach(res => {
    // Acero Longitudinal
    totalAceroLongLong += res.longLongitudinal_m || 0;
    totalAceroLongPeso += res.pesoLongitudinal_kg || 0;
    
    // Acero Transversal
    totalAceroTransLong += res.longEstribos_m || 0;
    totalAceroTransPeso += res.pesoEstribos_kg || 0;
    
    // Concreto
    totalVoluConcreto += res.volumenConcreto_m3 || 0;
    totalPesoConcreto += res.pesoConcreto_kg || 0;
    
    // Alambre
    totalAlambreLong += res.longAlambre_m || 0;
    totalAlambrePeso += res.pesoAlambre_kg || 0;
  });

  // Generar HTML para tbody y tfoot
  let html = `<tbody>`;

  // Agregar filas de datos - DOS filas por grupo (longitudinal + transversal)
  resultados.forEach((res, idx) => {
    // Convertir peso concreto a toneladas
    const pesoConcreto_ton = (res.pesoConcreto_kg || 0) / 1000;
    
    // ===== FILA 1: ACERO LONGITUDINAL =====
    html += `
      <tr>
        <td rowspan="2">D${res.grupo_numero}</td>
        <td rowspan="2">${res.eje || 'N/A'}</td>
        <td rowspan="2">${res.muros_list || 'N/A'}</td>
        
        <!-- DEADMAN - Dimensiones -->
        <td rowspan="2">${res.largo_total?.toFixed(2) || '0.00'}</td>
        <td rowspan="2">${res.alto_total?.toFixed(2) || '0.00'}</td>
        <td rowspan="2">${res.espesor_bloque?.toFixed(2) || '0.00'}</td>
        
        <!-- ACERO - Longitud (fila 1: Longitudinal) -->
        <td>${res.tipoVarillaLong || '4'}</td>
        <td>${res.longLongitudinal_m?.toFixed(2) || '0.00'}</td>
        <td>${res.pesoLongitudinal_kg?.toFixed(2) || '0.00'}</td>
        <td>Long.</td>
        
        <!-- CONCRETO (rowspan=2) -->
        <td rowspan="2">${res.volumenConcreto_m3?.toFixed(3) || '0.000'}</td>
        <td rowspan="2">${pesoConcreto_ton.toFixed(2)}</td>
        
        <!-- ALAMBRE (rowspan=2) -->
        <td rowspan="2">${res.longAlambre_m?.toFixed(2) || '0.00'}</td>
        <td rowspan="2">${res.pesoAlambre_kg?.toFixed(2) || '0.00'}</td>
      </tr>
      
      <!-- FILA 2: ACERO TRANSVERSAL (ESTRIBOS) -->
      <tr>
        <!-- ACERO - Longitud (fila 2: Transversal/Estribos) -->
        <td>${res.tipoVarillaTrans || '3'}</td>
        <td>${res.longEstribos_m?.toFixed(2) || '0.00'}</td>
        <td>${res.pesoEstribos_kg?.toFixed(2) || '0.00'}</td>
        <td>Trans.</td>
      </tr>
    `;
  });

  // Footer con totales
  const totalPesoConcreto_ton = (totalPesoConcreto / 1000).toFixed(2);
  
  html += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6">TOTALES</td>
          <td colspan="2">-</td>
          <td>-</td>
          <td>-</td>
          <td>${totalVoluConcreto.toFixed(3)}</td>
          <td>${totalPesoConcreto_ton}</td>
          <td>${totalAlambreLong.toFixed(2)}</td>
          <td>${totalAlambrePeso.toFixed(2)}</td>
        </tr>
      </tfoot>
  `;

  return html;
}

// opcional para usar en el browser directo
if (typeof window !== 'undefined') {
  window.MuertoRectangular = {
    calcularConcreto,
    calcularLongitudinal,
    calcularTransversal,
    calcularAlambre,
    calcularReporteMuerto,
    prepararGruposParaMuertos,
    calcularMacizosRectangulares,
    generarTablaResultadosMacizos,
    PESO_ESPECIFICO_KG_M,
  };
  console.log('[MUERTO-RECTANGULAR] módulo cargado (rectangular, modo PDF)');
}