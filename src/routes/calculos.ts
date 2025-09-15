import { Router } from 'express';
import { procesar } from '../controllers/calculosController.js';

const router = Router();

/**
 * POST /api/calculos/procesar
 * Body JSON:
 * {
 *   "datos": [{"Variable": 10, "Frecuencia": 3}, ...]
 * }
 */
router.post('/procesar', procesar);

export default router;
