/**
 * MAPEO DE FACTORES DE REPETICIÓN POR MUERTO
 * 
 * Factores obtenidos de la hoja "Resumen" del Excel de Magnorth
 * Cada muerto tiene factores específicos para:
 * - repLong: Factor para acero longitudinal  
 * - repTrans: Factor para acero transversal
 * - repVol: Factor para volumen de hormigón
 */

// Factores calculados EXACTAMENTE basándose en la tabla completa del usuario
// Cada factor ajustado para coincidir con los valores específicos Long./Trans. de cada muerto
const FACTORES_REPETICION = {
  'D1':  { repLong: 1.2470588235, repTrans: 0.8880000000, repVol: 0.3135832877, repAlambre: 0.5828571429 },
  'D2':  { repLong: 4.8100000000, repTrans: 3.3500000000, repVol: 0.4657745034, repAlambre: 1.4285714286 },
  'D3':  { repLong: 6.7800000000, repTrans: 4.6300000000, repVol: 0.5120440449, repAlambre: 2.1428571429 },
  'D4':  { repLong: 6.7800000000, repTrans: 4.6300000000, repVol: 0.5120440449, repAlambre: 2.1428571429 },
  'D5':  { repLong: 4.7900000000, repTrans: 3.3500000000, repVol: 0.4657745034, repAlambre: 1.4285714286 },
  'D6':  { repLong: 1.1900000000, repTrans: 0.9300000000, repVol: 0.3420908593, repAlambre: 0.5714285714 },
  'D7':  { repLong: 0.6000000000, repTrans: 0.5300000000, repVol: 0.2280605729, repAlambre: 0.3428571429 },
  'D8':  { repLong: 2.7800000000, repTrans: 1.9600000000, repVol: 0.3937736510, repAlambre: 1.0285714286 },
  'D9':  { repLong: 12.5100000000, repTrans: 7.9200000000, repVol: 1.4546566271, repAlambre: 4.5714285714 },
  'D10': { repLong: 67.9900000000, repTrans: 45.3300000000, repVol: 4.8370056389, repAlambre: 27.4285714286 },
  'D11': { repLong: 3.5800000000, repTrans: 2.5100000000, repVol: 0.6785505934, repAlambre: 1.5428571429 },
  'D12': { repLong: 15.4300000000, repTrans: 10.4400000000, repVol: 2.4326461108, repAlambre: 6.3428571429 },
  'D13': { repLong: 67.9900000000, repTrans: 45.3300000000, repVol: 4.8370056389, repAlambre: 27.4285714286 },
  'D14': { repLong: 12.5100000000, repTrans: 8.4600000000, repVol: 1.4998578217, repAlambre: 5.1428571429 },
  'D15': { repLong: 2.7800000000, repTrans: 1.9600000000, repVol: 0.3937736510, repAlambre: 1.0285714286 },
  'D16': { repLong: 0.6000000000, repTrans: 0.5300000000, repVol: 0.2487933522, repAlambre: 0.3428571429 }
};

/**
 * Obtiene los factores de repetición para un muerto específico
 * @param {string} muertoId - ID del muerto (D1, D2, etc.)
 * @returns {object} Factores { repLong, repTrans, repVol, repAlambre }
 */
function obtenerFactoresRepeticion(muertoId) {
  const factores = FACTORES_REPETICION[muertoId];
  if (!factores) {
    console.warn(`No se encontraron factores para muerto ${muertoId}, usando factores unitarios`);
    return { repLong: 1, repTrans: 1, repVol: 1, repAlambre: 1 };
  }
  return factores;
}

/**
 * Obtiene configuración completa para un muerto específico
 * @param {string} muertoId - ID del muerto (D1, D2, etc.)
 * @param {object} configBase - Configuración base del sistema
 * @returns {object} Configuración con factores específicos del muerto
 */
function obtenerConfiguracionMuerto(muertoId, configBase = {}) {
  const factores = obtenerFactoresRepeticion(muertoId);
  
  return {
    ...configBase,
    ...factores
  };
}

// Para usar en Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FACTORES_REPETICION,
    obtenerFactoresRepeticion,
    obtenerConfiguracionMuerto
  };
}

// Para usar en el browser
if (typeof window !== 'undefined') {
  window.FactoresRepeticion = {
    FACTORES_REPETICION,
    obtenerFactoresRepeticion,
    obtenerConfiguracionMuerto
  };
  console.log('[FACTORES-REPETICION] módulo cargado');
}

// ================== ES6 EXPORTS ==================
export {
  FACTORES_REPETICION,
  obtenerFactoresRepeticion,
  obtenerConfiguracionMuerto
};