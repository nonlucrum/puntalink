import pool from "../services/config/db";

export interface Muro {
  pid?: number;           // Opcional, lo asigna la base de datos
  num?: number;           // Número secuencial del panel
  pk_proyecto: number;
  id_muro: string;
  grosor?: number;
  area?: number;
  peso?: number;
  volumen?: number;
  overall_width?: string;  // Cambiado a string para datos en bruto
  overall_height?: string;  // Cambiado a string para datos en bruto
  cgx?: number;        // Coordenada X del centro de gravedad
  cgy?: number;        // Coordenada Y del centro de gravedad

  // Campos manuales editables por muro
  angulo_brace?: number;   // Ángulo de inclinación del brace (grados) - Manual
  npt?: number;            // Nivel de Piso Terminado (m) - Manual
  tipo_brace_seleccionado?: string; // Tipo de brace seleccionado (B4, B12, B14, B15) - Manual
  factor_w2?: number;      // Factor W2 para cálculo de tipo de brace
  eje?: string;            // Eje del panel (A, B, C, etc.) - Manual

  // Campos de viento calculados (desde calcularVientoMuros)
  qz_kpa?: number;         // Presión dinámica de viento (kPa)
  presion_kpa?: number;    // Presión de viento (kPa)
  fuerza_viento?: number;  // Fuerza de viento calculada (kN)

  // Campos de braces calculados
  x_braces?: number;       // Cantidad total de braces
  fbx?: number;            // Fuerza del brace en dirección X (kN)
  fby?: number;            // Fuerza del brace en dirección Y (kN)
  fb?: number;             // Fuerza total del brace (kN)
  x_inserto?: number;      // Coordenada X del inserto (m)
  y_inserto?: number;      // Coordenada Y del inserto (m)

  // Cantidades por tipo de brace
  cant_b14?: number;       // Cantidad de braces tipo B14
  cant_b12?: number;       // Cantidad de braces tipo B12
  cant_b04?: number;       // Cantidad de braces tipo B04
  cant_b15?: number;       // Cantidad de braces tipo B15

  // Campo fijo
  muertos?: number;        // Siempre debe ser 1 para conteo de muertos

  // Tipo de construcción
  tipo_construccion?: string;  // TILT-UP o PRECAZT

  // Origen del muro
  origen?: 'TXT' | 'MANUAL';  // TXT = importado, MANUAL = ingresado manualmente
}

const MURO_SELECT_COLUMNS = `
  pid, num, pk_proyecto, id_muro, grosor, area, peso, volumen, overall_width, overall_height, cgx, cgy,
  angulo_brace, npt, tipo_brace_seleccionado, factor_w2, eje,
  qz_kpa, presion_kpa, fuerza_viento,
  x_braces, fbx, fby, fb, x_inserto, y_inserto,
  cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion, origen
`;

export async function addMuro(
  pk_proyecto: number,
  num: number,            // Agregar número secuencial
  id_muro: string,
  grosor: number,
  area: number,
  peso: number,
  volumen: number,
  overall_width?: string,  // Cambiado a string
  overall_height?: string,  // Cambiado a string
  cgx?: number,
  cgy?: number,
  angulo_brace?: number,    // Nuevo: ángulo manual
  npt?: number,             // Nuevo: NPT manual
  tipo_brace_seleccionado?: string, // Nuevo: tipo de brace seleccionado
  factor_w2?: number,       // Nuevo: factor W2
  x_braces?: number,        // Nuevo: cantidad de braces
  fbx?: number,             // Nuevo: fuerza X
  fby?: number,             // Nuevo: fuerza Y
  fb?: number,              // Nuevo: fuerza total
  x_inserto?: number,       // Nuevo: coordenada X del inserto
  y_inserto?: number,       // Nuevo: coordenada Y del inserto
  cant_b14?: number,        // Nuevo: cantidad B14
  cant_b12?: number,        // Nuevo: cantidad B12
  cant_b04?: number,        // Nuevo: cantidad B04
  cant_b15?: number,        // Nuevo: cantidad B15
  muertos?: number,         // Nuevo: siempre 1
  tipo_construccion?: string, // Nuevo: TILT-UP o PRECAZT
  origen?: string           // Origen: TXT o MANUAL
) {
  const query = `
    INSERT INTO muro (
      pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_width, overall_height, cgx, cgy,
      angulo_brace, npt, tipo_brace_seleccionado, factor_w2, x_braces, fbx, fby, fb, x_inserto, y_inserto,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos, tipo_construccion, origen
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
    RETURNING *;
  `;

  const values = [
    pk_proyecto, num, id_muro, grosor, area, peso, volumen, overall_width || "S/N", overall_height || "S/N", cgx || "S/N", cgy || "S/N",
    angulo_brace || null, npt || null, tipo_brace_seleccionado || null, factor_w2 || 0.6,
    x_braces || 0, fbx || 0, fby || 0, fb || 0, x_inserto || 0, y_inserto || 0,
    cant_b14 || 0, cant_b12 || 0, cant_b04 || 0, cant_b15 || 0, muertos || 1, tipo_construccion || 'TILT-UP',
    origen || 'TXT'
  ];

  try {
    const result = await pool.query(query, values);
    console.log("Muro inserted with PID:", result.rows[0]);
    return result.rows[0]; // devuelve la fila insertada
  } catch (error) {
    console.error("Error inserting muro:", error);
    throw error;
  }
}

