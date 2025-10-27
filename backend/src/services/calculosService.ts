import { Muro } from '../models/Muro';

// Interfaces para los cálculos de viento
export interface WindParameters {
  categoria_terreno: number; // 1, 2, 3, etc. (según tabla 6.5)
  VR_kmh: number;
  FT: number; // Factor topográfico
  temperatura_C: number;
  presion_barometrica_mmHg: number;
  Cp_int: number;
  Cp_ext: number;
  factor_succion: number;
  densidad_concreto_kg_m3: number;
  altura_estimada_m?: number; // Si no se proporciona, se calcula como sqrt(area)
  
  // Nuevos parámetros para cálculos adicionales
  altitud_m?: number; // Altitud del sitio sobre nivel del mar
  altura_base_m?: number; // Altura de la base del muro
  ajuste_terreno_m?: number; // Ajuste por desnivel del terreno
  distancia_horizontal_brace?: number; // Distancia horizontal para cálculo de inclinación brace
  
  // Parámetros NFT (Análisis de Fricción y Estabilidad)
  coeficiente_friccion?: number; // Coeficiente de fricción suelo-muro (default 0.4)
  factor_seguridad_nft?: number; // Factor de seguridad requerido (default 1.5)
  
  // Parámetros legacy (mantenidos por compatibilidad)
  nivel_natural_terreno_m?: number;
  ajuste_excavacion_relleno_m?: number;
  espesor_losa_concreto_m?: number;
  acabado_superficial_m?: number;
}

// Tabla 6.5 - Valores de α y β según categoría de terreno
export interface ParametrosTerreno {
  categoria: number;
  descripcion: string;
  alpha_A: number;
  alpha_B: number;
  alpha_C: number;
  delta: number;
}

// Clase de estructura según altura (determina qué α usar)
export interface ClaseEstructura {
  clase: 'A' | 'B' | 'C';
  FC: number;
  altura_min: number;
  altura_max: number;
}

// Interfaz para resultados de cálculo de braces
export interface BraceCalculationResult {
  x_braces: number;      // Cantidad de braces
  fbx: number;           // Fuerza en X (kN)
  fby: number;           // Fuerza en Y (kN)
  fb: number;            // Fuerza total (kN)
  cant_b14: number;      // Cantidad B14
  cant_b12: number;      // Cantidad B12
  cant_b04: number;      // Cantidad B04
  cant_b15: number;      // Cantidad B15
  x_inserto?: number;    // Coordenada X del inserto
  y_inserto?: number;    // Coordenada Y del inserto
  observaciones: string[];
}

/**
 * Tabla 6.5 - Valores de α según categoría de terreno y clase de estructura
 */
export function getParametrosTerreno(): ParametrosTerreno[] {
  return [
    { 
      categoria: 1, 
      descripcion: "Terreno plano o ligeramente ondulado", 
      alpha_A: 0.099, alpha_B: 0.101, alpha_C: 0.105, 
      delta: 245 
    },
    { 
      categoria: 2, 
      descripcion: "Terreno rugoso con obstáculos aislados", 
      alpha_A: 0.128, alpha_B: 0.131, alpha_C: 0.138, 
      delta: 315 
    },
    { 
      categoria: 3, 
      descripcion: "Terreno cubierto con obstáculos numerosos", 
      alpha_A: 0.156, alpha_B: 0.160, alpha_C: 0.171, 
      delta: 390 
    },
    { 
      categoria: 4, 
      descripcion: "Terreno muy rugoso con obstáculos grandes", 
      alpha_A: 0.170, alpha_B: 0.177, alpha_C: 0.193, 
      delta: 455 
    }
  ];
}

/**
 * Determinar clase de estructura y FC según altura
 */
export function determinarClaseEstructura(altura_m: number): ClaseEstructura {
  if (altura_m < 20) {
    return { clase: 'A', FC: 1.00, altura_min: 0, altura_max: 20 };
  } else if (altura_m <= 50) {
    return { clase: 'B', FC: 0.95, altura_min: 20, altura_max: 50 };
  } else {
    return { clase: 'C', FC: 0.90, altura_min: 50, altura_max: Infinity };
  }
}

/**
 * Obtener parámetros de terreno por categoría
 */
export function getParametrosPorCategoria(categoria: number): ParametrosTerreno {
  const parametros = getParametrosTerreno();
  const terreno = parametros.find(p => p.categoria === categoria);
  if (!terreno) {
    throw new Error(`Categoría de terreno ${categoria} no válida. Use 1, 2, 3, o 4.`);
  }
  return terreno;
}

/**
 * Obtener α correcto según clase de estructura
 */
export function getAlphaPorClase(terrenoParams: ParametrosTerreno, clase: 'A' | 'B' | 'C'): number {
  switch (clase) {
    case 'A': return terrenoParams.alpha_A;
    case 'B': return terrenoParams.alpha_B;
    case 'C': return terrenoParams.alpha_C;
    default: throw new Error(`Clase de estructura ${clase} no válida. Use A, B, o C.`);
  }
}

export interface WindResult {
  pid: number;        // ID del panel en la base de datos
  id_muro: string;
  area_m2: number;
  peso_ton: number;
  altura_z_m: number;
  
  // Clasificación según normativa
  categoria_terreno: number;
  clase_estructura: 'A' | 'B' | 'C';
  FC: number;
  
  // Parámetros de terreno y estructura según Tomo III
  alpha: number;      // Coeficiente α según terreno y clase de estructura
  delta: number;      // Factor δ según categoría de terreno (Tabla 6.5)
  
  // Paso b) Datos Requeridos para Definir Carga de Viento (Norma)
  Frz: number;        // Factor de rugosidad por altura
  Falpha: number;     // Factor de exposición
  Vd_kmh: number;     // Velocidad de diseño
  correccion: number; // Corrección densidad aire
  G: number;          // Factor de corrección por temperatura y altura (Tomo III)
  qz_kPa: number;     // Presión dinámica
  presion_kPa: number; // Presión neta sobre muro
  fuerza_kN: number;  // Fuerza total viento
  
