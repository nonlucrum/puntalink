import { Router } from 'express';
import multer from 'multer';
import { importarMuros } from '../controllers/importController';
import { cancelarImport } from '../controllers/importController';
import { getMuros } from '../controllers/importController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/plain') {
      cb(new Error('Solo archivos .txt'));
    }
    if (file.originalname.length > 255) {
      cb(new Error('Nombre muy largo'));
    }
    cb(null, true);
  }
});

// Middleware de logging para rutas de import
router.use((req, res, next) => {
  console.log(`[routes - import] ${req.method} ${req.originalUrl}`);
  next();
});

router.post(['/', '/txt'], upload.single('file'), (req, res) => {
  console.log('[routes - import] POST / - Llamando a importarMuros');
  importarMuros(req, res);
});

router.delete(['/', '/cancelar-import'], (req, res) => {
  console.log('[routes - import] DELETE / - Llamando a cancelarImport');
  cancelarImport(req, res);
});

router.get('/muros', (req, res) => {
  console.log('[routes - import] GET /muros - Llamando a getMuros');
  getMuros(req, res);
});

export default router;