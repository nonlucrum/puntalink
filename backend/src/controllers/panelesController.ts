import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import {
  calcularPaneles,
  PanelEntrada,
  PanelCalculado
} from "../services/panelesService";

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

  static pdf = (req: Request, res: Response) => {
    console.log('[controller - panelesController] pdf - Inicio');
    console.log('[controller - panelesController] Body recibido para PDF:', JSON.stringify(req.body, null, 2));
    const paneles = (req.body?.paneles ?? []) as PanelCalculado[];
    console.log('[controller - panelesController] Paneles para PDF:', paneles.length);
    if (!Array.isArray(paneles) || paneles.length === 0) {
      console.log('[controller - panelesController] Error: paneles vacío o inválido');
      return res.status(400).json({ ok: false, error: "paneles vacío o inválido" });
    }

    console.log('[controller - panelesController] Configurando headers para PDF');
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="informe_paneles.pdf"');

    console.log('[controller - panelesController] Generando documento PDF');
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.fontSize(18).text("Informe de Paneles", { align: "center" }).moveDown();

    paneles.forEach((p, i) => {
      console.log(`[controller - panelesController] Agregando panel ${i + 1} al PDF: ${p.idMuro}`);
      doc.fontSize(12)
        .text(`Panel #${i + 1} (${p.idMuro})`)
        .text(`Grosor: ${p.grosor_mm} mm   Área: ${p.area_m2} m²`)
        .text(`Volumen: ${p.volumen_m3} m³`)
        .text(`Peso: ${p.peso_kN} kN   Grúa mín.: ${p.gruaMin_kN} kN`)
        .text(`Viento: ${p.viento_kN} kN  Tracción puntal: ${p.traccionPuntal_kN} kN`)
        .moveDown(0.75);
    });

    console.log('[controller - panelesController] PDF generado, enviando respuesta');
    doc.end();
    (doc as unknown as Readable).pipe(res);
  };
}