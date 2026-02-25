/**
 * CÁLCULO DE MUERTO CILÍNDRICO - ESTRUCTURA DE 6 PASOS
 * Referencia: "Esquema de cálculos.pdf" y "volnuevo.pdf"
 */

// ================== CONSTANTES ==================
const DENSIDAD_CONCRETO = 2400; // kg/m³ [cite: 216]
const DENSIDAD_ACERO = 7850;    // kg/m³ [cite: 375]
const PESO_VAR_4 = 0.994;       // kg/m (Verticales)
const PESO_VAR_3 = 0.560;       // kg/m (Estribos)
const PRESION_SUELO = 7323.6;   // 1500 psf [cite: 30]

// ================== PASO 1: DEFINIR GEOMETRÍA (H y D) ==================
// [cite: 408] Definir dimensiones: Largo, Alto (h), Ancho (D)
function paso1_Geometria(fuerzaTotal, numMuertos, diametroMm, inputManualMm) {
    let profundidadMm = inputManualMm;

    // Si no hay input manual, calculamos H necesaria (Cálculo de presión)
    if (!profundidadMm || profundidadMm <= 0) {
        const factorSeguridad = 1.5; 
        const cargaDiseño = (fuerzaTotal / numMuertos) * factorSeguridad;
        const diametroM = diametroMm / 1000;
        
        // h = Carga / (D * Presión)
        const h_req_m = cargaDiseño / (diametroM * PRESION_SUELO);
        
        // Ajuste a pasos constructivos (snap a 6" o 150mm)
        profundidadMm = Math.ceil((h_req_m * 1000) / 152.4) * 152.4;
        
        // Restricción mínima: 2 pies (610mm) 
        if (profundidadMm < 610) profundidadMm = 610;
    }

    return { D_mm: diametroMm, H_mm: Math.round(profundidadMm) };
}

// ================== PASO 2: CÁLCULO DE CONCRETO (VOLUMEN) ==================
// [cite: 406] Calcular el Volumen del muerto. V = Área * h
function paso2_Concreto(geo) {
    const r_m = (geo.D_mm / 1000) / 2;
    const h_m = geo.H_mm / 1000;

    // V = π * r² * h 
    const volumen_m3 = Math.PI * Math.pow(r_m, 2) * h_m;
    
    // Peso = Volumen * Densidad [cite: 217]
    const peso_kg = volumen_m3 * DENSIDAD_CONCRETO;

    return { volumen_m3, peso_kg, h_m, r_m }; // Pasamos h_m y r_m para siguientes pasos
}

// ================== PASO 3: ACERO LONGITUDINAL (VERTICAL) ==================
// [cite: 436] Cantidad de varillas y peso
function paso3_AceroLongitudinal(datosPaso2) {
    // Regla Cilíndrico: "4 Barras verticales #4" 
    const cantidad = 4;
    const recubrimientoSupInf = 0.10; // 5cm arriba + 5cm abajo (aprox)
    
    // Longitud varilla ≈ Altura muerto [cite: 457]
    const longitud_m = Math.max(0, datosPaso2.h_m - recubrimientoSupInf);
    
    const peso_total_kg = (cantidad * longitud_m) * PESO_VAR_4;

    return { cantidad, longitud_m, peso_total_kg, desc: "4 varillas #4" };
}

// ================== PASO 4: ACERO TRANSVERSAL (ESTRIBOS) ==================
// [cite: 506] Estribos, espaciado y cantidad
function paso4_AceroTransversal(geo, datosPaso2) {
    // Regla: Separación 250 mm 
    const espaciado_m = 0.25;
    
    // Cantidad = (h / espaciado) + 1 [cite: 508]
    const cantidad = Math.ceil(datosPaso2.h_m / espaciado_m) + 1;
    
    // Longitud Estribo = Perímetro (π * D) + Ganchos [cite: 518]
    const recubrimiento_m = 0.05; // 5cm
    const diametro_estribo = (geo.D_mm / 1000) - (2 * recubrimiento_m);
    const longitud_unit_m = (Math.PI * diametro_estribo) + 0.20; // +20cm traslape

    const peso_total_kg = (cantidad * longitud_unit_m) * PESO_VAR_3;

    return { cantidad, longitud_unit_m, peso_total_kg, desc: "#3 @ 250mm" };
}

