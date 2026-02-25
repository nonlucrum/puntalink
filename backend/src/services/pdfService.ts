import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

import { PanelCalculado as PanelCalculadoPaneles } from './panelesService';
import type { ParametrosProyecto } from './panelesService';
import { Project } from '../models/Project';
import {
  ArmadoMuertoRow as ArmadoMuertoRowShared,
  ArmadoMuertoPair,
  computeTotals as computeTotalsShared,
  computeTotalsFromPairs,
  ReportData,
  ReportTotals,
} from './reportDataBuilder';

interface PanelCalculado {
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
}

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

export interface UsuarioInfo {
  name: string | null;
  email: string;
}

interface ProjectInfo extends Project {
  nombre: string;
  empresa?: string;
  tipo_muerto?: string;
  vel_viento?: number;
  temp_promedio?: number;
  presion_atmo?: number;
  creadorProyecto?: string;
  version?: string;
  ubicacion?: string;
}

interface MuertoResumen {
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

// ==================== CONSTANTS ====================
const AZUL = '#2E86AB';
const GRIS_BORDE = '#DDDDDD';
const DISCLAIMER_TEXT = 'We disclaim any liability for any loss or damage, including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from the use of this document. It is your responsibility to verify and independently assess the information provided and to ensure its suitability for your intended purpose. Nuestra empresa no se hace responsable por pérdidas o daños, incluyendo, sin limitación, pérdidas o daños indirectos o consecuentes, o cualquier pérdida o daño que surja de la utilización de este documento. Es su responsabilidad verificar y evaluar de forma independiente la información proporcionada y garantizar su idoneidad para su propósito previsto.';

// ==================== MAIN EXPORT (ReportData signature) ====================
export function generarInformePDF(reportData: ReportData): Promise<Buffer> {
  console.log('[pdfService] Iniciando generación PDF (nuevo formato)...');

  const {
    paneles: rawPaneles,
    projectInfo,
    tablaMuertos,
    filasArmadoPairs,
    totals,
    user,
    reportImage,
  } = reportData;

  const panelesConvertidos: PanelCalculado[] = rawPaneles.map(p => p as any);

  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const buffers: Buffer[] = [];

    addBackgroundImage(doc);
    (doc as any).on('pageAdded', () => addBackgroundImage(doc));

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      console.log('[pdfService] Buffer finalizado.');
      resolve(Buffer.concat(buffers));
    });

    // ===== PAGE STRUCTURE =====
    // 1. Cover page
    crearPortada(doc, projectInfo, reportImage);

    // 2. Project info page
    doc.addPage();
    crearPaginaProyecto(doc, projectInfo, user);

    // 3. Calculation results
    doc.addPage();
    crearPaginasCalculos(doc, panelesConvertidos);

    // 4. Tabla 1: Armado por muerto (dos filas)
    doc.addPage();
    crearTablaArmadoPorMuertoPairs(doc, filasArmadoPairs, totals);

    // 5. Tabla 2: Espaciamiento
    doc.addPage();
    crearTablaEspaciado(doc, filasArmadoPairs);

    // 6. Esquema
    doc.addPage();
    crearEsquema(doc);

    // 7. Resumen por muertos (optional)
    if (tablaMuertos && tablaMuertos.length > 0) {
      doc.addPage();
      crearPaginaMuertos(doc, tablaMuertos);
    }

    // 8. Methodology + signature
    doc.addPage();
    crearDescripcionParametros(doc, projectInfo);
    addSignatureSection(doc, user);

    // ===== ADD HEADERS/FOOTERS TO ALL PAGES =====
    const range = doc.bufferedPageRange();
    const totalPages = range.count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      addHeaderFooter(doc, i + 1, totalPages);
    }

    doc.end();
  });
}

// ==================== LEGACY EXPORT (backward compat) ====================
export function generarInformePaneles(
  paneles: PanelCalculado[] | PanelCalculadoPaneles[],
  projectInfo?: ProjectInfo,
  tablaMuertos?: MuertoResumen[],
  tablaArmado?: ArmadoMuertoRow[],
  user?: UsuarioInfo,
  reporteMacizos?: RawMacizoData[],
  reportImage?: Buffer
): Promise<Buffer> {
  console.log('[pdfService] Iniciando generación PDF (legacy)...');

  let filasArmadoFinales: ArmadoMuertoRow[] = tablaArmado || [];
  if (reporteMacizos && Array.isArray(reporteMacizos) && reporteMacizos.length > 0) {
    filasArmadoFinales = reporteMacizos.map((m, i) => ({
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

  const panelesConvertidos: PanelCalculado[] = paneles.map(panel => {
    if ('idMuro' in panel) return convertirPanelParaPDF(panel as PanelCalculadoPaneles);
    return panel as PanelCalculado;
  });

  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const buffers: Buffer[] = [];

    addBackgroundImage(doc);
    (doc as any).on('pageAdded', () => addBackgroundImage(doc));

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    crearPortada(doc, projectInfo, reportImage);
    doc.addPage();
    crearPaginaProyecto(doc, projectInfo, user);
    doc.addPage();
    crearPaginasCalculos(doc, panelesConvertidos);
    doc.addPage();
    crearEsquema(doc);
    if (tablaMuertos && tablaMuertos.length > 0) {
      doc.addPage();
      crearPaginaMuertos(doc, tablaMuertos);
    }
    doc.addPage();
    crearTablaArmadoLegacy(doc, filasArmadoFinales);
    doc.addPage();
    crearDescripcionParametros(doc, projectInfo);
    addSignatureSection(doc, user);

    const range = doc.bufferedPageRange();
    const totalPages = range.count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      addHeaderFooter(doc, i + 1, totalPages);
    }

    doc.end();
  });
}

export function generarInforme(resultados: any[]): Promise<Buffer> {
  return generarInformePaneles(resultados);
}

// ==================== HEADER / FOOTER ====================

function addHeaderFooter(doc: any, pageNum: number, totalPages: number) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Header: "DEADMAN" top-right
  doc.save();
  doc.fontSize(11).fillColor(AZUL).font('Helvetica-Bold')
     .text('DEADMAN', pageW - 130, 15, { width: 90, align: 'right' });
  doc.restore();

  // Footer area
  const footerY = pageH - 55;

  // Disclaimer (small text)
  doc.save();
  doc.fontSize(5).fillColor('#888888').font('Helvetica')
     .text(DISCLAIMER_TEXT, 40, footerY - 18, {
       width: pageW - 80,
       align: 'justify',
       lineBreak: true,
     });
  doc.restore();

  // Bottom line
  const bottomY = pageH - 20;
  doc.save();
  doc.fontSize(7).fillColor('#888888').font('Helvetica');

  // Website left
  doc.text('www.puntalink.com', 40, bottomY, { width: 150, align: 'left' });

  // Page number center
  doc.text(`Page ${pageNum} of ${totalPages}`, 0, bottomY, { width: pageW, align: 'center' });

  // Date right
  const now = new Date();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
  doc.text(dateStr, pageW - 140, bottomY, { width: 100, align: 'right' });

  doc.restore();
}

