import { addMuro } from "../models/Muro";
import { overrideMuros } from "../models/Muro";

export function parseTxtRobusto(txt: string) {
  console.log('[service - importService] parseTxtRobusto - Inicio');
  console.log('[service - importService] Tamaño del archivo:', txt.length, 'caracteres');

  const raw = txt.trim();
  if (!raw) {
    console.log('[service - importService] Error: Archivo vacío');
    throw new Error('El archivo está vacío o no contiene datos válidos.');
  }

  console.log('[service - importService] Ejecutando overrideMuros(1)');
  overrideMuros(1); // pk_proyecto fijo por ahora

  const lines = raw.split(/\r?\n/);
  console.log('[service - importService] Número de líneas encontradas:', lines.length);
  const paneles: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    console.log(`[service - importService] Procesando línea ${i + 1}:`, line.substring(0, 50) + (line.length > 50 ? '...' : ''));
    
    if (!line || !line.startsWith('(')) {
      console.log(`[service - importService] Línea ${i + 1} omitida (vacía o formato incorrecto)`);
      continue;
    }

    const fixed = line.replace(/(\d),(\d)/g, "$1.$2");
    let cols = fixed.split(',').map(x => x.trim());
    while (cols.length < 6) cols.push(null);
    cols = cols.slice(0, 6);

    let [numId, grosor, area, peso, volumen, extra] = cols;
    let num = null, id_muro = null;
    const m = /^\((\d+)\)\s*([A-Za-z0-9]+)/.exec(numId || "");
    if (!m) continue;
    num = Number(m[1]);
    id_muro = m[2];

    paneles.push({
      num,
      id_muro,
      grosor: grosor ? parseFloat(grosor.replace(',', '.')) : null,
      area: area ? parseFloat(area.replace(',', '.')) : null,
      peso: peso ? parseFloat(peso.replace(',', '.')) : null,
      volumen: volumen ? parseFloat(volumen.replace(',', '.')) : null,
    });

    const nuevoMuro = addMuro(
        1,          // pk_proyecto
        id_muro,
        parseFloat(grosor),
        parseFloat(area),
        parseFloat(peso),
        parseFloat(volumen)
    );
  }

  console.log('[service - importService] Procesamiento completado');
  console.log('[service - importService] Total de paneles procesados:', paneles.length);

  if (paneles.length === 0) {
    console.log('[service - importService] Error: No se encontraron paneles válidos');
    throw new Error('No se encontraron paneles en el archivo.');
  }
  if (paneles.length > 5000) {
    console.log('[service - importService] Advertencia: Demasiados paneles:', paneles.length);
    throw new Error("El archivo excede el máximo permitido de 5000 filas.");
  }

  console.log('[service - importService] Resultado final:', JSON.stringify(paneles.slice(0, 3), null, 2), paneles.length > 3 ? '...' : '');
  return paneles;
}

export function removeTXT() {
    console.log('[service - importService] removeTXT - Inicio');
    console.log('[service - importService] Ejecutando overrideMuros(1)');
    const resultado = overrideMuros(1); // pk_proyecto fijo por ahora
    console.log('[service - importService] removeTXT completado');
    return resultado;
}