// ================== PASO 5: ALAMBRE DE AMARRE ==================
// [cite: 534] Cálculo de nodos y alambre
function paso5_Alambre(longitudinal, transversal) {
    // Nodos = #Varillas_Vert * #Anillos [cite: 539]
    const num_nodos = longitudinal.cantidad * transversal.cantidad;
    
    // Longitud por nudo = 0.35m (promedio) [cite: 541]
    const longitud_total_alambre = num_nodos * 0.35;
    
    // Peso: Volumen * Densidad Acero. (Diametro alambre aprox 1.22mm) [cite: 547]
    const radio_alambre = 0.00122 / 2;
    const vol_alambre = Math.PI * Math.pow(radio_alambre, 2) * longitud_total_alambre;
    
    const peso_kg = vol_alambre * DENSIDAD_ACERO;

    return { num_nodos, peso_kg };
}

// ================== PASO 6: REPORTE FINAL ==================
// [cite: 586] Generar reporte (Output estructurado)
function paso6_GenerarReporte(idMuro, inputs, p2, p3, p4, p5) {
    const cant = inputs.cantidad;

    return {
        id_muro: idMuro,
        input: inputs, // { diametro, profundidad, cantidad }
        unitario: {
            volumen_m3: parseFloat(p2.volumen_m3.toFixed(3)),
            peso_concreto_kg: Math.round(p2.peso_kg),
            acero_long_kg: parseFloat(p3.peso_total_kg.toFixed(2)),
            acero_trans_kg: parseFloat(p4.peso_total_kg.toFixed(2)),
            alambre_kg: parseFloat(p5.peso_kg.toFixed(2)),
            cantBarrasLong: p3.cantidad,
            cantEstribos: p4.cantidad,
            espaciadoLong_cm: 0,
            espaciadoTrans_cm: 25
        },
        total_muro: {
            volumen_total: parseFloat((p2.volumen_m3 * cant).toFixed(2)),
            peso_concreto_ton: parseFloat(((p2.peso_kg * cant) / 1000).toFixed(2)),
            peso_acero_total: parseFloat(((p3.peso_total_kg + p4.peso_total_kg + p5.peso_kg) * cant).toFixed(1))
        }
    };
}

// ================== FUNCIÓN PRINCIPAL (ORQUESTADOR) ==================
export function calcularMacizosCilindricos(listaMuros) {
    return listaMuros.map(muro => {
        const fuerza = parseFloat(muro.fuerza_total || 0);
        const numMuertos = parseInt(muro.cantidad_muertos || 1);
        const diametro = parseFloat(muro.diametro_mm || 914);
        const profManual = parseFloat(muro.profundidad_mm || 0);

        // --- EJECUCIÓN SECUENCIAL DE LOS 6 PASOS ---
        
        // 1. Geometría
        const geo = paso1_Geometria(fuerza, numMuertos, diametro, profManual);
        
        // 2. Concreto
        const conc = paso2_Concreto(geo);
        
        // 3. Acero Longitudinal
        const long = paso3_AceroLongitudinal(conc);
        
        // 4. Acero Transversal
        const trans = paso4_AceroTransversal(geo, conc);
        
        // 5. Alambre
        const alam = paso5_Alambre(long, trans);
        
        // 6. Reporte
        return paso6_GenerarReporte(
            muro.id || "Muro", 
            { diametro: geo.D_mm, profundidad: geo.H_mm, cantidad: numMuertos },
            conc, long, trans, alam
        );
    });
}

