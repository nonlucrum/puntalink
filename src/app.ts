import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import importRouter from './routes/import.js';
import calculosRouter from './routes/calculos.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') ?? '*' }));
app.use(morgan('dev'));

// Static
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/import', importRouter);
app.use('/api/calculos', calculosRouter);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Fallback simple index
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

export default app;
