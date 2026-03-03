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
async function generarInformePDF(projectInfo, coverImageBuffer, windTableData, cilindricoData, rectangularData) {
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
        // Cylindrical deadman pages (if applicable)
        if (cilindricoData && cilindricoData.tables.length > 0) {
            doc.addPage();
            crearPaginaCilindricoPDF(doc, cilindricoData);
        }
        // Rectangular deadman pages (if applicable)
        if (rectangularData) {
            crearPaginasRectangularPDF(doc, rectangularData);
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
// ─── PDF Cylindrical Deadman Page ──────────────────────────
function crearPaginaCilindricoPDF(doc, cilData) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const marginX = 40;
    const contentW = pageW - marginX * 2;
    let y = 50;
    // Title
    doc.fontSize(18).fillColor('#1f1f1f').font('Helvetica-Bold')
        .text('ARMADO CILÍNDRICO AISLADO', marginX, y, { align: 'center', width: contentW });
    y += 35;
    // Separator
    doc.strokeColor('#27ae60').lineWidth(2)
        .moveTo(marginX, y).lineTo(pageW - marginX, y).stroke();
    y += 20;
    // Configuration section
    doc.fontSize(11).fillColor('#1f1f1f').font('Helvetica-Bold')
        .text('Configuración y Materiales', marginX, y);
    y += 18;
    const cfg = cilData.config;
    const configItems = [
        { label: 'Densidad', value: `${cfg.densidad} kg/m³` },
        { label: 'Desperdicio', value: cfg.desperdicio },
        { label: 'Cant. Varillas Vert', value: cfg.cantVert },
        { label: 'Tipo Varilla', value: cfg.tipoVert },
        { label: 'Tipo Anillo', value: cfg.tipoAnillo },
        { label: 'Criterio Anillos', value: cfg.modoAnillos === 'fijo' ? 'Cantidad Fija' : 'Por Separación' },
        { label: 'Cant./Sep.', value: cfg.datoAnillos },
    ];
    // Draw config as 2-column layout
    const colHalf = contentW / 2;
    for (let i = 0; i < configItems.length; i++) {
        const item = configItems[i];
        const xOff = (i % 2 === 0) ? marginX : marginX + colHalf;
        doc.fontSize(8).fillColor('#666666').font('Helvetica')
            .text(`${item.label}: `, xOff, y, { continued: true })
            .font('Helvetica-Bold').fillColor('#000000')
            .text(item.value);
        if (i % 2 === 1 || i === configItems.length - 1)
            y += 16;
    }
    y += 10;
    // Per-diameter tables
    const tableHeaders = ['Muro', 'X (mm)', 'Cant. M.', 'Altura (mm)', 'Concreto (ton)', 'Acero Var. (kg)', 'Acero Anil. (kg)'];
    const colCount = tableHeaders.length;
    const colW = contentW / colCount;
    const headerH = 24;
    const rowH = 20;
    for (const tableGroup of cilData.tables) {
        const neededH = headerH + rowH * tableGroup.rows.length + 45;
        if (y + neededH > pageH - 40) {
            doc.addPage();
            y = 50;
        }
        // Diameter title
        doc.fontSize(10).fillColor('#27ae60').font('Helvetica-Bold')
            .text(tableGroup.diametro, marginX, y);
        y += 16;
        // Header background
        doc.save();
        doc.rect(marginX, y, contentW, headerH).fill('#27ae60');
        doc.restore();
        // Header text
        doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
        for (let c = 0; c < colCount; c++) {
            doc.text(tableHeaders[c], marginX + c * colW + 2, y + 7, { width: colW - 4, align: 'center' });
        }
        doc.strokeColor('#1e8449').lineWidth(0.5);
        doc.moveTo(marginX, y + headerH).lineTo(marginX + contentW, y + headerH).stroke();
        y += headerH;
        // Data rows
        doc.font('Helvetica').fontSize(7).fillColor('#000000');
        for (let i = 0; i < tableGroup.rows.length; i++) {
            const row = tableGroup.rows[i];
            const vals = [row.muro, row.x, row.cantMuertos, row.altura, row.concreto, row.aceroVarillas, row.aceroAnillos];
            if (i % 2 === 0) {
                doc.save();
                doc.rect(marginX, y, contentW, rowH).fill('#f0faf4');
                doc.restore();
                doc.fillColor('#000000');
            }
            for (let c = 0; c < colCount; c++) {
                doc.text(vals[c] || '—', marginX + c * colW + 2, y + 5, { width: colW - 4, align: c === 0 ? 'left' : 'center' });
            }
            doc.strokeColor('#dddddd').lineWidth(0.3);
            doc.moveTo(marginX, y + rowH).lineTo(marginX + contentW, y + rowH).stroke();
            y += rowH;
        }
        // Table border
        const tableTop = y - rowH * tableGroup.rows.length - headerH;
        doc.strokeColor('#27ae60').lineWidth(0.5);
        doc.rect(marginX, tableTop, contentW, headerH + rowH * tableGroup.rows.length).stroke();
        for (let c = 1; c < colCount; c++) {
            doc.moveTo(marginX + c * colW, tableTop).lineTo(marginX + c * colW, y).stroke();
        }
        y += 15;
    }
    // Summary table
    if (cilData.summary && cilData.summary.diameters.length > 0 && cilData.summary.materiales.length > 0) {
        const sumCols = cilData.summary.diameters.length + 1; // +1 for label column
        const sumColW = contentW / sumCols;
        const sumHeaderH = 22;
        const sumRowH = 20;
        const sumNeeded = sumHeaderH * 2 + sumRowH * cilData.summary.materiales.length + 50;
        if (y + sumNeeded > pageH - 40) {
            doc.addPage();
            y = 50;
        }
        // Summary title
        doc.fontSize(11).fillColor('#1f1f1f').font('Helvetica-Bold')
            .text('Resumen Muerto Cilíndrico Aislado - Totales Materiales', marginX, y, { align: 'center', width: contentW });
        y += 22;
        // Header row 1: Option numbers
        doc.save();
        doc.rect(marginX, y, contentW, sumHeaderH).fill('#34495e');
        doc.restore();
        doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('', marginX + 2, y + 6, { width: sumColW - 4, align: 'center' });
        for (let i = 0; i < cilData.summary.diameters.length; i++) {
            doc.text(String(i + 1), marginX + (i + 1) * sumColW + 2, y + 6, { width: sumColW - 4, align: 'center' });
        }
        y += sumHeaderH;
        // Header row 2: Diameters
        doc.save();
        doc.rect(marginX, y, contentW, sumHeaderH).fill('#34495e');
        doc.restore();
        doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('Diámetro (mm)', marginX + 2, y + 6, { width: sumColW - 4, align: 'center' });
        for (let i = 0; i < cilData.summary.diameters.length; i++) {
            doc.text(cilData.summary.diameters[i], marginX + (i + 1) * sumColW + 2, y + 6, { width: sumColW - 4, align: 'center' });
        }
        y += sumHeaderH;
        // Material rows
        doc.font('Helvetica').fontSize(7).fillColor('#000000');
        for (let r = 0; r < cilData.summary.materiales.length; r++) {
            const mat = cilData.summary.materiales[r];
            if (r % 2 === 0) {
                doc.save();
                doc.rect(marginX, y, contentW, sumRowH).fill('#ecf0f1');
                doc.restore();
                doc.fillColor('#000000');
            }
            doc.font('Helvetica-Bold')
                .text(mat.label, marginX + 2, y + 5, { width: sumColW - 4, align: 'left' });
            doc.font('Helvetica');
            for (let i = 0; i < mat.values.length; i++) {
                doc.text(mat.values[i] || '—', marginX + (i + 1) * sumColW + 2, y + 5, { width: sumColW - 4, align: 'center' });
            }
            doc.strokeColor('#cccccc').lineWidth(0.3);
            doc.moveTo(marginX, y + sumRowH).lineTo(marginX + contentW, y + sumRowH).stroke();
            y += sumRowH;
        }
        // Summary table border
        const sumTop = y - sumRowH * cilData.summary.materiales.length - sumHeaderH * 2;
        doc.strokeColor('#27ae60').lineWidth(0.5);
        doc.rect(marginX, sumTop, contentW, sumHeaderH * 2 + sumRowH * cilData.summary.materiales.length).stroke();
        for (let c = 1; c < sumCols; c++) {
            doc.moveTo(marginX + c * sumColW, sumTop).lineTo(marginX + c * sumColW, y).stroke();
        }
    }
}
// ─── PDF Helper: Draw generic table ────────────────────────
function drawGenericTablePDF(doc, headers, rows, startY, marginX, contentW, headerColor, title) {
    const pageH = doc.page.height;
    let y = startY;
    const colCount = headers.length;
    const colW = contentW / colCount;
    const headerH = 22;
    const rowH = 18;
    if (title) {
        if (y + headerH + rowH * rows.length + 40 > pageH - 40) {
            doc.addPage();
            y = 50;
        }
        doc.fontSize(10).fillColor('#1f1f1f').font('Helvetica-Bold').text(title, marginX, y);
        y += 16;
    }
    // Check page break
    if (y + headerH + rowH * Math.min(rows.length, 3) > pageH - 40) {
        doc.addPage();
        y = 50;
    }
    // Header
    doc.save();
    doc.rect(marginX, y, contentW, headerH).fill(headerColor);
    doc.restore();
    doc.fontSize(6).fillColor('#ffffff').font('Helvetica-Bold');
    for (let c = 0; c < colCount; c++) {
        doc.text(headers[c], marginX + c * colW + 2, y + 6, { width: colW - 4, align: 'center' });
    }
    y += headerH;
    // Rows
    doc.font('Helvetica').fontSize(6).fillColor('#000000');
    for (let i = 0; i < rows.length; i++) {
        if (y + rowH > pageH - 40) {
            doc.addPage();
            y = 50;
        }
        if (i % 2 === 0) {
            doc.save();
            doc.rect(marginX, y, contentW, rowH).fill('#f5f5f5');
            doc.restore();
            doc.fillColor('#000000');
        }
        for (let c = 0; c < colCount; c++) {
            const val = (rows[i] && rows[i][c]) || '—';
            doc.text(val, marginX + c * colW + 2, y + 4, { width: colW - 4, align: c === 0 ? 'left' : 'center' });
        }
        doc.strokeColor('#dddddd').lineWidth(0.2).moveTo(marginX, y + rowH).lineTo(marginX + contentW, y + rowH).stroke();
        y += rowH;
    }
    // Border
    const tableTop = y - rowH * rows.length - headerH;
    doc.strokeColor('#999999').lineWidth(0.5).rect(marginX, tableTop, contentW, y - tableTop).stroke();
    for (let c = 1; c < colCount; c++) {
        doc.moveTo(marginX + c * colW, tableTop).lineTo(marginX + c * colW, y).stroke();
    }
    return y + 15;
}
// ─── PDF Rectangular Deadman Pages ─────────────────────────
function crearPaginasRectangularPDF(doc, rectData) {
    const pageW = doc.page.width;
    const marginX = 40;
    const contentW = pageW - marginX * 2;
    // ── Page: Grouped Walls + Sequential Groups ──
    if (rectData.gruposMuertos || rectData.gruposSecuenciales) {
        doc.addPage();
        let y = 50;
        doc.fontSize(16).fillColor('#1f1f1f').font('Helvetica-Bold')
            .text('AGRUPACIÓN DE MUERTOS', marginX, y, { align: 'center', width: contentW });
        y += 30;
        doc.strokeColor('#0d6efd').lineWidth(2).moveTo(marginX, y).lineTo(pageW - marginX, y).stroke();
        y += 15;
        if (rectData.gruposMuertos) {
            y = drawGenericTablePDF(doc, rectData.gruposMuertos.headers, rectData.gruposMuertos.rows, y, marginX, contentW, '#0d6efd', 'Resumen por Muertos');
        }
        if (rectData.gruposSecuenciales) {
            y = drawGenericTablePDF(doc, rectData.gruposSecuenciales.headers, rectData.gruposSecuenciales.rows, y, marginX, contentW, '#6f42c1', 'Grupos Secuenciales');
        }
    }
    // ── Page: Group Configuration ──
    if (rectData.configGrupos) {
        doc.addPage();
        let y = 50;
        doc.fontSize(16).fillColor('#1f1f1f').font('Helvetica-Bold')
            .text('CONFIGURACIÓN DE GRUPOS', marginX, y, { align: 'center', width: contentW });
        y += 30;
        doc.strokeColor('#28a745').lineWidth(2).moveTo(marginX, y).lineTo(pageW - marginX, y).stroke();
        y += 15;
        // This table has 14 columns — split if needed
        const cfg = rectData.configGrupos;
        if (cfg.headers.length > 8) {
            const midPoint = 7; // Split: first 7 cols + rest
            const headers1 = cfg.headers.slice(0, midPoint);
            const headers2 = [cfg.headers[0], ...cfg.headers.slice(midPoint)];
            const rows1 = cfg.rows.map(r => r.slice(0, midPoint));
            const rows2 = cfg.rows.map(r => [r[0], ...r.slice(midPoint)]);
            y = drawGenericTablePDF(doc, headers1, rows1, y, marginX, contentW, '#28a745', 'Datos del Grupo');
            y = drawGenericTablePDF(doc, headers2, rows2, y, marginX, contentW, '#28a745', 'Dimensiones y Materiales');
        }
        else {
            y = drawGenericTablePDF(doc, cfg.headers, cfg.rows, y, marginX, contentW, '#28a745');
        }
    }
    // ── Page: Armado Rectangular Results ──
    if (rectData.armadoResultados && rectData.armadoResultados.grupos.length > 0) {
        doc.addPage();
        let y = 50;
        const pageH = doc.page.height;
        doc.fontSize(16).fillColor('#1f1f1f').font('Helvetica-Bold')
            .text('ARMADO RECTANGULAR - RESULTADOS', marginX, y, { align: 'center', width: contentW });
        y += 30;
        doc.strokeColor('#dc3545').lineWidth(2).moveTo(marginX, y).lineTo(pageW - marginX, y).stroke();
        y += 15;
        const grupos = rectData.armadoResultados.grupos;
        // Split into column groups matching the th colspan structure
        const armadoGroups = [
            {
                title: 'DEADMAN',
                color: '#e3f2fd',
                headers: ['#', 'Eje', 'Muros', 'Largo (m)', 'Alto (m)', 'Ancho (m)'],
                getData: (g) => [[g.numero, g.eje, g.muros, g.largo, g.alto, g.ancho]],
            },
            {
                title: 'ACERO',
                color: '#fff3e0',
                headers: ['#', 'Tipo', 'Longitud (m)', 'Peso (kg)', 'Dirección'],
                getData: (g) => [
                    [g.numero, g.aceroLongTipo, g.aceroLongLong, g.aceroLongPeso, 'Long.'],
                    [g.numero, g.aceroTransTipo, g.aceroTransLong, g.aceroTransPeso, 'Estribo'],
                ],
            },
            {
                title: 'CONCRETO',
                color: '#e8f5e9',
                headers: ['#', 'Volumen (m³)', 'Peso (ton)'],
                getData: (g) => [[g.numero, g.concretoVol, g.concretoPeso]],
            },
            {
                title: 'ALAMBRE',
                color: '#fce4ec',
                headers: ['#', 'Longitud (m)', 'Peso (kg)'],
                getData: (g) => [[g.numero, g.alambreLong, g.alambrePeso]],
            },
        ];
        for (const ag of armadoGroups) {
            const allRows = [];
            for (const g of grupos) {
                allRows.push(...ag.getData(g));
            }
            const neededH = 22 + 18 * allRows.length + 45;
            if (y + neededH > pageH - 40) {
                doc.addPage();
                y = 50;
            }
            y = drawGenericTablePDF(doc, ag.headers, allRows, y, marginX, contentW, ag.color.replace('#', '').length === 6 ? ag.color : '#666666', ag.title);
        }
        // Totals
        const tot = rectData.armadoResultados.totales;
        if (tot) {
            if (y + 40 > pageH - 40) {
                doc.addPage();
                y = 50;
            }
            doc.fontSize(9).fillColor('#1f1f1f').font('Helvetica-Bold')
                .text('TOTALES PROYECTO:', marginX, y);
            y += 16;
            const totItems = [
                `Acero Total: ${tot.aceroTotal}`,
                `Concreto: ${tot.concretoVol} | ${tot.concretoPeso}`,
                `Alambre: ${tot.alambreLong} | ${tot.alambrePeso}`,
            ];
            doc.fontSize(8).font('Helvetica').fillColor('#333333');
            for (const item of totItems) {
                doc.text(`•  ${item}`, marginX + 10, y);
                y += 14;
            }
        }
    }
}
// ─── DOCX Generation ───────────────────────────────────────
async function generarInformeDOCX(projectInfo, coverImageBuffer, windTableData, cilindricoData, rectangularData) {
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
    // ── Cylindrical Deadman Section ──
    if (cilindricoData && cilindricoData.tables.length > 0) {
        const cilChildren = [];
        // Title
        cilChildren.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200, before: 200 },
            children: [
                new docx_1.TextRun({ text: 'ARMADO CILÍNDRICO AISLADO', bold: true, size: 32, color: '1f1f1f', font: 'Arial' }),
            ],
        }));
        // Separator
        cilChildren.push(new docx_1.Paragraph({
            spacing: { after: 200 },
            border: {
                bottom: { style: docx_1.BorderStyle.SINGLE, size: 4, color: '27AE60', space: 1 },
            },
            children: [new docx_1.TextRun({ text: ' ', size: 4 })],
        }));
        // Configuration
        cilChildren.push(new docx_1.Paragraph({
            spacing: { after: 100 },
            children: [
                new docx_1.TextRun({ text: 'Configuración y Materiales', bold: true, size: 22, color: '1f1f1f', font: 'Arial' }),
            ],
        }));
        const cfg = cilindricoData.config;
        const configPairs = [
            ['Densidad', `${cfg.densidad} kg/m³`],
            ['Desperdicio', cfg.desperdicio],
            ['Cant. Varillas Vert', cfg.cantVert],
            ['Tipo Varilla', cfg.tipoVert],
            ['Tipo Anillo', cfg.tipoAnillo],
            ['Criterio Anillos', cfg.modoAnillos === 'fijo' ? 'Cantidad Fija' : 'Por Separación'],
            ['Cant./Sep.', cfg.datoAnillos],
        ];
        for (const [label, value] of configPairs) {
            cilChildren.push(new docx_1.Paragraph({
                spacing: { after: 40 },
                children: [
                    new docx_1.TextRun({ text: `${label}: `, size: 18, color: '666666', font: 'Arial' }),
                    new docx_1.TextRun({ text: value || '—', bold: true, size: 18, color: '000000', font: 'Arial' }),
                ],
            }));
        }
        cilChildren.push(new docx_1.Paragraph({ spacing: { after: 150 } }));
        // Per-diameter tables
        const cilHeaders = ['Muro', 'X (mm)', 'Cant. M.', 'Altura (mm)', 'Concreto (ton)', 'Acero Var. (kg)', 'Acero Anil. (kg)'];
        const cilColCount = cilHeaders.length;
        for (const tableGroup of cilindricoData.tables) {
            // Diameter title
            cilChildren.push(new docx_1.Paragraph({
                spacing: { before: 150, after: 80 },
                children: [
                    new docx_1.TextRun({ text: tableGroup.diametro, bold: true, size: 20, color: '27AE60', font: 'Arial' }),
                ],
            }));
            // Header cells
            const hCells = cilHeaders.map(h => new docx_1.TableCell({
                shading: { type: docx_1.ShadingType.CLEAR, fill: '27AE60' },
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { before: 30, after: 30 },
                        children: [
                            new docx_1.TextRun({ text: h, bold: true, size: 14, color: 'FFFFFF', font: 'Arial' }),
                        ],
                    }),
                ],
                width: { size: Math.floor(100 / cilColCount), type: docx_1.WidthType.PERCENTAGE },
            }));
            // Data rows
            const dRows = tableGroup.rows.map((row, idx) => {
                const vals = [row.muro, row.x, row.cantMuertos, row.altura, row.concreto, row.aceroVarillas, row.aceroAnillos];
                const cells = vals.map((val, ci) => new docx_1.TableCell({
                    shading: idx % 2 === 0 ? { type: docx_1.ShadingType.CLEAR, fill: 'F0FAF4' } : undefined,
                    children: [
                        new docx_1.Paragraph({
                            alignment: ci === 0 ? docx_1.AlignmentType.LEFT : docx_1.AlignmentType.CENTER,
                            spacing: { before: 20, after: 20 },
                            children: [
                                new docx_1.TextRun({ text: val || '—', size: 14, color: '000000', font: 'Arial' }),
                            ],
                        }),
                    ],
                    width: { size: Math.floor(100 / cilColCount), type: docx_1.WidthType.PERCENTAGE },
                }));
                return new docx_1.TableRow({ children: cells });
            });
            cilChildren.push(new docx_1.Table({
                width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
                layout: docx_1.TableLayoutType.FIXED,
                rows: [new docx_1.TableRow({ children: hCells }), ...dRows],
            }));
        }
        // Summary table
        if (cilindricoData.summary && cilindricoData.summary.diameters.length > 0 && cilindricoData.summary.materiales.length > 0) {
            cilChildren.push(new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 300, after: 100 },
                children: [
                    new docx_1.TextRun({ text: 'Resumen Muerto Cilíndrico Aislado - Totales Materiales', bold: true, size: 20, color: '1f1f1f', font: 'Arial' }),
                ],
            }));
            const sumColCount = cilindricoData.summary.diameters.length + 1;
            // Header row 1: option numbers
            const optCells = [
                new docx_1.TableCell({
                    shading: { type: docx_1.ShadingType.CLEAR, fill: '34495E' },
                    children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: '', size: 14 })] })],
                    width: { size: Math.floor(100 / sumColCount), type: docx_1.WidthType.PERCENTAGE },
                }),
                ...cilindricoData.summary.diameters.map((_, i) => new docx_1.TableCell({
                    shading: { type: docx_1.ShadingType.CLEAR, fill: '34495E' },
                    children: [
                        new docx_1.Paragraph({
                            alignment: docx_1.AlignmentType.CENTER,
                            children: [new docx_1.TextRun({ text: String(i + 1), bold: true, size: 14, color: 'FFFFFF', font: 'Arial' })],
                        }),
                    ],
                    width: { size: Math.floor(100 / sumColCount), type: docx_1.WidthType.PERCENTAGE },
                })),
            ];
            // Header row 2: diameters
            const diamCells = [
                new docx_1.TableCell({
                    shading: { type: docx_1.ShadingType.CLEAR, fill: '34495E' },
                    children: [
                        new docx_1.Paragraph({
                            alignment: docx_1.AlignmentType.CENTER,
                            children: [new docx_1.TextRun({ text: 'Diámetro (mm)', bold: true, size: 14, color: 'FFFFFF', font: 'Arial' })],
                        }),
                    ],
                    width: { size: Math.floor(100 / sumColCount), type: docx_1.WidthType.PERCENTAGE },
                }),
                ...cilindricoData.summary.diameters.map(d => new docx_1.TableCell({
                    shading: { type: docx_1.ShadingType.CLEAR, fill: '34495E' },
                    children: [
                        new docx_1.Paragraph({
                            alignment: docx_1.AlignmentType.CENTER,
                            children: [new docx_1.TextRun({ text: d, bold: true, size: 14, color: 'FFFFFF', font: 'Arial' })],
                        }),
                    ],
                    width: { size: Math.floor(100 / sumColCount), type: docx_1.WidthType.PERCENTAGE },
                })),
            ];
            // Material rows
            const matRows = cilindricoData.summary.materiales.map((mat, idx) => {
                const cells = [
                    new docx_1.TableCell({
                        shading: { type: docx_1.ShadingType.CLEAR, fill: 'ECF0F1' },
                        children: [
                            new docx_1.Paragraph({
                                spacing: { before: 20, after: 20 },
                                children: [new docx_1.TextRun({ text: mat.label, bold: true, size: 14, color: '000000', font: 'Arial' })],
                            }),
                        ],
                        width: { size: Math.floor(100 / sumColCount), type: docx_1.WidthType.PERCENTAGE },
                    }),
                    ...mat.values.map(v => new docx_1.TableCell({
                        shading: idx % 2 === 0 ? { type: docx_1.ShadingType.CLEAR, fill: 'F9F9F9' } : undefined,
                        children: [
                            new docx_1.Paragraph({
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: { before: 20, after: 20 },
                                children: [new docx_1.TextRun({ text: v || '—', size: 14, color: '000000', font: 'Arial' })],
                            }),
                        ],
                        width: { size: Math.floor(100 / sumColCount), type: docx_1.WidthType.PERCENTAGE },
                    })),
                ];
                return new docx_1.TableRow({ children: cells });
            });
            cilChildren.push(new docx_1.Table({
                width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
                layout: docx_1.TableLayoutType.FIXED,
                rows: [
                    new docx_1.TableRow({ children: optCells }),
                    new docx_1.TableRow({ children: diamCells }),
                    ...matRows,
                ],
            }));
        }
        sections.push({ properties: { page: a4Page }, children: cilChildren });
    }
    // ── Rectangular Deadman Sections ──
    if (rectangularData) {
        // Helper to build a generic DOCX table
        function buildDocxTable(headers, rows, headerColor, altRowColor) {
            const colCount = headers.length;
            const headerCells = headers.map(h => new docx_1.TableCell({
                shading: { type: docx_1.ShadingType.CLEAR, fill: headerColor },
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { before: 30, after: 30 },
                        children: [
                            new docx_1.TextRun({ text: h, bold: true, size: 14, color: 'FFFFFF', font: 'Arial' }),
                        ],
                    }),
                ],
                width: { size: Math.floor(100 / colCount), type: docx_1.WidthType.PERCENTAGE },
            }));
            const dataRows = rows.map((row, idx) => {
                const cells = row.map((val, ci) => new docx_1.TableCell({
                    shading: idx % 2 === 0 && altRowColor
                        ? { type: docx_1.ShadingType.CLEAR, fill: altRowColor }
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
            return new docx_1.Table({
                width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
                layout: docx_1.TableLayoutType.FIXED,
                rows: [new docx_1.TableRow({ children: headerCells }), ...dataRows],
            });
        }
        // ── Section: Grouped Walls + Sequential Groups ──
        if (rectangularData.gruposMuertos || rectangularData.gruposSecuenciales) {
            const grpChildren = [];
            grpChildren.push(new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { after: 200, before: 200 },
                children: [
                    new docx_1.TextRun({ text: 'AGRUPACIÓN DE MUERTOS', bold: true, size: 32, color: '1f1f1f', font: 'Arial' }),
                ],
            }));
            grpChildren.push(new docx_1.Paragraph({
                spacing: { after: 200 },
                border: {
                    bottom: { style: docx_1.BorderStyle.SINGLE, size: 4, color: '0d6efd', space: 1 },
                },
                children: [new docx_1.TextRun({ text: ' ', size: 4 })],
            }));
            if (rectangularData.gruposMuertos) {
                grpChildren.push(new docx_1.Paragraph({
                    spacing: { before: 100, after: 80 },
                    children: [
                        new docx_1.TextRun({ text: 'Resumen por Muertos', bold: true, size: 20, color: '0d6efd', font: 'Arial' }),
                    ],
                }));
                grpChildren.push(buildDocxTable(rectangularData.gruposMuertos.headers, rectangularData.gruposMuertos.rows, '0d6efd', 'EBF5FB'));
            }
            if (rectangularData.gruposSecuenciales) {
                grpChildren.push(new docx_1.Paragraph({
                    spacing: { before: 200, after: 80 },
                    children: [
                        new docx_1.TextRun({ text: 'Grupos Secuenciales', bold: true, size: 20, color: '6f42c1', font: 'Arial' }),
                    ],
                }));
                grpChildren.push(buildDocxTable(rectangularData.gruposSecuenciales.headers, rectangularData.gruposSecuenciales.rows, '6f42c1', 'F4ECF7'));
            }
            sections.push({ properties: { page: a4Page }, children: grpChildren });
        }
        // ── Section: Group Configuration ──
        if (rectangularData.configGrupos) {
            const cfgChildren = [];
            cfgChildren.push(new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { after: 200, before: 200 },
                children: [
                    new docx_1.TextRun({ text: 'CONFIGURACIÓN DE GRUPOS', bold: true, size: 32, color: '1f1f1f', font: 'Arial' }),
                ],
            }));
            cfgChildren.push(new docx_1.Paragraph({
                spacing: { after: 200 },
                border: {
                    bottom: { style: docx_1.BorderStyle.SINGLE, size: 4, color: '28a745', space: 1 },
                },
                children: [new docx_1.TextRun({ text: ' ', size: 4 })],
            }));
            const cfgData = rectangularData.configGrupos;
            if (cfgData.headers.length > 8) {
                const midPoint = 7;
                const headers1 = cfgData.headers.slice(0, midPoint);
                const headers2 = [cfgData.headers[0], ...cfgData.headers.slice(midPoint)];
                const rows1 = cfgData.rows.map(r => r.slice(0, midPoint));
                const rows2 = cfgData.rows.map(r => [r[0], ...r.slice(midPoint)]);
                cfgChildren.push(new docx_1.Paragraph({
                    spacing: { before: 100, after: 80 },
                    children: [
                        new docx_1.TextRun({ text: 'Datos del Grupo', bold: true, size: 20, color: '28a745', font: 'Arial' }),
                    ],
                }));
                cfgChildren.push(buildDocxTable(headers1, rows1, '28a745', 'EAFAF1'));
                cfgChildren.push(new docx_1.Paragraph({
                    spacing: { before: 200, after: 80 },
                    children: [
                        new docx_1.TextRun({ text: 'Dimensiones y Materiales', bold: true, size: 20, color: '28a745', font: 'Arial' }),
                    ],
                }));
                cfgChildren.push(buildDocxTable(headers2, rows2, '28a745', 'EAFAF1'));
            }
            else {
                cfgChildren.push(buildDocxTable(cfgData.headers, cfgData.rows, '28a745', 'EAFAF1'));
            }
            sections.push({ properties: { page: a4Page }, children: cfgChildren });
        }
        // ── Section: Armado Rectangular Results ──
        if (rectangularData.armadoResultados && rectangularData.armadoResultados.grupos.length > 0) {
            const armChildren = [];
            armChildren.push(new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { after: 200, before: 200 },
                children: [
                    new docx_1.TextRun({ text: 'ARMADO RECTANGULAR - RESULTADOS', bold: true, size: 32, color: '1f1f1f', font: 'Arial' }),
                ],
            }));
            armChildren.push(new docx_1.Paragraph({
                spacing: { after: 200 },
                border: {
                    bottom: { style: docx_1.BorderStyle.SINGLE, size: 4, color: 'dc3545', space: 1 },
                },
                children: [new docx_1.TextRun({ text: ' ', size: 4 })],
            }));
            const grupos = rectangularData.armadoResultados.grupos;
            const armadoGroups = [
                {
                    title: 'DEADMAN',
                    headerColor: '2196F3',
                    altColor: 'E3F2FD',
                    headers: ['#', 'Eje', 'Muros', 'Largo (m)', 'Alto (m)', 'Ancho (m)'],
                    getData: (g) => [[g.numero, g.eje, g.muros, g.largo, g.alto, g.ancho]],
                },
                {
                    title: 'ACERO',
                    headerColor: 'F57C00',
                    altColor: 'FFF3E0',
                    headers: ['#', 'Tipo', 'Longitud (m)', 'Peso (kg)', 'Dirección'],
                    getData: (g) => [
                        [g.numero, g.aceroLongTipo, g.aceroLongLong, g.aceroLongPeso, 'Long.'],
                        [g.numero, g.aceroTransTipo, g.aceroTransLong, g.aceroTransPeso, 'Estribo'],
                    ],
                },
                {
                    title: 'CONCRETO',
                    headerColor: '388E3C',
                    altColor: 'E8F5E9',
                    headers: ['#', 'Volumen (m³)', 'Peso (ton)'],
                    getData: (g) => [[g.numero, g.concretoVol, g.concretoPeso]],
                },
                {
                    title: 'ALAMBRE',
                    headerColor: 'C62828',
                    altColor: 'FCE4EC',
                    headers: ['#', 'Longitud (m)', 'Peso (kg)'],
                    getData: (g) => [[g.numero, g.alambreLong, g.alambrePeso]],
                },
            ];
            for (const ag of armadoGroups) {
                const allRows = [];
                for (const g of grupos) {
                    allRows.push(...ag.getData(g));
                }
                armChildren.push(new docx_1.Paragraph({
                    spacing: { before: 200, after: 80 },
                    children: [
                        new docx_1.TextRun({ text: ag.title, bold: true, size: 22, color: ag.headerColor, font: 'Arial' }),
                    ],
                }));
                armChildren.push(buildDocxTable(ag.headers, allRows, ag.headerColor, ag.altColor));
            }
            // Totals
            const tot = rectangularData.armadoResultados.totales;
            if (tot) {
                armChildren.push(new docx_1.Paragraph({
                    spacing: { before: 300, after: 60 },
                    children: [
                        new docx_1.TextRun({ text: 'TOTALES PROYECTO:', bold: true, size: 20, color: '1f1f1f', font: 'Arial' }),
                    ],
                }));
                const totItems = [
                    `Acero Total: ${tot.aceroTotal}`,
                    `Concreto: ${tot.concretoVol} | ${tot.concretoPeso}`,
                    `Alambre: ${tot.alambreLong} | ${tot.alambrePeso}`,
                ];
                for (const item of totItems) {
                    armChildren.push(new docx_1.Paragraph({
                        spacing: { after: 30 },
                        children: [
                            new docx_1.TextRun({ text: '•  ', size: 18, font: 'Arial' }),
                            new docx_1.TextRun({ text: item, size: 18, color: '333333', font: 'Arial' }),
                        ],
                    }));
                }
            }
            sections.push({ properties: { page: a4Page }, children: armChildren });
        }
    }
    const docx = new docx_1.Document({
        sections,
    });
    return Buffer.from(await docx_1.Packer.toBuffer(docx));
}
