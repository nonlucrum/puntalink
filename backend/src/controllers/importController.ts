import { Request, Response } from 'express';
import { parseTxtRobusto } from '../services/importService';
// CÓDIGO BASURA - Import comentado porque la función removeTXT está comentada
// import { removeTXT } from '../services/importService';
import { getMurosByProject } from '../models/Muro';

export async function importarMuros(req: Request, res: Response) {
  console.log('[controller - importController] importarMuros - Inicio');
  console.log('[controller - importController] Archivo recibido:', req.file ? req.file.originalname : 'No file');
  try {
    if (!req.file) {
      console.log('[controller - importController] Error: No se recibió archivo');
      return res.status(400).json({ ok: false, error: 'No se recibió archivo.' });
    }
    
    console.log('[controller - importController] Procesando archivo con parseTxtRobusto');
    const pk_proyecto = parseInt(req.body.pk_proyecto);
    const txt = req.file.buffer.toString('utf-8');
    const paneles = await parseTxtRobusto(pk_proyecto, txt);
    
    console.log('[controller - importController] Paneles procesados:', paneles.length);
    
    console.log('[controller - importController] Respuesta exitosa enviada');
    return res.json({ 
      ok: true, 
      paneles: paneles,
      message: "Archivo procesado sin errores." 
    });
  } catch (err: any) {
    console.log('[controller - importController] Error en importarMuros:', err.message);
    return res.status(400).json({ ok: false, error: err.message });
  }
}

export async function cancelarImport(req: Request, res: Response) {
  console.log('[controller - importController] cancelarImport - Inicio');
  try {
    // CÓDIGO BASURA - Función removeTXT comentada, conservar para futuro
    // console.log('[controller - importController] Ejecutando removeTXT');
    // const removed = removeTXT();
    // console.log('[controller - importController] removeTXT completado:', removed);
    console.log('[controller - importController] Respuesta de cancelación enviada');
    return res.json({ ok: true, message: "Importación cancelada." });
  } catch (err: any) {
    console.log('[controller - importController] Error en cancelarImport:', err.message);
    return res.status(400).json({ ok: false, error: "no se pudo :(" });
  }
}

export async function getMuros(req: Request, res: Response) {
  console.log('[controller - importController] getMuros - Inicio');
  try {
    const pk_proyecto = parseInt(req.query.pk_proyecto as string);
    
    if (!pk_proyecto || isNaN(pk_proyecto)) {
      console.log('[controller - importController] pk_proyecto no proporcionado o inválido');
      return res.status(400).json({ 
        ok: false, 
        error: 'Se requiere pk_proyecto válido' 
      });
    }
    
    console.log('[controller - importController] Obteniendo muros para proyecto:', pk_proyecto);
    
    const muros = await getMurosByProject(pk_proyecto);
    console.log('[controller - importController] Muros encontrados:', muros.length);
    
    return res.json({ ok: true, muros });
  } catch (err: any) {
    console.log('[controller - importController] Error en getMuros:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

export async function deleteMurosBatch(req: Request, res: Response) {
  console.log('[controller - importController] deleteMurosBatch - Inicio');
  try {
    const { pk_proyecto, pids } = req.body;
    
    if (!pk_proyecto || !Array.isArray(pids) || pids.length === 0) {
      console.log('[controller - importController] Datos inválidos:', { pk_proyecto, pids });
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere pk_proyecto y array de pids' 
      });
    }
    
    console.log(`[controller - importController] Eliminando ${pids.length} muros del proyecto ${pk_proyecto}`);
    
    // Importar pool para ejecutar query directa
    const pool = require('../config/db').default;
    
    // Eliminar muros por PIDs
    const result = await pool.query(
      'DELETE FROM muro WHERE pk_proyecto = $1 AND pid = ANY($2::int[])',
      [pk_proyecto, pids]
    );
    
    console.log('[controller - importController] Muros eliminados:', result.rowCount);
    
    return res.json({ 
      success: true, 
      deleted: result.rowCount,
      message: `${result.rowCount} muros eliminados exitosamente` 
    });
  } catch (err: any) {
    console.error('[controller - importController] Error en deleteMurosBatch:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}