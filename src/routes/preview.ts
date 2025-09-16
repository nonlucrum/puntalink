import { Router } from 'express';
import { parseTextTable } from '../lib/parser.js';
import { isPanelsPlusReport, extractPanelsPlusPayload } from '../lib/panelsPlus.js';

const router = Router();

router.post('/', (req, res) => {
  const { raw } = req.body ?? {};
  if (typeof raw !== 'string' || !raw.trim()) {
    return res.status(400).json({ error: "Falta campo 'raw' con texto .txt/.csv" });
  }

  if (isPanelsPlusReport(raw)) {
    const payload = extractPanelsPlusPayload(raw);
    // Muestra solo sample para vista previa
    return res.json({
      kind: payload.kind,
      headers: payload.headers,
      count: payload.count,
      sample: payload.rows.slice(0, 50) // puedes subir este límite
    });
  }

  // Fallback CSV/TSV
  const rows = parseTextTable(raw);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return res.json({ kind: 'csv', headers, count: rows.length, sample: rows.slice(0, 20) });
});

export default router;
