import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { PanelCalculado as PanelCalculadoPaneles } from './panelesService';

// Interfaz interna para compatibilidad con calculosService
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

interface ProjectInfo {
  nombreProyecto?: string;
  empresaConstructora?: string;
  tipoMuerto?: string;
  velViento?: number;
  tempPromedio?: number;
  presionAtm?: number;
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

export function generarInformePaneles(paneles: PanelCalculado[], projectInfo?: ProjectInfo, tablaMuertos?: MuertoResumen[]): Promise<Buffer>;
export function generarInformePaneles(paneles: PanelCalculadoPaneles[], projectInfo?: ProjectInfo, tablaMuertos?: MuertoResumen[]): Promise<Buffer>;
export function generarInformePaneles(paneles: PanelCalculado[] | PanelCalculadoPaneles[], projectInfo?: ProjectInfo, tablaMuertos?: MuertoResumen[]): Promise<Buffer> {
  console.log('[pdfService] Generando informe para', paneles.length, 'paneles');
  if (projectInfo) {
    console.log('[pdfService] Con información del proyecto:', projectInfo);
  }
  if (tablaMuertos) {
    console.log('[pdfService] Con tabla de muertos:', tablaMuertos.length, 'grupos');
  }
  
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
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      console.log('[pdfService] PDF generado exitosamente');
      resolve(Buffer.concat(buffers));
    });

    // ===== PORTADA =====
    crearPortada(doc, projectInfo);
    
    // ===== INFORMACIÓN DEL PROYECTO =====
    doc.addPage();
    crearPaginaProyecto(doc, projectInfo);
    
    // ===== CÁLCULOS =====
    doc.addPage();
    crearPaginasCalculos(doc, panelesConvertidos);
    
    // ===== RESUMEN POR MUERTOS =====
    if (tablaMuertos && tablaMuertos.length > 0) {
      doc.addPage();
      crearPaginaMuertos(doc, tablaMuertos);
    }
    
    // ===== DESCRIPCIÓN DE PARÁMETROS =====
    doc.addPage();
    crearDescripcionParametros(doc, projectInfo);

    doc.end();
  });
}

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

  if (projectInfo?.nombreProyecto) {
    doc.fontSize(18).fillColor('#2E86AB').text('PROYECTO:', 0, currentY, { align: 'center' });
    doc.fontSize(16).fillColor('#333333').text(projectInfo.nombreProyecto, 0, currentY + 25, { align: 'center' });
    currentY += 70;
  }

  if (projectInfo?.empresaConstructora) {
    doc.fontSize(16).fillColor('#2E86AB').text('CONSTRUCTORA:', 0, currentY, { align: 'center' });
    doc.fontSize(14).fillColor('#333333').text(projectInfo.empresaConstructora, 0, currentY + 20, { align: 'center' });
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

function crearPaginaProyecto(doc: any, projectInfo?: ProjectInfo) {
  doc.fontSize(24)
    .fillColor('#2E86AB')
    .text('INFORMACIÓN DEL PROYECTO', 0, 80, { align: 'center' });
  
  doc.strokeColor('#2E86AB')
    .lineWidth(2)
    .moveTo(50, 120)
    .lineTo(550, 120)
    .stroke();
  
  let currentY = 160;
  const lineHeight = 35;
  
  doc.fontSize(14).fillColor('#333333');
  
  if (projectInfo?.nombreProyecto) {
    doc.fontSize(16).text('NOMBRE DEL PROYECTO:', 80, currentY)
      .fontSize(14).text(projectInfo.nombreProyecto, 80, currentY + 20);
    currentY += lineHeight * 1.5;
  }
  
  if (projectInfo?.empresaConstructora) {
    doc.fontSize(16).text('EMPLEADOR:', 80, currentY)
      .fontSize(14).text(projectInfo.empresaConstructora, 80, currentY + 20);
    currentY += lineHeight * 1.5;
  }
  
  if (projectInfo?.tipoMuerto) {
    doc.fontSize(16).text('TIPO DE MUERTO:', 80, currentY)
      .fontSize(14).text(projectInfo.tipoMuerto, 80, currentY + 20);
    currentY += lineHeight * 1.5;
  }
  
  if (projectInfo?.version) {
    doc.fontSize(16).text('VERSIÓN:', 80, currentY)
      .fontSize(14).text(projectInfo.version, 80, currentY + 20);
    currentY += lineHeight * 1.5;
  }
  
  // Fecha del informe
  doc.fontSize(16).text('FECHA DEL INFORME:', 80, currentY)
    .fontSize(14).text(new Date().toLocaleDateString('es-ES'), 80, currentY + 20);
  currentY += lineHeight * 1.5;
  
  if (projectInfo?.creadorProyecto) {
    doc.fontSize(16).text('ELABORADO POR:', 80, currentY)
      .fontSize(14).text(projectInfo.creadorProyecto, 80, currentY + 20);
  }
}

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
  
  if (projectInfo?.velViento !== undefined) {
    doc.text(`a) Velocidad del viento: ${projectInfo.velViento} km/h`, 70, currentY);
    currentY += 20;
  }
  
  if (projectInfo?.tempPromedio !== undefined) {
    doc.text(`b) Temperatura promedio: ${projectInfo.tempPromedio}°C`, 70, currentY);
    currentY += 20;
  }
  
  if (projectInfo?.presionAtm !== undefined) {
    doc.text(`c) Presión atmosférica: ${projectInfo.presionAtm} mmHg`, 70, currentY);
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