/**
 * MÓDULO DE CÁLCULO DE ARMADO CILÍNDRICO PARA MUERTOS
 * 
 * Este módulo contiene todas las funciones necesarias para calcular
 * el armado de macizos de anclaje cilíndricos, incluyendo:
 * - Cálculo de concreto
 * - Armado longitudinal (varillas verticales)
 * - Armado transversal (estribos circulares)
 * - Alambre de amarre
 * - Reportes y resúmenes
 * 
 * Basado en especificaciones técnicas para construcción de muertos cilíndricos
 */

// ===== CONSTANTES =====
const DENSIDAD_CONCRETO_KG_M3_DEFAULT = 2400;
const DENSIDAD_ACERO_KG_M3 = 7850;
const PI = Math.PI;

// Pesos por metro de varillas (kg/m)
const PESO_VARILLA_KG_M = {
  '#3': 0.560,  // 3/8"
  '#4': 0.994,  // 1/2"
  '#5': 1.552,  // 5/8"
  '#6': 2.235,  // 3/4"
  '#7': 3.042,  // 7/8"
  '#8': 3.973   // 1"
};

// Diámetros de varillas (m)
const DIAMETRO_VARILLA_M = {
  '#3': 0.009525,  // 3/8"
  '#4': 0.01270,   // 1/2"
  '#5': 0.01588,   // 5/8"
  '#6': 0.01905,   // 3/4"
  '#7': 0.02222,   // 7/8"
  '#8': 0.02540    // 1"
};

/**
 * Calcula el volumen y peso del concreto para un muerto cilíndrico
 */
function calcularConcretoCilindrico(dimensiones, densidadConcreto = DENSIDAD_CONCRETO_KG_M3_DEFAULT) {
  const { diametro, altura } = dimensiones;
  const radio = diametro / 2;
  
  const volumen_m3 = PI * radio * radio * altura;
  const peso_kg = volumen_m3 * densidadConcreto;
  
  return {
    volumen_m3: volumen_m3,
    peso_kg: peso_kg,
    densidad_kg_m3: densidadConcreto
  };
}

/**
 * Calcula el armado longitudinal (varillas verticales) para muerto cilíndrico
 */
function calcularLongitudinalCilindrico(dimensiones, config) {
  const { diametro, altura } = dimensiones;
  const { 
    tipoVarilla = '#4',
    recubrimientoCm = 7.5,
    cantVarillasLongitudinales = 8,
    longAnclajeSupCm = 40,
    longAnclajeInfCm = 60
  } = config;
  
  // Validaciones
  if (!PESO_VARILLA_KG_M[tipoVarilla]) {
    throw new Error(`Tipo de varilla no válido: ${tipoVarilla}`);
  }
  
  const recubrimiento = recubrimientoCm / 100; // convertir a metros
  const longAnclajeSup = longAnclajeSupCm / 100;
  const longAnclajeInf = longAnclajeInfCm / 100;
  
  // Longitud de cada varilla = altura + anclajes
  const longitudPorVarilla = altura + longAnclajeSup + longAnclajeInf;
  
  // Longitud total
  const longitudTotal = longitudPorVarilla * cantVarillasLongitudinales;
  
  // Peso total
  const peso = longitudTotal * PESO_VARILLA_KG_M[tipoVarilla];
  
  // Verificar que las varillas quepan en el perímetro
  const diametroArmado = diametro - (2 * recubrimiento);
  const perimetroArmado = PI * diametroArmado;
  const espaciamientoRequerido = perimetroArmado / cantVarillasLongitudinales;
  const espaciamientoMinimo = 0.15; // 15 cm mínimo
  
  let observaciones = [];
  if (espaciamientoRequerido < espaciamientoMinimo) {
    observaciones.push(`Espaciamiento muy pequeño: ${(espaciamientoRequerido * 100).toFixed(1)}cm (mín. 15cm)`);
  }
  
  return {
    cantidad: cantVarillasLongitudinales,
    tipoVarilla: tipoVarilla,
    longitudPorVarilla: longitudPorVarilla,
    longitudTotal: longitudTotal,
    peso: peso,
    espaciamiento: espaciamientoRequerido,
    diametroArmado: diametroArmado,
    observaciones: observaciones
  };
}

/**
 * Calcula el armado transversal (estribos circulares) para muerto cilíndrico
 */
