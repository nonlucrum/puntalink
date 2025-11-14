"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.initDB = initDB;
exports.addMuro = addMuro;
exports.overrideMuros = overrideMuros;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isProd = process.env.NODE_ENV === 'production';
const resolvedPort = Number(process.env.PGPORT) ||
    (process.env.PGHOST === 'db' ? 5432 : 5008);
const sslEnabled = String(process.env.PGSSL || process.env.DATABASE_SSL || '').toLowerCase() === 'true';
const poolConfig = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    port: resolvedPort,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    // Ajustes del pool
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS ?? 10000),
};
exports.pool = new pg_1.Pool(poolConfig);
exports.default = exports.pool;
async function query(text, params) {
    return exports.pool.query(text, params);
}
async function initDB() {
    try {
        const { rows } = await exports.pool.query('SELECT NOW() as now;');
        if (!isProd) {
            console.log(`[DB] Conectado a ${poolConfig.host}:${poolConfig.port}/${poolConfig.database} @ ${rows[0].now}`);
        }
        else {
            console.log('[DB] Conexión OK');
        }
    }
    catch (err) {
        console.error('[DB] Error al conectar:', err);
        throw err;
    }
}
const gracefulShutdown = async (signal) => {
    try {
        console.log(`[DB] Recibido ${signal}, cerrando pool...`);
        await exports.pool.end();
        console.log('[DB] Pool cerrado correctamente');
        process.exit(0);
    }
    catch (e) {
        console.error('[DB] Error cerrando pool:', e);
        process.exit(1);
    }
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
async function addMuro(pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height) {
    const q = `
    INSERT INTO muro (pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
    const vals = [pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height ?? null];
    try {
        const result = await exports.pool.query(q, vals);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error inserting muro:', error);
        throw error;
    }
}
async function overrideMuros(pk_proyecto) {
    await exports.pool.query('DELETE FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
}
