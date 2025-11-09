import { Router } from 'express';
import {
  crearActualizarGrupos,
  obtenerGrupos,
  actualizarProfundidad,
  actualizarDimensiones,
  eliminarGrupos,
} from '../controllers/grupoMuertoController';

const router = Router();

// Rutas para grupos de muertos
// POST /api/grupos-muertos/:pk_proyecto - Crear/actualizar grupos con configuración
router.post('/:pk_proyecto', crearActualizarGrupos);

// GET /api/grupos-muertos/:pk_proyecto - Obtener grupos de un proyecto
router.get('/:pk_proyecto', obtenerGrupos);

// PUT /api/grupos-muertos/:pid/profundidad - Actualizar solo profundidad
router.put('/:pid/profundidad', actualizarProfundidad);

// PUT /api/grupos-muertos/:pid/dimensiones - Actualizar dimensiones completas
router.put('/:pid/dimensiones', actualizarDimensiones);

// DELETE /api/grupos-muertos/:pk_proyecto - Eliminar grupos de un proyecto
router.delete('/:pk_proyecto', eliminarGrupos);

export default router;