  // Parámetros geométricos y estructurales
  YCG: number;        // Centro de gravedad en Y (m)
  NFT: number;        // Nivel de Piso Terminado (m)
  componentes_nft: {  // Componentes del cálculo NFT
    nivel_natural: number;
    excavacion: number;
    espesor_losa: number;
    acabado: number;
  };
  grados_inclinacion_brace: number; // Ángulo de inclinación del brace (grados)
  
  // Especificaciones detalladas del brace
  tipo_brace: string; // Tipo de arriostramiento
  longitud_brace_m: number; // Longitud estimada del brace (m)
  modelo_brace: string; // Modelo sugerido del brace
  observaciones_brace: string[]; // Observaciones y verificaciones
  
  // Distribución de braces por modelo
  total_braces: number; // Cantidad total de braces necesarios
  modelo_principal_brace: string; // Modelo principal recomendado
  resumen_distribucion_braces: string; // Resumen formato "Total: 2, B12:2"
  distribucion_braces: { [modelo: string]: number }; // Distribución por modelo
  
  requiere_analisis_dinamico: boolean;
  advertencias: string[];
}

/**
 * Sección 1 - Paso a) Definir/Importar/Editar Datos del Muro
 * Basado en Excel sheet "Muros" y "Hoja1"
 */

// Fórmula: Área = Alto (max) × Ancho (max)
// Excel: Sheet "Muros" row4, sheet "Hoja1" row2
// PDF: Tomo III secc. 8.2.1
export function calculateArea(height: number, width: number): number {
  return height * width;
}

// Fórmula: Volumen = Área × Espesor
// Excel: Sheet "Muros" row3, sheet "Hoja1" row2
// PDF: Handbook p.2
export function calculateVolume(area: number, thickness: number): number {
  return area * thickness;
}

// Fórmula: Peso = Volumen × ρ / 1000 (convertir a toneladas)
// Excel: Sheet "Muros" row5, sheet "Hoja1" row2
// PDF: Handbook p.2 (ρ = 2400 kg/m³)
export function calculateWeight(volume: number, density: number = 2400): number {
  return (volume * density) / 1000; // toneladas
}

/**
 * Sección 1 - Paso b) Datos Requeridos para Definir Carga de Viento (Norma)
 * Basado en Excel sheet "braces" row11 y PDFs Tomo III
 */

// Fórmula correcta según Tomo III: Frz = 1.56 × (Z/δ)^α
// PDF: Tomo III secc. 6.3.2 - Factor de rugosidad y altura
export function calculateFrz(height: number, alpha: number, delta: number): number {
  return 1.56 * Math.pow(height / delta, alpha);
}

// Fórmula: Fα = FC × Frz × FT
// Excel: Sheet "braces" row11 (1.0416 implícito)
// PDF: Tomo III secc. 6.3
export function calculateFalpha(FC: number, Frz: number, FT: number): number {
  return FC * Frz * FT;
}

// Fórmula: Vd = Vregional × Fα
// Excel: Sheet "braces" row11 (133.32 km/h)
// PDF: Tomo III secc. 6.2
export function calculateVd(Vregional: number, Falpha: number): number {
  return Vregional * Falpha;
}

// Fórmula: Corrección = (273 + T) / (273 + 15) × (P / 760)
// Excel: Sheet "braces" row11 (0.9832)
// PDF: Tomo III secc. 7
export function calculateCorrection(temperatura_C: number, presion_mmHg: number): number {
  return ((273 + temperatura_C) / (273 + 15)) * (presion_mmHg / 760);
}

// Fórmula correcta según Tomo III: qz = 0.0048 × G × (VD)²
// PDF: Tomo III secc. 7 - Presión dinámica
export function calculateQz(G: number, Vd_kmh: number): number {
  return 0.0048 * G * Math.pow(Vd_kmh, 2); // kPa
}

// Fórmula: Presión = qz × (Cpint - Cpext) × Factor
// Excel: Sheet "braces" row11 (6.711 kPa implícito)
// PDF: Tomo III secc. 8.2.2 (Cp ext=0.8, Cp int=-0.5)
export function calculatePressure(qz: number, Cpint: number, Cpext: number, factor: number): number {
  return qz * (Cpint - Cpext) * factor;
}

// Fórmula: Fuerza = Presión × Área
// Excel: No explícito, derivado de row11
// PDF: Tomo III secc. 8.2.1
export function calculateForce(presion_kPa: number, area_m2: number): number {
  return presion_kPa * area_m2; // kN
}

/**
 * Nuevas funciones según Tomo III - Factores faltantes
 */

// Factor G: Corrección por temperatura y altura según Tomo III
// FORMULA CORRECTA SEGUN TOMO III: G = (0.392 × presión_atmo) / (273 + temp_promedio)
export function calculateFactorG(temperatura_C: number, presion_mmHg: number): number {
  // FORMULA OFICIAL: Fórmula oficial del Tomo III para Factor de Corrección por Temperatura y Altura
  const numerador = 0.392 * presion_mmHg;
  const denominador = 273 + temperatura_C;
  const G = numerador / denominador;

  console.log(`[CALCULOS] 🧮 calculateFactorG - FÓRMULA TOMO III:`);
  console.log(`[CALCULOS] 📊 Entrada: temp=${temperatura_C}°C, presión=${presion_mmHg}mmHg`);
  console.log(`[CALCULOS] 🔢 Fórmula: G = (0.392 × ${presion_mmHg}) / (273 + ${temperatura_C})`);
  console.log(`[CALCULOS] 🔢 Cálculo: ${numerador.toFixed(2)} / ${denominador} = ${G.toFixed(4)}`);
  console.log(`[CALCULOS] FACTOR G: Factor G (Tomo III): ${G.toFixed(4)}`);
  return G;
}

// YCG: Centro de gravedad en Y (altura desde la base)
// Para muros rectangulares: YCG = altura / 2
export function calculateYCG(altura_m: number, forma: string = 'rectangular'): number {
  switch (forma.toLowerCase()) {
    case 'rectangular':
      return altura_m / 2;
    case 'triangular':
      return altura_m / 3;
    default:
      return altura_m / 2; // Default rectangular
  }
}

