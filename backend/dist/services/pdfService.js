"use strict";
/**
 * pdfService.ts
 *
 * Genera un PDF convirtiendo el DOCX generado por docxService usando LibreOffice headless.
 * Esto garantiza que el PDF sea visualmente idéntico al Word.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarInformePDF = generarInformePDF;
exports.generarInformePaneles = generarInformePaneles;
exports.generarInforme = generarInforme;
const util_1 = require("util");
const libreoffice_convert_1 = __importDefault(require("libreoffice-convert"));
const docxService_1 = require("./docxService");
const convertAsync = (0, util_1.promisify)(libreoffice_convert_1.default.convert);
/**
 * Genera un informe PDF a partir de los datos del reporte.
 * Internamente genera el DOCX y lo convierte a PDF con LibreOffice.
 */
async function generarInformePDF(reportData) {
    // 1. Generar el DOCX (fuente de verdad)
    console.log('[pdfService] Generando DOCX intermedio...');
    const docxBuffer = await (0, docxService_1.generarInformeDocx)(reportData);
    // 2. Convertir DOCX → PDF con LibreOffice
    console.log('[pdfService] Convirtiendo DOCX → PDF con LibreOffice...');
    try {
        const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);
        console.log('[pdfService] PDF generado exitosamente (%d bytes)', pdfBuffer.length);
        return pdfBuffer;
    }
    catch (err) {
        console.error('[pdfService] Error al convertir DOCX a PDF:', err.message || err);
        if (err.message?.includes('soffice') || err.message?.includes('ENOENT')) {
            throw new Error('LibreOffice no está instalado o no se encontró en el PATH. ' +
                'Para desarrollo local, instala LibreOffice: https://www.libreoffice.org/download/ ' +
                'En Docker, ya está incluido en la imagen.');
        }
        throw new Error(`Error al convertir DOCX a PDF: ${err.message || 'Error desconocido'}`);
    }
}
/**
 * @deprecated Legado — mantenido para compatibilidad con panelesController.
 * Genera un PDF simple de paneles (sin usar el flujo DOCX completo).
 */
async function generarInformePaneles(_paneles, _projectInfo) {
    throw new Error('generarInformePaneles ha sido deprecado. Usa el endpoint /api/pdf/exportar con format=pdf.');
}
/**
 * @deprecated Legado — mantenido para compatibilidad con calculosController.
 */
async function generarInforme(..._args) {
    throw new Error('generarInforme ha sido deprecado. Usa generarInformePDF(reportData) en su lugar.');
}
