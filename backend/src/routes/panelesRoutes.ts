import { Router } from "express";
import { PanelesController } from "../controllers/panelesController";

const router = Router();

// Middleware de logging para rutas de paneles
router.use((req, res, next) => {
  console.log(`[routes - paneles] ${req.method} ${req.originalUrl}`);
  next();
});

// POST /api/paneles/calcular  -> calcula y devuelve arreglo
router.post("/calcular", (req, res) => {
  console.log('[routes - paneles] POST /calcular - Llamando a PanelesController.calcular');
  PanelesController.calcular(req, res);
});

// POST /api/paneles/pdf  -> genera y descarga PDF
router.post("/pdf", (req, res) => {
  console.log('[routes - paneles] POST /pdf - Llamando a PanelesController.pdf');
  PanelesController.pdf(req, res);
});

export default router;