// NFT: Nivel de Piso Terminado (Cálculo físico de elevación)
// NFT = NNT - Excavación + Espesor_Losa + Acabado_Superficial
export function calculateNFT(
  nivel_natural_terreno_m: number = 0.0,      // NNT (referencia relativa)
  excavacion_m: number = 0.0,                 // Excavación (0.0 o 0.30m si hay nivelación)
  espesor_losa_m: number = 0.140,             // 140mm (5.5") - alineado con Insert Capacity
  acabado_superficial_m: number = 0.020       // 20mm acabado estándar
): {
  nft_final: number;
  componentes: {
    nivel_natural: number;
    excavacion: number;
    espesor_losa: number;
    acabado: number;
  };
  observaciones: string[];
} {
  const observaciones: string[] = [];
  const recomendaciones: string[] = [];
  
  // Fórmula principal: NFT = NNT - Excavación + Espesor_Losa + Acabado
  const nft_final = nivel_natural_terreno_m - excavacion_m + espesor_losa_m + acabado_superficial_m;
  
  console.log(`[CALCULOS] CALCULO NFT (Nivel de Piso Terminado):`);
  console.log(`[CALCULOS] Nivel Natural Terreno (NNT): ${nivel_natural_terreno_m.toFixed(3)}m`);
  console.log(`[CALCULOS] Excavacion: ${excavacion_m.toFixed(3)}m`);
  console.log(`[CALCULOS] Espesor losa: ${espesor_losa_m.toFixed(3)}m (${(espesor_losa_m * 39.37).toFixed(1)}")`);
  console.log(`[CALCULOS] Acabado superficial: ${acabado_superficial_m.toFixed(3)}m`);
  console.log(`[CALCULOS] NFT = ${nivel_natural_terreno_m} - ${excavacion_m} + ${espesor_losa_m} + ${acabado_superficial_m} = ${nft_final.toFixed(3)}m`);
  
  // Validaciones según especificaciones
  if (espesor_losa_m < 0.127) { // < 5"
    observaciones.push('CORTO: Brace corto - Verificar estabilidad lateral');
  } else if (espesor_losa_m >= 0.140) { // >= 5.5"
    observaciones.push('ESPESOR: Espesor óptimo ≥ 5.5" - Compatible con Insert Capacity 8,470 lb');
  }
  
  if (excavacion_m > 0.3) {
    observaciones.push(`📏 Excavación significativa: ${excavacion_m.toFixed(2)}m - Verificar compactación`);
  } else if (excavacion_m > 0) {
    observaciones.push(`NIVELACION: Nivelación estándar: ${excavacion_m.toFixed(2)}m`);
  }
  
  if (nft_final < 0.15) {
    observaciones.push('ADVERTENCIA: NFT bajo - Verificar drenaje y accesibilidad');
  } else if (nft_final > 0.25) {
    observaciones.push('📈 NFT elevado - Considerar impacto en accesos');
  }
  
  observaciones.push(`BASE: NFT = ${nft_final.toFixed(3)}m establecido como base para alturas de paneles`);
  observaciones.push(`� Compatible con datos del Excel - hoja "braces" y "Informe"`);

  return {
    nft_final,
    componentes: {
      nivel_natural: nivel_natural_terreno_m,
      excavacion: excavacion_m,
      espesor_losa: espesor_losa_m,
      acabado: acabado_superficial_m
    },
    observaciones
  };
}

// Grados de inclinación del brace según manual Tilt-Up
export function calculateGradosInclinacionBrace(altura_muro: number, distancia_horizontal?: number): number {
  // Usar altura completa del muro según especificación del usuario
  // Ángulo = arctan(altura del muro / distancia horizontal del brace)
  
  // Si no se proporciona distancia horizontal, calcular para ángulo óptimo de 55°
  if (!distancia_horizontal) {
    // Distancia horizontal para ángulo óptimo de 55° (entre 45° y 60° recomendados)
    distancia_horizontal = altura_muro / Math.tan(55 * Math.PI / 180);
  }
  
  // Calcular ángulo real basado en geometría del triángulo
  // Ángulo = arctan(altura_muro / distancia_horizontal)
  const angulo_rad = Math.atan(altura_muro / distancia_horizontal);
  const angulo_grados = (angulo_rad * 180) / Math.PI;
  
  console.log(`[CALCULOS] 🔧 CÁLCULO BRACE DETALLADO:`);
  console.log(`[CALCULOS] 📏 Altura total muro: ${altura_muro.toFixed(2)}m`);
  console.log(`[CALCULOS] 📊 Distancia horizontal: ${distancia_horizontal.toFixed(2)}m`);
  console.log(`[CALCULOS] Angulo = arctan(${altura_muro}/${distancia_horizontal}) = ${angulo_grados.toFixed(1)}°`);
  
  // Validar que el ángulo esté en rango seguro (30° - 60°)
  if (angulo_grados < 30) {
    console.log(`[CALCULOS] ADVERTENCIA: ADVERTENCIA: Ángulo ${angulo_grados.toFixed(1)}° < 30° (mínimo seguridad)`);
  } else if (angulo_grados > 60) {
    console.log(`[CALCULOS] ADVERTENCIA: ADVERTENCIA: Ángulo ${angulo_grados.toFixed(1)}° > 60° (máximo recomendado)`);
  } else {
    console.log(`[CALCULOS]  Ángulo ${angulo_grados.toFixed(1)}° en rango óptimo (30°-60°)`);
  }
  
  return angulo_grados;
}

