import { Router } from 'express';
import { informePaneles } from '../controllers/pdfController';

const router = Router();

router.post('/panel/informe', informePaneles);

export default router;