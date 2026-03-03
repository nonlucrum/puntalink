import { Router } from 'express';
import multer from 'multer';
import { generarInforme } from '../controllers/reportController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

router.post('/generar', upload.single('imagen'), generarInforme);

export default router;
