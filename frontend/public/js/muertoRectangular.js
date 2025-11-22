/**
 * CÁLCULOS DE ARMADO RECTANGULAR PARA MUERTOS - VERSIÓN FINAL (REDONDEO)
 * * AJUSTES VISUALES:
 * 1. Alambre Peso: Se muestra con 1 decimal (toFixed(1)) para que 0.38 pase a 0.4.
 * 2. Tabla General: Se aseguran los formatos solicitados (1 decimal aceros, 2 decimales volumen).
 */

// ================== CONSTANTES ==================

const PESO_ESPECIFICO_KG_M = {
  '#3': 0.560,
  '#4': 0.994,
  '#5': 1.552,
  '#6': 2.235,
  '#8': 3.973,
  '3': 0.560,
  '4': 0.994,
  '5': 1.552,
  '6': 2.235,
  '8': 3.973
};

const DENSIDAD_ACERO_KG_M3 = 7850;
const DENSIDAD_CONCRETO_KG_M3_DEFAULT = 2400;

const DEFAULTS = {
  RECUBRIMIENTO_CM: 4,
  SEP_LONG_CM: 25,
  SEP_TRANS_CM: 25,
  GANCHO_TOTAL_M: 0.00, 
  ALAMBRE_DIAM_MM: 1.22,
  ALAMBRE_VUELTA_CM: 15.2, // Calibrado para ~42m de longitud
  DESPERDICIO_ALAMBRE: 1.15,
  TIPO_VARILLA_LONG: '#4',
  TIPO_VARILLA_TRANS: '#3'
};

// ================== AUXILIARES ==================

function obtenerPesoEspecifico(tipoVarilla) {
  if (!tipoVarilla) return PESO_ESPECIFICO_KG_M['#4'];
  let key = String(tipoVarilla).split(' ')[0].trim();
  if (!key.startsWith('#') && !isNaN(key)) key = `#${parseFloat(key)}`;
  return PESO_ESPECIFICO_KG_M[key] ?? PESO_ESPECIFICO_KG_M['#4'];
}

function calcularDimensionConRedondeo(volumen, dim1, dim2) {
  if (!dim1 || !dim2) return 0;
  const valorBase = volumen / (dim1 * dim2);
  let dimension = Math.ceil(valorBase * 20) / 20;
  if (dimension < 0.5) dimension = 0.5;
  return dimension;
}

// ================== 1. CÁLCULO DE CONCRETO ==================

function calcularConcreto(dimensiones, densidad = 2400, factorDesperdicio = 1) {
  const { ancho, alto, profundidad, largo } = dimensiones;
  const L = largo !== undefined ? largo : profundidad; 
  const B = ancho;
  const H = alto; 

  const volumen_geom_m3 = L * B * H;
  const peso_estructural_kg = volumen_geom_m3 * densidad; 
  const volumen_compra_m3 = volumen_geom_m3 * factorDesperdicio;

  return { largo: L, ancho: B, alto: H, volumen_geom_m3, volumen_compra_m3, peso_estructural_kg };
}

// ================== 2. CÁLCULO DE ACEROS ==================

function calcularLongitudinal(dimensiones, config = {}) {
  const L = dimensiones.largo; 
  const B = dimensiones.ancho;      
  const H = dimensiones.alto;

  const r_m = (config.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM) / 100; 
  const sep_m = (config.separacion || DEFAULTS.SEP_LONG_CM) / 100; 
  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_LONG;
  const pesoVarilla_kgm = obtenerPesoEspecifico(tipoVarilla);

  let cantSup, cantInf;
  if (config.varillasSuperiores) {
    cantSup = parseInt(config.varillasSuperiores);
  } else {
    const anchoUtil = Math.max(B - 2 * r_m, 0);
    cantSup = Math.ceil(anchoUtil / sep_m) + 1; 
    if (cantSup < 2) cantSup = 2; 
  }

  if (config.varillasInferiores) {
    cantInf = parseInt(config.varillasInferiores);
  } else {
    cantInf = cantSup;
  }

  let cantMed;
  if (config.varillasMedias !== undefined && config.varillasMedias !== '') {
    cantMed = parseInt(config.varillasMedias);
  } else {
    if (H <= 0.60) cantMed = 0;
    else if (H <= 1.00) cantMed = 2;
    else cantMed = 4;
  }

  const totalBarras = cantSup + cantInf + cantMed;
  const largoTotal_m = totalBarras * L;
  const peso_kg = largoTotal_m * pesoVarilla_kgm;

  return { tipoVarillaStr: tipoVarilla, totalBarrasLong: totalBarras, largoTotal_m, peso_kg };
}

