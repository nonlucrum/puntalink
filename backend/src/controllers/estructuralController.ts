import type { Request, Response } from 'express';
import { InputSchema, calcularEstructural } from '../services/estructural.js';

export function calcular(req: Request, res: Response) {
  try {
    const input = InputSchema.parse(req.body);
    const result = calcularEstructural(input);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
