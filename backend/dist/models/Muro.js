"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMuro = addMuro;
exports.overrideMuros = overrideMuros;
exports.getMurosByProject = getMurosByProject;
exports.updateMuroEditableFields = updateMuroEditableFields;
exports.updateMuroBraceCalculations = updateMuroBraceCalculations;
exports.updateMuroWindCalculations = updateMuroWindCalculations;
const db_1 = __importDefault(require("../services/config/db"));
async function addMuro(pk_proyecto, num, // Agregar número secuencial
id_muro, grosor, area, peso, volumen, overall_height, // Cambiado a string
angulo_brace, // Nuevo: ángulo manual
npt, // Nuevo: NPT manual
tipo_brace_seleccionado, // Nuevo: tipo de brace seleccionado
factor_w2, // Nuevo: factor W2
x_braces, // Nuevo: cantidad de braces
fbx, // Nuevo: fuerza X
fby, // Nuevo: fuerza Y
fb, // Nuevo: fuerza total
x_inserto, // Nuevo: coordenada X del inserto
y_inserto, // Nuevo: coordenada Y del inserto
cant_b14, // Nuevo: cantidad B14
cant_b12, // Nuevo: cantidad B12
cant_b04, // Nuevo: cantidad B04
cant_b15, // Nuevo: cantidad B15
muertos, // Nuevo: siempre 1
tipo_construccion // Nuevo: TILT-UP o PRECAZT
) {
    const query = `
    INSERT INTO muro (
      pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_height,
      angulo_brace, npt, tipo_brace_seleccionado, factor_w2, x_braces, fbx, fby, fb, x_inserto, y_inserto,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    RETURNING *;
  `;
    const values = [
        pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_height || "S/N",
        angulo_brace || null, npt || null, tipo_brace_seleccionado || null, factor_w2 || 0.6,
        x_braces || 0, fbx || 0, fby || 0, fb || 0, x_inserto || 0, y_inserto || 0,
        cant_b14 || 0, cant_b12 || 0, cant_b04 || 0, cant_b15 || 0, muertos || 1, tipo_construccion || 'TILT-UP'
    ];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0]; // devuelve la fila insertada
    }
    catch (error) {
        console.error("Error inserting muro:", error);
        throw error;
    }
}
async function overrideMuros(pk_proyecto) {
    await db_1.default.query('DELETE FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
}
async function getMurosByProject(pk_proyecto) {
    const query = `
    SELECT 
      pid, num, pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height,
      angulo_brace, npt, tipo_brace_seleccionado, factor_w2, 
      qz_kpa, presion_kpa, fuerza_viento,
      x_braces, fbx, fby, fb, x_inserto, y_inserto,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion
    FROM muro 
    WHERE pk_proyecto = $1
    ORDER BY num;
  `;
    try {
        const result = await db_1.default.query(query, [pk_proyecto]);
        return result.rows;
    }
    catch (error) {
        console.error("Error getting muros:", error);
        throw error;
    }
}
async function updateMuroEditableFields(pid, angulo_brace, npt, x_braces, tipo_construccion, tipo_brace_seleccionado, eje) {
    const query = `
    UPDATE muro
    SET angulo_brace = $2, npt = $3, x_braces = $4, tipo_construccion = $5, tipo_brace_seleccionado = $6, eje = $7
    WHERE pid = $1
    RETURNING *;
  `;
    const values = [pid, angulo_brace, npt, x_braces, tipo_construccion, tipo_brace_seleccionado, eje];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0];
    }
    catch (error) {
        console.error("Error updating muro editable fields:", error);
        throw error;
    }
}
async function updateMuroBraceCalculations(pid, fbx, fby, fb, cant_b14, cant_b12, cant_b04, cant_b15, x_inserto, y_inserto) {
    const query = `
    UPDATE muro
    SET fbx = $2, fby = $3, fb = $4, cant_b14 = $5, cant_b12 = $6, cant_b04 = $7, cant_b15 = $8,
        x_inserto = $9, y_inserto = $10
    WHERE pid = $1
    RETURNING *;
  `;
    const values = [pid, fbx, fby, fb, cant_b14, cant_b12, cant_b04, cant_b15, x_inserto || null, y_inserto || null];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0];
    }
    catch (error) {
        console.error("Error updating muro brace calculations:", error);
        throw error;
    }
}
/**
 * Actualizar valores de viento calculados en la base de datos
 * Debe ejecutarse después de calcularVientoMuros
 */
async function updateMuroWindCalculations(pid, qz_kpa, presion_kpa, fuerza_viento) {
    const query = `
    UPDATE muro
    SET qz_kpa = $2, presion_kpa = $3, fuerza_viento = $4
    WHERE pid = $1
    RETURNING *;
  `;
    const values = [pid, qz_kpa, presion_kpa, fuerza_viento];
    try {
        const result = await db_1.default.query(query, values);
        return result.rows[0];
    }
    catch (error) {
        console.error("Error updating muro wind calculations:", error);
        throw error;
    }
}
