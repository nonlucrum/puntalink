/**
 * CÁLCULOS DE ARMADO RECTANGULAR PARA MUERTOS
 *
 * Versión Final Integrada
 * - Corrige valores undefined en longitudes.
 * - Separa Peso (FBy) de Volumen Geométrico (L*B*H).
 * - Integra cálculo de aceros y concreto.
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
  if (!dim1 || !dim2 || dim1 === 0 || dim2 === 0) return 0;
  const valorBase = volumen / (dim1 * dim2);
  // Redondeo hacia arriba al 0.05 más cercano
  let dimension = Math.ceil(valorBase * 20) / 20;
  if (dimension < 0.4) dimension = 0.4;
  return dimension;
}

// ================== 1. CÁLCULO DE CONCRETO ==================

function calcularConcreto(dimensiones, densidad = 2400, factorDesperdicio = 1) {
  const { ancho, alto, profundidad, largo } = dimensiones;

  // Usamos 'largo' si existe, si no 'profundidad'
  const L = largo !== undefined ? largo : profundidad;
  const B = ancho;
  const H = alto;

  // Cálculo Geométrico (El cajón real)
  const volumen_geom_m3 = L * B * H;

  // Cálculo de Peso Estructural (Base para backup)
  const peso_estructural_kg = volumen_geom_m3 * densidad; 
  
  // Volumen de Compra (con desperdicio)
  const volumen_compra_m3 = volumen_geom_m3 * factorDesperdicio;

  return {
    largo: L,
    ancho: B,
    alto: H,
    volumen_geom_m3,       // Para la tabla (Volumen físico)
    volumen_compra_m3,     // Para pedidos
    peso_estructural_kg,   // Respaldo si no hay FBy
  };
}

// ================== 2. CÁLCULO DE ACEROS ==================

function calcularLongitudinal(dimensiones, config = {}) {
  const L = dimensiones.profundidad; 
  const b = dimensiones.ancho;      

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
    cantSup, cantMed, cantInf,
    largoTotal_m,
    peso_kg,
    totalBarrasLong: cantSup + cantMed + cantInf,
  };
}

function calcularTransversal(dimensiones, config = {}) {
  const L = dimensiones.profundidad; 
  const b = dimensiones.ancho;      
  const h = dimensiones.alto;       

  const r = config.recubrimientoTransversal !== undefined ? config.recubrimientoTransversal / 100 : RECUBRIMIENTO_DEFAULT_M;
  const espaciamiento_m = config.separacionTransversal !== undefined ? config.separacionTransversal / 100 : ESPACIAMIENTO_ESTRIBO_DEFAULT_M;
  const pesoVarillaEstribo_kgm = obtenerPesoEspecifico(config.tipoVarillaTransversal || 3);
  const gancho = config.longGanchoEstribo !== undefined ? config.longGanchoEstribo : LONG_GANCHO_ESTRIBO_DEFAULT_M;

  const largoUtil_m = Math.max(L - 2 * r, 0);
  const cantidad = Math.ceil(largoUtil_m / espaciamiento_m) + 1;
  const espaciamientoReal_m = cantidad > 0 ? (largoUtil_m / cantidad) : 0;

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

// ================== 3. REPORTE INDIVIDUAL (CORREGIDO) ==================

function calcularReporteMuerto(dimensiones, config = {}) {
  const concreto = calcularConcreto(dimensiones, config.densidadConcreto ?? 2400, config.factorDesperdicio ?? 1);
  const longitudinal = calcularLongitudinal(dimensiones, config);
  const transversal = calcularTransversal(dimensiones, config);
  const alambre = calcularAlambre(dimensiones, config, longitudinal, transversal);

  const factorVol = config.repVol ?? 1;

  return {
    // Dimensiones Finales
    ancho: concreto.ancho,
    alto: concreto.alto,
    largo: concreto.largo,

    // Concreto (Separado Volumen vs Peso)
    volumenConcreto_m3: concreto.volumen_geom_m3 * factorVol,
    volumenCompra_m3: concreto.volumen_compra_m3 * factorVol,
    pesoConcreto_kg: concreto.peso_estructural_kg * factorVol,

    // Longitudinal (CORREGIDO: Devuelve longitudes)
    tipoVarillaLong: config.tipoVarillaLongitudinal || 4,
    totalBarrasLong: longitudinal.totalBarrasLong,
    longLongitudinal_m: longitudinal.largoTotal_m, 
    pesoLongitudinal_kg: longitudinal.peso_kg,

    // Transversal (CORREGIDO: Devuelve longitudes)
    tipoVarillaTrans: config.tipoVarillaTransversal || 3,
    cantEstribos: transversal.cantidad,
    longEstribos_m: transversal.longitudTotal_m,
    pesoEstribos_kg: transversal.peso_kg,

    // Alambre (CORREGIDO: Devuelve longitudes)
    longAlambre_m: alambre.longitudTotal_m,
    pesoAlambre_kg: alambre.peso_kg,

    // Totales
    pesoTotal_kg: (concreto.peso_estructural_kg * factorVol) + 
                  longitudinal.peso_kg + 
                  transversal.peso_kg + 
                  alambre.peso_kg
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

// ================== 4. PREPARACIÓN DE GRUPOS ==================

export function prepararGruposParaMuertos(gruposMuertos) {
  console.log('[MUERTO-RECTANGULAR] prepararGruposParaMuertos - Inicio');
  const gruposPreparados = [];
  
  Object.keys(gruposMuertos).forEach((clave, indice) => {
    const grupo = gruposMuertos[clave];

    let largoTotal = 0;
    let murosIds = [];
    
    grupo.muros.forEach(muro => {
      let muroObj = muro;
      let muroId = typeof muro === 'object' ? (muro.id_muro || muro.id) : muro;
      if (typeof muro === 'string' && window.lastResultadosMuertos) {
        muroObj = window.lastResultadosMuertos.find(m => m.id_muro === muro || m.id === muro);
      }
      if (muroObj && typeof muroObj === 'object') {
        let largo = parseFloat(muroObj.overall_width);
        largoTotal += largo || 0;
        murosIds.push(muroId);
      }
    });

    if (largoTotal > 0) {
      largoTotal = Math.round(largoTotal * 100) / 100;
    }

    const configGrupoManual = window.configGruposMuertos?.[clave] || {};
    const configGrupo = grupo.configGrupo || configGrupoManual || {};
    const profundo = configGrupo.profundo || configGrupo.profundidad || configGrupoManual.profundidad || 0.2;

    const densidadConcreto = DENSIDAD_CONCRETO_KG_M3_DEFAULT;

    let sumaFBy = 0;
    grupo.muros.forEach(muro => {
      let muroObj = muro;
      if (typeof muro === 'string' && window.lastResultadosMuertos) {
        muroObj = window.lastResultadosMuertos.find(m => m.id_muro === muro || m.id === muro);
      }
      sumaFBy += parseFloat(muroObj?.fby) || parseFloat(muroObj?.FBy) || 0;
    });

    // Cálculo de Ancho sugerido basado en FBy (teórico)
    const volumenMuerto = sumaFBy / densidadConcreto;
    let anchoMuerto = 0;
    if (largoTotal > 0 && profundo > 0) {
      anchoMuerto = calcularDimensionConRedondeo(volumenMuerto, largoTotal, profundo);
    }

    gruposPreparados.push({
      clave: clave,
      numero_grupo: indice + 1,
      largo_total: largoTotal,
      alto_total: profundo,
      espesor_bloque: anchoMuerto,
      x_braces: grupo.x_braces || 0,
      angulo: grupo.angulo || 0,
      eje: grupo.eje || '',
      muros_list: murosIds.join(', '),
      muros: grupo.muros,
      configGrupo: { ...configGrupo, profundo: profundo },
      sumaFBy,
      densidadConcreto,
      volumenMuerto, // Teórico
      anchoMuerto,
    });
  });
  
  return gruposPreparados;
}

// ================== 5. FUNCIÓN PRINCIPAL (MACIZOS) ==================

export function calcularMacizosRectangulares(gruposPreparados, config = {}) {
  console.log('[MUERTO-RECTANGULAR] calcularMacizosRectangulares - Inicio Final');

  const configDefault = {
    tipoVarillaLong: 4,
    tipoVarillaTrans: 3,
    espaciamientoEstribo: 0.25,
    densidadConcreto: 2400,
    recubrimientoLongitudinal: 4,
    recubrimientoTransversal: 4,
    ...config
  };

  const resultados = [];

  gruposPreparados.forEach((grupo, indice) => {
    // 1. Preparar Dimensiones
    const dimensiones = {
      ancho: grupo.espesor_bloque || 0,
      alto: grupo.alto_total || 0,
      profundidad: grupo.largo_total || 0,
      largo: grupo.largo_total || 0
    };

    // 2. Configuración
    const configGrupo = {
      ...configDefault,
      ...(grupo.configGrupo || {}),
      densidadConcreto: grupo.densidadConcreto || configDefault.densidadConcreto
    };

    // 3. Calcular todo (Concreto + Aceros)
    const reporte = calcularReporteMuerto(dimensiones, configGrupo);

    // 4. LÓGICA DE PESO FINAL:
    // Priorizamos sumaFBy (Carga de diseño) sobre el peso del volumen geométrico.
    const pesoReportar_kg = (grupo.sumaFBy && grupo.sumaFBy > 0) 
                          ? grupo.sumaFBy 
                          : reporte.pesoConcreto_kg;

    // 5. Construir Resultado Final
    resultados.push({
      grupo_numero: grupo.numero_grupo,
      grupo_clave: grupo.clave,
      eje: grupo.eje,
      muros_list: grupo.muros_list,

      // Dimensiones Visuales
      largo_total: dimensiones.largo,
      alto_total: dimensiones.alto,
      espesor_bloque: dimensiones.ancho,
      
      fuerzaBrace_kN: (grupo.sumaFBy || 0) / 1000,

      // Aceros (Ahora con datos completos)
      tipoVarillaLong: reporte.tipoVarillaLong,
      nBarrasLong: reporte.totalBarrasLong || 0,
      longLongitudinal_m: reporte.longLongitudinal_m, // Ya no será undefined
      pesoLongitudinal_kg: reporte.pesoLongitudinal_kg,

      tipoVarillaTrans: reporte.tipoVarillaTrans,
      nEstribos: reporte.cantEstribos,
      longEstribos_m: reporte.longEstribos_m,       // Ya no será undefined
      pesoEstribos_kg: reporte.pesoEstribos_kg,

      // Concreto y Peso
      volumenConcreto_m3: reporte.volumenConcreto_m3, // Volumen físico (3.14...)
      pesoConcreto_kg: pesoReportar_kg,               // Peso de diseño (7.1 Ton...)
      valor_LBH: reporte.volumenConcreto_m3,

      // Alambre
      longAlambre_m: reporte.longAlambre_m,           // Ya no será undefined
      pesoAlambre_kg: reporte.pesoAlambre_kg,

      // Totales
      pesoTotal_kg: pesoReportar_kg + 
                    reporte.pesoLongitudinal_kg + 
                    reporte.pesoEstribos_kg + 
                    reporte.pesoAlambre_kg
    });
  });

  return resultados;
}

// ================== 6. GENERADOR DE TABLA ==================

export function generarTablaResultadosMacizos(resultados) {
  if (!resultados || resultados.length === 0) return '<p>No hay resultados.</p>';

  let tVol = 0, tPesoConc = 0, tAlambreL = 0, tAlambreP = 0;
  let html = `<tbody>`;
  
  resultados.forEach((res) => {
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
        
        <td>${res.tipoVarillaLong || 4}</td>
        <td>${res.longLongitudinal_m?.toFixed(2)}</td>
        <td>${res.pesoLongitudinal_kg?.toFixed(2)}</td>
        <td>Long.</td>
        
        <td rowspan="2">${res.volumenConcreto_m3?.toFixed(3)}</td>
        <td rowspan="2">${pesoTon.toFixed(2)}</td>
        
        <td rowspan="2">${res.longAlambre_m?.toFixed(2)}</td>
        <td rowspan="2">${res.pesoAlambre_kg?.toFixed(2)}</td>
      </tr>
      <tr>
        <td>${res.tipoVarillaTrans || 3}</td>
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

// Exponer al navegador si aplica
if (typeof window !== 'undefined') {
  window.MuertoRectangular = {
    prepararGruposParaMuertos,
    calcularMacizosRectangulares,
    generarTablaResultadosMacizos
  };
}