"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputSchema = void 0;
exports.calcularCargasBasicas = calcularCargasBasicas;
exports.dimensionarMuertos = dimensionarMuertos;
exports.calcularEstructural = calcularEstructural;
const zod_1 = require("zod");
/** Esquema de entrada genérico para cálculos estructurales PuntaLink. */
exports.InputSchema = zod_1.z.object({
    // Datos climáticos y geométricos mínimos de ejemplo
    velocidadViento: zod_1.z.number().positive().describe('m/s'),
    coefForma: zod_1.z.number().positive().default(1.2),
    areaExpuesta: zod_1.z.number().positive().describe('m^2'),
    alturaPanel: zod_1.z.number().positive().describe('m'),
    anchoPanel: zod_1.z.number().positive().describe('m'),
    densidadHormigon: zod_1.z.number().positive().default(2400).describe('kg/m^3'),
    seguridad: zod_1.z.number().positive().default(1.5)
});
/** Carga de viento (simplificada): q = 1/2 * rho * V^2; con rho aire ~ 1.225 kg/m3
 *  Fuerza: F = q * Cd * A
 */
function calcularCargasBasicas(input) {
    const rho = 1.225;
    const q = 0.5 * rho * input.velocidadViento ** 2; // Pa
    const F = q * input.coefForma * input.areaExpuesta; // N
    return { q, F };
}
/** Dimensionamiento de "muertos" (muy simplificado a modo de plantilla).
 *  Carga de diseño = F * factor seguridad. Dimensionamos masa total para contrarrestar.
 */
function dimensionarMuertos(input, fuerzaViento_N) {
    const cargaDiseno = fuerzaViento_N * input.seguridad; // N
    const g = 9.81;
    // Meta: masa_total * g >= cargaDiseno
    const masaNecesaria = cargaDiseno / g; // kg
    // Propuesta: 2 cilindros + 2 bloques (50/50) como ejemplo básico
    const masaCilindros = 0.5 * masaNecesaria;
    const masaBloques = 0.5 * masaNecesaria;
    const cil_masa = 200; // kg por cilindro (ejemplo)
    const blk_masa = 150; // kg por bloque (ejemplo)
    const nCil = Math.max(1, Math.ceil(masaCilindros / cil_masa));
    const nBlk = Math.max(1, Math.ceil(masaBloques / blk_masa));
    return [
        { tipo: 'cilindrico', masa_kg: cil_masa, cantidad: nCil, comentario: 'Placeholder: ajustar a catálogo real' },
        { tipo: 'aislado', masa_kg: blk_masa, cantidad: nBlk, comentario: 'Placeholder: ajustar a catálogo real' }
    ];
}
function calcularEstructural(input) {
    const { q, F } = calcularCargasBasicas(input);
    const cargaDiseno = F * input.seguridad;
    const muertos = dimensionarMuertos(input, F);
    return {
        presionViento_Pa: q,
        fuerzaViento_N: F,
        cargaDiseño_N: cargaDiseno,
        muertos
    };
}
