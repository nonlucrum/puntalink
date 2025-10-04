import { Request, Response } from 'express';
import { parseTxtRobusto } from '../services/importService';
import { removeTXT } from '../services/importService';

export async function importarMuros(req: Request, res: Response) {
  console.log('[controller - importController] importarMuros - Inicio');
  console.log('[controller - importController] Archivo recibido:', req.file ? req.file.originalname : 'No file');
  try {
    if (!req.file) {
      console.log('[controller - importController] Error: No se recibió archivo');
      return res.status(400).json({ ok: false, error: 'No se recibió archivo.' });
    }
    
    console.log('[controller - importController] Procesando archivo con parseTxtRobusto');
    const txt = req.file.buffer.toString('utf-8');
    const paneles = parseTxtRobusto(txt);
    console.log('[controller - importController] Paneles procesados:', paneles.length);
    console.log('[controller - importController] Respuesta exitosa enviada');
    return res.json({ ok: true, paneles, message: "Archivo procesado sin errores." });
  } catch (err: any) {
    console.log('[controller - importController] Error en importarMuros:', err.message);
    return res.status(400).json({ ok: false, error: err.message });
  }
}

export async function cancelarImport(req: Request, res: Response) {
  console.log('[controller - importController] cancelarImport - Inicio');
  try {
    console.log('[controller - importController] Ejecutando removeTXT');
    const removed = removeTXT();
    console.log('[controller - importController] removeTXT completado:', removed);
    console.log('[controller - importController] Respuesta de cancelación enviada');
    return res.json({ ok: true, removed, message: "Importación cancelada." });
  } catch (err: any) {
    console.log('[controller - importController] Error en cancelarImport:', err.message);
    return res.status(400).json({ ok: false, error: "no se pudo :(" });
  }
}