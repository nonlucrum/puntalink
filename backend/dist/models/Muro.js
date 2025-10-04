"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMuro = addMuro;
exports.overrideMuros = overrideMuros;
const db_1 = __importDefault(require("../config/db"));
async function addMuro(pk_proyecto, id_muro, grosor, area, peso, volumen) {
    const query = `
    INSERT INTO muro (pk_proyecto, id_muro, grosor, area, peso, volumen)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
    const values = [pk_proyecto, id_muro, grosor, area, peso, volumen];
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
