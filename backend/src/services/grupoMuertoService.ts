import pool from '../config/db';
import { GrupoMuertoAttributes } from '../models/GrupoMuerto';

// Interfaz para la configuración de grupos desde el frontend
interface ConfigGrupo {
  profundo: number;
  espaciadoLong: number;
  espaciadoTrans: number;
  factorSeguridad: number;
  friccion: number;
}

interface GruposConfig {
  [clave: string]: ConfigGrupo;
}

/**
 * Crear o actualizar grupos de muertos para un proyecto
 */
export async function crearActualizarGruposMuertos(
  pk_proyecto: number,
  gruposConfig: GruposConfig
): Promise<{ success: boolean; grupos: GrupoMuertoAttributes[]; error?: string }> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('[GRUPO_MUERTO_SERVICE] Creando/actualizando grupos para proyecto:', pk_proyecto);
    console.log('[GRUPO_MUERTO_SERVICE] Configuración recibida:', gruposConfig);

    // Eliminar grupos anteriores del proyecto
    await client.query(
      'DELETE FROM grupo_muerto WHERE pk_proyecto = $1',
      [pk_proyecto]
    );

    const gruposCreados: GrupoMuertoAttributes[] = [];
    let numeroMuerto = 1;

    // Crear nuevos grupos
    for (const [clave, config] of Object.entries(gruposConfig)) {
      // Parsear la clave para obtener x_braces, angulo y eje
      // Formato esperado: "2_55_1" => x_braces=2, angulo=55, eje=1
      const [xBraces, angulo, eje] = clave.split('_').map(v => parseInt(v) || 0);

      // Contar muros que pertenecen a este grupo
      const countResult = await client.query(
        `SELECT COUNT(*) as cantidad 
         FROM muro 
         WHERE pk_proyecto = $1 
         AND x_braces = $2 
         AND eje = $3`,
        [pk_proyecto, xBraces, eje ? eje.toString() : null]
      );
      
      const cantidadMuros = parseInt(countResult.rows[0].cantidad) || 0;

      console.log(`[GRUPO_MUERTO_SERVICE] Grupo ${numeroMuerto} - Clave: ${clave}, Muros: ${cantidadMuros}`);

      // Crear el grupo
      const insertResult = await client.query(
        `INSERT INTO grupo_muerto (
          pk_proyecto, numero_muerto, nombre, x_braces, angulo_brace, 
          eje, cantidad_muros, profundidad, tipo_construccion, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          pk_proyecto,
          numeroMuerto,
          `M${numeroMuerto}`,
          xBraces,
          angulo,
          eje ? eje.toString() : null,
          cantidadMuros,
          config.profundo || 2.0,
          'TILT-UP'
        ]
      );

      gruposCreados.push(insertResult.rows[0]);
      numeroMuerto++;
    }

    await client.query('COMMIT');
    console.log('[GRUPO_MUERTO_SERVICE] Grupos creados exitosamente:', gruposCreados.length);

    return {
      success: true,
      grupos: gruposCreados,
    };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[GRUPO_MUERTO_SERVICE] Error creando grupos:', error);
    return {
      success: false,
      grupos: [],
      error: error.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Obtener todos los grupos de muertos de un proyecto
 */
export async function obtenerGruposMuertosProyecto(
  pk_proyecto: number
): Promise<{ success: boolean; grupos: GrupoMuertoAttributes[]; error?: string }> {
  try {
    console.log('[GRUPO_MUERTO_SERVICE] Obteniendo grupos para proyecto:', pk_proyecto);

    const result = await pool.query(
      `SELECT * FROM grupo_muerto 
       WHERE pk_proyecto = $1 
       ORDER BY numero_muerto ASC`,
      [pk_proyecto]
    );

    console.log('[GRUPO_MUERTO_SERVICE] Grupos encontrados:', result.rows.length);

    return {
      success: true,
      grupos: result.rows,
    };
  } catch (error: any) {
    console.error('[GRUPO_MUERTO_SERVICE] Error obteniendo grupos:', error);
    return {
      success: false,
      grupos: [],
      error: error.message,
    };
  }
}

/**
 * Actualizar la profundidad de un grupo específico
 */
export async function actualizarProfundidadGrupo(
  pid: number,
  profundidad: number
): Promise<{ success: boolean; grupo?: GrupoMuertoAttributes; error?: string }> {
  try {
    console.log('[GRUPO_MUERTO_SERVICE] Actualizando profundidad del grupo:', pid, 'a', profundidad);

    const result = await pool.query(
      `UPDATE grupo_muerto 
       SET profundidad = $1, updated_at = NOW() 
       WHERE pid = $2 
       RETURNING *`,
      [profundidad, pid]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Grupo no encontrado',
      };
    }

    console.log('[GRUPO_MUERTO_SERVICE] Profundidad actualizada exitosamente');

    return {
      success: true,
      grupo: result.rows[0],
    };
  } catch (error: any) {
    console.error('[GRUPO_MUERTO_SERVICE] Error actualizando profundidad:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Actualizar las dimensiones de un grupo específico
 */
export async function actualizarDimensionesGrupo(
  pid: number,
  largo: number,
  ancho: number
): Promise<{ success: boolean; grupo?: GrupoMuertoAttributes; error?: string }> {
  try {
    console.log('[GRUPO_MUERTO_SERVICE] Actualizando dimensiones del grupo:', pid);

    const result = await pool.query(
      `UPDATE grupo_muerto 
       SET largo = $1, ancho = $2, updated_at = NOW() 
       WHERE pid = $3 
       RETURNING *`,
      [largo, ancho, pid]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Grupo no encontrado',
      };
    }

    console.log('[GRUPO_MUERTO_SERVICE] Dimensiones actualizadas exitosamente');

    return {
      success: true,
      grupo: result.rows[0],
    };
  } catch (error: any) {
    console.error('[GRUPO_MUERTO_SERVICE] Error actualizando dimensiones:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Eliminar todos los grupos de un proyecto
 */
export async function eliminarGruposProyecto(
  pk_proyecto: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[GRUPO_MUERTO_SERVICE] Eliminando grupos del proyecto:', pk_proyecto);

    const result = await pool.query(
      'DELETE FROM grupo_muerto WHERE pk_proyecto = $1',
      [pk_proyecto]
    );

    console.log('[GRUPO_MUERTO_SERVICE] Grupos eliminados:', result.rowCount);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[GRUPO_MUERTO_SERVICE] Error eliminando grupos:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
