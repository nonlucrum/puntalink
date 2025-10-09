import pool from "../config/db";

export interface Muro {
  pid?: number;           // Opcional, lo asigna la base de datos
  num?: number;           // Número secuencial del panel
  pk_proyecto: number;
  id_muro: string;
  grosor?: number;
  area?: number;
  peso?: number;
  volumen?: number;
  overall_height?: string;  // Cambiado a string para datos en bruto
}

export async function addMuro(
  pk_proyecto: number,
  num: number,            // Agregar número secuencial
  id_muro: string,
  grosor: number,
  area: number,
  peso: number,
  volumen: number,
  overall_height?: string  // Cambiado a string
) {
  const query = `
    INSERT INTO muro (pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_height)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const values = [pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_height || "S/N"];

  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // devuelve la fila insertada
  } catch (error) {
    console.error("Error inserting muro:", error);
    throw error;
  }
}

export async function overrideMuros(pk_proyecto: number) {
  await pool.query('DELETE FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
}

export async function getMurosByProject(pk_proyecto: number): Promise<Muro[]> {
  const query = `
    SELECT pid, num, pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height
    FROM muro 
    WHERE pk_proyecto = $1
    ORDER BY num;
  `;

  try {
    const result = await pool.query(query, [pk_proyecto]);
    return result.rows;
  } catch (error) {
    console.error("Error getting muros:", error);
    throw error;
  }
}