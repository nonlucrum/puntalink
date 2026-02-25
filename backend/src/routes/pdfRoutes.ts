import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { PdfController } from '../controllers/pdfController';

const router = Router();

// Multer config: memory storage, 5MB max, only PNG/JPEG
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes PNG o JPEG.'));
    }
  },
});

// Conditional multer middleware: only parse if multipart
function conditionalUpload(req: Request, res: Response, next: NextFunction) {
  if (req.is('multipart/form-data')) {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ ok: false, error: 'La imagen no debe superar 5MB.' });
          }
          return res.status(400).json({ ok: false, error: `Error de archivo: ${err.message}` });
        }
        return res.status(400).json({ ok: false, error: err.message });
      }
      next();
    });
  } else {
    next();
  }
}

// POST /api/informe/generar
router.post('/generar', conditionalUpload, (req: Request, res: Response) => {
  PdfController.generarInforme(req, res);
});

export default router;
