import pool from "../config/db";

export interface Project {
  pid?: number;           // Opcional, lo asigna la base de datos
  pk_usuario: number;
  nombre: string;
  empresa?: string;
  tipo_muerto?: string;
  vel_viento?: number;
  temp_promedio?: number;
  presion_atmo?: number;
  texto_entrada?: null | object;
}

export async function addProject(
    pk_usuario: number,
    nombre: string,
    empresa: string,
    tipo_muerto: string,
    vel_viento: number,
    temp_promedio: number,
    presion_atmo: number
) {
  const query = `
    INSERT INTO proyecto (pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, texto_entrada)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
    const values = [pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, null];
    try {
        const result = await pool.query(query, values);
        return result.rows[0]; // devuelve la fila insertada
    } catch (error) {
        console.error("Error inserting project:", error);
        throw error;
    }
}

export async function getProjectById(pk_proyecto: number) {
    const query = 'SELECT * FROM proyecto WHERE pid = $1';
    const values = [pk_proyecto];
    try {
        const result = await pool.query(query, values);
        return result.rows[0]; // devuelve la fila encontrada o undefined si no existe
    } catch (error) {
        console.error("Error fetching project by ID:", error);
        throw error;
    }
}


