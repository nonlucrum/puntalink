"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarInformePaneles = generarInformePaneles;
exports.generarInforme = generarInforme;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
function generarInformePaneles(paneles, projectInfo, tablaMuertos, tablaArmado, user, reporteMacizos, // <--- ARGUMENTO IMPORTANTE
reportImage) {
    console.log('[pdfService] Iniciando generación PDF...');
    // --- CAMBIO: Lógica de Mapeo para leer variables del frontend ---
    let filasArmadoFinales = tablaArmado || [];
    if (reporteMacizos && Array.isArray(reporteMacizos) && reporteMacizos.length > 0) {
        console.log(`[pdfService] Transformando ${reporteMacizos.length} registros de macizos...`);
        filasArmadoFinales = reporteMacizos.map((m, i) => ({
            deadman: {
                index: m.grupo_numero || (i + 1),
                eje: String(m.eje || '-'),
                muros: m.muros_list || (m.cantidadMuros ? `${m.cantidadMuros} muros` : ''),
                // Usamos OR (||) para aceptar ambos nombres
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
    else {
        console.log('[pdfService] ⚠️ ADVERTENCIA: El array reporteMacizos llegó vacío o indefinido.');
    }
    // --------------------------------------------------------------
    const panelesConvertidos = paneles.map(panel => {
        if ('idMuro' in panel)
            return convertirPanelParaPDF(panel);
        return panel;
    });
    return new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
        const buffers = [];
        addBackgroundImage(doc);
        doc.on('pageAdded', () => addBackgroundImage(doc));
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            console.log('[pdfService] Buffer finalizado.');
            resolve(Buffer.concat(buffers));
        });
        // Estructura del PDF (Original)
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
        // TABLA DE ARMADO
        doc.addPage();
        // Importante: usamos la variable procesada filasArmadoFinales
        crearTablaArmadoPorMuerto(doc, filasArmadoFinales);
        doc.addPage();
        crearDescripcionParametros(doc, projectInfo);
        addSignatureSection(doc, user);
        doc.end();
    });
}
// ... (MANTENER TODAS LAS FUNCIONES AUXILIARES ORIGINALES ABAJO) ...
// crearPortada, crearPaginaProyecto, etc.
// NO CAMBIAR NADA DEL CÓDIGO VISUAL
function crearTablaArmadoPorMuerto(doc, filas) {
    const startX = 40;
    const startY = 70;
    const rowH = 22;
    const bottomMargin = 60;
    // === Columnas en el orden NUEVO: todo esto va dentro de DEADMAN ===
    let cols = [
        { key: 'index', w: 26, align: 'center' }, // #
        { key: 'eje', w: 36, align: 'center' }, // Eje
        { key: 'muros', w: 74, align: 'left' }, // Muros
        { key: 'dm_largo', w: 50, align: 'center' }, // Largo (m)
        { key: 'dm_alto', w: 50, align: 'center' }, // Alto (m)
        { key: 'dm_ancho', w: 50, align: 'center' }, // Ancho (m)
        // ACERO
        { key: 'acero_cant', w: 32, align: 'center' }, // #
        { key: 'acero_long', w: 64, align: 'center' }, // Longitud (m)
        { key: 'acero_peso', w: 54, align: 'center' }, // Peso (kg)
        { key: 'acero_dir', w: 68, align: 'center' }, // Dirección
        // CONCRETO
        { key: 'horm_vol', w: 54, align: 'center' }, // Vol (m³)
        { key: 'horm_peso', w: 54, align: 'center' }, // Peso (ton)
        // ALAMBRE
        { key: 'alam_long', w: 68, align: 'center' }, // Longitud (m)
        { key: 'alam_peso', w: 54, align: 'center' }, // Peso (kg)
    ];
    // --- Auto-scaling para no desbordar el ancho útil ---
    const rightMargin = 40;
    const available = doc.page.width - startX - rightMargin;
    const rawTotal = cols.reduce((a, c) => a + c.w, 0);
    const scale = Math.min(1, available / rawTotal);
    if (scale < 1) {
        const MIN_W = 22;
        cols = cols.map(c => ({ ...c, w: Math.max(MIN_W, Math.floor(c.w * scale)) }));
    }
    // Índices de grupos
    const idxDEADMAN = 0;
    const lenDEADMAN = 6;
    const idxACERO = 6;
    const lenACERO = 4;
    const idxHORM = 10;
    const lenHORM = 2;
    const idxALAMB = 12;
    const lenALAMB = 2;
    const azul = '#2E86AB';
    const grisBorde = '#DDDDDD';
    const groupWidth = (i, len) => cols.slice(i, i + len).reduce((a, c) => a + c.w, 0);
    // === Helper: texto que se ajusta al ancho ===
    function drawFittedText({ text, x, y, width, maxSize = 9, minSize = 7, align = 'center', abbr = {}, }) {
        const original = text;
        let t = (abbr[text] ?? text);
        let size = maxSize;
        const pad = 4;
        while (size > minSize && doc.widthOfString(t, { size }) > (width - pad))
            size -= 0.5;
        if (doc.widthOfString(t, { size: Math.max(minSize, 6) }) > (width - pad)) {
            const short = abbr[original];
            if (short && short !== t) {
                t = short;
                size = Math.min(size, maxSize);
                while (size > minSize && doc.widthOfString(t, { size }) > (width - pad))
                    size -= 0.5;
            }
        }
        while (doc.widthOfString(t, { size: Math.max(size, minSize) }) > (width - pad) && t.length > 1)
            t = t.slice(0, -1);
        if (t !== original && !t.endsWith('…') && !abbr[original])
            t = t.slice(0, Math.max(0, t.length - 1)) + '…';
        doc.fontSize(Math.max(size, minSize)).text(t, x, y, { width, align });
    }
    // === Encabezado grande ===
    const drawBigHeader = (y) => {
        doc.fontSize(18).fillColor(azul).text('Tabla de Armado por Muerto', startX, y - 38);
        doc.strokeColor(azul).lineWidth(2)
            .moveTo(startX, y - 14)
            .lineTo(startX + groupWidth(0, cols.length), y - 14)
            .stroke();
        const h1 = 24;
        let x = startX;
        const drawGroup = (label, from, len) => {
            const w = groupWidth(from, len);
            doc.save();
            doc.rect(x, y, w, h1).fillAndStroke('#E8F4FD', azul);
            doc.fillColor('#1b1b1b');
            drawFittedText({ text: label.toUpperCase(), x, y: y + 6, width: w, maxSize: 9, minSize: 7, align: 'center' });
            doc.restore();
            x += w;
        };
        drawGroup('DEADMAN', idxDEADMAN, lenDEADMAN);
        drawGroup('ACERO', idxACERO, lenACERO);
        drawGroup('CONCRETO', idxHORM, lenHORM);
        drawGroup('ALAMBRE', idxALAMB, lenALAMB);
        return y + h1;
    };
    // === Encabezado chico ===
    const drawSmallHeader = (y) => {
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
    const drawHeaders = (y) => {
        let yy = drawBigHeader(y);
        yy = drawSmallHeader(yy);
        return yy;
    };
    let y = drawHeaders(startY);
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
    filas.forEach((r, idx) => {
        if (y + rowH > doc.page.height - bottomMargin) {
            doc.addPage();
            y = drawHeaders(70);
        }
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA';
        let x = startX;
        const cells = [
            { text: r.deadman.index, w: cols[0].w, align: 'center' },
            { text: r.deadman.eje, w: cols[1].w, align: 'center' },
            { text: r.deadman.muros, w: cols[2].w, align: 'left' },
            { text: fixedOrDash(r.deadman.largo_m, 2), w: cols[3].w, align: 'center' },
            { text: fixedOrDash(r.deadman.alto_m, 2), w: cols[4].w, align: 'center' },
            { text: fixedOrDash(r.deadman.ancho_m, 2), w: cols[5].w, align: 'center' },
            { text: r.acero.cantidad ?? '—', w: cols[6].w, align: 'center' },
            { text: fixedOrDash(r.acero.longitud_m, 2), w: cols[7].w, align: 'center' },
            { text: fixedOrDash(r.acero.peso_kg, 2), w: cols[8].w, align: 'center' },
            { text: r.acero.direccion || '—', w: cols[9].w, align: 'center' },
            { text: fixedOrDash(r.concreto.vol_m3, 2), w: cols[10].w, align: 'center' },
            { text: fixedOrDash(r.concreto.peso_ton, 2), w: cols[11].w, align: 'center' },
            { text: fixedOrDash(r.alambre.longitud_m, 2), w: cols[12].w, align: 'center' },
            { text: fixedOrDash(r.alambre.peso_kg, 2), w: cols[13].w, align: 'center' },
        ];
        cells.forEach((c) => {
            doc.rect(x, y, c.w, rowH).fillAndStroke(bg, grisBorde);
            doc.fillColor('#000000').fontSize(9)
                .text(String(c.text), x + 3, y + 6, { width: c.w - 6, align: (c.align || 'center') });
            x += c.w;
        });
        y += rowH;
    });
    y += 18;
    const panelH = 26 + 34 + 10;
    if (y + panelH > doc.page.height - bottomMargin) {
        doc.addPage();
        y = 70;
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
    function fixedOrDash(n, d = 2) {
        return (n === null || n === undefined || Number.isNaN(n)) ? '—' : Number(n).toFixed(d);
    }
}
function computeTotals(rows) {
    const sum = (arr, sel) => arr.reduce((a, it) => a + (Number(sel(it)) || 0), 0);
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
function drawTotalsPanel(doc, opts) {
    const azul = '#00B5E2';
    const grisBorde = '#1a1a1a';
    const { x, y, w, hHeader, hRow, data } = opts;
    const colW = w / 4;
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
        if (i > 0) {
            doc.moveTo(x + i * colW, y).lineTo(x + i * colW, y + hHeader).strokeColor(azul).stroke();
        }
    }
    doc.restore();
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
function fmt(n, d) {
    return (Number(n) || 0).toFixed(d);
}
// --- PORTADA Y OTROS HELPERS (Mantener originales) ---
function crearPortada(doc, projectInfo, reportImage) {
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
    const logoImg = doc.openImage(logoPath);
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
    // User report image
    if (reportImage && reportImage.length > 0) {
        try {
            const maxImgW = pageW * 0.55;
            const maxImgH = 180;
            const img = doc.openImage(reportImage);
            const scale = Math.min(maxImgW / img.width, maxImgH / img.height);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            const imgX = (pageW - drawW) / 2;
            doc.image(reportImage, imgX, currentY, { width: drawW, height: drawH });
            currentY += drawH + 20;
        }
        catch (err) {
            console.warn('[pdfService] Error al insertar imagen del usuario:', err?.message || err);
        }
    }
    doc.fontSize(12)
        .fillColor('#666666')
        .text(`Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, pageH - 90, { align: 'center' });
}
function crearPaginaProyecto(doc, projectInfo, user) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const marginX = 60;
    const logoPath = getAssetPath('logo.png');
    if (fs_1.default.existsSync(logoPath)) {
        const img = doc.openImage(logoPath);
        const iw = img.width;
        const ih = img.height;
        const scale = Math.min(180 / iw, 80 / ih);
        const drawW = iw * scale;
        const drawH = ih * scale;
        const logoX = (pageW - drawW) / 2;
        doc.image(logoPath, logoX, 70, { width: drawW });
    }
    doc.fontSize(22).fillColor('#000000').text('PUNTALINK', 0, 160, { align: 'center' });
    let currentY = 210;
    const lineHeight = 32;
    const labelWidth = 160;
    const drawField = (labelEs, value) => {
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
    if (fs_1.default.existsSync(imgPath)) {
        try {
            const img = doc.openImage(imgPath);
            const iw = img.width;
            const ih = img.height;
            const scale = pageW / iw;
            const drawW = pageW;
            const drawH = ih * scale;
            const y = pageH - drawH;
            doc.save();
            doc.image(imgPath, 0, y, { width: drawW, height: drawH });
            doc.restore();
        }
        catch (err) {
            console.warn('[pdfService] No se pudo insertar imagenInfo.png sin bordes:', err?.message || err);
        }
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
    doc.fontSize(10).fillColor('#2E86AB');
    let xPos = 50;
    headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'center' });
        xPos += colWidths[i];
    });
    doc.strokeColor('#2E86AB')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(570, tableTop + 15)
        .stroke();
    currentY = tableTop + 25;
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
function crearEsquema(doc) {
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 40;
    const topY = 70;
    doc.fontSize(20).fillColor('#2E86AB').text('ESQUEMA DE ARMADO', 0, 40, { align: 'center' });
    doc.strokeColor('#2E86AB').lineWidth(2).moveTo(margin, 66).lineTo(pageW - margin, 66).stroke();
    const imgPath = getAssetPath('esquema.png');
    try {
        if (!fs_1.default.existsSync(imgPath)) {
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
        const img = doc.openImage(imgPath);
        const iw = img.width;
        const ih = img.height;
        const maxW = pageW - margin * 2;
        const maxH = pageH - topY - margin;
        const captionText = 'Figura: Esquema referencial de armado del muerto';
        const captionPadding = 6;
        const captionHeight = 12 + 2;
        const scale = Math.min(maxW / iw, (maxH - captionPadding - captionHeight) / ih);
        const drawW = iw * scale;
        const drawH = ih * scale;
        const x = (pageW - drawW) / 2;
        const y = topY + (maxH - (drawH + captionPadding + captionHeight)) / 2;
        doc.save();
        doc.image(imgPath, x, y, { width: drawW, height: drawH });
        doc.restore();
        doc.fontSize(10).fillColor('#555').text(captionText, margin, y + drawH + captionPadding, {
            width: pageW - margin * 2,
            align: 'center',
            lineBreak: false
        });
    }
    catch (err) {
        console.warn('[pdfService] No se pudo dibujar esquema:', err?.message || err);
        const phTop = topY + 10;
        const phH = pageH - phTop - margin;
        doc.rect(margin, phTop, pageW - margin * 2, phH).strokeColor('#B0B0B0').dash(5, { space: 3 }).stroke();
        doc.undash();
        doc.fontSize(12).fillColor('#666666')
            .text('Error al cargar esquema.png', margin, phTop + 12, { width: pageW - margin * 2, align: 'center' });
    }
}
function crearPaginaMuertos(doc, tablaMuertos) {
    doc.fontSize(20)
        .fillColor('#2E86AB')
        .text('RESUMEN POR MUERTOS', 50, 50);
    doc.fontSize(12)
        .fillColor('#000000')
        .text('Agrupación de muros por características similares', 50, 80);
    let currentY = 110;
    const headers = ['#', 'Muerto', 'X Braces', 'Ángulo', 'Eje', 'Tipo Construcción', 'Cant. Muros'];
    const colWidths = [30, 60, 60, 50, 60, 90, 60];
    const startX = 50;
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
    doc.fontSize(9);
    tablaMuertos.forEach((muerto, index) => {
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
    doc.fontSize(14)
        .fillColor('#333333')
        .text('DESCRIPCIÓN DEL CÁLCULO:', 50, currentY, { underline: true });
    currentY += 25;
    doc.fontSize(11)
        .text('El cálculo del muerto está en base a la fuerza axial que actúa en el brace producto de la acción de la fuerza del viento sobre el muro.', 50, currentY, { width: 500, align: 'justify' });
    currentY += 35;
    doc.text('La fuerza de viento actuante en cada muro fue determinada haciendo uso de las "Normas y especificaciones para estudios, proyectos, construcciones e instalaciones del 2015 Volumen 4-México", y tomando en cuenta los siguientes parámetros:', 50, currentY, { width: 500, align: 'justify' });
    currentY += 50;
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
    if (projectInfo?.creadorProyecto) {
        doc.fontSize(14)
            .text('ELABORADO POR:', 50, currentY, { underline: true });
        currentY += 25;
        doc.fontSize(12)
            .text(projectInfo.creadorProyecto, 70, currentY);
    }
    doc.fontSize(8)
        .fillColor('#666666')
        .text('Generado por PUNTALINK - Sistema de análisis y cálculo estructural', 0, 750, { align: 'center' });
}
function generarInforme(resultados) {
    return generarInformePaneles(resultados);
}
function getAssetPath(relPathFromSrcAssets) {
    const tryDist = path_1.default.resolve(__dirname, '../assets', relPathFromSrcAssets);
    const trySrc = path_1.default.resolve(__dirname, '../../src/assets', relPathFromSrcAssets);
    if (fs_1.default.existsSync(tryDist))
        return tryDist;
    if (fs_1.default.existsSync(trySrc))
        return trySrc;
    return path_1.default.resolve(process.cwd(), 'src/assets', relPathFromSrcAssets);
}
function drawCoverImage(doc, imagePath, pageW, pageH, opacity = 0.28) {
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
    if (!fs_1.default.existsSync(bgPath)) {
        return;
    }
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    try {
        const img = doc.openImage(bgPath);
        const iw = img.width;
        const ih = img.height;
        const scale = Math.max(pageW / iw, pageH / ih);
        const drawW = iw * scale;
        const drawH = ih * scale;
        const offsetX = (pageW - drawW) / 2;
        const offsetY = (pageH - drawH) / 2;
        doc.save();
        doc.image(bgPath, offsetX, offsetY, { width: drawW, height: drawH });
        doc.restore();
    }
    catch (err) {
        console.warn('[pdfService] Error al aplicar fondo:', err?.message || err);
    }
}
function addSignatureSection(doc, user) {
    if (!user)
        return;
    const pageH = doc.page.height;
    const currentY = doc.y;
    const spaceNeeded = 120;
    if (currentY + spaceNeeded > pageH - 60)
        return;
    const centerX = doc.page.width / 2;
    const lineWidth = 160;
    const lineY = Math.max(currentY + 60, pageH - 160);
    const lineX = centerX - lineWidth / 2;
    doc.strokeColor('#000000')
        .lineWidth(1)
        .moveTo(lineX, lineY)
        .lineTo(lineX + lineWidth, lineY)
        .stroke();
    const displayName = (user.name && user.name.trim()) ? user.name : (user.email ?? '__________________');
    const displayEmail = user.email ?? '';
    doc.fontSize(11)
        .fillColor('#000000')
        .text(displayName, 0, lineY + 8, { align: 'center' });
    doc.fontSize(10)
        .fillColor('#444444')
        .text(displayEmail, 0, lineY + 24, { align: 'center' });
}
