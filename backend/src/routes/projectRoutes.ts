import { Router } from 'express';
import { crearProyecto } from '../controllers/projectController';
import { actualizarProyecto } from '../controllers/projectController';

const router = Router();

// Middleware de logging para rutas de proyecto
router.use((req, res, next) => {
  console.log(`[routes - proyecto] ${req.method} ${req.originalUrl}`);
  next();
});

// POST /api/proyecto/crear -> crea un nuevo proyecto
router.post("/crear", crearProyecto);
router.put("/actualizar", actualizarProyecto);

export default router;