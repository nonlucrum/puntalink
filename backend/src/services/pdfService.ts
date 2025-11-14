import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

import { PanelCalculado as PanelCalculadoPaneles } from './panelesService';
import type { ParametrosProyecto } from './panelesService';
import { Project } from '../models/Project';

interface PanelCalculado {
  id_muro: string;
  volumen_m3: number;
  peso_kN: number;
  grua_min_kN_aprox: number;
  fuerza_kN: number;
  traccion_puntal_kN_aprox: number;
  // Información adicional para el PDF
  grosor?: number;
  area?: number;
  grados_inclinacion_brace?: number;
  modelo_brace?: string;
    fbx?: number;
    fby?: number;
    fb?: number;
    total_braces?: number;
}

// Función para convertir entre formatos
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
  name: string | null;   // acepta null si tu BD no tiene nombre
  email: string;         // requerido para mostrar al menos el correo
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

// Formato de fila para el detalle de armado muerto
export interface ArmadoMuertoRow {
  deadman: {
    index: number | string;      // "#"
    eje: string;                 // EJE
    muros: string;               // MUROS (por ej: "M1, M2")
    largo_m: number;             // LARGO (M)
    alto_m: number;              // ALTO (M)
    ancho_m: number;             // ANCHO (M)
  };
  acero: {
    cantidad: number;            // # (varillas)
    longitud_m: number;          // LONGITUD (M)
    peso_kg: number;             // PESO (KG)
    direccion: string;           // DIRECCIÓN (*** o texto corto)
  };
  concreto: {
    vol_m3: number;              // VOL (M³)
    peso_ton: number;            // PESO (TON)
  };
  alambre: {
    longitud_m: number;          // LONGITUD (M)
    peso_kg: number;             // PESO (KG)
  };
}

export function generarInformePaneles(
  paneles: PanelCalculado[] | PanelCalculadoPaneles[],
  projectInfo?: ProjectInfo,
  tablaMuertos?: MuertoResumen[],
  tablaArmado?: ArmadoMuertoRow[],
  user?: UsuarioInfo
): Promise<Buffer>;
export function generarInformePaneles(
  paneles: PanelCalculado[] | PanelCalculadoPaneles[],
  projectInfo?: ProjectInfo,
  tablaMuertos?: MuertoResumen[],
  tablaArmado?: ArmadoMuertoRow[],
  user?: UsuarioInfo
): Promise<Buffer>

export function generarInformePaneles(
  paneles: PanelCalculado[] | PanelCalculadoPaneles[],
  projectInfo?: ProjectInfo,
  tablaMuertos?: MuertoResumen[],
  tablaArmado?: ArmadoMuertoRow[],
  user?: UsuarioInfo
): Promise<Buffer> {
  console.log('[pdfService] Generando informe para', paneles.length, 'paneles');
  if (projectInfo) {
    console.log('[pdfService] Con información del proyecto:', projectInfo);
  }
  if (tablaMuertos) {
    console.log('[pdfService] Con tabla de muertos:', tablaMuertos.length, 'grupos');
  }

  console.log('[pdfService] user recibido:', user);
  
  // Convertir paneles al formato interno si es necesario
  const panelesConvertidos: PanelCalculado[] = paneles.map(panel => {
    if ('idMuro' in panel) {
      // Es un PanelCalculadoPaneles, convertir
      return convertirPanelParaPDF(panel as PanelCalculadoPaneles);
    } else {
      // Ya es un PanelCalculado
      return panel as PanelCalculado;
    }
  });
  
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];

    // === Fondo o marca de agua en todas las páginas ===
    addBackgroundImage(doc); // primera página
    (doc as any).on('pageAdded', () => addBackgroundImage(doc));

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      console.log('[pdfService] PDF generado exitosamente');
      resolve(Buffer.concat(buffers));
    });

    // ===== PORTADA =====
    crearPortada(doc, projectInfo);
    
    // ===== INFORMACIÓN DEL PROYECTO =====
    doc.addPage();
    crearPaginaProyecto(doc, projectInfo, user);
    
    // ===== CÁLCULOS =====
    doc.addPage();
    crearPaginasCalculos(doc, panelesConvertidos);

    // ===== ESQUEMA =====
    doc.addPage();
    crearEsquema(doc);
    
    // ===== RESUMEN POR MUERTOS =====
    if (tablaMuertos && tablaMuertos.length > 0) {
      doc.addPage();
      crearPaginaMuertos(doc, tablaMuertos);
    }

    // ===== TABLA DE ARMADO POR MUERTO =====
    doc.addPage();
    crearTablaArmadoPorMuerto(doc, tablaArmado || []);
    
    // ===== DESCRIPCIÓN DE PARÁMETROS =====
    doc.addPage();
    crearDescripcionParametros(doc, projectInfo);

    // ===== FIRMA =====
    addSignatureSection(doc, user);

    doc.end();
  });
}

