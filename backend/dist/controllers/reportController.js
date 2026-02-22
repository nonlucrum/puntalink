"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const reportValidator_1 = require("../validators/reportValidator");
const reportDataBuilder_1 = require("../services/reportDataBuilder");
const pdfService_1 = require("../services/pdfService");
const docxService_1 = require("../services/docxService");
class ReportController {
}
exports.ReportController = ReportController;
_a = ReportController;
ReportController.generarInforme = async (req, res) => {
    try {
        // Parse input: multipart (with image) or JSON
        let rawData;
        let imageBuffer;
        if (req.is('multipart/form-data')) {
            const dataField = req.body?.data;
            if (!dataField) {
                return res.status(400).json({ ok: false, error: 'Falta el campo "data" en la solicitud multipart.' });
            }
            try {
                rawData = JSON.parse(dataField);
            }
            catch {
                return res.status(400).json({ ok: false, error: 'El campo "data" no es JSON válido.' });
            }
            const file = req.file;
            if (file?.buffer) {
                imageBuffer = file.buffer;
            }
            // format may come as separate field or inside data
            if (req.body?.format && !rawData.format) {
                rawData.format = req.body.format;
            }
        }
        else {
            rawData = req.body;
        }
        // Validate with Zod
        const parsed = reportValidator_1.GenerarInformeSchema.safeParse(rawData);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => {
                const path = issue.path.join('.');
                return path ? `${path}: ${issue.message}` : issue.message;
            });
            return res.status(400).json({ ok: false, errors: messages });
        }
        const { format, paneles, projectInfo, tablaMuertos, reporteMacizos, configArmado } = parsed.data;
        // Build ReportData
        const reportData = (0, reportDataBuilder_1.buildReportData)({
            paneles: paneles,
            projectInfo: projectInfo,
            tablaMuertos: tablaMuertos,
            reporteMacizos: reporteMacizos,
            reportImage: imageBuffer,
        });
        // Log completeness warnings (non-blocking)
        const validation = (0, reportDataBuilder_1.validateReportCompleteness)(reportData);
        if (!validation.valid) {
            console.warn('[reportController] Datos parciales:', validation.errors.join(', '));
        }
        // Generate document
        let buffer;
        let contentType;
        let filename;
        if (format === 'docx') {
            console.log('[reportController] Generando DOCX...');
            buffer = await (0, docxService_1.generarInformeDocx)(reportData);
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            filename = 'informe_proyecto.docx';
        }
        else {
            console.log('[reportController] Generando PDF...');
            buffer = await (0, pdfService_1.generarInformePaneles)(reportData.paneles, reportData.projectInfo, reportData.tablaMuertos, reportData.filasArmado, reportData.user, undefined, // reporteMacizos already processed into filasArmado
            reportData.reportImage);
            contentType = 'application/pdf';
            filename = 'informe_proyecto.pdf';
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    }
    catch (error) {
        console.error('[reportController] Error generando informe:', error);
        return res.status(500).json({ ok: false, error: 'Error interno al generar el informe.' });
    }
};
