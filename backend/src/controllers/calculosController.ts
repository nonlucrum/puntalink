import { Request, Response } from 'express';
import { calcularPaneles } from '../services/panelesService';
import { generarInforme } from '../services/pdfService';
import { calcularVientoMuros, getParametrosVientoDefecto, WindParameters, getParametrosTerreno, calculateBraceForces } from '../services/calculosService';
import { Muro, updateMuroEditableFields, updateMuroBraceCalculations, getMurosByProject, updateMuroWindCalculations } from '../models/Muro';
import pool from '../services/config/db';

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
    console.log('[CALCULOS] Iniciando cálculo de viento en muros');
    console.log('[CALCULOS] Headers:', req.headers['content-type']);
    console.log('[CALCULOS] Body keys:', Object.keys(req.body));
    
    const { muros, parametros } = req.body as {
      muros: Muro[];
      parametros: WindParameters;
    };

    console.log('[CALCULOS] Muros recibidos:', muros ? muros.length : 'undefined');
    console.log('[CALCULOS] Parámetros recibidos:', parametros ? Object.keys(parametros) : 'undefined');

    // Validar entrada
    if (!muros || !Array.isArray(muros) || muros.length === 0) {
      console.log('[CALCULOS] ERROR: Array de muros inválido o vacío');
      return res.status(400).json({ 
        error: 'Se requiere un array de muros no vacío' 
      });
    }

    if (!parametros) {
      console.log('[CALCULOS] ERROR: Parámetros faltantes');
      return res.status(400).json({ 
        error: 'Se requieren parámetros de viento' 
      });
    }

    // Validar parámetros críticos
    const parametrosRequeridos = [
      'categoria_terreno', 'VR_kmh', 'FT',
      'temperatura_C', 'presion_barometrica_mmHg',
      'Cp_int', 'Cp_ext', 'factor_succion', 'densidad_concreto_kg_m3'
    ];

    console.log('[CALCULOS] Validando parámetros...');
    console.log('[CALCULOS] Parámetros recibidos completos:', JSON.stringify(parametros, null, 2));

    for (const param of parametrosRequeridos) {
      const valor = parametros[param as keyof WindParameters];
      const tipoValor = typeof valor;
      console.log(`[CALCULOS] Validando ${param}: valor=${valor}, tipo=${tipoValor}`);
      
      if (!(param in parametros) || typeof parametros[param as keyof WindParameters] !== 'number') {
        console.log(`[CALCULOS] ERROR: Parámetro ${param} faltante o inválido`);
        return res.status(400).json({ 
          error: `Parámetro requerido faltante o inválido: ${param}` 
        });
      }
    }

    console.log('[CALCULOS] ✅ Todos los parámetros validados correctamente');

    // ✅ VERIFICAR: Mostrar los valores exactos que se van a usar para Factor G
    console.log('[CALCULOS] VERIFICACION: VERIFICACIÓN FACTOR G:');
    console.log(`[CALCULOS] 🌡️ Temperatura del usuario: ${parametros.temperatura_C}°C`);
    console.log(`[CALCULOS] 📊 Presión del usuario: ${parametros.presion_barometrica_mmHg}mmHg`);
    console.log(`[CALCULOS] 🧮 Cálculo manual Factor G: (0.392 × ${parametros.presion_barometrica_mmHg}) / (273 + ${parametros.temperatura_C})`);
    console.log(`[CALCULOS] 🧮 = ${0.392 * parametros.presion_barometrica_mmHg} / ${273 + parametros.temperatura_C}`);
    console.log(`[CALCULOS] 🧮 = ${(0.392 * parametros.presion_barometrica_mmHg) / (273 + parametros.temperatura_C)}`);

    // Calcular viento para todos los muros - AHORA SIN EL PARÁMETRO NULL
    const resultados = calcularVientoMuros(muros, parametros);
    
    // DEBUG: Verificar el primer resultado
    console.log('[CALCULOS DEBUG] Primer resultado completo:', resultados[0]);
    console.log('[CALCULOS DEBUG] Factor G del primer resultado:', resultados[0]?.G);
    console.log('[CALCULOS DEBUG] Alpha del primer resultado:', resultados[0]?.alpha);
    console.log('[CALCULOS DEBUG] Delta del primer resultado:', resultados[0]?.delta);

    // ✅ GUARDAR VALORES DE VIENTO EN LA BASE DE DATOS
    console.log('[CALCULOS] Guardando valores de viento en la base de datos...');
    const actualizaciones = [];
    for (const resultado of resultados) {
      if (resultado.pid) {
        try {
          await updateMuroWindCalculations(
            resultado.pid,
            resultado.qz_kPa,
            resultado.presion_kPa,
            resultado.fuerza_kN
          );
          actualizaciones.push({
            pid: resultado.pid,
            id_muro: resultado.id_muro,
            actualizado: true
          });
          console.log(`[CALCULOS] ✅ Muro ${resultado.id_muro} (PID ${resultado.pid}): qz=${resultado.qz_kPa}, presión=${resultado.presion_kPa}, fuerza=${resultado.fuerza_kN}`);
        } catch (error) {
          console.error(`[CALCULOS] ERROR actualizando muro ${resultado.id_muro}:`, error);
          actualizaciones.push({
            pid: resultado.pid,
            id_muro: resultado.id_muro,
            actualizado: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }
    }
    console.log(`[CALCULOS] Actualización completada: ${actualizaciones.filter(a => a.actualizado).length}/${resultados.length} muros`);

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

/**
 * Actualizar campos editables de un muro (ángulo, NPT, X braces, tipo construcción)
 * PUT /api/calculos/muros/:pid/editable
 */
export const actualizarCamposEditables = async (req: Request, res: Response) => {
  try {
    const { pid } = req.params;
    const { angulo_brace, npt, x_braces, tipo_construccion, tipo_brace_seleccionado } = req.body;

    console.log(`[CALCULOS] Actualizando campos editables del muro PID: ${pid}`);
    console.log('[CALCULOS] Valores:', { angulo_brace, npt, x_braces, tipo_construccion, tipo_brace_seleccionado });

    // Validaciones
    if (!pid || isNaN(parseInt(pid))) {
      return res.status(400).json({ error: 'PID de muro inválido' });
    }

    // Actualizar en base de datos
    const muroActualizado = await updateMuroEditableFields(
      parseInt(pid),
      angulo_brace,
      npt,
      x_braces,
      tipo_construccion,
      tipo_brace_seleccionado
    );

    if (!muroActualizado) {
      return res.status(404).json({ error: 'Muro no encontrado' });
    }

    console.log('[CALCULOS] Muro actualizado exitosamente:', muroActualizado.id_muro);

    res.json({
      success: true,
      muro: muroActualizado,
      message: 'Campos editables actualizados correctamente'
    });

  } catch (error) {
    console.error('Error actualizando campos editables:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Calcular fuerzas de braces y actualizar muro
 * POST /api/calculos/muros/:pid/calcular-braces
 * Recibe: angulo_brace, x_braces (opcional, puede leerlos de la BD)
 * Calcula automáticamente la fuerza de viento basándose en el área y altura del muro
 * Calcula: FBx, FBy, FB y distribución por tipo
 */
export const calcularBraces = async (req: Request, res: Response) => {
  try {
    const { pid } = req.params;
    let { angulo_brace, x_braces, tipo_brace_seleccionado, npt } = req.body;

    console.log(`[CALCULOS] Calculando braces para muro PID: ${pid}`);

    // Validaciones
    if (!pid || isNaN(parseInt(pid))) {
      return res.status(400).json({ error: 'PID de muro inválido' });
    }

    // Obtener el muro desde la base de datos
    const resultMuro = await pool.query('SELECT * FROM muro WHERE pid = $1', [parseInt(pid)]);
    
    if (resultMuro.rows.length === 0) {
      return res.status(404).json({ error: 'Muro no encontrado' });
    }

    const muro = resultMuro.rows[0];

    // Usar valores del body o los existentes en el muro
    angulo_brace = angulo_brace || muro.angulo_brace;
    x_braces = x_braces || muro.x_braces;
    tipo_brace_seleccionado = tipo_brace_seleccionado || muro.tipo_brace_seleccionado || 'B12';
    npt = npt !== undefined ? npt : (muro.npt || 0); // NPT del body o del muro

    // Validar que tengamos los datos necesarios
    if (!angulo_brace || !x_braces) {
      return res.status(400).json({ 
        error: 'El muro debe tener ángulo_brace y x_braces configurados',
        muro: { angulo_brace: muro.angulo_brace, x_braces: muro.x_braces }
      });
    }

    // Calcular fuerza de viento automáticamente
    // Usamos el área y altura del muro para calcularla
    const area_m2 = parseFloat(muro.area?.toString() || '0');
    const altura_m = parseFloat(muro.overall_height?.toString() || '0');

    if (area_m2 <= 0 || altura_m <= 0) {
      return res.status(400).json({ 
        error: 'El muro debe tener área y altura válidas',
        muro: { area: muro.area, altura: muro.overall_height }
      });
    }

    // Calcular presión de viento (simplificado - usar valores típicos)
    // qz típico para construcción en México: ~80-85 kPa
    const qz_kPa = 82; // Valor típico
    const fuerza_viento_kN = qz_kPa * area_m2;

    console.log(`[CALCULOS] Fuerza de viento calculada: ${fuerza_viento_kN.toFixed(2)} kN (qz=${qz_kPa} kPa, área=${area_m2} m²)`);

    // Calcular fuerzas de braces incluyendo coordenadas de inserto
    const resultado = calculateBraceForces(
      fuerza_viento_kN,
      x_braces,
      angulo_brace,
      npt, // Pasar NPT para calcular Y inserto
      tipo_brace_seleccionado // Pasar tipo seleccionado para calcular X e Y
    );

    console.log('[CALCULOS] Resultado cálculo braces:', resultado);

    // Actualizar muro con los resultados (incluyendo x_inserto y y_inserto)
    const muroActualizado = await updateMuroBraceCalculations(
      parseInt(pid),
      resultado.fbx,
      resultado.fby,
      resultado.fb,
      resultado.cant_b14,
      resultado.cant_b12,
      resultado.cant_b04,
      resultado.cant_b15,
      resultado.x_inserto,
      resultado.y_inserto
    );

    console.log('[CALCULOS] Muro actualizado con cálculos de braces');

    res.json({
      success: true,
      muro: muroActualizado,
      calculo: resultado,
      message: 'Braces calculados y actualizados correctamente'
    });

  } catch (error) {
    console.error('Error calculando braces:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Calcular braces en tiempo real (sin guardar en BD)
 * POST /api/calculos/muros/:pid/calcular-braces-tiempo-real
 * Recibe: angulo_brace, npt, tipo_brace_seleccionado (opcional), factor_w2 (opcional)
 * Retorna: todos los valores calculados sin modificar la base de datos
 * Usado por el frontend para cálculos en tiempo real tipo Excel
 */
export const calcularBracesTiempoReal = async (req: Request, res: Response) => {
  try {
    const { pid } = req.params;
    const { angulo_brace, npt, tipo_brace_seleccionado } = req.body;

    console.log(`[CALCULOS-RT] Calculando braces en tiempo real para muro PID: ${pid}`);
    console.log(`[CALCULOS-RT] Parámetros:`, { angulo_brace, npt, tipo_brace_seleccionado });

    // Validaciones
    if (!pid || isNaN(parseInt(pid))) {
      return res.status(400).json({ error: 'PID de muro inválido' });
    }

    if (angulo_brace === undefined || angulo_brace === null) {
      return res.status(400).json({ error: 'angulo_brace es requerido' });
    }

    // Obtener el muro desde la base de datos (para área y altura)
    const resultMuro = await pool.query('SELECT * FROM muro WHERE pid = $1', [parseInt(pid)]);
    
    if (resultMuro.rows.length === 0) {
      return res.status(404).json({ error: 'Muro no encontrado' });
    }

    const muro = resultMuro.rows[0];

    // Obtener área y altura del muro
    const area_m2 = parseFloat(muro.area?.toString() || '0');
    const alto_m = parseFloat(muro.overall_height?.toString() || '0');

    if (area_m2 <= 0 || alto_m <= 0) {
      return res.status(404).json({
        error: 'Muro no encontrado',
        muro: { area: muro.area, altura: muro.overall_height }
      });
    }

    // ✅ LEER VALORES DE VIENTO DE LA BASE DE DATOS (NO CALCULAR CON HARDCODED)
    // Estos valores deben haber sido calculados y almacenados previamente por calcularVientoMuros
    const qz_kPa = parseFloat(muro.qz_kpa?.toString() || '0');
    const presion_kPa = parseFloat(muro.presion_kpa?.toString() || '0');
    const fuerza_viento_kN = parseFloat(muro.fuerza_viento?.toString() || '0');

    console.log(`[CALCULOS-RT] Valores leídos de BD: qz_kpa=${muro.qz_kpa}, presion_kpa=${muro.presion_kpa}, fuerza_viento=${muro.fuerza_viento}`);
    console.log(`[CALCULOS-RT] Valores parseados: qz=${qz_kPa}, presión=${presion_kPa}, FV=${fuerza_viento_kN}`);

    // Validar que los valores de viento existan en la base de datos
    if (!qz_kPa || qz_kPa <= 0 || !presion_kPa || presion_kPa <= 0 || !fuerza_viento_kN || fuerza_viento_kN <= 0) {
      console.log('[CALCULOS-RT] ❌ ERROR: Valores de viento no encontrados o inválidos en BD');
      return res.status(400).json({
        error: 'El muro no tiene cálculos de viento válidos. Debe calcular el viento primero.',
        pid: parseInt(pid),
        id_muro: muro.id_muro,
        valores_actuales: {
          qz_kpa: muro.qz_kpa || null,
          presion_kpa: muro.presion_kpa || null,
          fuerza_viento: muro.fuerza_viento || null
        },
        solucion: 'En el dashboard, haga clic en "CALCULAR VIENTO" para generar estos valores antes de editar braces'
      });
    }

    console.log(`[CALCULOS-RT] ✅ Usando valores de viento de BD: qz=${qz_kPa.toFixed(4)}kPa, presión=${presion_kPa.toFixed(4)}kPa, FV=${fuerza_viento_kN.toFixed(2)}kN`);
    console.log(`[CALCULOS-RT] Datos del muro: área=${area_m2}m², alto=${alto_m}m`);

    // Usar valores del muro en la BD (NPT y factor_w2 deben existir en BD)
    const npt_final = npt !== undefined ? npt : (muro.npt || 0);
    const factor_w2_final = muro.factor_w2 || 0.6; // Siempre desde BD, default 0.6 si no existe

    // Calcular con el nuevo método usando valores de BD
    const resultado = calculateBraceForces(
      fuerza_viento_kN,    // De BD
      presion_kPa,         // De BD
      alto_m,              // Altura del muro
      angulo_brace,        // Ángulo
      npt_final,           // NPT
      factor_w2_final,     // Factor W2 de BD
      tipo_brace_seleccionado // Tipo manual (opcional)
    );

    console.log('[CALCULOS-RT] Resultado:', resultado);

    // Retornar resultado SIN GUARDAR en BD
    res.json({
      success: true,
      calculo: {
        // Campos calculados
        tipo_brace: tipo_brace_seleccionado || resultado.observaciones.find(o => o.includes('Tipo de brace'))?.split(': ')[1]?.split(' ')[0] || 'B12',
        x_inserto: resultado.x_inserto,
        y_inserto: resultado.y_inserto,
        fbx: resultado.fbx,
        fby: resultado.fby,
        fb: resultado.fb,
        cant_braces: resultado.x_braces,
        cant_b14: resultado.cant_b14,
        cant_b12: resultado.cant_b12,
        cant_b04: resultado.cant_b04,
        cant_b15: resultado.cant_b15,
        // Parámetros usados
        angulo_brace,
        npt: npt_final,
        factor_w2: factor_w2_final,
        // Info adicional
        observaciones: resultado.observaciones
      },
      message: 'Cálculo realizado (no guardado)'
    });

  } catch (error) {
    console.error('[CALCULOS-RT] Error:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Aplicar valores de ángulo y NPT a todos los muros de un proyecto
 * POST /api/calculos/proyectos/:pk_proyecto/aplicar-globales
 */
export const aplicarValoresGlobales = async (req: Request, res: Response) => {
  try {
    const { pk_proyecto } = req.params;
    const { angulo_brace, npt } = req.body;

    console.log(`[CALCULOS] Aplicando valores globales al proyecto ${pk_proyecto}`);
    console.log('[CALCULOS] Valores:', { angulo_brace, npt });

    // Validaciones
    if (!pk_proyecto || isNaN(parseInt(pk_proyecto))) {
      return res.status(400).json({ error: 'PK de proyecto inválido' });
    }

    if (!angulo_brace && !npt) {
      return res.status(400).json({ error: 'Se requiere al menos angulo_brace o npt' });
    }

    // Obtener todos los muros del proyecto
    const muros = await getMurosByProject(parseInt(pk_proyecto));

    if (muros.length === 0) {
      return res.status(404).json({ error: 'No hay muros en este proyecto' });
    }

    console.log(`[CALCULOS] Aplicando a ${muros.length} muros`);

    // Actualizar cada muro
    const actualizaciones = await Promise.all(
      muros.map(muro => 
        updateMuroEditableFields(
          muro.pid!,
          angulo_brace !== undefined ? angulo_brace : muro.angulo_brace,
          npt !== undefined ? npt : muro.npt,
          muro.x_braces,
          muro.tipo_construccion
        )
      )
    );

    console.log('[CALCULOS] Todos los muros actualizados');

    res.json({
      success: true,
      muros_actualizados: actualizaciones.length,
      valores_aplicados: { angulo_brace, npt },
      message: `Valores aplicados a ${actualizaciones.length} muros`
    });

  } catch (error) {
    console.error('Error aplicando valores globales:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};