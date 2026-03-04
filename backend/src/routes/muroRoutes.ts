import { Router } from 'express';
import {
  addManualMuroHandler,
  updateManualMuroHandler,
  deleteManualMuroHandler,
  reorderMurosHandler,
  getMurosHandler
} from '../controllers/muroController';

const router = Router();

// CRUD muros manuales
router.post('/manual', addManualMuroHandler);
router.put('/manual/:pid', updateManualMuroHandler);
router.delete('/manual/:pid', deleteManualMuroHandler);

// Reordenamiento
router.put('/reorder', reorderMurosHandler);

// Consulta
router.get('/project/:pk_proyecto', getMurosHandler);

export default router;
