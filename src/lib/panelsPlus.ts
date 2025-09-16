// src/lib/panelsPlus.ts
export type PanelRow = {
  Panel: string;      // "P115" o "" si no viene
  Thickness: number;  // mm
  Area: number;       // m^2
  Weight: number;     // t
  Volume: number;     // m^3
};

/** Convierte cadenas numéricas usando coma decimal y posibles puntos de miles. */
function toNumber(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return NaN;
  // si trae coma decimal, asumimos '.' son miles => los quitamos
  const hasComma = trimmed.includes(',');
  const cleaned = hasComma
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed.replace(/\s+/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/** Paso 1: Limpieza del texto crudo */
export function sanitizePanelsPlusText(txt: string): string {
  return txt
    .replace(/\r\n?/g, '\n')        // normaliza saltos
    .replace(/\t+/g, ' ')           // tabs -> espacio
    .replace(/[^\S\n]+/g, ' ')      // colapsa espacios repetidos
    .replace(/[ \t]+,/, ',')        // espacio antes de coma
    .replace(/,+\s*$/gm, '')        // remueve comas al final de línea
    .trim();
}

/** Heurística simple para reconocer reportes Panels Plus */
export function isPanelsPlusReport(txt: string): boolean {
  return /Panels\s+Plus/i.test(txt);
}

/** Paso 2: Extrae filas válidas del reporte ya limpiado.
 * Captura líneas del tipo:
 *   (1) P115 , 203, 66,0, 32,1, 13,4
 *   (110)       , 203, 37,1, 18,1, 7,5
 */
export function parsePanelsPlusReport(raw: string): PanelRow[] {
  const txt = sanitizePanelsPlusText(raw);

  const lines = txt.split('\n');
  const out: PanelRow[] = [];

  // Regex tolerante:
  //  (n)  <panel opcional> , thickness , area , weight , volume
  const lineRe = /^\s*\(\d+\)\s*([A-Z0-9]+)?\s*,\s*([\d.,]+)\s*,\s*([\d.,]+)\s*,\s*([\d.,]+)\s*,\s*([\d.,]+)/i;

  for (const ln of lines) {
    // Filtra claramente cabeceras y separadores
    if (
      /={6,}|-{6,}|\bTotals?\b|\bPanel\s+Properties\b/i.test(ln) ||
      /^\s*$/.test(ln)
    ) continue;

    const m = ln.match(lineRe);
    if (!m) continue;

    const [, panelMaybe, thickness, area, weight, volume] = m;
    const row: PanelRow = {
      Panel: (panelMaybe ?? '').trim(),
      Thickness: toNumber(thickness),
      Area: toNumber(area),
      Weight: toNumber(weight),
      Volume: toNumber(volume),
    };

    // Valida numéricos
    if (
      Number.isFinite(row.Thickness) &&
      Number.isFinite(row.Area) &&
      Number.isFinite(row.Weight) &&
      Number.isFinite(row.Volume)
    ) {
      out.push(row);
    }
  }
  return out;
}

/** Atajo: parsea y devuelve payload estándar para el front */
export function extractPanelsPlusPayload(raw: string) {
  const rows = parsePanelsPlusReport(raw);
  return {
    kind: 'panelsplus' as const,
    headers: ['Panel', 'Thickness', 'Area', 'Weight', 'Volume'],
    rows,
    count: rows.length,
  };
}