// ==================== COVER PAGE ====================

function crearPortada(doc: any, projectInfo?: ProjectInfo, reportImage?: Buffer) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // Background image
  const fondoPath = getAssetPath('fondo.jpg');
  drawCoverImage(doc, fondoPath, pageW, pageH, 0.28);

  doc.save();
  doc.opacity(0.35).rect(0, 0, pageW, pageH).fill('#FFFFFF');
  doc.restore();
  doc.save();
  doc.opacity(0.06).rect(0, 0, pageW, pageH).fill('#000000');
  doc.restore();

  // Logo
  const logoPath = getAssetPath('logo.png');
  const titleFontName =
    registerFontIfExists(doc, 'TitleFont', 'fonts/Montserrat-Bold.ttf') ||
    registerFontIfExists(doc, 'TitleFont', 'fonts/Poppins-SemiBold.ttf');
  if (titleFontName) doc.font('TitleFont'); else doc.font('Helvetica-Bold');

  // Logo centered at top
  const maxLogoWidth = pageW * 0.28;
  const maxLogoHeight = 80;
  try {
    const logoImg = (doc as any).openImage(logoPath);
    const scale = Math.min(maxLogoWidth / logoImg.width, maxLogoHeight / logoImg.height);
    const drawLogoW = logoImg.width * scale;
    const drawLogoH = logoImg.height * scale;
    const logoX = (pageW - drawLogoW) / 2;
    doc.save();
    doc.opacity(1);
    doc.image(logoPath, logoX, 80, { width: drawLogoW, height: drawLogoH });
    doc.restore();
  } catch (e) { /* logo not found */ }

  let currentY = 180;

  // "DEADMAN" title
  doc.fontSize(42).fillColor('#1f1f1f')
     .text('DEADMAN', 0, currentY, { align: 'center' });
  currentY += 55;

  // Bilingual subtitle
  doc.fontSize(13).fillColor('#333333')
     .text('LIFTING AND BRACING ENGINEERING OF TILT-UP PANELS', 0, currentY, { align: 'center' });
  currentY += 18;
  doc.fontSize(11).fillColor('#555555')
     .text('INGENIERÍA DE IZAJE Y PLOMEO DE MUROS TILT-UP', 0, currentY, { align: 'center' });
  currentY += 40;

  // Decorative line
  doc.save();
  doc.strokeColor(AZUL).lineWidth(3)
     .moveTo(pageW * 0.20, currentY)
     .lineTo(pageW * 0.80, currentY)
     .stroke();
  doc.restore();
  currentY += 30;

  // Project details
  const labelX = pageW * 0.15;
  const valueX = pageW * 0.50;
  const lineH = 28;

  const drawCoverField = (labelEn: string, labelEs: string, value?: string | number) => {
    const displayValue = value ? String(value).trim() : '—';
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#333')
       .text(`${labelEn} / ${labelEs}`, labelX, currentY);
    doc.font('Helvetica').fontSize(12).fillColor('#1f1f1f')
       .text(displayValue, valueX, currentY);
    currentY += lineH;
  };

  drawCoverField('PROJECT', 'PROYECTO', projectInfo?.nombre);
  drawCoverField('CONTRACTOR', 'CONTRATISTA', projectInfo?.empresa);

  currentY += 10;

  // Tipo de muerto
  const tipoMuerto = (projectInfo?.tipo_muerto || 'CORRIDO').toUpperCase();
  doc.font('Helvetica-Bold').fontSize(18).fillColor(AZUL)
     .text(`MUERTO ${tipoMuerto}`, 0, currentY, { align: 'center' });
  currentY += 50;

  // User report image
  if (reportImage && reportImage.length > 0) {
    try {
      const maxImgW = pageW * 0.55;
      const maxImgH = 160;
      const img = (doc as any).openImage(reportImage);
      const scale = Math.min(maxImgW / img.width, maxImgH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const imgX = (pageW - drawW) / 2;
      doc.image(reportImage, imgX, currentY, { width: drawW, height: drawH });
      currentY += drawH + 20;
    } catch (err) {
      console.warn('[pdfService] Error al insertar imagen del usuario:', (err as any)?.message || err);
    }
  }

  // Version and date at bottom
  const version = projectInfo?.version || '01';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }).toUpperCase();

  doc.font('Helvetica').fontSize(12).fillColor('#444')
     .text(`VERSION: ${version}`, 0, pageH - 100, { align: 'center' });
  doc.text(`DATE: ${dateStr}`, 0, pageH - 82, { align: 'center' });
}

// ==================== PROJECT INFO PAGE ====================

