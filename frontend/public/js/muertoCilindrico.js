/**
 * CÁLCULOS DE ARMADO CILÍNDRICO (TIPO POZO) - VERSIÓN FINAL INTEGRADA
 * * CARACTERÍSTICAS TÉCNICAS:
 * 1. Geometría: Cilindro recto (pozo excavado).
 * 2. Recubrimiento: 7.5cm default (vaciado contra terreno).
 * 3. Longitudinal: Incluye longitud de ganchos/patas (Sup/Inf).
 * 4. Transversal: Estribos circulares individuales (Anillos).
 */

// ================== CONSTANTES ==================

const PESO_VARILLA_KG_M = {
  '#3': 0.560, '#4': 0.994, '#5': 1.552, '#6': 2.235, '#7': 3.042, '#8': 3.973,
  '3': 0.560, '4': 0.994, '5': 1.552, '6': 2.235, '7': 3.042, '8': 3.973
};

const DEFAULTS = {
  RECUBRIMIENTO_CM: 7.5, // Norma ACI para contacto contra suelo
  SEP_ANILLOS_CM: 20,
  ANCLAJE_SUP_CM: 40,    // Gancho o saliente superior
  ANCLAJE_INF_CM: 40,    // Gancho inferior (patas)
  TRASLAPE_FACTOR: 40,   // Veces el diámetro para cerrar anillo
  TIPO_VARILLA_VERT: '#5',
  TIPO_VARILLA_ANILLO: '#3',
  MIN_VARILLAS_LONG: 6   // Mínimo para formar jaula circular
};

// ================== AUXILIARES ==================

function obtenerPesoEspecifico(tipoVarilla) {
  if (!tipoVarilla) return PESO_VARILLA_KG_M['#4'];
  let key = String(tipoVarilla).split(' ')[0].trim();
  if (!key.startsWith('#') && !isNaN(key)) key = `#${parseFloat(key)}`;
  return PESO_VARILLA_KG_M[key] ?? PESO_VARILLA_KG_M['#4'];
}

function obtenerDiametroVarilla(tipoVarilla) {
  // Aproximación en mm basada en el número (#4 = 4/8" = 12.7mm)
  let numero = 4;
  let key = String(tipoVarilla).replace('#','').trim();
  if (!isNaN(key)) numero = parseFloat(key);
  return (numero / 8) * 0.0254; // Retorna metros
}

// ================== 1. CÁLCULO DE CONCRETO ==================

export function calcularConcretoCilindrico(dimensiones, densidad = 2400, factorDesperdicio = 1) {
  const D = parseFloat(dimensiones.diametro);
  const H = parseFloat(dimensiones.profundidad || dimensiones.altura); // Soporta ambos nombres

  if (!D || !H) return { volumen_m3: 0, peso_kg: 0 };

  const radio = D / 2;
  const volumen_geom_m3 = Math.PI * Math.pow(radio, 2) * H;
  const peso_estructural_kg = volumen_geom_m3 * densidad;
  const volumen_compra_m3 = volumen_geom_m3 * factorDesperdicio;

  return { diametro: D, profundidad: H, volumen_geom_m3, volumen_compra_m3, peso_estructural_kg };
}

// ================== 2. CÁLCULO DE ACEROS ==================

export function calcularLongitudinalCilindrico(concreto, config = {}) {
  const H = concreto.profundidad;
  const D = concreto.diametro;
  
  const rec_m = (config.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM) / 100;
  const anc_sup_m = (config.anclajeSuperior || DEFAULTS.ANCLAJE_SUP_CM) / 100;
  const anc_inf_m = (config.anclajeInferior || DEFAULTS.ANCLAJE_INF_CM) / 100;
  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_VERT;

  // Cantidad de Varillas: Manual o Automática
  let cantidad = 0;
  if (config.numeroBarras) {
      cantidad = parseInt(config.numeroBarras);
  } else {
      // Default automático: Mínimo 6
      cantidad = DEFAULTS.MIN_VARILLAS_LONG; 
  }

  // Validación de espaciamiento (Congestión)
  const diametroJaula = D - (2 * rec_m);
  const perimetroJaula = Math.PI * diametroJaula;
  const espaciamiento = perimetroJaula / cantidad;
  let alerta = null;
  if (espaciamiento < 0.10) alerta = "¡Alerta! Espaciamiento < 10cm (Congestión)";

  // Longitud Total
  // L = Profundidad + Gancho Arriba + Gancho Abajo
  // Nota: Si el recubrimiento inferior se descuenta de H, restarlo aquí. 
  // Asumiremos que H es excavación y la varilla flota sobre "panelas" de concreto.
  const largoUnitario_m = H + anc_sup_m + anc_inf_m - rec_m; 
  const largoTotal_m = largoUnitario_m * cantidad;
  
  const pesoMetro = obtenerPesoEspecifico(tipoVarilla);

  return { 
      tipoVarillaStr: tipoVarilla, 
      cantidad, 
      largoUnitario_m, 
      largoTotal_m, 
      peso_kg: largoTotal_m * pesoMetro,
      alerta 
  };
}

