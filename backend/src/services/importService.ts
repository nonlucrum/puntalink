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
  const panelNumbers: number[] = []; // Para contar los números de paneles procesados

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    console.log(`[service - importService] Procesando línea ${i + 1}:`, line.substring(0, 80) + (line.length > 80 ? '...' : ''));
    
    if (!line || !line.startsWith('(')) {
      console.log(`[service - importService] Línea ${i + 1} omitida (vacía o formato incorrecto)`);
      continue;
    }

    // Dividir por comas para obtener todas las columnas
    const parts = line.split(',').map(part => part.trim());
    console.log(`[service - importService] Línea ${i + 1} tiene ${parts.length} columnas`);
    
    if (parts.length < 12) {
      console.log(`[service - importService] Línea ${i + 1} omitida - muy pocas columnas (${parts.length} < 12)`);
      continue;
    }

    // Extraer datos según el formato real del reporte:
    // (1) M01, 210, 17,0, 8,6, 3,6, 750, 5677, 4, , , , Yes, , 1500, 11354
    // Pos:  0     1    2    3    4    5    6    7  8 9 10 11  12 13   14    15
    const panelIdCol = parts[0];      // "(1) M01"
    const grosorCol = parts[1];       // "210"
    const areaCol = parts[2];         // "17,0"
    const pesoCol = parts[3];         // "8,6" (Weight en toneladas)
    const volumenCol = parts[4];      // "3,6" (Volume)
    // CGx = parts[5], CGy = parts[6], luego más datos...
    // Overall Width = parts[14], Overall Height = parts[15]
    const overallHeightCol = parts.length >= 16 ? parts[15] : null; // Columna 16 (índice 15)

    // Debug: mostrar los primeros valores para verificar
    console.log(`[service - importService] Debug - grosor:"${grosorCol}", area:"${areaCol}", peso:"${pesoCol}", volumen:"${volumenCol}", height:"${overallHeightCol}"`);

    // Patrón mejorado para extraer número y nombre del panel
    const panelMatch = /^\((\d+)\)\s*(.*)/.exec(panelIdCol || "");
    if (!panelMatch) {
      console.log(`[service - importService] Línea ${i + 1} omitida - no se pudo extraer número de panel`);
      continue;
    }
    
    const num = Number(panelMatch[1]);
    let panelName = panelMatch[2].trim();
    
    // Si no tiene nombre o está vacío, asignar "S/N" (Sin Nombre)
    if (!panelName || panelName === '') {
      panelName = 'S/N';
      console.log(`[service - importService] Panel ${num} sin nombre - asignado como: ${panelName}`);
    }

    // Convertir valores numéricos (reemplazar comas por puntos para decimales)
    const grosorNum = grosorCol ? parseFloat(grosorCol.replace(',', '.')) : null;
    const areaNum = areaCol ? parseFloat(areaCol.replace(',', '.')) : null;
    const pesoNum = pesoCol ? parseFloat(pesoCol.replace(',', '.')) : null;
    const volumenNum = volumenCol ? parseFloat(volumenCol.replace(',', '.')) : null;
    
    // Para Overall Height, guardar en bruto como texto
    let overallHeightValue = overallHeightCol?.trim() || "S/N";
    if (overallHeightValue === "") {
      overallHeightValue = "S/N";
    }

    // Validar que tenemos los datos mínimos necesarios (solo las 4 columnas principales)
    if (!grosorNum || !areaNum || !pesoNum || !volumenNum) {
      console.log(`[service - importService] Panel ${num} (${panelName}) omitido - datos numéricos faltantes o inválidos`);
      console.log(`[service - importService] grosor:${grosorNum}, area:${areaNum}, peso:${pesoNum}, volumen:${volumenNum}`);
      continue;
    }

    console.log(`[service - importService] Panel ${num} procesado exitosamente: ${panelName}, Overall Height: ${overallHeightValue}`);

    // Agregar número del panel al array de conteo
    panelNumbers.push(num);

    paneles.push({
      num,
      id_muro: panelName,
      grosor: grosorNum,
      area: areaNum,
      peso: pesoNum,
      volumen: volumenNum,
      overall_height: overallHeightValue,
    });

    const nuevoMuro = addMuro(
        1,          // pk_proyecto
        panelName,
        grosorNum,
        areaNum,
        pesoNum,
        volumenNum,
        overallHeightValue
    );
  }

  console.log('[service - importService] Procesamiento completado');
  console.log('[service - importService] Total de paneles procesados:', paneles.length);
  
  // Análisis de números de paneles
  if (panelNumbers.length > 0) {
    const minPanel = Math.min(...panelNumbers);
    const maxPanel = Math.max(...panelNumbers);
    console.log(`[service - importService] Rango de paneles: ${minPanel} a ${maxPanel}`);
    console.log(`[service - importService] Se esperaban ${maxPanel} paneles, se procesaron ${panelNumbers.length}`);
    
    if (panelNumbers.length !== maxPanel) {
      const missingPanels = [];
      for (let i = minPanel; i <= maxPanel; i++) {
        if (!panelNumbers.includes(i)) {
          missingPanels.push(i);
        }
      }
      console.log(`[service - importService] Paneles faltantes: ${missingPanels.slice(0, 10).join(', ')}${missingPanels.length > 10 ? ' y ' + (missingPanels.length - 10) + ' más...' : ''}`);
    } else {
      console.log(`[service - importService] ✅ Todos los paneles fueron procesados correctamente!`);
    }
  }

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