// Determinación del tipo y especificaciones de brace usando lógica calculada
export function determineTipoBrace(altura_m: number, angulo_grados: number, configuracion: string = 'estandar'): {
  tipo: string;
  longitud_estimada_m: number;
  modelo_sugerido: string;
  observaciones: string[];
} {
  const altura_anclaje = altura_m * (2/3);
  const observaciones: string[] = [];
  
  // Calcular longitud total del brace basado en altura de anclaje y ángulo
  const longitud_estimada_m = altura_anclaje / Math.sin(angulo_grados * Math.PI / 180);
  const longitud_ft = longitud_estimada_m * 3.28084;
  
  // LÓGICA CALCULADA: Determinar modelo basado en capacidad estructural requerida
  let tipo: string;
  let modelo_sugerido: string;
  
  // Usar longitud calculada para determinar modelo (no altura arbitraria)
  if (longitud_ft < 40) {
    tipo = 'Brace estándar para Tilt-Up';
    modelo_sugerido = 'B12';
    observaciones.push(`Longitud ${longitud_ft.toFixed(1)} ft - Brace estándar B12 suficiente`);
  } else {
    tipo = 'Brace de alta capacidad para Tilt-Up';
    modelo_sugerido = 'B14';
    observaciones.push(`Longitud ${longitud_ft.toFixed(1)} ft - Requiere brace reforzado B14`);
  }
  
  // Verificaciones de ángulo basadas en eficiencia estructural
  if (angulo_grados < 45) {
    observaciones.push(`ANGULO: Ángulo ${angulo_grados}° < 45° - Eficiencia reducida`);
  } else if (angulo_grados > 60) {
    observaciones.push(`⚠️ Ángulo ${angulo_grados}° > 60° - Componente horizontal alta`);
  } else {
    observaciones.push(`✅ Ángulo ${angulo_grados}° en rango óptimo (45°-60°)`);
  }
  
  // Consideraciones de instalación basadas en longitud calculada
  if (longitud_estimada_m > 10) {
    observaciones.push('LARGO: Brace largo - Considerar equipos de izaje especiales');
  }
  
  if (longitud_estimada_m > 15) {
    observaciones.push(' Longitud considerable - Verificar disponibilidad y transporte');
  }
  
  // Información técnica calculada
  observaciones.push(`Altura anclaje: ${altura_anclaje.toFixed(2)}m (2/3 de ${altura_m}m)`);
  observaciones.push(`Longitud calculada: ${longitud_estimada_m.toFixed(2)}m`);
  observaciones.push('Selección basada en cálculos estructurales');
  
  return {
    tipo,
    longitud_estimada_m: +longitud_estimada_m.toFixed(2),
    modelo_sugerido,
    observaciones
  };
}

/**
 * Función principal para calcular viento en un muro
 * Implementa todas las fórmulas del diagrama Fase 1 y 2
 */
