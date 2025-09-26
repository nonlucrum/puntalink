import PDFDocument from 'pdfkit';

interface PanelCalculado {
  idMuro: string;
  grosor_mm: number;
  area_m2: number;
  volumen_m3: number;
  peso_kN: number;
  gruaMin_kN: number;
  viento_kN: number;
  traccionPuntal_kN: number;
}

interface ProjectInfo {
  nombreProyecto?: string;
  empresaConstructora?: string;
  tipoMuerto?: string;
  velViento?: number;
  tempPromedio?: number;
  presionAtm?: number;
}

export function generarInformePaneles(paneles: PanelCalculado[], projectInfo?: ProjectInfo): Promise<Buffer> {
  console.log('[pdfService] Generando informe para', paneles.length, 'paneles');
  if (projectInfo) {
    console.log('[pdfService] Con información del proyecto:', projectInfo);
  }
  
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      console.log('[pdfService] PDF generado exitosamente');
      resolve(Buffer.concat(buffers));
    });

    // ===== AQUÍ PUEDES MODIFICAR EL CONTENIDO DEL PDF =====
    
    // Título principal
    doc.fontSize(18).text('Informe de Análisis de Paneles', { align: 'center' });
    doc.moveDown();

    // ===== INFORMACIÓN DEL PROYECTO =====
    if (projectInfo) {
      doc.fontSize(14).text('Información del Proyecto', { underline: true })
        .fontSize(12)
        .moveDown(0.5);
      
      if (projectInfo.nombreProyecto) {
        doc.text(`Nombre del Proyecto: ${projectInfo.nombreProyecto}`, { indent: 20 });
      }
      
      if (projectInfo.empresaConstructora) {
        doc.text(`Empresa Constructora: ${projectInfo.empresaConstructora}`, { indent: 20 });
      }
      
      if (projectInfo.tipoMuerto) {
        doc.text(`Tipo de Fundación: ${projectInfo.tipoMuerto}`, { indent: 20 });
      }
      
      if (projectInfo.velViento) {
        doc.text(`Velocidad del Viento: ${projectInfo.velViento} km/h`, { indent: 20 });
      }
      
      if (projectInfo.tempPromedio) {
        doc.text(`Temperatura Promedio: ${projectInfo.tempPromedio}°C`, { indent: 20 });
      }
      
      if (projectInfo.presionAtm) {
        doc.text(`Presión Atmosférica: ${projectInfo.presionAtm} mmHg`, { indent: 20 });
      }
      
      doc.moveDown();
    }
    
    // Información general
    doc.fontSize(12)
      .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`)
      .text(`Total de paneles analizados: ${paneles.length}`)
      .moveDown();
    
    // Resumen estadístico
    const totalVolumen = paneles.reduce((sum, p) => sum + p.volumen_m3, 0);
    const totalPeso = paneles.reduce((sum, p) => sum + p.peso_kN, 0);
    const gruaMaxima = Math.max(...paneles.map(p => p.gruaMin_kN));
    
    doc.fontSize(14).text('Resumen General:', { underline: true })
      .fontSize(12)
      .text(`• Volumen total: ${totalVolumen.toFixed(2)} m³`)
      .text(`• Peso total: ${totalPeso.toFixed(2)} kN`)
      .text(`• Grúa máxima requerida: ${gruaMaxima.toFixed(2)} kN`)
      .moveDown();

    // Detalle de paneles
    doc.fontSize(14).text('Detalle por Panel:', { underline: true }).moveDown(0.5);

    paneles.forEach((panel, i) => {
      console.log(`[pdfService] Agregando panel ${i + 1}: ${panel.idMuro}`);
      
      // Caja para cada panel
      const startY = doc.y;
      doc.rect(40, startY, 515, 85).stroke();
      
      // Título del panel
      doc.fontSize(13).fillColor('blue')
        .text(`Panel #${i + 1} - ${panel.idMuro}`, 50, startY + 10)
        .fillColor('black');
        
      // Información en columnas
      const contentY = startY + 30;
      
      // Columna 1: Dimensiones
      doc.fontSize(11)
        .text('Dimensiones:', 50, contentY, { underline: true })
        .text(`Grosor: ${panel.grosor_mm} mm`, 50, contentY + 15)
        .text(`Área: ${panel.area_m2} m²`, 50, contentY + 30)
        .text(`Volumen: ${panel.volumen_m3} m³`, 50, contentY + 45);
      
      // Columna 2: Cargas
      doc.text('Cargas:', 200, contentY, { underline: true })
        .text(`Peso: ${panel.peso_kN} kN`, 200, contentY + 15)
        .text(`Viento: ${panel.viento_kN} kN`, 200, contentY + 30)
        .text(`Tracción puntal: ${panel.traccionPuntal_kN} kN`, 200, contentY + 45);
      
      // Columna 3: Requerimientos
      doc.text('Requerimientos:', 400, contentY, { underline: true })
        .text(`Grúa mínima: ${panel.gruaMin_kN} kN`, 400, contentY + 15);
      
      // Espacio entre paneles
      doc.y = startY + 95;
      
      // Nueva página si es necesario
      if (doc.y > 700 && i < paneles.length - 1) {
        doc.addPage();
      }
    });

    // Pie de página en la última página
    doc.fontSize(8)
      .text('Generado por PuntaLink - Sistema de análisis y cálculo estructural', 50, 750, {
        align: 'center'
      });

    doc.end();
  });
}

// Función legacy para compatibilidad
export function generarInforme(resultados: any[]): Promise<Buffer> {
  return generarInformePaneles(resultados);
}