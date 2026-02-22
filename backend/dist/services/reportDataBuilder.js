"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePaneles = normalizePaneles;
exports.normalizeArmadoRows = normalizeArmadoRows;
exports.computeTotals = computeTotals;
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
        return panel;
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
function buildReportData(input) {
    const paneles = normalizePaneles(input.paneles);
    const filasArmado = normalizeArmadoRows(input.reporteMacizos, input.tablaArmado);
    const totals = computeTotals(filasArmado);
    return {
        paneles,
        projectInfo: input.projectInfo,
        tablaMuertos: input.tablaMuertos,
        filasArmado,
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