export function calcularVientoMuro(muro: Muro, parametros: WindParameters): WindResult {
  const advertencias: string[] = [];
  
  // Paso a) Datos del Muro (ya están en el objeto muro importado del TXT)
  // ✅ CORREGIDO: Asegurar que area_m2 sea un número válido
  let area_m2 = Number(muro.area) || 0;
  let peso_ton = Number(muro.peso) || 0;
  
  console.log(`[CALCULOS] DEBUG: DEBUG ÁREA: muro.area=${muro.area} (tipo: ${typeof muro.area}), area_m2=${area_m2} (tipo: ${typeof area_m2})`);
  
  // Para altura, usar overall_height del TXT si existe, sino usar estimación
  let altura_z_m = Number(parametros.altura_estimada_m) || 0;
  
  // Prioridad 1: Usar overall_height del muro importado (ya viene en metros desde el importService)
  const overallHeightNum = Number(muro.overall_height);
  if (muro.overall_height && !isNaN(overallHeightNum) && overallHeightNum > 0) {
    altura_z_m = overallHeightNum; // Ya está en metros gracias a la conversión del importService
    console.log(`[CALCULOS] Usando Overall Height del TXT: ${altura_z_m}m para muro ${muro.id_muro}`);
  } else if (!altura_z_m || altura_z_m <= 0) {
    // Prioridad 2: Estimación basada en área (método anterior como respaldo)
    altura_z_m = Math.sqrt(area_m2 * 0.72); // Factor empírico Excel
    if (altura_z_m < 3) altura_z_m = 6; // Altura mínima típica Tilt-Up
    advertencias.push(`Altura estimada como ${altura_z_m.toFixed(1)}m (no se encontró Overall Height en TXT). Para mayor precisión, verifique el archivo de importación.`);
  }
  
  console.log(`[CALCULOS] DEBUG: DEBUG ALTURA: altura_z_m=${altura_z_m} (tipo: ${typeof altura_z_m})`);
  
  // ✅ VERIFICAR: Que tenemos valores numéricos válidos antes de continuar
  if (!area_m2 || area_m2 <= 0) {
    advertencias.push(`Área inválida: ${area_m2} m². Usando valor por defecto de 10 m².`);
    area_m2 = 10;
  }
  
  if (!altura_z_m || altura_z_m <= 0) {
    advertencias.push(`Altura inválida: ${altura_z_m} m. Usando valor por defecto de 6 m.`);
    altura_z_m = 6;
  }
  
  // Paso b) Cálculos de Viento según Tomo III
  
  // 1. Obtener parámetros según categoría de terreno
  const terrenoParams = getParametrosPorCategoria(parametros.categoria_terreno);
  
  // 2. Determinar clase de estructura y FC según altura (ya en metros)
  const claseEstructura = determinarClaseEstructura(altura_z_m);
  
  // 3. Obtener α correcto regulado por la clasificación previa (terreno + estructura)
  const alpha = getAlphaPorClase(terrenoParams, claseEstructura.clase);
  
  // Factor de rugosidad por altura según Tomo III: Frz = 1.56 × (Z/δ)^α
  const Frz = calculateFrz(altura_z_m, alpha, terrenoParams.delta);
  
  // Factor de exposición: Fα = FC × Frz × FT
  const Falpha = calculateFalpha(claseEstructura.FC, Frz, parametros.FT);
  
  // Velocidad de diseño: Vd = Vregional × Fα
  const Vd_kmh = calculateVd(parametros.VR_kmh, Falpha);
  
  // Corrección por temperatura y presión (densidad del aire estándar)
  const correccion = calculateCorrection(parametros.temperatura_C, parametros.presion_barometrica_mmHg);
  
  // Factor G según Tomo III - FACTOR DE CORRECCIÓN POR TEMPERATURA Y ALTURA (fórmula específica)
  const G = calculateFactorG(parametros.temperatura_C, parametros.presion_barometrica_mmHg);

  // ✅ VERIFICACIÓN: Mostrar ambos factores (son diferentes según Tomo III)
  console.log(`[CALCULOS] CORRECION: Corrección (densidad aire): ${correccion.toFixed(4)}, Factor G (Tomo III): ${G.toFixed(4)}`);

  // Presión dinámica según Tomo III: qz = 0.0048 × G × (VD)²
  const qz_kPa = calculateQz(G, Vd_kmh);

  // Fuerza de viento: Fuerza = qz × Área (según especificación)
  const fuerza_kN = qz_kPa * area_m2;
  
  // ✅ CORREGIDO: Presión = (Fuerza de viento / área) × (9.81/1000)
  const presion_kPa = (fuerza_kN / area_m2) * (9.81 / 1000);

  console.log(`[CALCULOS] VERIFICACION: VERIFICACIÓN PRESIÓN:`);
  console.log(`[CALCULOS] 📊 qz: ${qz_kPa.toFixed(4)} kPa`);
  console.log(`[CALCULOS] 💨 Fuerza viento: ${fuerza_kN.toFixed(2)} kN`);
  console.log(`[CALCULOS] 📏 Área: ${area_m2.toFixed(2)} m²`);
  console.log(`[CALCULOS] 🧮 Presión = (${fuerza_kN.toFixed(2)} / ${area_m2.toFixed(2)}) × (9.81/1000) = ${presion_kPa.toFixed(4)} kPa`);
  
  // Cálculos geométricos y estructurales adicionales
  const YCG = calculateYCG(altura_z_m); // Centro de gravedad
  
  // NFT: Nivel de Piso Terminado (Cálculo físico de elevación)
  const nftCalculation = calculateNFT(
    parametros.nivel_natural_terreno_m || 0.0,        // NNT
    parametros.ajuste_excavacion_relleno_m || 0.0,    // Excavación  
    parametros.espesor_losa_concreto_m || 0.140,      // 140mm (5.5")
    parametros.acabado_superficial_m || 0.020         // 20mm acabado
  );
  
  const grados_inclinacion_brace = calculateGradosInclinacionBrace(altura_z_m, parametros.distancia_horizontal_brace);
  const especificaciones_brace = determineTipoBrace(altura_z_m, grados_inclinacion_brace);
  
  // Calcular ancho estimado del muro (área / altura)
  const ancho_estimado_m = area_m2 / altura_z_m;
  const distribucion_braces = calcularDistribucionBraces(altura_z_m, ancho_estimado_m, fuerza_kN);

  console.log(`[CALCULOS] 📏 Distribución de Braces:`);
  console.log(`[CALCULOS] ANCHO: Ancho estimado: ${ancho_estimado_m.toFixed(2)}m (área/altura)`);
  console.log(`[CALCULOS]  Total braces: ${distribucion_braces.total_braces}`);
  console.log(`[CALCULOS]  Modelo principal: ${distribucion_braces.modelo_principal}`);
  console.log(`[CALCULOS] 📋 Resumen: ${distribucion_braces.resumen_distribucion}`);

  // Agregar observaciones del NFT a las advertencias generales
  advertencias.push(...nftCalculation.observaciones);

  // Verificaciones según norma
  let requiere_analisis_dinamico = false;
  
  // Verificar si requiere análisis dinámico (altura > 60m o condiciones especiales)
  if (altura_z_m > 60) {
    requiere_analisis_dinamico = true;
    advertencias.push(`Altura ${altura_z_m}m > 60m: Se requiere análisis dinámico según Tomo III`);
  }
  
  // Verificar velocidad de diseño
  if (Vd_kmh > 200) {
    advertencias.push(`Velocidad de diseño ${Vd_kmh.toFixed(1)} km/h es muy alta`);
  }
  
  // Verificar presión
  if (presion_kPa > 2.0) {
    advertencias.push(`Presión ${presion_kPa.toFixed(2)} kPa es elevada, verificar cálculos`);
  }
  
  return {
    pid: muro.pid || 0,
    id_muro: muro.id_muro || 'N/A',
    area_m2: +parseFloat(area_m2.toString()).toFixed(2),
    peso_ton: +parseFloat(peso_ton.toString()).toFixed(2),
    altura_z_m: +parseFloat(altura_z_m.toString()).toFixed(2),
    
    // Clasificación según normativa
    categoria_terreno: parametros.categoria_terreno,
    clase_estructura: claseEstructura.clase,
    FC: +claseEstructura.FC.toFixed(2),
    
    // Parámetros de terreno y estructura según Tomo III
    alpha: +alpha.toFixed(4),
    delta: terrenoParams.delta,
    
    // Paso b) Datos Requeridos para Definir Carga de Viento (Norma)
    Frz: +Frz.toFixed(4),
    Falpha: +Falpha.toFixed(4),
    Vd_kmh: +Vd_kmh.toFixed(2),
    correccion: +correccion.toFixed(4),
    G: +G.toFixed(4),
    qz_kPa: +qz_kPa.toFixed(4),
    presion_kPa: +presion_kPa.toFixed(3),
    fuerza_kN: +fuerza_kN.toFixed(2),
    
    // Parámetros geométricos y estructurales
    YCG: +YCG.toFixed(2),
    NFT: +nftCalculation.nft_final.toFixed(3),
    componentes_nft: nftCalculation.componentes,
    grados_inclinacion_brace: +grados_inclinacion_brace.toFixed(1),
    
    // Especificaciones detalladas del brace
    tipo_brace: especificaciones_brace.tipo,
    longitud_brace_m: especificaciones_brace.longitud_estimada_m,
    modelo_brace: especificaciones_brace.modelo_sugerido,
    observaciones_brace: especificaciones_brace.observaciones,
    
    // Distribución de braces por modelo
    total_braces: distribucion_braces.total_braces,
    modelo_principal_brace: distribucion_braces.modelo_principal,
    resumen_distribucion_braces: distribucion_braces.resumen_distribucion,
    distribucion_braces: distribucion_braces.distribucion,
    
    requiere_analisis_dinamico,
    advertencias
  };
}

/**
 * Función para calcular viento en múltiples muros
 * Procesa todos los muros importados del TXT
 */
export function calcularVientoMuros(muros: Muro[], parametros: WindParameters): WindResult[] {
  return muros.map(muro => calcularVientoMuro(muro, parametros));
}

/**
 * Función para obtener parámetros por defecto
 * Categoría 1 = Terreno plano (típico para Tilt-Up)
 */
