/**
 * ARCHIVO DEPRECADO - ELIMINAR
 * 
 * Este archivo contenía datos HARDCODEADOS del PDF de Magnorth (factores D1-D16)
 * 
 * ⚠️ RAZÓN DE LA ELIMINACIÓN:
 * Todos los datos que influyen directamente en los cálculos de Deadman/Acero/Concreto/Alambre
 * DEBEN ser:
 * 1. Ingresados por el usuario en la interfaz
 * 2. Almacenados en la base de datos del proyecto
 * 3. Recuperados desde BD cuando sea necesario
 * 4. NO traídos de archivos externos o PDFs
 * 
 * ⚠️ DATOS QUE ESTABAN HARDCODEADOS:
 * - FACTORES_REPETICION (D1-D16)
 *   - repLong: Factor para acero longitudinal
 *   - repTrans: Factor para acero transversal
 *   - repVol: Factor para volumen de hormigón
 *   - repAlambre: Factor para alambre
 * 
 * ✅ SOLUCIÓN PROPUESTA:
 * 1. Crear tabla en BD: `proyecto_factores_repeticion`
 *    - pk_proyecto (FK)
 *    - id_muerto (D1, D2, ... D16)
 *    - rep_long (factor)
 *    - rep_trans (factor)
 *    - rep_vol (factor)
 *    - rep_alambre (factor)
 * 
 * 2. Crear endpoints en backend:
 *    - GET /api/proyecto/:pid/factores-repeticion
 *    - POST /api/proyecto/:pid/factores-repeticion
 *    - PUT /api/proyecto/:pid/factores-repeticion/:muerto_id
 * 
 * 3. Crear interfaz en frontend para editar estos factores
 * 
 * 4. Usar esos factores en muertoRectangular.js
 * 
 * ============================================================
 * NOTA: Las funciones que usaban este archivo han sido actualizadas
 * para usar valores por defecto (1.0) en factores hasta que se
 * implementen los endpoints en BD.
 * ============================================================
 */

// ARCHIVO ELIMINADO - Ver comentarios arriba
