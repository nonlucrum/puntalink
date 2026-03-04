import { Request, Response } from 'express';
import { getMurosByProject } from '../models/Muro';
import { addManualMuro, updateManualMuro, deleteManualMuro, reorderProjectMuros } from '../services/muroService';
import { AddManualMuroSchema, UpdateManualMuroSchema, ReorderMurosSchema, DeleteMuroSchema } from '../validators/muroValidator';

/**
 * POST /api/muros/manual — Agregar un muro manual
 */
export async function addManualMuroHandler(req: Request, res: Response) {
  try {
    const parsed = AddManualMuroSchema.safeParse(req.body);
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

    const muro = await addManualMuro(
      pk_proyecto,
      muroData,
      position || { position: 'end' }
    );

    return res.status(201).json({ ok: true, muro });
  } catch (error: any) {
    console.error('Error agregando muro manual:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error interno del servidor' });
  }
}

/**
 * PUT /api/muros/manual/:pid — Editar un muro manual
 */
export async function updateManualMuroHandler(req: Request, res: Response) {
  try {
    const pid = parseInt(req.params.pid);
    if (isNaN(pid)) {
      return res.status(400).json({ ok: false, error: 'PID inválido' });
    }

    const parsed = UpdateManualMuroSchema.safeParse(req.body);
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

    const muro = await updateManualMuro(pid, pk_proyecto, muroData);
    if (!muro) {
      return res.status(404).json({ ok: false, error: 'Muro no encontrado o no es manual' });
    }

    return res.json({ ok: true, muro });
  } catch (error: any) {
    console.error('Error actualizando muro manual:', error);
    const status = error.message?.includes('Solo se pueden editar') ? 403 : 500;
    return res.status(status).json({ ok: false, error: error.message || 'Error interno del servidor' });
  }
}

/**
 * DELETE /api/muros/manual/:pid — Eliminar un muro
 */
export async function deleteManualMuroHandler(req: Request, res: Response) {
  try {
    const pid = parseInt(req.params.pid);
    if (isNaN(pid)) {
      return res.status(400).json({ ok: false, error: 'PID inválido' });
    }

    const parsed = DeleteMuroSchema.safeParse(req.body);
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

    await deleteManualMuro(pid, pk_proyecto);
    return res.json({ ok: true, message: 'Muro eliminado correctamente' });
  } catch (error: any) {
    console.error('Error eliminando muro:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error interno del servidor' });
  }
}

/**
 * PUT /api/muros/reorder — Reordenar muros de un proyecto
 */
export async function reorderMurosHandler(req: Request, res: Response) {
  try {
    const parsed = ReorderMurosSchema.safeParse(req.body);
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

    await reorderProjectMuros(pk_proyecto, ordering);

    // Retornar la lista actualizada
    const muros = await getMurosByProject(pk_proyecto);
    return res.json({ ok: true, muros });
  } catch (error: any) {
    console.error('Error reordenando muros:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error interno del servidor' });
  }
}

/**
 * GET /api/muros/project/:pk_proyecto — Obtener todos los muros de un proyecto
 */
export async function getMurosHandler(req: Request, res: Response) {
  try {
    const pk_proyecto = parseInt(req.params.pk_proyecto);
    if (isNaN(pk_proyecto)) {
      return res.status(400).json({ ok: false, error: 'pk_proyecto inválido' });
    }

    const muros = await getMurosByProject(pk_proyecto);
    return res.json({ ok: true, muros });
  } catch (error: any) {
    console.error('Error obteniendo muros:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error interno del servidor' });
  }
}
