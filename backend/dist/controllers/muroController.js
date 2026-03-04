"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addManualMuroHandler = addManualMuroHandler;
exports.updateManualMuroHandler = updateManualMuroHandler;
exports.deleteManualMuroHandler = deleteManualMuroHandler;
exports.reorderMurosHandler = reorderMurosHandler;
exports.getMurosHandler = getMurosHandler;
const Muro_1 = require("../models/Muro");
const muroService_1 = require("../services/muroService");
const muroValidator_1 = require("../validators/muroValidator");
/**
 * POST /api/muros/manual — Agregar un muro manual
 */
async function addManualMuroHandler(req, res) {
    try {
        const parsed = muroValidator_1.AddManualMuroSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: 'Datos inválidos',
                details: parsed.error.issues.map(i => ({
                    campo: i.path.join('.'),
                    mensaje: i.message
                }))
            });
        }
        const { pk_proyecto, muro: muroData, position } = parsed.data;
        const muro = await (0, muroService_1.addManualMuro)(pk_proyecto, muroData, position || { position: 'end' });
        return res.status(201).json({ ok: true, muro });
    }
    catch (error) {
        console.error('Error agregando muro manual:', error);
        return res.status(500).json({ ok: false, error: error.message || 'Error interno del servidor' });
    }
}
/**
 * PUT /api/muros/manual/:pid — Editar un muro manual
 */
async function updateManualMuroHandler(req, res) {
    try {
        const pid = parseInt(req.params.pid);
        if (isNaN(pid)) {
            return res.status(400).json({ ok: false, error: 'PID inválido' });
        }
        const parsed = muroValidator_1.UpdateManualMuroSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: 'Datos inválidos',
                details: parsed.error.issues.map(i => ({
                    campo: i.path.join('.'),
                    mensaje: i.message
                }))
            });
        }
        const { pk_proyecto, muro: muroData } = parsed.data;
        const muro = await (0, muroService_1.updateManualMuro)(pid, pk_proyecto, muroData);
        if (!muro) {
            return res.status(404).json({ ok: false, error: 'Muro no encontrado o no es manual' });
        }
        return res.json({ ok: true, muro });
    }
    catch (error) {
        console.error('Error actualizando muro manual:', error);
        const status = error.message?.includes('Solo se pueden editar') ? 403 : 500;
        return res.status(status).json({ ok: false, error: error.message || 'Error interno del servidor' });
    }
}
/**
 * DELETE /api/muros/manual/:pid — Eliminar un muro
 */
async function deleteManualMuroHandler(req, res) {
    try {
        const pid = parseInt(req.params.pid);
        if (isNaN(pid)) {
            return res.status(400).json({ ok: false, error: 'PID inválido' });
        }
        const parsed = muroValidator_1.DeleteMuroSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: 'Datos inválidos',
                details: parsed.error.issues.map(i => ({
                    campo: i.path.join('.'),
                    mensaje: i.message
                }))
            });
        }
        const { pk_proyecto } = parsed.data;
        await (0, muroService_1.deleteManualMuro)(pid, pk_proyecto);
        return res.json({ ok: true, message: 'Muro eliminado correctamente' });
    }
    catch (error) {
        console.error('Error eliminando muro:', error);
        return res.status(500).json({ ok: false, error: error.message || 'Error interno del servidor' });
    }
}
/**
 * PUT /api/muros/reorder — Reordenar muros de un proyecto
 */
async function reorderMurosHandler(req, res) {
    try {
        const parsed = muroValidator_1.ReorderMurosSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: 'Datos inválidos',
                details: parsed.error.issues.map(i => ({
                    campo: i.path.join('.'),
                    mensaje: i.message
                }))
            });
        }
        const { pk_proyecto, ordering } = parsed.data;
        await (0, muroService_1.reorderProjectMuros)(pk_proyecto, ordering);
        // Retornar la lista actualizada
        const muros = await (0, Muro_1.getMurosByProject)(pk_proyecto);
        return res.json({ ok: true, muros });
    }
    catch (error) {
        console.error('Error reordenando muros:', error);
        return res.status(500).json({ ok: false, error: error.message || 'Error interno del servidor' });
    }
}
/**
 * GET /api/muros/project/:pk_proyecto — Obtener todos los muros de un proyecto
 */
async function getMurosHandler(req, res) {
    try {
        const pk_proyecto = parseInt(req.params.pk_proyecto);
        if (isNaN(pk_proyecto)) {
            return res.status(400).json({ ok: false, error: 'pk_proyecto inválido' });
        }
        const muros = await (0, Muro_1.getMurosByProject)(pk_proyecto);
        return res.json({ ok: true, muros });
    }
    catch (error) {
        console.error('Error obteniendo muros:', error);
        return res.status(500).json({ ok: false, error: error.message || 'Error interno del servidor' });
    }
}
