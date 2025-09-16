import { Router } from 'express';
import multer from 'multer';
import { parseTextTable } from '../lib/parser.js';
import { isPanelsPlusReport, extractPanelsPlusPayload } from '../lib/panelsPlus.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
  const text = req.file.buffer.toString('utf8');

  if (isPanelsPlusReport(text)) {
    const payload = extractPanelsPlusPayload(text);
    return res.json(payload);
  }

  // Fallback CSV/TSV
  const rows = parseTextTable(text);
  res.json({ kind: 'csv', rows, count: rows.length });
});

export default router;