export function getParametrosVientoDefecto(): WindParameters {
  return {
    categoria_terreno: 1,   // Categoría 1 - Terreno plano (default para Tilt-Up)
    VR_kmh: 120,            // ✅ Valor más genérico en lugar de 128 específico
    FT: 1.0,                // Topografía plana
    temperatura_C: 25,      // ✅ Temperatura más estándar en lugar de 30
    presion_barometrica_mmHg: 760, // Presión estándar
    Cp_int: -0.5,           // Tomo III secc. 8.2.2
    Cp_ext: 0.8,            // Tomo III secc. 8.2.2
    factor_succion: 1.3,    // Factor de seguridad
    densidad_concreto_kg_m3: 2400, // Estándar
    
    // Parámetros NFT (análisis de fricción y estabilidad)
    coeficiente_friccion: 0.4,     // Concreto sobre concreto
    factor_seguridad_nft: 1.5,     // Factor de seguridad estándar
  };
}

// Función para calcular distribución de braces usando lógica calculada, no hardcodeada
export function calcularDistribucionBraces(altura_m: number, ancho_estimado_m: number, fuerza_kN: number): {
  total_braces: number;
  distribucion: { [modelo: string]: number };
  modelo_principal: string;
  resumen_distribucion: string;
  observaciones: string[];
} {
  const observaciones: string[] = [];
  
  // Inicializar distribución con los modelos del proyecto real
  const distribucion: { [modelo: string]: number } = {
    'B12': 0,
    'B14': 0,
    'B04': 0,  // Columna existe pero generalmente no se usa
    'B15': 0   // Columna existe pero generalmente no se usa
  };

  // Calcular altura de anclaje (2/3 de altura total según estándar Tilt-Up)
  const altura_anclaje = altura_m * (2/3);
  
  // Calcular longitud de brace necesaria usando ángulo de los parámetros
  const angulo_rad = 55 * Math.PI / 180; // Por ahora mantenemos 55° como óptimo
  const longitud_estimada_m = altura_anclaje / Math.sin(angulo_rad);
  const longitud_ft = longitud_estimada_m * 3.28084;

  // LÓGICA CALCULADA: Determinar modelo basado en capacidad estructural
  // B12: Para estructuras estándar (longitud < 40 ft según manual)
  // B14: Para estructuras de alta capacidad (longitud >= 40 ft)
  let modelo_principal = '';
  
  if (longitud_ft < 40) {
    modelo_principal = 'B12';
    observaciones.push(`Longitud ${longitud_ft.toFixed(1)} ft < 40 ft - Modelo B12 seleccionado`);
  } else {
    modelo_principal = 'B14';
    observaciones.push(`Longitud ${longitud_ft.toFixed(1)} ft >= 40 ft - Modelo B14 (alta capacidad)`);
  }

  // LÓGICA CALCULADA: Cantidad basada en criterios estructurales
  let cantidad_base = 2; // Mínimo estándar para estabilidad
  
  // Criterio 1: Ancho del muro (1 brace cada 6-8m según normas)
  const braces_por_ancho = Math.ceil(ancho_estimado_m / 7);
  cantidad_base = Math.max(cantidad_base, braces_por_ancho);
  
  // Criterio 2: Altura estructural (mayor altura = más braces)
  if (altura_m > 14) {
    cantidad_base = Math.max(cantidad_base, 3);
    observaciones.push(`Altura ${altura_m}m > 14m - Mínimo 3 braces por estabilidad`);
  }
  
  // Criterio 3: Fuerza de viento (alta fuerza = más braces)
  const fuerza_critica = 5000; // kN - Umbral de fuerza alta
  if (fuerza_kN > fuerza_critica) {
    cantidad_base = Math.max(cantidad_base, 3);
    observaciones.push(`Fuerza ${fuerza_kN} kN > ${fuerza_critica} kN - Braces adicionales requeridos`);
  }
  
  // Criterio 4: Longitud de brace (braces muy largos necesitan refuerzo)
  if (longitud_estimada_m > 12) {
    cantidad_base = Math.max(cantidad_base, 3);
    observaciones.push(`Longitud brace ${longitud_estimada_m.toFixed(2)}m > 12m - Refuerzo adicional`);
  }

  // Asignar toda la cantidad al modelo principal
  distribucion[modelo_principal] = cantidad_base;

  // Crear resumen de distribución
  const modelos_con_cantidad = Object.entries(distribucion)
    .filter(([modelo, cantidad]) => cantidad > 0)
    .map(([modelo, cantidad]) => `${modelo}:${cantidad}`)
    .join(', ');
  
  const resumen_distribucion = `Total: ${cantidad_base}, ${modelos_con_cantidad}`;

  // Información técnica calculada
  observaciones.push(`Altura anclaje: ${altura_anclaje.toFixed(2)}m (2/3 de altura)`);
  observaciones.push(`Longitud estimada: ${longitud_estimada_m.toFixed(2)}m (${longitud_ft.toFixed(1)} ft)`);
  observaciones.push(`Ancho estimado: ${ancho_estimado_m.toFixed(2)}m`);
  observaciones.push(`Criterios aplicados: estructural + fuerza + geometría`);

  return {
    total_braces: cantidad_base,
    distribucion,
    modelo_principal,
    resumen_distribucion,
    observaciones
  };
}

/**
 * Calcula las fuerzas de los braces (FBx, FBy, FB) y distribución por tipo
 * Basado en la cantidad de braces (X), ángulo y fuerza de viento
 * 
 * @param fuerza_viento_kN - Fuerza de viento calculada (kN)
 * @param x_braces - Cantidad de braces (manual)
 * @param angulo_grados - Ángulo de inclinación del brace (manual)
 * @returns BraceCalculationResult con fuerzas y cantidades por tipo
 */
/**
 * @deprecated - Usar calculateBraceForces con el nuevo método
 * Calcular coordenadas del inserto del brace según el tipo y ángulo
 * Fórmulas de Excel:
 * X = (longitud_brace) * cos(ángulo)
 * Y = (longitud_brace) * sin(ángulo) + NPT
 * 
 * Longitudes de braces:
 * - B04: 4.6 m
 * - B12: 9.75 m
 * - B14: 12.75 m
 * - B15: 15.8 m
 */
