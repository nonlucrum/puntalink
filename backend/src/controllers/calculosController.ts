import { Request, Response } from 'express';
import { calcularPaneles } from '../services/panelesService';
import { generarInforme } from '../services/pdfService';
import { calcularVientoMuros, getParametrosVientoDefecto, WindParameters, getParametrosTerreno } from '../services/calculosService';
import { Muro } from '../models/Muro';

export function estimacionPanel(req: Request, res: Response) {
  try {
    const paneles = req.body.paneles;
    const opciones = req.body.opciones;
    if (!Array.isArray(paneles) || paneles.length === 0) {
      return res.status(400).json({ ok: false, error: "Faltan los paneles." });
    }
    const resultados = calcularPaneles(paneles, opciones);
    res.json({ ok: true, resultados });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
}

export async function informePaneles(req: Request, res: Response) {
  try {
    const paneles = req.body.paneles;
    const opciones = req.body.opciones;
    if (!Array.isArray(paneles) || paneles.length === 0) {
      return res.status(400).json({ ok: false, error: "Faltan los paneles." });
    }
    const resultados = calcularPaneles(paneles, opciones);
    const informeBuffer = await generarInforme(resultados);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="informe_paneles.pdf"');
    res.send(informeBuffer);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/**
 * Sección 1: Obtener parámetros por defecto para cálculo de viento
 * GET /api/calculos/viento/parametros-defecto
 * Basado en Excel "braces" sheet valores típicos
 */
export const parametrosVientoDefecto = async (req: Request, res: Response) => {
  try {
    const parametros = getParametrosVientoDefecto();
    const categoriasTerreno = getParametrosTerreno();
    
    // Permitir override de categoría de terreno vía query parameter
    const categoria = req.query.categoria as string;
    if (categoria) {
      const categoriaNum = parseInt(categoria);
      if (categoriaNum >= 1 && categoriaNum <= 4) {
        parametros.categoria_terreno = categoriaNum;
      }
    }
    
    res.json({
      parametros,
      categoriasTerreno,
      info: {
        clases_estructura: [
          { clase: 'A', FC: 1.00, rango: 'h < 20m' },
          { clase: 'B', FC: 0.95, rango: '20m ≤ h ≤ 50m' },
          { clase: 'C', FC: 0.90, rango: 'h > 50m' }
        ]
      }
    });
  } catch (error) {
    console.error('Error obteniendo parámetros de viento por defecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Sección 1-2: Calcular cargas de viento en muros
 * POST /api/calculos/viento/calcular-muros
 * Implementa todas las fórmulas del diagrama Fase 1 y 2
 */
export const calculoVientoMuros = async (req: Request, res: Response) => {
  try {
    const { muros, parametros } = req.body as {
      muros: Muro[];
      parametros: WindParameters;
    };

    // Validar entrada
    if (!muros || !Array.isArray(muros) || muros.length === 0) {
      return res.status(400).json({ 
        error: 'Se requiere un array de muros no vacío' 
      });
    }

    if (!parametros) {
      return res.status(400).json({ 
        error: 'Se requieren parámetros de viento' 
      });
    }

    // Validar parámetros críticos
    const parametrosRequeridos = [
      'VR_kmh', 'alpha', 'beta', 'FC', 'FT',
      'temperatura_C', 'presion_barometrica_mmHg',
      'Cp_int', 'Cp_ext', 'factor_succion'
    ];

    for (const param of parametrosRequeridos) {
      if (!(param in parametros) || typeof parametros[param as keyof WindParameters] !== 'number') {
        return res.status(400).json({ 
          error: `Parámetro requerido faltante o inválido: ${param}` 
        });
      }
    }

    // Calcular viento para todos los muros
    const resultados = calcularVientoMuros(muros, parametros);

    // Estadísticas del cálculo
    const totalMuros = resultados.length;
    const murosConAnalisisDinamico = resultados.filter(r => r.requiere_analisis_dinamico).length;
    const fuerzaMaxima = Math.max(...resultados.map(r => r.fuerza_kN));
    const fuerzaTotal = resultados.reduce((sum, r) => sum + r.fuerza_kN, 0);

    res.json({
      success: true,
      parametros_utilizados: parametros,
      resultados,
      estadisticas: {
        total_muros: totalMuros,
        muros_analisis_dinamico: murosConAnalisisDinamico,
        fuerza_maxima_kN: +fuerzaMaxima.toFixed(2),
        fuerza_total_kN: +fuerzaTotal.toFixed(2),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en cálculo de viento de muros:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};