function calcularTransversal(dimensiones, config = {}) {
  const L = dimensiones.largo; 
  const B = dimensiones.ancho;      
  const H = dimensiones.alto;       

  const r_m = (config.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM) / 100;
  const sep_m = (config.separacion || DEFAULTS.SEP_TRANS_CM) / 100;
  
  // Ganchos forzados a 0 si es input erróneo o varilla #3 estándar
  let gancho_total_m = 0;
  const tipoStr = String(config.tipoVarilla || '');
  if (!tipoStr.includes('3')) {
      gancho_total_m = parseFloat(config.longitudGanchos) || 0;
  }

  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_TRANS;
  const pesoVarilla_kgm = obtenerPesoEspecifico(tipoVarilla);

  const largoUtil = Math.max(L - 2 * r_m, 0);
  const cantidad = Math.ceil(largoUtil / sep_m) + 1; 

  const nucleoAncho = Math.max(B - 2 * r_m, 0);
  const nucleoAlto = Math.max(H - 2 * r_m, 0);
  const longitudUno_m = (2 * nucleoAncho) + (2 * nucleoAlto) + gancho_total_m;

  const longitudTotal_m = longitudUno_m * cantidad;
  const peso_kg = longitudTotal_m * pesoVarilla_kgm;

  return { tipoVarillaStr: tipoVarilla, cantidad, longitudUno_m, longitudTotal_m, peso_kg };
}

function calcularAlambre(dimensiones, config = {}, longitudinal, transversal) {
  const diametro_m = (config.diametroAlambre || DEFAULTS.ALAMBRE_DIAM_MM) / 1000; 
  const longVuelta_m = (config.longitudPorVuelta || DEFAULTS.ALAMBRE_VUELTA_CM) / 100; 
  const factorDesp = parseFloat(config.factorDesperdicioAlambre || DEFAULTS.DESPERDICIO_ALAMBRE);

  const nudos = longitudinal.totalBarrasLong * transversal.cantidad;
  const longitudTotal_m = nudos * longVuelta_m * factorDesp;

  const radio = diametro_m / 2;
  const area_m2 = Math.PI * Math.pow(radio, 2);
  const volumen_m3 = area_m2 * longitudTotal_m; 
  const peso_kg = volumen_m3 * DENSIDAD_ACERO_KG_M3;

  return { nudos, longitudTotal_m, peso_kg };
}

// ================== 3. REPORTE MAESTRO ==================

function calcularReporteMuerto(dimensiones, inputsUI = {}) {
  const configConc = {
    densidadConcreto: inputsUI.construccion?.resistenciaConcreto,
    factorDesperdicio: inputsUI.construccion?.factorDesperdicio
  };
  const configLong = {
    tipoVarilla: inputsUI.longitudinal?.tipoVarilla,
    recubrimiento: inputsUI.longitudinal?.recubrimiento, 
    separacion: inputsUI.longitudinal?.separacion,       
    varillasSuperiores: inputsUI.longitudinal?.varillasSuperiores,
    varillasMedias: inputsUI.longitudinal?.varillasMedias,
    varillasInferiores: inputsUI.longitudinal?.varillasInferiores
  };
  const configTrans = {
    tipoVarilla: inputsUI.transversal?.tipoVarilla,
    recubrimiento: inputsUI.transversal?.recubrimiento, 
    separacion: inputsUI.transversal?.separacion,       
    longitudGanchos: inputsUI.transversal?.longitudGanchos 
  };
  const configAlambre = {
    diametroAlambre: inputsUI.alambre?.diametroAlambre,         
    longitudPorVuelta: inputsUI.alambre?.longitudPorVuelta,     
    factorDesperdicioAlambre: inputsUI.alambre?.factorDesperdicioAlambre
  };

  const concreto = calcularConcreto(dimensiones, configConc.densidadConcreto, configConc.factorDesperdicio);
  const longitudinal = calcularLongitudinal(concreto, configLong);
  const transversal = calcularTransversal(concreto, configTrans);
  const alambre = calcularAlambre(concreto, configAlambre, longitudinal, transversal);

  return {
    L: concreto.largo, B: concreto.ancho, H: concreto.alto,
    
    // Datos Clave Tabla
    tipoVarillaLong: longitudinal.tipoVarillaStr, 
    tipoVarillaTrans: transversal.tipoVarillaStr,
    
    volumenConcreto_m3: concreto.volumen_geom_m3,
    pesoConcreto_kg: concreto.peso_estructural_kg,
    
    longLongitudinal_m: longitudinal.largoTotal_m,
    pesoLongitudinal_kg: longitudinal.peso_kg,
    
    longEstribos_m: transversal.longitudTotal_m,
    pesoEstribos_kg: transversal.peso_kg,
    
    longAlambre_m: alambre.longitudTotal_m,
    pesoAlambre_kg: alambre.peso_kg,
    
    pesoTotalArmado_kg: longitudinal.peso_kg + transversal.peso_kg + alambre.peso_kg
  };
}

