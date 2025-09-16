import { Router } from "express";
import PDFDocument from "pdfkit";
import { calcularEstructural } from "../services/estructural.js";

const router = Router();

/** Body: { titulo?, params: CalcInput } */
router.post("/pdf", (req, res) => {
  try {
    const { titulo = "Informe PuntaLink", params } = req.body ?? {};
    const result = calcularEstructural(params); // usa tu servicio

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="informe.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(titulo, { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Fecha: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Parámetros:");
    doc.fontSize(11).text(JSON.stringify(params, null, 2));
    doc.moveDown();

    doc.fontSize(14).text("Resultados:");
    doc.fontSize(11).text(JSON.stringify(result, null, 2));

    doc.end();
  } catch (e:any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
