import { Request, Response } from 'express';
import { 
    crearProyectoService,
    actualizarProyectoService,
    listarProyectosService,
    cargarProyectoService,
    guardarTxtService,
    nuevaVersionService
} from '../services/projectService';

export async function crearProyecto(req: Request, res: Response) {
  console.log('[controller - projectController] crearProyecto - Inicio');
    try {
        const new_project = await crearProyectoService(req.body);
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

export async function listarProyectos(req: Request, res: Response) {
    console.log('[controller - projectController] listarProyectos - Inicio');
    try {
        const proyectos = await listarProyectosService(req);
        console.log('[controller - projectController] listarProyectos - Proyectos listados:');
        res.json({ ok: true, proyectos});
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] listarProyectos - Fin');
}

export async function cargarProyecto(req: Request, res: Response) {
    console.log('[controller - projectController] cargarProyecto - Inicio');
    try {
        const proyecto = await cargarProyectoService(req);
        console.log('[controller - projectController] cargarProyecto - Proyecto cargado:');
        res.json({ ok: true, proyecto});
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] cargarProyecto - Fin');
}

export async function guardarTXT(req: Request, res: Response) {
    console.log('[controller - projectController] guardarTXT - Inicio');
    try {
        const pk_proyecto = parseInt(req.body.pk_proyecto);
        const txt = req.file.buffer.toString('utf-8');
        const filename = req.file.originalname;
        const filejson = {
            filename: filename,
            content: txt
        };
        const resultado = await guardarTxtService(pk_proyecto, filejson);
        console.log('[controller - projectController] guardarTXT - TXT guardado:');
        res.json({ ok: true, resultado});
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] guardarTXT - Fin');
}

export async function nuevaVersion(req: Request, res: Response) {
    console.log('[controller - projectController] nuevaVersion - Inicio');
    try {
        const nuevo_proyecto = await nuevaVersionService(req);
        console.log('[controller - projectController] nuevaVersion - Nueva versión creada:');
        res.json({ ok: true, nuevo_proyecto});
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
    console.log('[controller - projectController] nuevaVersion - Fin');
}