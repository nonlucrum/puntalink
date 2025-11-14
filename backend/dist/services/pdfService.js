"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarInformePaneles = generarInformePaneles;
exports.generarInforme = generarInforme;
const pdfkit_1 = __importDefault(require("pdfkit"));
// Función para convertir entre formatos
function convertirPanelParaPDF(panel) {
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
function generarInformePaneles(paneles, projectInfo, tablaMuertos) {
    console.log('[pdfService] Generando informe para', paneles.length, 'paneles');
    if (projectInfo) {
        console.log('[pdfService] Con información del proyecto:', projectInfo);
    }
    if (tablaMuertos) {
        console.log('[pdfService] Con tabla de muertos:', tablaMuertos.length, 'grupos');
    }
    // Convertir paneles al formato interno si es necesario
    const panelesConvertidos = paneles.map(panel => {
        if ('idMuro' in panel) {
            // Es un PanelCalculadoPaneles, convertir
            return convertirPanelParaPDF(panel);
        }
        else {
            // Ya es un PanelCalculado
            return panel;
        }
    });
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        const buffers = [];
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
function crearPortada(doc, projectInfo) {
    // Logo/Título principal centrado
    doc.fontSize(36)
        .fillColor('#2E86AB')
        .text('PUNTALINK', 0, 150, { align: 'center' });
    // Subtítulo
    doc.fontSize(18)
        .fillColor('#666666')
        .text('Sistema de Análisis y Cálculo Estructural', 0, 200, { align: 'center' });
    // Línea decorativa
    doc.strokeColor('#2E86AB')
        .lineWidth(3)
        .moveTo(150, 240)
        .lineTo(450, 240)
        .stroke();
    // Informe de
    doc.fontSize(20)
        .fillColor('#333333')
        .text('INFORME DE ANÁLISIS', 0, 280, { align: 'center' })
        .text('DE MUERTOS CORRIDOS', 0, 310, { align: 'center' });
    // Información del proyecto en la portada
    let currentY = 380;
    if (projectInfo?.nombreProyecto) {
        doc.fontSize(18)
            .fillColor('#2E86AB')
            .text('PROYECTO:', 0, currentY, { align: 'center' });
        doc.fontSize(16)
            .fillColor('#333333')
            .text(projectInfo.nombreProyecto, 0, currentY + 25, { align: 'center' });
        currentY += 70;
    }
    if (projectInfo?.empresaConstructora) {
        doc.fontSize(16)
            .fillColor('#2E86AB')
            .text('CONSTRUCTORA:', 0, currentY, { align: 'center' });
        doc.fontSize(14)
            .fillColor('#333333')
            .text(projectInfo.empresaConstructora, 0, currentY + 20, { align: 'center' });
        currentY += 60;
    }
    // Fecha en la parte inferior
    doc.fontSize(12)
        .fillColor('#666666')
        .text(`Fecha: ${new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`, 0, 700, { align: 'center' });
}
function crearPaginaProyecto(doc, projectInfo) {
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
function crearPaginasCalculos(doc, paneles) {
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
function crearDescripcionParametros(doc, projectInfo) {
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
function crearPaginaMuertos(doc, tablaMuertos) {
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
function generarInforme(resultados) {
    return generarInformePaneles(resultados);
}
