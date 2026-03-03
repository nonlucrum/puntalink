import { Request, Response } from 'express';
import { generarInformePDF, generarInformeDOCX, ReportProjectInfo } from '../services/reportService';
import { getProjectById } from '../models/Project';

export async function generarInforme(req: Request, res: Response) {
  try {
    const { formato, projectId, userId } = req.body;
    const imageFile = req.file; // multer single('imagen')

    console.log(`[reportController] Generando informe formato=${formato}, projectId=${projectId}`);

    if (!formato || !['pdf', 'docx'].includes(formato)) {
      return res.status(400).json({ ok: false, error: 'Formato inválido. Use "pdf" o "docx".' });
    }

    // Build project info
    let projectInfo: ReportProjectInfo = {};

    if (projectId && userId) {
      try {
        const project = await getProjectById(projectId, userId);
        if (project) {
          projectInfo = {
            nombre: project.nombre,
            empresa: project.empresa,
            ubicacion: project.ubicacion,
            tipo_muerto: project.tipo_muerto,
            vel_viento: project.vel_viento,
            temp_promedio: project.temp_promedio,
            presion_atmo: project.presion_atmo,
          };
        }
      } catch (err) {
        console.warn('[reportController] Error obteniendo proyecto:', err);
      }
    }

    // Also merge any info sent in body
    if (req.body.projectInfo) {
      try {
        const bodyInfo = typeof req.body.projectInfo === 'string'
          ? JSON.parse(req.body.projectInfo)
          : req.body.projectInfo;
        projectInfo = { ...projectInfo, ...bodyInfo };
      } catch (e) {
        console.warn('[reportController] Error parsing projectInfo del body:', e);
      }
    }

    const coverImageBuffer = imageFile ? imageFile.buffer : undefined;

    if (formato === 'docx') {
      const docxBuffer = await generarInformeDOCX(projectInfo, coverImageBuffer);
      const filename = `informe_${(projectInfo.nombre || 'proyecto').replace(/\s+/g, '_')}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', docxBuffer.length);
      return res.send(docxBuffer);
    }

    // PDF
    const pdfBuffer = await generarInformePDF(projectInfo, coverImageBuffer);
    const filename = `informe_${(projectInfo.nombre || 'proyecto').replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);

  } catch (err: any) {
    console.error('[reportController] Error crítico:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
