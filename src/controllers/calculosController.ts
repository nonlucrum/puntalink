import { describir } from '../services/calculos.js';
import type { Request, Response } from 'express';

export async function procesar(req: Request, res: Response) {
  try {
    const datos = req.body?.datos ?? [];
    const resumen = describir(datos);
    res.json(resumen);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