export function calcularTransversalCilindrico(concreto, config = {}) {
  const H = concreto.profundidad;
  const D = concreto.diametro;

  const rec_m = (config.recubrimiento || DEFAULTS.RECUBRIMIENTO_CM) / 100;
  const sep_m = (config.separacion || DEFAULTS.SEP_ANILLOS_CM) / 100;
  const tipoVarilla = config.tipoVarilla || DEFAULTS.TIPO_VARILLA_ANILLO;

  // 1. Geometría del Anillo
  const diametroAnillo = D - (2 * rec_m);
  const perimetro = Math.PI * diametroAnillo;
  
  // 2. Traslape para cerrar el anillo
  // Si no se da longitud exacta, usamos Factor * DiámetroVarilla (ej. 40 * 9mm = 36cm)
  const diametroVarilla_m = obtenerDiametroVarilla(tipoVarilla);
  const longitudTraslape = config.longitudGancho ? parseFloat(config.longitudGancho) 
                         : (DEFAULTS.TRASLAPE_FACTOR * diametroVarilla_m);

  const longitudUno_m = perimetro + longitudTraslape;

  // 3. Cantidad Vertical
  const cantidad = Math.ceil(H / sep_m) + 1; // +1 para arranque/cierre

  const pesoMetro = obtenerPesoEspecifico(tipoVarilla);
  const longitudTotal_m = longitudUno_m * cantidad;

  return {
      tipoVarillaStr: tipoVarilla,
      cantidad,
      longitudUno_m,
      longitudTotal_m,
      peso_kg: longitudTotal_m * pesoMetro,
      diametroAnillo
  };
}

export function calcularAlambreCilindrico(longitudinal, transversal, config = {}) {
  // Nudos = Varillas Verticales * Número de Anillos
  const nudos = longitudinal.cantidad * transversal.cantidad;
  
  const diam_alambre_mm = config.diametroAlambre || 1.22; // No 1.6, usar estándar alambre recocido #18 o #16
  const largo_vuelta_m = (config.longitudPorVuelta || 25) / 100;
  const factor = config.factorDesperdicio || 1.10;

  const longitudTotal_m = nudos * largo_vuelta_m * factor;
  
  // Peso específico acero = 7850 kg/m3
  const area_m2 = Math.PI * Math.pow((diam_alambre_mm/1000)/2, 2);
  const peso_kg = area_m2 * longitudTotal_m * 7850;

  return { nudos, longitudTotal_m, peso_kg };
}

// ================== 3. REPORTE MAESTRO INDIVIDUAL ==================