function crearPaginaProyecto(doc: any, projectInfo?: ProjectInfo, user?: { name?: string | null; email?: string }) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const marginX = 60;

  const logoPath = getAssetPath('logo.png');
  if (fs.existsSync(logoPath)) {
    const img = doc.openImage(logoPath);
    const iw = img.width;
    const ih = img.height;
    const scale = Math.min(180 / iw, 80 / ih);
    const drawW = iw * scale;
    doc.image(logoPath, (pageW - drawW) / 2, 70, { width: drawW });
  }

  doc.fontSize(22).fillColor('#000000').text('PUNTALINK', 0, 160, { align: 'center' });

  let currentY = 210;
  const lineHeight = 32;
  const labelWidth = 160;

  const drawField = (labelEs: string, value?: string | number | undefined) => {
    const displayValue = value === undefined || value === null ? '—' : (typeof value === 'string' ? (value.trim() === '' ? '—' : value.trim()) : String(value));
    doc.fontSize(10).fillColor('#888888')
       .text(`${labelEs.toUpperCase()}`, marginX, currentY, { width: labelWidth });
    doc.fontSize(12).fillColor('#000000')
       .text(displayValue, marginX + labelWidth + 10, currentY);
    currentY += lineHeight;
  };

  drawField('NOMBRE PROYECTO', projectInfo?.nombre);
  drawField('EMPRESA CONSTRUCTORA', projectInfo?.empresa);
  drawField('TIPO DE MUERTO', projectInfo?.tipo_muerto);
  drawField('VELOCIDAD DEL VIENTO (km/h)', projectInfo?.vel_viento);
  drawField('TEMPERATURA PROMEDIO (°C)', projectInfo?.temp_promedio);
  drawField('PRESIÓN ATMOSFÉRICA (mmHg)', projectInfo?.presion_atmo);
  drawField('CREADOR DEL PROYECTO', projectInfo?.creadorProyecto || (user?.name && user.name.trim()) || user?.email || 'No especificado');
  drawField('VERSIÓN', projectInfo?.version);
  drawField('FECHA', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));

  doc.strokeColor('#999999')
     .lineWidth(1)
     .moveTo(marginX, currentY + 10)
     .lineTo(pageW - marginX, currentY + 10)
     .stroke();

  const imgPath = getAssetPath('imgInfo.png');
  if (fs.existsSync(imgPath)) {
    try {
      const img = doc.openImage(imgPath);
      const scale = pageW / img.width;
      const drawH = img.height * scale;
      const y = pageH - drawH;
      doc.save();
      doc.image(imgPath, 0, y, { width: pageW, height: drawH });
      doc.restore();
    } catch (err) {
      console.warn('[pdfService] No se pudo insertar imagenInfo.png:', (err as any)?.message || err);
    }
  }
}

// ==================== CALCULATIONS PAGE ====================

function crearPaginasCalculos(doc: any, paneles: PanelCalculado[]) {
  doc.fontSize(20)
    .fillColor(AZUL)
    .text('RESULTADOS DE CÁLCULOS', 0, 80, { align: 'center' });

  doc.strokeColor(AZUL)
    .lineWidth(2)
    .moveTo(50, 110)
    .lineTo(550, 110)
    .stroke();

  let currentY = 140;
  const totalVolumen = paneles.reduce((sum, p) => sum + (p.volumen_m3 || 0), 0);
  const totalPeso = paneles.reduce((sum, p) => sum + (p.peso_kN || 0), 0);
  const gruaMaxima = Math.max(...paneles.map(p => p.grua_min_kN_aprox || 0));

  doc.fontSize(14)
    .fillColor('#333333')
    .text('RESUMEN GENERAL:', 50, currentY, { underline: true });

  currentY += 25;
  doc.fontSize(12)
    .text(`• Total de paneles analizados: ${paneles.length}`, 70, currentY)
    .text(`• Volumen total de concreto: ${totalVolumen.toFixed(2)} m³`, 70, currentY + 15)
    .text(`• Peso total: ${totalPeso.toFixed(2)} kN`, 70, currentY + 30)
    .text(`• Capacidad máxima de grúa requerida: ${isFinite(gruaMaxima) ? gruaMaxima.toFixed(2) : '0.00'} kN`, 70, currentY + 45);

  currentY += 80;

  doc.fontSize(14)
    .text('DETALLE DE CÁLCULOS POR PANEL:', 50, currentY, { underline: true });

  currentY += 30;

  const tableTop = currentY;
  const colWidths = [60, 80, 70, 70, 80, 80, 80];
  const headers = ['Panel', 'Ángulo (°)', 'Tipo Brace', 'FBx (kN)', 'FBy (kN)', 'FB (kN)', 'Cantidad'];

  doc.fontSize(10).fillColor(AZUL);
  let xPos = 50;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'center' });
    xPos += colWidths[i];
  });

  doc.strokeColor(AZUL)
    .lineWidth(1)
    .moveTo(50, tableTop + 15)
    .lineTo(570, tableTop + 15)
    .stroke();

  currentY = tableTop + 25;

  doc.fillColor('#333333');
  paneles.forEach((panel) => {
    if (currentY > 720) {
      doc.addPage();
      currentY = 80;
    }

    xPos = 50;
    const rowData = [
      panel.id_muro || 'N/A',
      panel.grados_inclinacion_brace || null,
      panel.modelo_brace || 'N/A',
      panel.fbx || 'N/A',
      panel.fby || 'N/A',
      panel.fb || 'N/A',
      panel.total_braces || 'N/A'
    ];

    rowData.forEach((data, j) => {
      doc.text(data, xPos, currentY, { width: colWidths[j], align: 'center' });
      xPos += colWidths[j];
    });

    currentY += 20;
  });
}

// ==================== TABLA 1: ARMADO POR MUERTO (TWO-ROW PAIRS) ====================

