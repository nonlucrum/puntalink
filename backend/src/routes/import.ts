import { Router, Request, Response } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Parser mínimo:
 * - Si el TXT es JSON válido → devuelve ese JSON.
 * - Si NO es JSON → devuelve { raw } para que no rompa el flujo.
 *   (Puedes adaptar después a tu formato real).
 */
function parseTxt(txt: string): unknown {
  const raw = txt.trim();
  try {
    return JSON.parse(raw);
  } catch {
    return { raw }; // <- sin “panelplus”, solo el contenido crudo
  }
}

// Acepta POST /  y POST /txt  dentro del mismo router
router.post(['/', '/txt'], upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No se recibió archivo.' });
  }
  const txt = req.file.buffer.toString('utf-8');
  const data = parseTxt(txt);
  return res.json({ ok: true, data });
});

export default router;