export function calcularInsertoCoordinates(
  tipo_brace_seleccionado: string,  // Usar el tipo seleccionado por el usuario
  angulo_grados: number,
  npt: number = 0
): { x_inserto: number | null, y_inserto: number | null } {
  // Longitudes según tipo de brace (metros)
  const LONGITUDES: Record<string, number> = {
    B04: 4.6,
    B12: 9.75,
    B14: 12.75,
    B15: 15.8
  };

  // Obtener longitud del tipo seleccionado
  const longitud_brace = LONGITUDES[tipo_brace_seleccionado] || 0;

  // Si no hay tipo válido, retornar null
  if (longitud_brace === 0) {
    return { x_inserto: null, y_inserto: null };
  }

  // Convertir ángulo a radianes
  const angulo_rad = (angulo_grados * Math.PI) / 180;

  // Fórmulas de Excel
  const x_inserto = longitud_brace * Math.cos(angulo_rad);
  const y_inserto = longitud_brace * Math.sin(angulo_rad) + npt;

  console.log(`[CALCULOS] INSERTO: Tipo=${tipo_brace_seleccionado}, Longitud=${longitud_brace}m, Ángulo=${angulo_grados}°, NPT=${npt}m`);
  console.log(`[CALCULOS] - X inserto: ${x_inserto.toFixed(3)} m`);
  console.log(`[CALCULOS] - Y inserto: ${y_inserto.toFixed(3)} m`);

  return {
    x_inserto: parseFloat(x_inserto.toFixed(3)),
    y_inserto: parseFloat(y_inserto.toFixed(3))
  };
}

/**
 * Determinar tipo de brace según normativa
 * Usa: (ALTO - NPT) * Factor_W2 vs umbrales con sen(ángulo)
 * 
 * Longitudes nominales:
 * - B4:  4.6 m
 * - B12: 9.75 m (12.76 en algunos contextos)
 * - B14: 12.75 m
 * - B15: 15.8 m (15.81 en algunos contextos)
 * 
 * Capacidades (kN):
 * - B12: 4100 kN
 * - B4:  2950 kN
 * - B14: 2360 kN
 * - B15: 1723 kN
 */
function determinarTipoBrace(
  alto_m: number,
  npt_m: number,
  angulo_grados: number,
  factor_w2: number = 1.0
): string {
  // Convertir ángulo a radianes
  const angulo_rad = (angulo_grados * Math.PI) / 180;
  const sen_angulo = Math.sin(angulo_rad);
  
  // Magnitud base
  const magnitud = (alto_m - npt_m) * factor_w2;
  
  // Longitudes nominales (usar las mismas que para cálculo de X/Y)
  const L_B4 = 4.6;
  const L_B12 = 9.75;
  const L_B14 = 12.75;
  const L_B15 = 15.8;
  
  // Umbrales = Longitud * sen(ángulo)
  const umbral_B4 = L_B4 * sen_angulo;
  const umbral_B12 = L_B12 * sen_angulo;
  const umbral_B14 = L_B14 * sen_angulo;
  const umbral_B15 = L_B15 * sen_angulo;
  
  console.log(`[BRACES] Selección de tipo:`);
  console.log(`  - Magnitud: (${alto_m} - ${npt_m}) * ${factor_w2} = ${magnitud.toFixed(3)}`);
  console.log(`  - Ángulo: ${angulo_grados}° → sen = ${sen_angulo.toFixed(4)}`);
  console.log(`  - Umbrales: B4=${umbral_B4.toFixed(3)}, B12=${umbral_B12.toFixed(3)}, B14=${umbral_B14.toFixed(3)}, B15=${umbral_B15.toFixed(3)}`);
  
  // Selección: de mayor a menor longitud
  if (magnitud >= umbral_B15) {
    console.log(`  → Seleccionado: B15 (magnitud ≥ ${umbral_B15.toFixed(3)})`);
    return 'B15';
  } else if (magnitud >= umbral_B14) {
    console.log(`  → Seleccionado: B14 (magnitud ≥ ${umbral_B14.toFixed(3)})`);
    return 'B14';
  } else if (magnitud >= umbral_B12) {
    console.log(`  → Seleccionado: B12 (magnitud ≥ ${umbral_B12.toFixed(3)})`);
    return 'B12';
  } else {
    console.log(`  → Seleccionado: B4 (magnitud < ${umbral_B12.toFixed(3)})`);
    return 'B4';
  }
}

/**
 * Calcular fuerzas en braces con fórmulas actualizadas
 * 
 * Flujo:
 * 1. Determinar TIPO según (ALTO-NPT)*Factor vs umbrales
 * 2. Calcular X = Longitud_tipo * cos(V)
 * 3. Calcular Y = NPT + Longitud_tipo * sen(V)
 * 4. Calcular YCG = ALTO / 2 (Centro de Gravedad)
 * 5. Calcular FBx = (Fuerza_viento * YCG) / Y
 * 6. Calcular FBy = FBx * sen(V)
 * 7. Calcular FB = √(FBx² + FBy²)
 * 8. Calcular CANTIDAD = max(2, ceil(FBx / Capacidad_tipo))
 */