function crearTablaArmadoPorMuertoPairs(doc: any, pairs: ArmadoMuertoPair[], totals: ReportTotals) {
  const startX = 40;
  const startY = 70;
  const rowH = 18;
  const bottomMargin = 75; // Leave room for footer

  // Column definitions
  let cols = [
    { key: 'index',     w: 26,  align: 'center' },
    { key: 'eje',       w: 36,  align: 'center' },
    { key: 'muros',     w: 74,  align: 'left'   },
    { key: 'dm_largo',  w: 50,  align: 'center' },
    { key: 'dm_alto',   w: 50,  align: 'center' },
    { key: 'dm_ancho',  w: 50,  align: 'center' },
    // ACERO
    { key: 'acero_cant',w: 32,  align: 'center' },
    { key: 'acero_long',w: 54,  align: 'center' },
    { key: 'acero_peso',w: 54,  align: 'center' },
    { key: 'acero_dir', w: 50,  align: 'center' },
    // CONCRETO
    { key: 'horm_vol',  w: 48,  align: 'center' },
    { key: 'horm_peso', w: 48,  align: 'center' },
    // ALAMBRE
    { key: 'alam_long', w: 48,  align: 'center' },
    { key: 'alam_peso', w: 48,  align: 'center' },
  ];

  // Auto-scale
  const rightMargin = 40;
  const available = doc.page.width - startX - rightMargin;
  const rawTotal = cols.reduce((a, c) => a + c.w, 0);
  const scale = Math.min(1, available / rawTotal);
  if (scale < 1) {
    cols = cols.map(c => ({ ...c, w: Math.max(20, Math.floor(c.w * scale)) }));
  }

  // Group indices
  const idxDM = 0, lenDM = 6;
  const idxAC = 6, lenAC = 4;
  const idxCO = 10, lenCO = 2;
  const idxAL = 12, lenAL = 2;

  const groupWidth = (i: number, len: number) =>
    cols.slice(i, i + len).reduce((a, c) => a + c.w, 0);

  const totalTableW = groupWidth(0, cols.length);

  // Title
  const drawTitle = (y: number) => {
    doc.fontSize(11).fillColor(AZUL).font('Helvetica-Bold')
       .text('Tabla 1. Muerto corrido para muro TILT-UP. Long.: Longitud o longitudinal, Trans.: Transversal, Direc.: Dirección',
         startX, y - 50, { width: totalTableW });
    doc.font('Helvetica');
  };

  // === Group header ===
  const drawBigHeader = (y: number) => {
    const h1 = 22;
    let x = startX;
    const drawGroup = (label: string, from: number, len: number) => {
      const w = groupWidth(from, len);
      doc.save();
      doc.rect(x, y, w, h1).fillAndStroke('#E8F4FD', AZUL);
      doc.fillColor('#1b1b1b').fontSize(8).font('Helvetica-Bold')
         .text(label.toUpperCase(), x, y + 6, { width: w, align: 'center' });
      doc.font('Helvetica');
      doc.restore();
      x += w;
    };
    drawGroup('DEADMAN', idxDM, lenDM);
    drawGroup('Acero', idxAC, lenAC);
    drawGroup('Concreto', idxCO, lenCO);
    drawGroup('Alambre', idxAL, lenAL);
    return y + h1;
  };

  // === Column sub-header ===
  const drawSmallHeader = (y: number) => {
    const h2 = 26;
    const labels = ['Nº', 'Eje', 'Muros', 'Largo', 'Alto', 'Ancho', '#', 'Long.', 'Peso', 'Direc.', 'Vol', 'Peso', 'Long.', 'Peso'];
    const units  = ['', '', '', 'm', 'm', 'm', '', 'm', 'kg', '***', 'm³', 'ton', 'm', 'kg'];

    let x = startX;
    for (let i = 0; i < cols.length; i++) {
      doc.save();
      doc.rect(x, y, cols[i].w, h2).fillAndStroke('#F6F9FC', '#CCCCCC');
      doc.fillColor('#000000').fontSize(7).font('Helvetica-Bold')
         .text(labels[i], x + 2, y + 3, { width: cols[i].w - 4, align: 'center' });
      if (units[i]) {
        doc.fillColor('#777777').fontSize(6).font('Helvetica')
           .text(units[i], x + 2, y + 14, { width: cols[i].w - 4, align: 'center' });
      }
      doc.restore();
      x += cols[i].w;
    }
    return y + h2;
  };

  const drawHeaders = (y: number) => {
    let yy = drawBigHeader(y);
    yy = drawSmallHeader(yy);
    return yy;
  };

  // Draw title and first headers
  drawTitle(startY);
  let y = drawHeaders(startY);

  if (!pairs || pairs.length === 0) {
    doc.fontSize(12).fillColor('#666')
       .text('No existen datos disponibles para esta sección.', startX, y + 8, {
         width: totalTableW, align: 'center'
       });
    return;
  }

  // === Draw data rows ===
  pairs.forEach((pair, idx) => {
    const pairH = rowH * 2;

    // Check page overflow
    if (y + pairH > doc.page.height - bottomMargin) {
      doc.addPage();
      y = drawHeaders(70);
    }

    const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';

    // Deadman cells (span 2 rows)
    const dmCells = [
      { text: String(pair.deadman.index), w: cols[0].w },
      { text: pair.deadman.eje,           w: cols[1].w },
      { text: pair.deadman.muros,         w: cols[2].w, align: 'left' as const },
      { text: fixedOrDash(pair.deadman.largo_m, 2), w: cols[3].w },
      { text: fixedOrDash(pair.deadman.alto_m, 2),  w: cols[4].w },
      { text: fixedOrDash(pair.deadman.ancho_m, 2), w: cols[5].w },
    ];
    let x = startX;
    dmCells.forEach((c) => {
      doc.rect(x, y, c.w, pairH).fillAndStroke(bg, GRIS_BORDE);
      doc.fillColor('#000000').fontSize(8)
         .text(c.text, x + 2, y + (pairH - 8) / 2, { width: c.w - 4, align: (c.align || 'center') as any });
      x += c.w;
    });

    // Concreto cells (span 2 rows)
    const coX = startX + groupWidth(0, idxCO);
    const coVol = fixedOrDash(pair.concreto.vol_m3, 2);
    const coPeso = fixedOrDash(pair.concreto.peso_ton, 1);
    doc.rect(coX, y, cols[10].w, pairH).fillAndStroke(bg, GRIS_BORDE);
    doc.fillColor('#000000').fontSize(8)
       .text(coVol, coX + 2, y + (pairH - 8) / 2, { width: cols[10].w - 4, align: 'center' });
    doc.rect(coX + cols[10].w, y, cols[11].w, pairH).fillAndStroke(bg, GRIS_BORDE);
    doc.fillColor('#000000').fontSize(8)
       .text(coPeso, coX + cols[10].w + 2, y + (pairH - 8) / 2, { width: cols[11].w - 4, align: 'center' });

    // Alambre cells (span 2 rows)
    const alX = coX + cols[10].w + cols[11].w;
    doc.rect(alX, y, cols[12].w, pairH).fillAndStroke(bg, GRIS_BORDE);
    doc.fillColor('#000000').fontSize(8)
       .text(fixedOrDash(pair.alambre.longitud_m, 0), alX + 2, y + (pairH - 8) / 2, { width: cols[12].w - 4, align: 'center' });
    doc.rect(alX + cols[12].w, y, cols[13].w, pairH).fillAndStroke(bg, GRIS_BORDE);
    doc.fillColor('#000000').fontSize(8)
       .text(fixedOrDash(pair.alambre.peso_kg, 1), alX + cols[12].w + 2, y + (pairH - 8) / 2, { width: cols[13].w - 4, align: 'center' });

    // === ROW 1: Longitudinal ===
    const acX = startX + groupWidth(0, idxAC);
    const longCells = [
      { text: String(pair.longitudinal.cantBarras || '-'), w: cols[6].w },
      { text: fixedOrDash(pair.longitudinal.longitud_m, 1), w: cols[7].w },
      { text: fixedOrDash(pair.longitudinal.peso_kg, 1),    w: cols[8].w },
      { text: 'Long.',                                      w: cols[9].w },
    ];
    let ax = acX;
    longCells.forEach((c) => {
      doc.rect(ax, y, c.w, rowH).fillAndStroke(bg, GRIS_BORDE);
      doc.fillColor('#000000').fontSize(8)
         .text(c.text, ax + 2, y + 4, { width: c.w - 4, align: 'center' });
      ax += c.w;
    });

    y += rowH;

    // === ROW 2: Transversal ===
    const transCells = [
      { text: String(pair.transversal.cantEstribos || '-'), w: cols[6].w },
      { text: fixedOrDash(pair.transversal.longitud_m, 1),  w: cols[7].w },
      { text: fixedOrDash(pair.transversal.peso_kg, 1),     w: cols[8].w },
      { text: 'Trans.',                                     w: cols[9].w },
    ];
    ax = acX;
    transCells.forEach((c) => {
      doc.rect(ax, y, c.w, rowH).fillAndStroke(bg, GRIS_BORDE);
      doc.fillColor('#000000').fontSize(8)
         .text(c.text, ax + 2, y + 4, { width: c.w - 4, align: 'center' });
      ax += c.w;
    });

    y += rowH;
  });

  // === TOTALS ROW ===
  y += 6;
  if (y + 50 > doc.page.height - bottomMargin) {
    doc.addPage();
    y = 80;
  }

  const totH = 22;
  // "Totales" label spanning deadman columns
  const dmW = groupWidth(idxDM, lenDM);
  doc.rect(startX, y, dmW, totH).fillAndStroke('#E8F4FD', AZUL);
  doc.fillColor('#1b1b1b').fontSize(9).font('Helvetica-Bold')
     .text('Totales', startX + 2, y + 6, { width: dmW - 4, align: 'center' });
  doc.font('Helvetica');

  // Acero total
  const acW = groupWidth(idxAC, lenAC);
  const acTotalX = startX + dmW;
  doc.rect(acTotalX, y, acW, totH).fillAndStroke('#E8F4FD', AZUL);
  doc.fillColor('#1b1b1b').fontSize(8)
     .text(`${fmt(totals.acero.kg, 1)} kg / ${fmt(totals.acero.ton, 2)} ton`, acTotalX + 2, y + 6, { width: acW - 4, align: 'center' });

  // Concreto total
  const coW = groupWidth(idxCO, lenCO);
  const coTotalX = acTotalX + acW;
  doc.rect(coTotalX, y, coW, totH).fillAndStroke('#E8F4FD', AZUL);
  doc.fillColor('#1b1b1b').fontSize(8)
     .text(`${fmt(totals.concreto.m3, 2)} m³ / ${fmt(totals.concreto.ton, 1)} ton`, coTotalX + 2, y + 6, { width: coW - 4, align: 'center' });

  // Alambre total
  const alW = groupWidth(idxAL, lenAL);
  const alTotalX = coTotalX + coW;
  doc.rect(alTotalX, y, alW, totH).fillAndStroke('#E8F4FD', AZUL);
  doc.fillColor('#1b1b1b').fontSize(8)
     .text(`${fmt(totals.alambre.kg, 1)} kg`, alTotalX + 2, y + 6, { width: alW - 4, align: 'center' });
}

