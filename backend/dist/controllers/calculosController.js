"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimacionPanel = estimacionPanel;
exports.informePaneles = informePaneles;
const calculosService_1 = require("../services/calculosService");
const pdfService_1 = require("../services/pdfService");
function estimacionPanel(req, res) {
    try {
        const paneles = req.body.paneles;
        const opciones = req.body.opciones;
        if (!Array.isArray(paneles) || paneles.length === 0) {
            return res.status(400).json({ ok: false, error: "Faltan los paneles." });
        }
        const resultados = (0, calculosService_1.estimarPaneles)(paneles, opciones);
        res.json({ ok: true, resultados });
    }
    catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
}
async function informePaneles(req, res) {
    try {
        const paneles = req.body.paneles;
        const opciones = req.body.opciones;
        if (!Array.isArray(paneles) || paneles.length === 0) {
            return res.status(400).json({ ok: false, error: "Faltan los paneles." });
        }
        const resultados = (0, calculosService_1.estimarPaneles)(paneles, opciones);
        const informeBuffer = await (0, pdfService_1.generarInforme)(resultados);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="informe_paneles.pdf"');
        res.send(informeBuffer);
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
}
