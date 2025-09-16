import { Router } from "express";
import { z } from "zod";

export const ParamsSchema = z.object({
  velocidadViento: z.object({
    valor: z.number().positive(),
    unidad: z.enum(["m/s","km/h"]).default("m/s")
  }),
  coefForma: z.number().positive().default(1.2),
  areaExpuesta: z.number().positive(),
  altoPanel: z.number().positive(),
  anchoPanel: z.number().positive(),
  seguridad: z.number().positive().default(1.5)
});

const router = Router();

router.post("/", (req, res) => {
  try {
    const p = ParamsSchema.parse(req.body);
    // normalizo V a m/s
    const Vms = p.velocidadViento.unidad === "km/h" ? p.velocidadViento.valor/3.6 : p.velocidadViento.valor;
    res.json({ ...p, velocidadViento_ms: Vms });
  } catch (e:any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
