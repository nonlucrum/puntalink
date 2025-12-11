import { Router } from 'express';
import multer from 'multer';
import {
    crearProyecto,
    actualizarProyecto,
    listarProyectos,
    cargarProyecto,
    guardarTXT,
    nuevaVersion
} from '../controllers/projectController';

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

const router = Router();

// Middleware de logging para rutas de proyecto
router.use((req, res, next) => {
  console.log(`[routes - proyecto] ${req.method} ${req.originalUrl}`);
  next();
});

// POST /api/proyecto/crear -> crea un nuevo proyecto
router.post("/crear", crearProyecto);
router.put("/actualizar", actualizarProyecto);
router.get("/listar", listarProyectos);
router.get("/cargar", cargarProyecto);
router.post("/guardar-version", nuevaVersion);
router.post(['/guardar-txt'], upload.single('file'), (req, res) => {
  guardarTXT(req, res);
});

export default router;