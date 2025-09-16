// src/app.ts
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import importRouter from './routes/import.js';
import estructuralRouter from './routes/estructural.js';
import paramsRouter from './routes/params.js';
import previewRouter from './routes/preview.js';
import reportRouter from './routes/report.js';
import projectsRouter from './routes/projects.js';

// 1) Crear la app ANTES de usarla
const app = express();

// 2) Middlewares
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') ?? '*' }));
app.use(morgan('dev'));

// 3) Archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..', 'public')));

// 4) Rutas API (ya con app inicializada)
app.use('/api/import', importRouter);
app.use('/api/estructural', estructuralRouter);
app.use('/api/params', paramsRouter);
app.use('/api/preview', previewRouter);
app.use('/api/report', reportRouter);
app.use('/api/projects', projectsRouter);

// 5) Healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// 6) Index
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

export default app;
