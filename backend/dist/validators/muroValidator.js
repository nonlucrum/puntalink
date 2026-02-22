"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteMuroSchema = exports.ReorderMurosSchema = exports.UpdateManualMuroSchema = exports.AddManualMuroSchema = exports.MuroPositionSchema = exports.MuroManualSchema = void 0;
const zod_1 = require("zod");
// Schema para un muro manual individual
exports.MuroManualSchema = zod_1.z.object({
    id_muro: zod_1.z.string().min(1, 'El identificador del muro es obligatorio').max(45),
    tipo_construccion: zod_1.z.enum(['TILT-UP', 'PRECAZT']).default('TILT-UP'),
    grosor: zod_1.z.number().positive('El grosor debe ser positivo').max(99999),
    area: zod_1.z.number().positive('El área debe ser positiva').max(99999),
    peso: zod_1.z.number().positive('El peso debe ser positivo').max(99999),
    volumen: zod_1.z.number().positive('El volumen debe ser positivo').max(99999),
    overall_width: zod_1.z.string().max(50).default('S/N'),
    overall_height: zod_1.z.string().max(50).refine((val) => val === 'S/N' || (!isNaN(Number(val)) && Number(val) > 0), { message: 'La altura debe ser un número positivo o "S/N"' }),
    cgx: zod_1.z.number().optional(),
    cgy: zod_1.z.number().optional(),
    angulo_brace: zod_1.z.number().min(0).max(90).optional(),
    npt: zod_1.z.number().min(0).optional(),
    eje: zod_1.z.string().max(50).optional(),
});
// Schema para especificar posición del muro
exports.MuroPositionSchema = zod_1.z.object({
    position: zod_1.z.enum(['start', 'end', 'after', 'before']).default('end'),
    reference_pid: zod_1.z.number().positive().optional(),
}).refine((data) => {
    if (data.position === 'after' || data.position === 'before') {
        return data.reference_pid !== undefined;
    }
    return true;
}, { message: 'reference_pid es requerido cuando la posición es "after" o "before"' });
// Schema para agregar un muro manual
exports.AddManualMuroSchema = zod_1.z.object({
    pk_proyecto: zod_1.z.number().positive(),
    muro: exports.MuroManualSchema,
    position: exports.MuroPositionSchema.optional(),
});
// Schema para actualizar un muro manual
exports.UpdateManualMuroSchema = zod_1.z.object({
    pk_proyecto: zod_1.z.number().positive(),
    muro: exports.MuroManualSchema.partial(),
});
// Schema para reordenar muros
exports.ReorderMurosSchema = zod_1.z.object({
    pk_proyecto: zod_1.z.number().positive(),
    ordering: zod_1.z.array(zod_1.z.object({
        pid: zod_1.z.number().positive(),
        num: zod_1.z.number().int().positive(),
    })).min(1),
});
// Schema para eliminar un muro
exports.DeleteMuroSchema = zod_1.z.object({
    pk_proyecto: zod_1.z.number().positive(),
});