// Tabla de capacidades (kg) - Basada en la tabla estándar
const TABLA_CAPACIDADES = {
    610: { 762: 667, 914: 962, 1067: 1311, 1219: 1710, 1524: 2671 },   // 2-0
    762: { 762: 835, 914: 1202, 1067: 1637, 1219: 2136, 1524: 3338 },  // 2-6
    914: { 762: 1002, 914: 1442, 1067: 1964, 1219: 2563, 1524: 4006 }, // 3-0
    1067: { 762: 1170, 914: 1683, 1067: 2291, 1219: 2994, 1524: 4674 }, // 3-6
    1219: { 762: 1338, 914: 1923, 1067: 2617, 1219: 3418, 1524: null }, // 4-0
    1372: { 762: 1501, 914: 2164, 1067: 2944, 1219: 3846, 1524: null }, // 4-6
    1524: { 762: 1669, 914: 2404, 1067: 3307, 1219: 4273, 1524: null }, // 5-0
    1676: { 762: 1837, 914: 2644, 1067: 3597, 1219: null, 1524: null }, // 5-6
    1829: { 762: 2005, 914: 2885, 1067: 3924, 1219: null, 1524: null }, // 6-0
    1981: { 762: 2173, 914: 3125, 1067: 4252, 1219: null, 1524: null }, // 6-6
    2134: { 762: 2336, 914: 3366, 1067: null, 1219: null, 1524: null }, // 7-0
    2286: { 762: 2504, 914: 3606, 1067: null, 1219: null, 1524: null }, // 7-6
    2438: { 762: 2672, 914: 3846, 1067: null, 1219: null, 1524: null }, // 8-0
    2591: { 762: 2839, 914: 4087, 1067: null, 1219: null, 1524: null }, // 8-6
    2743: { 762: 3007, 914: null, 1067: null, 1219: null, 1524: null }  // 9-0
};

// Helper para buscar profundidad por carga y diámetro
export function obtenerProfundidadRecomendada(cargaKg, diametroMm) {
    const profundidades = Object.keys(TABLA_CAPACIDADES).map(Number).sort((a, b) => a - b);
    
    for (const profundidad of profundidades) {
        const capacidad = TABLA_CAPACIDADES[profundidad][diametroMm];
        if (capacidad !== null && capacidad >= cargaKg) {
            return profundidad;
        }
    }
    
    // Si no encuentra, devolver la máxima disponible para ese diámetro
    return profundidades[profundidades.length - 1];
}

// Generador de Tabla HTML (Sin cambios en lógica visual)
export function generarTablaResultadosCilindricos(resultados) {
    if (!resultados || !resultados.length) return '<p class="text-center text-muted">Sin datos.</p>';
    
    let html = `
    <table class="table table-sm table-bordered text-center align-middle" style="font-size:0.85rem;">
        <thead class="table-dark">
            <tr>
                <th>ID</th>
                <th>Diseño (mm)</th>
                <th>Cant.</th>
                <th>Vol. Total (m³)</th>
                <th>Acero Vert. (kg)</th>
                <th>Estribos (kg)</th>
                <th>Alambre (kg)</th> <th>Acero Total (kg)</th>
            </tr>
        </thead>
        <tbody>`;

    let sumVol = 0, sumAcero = 0;

    resultados.forEach(r => {
        const u = r.unitario;
        const cant = r.input.cantidad;
        const t = r.total_muro;
        
        sumVol += t.volumen_total;
        sumAcero += t.peso_acero_total;

        html += `
            <tr>
                <td class="fw-bold">${r.id_muro}</td>
                <td>Ø${r.input.diametro} x ${r.input.profundidad}</td>
                <td>${cant}</td>
                <td class="text-primary fw-bold">${t.volumen_total}</td>
                <td>${(u.acero_long_kg * cant).toFixed(1)}</td>
                <td>${(u.acero_trans_kg * cant).toFixed(1)}</td>
                <td class="text-muted">${(u.alambre_kg * cant).toFixed(2)}</td>
                <td class="fw-bold">${t.peso_acero_total}</td>
            </tr>`;
    });

    html += `</tbody><tfoot><tr class="table-secondary fw-bold">
        <td colspan="3" class="text-end">TOTALES:</td>
        <td class="text-primary">${sumVol.toFixed(2)}</td>
        <td colspan="3"></td>
        <td>${sumAcero.toFixed(1)}</td>
    </tr></tfoot></table>`;
    
    return html;
}