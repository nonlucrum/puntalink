import { Router } from 'express';
import multer from 'multer';
import { parsePanelsText } from '../lib/parser.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

/**
 * POST /api/import
 * Form-Data: file=<.txt | .csv>
 * Devuelve filas parseadas para alimentar cálculos.
 */
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
  const text = req.file.buffer.toString('utf8');
  const rows = parsePanelsText(text);
  res.json({ rows, count: rows.length });
});

export default router;
