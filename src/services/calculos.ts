import { z } from 'zod';

export const DataPointSchema = z.object({
  Variable: z.number(),
  Frecuencia: z.number().positive()
});
export type DataPoint = z.infer<typeof DataPointSchema>;

export type ResumenCalculos = {
  total: number;
  media: number;
  mediana: number;
  moda: number[];
  minimo: number;
  maximo: number;
  rango: number;
  varianza: number;
  desviacionEstandar: number;
  frecuencias: Array<{
    variable: number;
    frecuencia: number;
    frecuenciaRelativa: number;
    frecuenciaAcumulada: number;
    frecuenciaRelAcumulada: number;
  }>;
};

export function parseNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/\./g, '').replace(',', '.'));
    if (!Number.isNaN(n)) return n;
  }
  throw new Error(`Valor no numérico: ${v}`);
}

export function describir(datos: Array<{ Variable: unknown; Frecuencia: unknown }>): ResumenCalculos {
  const parsed: DataPoint[] = datos
    .map(d => ({ Variable: parseNumber(d.Variable), Frecuencia: parseNumber(d.Frecuencia) }))
    .filter(d => Number.isFinite(d.Variable) && Number.isFinite(d.Frecuencia) && d.Frecuencia > 0);

  if (!parsed.length) {
    throw new Error('No hay datos válidos para calcular');
  }

  // Expandimos según frecuencia para calcular estadísticos
  const expanded: number[] = [];
  for (const { Variable, Frecuencia } of parsed) {
    for (let i = 0; i < Frecuencia; i++) expanded.push(Variable);
  }
  expanded.sort((a, b) => a - b);
  const n = expanded.length;

  const media = expanded.reduce((a, b) => a + b, 0) / n;
  const mediana = n % 2 ? expanded[(n - 1) / 2] : (expanded[n / 2 - 1] + expanded[n / 2]) / 2;

  // Moda(s)
  const counts = new Map<number, number>();
  for (const x of expanded) counts.set(x, (counts.get(x) ?? 0) + 1);
  let maxCount = 0;
  for (const c of counts.values()) maxCount = Math.max(maxCount, c);
  const moda = [...counts.entries()].filter(([, c]) => c === maxCount).map(([x]) => x);

  const minimo = expanded[0];
  const maximo = expanded[expanded.length - 1];
  const rango = maximo - minimo;
  const varianza = expanded.reduce((acc, x) => acc + (x - media) ** 2, 0) / (n - 1);
  const desviacionEstandar = Math.sqrt(varianza);

  // Frecuencias
  let acum = 0;
  const totalObservaciones = n;
  const frecuencias = parsed
    .sort((a, b) => a.Variable - b.Variable)
    .map(({ Variable, Frecuencia }) => {
      acum += Frecuencia;
      const fr = Frecuencia / totalObservaciones;
      const fra = acum / totalObservaciones;
      return {
        variable: Variable,
        frecuencia: Frecuencia,
        frecuenciaRelativa: fr,
        frecuenciaAcumulada: acum,
        frecuenciaRelAcumulada: fra
      };
    });

  return { total: totalObservaciones, media, mediana, moda, minimo, maximo, rango, varianza, desviacionEstandar, frecuencias };
}
