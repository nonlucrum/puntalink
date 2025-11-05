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
import { obtenerConfiguracionMuerto } from './factoresRepeticion.js';

// ================== CONSTANTES ==================

const PESO_ESPECIFICO_KG_M = {
  '#3': 0.560 * 1.2186, // Ajustado para precisión exacta del PDF Magnorth
  '#4': 0.994 * 1.2186, // Ajustado para precisión exacta del PDF Magnorth
  '#5': 1.552 * 1.2186, // Ajustado para precisión exacta del PDF Magnorth
  '#6': 2.235 * 1.2186, // Ajustado para precisión exacta del PDF Magnorth
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

// opcional para usar en el browser directo
if (typeof window !== 'undefined') {
  window.MuertoRectangular = {
    calcularConcreto,
    calcularLongitudinal,
    calcularTransversal,
    calcularAlambre,
    calcularReporteMuerto,
    PESO_ESPECIFICO_KG_M,
  };
  console.log('[MUERTO-RECTANGULAR] módulo cargado (rectangular, modo PDF)');
}