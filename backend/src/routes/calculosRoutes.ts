import { Router } from 'express';
// CÓDIGO BASURA - Importaciones comentadas porque las funciones están duplicadas
// import { estimacionPanel, informePaneles, parametrosVientoDefecto, calculoVientoMuros } from '../controllers/calculosController';
import { 
  parametrosVientoDefecto, 
  calculoVientoMuros,
  actualizarCamposEditables,
  calcularBraces,
  calcularBracesTiempoReal,
  aplicarValoresGlobales,
  recalcularTiposBracesMasivo,
  autoRecalcularTiposBraces,
  actualizarFactorW2,
  actualizarBracesMasivo,
  obtenerMuroPorPid
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
// Obtener un muro específico por PID
router.get('/muros/:pid', obtenerMuroPorPid);

// Actualizar campos editables de un muro (ángulo, NPT, X, tipo)
router.put('/muros/:pid/editable', actualizarCamposEditables);

// Calcular fuerzas de braces para un muro específico (guarda en BD)
router.post('/muros/:pid/calcular-braces', calcularBraces);

// Calcular braces en tiempo real sin guardar (para UI reactiva)
router.post('/muros/:pid/calcular-braces-tiempo-real', calcularBracesTiempoReal);

// Aplicar valores globales de ángulo y NPT a todos los muros de un proyecto
router.post('/proyectos/:pk_proyecto/aplicar-globales', aplicarValoresGlobales);

// Recalcular automáticamente tipos de brace para todos los muros de un proyecto
router.post('/proyectos/:proyecto_id/recalcular-tipos-braces', recalcularTiposBracesMasivo);

// Recalcular automáticamente tipos de braces (sin parámetros de proyecto)
router.post('/auto-recalcular-tipos-braces', autoRecalcularTiposBraces);

// Actualizar factor W2 en todos los muros
router.post('/actualizar-factor-w2', actualizarFactorW2);

// Actualización masiva de braces (tipo y cantidad)
router.post('/actualizar-braces-masivo', actualizarBracesMasivo);

export default router;