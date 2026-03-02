"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePaneles = normalizePaneles;
exports.normalizeArmadoRows = normalizeArmadoRows;
exports.computeTotals = computeTotals;
exports.normalizeArmadoPairs = normalizeArmadoPairs;
exports.computeTotalsFromPairs = computeTotalsFromPairs;
exports.buildReportData = buildReportData;
exports.validateReportCompleteness = validateReportCompleteness;
exports.verifyTotals = verifyTotals;
// === Funciones de construcción ===
function convertirPanelParaPDF(panel) {
    return {
        id_muro: panel.idMuro,
        volumen_m3: panel.volumen_m3,
        peso_kN: panel.peso_kN,
        grua_min_kN_aprox: panel.gruaMin_kN,
        fuerza_kN: panel.fuerza_kN,
        traccion_puntal_kN_aprox: panel.traccionPuntal_kN,
        grosor: panel.grosor,
        area: panel.area
    };
}
function normalizePaneles(paneles) {
    return paneles.map(panel => {
        if ('idMuro' in panel)
            return convertirPanelParaPDF(panel);
        const p = panel;
        const result = panel;
        // Compute volumen_m3 from raw data if not present
        if (!result.volumen_m3 && result.volumen_m3 !== 0) {
            if (p.volumen != null) {
                result.volumen_m3 = Number(p.volumen) || 0;
            }
            else if (p.grosor && p.area) {
                result.volumen_m3 = (Number(p.grosor) || 0) * (Number(p.area) || 0);
            }
        }
        // Compute peso_kN from raw data if not present
        if (!result.peso_kN && result.peso_kN !== 0) {
            if (p.peso != null) {
                result.peso_kN = Number(p.peso) || 0;
            }
            else if (result.volumen_m3) {
                // Concrete density ~24 kN/m³
                result.peso_kN = result.volumen_m3 * 24;
            }
        }
        // Compute grua_min_kN_aprox if not present
        if (!result.grua_min_kN_aprox && result.grua_min_kN_aprox !== 0) {
            if (p.grua_min_kN_aprox != null) {
                result.grua_min_kN_aprox = Number(p.grua_min_kN_aprox) || 0;
            }
            else if (result.peso_kN) {
                result.grua_min_kN_aprox = result.peso_kN * 1.25;
            }
        }
        // Map id_muro from idMuro if needed
        if (!result.id_muro && p.idMuro) {
            result.id_muro = p.idMuro;
        }
        if (!result.id_muro && p.id_muro) {
            result.id_muro = p.id_muro;
        }
        // Map brace fields from raw data
        if (!result.grados_inclinacion_brace && p.angulo_brace != null) {
            result.grados_inclinacion_brace = Number(p.angulo_brace) || undefined;
        }
        if (!result.modelo_brace && p.tipo_brace_seleccionado) {
            result.modelo_brace = p.tipo_brace_seleccionado;
        }
        if (result.fbx == null && p.fbx != null) {
            result.fbx = Number(p.fbx) || undefined;
        }
        if (result.fby == null && p.fby != null) {
            result.fby = Number(p.fby) || undefined;
        }
        if (result.fb == null && p.fb != null) {
            result.fb = Number(p.fb) || undefined;
        }
        if (result.total_braces == null && p.x_braces != null) {
            result.total_braces = Number(p.x_braces) || undefined;
        }
        return result;
    });
}
function normalizeArmadoRows(reporteMacizos, tablaArmado) {
    if (reporteMacizos && Array.isArray(reporteMacizos) && reporteMacizos.length > 0) {
        return reporteMacizos.map((m, i) => ({
            deadman: {
                index: m.grupo_numero || (i + 1),
                eje: String(m.eje || '-'),
                muros: m.muros_list || (m.cantidadMuros ? `${m.cantidadMuros} muros` : ''),
                largo_m: m.largo_total || m.profundidad || 0,
                alto_m: m.alto_total || m.alto || 0,
                ancho_m: m.espesor_bloque || m.ancho || 0
            },
            acero: {
                cantidad: '-',
                longitud_m: (m.longLongitudinal_m || m.longitudTotalLongitudinal || 0) + (m.longEstribos_m || m.longitudTotalTransversal || 0),
                peso_kg: (m.pesoLongitudinal_kg || m.pesoLongitudinal || 0) + (m.pesoEstribos_kg || m.pesoTransversal || 0),
                direccion: 'Long+Est'
            },
            concreto: {
                vol_m3: m.volumenConcreto_m3 || m.volumenConcreto || 0,
                peso_ton: (m.pesoConcreto_kg || m.pesoConcreto || 0) / 1000
            },
            alambre: {
                longitud_m: m.longAlambre_m || m.longitudAlambre || 0,
                peso_kg: m.pesoAlambre_kg || m.pesoAlambre || 0
            }
        }));
    }
    return tablaArmado || [];
}
function computeTotals(rows) {
    const sum = (arr, sel) => arr.reduce((a, it) => a + (Number(sel(it)) || 0), 0);
    const concretoVol_m3 = sum(rows, r => r.concreto.vol_m3);
    const concretoTon = sum(rows, r => r.concreto.peso_ton);
    const aceroKg = sum(rows, r => r.acero.peso_kg);
    const alambreKg = sum(rows, r => r.alambre.peso_kg);
    const metalKg = aceroKg + alambreKg;
    return {
        concreto: { m3: concretoVol_m3, ton: concretoTon },
        acero: { kg: aceroKg, ton: aceroKg / 1000 },
        alambre: { kg: alambreKg, ton: alambreKg / 1000 },
        metal: { kg: metalKg, ton: metalKg / 1000 }
    };
}
function normalizeArmadoPairs(reporteMacizos) {
    if (!reporteMacizos || !Array.isArray(reporteMacizos) || reporteMacizos.length === 0)
        return [];
    return reporteMacizos.map((m, i) => ({
        deadman: {
            index: m.grupo_numero || (i + 1),
            eje: String(m.eje || '-'),
            muros: m.muros_list || (m.cantidadMuros ? `${m.cantidadMuros} muros` : ''),
            largo_m: m.largo_total || m.profundidad || 0,
            alto_m: m.alto_total || m.alto || 0,
            ancho_m: m.espesor_bloque || m.ancho || 0,
        },
        longitudinal: {
            cantBarras: m.cantBarrasLong || 0,
            longitud_m: m.longLongitudinal_m || m.longitudTotalLongitudinal || 0,
            peso_kg: m.pesoLongitudinal_kg || m.pesoLongitudinal || 0,
        },
        transversal: {
            cantEstribos: m.cantEstribos || 0,
            longitud_m: m.longEstribos_m || m.longitudTotalTransversal || 0,
            peso_kg: m.pesoEstribos_kg || m.pesoTransversal || 0,
        },
        concreto: {
            vol_m3: m.volumenConcreto_m3 || m.volumenConcreto || 0,
            peso_ton: (m.pesoConcreto_kg || m.pesoConcreto || 0) / 1000,
        },
        alambre: {
            longitud_m: m.longAlambre_m || m.longitudAlambre || 0,
            peso_kg: m.pesoAlambre_kg || m.pesoAlambre || 0,
        },
        espaciadoLong_m: m.espaciadoLong_m || ((m.espaciadoLong_cm || 0) / 100),
        espaciadoTrans_m: m.espaciadoTrans_m || ((m.espaciadoTrans_cm || 0) / 100),
        x_inserto: m.x_inserto || 0,
    }));
}
function computeTotalsFromPairs(pairs) {
    const sum = (arr, sel) => arr.reduce((a, it) => a + (Number(sel(it)) || 0), 0);
    const concretoVol_m3 = sum(pairs, r => r.concreto.vol_m3);
    const concretoTon = sum(pairs, r => r.concreto.peso_ton);
    const aceroKg = sum(pairs, r => r.longitudinal.peso_kg + r.transversal.peso_kg);
    const alambreKg = sum(pairs, r => r.alambre.peso_kg);
    const metalKg = aceroKg + alambreKg;
    return {
        concreto: { m3: concretoVol_m3, ton: concretoTon },
        acero: { kg: aceroKg, ton: aceroKg / 1000 },
        alambre: { kg: alambreKg, ton: alambreKg / 1000 },
        metal: { kg: metalKg, ton: metalKg / 1000 },
    };
}
/** Normalize tablaMuertos field names from frontend variations */
function normalizeTablaMuertos(raw) {
    if (!raw || !Array.isArray(raw) || raw.length === 0)
        return raw;
    return raw.map((m) => ({
        numero: m.numero || '',
        muerto: m.muerto || '',
        x_braces: m.x_braces || m.tipo_brace || '',
        angulo: m.angulo || '',
        eje: m.eje || '',
        tipo_construccion: m.tipo_construccion || '',
        cantidad_muros: m.cantidad_muros || '0',
        muros_incluidos: m.muros_incluidos || '',
    }));
}
function buildReportData(input) {
    const paneles = normalizePaneles(input.paneles);
    const filasArmado = normalizeArmadoRows(input.reporteMacizos, input.tablaArmado);
    const filasArmadoPairs = normalizeArmadoPairs(input.reporteMacizos);
    const totals = filasArmadoPairs.length > 0
        ? computeTotalsFromPairs(filasArmadoPairs)
        : computeTotals(filasArmado);
    const tablaMuertos = normalizeTablaMuertos(input.tablaMuertos);
    return {
        paneles,
        projectInfo: input.projectInfo,
        tablaMuertos,
        filasArmado,
        filasArmadoPairs,
        totals,
        user: input.user,
        reportImage: input.reportImage
    };
}
function validateReportCompleteness(data) {
    const errors = [];
    if (!data.paneles || data.paneles.length === 0) {
        errors.push('No hay paneles/muros para incluir en el reporte.');
    }
    else {
        const badGeometry = data.paneles.filter(p => {
            const grosor = Number(p.grosor) || 0;
            const area = Number(p.area) || 0;
            return grosor <= 0 || area <= 0;
        });
        if (badGeometry.length > 0) {
            errors.push(`${badGeometry.length} panel(es) con geometría inválida (grosor o área <= 0).`);
        }
        const noId = data.paneles.filter(p => !p.id_muro);
        if (noId.length > 0) {
            errors.push(`${noId.length} panel(es) sin identificador.`);
        }
    }
    if (!data.projectInfo?.nombre) {
        errors.push('El proyecto no tiene nombre asignado.');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
function verifyTotals(data) {
    const errors = [];
    const recalculated = computeTotals(data.filasArmado);
    const eps = 0.01;
    const check = (label, a, b) => {
        if (Math.abs(a - b) > eps) {
            errors.push(`Discrepancia en ${label}: ${a.toFixed(4)} vs ${b.toFixed(4)}`);
        }
    };
    check('concreto m3', data.totals.concreto.m3, recalculated.concreto.m3);
    check('concreto ton', data.totals.concreto.ton, recalculated.concreto.ton);
    check('acero kg', data.totals.acero.kg, recalculated.acero.kg);
    check('alambre kg', data.totals.alambre.kg, recalculated.alambre.kg);
    return { valid: errors.length === 0, errors };
}
