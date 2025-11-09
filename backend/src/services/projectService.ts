import { addProject } from '../models/Project';
import { updateProject } from '../models/Project';
import { getProjectsByUser } from '../models/Project';
import { getProjectById } from '../models/Project';
import { saveTXT } from '../models/Project';

export async function crearProyectoService(projectData: any) {
    console.log('[service - projectService] crearProyecto - Inicio');
    console.log('[service - projectService] crearProyecto - Datos recibidos:', projectData);
    try {
        const nuevoProyecto = await addProject(
            projectData.id_usuario,
            projectData.nombreProyecto,
            projectData.empresaConstructora,
            projectData.tipoMuerto,
            parseFloat(projectData.velViento),
            parseFloat(projectData.tempPromedio),
            parseFloat(projectData.presionAtm)
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

export async function cargarProyectoService(userData: any) {
    console.log('[service - projectService] cargarProyecto - Inicio');
    try {
        const proyecto = await getProjectById(
            userData.headers['x-project-id'],
            userData.headers['x-user-id']
        );
        console.log('[service - projectService] cargarProyecto - Proyecto obtenido exitosamente');
        return proyecto;
    }
    catch (err) {
        console.error('[service - projectService] cargarProyecto - Error al obtener el proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] cargarProyecto - Fin');
}

export async function guardarTxtService(pk_proyecto: number, json: object) {
    console.log('[service - projectService] guardarTxt - Inicio');
    try {
        const proyectoActualizado = await saveTXT(
            pk_proyecto,
            json
        );
        console.log('[service - projectService] guardarTxt - TXT guardado exitosamente');
        return proyectoActualizado;
    } catch (err) {
        console.error('[service - projectService] guardarTxt - Error al guardar el TXT del proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] guardarTxt - Fin');
}