import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import {
  calcularPaneles,
  PanelEntrada,
  PanelCalculado
} from "../services/panelesService";
import * as pdfService from "../services/pdfService";

export class PanelesController {
  static calcular = (req: Request, res: Response) => {
    console.log('[controller - panelesController] calcular - Inicio');
    console.log('[controller - panelesController] Body recibido:', JSON.stringify(req.body, null, 2));
    const rows = (req.body?.rows ?? []) as PanelEntrada[];
    console.log('[controller - panelesController] Filas procesadas:', rows.length);
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('[controller - panelesController] Error: rows vacío o inválido');
      return res.status(400).json({ ok: false, error: "rows vacío o inválido" });
    }
    try {
      console.log('[controller - panelesController] Llamando a calcularPaneles service');
      const data = calcularPaneles(rows);
      console.log('[controller - panelesController] Paneles calculados:', data.length);
      console.log('[controller - panelesController] Respuesta exitosa enviada');
      return res.json({ ok: true, data });
    } catch (err) {
      console.error('[controller - panelesController] Error en cálculo:', err);
      return res.status(500).json({ ok: false, error: "Error calculando paneles" });
    }
  };

  static pdf = async (req: Request, res: Response) => {
    console.log('[controller - panelesController] pdf - Inicio');
    console.log('[controller - panelesController] Body recibido para PDF:', JSON.stringify(req.body, null, 2));
    
    const paneles = (req.body?.paneles ?? []) as PanelCalculado[];
    console.log('[controller - panelesController] Paneles para PDF:', paneles.length);
    
    if (!Array.isArray(paneles) || paneles.length === 0) {
      console.log('[controller - panelesController] Error: paneles vacío o inválido');
      return res.status(400).json({ ok: false, error: "paneles vacío o inválido" });
    }

    try {
      console.log('[controller - panelesController] Llamando al servicio PDF');
      const pdfBuffer = await pdfService.generarInformePaneles(paneles);
      
      console.log('[controller - panelesController] PDF generado, configurando headers');
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="informe_paneles.pdf"');
      res.setHeader("Content-Length", pdfBuffer.length);
      
      console.log('[controller - panelesController] Enviando PDF al cliente');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('[controller - panelesController] Error generando PDF:', error);
      return res.status(500).json({ ok: false, error: "Error generando el informe PDF" });
    }
  };
}