// ==================== TABLA 2: ESPACIAMIENTO ====================

function crearTablaEspaciado(doc: any, pairs: ArmadoMuertoPair[]) {
  const startX = 40;
  const startY = 70;
  const rowH = 20;
  const bottomMargin = 75;

  // Title
  doc.fontSize(11).fillColor(AZUL).font('Helvetica-Bold')
     .text('Tabla 2. Espaciamiento de las varillas por muerto.', startX, startY - 40, { width: 500 });
  doc.font('Helvetica');

  const colDefs = [
    { label: 'Nº',    w: 36,  align: 'center' },
    { label: 'Eje',   w: 40,  align: 'center' },
    { label: 'Muros', w: 130, align: 'left'   },
    { label: 'Espaciado\nLongitudinal (m)', w: 95, align: 'center' },
    { label: 'Espaciado\nTransversal (m)',  w: 95, align: 'center' },
    { label: 'Distancia X (m)\n(Desde la cara del muro\nhasta el punto del anclaje)', w: 120, align: 'center' },
  ];

  // Header
  const headerH = 36;
  let x = startX;
  let y = startY;

  colDefs.forEach((col) => {
    doc.save();
    doc.rect(x, y, col.w, headerH).fillAndStroke('#E8F4FD', AZUL);
    doc.fillColor('#000000').fontSize(7).font('Helvetica-Bold')
       .text(col.label, x + 3, y + 4, { width: col.w - 6, align: 'center' });
    doc.font('Helvetica');
    doc.restore();
    x += col.w;
  });
  y += headerH;

  if (!pairs || pairs.length === 0) {
    doc.fontSize(11).fillColor('#666')
       .text('No hay datos de espaciamiento disponibles.', startX, y + 10, { width: 400, align: 'center' });
    return;
  }

  pairs.forEach((pair, idx) => {
    if (y + rowH > doc.page.height - bottomMargin) {
      doc.addPage();
      // Redraw header
      x = startX;
      y = 70;
      colDefs.forEach((col) => {
        doc.save();
        doc.rect(x, y, col.w, headerH).fillAndStroke('#E8F4FD', AZUL);
        doc.fillColor('#000000').fontSize(7).font('Helvetica-Bold')
           .text(col.label, x + 3, y + 4, { width: col.w - 6, align: 'center' });
        doc.font('Helvetica');
        doc.restore();
        x += col.w;
      });
      y += headerH;
    }

    const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
    const rowData = [
      { text: `D${pair.deadman.index}`, w: colDefs[0].w, align: 'center' },
      { text: pair.deadman.eje,         w: colDefs[1].w, align: 'center' },
      { text: pair.deadman.muros,       w: colDefs[2].w, align: 'left' },
      { text: fixedOrDash(pair.espaciadoLong_m, 2),  w: colDefs[3].w, align: 'center' },
      { text: fixedOrDash(pair.espaciadoTrans_m, 2), w: colDefs[4].w, align: 'center' },
      { text: fixedOrDash(pair.x_inserto, 2),        w: colDefs[5].w, align: 'center' },
    ];

    x = startX;
    rowData.forEach((c) => {
      doc.rect(x, y, c.w, rowH).fillAndStroke(bg, '#CCCCCC');
      doc.fillColor('#000000').fontSize(8)
         .text(c.text, x + 3, y + 5, { width: c.w - 6, align: c.align as any });
      x += c.w;
    });
    y += rowH;
  });

  // Note
  y += 15;
  doc.fontSize(9).fillColor('#333')
     .text('Nota:', startX, y, { underline: true });
  y += 14;
  doc.fontSize(8).fillColor('#555')
     .text('Revisar que la distancia X (distancia horizontal) que va desde la cara del muro al punto de apuntalamiento del brace (centro del muerto) coincida con los shop tickets de la ingeniería de izaje.',
       startX, y, { width: 450, align: 'justify' });
}

