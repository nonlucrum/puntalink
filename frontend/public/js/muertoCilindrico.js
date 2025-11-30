/**
 * CÁLCULOS DE ARMADO CILÍNDRICO (MUERTO AISLADO / DEADMAN)
 * Basado en metodología Magnorth:
 * - Docs: MELI12-EJE01 (Tablas de diseño)
 * - Docs: CalculoMateriales_MuertoCilindrico_Anotado (Fórmulas manuscritas)
 */

// ================== CONSTANTES ==================
// Pesos específicos de varillas (kg/m)
const PESO_ESPECIFICO_KG_M = {
  '#3': 0.560, '#4': 0.994, '#5': 1.552, '#6': 2.235, '#8': 3.973,
  '3': 0.560, '4': 0.994, '5': 1.552, '6': 2.235, '8': 3.973
};

// Densidades de materiales (kg/m³)
const DENSIDAD_ACERO_KG_M3 = 7850; // [cite: 375]
const DENSIDAD_CONCRETO_KG_M3 = 2400; // [cite: 216]

// Helper para obtener peso lineal de la varilla
function obtenerPesoEspecifico(tipoVarilla) {
  let key = String(tipoVarilla).split(' ')[0].trim().replace('#', '').replace('No.', '');
  return PESO_ESPECIFICO_KG_M[key] ?? 0.994; // Default a #4
}

// ================== 1. CÁLCULO DE CONCRETO ==================
// Fórmula: Volumen = (π/4) * D² * H [cite: 259]
function calcularConcreto(dimensiones, config) {
  const D_m = dimensiones.diametro_mm / 1000; 
  const H_m = dimensiones.profundidad_mm / 1000;
  
  const area_basal_m2 = (Math.PI / 4) * Math.pow(D_m, 2);
  const volumen_geom_m3 = area_basal_m2 * H_m;
  
  // Peso estructural (sin desperdicio) para validación de uplift
  const peso_concreto_kg = volumen_geom_m3 * DENSIDAD_CONCRETO_KG_M3;
  
  // Volumen de compra (incluye factor de desperdicio)
  const volumen_compra_m3 = volumen_geom_m3 * config.factorDesperdicioConcreto;

  return { 
    D_m, 
    H_m, 
    volumen_geom_m3, 
    volumen_compra_m3, 
    peso_concreto_kg 
  };
}

// ================== 2. CÁLCULO DE ACERO VERTICAL ==================
// Fórmula: Acv = Altura * #Varillas [cite: 275]
function calcularAceroVertical(concreto, config) {
  const pesoMetro = obtenerPesoEspecifico(config.tipoVarillaVert); // Default #4 [cite: 280]
  const numVarillas = config.cantVarillasVert || 4; // Default 4 [cite: 284]
  
  // Longitud total = Altura del muerto * Número de varillas
  const longitud_total_m = concreto.H_m * numVarillas;
  const peso_unitario_kg = longitud_total_m * pesoMetro;

  return {
    descripcion: `${numVarillas} Varillas ${config.tipoVarillaVert}`,
    longitud_total_m,
    peso_unitario_kg // Peso para 1 muerto
  };
}

// ================== 3. CÁLCULO DE ANILLOS (ESTRIBOS) ==================
// Fórmula: Aca = #Anillos * Perímetro * PesoLineal [cite: 288]
function calcularAceroAnillos(concreto, config) {
  const pesoMetro = obtenerPesoEspecifico(config.tipoVarillaAnillo); // Default #3 [cite: 295]
  
  // Determinar cantidad de anillos
  // PDF: "Separados 250 mm" [cite: 145] O "3 estribos por cada muerto" [cite: 173]
  let numAnillos;
  if (config.usarSeparacion && config.separacionAnillosMm > 0) {
      numAnillos = Math.ceil((concreto.H_m * 1000) / config.separacionAnillosMm) + 1;
  } else {
      numAnillos = config.cantAnillos || 3;
  }

  // Geometría del anillo (con recubrimiento)
  const recubrimiento_m = (config.recubrimientoMm || 75) / 1000;
  const diametro_anillo_m = concreto.D_m - (2 * recubrimiento_m);
  
  if (diametro_anillo_m <= 0) return { peso_unitario_kg: 0 };

  // Longitud 1 anillo = Perímetro + Traslape
  const traslape_m = config.longitudTraslape_m || 0.40;
  const longitud_uno_m = (Math.PI * diametro_anillo_m) + traslape_m;
  
  const longitud_total_m = longitud_uno_m * numAnillos;
  const peso_unitario_kg = longitud_total_m * pesoMetro;

  return {
    descripcion: `${numAnillos} Anillos ${config.tipoVarillaAnillo}`,
    num_anillos: numAnillos,
    longitud_total_m,
    peso_unitario_kg
  };
}

