"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelesController = void 0;
const panelesService_1 = require("../services/panelesService");
const pdfService = __importStar(require("../services/pdfService"));
class PanelesController {
}
exports.PanelesController = PanelesController;
_a = PanelesController;
PanelesController.calcular = (req, res) => {
    console.log('[controller - panelesController] calcular - Inicio');
    console.log('[controller - panelesController] Body recibido:', JSON.stringify(req.body, null, 2));
    const rows = (req.body?.rows ?? []);
    const parametros = req.body?.parametros;
    console.log('[controller - panelesController] Filas procesadas:', rows.length);
    console.log('[controller - panelesController] Parámetros del proyecto:', parametros);
    if (!Array.isArray(rows) || rows.length === 0) {
        console.log('[controller - panelesController] Error: rows vacío o inválido');
        return res.status(400).json({ ok: false, error: "rows vacío o inválido" });
    }
    try {
        console.log('[controller - panelesController] Llamando a calcularPaneles service');
        const data = (0, panelesService_1.calcularPaneles)(rows, parametros);
        console.log('[controller - panelesController] Paneles calculados:', data.length);
        console.log('[controller - panelesController] Respuesta exitosa enviada');
        return res.json({ ok: true, data });
    }
    catch (err) {
        console.error('[controller - panelesController] Error en cálculo:', err);
        return res.status(500).json({ ok: false, error: "Error calculando paneles" });
    }
};
PanelesController.pdf = async (req, res) => {
    console.log('[controller - panelesController] pdf - Inicio');
    console.log('[controller - panelesController] Body recibido para PDF:', JSON.stringify(req.body, null, 2));
    const paneles = (req.body?.paneles ?? []);
    const projectInfo = req.body?.projectInfo ?? null;
    console.log('[controller - panelesController] Paneles para PDF:', paneles.length);
    console.log('[controller - panelesController] Información del proyecto:', projectInfo);
    if (!Array.isArray(paneles) || paneles.length === 0) {
        console.log('[controller - panelesController] Error: paneles vacío o inválido');
        return res.status(400).json({ ok: false, error: "paneles vacío o inválido" });
    }
    try {
        console.log('[controller - panelesController] Llamando al servicio PDF');
        const pdfBuffer = await pdfService.generarInformePaneles(paneles, projectInfo);
        console.log('[controller - panelesController] PDF generado, configurando headers');
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="informe_paneles.pdf"');
        res.setHeader("Content-Length", pdfBuffer.length);
        console.log('[controller - panelesController] Enviando PDF al cliente');
        res.end(pdfBuffer);
    }
    catch (error) {
        console.error('[controller - panelesController] Error generando PDF:', error);
        return res.status(500).json({ ok: false, error: "Error generando el informe PDF" });
    }
};
