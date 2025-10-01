"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTxtRobusto = parseTxtRobusto;
exports.removeTXT = removeTXT;
const Muro_1 = require("../models/Muro");
const Muro_2 = require("../models/Muro");
function parseTxtRobusto(txt) {
    console.log('[service - importService] parseTxtRobusto - Inicio');
    console.log('[service - importService] Tamaño del archivo:', txt.length, 'caracteres');
    const raw = txt.trim();
    if (!raw) {
        console.log('[service - importService] Error: Archivo vacío');
        throw new Error('El archivo está vacío o no contiene datos válidos.');
    }
    console.log('[service - importService] Ejecutando overrideMuros(1)');
    (0, Muro_2.overrideMuros)(1); // pk_proyecto fijo por ahora
    const lines = raw.split(/\r?\n/);
    console.log('[service - importService] Número de líneas encontradas:', lines.length);
    const paneles = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        console.log(`[service - importService] Procesando línea ${i + 1}:`, line.substring(0, 50) + (line.length > 50 ? '...' : ''));
        if (!line || !line.startsWith('(')) {
            console.log(`[service - importService] Línea ${i + 1} omitida (vacía o formato incorrecto)`);
            continue;
        }
        const fixed = line.replace(/(\d),(\d)/g, "$1.$2");
        let cols = fixed.split(',').map(x => x.trim());
        while (cols.length < 6)
            cols.push(null);
        cols = cols.slice(0, 6);
        let [numId, grosor, area, peso, volumen, extra] = cols;
        let num = null, id_muro = null;
        // Patrón mejorado para extraer número y nombre del panel
        const panelMatch = /^\((\d+)\)\s*(.*)/.exec(numId || "");
        if (!panelMatch) {
            console.log(`[service - importService] Línea ${i + 1} omitida - no se pudo extraer número de panel`);
            continue;
        }
        num = Number(panelMatch[1]);
        let panelName = panelMatch[2].trim();
        // Si no tiene nombre o está vacío, asignar "S/N" (Sin Nombre)
        if (!panelName || panelName === '') {
            id_muro = 'S/N';
            console.log(`[service - importService] Panel ${num} sin nombre - asignado como: ${id_muro}`);
        }
        else {
            // Si tiene nombre, usarlo tal como está
            id_muro = panelName;
        }
        // Validar que tenemos los datos mínimos necesarios
        const grosorNum = grosor ? parseFloat(grosor.replace(',', '.')) : null;
        const areaNum = area ? parseFloat(area.replace(',', '.')) : null;
        const pesoNum = peso ? parseFloat(peso.replace(',', '.')) : null;
        const volumenNum = volumen ? parseFloat(volumen.replace(',', '.')) : null;
        if (!grosorNum || !areaNum || !pesoNum || !volumenNum) {
            console.log(`[service - importService] Panel ${num} (${id_muro}) omitido - datos numéricos faltantes o inválidos`);
            continue;
        }
        console.log(`[service - importService] Panel ${num} procesado exitosamente: ${id_muro}`);
        paneles.push({
            num,
            id_muro,
            grosor: grosorNum,
            area: areaNum,
            peso: pesoNum,
            volumen: volumenNum,
        });
        const nuevoMuro = (0, Muro_1.addMuro)(1, // pk_proyecto
        id_muro, grosorNum, areaNum, pesoNum, volumenNum);
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
function removeTXT() {
    console.log('[service - importService] removeTXT - Inicio');
    console.log('[service - importService] Ejecutando overrideMuros(1)');
    const resultado = (0, Muro_2.overrideMuros)(1); // pk_proyecto fijo por ahora
    console.log('[service - importService] removeTXT completado');
    return resultado;
}
