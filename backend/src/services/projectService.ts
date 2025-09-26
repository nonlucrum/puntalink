import { addProject } from '../models/Project';

export function crearProyectoService(projectData: any) {
    console.log('[service - projectService] crearProyecto - Inicio');
    try {
        const nuevoProyecto = addProject(
            1, // pk_usuario temporal
            projectData.body.nombreProyecto,
            projectData.body.empresaConstructora,
            projectData.body.tipoMuerto,
            projectData.body.velViento,
            projectData.body.tempPromedio,
            projectData.body.presionAtm
        );
        console.log('[service - projectService] Resultado final:', JSON.stringify(projectData.body, null, 2));
        console.log('[service - projectService] crearProyecto - Proyecto creado exitosamente');
    } catch (err) {
        throw err;
    }
    console.log('[service - projectService] crearProyecto - Fin');
}