// ================== 4. PREPARACIÓN GRUPOS ==================

export function prepararGruposParaMuertos(gruposMuertos) {
  const gruposPreparados = [];
  Object.keys(gruposMuertos).forEach((clave, indice) => {
    const grupo = gruposMuertos[clave];
    let largoTotal = 0;
    let murosIds = [];
    grupo.muros.forEach(muro => {
      let muroObj = muro;
      if (typeof muro === 'string' && window.lastResultadosMuertos) {
        muroObj = window.lastResultadosMuertos.find(m => m.id_muro === muro || m.id === muro);
      }
      if (muroObj && typeof muroObj === 'object') {
        largoTotal += parseFloat(muroObj.overall_width) || 0;
        murosIds.push(muroObj.id_muro || muroObj.id);
      }
    });

    const configGrupoManual = window.configGruposMuertos?.[clave] || {};
    const configGrupo = grupo.configGrupo || configGrupoManual || {};
    const profundo = configGrupo.profundo || configGrupo.profundidad || 0.5; 
    
    let sumaFBy = 0;
    grupo.muros.forEach(muro => {
        let muroObj = muro;
        if (typeof muro === 'string' && window.lastResultadosMuertos) {
          muroObj = window.lastResultadosMuertos.find(m => m.id_muro === muro || m.id === muro);
        }
        sumaFBy += parseFloat(muroObj?.fby) || parseFloat(muroObj?.FBy) || 0;
    });

    const volumenRequerido = sumaFBy / DENSIDAD_CONCRETO_KG_M3_DEFAULT;
    let anchoCalculado = 0;
    if (largoTotal > 0 && profundo > 0) {
      anchoCalculado = calcularDimensionConRedondeo(volumenRequerido, largoTotal, profundo);
    }

    gruposPreparados.push({
      clave, numero_grupo: indice + 1, largo_total: largoTotal, alto_total: profundo,    
      espesor_bloque: anchoCalculado, eje: grupo.eje || '', muros_list: murosIds.join(', '),
      sumaFBy, configGrupo: { ...configGrupo, profundo }
    });
  });
  return gruposPreparados;
}

// ================== 5. FUNCIÓN PRINCIPAL ==================

export function calcularMacizosRectangulares(gruposPreparados, configUI = {}) {
  const configDefault = {
    tipoVarillaLong: '#4', tipoVarillaTrans: '#3',
    densidadConcreto: 2400, recubrimientoLongitudinal: 4, recubrimientoTransversal: 4,
    ...configUI
  };

  const resultados = [];
  gruposPreparados.forEach((grupo) => {
    const dimensiones = {
      ancho: grupo.espesor_bloque || 0.6,
      alto: grupo.alto_total || 0.5,
      largo: grupo.largo_total || 1.0
    };
    const configGrupo = {
      ...configDefault, ...(grupo.configGrupo || {}),
      densidadConcreto: grupo.densidadConcreto || configDefault.densidadConcreto
    };

    const reporte = calcularReporteMuerto(dimensiones, configGrupo);
    const pesoReportar_kg = (grupo.sumaFBy && grupo.sumaFBy > 0) ? grupo.sumaFBy : reporte.pesoConcreto_kg;

    resultados.push({
      grupo_numero: grupo.numero_grupo, grupo_clave: grupo.clave, eje: grupo.eje, muros_list: grupo.muros_list,
      largo_total: reporte.L, alto_total: reporte.H, espesor_bloque: reporte.B,
      fuerzaBrace_kN: (grupo.sumaFBy || 0) / 1000,
      
      // Aceros
      tipoVarillaLong: reporte.tipoVarillaLong,
      longLongitudinal_m: reporte.longLongitudinal_m,
      pesoLongitudinal_kg: reporte.pesoLongitudinal_kg,
      tipoVarillaTrans: reporte.tipoVarillaTrans,
      longEstribos_m: reporte.longEstribos_m,
      pesoEstribos_kg: reporte.pesoEstribos_kg,

      // Concreto
      volumenConcreto_m3: reporte.volumenConcreto_m3, 
      pesoConcreto_kg: pesoReportar_kg,       
      valor_LBH: reporte.volumenConcreto_m3, 

      // Alambre
      longAlambre_m: reporte.longAlambre_m,
      pesoAlambre_kg: reporte.pesoAlambre_kg,
      pesoTotal_kg: pesoReportar_kg + reporte.pesoTotalArmado_kg
    });
  });
  return resultados;
}

