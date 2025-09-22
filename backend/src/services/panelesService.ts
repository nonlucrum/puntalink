export interface PanelEntrada {
  idMuro: string;      // ej: "P115"
  grosor_mm: number;   // ej: 203
  area_m2: number;     // ej: 66
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
  qViento_kN_m2: 0.5,          // presión de viento
  factorPuntal: 1 / Math.SQRT2 // ≈ 0.707
} as const;

const r2 = (x: number) => Math.round(x * 100) / 100;

export function calcularPanel(p: PanelEntrada): PanelCalculado {
  console.log('[service - panelesService] calcularPanel - Inicio para:', p.idMuro);
  console.log('[service - panelesService] Datos de entrada:', JSON.stringify(p, null, 2));

  const t_m = p.grosor_mm / 1000;
  console.log('[service - panelesService] Grosor en metros:', t_m);

  const volumen_m3 = p.area_m2 * t_m;
  const peso_kN = volumen_m3 * CONST.gammaConcreto_kN_m3;
  const gruaMin_kN = peso_kN * CONST.factorGruaMin;
  const viento_kN = p.area_m2 * CONST.qViento_kN_m2;
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

export function calcularPaneles(entradas: PanelEntrada[]): PanelCalculado[] {
  console.log('[service - panelesService] calcularPaneles - Inicio');
  console.log('[service - panelesService] Número de paneles a calcular:', entradas.length);
  console.log('[service - panelesService] Entradas recibidas:', JSON.stringify(entradas, null, 2));

  const resultados = entradas.map(calcularPanel);

  console.log('[service - panelesService] Cálculos completados para todos los paneles');
  console.log('[service - panelesService] Resultados:', JSON.stringify(resultados, null, 2));

  return resultados;
}