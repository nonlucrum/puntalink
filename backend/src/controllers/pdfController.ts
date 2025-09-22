import { Request, Response } from 'express';
import { estimarPaneles } from '../services/calculosService';
import { generarInforme } from '../services/pdfService';

export async function informePaneles(req: Request, res: Response) {
  try {
    const paneles = req.body.paneles;
    if (!Array.isArray(paneles) || paneles.length === 0) {
      return res.status(400).json({ ok: false, error: "Faltan los paneles." });
    }
    const resultados = estimarPaneles(paneles);
    const informeBuffer = await generarInforme(resultados);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="informe_paneles.pdf"');
    res.send(informeBuffer);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
}