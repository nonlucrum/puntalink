import { Request, Response } from 'express';
import {
  crearActualizarGruposMuertos,
  obtenerGruposMuertosProyecto,
  actualizarProfundidadGrupo,
  actualizarDimensionesGrupo,
  eliminarGruposProyecto,
} from '../services/grupoMuertoService';

/**
 * POST /api/grupos-muertos/:pk_proyecto
 * Crear o actualizar grupos de muertos con configuración
 */
export async function crearActualizarGrupos(req: Request, res: Response) {
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

    const resultado = await crearActualizarGruposMuertos(pk_proyecto, gruposConfig);

    if (resultado.success) {
      return res.status(200).json({
        success: true,
        mensaje: `${resultado.grupos.length} grupos creados/actualizados`,
        grupos: resultado.grupos,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: resultado.error,
      });
    }
  } catch (error: any) {
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
export async function obtenerGrupos(req: Request, res: Response) {
  try {
    const pk_proyecto = parseInt(req.params.pk_proyecto);

    console.log('[GRUPO_MUERTO_CTRL] GET /api/grupos-muertos/', pk_proyecto);

    if (!pk_proyecto || isNaN(pk_proyecto)) {
      return res.status(400).json({
        success: false,
        error: 'pk_proyecto inválido',
      });
    }

    const resultado = await obtenerGruposMuertosProyecto(pk_proyecto);

    if (resultado.success) {
      return res.status(200).json({
        success: true,
        grupos: resultado.grupos,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: resultado.error,
      });
    }
  } catch (error: any) {
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
export async function actualizarProfundidad(req: Request, res: Response) {
  try {
    const pid = parseInt(req.params.pid);
    const { profundidad } = req.body;

    console.log('[GRUPO_MUERTO_CTRL] PUT /api/grupos-muertos/', pid, '/profundidad');
    console.log('[GRUPO_MUERTO_CTRL] Nueva profundidad:', profundidad);

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

    const resultado = await actualizarProfundidadGrupo(pid, profundidad);

    if (resultado.success) {
      return res.status(200).json({
        success: true,
        mensaje: 'Profundidad actualizada',
      });
    } else {
      return res.status(500).json({
        success: false,
        error: resultado.error,
      });
    }
  } catch (error: any) {
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
export async function actualizarDimensiones(req: Request, res: Response) {
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

    const resultado = await actualizarDimensionesGrupo(pid, largo, ancho);

    if (resultado.success) {
      return res.status(200).json({
        success: true,
        mensaje: 'Dimensiones actualizadas',
      });
    } else {
      return res.status(500).json({
        success: false,
        error: resultado.error,
      });
    }
  } catch (error: any) {
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
export async function eliminarGrupos(req: Request, res: Response) {
  try {
    const pk_proyecto = parseInt(req.params.pk_proyecto);

    console.log('[GRUPO_MUERTO_CTRL] DELETE /api/grupos-muertos/', pk_proyecto);

    if (!pk_proyecto || isNaN(pk_proyecto)) {
      return res.status(400).json({
        success: false,
        error: 'pk_proyecto inválido',
      });
    }

    const resultado = await eliminarGruposProyecto(pk_proyecto);

    if (resultado.success) {
      return res.status(200).json({
        success: true,
        mensaje: 'Grupos eliminados',
      });
    } else {
      return res.status(500).json({
        success: false,
        error: resultado.error,
      });
    }
  } catch (error: any) {
    console.error('[GRUPO_MUERTO_CTRL] Error en eliminarGrupos:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
