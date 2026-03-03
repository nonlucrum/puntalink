"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMuro = addMuro;
exports.overrideMuros = overrideMuros;
exports.getMurosByProject = getMurosByProject;
exports.getMuroByPid = getMuroByPid;
exports.updateMuroEditableFields = updateMuroEditableFields;
exports.updateMuroBraceCalculations = updateMuroBraceCalculations;
exports.updateMuroWindCalculations = updateMuroWindCalculations;
exports.addMuroManual = addMuroManual;
exports.updateMuroCore = updateMuroCore;
exports.deleteMuro = deleteMuro;
exports.getMaxNum = getMaxNum;
exports.getMinNum = getMinNum;
exports.shiftMurosNum = shiftMurosNum;
exports.reorderMuros = reorderMuros;
exports.compactRenumber = compactRenumber;
const db_1 = __importDefault(require("../services/config/db"));
const MURO_SELECT_COLUMNS = `
  pid, num, pk_proyecto, id_muro, grosor, area, peso, volumen, overall_width, overall_height, cgx, cgy,
  angulo_brace, npt, tipo_brace_seleccionado, factor_w2, eje,
  qz_kpa, presion_kpa, fuerza_viento,
  x_braces, fbx, fby, fb, x_inserto, y_inserto,
  cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion, origen
`;
async function addMuro(pk_proyecto, num, // Agregar número secuencial
id_muro, grosor, area, peso, volumen, overall_width, // Cambiado a string
overall_height, // Cambiado a string
cgx, cgy, angulo_brace, // Nuevo: ángulo manual
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
tipo_construccion, // Nuevo: TILT-UP o PRECAZT
origen // Origen: TXT o MANUAL
) {
    const query = `
    INSERT INTO muro (
      pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_width, overall_height, cgx, cgy,
      angulo_brace, npt, tipo_brace_seleccionado, factor_w2, x_braces, fbx, fby, fb, x_inserto, y_inserto,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion, origen
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
    RETURNING *;
  `;
    const values = [
        pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_width || "S/N", overall_height || "S/N", cgx || "S/N", cgy || "S/N",
        angulo_brace || null, npt || null, tipo_brace_seleccionado || null, factor_w2 || 0.6,
        x_braces || 0, fbx || 0, fby || 0, fb || 0, x_inserto || 0, y_inserto || 0,
        cant_b14 || 0, cant_b12 || 0, cant_b04 || 0, cant_b15 || 0, muertos || 1, tipo_construccion || 'TILT-UP',
        origen || 'TXT'
    ];
    try {
        const result = await db_1.default.query(query, values);
        console.log("Muro inserted with PID:", result.rows[0]);
        return result.rows[0]; // devuelve la fila insertada
    }
    catch (error) {
        console.error("Error inserting muro:", error);
        throw error;
    }
}
/**
 * Eliminar muros de un proyecto, opcionalmente filtrado por origen
 */
