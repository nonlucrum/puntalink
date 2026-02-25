/**
 * CÁLCULOS DE ARMADO TRIANGULAR (PRISMA) - VERSIÓN ALINEADA CON RECTANGULAR
 */

// ================== CONSTANTES ==================

const PESO_ESPECIFICO_KG_M = {
  '#3': 0.560, '#4': 0.994, '#5': 1.552, '#6': 2.235, '#8': 3.973,
  '3': 0.560, '4': 0.994, '5': 1.552, '6': 2.235, '8': 3.973
};

const DENSIDAD_ACERO_KG_M3 = 7850;
const DENSIDAD_CONCRETO_KG_M3_DEFAULT = 2400;

const DEFAULTS = {
  RECUBRIMIENTO_CM: 4,
  SEP_LONG_CM: 25,
  SEP_TRANS_CM: 25,
  GANCHO_TOTAL_M: 0.00,
  ALAMBRE_DIAM_MM: 1.22,
  ALAMBRE_VUELTA_CM: 15.2,
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

// ================== 1. CÁLCULO DE CONCRETO ==================

function calcularConcreto(dimensiones, densidad = 2400, factorDesperdicio = 1) {
  const B = dimensiones.base;
  const H = dimensiones.alto;
  const L = dimensiones.largo;
  
  const area = (B * H) / 2; // Área triangular
  const volumen_geom_m3 = area * L;
  const peso_estructural_kg = volumen_geom_m3 * densidad;
  const volumen_compra_m3 = volumen_geom_m3 * factorDesperdicio;

  return { base: B, alto: H, largo: L, volumen_geom_m3, volumen_compra_m3, peso_estructural_kg };
}

// ================== 2. CÁLCULO DE ACEROS ==================

function calcularLongitudinal(dimensiones, config = {}) {
  const L = dimensiones.largo;
  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_LONG;
  const pesoVarilla_kgm = obtenerPesoEspecifico(tipoVarilla);
  
  // Para triangular se especifica cantidad directa de varillas
  const cant = config.cantidadVarillas || 3;
  
  const total_m = L * cant;
  const peso_kg = total_m * pesoVarilla_kgm;

  return { tipoVarillaStr: tipoVarilla, totalBarrasLong: cant, largoTotal_m: total_m, peso_kg };
}

function calcularTransversal(dimensiones, config = {}) {
  const B = dimensiones.base;
  const H = dimensiones.alto;
  const L = dimensiones.largo;
  
  const r_m = (config.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM) / 100;
  const sep_m = (config.separacion || DEFAULTS.SEP_TRANS_CM) / 100;
  
  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_TRANS;
  const pesoVarilla_kgm = obtenerPesoEspecifico(tipoVarilla);
  const tipoStr = String(tipoVarilla);

  // --- CORRECCIÓN BLINDADA (igual que rectangular) ---
  let ajuste_curvatura_m = 0;
  if (tipoStr.includes('3') || pesoVarilla_kgm === 0.560) {
    ajuste_curvatura_m = -0.02;
  } else {
    ajuste_curvatura_m = parseFloat(config.longitudGanchos) || 0;
  }

  // Núcleo de concreto (restando recubrimiento)
  const baseNuc = Math.max(B - (2 * r_m), 0.10);
  const altoNuc = Math.max(H - (2 * r_m), 0.10);
  
  // Perímetro triangular: base + 2 lados inclinados
  const ladoInclinado = Math.sqrt(Math.pow(baseNuc / 2, 2) + Math.pow(altoNuc, 2));
  const longitudUno_m = baseNuc + (2 * ladoInclinado) + ajuste_curvatura_m;

  const largoUtil = Math.max(L - (2 * r_m), 0);
  const cantidad = Math.ceil(largoUtil / sep_m) + 1;
  
  const longitudTotal_m = longitudUno_m * cantidad;
  const peso_kg = longitudTotal_m * pesoVarilla_kgm;

  const espaciadoRealTrans_m = cantidad > 1 ? largoUtil / (cantidad - 1) : 0;

  return { tipoVarillaStr: tipoVarilla, cantidad, longitudUno_m, longitudTotal_m, peso_kg, espaciadoRealTrans_cm: espaciadoRealTrans_m * 100 };
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
    densidadConcreto: inputsUI.construccion?.resistenciaConcreto || DENSIDAD_CONCRETO_KG_M3_DEFAULT,
    factorDesperdicio: inputsUI.construccion?.factorDesperdicio || 1
  };
  const configLong = {
    tipoVarilla: inputsUI.longitudinal?.tipoVarilla || DEFAULTS.TIPO_VARILLA_LONG,
    cantidadVarillas: inputsUI.triangular?.cantVarillas || 3
  };
  const configTrans = {
    tipoVarilla: inputsUI.transversal?.tipoVarilla || DEFAULTS.TIPO_VARILLA_TRANS,
    recubrimiento: inputsUI.transversal?.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM,
    separacion: inputsUI.transversal?.separacion || DEFAULTS.SEP_TRANS_CM,
    longitudGanchos: inputsUI.transversal?.longitudGanchos || DEFAULTS.GANCHO_TOTAL_M
  };
  const configAlambre = {
    diametroAlambre: inputsUI.alambre?.diametroAlambre || DEFAULTS.ALAMBRE_DIAM_MM,
    longitudPorVuelta: inputsUI.alambre?.longitudPorVuelta || DEFAULTS.ALAMBRE_VUELTA_CM,
    factorDesperdicioAlambre: inputsUI.alambre?.factorDesperdicioAlambre || DEFAULTS.DESPERDICIO_ALAMBRE
  };

  const concreto = calcularConcreto(dimensiones, configConc.densidadConcreto, configConc.factorDesperdicio);
  const longitudinal = calcularLongitudinal(concreto, configLong);
  const transversal = calcularTransversal(concreto, configTrans);
  const alambre = calcularAlambre(concreto, configAlambre, longitudinal, transversal);

  return {
    L: concreto.largo,
    B: concreto.base,
    H: concreto.alto,
    
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
    pesoTotalArmado_kg: longitudinal.peso_kg + transversal.peso_kg + alambre.peso_kg,

    cantBarrasLong: longitudinal.totalBarrasLong,
    cantEstribos: transversal.cantidad,
    espaciadoLong_cm: 0,
    espaciadoTrans_cm: transversal.espaciadoRealTrans_cm || 0
  };
}

