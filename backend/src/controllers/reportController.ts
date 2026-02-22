import { Request, Response } from 'express';
import { GenerarInformeSchema } from '../validators/reportValidator';
import { buildReportData, validateReportCompleteness } from '../services/reportDataBuilder';
import { generarInformePaneles } from '../services/pdfService';
import { generarInformeDocx } from '../services/docxService';

export class ReportController {
  static generarInforme = async (req: Request, res: Response) => {
    try {
      // Parse input: multipart (with image) or JSON
      let rawData: any;
      let imageBuffer: Buffer | undefined;

      if (req.is('multipart/form-data')) {
        const dataField = req.body?.data;
        if (!dataField) {
          return res.status(400).json({ ok: false, error: 'Falta el campo "data" en la solicitud multipart.' });
        }
        try {
          rawData = JSON.parse(dataField);
        } catch {
          return res.status(400).json({ ok: false, error: 'El campo "data" no es JSON válido.' });
        }
        const file = (req as any).file;
        if (file?.buffer) {
          imageBuffer = file.buffer;
        }
        // format may come as separate field or inside data
        if (req.body?.format && !rawData.format) {
          rawData.format = req.body.format;
        }
      } else {
        rawData = req.body;
      }

      // Validate with Zod
      const parsed = GenerarInformeSchema.safeParse(rawData);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((issue: any) => {
          const path = issue.path.join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        });
        return res.status(400).json({ ok: false, errors: messages });
      }

      const { format, paneles, projectInfo, tablaMuertos, reporteMacizos, configArmado } = parsed.data;

      // Build ReportData
      const reportData = buildReportData({
        paneles: paneles as any[],
        projectInfo: projectInfo as any,
        tablaMuertos: tablaMuertos as any[],
        reporteMacizos: reporteMacizos as any[],
        reportImage: imageBuffer,
      });

      // Log completeness warnings (non-blocking)
      const validation = validateReportCompleteness(reportData);
      if (!validation.valid) {
        console.warn('[reportController] Datos parciales:', validation.errors.join(', '));
      }

      // Generate document
      let buffer: Buffer;
      let contentType: string;
      let filename: string;

      if (format === 'docx') {
        console.log('[reportController] Generando DOCX...');
        buffer = await generarInformeDocx(reportData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = 'informe_proyecto.docx';
      } else {
        console.log('[reportController] Generando PDF...');
        buffer = await generarInformePaneles(
          reportData.paneles,
          reportData.projectInfo,
          reportData.tablaMuertos,
          reportData.filasArmado,
          reportData.user,
          undefined, // reporteMacizos already processed into filasArmado
          reportData.reportImage
        );
        contentType = 'application/pdf';
        filename = 'informe_proyecto.pdf';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);

    } catch (error: any) {
      console.error('[reportController] Error generando informe:', error);
      return res.status(500).json({ ok: false, error: 'Error interno al generar el informe.' });
    }
  };
}
