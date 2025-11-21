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
 * - Longitudes en m
 * - Pesos en kg
 */

// ================== CONSTANTES ==================

const PESO_ESPECIFICO_KG_M = {
  '#3': 0.560,
  '#4': 0.994,
  '#5': 1.552,
  '#6': 2.235,
};

const DENSIDAD_ACERO_KG_M3 = 7850;
const DENSIDAD_CONCRETO_KG_M3_DEFAULT = 2400;

const RECUBRIMIENTO_DEFAULT_M = 0.04;           // 4 cm
const ESPACIAMIENTO_ESTRIBO_DEFAULT_M = 0.25;   // 25 cm
const LONG_GANCHO_ESTRIBO_DEFAULT_M = 0.7;      // 0.7 m
const LONG_AMARRE_DEFAULT_M = 0.35;             // 35 cm
const DIAMETRO_ALAMBRE_DEFAULT_M = 0.00122;     // 1.22 mm

// ================== AUXILIARES ==================

function obtenerPesoEspecifico(tipoVarilla = 4) {
  const key = String(tipoVarilla).startsWith('#') ? String(tipoVarilla) : `#${tipoVarilla}`;
  return PESO_ESPECIFICO_KG_M[key] ?? PESO_ESPECIFICO_KG_M['#4'];
}

function calcularDimensionConRedondeo(volumen, dim1, dim2) {
  // Evitar división por cero
  if (!dim1 || !dim2 || dim1 === 0 || dim2 === 0) return 0;

  // Cálculo base: Volumen / (Largo * Alto)
  const valorBase = volumen / (dim1 * dim2);

  // Aplicar redondeo hacia arriba al 0.05 más cercano
  // Ejemplo: 0.41 -> 0.45, 0.46 -> 0.50
  let dimension = Math.ceil(valorBase * 20) / 20;

  // Aplicar restricción mínima del Excel (0.4m)
  if (dimension < 0.4) {
    dimension = 0.4;
  }

  return dimension;
}

// ================== CONCRETO ==================

function calcularConcreto(dimensiones, densidad = DENSIDAD_CONCRETO_KG_M3_DEFAULT, factorDesperdicio = 1) {
  const { ancho, alto, profundidad } = dimensiones;
  const volumen_m3 = ancho * alto * profundidad;
  const peso_kg = volumen_m3 * densidad * factorDesperdicio;

  return {
    volumen_m3,
    peso_kg,
  };
}

// ====== LONGITUDINAL IGUAL AL EXCEL ======
function calcularLongitudinal(dimensiones, config = {}) {
  const L = dimensiones.profundidad; // Nota: En tu lógica, 'profundidad' es el largo horizontal del muerto
  const b = dimensiones.ancho;       // ancho (espesor) del muerto

  const r = config.recubrimientoLongitudinal !== undefined ? config.recubrimientoLongitudinal / 100 : RECUBRIMIENTO_DEFAULT_M;
  const sepSup_m = config.separacionLongitudinal !== undefined ? config.separacionLongitudinal / 100 : 0.25;
  const pesoVarillaLong_kgm = obtenerPesoEspecifico(config.tipoVarillaLongitudinal || 4);

  const anchoUtil_m = Math.max(b - 2 * r, 0);
  const cantSup = Math.max(3, Math.round(anchoUtil_m / sepSup_m + 1));

  const cantMed = config.cantVarillasMedias ?? 2;
  const cantInf = config.cantVarillasInferior ?? 2;

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
    totalBarrasLong: cantSup + cantMed + cantInf,
  };
}

