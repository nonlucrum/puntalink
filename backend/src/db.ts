import { Pool, PoolConfig, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const resolvedPort =
  Number(process.env.PGPORT) ||
  (process.env.PGHOST === 'database' ? 5432 : 5008);


const sslEnabled =
  String(process.env.PGSSL || process.env.DATABASE_SSL || '').toLowerCase() === 'true';

const poolConfig: PoolConfig = {
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

export const pool = new Pool(poolConfig);
export default pool;


export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function initDB(): Promise<void> {
  try {
    const { rows } = await pool.query<{ now: string }>('SELECT NOW() as now;');
    if (!isProd) {
      console.log(`[DB] Conectado a ${poolConfig.host}:${poolConfig.port}/${poolConfig.database} @ ${rows[0].now}`);
    } else {
      console.log('[DB] Conexión OK');
    }
  } catch (err) {
    console.error('[DB] Error al conectar:', err);
    throw err;
  }
}

const gracefulShutdown = async (signal: string) => {
  try {
    console.log(`[DB] Recibido ${signal}, cerrando pool...`);
    await pool.end();
    console.log('[DB] Pool cerrado correctamente');
    process.exit(0);
  } catch (e) {
    console.error('[DB] Error cerrando pool:', e);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));


export async function addMuro(
  pk_proyecto: number,
  id_muro: string,
  grosor: number,
  area: number,
  peso: number,
  volumen: number,
  overall_height?: number
) {
  const q = `
    INSERT INTO muro (pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const vals = [pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height ?? null];

  try {
    const result = await pool.query(q, vals);
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting muro:', error);
    throw error;
  }
}

export async function overrideMuros(pk_proyecto: number) {
  await pool.query('DELETE FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
}
