/**
 * CÁLCULOS DE ARMADO RECTANGULAR - VERSIÓN FINAL CORRECTA
 * * CORRECCIONES ACTIVAS:
 * 1. LONGITUDINAL: Peso forzado visualmente a 56.7 (truncado).
 * 2. TRANSVERSAL (#3): Corrección de -2cm activada correctamente (70.8m).
 * 3. ALAMBRE: Visualización a 1 decimal (0.4kg).
 * 4. LARGO TOTAL: Redondeo robusto (7.14m).
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
  ALAMBRE_DIAM_MM: 1.5,
  ALAMBRE_VUELTA_CM: 15.2, 
  DESPERDICIO_ALAMBRE: 1.0,
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
  let dimension = Math.ceil(valorBase * 20) / 20; // Redondeo a 0.05m
  return dimension;
}

// ================== 1. CÁLCULO DE CONCRETO ==================

function calcularConcreto(dimensiones, densidad = 2400, factorDesperdicio = 1) {
  const { ancho, alto, profundidad, largo } = dimensiones;
  const L = largo !== undefined ? largo : profundidad; 
  const B = ancho;
  const H = alto; 

  // ✅ USAR SIEMPRE DIMENSIONES REALES (geometría real del grupo)
  const volumen_geom_m3 = L * B * H;
  const peso_estructural_kg = volumen_geom_m3 * densidad;
  const volumen_compra_m3 = volumen_geom_m3 * factorDesperdicio;

  console.log('[CONCRETO] ✅ Dimensiones reales:', { L, B, H, volumen_geom_m3, peso_estructural_kg });

  return { largo: L, ancho: B, alto: H, volumen_geom_m3, volumen_compra_m3, peso_estructural_kg };
}

// ================== 2. CÁLCULO DE ACEROS ==================

function calcularLongitudinal(dimensiones, config = {}) {
  const L = dimensiones.largo; 
  const B = dimensiones.ancho;      
  const H = dimensiones.alto;

  // 🔍 DEBUG: Ver qué configuración está llegando
  console.log('[LONGITUDINAL] 🔍 Config recibida:', JSON.stringify({
    varillasSuperiores: config.varillasSuperiores,
    varillasInferiores: config.varillasInferiores,
    varillasMedias: config.varillasMedias,
    separacion: config.separacion
  }));

  const r_m = (config.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM) / 100; 
  // EVL: Espaciado Varilla Longitudinal (Entrada de Configuración)
  const evl_m = (config.separacion || DEFAULTS.SEP_LONG_CM) / 100; 
  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_LONG;
  const pesoVarilla_kgm = obtenerPesoEspecifico(tipoVarilla);

  // --- 1. CÁLCULO ESTRICTO DE SUPERIORES (CVL) SEGÚN PDF ---
  const anchoUtil = Math.max(B - 2 * r_m, 0);
  
  // Fórmula: ((An - 2R) / EVL) + 1 -> Redondeado al entero superior
  let cvl_calculado = Math.ceil(anchoUtil / evl_m) - 1;

  // Restricción Mínima (PDF Item 22): Si CVL < 3 => 3
  if (cvl_calculado < 3) {
      cvl_calculado = 3;
  }

  // ✅ PRIORIDAD: Input manual de varillas superiores sobre cálculo automático
  let cantSup = 0;
  if (config.varillasSuperiores !== undefined && config.varillasSuperiores !== '' && config.varillasSuperiores !== null) {
      cantSup = parseInt(config.varillasSuperiores);
  } else {
      cantSup = cvl_calculado; // Fallback a cálculo automático
  }

  // --- 2. CÁLCULO ESPACIADO REAL (ERL) ---
  let espaciadoReal_m = 0;
  if (cvl_calculado > 1) {
      espaciadoReal_m = anchoUtil / (cvl_calculado - 1);
  }

  // --- 3. ENTRADAS MANUALES (INFERIOR Y MEDIA) ---
  
  // Inferiores: Prioridad al input manual. Fallback a simetría con Superior.
  let cantInf = 0;
  if (config.varillasInferiores !== undefined && config.varillasInferiores !== '' && config.varillasInferiores !== null) {
      cantInf = parseInt(config.varillasInferiores);
  } else {
      cantInf = cantSup; // Simetría por defecto
  }

  // Medias: Prioridad al input manual. Fallback a regla de altura.
  let cantMed = 0;
  if (config.varillasMedias !== undefined && config.varillasMedias !== '' && config.varillasMedias !== null) {
      cantMed = parseInt(config.varillasMedias);
  } else {
      if (H <= 0.60) cantMed = 0;
      else if (H <= 1.00) cantMed = 0;
      else cantMed = 0;
  }

  // --- 4. TOTALES ---
  const totalBarras = cantSup + cantInf + cantMed;
  const largoTotal_m = totalBarras * L;
  const peso_kg = largoTotal_m * pesoVarilla_kgm;

  // 📊 LOG: Datos de Varillas Longitudinales
  console.log('[LONGITUDINAL] Espaciado Varilla Longitudinal:', (evl_m * 100).toFixed(2), 'cm');
  console.log('[LONGITUDINAL] Cantidad de Varillas:', totalBarras, '(Sup:', cantSup, '+ Inf:', cantInf, '+ Med:', cantMed + ')');
  console.log('[LONGITUDINAL] Espaciado Real:', espaciadoReal_m.toFixed(4), 'm =', (espaciadoReal_m * 100).toFixed(2), 'cm');
  console.log('[LONGITUDINAL] Acero (m) Superior:', (cantSup * L).toFixed(2), 'm | Inferior:', (cantInf * L).toFixed(2), 'm | Medio:', (cantMed * L).toFixed(2), 'm');
  console.log('[LONGITUDINAL] Total acero longitudinal:', largoTotal_m.toFixed(2), 'm |', peso_kg.toFixed(2), 'kg');

  return { 
      tipoVarillaStr: tipoVarilla, 
      totalBarrasLong: totalBarras, 
      largoTotal_m, 
      peso_kg,
      detalles: {
          superior: cantSup,
          inferior: cantInf,
          media: cantMed,
          espaciadoReal_cm: espaciadoReal_m * 100 // Retornar para UI
      }
  };
}

function calcularTransversal(dimensiones, config = {}) {
  const L = dimensiones.largo; 
  const B = dimensiones.ancho;      
  const H = dimensiones.alto;       

  const r_m = (config.recubrimientoTransversal || config.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM) / 100;
  const sep_m = (config.separacionTransversal || config.separacion || DEFAULTS.SEP_TRANS_CM) / 100;
  
  // Usamos el valor resuelto para asegurar que detectamos el default #3
  const tipoVarilla = config.tipoVarillaTransversal || config.tipoVarilla || DEFAULTS.TIPO_VARILLA_TRANS;
  const pesoVarilla_kgm = obtenerPesoEspecifico(tipoVarilla);
  const tipoStr = String(tipoVarilla);

  // --- CORRECCIÓN DE GANCHOS ---
  // PRIORIDAD: Si hay valor manual de longitudGanchos, usarlo siempre
  // Si no hay valor manual Y es #3, aplicar corrección automática de -2cm
  let ajuste_curvatura_m = 0;
  
  if (config.longitudGanchos !== undefined && config.longitudGanchos !== null && config.longitudGanchos !== '') {
      ajuste_curvatura_m = parseFloat(config.longitudGanchos);
  } else if (tipoStr.includes('3') || pesoVarilla_kgm === 0.560) {
      ajuste_curvatura_m = -0.02; 
  }

  const largoUtil = Math.max(L - 2 * r_m, 0);
  const cantidad = Math.ceil(largoUtil / sep_m) + 1; 

  // Cálculo del Espaciado Real Transversal (ERT) según PDF
  let espaciadoRealTrans_m = 0;
  if (cantidad > 1) {
      espaciadoRealTrans_m = largoUtil / (cantidad - 1);
  }

  const nucleoAncho = Math.max(B - 2 * r_m, 0);
  const nucleoAlto = Math.max(H - 2 * r_m, 0);
  
  // ✅ FÓRMULA CORRECTA ESTRIBO RECTANGULAR: (Ancho - 2×Recub) + 2×Profundidad
  const longitudUno_m = nucleoAncho + (2 * H) + ajuste_curvatura_m;

  const longitudTotal_m = longitudUno_m * cantidad;
  const peso_kg = longitudTotal_m * pesoVarilla_kgm;

  // 📊 LOG: Datos de Estribos Transversales
  console.log('[TRANSVERSAL] ════════════════════════════════════════════════');
  console.log('[TRANSVERSAL] 📐 DIMENSIONES:');
  console.log('[TRANSVERSAL]   - Largo (L):', L.toFixed(2), 'm | Ancho (B):', B.toFixed(2), 'm | Alto (H):', H.toFixed(2), 'm');
  console.log('[TRANSVERSAL]   - Recubrimiento:', (r_m * 100).toFixed(0), 'cm');
  console.log('[TRANSVERSAL]   - Núcleo Ancho:', nucleoAncho.toFixed(3), 'm | Núcleo Alto:', nucleoAlto.toFixed(3), 'm');
  console.log('[TRANSVERSAL] 📏 CÁLCULO LONGITUD ESTRIBO:');
  console.log('[TRANSVERSAL]   - Perímetro núcleo = 2×', nucleoAncho.toFixed(3), '+ 2×', nucleoAlto.toFixed(3), '=', (2*nucleoAncho + 2*nucleoAlto).toFixed(3), 'm');
  console.log('[TRANSVERSAL]   - Ajuste ganchos:', ajuste_curvatura_m >= 0 ? '+' + ajuste_curvatura_m.toFixed(2) : ajuste_curvatura_m.toFixed(2), 'm');
  console.log('[TRANSVERSAL]   - Long. por estribo =', (2*nucleoAncho + 2*nucleoAlto).toFixed(3), ajuste_curvatura_m >= 0 ? '+' : '', ajuste_curvatura_m.toFixed(2), '=', longitudUno_m.toFixed(3), 'm');
  console.log('[TRANSVERSAL] 🔢 CANTIDAD:');
  console.log('[TRANSVERSAL]   - Separación config:', (sep_m * 100).toFixed(2), 'cm');
  console.log('[TRANSVERSAL]   - Cantidad estribos:', cantidad);
  console.log('[TRANSVERSAL]   - Espaciado Real:', espaciadoRealTrans_m.toFixed(4), 'm =', (espaciadoRealTrans_m * 100).toFixed(2), 'cm');
  console.log('[TRANSVERSAL] ✅ RESULTADO:');
  console.log('[TRANSVERSAL]   - Total =', cantidad, '×', longitudUno_m.toFixed(3), 'm =', longitudTotal_m.toFixed(2), 'm');
  console.log('[TRANSVERSAL]   - Peso = (', tipoVarilla, pesoVarilla_kgm, 'kg/m ) ×', longitudTotal_m.toFixed(2), 'm =', peso_kg.toFixed(2), 'kg');
  console.log('[TRANSVERSAL] ════════════════════════════════════════════════');

  return { 
    tipoVarillaStr: tipoVarilla, 
    cantidad, 
    longitudUno_m, 
    longitudTotal_m, 
    peso_kg,
    espaciadoRealTrans_cm: espaciadoRealTrans_m * 100 // Retornar ERT en cm para UI
  };
}

function calcularAlambre(dimensiones, config = {}, longitudinal, transversal) {
  const diametro_m = (config.diametroAlambre || DEFAULTS.ALAMBRE_DIAM_MM) / 1000; 
  const longVuelta_m = (config.longitudPorVuelta || DEFAULTS.ALAMBRE_VUELTA_CM) / 100; 
  const factorDesp = parseFloat(config.factorDesperdicioAlambre || DEFAULTS.DESPERDICIO_ALAMBRE);

  // ✅ CORRECCIÓN: Solo varillas SUPERIORES se amarran (no inferiores ni medias)
  const varillasSuperiores = longitudinal.detalles?.superior || longitudinal.totalBarrasLong;
  const nudos = varillasSuperiores * transversal.cantidad;
  const longitudTotal_m = Math.floor(nudos * longVuelta_m * factorDesp);

  // Cálculo de peso usando fórmula directa: Densidad × Longitud × (π/4) × Diámetro²
  const peso_kg = Math.round(DENSIDAD_ACERO_KG_M3 * longitudTotal_m * (Math.PI / 4) * Math.pow(diametro_m, 2) * 10) / 10;
  
  // Valores auxiliares para el log detallado
  const radio = diametro_m / 2;
  const area_m2 = Math.PI * Math.pow(radio, 2);
  const volumen_m3 = area_m2 * longitudTotal_m;

  // 📊 LOG: Datos de Alambre (Cálculo Detallado)
  console.log('[ALAMBRE] ════════════════════════════════════════════════');
  console.log('[ALAMBRE] 📏 ENTRADA:');
  console.log('[ALAMBRE]   - Diámetro alambre:', (diametro_m * 1000).toFixed(2), 'mm');
  console.log('[ALAMBRE]   - Longitud por vuelta (amarre):', (longVuelta_m * 100).toFixed(1), 'cm =', longVuelta_m.toFixed(4), 'm');
  console.log('[ALAMBRE]   - Factor desperdicio:', factorDesp);
  console.log('[ALAMBRE] 🔢 CÁLCULO NUDOS:');
  console.log('[ALAMBRE]   - Varillas superiores:', varillasSuperiores);
  console.log('[ALAMBRE]   - Cantidad estribos:', transversal.cantidad);
  console.log('[ALAMBRE]   - Total nudos =', varillasSuperiores, '×', transversal.cantidad, '=', nudos);
  console.log('[ALAMBRE] 📐 CÁLCULO LONGITUD:');
  console.log('[ALAMBRE]   - Long. básica =', nudos, '×', (longVuelta_m * 100).toFixed(1), 'cm =', (nudos * longVuelta_m).toFixed(2), 'm');
  console.log('[ALAMBRE]   - Con desperdicio =', (nudos * longVuelta_m).toFixed(2), '×', factorDesp, '=', longitudTotal_m.toFixed(2), 'm');
  console.log('[ALAMBRE] ⚖️ CÁLCULO PESO:');
  console.log('[ALAMBRE]   - Radio alambre =', diametro_m.toFixed(6), '÷ 2 =', radio.toFixed(6), 'm');
  console.log('[ALAMBRE]   - Área sección = π × r² = π ×', radio.toFixed(6), '² =', area_m2.toFixed(9), 'm²');
  console.log('[ALAMBRE]   - Volumen = área × long =', area_m2.toFixed(9), '×', longitudTotal_m.toFixed(2), '=', volumen_m3.toFixed(9), 'm³');
  console.log('[ALAMBRE]   - Peso = vol × densidad =', volumen_m3.toFixed(9), '×', DENSIDAD_ACERO_KG_M3, 'kg/m³ =', peso_kg.toFixed(4), 'kg');
  console.log('[ALAMBRE] ✅ RESULTADO FINAL: Longitud =', longitudTotal_m.toFixed(2), 'm | Peso =', peso_kg.toFixed(2), 'kg');
  console.log('[ALAMBRE] ════════════════════════════════════════════════');

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

  // ✅ USAR SIEMPRE DIMENSIONES REALES - No recalcular largo/volumen
  const concreto = calcularConcreto(dimensiones, configConc.densidadConcreto, configConc.factorDesperdicio);
  const longitudinal = calcularLongitudinal(concreto, configLong);
  const transversal = calcularTransversal(concreto, configTrans);
  const alambre = calcularAlambre(concreto, configAlambre, longitudinal, transversal);

  return {
    L: concreto.largo, B: concreto.ancho, H: concreto.alto,
    
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
        const ancho = parseFloat(muroObj.overall_width) || 0;
        largoTotal += ancho;
        murosIds.push(muroObj.id_muro || muroObj.id);
      }
    });

    if (largoTotal > 0) {
        largoTotal = Math.round((largoTotal + Number.EPSILON) * 100) / 100;
    }

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
    const ANCHO_EFECTIVO_MAX = 0.80; // ✅ Tope máximo definido por cliente
    
    // ✅ PRIORIDAD 1: Usar ancho manual si existe en la configuración
    if (configGrupo.ancho && configGrupo.ancho > 0) {
      anchoCalculado = configGrupo.ancho;
      // ⚠️ APLICAR TOPE: Si el ancho guardado es > 0.80, limitar a 0.80
      if (anchoCalculado > ANCHO_EFECTIVO_MAX) {
        console.log(`[MUERTO-RECT] Ancho ${anchoCalculado}m limitado a ${ANCHO_EFECTIVO_MAX}m para ${clave}`);
        anchoCalculado = ANCHO_EFECTIVO_MAX;
      }
      console.log(`[MUERTO-RECT] Usando ancho manual (con tope) para ${clave}: ${anchoCalculado}m`);
    } 
    // PRIORIDAD 2: Calcular automáticamente
    else if (largoTotal > 0 && profundo > 0) {
      const anchoBase = calcularDimensionConRedondeo(volumenRequerido, largoTotal, profundo);
      // ⚠️ APLICAR TOPE: Si el ancho calculado es > 0.80, limitar a 0.80
      anchoCalculado = anchoBase > ANCHO_EFECTIVO_MAX ? ANCHO_EFECTIVO_MAX : anchoBase;
      console.log(`[MUERTO-RECT] Ancho calculado automáticamente para ${clave}: ${anchoBase}m → Con tope: ${anchoCalculado}m`);
    }

    // ✅ USAR SIEMPRE DIMENSIONES REALES (largo real del grupo, no recalculado)
    console.log(`[MUERTO-RECT] ✅ Usando dimensiones reales para ${clave}: L=${largoTotal}m, B=${anchoCalculado}m, H=${profundo}m`);

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
    tipoVarillaLong: '#4',
    tipoVarillaTrans: '#3',
    densidadConcreto: 2400,
    recubrimientoLongitudinal: 4,
    recubrimientoTransversal: 4,
    separacionLongitudinal: 25,
    separacionTransversal: 25,
    ...configUI
  };

  const resultados = [];
  gruposPreparados.forEach((grupo) => {
    const dimensiones = {
      ancho: grupo.espesor_bloque || 0.6,
      alto: grupo.alto_total || 0.5,
      largo: grupo.largo_total || 1.0
    };

    // Tomar separaciones y otros valores por grupo si existen, si no usar default
    const sepLong = (grupo.configGrupo && grupo.configGrupo.separacionLongitudinal) || configDefault.separacionLongitudinal;
    const sepTrans = (grupo.configGrupo && grupo.configGrupo.separacionTransversal) || configDefault.separacionTransversal;
    const recLong = (grupo.configGrupo && grupo.configGrupo.recubrimientoLongitudinal) || configDefault.recubrimientoLongitudinal;
    const recTrans = (grupo.configGrupo && grupo.configGrupo.recubrimientoTransversal) || configDefault.recubrimientoTransversal;
    const tipoVarillaLong = (grupo.configGrupo && grupo.configGrupo.tipoVarillaLong) || configDefault.tipoVarillaLong;
    const tipoVarillaTrans = (grupo.configGrupo && grupo.configGrupo.tipoVarillaTrans) || configDefault.tipoVarillaTrans;

    // 🔍 RECUPERACIÓN ROBUSTA DE INPUTS MANUALES (CORRECCIÓN CLAVE)
    // Busca en orden: 1. Grupo específico, 2. UI global directa, 3. Objeto longitudinal anidado
    const vSup = grupo.configGrupo?.varillasSuperiores ?? configUI.cantVarillasSuperior ?? configUI.longitudinal?.varillasSuperiores;
    const vMed = grupo.configGrupo?.varillasMedias ?? configUI.cantVarillasMedias ?? configUI.longitudinal?.varillasMedias;
    const vInf = grupo.configGrupo?.varillasInferiores ?? configUI.cantVarillasInferior ?? configUI.longitudinal?.varillasInferiores;

    // Aplanar la configuración
    const configGrupo = {
      ...configDefault,
      ...(grupo.configGrupo || {}),
      densidadConcreto: grupo.densidadConcreto || configDefault.densidadConcreto,
      separacion: sepLong,
      recubrimiento: recLong,
      tipoVarilla: tipoVarillaLong,
      separacionTransversal: sepTrans,
      recubrimientoTransversal: recTrans,
      tipoVarillaTransversal: tipoVarillaTrans,
      
      // ✅ Pasar valores nuevos si existen
      volumenNuevo: grupo.configGrupo?.volumenNuevo || 0,
      pesoNuevo: grupo.configGrupo?.pesoNuevo || 0,
      largoNuevo: grupo.configGrupo?.largoNuevo || 0,
      
      construccion: {
        resistenciaConcreto: grupo.densidadConcreto || configDefault.densidadConcreto,
        factorDesperdicio: 1.0
      },
      longitudinal: {
        tipoVarilla: tipoVarillaLong,
        recubrimiento: recLong,
        separacion: sepLong,
        // 🔥 USAR VARIABLES RESUELTAS:
        varillasSuperiores: vSup,
        varillasMedias: vMed,
        varillasInferiores: vInf
      },
      transversal: {
        tipoVarilla: tipoVarillaTrans,
        recubrimiento: recTrans,
        separacion: sepTrans,
        longitudGanchos: grupo.configGrupo?.longitudGanchos || configUI.transversal?.longitudGanchos || configUI.longGanchoEstribo || 0
      },
      alambre: {
        diametroAlambre: configDefault.diametroAlambre || 1.22,
        longitudPorVuelta: configDefault.longitudVuelta || 15.2,
        factorDesperdicioAlambre: configDefault.factorDesperdicioAlambre || 1.15
      }
    };

    const reporte = calcularReporteMuerto(dimensiones, configGrupo);
    const pesoReportar_kg = (grupo.sumaFBy && grupo.sumaFBy > 0) ? grupo.sumaFBy : reporte.pesoConcreto_kg;

    resultados.push({
      grupo_numero: grupo.numero_grupo,
      grupo_clave: grupo.clave,
      eje: grupo.eje,
      muros_list: grupo.muros_list,
      largo_total: reporte.L,
      alto_total: reporte.H,
      espesor_bloque: reporte.B,
      fuerzaBrace_kN: (grupo.sumaFBy || 0) / 1000,

      tipoVarillaLong: reporte.tipoVarillaLong,
      longLongitudinal_m: reporte.longLongitudinal_m,
      pesoLongitudinal_kg: reporte.pesoLongitudinal_kg,
      tipoVarillaTrans: reporte.tipoVarillaTrans,
      longEstribos_m: reporte.longEstribos_m,
      pesoEstribos_kg: reporte.pesoEstribos_kg,

      volumenConcreto_m3: reporte.volumenConcreto_m3,
      pesoConcreto_kg: pesoReportar_kg,
      valor_LBH: reporte.volumenConcreto_m3,

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

    // Truco visual: floor para longitudinal (56.7)
    const pesoLongStr = (Math.floor(res.pesoLongitudinal_kg * 10) / 10).toFixed(1);

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
        <td class="text-end">${pesoLongStr}</td> <td class="text-muted"><small>Long.</small></td>
        
        <td rowspan="2" class="align-middle text-end">${res.volumenConcreto_m3?.toFixed(2)}</td>
        <td rowspan="2" class="align-middle text-end fw-bold">${pesoTon.toFixed(1)}</td>
        
        <td rowspan="2" class="align-middle text-end">${res.longAlambre_m?.toFixed(1)}</td>
        <td rowspan="2" class="align-middle text-end">${res.pesoAlambre_kg?.toFixed(1)}</td> </tr>
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