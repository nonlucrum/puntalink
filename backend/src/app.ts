import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors, { CorsOptions } from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import indexRouter from './routes/index';
import importRouter from './routes/import';
import calculosRoutes from './routes/calculosRoutes';
import panelesRoutes from './routes/panelesRoutes';
import projectRoutes from './routes/projectRoutes';
import authRoutes from './routes/authRoutes'; // 👈 NUEVO
import grupoMuertoRoutes from './routes/grupoMuertoRoutes'; // 👈 NUEVO - Grupos de muertos
import muroRoutes from './routes/muroRoutes';
import reportRoutes from './routes/reportRoutes';

const app = express();

const ALLOWED = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// (Opcional pero útil si alguna vez vas detrás de proxy/ingress y usas cookies SameSite=None)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ===== Logger simple =====
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${req.method}] ${req.url}`);
  _res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

// ===== CORS (con credenciales) =====
const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/postman
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error(`Origen no permitido: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-project-id'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight

// ===== Parsers =====
app.use(cookieParser()); // 👈 NECESARIO para leer/setear cookie 'session'
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ===== Static & views =====
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'html');

// ===== Healthcheck =====
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'puntalink-pro-ts-struct' });
});

// ===== Rutas base =====
app.use('/', indexRouter);

// ===== AUTH primero que el resto (para que CORS/cookies apliquen bien) =====
app.use('/api/auth', authRoutes); // 👈 NUEVO

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

// ===== Muros manuales =====
app.use('/api/muros', muroRoutes);

// ===== Grupos de Muertos (DEBE IR ANTES DEL 404) =====
app.use('/api/grupos-muertos', grupoMuertoRoutes);

// ===== Informe (PDF/DOCX) =====
app.use('/api/informe', reportRoutes);

// ===== 404 para APIs (SIEMPRE AL FINAL) =====
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'Recurso API no encontrado' });
});

// ===== 404 general (páginas) =====
app.use((_req: Request, res: Response) => {
  res.status(404).send('Página no encontrada');
});

// ===== Error handler =====
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err?.message ?? 'Error interno del servidor' });
});

export default app;
