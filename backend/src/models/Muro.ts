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
  
  // Campos manuales editables por muro
  angulo_brace?: number;   // Ángulo de inclinación del brace (grados) - Manual
  npt?: number;            // Nivel de Piso Terminado (m) - Manual
  
  // Campos de braces
  x_braces?: number;       // Cantidad total de braces
  fbx?: number;            // Fuerza del brace en dirección X (kN)
  fby?: number;            // Fuerza del brace en dirección Y (kN)
  fb?: number;             // Fuerza total del brace (kN)
  
  // Cantidades por tipo de brace
  cant_b14?: number;       // Cantidad de braces tipo B14
  cant_b12?: number;       // Cantidad de braces tipo B12
  cant_b04?: number;       // Cantidad de braces tipo B04
  cant_b15?: number;       // Cantidad de braces tipo B15
  
  // Campo fijo
  muertos?: number;        // Siempre debe ser 1 para conteo de muertos
  
  // Tipo de construcción
  tipo_construccion?: string;  // TILT-UP o PRECAZT
}

export async function addMuro(
  pk_proyecto: number,
  num: number,            // Agregar número secuencial
  id_muro: string,
  grosor: number,
  area: number,
  peso: number,
  volumen: number,
  overall_height?: string,  // Cambiado a string
  angulo_brace?: number,    // Nuevo: ángulo manual
  npt?: number,             // Nuevo: NPT manual
  x_braces?: number,        // Nuevo: cantidad de braces
  fbx?: number,             // Nuevo: fuerza X
  fby?: number,             // Nuevo: fuerza Y
  fb?: number,              // Nuevo: fuerza total
  cant_b14?: number,        // Nuevo: cantidad B14
  cant_b12?: number,        // Nuevo: cantidad B12
  cant_b04?: number,        // Nuevo: cantidad B04
  cant_b15?: number,        // Nuevo: cantidad B15
  muertos?: number,         // Nuevo: siempre 1
  tipo_construccion?: string // Nuevo: TILT-UP o PRECAZT
) {
  const query = `
    INSERT INTO muro (
      pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_height,
      angulo_brace, npt, x_braces, fbx, fby, fb,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *;
  `;

  const values = [
    pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_height || "S/N",
    angulo_brace || null, npt || null, x_braces || 0, fbx || 0, fby || 0, fb || 0,
    cant_b14 || 0, cant_b12 || 0, cant_b04 || 0, cant_b15 || 0, muertos || 1, tipo_construccion || 'TILT-UP'
  ];

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
    SELECT 
      pid, num, pk_proyecto, id_muro, grosor, area, peso, volumen, overall_height,
      angulo_brace, npt, x_braces, fbx, fby, fb,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion
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

export async function updateMuroEditableFields(
  pid: number,
  angulo_brace?: number,
  npt?: number,
  x_braces?: number,
  tipo_construccion?: string,
  tipo_brace_seleccionado?: string
) {
  const query = `
    UPDATE muro
    SET angulo_brace = $2, npt = $3, x_braces = $4, tipo_construccion = $5, tipo_brace_seleccionado = $6
    WHERE pid = $1
    RETURNING *;
  `;

  const values = [pid, angulo_brace, npt, x_braces, tipo_construccion, tipo_brace_seleccionado];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating muro editable fields:", error);
    throw error;
  }
}

export async function updateMuroBraceCalculations(
  pid: number,
  fbx: number,
  fby: number,
  fb: number,
  cant_b14: number,
  cant_b12: number,
  cant_b04: number,
  cant_b15: number,
  x_inserto?: number,
  y_inserto?: number
) {
  const query = `
    UPDATE muro
    SET fbx = $2, fby = $3, fb = $4, cant_b14 = $5, cant_b12 = $6, cant_b04 = $7, cant_b15 = $8,
        x_inserto = $9, y_inserto = $10
    WHERE pid = $1
    RETURNING *;
  `;

  const values = [pid, fbx, fby, fb, cant_b14, cant_b12, cant_b04, cant_b15, x_inserto || null, y_inserto || null];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating muro brace calculations:", error);
    throw error;
  }
}