// ====== TRANSVERSAL (ESTRIBOS) IGUAL AL EXCEL ======
function calcularTransversal(dimensiones, config = {}) {
  const L = dimensiones.profundidad; // Largo del muerto
  const b = dimensiones.ancho;       // Ancho del muerto
  const h = dimensiones.alto;        // Alto (profundidad enterrada)

  const r = config.recubrimientoTransversal !== undefined ? config.recubrimientoTransversal / 100 : RECUBRIMIENTO_DEFAULT_M;
  const espaciamiento_m = config.separacionTransversal !== undefined ? config.separacionTransversal / 100 : ESPACIAMIENTO_ESTRIBO_DEFAULT_M;
  const pesoVarillaEstribo_kgm = obtenerPesoEspecifico(config.tipoVarillaTransversal || 3);
  const gancho = config.longGanchoEstribo !== undefined ? config.longGanchoEstribo : LONG_GANCHO_ESTRIBO_DEFAULT_M;

  // Largo útil
  const largoUtil_m = Math.max(L - 2 * r, 0);
  const cantidad = Math.ceil(largoUtil_m / espaciamiento_m) + 1;
  const espaciamientoReal_m = cantidad > 0 ? (largoUtil_m / cantidad) : 0;

  // Longitud de un estribo (Perímetro + Ganchos)
  // Fórmula geométrica: 2*(ancho - 2r) + 2*(alto - 2r) + 2*gancho
  const dimAncho = Math.max(b - 2 * r, 0);
  const dimAlto = Math.max(h - 2 * r, 0);
  const longitudEstribo_m = (2 * dimAncho) + (2 * dimAlto) + (2 * gancho);

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

// ====== ALAMBRE ======
function calcularAlambre(dimensiones, config = {}, longitudinal, transversal) {
  const longAmarre_m = config.longitudVuelta !== undefined ? config.longitudVuelta / 100 : LONG_AMARRE_DEFAULT_M;
  const diametro_m = config.diametroAlambre !== undefined ? config.diametroAlambre / 1000 : DIAMETRO_ALAMBRE_DEFAULT_M;

  const nodos = transversal.cantidad * longitudinal.totalBarrasLong;
  const longitudTotal_m = nodos * longAmarre_m * (config.factorDesperdicioAlambre ?? 1);

  const radio = diametro_m / 2;
  const area = Math.PI * Math.pow(radio, 2);
  const peso_kg = DENSIDAD_ACERO_KG_M3 * area * longitudTotal_m;

  return {
    nodos,
    longitudTotal_m,
    peso_kg,
  };
}

// ================== FUNCIÓN PRINCIPAL REPORTE ==================
function calcularReporteMuerto(dimensiones, config = {}) {
  const concreto = calcularConcreto(dimensiones, config.densidadConcreto ?? DENSIDAD_CONCRETO_KG_M3_DEFAULT, config.factorDesperdicio ?? 1);
  const longitudinal = calcularLongitudinal(dimensiones, config);
  const transversal = calcularTransversal(dimensiones, config);
  const alambre = calcularAlambre(dimensiones, config, longitudinal, transversal);

  const factorLongitudinal = config.repLong ?? 1;
  const factorTransversal = config.repTrans ?? 1; 
  const factorVolumen = config.repVol ?? 1;
  const factorAlambre = config.repAlambre ?? factorTransversal;

  return {
    ancho: dimensiones.ancho,
    alto: dimensiones.alto,
    largo: dimensiones.profundidad,
    profundidad: dimensiones.profundidad,

    volumenConcreto_m3: concreto.volumen_m3 * factorVolumen,
    pesoConcreto_kg: concreto.peso_kg * factorVolumen,
    longLongitudinal_m: longitudinal.largoTotal_m * factorLongitudinal,
    pesoLongitudinal_kg: longitudinal.peso_kg * factorLongitudinal,
    longEstribos_m: transversal.longitudTotal_m * factorTransversal,
    pesoEstribos_kg: transversal.peso_kg * factorTransversal,
    longAlambre_m: alambre.longitudTotal_m * factorAlambre,
    pesoAlambre_kg: alambre.peso_kg * factorAlambre,
    
    // Totales
    pesoTotal_kg: (concreto.peso_kg * factorVolumen) + 
                  (longitudinal.peso_kg * factorLongitudinal) + 
                  (transversal.peso_kg * factorTransversal) + 
                  (alambre.peso_kg * factorAlambre),
    
    tipoVarillaLong: config.tipoVarillaLongitudinal || 4,
    tipoVarillaTrans: config.tipoVarillaTransversal || 3,
    
    // Alias para compatibilidad con tabla
    volumenConcreto: concreto.volumen_m3 * factorVolumen,
    pesoConcreto: concreto.peso_kg * factorVolumen,
    longitudTotalLongitudinal: longitudinal.largoTotal_m * factorLongitudinal,
    pesoLongitudinal: longitudinal.peso_kg * factorLongitudinal,
    cantEstribos: transversal.cantidad,
    longitudTotalTransversal: transversal.longitudTotal_m * factorTransversal,
    pesoTransversal: transversal.peso_kg * factorTransversal,
    nodos: alambre.nodos,
    longitudAlambre: alambre.longitudTotal_m * factorAlambre,
    pesoAlambre: alambre.peso_kg * factorAlambre,
    pesoTotal: (concreto.peso_kg * factorVolumen) + (longitudinal.peso_kg * factorLongitudinal) + (transversal.peso_kg * factorTransversal) + (alambre.peso_kg * factorAlambre)
  };
}

export {
  calcularConcreto,
  calcularLongitudinal,
  calcularTransversal,
  calcularAlambre,
  calcularReporteMuerto,
  PESO_ESPECIFICO_KG_M,
};

// ================== FUNCIÓN DE AGRUPACIÓN Y SUMA ==================
export function prepararGruposParaMuertos(gruposMuertos) {
  console.log('[MUERTO-RECTANGULAR] prepararGruposParaMuertos - Inicio');
  const gruposPreparados = [];
  
  Object.keys(gruposMuertos).forEach((clave, indice) => {
    const grupo = gruposMuertos[clave];

    // Calcular largo como suma de overall_width de los muros
    let largoTotal = 0;
    let murosIds = [];
    grupo.muros.forEach(muro => {
      let muroObj = muro;
      let muroId = typeof muro === 'object' ? (muro.id_muro || muro.id) : muro;
      if (typeof muro === 'string' && window.lastResultadosMuertos) {
        muroObj = window.lastResultadosMuertos.find(m => m.id_muro === muro || m.id === muro);
      }
      if (muroObj && typeof muroObj === 'object') {
        // Usar overall_width como largo
        let largo = parseFloat(muroObj.overall_width);
        largoTotal += largo || 0;
        murosIds.push(muroId);
      }
    });

    if (largoTotal > 0) {
      largoTotal = Math.round(largoTotal * 100) / 100; // Redondear a 2 decimales
    }

    // Calcular alto (profundidad) desde configuración manual por grupo
    const configGrupoManual = window.configGruposMuertos?.[clave] || {};
    const configGrupo = grupo.configGrupo || configGrupoManual || {};
    const profundo = configGrupo.profundo || configGrupo.profundidad || configGrupoManual.profundidad || 0.2;

    const densidadConcreto = DENSIDAD_CONCRETO_KG_M3_DEFAULT;

    // Sumar FBy (soporte para minúsculas de BD)
    let sumaFBy = 0;
    grupo.muros.forEach(muro => {
      let muroObj = muro;
      if (typeof muro === 'string' && window.lastResultadosMuertos) {
        muroObj = window.lastResultadosMuertos.find(m => m.id_muro === muro || m.id === muro);
      }
      sumaFBy += parseFloat(muroObj?.fby) || parseFloat(muroObj?.FBy) || 0;
    });

    // Cálculo de Volumen y Ancho
    const volumenMuerto = sumaFBy / densidadConcreto;
    let anchoMuerto = 0;
    if (largoTotal > 0 && profundo > 0) {
      anchoMuerto = volumenMuerto / (largoTotal * profundo);
      anchoMuerto = calcularDimensionConRedondeo(volumenMuerto, largoTotal, profundo);
    }

    const grupoPreparado = {
      clave: clave,
      numero_grupo: indice + 1,
      largo_total: largoTotal,
      alto_total: profundo, // Profundidad manual por grupo
      espesor_bloque: anchoMuerto,
      x_braces: grupo.x_braces || 0,
      angulo: grupo.angulo || 0,
      eje: grupo.eje || '',
      cantidad_muros: grupo.muros.length,
      muros_list: murosIds.join(', '),
      muros: grupo.muros,
      configGrupo: {
        ...configGrupo,
        profundo: profundo,
      },
      sumaFBy,
      densidadConcreto: densidadConcreto,
      volumenMuerto,
      anchoMuerto,
    };
    gruposPreparados.push(grupoPreparado);
  });
  
  return gruposPreparados;
}

// ================== FUNCIÓN DE CÁLCULO DE MACIZOS RECTANGULARES ==================
export function calcularMacizosRectangulares(gruposPreparados, config = {}) {
  console.log('[MUERTO-RECTANGULAR] calcularMacizosRectangulares - Inicio');
  
  const configDefault = {
    tipoVarillaLong: 4,
    tipoVarillaTrans: 3,
    espaciamientoEstribo: 0.25,
    densidadConcreto: 2400,
    ...config
  };
  
  const resultados = [];
  
  gruposPreparados.forEach((grupo, indice) => {
    // 1. Obtener configuración
    const configGrupo = grupo.configGrupo || {
      profundo: 0.2,
      espaciadoLong: 25,
      espaciadoTrans: 25,
      factorSeguridad: 1.0,
      friccion: 0.3
    };
    
    // 2. Log seguro (variable ya definida)
    console.log(`[MUERTO-RECTANGULAR] Grupo ${indice + 1} Config:`, configGrupo);
    
    // 3. Datos consolidados (Precalculados en paso anterior)
    const L = grupo.largo_total; 
    const H = grupo.alto_total;  // Profundidad/Alto
    const B = grupo.anchoMuerto || 0;
    const profundo = H; // Alias para claridad
    const volumenMuerto_m3 = grupo.volumenMuerto;
    const densidadConcreto = grupo.densidadConcreto || configDefault.densidadConcreto;

    console.log(`[MUERTO-RECTANGULAR] Dimensiones: L=${L}m, H=${H}m, B=${B}m`);

    // 4. Calcular Acero Longitudinal
    const longAceroLong_m = (L / 1.50) * 12;
    const pesoAceroLong_kg = (L / 1.50) * 11.9;
    const nBarrasLong = 8; 
    
    // 5. Calcular Estribos (Transversal) - FÓRMULA GEOMÉTRICA
    const REC = 0.04;
    const SEP_m = (configGrupo.espaciadoTrans || 25) / 100;
    const GANCHO = 0.7;
    
    const n_estribos = Math.ceil((L - 2 * REC) / SEP_m) + 1;
    
    // Perímetro del estribo: 2*(ancho-2r) + 2*(alto-2r) + ganchos
    const L_estribo = 2 * Math.max(B - 2 * REC, 0) + 2 * Math.max(H - 2 * REC, 0) + 2 * GANCHO;
    const longEstribos_m = n_estribos * L_estribo;
    const pesoEstribos_kg = longEstribos_m * 0.560; // #3
    
    // 6. Calcular Alambre
    const LONG_NUDO = 0.35;
    const DIAM_ALAMBRE = 0.00122;
    const n_nudos = nBarrasLong * n_estribos;
    const longAlambre_m = n_nudos * LONG_NUDO;
    
    const radio_alambre = DIAM_ALAMBRE / 2;
    const area_alambre = Math.PI * Math.pow(radio_alambre, 2);
    const pesoAlambre_kg = longAlambre_m * area_alambre * DENSIDAD_ACERO_KG_M3;
    
    // 7. Peso Concreto
    const pesoConcreto_kg = volumenMuerto_m3 * densidadConcreto;
    
    // 8. Factor Seguridad
    const factorSeg = configGrupo.factorSeguridad || 1.0;

    // 9. Construir Resultado
    const resultado = {
      grupo_numero: grupo.numero_grupo,
      grupo_clave: grupo.clave,
      eje: grupo.eje,
      muros_list: grupo.muros_list,
      
      // Dimensiones
      largo_total: L,
      alto_total: H,
      espesor_bloque: B,
      profundo: profundo,
      
      // Datos Viento
      fuerzaBrace_kN: grupo.sumaFBy / 1000, // Referencial
      
      // Materiales
      tipoVarillaLong: 4,
      nBarrasLong,
      longLongitudinal_m: longAceroLong_m,
      pesoLongitudinal_kg: pesoAceroLong_kg * factorSeg,
      
      tipoVarillaTrans: 3,
      nEstribos: n_estribos,
      longEstribos_m: longEstribos_m,
      pesoEstribos_kg: pesoEstribos_kg * factorSeg,
      
      volumenConcreto_m3: volumenMuerto_m3,
      pesoConcreto_kg: pesoConcreto_kg,
      
      longAlambre_m: longAlambre_m,
      pesoAlambre_kg: pesoAlambre_kg * factorSeg,
      
      pesoTotal_kg: (pesoAceroLong_kg + pesoEstribos_kg + pesoAlambre_kg) * factorSeg + pesoConcreto_kg
    };
    
    resultados.push(resultado);
  });
  
  return resultados;
}

// ================== GENERADOR DE TABLA HTML ==================
export function generarTablaResultadosMacizos(resultados) {
  if (!resultados || resultados.length === 0) return '<p>No hay resultados.</p>';

  let tVol = 0, tPesoConc = 0, tAlambreL = 0, tAlambreP = 0;

  let html = `<tbody>`;
  
  resultados.forEach((res, idx) => {
    tVol += res.volumenConcreto_m3 || 0;
    tPesoConc += res.pesoConcreto_kg || 0;
    tAlambreL += res.longAlambre_m || 0;
    tAlambreP += res.pesoAlambre_kg || 0;

    const pesoTon = (res.pesoConcreto_kg || 0) / 1000;

    html += `
      <tr>
        <td rowspan="2">D${res.grupo_numero}</td>
        <td rowspan="2">${res.eje || '-'}</td>
        <td rowspan="2">${res.muros_list || '-'}</td>
        
        <td rowspan="2">${res.largo_total?.toFixed(2)}</td>
        <td rowspan="2">${res.alto_total?.toFixed(2)}</td>
        <td rowspan="2" style="font-weight:bold; color:#007bff;">${res.espesor_bloque?.toFixed(2)}</td>
        
        <td>4</td>
        <td>${res.longLongitudinal_m?.toFixed(2)}</td>
        <td>${res.pesoLongitudinal_kg?.toFixed(2)}</td>
        <td>Long.</td>
        
        <td rowspan="2">${res.volumenConcreto_m3?.toFixed(3)}</td>
        <td rowspan="2">${pesoTon.toFixed(2)}</td>
        
        <td rowspan="2">${res.longAlambre_m?.toFixed(2)}</td>
        <td rowspan="2">${res.pesoAlambre_kg?.toFixed(2)}</td>
      </tr>
      <tr>
        <td>3</td>
        <td>${res.longEstribos_m?.toFixed(2)}</td>
        <td>${res.pesoEstribos_kg?.toFixed(2)}</td>
        <td>Trans.</td>
      </tr>
    `;
  });

  html += `</tbody><tfoot>
    <tr>
      <td colspan="6">TOTALES</td>
      <td colspan="2">-</td>
      <td>-</td>
      <td>-</td>
      <td>${tVol.toFixed(3)}</td>
      <td>${(tPesoConc/1000).toFixed(2)}</td>
      <td>${tAlambreL.toFixed(2)}</td>
      <td>${tAlambreP.toFixed(2)}</td>
    </tr>
  </tfoot>`;

  return html;
}

if (typeof window !== 'undefined') {
  window.MuertoRectangular = {
    prepararGruposParaMuertos,
    calcularMacizosRectangulares,
    generarTablaResultadosMacizos
  };
}