export function calculateBraceForces(
  fuerza_viento_kN: number,
  presion_kPa: number,      // Nueva: presión de viento
  alto_m: number,           // Nueva: altura del muro
  angulo_grados: number,
  npt: number = 0,
  factor_w2: number = 1.0,
  tipo_manual?: string      // Opcional: tipo especificado manualmente
): BraceCalculationResult {
  const observaciones: string[] = [];
  
  console.log('[CALCULOS] CALCULO DE BRACES (Nuevo método):');
  console.log(`  - Fuerza viento: ${fuerza_viento_kN.toFixed(2)} kN`);
  console.log(`  - Presión: ${presion_kPa.toFixed(4)} kPa`);
  console.log(`  - Alto: ${alto_m.toFixed(2)} m`);
  console.log(`  - Ángulo: ${angulo_grados}°`);
  console.log(`  - NPT: ${npt.toFixed(3)} m`);
  console.log(`  - Factor W2: ${factor_w2}`);

  // Validaciones
  if (angulo_grados <= 0 || angulo_grados >= 90) {
    observaciones.push('ERROR: Ángulo debe estar entre 0° y 90°');
    return {
      x_braces: 0,
      fbx: 0,
      fby: 0,
      fb: 0,
      cant_b14: 0,
      cant_b12: 0,
      cant_b04: 0,
      cant_b15: 0,
      x_inserto: 0,
      y_inserto: 0,
      observaciones
    };
  }

  // Convertir ángulo a radianes
  const angulo_rad = (angulo_grados * Math.PI) / 180;
  const cos_angulo = Math.cos(angulo_rad);
  const sen_angulo = Math.sin(angulo_rad);

  // 1. Determinar tipo de brace (automático o manual)
  const tipo_brace = tipo_manual || determinarTipoBrace(alto_m, npt, angulo_grados, factor_w2);
  observaciones.push(`Tipo de brace: ${tipo_brace}${tipo_manual ? ' (manual)' : ' (automático)'}`);

  // Longitudes por tipo (metros)
  const LONGITUDES: Record<string, number> = {
    B4: 4.6,
    B12: 9.75,
    B14: 12.75,
    B15: 15.8
  };

  // Capacidades por tipo (kN)
  const CAPACIDADES: Record<string, number> = {
    B12: 4100,
    B4: 2950,
    B14: 2360,
    B15: 1723
  };

  const longitud_brace = LONGITUDES[tipo_brace] || LONGITUDES.B12;
  const capacidad_brace = CAPACIDADES[tipo_brace] || CAPACIDADES.B12;

  // 2. Calcular X (distancia horizontal del inserto)
  const x_inserto = longitud_brace * cos_angulo;
  console.log(`  - X inserto: ${longitud_brace} * cos(${angulo_grados}°) = ${x_inserto.toFixed(3)} m`);

  // Protección contra división por cero
  if (x_inserto <= 0.001) {
    observaciones.push('ERROR: X inserto ≈ 0, no se puede calcular FBx');
    return {
      x_braces: 0,
      fbx: 0,
      fby: 0,
      fb: 0,
      cant_b14: 0,
      cant_b12: 0,
      cant_b04: 0,
      cant_b15: 0,
      x_inserto: 0,
      y_inserto: npt,
      observaciones
    };
  }

  // 3. Calcular Y (inserto brace)
  const y_inserto = npt + (longitud_brace * sen_angulo);
  console.log(`  - Y inserto: ${npt} + ${longitud_brace} * sen(${angulo_grados}°) = ${y_inserto.toFixed(3)} m`);

  // Protección contra división por cero en Y
  if (y_inserto <= 0.001) {
    observaciones.push('ERROR: Y inserto ≈ 0, no se puede calcular FBx');
    return {
      x_braces: 0,
      fbx: 0,
      fby: 0,
      fb: 0,
      cant_b14: 0,
      cant_b12: 0,
      cant_b04: 0,
      cant_b15: 0,
      x_inserto,
      y_inserto: 0,
      observaciones
    };
  }

  // 4. Calcular YCG (Centro de Gravedad = altura / 2)
  const ycg = alto_m / 2;
  console.log(`  - YCG: ${alto_m} / 2 = ${ycg.toFixed(3)} m`);

  // 5. Calcular FBx (componente horizontal)
  // Fórmula correcta: FBx = (Fuerza_viento × YCG) / Y
  const fbx = (fuerza_viento_kN * ycg) / y_inserto;
  console.log(`  - FBx: (${fuerza_viento_kN.toFixed(2)} * ${ycg.toFixed(3)}) / ${y_inserto.toFixed(3)} = ${fbx.toFixed(2)} kN`);

  // 6. Calcular FBy (componente vertical)
  const fby = fbx * sen_angulo;
  console.log(`  - FBy: ${fbx.toFixed(2)} * sen(${angulo_grados}°) = ${fby.toFixed(2)} kN`);

  // 7. Calcular FB (fuerza resultante)
  const fb = Math.sqrt(fbx * fbx + fby * fby);
  console.log(`  - FB: √(${fbx.toFixed(2)}² + ${fby.toFixed(2)}²) = ${fb.toFixed(2)} kN`);

  // 8. Calcular cantidad de braces
  // Criterio: max(2, ceil(FBx / Capacidad_tipo))
  const cant_calculada = Math.ceil(fbx / capacidad_brace);
  const cant_braces = Math.max(2, cant_calculada);
  console.log(`  - Cantidad: max(2, ceil(${fbx.toFixed(2)} / ${capacidad_brace})) = ${cant_braces}`);

  observaciones.push(`Demanda: ${fbx.toFixed(2)} kN, Capacidad ${tipo_brace}: ${capacidad_brace} kN`);
  observaciones.push(`Cantidad de braces: ${cant_braces} (mínimo 2 por criterio de seguridad)`);

  // Verificaciones de ángulo
  if (angulo_grados < 30) {
    observaciones.push(`ADVERTENCIA: Ángulo ${angulo_grados}° < 30° - Componente horizontal muy alta`);
  } else if (angulo_grados > 60) {
    observaciones.push(`ADVERTENCIA: Ángulo ${angulo_grados}° > 60° - Componente vertical muy alta`);
  } else {
    observaciones.push(`Ángulo ${angulo_grados}° en rango óptimo (30°-60°)`);
  }

  // Distribuir cantidad por tipo
  let cant_b14 = 0, cant_b12 = 0, cant_b04 = 0, cant_b15 = 0;
  
  switch (tipo_brace) {
    case 'B15': cant_b15 = cant_braces; break;
    case 'B14': cant_b14 = cant_braces; break;
    case 'B12': cant_b12 = cant_braces; break;
    case 'B4':  cant_b04 = cant_braces; break;
  }

  return {
    x_braces: cant_braces,
    fbx: parseFloat(fbx.toFixed(2)),
    fby: parseFloat(fby.toFixed(2)),
    fb: parseFloat(fb.toFixed(2)),
    cant_b14,
    cant_b12,
    cant_b04,
    cant_b15,
    x_inserto: parseFloat(x_inserto.toFixed(3)),
    y_inserto: parseFloat(y_inserto.toFixed(3)),
    observaciones
  };
}
