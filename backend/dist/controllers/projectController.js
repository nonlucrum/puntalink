"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearProyecto = crearProyecto;
exports.actualizarProyecto = actualizarProyecto;
exports.listarProyectos = listarProyectos;
exports.cargarProyecto = cargarProyecto;
exports.guardarTXT = guardarTXT;
exports.nuevaVersion = nuevaVersion;
exports.eliminarProyecto = eliminarProyecto;
const projectService_1 = require("../services/projectService");
async function crearProyecto(req, res) {
    console.log('[controller - projectController] crearProyecto - Inicio');
    try {
        const new_project = await (0, projectService_1.crearProyectoService)(req.body);
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
        const newest_project = await (0, projectService_1.actualizarProyectoService)(req);
        console.log('[controller - projectController] actualizarProyecto - Proyecto actualizado:');
        res.json({ ok: true, newest_project });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] actualizarProyecto - Fin');
}
async function listarProyectos(req, res) {
    console.log('[controller - projectController] listarProyectos - Inicio');
    try {
        const proyectos = await (0, projectService_1.listarProyectosService)(req);
        console.log('[controller - projectController] listarProyectos - Proyectos listados:');
        res.json({ ok: true, proyectos });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] listarProyectos - Fin');
}
async function cargarProyecto(req, res) {
    console.log('[controller - projectController] cargarProyecto - Inicio');
    try {
        const proyecto = await (0, projectService_1.cargarProyectoService)(req);
        console.log('[controller - projectController] cargarProyecto - Proyecto cargado:');
        res.json({ ok: true, proyecto });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] cargarProyecto - Fin');
}
async function guardarTXT(req, res) {
    console.log('[controller - projectController] guardarTXT - Inicio');
    try {
        const pk_proyecto = parseInt(req.body.pk_proyecto);
        const txt = req.file.buffer.toString('utf-8');
        const filename = req.file.originalname;
        const filejson = {
            filename: filename,
            content: txt
        };
        const resultado = await (0, projectService_1.guardarTxtService)(pk_proyecto, filejson);
        console.log('[controller - projectController] guardarTXT - TXT guardado:');
        res.json({ ok: true, resultado });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] guardarTXT - Fin');
}
async function nuevaVersion(req, res) {
    console.log('[controller - projectController] nuevaVersion - Inicio');
    try {
        const nuevo_proyecto = await (0, projectService_1.nuevaVersionService)(req);
        console.log('[controller - projectController] nuevaVersion - Nueva versión creada:');
        res.json({ ok: true, nuevo_proyecto });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] nuevaVersion - Fin');
}
async function eliminarProyecto(req, res) {
    console.log('[controller - projectController] eliminarProyecto - Inicio');
    try {
        await (0, projectService_1.eliminarProyectoService)(req);
        console.log('[controller - projectController] eliminarProyecto - Proyecto eliminado:');
        res.json({ ok: true, message: 'Proyecto eliminado correctamente' });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] eliminarProyecto - Fin');
}
