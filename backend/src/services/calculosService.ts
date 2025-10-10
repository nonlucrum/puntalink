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
  NPT: number;        // Nivel de piso terminado (m)
  grados_inclinacion_brace: number; // Ángulo de inclinación del brace (grados)
  tipo_brace: string; // Tipo de arriostramiento
  
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
// Combina efectos de temperatura, presión y altitud
export function calculateFactorG(temperatura_C: number, presion_mmHg: number, altitud_m: number = 0): number {
  // Factor de corrección por densidad del aire
  const factor_temperatura = (273 + 15) / (273 + temperatura_C);
  const factor_presion = presion_mmHg / 760;
  const factor_altitud = Math.exp(-altitud_m / 8400); // Fórmula barométrica simplificada
  
  return factor_temperatura * factor_presion * factor_altitud;
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

// NPT: Nivel de piso terminado (referencia de altura)
// Típicamente se asume como 0 para el nivel base, pero puede ajustarse
export function calculateNPT(altura_base_m: number = 0, ajuste_terreno_m: number = 0): number {
  return altura_base_m + ajuste_terreno_m;
}

// Grados de inclinación del brace (típico para Tilt-Up)
export function calculateGradosInclinacionBrace(altura_muro: number, distancia_horizontal: number): number {
  // Ángulo = arctan(altura / distancia horizontal)
  const angulo_rad = Math.atan(altura_muro / distancia_horizontal);
  return (angulo_rad * 180) / Math.PI; // Convertir a grados
}

// Tipo de brace según altura y configuración
export function determineTipoBrace(altura_m: number, configuracion: string = 'estandar'): string {
  if (altura_m < 6) {
    return 'Brace Corto';
  } else if (altura_m < 12) {
    return 'Brace Medio';
  } else if (altura_m < 18) {
    return 'Brace Largo';
  } else {
    return 'Brace Extra Largo';
  }
}

/**
 * Función principal para calcular viento en un muro
 * Implementa todas las fórmulas del diagrama Fase 1 y 2
 */
export function calcularVientoMuro(muro: Muro, parametros: WindParameters): WindResult {
  const advertencias: string[] = [];
  
  // Paso a) Datos del Muro (ya están en el objeto muro importado del TXT)
  const area_m2 = muro.area || 0;
  const peso_ton = muro.peso || 0;
  
  // Para altura, usar overall_height del TXT si existe, sino usar estimación
  let altura_z_m = parametros.altura_estimada_m;
  
  // Prioridad 1: Usar overall_height del muro importado (ya viene en metros desde el importService)
  const overallHeightNum = Number(muro.overall_height);
  if (muro.overall_height && !isNaN(overallHeightNum) && overallHeightNum > 0) {
    altura_z_m = overallHeightNum; // Ya está en metros gracias a la conversión del importService
    console.log(`[CALCULOS] Usando Overall Height del TXT: ${altura_z_m}m para muro ${muro.id_muro}`);
  } else if (!altura_z_m) {
    // Prioridad 2: Estimación basada en área (método anterior como respaldo)
    altura_z_m = Math.sqrt(area_m2 * 0.72); // Factor empírico Excel
    if (altura_z_m < 3) altura_z_m = 6; // Altura mínima típica Tilt-Up
    advertencias.push(`Altura estimada como ${altura_z_m.toFixed(1)}m (no se encontró Overall Height en TXT). Para mayor precisión, verifique el archivo de importación.`);
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
  
  // Corrección por temperatura y presión (original)
  const correccion = calculateCorrection(parametros.temperatura_C, parametros.presion_barometrica_mmHg);
  
  // Factor G: Corrección por temperatura y altura según Tomo III
  const G = calculateFactorG(parametros.temperatura_C, parametros.presion_barometrica_mmHg, parametros.altitud_m || 0);
  
  // Presión dinámica según Tomo III: qz = 0.0048 × G × (VD)²
  const qz_kPa = calculateQz(G, Vd_kmh);
  
  // Presión neta con coeficientes: Presión = qz × (Cpint - Cpext) × Factor
  const presion_kPa = calculatePressure(qz_kPa, parametros.Cp_int, parametros.Cp_ext, parametros.factor_succion);
  
  // Fuerza de viento: Fuerza = qz × Área (según especificación)
  const fuerza_kN = qz_kPa * area_m2;
  
  // Cálculos geométricos y estructurales adicionales
  const YCG = calculateYCG(altura_z_m); // Centro de gravedad
  const NPT = calculateNPT(parametros.altura_base_m || 0, parametros.ajuste_terreno_m || 0);
  const grados_inclinacion_brace = calculateGradosInclinacionBrace(altura_z_m, parametros.distancia_horizontal_brace || altura_z_m);
  const tipo_brace = determineTipoBrace(altura_z_m);

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
    NPT: +NPT.toFixed(2),
    grados_inclinacion_brace: +grados_inclinacion_brace.toFixed(1),
    tipo_brace: tipo_brace,
    
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
    VR_kmh: 128,            // Excel "braces" row11 (Vregional)
    FT: 1.0,                // Topografía plana
    temperatura_C: 30,      // Condiciones típicas
    presion_barometrica_mmHg: 760, // Presión estándar
    Cp_int: -0.5,           // Tomo III secc. 8.2.2
    Cp_ext: 0.8,            // Tomo III secc. 8.2.2
    factor_succion: 1.3,    // Factor de seguridad
    densidad_concreto_kg_m3: 2400 // Estándar
  };
}