// Portada
function crearPortada(doc: any, projectInfo?: ProjectInfo) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // ========= 1) FONDO A PÁGINA COMPLETA (cover) =========
  const fondoPath = getAssetPath('fondo.jpg');
  drawCoverImage(doc, fondoPath, pageW, pageH, 0.28); // imagen de fondo con opacidad

  // Lavado para simular B/N y mejorar legibilidad
  doc.save();
  doc.opacity(0.35).rect(0, 0, pageW, pageH).fill('#FFFFFF'); // capa blanca
  doc.restore();
  doc.save();
  doc.opacity(0.06).rect(0, 0, pageW, pageH).fill('#000000'); // toque gris
  doc.restore();

  // ========= 2) LOGO ARRIBA + TÍTULO DEBAJO (CENTRADOS) =========
  const logoPath = getAssetPath('logo.png');

  // Fuente llamativa si está disponible; sino Helvetica-Bold
  const titleFontName =
    registerFontIfExists(doc, 'TitleFont', 'fonts/Montserrat-Bold.ttf') ||
    registerFontIfExists(doc, 'TitleFont', 'fonts/Poppins-SemiBold.ttf');
  if (titleFontName) doc.font('TitleFont'); else doc.font('Helvetica-Bold');

  const title = 'PUNTALINK';
  const titleSize = 38;
  const topMargin = 110;   // altura del bloque logo+título
  const gapLogoTitle = 12; // espacio entre logo y título

  // Medidas del título
  doc.fontSize(titleSize).fillColor('#1f1f1f');
  const titleLineHeight = doc.currentLineHeight();

  // Escalado del logo manteniendo proporción
  const maxLogoWidth = doc.page.width * 0.28;
  const maxLogoHeight = Math.max(80, titleLineHeight * 1.6);

  // openImage no está tipado en PDFKit, así que casteamos a any
  const logoImg = (doc as any).openImage(logoPath);
  const lw = logoImg.width;
  const lh = logoImg.height;
  const scale = Math.min(maxLogoWidth / lw, maxLogoHeight / lh);
  const drawLogoW = lw * scale;
  const drawLogoH = lh * scale;

  const logoX = (pageW - drawLogoW) / 2;
  const logoY = topMargin;

  doc.save();
  doc.opacity(1);
  doc.image(logoPath, logoX, logoY, { width: drawLogoW, height: drawLogoH });
  doc.restore();

  // Título centrado justo debajo del logo
  const titleY = logoY + drawLogoH + gapLogoTitle;
  doc.fontSize(titleSize).fillColor('#1f1f1f')
     .text(title, 0, titleY, { align: 'center' });

  // >>> ÚNICA referencia vertical posterior (NO la declares dos veces)
  const afterTitleY = titleY + titleLineHeight + 12;

  // ========= 3) SUBTÍTULO, LÍNEA Y TÍTULO DEL INFORME (centrados) =========
  doc.fontSize(16)
     .fillColor('#4a4a4a')
     .text('Sistema de Análisis y Cálculo Estructural', 0, afterTitleY, { align: 'center' });

  doc.save();
  doc.strokeColor('#2E86AB').lineWidth(3)
     .moveTo(pageW * 0.25, afterTitleY + 28)
     .lineTo(pageW * 0.75, afterTitleY + 28)
     .stroke();
  doc.restore();

  doc.fontSize(20).fillColor('#333333')
     .text('INFORME DE ANÁLISIS', 0, afterTitleY + 58, { align: 'center' })
     .text('DE MUERTOS CORRIDOS', 0, afterTitleY + 86, { align: 'center' });

  // ========= 4) INFO DEL PROYECTO EN PORTADA =========
  let currentY = afterTitleY + 140;

  if (projectInfo?.nombre) {
    doc.fontSize(18).fillColor('#2E86AB').text('PROYECTO:', 0, currentY, { align: 'center' });
    doc.fontSize(16).fillColor('#333333').text(projectInfo.nombre, 0, currentY + 25, { align: 'center' });
    currentY += 70;
  }

  if (projectInfo?.empresa) {
    doc.fontSize(16).fillColor('#2E86AB').text('CONSTRUCTORA:', 0, currentY, { align: 'center' });
    doc.fontSize(14).fillColor('#333333').text(projectInfo.empresa, 0, currentY + 20, { align: 'center' });
    currentY += 60;
  }

  // ========= 5) FECHA EN EL PIE DE LA PORTADA =========
  doc.fontSize(12)
     .fillColor('#666666')
     .text(
       `Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`,
       0,
       pageH - 90,
       { align: 'center' }
     );
}