// ==================== LEGACY TABLE (single-row format) ====================

function crearTablaArmadoLegacy(doc: any, filas: ArmadoMuertoRow[]) {
  const startX = 40;
  const startY = 70;
  const rowH = 22;
  const bottomMargin = 60;

  let cols = [
    { key: 'index', w: 26 }, { key: 'eje', w: 36 }, { key: 'muros', w: 74 },
    { key: 'dm_largo', w: 50 }, { key: 'dm_alto', w: 50 }, { key: 'dm_ancho', w: 50 },
    { key: 'acero_cant', w: 32 }, { key: 'acero_long', w: 64 }, { key: 'acero_peso', w: 54 },
    { key: 'acero_dir', w: 68 },
    { key: 'horm_vol', w: 54 }, { key: 'horm_peso', w: 54 },
    { key: 'alam_long', w: 68 }, { key: 'alam_peso', w: 54 },
  ];

  const rightMargin = 40;
  const available = doc.page.width - startX - rightMargin;
  const rawTotal = cols.reduce((a, c) => a + c.w, 0);
  const scl = Math.min(1, available / rawTotal);
  if (scl < 1) cols = cols.map(c => ({ ...c, w: Math.max(22, Math.floor(c.w * scl)) }));

  const groupWidth = (i: number, len: number) => cols.slice(i, i + len).reduce((a, c) => a + c.w, 0);

  const drawHeaders = (y: number) => {
    const h1 = 24; const h2 = 18;
    let x = startX;
    const drawGrp = (lbl: string, from: number, len: number) => {
      const w = groupWidth(from, len);
      doc.save(); doc.rect(x, y, w, h1).fillAndStroke('#E8F4FD', AZUL);
      doc.fillColor('#1b1b1b').fontSize(9).text(lbl.toUpperCase(), x, y + 6, { width: w, align: 'center' });
      doc.restore(); x += w;
    };
    drawGrp('DEADMAN', 0, 6); drawGrp('ACERO', 6, 4); drawGrp('CONCRETO', 10, 2); drawGrp('ALAMBRE', 12, 2);

    const labels = ['#','EJE','MUROS','LARGO','ALTO','ANCHO','#','LONGITUD','PESO','DIRECCIÓN','VOL','PESO','LONGITUD','PESO'];
    x = startX;
    for (let i = 0; i < cols.length; i++) {
      doc.save(); doc.rect(x, y + h1, cols[i].w, h2).fillAndStroke('#F6F9FC', '#CCCCCC');
      doc.fillColor('#000000').fontSize(7).text(labels[i], x, y + h1 + 4, { width: cols[i].w, align: 'center' });
      doc.restore(); x += cols[i].w;
    }
    return y + h1 + h2;
  };

  doc.fontSize(18).fillColor(AZUL).text('Tabla de Armado por Muerto', startX, startY - 38);
  let y = drawHeaders(startY);

  filas.forEach((r, idx) => {
    if (y + rowH > doc.page.height - bottomMargin) { doc.addPage(); y = drawHeaders(70); }
    const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
    let x = startX;
    const cells = [
      r.deadman.index, r.deadman.eje, r.deadman.muros,
      fixedOrDash(r.deadman.largo_m, 2), fixedOrDash(r.deadman.alto_m, 2), fixedOrDash(r.deadman.ancho_m, 2),
      r.acero.cantidad ?? '—', fixedOrDash(r.acero.longitud_m, 2), fixedOrDash(r.acero.peso_kg, 2), r.acero.direccion || '—',
      fixedOrDash(r.concreto.vol_m3, 2), fixedOrDash(r.concreto.peso_ton, 2),
      fixedOrDash(r.alambre.longitud_m, 2), fixedOrDash(r.alambre.peso_kg, 2),
    ];
    cells.forEach((text, i) => {
      doc.rect(x, y, cols[i].w, rowH).fillAndStroke(bg, GRIS_BORDE);
      doc.fillColor('#000').fontSize(9).text(String(text), x + 3, y + 6, { width: cols[i].w - 6, align: 'center' as any });
      x += cols[i].w;
    });
    y += rowH;
  });
}

