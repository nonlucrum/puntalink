import { Router } from 'express';
import { calcular } from '../controllers/estructuralController.js';

const router = Router();

/** POST /api/estructural/calc
 *  Body JSON:
 *  {
 *    "velocidadViento": 28,
 *    "coefForma": 1.2,
 *    "areaExpuesta": 12.5,
 *    "alturaPanel": 3.0,
 *    "anchoPanel": 4.2,
 *    "densidadHormigon": 2400,
 *    "seguridad": 1.5
 *  }
 */
router.post('/calc', calcular);

export default router;