// ================== 4. CÁLCULO DE ALAMBRE (AMARRES) ==================
// Fórmula: m = ρ * V = 7850 * (π/4 * ϕ² * L) 
function calcularAlambre(aceroVert, aceroAnillos, config) {
  const numVarillas = config.cantVarillasVert || 4;
  const numAnillos = aceroAnillos.num_anillos || 0;
  
  // Número de intersecciones (nudos)
  const num_nudos = numVarillas * numAnillos;
  
  // Longitud total de alambre (Default 0.35m por amarre [cite: 360])
  const longitud_por_amarre = config.longitudAmarre_m || 0.35; 
  const longitud_total_m = num_nudos * longitud_por_amarre;
  
  // Cálculo de peso usando densidad volumétrica del acero
  // Diametro Alambre default 1.22mm [cite: 366]
  const diametro_alambre_m = (config.diametroAlambreMm || 1.22) / 1000; 
  const radio_m = diametro_alambre_m / 2;
  
  const volumen_alambre_m3 = Math.PI * Math.pow(radio_m, 2) * longitud_total_m;
  const peso_unitario_kg = volumen_alambre_m3 * DENSIDAD_ACERO_KG_M3;

  return {
    num_nudos,
    longitud_total_m,
    peso_unitario_kg // Peso para 1 muerto
  };
}

// ================== 5. FUNCIÓN PRINCIPAL (COORDINADOR) ==================
export function calcularMacizosCilindricos(listaMuros, configUI = {}) {
  const resultados = [];

  listaMuros.forEach(muro => {
    // 1. Configuración fusionada
    const config = {
      factorDesperdicioConcreto: 1.05,
      tipoVarillaVert: '#4',
      tipoVarillaAnillo: '#3',
      cantVarillasVert: 4,
      cantAnillos: 3, 
      usarSeparacion: false,
      separacionAnillosMm: 250,
      recubrimientoMm: 75,
      longitudAmarre_m: 0.35,
      diametroAlambreMm: 1.22,
      ...configUI,
      ...muro.configOverride 
    };

    // 2. Extracción de inputs manuales
    const dimensiones = {
      diametro_mm: parseFloat(muro.diametro_mm || 0),
      profundidad_mm: parseFloat(muro.profundidad_mm || 0)
    };
    const cantidad_muertos = parseInt(muro.cantidad_muertos || 0);

    if (dimensiones.diametro_mm <= 0 || dimensiones.profundidad_mm <= 0) {
        return; // Saltar inválidos
    }

    // 3. Ejecución de Cálculos
    const conc = calcularConcreto(dimensiones, config);
    const aceroV = calcularAceroVertical(conc, config);
    const aceroA = calcularAceroAnillos(conc, config);
    const alambre = calcularAlambre(aceroV, aceroA, config);

    // 4. Totales por Muro
    const totales = {
      volumen_concreto_compra: conc.volumen_compra_m3 * cantidad_muertos,
      peso_acero_vert: aceroV.peso_unitario_kg * cantidad_muertos,
      peso_acero_anillo: aceroA.peso_unitario_kg * cantidad_muertos,
      peso_alambre: alambre.peso_unitario_kg * cantidad_muertos
    };

    resultados.push({
      id_muro: muro.id,
      input: {
        diametro: dimensiones.diametro_mm,
        profundidad: dimensiones.profundidad_mm,
        cantidad: cantidad_muertos
      },
      unitario: {
        volumen_m3: conc.volumen_geom_m3,
        peso_concreto_kg: conc.peso_concreto_kg,
        acero_vert_kg: aceroV.peso_unitario_kg,
        acero_anillo_kg: aceroA.peso_unitario_kg,
        alambre_kg: alambre.peso_unitario_kg
      },
      total_muro: totales
    });
  });

  return resultados;
}

/**
 * Calcula la profundidad necesaria basándose en la Presión Pasiva del Suelo.
 * Fuente: PDF Página 3, Nota 30 "La presión mínima permitida... debe ser de 1500 psf".
 *
 * @param {number} fuerzaTotalKg Fuerza total (FBy) que debe resistir el grupo de puntales.
 * @param {number} numMuertos Cantidad de puntales (braces) asignados al muro.
 * @param {number} diametroMm Diámetro del muerto seleccionado en mm (ej. 914).
 * @returns {number} Profundidad recomendada en mm (ajustada a estándares constructivos).
 */
