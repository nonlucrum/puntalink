"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearProyectoService = crearProyectoService;
exports.actualizarProyectoService = actualizarProyectoService;
exports.listarProyectosService = listarProyectosService;
exports.cargarProyectoService = cargarProyectoService;
exports.guardarTxtService = guardarTxtService;
exports.nuevaVersionService = nuevaVersionService;
exports.eliminarProyectoService = eliminarProyectoService;
const Project_1 = require("../models/Project");
async function crearProyectoService(projectData) {
    console.log('[service - projectService] crearProyecto - Inicio');
    console.log('[service - projectService] crearProyecto - Datos recibidos:', projectData);
    try {
        const nuevoProyecto = await (0, Project_1.addProject)(projectData.id_usuario, projectData.nombreProyecto, projectData.empresaConstructora, projectData.tipoMuerto, parseFloat(projectData.velViento), parseFloat(projectData.tempPromedio), parseFloat(projectData.presionAtm), projectData.ubicacionProyecto);
        console.log('[service - projectService] crearProyecto - Proyecto creado exitosamente');
        return nuevoProyecto;
    }
    catch (err) {
        console.error('[service - projectService] crearProyecto - Error al crear el proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] crearProyecto - Fin');
}
async function actualizarProyectoService(projectData) {
    console.log('[service - projectService] actualizarProyecto - Inicio');
    try {
        const proyectoActualizado = await (0, Project_1.updateProject)(projectData.body.pid, projectData.body.pk_usuario, projectData.body.nombre, projectData.body.empresa, projectData.body.tipo_muerto, projectData.body.vel_viento, projectData.body.temp_promedio, projectData.body.presion_atmo, projectData.body.ubicacion);
        console.log('[service - projectService] actualizarProyecto - Proyecto actualizado exitosamente');
        return proyectoActualizado;
    }
    catch (err) {
        console.error('[service - projectService] actualizarProyecto - Error al actualizar el proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] actualizarProyecto - Fin');
}
async function listarProyectosService(userData) {
    console.log('[service - projectService] listarProyectos - Inicio');
    try {
        const proyectos = await (0, Project_1.getProjectsByUser)(userData.headers['x-user-id'] || 1 // pk_usuario temporal
        );
        console.log('[service - projectService] listarProyectos - Proyectos obtenidos exitosamente');
        return proyectos;
    }
    catch (err) {
        console.error('[service - projectService] listarProyectos - Error al obtener los proyectos:', err);
        throw err;
    }
    console.log('[service - projectService] listarProyectos - Fin');
}
async function cargarProyectoService(userData) {
    console.log('[service - projectService] cargarProyecto - Inicio');
    try {
        const proyecto = await (0, Project_1.getProjectById)(userData.headers['x-project-id'], userData.headers['x-user-id']);
        console.log('[service - projectService] cargarProyecto - Proyecto obtenido exitosamente');
        return proyecto;
    }
    catch (err) {
        console.error('[service - projectService] cargarProyecto - Error al obtener el proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] cargarProyecto - Fin');
}
async function guardarTxtService(pk_proyecto, json) {
    console.log('[service - projectService] guardarTxt - Inicio');
    try {
        const proyectoActualizado = await (0, Project_1.saveTXT)(pk_proyecto, json);
        console.log('[service - projectService] guardarTxt - TXT guardado exitosamente');
        return proyectoActualizado;
    }
    catch (err) {
        console.error('[service - projectService] guardarTxt - Error al guardar el TXT del proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] guardarTxt - Fin');
}
async function nuevaVersionService(projectData) {
    console.log('[service - projectService] nuevaVersion - Inicio');
    const pid = projectData.body.pid;
    const pk_usuario = projectData.body.pk_usuario;
    const nombre = projectData.body.nombre;
    const notas_version = projectData.body.notas_version;
    try {
        const nuevoProyecto = await (0, Project_1.duplicateProject)(pid, pk_usuario, nombre, notas_version);
        console.log('[service - projectService] nuevaVersion - Nueva versión creada exitosamente');
        return nuevoProyecto;
    }
    catch (err) {
        console.error('[service - projectService] nuevaVersion - Error al crear la nueva versión del proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] nuevaVersion - Fin');
}
async function eliminarProyectoService(userData) {
    console.log('[service - projectService] eliminarProyecto - Inicio');
    try {
        const resultado = await (0, Project_1.deleteProject)(userData.headers['x-project-id'], userData.headers['x-user-id']);
        console.log('[service - projectService] eliminarProyecto - Proyecto eliminado exitosamente');
        return resultado;
    }
    catch (err) {
        console.error('[service - projectService] eliminarProyecto - Error al eliminar el proyecto:', err);
        throw err;
    }
    console.log('[service - projectService] eliminarProyecto - Fin');
}
