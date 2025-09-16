import express, { Request, Response, NextFunction } from 'express';
import { addMuro, overrideMuros } from './db';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import multer from 'multer';

import indexRouter from './routes/index';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import calculosRouter from './routes/calculos';
import verificacionRouter from './routes/verificacion';
import informeRouter from './routes/informe';
import informesRouter from './routes/informes';
import pilaresRouter from './routes/pilares';
import reportesRouter from './routes/reportes';
import importRouter from './routes/import';

// 🔹 Importamos el middleware de auth
import { authMiddleware } from './middleware/auth';

const app = express();

// ===== Logger simple (para ver URLs exactas) =====
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
app.use(express.static(path.join(__dirname, '..', 'public')));
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'html'); // cambia si usas ejs/pug/etc.

// ===== Healthcheck =====
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'puntalink-pro-ts-struct' });
});

// ===== Rutas base =====
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/calculos', calculosRouter);
app.use('/verificacion', verificacionRouter);
app.use('/informe', informeRouter);
app.use('/informes', informesRouter);
app.use('/pilares', pilaresRouter);
app.use('/reportes', reportesRouter);

// ===== Ejemplo de ruta protegida =====
app.get('/perfil', authMiddleware, (req: Request, res: Response) => {
  res.json({ message: 'Bienvenido a tu perfil', user: (req as any).user });
});

// ===== Importación TXT: lee SOLO Panel, Thickness, Area, Weight, Volume =====
const upload = multer({ storage: multer.memoryStorage() });

async function parseTXT_MinColumns(raw: string) {
  const lines = raw.split(/\r?\n/);
  const paneles: Array<{
    panel: string;
    thickness: string;
    area: string;
    weight: string;
    volume: string;
  }> = [];

  for (const line of lines) {
    const ln = line.trim();
    if (!ln) continue;
    if (!/^\(\d+\)/.test(ln)) continue;

    // Paso 1: convertir comas decimales en puntos (ej: "66,5" → "66.5")
    const fixedLine = ln.replace(/(\d),(\d)/g, "$1.$2");

    // Paso 2: separar columnas por comas
    const cols = fixedLine.split(",").map(c => c.trim());
    if (cols.length < 5) continue;

    const panel = cols[0];
    const thickness = cols[1] || "";
    const area = cols[2] || "";
    const weight = cols[3] || "";
    const volume = cols[4] || "";

    if (!thickness) continue;
    paneles.push({ panel, thickness, area, weight, volume });

    const nuevoMuro = await addMuro(
        1,          // pk_proyecto
        panel,      // id_muro
        parseFloat(thickness),  // grosor
        parseFloat(area),       // area
        parseFloat(weight),      // peso
        parseFloat(volume)        // volumen
    );

    console.log("Muro agregado:", nuevoMuro);
  }

  return paneles;
}

app.post(/.*import.*/i, upload.single('file'), async (req: Request, res: Response) => {
  try {

    const pk_proy = 1; // Cambia esto si el proyecto es dinámico
    await overrideMuros(pk_proy); // <-- Borra los muros antes de importar

    if (!req.file) {
      return res.status(400).json({ paneles: [] });
    }
    const txt = req.file.buffer.toString('utf-8');
    const paneles = await parseTXT_MinColumns(txt);
    return res.json({ paneles });
  } catch (err: any) {
    console.error('Import TXT error:', err);
    return res.status(500).json({ paneles: [] });
  }
});

app.use(['/import', '/import/txt', '/api/import', '/importar'], importRouter);

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
