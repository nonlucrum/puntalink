import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import indexRouter from './routes/index';
import importRouter from './routes/import';
import calculosRoutes from './routes/calculosRoutes';
import panelesRoutes from './routes/panelesRoutes';

import projectRoutes from './routes/projectRoutes';

const app = express();

// ===== Logger simple =====
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// ===== Middlewares =====
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== Static & views =====
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'html');

// ===== Healthcheck =====
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'puntalink-pro-ts-struct' });
});

// ===== Rutas base =====
app.use('/', indexRouter);

// ===== Importación TXT (RCSM) =====
app.use('/api/importar-muros', importRouter);

// ===== Cancelación TXT (RCSM) =====
app.use('/api/cancelar-import', importRouter);

// ===== Cálculos =====
app.use('/api/calculos', calculosRoutes);

// ===== Paneles =====
app.use('/api/paneles', panelesRoutes);

// ===== Proyecto =====
app.use('/api/proyecto', projectRoutes);

// ===== 404 para APIs =====
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'Recurso API no encontrado' });
});

// ===== 404 general (páginas) =====
app.use((req: Request, res: Response) => {
  res.status(404).send('Página no encontrada');
});

// ===== Error handler =====
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err?.message ?? 'Error interno del servidor' });
});

export default app;