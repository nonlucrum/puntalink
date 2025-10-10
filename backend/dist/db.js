"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMuro = addMuro;
exports.overrideMuros = overrideMuros;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    port: Number(process.env.PGPORT) || 5008,
});
exports.default = pool;
async function addMuro(pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height) {
    const query = `
    INSERT INTO muro (pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
    const values = [pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height || null];
    try {
        const result = await pool.query(query, values);
        return result.rows[0]; // devuelve la fila insertada
    }
    catch (error) {
        console.error("Error inserting muro:", error);
        throw error;
    }
}
async function overrideMuros(pk_proyecto) {
    await pool.query('DELETE FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
}
