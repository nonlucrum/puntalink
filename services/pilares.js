// services/pilares.js

// =================== CONSTANTES ===================
const R_AIR = 287.05;   // Constante de gas del aire (J/(kg·K))
const G = 9.81;         // Gravedad (m/s²)
const RHO_STEEL = 7850; // Densidad del acero (kg/m³)

// Varillas estándar (US): #3,#4,#5,#6
const VARILLA = {
  "#3": { phi_mm: 9.525,  kg_m: 0.560 },
  "#4": { phi_mm: 12.700, kg_m: 0.996 },
  "#5": { phi_mm: 15.875, kg_m: 1.552 },
  "#6": { phi_mm: 19.050, kg_m: 2.241 }
};

// =================== UTILIDADES ===================
function num(x, d = 4) {
  // Redondea a d decimales si es número finito
  return Number.isFinite(x) ? Number((+x).toFixed(d)) : NaN;
}
function pos(x){
  // Verifica si x es número positivo
  return Number.isFinite(x) && x > 0;
}

// =================== FÍSICA DEL VIENTO ===================
function densidadAire(Tc, PhPa) {
  // Calcula densidad del aire [kg/m³] a partir de T (°C) y P (hPa)
  if (Number.isFinite(Tc) && Number.isFinite(PhPa)) {
    const T = Tc + 273.15;
    const P = PhPa * 100;
    return P / (R_AIR * T);
  }
  return 1.225; // Valor típico al nivel del mar
}
function qDin(V, rho) {
  // Presión dinámica del viento
  return 0.5 * rho * V * V;
}

// =================== VALIDACIÓN DE ENTRADAS ===================
function validarEntrada(payload) {
  // Valida estructura y valores de entrada
  if (!payload || (payload.tipoPilar !== 'corrido' && payload.tipoPilar !== 'aislado'))
    throw new Error('tipoPilar debe ser "corrido" o "aislado".');
  const { geom, sitio, coeficientes, brace } = payload;
  if (!geom || !sitio || !coeficientes || !brace)
    throw new Error('Faltan bloques geom/sitio/coeficientes/brace.');
  if (!pos(sitio.V)) throw new Error('Velocidad V inválida.');

  if (payload.tipoPilar === 'corrido') {
    if (!pos(geom.h) || !pos(geom.L)) throw new Error('Para pilar corrido se requiere h>0 y L>0.');
    if (!Number.isFinite(coeficientes.Cp_muro)) throw new Error('Falta Cp_muro.');
  } else {
    if (!pos(geom.h) || !pos(geom.D)) throw new Error('Para pilar aislado se requiere h>0 y D>0.');
    if (!Number.isFinite(coeficientes.Cd_cilindro)) throw new Error('Falta Cd_cilindro.');
  }

  if (!Number.isFinite(brace.theta) || brace.theta <= 0 || brace.theta >= 90)
    throw new Error('Ángulo θ debe estar en (0,90).');

  // Validación de bloque "muerto" (opcional)
  if (payload.muerto) {
    const m = payload.muerto;
    if (m.mu != null && (m.mu < 0 || m.mu > 1)) throw new Error('µ debe estar entre 0 y 1.');
    if (m.grupoSize != null && (!Number.isInteger(m.grupoSize) || m.grupoSize <= 0))
      throw new Error('grupoSize debe ser entero > 0.');
    if (m.dim) {
      if (m.dim.L != null && m.dim.L <= 0) throw new Error('L del muerto debe ser > 0.');
      if (m.dim.A != null && m.dim.A <= 0) throw new Error('A del muerto debe ser > 0.');
      if (m.dim.hMin != null && m.dim.hMin <= 0) throw new Error('hMin debe ser > 0.');
    }
    if (m.armado) {
      if (m.armado.rec != null && m.armado.rec < 0) throw new Error('Recubrimiento inválido.');
      if (m.armado.espLongIni != null && m.armado.espLongIni <= 0) throw new Error('Espaciamiento inicial inválido.');
      if (m.armado.sEstribo_m != null && m.armado.sEstribo_m <= 0) throw new Error('sEstribo debe ser > 0.');
      if (m.armado.phiLong_mm != null && m.armado.phiLong_mm <= 0) throw new Error('φ long debe ser > 0.');
      if (m.armado.phiEstribo_mm != null && m.armado.phiEstribo_mm <= 0) throw new Error('φ estribo debe ser > 0.');
      if (m.armado.nSup != null && m.armado.nSup < 0) throw new Error('nSup inválido.');
      if (m.armado.nMed != null && m.armado.nMed < 0) throw new Error('nMed inválido.');
      if (m.armado.nInf != null && m.armado.nInf < 0) throw new Error('nInf inválido.');
      if (m.armado.tipoLong && !VARILLA[m.armado.tipoLong]) throw new Error('tipoLong inválido.');
      if (m.armado.tipoEstr && !VARILLA[m.armado.tipoEstr]) throw new Error('tipoEstr inválido.');
    }
    if (m.alambre) {
      if (m.alambre.La != null && m.alambre.La <= 0) throw new Error('La debe ser > 0.');
      if (m.alambre.d_mm != null && m.alambre.d_mm <= 0) throw new Error('Diámetro alambre inválido.');
    }
  }
}

