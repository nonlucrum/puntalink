"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearActualizarGrupos = crearActualizarGrupos;
exports.obtenerGrupos = obtenerGrupos;
exports.actualizarProfundidad = actualizarProfundidad;
exports.actualizarDimensiones = actualizarDimensiones;
exports.eliminarGrupos = eliminarGrupos;
const grupoMuertoService_1 = require("../services/grupoMuertoService");
/**
 * POST /api/grupos-muertos/:pk_proyecto
 * Crear o actualizar grupos de muertos con configuración
 */
async function crearActualizarGrupos(req, res) {
    try {
        const pk_proyecto = parseInt(req.params.pk_proyecto);
        const gruposConfig = req.body;
        console.log('[GRUPO_MUERTO_CTRL] POST /api/grupos-muertos/', pk_proyecto);
        console.log('[GRUPO_MUERTO_CTRL] Config recibida:', gruposConfig);
        if (!pk_proyecto || isNaN(pk_proyecto)) {
            return res.status(400).json({
                success: false,
                error: 'pk_proyecto inválido',
            });
        }
        if (!gruposConfig || typeof gruposConfig !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Configuración de grupos inválida',
            });
        }
        const resultado = await (0, grupoMuertoService_1.crearActualizarGruposMuertos)(pk_proyecto, gruposConfig);
        if (resultado.success) {
            return res.status(200).json({
                success: true,
                mensaje: `${resultado.grupos.length} grupos creados/actualizados`,
                grupos: resultado.grupos,
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: resultado.error,
            });
        }
    }
    catch (error) {
        console.error('[GRUPO_MUERTO_CTRL] Error en crearActualizarGrupos:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}
/**
 * GET /api/grupos-muertos/:pk_proyecto
 * Obtener todos los grupos de muertos de un proyecto
 */
async function obtenerGrupos(req, res) {
    try {
        const pk_proyecto = parseInt(req.params.pk_proyecto);
        console.log('[GRUPO_MUERTO_CTRL] GET /api/grupos-muertos/', pk_proyecto);
        if (!pk_proyecto || isNaN(pk_proyecto)) {
            return res.status(400).json({
                success: false,
                error: 'pk_proyecto inválido',
            });
        }
        const resultado = await (0, grupoMuertoService_1.obtenerGruposMuertosProyecto)(pk_proyecto);
        if (resultado.success) {
            return res.status(200).json({
                success: true,
                grupos: resultado.grupos,
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: resultado.error,
            });
        }
    }
    catch (error) {
        console.error('[GRUPO_MUERTO_CTRL] Error en obtenerGrupos:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}
/**
 * PUT /api/grupos-muertos/:pid/profundidad
 * Actualizar solo la profundidad de un grupo
 */
async function actualizarProfundidad(req, res) {
    try {
        const pid = parseInt(req.params.pid);
        // Extraemos los nuevos campos del body
        const { profundidad, ancho_calculado, volumen_concreto, peso_acero } = req.body;
        console.log('[GRUPO_MUERTO_CTRL] PUT /api/grupos-muertos/', pid, '/profundidad');
        console.log('[GRUPO_MUERTO_CTRL] Datos recibidos:', {
            profundidad, ancho_calculado, volumen_concreto, peso_acero
        });
        if (!pid || isNaN(pid)) {
            return res.status(400).json({
                success: false,
                error: 'pid inválido',
            });
        }
        if (profundidad === undefined || isNaN(profundidad)) {
            return res.status(400).json({
                success: false,
                error: 'Profundidad inválida',
            });
        }
        // Llamamos al servicio pasando los parámetros opcionales
        const resultado = await (0, grupoMuertoService_1.actualizarProfundidadGrupo)(pid, profundidad, ancho_calculado, volumen_concreto, peso_acero);
        if (resultado.success) {
            return res.status(200).json({
                success: true,
                mensaje: 'Profundidad y datos calculados actualizados',
                grupo: resultado.grupo // Es útil devolver el grupo actualizado
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: resultado.error,
            });
        }
    }
    catch (error) {
        console.error('[GRUPO_MUERTO_CTRL] Error en actualizarProfundidad:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}
/**
 * PUT /api/grupos-muertos/:pid/dimensiones
 * Actualizar dimensiones completas de un grupo
 */
async function actualizarDimensiones(req, res) {
    try {
        const pid = parseInt(req.params.pid);
        const { profundidad, largo, ancho } = req.body;
        console.log('[GRUPO_MUERTO_CTRL] PUT /api/grupos-muertos/', pid, '/dimensiones');
        console.log('[GRUPO_MUERTO_CTRL] Dimensiones:', { profundidad, largo, ancho });
        if (!pid || isNaN(pid)) {
            return res.status(400).json({
                success: false,
                error: 'pid inválido',
            });
        }
        const resultado = await (0, grupoMuertoService_1.actualizarDimensionesGrupo)(pid, largo, ancho);
        if (resultado.success) {
            return res.status(200).json({
                success: true,
                mensaje: 'Dimensiones actualizadas',
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: resultado.error,
            });
        }
    }
    catch (error) {
        console.error('[GRUPO_MUERTO_CTRL] Error en actualizarDimensiones:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}
/**
 * DELETE /api/grupos-muertos/:pk_proyecto
 * Eliminar todos los grupos de un proyecto
 */
async function eliminarGrupos(req, res) {
    try {
        const pk_proyecto = parseInt(req.params.pk_proyecto);
        console.log('[GRUPO_MUERTO_CTRL] DELETE /api/grupos-muertos/', pk_proyecto);
        if (!pk_proyecto || isNaN(pk_proyecto)) {
            return res.status(400).json({
                success: false,
                error: 'pk_proyecto inválido',
            });
        }
        const resultado = await (0, grupoMuertoService_1.eliminarGruposProyecto)(pk_proyecto);
        if (resultado.success) {
            return res.status(200).json({
                success: true,
                mensaje: 'Grupos eliminados',
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: resultado.error,
            });
        }
    }
    catch (error) {
        console.error('[GRUPO_MUERTO_CTRL] Error en eliminarGrupos:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}
