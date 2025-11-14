"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearProyectoService = crearProyectoService;
exports.actualizarProyectoService = actualizarProyectoService;
exports.listarProyectosService = listarProyectosService;
const Project_1 = require("../models/Project");
const Project_2 = require("../models/Project");
const Project_3 = require("../models/Project");
async function crearProyectoService(projectData) {
    console.log('[service - projectService] crearProyecto - Inicio');
    console.log('[service - projectService] crearProyecto - Datos recibidos:', projectData);
    try {
        const nuevoProyecto = await (0, Project_1.addProject)(projectData.id_usuario, projectData.nombreProyecto, projectData.empresaConstructora, projectData.tipoMuerto, parseFloat(projectData.velViento), parseFloat(projectData.tempPromedio), parseFloat(projectData.presionAtm));
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
        const proyectoActualizado = await (0, Project_2.updateProject)(projectData.body.pid, projectData.body.pk_usuario, projectData.body.nombre, projectData.body.empresa, projectData.body.tipo_muerto, projectData.body.vel_viento, projectData.body.temp_promedio, projectData.body.presion_atmo);
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
        const proyectos = await (0, Project_3.getProjectsByUser)(userData.headers['x-user-id'] || 1 // pk_usuario temporal
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