export function calcularReporteMuertoCilindrico(dimensiones, inputsUI = {}) {
  // Mapeo de configuración UI a configuración interna
  const configConc = {
      factorDesperdicio: inputsUI.construccion?.factorDesperdicio
  };
  
  // Aceptamos inputsUI.longitudinal O inputsUI.vertical (para compatibilidad)
  const inputLong = inputsUI.longitudinal || inputsUI.vertical || {};
  const configLong = {
      tipoVarilla: inputLong.tipoVarilla,
      recubrimiento: inputLong.recubrimiento,
      numeroBarras: inputLong.cantidad || inputLong.varillasLongitudinales, // Soporta ambos nombres
      anclajeSuperior: inputLong.anclajeSuperior,
      anclajeInferior: inputLong.anclajeInferior
  };

  const inputTrans = inputsUI.transversal || inputsUI.anillos || {};
  const configTrans = {
      tipoVarilla: inputTrans.tipoVarilla,
      recubrimiento: inputTrans.recubrimiento, // Usualmente el mismo que long, pero configurable
      separacion: inputTrans.separacion,
      longitudGancho: inputTrans.longitudGancho
  };

  const concreto = calcularConcretoCilindrico(dimensiones, inputsUI.construccion?.resistenciaConcreto, configConc.factorDesperdicio);
  const longitudinal = calcularLongitudinalCilindrico(concreto, configLong);
  const transversal = calcularTransversalCilindrico(concreto, configTrans);
  const alambre = calcularAlambreCilindrico(longitudinal, transversal, inputsUI.alambre);

  return {
      tipo: 'Cilíndrico',
      // Datos Geométricos
      diametro: concreto.diametro,
      profundidad: concreto.profundidad,
      volumenConcreto_m3: concreto.volumen_geom_m3,
      pesoConcreto_kg: concreto.peso_estructural_kg,
      
      // Aceros para tabla
      tipoVarillaLong: longitudinal.tipoVarillaStr,
      longLongitudinal_m: longitudinal.largoTotal_m,
      pesoLongitudinal_kg: longitudinal.peso_kg,
      detalleLongitudinal: `${longitudinal.cantidad} varillas de ${longitudinal.largoUnitario_m.toFixed(2)}m`,
      alertaLongitudinal: longitudinal.alerta,

      tipoVarillaTrans: transversal.tipoVarillaStr,
      longEstribos_m: transversal.longitudTotal_m,
      pesoEstribos_kg: transversal.peso_kg,
      detalleTransversal: `${transversal.cantidad} anillos Ø${transversal.diametroAnillo.toFixed(2)}m`,

      longAlambre_m: alambre.longitudTotal_m,
      pesoAlambre_kg: alambre.peso_kg,
      
      pesoTotalArmado_kg: longitudinal.peso_kg + transversal.peso_kg + alambre.peso_kg,
      pesoTotal_kg: concreto.peso_estructural_kg + longitudinal.peso_kg + transversal.peso_kg
  };
}

// ================== 4. UTILIDADES EXTRA ==================

/**
 * Sugiere dimensiones D y H basadas en la carga del Brace
 */
export function sugerirDimensionesCilindro(cargaKn, capacidadSueloKpa = 100) {
    // FS = 1.5 a 2.0 (Resistencia por punta + Fricción lateral)
    // Esta es una aproximación MUY simplificada.
    // Asumimos que la fricción lateral aporta el 60% de la resistencia.
    
    const cargaSeguridad = cargaKn * 2.0; // FS
    
    // Área base necesaria si solo fuera por punta (conservador)
    const areaBase = cargaSeguridad / (capacidadSueloKpa); 
    let diametro = Math.sqrt((areaBase * 4) / Math.PI);
    
    // Redondear a medidas constructivas (cada 10cm)
    diametro = Math.ceil(diametro * 10) / 10;
    if (diametro < 0.60) diametro = 0.60; // Mínimo constructivo para que entre un obrero

    // Altura sugerida (relación esbeltez típica para fricción)
    let altura = Math.max(1.5, diametro * 2.5);
    
    return { diametro, altura };
}

// ================== 5. REPORTE BATCH (PROYECTO) ==================

/**
 * Procesa un array de grupos de muertos cilíndricos y devuelve
 * el reporte para cada uno.
 * @param {Array} grupos Array de objetos con datos del grupo
 * @param {Object} configArmado Configuración global de armado
 */
export function calcularReporteProyectoCilindrico(grupos, configArmado) {
    if (!grupos || !Array.isArray(grupos)) {
        console.warn('[CILINDRICO] calcularReporteProyectoCilindrico recibió grupos inválidos');
        return [];
    }

    return grupos.map((grupo, index) => {
        // Normalizar dimensiones
        // Si viene del preparador de rectangular, puede tener 'ancho' en vez de diametro
        const dimensiones = {
            diametro: parseFloat(grupo.diametro || grupo.ancho || 0),
            profundidad: parseFloat(grupo.profundidad || grupo.alto || 2.0)
        };

        // Si la configuración viene dentro del grupo, usarla, si no usar la global
        const configLocal = {
            ...configArmado,
            ...(grupo.configGrupo || {})
        };

        const reporte = calcularReporteMuertoCilindrico(dimensiones, configLocal);

        // Añadir metadatos del grupo al reporte
        return {
            ...reporte,
            id: grupo.id || index + 1,
            eje: grupo.eje || '-',
            cantidadMuros: grupo.cantidadMuros || 1,
            nombre: grupo.nombre || `C${index + 1}`
        };
    });
}