import { PanelCalculado as PanelCalculadoPaneles } from './panelesService';
import type { ParametrosProyecto } from './panelesService';
import { Project } from '../models/Project';

// === Interfaces compartidas entre PDF y DOCX ===

export interface PanelCalculado {
  id_muro: string;
  volumen_m3: number;
  peso_kN: number;
  grua_min_kN_aprox: number;
  fuerza_kN: number;
  traccion_puntal_kN_aprox: number;
  grosor?: number;
  area?: number;
  grados_inclinacion_brace?: number;
  modelo_brace?: string;
  fbx?: number;
  fby?: number;
  fb?: number;
  total_braces?: number;
}

export interface ProjectInfo extends Project {
  nombre: string;
  empresa?: string;
  tipo_muerto?: string;
  vel_viento?: number;
  temp_promedio?: number;
  presion_atmo?: number;
  creadorProyecto?: string;
  version?: string;
}

export interface MuertoResumen {
  numero: string;
  muerto: string;
  x_braces: string;
  angulo: string;
  eje: string;
  tipo_construccion: string;
  cantidad_muros: string;
  muros_incluidos: string;
}

export interface ArmadoMuertoRow {
  deadman: {
    index: number | string;
    eje: string;
    muros: string;
    largo_m: number;
    alto_m: number;
    ancho_m: number;
  };
  acero: {
    cantidad: number | string;
    longitud_m: number;
    peso_kg: number;
    direccion: string;
  };
  concreto: {
    vol_m3: number;
    peso_ton: number;
  };
  alambre: {
    longitud_m: number;
    peso_kg: number;
  };
}

export interface ArmadoMuertoPair {
  deadman: {
    index: number | string;
    eje: string;
    muros: string;
    largo_m: number;
    alto_m: number;
    ancho_m: number;
  };
  longitudinal: {
    cantBarras: number;
    longitud_m: number;
    peso_kg: number;
  };
  transversal: {
    cantEstribos: number;
    longitud_m: number;
    peso_kg: number;
  };
  concreto: {
    vol_m3: number;
    peso_ton: number;
  };
  alambre: {
    longitud_m: number;
    peso_kg: number;
  };
  espaciadoLong_m: number;
  espaciadoTrans_m: number;
  x_inserto: number;
}

export interface UsuarioInfo {
  name: string | null;
  email: string;
}

export interface ReportTotals {
  concreto: { m3: number; ton: number };
  acero: { kg: number; ton: number };
  alambre: { kg: number; ton: number };
  metal: { kg: number; ton: number };
}

export interface ReportData {
  paneles: PanelCalculado[];
  projectInfo?: ProjectInfo;
  tablaMuertos?: MuertoResumen[];
  filasArmado: ArmadoMuertoRow[];
  filasArmadoPairs: ArmadoMuertoPair[];
  totals: ReportTotals;
  user?: UsuarioInfo;
  reportImage?: Buffer;
}

// === Datos crudos del frontend ===

interface RawMacizoData {
  grupo_numero?: number;
  eje?: string | number;
  muros_list?: string;
  cantidadMuros?: number;
  largo_total?: number;
  profundidad?: number;
  alto_total?: number;
  alto?: number;
  espesor_bloque?: number;
  ancho?: number;
  longLongitudinal_m?: number;
  longitudTotalLongitudinal?: number;
  pesoLongitudinal_kg?: number;
  pesoLongitudinal?: number;
  longEstribos_m?: number;
  longitudTotalTransversal?: number;
  pesoEstribos_kg?: number;
  pesoTransversal?: number;
  volumenConcreto_m3?: number;
  volumenConcreto?: number;
  pesoConcreto_kg?: number;
  pesoConcreto?: number;
  longAlambre_m?: number;
  longitudAlambre?: number;
  pesoAlambre_kg?: number;
  pesoAlambre?: number;
  // Campos para tabla de dos filas y tabla de espaciamiento
  cantBarrasLong?: number;
  cantEstribos?: number;
  espaciadoLong_cm?: number;
  espaciadoTrans_cm?: number;
  x_inserto?: number;
  espaciadoLong_m?: number;
  espaciadoTrans_m?: number;
}

// === Funciones de construcción ===

