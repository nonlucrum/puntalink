import { Request, Response } from 'express';
import { crearProyectoService } from '../services/projectService';
import { actualizarProyectoService } from '../services/projectService';

export async function crearProyecto(req: Request, res: Response) {
  console.log('[controller - projectController] crearProyecto - Inicio');
    try {
        const new_project = await crearProyectoService(req);
        console.log('[controller - projectController] crearProyecto - Proyecto creado:');
        res.json({ ok: true, new_project });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] crearProyecto - Fin');
}

export async function actualizarProyecto(req: Request, res: Response) {
    console.log('[controller - projectController] actualizarProyecto - Inicio');
    try {
        const newest_project = await actualizarProyectoService(req);
        console.log('[controller - projectController] actualizarProyecto - Proyecto actualizado:');
        res.json({ ok: true, newest_project});
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] actualizarProyecto - Fin');
}