// ==================== ESQUEMA ====================

function crearEsquema(doc: any) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const margin = 40;
  const topY = 70;

  doc.fontSize(20).fillColor(AZUL).text('ESQUEMA DE ARMADO', 0, 40, { align: 'center' });
  doc.strokeColor(AZUL).lineWidth(2).moveTo(margin, 66).lineTo(pageW - margin, 66).stroke();

  const imgPath = getAssetPath('esquema.png');

  try {
    if (!fs.existsSync(imgPath)) {
      const phTop = topY + 10;
      const phH = pageH - phTop - margin;
      doc.save();
      doc.rect(margin, phTop, pageW - margin * 2, phH).strokeColor('#B0B0B0').dash(5, { space: 3 }).stroke();
      doc.undash();
      doc.fontSize(12).fillColor('#666666')
         .text('ESQUEMA NO DISPONIBLE\nColoca el archivo en assets/esquema.png', margin, phTop + 12, {
           width: pageW - margin * 2, align: 'center'
         });
      doc.restore();
      return;
    }

    const img = (doc as any).openImage(imgPath);
    const maxW = pageW - margin * 2;
    const maxH = pageH - topY - margin;
    const captionHeight = 20;
    const sc = Math.min(maxW / img.width, (maxH - captionHeight) / img.height);
    const drawW = img.width * sc;
    const drawH = img.height * sc;
    const x = (pageW - drawW) / 2;
    const yImg = topY + (maxH - (drawH + captionHeight)) / 2;

    doc.save();
    doc.image(imgPath, x, yImg, { width: drawW, height: drawH });
    doc.restore();

    doc.fontSize(10).fillColor('#555')
       .text('Figura: Esquema referencial de armado del muerto', margin, yImg + drawH + 6, {
         width: pageW - margin * 2, align: 'center', lineBreak: false
       });
  } catch (err) {
    console.warn('[pdfService] No se pudo dibujar esquema:', (err as any)?.message || err);
  }
}

// ==================== RESUMEN POR MUERTOS ====================

function crearPaginaMuertos(doc: any, tablaMuertos: MuertoResumen[]) {
  doc.fontSize(20).fillColor(AZUL).text('RESUMEN POR MUERTOS', 50, 50);
  doc.fontSize(12).fillColor('#000000').text('Agrupación de muros por características similares', 50, 80);

  let currentY = 110;
  const headers = ['#', 'Muerto', 'X Braces', 'Ángulo', 'Eje', 'Tipo Construcción', 'Cant. Muros'];
  const colWidths = [30, 60, 60, 50, 60, 90, 60];
  const startX = 50;

  doc.fontSize(10).fillColor(AZUL);
  let currentX = startX;
  headers.forEach((header, i) => {
    doc.rect(currentX, currentY, colWidths[i], 20).fillAndStroke('#E8F4FD', AZUL);
    doc.fillColor('#000000').text(header, currentX + 5, currentY + 5, { width: colWidths[i] - 10, align: 'center' });
    currentX += colWidths[i];
  });
  currentY += 20;

  doc.fontSize(9);
  tablaMuertos.forEach((muerto, index) => {
    if (currentY > 750) { doc.addPage(); currentY = 50; }

    currentX = startX;
    const data = [muerto.numero, muerto.muerto, muerto.x_braces, muerto.angulo, muerto.eje, muerto.tipo_construccion, muerto.cantidad_muros];
    const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F8F9FA';

    data.forEach((value, i) => {
      doc.rect(currentX, currentY, colWidths[i], 20).fillAndStroke(bgColor, '#CCCCCC');
      doc.fillColor('#000000').text(value, currentX + 5, currentY + 5, { width: colWidths[i] - 10, align: i === 1 || i === 4 || i === 5 ? 'left' : 'center' });
      currentX += colWidths[i];
    });
    currentY += 20;

    if (muerto.muros_incluidos && muerto.muros_incluidos.length > 0 && currentY < 740) {
      doc.fontSize(8).fillColor('#666666').text(`Muros: ${muerto.muros_incluidos}`, startX + 5, currentY + 2, { width: 500 });
      currentY += 15;
      doc.fontSize(9).fillColor('#000000');
    }
  });

  currentY += 30;
  if (currentY < 700) {
    doc.fontSize(10).fillColor('#666666').text(`Total de grupos de muertos: ${tablaMuertos.length}`, startX, currentY);
    const totalMuros = tablaMuertos.reduce((sum, m) => sum + parseInt(m.cantidad_muros), 0);
    doc.text(`Total de muros: ${totalMuros}`, startX, currentY + 15);
  }
}

// ==================== METHODOLOGY PAGE ====================

