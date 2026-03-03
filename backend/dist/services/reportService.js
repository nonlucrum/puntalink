"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarInformePDF = generarInformePDF;
exports.generarInformeDOCX = generarInformeDOCX;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const docx_1 = require("docx");
// ─── Helpers ───────────────────────────────────────────────
function getAssetPath(relPath) {
    const tryDist = path_1.default.resolve(__dirname, '../assets', relPath);
    const trySrc = path_1.default.resolve(__dirname, '../../src/assets', relPath);
    if (fs_1.default.existsSync(tryDist))
        return tryDist;
    if (fs_1.default.existsSync(trySrc))
        return trySrc;
    return path_1.default.resolve(process.cwd(), 'src/assets', relPath);
}
function registerFontIfExists(doc, name, assetsRelPath) {
    const fontPath = getAssetPath(assetsRelPath);
    if (fs_1.default.existsSync(fontPath)) {
        doc.registerFont(name, fontPath);
        return name;
    }
    return null;
}
function addBackgroundImage(doc) {
    const bgPath = getAssetPath('marca_de_agua.png');
    if (!fs_1.default.existsSync(bgPath))
        return;
    try {
        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const img = doc.openImage(bgPath);
        const scale = Math.max(pageW / img.width, pageH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        doc.save();
        doc.image(bgPath, (pageW - drawW) / 2, (pageH - drawH) / 2, { width: drawW, height: drawH });
        doc.restore();
    }
    catch (err) {
        console.warn('[reportService] Error al aplicar fondo:', err?.message || err);
    }
}
function drawCoverImage(doc, imagePath, pageW, pageH, opacity = 0.28) {
    if (!fs_1.default.existsSync(imagePath))
        return;
    const img = doc.openImage(imagePath);
    const scale = Math.max(pageW / img.width, pageH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    doc.save();
    doc.opacity(opacity);
    doc.image(imagePath, (pageW - drawW) / 2, (pageH - drawH) / 2, { width: drawW, height: drawH });
    doc.restore();
}
// ─── PDF Generation ────────────────────────────────────────
async function generarInformePDF(projectInfo, coverImageBuffer, windTableData) {
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        const buffers = [];
        addBackgroundImage(doc);
        doc.on('pageAdded', () => addBackgroundImage(doc));
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        // Page 1: Cover
        crearPortadaPDF(doc, projectInfo);
        // Page 2: Image (if provided)
        if (coverImageBuffer) {
            doc.addPage();
            crearPaginaImagenPDF(doc, coverImageBuffer);
        }
        // Page 3: Project info
        doc.addPage();
        crearPaginaProyectoPDF(doc, projectInfo);
        // Page 4+: Summary with wind table
        if (windTableData && windTableData.rows.length > 0) {
            doc.addPage();
            crearPaginaResumenPDF(doc, windTableData);
        }
        doc.end();
    });
}
function crearPortadaPDF(doc, projectInfo) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const fondoPath = getAssetPath('fondo.jpg');
    drawCoverImage(doc, fondoPath, pageW, pageH, 0.28);
    doc.save();
    doc.opacity(0.35).rect(0, 0, pageW, pageH).fill('#FFFFFF');
    doc.restore();
    doc.save();
    doc.opacity(0.06).rect(0, 0, pageW, pageH).fill('#000000');
    doc.restore();
    const logoPath = getAssetPath('logo.png');
    const titleFontName = registerFontIfExists(doc, 'TitleFont', 'fonts/Montserrat-Bold.ttf') ||
        registerFontIfExists(doc, 'TitleFont', 'fonts/Poppins-SemiBold.ttf');
    if (titleFontName)
        doc.font('TitleFont');
    else
        doc.font('Helvetica-Bold');
    const title = 'PUNTALINK';
    const titleSize = 38;
    const topMargin = 110;
    const gapLogoTitle = 12;
    doc.fontSize(titleSize).fillColor('#1f1f1f');
    const titleLineHeight = doc.currentLineHeight();
    const maxLogoWidth = doc.page.width * 0.28;
    const maxLogoHeight = Math.max(80, titleLineHeight * 1.6);
    if (fs_1.default.existsSync(logoPath)) {
        const logoImg = doc.openImage(logoPath);
        const scale = Math.min(maxLogoWidth / logoImg.width, maxLogoHeight / logoImg.height);
        const drawLogoW = logoImg.width * scale;
        const drawLogoH = logoImg.height * scale;
        const logoX = (pageW - drawLogoW) / 2;
        const logoY = topMargin;
        doc.save();
        doc.opacity(1);
        doc.image(logoPath, logoX, logoY, { width: drawLogoW, height: drawLogoH });
        doc.restore();
        const titleY = logoY + drawLogoH + gapLogoTitle;
        doc.fontSize(titleSize).fillColor('#1f1f1f')
            .text(title, 0, titleY, { align: 'center' });
        const afterTitleY = titleY + titleLineHeight + 12;
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
        if (projectInfo?.ubicacion) {
            doc.fontSize(16).fillColor('#2E86AB').text('UBICACIÓN:', 0, currentY, { align: 'center' });
            doc.fontSize(14).fillColor('#333333').text(projectInfo.ubicacion, 0, currentY + 20, { align: 'center' });
            currentY += 60;
        }
    }
    doc.fontSize(12)
        .fillColor('#666666')
        .text(`Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, pageH - 90, { align: 'center' });
}
function crearPaginaProyectoPDF(doc, projectInfo) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const marginX = 60;
    // Logo
    const logoPath = getAssetPath('logo.png');
    if (fs_1.default.existsSync(logoPath)) {
        const img = doc.openImage(logoPath);
        const scale = Math.min(180 / img.width, 80 / img.height);
        const drawW = img.width * scale;
        const logoX = (pageW - drawW) / 2;
        doc.image(logoPath, logoX, 70, { width: drawW });
    }
    doc.fontSize(22).fillColor('#000000').text('PUNTALINK', 0, 160, { align: 'center' });
    let currentY = 210;
    const lineHeight = 32;
    const labelWidth = 200;
    const drawField = (label, value) => {
        const displayValue = value === undefined || value === null
            ? '—'
            : (typeof value === 'string' ? (value.trim() === '' ? '—' : value.trim()) : String(value));
        doc.fontSize(10).fillColor('#888888')
            .text(label.toUpperCase(), marginX, currentY, { width: labelWidth });
        doc.fontSize(12).fillColor('#000000')
            .text(displayValue, marginX + labelWidth + 10, currentY);
        currentY += lineHeight;
    };
    drawField('NOMBRE PROYECTO', projectInfo?.nombre);
    drawField('EMPRESA CONSTRUCTORA', projectInfo?.empresa);
    drawField('TIPO DE MUERTO', projectInfo?.tipo_muerto);
    drawField('VELOCIDAD DEL VIENTO (KM/H)', projectInfo?.vel_viento);
    drawField('TEMPERATURA PROMEDIO (°C)', projectInfo?.temp_promedio);
    drawField('PRESIÓN ATMOSFÉRICA (MMHG)', projectInfo?.presion_atmo);
    drawField('CREADOR DEL PROYECTO', projectInfo?.creadorProyecto);
    drawField('VERSIÓN', projectInfo?.version);
    drawField('FECHA', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));
    doc.strokeColor('#999999')
        .lineWidth(1)
        .moveTo(marginX, currentY + 10)
        .lineTo(pageW - marginX, currentY + 10)
        .stroke();
    // Image at bottom
    const imgPath = getAssetPath('imgInfo.png');
    if (fs_1.default.existsSync(imgPath)) {
        try {
            const img = doc.openImage(imgPath);
            const scale = pageW / img.width;
            const drawH = img.height * scale;
            doc.save();
            doc.image(imgPath, 0, pageH - drawH, { width: pageW, height: drawH });
            doc.restore();
        }
        catch (err) {
            console.warn('[reportService] No se pudo insertar imgInfo.png:', err?.message || err);
        }
    }
}
function crearPaginaImagenPDF(doc, imageBuffer) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 40;
    const availableW = pageW - margin * 2;
    const availableH = pageH - margin * 2;
    try {
        const img = doc.openImage(imageBuffer);
        const scale = Math.min(availableW / img.width, availableH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;
        doc.image(imageBuffer, x, y, { width: drawW, height: drawH });
    }
    catch (err) {
        console.error('[reportService] Error al insertar imagen:', err);
        doc.fontSize(14).fillColor('#cc0000')
            .text('Error: No se pudo cargar la imagen proporcionada.', margin, pageH / 2, { align: 'center' });
    }
}
// ─── PDF Summary Page ──────────────────────────────────────
function crearPaginaResumenPDF(doc, windData) {
    const pageW = doc.page.width;
    const marginX = 40;
    const contentW = pageW - marginX * 2;
    let y = 50;
    // Title
    doc.fontSize(18).fillColor('#1f1f1f').font('Helvetica-Bold')
        .text('RESUMEN GENERAL', marginX, y, { align: 'center', width: contentW });
    y += 35;
    // Separator
    doc.strokeColor('#2E86AB').lineWidth(2)
        .moveTo(marginX, y).lineTo(pageW - marginX, y).stroke();
    y += 20;
    // Summary stats
    const stats = [
        { label: 'Total de paneles analizados', value: String(windData.summary.totalPaneles) },
        { label: 'Volumen total de concreto', value: `${windData.summary.volumenTotal} m³` },
        { label: 'Peso total', value: `${windData.summary.pesoTotal} kN` },
        { label: 'Capacidad máxima de grúa requerida', value: `${windData.summary.maxGrua} kN` },
    ];
    for (const stat of stats) {
        doc.fontSize(10).fillColor('#555555').font('Helvetica')
            .text('•  ', marginX, y, { continued: true })
            .font('Helvetica-Bold').fillColor('#333333')
            .text(`${stat.label}: `, { continued: true })
            .font('Helvetica').fillColor('#000000')
            .text(stat.value);
        y += 20;
    }
    y += 15;
    // ── Tables split by column groups ──
    const rows = windData.rows;
    // Group definitions: [groupTitle, headerColor, headers[], rowDataExtractor]
    const groups = [
        {
            title: 'DATOS DEL MURO',
            color: '#e3f2fd',
            headers: ['Muro', 'Área (m²)', 'Peso (ton)', 'Altura (m)', 'YCG (m)'],
            getData: (r) => [r.muro, r.area, r.peso, r.altura, r.ycg],
        },
        {
            title: 'CÁLCULOS DE VIENTO',
            color: '#fff3e0',
            headers: ['Muro', 'Vd (km/h)', 'qz (kPa)', 'Presión (kPa)', 'Fuerza (kN)'],
            getData: (r) => [r.muro, r.vd, r.qz, r.presion, r.fuerza],
        },
        {
            title: 'PARÁMETROS BRACES',
            color: '#f3e5f5',
            headers: ['Muro', 'Tipo', 'Ángulo (°)', 'NPT (m)', 'Eje', 'Factor W2'],
            getData: (r) => [r.muro, r.tipoBrace, r.angulo, r.npt, r.eje, r.factorW2],
        },
        {
            title: 'GEOMETRÍA INSERTO',
            color: '#e8f5e9',
            headers: ['Muro', 'X (m)', 'Y (m)', 'Longitud (m)'],
            getData: (r) => [r.muro, r.xInserto, r.yInserto, r.longitud],
        },
        {
            title: 'FUERZAS Y CANTIDAD',
            color: '#fce4ec',
            headers: ['Muro', 'FBx (kN)', 'FBy (kN)', 'FB (kN)', 'Cant. Calc.', 'Cant. Final'],
            getData: (r) => [r.muro, r.fbx, r.fby, r.fb, r.cantCalc, r.cantFinal],
        },
    ];
    for (const group of groups) {
        const tableH = 22; // row height
        const headerH = 28;
        const neededH = headerH + tableH * rows.length + 50;
        // Check if we need a new page
        if (y + neededH > doc.page.height - 40) {
            doc.addPage();
            y = 50;
        }
        // Group title
        doc.fontSize(11).fillColor('#1f1f1f').font('Helvetica-Bold')
            .text(group.title, marginX, y);
        y += 18;
        const colCount = group.headers.length;
        const colW = contentW / colCount;
        // Header row background
        doc.save();
        doc.rect(marginX, y, contentW, headerH).fill(group.color);
        doc.restore();
        // Header text
        doc.fontSize(7).fillColor('#333333').font('Helvetica-Bold');
        for (let c = 0; c < colCount; c++) {
            doc.text(group.headers[c], marginX + c * colW + 3, y + 8, { width: colW - 6, align: 'center' });
        }
        // Header border
        doc.strokeColor('#999999').lineWidth(0.5);
        doc.moveTo(marginX, y).lineTo(marginX + contentW, y).stroke();
        doc.moveTo(marginX, y + headerH).lineTo(marginX + contentW, y + headerH).stroke();
        y += headerH;
        // Data rows
        doc.font('Helvetica').fontSize(7).fillColor('#000000');
        for (let i = 0; i < rows.length; i++) {
            const rowData = group.getData(rows[i]);
            // Alternating row background
            if (i % 2 === 0) {
                doc.save();
                doc.rect(marginX, y, contentW, tableH).fill('#f9f9f9');
                doc.restore();
                doc.fillColor('#000000');
            }
            for (let c = 0; c < colCount; c++) {
                const val = rowData[c] || '—';
                doc.text(val, marginX + c * colW + 3, y + 6, { width: colW - 6, align: c === 0 ? 'left' : 'center' });
            }
            // Row bottom border
            doc.strokeColor('#dddddd').lineWidth(0.3);
            doc.moveTo(marginX, y + tableH).lineTo(marginX + contentW, y + tableH).stroke();
            y += tableH;
        }
        // Table outer border
        const tableTop = y - tableH * rows.length - headerH;
        doc.strokeColor('#999999').lineWidth(0.5);
        doc.rect(marginX, tableTop, contentW, headerH + tableH * rows.length).stroke();
        // Vertical column lines
        for (let c = 1; c < colCount; c++) {
            doc.moveTo(marginX + c * colW, tableTop)
                .lineTo(marginX + c * colW, y)
                .stroke();
        }
        y += 20;
    }
}
// ─── DOCX Generation ───────────────────────────────────────
async function generarInformeDOCX(projectInfo, coverImageBuffer, windTableData) {
    const sections = [];
    // Read logo for DOCX
    const logoPath = getAssetPath('logo.png');
    let logoBuffer = null;
    if (fs_1.default.existsSync(logoPath)) {
        logoBuffer = fs_1.default.readFileSync(logoPath);
    }
    // ── Section 1: Cover Page ──
    const coverChildren = [];
    // Spacer
    coverChildren.push(new docx_1.Paragraph({ spacing: { before: 800 } }));
    // Logo
    if (logoBuffer) {
        coverChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
                new docx_1.ImageRun({
                    data: logoBuffer,
                    transformation: { width: 160, height: 80 },
                }),
            ],
        }));
    }
    // Title: PUNTALINK
    coverChildren.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
            new docx_1.TextRun({
                text: 'PUNTALINK',
                bold: true,
                size: 72,
                color: '1f1f1f',
                font: 'Arial',
            }),
        ],
    }));
    // Subtitle
    coverChildren.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
            new docx_1.TextRun({
                text: 'Sistema de Análisis y Cálculo Estructural',
                size: 28,
                color: '4a4a4a',
                font: 'Arial',
            }),
        ],
    }));
    // Separator line
    coverChildren.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 300 },
        border: {
            bottom: { style: docx_1.BorderStyle.SINGLE, size: 6, color: '2E86AB', space: 1 },
        },
        children: [new docx_1.TextRun({ text: ' ', size: 4 })],
    }));
    // Report title
    coverChildren.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 50 },
        children: [
            new docx_1.TextRun({
                text: 'INFORME DE ANÁLISIS',
                bold: true,
                size: 36,
                color: '333333',
                font: 'Arial',
            }),
        ],
    }));
    coverChildren.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
            new docx_1.TextRun({
                text: 'DE MUERTOS CORRIDOS',
                bold: true,
                size: 36,
                color: '333333',
                font: 'Arial',
            }),
        ],
    }));
    // Project info
    if (projectInfo?.nombre) {
        coverChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
                new docx_1.TextRun({ text: 'PROYECTO:', bold: true, size: 32, color: '2E86AB', font: 'Arial' }),
            ],
        }));
        coverChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
                new docx_1.TextRun({ text: projectInfo.nombre, size: 28, color: '333333', font: 'Arial' }),
            ],
        }));
    }
    if (projectInfo?.empresa) {
        coverChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
                new docx_1.TextRun({ text: 'CONSTRUCTORA:', bold: true, size: 28, color: '2E86AB', font: 'Arial' }),
            ],
        }));
        coverChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
                new docx_1.TextRun({ text: projectInfo.empresa, size: 24, color: '333333', font: 'Arial' }),
            ],
        }));
    }
    if (projectInfo?.ubicacion) {
        coverChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
                new docx_1.TextRun({ text: 'UBICACIÓN:', bold: true, size: 28, color: '2E86AB', font: 'Arial' }),
            ],
        }));
        coverChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
                new docx_1.TextRun({ text: projectInfo.ubicacion, size: 24, color: '333333', font: 'Arial' }),
            ],
        }));
    }
    // Date at bottom
    const dateStr = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    coverChildren.push(new docx_1.Paragraph({ spacing: { before: 600 } }));
    coverChildren.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        children: [
            new docx_1.TextRun({ text: `Fecha: ${dateStr}`, size: 22, color: '666666', font: 'Arial' }),
        ],
    }));
    sections.push({
        properties: {
            page: {
                size: { width: 11906, height: 16838 }, // A4 in twips
                margin: { top: 720, bottom: 720, left: 720, right: 720 },
            },
        },
        children: coverChildren,
    });
    // ── Section 2: Image Page (if provided) ──
    const a4Page = {
        size: { width: 11906, height: 16838 },
        margin: { top: 720, bottom: 720, left: 720, right: 720 },
    };
    if (coverImageBuffer) {
        const imageChildren = [];
        imageChildren.push(new docx_1.Paragraph({ spacing: { before: 200 } }));
        try {
            imageChildren.push(new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.CENTER,
                children: [
                    new docx_1.ImageRun({
                        data: coverImageBuffer,
                        transformation: { width: 700, height: 900 },
                    }),
                ],
            }));
        }
        catch (err) {
            console.error('[reportService] Error inserting image in DOCX:', err);
            imageChildren.push(new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.CENTER,
                children: [
                    new docx_1.TextRun({ text: 'Error: No se pudo cargar la imagen.', color: 'CC0000', size: 24 }),
                ],
            }));
        }
        sections.push({
            properties: {
                page: {
                    size: { width: 11906, height: 16838 },
                    margin: { top: 720, bottom: 720, left: 720, right: 720 },
                },
            },
            children: imageChildren,
        });
    }
    // ── Section 3: Project Info Page ──
    const projectChildren = [];
    if (logoBuffer) {
        projectChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200, before: 400 },
            children: [
                new docx_1.ImageRun({
                    data: logoBuffer,
                    transformation: { width: 160, height: 80 },
                }),
            ],
        }));
    }
    projectChildren.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
            new docx_1.TextRun({ text: 'PUNTALINK', bold: true, size: 40, color: '000000', font: 'Arial' }),
        ],
    }));
    const dateStr2 = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const fields = [
        ['NOMBRE PROYECTO', projectInfo?.nombre],
        ['EMPRESA CONSTRUCTORA', projectInfo?.empresa],
        ['TIPO DE MUERTO', projectInfo?.tipo_muerto],
        ['VELOCIDAD DEL VIENTO (KM/H)', projectInfo?.vel_viento],
        ['TEMPERATURA PROMEDIO (°C)', projectInfo?.temp_promedio],
        ['PRESIÓN ATMOSFÉRICA (MMHG)', projectInfo?.presion_atmo],
        ['CREADOR DEL PROYECTO', projectInfo?.creadorProyecto],
        ['VERSIÓN', projectInfo?.version],
        ['FECHA', dateStr2],
    ];
    for (const [label, value] of fields) {
        const display = value === undefined || value === null
            ? '—'
            : (typeof value === 'string' ? (value.trim() === '' ? '—' : value.trim()) : String(value));
        projectChildren.push(new docx_1.Paragraph({
            spacing: { after: 80 },
            children: [
                new docx_1.TextRun({ text: `${label}:  `, bold: true, size: 20, color: '888888', font: 'Arial' }),
                new docx_1.TextRun({ text: display, size: 24, color: '000000', font: 'Arial' }),
            ],
        }));
    }
    sections.push({ properties: { page: a4Page }, children: projectChildren });
    // ── Section 4+: Summary with wind tables ──
    if (windTableData && windTableData.rows.length > 0) {
        const summaryChildren = [];
        // Title
        summaryChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200, before: 200 },
            children: [
                new docx_1.TextRun({ text: 'RESUMEN GENERAL', bold: true, size: 32, color: '1f1f1f', font: 'Arial' }),
            ],
        }));
        // Separator
        summaryChildren.push(new docx_1.Paragraph({
            spacing: { after: 200 },
            border: {
                bottom: { style: docx_1.BorderStyle.SINGLE, size: 4, color: '2E86AB', space: 1 },
            },
            children: [new docx_1.TextRun({ text: ' ', size: 4 })],
        }));
        // Summary stats
        const statsItems = [
            { label: 'Total de paneles analizados', value: String(windTableData.summary.totalPaneles) },
            { label: 'Volumen total de concreto', value: `${windTableData.summary.volumenTotal} m³` },
            { label: 'Peso total', value: `${windTableData.summary.pesoTotal} kN` },
            { label: 'Capacidad máxima de grúa requerida', value: `${windTableData.summary.maxGrua} kN` },
        ];
        for (const item of statsItems) {
            summaryChildren.push(new docx_1.Paragraph({
                spacing: { after: 60 },
                children: [
                    new docx_1.TextRun({ text: '•  ', size: 20, font: 'Arial' }),
                    new docx_1.TextRun({ text: `${item.label}: `, bold: true, size: 20, color: '333333', font: 'Arial' }),
                    new docx_1.TextRun({ text: item.value, size: 20, color: '000000', font: 'Arial' }),
                ],
            }));
        }
        summaryChildren.push(new docx_1.Paragraph({ spacing: { after: 200 } }));
        // Table group definitions
        const docxGroups = [
            {
                title: 'DATOS DEL MURO',
                color: 'E3F2FD',
                headers: ['Muro', 'Área (m²)', 'Peso (ton)', 'Altura (m)', 'YCG (m)'],
                getData: (r) => [r.muro, r.area, r.peso, r.altura, r.ycg],
            },
            {
                title: 'CÁLCULOS DE VIENTO',
                color: 'FFF3E0',
                headers: ['Muro', 'Vd (km/h)', 'qz (kPa)', 'Presión (kPa)', 'Fuerza (kN)'],
                getData: (r) => [r.muro, r.vd, r.qz, r.presion, r.fuerza],
            },
            {
                title: 'PARÁMETROS BRACES',
                color: 'F3E5F5',
                headers: ['Muro', 'Tipo', 'Ángulo (°)', 'NPT (m)', 'Eje', 'Factor W2'],
                getData: (r) => [r.muro, r.tipoBrace, r.angulo, r.npt, r.eje, r.factorW2],
            },
            {
                title: 'GEOMETRÍA INSERTO',
                color: 'E8F5E9',
                headers: ['Muro', 'X (m)', 'Y (m)', 'Longitud (m)'],
                getData: (r) => [r.muro, r.xInserto, r.yInserto, r.longitud],
            },
            {
                title: 'FUERZAS Y CANTIDAD',
                color: 'FCE4EC',
                headers: ['Muro', 'FBx (kN)', 'FBy (kN)', 'FB (kN)', 'Cant. Calc.', 'Cant. Final'],
                getData: (r) => [r.muro, r.fbx, r.fby, r.fb, r.cantCalc, r.cantFinal],
            },
        ];
        for (const group of docxGroups) {
            // Group title
            summaryChildren.push(new docx_1.Paragraph({
                spacing: { before: 200, after: 80 },
                children: [
                    new docx_1.TextRun({ text: group.title, bold: true, size: 22, color: '1f1f1f', font: 'Arial' }),
                ],
            }));
            const colCount = group.headers.length;
            // Header row
            const headerCells = group.headers.map(h => new docx_1.TableCell({
                shading: { type: docx_1.ShadingType.CLEAR, fill: group.color },
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { before: 40, after: 40 },
                        children: [
                            new docx_1.TextRun({ text: h, bold: true, size: 14, color: '333333', font: 'Arial' }),
                        ],
                    }),
                ],
                width: { size: Math.floor(100 / colCount), type: docx_1.WidthType.PERCENTAGE },
            }));
            // Data rows
            const dataRows = windTableData.rows.map((row, idx) => {
                const rowData = group.getData(row);
                const cells = rowData.map((val, ci) => new docx_1.TableCell({
                    shading: idx % 2 === 0
                        ? { type: docx_1.ShadingType.CLEAR, fill: 'F9F9F9' }
                        : undefined,
                    children: [
                        new docx_1.Paragraph({
                            alignment: ci === 0 ? docx_1.AlignmentType.LEFT : docx_1.AlignmentType.CENTER,
                            spacing: { before: 20, after: 20 },
                            children: [
                                new docx_1.TextRun({ text: val || '—', size: 14, color: '000000', font: 'Arial' }),
                            ],
                        }),
                    ],
                    width: { size: Math.floor(100 / colCount), type: docx_1.WidthType.PERCENTAGE },
                }));
                return new docx_1.TableRow({ children: cells });
            });
            const table = new docx_1.Table({
                width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
                layout: docx_1.TableLayoutType.FIXED,
                rows: [
                    new docx_1.TableRow({ children: headerCells }),
                    ...dataRows,
                ],
            });
            summaryChildren.push(table);
        }
        sections.push({ properties: { page: a4Page }, children: summaryChildren });
    }
    const docx = new docx_1.Document({
        sections,
    });
    return Buffer.from(await docx_1.Packer.toBuffer(docx));
}