async function overrideMuros(pk_proyecto, origen) {
    if (origen) {
        await db_1.default.query('DELETE FROM muro WHERE pk_proyecto = $1 AND origen = $2', [pk_proyecto, origen]);
    }
    else {
        await db_1.default.query('DELETE FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
    }
}
async function getMurosByProject(pk_proyecto) {
    const query = `
    SELECT ${MURO_SELECT_COLUMNS}
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
async function getMuroByPid(pid) {
    const query = `
    SELECT ${MURO_SELECT_COLUMNS}
    FROM muro
    WHERE pid = $1;
  `;
    try {
        const result = await db_1.default.query(query, [pid]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error("Error getting muro by pid:", error);
        throw error;
    }
}
async function updateMuroEditableFields(pid, angulo_brace, npt, x_braces, tipo_construccion, tipo_brace_seleccionado, eje, fb, fbx, fby, x_inserto, y_inserto) {
    const query = `
    UPDATE muro
    SET angulo_brace = $2, npt = $3, x_braces = $4, tipo_construccion = $5, tipo_brace_seleccionado = $6, eje = $7 , fb = $8, fbx = $9, fby = $10, x_inserto = $11, y_inserto = $12
    WHERE pid = $1
    RETURNING *;
  `;
    const values = [pid, angulo_brace, npt, x_braces, tipo_construccion, tipo_brace_seleccionado, eje, fb, fbx, fby, x_inserto, y_inserto];
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
// ===== Funciones para muros manuales =====
/**
 * Insertar un muro manual con datos geométricos
 */
async function addMuroManual(pk_proyecto, num, data) {
    const query = `
    INSERT INTO muro (
      pk_proyecto, num, id_muro, grosor, area, peso, volumen,
      overall_width, overall_height, cgx, cgy, tipo_construccion, origen,
      factor_w2, x_braces, fbx, fby, fb, x_inserto, y_inserto,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'MANUAL',
      0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1)
    RETURNING *;
  `;
    const values = [
        pk_proyecto, num, data.id_muro,
        data.grosor, data.area, data.peso, data.volumen,
        data.overall_width || 'S/N', data.overall_height || 'S/N',
        data.cgx ?? null, data.cgy ?? null,
        data.tipo_construccion || 'TILT-UP'
    ];
    const result = await db_1.default.query(query, values);
    return result.rows[0];
}
/**
 * Actualizar campos geométricos/material de un muro manual
 */
async function updateMuroCore(pid, data) {
    const query = `
    UPDATE muro
    SET id_muro = COALESCE($2, id_muro),
        grosor = COALESCE($3, grosor),
        area = COALESCE($4, area),
        peso = COALESCE($5, peso),
        volumen = COALESCE($6, volumen),
        overall_width = COALESCE($7, overall_width),
        overall_height = COALESCE($8, overall_height),
        cgx = COALESCE($9, cgx),
        cgy = COALESCE($10, cgy),
        tipo_construccion = COALESCE($11, tipo_construccion)
    WHERE pid = $1 AND origen = 'MANUAL'
    RETURNING *;
  `;
    const values = [
        pid,
        data.id_muro ?? null,
        data.grosor ?? null,
        data.area ?? null,
        data.peso ?? null,
        data.volumen ?? null,
        data.overall_width ?? null,
        data.overall_height ?? null,
        data.cgx ?? null,
        data.cgy ?? null,
        data.tipo_construccion ?? null
    ];
    const result = await db_1.default.query(query, values);
    return result.rows[0] || null;
}
/**
 * Eliminar un muro individual
 */
async function deleteMuro(pid, pk_proyecto) {
    const result = await db_1.default.query('DELETE FROM muro WHERE pid = $1 AND pk_proyecto = $2 RETURNING pid', [pid, pk_proyecto]);
    return result.rowCount !== null && result.rowCount > 0;
}
/**
 * Obtener el mayor número de orden en un proyecto
 */
async function getMaxNum(pk_proyecto) {
    const result = await db_1.default.query('SELECT COALESCE(MAX(num), 0) as max_num FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
    return parseInt(result.rows[0].max_num) || 0;
}
/**
 * Obtener el menor número de orden en un proyecto
 */
async function getMinNum(pk_proyecto) {
    const result = await db_1.default.query('SELECT COALESCE(MIN(num), 1) as min_num FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
    return parseInt(result.rows[0].min_num) || 1;
}
/**
 * Desplazar num de muros >= fromNum en +delta (para hacer espacio al insertar)
 */
async function shiftMurosNum(pk_proyecto, fromNum, delta, client) {
    const db = client || db_1.default;
    await db.query('UPDATE muro SET num = num + $3 WHERE pk_proyecto = $1 AND num >= $2', [pk_proyecto, fromNum, delta]);
}
/**
 * Renumerar muros según un nuevo orden
 */
async function reorderMuros(pk_proyecto, ordering, client) {
    const db = client || db_1.default;
    for (const item of ordering) {
        await db.query('UPDATE muro SET num = $1 WHERE pid = $2 AND pk_proyecto = $3', [item.num, item.pid, pk_proyecto]);
    }
}
/**
 * Renumerar secuencialmente todos los muros de un proyecto (1, 2, 3...)
 */
async function compactRenumber(pk_proyecto, client) {
    const db = client || db_1.default;
    const muros = await db.query('SELECT pid FROM muro WHERE pk_proyecto = $1 ORDER BY num', [pk_proyecto]);
    for (let i = 0; i < muros.rows.length; i++) {
        await db.query('UPDATE muro SET num = $1 WHERE pid = $2', [i + 1, muros.rows[i].pid]);
    }
}
