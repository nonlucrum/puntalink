import pool from "../services/config/db";

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
  ubicacion?: string;
  version_proyecto?: number;
  created_at?: Date;
  updated_at?: Date;
}

export async function addProject(
    pk_usuario: number,
    nombre: string,
    empresa: string,
    tipo_muerto: string,
    vel_viento: number,
    temp_promedio: number,
    presion_atmo: number,
    ubicacion: string
) {
  const query = `
    INSERT INTO proyecto (pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, texto_entrada, ubicacion)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING row_to_json(proyecto.*);
  `;
    const values = [pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, null, ubicacion];
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
    presion_atmo: number,
    ubicacion: string
) {
    const query = `
    UPDATE proyecto
    SET nombre = $3, empresa = $4, tipo_muerto = $5, vel_viento = $6, temp_promedio = $7, presion_atmo = $8, ubicacion = $9
    WHERE pk_usuario = $2 AND pid = $1
    RETURNING row_to_json(proyecto.*);
    `;
    const values = [pid, pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, ubicacion];
    try {
        const result = await pool.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila insertada
    } catch (error) {
        console.error("Error inserting project:", error);
        throw error;
    }
}

export async function saveTXT(
    pid: number,
    texto_entrada: object
) {
    const query = `
    UPDATE proyecto
    SET texto_entrada = $2
    WHERE pid = $1
    RETURNING row_to_json(proyecto.*);
    `;
    const values = [pid, texto_entrada];
    try {
        const result = await pool.query(query, values);
        return result.rows[0].row_to_json; // devuelve la fila actualizada
    } catch (error) {
        console.error("Error saving project TXT:", error);
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

export async function getProjectsByUser(pk_usuario: number) {
    const query = `
      SELECT row_to_json(proyecto.*) FROM proyecto
      WHERE pk_usuario = $1 ORDER BY updated_at ASC;
    `;
    const values = [pk_usuario];
    try {
        const result = await pool.query(query, values);
        return result.rows.map(row => row.row_to_json); // devuelve las filas encontradas
    } catch (error) {
        console.error("Error fetching projects by user:", error);
        throw error;
    }
}

// Función para crear nueva version de proyecto existente
export async function duplicateProject(
    pid: number,
    pk_usuario: number,
    nombre: string,
    notas_version?: string
) {
    const query1 = `
    SELECT count(*) FROM proyecto
    WHERE pk_usuario = $1 AND nombre = $2;
    `;

    const query2 = `
    INSERT INTO proyecto
    SELECT nextval('proyecto_pid_seq'), pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo, texto_entrada, ubicacion, $3, $4, created_at
    FROM proyecto
    WHERE pid = $1 AND pk_usuario = $2
    RETURNING pid;
    `;

    const query3 = `
    INSERT INTO muro (
      pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_width, overall_height, cgx, cgy,
      angulo_brace, npt, tipo_brace_seleccionado, factor_w2, eje,
      qz_kpa, presion_kpa, fuerza_viento,
      x_braces, fbx, fby, fb, x_inserto, y_inserto,
        cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion, origen
    )
    SELECT
      $2, num, id_muro, grosor, area, peso, volumen, overall_width, overall_height, cgx, cgy,
      angulo_brace, npt, tipo_brace_seleccionado, factor_w2, eje,
      qz_kpa, presion_kpa, fuerza_viento,
      x_braces, fbx, fby, fb, x_inserto, y_inserto,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion, origen
    FROM muro
    WHERE pk_proyecto = $1;
    `;

    const query4 = `
    INSERT INTO grupo_muerto (pk_proyecto, numero_muerto, nombre, x_braces, angulo_brace, eje, tipo_construccion, cantidad_muros, profundidad, largo, ancho)
    SELECT $2, numero_muerto, nombre, x_braces, angulo_brace, eje, tipo_construccion, cantidad_muros, profundidad, largo, ancho
    FROM grupo_muerto
    WHERE pk_proyecto = $1;
    `;

    try {
        const result1 = await pool.query(query1, [pk_usuario, nombre]); // obtener el conteo de versiones existentes
        
        const version_nueva = parseInt(result1.rows[0].count) + 1;
        const result2 = await pool.query(query2, [pid, pk_usuario, version_nueva, notas_version]); // duplicar proyecto
        
        const new_pid = parseInt(result2.rows[0].pid);
        await pool.query(query3, [pid, new_pid]); // duplicar muros
        await pool.query(query4, [pid, new_pid]); // duplicar grupos de muertos
        return new_pid;
    } catch (error) {
        console.error("Error duplicating project:", error);
        throw error;
    }
}

export async function deleteProject(pid: number, pk_usuario: number) {
    const query = `
    DELETE FROM proyecto
    WHERE pid = $1 AND pk_usuario = $2;
    `;
    const values = [pid, pk_usuario];
    try {
        await pool.query(query, values);
        return true;
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
}