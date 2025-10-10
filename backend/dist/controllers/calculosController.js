"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculoVientoMuros = exports.parametrosVientoDefecto = void 0;
const calculosService_1 = require("../services/calculosService");
/**
 * Sección 1: Obtener parámetros por defecto para cálculo de viento
 * GET /api/calculos/viento/parametros-defecto
 * Basado en Excel "braces" sheet valores típicos
 */
const parametrosVientoDefecto = async (req, res) => {
    try {
        const parametros = (0, calculosService_1.getParametrosVientoDefecto)();
        const categoriasTerreno = (0, calculosService_1.getParametrosTerreno)();
        // Permitir override de categoría de terreno vía query parameter
        const categoria = req.query.categoria;
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
    }
    catch (error) {
        console.error('Error obteniendo parámetros de viento por defecto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.parametrosVientoDefecto = parametrosVientoDefecto;
/**
 * Sección 1-2: Calcular cargas de viento en muros
 * POST /api/calculos/viento/calcular-muros
 * Implementa todas las fórmulas del diagrama Fase 1 y 2
 */
const calculoVientoMuros = async (req, res) => {
    try {
        console.log('[CALCULOS] Iniciando cálculo de viento en muros');
        console.log('[CALCULOS] Headers:', req.headers['content-type']);
        console.log('[CALCULOS] Body keys:', Object.keys(req.body));
        const { muros, parametros } = req.body;
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
            const valor = parametros[param];
            const tipoValor = typeof valor;
            console.log(`[CALCULOS] Validando ${param}: valor=${valor}, tipo=${tipoValor}`);
            if (!(param in parametros) || typeof parametros[param] !== 'number') {
                console.log(`[CALCULOS] ERROR: Parámetro ${param} faltante o inválido`);
                return res.status(400).json({
                    error: `Parámetro requerido faltante o inválido: ${param}`
                });
            }
        }
        console.log('[CALCULOS] ✅ Todos los parámetros validados correctamente');
        // ✅ VERIFICAR: Mostrar los valores exactos que se van a usar para Factor G
        console.log('[CALCULOS] 🔍 VERIFICACIÓN FACTOR G:');
        console.log(`[CALCULOS] 🌡️ Temperatura del usuario: ${parametros.temperatura_C}°C`);
        console.log(`[CALCULOS] 📊 Presión del usuario: ${parametros.presion_barometrica_mmHg}mmHg`);
        console.log(`[CALCULOS] 🧮 Cálculo manual Factor G: (0.392 × ${parametros.presion_barometrica_mmHg}) / (273 + ${parametros.temperatura_C})`);
        console.log(`[CALCULOS] 🧮 = ${0.392 * parametros.presion_barometrica_mmHg} / ${273 + parametros.temperatura_C}`);
        console.log(`[CALCULOS] 🧮 = ${(0.392 * parametros.presion_barometrica_mmHg) / (273 + parametros.temperatura_C)}`);
        // Calcular viento para todos los muros - AHORA SIN EL PARÁMETRO NULL
        const resultados = (0, calculosService_1.calcularVientoMuros)(muros, parametros);
        // DEBUG: Verificar el primer resultado
        console.log('[CALCULOS DEBUG] Primer resultado completo:', resultados[0]);
        console.log('[CALCULOS DEBUG] Factor G del primer resultado:', resultados[0]?.G);
        console.log('[CALCULOS DEBUG] Alpha del primer resultado:', resultados[0]?.alpha);
        console.log('[CALCULOS DEBUG] Delta del primer resultado:', resultados[0]?.delta);
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
    }
    catch (error) {
        console.error('Error en cálculo de viento de muros:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.calculoVientoMuros = calculoVientoMuros;
