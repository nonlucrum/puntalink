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

// ================== CONCRETO (MODIFICADO) ==================
function calcularConcreto(dimensiones, densidad = 2400, factorDesperdicio = 1) {
  const { ancho, alto, profundidad, largo } = dimensiones;

  // 1. Definir dimensiones finales
  // Usamos 'largo' si existe, si no 'profundidad' (para evitar confusiones)
  const L = largo !== undefined ? largo : profundidad;
  const B = ancho;
  const H = alto;

  // 2. CÁLCULO GEOMÉTRICO PURO (L x B x H)
  // Este es el volumen del "cajón". Sirve para cubicaciones y planos.
  const volumen_geom_m3 = L * B * H;

  // 3. CÁLCULO DE PESO ESTRUCTURAL
  // El peso depende del volumen geométrico y la densidad.
  // NOTA: El factor de desperdicio aumenta el costo/volumen de compra, 
  // pero NO aumenta el peso estructural del bloque (el desperdicio se tira).
  // Si tú quieres que el desperdicio sume peso, agrégalo aquí, si no, quítalo.
  const peso_estructural_kg = volumen_geom_m3 * densidad; 
  
  // 4. VOLUMEN DE COMPRA (Opcional)
  // Si necesitas saber cuánto pedir a la concretera (incluyendo desperdicio)
  const volumen_compra_m3 = volumen_geom_m3 * factorDesperdicio;

  return {
    largo: L,
    ancho: B,
    alto: H,
    volumen_geom_m3,       // L x B x H (Para mostrar en tabla)
    volumen_compra_m3,     // Para presupuesto
    peso_estructural_kg,   // Para cálculo de estabilidad (kg)
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
  // Llamamos a la nueva función de concreto
  const concreto = calcularConcreto(
      dimensiones, 
      config.densidadConcreto ?? 2400, 
      config.factorDesperdicio ?? 1
  );
  
  // ... (cálculos de longitudinal, transversal y alambre siguen igual) ...
  const longitudinal = calcularLongitudinal(dimensiones, config);
  const transversal = calcularTransversal(dimensiones, config);
  const alambre = calcularAlambre(dimensiones, config, longitudinal, transversal);

  const factorVol = config.repVol ?? 1;

  return {
    // Dimensiones
    ancho: concreto.ancho,
    alto: concreto.alto,
    largo: concreto.largo,

    // --- AQUÍ ESTÁ LA SEPARACIÓN ---
    // Variable 1: El volumen físico (L x B x H)
    volumenConcreto_m3: concreto.volumen_geom_m3 * factorVol, 
    
    // Variable 2: El volumen a comprar (con desperdicio, si aplica)
    volumenCompra_m3: concreto.volumen_compra_m3 * factorVol,

    // Variable 3: El peso (derivado de la densidad)
    pesoConcreto_kg: concreto.peso_estructural_kg * factorVol,
    // -------------------------------

    // ... Resto de los datos de acero ...
    pesoLongitudinal_kg: longitudinal.peso_kg,
    pesoEstribos_kg: transversal.peso_kg,
    pesoAlambre_kg: alambre.peso_kg,

    // Peso Total del muerto (Concreto + Aceros)
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

// ================== FUNCIÓN DE CÁLCULO CORREGIDA ==================
export function calcularMacizosRectangulares(gruposPreparados, config = {}) {
  console.log('[MUERTO-RECTANGULAR] calcularMacizosRectangulares - Inicio (Refactorizado)');

  const configDefault = {
    tipoVarillaLong: 4,
    tipoVarillaTrans: 3,
    espaciamientoEstribo: 0.25, // 25 cm
    densidadConcreto: 2400,
    recubrimientoLongitudinal: 4, // cm
    recubrimientoTransversal: 4, // cm
    ...config
  };

  const resultados = [];


  gruposPreparados.forEach((grupo, indice) => {
    // 1. Dimensiones
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

    // 3. Cálculo detallado (Aceros y Volumen Geométrico)
    const reporte = calcularReporteMuerto(dimensiones, configGrupo);

    // 4. LÓGICA DE PESO AJUSTADA:
    // Si existe sumaFBy (la carga que viene de los muros), usamos ESA como peso reportado.
    // Si no existe (es 0 o error), usamos el peso físico calculado (backup).
    const pesoReportar_kg = (grupo.sumaFBy && grupo.sumaFBy > 0)
      ? grupo.sumaFBy
      : reporte.pesoConcreto_kg;

    // 5. Construir Resultado
    const resultado = {
      grupo_numero: grupo.numero_grupo,
      grupo_clave: grupo.clave,
      eje: grupo.eje,
      muros_list: grupo.muros_list,

      // Dimensiones
      largo_total: dimensiones.largo,
      alto_total: dimensiones.alto,
      espesor_bloque: dimensiones.ancho,

      fuerzaBrace_kN: (grupo.sumaFBy || 0) / 1000,

      // Aceros
      tipoVarillaLong: reporte.tipoVarillaLong,
      nBarrasLong: reporte.totalBarrasLong || 0,
      longLongitudinal_m: reporte.longLongitudinal_m,
      pesoLongitudinal_kg: reporte.pesoLongitudinal_kg,

      tipoVarillaTrans: reporte.tipoVarillaTrans,
      nEstribos: reporte.cantEstribos,
      longEstribos_m: reporte.longEstribos_m,
      pesoEstribos_kg: reporte.pesoEstribos_kg,

      // --- CAMBIOS EN CONCRETO ---
      // Volumen: Se queda con el Geométrico (lo real a colar)
      volumenConcreto_m3: reporte.volumenConcreto_m3,

      // Peso: Usamos FBy directamente
      pesoConcreto_kg: pesoReportar_kg,

      valor_LBH: reporte.volumenConcreto_m3,

      // Alambre
      longAlambre_m: reporte.longAlambre_m,
      pesoAlambre_kg: reporte.pesoAlambre_kg,

      // Total: Sumamos el peso reportado (FBy) + aceros
      pesoTotal_kg: pesoReportar_kg +
        reporte.pesoLongitudinal_kg +
        reporte.pesoEstribos_kg +
        reporte.pesoAlambre_kg
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

if (typeof window !== 'undefined') {
  window.MuertoRectangular = {
    prepararGruposParaMuertos,
    calcularMacizosRectangulares,
    generarTablaResultadosMacizos
  };
}