function convertirPanelParaPDF(panel: PanelCalculadoPaneles): PanelCalculado {
  return {
    id_muro: panel.idMuro,
    volumen_m3: panel.volumen_m3,
    peso_kN: panel.peso_kN,
    grua_min_kN_aprox: panel.gruaMin_kN,
    fuerza_kN: panel.fuerza_kN,
    traccion_puntal_kN_aprox: panel.traccionPuntal_kN,
    grosor: panel.grosor,
    area: panel.area
  };
}

export function normalizePaneles(paneles: (PanelCalculado | PanelCalculadoPaneles)[]): PanelCalculado[] {
  return paneles.map(panel => {
    if ('idMuro' in panel) return convertirPanelParaPDF(panel as PanelCalculadoPaneles);
    return panel as PanelCalculado;
  });
}

export function normalizeArmadoRows(
  reporteMacizos?: RawMacizoData[],
  tablaArmado?: ArmadoMuertoRow[]
): ArmadoMuertoRow[] {
  if (reporteMacizos && Array.isArray(reporteMacizos) && reporteMacizos.length > 0) {
    return reporteMacizos.map((m, i) => ({
      deadman: {
        index: m.grupo_numero || (i + 1),
        eje: String(m.eje || '-'),
        muros: m.muros_list || (m.cantidadMuros ? `${m.cantidadMuros} muros` : ''),
        largo_m: m.largo_total || m.profundidad || 0,
        alto_m: m.alto_total || m.alto || 0,
        ancho_m: m.espesor_bloque || m.ancho || 0
      },
      acero: {
        cantidad: '-',
        longitud_m: (m.longLongitudinal_m || m.longitudTotalLongitudinal || 0) + (m.longEstribos_m || m.longitudTotalTransversal || 0),
        peso_kg: (m.pesoLongitudinal_kg || m.pesoLongitudinal || 0) + (m.pesoEstribos_kg || m.pesoTransversal || 0),
        direccion: 'Long+Est'
      },
      concreto: {
        vol_m3: m.volumenConcreto_m3 || m.volumenConcreto || 0,
        peso_ton: (m.pesoConcreto_kg || m.pesoConcreto || 0) / 1000
      },
      alambre: {
        longitud_m: m.longAlambre_m || m.longitudAlambre || 0,
        peso_kg: m.pesoAlambre_kg || m.pesoAlambre || 0
      }
    }));
  }
  return tablaArmado || [];
}

export function computeTotals(rows: ArmadoMuertoRow[]): ReportTotals {
  const sum = <T>(arr: T[], sel: (t: T) => number) =>
    arr.reduce((a, it) => a + (Number(sel(it)) || 0), 0);

  const concretoVol_m3 = sum(rows, r => r.concreto.vol_m3);
  const concretoTon = sum(rows, r => r.concreto.peso_ton);
  const aceroKg = sum(rows, r => r.acero.peso_kg);
  const alambreKg = sum(rows, r => r.alambre.peso_kg);
  const metalKg = aceroKg + alambreKg;

  return {
    concreto: { m3: concretoVol_m3, ton: concretoTon },
    acero: { kg: aceroKg, ton: aceroKg / 1000 },
    alambre: { kg: alambreKg, ton: alambreKg / 1000 },
    metal: { kg: metalKg, ton: metalKg / 1000 }
  };
}

export function normalizeArmadoPairs(
  reporteMacizos?: RawMacizoData[],
): ArmadoMuertoPair[] {
  if (!reporteMacizos || !Array.isArray(reporteMacizos) || reporteMacizos.length === 0) return [];

  return reporteMacizos.map((m, i) => ({
    deadman: {
      index: m.grupo_numero || (i + 1),
      eje: String(m.eje || '-'),
      muros: m.muros_list || (m.cantidadMuros ? `${m.cantidadMuros} muros` : ''),
      largo_m: m.largo_total || m.profundidad || 0,
      alto_m: m.alto_total || m.alto || 0,
      ancho_m: m.espesor_bloque || m.ancho || 0,
    },
    longitudinal: {
      cantBarras: m.cantBarrasLong || 0,
      longitud_m: m.longLongitudinal_m || m.longitudTotalLongitudinal || 0,
      peso_kg: m.pesoLongitudinal_kg || m.pesoLongitudinal || 0,
    },
    transversal: {
      cantEstribos: m.cantEstribos || 0,
      longitud_m: m.longEstribos_m || m.longitudTotalTransversal || 0,
      peso_kg: m.pesoEstribos_kg || m.pesoTransversal || 0,
    },
    concreto: {
      vol_m3: m.volumenConcreto_m3 || m.volumenConcreto || 0,
      peso_ton: (m.pesoConcreto_kg || m.pesoConcreto || 0) / 1000,
    },
    alambre: {
      longitud_m: m.longAlambre_m || m.longitudAlambre || 0,
      peso_kg: m.pesoAlambre_kg || m.pesoAlambre || 0,
    },
    espaciadoLong_m: m.espaciadoLong_m || ((m.espaciadoLong_cm || 0) / 100),
    espaciadoTrans_m: m.espaciadoTrans_m || ((m.espaciadoTrans_cm || 0) / 100),
    x_inserto: m.x_inserto || 0,
  }));
}

