"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProject = addProject;
exports.updateProject = updateProject;
exports.getProjectById = getProjectById;
const db_1 = __importDefault(require("../config/db"));
async function addProject(pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo) {
    const query = `
    INSERT INTO proyecto (pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, texto_entrada)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING row_to_json(proyecto.*);
  `;
    const values = [pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, null];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila insertada
    }
    catch (error) {
        console.error("Error inserting project:", error);
        throw error;
    }
}
async function updateProject(pid, pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo) {
    const query = `
    UPDATE proyecto
    SET nombre = $3, empresa = $4, tipo_muerto = $5, vel_viento = $6, temp_promedio = $7, presion_atmo = $8
    WHERE pk_usuario = $2 AND pid = $1
    RETURNING row_to_json(proyecto.*);
    `;
    const values = [pid, pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila insertada
    }
    catch (error) {
        console.error("Error inserting project:", error);
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