// ================== 4. FUNCIÓN PRINCIPAL ==================

export function calcularMacizosTriangulares(grupos, inputsUI) {
  const resultados = [];

  grupos.forEach(grupo => {
    const dimensiones = {
      base: inputsUI.triangular?.base || 0.6,
      alto: grupo.alto_total || 1.0,
      largo: grupo.largo_total || 1.0
    };

    const reporte = calcularReporteMuerto(dimensiones, inputsUI);

    resultados.push({
      grupo_numero: grupo.numero_grupo,
      eje: grupo.eje,
      muros_list: grupo.muros_list,
      base: reporte.B,
      alto: reporte.H,
      largo: reporte.L,
      
      volumen_m3: reporte.volumenConcreto_m3,
      peso_conc: reporte.pesoConcreto_kg,
      
      tipoVarillaLong: reporte.tipoVarillaLong,
      longLongitudinal_m: reporte.longLongitudinal_m,
      pesoLongitudinal_kg: reporte.pesoLongitudinal_kg,
      
      tipoVarillaTrans: reporte.tipoVarillaTrans,
      longEstribos_m: reporte.longEstribos_m,
      pesoEstribos_kg: reporte.pesoEstribos_kg,
      
      pesoAlambre_kg: reporte.pesoAlambre_kg,
      longAlambre_m: reporte.longAlambre_m,
      peso_acero_total: reporte.pesoTotalArmado_kg,

      cantBarrasLong: reporte.cantBarrasLong,
      cantEstribos: reporte.cantEstribos,
      espaciadoLong_cm: reporte.espaciadoLong_cm,
      espaciadoTrans_cm: reporte.espaciadoTrans_cm
    });
  });

  return resultados;
}

// ================== 5. GENERADOR DE TABLA HTML ==================

export function generarTablaResultadosTriangulares(resultados) {
  if (!resultados || resultados.length === 0) return '<p class="text-center p-4">Sin resultados.</p>';
  
  let tVol = 0, tPesoConc = 0;
  let tPesoLong = 0, tPesoTrans = 0;
  let tAlambreL = 0, tAlambreP = 0;

  const cleanVarilla = (v) => (v || '').split(' ')[0];
  
  let html = `<tbody>`;
  resultados.forEach(r => {
    tVol += r.volumen_m3 || 0;
    tPesoConc += r.peso_conc || 0;
    tPesoLong += r.pesoLongitudinal_kg || 0;
    tPesoTrans += r.pesoEstribos_kg || 0;
    tAlambreL += r.longAlambre_m || 0;
    tAlambreP += r.pesoAlambre_kg || 0;

    const pesoTon = (r.peso_conc || 0) / 1000;
    
    html += `
      <tr>
        <td rowspan="2" class="text-center fw-bold">G${r.grupo_numero}</td>
        <td rowspan="2" class="text-center">${r.eje || '-'}</td>
        <td rowspan="2"><small>${r.muros_list || '-'}</small></td>
        <td rowspan="2" class="text-center bg-light">L:${r.largo.toFixed(2)}<br>H:${r.alto.toFixed(2)}<br>B:${r.base.toFixed(2)}</td>
        
        <td class="text-center">${cleanVarilla(r.tipoVarillaLong)}</td>
        <td class="text-end">${r.longLongitudinal_m.toFixed(1)}</td>
        <td class="text-end">${r.pesoLongitudinal_kg.toFixed(1)}</td>
        <td>Long.</td>
        
        <td rowspan="2" class="text-end fw-bold text-primary">${r.volumen_m3.toFixed(2)}</td>
        <td rowspan="2" class="text-end">${pesoTon.toFixed(2)} T</td>
        <td rowspan="2" class="text-end">${r.longAlambre_m.toFixed(1)}</td>
        <td rowspan="2" class="text-end">${r.pesoAlambre_kg.toFixed(1)}</td>
      </tr>
      <tr>
        <td class="text-center">${cleanVarilla(r.tipoVarillaTrans)}</td>
        <td class="text-end">${r.longEstribos_m.toFixed(1)}</td>
        <td class="text-end">${r.pesoEstribos_kg.toFixed(1)}</td>
        <td>Estribo</td>
      </tr>
    `;
  });
  
  html += `</tbody>
  <tfoot class="table-light" style="border-top: 2px solid #333;">
    <tr class="fw-bold">
      <td colspan="4" class="text-end">TOTALES PROYECTO:</td>
      
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

// ================== 6. EXPORTAR COMPATIBILIDAD ==================

if (typeof window !== 'undefined') {
  window.MuertoTriangular = {
    calcularMacizosTriangulares,
    generarTablaResultadosTriangulares,
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