// Info del proyecto
function crearPaginaProyecto(doc: any, projectInfo?: ProjectInfo, user?: { name?: string | null; email?: string }) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const marginX = 60;

  // === LOGO DE PUNTALINK ===
  const logoPath = getAssetPath('logo.png');
  if (fs.existsSync(logoPath)) {
    const img = doc.openImage(logoPath);
    const iw = img.width;
    const ih = img.height;
    const scale = Math.min(180 / iw, 80 / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const logoX = (pageW - drawW) / 2;
    doc.image(logoPath, logoX, 70, { width: drawW });
  }

  // === TÍTULO CENTRAL ===
  doc.fontSize(22).fillColor('#000000').text('PUNTALINK', 0, 160, { align: 'center' });

  // === BLOQUE DE INFORMACIÓN ===

  let currentY = 210; // posición inicial vertical del bloque
  const lineHeight = 32; // espacio vertical entre líneas
  const labelWidth = 160; // ancho fijo para etiquetas

  const drawField = (labelEs: string, value?: string | number | undefined) => {
    const displayValue = value === undefined || value === null? '—': (typeof value === 'string' ? (value.trim() === '' ? '—' : value.trim()) : String(value));
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

  // === LÍNEA SEPARADORA ===
  doc.strokeColor('#999999')
     .lineWidth(1)
     .moveTo(marginX, currentY + 10)
     .lineTo(pageW - marginX, currentY + 10)
     .stroke();

  // === IMAGEN INFERIOR ===
  const imgPath = getAssetPath('imgInfo.png');
  if (fs.existsSync(imgPath)) {
    try {
      const img = doc.openImage(imgPath);
      const iw = img.width;
      const ih = img.height;

      // Escala proporcional para ocupar todo el ancho
      const scale = pageW / iw;
      const drawW = pageW;
      const drawH = ih * scale;

      // Coordenadas: inicia desde el borde inferior
      const y = pageH - drawH;

      doc.save();
      doc.image(imgPath, 0, y, { width: drawW, height: drawH });
      doc.restore();
    } catch (err) {
      console.warn('[pdfService] No se pudo insertar imagenInfo.png sin bordes:', (err as any)?.message || err);
    }
  }

  // === PIE DE PÁGINA ===
  // doc.fontSize(9).fillColor('#555555')
  //    .text('PUNTALINK - SISTEMA DE ANÁLISIS Y CÁLCULO ESTRUCTURAL', 0, pageH - 40, { align: 'center' });
}

// Página de cálculos
function crearPaginasCalculos(doc: any, paneles: PanelCalculado[]) {
  doc.fontSize(20)
    .fillColor('#2E86AB')
    .text('RESULTADOS DE CÁLCULOS', 0, 80, { align: 'center' });
  
  doc.strokeColor('#2E86AB')
    .lineWidth(2)
    .moveTo(50, 110)
    .lineTo(550, 110)
    .stroke();
  
  // Resumen general
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
  
  // Tabla de resultados
  doc.fontSize(14)
    .text('DETALLE DE CÁLCULOS POR PANEL:', 50, currentY, { underline: true });
  
  currentY += 30;
  
  // Encabezados de tabla
  const tableTop = currentY;
  const colWidths = [60, 80, 70, 70, 80, 80, 80];
  const headers = ['Panel', 'Ángulo (°)', 'Tipo Brace', 'FBx (kN)', 'FBy (kN)', 'FB (kN)', 'Cantidad'];
  
  doc.fontSize(10).fillColor('#2E86AB');
  let xPos = 50;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'center' });
    xPos += colWidths[i];
  });
  
  // Línea bajo encabezados
  doc.strokeColor('#2E86AB')
    .lineWidth(1)
    .moveTo(50, tableTop + 15)
    .lineTo(570, tableTop + 15)
    .stroke();
  
  currentY = tableTop + 25;
  
  // Datos de paneles
  doc.fillColor('#333333');
  paneles.forEach((panel, i) => {
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

// Página esquema
function crearEsquema(doc: any) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const margin = 40;                 // respeta margen del documento
  const topY   = 70;                 // espacio para el título

  // Título
  doc.fontSize(20).fillColor('#2E86AB').text('ESQUEMA DE ARMADO', 0, 40, { align: 'center' });
  doc.strokeColor('#2E86AB').lineWidth(2).moveTo(margin, 66).lineTo(pageW - margin, 66).stroke();

  const imgPath = getAssetPath('esquema.png');

  try {
    if (!fs.existsSync(imgPath)) {
      // Placeholder si no existe la imagen
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

    // Cargar y escalar manteniendo proporción para encajar dentro del área útil
    const img = (doc as any).openImage(imgPath);
    const iw = img.width;
    const ih = img.height;

    const maxW = pageW - margin * 2;
    const maxH = pageH - topY - margin;

    // reserva de espacio (alto) para el pie de figura
    const captionText = 'Figura: Esquema referencial de armado del muerto';
    const captionPadding = 6;       // separación imagen–pie
    const captionHeight = 12 + 2;   // alto aproximado (font 10 ≈ 12px + holgura)

    // escala considerando la reserva del pie
    const scale = Math.min(
      maxW / iw,
      (maxH - captionPadding - captionHeight) / ih
    );

    const drawW = iw * scale;
    const drawH = ih * scale;
    const x = (pageW - drawW) / 2;
    const y = topY + (maxH - (drawH + captionPadding + captionHeight)) / 2;

    doc.save();
    doc.image(imgPath, x, y, { width: drawW, height: drawH });
    doc.restore();

    // Pie de figura inmediatamente debajo de la imagen, sin permitir salto de página
    doc.fontSize(10).fillColor('#555').text(
      captionText,
      margin,
      y + drawH + captionPadding,
      {
        width: pageW - margin * 2,
        align: 'center',
        lineBreak: false    // ← evita que PDFKit lo pase a otra página
      }
    );

  } catch (err) {
    console.warn('[pdfService] No se pudo dibujar esquema:', (err as any)?.message || err);
    // En caso de error, dejar un placeholder para no romper el PDF
    const phTop = topY + 10;
    const phH = pageH - phTop - margin;
    doc.rect(margin, phTop, pageW - margin * 2, phH).strokeColor('#B0B0B0').dash(5, { space: 3 }).stroke();
    doc.undash();
    doc.fontSize(12).fillColor('#666666')
       .text('Error al cargar esquema.png', margin, phTop + 12, { width: pageW - margin * 2, align: 'center' });
  }
}

function crearPaginaMuertos(doc: any, tablaMuertos: MuertoResumen[]) {
  console.log('[pdfService] Creando página de resumen por muertos...');
  
  // Título
  doc.fontSize(20)
    .fillColor('#2E86AB')
    .text('RESUMEN POR MUERTOS', 50, 50);
  
  doc.fontSize(12)
    .fillColor('#000000')
    .text('Agrupación de muros por características similares', 50, 80);

  let currentY = 110;
  
  // Headers de la tabla
  const headers = ['#', 'Muerto', 'X Braces', 'Ángulo', 'Eje', 'Tipo Construcción', 'Cant. Muros'];
  const colWidths = [30, 60, 60, 50, 60, 90, 60];
  const startX = 50;
  
  // Dibujar headers
  doc.fontSize(10).fillColor('#2E86AB');
  let currentX = startX;
  headers.forEach((header, i) => {
    doc.rect(currentX, currentY, colWidths[i], 20)
      .fillAndStroke('#E8F4FD', '#2E86AB');
    doc.fillColor('#000000')
      .text(header, currentX + 5, currentY + 5, {
        width: colWidths[i] - 10,
        align: 'center'
      });
    currentX += colWidths[i];
  });
  
  currentY += 20;
  
  // Datos de la tabla
  doc.fontSize(9);
  tablaMuertos.forEach((muerto, index) => {
    // Nueva página si es necesario
    if (currentY > 750) {
      doc.addPage();
      currentY = 50;
    }
    
    currentX = startX;
    const data = [
      muerto.numero,
      muerto.muerto,
      muerto.x_braces,
      muerto.angulo,
      muerto.eje,
      muerto.tipo_construccion,
      muerto.cantidad_muros
    ];
    
    // Alternar color de fondo
    const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
    
    data.forEach((value, i) => {
      doc.rect(currentX, currentY, colWidths[i], 20)
        .fillAndStroke(bgColor, '#CCCCCC');
      doc.fillColor('#000000')
        .text(value, currentX + 5, currentY + 5, {
          width: colWidths[i] - 10,
          align: i === 1 || i === 4 || i === 5 ? 'left' : 'center'
        });
      currentX += colWidths[i];
    });
    
    currentY += 20;
    
    // Agregar fila de muros incluidos si hay espacio
    if (muerto.muros_incluidos && muerto.muros_incluidos.length > 0 && currentY < 740) {
      doc.fontSize(8)
        .fillColor('#666666')
        .text(`Muros: ${muerto.muros_incluidos}`, startX + 5, currentY + 2, {
          width: 500
        });
      currentY += 15;
      doc.fontSize(9).fillColor('#000000');
    }
  });
  
  // Información adicional al final
  currentY += 30;
  if (currentY < 700) {
    doc.fontSize(10)
      .fillColor('#666666')
      .text(`Total de grupos de muertos: ${tablaMuertos.length}`, startX, currentY);
    
    const totalMuros = tablaMuertos.reduce((sum, m) => sum + parseInt(m.cantidad_muros), 0);
    currentY += 15;
    doc.text(`Total de muros: ${totalMuros}`, startX, currentY);
  }
}

function crearTablaArmadoPorMuerto(doc: any, filas: ArmadoMuertoRow[]) {
  const startX = 40;
  const startY = 70;
  const rowH   = 22;
  const bottomMargin = 60;

  // === Columnas en el orden NUEVO: todo esto va dentro de DEADMAN ===
  let cols = [
    { key: 'index',        w: 26,  align: 'center' }, // #
    { key: 'eje',          w: 36,  align: 'center' }, // Eje
    { key: 'muros',        w: 74,  align: 'left'   }, // Muros
    { key: 'dm_largo',     w: 50,  align: 'center' }, // Largo (m)
    { key: 'dm_alto',      w: 50,  align: 'center' }, // Alto (m)
    { key: 'dm_ancho',     w: 50,  align: 'center' }, // Ancho (m)
    // ACERO
    { key: 'acero_cant',   w: 32,  align: 'center' }, // #
    { key: 'acero_long',   w: 64,  align: 'center' }, // Longitud (m)
    { key: 'acero_peso',   w: 54,  align: 'center' }, // Peso (kg)
    { key: 'acero_dir',    w: 68,  align: 'center' }, // Dirección
    // CONCRETO
    { key: 'horm_vol',     w: 54,  align: 'center' }, // Vol (m³)
    { key: 'horm_peso',    w: 54,  align: 'center' }, // Peso (ton)
    // ALAMBRE
    { key: 'alam_long',    w: 68,  align: 'center' }, // Longitud (m)
    { key: 'alam_peso',    w: 54,  align: 'center' }, // Peso (kg)
  ];

  // --- Auto-scaling para no desbordar el ancho útil ---
  const rightMargin = 40;
  const available   = doc.page.width - startX - rightMargin;
  const rawTotal    = cols.reduce((a, c) => a + c.w, 0);
  const scale       = Math.min(1, available / rawTotal);
  if (scale < 1) {
    const MIN_W = 22;
    cols = cols.map(c => ({ ...c, w: Math.max(MIN_W, Math.floor(c.w * scale)) }));
  }

  // Índices de grupos
  const idxDEADMAN = 0;  const lenDEADMAN = 6;
  const idxACERO   = 6;  const lenACERO   = 4;
  const idxHORM    = 10; const lenHORM    = 2;
  const idxALAMB   = 12; const lenALAMB   = 2;

  const azul = '#2E86AB';
  const grisBorde = '#DDDDDD';

  const groupWidth = (i: number, len: number) =>
    cols.slice(i, i + len).reduce((a, c) => a + c.w, 0);

  // === Helper: texto que se ajusta al ancho (reduce tamaño, abrevia y trunca si es necesario) ===
  function drawFittedText({
    text,
    x, y, width,
    maxSize = 9,
    minSize = 7,
    align = 'center' as 'left'|'center'|'right',
    abbr = {} as Record<string,string>,
  }) {
    const original = text;
    let t = (abbr[text] ?? text);
    let size = maxSize;
    const pad = 4;
    while (size > minSize && doc.widthOfString(t, { size }) > (width - pad)) size -= 0.5;
    if (doc.widthOfString(t, { size: Math.max(minSize, 6) }) > (width - pad)) {
      const short = abbr[original];
      if (short && short !== t) {
        t = short;
        size = Math.min(size, maxSize);
        while (size > minSize && doc.widthOfString(t, { size }) > (width - pad)) size -= 0.5;
      }
    }
    while (doc.widthOfString(t, { size: Math.max(size, minSize) }) > (width - pad) && t.length > 1) t = t.slice(0, -1);
    if (t !== original && !t.endsWith('…') && !abbr[original]) t = t.slice(0, Math.max(0, t.length - 1)) + '…';
    doc.fontSize(Math.max(size, minSize)).text(t, x, y, { width, align });
  }

  // === Encabezado grande (grupos) ===
  const drawBigHeader = (y: number) => {
    doc.fontSize(18).fillColor(azul).text('Tabla de Armado por Muerto', startX, y - 38);
    doc.strokeColor(azul).lineWidth(2)
       .moveTo(startX, y - 14)
       .lineTo(startX + groupWidth(0, cols.length), y - 14)
       .stroke();

    const h1 = 24;
    let x = startX;

    const drawGroup = (label: string, from: number, len: number) => {
      const w = groupWidth(from, len);
      doc.save();
      doc.rect(x, y, w, h1).fillAndStroke('#E8F4FD', azul);
      doc.fillColor('#1b1b1b');
      drawFittedText({ text: label.toUpperCase(), x, y: y + 6, width: w, maxSize: 9, minSize: 7, align: 'center' });
      doc.restore();
      x += w;
    };

    drawGroup('DEADMAN',  idxDEADMAN, lenDEADMAN);
    drawGroup('ACERO',    idxACERO,   lenACERO);
    drawGroup('CONCRETO', idxHORM,    lenHORM);
    drawGroup('ALAMBRE',  idxALAMB,   lenALAMB);

    return y + h1;
  };

  // === Encabezado chico (subtítulos + unidades) ===
  const drawSmallHeader = (y: number) => {
    const h2 = 18;
    const labels = [
      '#', 'EJE', 'MUROS',
      'LARGO', 'ALTO', 'ANCHO',
      '#', 'LONGITUD', 'PESO', 'DIRECCIÓN',
      'VOL', 'PESO',
      'LONGITUD', 'PESO',
    ];
    const units = [
      '', '', '',
      'm', 'm', 'm',
      '', 'm', 'kg', '***',
      'm³', 'ton',
      'm', 'kg',
    ];
    const abbr = { 'LONGITUD': 'LONG.', 'DIRECCIÓN': 'DIR.' };

    let x = startX;
    for (let i = 0; i < cols.length; i++) {
      doc.save();
      doc.rect(x, y, cols[i].w, h2).fillAndStroke('#F6F9FC', '#CCCCCC');
      doc.fillColor('#000000');
      drawFittedText({ text: labels[i], x, y: y + 2, width: cols[i].w, maxSize: 8, minSize: 6, align: 'center', abbr });
      if (units[i]) {
        doc.fillColor('#777777');
        drawFittedText({ text: units[i], x, y: y + 9, width: cols[i].w, maxSize: 6, minSize: 5, align: 'center' });
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

  // Encabezados iniciales
  let y = drawHeaders(startY);

  // Si no hay filas: mensaje + marco de fila vacía (pero seguimos para pintar totales)
  const hadRows = !!(filas && filas.length > 0);
  if (!hadRows) {
    doc.fontSize(12).fillColor('#666')
      .text('No existen datos disponibles para esta sección.', startX, y + 8, {
        width: groupWidth(0, cols.length), align: 'center'
      });
    const emptyH = 28;
    doc.rect(startX, y + 28, groupWidth(0, cols.length), emptyH).strokeColor(grisBorde).stroke();
    y += 28 + emptyH;
  }

  // Filas (si existen)
  filas.forEach((r, idx) => {
    if (y + rowH > doc.page.height - bottomMargin) {
      doc.addPage();
      y = drawHeaders(70);
    }

    const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
    let x = startX;

    const cells: Array<{text: string | number; w: number; align?: 'left'|'center'|'right'}> = [
      { text: r.deadman.index,                       w: cols[0].w,  align: 'center' },
      { text: r.deadman.eje,                         w: cols[1].w,  align: 'center' },
      { text: r.deadman.muros,                       w: cols[2].w,  align: 'left'   },
      { text: fixedOrDash(r.deadman.largo_m, 2),     w: cols[3].w,  align: 'center' },
      { text: fixedOrDash(r.deadman.alto_m,  2),     w: cols[4].w,  align: 'center' },
      { text: fixedOrDash(r.deadman.ancho_m, 2),     w: cols[5].w,  align: 'center' },

      { text: r.acero.cantidad ?? '—',               w: cols[6].w,  align: 'center' },
      { text: fixedOrDash(r.acero.longitud_m, 2),    w: cols[7].w,  align: 'center' },
      { text: fixedOrDash(r.acero.peso_kg, 2),       w: cols[8].w,  align: 'center' },
      { text: r.acero.direccion || '—',              w: cols[9].w,  align: 'center' },

      { text: fixedOrDash(r.concreto.vol_m3, 2),     w: cols[10].w, align: 'center' },
      { text: fixedOrDash(r.concreto.peso_ton, 2),   w: cols[11].w, align: 'center' },

      { text: fixedOrDash(r.alambre.longitud_m, 2),  w: cols[12].w, align: 'center' },
      { text: fixedOrDash(r.alambre.peso_kg, 2),     w: cols[13].w, align: 'center' },
    ];

    cells.forEach((c) => {
      doc.rect(x, y, c.w, rowH).fillAndStroke(bg, grisBorde);
      doc.fillColor('#000000').fontSize(9)
         .text(String(c.text), x + 3, y + 6, { width: c.w - 6, align: (c.align || 'center') as any });
      x += c.w;
    });

    y += rowH;
  });

  // --- Panel de totales: SIEMPRE visible (con ceros si no hay filas) ---
  y += 18; // respiro inferior

  const panelH = 26 /*header*/ + 34 /*row*/ + 10 /*margen*/;
  if (y + panelH > doc.page.height - bottomMargin) {
    doc.addPage();
    y = 70; // nuevo comienzo de sección
  }

  const totalWidth = groupWidth(0, cols.length);
  const totals = computeTotals(filas || []);

  drawTotalsPanel(doc, {
    x: startX,
    y,
    w: totalWidth,
    hHeader: 26,
    hRow: 34,
    data: totals
  });

  // === Helpers específicos ===
  function fixedOrDash(n?: number, d = 2) {
    return (n === null || n === undefined || Number.isNaN(n)) ? '—' : Number(n).toFixed(d);
  }

  function computeTotals(rows: ArmadoMuertoRow[]) {
    const sum = <T>(arr: T[], sel: (t: T) => number) =>
      arr.reduce((a, it) => a + (Number(sel(it)) || 0), 0);

    const concretoVol_m3 = sum(rows, r => r.concreto.vol_m3);
    const concretoTon    = sum(rows, r => r.concreto.peso_ton);

    const aceroKg        = sum(rows, r => r.acero.peso_kg);
    const alambreKg      = sum(rows, r => r.alambre.peso_kg);
    const metalKg        = aceroKg + alambreKg;

    return {
      concreto: { m3: concretoVol_m3, ton: concretoTon },
      acero:    { kg: aceroKg, ton: aceroKg / 1000 },
      alambre:  { kg: alambreKg, ton: alambreKg / 1000 },
      metal:    { kg: metalKg,  ton: metalKg / 1000 }
    };
  }

  function drawTotalsPanel(doc: any, opts: {
    x: number; y: number; w: number;
    hHeader: number; hRow: number;
    data: {
      concreto: { m3: number; ton: number },
      acero:    { kg: number; ton: number },
      alambre:  { kg: number; ton: number },
      metal:    { kg: number; ton: number }
    }
  }) {
    const azulHeader = '#00B5E2';
    const { x, y, w, hHeader, hRow, data } = opts;

    const colW = w / 4;

    // Header strip
    doc.save();
    doc.rect(x, y, w, hHeader).fillAndStroke(azulHeader, azulHeader);
    doc.fillColor('#ffffff').fontSize(10);

    const labels = [
      'CONCRETO TOTAL',
      'ACERO TOTAL',
      'ALAMBRE TOTAL',
      'METAL TOTAL',
    ];
    for (let i = 0; i < 4; i++) {
      doc.text(labels[i], x + i * colW + 8, y + 7, { width: colW - 16, align: 'left' });
      if (i > 0) {
        doc.moveTo(x + i * colW, y).lineTo(x + i * colW, y + hHeader).strokeColor(azulHeader).stroke();
      }
    }
    doc.restore();

    // Values row
    const yRow = y + hHeader;
    const cells = [
      `${fmt(data.concreto.m3, 2)} m³ / ${fmt(data.concreto.ton, 2)} ton`,
      `${fmt(data.acero.kg, 0)} kg / ${fmt(data.acero.ton, 2)} ton`,
      `${fmt(data.alambre.kg, 0)} kg / ${fmt(data.alambre.ton, 2)} ton`,
      `${fmt(data.metal.kg, 0)} kg / ${fmt(data.metal.ton, 2)} ton`,
    ];

    for (let i = 0; i < 4; i++) {
      const cx = x + i * colW;
      doc.rect(cx, yRow, colW, hRow).strokeColor('#1a1a1a').lineWidth(1).stroke();
      doc.fontSize(12).fillColor('#000000')
         .text(cells[i], cx, yRow + (hRow - 12) / 2 - 2, { width: colW, align: 'center' });
    }
  }

  function fmt(n: number, d: number) {
    return (Number(n) || 0).toFixed(d);
  }
}

// Metodología y parámetros
function crearDescripcionParametros(doc: any, projectInfo?: ProjectInfo) {
  doc.fontSize(20)
    .fillColor('#2E86AB')
    .text('METODOLOGÍA Y PARÁMETROS', 0, 80, { align: 'center' });
  
  doc.strokeColor('#2E86AB')
    .lineWidth(2)
    .moveTo(50, 110)
    .lineTo(550, 110)
    .stroke();
  
  let currentY = 140;
  
  // Descripción del cálculo
  doc.fontSize(14)
    .fillColor('#333333')
    .text('DESCRIPCIÓN DEL CÁLCULO:', 50, currentY, { underline: true });
  
  currentY += 25;
  
  doc.fontSize(11)
    .text('El cálculo del muerto está en base a la fuerza axial que actúa en el brace producto de la acción de la fuerza del viento sobre el muro.', 50, currentY, { width: 500, align: 'justify' });
  
  currentY += 35;
  
  doc.text('La fuerza de viento actuante en cada muro fue determinada haciendo uso de las "Normas y especificaciones para estudios, proyectos, construcciones e instalaciones del 2015 Volumen 4-México", y tomando en cuenta los siguientes parámetros:', 50, currentY, { width: 500, align: 'justify' });
  
  currentY += 50;
  
  // Parámetros utilizados
  doc.fontSize(14)
    .text('PARÁMETROS UTILIZADOS:', 50, currentY, { underline: true });
  
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
  
  currentY += 30;
  
  // Elaborado por
  if (projectInfo?.creadorProyecto) {
    doc.fontSize(14)
      .text('ELABORADO POR:', 50, currentY, { underline: true });
    
    currentY += 25;
    doc.fontSize(12)
      .text(projectInfo.creadorProyecto, 70, currentY);
  }
  
  // Pie de página
  doc.fontSize(8)
    .fillColor('#666666')
    .text('Generado por PUNTALINK - Sistema de análisis y cálculo estructural', 0, 750, { align: 'center' });
}

// Función legacy para compatibilidad
export function generarInforme(resultados: any[]): Promise<Buffer> {
  return generarInformePaneles(resultados);
}

function getAssetPath(relPathFromSrcAssets: string) {
  const tryDist = path.resolve(__dirname, '../assets', relPathFromSrcAssets);
  const trySrc  = path.resolve(__dirname, '../../src/assets', relPathFromSrcAssets);
  if (fs.existsSync(tryDist)) return tryDist;
  if (fs.existsSync(trySrc))  return trySrc;
  return path.resolve(process.cwd(), 'src/assets', relPathFromSrcAssets);
}

// Dibuja una imagen de portada ajustada a la página con opacidad
function drawCoverImage(doc: any, imagePath: string, pageW: number, pageH: number, opacity = 0.28) {
  const img = doc.openImage(imagePath);   // obtenemos dimensiones originales
  const iw = img.width;
  const ih = img.height;

  // escala para cubrir: max de los dos ejes
  const scale   = Math.max(pageW / iw, pageH / ih);
  const drawW   = iw * scale;
  const drawH   = ih * scale;
  const offsetX = (pageW - drawW) / 2;    // centrado horizontal
  const offsetY = (pageH - drawH) / 2;    // centrado vertical

  doc.save();
  doc.opacity(opacity);
  doc.image(imagePath, offsetX, offsetY, { width: drawW, height: drawH });
  doc.restore();
}

// Registra una fuente si existe; si no, devuelve null
function registerFontIfExists(doc: any, name: string, assetsRelPath: string) {
  const fontPath = getAssetPath(assetsRelPath);
  if (fs.existsSync(fontPath)) {
    doc.registerFont(name, fontPath);
    return name;
  }
  return null;
}

// Añade marca de agua
function addBackgroundImage(doc: any) {
  const bgPath = getAssetPath('marca_de_agua.png');
  if (!fs.existsSync(bgPath)) {
    console.warn('[pdfService] No se encontró la imagen de fondo en:', bgPath);
    return;
  }

  const pageW = doc.page.width;
  const pageH = doc.page.height;

  try {
    const img = doc.openImage(bgPath);
    const iw = img.width;
    const ih = img.height;

    // Escala para cubrir toda la página (manteniendo proporción)
    const scale = Math.max(pageW / iw, pageH / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const offsetX = (pageW - drawW) / 2;
    const offsetY = (pageH - drawH) / 2;

    doc.save();
    doc.image(bgPath, offsetX, offsetY, { width: drawW, height: drawH });
    doc.restore();
  } catch (err) {
    console.warn('[pdfService] Error al aplicar fondo:', (err as any)?.message || err);
  }
}

// Firma al final del documento
function addSignatureSection(doc: any, user?: { name?: string | null; email?: string }) {
  if (!user) return; // si no hay datos, no se agrega nada

  const pageH = doc.page.height;
  const currentY = doc.y; // posición vertical actual del cursor

  // Si no hay espacio suficiente, no agregar (no crea página nueva)
  const spaceNeeded = 120;
  if (currentY + spaceNeeded > pageH - 60) return;

  const centerX = doc.page.width / 2;

  const lineWidth = 160;
  const lineY = Math.max(currentY + 60, pageH - 160);
  const lineX = centerX - lineWidth / 2;

  // Línea de firma
  doc.strokeColor('#000000')
     .lineWidth(1)
     .moveTo(lineX, lineY)
     .lineTo(lineX + lineWidth, lineY)
     .stroke();

  // Nombre y correo
  const displayName = (user.name && user.name.trim()) ? user.name : (user.email ?? '__________________');
  const displayEmail = user.email ?? '';

  doc.fontSize(11)
     .fillColor('#000000')
     .text(displayName, 0, lineY + 8, { align: 'center' });

  doc.fontSize(10)
     .fillColor('#444444')
     .text(displayEmail, 0, lineY + 24, { align: 'center' });
}

function computeTotals(rows: ArmadoMuertoRow[]) {
  const sum = <T>(arr: T[], sel: (t: T) => number) =>
    arr.reduce((a, it) => a + (Number(sel(it)) || 0), 0);

  const concretoVol_m3 = sum(rows, r => r.concreto.vol_m3);
  const concretoTon    = sum(rows, r => r.concreto.peso_ton);

  const aceroKg        = sum(rows, r => r.acero.peso_kg);
  const alambreKg      = sum(rows, r => r.alambre.peso_kg);
  const metalKg        = aceroKg + alambreKg;

  return {
    concreto: { m3: concretoVol_m3, ton: concretoTon },
    acero:    { kg: aceroKg, ton: aceroKg / 1000 },
    alambre:  { kg: alambreKg, ton: alambreKg / 1000 },
    metal:    { kg: metalKg,  ton: metalKg / 1000 }
  };
}

function drawTotalsPanel(doc: any, opts: {
  x: number; y: number; w: number;
  hHeader: number; hRow: number;
  data: {
    concreto: { m3: number; ton: number },
    acero:    { kg: number; ton: number },
    alambre:  { kg: number; ton: number },
    metal:    { kg: number; ton: number }
  }
}) {
  const azul = '#00B5E2';               // franja superior (puedes cambiarlo)
  const grisBorde = '#1a1a1a';
  const { x, y, w, hHeader, hRow, data } = opts;

  // 4 columnas iguales
  const colW = w / 4;

  // ===== Header strip =====
  doc.save();
  doc.rect(x, y, w, hHeader).fillAndStroke(azul, azul);
  doc.fillColor('#ffffff').fontSize(10);

  const labels = [
    '🧱  CONCRETO TOTAL',
    '🧰  ACERO TOTAL',
    '⛓️  ALAMBRE TOTAL',
    '⚖️  METAL TOTAL',
  ];

  for (let i = 0; i < 4; i++) {
    doc.text(labels[i], x + i * colW + 8, y + 7, { width: colW - 16, align: 'left' });
    // separadores verticales del header
    if (i > 0) {
      doc.moveTo(x + i * colW, y).lineTo(x + i * colW, y + hHeader).strokeColor(azul).stroke();
    }
  }
  doc.restore();

  // ===== Row with values =====
  const yRow = y + hHeader;
  const cells = [
    ` ${fmt(data.concreto.m3, 2)} m³ / ${fmt(data.concreto.ton, 2)} ton`,
    ` ${fmt(data.acero.kg, 0)} kg / ${fmt(data.acero.ton, 2)} ton`,
    ` ${fmt(data.alambre.kg, 0)} kg / ${fmt(data.alambre.ton, 2)} ton`,
    ` ${fmt(data.metal.kg, 0)} kg / ${fmt(data.metal.ton, 2)} ton`,
  ];

  for (let i = 0; i < 4; i++) {
    const cx = x + i * colW;
    doc.rect(cx, yRow, colW, hRow).strokeColor(grisBorde).lineWidth(1).stroke();
    doc.fontSize(12).fillColor('#000000')
       .text(cells[i], cx, yRow + (hRow - 12) / 2 - 2, { width: colW, align: 'center' });
  }
}

function fmt(n: number, d: number) {
  return (Number(n) || 0).toFixed(d);
}  
