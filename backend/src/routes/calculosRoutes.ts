import { Router } from 'express';
// CÓDIGO BASURA - Importaciones comentadas porque las funciones están duplicadas
// import { estimacionPanel, informePaneles, parametrosVientoDefecto, calculoVientoMuros } from '../controllers/calculosController';
import { 
  parametrosVientoDefecto, 
  calculoVientoMuros,
  actualizarCamposEditables,
  calcularBraces,
  aplicarValoresGlobales
} from '../controllers/calculosController';

const router = Router();

// CÓDIGO BASURA - Rutas comentadas porque las funciones están duplicadas, usar pdfController
// router.post('/panel/estimacion', estimacionPanel);
// router.post('/panel/informe', informePaneles);

// Rutas nuevas para cálculo de viento según Excel y diagramas
// Sección 1: Parámetros por defecto de viento (Excel "braces" valores típicos)
router.get('/viento/parametros-defecto', parametrosVientoDefecto);

// Sección 1-2: Calcular cargas de viento en muros (implementa fórmulas del diagrama)
router.post('/viento/calcular-muros', calculoVientoMuros);

// Rutas para gestión de braces
// Actualizar campos editables de un muro (ángulo, NPT, X, tipo)
router.put('/muros/:pid/editable', actualizarCamposEditables);

// Calcular fuerzas de braces para un muro específico
router.post('/muros/:pid/calcular-braces', calcularBraces);

// Aplicar valores globales de ángulo y NPT a todos los muros de un proyecto
router.post('/proyectos/:pk_proyecto/aplicar-globales', aplicarValoresGlobales);

export default router;