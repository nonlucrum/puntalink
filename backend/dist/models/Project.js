"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProject = addProject;
exports.updateProject = updateProject;
exports.saveTXT = saveTXT;
exports.getProjectById = getProjectById;
exports.getProjectsByUser = getProjectsByUser;
exports.duplicateProject = duplicateProject;
exports.deleteProject = deleteProject;
const db_1 = __importDefault(require("../services/config/db"));
async function addProject(pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, ubicacion) {
    const query = `
    INSERT INTO proyecto (pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, texto_entrada, ubicacion)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING row_to_json(proyecto.*);
  `;
    const values = [pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, null, ubicacion];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila insertada
    }
    catch (error) {
        console.error("Error inserting project:", error);
        throw error;
    }
}
async function updateProject(pid, pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, ubicacion) {
    const query = `
    UPDATE proyecto
    SET nombre = $3, empresa = $4, tipo_muerto = $5, vel_viento = $6, temp_promedio = $7, presion_atmo = $8, ubicacion = $9
    WHERE pk_usuario = $2 AND pid = $1
    RETURNING row_to_json(proyecto.*);
    `;
    const values = [pid, pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, ubicacion];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila insertada
    }
    catch (error) {
        console.error("Error inserting project:", error);
        throw error;
    }
}
async function saveTXT(pid, texto_entrada) {
    const query = `
    UPDATE proyecto
    SET texto_entrada = $2
    WHERE pid = $1
    RETURNING row_to_json(proyecto.*);
    `;
    const values = [pid, texto_entrada];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila actualizada
    }
    catch (error) {
        console.error("Error saving project TXT:", error);
        throw error;
    }
}
async function getProjectById(pid, pk_usuario) {
    const query = `
      SELECT row_to_json(proyecto.*) FROM proyecto
      WHERE pid = $1 AND pk_usuario = $2;
    `;
    const values = [pid, pk_usuario];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila encontrada
    }
    catch (error) {
        console.error("Error fetching project by ID:", error);
        throw error;
    }
}
async function getProjectsByUser(pk_usuario) {
    const query = `
      SELECT row_to_json(proyecto.*) FROM proyecto
      WHERE pk_usuario = $1 ORDER BY updated_at ASC;
    `;
    const values = [pk_usuario];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows.map(row => row.row_to_json); // devuelve las filas encontradas
    }
    catch (error) {
        console.error("Error fetching projects by user:", error);
        throw error;
    }
}
// Función para crear nueva version de proyecto existente
async function duplicateProject(pid, pk_usuario, nombre, notas_version) {
    const query1 = `
    SELECT count(*) FROM proyecto
    WHERE pk_usuario = $1 AND nombre = $2;
    `;
    const query2 = `
    INSERT INTO proyecto
    SELECT nextval('proyecto_pid_seq'), pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, texto_entrada, ubicacion, $3, $4, created_at
    FROM proyecto
    WHERE pid = $1 AND pk_usuario = $2
    RETURNING pid;
    `;
    const query3 = `
    INSERT INTO muro (
      pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_width, overall_height, cgx, cgy,
      angulo_brace, npt, tipo_brace_seleccionado, factor_w2, eje,
      qz_kpa, presion_kpa, fuerza_viento,
      x_braces, fbx, fby, fb, x_inserto, y_inserto,
        cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion, origen
    )
    SELECT
      $2, num, id_muro, grosor, area, peso, volumen, overall_width, overall_height, cgx, cgy,
      angulo_brace, npt, tipo_brace_seleccionado, factor_w2, eje,
      qz_kpa, presion_kpa, fuerza_viento,
      x_braces, fbx, fby, fb, x_inserto, y_inserto,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion, origen
    FROM muro
    WHERE pk_proyecto = $1;
    `;
    const query4 = `
    INSERT INTO grupo_muerto (pk_proyecto, numero_muerto, nombre, x_braces, angulo_brace, eje, tipo_construccion, cantidad_muros, profundidad, largo, ancho)
    SELECT $2, numero_muerto, nombre, x_braces, angulo_brace, eje, tipo_construccion, cantidad_muros, profundidad, largo, ancho
    FROM grupo_muerto
    WHERE pk_proyecto = $1;
    `;
    try {
        const result1 = await db_1.default.query(query1, [pk_usuario, nombre]); // obtener el conteo de versiones existentes
        const version_nueva = parseInt(result1.rows[0].count) + 1;
        const result2 = await db_1.default.query(query2, [pid, pk_usuario, version_nueva, notas_version]); // duplicar proyecto
        const new_pid = parseInt(result2.rows[0].pid);
        await db_1.default.query(query3, [pid, new_pid]); // duplicar muros
        await db_1.default.query(query4, [pid, new_pid]); // duplicar grupos de muertos
        return new_pid;
    }
    catch (error) {
        console.error("Error duplicating project:", error);
        throw error;
    }
}
async function deleteProject(pid, pk_usuario) {
    const query = `
    DELETE FROM proyecto
    WHERE pid = $1 AND pk_usuario = $2;
    `;
    const values = [pid, pk_usuario];
    try {
        await db_1.default.query(query, values);
        return true;
    }
    catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
}
