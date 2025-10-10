"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importarMuros = importarMuros;
exports.cancelarImport = cancelarImport;
exports.getMuros = getMuros;
const importService_1 = require("../services/importService");
// CÓDIGO BASURA - Import comentado porque la función removeTXT está comentada
// import { removeTXT } from '../services/importService';
const Muro_1 = require("../models/Muro");
async function importarMuros(req, res) {
    console.log('[controller - importController] importarMuros - Inicio');
    console.log('[controller - importController] Archivo recibido:', req.file ? req.file.originalname : 'No file');
    try {
        if (!req.file) {
            console.log('[controller - importController] Error: No se recibió archivo');
            return res.status(400).json({ ok: false, error: 'No se recibió archivo.' });
        }
        console.log('[controller - importController] Procesando archivo con parseTxtRobusto');
        const txt = req.file.buffer.toString('utf-8');
        const paneles = await (0, importService_1.parseTxtRobusto)(txt);
        console.log('[controller - importController] Paneles procesados:', paneles.length);
        console.log('[controller - importController] Respuesta exitosa enviada');
        return res.json({ ok: true, paneles, message: "Archivo procesado sin errores." });
    }
    catch (err) {
        console.log('[controller - importController] Error en importarMuros:', err.message);
        return res.status(400).json({ ok: false, error: err.message });
    }
}
async function cancelarImport(req, res) {
    console.log('[controller - importController] cancelarImport - Inicio');
    try {
        // CÓDIGO BASURA - Función removeTXT comentada, conservar para futuro
        // console.log('[controller - importController] Ejecutando removeTXT');
        // const removed = removeTXT();
        // console.log('[controller - importController] removeTXT completado:', removed);
        console.log('[controller - importController] Respuesta de cancelación enviada');
        return res.json({ ok: true, message: "Importación cancelada." });
    }
    catch (err) {
        console.log('[controller - importController] Error en cancelarImport:', err.message);
        return res.status(400).json({ ok: false, error: "no se pudo :(" });
    }
}
async function getMuros(req, res) {
    console.log('[controller - importController] getMuros - Inicio');
    try {
        const pk_proyecto = parseInt(req.query.pk_proyecto) || 1; // Default project ID
        console.log('[controller - importController] Obteniendo muros para proyecto:', pk_proyecto);
        const muros = await (0, Muro_1.getMurosByProject)(pk_proyecto);
        console.log('[controller - importController] Muros encontrados:', muros.length);
        return res.json({ ok: true, muros });
    }
    catch (err) {
        console.log('[controller - importController] Error en getMuros:', err.message);
        return res.status(500).json({ ok: false, error: err.message });
    }
}
