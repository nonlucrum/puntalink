"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarInformeDocx = generarInformeDocx;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const docx_1 = require("docx");
// === Helpers ===
const AZUL = '2E86AB';
const FONDO_CLARO = 'E8F4FD';
const GRIS_BORDE = 'DDDDDD';
const BLANCO = 'FFFFFF';
const NEGRO = '000000';
function getAssetPath(relPath) {
    const tryDist = path_1.default.resolve(__dirname, '../assets', relPath);
    const trySrc = path_1.default.resolve(__dirname, '../../src/assets', relPath);
    if (fs_1.default.existsSync(tryDist))
        return tryDist;
    if (fs_1.default.existsSync(trySrc))
        return trySrc;
    return path_1.default.resolve(process.cwd(), 'src/assets', relPath);
}
function safeReadFile(relPath) {
    const p = getAssetPath(relPath);
    if (fs_1.default.existsSync(p))
        return fs_1.default.readFileSync(p);
    return null;
}
/** Read PNG dimensions from buffer header */
function getPngDimensions(buf) {
    // PNG signature: 137 80 78 71 13 10 26 10, then IHDR chunk
    if (buf.length < 24)
        return null;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        return { width, height };
    }
    return null;
}
/** Scale image to fit within maxW x maxH preserving aspect ratio */
function fitImage(buf, maxW, maxH) {
    const dims = getPngDimensions(buf);
    if (!dims)
        return { width: maxW, height: maxH };
    const scale = Math.min(maxW / dims.width, maxH / dims.height);
    return { width: Math.round(dims.width * scale), height: Math.round(dims.height * scale) };
}
function fmt(n, d) {
    return (Number(n) || 0).toFixed(d);
}
function fixedOrDash(n, d = 2) {
    return (n === null || n === undefined || Number.isNaN(n)) ? '\u2014' : Number(n).toFixed(d);
}
function shadedCell(text, color, opts) {
    return new docx_1.TableCell({
        shading: { type: docx_1.ShadingType.CLEAR, fill: color },
        verticalAlign: docx_1.VerticalAlign.CENTER,
        columnSpan: opts?.columnSpan,
        width: opts?.width ? { size: opts.width, type: docx_1.WidthType.DXA } : undefined,
        children: [
            new docx_1.Paragraph({
                alignment: opts?.alignment ?? docx_1.AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                    new docx_1.TextRun({
                        text,
                        bold: opts?.bold ?? false,
                        size: opts?.fontSize ?? 18,
                        font: 'Calibri',
                        color: NEGRO,
                    }),
                ],
            }),
        ],
    });
}
function headerCell(text, opts) {
    return new docx_1.TableCell({
        shading: { type: docx_1.ShadingType.CLEAR, fill: FONDO_CLARO },
        verticalAlign: docx_1.VerticalAlign.CENTER,
        columnSpan: opts?.columnSpan,
        width: opts?.width ? { size: opts.width, type: docx_1.WidthType.DXA } : undefined,
        borders: {
            top: { style: docx_1.BorderStyle.SINGLE, size: 1, color: AZUL },
            bottom: { style: docx_1.BorderStyle.SINGLE, size: 1, color: AZUL },
            left: { style: docx_1.BorderStyle.SINGLE, size: 1, color: AZUL },
            right: { style: docx_1.BorderStyle.SINGLE, size: 1, color: AZUL },
        },
        children: [
            new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                    new docx_1.TextRun({
                        text,
                        bold: true,
                        size: 18,
                        font: 'Calibri',
                        color: NEGRO,
                    }),
                ],
            }),
        ],
    });
}
function dataCell(text, opts) {
    return new docx_1.TableCell({
        verticalAlign: docx_1.VerticalAlign.CENTER,
        width: opts?.width ? { size: opts.width, type: docx_1.WidthType.DXA } : undefined,
        borders: {
            top: { style: docx_1.BorderStyle.SINGLE, size: 1, color: GRIS_BORDE },
            bottom: { style: docx_1.BorderStyle.SINGLE, size: 1, color: GRIS_BORDE },
            left: { style: docx_1.BorderStyle.SINGLE, size: 1, color: GRIS_BORDE },
            right: { style: docx_1.BorderStyle.SINGLE, size: 1, color: GRIS_BORDE },
        },
        children: [
            new docx_1.Paragraph({
                alignment: opts?.alignment ?? docx_1.AlignmentType.CENTER,
                spacing: { before: 20, after: 20 },
                children: [
                    new docx_1.TextRun({
                        text,
                        size: 18,
                        font: 'Calibri',
                    }),
                ],
            }),
        ],
    });
}
// === Section builders ===
function buildCoverSection(data) {
    const children = [];
    // Logo
    const logoBuffer = safeReadFile('logo.png');
    if (logoBuffer) {
        const logoDims = fitImage(logoBuffer, 200, 90);
        children.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { before: 600, after: 200 },
            children: [
                new docx_1.ImageRun({
                    data: logoBuffer,
                    transformation: logoDims,
                }),
            ],
        }));
    }
    // Title
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
            new docx_1.TextRun({ text: 'PUNTALINK', bold: true, size: 72, font: 'Calibri', color: '1f1f1f' }),
        ],
    }), new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
            new docx_1.TextRun({ text: 'Sistema de Análisis y Cálculo Estructural', size: 28, font: 'Calibri', color: '4a4a4a' }),
        ],
    }));
    // Separator line (using border on paragraph)
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { before: 100, after: 200 },
        border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 3, color: AZUL, space: 1 } },
        children: [],
    }));
    // Report title
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 50 },
        children: [
            new docx_1.TextRun({ text: 'INFORME DE ANÁLISIS', bold: true, size: 36, font: 'Calibri', color: '333333' }),
        ],
    }), new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
            new docx_1.TextRun({ text: 'DE MUERTOS CORRIDOS', bold: true, size: 36, font: 'Calibri', color: '333333' }),
        ],
    }));
    // Project name
    if (data.projectInfo?.nombre) {
        children.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
                new docx_1.TextRun({ text: 'PROYECTO:', bold: true, size: 32, font: 'Calibri', color: AZUL }),
            ],
        }), new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
                new docx_1.TextRun({ text: data.projectInfo.nombre, size: 28, font: 'Calibri', color: '333333' }),
            ],
        }));
    }
    // Company
    if (data.projectInfo?.empresa) {
        children.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [
                new docx_1.TextRun({ text: 'CONSTRUCTORA:', bold: true, size: 28, font: 'Calibri', color: AZUL }),
            ],
        }), new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
                new docx_1.TextRun({ text: data.projectInfo.empresa, size: 24, font: 'Calibri', color: '333333' }),
            ],
        }));
    }
    // Date
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
            new docx_1.TextRun({ text: `Fecha: ${fecha}`, size: 22, font: 'Calibri', color: '666666' }),
        ],
    }));
    return children;
}
function buildProjectInfoSection(data) {
    const children = [];
    const pi = data.projectInfo;
    const user = data.user;
    // Logo
    const logoBuffer = safeReadFile('logo.png');
    if (logoBuffer) {
        const logoDims = fitImage(logoBuffer, 180, 80);
        children.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
                new docx_1.ImageRun({ data: logoBuffer, transformation: logoDims }),
            ],
        }));
    }
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
            new docx_1.TextRun({ text: 'PUNTALINK', bold: true, size: 40, font: 'Calibri' }),
        ],
    }));
    const fields = [
        ['NOMBRE PROYECTO', pi?.nombre],
        ['EMPRESA CONSTRUCTORA', pi?.empresa],
        ['TIPO DE MUERTO', pi?.tipo_muerto],
        ['VELOCIDAD DEL VIENTO (km/h)', pi?.vel_viento?.toString()],
        ['TEMPERATURA PROMEDIO (°C)', pi?.temp_promedio?.toString()],
        ['PRESIÓN ATMOSFÉRICA (mmHg)', pi?.presion_atmo?.toString()],
        ['CREADOR DEL PROYECTO', pi?.creadorProyecto || (user?.name && user.name.trim()) || user?.email || 'No especificado'],
        ['VERSIÓN', pi?.version],
        ['FECHA', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ];
    for (const [label, value] of fields) {
        const display = (!value || (typeof value === 'string' && value.trim() === '')) ? '\u2014' : value;
        children.push(new docx_1.Paragraph({
            spacing: { after: 80 },
            children: [
                new docx_1.TextRun({ text: `${label.toUpperCase()}:  `, size: 18, font: 'Calibri', color: '888888' }),
                new docx_1.TextRun({ text: display, size: 22, font: 'Calibri', color: NEGRO }),
            ],
        }));
    }
    return children;
}
function buildCalculationsSection(data) {
    const children = [];
    const paneles = data.paneles;
    // Title
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [
            new docx_1.TextRun({ text: 'RESULTADOS DE CÁLCULOS', bold: true, size: 36, font: 'Calibri', color: AZUL }),
        ],
    }), new docx_1.Paragraph({
        border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 2, color: AZUL, space: 1 } },
        spacing: { after: 200 },
        children: [],
    }));
    // Summary
    const totalVolumen = paneles.reduce((sum, p) => sum + (p.volumen_m3 || 0), 0);
    const totalPeso = paneles.reduce((sum, p) => sum + (p.peso_kN || 0), 0);
    const gruaMaxima = Math.max(...paneles.map(p => p.grua_min_kN_aprox || 0));
    children.push(new docx_1.Paragraph({
        spacing: { after: 100 },
        children: [
            new docx_1.TextRun({ text: 'RESUMEN GENERAL:', bold: true, underline: {}, size: 24, font: 'Calibri', color: '333333' }),
        ],
    }), new docx_1.Paragraph({
        spacing: { after: 40 },
        children: [new docx_1.TextRun({ text: `  \u2022 Total de paneles analizados: ${paneles.length}`, size: 22, font: 'Calibri' })],
    }), new docx_1.Paragraph({
        spacing: { after: 40 },
        children: [new docx_1.TextRun({ text: `  \u2022 Volumen total de concreto: ${totalVolumen.toFixed(2)} m\u00B3`, size: 22, font: 'Calibri' })],
    }), new docx_1.Paragraph({
        spacing: { after: 40 },
        children: [new docx_1.TextRun({ text: `  \u2022 Peso total: ${totalPeso.toFixed(2)} kN`, size: 22, font: 'Calibri' })],
    }), new docx_1.Paragraph({
        spacing: { after: 200 },
        children: [new docx_1.TextRun({ text: `  \u2022 Capacidad máxima de grúa requerida: ${isFinite(gruaMaxima) ? gruaMaxima.toFixed(2) : '0.00'} kN`, size: 22, font: 'Calibri' })],
    }));
    // Detail table
    children.push(new docx_1.Paragraph({
        spacing: { after: 100 },
        children: [
            new docx_1.TextRun({ text: 'DETALLE DE CÁLCULOS POR PANEL:', bold: true, underline: {}, size: 24, font: 'Calibri', color: '333333' }),
        ],
    }));
    const headers = ['Panel', 'Ángulo (°)', 'Tipo Brace', 'FBx (kN)', 'FBy (kN)', 'FB (kN)', 'Cantidad'];
    const headerRow = new docx_1.TableRow({
        tableHeader: true,
        children: headers.map(h => headerCell(h)),
    });
    const dataRows = paneles.map((panel, i) => {
        const rowCells = [
            panel.id_muro || 'N/A',
            panel.grados_inclinacion_brace?.toString() ?? 'N/A',
            panel.modelo_brace || 'N/A',
            panel.fbx?.toString() ?? 'N/A',
            panel.fby?.toString() ?? 'N/A',
            panel.fb?.toString() ?? 'N/A',
            panel.total_braces?.toString() ?? 'N/A',
        ];
        const bg = i % 2 === 0 ? BLANCO : 'F8F9FA';
        return new docx_1.TableRow({
            children: rowCells.map(text => shadedCell(text, bg)),
        });
    });
    children.push(new docx_1.Table({
        width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
    }));
    return children;
}
function buildSchemaSection() {
    const children = [];
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { before: 100, after: 50 },
        children: [
            new docx_1.TextRun({ text: 'ESQUEMA DE ARMADO', bold: true, size: 36, font: 'Calibri', color: AZUL }),
        ],
    }), new docx_1.Paragraph({
        border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 2, color: AZUL, space: 1 } },
        spacing: { after: 200 },
        children: [],
    }));
    const esquemaBuffer = safeReadFile('esquema.png');
    if (esquemaBuffer) {
        children.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
                new docx_1.ImageRun({ data: esquemaBuffer, transformation: { width: 500, height: 600 } }),
            ],
        }), new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            children: [
                new docx_1.TextRun({ text: 'Figura: Esquema referencial de armado del muerto', italics: true, size: 18, font: 'Calibri', color: '555555' }),
            ],
        }));
    }
    else {
        children.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { before: 200 },
            children: [
                new docx_1.TextRun({ text: 'ESQUEMA NO DISPONIBLE', size: 22, font: 'Calibri', color: '666666' }),
            ],
        }));
    }
    return children;
}
function buildImageSection(imageBuffer) {
    const children = [];
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { before: 100, after: 50 },
        children: [
            new docx_1.TextRun({ text: 'IMAGEN DEL PROYECTO', bold: true, size: 32, font: 'Calibri', color: AZUL }),
        ],
    }), new docx_1.Paragraph({
        border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 2, color: AZUL, space: 1 } },
        spacing: { after: 200 },
        children: [],
    }));
    // Try to get image dimensions for proper aspect ratio
    const dims = getPngDimensions(imageBuffer);
    let imgW = 480;
    let imgH = 360;
    if (dims) {
        const scale = Math.min(480 / dims.width, 600 / dims.height);
        imgW = Math.round(dims.width * scale);
        imgH = Math.round(dims.height * scale);
    }
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [
            new docx_1.ImageRun({
                data: imageBuffer,
                transformation: { width: imgW, height: imgH },
            }),
        ],
    }));
    return children;
}
function buildSpacingSection(pairs) {
    const children = [];
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.LEFT,
        spacing: { before: 100, after: 50 },
        children: [
            new docx_1.TextRun({ text: 'Tabla 2. Espaciamiento de las varillas por muerto.', bold: true, size: 22, font: 'Calibri', color: AZUL }),
        ],
    }), new docx_1.Paragraph({
        border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 2, color: AZUL, space: 1 } },
        spacing: { after: 200 },
        children: [],
    }));
    if (!pairs || pairs.length === 0) {
        children.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [
                new docx_1.TextRun({ text: 'No hay datos de espaciamiento disponibles.', size: 22, font: 'Calibri', color: '666666' }),
            ],
        }));
        return children;
    }
    const headers = ['Nº', 'Eje', 'Muros', 'Espaciado\nLongitudinal (m)', 'Espaciado\nTransversal (m)', 'Distancia X (m)'];
    const headerRow = new docx_1.TableRow({
        tableHeader: true,
        children: headers.map(h => headerCell(h)),
    });
    const dataRows = pairs.map((pair, i) => {
        const bg = i % 2 === 0 ? BLANCO : 'F8F9FA';
        const cells = [
            `D${pair.deadman.index}`,
            pair.deadman.eje,
            pair.deadman.muros,
            fixedOrDash(pair.espaciadoLong_m, 2),
            fixedOrDash(pair.espaciadoTrans_m, 2),
            fixedOrDash(pair.x_inserto, 2),
        ];
        return new docx_1.TableRow({
            children: cells.map((text, j) => shadedCell(text, bg, {
                fontSize: 16,
                alignment: j === 2 ? docx_1.AlignmentType.LEFT : docx_1.AlignmentType.CENTER,
            })),
        });
    });
    children.push(new docx_1.Table({
        width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
    }));
    // Note
    children.push(new docx_1.Paragraph({
        spacing: { before: 200, after: 40 },
        children: [
            new docx_1.TextRun({ text: 'Nota:', bold: true, underline: {}, size: 18, font: 'Calibri', color: '333333' }),
        ],
    }), new docx_1.Paragraph({
        spacing: { after: 100 },
        children: [
            new docx_1.TextRun({
                text: 'Revisar que la distancia X (distancia horizontal) que va desde la cara del muro al punto de apuntalamiento del brace (centro del muerto) coincida con los shop tickets de la ingeniería de izaje.',
                size: 16, font: 'Calibri', color: '555555',
            }),
        ],
    }));
    return children;
}
function buildMuertosSection(tablaMuertos) {
    const children = [];
    children.push(new docx_1.Paragraph({
        spacing: { before: 100, after: 50 },
        children: [
            new docx_1.TextRun({ text: 'RESUMEN POR MUERTOS', bold: true, size: 36, font: 'Calibri', color: AZUL }),
        ],
    }), new docx_1.Paragraph({
        spacing: { after: 200 },
        children: [
            new docx_1.TextRun({ text: 'Agrupación de muros por características similares', size: 22, font: 'Calibri' }),
        ],
    }));
    const headers = ['#', 'Muerto', 'X Braces', 'Ángulo', 'Eje', 'Tipo Construcción', 'Cant. Muros'];
    const headerRow = new docx_1.TableRow({
        tableHeader: true,
        children: headers.map(h => headerCell(h)),
    });
    const dataRows = tablaMuertos.map((m, i) => {
        const values = [m.numero, m.muerto, m.x_braces, m.angulo, m.eje, m.tipo_construccion, m.cantidad_muros];
        const bg = i % 2 === 0 ? BLANCO : 'F8F9FA';
        return new docx_1.TableRow({
            children: values.map(v => shadedCell(v || '\u2014', bg)),
        });
    });
    children.push(new docx_1.Table({
        width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
    }));
    // Muros incluidos for each group
    tablaMuertos.forEach(m => {
        if (m.muros_incluidos) {
            children.push(new docx_1.Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                    new docx_1.TextRun({ text: `Muros (${m.muerto}): ${m.muros_incluidos}`, size: 16, font: 'Calibri', color: '666666' }),
                ],
            }));
        }
    });
    // Totals
    children.push(new docx_1.Paragraph({
        spacing: { before: 200 },
        children: [
            new docx_1.TextRun({ text: `Total de grupos de muertos: ${tablaMuertos.length}`, size: 20, font: 'Calibri', color: '666666' }),
        ],
    }));
    const totalMuros = tablaMuertos.reduce((sum, m) => sum + parseInt(m.cantidad_muros || '0'), 0);
    children.push(new docx_1.Paragraph({
        children: [
            new docx_1.TextRun({ text: `Total de muros: ${totalMuros}`, size: 20, font: 'Calibri', color: '666666' }),
        ],
    }));
    return children;
}
function buildArmadoSection(filas, totals) {
    const children = [];
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.LEFT,
        spacing: { before: 100, after: 50 },
        children: [
            new docx_1.TextRun({ text: 'Tabla de Armado por Muerto', bold: true, size: 32, font: 'Calibri', color: AZUL }),
        ],
    }), new docx_1.Paragraph({
        border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 2, color: AZUL, space: 1 } },
        spacing: { after: 200 },
        children: [],
    }));
    if (!filas || filas.length === 0) {
        children.push(new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [
                new docx_1.TextRun({ text: 'No existen datos disponibles para esta sección.', size: 22, font: 'Calibri', color: '666666' }),
            ],
        }));
        return children;
    }
    // Group header row
    const groupHeaderRow = new docx_1.TableRow({
        tableHeader: true,
        children: [
            headerCell('DEADMAN', { columnSpan: 6 }),
            headerCell('ACERO', { columnSpan: 4 }),
            headerCell('CONCRETO', { columnSpan: 2 }),
            headerCell('ALAMBRE', { columnSpan: 2 }),
        ],
    });
    // Sub-header row
    const subHeaders = ['#', 'EJE', 'MUROS', 'LARGO (m)', 'ALTO (m)', 'ANCHO (m)', '#', 'LONGITUD (m)', 'PESO (kg)', 'DIRECCIÓN', 'VOL (m³)', 'PESO (ton)', 'LONGITUD (m)', 'PESO (kg)'];
    const subHeaderRow = new docx_1.TableRow({
        tableHeader: true,
        children: subHeaders.map(h => {
            return new docx_1.TableCell({
                shading: { type: docx_1.ShadingType.CLEAR, fill: 'F6F9FC' },
                verticalAlign: docx_1.VerticalAlign.CENTER,
                borders: {
                    top: { style: docx_1.BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                    bottom: { style: docx_1.BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                    left: { style: docx_1.BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                    right: { style: docx_1.BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                },
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: { before: 20, after: 20 },
                        children: [new docx_1.TextRun({ text: h, bold: true, size: 14, font: 'Calibri' })],
                    }),
                ],
            });
        }),
    });
    // Data rows
    const dataRows = filas.map((r, idx) => {
        const bg = idx % 2 === 0 ? BLANCO : 'F8F9FA';
        const cells = [
            String(r.deadman.index),
            r.deadman.eje,
            r.deadman.muros,
            fixedOrDash(r.deadman.largo_m, 2),
            fixedOrDash(r.deadman.alto_m, 2),
            fixedOrDash(r.deadman.ancho_m, 2),
            String(r.acero.cantidad ?? '\u2014'),
            fixedOrDash(r.acero.longitud_m, 2),
            fixedOrDash(r.acero.peso_kg, 2),
            r.acero.direccion || '\u2014',
            fixedOrDash(r.concreto.vol_m3, 2),
            fixedOrDash(r.concreto.peso_ton, 2),
            fixedOrDash(r.alambre.longitud_m, 2),
            fixedOrDash(r.alambre.peso_kg, 2),
        ];
        return new docx_1.TableRow({
            children: cells.map(text => shadedCell(text, bg, { fontSize: 16 })),
        });
    });
    children.push(new docx_1.Table({
        width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
        rows: [groupHeaderRow, subHeaderRow, ...dataRows],
    }));
    // Totals panel
    children.push(new docx_1.Paragraph({ spacing: { before: 200, after: 100 }, children: [] }));
    const totalsTable = new docx_1.Table({
        width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
        rows: [
            new docx_1.TableRow({
                children: [
                    shadedCell('CONCRETO TOTAL', '00B5E2', { bold: true, fontSize: 18 }),
                    shadedCell('ACERO TOTAL', '00B5E2', { bold: true, fontSize: 18 }),
                    shadedCell('ALAMBRE TOTAL', '00B5E2', { bold: true, fontSize: 18 }),
                    shadedCell('METAL TOTAL', '00B5E2', { bold: true, fontSize: 18 }),
                ],
            }),
            new docx_1.TableRow({
                children: [
                    dataCell(`${fmt(totals.concreto.m3, 2)} m\u00B3 / ${fmt(totals.concreto.ton, 2)} ton`),
                    dataCell(`${fmt(totals.acero.kg, 0)} kg / ${fmt(totals.acero.ton, 2)} ton`),
                    dataCell(`${fmt(totals.alambre.kg, 0)} kg / ${fmt(totals.alambre.ton, 2)} ton`),
                    dataCell(`${fmt(totals.metal.kg, 0)} kg / ${fmt(totals.metal.ton, 2)} ton`),
                ],
            }),
        ],
    });
    children.push(totalsTable);
    return children;
}
function buildMethodologySection(projectInfo, user) {
    const children = [];
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [
            new docx_1.TextRun({ text: 'METODOLOGÍA Y PARÁMETROS', bold: true, size: 36, font: 'Calibri', color: AZUL }),
        ],
    }), new docx_1.Paragraph({
        border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 2, color: AZUL, space: 1 } },
        spacing: { after: 200 },
        children: [],
    }));
    children.push(new docx_1.Paragraph({
        spacing: { after: 100 },
        children: [
            new docx_1.TextRun({ text: 'DESCRIPCIÓN DEL CÁLCULO:', bold: true, underline: {}, size: 24, font: 'Calibri', color: '333333' }),
        ],
    }), new docx_1.Paragraph({
        spacing: { after: 100 },
        children: [
            new docx_1.TextRun({
                text: 'El cálculo del muerto está en base a la fuerza axial que actúa en el brace producto de la acción de la fuerza del viento sobre el muro.',
                size: 20, font: 'Calibri',
            }),
        ],
    }), new docx_1.Paragraph({
        spacing: { after: 200 },
        children: [
            new docx_1.TextRun({
                text: 'La fuerza de viento actuante en cada muro fue determinada haciendo uso de las "Normas y especificaciones para estudios, proyectos, construcciones e instalaciones del 2015 Volumen 4-México", y tomando en cuenta los siguientes parámetros:',
                size: 20, font: 'Calibri',
            }),
        ],
    }));
    children.push(new docx_1.Paragraph({
        spacing: { after: 100 },
        children: [
            new docx_1.TextRun({ text: 'PARÁMETROS UTILIZADOS:', bold: true, underline: {}, size: 24, font: 'Calibri', color: '333333' }),
        ],
    }));
    if (projectInfo?.vel_viento !== undefined) {
        children.push(new docx_1.Paragraph({
            spacing: { after: 40 },
            children: [new docx_1.TextRun({ text: `a) Velocidad del viento: ${projectInfo.vel_viento} km/h`, size: 22, font: 'Calibri' })],
        }));
    }
    if (projectInfo?.temp_promedio !== undefined) {
        children.push(new docx_1.Paragraph({
            spacing: { after: 40 },
            children: [new docx_1.TextRun({ text: `b) Temperatura promedio: ${projectInfo.temp_promedio}°C`, size: 22, font: 'Calibri' })],
        }));
    }
    if (projectInfo?.presion_atmo !== undefined) {
        children.push(new docx_1.Paragraph({
            spacing: { after: 40 },
            children: [new docx_1.TextRun({ text: `c) Presión atmosférica: ${projectInfo.presion_atmo} mmHg`, size: 22, font: 'Calibri' })],
        }));
    }
    if (projectInfo?.creadorProyecto) {
        children.push(new docx_1.Paragraph({
            spacing: { before: 200, after: 50 },
            children: [
                new docx_1.TextRun({ text: 'ELABORADO POR:', bold: true, underline: {}, size: 24, font: 'Calibri', color: '333333' }),
            ],
        }), new docx_1.Paragraph({
            children: [
                new docx_1.TextRun({ text: projectInfo.creadorProyecto, size: 22, font: 'Calibri' }),
            ],
        }));
    }
    // Signature
    if (user) {
        const displayName = (user.name && user.name.trim()) ? user.name : (user.email ?? '');
        children.push(new docx_1.Paragraph({ spacing: { before: 600 }, children: [] }), new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            border: { bottom: { style: docx_1.BorderStyle.SINGLE, size: 1, color: NEGRO, space: 1 } },
            spacing: { after: 40 },
            children: [],
        }), new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            children: [new docx_1.TextRun({ text: displayName, size: 20, font: 'Calibri' })],
        }), new docx_1.Paragraph({
            alignment: docx_1.AlignmentType.CENTER,
            children: [new docx_1.TextRun({ text: user.email || '', size: 18, font: 'Calibri', color: '444444' })],
        }));
    }
    // Footer
    children.push(new docx_1.Paragraph({
        alignment: docx_1.AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
            new docx_1.TextRun({ text: 'Generado por PUNTALINK - Sistema de análisis y cálculo estructural', size: 16, font: 'Calibri', color: '666666' }),
        ],
    }));
    return children;
}
// === Disclaimer text (same as PDF) ===
const DISCLAIMER_TEXT = 'We disclaim any liability for any loss or damage, including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from the use of this document. It is your responsibility to verify and independently assess the information provided and to ensure its suitability for your intended purpose. Nuestra empresa no se hace responsable por pérdidas o daños, incluyendo, sin limitación, pérdidas o daños indirectos o consecuentes, o cualquier pérdida o daño que surja de la utilización de este documento. Es su responsabilidad verificar y evaluar de forma independiente la información proporcionada y garantizar su idoneidad para su propósito previsto.';
// === Main export ===
async function generarInformeDocx(data) {
    console.log('[docxService] Iniciando generación DOCX...');
    // Build watermark header
    let defaultHeader;
    const watermarkBuffer = safeReadFile('marca_de_agua.png');
    if (watermarkBuffer) {
        defaultHeader = new docx_1.Header({
            children: [
                new docx_1.Paragraph({
                    alignment: docx_1.AlignmentType.CENTER,
                    children: [
                        new docx_1.ImageRun({
                            data: watermarkBuffer,
                            transformation: { width: 595, height: 842 },
                            floating: {
                                horizontalPosition: { offset: 0 },
                                verticalPosition: { offset: 0 },
                                behindDocument: true,
                            },
                        }),
                    ],
                }),
            ],
        });
    }
    // Build disclaimer footer
    const defaultFooter = new docx_1.Footer({
        children: [
            new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.JUSTIFIED,
                spacing: { before: 40 },
                children: [
                    new docx_1.TextRun({ text: DISCLAIMER_TEXT, size: 10, font: 'Calibri', color: '888888' }),
                ],
            }),
            new docx_1.Paragraph({
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 40 },
                children: [
                    new docx_1.TextRun({ text: 'www.puntalink.com', size: 14, font: 'Calibri', color: '888888' }),
                ],
            }),
        ],
    });
    const sectionBase = {
        headers: defaultHeader ? { default: defaultHeader } : undefined,
        footers: { default: defaultFooter },
    };
    // Cover page
    const coverChildren = buildCoverSection(data);
    // Image page (if provided)
    const imageChildren = data.reportImage ? buildImageSection(data.reportImage) : [];
    // Project info page
    const projectInfoChildren = buildProjectInfoSection(data);
    // Calculations page
    const calcChildren = buildCalculationsSection(data);
    // Armado page (two-row pairs)
    const armadoChildren = buildArmadoSection(data.filasArmado, data.totals);
    // Spacing table
    const spacingChildren = (data.filasArmadoPairs && data.filasArmadoPairs.length > 0)
        ? buildSpacingSection(data.filasArmadoPairs)
        : [];
    // Schema page
    const schemaChildren = buildSchemaSection();
    // Muertos page
    const muertosChildren = (data.tablaMuertos && data.tablaMuertos.length > 0)
        ? buildMuertosSection(data.tablaMuertos)
        : [];
    // Methodology page
    const methodChildren = buildMethodologySection(data.projectInfo, data.user);
    const sections = [
        {
            ...sectionBase,
            children: coverChildren,
        },
    ];
    // Image page (if provided)
    if (imageChildren.length > 0) {
        sections.push({
            ...sectionBase,
            children: imageChildren,
        });
    }
    sections.push({
        ...sectionBase,
        children: projectInfoChildren,
    });
    sections.push({
        ...sectionBase,
        children: calcChildren,
    });
    // Armado table
    if (data.filasArmado && data.filasArmado.length > 0) {
        sections.push({
            ...sectionBase,
            children: armadoChildren,
        });
    }
    // Spacing table
    if (spacingChildren.length > 0) {
        sections.push({
            ...sectionBase,
            children: spacingChildren,
        });
    }
    sections.push({
        ...sectionBase,
        children: schemaChildren,
    });
    if (muertosChildren.length > 0) {
        sections.push({
            ...sectionBase,
            children: muertosChildren,
        });
    }
    sections.push({
        ...sectionBase,
        children: methodChildren,
    });
    const doc = new docx_1.Document({
        sections,
    });
    const buffer = await docx_1.Packer.toBuffer(doc);
    console.log('[docxService] Buffer DOCX finalizado, tamaño:', buffer.length, 'bytes');
    return Buffer.from(buffer);
}
