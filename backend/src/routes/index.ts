import { Router } from 'express';
import importRoutes from './import';
import calculosRoutes from './calculosRoutes';
import pdfRoutes from './pdfRoutes';
import panelesRoutes from './panelesRoutes';
import projectRoutes from './projectRoutes';
import grupoMuertoRoutes from './grupoMuertoRoutes';

const router = Router();

// Middleware de logging para el router principal
router.use((req, res, next) => {
  console.log(`[ROUTES - index] ${req.method} ${req.originalUrl}`);
  next();
});

// Rutas principales
router.get('/', (req, res) => {
  console.log('[ROUTES - index] GET / - Página principal');
  res.send('index OK');
});

// Rutas de importación
router.use('/importar-muros', (req, res, next) => {
  console.log('[ROUTES - index] Redirigiendo a /importar-muros');
  next();
}, importRoutes);

// Rutas de cálculos
router.use('/calculos', (req, res, next) => {
  console.log('[ROUTES - index] Redirigiendo a /calculos');
  next();
}, calculosRoutes);

// Rutas de PDF
router.use('/pdf', (req, res, next) => {
  console.log('[ROUTES - index] Redirigiendo a /pdf');
  next();
}, pdfRoutes);

// Rutas de paneles
router.use('/paneles', (req, res, next) => {
  console.log('[routes - index] Redirigiendo a /paneles');
  next();
}, panelesRoutes);

// Rutas de proyecto
router.use('/proyecto', (req, res, next) => {
  console.log('[ROUTES - index] Redirigiendo a /proyecto');
  next();
}, projectRoutes);

// Rutas de grupos de muertos
router.use('/grupos-muertos', (req, res, next) => {
  console.log('[ROUTES - index] Redirigiendo a /grupos-muertos');
  next();
}, grupoMuertoRoutes);

export default router;
