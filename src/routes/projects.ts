import { Router } from "express";
import { InputSchema, calcularEstructural } from "../services/estructural.js";
import { randomUUID } from "crypto";

type Proj = { id: string; name: string; params: any; result: any; createdAt: string; };
const store = new Map<string, Proj>();
const router = Router();

router.post("/", (req, res) => {
  try {
    const name = req.body?.name ?? "Proyecto sin nombre";
    const params = InputSchema.parse(req.body?.params);
    const result = calcularEstructural(params);
    const id = randomUUID();
    const proj: Proj = { id, name, params, result, createdAt: new Date().toISOString() };
    store.set(id, proj);
    res.status(201).json(proj);
  } catch (e:any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/:id", (req, res) => {
  const p = store.get(req.params.id);
  if (!p) return res.status(404).json({ error: "Proyecto no encontrado" });
  res.json(p);
});

router.get("/", (_req, res) => {
  res.json([...store.values()]);
});

export default router;
