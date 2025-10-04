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
    RETURNING row_to_json(proyecto.*);
  `;
    const values = [pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, null];
    try {
        const result = await pool.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila insertada
    } catch (error) {
        console.error("Error inserting project:", error);
        throw error;
    }
}

export async function updateProject(
    pid: number,
    pk_usuario: number,
    nombre: string,
    empresa: string,
    tipo_muerto: string,
    vel_viento: number,
    temp_promedio: number,
    presion_atmo: number
) {
    const query = `
    UPDATE proyecto
    SET nombre = $3, empresa = $4, tipo_muerto = $5, vel_viento = $6, temp_promedio = $7, presion_atmo = $8
    WHERE pk_usuario = $2 AND pid = $1
    RETURNING row_to_json(proyecto.*);
    `;
    const values = [pid, pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo];
    try {
        const result = await pool.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila insertada
    } catch (error) {
        console.error("Error inserting project:", error);
        throw error;
    }
}

export async function getProjectById(pid: number, pk_usuario: number) {
    const query = `
      SELECT row_to_json(proyecto.*) FROM proyecto
      WHERE pid = $1 AND pk_usuario = $2;
    `;
    const values = [pid, pk_usuario];
    try {
        const result = await pool.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila encontrada
    } catch (error) {
        console.error("Error fetching project by ID:", error);
        throw error;
    }
}