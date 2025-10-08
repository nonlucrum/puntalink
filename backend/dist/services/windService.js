"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateArea = calculateArea;
exports.calculateVolume = calculateVolume;
exports.calculateWeight = calculateWeight;
exports.calculateFrz = calculateFrz;
exports.calculateFalpha = calculateFalpha;
exports.calculateVd = calculateVd;
exports.calculateCorrection = calculateCorrection;
exports.calculateQz = calculateQz;
exports.calculatePressure = calculatePressure;
exports.calculateForce = calculateForce;
exports.calcularVientoMuro = calcularVientoMuro;
exports.calcularVientoMuros = calcularVientoMuros;
exports.getParametrosVientoDefecto = getParametrosVientoDefecto;
/**
 * Sección 1 - Paso a) Definir/Importar/Editar Datos del Muro
 * Basado en Excel sheet "Muros" y "Hoja1"
 */
// Fórmula: Área = Alto (max) × Ancho (max)
// Excel: Sheet "Muros" row4, sheet "Hoja1" row2
// PDF: Tomo III secc. 8.2.1
function calculateArea(height, width) {
    return height * width;
}
// Fórmula: Volumen = Área × Espesor
// Excel: Sheet "Muros" row3, sheet "Hoja1" row2
// PDF: Handbook p.2
function calculateVolume(area, thickness) {
    return area * thickness;
}
// Fórmula: Peso = Volumen × ρ / 1000 (convertir a toneladas)
// Excel: Sheet "Muros" row5, sheet "Hoja1" row2
// PDF: Handbook p.2 (ρ = 2400 kg/m³)
function calculateWeight(volume, density = 2400) {
    return (volume * density) / 1000; // toneladas
}
/**
 * Sección 1 - Paso b) Datos Requeridos para Definir Carga de Viento (Norma)
 * Basado en Excel sheet "braces" row11 y PDFs Tomo III
 */
// Fórmula: Frz = (z / 10)^α × β
// Excel: Sheet "braces" row11 (1.0416 implícito en Vd calc)
// PDF: Tomo III secc. 6.3.2
function calculateFrz(height, alpha, beta) {
    return Math.pow(height / 10, alpha) * beta;
}
// Fórmula: Fα = FC × Frz × FT
// Excel: Sheet "braces" row11 (1.0416 implícito)
// PDF: Tomo III secc. 6.3
function calculateFalpha(FC, Frz, FT) {
    return FC * Frz * FT;
}
// Fórmula: Vd = Vregional × Fα
// Excel: Sheet "braces" row11 (133.32 km/h)
// PDF: Tomo III secc. 6.2
function calculateVd(Vregional, Falpha) {
    return Vregional * Falpha;
}
// Fórmula: Corrección = (273 + T) / (273 + 15) × (P / 760)
// Excel: Sheet "braces" row11 (0.9832)
// PDF: Tomo III secc. 7
function calculateCorrection(temperatura_C, presion_mmHg) {
    return ((273 + temperatura_C) / (273 + 15)) * (presion_mmHg / 760);
}
// Fórmula: qz = 0.5 × ρ_aire × Corrección × (Vd / 3.6)^2 / 1000
// Excel: Sheet "braces" row11 (0.8229 kPa)
// PDF: Tomo III secc. 7
function calculateQz(correccion, Vd_kmh) {
    const rho_aire = 1.225; // kg/m³ a nivel del mar
    const Vd_ms = Vd_kmh / 3.6; // conversión a m/s
    return (0.5 * rho_aire * correccion * Math.pow(Vd_ms, 2)) / 1000; // kPa
}
// Fórmula: Presión = qz × (Cpint - Cpext) × Factor
// Excel: Sheet "braces" row11 (6.711 kPa implícito)
// PDF: Tomo III secc. 8.2.2 (Cp ext=0.8, Cp int=-0.5)
function calculatePressure(qz, Cpint, Cpext, factor) {
    return qz * (Cpint - Cpext) * factor;
}
// Fórmula: Fuerza = Presión × Área
// Excel: No explícito, derivado de row11
// PDF: Tomo III secc. 8.2.1
function calculateForce(presion_kPa, area_m2) {
    return presion_kPa * area_m2; // kN
}
/**
 * Función principal para calcular viento en un muro
 * Implementa todas las fórmulas del diagrama Fase 1 y 2
 */