function calcularTransversalCilindrico(dimensiones, config) {
  const { diametro, altura } = dimensiones;
  const { 
    tipoVarillaEstribo = '#3',
    separacionEstriboCm = 20,
    recubrimientoCm = 7.5,
    longGanchoEstriboCm = 15,
    factorTraslape = 1.4
  } = config;
  
  // Validaciones
  if (!PESO_VARILLA_KG_M[tipoVarillaEstribo]) {
    throw new Error(`Tipo de varilla de estribo no válido: ${tipoVarillaEstribo}`);
  }
  
  const separacion = separacionEstriboCm / 100; // convertir a metros
  const recubrimiento = recubrimientoCm / 100;
  const longGancho = longGanchoEstriboCm / 100;
  
  // Diámetro interior del estribo
  const diametroEstribo = diametro - (2 * recubrimiento);
  
  // Cantidad de estribos
  const cantidadEstribos = Math.ceil(altura / separacion) + 1; // +1 para el último
  
  // Longitud de cada estribo circular = perímetro + ganchos + traslape
  const perimetroEstribo = PI * diametroEstribo;
  const longitudPorEstribo = perimetroEstribo + (2 * longGancho) * factorTraslape;
  
  // Longitud total
  const longitudTotal = longitudPorEstribo * cantidadEstribos;
  
  // Peso total
  const peso = longitudTotal * PESO_VARILLA_KG_M[tipoVarillaEstribo];
  
  return {
    cantidad: cantidadEstribos,
    tipoVarilla: tipoVarillaEstribo,
    diametroEstribo: diametroEstribo,
    longitudPorEstribo: longitudPorEstribo,
    longitudTotal: longitudTotal,
    peso: peso,
    separacion: separacion,
    longGancho: longGancho
  };
}

/**
 * Calcula el alambre de amarre para muerto cilíndrico
 */
function calcularAlambreCilindrico(dimensiones, config, longitudinal, transversal) {
  const { 
    diametroAlambreMm = 1.6,
    longitudPorVueltaCm = 25,
    factorDesperdicioAlambre = 1.1
  } = config;
  
  const longitudPorVuelta = longitudPorVueltaCm / 100; // convertir a metros
  
  // Intersecciones = varillas longitudinales × estribos
  const intersecciones = longitudinal.cantidad * transversal.cantidad;
  
  // Longitud total de alambre
  const longitudTotal = intersecciones * longitudPorVuelta * factorDesperdicioAlambre;
  
  // Peso del alambre (aproximado)
  const diametroAlambre = diametroAlambreMm / 1000; // convertir a metros
  const pesoAlambre = longitudTotal * PI * Math.pow(diametroAlambre / 2, 2) * DENSIDAD_ACERO_KG_M3;
  
  return {
    intersecciones: intersecciones,
    longitudPorVuelta: longitudPorVuelta,
    longitudTotal: longitudTotal,
    peso: pesoAlambre,
    diametroMm: diametroAlambreMm
  };
}

/**
 * Genera el reporte completo para un muerto cilíndrico
 */
function calcularReporteCilindrico(dimensiones, config) {
  // Validar dimensiones
  if (!dimensiones.diametro || !dimensiones.altura) {
    throw new Error('Dimensiones inválidas del muerto cilíndrico');
  }
  
  // 1. Concreto
  const densidadConcreto = config.factorDesperdicio * DENSIDAD_CONCRETO_KG_M3_DEFAULT;
  const concreto = calcularConcretoCilindrico(dimensiones, densidadConcreto);
  
  // 2. Acero longitudinal
  const longitudinal = calcularLongitudinalCilindrico(dimensiones, config);
  
  // 3. Estribos circulares
  const transversal = calcularTransversalCilindrico(dimensiones, config);
  
  // 4. Alambre
  const alambre = calcularAlambreCilindrico(dimensiones, config, longitudinal, transversal);
  
  // Totales
  const pesoTotal_kg = concreto.peso_kg + longitudinal.peso + transversal.peso + alambre.peso;
  
  return {
    // Dimensiones
    diametro: dimensiones.diametro,
    altura: dimensiones.altura,
    
    // Concreto
    volumenConcreto: concreto.volumen_m3,
    pesoConcreto: concreto.peso_kg,
    
    // Longitudinal
    cantidadLongitudinal: longitudinal.cantidad,
    longitudTotalLongitudinal: longitudinal.longitudTotal,
    pesoLongitudinal: longitudinal.peso,
    
    // Transversal
    cantidadTransversal: transversal.cantidad,
    longitudTotalTransversal: transversal.longitudTotal,
    pesoTransversal: transversal.peso,
    
    // Alambre
    longitudAlambre: alambre.longitudTotal,
    pesoAlambre: alambre.peso,
    
    // Totales
    pesoTotal: pesoTotal_kg,
    
    // Detalles adicionales
    detalles: {
      longitudinal: longitudinal,
      transversal: transversal,
      alambre: alambre,
      concreto: concreto
    }
  };
}

/**
 * Calcula el resumen de proyecto para múltiples muertos cilíndricos
 */
