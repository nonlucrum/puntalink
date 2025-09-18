import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: Number(process.env.PGPORT) || 5432,
});

export default pool;

export async function addMuro(
  pk_proyecto: number,
  id_muro: string,
  grosor: number,
  area: number,
  peso: number,
  volumen: number
) {
  const query = `
    INSERT INTO puntalink.muro (pk_proyecto, id_muro, grosor, area, peso, volumen)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [pk_proyecto, id_muro, grosor, area, peso, volumen];

  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // devuelve la fila insertada
  } catch (error) {
    console.error("Error inserting muro:", error);
    throw error;
  }
}

export async function overrideMuros(pk_proyecto: number) {
  await pool.query('DELETE FROM puntalink.muro WHERE pk_proyecto = $1', [pk_proyecto]);
}