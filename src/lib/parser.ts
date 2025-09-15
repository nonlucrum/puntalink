/**
 * Parser para archivos .txt o .csv con estructura tipo:
 *   Panel, Thickness, Area, Length, ...
 * Acepta encabezado y filas separadas por coma o tabulación.
 */
export type PanelRow = {
  Panel: string;
  Thickness: number;
  Area?: number;
  Length?: number;
  [k: string]: string | number | undefined;
};

const numberish = (v: string): number | undefined => {
  if (!v) return undefined;
  // Soporta coma decimal
  const n = Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

export function parsePanelsText(input: string): PanelRow[] {
  const raw = input.replace(/\r\n?/g, '\n').trim();
  const lines = raw.split('\n').filter(Boolean);
  if (!lines.length) return [];

  // Detectar separador por línea de encabezado
  const headerLine = lines[0];
  const sep = headerLine.includes('\t') ? '\t' : ',';
  const headers = headerLine.split(new RegExp(sep)).map(h => h.trim());

  const rows: PanelRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(new RegExp(sep));
    const row: PanelRow = { Panel: String(cols[0] ?? '').trim(), Thickness: 0 };
    headers.forEach((h, idx) => {
      const key = h.replace(/\s+/g, '_');
      const val = (cols[idx] ?? '').trim();
      const num = numberish(val);
      // Guardamos numérico si aplica, si no, string
      (row as any)[h] = num ?? val;
    });
    // Asegurar Thickness numérico si existe
    const t = (row as any)['Thickness'];
    row.Thickness = typeof t === 'number' ? t : numberish(String(t)) ?? 0;
    rows.push(row);
  }
  return rows;
}
