export interface PanelEntrada {
  idMuro: string;      // ej: "P115"
  grosor_mm: number;   // ej: 203
  area_m2: number;     // ej: 66
}

export interface ParametrosProyecto {
  vel_viento?: number;     // velocidad del viento (km/h) - se convierte a m/s
  temp_promedio?: number;  // temperatura promedio (°C)
  presion_atmo?: number;   // presión atmosférica (mmHg) - se convierte a kPa
  tipo_muerto?: string;    // tipo de elemento
}

export interface PanelCalculado extends PanelEntrada {
  volumen_m3: number;
  peso_kN: number;
  gruaMin_kN: number;
  viento_kN: number;
  traccionPuntal_kN: number;
}

const CONST = {
  gammaConcreto_kN_m3: 24,     // peso específico hormigón
  factorGruaMin: 1.15,         // 15% adicional
  qViento_default_kN_m2: 0.5,  // presión de viento por defecto
  factorPuntal: 1 / Math.SQRT2 // ≈ 0.707
} as const;

// Función para convertir velocidad de km/h a m/s
function convertirVelocidad_kmh_a_ms(vel_kmh?: number): number {
  if (!vel_kmh || vel_kmh <= 0) {
    return 0;
  }
  return vel_kmh / 3.6; // 1 km/h = 1/3.6 m/s
}

// Función para convertir presión de mmHg a kPa
function convertirPresion_mmHg_a_kPa(presion_mmHg?: number): number {
  if (!presion_mmHg || presion_mmHg <= 0) {
    return 0;
  }
  return presion_mmHg * 0.133322; // 1 mmHg = 0.133322 kPa
}

// Función para calcular presión de viento basada en velocidad
function calcularPresionViento(vel_viento_kmh?: number): number {
  if (!vel_viento_kmh || vel_viento_kmh <= 0) {
    return CONST.qViento_default_kN_m2;
  }
  
  // Convertir km/h a m/s
  const vel_ms = convertirVelocidad_kmh_a_ms(vel_viento_kmh);
  
  // Fórmula simplificada: q = 0.613 * v² / 1000 (convertir a kN/m²)
  // Donde v está en m/s y el resultado en kN/m²
  return Math.max(0.613 * Math.pow(vel_ms, 2) / 1000, CONST.qViento_default_kN_m2);
}

const r2 = (x: number) => Math.round(x * 100) / 100;

export function calcularPanel(p: PanelEntrada, parametros?: ParametrosProyecto): PanelCalculado {
  console.log('[service - panelesService] calcularPanel - Inicio para:', p.idMuro);
  console.log('[service - panelesService] Datos de entrada:', JSON.stringify(p, null, 2));
  console.log('[service - panelesService] Parámetros del proyecto (originales):', JSON.stringify(parametros, null, 2));

  const t_m = p.grosor_mm / 1000;
  console.log('[service - panelesService] Grosor en metros:', t_m);

  // Calcular presión de viento usando los parámetros del proyecto (conversión km/h -> m/s incluida)
  const qViento_kN_m2 = calcularPresionViento(parametros?.vel_viento);
  
  // Convertir presión atmosférica para información (aunque no se usa en cálculos actuales)
  const presion_kPa = convertirPresion_mmHg_a_kPa(parametros?.presion_atmo);
  const vel_ms = convertirVelocidad_kmh_a_ms(parametros?.vel_viento);
  
  console.log('[service - panelesService] Conversiones realizadas:');
  console.log('  - Velocidad viento:', parametros?.vel_viento, 'km/h ->', vel_ms.toFixed(2), 'm/s');
  console.log('  - Presión atmosférica:', parametros?.presion_atmo, 'mmHg ->', presion_kPa.toFixed(2), 'kPa');
  console.log('  - Presión de viento calculada:', qViento_kN_m2.toFixed(3), 'kN/m²');

  const volumen_m3 = p.area_m2 * t_m;
  const peso_kN = volumen_m3 * CONST.gammaConcreto_kN_m3;
  const gruaMin_kN = peso_kN * CONST.factorGruaMin;
  const viento_kN = p.area_m2 * qViento_kN_m2;
  const traccionPuntal_kN = viento_kN * CONST.factorPuntal;

  const resultado = {
    ...p,
    volumen_m3: r2(volumen_m3),
    peso_kN: r2(peso_kN),
    gruaMin_kN: r2(gruaMin_kN),
    viento_kN: r2(viento_kN),
    traccionPuntal_kN: r2(traccionPuntal_kN),
  };

  console.log('[service - panelesService] Cálculos completados para', p.idMuro, ':', JSON.stringify(resultado, null, 2));
  return resultado;
}

export function calcularPaneles(entradas: PanelEntrada[], parametros?: ParametrosProyecto): PanelCalculado[] {
  console.log('[service - panelesService] calcularPaneles - Inicio');
  console.log('[service - panelesService] Número de paneles a calcular:', entradas.length);
  console.log('[service - panelesService] Entradas recibidas:', JSON.stringify(entradas, null, 2));
  console.log('[service - panelesService] Parámetros del proyecto:', JSON.stringify(parametros, null, 2));

  const resultados = entradas.map(panel => calcularPanel(panel, parametros));

  console.log('[service - panelesService] Cálculos completados para todos los paneles');
  console.log('[service - panelesService] Resultados:', JSON.stringify(resultados, null, 2));

  return resultados;
}