// ================== 6. GENERADOR DE TABLA HTML ==================

export function generarTablaResultadosMacizos(resultados) {
  if (!resultados || resultados.length === 0) return '<p class="text-center p-4">No hay resultados calculados.</p>';

  let tVol = 0, tPesoConc = 0;
  let tPesoLong = 0, tPesoTrans = 0; 
  let tAlambreL = 0, tAlambreP = 0;

  const cleanVarilla = (v) => (v || '').split(' ')[0]; 

  let html = `<tbody>`;
  
  resultados.forEach((res) => {
    tVol += res.volumenConcreto_m3 || 0;
    tPesoConc += res.pesoConcreto_kg || 0;
    tPesoLong += res.pesoLongitudinal_kg || 0;
    tPesoTrans += res.pesoEstribos_kg || 0;
    tAlambreL += res.longAlambre_m || 0;
    tAlambreP += res.pesoAlambre_kg || 0;

    const pesoTon = (res.pesoConcreto_kg || 0) / 1000;

    html += `
      <tr>
        <td rowspan="2" class="align-middle text-center"><strong>G${res.grupo_numero}</strong></td>
        <td rowspan="2" class="align-middle">${res.eje || '-'}</td>
        <td rowspan="2" class="align-middle"><small>${res.muros_list || '-'}</small></td>
        
        <td rowspan="2" class="align-middle text-center">${res.largo_total?.toFixed(2)}</td>
        <td rowspan="2" class="align-middle text-center">${res.alto_total?.toFixed(2)}</td>
        <td rowspan="2" class="align-middle text-center" style="font-weight:bold; color:#0d6efd;">${res.espesor_bloque?.toFixed(2)}</td>
        
        <td class="text-center">${cleanVarilla(res.tipoVarillaLong)}</td>
        <td class="text-end">${res.longLongitudinal_m?.toFixed(1)}</td>
        <td class="text-end">${res.pesoLongitudinal_kg?.toFixed(1)}</td>
        <td class="text-muted"><small>Long.</small></td>
        
        <td rowspan="2" class="align-middle text-end">${res.volumenConcreto_m3?.toFixed(2)}</td>
        <td rowspan="2" class="align-middle text-end fw-bold">${pesoTon.toFixed(1)}</td>
        
        <td rowspan="2" class="align-middle text-end">${res.longAlambre_m?.toFixed(1)}</td>
        <td rowspan="2" class="align-middle text-end">${res.pesoAlambre_kg?.toFixed(1)}</td>
      </tr>
      <tr>
        <td class="text-center">${cleanVarilla(res.tipoVarillaTrans)}</td>
        <td class="text-end">${res.longEstribos_m?.toFixed(1)}</td>
        <td class="text-end">${res.pesoEstribos_kg?.toFixed(1)}</td>
        <td class="text-muted"><small>Estribo</small></td>
      </tr>
    `;
  });

  html += `</tbody>
  <tfoot class="table-light" style="border-top: 2px solid #333;">
    <tr class="fw-bold">
      <td colspan="6" class="text-end">TOTALES PROYECTO:</td>
      
      <td colspan="2" class="text-end"><small>Acero Total:</small></td>
      <td class="text-end">${(tPesoLong + tPesoTrans).toFixed(1)} kg</td>
      <td></td>
      
      <td class="text-end">${tVol.toFixed(2)} m³</td>
      <td class="text-end">${(tPesoConc/1000).toFixed(1)} Ton</td>
      <td class="text-end">${tAlambreL.toFixed(1)} m</td>
      <td class="text-end">${tAlambreP.toFixed(1)} kg</td>
    </tr>
  </tfoot>`;

  return html;
}

if (typeof window !== 'undefined') {
  window.MuertoRectangular = {
    prepararGruposParaMuertos,
    calcularMacizosRectangulares,
    generarTablaResultadosMacizos,
    calcularReporteMuerto 
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