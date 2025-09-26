import { Request, Response } from 'express';
import { crearProyectoService } from '../services/projectService';

export async function crearProyecto(req: Request, res: Response) {
  console.log('[controller - projectController] crearProyecto - Inicio');
    try {
        const new_project = crearProyectoService(req);
        res.json({ ok: true, new_project });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] crearProyecto - Fin');
}
