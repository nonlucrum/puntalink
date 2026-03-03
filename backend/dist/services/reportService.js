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
async function generarInformePDF(projectInfo, coverImageBuffer) {
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
// ─── DOCX Generation ───────────────────────────────────────
async function generarInformeDOCX(projectInfo, coverImageBuffer) {
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
    const docx = new docx_1.Document({
        sections,
    });
    return Buffer.from(await docx_1.Packer.toBuffer(docx));
}
