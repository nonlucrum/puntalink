import { Router } from 'express';
import { estimacionPanel, informePaneles } from '../controllers/calculosController';

const router = Router();

router.post('/panel/estimacion', estimacionPanel);
router.post('/panel/informe', informePaneles);

export default router;