function crearDescripcionParametros(doc: any, projectInfo?: ProjectInfo) {
  doc.fontSize(20).fillColor(AZUL).text('METODOLOGÍA Y PARÁMETROS', 0, 80, { align: 'center' });
  doc.strokeColor(AZUL).lineWidth(2).moveTo(50, 110).lineTo(550, 110).stroke();

  let currentY = 140;

  doc.fontSize(14).fillColor('#333333').text('DESCRIPCIÓN DEL CÁLCULO:', 50, currentY, { underline: true });
  currentY += 25;

  doc.fontSize(11)
    .text('El cálculo del muerto está en base a la fuerza axial que actúa en el brace producto de la acción de la fuerza del viento sobre el muro.', 50, currentY, { width: 500, align: 'justify' });
  currentY += 35;

  doc.text('La fuerza de viento actuante en cada muro fue determinada haciendo uso de las "Normas y especificaciones para estudios, proyectos, construcciones e instalaciones del 2015 Volumen 4-México", y tomando en cuenta los siguientes parámetros:', 50, currentY, { width: 500, align: 'justify' });
  currentY += 50;

  doc.fontSize(14).text('PARÁMETROS UTILIZADOS:', 50, currentY, { underline: true });
  currentY += 25;

  doc.fontSize(12);
  if (projectInfo?.vel_viento !== undefined) {
    doc.text(`a) Velocidad del viento: ${projectInfo.vel_viento} km/h`, 70, currentY);
    currentY += 20;
  }
  if (projectInfo?.temp_promedio !== undefined) {
    doc.text(`b) Temperatura promedio: ${projectInfo.temp_promedio}°C`, 70, currentY);
    currentY += 20;
  }
  if (projectInfo?.presion_atmo !== undefined) {
    doc.text(`c) Presión atmosférica: ${projectInfo.presion_atmo} mmHg`, 70, currentY);
    currentY += 20;
  }

  currentY += 20;

  // Construction notes
  doc.fontSize(11).fillColor('#333')
     .text('El muerto debe ser enterrado en ambas caras laterales.', 50, currentY, { width: 500 });
  currentY += 16;
  doc.text('Las dimensiones fueron determinadas en base a la relación de densidad=masa/volumen, donde el volumen es descompuesto en Largo × Alto × Ancho.', 50, currentY, { width: 500, align: 'justify' });
  currentY += 28;
  doc.text('No se consideró la fricción entre las paredes de contacto terreno y el muerto para hacerlo más seguro.', 50, currentY, { width: 500, align: 'justify' });
  currentY += 40;

  if (projectInfo?.creadorProyecto) {
    doc.fontSize(14).text('ELABORADO POR:', 50, currentY, { underline: true });
    currentY += 25;
    doc.fontSize(12).text(projectInfo.creadorProyecto, 70, currentY);
  }

  doc.fontSize(8).fillColor('#666666')
     .text('Generado por PUNTALINK - Sistema de análisis y cálculo estructural', 0, 750, { align: 'center' });
}

// ==================== HELPER FUNCTIONS ====================

function fixedOrDash(n?: number, d = 2) {
  return (n === null || n === undefined || Number.isNaN(n)) ? '—' : Number(n).toFixed(d);
}

function fmt(n: number, d: number) {
  return (Number(n) || 0).toFixed(d);
}

function getAssetPath(relPathFromSrcAssets: string) {
  const tryDist = path.resolve(__dirname, '../assets', relPathFromSrcAssets);
  const trySrc = path.resolve(__dirname, '../../src/assets', relPathFromSrcAssets);
  if (fs.existsSync(tryDist)) return tryDist;
  if (fs.existsSync(trySrc)) return trySrc;
  return path.resolve(process.cwd(), 'src/assets', relPathFromSrcAssets);
}

function drawCoverImage(doc: any, imagePath: string, pageW: number, pageH: number, opacity = 0.28) {
  try {
    const img = doc.openImage(imagePath);
    const iw = img.width;
    const ih = img.height;
    const scale = Math.max(pageW / iw, pageH / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const offsetX = (pageW - drawW) / 2;
    const offsetY = (pageH - drawH) / 2;
    doc.save();
    doc.opacity(opacity);
    doc.image(imagePath, offsetX, offsetY, { width: drawW, height: drawH });
    doc.restore();
  } catch (e) { /* cover image not found */ }
}

function registerFontIfExists(doc: any, name: string, assetsRelPath: string) {
  const fontPath = getAssetPath(assetsRelPath);
  if (fs.existsSync(fontPath)) {
    doc.registerFont(name, fontPath);
    return name;
  }
  return null;
}

function addBackgroundImage(doc: any) {
  const bgPath = getAssetPath('marca_de_agua.png');
  if (!fs.existsSync(bgPath)) return;

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  try {
    const img = doc.openImage(bgPath);
    const scale = Math.max(pageW / img.width, pageH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const offsetX = (pageW - drawW) / 2;
    const offsetY = (pageH - drawH) / 2;
    doc.save();
    doc.image(bgPath, offsetX, offsetY, { width: drawW, height: drawH });
    doc.restore();
  } catch (err) {
    console.warn('[pdfService] Error al aplicar fondo:', (err as any)?.message || err);
  }
}

function addSignatureSection(doc: any, user?: { name?: string | null; email?: string }) {
  if (!user) return;

  const pageH = doc.page.height;
  const currentY = doc.y;
  const spaceNeeded = 120;
  if (currentY + spaceNeeded > pageH - 60) return;

  const centerX = doc.page.width / 2;
  const lineWidth = 160;
  const lineY = Math.max(currentY + 60, pageH - 160);
  const lineX = centerX - lineWidth / 2;

  doc.strokeColor('#000000').lineWidth(1)
     .moveTo(lineX, lineY).lineTo(lineX + lineWidth, lineY).stroke();

  const displayName = (user.name && user.name.trim()) ? user.name : (user.email ?? '__________________');
  const displayEmail = user.email ?? '';

  doc.fontSize(11).fillColor('#000000').text(displayName, 0, lineY + 8, { align: 'center' });
  doc.fontSize(10).fillColor('#444444').text(displayEmail, 0, lineY + 24, { align: 'center' });
}