export function obtenerProfundidadRecomendada(fuerzaTotalKg, numMuertos, diametroMm) {
    // Validación básica
    if (!fuerzaTotalKg || fuerzaTotalKg <= 0) return 0;
    if (!numMuertos || numMuertos <= 0) numMuertos = 1;
    if (!diametroMm || diametroMm <= 0) diametroMm = 914; // Default 36"

    // 1. Constantes de Ingeniería (Según PDF Nota 30)
    const PRESION_SUELO_PSF = 1500; 
    // Conversión: 1500 lb/ft² ≈ 7323.6 kg/m²
    const PRESION_SUELO_KG_M2 = 7323.6; 
    
    // Factor de Seguridad (FS)
    // Se deduce un FS de 1.5 al comparar la carga del muro P283 (7.7 ton) 
    // con la profundidad seleccionada en la Tabla 1 del PDF (1.82m vs 1.21m).
    const FACTOR_SEGURIDAD = 1.5; 

    // 2. Calcular Carga de Diseño por Muerto
    const fuerzaIndividual = fuerzaTotalKg / numMuertos;
    const capacidadRequerida = fuerzaIndividual * FACTOR_SEGURIDAD;

    // 3. Calcular Altura Necesaria
    // Fórmula: Capacidad = (Diámetro_m * Altura_m) * Presión_Suelo
    const diametroM = diametroMm / 1000;
    const alturaNecesariaM = capacidadRequerida / (diametroM * PRESION_SUELO_KG_M2);
    
    let alturaCalculadaMm = alturaNecesariaM * 1000;

    // 4. "Snap" (Ajuste) a medidas estándar de construcción
    // El Excel y PDF usan incrementos de 6 pulgadas (aprox 150mm)
    // Lista basada en las profundidades disponibles en el archivo MC.csv
    const profundidadesEstandar = [
        610, 762, 914, 1067, 1219, 1372, 1524, 
        1676, 1829, 1981, 2134, 2286, 2438, 2591, 2743
    ];

    // Buscar la primera medida estándar que sea mayor o igual a lo calculado
    const profundidadFinal = profundidadesEstandar.find(p => p >= alturaCalculadaMm);

    // Si la fuerza es muy grande y supera la tabla (más de 2.7m), devolvemos el máximo
    return profundidadFinal || 2743;
}



// ================== 6. GENERADOR HTML (OUTPUT) ==================
export function generarTablaResultadosCilindricos(resultados) {
  // Estilo base para mensaje vacío
  if (!resultados || !resultados.length) {
    return '<p style="color: #a4b1cd; padding: 1rem; text-align: center;">No hay datos calculados. Verifica los inputs de la tabla de diseño.</p>';
  }

  // Inicio de la tabla con estilos inline para Dark Mode
  let html = `
  <table id="tablaResultadosCilindrico" class="results-table" style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 0.9rem; margin-top: 1rem;">
    <thead>
      <tr style="background-color: #1e2a45; color: #a4b1cd; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">MURO /<br>GRUPO</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">DISEÑO (D X H)</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">CANT.</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">VOL.<br>CONC.<br>(M³)</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">PESO<br>CONC.<br>(TON)</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">ACERO<br>VERT.<br>(KG)</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">ANILLOS<br>(KG)</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">ALAMBRE<br>(KG)</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #2d3b5e;">TOTAL<br>ACERO<br>(KG)</th>
      </tr>
    </thead>
    <tbody style="background-color: #161f33; color: #d1d5db;">
  `;

  let totalVol = 0;
  let totalAcero = 0;

  resultados.forEach(res => {
    const t = res.total_muro;
    const pesoAceroFila = t.peso_acero_vert + t.peso_acero_anillo + t.peso_alambre;
    const pesoConcretoTon = (res.unitario.peso_concreto_kg * res.input.cantidad) / 1000;
    
    totalVol += t.volumen_concreto_compra;
    totalAcero += pesoAceroFila;

    html += `
      <tr style="border-bottom: 1px solid #2d3b5e;">
        <td style="padding: 12px; text-align: center;">${res.id_muro}</td>
        <td style="padding: 12px; text-align: center;">Ø${res.input.diametro} x ${res.input.profundidad}</td>
        <td style="padding: 12px; text-align: center;">${res.input.cantidad}</td>
        
        <td style="padding: 12px; text-align: center; color: #5fabc4; font-weight: bold;">${t.volumen_concreto_compra.toFixed(2)}</td>
        <td style="padding: 12px; text-align: center;">${pesoConcretoTon.toFixed(2)}</td>
        
        <td style="padding: 12px; text-align: center;">${t.peso_acero_vert.toFixed(1)}</td>
        <td style="padding: 12px; text-align: center;">${t.peso_acero_anillo.toFixed(1)}</td>
        <td style="padding: 12px; text-align: center;">${t.peso_alambre.toFixed(2)}</td>
        
        <td style="padding: 12px; text-align: center; font-weight: bold;">${pesoAceroFila.toFixed(1)}</td>
      </tr>
    `;
  });

  html += `
    </tbody>
    <tfoot style="background-color: #111827; color: #a4b1cd; font-weight: bold; border-top: 2px solid #374151;">
      <tr>
        <td colspan="3" style="padding: 15px; text-align: right; text-transform: uppercase;">TOTALES PROYECTO:</td>
        <td style="padding: 15px; text-align: center; color: #5fabc4;">${totalVol.toFixed(2)} m³</td>
        <td style="padding: 15px; text-align: center;">-</td>
        <td style="padding: 15px; text-align: center;">-</td>
        <td style="padding: 15px; text-align: center;">-</td>
        <td style="padding: 15px; text-align: center;">-</td>
        <td style="padding: 15px; text-align: center;">${totalAcero.toFixed(1)} kg</td>
      </tr>
    </tfoot>
  </table>
  `;

  return html;
}