export function computeTotalsFromPairs(pairs: ArmadoMuertoPair[]): ReportTotals {
  const sum = <T>(arr: T[], sel: (t: T) => number) =>
    arr.reduce((a, it) => a + (Number(sel(it)) || 0), 0);

  const concretoVol_m3 = sum(pairs, r => r.concreto.vol_m3);
  const concretoTon = sum(pairs, r => r.concreto.peso_ton);
  const aceroKg = sum(pairs, r => r.longitudinal.peso_kg + r.transversal.peso_kg);
  const alambreKg = sum(pairs, r => r.alambre.peso_kg);
  const metalKg = aceroKg + alambreKg;

  return {
    concreto: { m3: concretoVol_m3, ton: concretoTon },
    acero: { kg: aceroKg, ton: aceroKg / 1000 },
    alambre: { kg: alambreKg, ton: alambreKg / 1000 },
    metal: { kg: metalKg, ton: metalKg / 1000 },
  };
}

export interface BuildReportInput {
  paneles: (PanelCalculado | PanelCalculadoPaneles)[];
  projectInfo?: ProjectInfo;
  tablaMuertos?: MuertoResumen[];
  tablaArmado?: ArmadoMuertoRow[];
  reporteMacizos?: RawMacizoData[];
  user?: UsuarioInfo;
  reportImage?: Buffer;
}

export function buildReportData(input: BuildReportInput): ReportData {
  const paneles = normalizePaneles(input.paneles);
  const filasArmado = normalizeArmadoRows(input.reporteMacizos, input.tablaArmado);
  const filasArmadoPairs = normalizeArmadoPairs(input.reporteMacizos);
  const totals = filasArmadoPairs.length > 0
    ? computeTotalsFromPairs(filasArmadoPairs)
    : computeTotals(filasArmado);

  return {
    paneles,
    projectInfo: input.projectInfo,
    tablaMuertos: input.tablaMuertos,
    filasArmado,
    filasArmadoPairs,
    totals,
    user: input.user,
    reportImage: input.reportImage
  };
}

// === Validación de completitud ===

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateReportCompleteness(data: ReportData): ValidationResult {
  const errors: string[] = [];

  if (!data.paneles || data.paneles.length === 0) {
    errors.push('No hay paneles/muros para incluir en el reporte.');
  } else {
    const badGeometry = data.paneles.filter(p => {
      const grosor = Number(p.grosor) || 0;
      const area = Number(p.area) || 0;
      return grosor <= 0 || area <= 0;
    });
    if (badGeometry.length > 0) {
      errors.push(`${badGeometry.length} panel(es) con geometría inválida (grosor o área <= 0).`);
    }

    const noId = data.paneles.filter(p => !p.id_muro);
    if (noId.length > 0) {
      errors.push(`${noId.length} panel(es) sin identificador.`);
    }
  }

  if (!data.projectInfo?.nombre) {
    errors.push('El proyecto no tiene nombre asignado.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function verifyTotals(data: ReportData): ValidationResult {
  const errors: string[] = [];
  const recalculated = computeTotals(data.filasArmado);
  const eps = 0.01;

  const check = (label: string, a: number, b: number) => {
    if (Math.abs(a - b) > eps) {
      errors.push(`Discrepancia en ${label}: ${a.toFixed(4)} vs ${b.toFixed(4)}`);
    }
  };

  check('concreto m3', data.totals.concreto.m3, recalculated.concreto.m3);
  check('concreto ton', data.totals.concreto.ton, recalculated.concreto.ton);
  check('acero kg', data.totals.acero.kg, recalculated.acero.kg);
  check('alambre kg', data.totals.alambre.kg, recalculated.alambre.kg);

  return { valid: errors.length === 0, errors };
}