// =================== SEGMENTACIÓN DE BRACES ===================
function bracesPorSegmento(longitud, sMax) {
  // Calcula cantidad de braces por segmento
  if (!pos(sMax)) return 2;
  return Math.max(2, Math.ceil(longitud / sMax));
}

// =================== FUNCIÓN PRINCIPAL DE CÁLCULO ===================
function calcular(payload) {
  validarEntrada(payload);

  const { tipoPilar, geom, sitio, coeficientes, brace, diseno = {}, segmentos = [], muerto } = payload;

  // ----------- Viento -----------
  const rho = densidadAire(sitio.T, sitio.P);
  const qz = qDin(sitio.V, rho);
  const qz_site = qz * (sitio.FRz ?? 1) * (sitio.Kzt ?? 1) * (sitio.Fx ?? 1);

  let A, coef, F, presion_kPa;
  if (tipoPilar === 'corrido') {
    // Pilar corrido: área = h × L
    A = geom.h * geom.L;
    coef = coeficientes.Cp_muro;
    F = qz_site * coef * A;
  } else {
    // Pilar aislado: área = h × D
    A = geom.h * geom.D;
    coef = coeficientes.Cd_cilindro;
    F = qz_site * coef * A;
  }
  presion_kPa = qz_site * coef / 1000;

  // ----------- Brace (pág. 2) -----------
  const NB = Number.isFinite(brace.NB) ? brace.NB : geom.h / 2;
  const thetaRad = (brace.theta * Math.PI) / 180;
  let yInserto = Number.isFinite(brace.yInserto) ? brace.yInserto : geom.h;
  if (!(yInserto > NB && yInserto <= geom.h)) yInserto = geom.h;
  const L_brace = (yInserto - NB) / Math.sin(thetaRad);
  const X = L_brace * Math.cos(thetaRad);
  const Y = yInserto;

  // ----------- Segmentación (pág. 2) -----------
  const listaSegmentos = Array.isArray(segmentos) && segmentos.length
    ? segmentos.filter(x => pos(x))
    : (tipoPilar === 'corrido' ? [geom.L] : []);
  const sMax = pos(diseno.sMax) ? diseno.sMax : null;
  const detalleSegmentos = listaSegmentos.map((Lseg, idx) => ({
    segmento: idx + 1,
    longitud_m: num(Lseg, 3),
    braces: bracesPorSegmento(Lseg, sMax)
  }));
  const totalBraces = detalleSegmentos.reduce((acc, s) => acc + s.braces, 0);
  const muertesCorridos = (tipoPilar === 'corrido') ? detalleSegmentos.length : 0;

  // ==================== Pág. 3–5: MUERTO ====================
  let muertoOut = null;
  if (muerto) {
    // ----------- Parámetros de muerto -----------
    const mu        = (muerto.mu != null) ? muerto.mu : 0.4;
    const densidad  = pos(muerto.densidad) ? muerto.densidad : 2400;
    const sf        = pos(muerto.sf) ? muerto.sf : 1.0;
    const grupoSize = Number.isInteger(muerto.grupoSize) && muerto.grupoSize > 0 ? muerto.grupoSize : 2;

    const T_por_brace = totalBraces > 0 ? (F / totalBraces) : F;
    const Fa_grupo    = T_por_brace * grupoSize * sf;

    // ----------- Requisito por deslizamiento -----------
    const Wreq_N = Fa_grupo * (Math.cos(thetaRad) / Math.max(mu, 1e-6) + Math.sin(thetaRad));
    const masa_kg = Wreq_N / G;
    const Vol_m3  = masa_kg / densidad;

    // ----------- Dimensiones -----------
    const Lm   = pos(muerto.dim?.L)    ? muerto.dim.L    : 1.0;
    const Am   = pos(muerto.dim?.A)    ? muerto.dim.A    : 0.6;
    const hMin = pos(muerto.dim?.hMin) ? muerto.dim.hMin : 0.50;
    let h_calc = Vol_m3 / (Lm * Am);
    if (!pos(h_calc)) h_calc = hMin;
    const h = Math.max(hMin, h_calc);

    // ----------- Armado (pág. 4) -----------
    const rec        = (muerto.armado?.rec != null) ? Math.max(0, muerto.armado.rec) : 0.04;
    const espLongIni = pos(muerto.armado?.espLongIni) ? muerto.armado.espLongIni : 0.25;

    // Por tipo de varilla (si viene) o por φ
    const tipoLong = muerto.armado?.tipoLong || null;
    const tipoEstr = muerto.armado?.tipoEstr || null;

    let phiLong_m  = pos(muerto.armado?.phiLong_mm) ? muerto.armado.phiLong_mm/1000 : null;
    let phiEstr_m  = pos(muerto.armado?.phiEstribo_mm) ? muerto.armado.phiEstribo_mm/1000 : null;
    let kg_m_long, kg_m_estr;

    if (tipoLong && VARILLA[tipoLong]) {
      phiLong_m = VARILLA[tipoLong].phi_mm / 1000;
      kg_m_long = VARILLA[tipoLong].kg_m;
    }
    if (!kg_m_long && pos(phiLong_m)) {
      kg_m_long = RHO_STEEL * Math.PI * (phiLong_m**2) / 4;
    }

    if (tipoEstr && VARILLA[tipoEstr]) {
      phiEstr_m = VARILLA[tipoEstr].phi_mm / 1000;
      kg_m_estr = VARILLA[tipoEstr].kg_m;
    }
    if (!kg_m_estr && pos(phiEstr_m)) {
      kg_m_estr = RHO_STEEL * Math.PI * (phiEstr_m**2) / 4;
    }

    const sEstribo = pos(muerto.armado?.sEstribo_m) ? muerto.armado.sEstribo_m : 0.20;

    const nSup = Number.isInteger(muerto.armado?.nSup) ? Math.max(0, muerto.armado.nSup) : 2;
    const nMed = Number.isInteger(muerto.armado?.nMed) ? Math.max(0, muerto.armado.nMed) : 0;
    const nInf = Number.isInteger(muerto.armado?.nInf) ? Math.max(0, muerto.armado.nInf) : 2;

    const anchoUtil  = Math.max(Am - 2*rec, 0.05);
    const nAuto = Math.max(2, Math.floor(anchoUtil / espLongIni) + 1);
    const espLongReal = nAuto > 1 ? (anchoUtil / (nAuto - 1)) : anchoUtil;

    // Longitudinales
    const L_barra_long = Lm;
    const LtotSup = nSup * L_barra_long;
    const LtotMed = nMed * L_barra_long;
    const LtotInf = nInf * L_barra_long;
    const kgSup   = (kg_m_long || 0) * LtotSup;
    const kgMed   = (kg_m_long || 0) * LtotMed;
    const kgInf   = (kg_m_long || 0) * LtotInf;
    const kgLongTot = kgSup + kgMed + kgInf;

    // Estribos a lo largo de L
    const b_int = Math.max(Am - 2*rec - (phiEstr_m || 0), 0.05);
    const h_int = Math.max(h  - 2*rec - (phiEstr_m || 0), 0.05);
    const L_estribo = 2*(b_int + h_int) + 2*(10 * (phiEstr_m || 0));
    const nEstr = Math.max(2, Math.floor(Math.max(Lm - 2*rec, 0) / sEstribo) + 1);
    const longEstrTot = L_estribo * nEstr;
    const kgEstrTot = (kg_m_estr || 0) * longEstrTot;

    const kgSteelTot = kgLongTot + kgEstrTot;
    const Wreq_kN = Wreq_N / 1000;

    // ----------- Alambre de amarre (pág. 5) -----------
    const La = pos(muerto.alambre?.La) ? muerto.alambre.La : 0.25; // m por nudo
    const dAl_mm = pos(muerto.alambre?.d_mm) ? muerto.alambre.d_mm : 1.2;
    const rhoAl = pos(muerto.alambre?.rho) ? muerto.alambre.rho : RHO_STEEL;
    const dAl_m = dAl_mm / 1000;
    const kgmAl = rhoAl * Math.PI * (dAl_m**2) / 4;

    const nLongTotal = nSup + nMed + nInf;
    const nudos = nLongTotal * nEstr;              // (# long) × (# estribos)
    const longAlambre_m = La * nudos;              // longitud total de amarre
    const kgAlambre = kgmAl * longAlambre_m;       // peso por muerto

    // ----------- Totales de proyecto (por # de "muertos corridos") -----------
    const totProyecto = {
      muertes: muertesCorridos,
      longEstr_total_m: num(longEstrTot * muertesCorridos, 3),
      kgEstr_total_kg:   num(kgEstrTot   * muertesCorridos, 3),
      kgLong_total_kg:   num(kgLongTot   * muertesCorridos, 3),
      kgSteel_total_kg:  num(kgSteelTot  * muertesCorridos, 3),
      longAlambre_total_m: num(longAlambre_m * muertesCorridos, 3),
      kgAlambre_total_kg:  num(kgAlambre   * muertesCorridos, 3)
    };

    // ----------- Salida de bloque muerto -----------
    muertoOut = {
      entradas: {
        mu, densidad, sf, grupoSize,
        dim: { L: Lm, A: Am, hMin },
        armado: {
          rec, espLongIni, sEstribo_m: sEstribo,
          tipoLong: tipoLong || null, tipoEstr: tipoEstr || null,
          phiLong_mm: phiLong_m ? num(phiLong_m*1000,2) : null,
          phiEstribo_mm: phiEstr_m ? num(phiEstr_m*1000,2) : null
        },
        alambre: { La, d_mm: dAl_mm, rho: rhoAl }
      },
      calculo: {
        Fa_grupo_N: num(Fa_grupo, 2),
        Wreq_kN: num(Wreq_kN, 3),
        Vol_m3: num(Vol_m3, 4)
      },
      dimensiones: { L_m: num(Lm, 3), A_m: num(Am, 3), h_m: num(h, 3) },
      armado: {
        anchoUtil_m: num(anchoUtil, 3), nAuto, espLongReal_m: num(espLongReal, 3),
        // Longitudinales
        kg_m_long: kg_m_long ? num(kg_m_long, 4) : null,
        niveles: {
          superior: { n: nSup, L_total_m: num(LtotSup,3), kg: num(kgSup,3) },
          medio:    { n: nMed, L_total_m: num(LtotMed,3), kg: num(kgMed,3) },
          inferior: { n: nInf, L_total_m: num(LtotInf,3), kg: num(kgInf,3) },
          kg_total_long: num(kgLongTot,3)
        },
        // Estribos
        kg_m_estr: kg_m_estr ? num(kg_m_estr, 4) : null,
        L_estribo_m: num(L_estribo, 3),
        nEstribos: nEstr,
        longEstrTotal_m: num(longEstrTot, 3),
        kgEstriboTotal_kg: num(kgEstrTot, 3),
        // Totales de acero (por muerto)
        kgSteelTotal_kg: num(kgSteelTot, 3)
      },
      alambre: {
        nudos, La_m: La, kg_m: num(kgmAl,4),
        longitud_m: num(longAlambre_m, 3),
        peso_kg: num(kgAlambre, 3)
      },
      totalesProyecto: totProyecto
    };
  }

  // ----------- Salida principal -----------
  return {
    inputs: payload,
    intermedios: {
      rho: num(densidadAire(sitio.T, sitio.P), 4),
      qz: num(qz, 2),
      factores: { FRz: sitio.FRz ?? 1, Kzt: sitio.Kzt ?? 1, Fx: sitio.Fx ?? 1 },
      qz_site: num(qz_site, 2)
    },
    resultados: {
      tipoPilar,
      A: num(A, 4),
      coef: num(coef, 3),
      presion_kPa: num(presion_kPa, 4),
      F_N: num(F, 2),
      brace: {
        NB: num(NB, 3), theta: num(brace.theta, 2),
        yInserto: num(Y, 3), L_brace: num(L_brace, 3),
        X: num(X, 3), Y: num(Y, 3), tipo: brace.tipo || null
      },
      disposicion: { sMax: sMax ?? null, segmentos: detalleSegmentos, totalBraces, muertesCorridos },
      muerto: muertoOut
    },
    resumen: {
      h: geom.h, L: geom.L ?? null, D: geom.D ?? null, V: sitio.V,
      qz_kPa: num(qz_site / 1000, 4), F_kN: num(F / 1000, 3)
    },
    timestamp: new Date().toISOString()
  };
}

// =================== EXPORT ===================
module.exports = { calcular };
