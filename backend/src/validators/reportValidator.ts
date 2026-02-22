import { z } from 'zod';

export const ReportFormatSchema = z.enum(['pdf', 'docx']);

const PanelSchema = z.object({
  id_muro: z.string().optional(),
  idMuro: z.string().optional(),
  volumen_m3: z.number().optional(),
  peso_kN: z.number().optional(),
  grua_min_kN_aprox: z.number().optional(),
  fuerza_kN: z.number().optional(),
  traccion_puntal_kN_aprox: z.number().optional(),
  grosor: z.coerce.number().optional(),
  area: z.coerce.number().optional(),
  grados_inclinacion_brace: z.number().optional(),
  modelo_brace: z.string().optional(),
  fbx: z.number().optional(),
  fby: z.number().optional(),
  fb: z.number().optional(),
  total_braces: z.number().optional(),
}).passthrough().refine(
  (data) => !!(data.id_muro || data.idMuro),
  { message: 'Cada panel debe tener un identificador (id_muro o idMuro)' }
);

const ProjectInfoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del proyecto es obligatorio'),
}).passthrough();

const MuertoResumenSchema = z.object({
  numero: z.string(),
  muerto: z.string(),
}).passthrough();

const RawMacizoSchema = z.object({}).passthrough();

const ConfigArmadoSchema = z.object({}).passthrough();

export const GenerarInformeSchema = z.object({
  format: ReportFormatSchema.default('pdf'),
  paneles: z.array(PanelSchema).default([]),
  projectInfo: ProjectInfoSchema,
  tablaMuertos: z.array(MuertoResumenSchema).optional(),
  reporteMacizos: z.array(RawMacizoSchema).optional(),
  configArmado: ConfigArmadoSchema.optional(),
});

export type GenerarInformeInput = z.infer<typeof GenerarInformeSchema>;
