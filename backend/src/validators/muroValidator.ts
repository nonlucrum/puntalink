import { z } from 'zod';

// Schema para un muro manual individual
export const MuroManualSchema = z.object({
  id_muro: z.string().min(1, 'El identificador del muro es obligatorio').max(45),
  tipo_construccion: z.enum(['TILT-UP', 'PRECAZT']).default('TILT-UP'),
  grosor: z.number().positive('El grosor debe ser positivo').max(99999),
  area: z.number().positive('El área debe ser positiva').max(99999),
  peso: z.number().positive('El peso debe ser positivo').max(99999),
  volumen: z.number().positive('El volumen debe ser positivo').max(99999),
  overall_width: z.string().max(50).default('S/N'),
  overall_height: z.string().max(50).refine(
    (val) => val === 'S/N' || (!isNaN(Number(val)) && Number(val) > 0),
    { message: 'La altura debe ser un número positivo o "S/N"' }
  ),
  cgx: z.number().optional(),
  cgy: z.number().optional(),
  angulo_brace: z.number().min(0).max(90).optional(),
  npt: z.number().min(0).optional(),
  eje: z.string().max(50).optional(),
});

// Schema para especificar posición del muro
export const MuroPositionSchema = z.object({
  position: z.enum(['start', 'end', 'after', 'before']).default('end'),
  reference_pid: z.number().positive().optional(),
}).refine(
  (data) => {
    if (data.position === 'after' || data.position === 'before') {
      return data.reference_pid !== undefined;
    }
    return true;
  },
  { message: 'reference_pid es requerido cuando la posición es "after" o "before"' }
);

// Schema para agregar un muro manual
export const AddManualMuroSchema = z.object({
  pk_proyecto: z.number().positive(),
  muro: MuroManualSchema,
  position: MuroPositionSchema.optional(),
});

// Schema para actualizar un muro manual
export const UpdateManualMuroSchema = z.object({
  pk_proyecto: z.number().positive(),
  muro: MuroManualSchema.partial(),
});

// Schema para reordenar muros
export const ReorderMurosSchema = z.object({
  pk_proyecto: z.number().positive(),
  ordering: z.array(z.object({
    pid: z.number().positive(),
    num: z.number().int().positive(),
  })).min(1),
});

// Schema para eliminar un muro
export const DeleteMuroSchema = z.object({
  pk_proyecto: z.number().positive(),
});
