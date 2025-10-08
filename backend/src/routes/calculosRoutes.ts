import { Router } from 'express';
import { estimacionPanel, informePaneles, parametrosVientoDefecto, calculoVientoMuros } from '../controllers/calculosController';

const router = Router();

// Rutas existentes para estimación de paneles
router.post('/panel/estimacion', estimacionPanel);
router.post('/panel/informe', informePaneles);

// Rutas nuevas para cálculo de viento según Excel y diagramas
// Sección 1: Parámetros por defecto de viento (Excel "braces" valores típicos)
router.get('/viento/parametros-defecto', parametrosVientoDefecto);

// Sección 1-2: Calcular cargas de viento en muros (implementa fórmulas del diagrama)
router.post('/viento/calcular-muros', calculoVientoMuros);

export default router;