/**
 * CÁLCULOS DE ARMADO TRIANGULAR (PRISMA)
 * Basado en la lógica de 'muertoRectangular.js' pero adaptando la geometría.
 * * DIFERENCIAS CLAVE CON RECTANGULAR:
 * 1. Volumen Concreto: (Base * Alto / 2) * Largo.
 * 2. Estribos: Geometría triangular (Base + 2 lados inclinados).
 */

// ================== CONSTANTES (Reutilizables) ==================
const PESO_ESPECIFICO_KG_M = {
  '#3': 0.560, '#4': 0.994, '#5': 1.552, '#6': 2.235, '#8': 3.973,
  '3': 0.560, '4': 0.994, '5': 1.552, '6': 2.235, '8': 3.973
};

const DEFAULTS = {
  RECUBRIMIENTO_CM: 4,
  SEP_LONG_CM: 25,
  SEP_TRANS_CM: 25,
  TIPO_VARILLA_LONG: '#4',
  TIPO_VARILLA_TRANS: '#3',
  GANCHO_SISMICO_M: 0.15 // Gancho estándar para cerrar el triángulo
};

// ================== AUXILIARES ==================
function obtenerPesoEspecifico(tipoVarilla) {
  if (!tipoVarilla) return PESO_ESPECIFICO_KG_M['#4'];
  let key = String(tipoVarilla).split(' ')[0].trim();
  if (!key.startsWith('#') && !isNaN(key)) key = `#${parseFloat(key)}`;
  return PESO_ESPECIFICO_KG_M[key] ?? PESO_ESPECIFICO_KG_M['#4'];
}

// ================== 1. CÁLCULO DE CONCRETO (PRISMA) ==================
export function calcularConcretoTriangular(dimensiones, densidad = 2400, factorDesperdicio = 1) {
  const { ancho, alto, largo } = dimensiones; // Largo suele ser la longitud del muerto corrido
  
  // LÓGICA: Área de un triángulo = (Base * Altura) / 2
  const area_seccion_m2 = (ancho * alto) / 2;
  const volumen_geom_m3 = area_seccion_m2 * largo;
  
  const peso_estructural_kg = volumen_geom_m3 * densidad; 
  const volumen_compra_m3 = volumen_geom_m3 * factorDesperdicio;

  return { largo, ancho, alto, volumen_geom_m3, volumen_compra_m3, peso_estructural_kg };
}

// ================== 2. CÁLCULO DE ACEROS ==================

// NOTA: El longitudinal es muy similar, pero usualmente se colocan menos varillas
// porque la sección se reduce hacia arriba.
export function calcularLongitudinalTriangular(dimensiones, config = {}) {
  const L = dimensiones.largo; 
  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_LONG;
  const pesoVarilla_kgm = obtenerPesoEspecifico(tipoVarilla);

  // Si no se especifica número, asumimos un armado mínimo triangular:
  // 2 varillas en esquinas inferiores + 1 varilla superior (Punta) = 3 varillas base
  let totalBarras = 3; 

  if (config.numeroBarras) {
      totalBarras = parseInt(config.numeroBarras);
  } else if (config.varillasSuperiores || config.varillasInferiores) {
      // Si el usuario especifica manualmente por capas
      const sup = parseInt(config.varillasSuperiores || 1);
      const inf = parseInt(config.varillasInferiores || 2);
      totalBarras = sup + inf;
  }
  
  const largoTotal_m = totalBarras * L;
  const peso_kg = largoTotal_m * pesoVarilla_kgm;

  return { tipoVarillaStr: tipoVarilla, totalBarrasLong: totalBarras, largoTotal_m, peso_kg };
}

// NOTA: Aquí está el cambio principal mencionado en el PDF [cite: 331]
export function calcularTransversalTriangular(dimensiones, config = {}) {
  const L = dimensiones.largo; 
  const B = dimensiones.ancho;      
  const H = dimensiones.alto;       

  const r_m = (config.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM) / 100;
  const sep_m = (config.separacion || DEFAULTS.SEP_TRANS_CM) / 100;
  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_TRANS;
  
  // 1. Definir dimensiones del núcleo confinado
  const baseNucleo = Math.max(B - 2 * r_m, 0);
  const altoNucleo = Math.max(H - 2 * r_m, 0);

  // 2. Calcular la longitud del lado inclinado (Hipotenusa) usando Pitágoras
  // Asumimos un triángulo isósceles para el estribo.
  // Cateto adyacente = baseNucleo / 2
  // Cateto opuesto = altoNucleo
  const ladoInclinado = Math.sqrt(Math.pow(baseNucleo / 2, 2) + Math.pow(altoNucleo, 2));

  // 3. Perímetro del Estribo Triangular
  // P = Base + LadoIzq + LadoDer + Ganchos
  const gancho = config.longitudGanchos ? parseFloat(config.longitudGanchos) : DEFAULTS.GANCHO_SISMICO_M;
  const longitudUno_m = baseNucleo + (2 * ladoInclinado) + gancho;

  // 4. Cantidad de estribos a lo largo del muerto
  const largoUtil = Math.max(L - 2 * r_m, 0);
  const cantidad = Math.ceil(largoUtil / sep_m) + 1;

  const pesoVarilla_kgm = obtenerPesoEspecifico(tipoVarilla);
  const longitudTotal_m = longitudUno_m * cantidad;
  const peso_kg = longitudTotal_m * pesoVarilla_kgm;

  return { tipoVarillaStr: tipoVarilla, cantidad, longitudUno_m, longitudTotal_m, peso_kg };
}

// (El cálculo de alambre es idéntico al rectangular, se puede importar o copiar)
export function calcularAlambre(nudos, config = {}) {
    const diametro_m = 0.00122; // 1.22mm default
    const longVuelta_m = 0.15;
    const factorDesp = 1.15;
    const longitudTotal_m = nudos * longVuelta_m * factorDesp;
    const peso_kg = (Math.PI * Math.pow(diametro_m/2, 2) * longitudTotal_m) * 7850;
    return { longitudTotal_m, peso_kg };
}

// ================== REPORTE MAESTRO TRIANGULAR ==================
export function calcularReporteMuertoTriangular(dimensiones, inputsUI = {}) {
    const conc = calcularConcretoTriangular(dimensiones, inputsUI.densidadConcreto);
    const long = calcularLongitudinalTriangular(conc, inputsUI.longitudinal);
    const trans = calcularTransversalTriangular(conc, inputsUI.transversal);
    
    const nudos = long.totalBarrasLong * trans.cantidad;
    const alambre = calcularAlambre(nudos);

    return {
        tipo: 'Triangular',
        volumenConcreto_m3: conc.volumen_geom_m3,
        pesoConcreto_kg: conc.peso_estructural_kg,
        
        aceroLongitudinal: {
            detalle: `${long.totalBarrasLong} barras ${long.tipoVarillaStr}`,
            peso_kg: long.peso_kg
        },
        aceroTransversal: {
            detalle: `${trans.cantidad} estribos triangulares`,
            longitudUnitario: trans.longitudUno_m,
            peso_kg: trans.peso_kg
        },
        pesoTotalArmado_kg: long.peso_kg + trans.peso_kg + alambre.peso_kg
    };
}