function calcularResumenProyectoCilindrico(muertos, config) {
  let totalConcreto = 0;
  let totalAceroLongitudinal = 0;
  let totalAceroTransversal = 0;
  let totalAlambre = 0;
  let totalPeso = 0;
  
  const reporteDetallado = [];
  
  muertos.forEach((muerto, index) => {
    const reporte = calcularReporteCilindrico(muerto.dimensiones, config);
    
    reporteDetallado.push({
      id: muerto.id || `C${index + 1}`,
      ...reporte
    });
    
    totalConcreto += reporte.volumenConcreto;
    totalAceroLongitudinal += reporte.pesoLongitudinal;
    totalAceroTransversal += reporte.pesoTransversal;
    totalAlambre += reporte.pesoAlambre;
    totalPeso += reporte.pesoTotal;
  });
  
  return {
    reporteDetallado,
    resumen: {
      totalMuertos: muertos.length,
      totalConcreto_m3: totalConcreto,
      totalAceroLongitudinal_kg: totalAceroLongitudinal,
      totalAceroTransversal_kg: totalAceroTransversal,
      totalAcero_kg: totalAceroLongitudinal + totalAceroTransversal,
      totalAlambre_kg: totalAlambre,
      totalPeso_kg: totalPeso,
      totalPeso_ton: totalPeso / 1000
    }
  };
}

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Calcula las dimensiones óptimas para un muerto cilíndrico basado en la carga
 */
function calcularDimensionesOptimas(carga_kN, factorSeguridad = 2.0) {
  // Cálculo simplificado basado en resistencia del suelo
  const areaRequerida = (carga_kN * factorSeguridad) / 100; // Asumiendo 100 kPa de capacidad del suelo
  const diametro = Math.sqrt(4 * areaRequerida / PI);
  const altura = Math.max(1.5, diametro * 0.8); // Altura mínima 1.5m o 80% del diámetro
  
  return {
    diametro: Math.max(1.0, diametro), // Diámetro mínimo 1.0m
    altura: altura
  };
}

/**
 * Valida la configuración de armado cilíndrico
 */
function validarConfiguracionCilindrica(config) {
  const errores = [];
  
  if (!config.tipoVarilla || !PESO_VARILLA_KG_M[config.tipoVarilla]) {
    errores.push('Tipo de varilla longitudinal no válido');
  }
  
  if (!config.tipoVarillaEstribo || !PESO_VARILLA_KG_M[config.tipoVarillaEstribo]) {
    errores.push('Tipo de varilla de estribo no válido');
  }
  
  if (config.cantVarillasLongitudinales < 6) {
    errores.push('Cantidad mínima de varillas longitudinales: 6');
  }
  
  if (config.separacionEstriboCm > 30) {
    errores.push('Separación máxima de estribos: 30cm');
  }
  
  if (config.recubrimientoCm < 5) {
    errores.push('Recubrimiento mínimo: 5cm');
  }
  
  return errores;
}

// ===== EXPORTAR FUNCIONES =====

// Exportaciones ES6 para imports
export {
  calcularConcretoCilindrico,
  calcularLongitudinalCilindrico,
  calcularTransversalCilindrico,
  calcularAlambreCilindrico,
  calcularReporteCilindrico,
  calcularResumenProyectoCilindrico,
  calcularDimensionesOptimas,
  validarConfiguracionCilindrica,
  PESO_VARILLA_KG_M,
  DIAMETRO_VARILLA_M
};

// Las funciones se exponen globalmente para ser usadas desde dashboard.js
if (typeof window !== 'undefined') {
  window.calcularConcretoCilindrico = calcularConcretoCilindrico;
  window.calcularLongitudinalCilindrico = calcularLongitudinalCilindrico;
  window.calcularTransversalCilindrico = calcularTransversalCilindrico;
  window.calcularAlambreCilindrico = calcularAlambreCilindrico;
  window.calcularReporteCilindrico = calcularReporteCilindrico;
  window.calcularResumenProyectoCilindrico = calcularResumenProyectoCilindrico;
  window.calcularDimensionesOptimas = calcularDimensionesOptimas;
  window.validarConfiguracionCilindrica = validarConfiguracionCilindrica;
}

// Para uso en Node.js (si se requiere)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcularConcretoCilindrico,
    calcularLongitudinalCilindrico,
    calcularTransversalCilindrico,
    calcularAlambreCilindrico,
    calcularReporteCilindrico,
    calcularResumenProyectoCilindrico,
    calcularDimensionesOptimas,
    validarConfiguracionCilindrica,
    PESO_VARILLA_KG_M,
    DIAMETRO_VARILLA_M
  };
}