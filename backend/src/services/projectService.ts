import { addProject } from '../models/Project';
import { updateProject } from '../models/Project';
import { getProjectsByUser } from '../models/Project';

export async function crearProyectoService(projectData: any) {
    console.log('[service - projectService] crearProyecto - Inicio');
    try {
        const nuevoProyecto = await addProject(
            1, // pk_usuario temporal
            projectData.body.nombreProyecto,
            projectData.body.empresaConstructora,
            projectData.body.tipoMuerto,
            projectData.body.velViento,
            projectData.body.tempPromedio,
            projectData.body.presionAtm
        );
        console.log('[service - projectService] crearProyecto - Proyecto creado exitosamente');
        return nuevoProyecto;
    } catch (err) {
        console.error('[service - projectService] crearProyecto - Error al crear el proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] crearProyecto - Fin');
}

export async function actualizarProyectoService(projectData: any) {
    console.log('[service - projectService] actualizarProyecto - Inicio');
    try {
        const proyectoActualizado = await updateProject(
            projectData.body.pid,
            projectData.body.pk_usuario,
            projectData.body.nombre,
            projectData.body.empresa,
            projectData.body.tipo_muerto,
            projectData.body.vel_viento,
            projectData.body.temp_promedio,
            projectData.body.presion_atmo
        );
        console.log('[service - projectService] actualizarProyecto - Proyecto actualizado exitosamente');
        return proyectoActualizado;
    } catch (err) {
        console.error('[service - projectService] actualizarProyecto - Error al actualizar el proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] actualizarProyecto - Fin');
}

export async function listarProyectosService(userData: any) {
    console.log('[service - projectService] listarProyectos - Inicio');
    try {
        const proyectos = await getProjectsByUser(
            userData.headers['x-user-id'] || 1 // pk_usuario temporal
        );
        console.log('[service - projectService] listarProyectos - Proyectos obtenidos exitosamente');
        return proyectos;
    } catch (err) {
        console.error('[service - projectService] listarProyectos - Error al obtener los proyectos:', err);
        throw err;
    }
    console.log('[service - projectService] listarProyectos - Fin');
}