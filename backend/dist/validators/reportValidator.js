"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerarInformeSchema = exports.ReportFormatSchema = void 0;
const zod_1 = require("zod");
exports.ReportFormatSchema = zod_1.z.enum(['pdf', 'docx']);
const PanelSchema = zod_1.z.object({
    id_muro: zod_1.z.string().optional(),
    idMuro: zod_1.z.string().optional(),
    volumen_m3: zod_1.z.number().optional(),
    peso_kN: zod_1.z.number().optional(),
    grua_min_kN_aprox: zod_1.z.number().optional(),
    fuerza_kN: zod_1.z.number().optional(),
    traccion_puntal_kN_aprox: zod_1.z.number().optional(),
    grosor: zod_1.z.coerce.number().optional(),
    area: zod_1.z.coerce.number().optional(),
    grados_inclinacion_brace: zod_1.z.number().optional(),
    modelo_brace: zod_1.z.string().optional(),
    fbx: zod_1.z.number().optional(),
    fby: zod_1.z.number().optional(),
    fb: zod_1.z.number().optional(),
    total_braces: zod_1.z.number().optional(),
}).passthrough().refine((data) => !!(data.id_muro || data.idMuro), { message: 'Cada panel debe tener un identificador (id_muro o idMuro)' });
const ProjectInfoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre del proyecto es obligatorio'),
}).passthrough();
const MuertoResumenSchema = zod_1.z.object({
    numero: zod_1.z.string(),
    muerto: zod_1.z.string(),
}).passthrough();
const RawMacizoSchema = zod_1.z.object({}).passthrough();
const ConfigArmadoSchema = zod_1.z.object({}).passthrough();
exports.GenerarInformeSchema = zod_1.z.object({
    format: exports.ReportFormatSchema.default('pdf'),
    paneles: zod_1.z.array(PanelSchema).default([]),
    projectInfo: ProjectInfoSchema,
    tablaMuertos: zod_1.z.array(MuertoResumenSchema).optional(),
    reporteMacizos: zod_1.z.array(RawMacizoSchema).optional(),
    configArmado: ConfigArmadoSchema.optional(),
});
