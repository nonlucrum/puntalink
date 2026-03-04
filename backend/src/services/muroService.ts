import pool from './config/db';
import { Muro, addMuroManual, getMaxNum, getMinNum, shiftMurosNum, compactRenumber } from '../models/Muro';

/**
 * Agregar un muro manual en una posición específica (transaccional)
 */
export async function addManualMuro(
  pk_proyecto: number,
  muroData: Partial<Muro>,
  position: { position: string; reference_pid?: number }
): Promise<Muro> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let num: number;
    const pos = position?.position || 'end';

    if (pos === 'end') {
      const maxResult = await client.query(
        'SELECT COALESCE(MAX(num), 0) as max_num FROM muro WHERE pk_proyecto = $1',
        [pk_proyecto]
      );
      num = parseInt(maxResult.rows[0].max_num) + 1;

    } else if (pos === 'start') {
      // Desplazar todos los muros +1 para hacer espacio en posición 1
      await client.query(
        'UPDATE muro SET num = num + 1 WHERE pk_proyecto = $1',
        [pk_proyecto]
      );
      num = 1;

    } else if (pos === 'after' && position.reference_pid) {
      const refResult = await client.query(
        'SELECT num FROM muro WHERE pid = $1 AND pk_proyecto = $2',
        [position.reference_pid, pk_proyecto]
      );
      if (refResult.rows.length === 0) {
        throw new Error('Muro de referencia no encontrado');
      }
      const refNum = parseInt(refResult.rows[0].num);
      // Desplazar muros posteriores al referencia +1
      await client.query(
        'UPDATE muro SET num = num + 1 WHERE pk_proyecto = $1 AND num > $2',
        [pk_proyecto, refNum]
      );
      num = refNum + 1;

    } else if (pos === 'before' && position.reference_pid) {
      const refResult = await client.query(
        'SELECT num FROM muro WHERE pid = $1 AND pk_proyecto = $2',
        [position.reference_pid, pk_proyecto]
      );
      if (refResult.rows.length === 0) {
        throw new Error('Muro de referencia no encontrado');
      }
      const refNum = parseInt(refResult.rows[0].num);
      // Desplazar muros desde el referencia +1
      await client.query(
        'UPDATE muro SET num = num + 1 WHERE pk_proyecto = $1 AND num >= $2',
        [pk_proyecto, refNum]
      );
      num = refNum;

    } else {
      // Fallback: agregar al final
      const maxResult = await client.query(
        'SELECT COALESCE(MAX(num), 0) as max_num FROM muro WHERE pk_proyecto = $1',
        [pk_proyecto]
      );
      num = parseInt(maxResult.rows[0].max_num) + 1;
    }

    // Insertar el muro manual
    const insertQuery = `
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
      pk_proyecto, num, muroData.id_muro,
      muroData.grosor, muroData.area, muroData.peso, muroData.volumen,
      muroData.overall_width || 'S/N', muroData.overall_height || 'S/N',
      muroData.cgx ?? null, muroData.cgy ?? null,
      muroData.tipo_construccion || 'TILT-UP'
    ];

    const result = await client.query(insertQuery, values);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Actualizar campos geométricos de un muro manual (transaccional)
 */
export async function updateManualMuro(
  pid: number,
  pk_proyecto: number,
  muroData: Partial<Muro>
): Promise<Muro | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que el muro existe y es manual
    const check = await client.query(
      'SELECT pid, origen FROM muro WHERE pid = $1 AND pk_proyecto = $2',
      [pid, pk_proyecto]
    );
    if (check.rows.length === 0) {
      throw new Error('Muro no encontrado');
    }
    if (check.rows[0].origen !== 'MANUAL') {
      throw new Error('Solo se pueden editar los datos geométricos de muros manuales');
    }

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
          tipo_construccion = COALESCE($11, tipo_construccion),
          -- Resetear cálculos de viento y braces al cambiar geometría
          qz_kpa = NULL,
          presion_kpa = NULL,
          fuerza_viento = NULL,
          fbx = 0, fby = 0, fb = 0,
          x_inserto = 0, y_inserto = 0,
          cant_b14 = 0, cant_b12 = 0, cant_b04 = 0, cant_b15 = 0
      WHERE pid = $1 AND origen = 'MANUAL'
      RETURNING *;
    `;

    const values = [
      pid,
      muroData.id_muro ?? null,
      muroData.grosor ?? null,
      muroData.area ?? null,
      muroData.peso ?? null,
      muroData.volumen ?? null,
      muroData.overall_width ?? null,
      muroData.overall_height ?? null,
      muroData.cgx ?? null,
      muroData.cgy ?? null,
      muroData.tipo_construccion ?? null
    ];

    const result = await client.query(query, values);

    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Eliminar un muro y compactar numeración (transaccional)
 */
export async function deleteManualMuro(
  pid: number,
  pk_proyecto: number
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'DELETE FROM muro WHERE pid = $1 AND pk_proyecto = $2 RETURNING pid',
      [pid, pk_proyecto]
    );

    if (result.rowCount === 0) {
      throw new Error('Muro no encontrado');
    }

    // Compactar numeración después de eliminar
    await compactRenumber(pk_proyecto, client);

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reordenar muros de un proyecto (transaccional)
 */
export async function reorderProjectMuros(
  pk_proyecto: number,
  ordering: { pid: number; num: number }[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Usar números temporales negativos para evitar conflictos de unicidad
    for (let i = 0; i < ordering.length; i++) {
      await client.query(
        'UPDATE muro SET num = $1 WHERE pid = $2 AND pk_proyecto = $3',
        [-(i + 1), ordering[i].pid, pk_proyecto]
      );
    }

    // Ahora asignar los números definitivos
    for (const item of ordering) {
      await client.query(
        'UPDATE muro SET num = $1 WHERE pid = $2 AND pk_proyecto = $3',
        [item.num, item.pid, pk_proyecto]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