function calcularVientoMuro(muro, parametros) {
    const advertencias = [];
    // Paso a) Datos del Muro (ya están en el objeto muro importado del TXT)
    const area_m2 = muro.area || 0;
    const peso_ton = muro.peso || 0;
    // Para altura, usamos estimación o cálculo aproximado
    // Excel típico: altura ≈ sqrt(area) para muros cuadrados, o usar parámetro
    let altura_z_m = parametros.altura_estimada_m;
    if (!altura_z_m) {
        // Estimación: asumir proporción típica de muro Tilt-Up (altura ≈ sqrt(area))
        // Basado en Excel "Hoja1" donde muros de ~50m² tienen ~6m altura
        altura_z_m = Math.sqrt(area_m2 * 0.72); // Factor empírico Excel
        if (altura_z_m < 3)
            altura_z_m = 6; // Altura mínima típica Tilt-Up
        advertencias.push(`Altura estimada como ${altura_z_m.toFixed(1)}m. Para mayor precisión, proporcione altura real.`);
    }
    // Paso b) Cálculos de Viento según Tomo III
    // Factor de rugosidad por altura: Frz = (z / 10)^α × β
    const Frz = calculateFrz(altura_z_m, parametros.alpha, parametros.beta);
    // Factor de exposición: Fα = FC × Frz × FT
    const Falpha = calculateFalpha(parametros.FC, Frz, parametros.FT);
    // Velocidad de diseño: Vd = Vregional × Fα
    const Vd_kmh = calculateVd(parametros.VR_kmh, Falpha);
    // Corrección por temperatura y presión
    const correccion = calculateCorrection(parametros.temperatura_C, parametros.presion_barometrica_mmHg);
    // Presión dinámica: qz = 0.5 × ρ_aire × Corrección × (Vd / 3.6)^2 / 1000
    const qz_kPa = calculateQz(correccion, Vd_kmh);
    // Presión neta: Presión = qz × (Cpint - Cpext) × Factor
    const presion_kPa = calculatePressure(qz_kPa, parametros.Cp_int, parametros.Cp_ext, parametros.factor_succion);
    // Fuerza total: Fuerza = Presión × Área
    const fuerza_kN = calculateForce(presion_kPa, area_m2);
    // Verificaciones según norma
    let requiere_analisis_dinamico = false;
    // Verificar si requiere análisis dinámico (altura > 60m o condiciones especiales)
    if (altura_z_m > 60) {
        requiere_analisis_dinamico = true;
        advertencias.push(`Altura ${altura_z_m}m > 60m: Se requiere análisis dinámico según Tomo III`);
    }
    // Verificar velocidad de diseño
    if (Vd_kmh > 200) {
        advertencias.push(`Velocidad de diseño ${Vd_kmh.toFixed(1)} km/h es muy alta`);
    }
    // Verificar presión
    if (presion_kPa > 2.0) {
        advertencias.push(`Presión ${presion_kPa.toFixed(2)} kPa es elevada, verificar cálculos`);
    }
    return {
        id_muro: muro.id_muro || 'N/A',
        area_m2: +area_m2.toFixed(2),
        peso_ton: +peso_ton.toFixed(2),
        altura_z_m: +altura_z_m.toFixed(2),
        Frz: +Frz.toFixed(4),
        Falpha: +Falpha.toFixed(4),
        Vd_kmh: +Vd_kmh.toFixed(2),
        correccion: +correccion.toFixed(4),
        qz_kPa: +qz_kPa.toFixed(4),
        presion_kPa: +presion_kPa.toFixed(3),
        fuerza_kN: +fuerza_kN.toFixed(2),
        requiere_analisis_dinamico,
        advertencias
    };
}
/**
 * Función para calcular viento en múltiples muros
 * Procesa todos los muros importados del TXT
 */
function calcularVientoMuros(muros, parametros) {
    return muros.map(muro => calcularVientoMuro(muro, parametros));
}
/**
 * Función para obtener parámetros por defecto
 * Basado en Excel "braces" sheet valores típicos
 */
function getParametrosVientoDefecto() {
    return {
        categoria_terreno: 'B', // B - Suburbano (Excel default)
        alpha: 0.15, // Excel "braces" categoría B
        beta: 0.85, // Excel "braces" categoría B  
        VR_kmh: 128, // Excel "braces" row11 (Vregional)
        FT: 1.0, // Excel default (topografía plana)
        FC: 1.0, // Excel default (categoría)
        temperatura_C: 30, // Excel "braces" condiciones típicas
        presion_barometrica_mmHg: 760, // Excel "braces" presión estándar
        Cp_int: -0.5, // Excel "Muros" Tomo III secc. 8.2.2
        Cp_ext: 0.8, // Excel "Muros" Tomo III secc. 8.2.2
        factor_succion: 1.3, // Excel "Muros" row1 factor de seguridad
        densidad_concreto_kg_m3: 2400 // Handbook p.2 estándar
    };
}
