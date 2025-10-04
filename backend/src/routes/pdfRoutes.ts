import { Router } from 'express';
import { informePaneles } from '../controllers/calculosController';

const router = Router();

router.post('/panel/informe', informePaneles);

export default router;