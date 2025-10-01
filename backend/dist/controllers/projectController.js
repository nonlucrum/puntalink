"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearProyecto = crearProyecto;
exports.actualizarProyecto = actualizarProyecto;
const projectService_1 = require("../services/projectService");
const projectService_2 = require("../services/projectService");
async function crearProyecto(req, res) {
    console.log('[controller - projectController] crearProyecto - Inicio');
    try {
        const new_project = await (0, projectService_1.crearProyectoService)(req);
        console.log('[controller - projectController] crearProyecto - Proyecto creado:');
        res.json({ ok: true, new_project });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] crearProyecto - Fin');
}
async function actualizarProyecto(req, res) {
    console.log('[controller - projectController] actualizarProyecto - Inicio');
    try {
        const newest_project = await (0, projectService_2.actualizarProyectoService)(req);
        console.log('[controller - projectController] actualizarProyecto - Proyecto actualizado:');
        res.json({ ok: true, newest_project });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] actualizarProyecto - Fin');
}