/**
 * Eliminar muros de un proyecto, opcionalmente filtrado por origen
 */
export async function overrideMuros(pk_proyecto: number, origen?: string) {
  if (origen) {
    await pool.query('DELETE FROM muro WHERE pk_proyecto = $1 AND origen = $2', [pk_proyecto, origen]);
  } else {
    await pool.query('DELETE FROM muro WHERE pk_proyecto = $1', [pk_proyecto]);
  }
}

export async function getMurosByProject(pk_proyecto: number): Promise<Muro[]> {
  const query = `
    SELECT ${MURO_SELECT_COLUMNS}
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

export async function getMuroByPid(pid: number): Promise<Muro | null> {
  const query = `
    SELECT ${MURO_SELECT_COLUMNS}
    FROM muro
    WHERE pid = $1;
  `;

  try {
    const result = await pool.query(query, [pid]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting muro by pid:", error);
    throw error;
  }
}

export async function updateMuroEditableFields(
  pid: number,
  angulo_brace?: number,
  npt?: number,
  x_braces?: number,
  tipo_construccion?: string,
  tipo_brace_seleccionado?: string,
  eje?: string,
) {
  // Only update user-editable fields. Never touch calculated fields (fb, fbx, fby, x_inserto, y_inserto).
  const setClauses: string[] = [];
  const values: any[] = [pid];
  let paramIndex = 2;

  if (angulo_brace !== undefined) { setClauses.push(`angulo_brace = $${paramIndex++}`); values.push(angulo_brace); }
  if (npt !== undefined) { setClauses.push(`npt = $${paramIndex++}`); values.push(npt); }
  if (x_braces !== undefined) { setClauses.push(`x_braces = $${paramIndex++}`); values.push(x_braces); }
  if (tipo_construccion !== undefined) { setClauses.push(`tipo_construccion = $${paramIndex++}`); values.push(tipo_construccion); }
  if (tipo_brace_seleccionado !== undefined) { setClauses.push(`tipo_brace_seleccionado = $${paramIndex++}`); values.push(tipo_brace_seleccionado); }
  if (eje !== undefined) { setClauses.push(`eje = $${paramIndex++}`); values.push(eje); }

  if (setClauses.length === 0) {
    // Nothing to update, just return current muro
    const result = await pool.query(`SELECT * FROM muro WHERE pid = $1`, [pid]);
    return result.rows[0];
  }

  const query = `
    UPDATE muro
    SET ${setClauses.join(', ')}
    WHERE pid = $1
    RETURNING *;
  `;

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

/**
 * Actualizar valores de viento calculados en la base de datos
 * Debe ejecutarse después de calcularVientoMuros
 */
export async function updateMuroWindCalculations(
  pid: number,
  qz_kpa: number,
  presion_kpa: number,
  fuerza_viento: number
) {
  const query = `
    UPDATE muro
    SET qz_kpa = $2, presion_kpa = $3, fuerza_viento = $4
    WHERE pid = $1
    RETURNING *;
  `;

  const values = [pid, qz_kpa, presion_kpa, fuerza_viento];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating muro wind calculations:", error);
    throw error;
  }
}

// ===== Funciones para muros manuales =====

/**
 * Insertar un muro manual con datos geométricos
 */
export async function addMuroManual(
  pk_proyecto: number,
  num: number,
  data: Partial<Muro>
): Promise<Muro> {
  const query = `
    INSERT INTO muro (
      pk_proyecto, num, id_muro, grosor, area, peso, volumen,
      overall_width, overall_height, cgx, cgy, tipo_construccion, origen,
      factor_w2, x_braces, fbx, fby, fb, x_inserto, y_inserto,
      cant_b14, cant_b12, cant_b04, cant_b15, muertos
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'MANUAL',
      0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1)
    RETURNING *;
  `;

  const values = [
    pk_proyecto, num, data.id_muro,
    data.grosor, data.area, data.peso, data.volumen,
    data.overall_width || 'S/N', data.overall_height || 'S/N',
    data.cgx ?? null, data.cgy ?? null,
    data.tipo_construccion || 'TILT-UP'
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Actualizar campos geométricos/material de un muro manual
 */
export async function updateMuroCore(
  pid: number,
  data: Partial<Muro>
): Promise<Muro | null> {
  const query = `
    UPDATE muro
    SET id_muro = COALESCE($2, id_muro),
        grosor = COALESCE($3, grosor),
        area = COALESCE($4, area),
        peso = COALESCE($5, peso),
        volumen = COALESCE($6, volumen),
        overall_width = COALESCE($7, overall_width),
        overall_height = COALESCE($8, overall_height),
        cgx = COALESCE($9, cgx),
        cgy = COALESCE($10, cgy),
        tipo_construccion = COALESCE($11, tipo_construccion)
    WHERE pid = $1 AND origen = 'MANUAL'
    RETURNING *;
  `;

  const values = [
    pid,
    data.id_muro ?? null,
    data.grosor ?? null,
    data.area ?? null,
    data.peso ?? null,
    data.volumen ?? null,
    data.overall_width ?? null,
    data.overall_height ?? null,
    data.cgx ?? null,
    data.cgy ?? null,
    data.tipo_construccion ?? null
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Eliminar un muro individual
 */
export async function deleteMuro(pid: number, pk_proyecto: number): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM muro WHERE pid = $1 AND pk_proyecto = $2 RETURNING pid',
    [pid, pk_proyecto]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Obtener el mayor número de orden en un proyecto
 */
export async function getMaxNum(pk_proyecto: number): Promise<number> {
  const result = await pool.query(
    'SELECT COALESCE(MAX(num), 0) as max_num FROM muro WHERE pk_proyecto = $1',
    [pk_proyecto]
  );
  return parseInt(result.rows[0].max_num) || 0;
}

/**
 * Obtener el menor número de orden en un proyecto
 */
export async function getMinNum(pk_proyecto: number): Promise<number> {
  const result = await pool.query(
    'SELECT COALESCE(MIN(num), 1) as min_num FROM muro WHERE pk_proyecto = $1',
    [pk_proyecto]
  );
  return parseInt(result.rows[0].min_num) || 1;
}

/**
 * Desplazar num de muros >= fromNum en +delta (para hacer espacio al insertar)
 */
export async function shiftMurosNum(
  pk_proyecto: number,
  fromNum: number,
  delta: number,
  client?: any
): Promise<void> {
  const db = client || pool;
  await db.query(
    'UPDATE muro SET num = num + $3 WHERE pk_proyecto = $1 AND num >= $2',
    [pk_proyecto, fromNum, delta]
  );
}

/**
 * Renumerar muros según un nuevo orden
 */
export async function reorderMuros(
  pk_proyecto: number,
  ordering: { pid: number; num: number }[],
  client?: any
): Promise<void> {
  const db = client || pool;
  for (const item of ordering) {
    await db.query(
      'UPDATE muro SET num = $1 WHERE pid = $2 AND pk_proyecto = $3',
      [item.num, item.pid, pk_proyecto]
    );
  }
}

/**
 * Renumerar secuencialmente todos los muros de un proyecto (1, 2, 3...)
 */
export async function compactRenumber(pk_proyecto: number, client?: any): Promise<void> {
  const db = client || pool;
  const muros = await db.query(
    'SELECT pid FROM muro WHERE pk_proyecto = $1 ORDER BY num',
    [pk_proyecto]
  );
  for (let i = 0; i < muros.rows.length; i++) {
    await db.query(
      'UPDATE muro SET num = $1 WHERE pid = $2',
      [i + 1, muros.rows[i].pid]
    );
  }
}
