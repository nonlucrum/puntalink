// ===== MÓDULO DE CÁLCULO DE MACIZOS DE ANCLAJE (MUERTOS CILÍNDRICOS) =====

// Tabla de referencia TILT-UP HANDBOOK página 71 (Peso del macizo en libras)
const TABLA_MUERTOS = {
  // Altura: { diámetro: peso }
  "2-0": { // 2 ft-0 in
    30: 1470,
    36: 2120,
    42: 2890,
    48: 3770,
    60: 5888
  },
  "2-6": { // 2 ft-6 in  
    30: 1840,
    36: 2650,
    42: 3610,
    48: 4710,
    60: 7360
  },
  "3-0": { // 3 ft-0 in
    30: 2210,
    36: 3180,
    42: 4330,
    48: 5650,
    60: 8832
  },
  "3-6": { // 3 ft-6 in
    30: 2950,
    36: 4240,
    42: 5720,
    48: 7536,
    60: 10304
  },
  "4-0": { // 4 ft-0 in
    30: 3680,
    36: 5300,
    42: 7120,
    48: 9420,
    60: 12280
  },
  "4-6": { // 4 ft-6 in
    30: 4410,
    36: 6360,
    42: 8520,
    48: 11304,
    60: 14256
  },
  "5-0": { // 5 ft-0 in
    30: 5150,
    36: 7420,
    42: 9930,
    48: 13188,
    60: 16232
  },
  "6-0": { // 6 ft-0 in
    30: 6630,
    36: 9540,
    42: 12740,
    48: 16956,
    60: 20184
  },
  "7-0": { // 7 ft-0 in
    30: 8110,
    36: 11660,
    42: 15550,
    48: 20724,
    60: 24136
  },
  "8-0": { // 8 ft-0 in
    30: 9590,
    36: 13780,
    42: 18360,
    48: 24492,
    60: 28088
  },
  "9-0": { // 9 ft-0 in
    30: 11070,
    36: 15900,
    42: 21170,
    48: 28260,
    60: 32040
  }
};

// Constantes para cálculos
const CONSTANTES = {
  densidadConcreto: 2400, // kg/m³
  densidadAcero: 7850, // kg/m³
  diametroAlambre: 0.00122, // m (Ø1.22mm)
  longitudAmarra: 0.35, // m
  conversionKnLb: 224.8, // factor de conversión kN a lb
  pesoLinealBarra4: 0.785, // kg/m
  pesoLinealBarra5: 1.27, // kg/m  
  pesoLinealBarra3: 0.376, // kg/m (anillos)
  conversionInMm: 25.4,
  conversionFtMm: 304.8,
  // Espaciados estándar
  espaciadoVarillaLongitudinal: 0.20, // m (default, ajustable según diámetro)
  espaciadoAnillos: 0.20, // m (default, ajustable)
  // Factores de seguridad
  factorCoeficienteRozamiento: 0.6 // μ para verificación
};

// Función para convertir altura de formato "ft-in" a mm
function convertirAlturaAMm(alturaKey) {
  const [ft, inches] = alturaKey.split('-').map(x => parseInt(x));
  const totalInches = ft * 12 + inches;
  return totalInches * CONSTANTES.conversionInMm;
}

// Función para calcular FMC (Fuerza sobre cada muerto)
export function calcularFMC(fbx, nBraces, angulo) {
  console.log('[MUERTOS] Calculando FMC:', { fbx, nBraces, angulo });
  
  // FMC = FBX / (N° braces × cos(θ))
  const fmcKn = fbx / (nBraces * Math.cos(angulo * Math.PI / 180));
  const fmcLb = fmcKn * CONSTANTES.conversionKnLb;
  
  console.log('[MUERTOS] FMC calculado:', {
    fmcKn: fmcKn.toFixed(2),
    fmcLb: fmcLb.toFixed(2)
  });
  
  return {
    fmcKn,
    fmcLb
  };
}

// Función para buscar combinaciones válidas en la tabla
export function buscarCombinacionesValidas(fmcLb) {
  console.log('[MUERTOS] Buscando combinaciones para FMC:', fmcLb.toFixed(2), 'lb');
  
  const combinacionesValidas = [];
  
  // Recorrer todas las alturas y diámetros
  Object.keys(TABLA_MUERTOS).forEach(alturaKey => {
    Object.keys(TABLA_MUERTOS[alturaKey]).forEach(diametroKey => {
      const pesoTabla = TABLA_MUERTOS[alturaKey][parseInt(diametroKey)];
      
      if (pesoTabla >= fmcLb) {
        combinacionesValidas.push({
          altura: alturaKey,
          diametro: parseInt(diametroKey),
          pesoTabla,
          alturaKey
        });
      }
    });
  });
  
  // Ordenar por peso (menor a mayor para obtener la opción más eficiente primero)
  combinacionesValidas.sort((a, b) => a.pesoTabla - b.pesoTabla);
  
  console.log('[MUERTOS] Combinaciones válidas encontradas:', combinacionesValidas.length);
  
  return combinacionesValidas;
}

// Función para calcular volumen y peso del concreto
export function calcularConcreto(diametroMm, alturaMm) {
  const diametroM = diametroMm / 1000;
  const alturaM = alturaMm / 1000;
  
  // V = π/4 × D² × h
  const volumen = (Math.PI / 4) * Math.pow(diametroM, 2) * alturaM;
  const pesoKg = volumen * CONSTANTES.densidadConcreto;
  const pesoTon = pesoKg / 1000;
  
  return {
    volumen,
    pesoKg,
    pesoTon
  };
}

// Función para calcular acero de varillas verticales
export function calcularAceroVarillas(alturaM, nVarillas, nMuertos, tipoVarilla = '#4') {
  const longitudTotal = alturaM * nVarillas * nMuertos;
  const pesoLineal = tipoVarilla === '#5' ? CONSTANTES.pesoLinealBarra5 : CONSTANTES.pesoLinealBarra4;
  const pesoKg = longitudTotal * pesoLineal;
  
  return {
    longitudTotal,
    pesoKg,
    tipoVarilla
  };
}

// Función para calcular acero de anillos
export function calcularAceroAnillos(diametroM, nAnillos, nMuertos) {
  const longitudTotal = nAnillos * Math.PI * diametroM * nMuertos;
  const pesoKg = longitudTotal * CONSTANTES.pesoLinealBarra3;
  
  return {
    longitudTotal,
    pesoKg
  };
}

// Función para calcular alambre de amarre
export function calcularAlambre(nVarillas, nAnillos, nMuertos) {
  const longitudTotal = CONSTANTES.longitudAmarra * (nVarillas + 1) * nAnillos * nMuertos;
  const areaAlambre = (Math.PI / 4) * Math.pow(CONSTANTES.diametroAlambre, 2);
  const pesoKg = CONSTANTES.densidadAcero * areaAlambre * longitudTotal;
  
  return {
    longitudTotal,
    pesoKg
  };
}

// ===== FUNCIONES MEJORADAS SEGÚN DOCUMENTACIÓN =====

// 1. BLOQUE DE DIMENSIONES - Calcular peso del muerto
export function calcularPesoMuertoDetallado(diametroMm, alturaMm) {
  const volumen = (Math.PI / 4) * Math.pow(diametroMm/1000, 2) * (alturaMm/1000); // m³
  const pesoKg = volumen * CONSTANTES.densidadConcreto; // ρ = 2400 kg/m³
  const pesoTon = pesoKg / 1000;
  
  return {
    volumen: parseFloat(volumen.toFixed(3)),
    pesoKg: parseFloat(pesoKg.toFixed(1)),
    pesoTon: parseFloat(pesoTon.toFixed(3))
  };
}

// 2. BLOQUE DE ACERO LONGITUDINAL - Varillas verticales mejorado
export function calcularAceroLongitudinalDetallado(alturaMm, diametroMm, nVarillas = 4, tipoVarilla = '#4', nMuertos = 1) {
  const alturaM = alturaMm / 1000;
  
  // Espaciado entre varillas depende del diámetro del muerto
  const espaciadoVarilla = calcularEspaciadoVarilla(diametroMm);
  
  // Espaciado real considerando el diámetro real del muerto
  const perimetro = Math.PI * (diametroMm / 1000);
  const espaciadoReal = perimetro / nVarillas;
  
  // Longitud total considerando refuerzo superior, medio e inferior
  const longitudTotal = alturaM * nVarillas * nMuertos;
  
  // Peso según tipo de varilla
  const pesoLineal = tipoVarilla === '#5' ? CONSTANTES.pesoLinealBarra5 : CONSTANTES.pesoLinealBarra4;
  const pesoKg = longitudTotal * pesoLineal;
  
  return {
    espaciadoVarilla: parseFloat(espaciadoVarilla.toFixed(3)),
    cantidadVarillas: nVarillas,
    espaciadoReal: parseFloat(espaciadoReal.toFixed(3)),
    longitudTotal: parseFloat(longitudTotal.toFixed(2)),
    tipoVarilla,
    pesoLineal: parseFloat(pesoLineal.toFixed(3)),
    pesoKg: parseFloat(pesoKg.toFixed(2))
  };
}

// 3. BLOQUE DE ACERO TRANSVERSAL - Anillos mejorado
export function calcularAceroTransversalDetallado(diametroMm, alturaMm, nAnillos = 3, nMuertos = 1) {
  const alturaM = alturaMm / 1000;
  const diametroM = diametroMm / 1000;
  
  // Espaciado entre estribos
  const espaciadoEstribo = 0.20; // Default 0.20m
  
  // Cantidad total de estribos = altura/espaciado
  const cantidadEstribos = Math.max(nAnillos, Math.ceil(alturaM / espaciadoEstribo));
  
  // Longitud del estribo = π × D
  const longitudEstribo = Math.PI * diametroM;
  
  // Total acero estribos
  const longitudTotal = longitudEstribo * cantidadEstribos * nMuertos;
  
  // Peso con barra #3
  const pesoKg = longitudTotal * CONSTANTES.pesoLinealBarra3;
  
  return {
    espaciadoEstribo: parseFloat(espaciadoEstribo.toFixed(2)),
    cantidadEstribos,
    longitudEstribo: parseFloat(longitudEstribo.toFixed(2)),
    longitudTotal: parseFloat(longitudTotal.toFixed(2)),
    tipoVarilla: '#3',
    pesoLineal: parseFloat(CONSTANTES.pesoLinealBarra3.toFixed(3)),
    pesoKg: parseFloat(pesoKg.toFixed(2))
  };
}

// Función auxiliar para calcular espaciado de varillas según diámetro
function calcularEspaciadoVarilla(diametroMm) {
  if (diametroMm <= 760) return 0.15; // 15cm para muertos pequeños
  if (diametroMm <= 1200) return 0.20; // 20cm para muertos medianos
  return 0.25; // 25cm para muertos grandes
}

// Función principal para calcular muertos de un muro
export function calcularMuertosMuro(muro, parametros = {}) {
  console.log('[MUERTOS] Calculando muertos para muro:', muro.nombre_muro);
  
  // Parámetros por defecto
  const config = {
    nVarillas: parametros.nVarillas || 4,
    nAnillos: parametros.nAnillos || 3,
    tipoVarilla: parametros.tipoVarilla || '#4',
    nMuertos: parametros.nMuertos || 1,
    ...parametros
  };
  
  // 1. Calcular FMC
  const fmc = calcularFMC(muro.fbx, muro.x_braces, muro.angulo_brace);
  
  // 2. Buscar combinaciones válidas
  const combinaciones = buscarCombinacionesValidas(fmc.fmcLb);
  
  if (combinaciones.length === 0) {
    console.warn('[MUERTOS] No se encontraron combinaciones válidas para:', muro.nombre_muro);
    return {
      muro: muro.nombre_muro,
      error: 'No se encontraron combinaciones válidas en la tabla',
      fmc
    };
  }
  
  // 3. Calcular para la primera combinación (más eficiente)
  const mejorCombinacion = combinaciones[0];
  const diametroMm = mejorCombinacion.diametro * CONSTANTES.conversionInMm;
  const alturaMm = convertirAlturaAMm(mejorCombinacion.altura);
  
  // 4. Calcular materiales
  const concreto = calcularConcreto(diametroMm, alturaMm);
  const varillas = calcularAceroVarillas(alturaMm / 1000, config.nVarillas, config.nMuertos, config.tipoVarilla);
  const anillos = calcularAceroAnillos(diametroMm / 1000, config.nAnillos, config.nMuertos);
  const alambre = calcularAlambre(config.nVarillas, config.nAnillos, config.nMuertos);
  
  return {
    muro: muro.nombre_muro,
    pid: muro.pid,
    fmc,
    seleccionado: {
      diametroIn: mejorCombinacion.diametro,
      diametroMm: Math.round(diametroMm),
      alturaFt: mejorCombinacion.altura || 'N/A',
      alturaMm: Math.round(alturaMm),
      pesoTablaLb: mejorCombinacion.pesoTabla
    },
    materiales: {
      concreto: {
        volumenM3: concreto.volumen.toFixed(3),
        pesoTon: concreto.pesoTon.toFixed(3)
      },
      varillas: {
        longitudM: varillas.longitudTotal.toFixed(2),
        pesoKg: varillas.pesoKg.toFixed(2),
        tipo: varillas.tipoVarilla
      },
      anillos: {
        longitudM: anillos.longitudTotal.toFixed(2),
        pesoKg: anillos.pesoKg.toFixed(2)
      },
      alambre: {
        longitudM: alambre.longitudTotal.toFixed(3),
        pesoKg: alambre.pesoKg.toFixed(3)
      }
    },
    alternativas: combinaciones.slice(0, 5).map(comb => ({
      diametroIn: comb.diametro,
      diametroMm: Math.round(comb.diametro * CONSTANTES.conversionInMm),
      alturaFt: comb.altura || 'N/A',
      alturaMm: Math.round(convertirAlturaAMm(comb.altura)),
      pesoTablaLb: comb.pesoTabla
    })),
    parametros: config
  };
}

// Función para calcular muertos desde la tabla agrupada
export function calcularMuertosGrupos(grupos, parametros = {}) {
  console.log('[MUERTOS] Iniciando cálculo por grupos');
  console.log('[MUERTOS] Grupos recibidos:', grupos);
  console.log('[MUERTOS] Parámetros:', parametros);

  const resultados = [];
  let totalesProyecto = {
    concretoTon: 0,
    varillasKg: 0,
    anillosKg: 0,
    alambreKg: 0
  };

  let gruposCalculados = 0;
  let gruposError = 0;
  let murosTotal = 0;

  // Procesar cada grupo
  Object.entries(grupos).forEach(([clave, grupo], index) => {
    try {
      console.log(`[MUERTOS] Procesando grupo ${clave}:`, grupo);
      
      // Extraer parámetros del grupo - adaptado a estructura real
      const xBraces = parseInt(grupo.x) || parseInt(grupo.x_braces) || 2;
      const angulo = parseInt(grupo.ang) || parseInt(grupo.angulo) || 55;
      const eje = grupo.eje || grupo.tipo || 1;
      
      // La cantidad de muros puede venir de diferentes propiedades
      let cantidadMuros = 0;
      if (grupo.muros && Array.isArray(grupo.muros)) {
        cantidadMuros = grupo.muros.length;
      } else if (grupo.cantidadMuros) {
        cantidadMuros = parseInt(grupo.cantidadMuros);
      } else if (grupo.count) {
        cantidadMuros = parseInt(grupo.count);
      } else {
        cantidadMuros = 1; // fallback
      }
      
      if (cantidadMuros === 0) {
        console.warn(`[MUERTOS] Grupo ${clave} no tiene muros`);
        return;
      }

      murosTotal += cantidadMuros;

      // Usar FBX promedio de los muros del grupo o valor por defecto
      let fbxPromedio = 5.0; // Valor por defecto en kN
      
      if (grupo.muros && grupo.muros.length > 0) {
        const fbxValues = grupo.muros
          .map(muro => parseFloat(muro.fbx) || parseFloat(muro.fb) || 0)
          .filter(val => val > 0);
        
        if (fbxValues.length > 0) {
          fbxPromedio = fbxValues.reduce((sum, val) => sum + val, 0) / fbxValues.length;
        }
      }

      console.log(`[MUERTOS] Grupo ${clave}: xBraces=${xBraces}, angulo=${angulo}, muros=${cantidadMuros}, fbx=${fbxPromedio}`);

      // Calcular FMC para este grupo
      const fmcResult = calcularFMC(fbxPromedio, xBraces, angulo);
      console.log(`[MUERTOS] FMC calculado para grupo ${clave}:`, fmcResult);

      // Buscar configuración válida en la tabla
      const combinacionesValidas = buscarCombinacionesValidas(fmcResult.fmcLb);
      
      if (combinacionesValidas.length === 0) {
        resultados.push({
          grupo: `M${grupo.muerto || index + 1}`,
          xBraces,
          angulo,
          eje,
          cantidadMuros,
          error: `No se encontró configuración válida para FMC = ${fmcResult.fmcLb.toFixed(0)} lb`
        });
        gruposError++;
        return;
      }

      // Seleccionar la primera opción válida
      const seleccionado = combinacionesValidas[0];
      
      // Calcular dimensiones
      const diametroMm = seleccionado.diametro * CONSTANTES.conversionInMm;
      const alturaMm = convertirAlturaAMm(seleccionado.altura);
      
      // Configuración de materiales
      const config = {
        nVarillas: parametros.nVarillas || 4,
        nAnillos: parametros.nAnillos || 3,
        tipoVarilla: parametros.tipoVarilla || '#4',
        nMuertos: 1 // Calculamos para 1 muerto
      };
      
      // Calcular materiales para 1 muerto
      const concreto = calcularConcreto(diametroMm, alturaMm);
      const varillas = calcularAceroVarillas(alturaMm / 1000, config.nVarillas, 1, config.tipoVarilla);
      const anillos = calcularAceroAnillos(diametroMm / 1000, config.nAnillos, 1);
      const alambre = calcularAlambre(config.nVarillas, config.nAnillos, 1);
      
      const materialesUnitarios = {
        concreto: {
          volumenM3: concreto.volumen.toFixed(3),
          pesoTon: concreto.pesoTon.toFixed(3)
        },
        varillas: {
          longitudM: varillas.longitudTotal.toFixed(2),
          pesoKg: varillas.pesoKg.toFixed(2),
          tipo: varillas.tipoVarilla
        },
        anillos: {
          longitudM: anillos.longitudTotal.toFixed(2),
          pesoKg: anillos.pesoKg.toFixed(2)
        },
        alambre: {
          longitudM: alambre.longitudTotal.toFixed(3),
          pesoKg: alambre.pesoKg.toFixed(3)
        }
      };
      
      // Multiplicar por cantidad de muros en el grupo
      const totalesGrupo = {
        concretoTon: (parseFloat(materialesUnitarios.concreto.pesoTon) * cantidadMuros).toFixed(3),
        varillasKg: (parseFloat(materialesUnitarios.varillas.pesoKg) * cantidadMuros).toFixed(1),
        anillosKg: (parseFloat(materialesUnitarios.anillos.pesoKg) * cantidadMuros).toFixed(1),
        alambreKg: (parseFloat(materialesUnitarios.alambre.pesoKg) * cantidadMuros).toFixed(1)
      };

      // Agregar resultado
      resultados.push({
        grupo: `M${grupo.muerto || index + 1}`,
        xBraces,
        angulo,
        eje,
        cantidadMuros,
        fmc: fmcResult,
        seleccionado: {
          diametroIn: seleccionado.diametro,
          diametroMm: Math.round(diametroMm),
          alturaFt: seleccionado.altura || 'N/A',
          alturaMm: Math.round(alturaMm),
          pesoTablaLb: seleccionado.pesoTabla
        },
        materiales: materialesUnitarios,
        totales: totalesGrupo
      });

      // Sumar a totales del proyecto
      totalesProyecto.concretoTon += parseFloat(totalesGrupo.concretoTon);
      totalesProyecto.varillasKg += parseFloat(totalesGrupo.varillasKg);
      totalesProyecto.anillosKg += parseFloat(totalesGrupo.anillosKg);
      totalesProyecto.alambreKg += parseFloat(totalesGrupo.alambreKg);

      gruposCalculados++;

    } catch (error) {
      console.error(`[MUERTOS] Error procesando grupo ${clave}:`, error);
      resultados.push({
        grupo: `M${grupo.muerto || index + 1}`,
        xBraces: grupo.x_braces || 2,
        angulo: grupo.angulo || 55,
        eje: grupo.eje || 1,
        cantidadMuros: grupo.muros ? grupo.muros.length : 0,
        error: error.message
      });
      gruposError++;
    }
  });

  // Redondear totales finales
  const totalesFinales = {
    concretoTon: totalesProyecto.concretoTon.toFixed(3),
    varillasKg: totalesProyecto.varillasKg.toFixed(1),
    anillosKg: totalesProyecto.anillosKg.toFixed(1),
    alambreKg: totalesProyecto.alambreKg.toFixed(1),
    gruposCalculados,
    gruposError,
    murosTotal
  };

  const resultado = {
    resultados,
    totales: totalesFinales,
    parametros
  };

  console.log('[MUERTOS] Cálculo por grupos completado:', resultado);
  return resultado;
}

// Función para calcular muertos de múltiples muros
export function calcularMuertosProyecto(muros, parametros = {}) {
  console.log('[MUERTOS] Calculando muertos para', muros.length, 'muros');
  
  const resultados = muros.map(muro => calcularMuertosMuro(muro, parametros));
  
  // Calcular totales
  const totales = resultados.reduce((acc, resultado) => {
    if (!resultado.error) {
      acc.concretoTon += parseFloat(resultado.materiales.concreto.pesoTon);
      acc.varillasKg += parseFloat(resultado.materiales.varillas.pesoKg);
      acc.anillosKg += parseFloat(resultado.materiales.anillos.pesoKg);
      acc.alambreKg += parseFloat(resultado.materiales.alambre.pesoKg);
      acc.muertosCalculados++;
    } else {
      acc.muertosError++;
    }
    return acc;
  }, {
    concretoTon: 0,
    varillasKg: 0,
    anillosKg: 0,
    alambreKg: 0,
    muertosCalculados: 0,
    muertosError: 0
  });
  
  return {
    resultados,
    totales: {
      concretoTon: totales.concretoTon.toFixed(3),
      varillasKg: totales.varillasKg.toFixed(2),
      anillosKg: totales.anillosKg.toFixed(2),
      alambreKg: totales.alambreKg.toFixed(3),
      muertosCalculados: totales.muertosCalculados,
      muertosError: totales.muertosError
    },
    parametros
  };
}

// Función para generar tabla HTML de resultados
export function generarTablaResultados(resultados) {
  let html = `
    <div class="muertos-results">
      <h3>📐 Resultados de Cálculo de Macizos de Anclaje</h3>
      
      <div class="totales-summary">
        <h4>📊 Totales del Proyecto</h4>
        <div class="totales-grid">
          <div class="total-item">
            <span class="label">Concreto:</span>
            <span class="value">${resultados.totales.concretoTon} ton</span>
          </div>
          <div class="total-item">
            <span class="label">Varillas ${resultados.parametros.tipoVarilla || '#4'}:</span>
            <span class="value">${resultados.totales.varillasKg} kg</span>
          </div>
          <div class="total-item">
            <span class="label">Anillos #3:</span>
            <span class="value">${resultados.totales.anillosKg} kg</span>
          </div>
          <div class="total-item">
            <span class="label">Alambre:</span>
            <span class="value">${resultados.totales.alambreKg} kg</span>
          </div>
        </div>
        <p><strong>Muertos calculados:</strong> ${resultados.totales.muertosCalculados}</p>
        ${resultados.totales.muertosError > 0 ? `<p class="error">⚠️ Muertos con error: ${resultados.totales.muertosError}</p>` : ''}
      </div>
      
      <table class="tabla-muertos">
        <thead>
          <tr>
            <th>Muro</th>
            <th>FMC (kN)</th>
            <th>FMC (lb)</th>
            <th>Diámetro</th>
            <th>Altura</th>
            <th>Concreto (ton)</th>
            <th>Varillas (kg)</th>
            <th>Anillos (kg)</th>
            <th>Alambre (kg)</th>
          </tr>
        </thead>
        <tbody>`;

  resultados.resultados.forEach(resultado => {
    if (resultado.error) {
      html += `
        <tr class="error-row">
          <td>${resultado.muro}</td>
          <td colspan="8" class="error">${resultado.error}</td>
        </tr>`;
    } else {
      html += `
        <tr>
          <td><strong>${resultado.muro}</strong></td>
          <td>${resultado.fmc.fmcKn.toFixed(2)}</td>
          <td>${resultado.fmc.fmcLb.toFixed(0)}</td>
          <td>${resultado.seleccionado.diametroMm} mm<br><small>(${resultado.seleccionado.diametroIn}")</small></td>
          <td>${resultado.seleccionado.alturaMm} mm<br><small>(${resultado.seleccionado.alturaFt ? resultado.seleccionado.alturaFt.replace('-', '\'-') : 'N/A'}\")</small></td>
          <td>${resultado.materiales.concreto.pesoTon}</td>
          <td>${resultado.materiales.varillas.pesoKg}</td>
          <td>${resultado.materiales.anillos.pesoKg}</td>
          <td>${resultado.materiales.alambre.pesoKg}</td>
        </tr>`;
    }
  });

  html += `
        </tbody>
      </table>
    </div>`;

  return html;
}

// Función para exportar resultados a CSV
export function exportarResultadosCSV(resultados) {
  const headers = [
    'Muro', 'PID', 'FMC_kN', 'FMC_lb', 
    'Diametro_mm', 'Diametro_in', 'Altura_mm', 'Altura_ft',
    'Concreto_ton', 'Varillas_kg', 'Anillos_kg', 'Alambre_kg'
  ];
  
  let csv = headers.join(',') + '\n';
  
  resultados.resultados.forEach(resultado => {
    if (!resultado.error) {
      const row = [
        resultado.muro,
        resultado.pid,
        resultado.fmc.fmcKn.toFixed(2),
        resultado.fmc.fmcLb.toFixed(0),
        resultado.seleccionado.diametroMm,
        resultado.seleccionado.diametroIn,
        resultado.seleccionado.alturaMm,
        resultado.seleccionado.alturaFt,
        resultado.materiales.concreto.pesoTon,
        resultado.materiales.varillas.pesoKg,
        resultado.materiales.anillos.pesoKg,
        resultado.materiales.alambre.pesoKg
      ];
      csv += row.join(',') + '\n';
    }
  });
  
  return csv;
}

// Función para generar tabla HTML de resultados por grupos
export function generarTablaResultadosGrupos(resultados) {
  let html = `
    <div class="muertos-results">
      <h3>📐 Cálculo de Macizos de Anclaje por Grupos</h3>
      
      <div class="totales-summary">
        <h4>📊 Totales del Proyecto</h4>
        <div class="totales-grid">
          <div class="total-item">
            <span class="label">Concreto:</span>
            <span class="value">${resultados.totales.concretoTon} ton</span>
          </div>
          <div class="total-item">
            <span class="label">Varillas ${resultados.parametros.tipoVarilla || '#4'}:</span>
            <span class="value">${resultados.totales.varillasKg} kg</span>
          </div>
          <div class="total-item">
            <span class="label">Anillos #3:</span>
            <span class="value">${resultados.totales.anillosKg} kg</span>
          </div>
          <div class="total-item">
            <span class="label">Alambre:</span>
            <span class="value">${resultados.totales.alambreKg} kg</span>
          </div>
        </div>
        <div class="proyecto-stats">
          <p><strong>Grupos calculados:</strong> ${resultados.totales.gruposCalculados}</p>
          <p><strong>Total muros:</strong> ${resultados.totales.murosTotal}</p>
          ${resultados.totales.gruposError > 0 ? `<p class="error">⚠️ Grupos con error: ${resultados.totales.gruposError}</p>` : ''}
        </div>
      </div>
      
      <table class="tabla-muertos">
        <thead>
          <tr>
            <th>Muerto</th>
            <th>X (Braces)</th>
            <th>Ángulo</th>
            <th>Eje</th>
            <th>Diámetro</th>
            <th>Altura</th>
            <th>Concreto (ton)</th>
            <th>Varillas (kg)</th>
            <th>Anillos (kg)</th>
            <th>Alambre (kg)</th>
            <th>Cant. Muros</th>
          </tr>
        </thead>
        <tbody>`;

  resultados.resultados.forEach(resultado => {
    if (resultado.error) {
      html += `
        <tr class="error-row">
          <td><strong>${resultado.grupo}</strong></td>
          <td>${resultado.xBraces}</td>
          <td>${resultado.angulo}°</td>
          <td>${resultado.eje}</td>
          <td colspan="7" class="error">${resultado.error}</td>
        </tr>`;
    } else {
      html += `
        <tr>
          <td><strong>${resultado.grupo}</strong></td>
          <td style="text-align: center; font-weight: bold;">${resultado.xBraces}</td>
          <td style="text-align: center; font-weight: bold;">${resultado.angulo}°</td>
          <td style="text-align: center; font-weight: bold; color: #28a745;">${resultado.eje || 'Sin asignar'}</td>
          <td>${resultado.seleccionado.diametroMm} mm<br><small>(${resultado.seleccionado.diametroIn}")</small></td>
          <td>${resultado.seleccionado.alturaMm} mm<br><small>(${resultado.seleccionado.alturaFt ? resultado.seleccionado.alturaFt.replace('-', '\'-') : 'N/A'}\")</small></td>
          <td style="font-weight: bold; color: #1f6feb;">${resultado.totales.concretoTon}</td>
          <td style="font-weight: bold; color: #1f6feb;">${resultado.totales.varillasKg}</td>
          <td style="font-weight: bold; color: #1f6feb;">${resultado.totales.anillosKg}</td>
          <td style="font-weight: bold; color: #1f6feb;">${resultado.totales.alambreKg}</td>
          <td style="text-align: center; font-weight: bold; color: #6f42c1;">${resultado.cantidadMuros}</td>
        </tr>`;
    }
  });

  html += `
        </tbody>
      </table>
      
      <div class="info-panel" style="margin-top: 1.5rem;">
        <h4>📋 Información del Cálculo</h4>
        <p><strong>Metodología:</strong> Cálculo basado en tabla agrupada por muertos (M1, M2, M3...)</p>
        <p><strong>Fórmula:</strong> FMC = FBX / (X_braces × cos(ángulo))</p>
        <p><strong>Referencia:</strong> TILT-UP HANDBOOK página 71</p>
        <p><strong>Totales:</strong> Multiplicados por cantidad de muros en cada grupo</p>
        <div style="margin-top: 1rem; padding: 1rem; background: rgba(31, 111, 235, 0.05); border-radius: 6px;">
          <p><strong>Parámetros utilizados:</strong></p>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li>Varillas: ${resultados.parametros.nVarillas} × ${resultados.parametros.tipoVarilla}</li>
            <li>Anillos: ${resultados.parametros.nAnillos} × #3</li>
            <li>Alambre: Ø1.22mm, amarre 0.35m</li>
            <li>Densidad concreto: 2400 kg/m³</li>
          </ul>
        </div>
      </div>
    </div>`;

  return html;
}

// ===== FUNCIÓN PARA TABLA DETALLADA POR MURO =====
export function generarTablaDetalladaPorMuro(resultados) {
  let html = `
    <div class="muertos-results">
      <h3>📋 Tabla Detallada de Materiales por Muro</h3>
      
      <table class="tabla-muertos-detallada">
        <thead>
          <tr>
            <th>Muro</th>
            <th>X (Braces)</th>
            <th>Cant. Muros</th>
            <th>Altura (mm)</th>
            <th>Diámetro (mm)</th>
            <th>Concreto (ton)</th>
            <th>Acero Varillas (kg)</th>
            <th>Acero Anillos (kg)</th>
            <th>Alambre (kg)</th>
            <th>Vol. Concreto (m³)</th>
          </tr>
        </thead>
        <tbody>`;

  let totales = {
    muros: 0,
    concreto: 0,
    varillas: 0,
    anillos: 0,
    alambre: 0,
    volumen: 0
  };

  resultados.resultados.forEach(resultado => {
    if (!resultado.error) {
      // Calcular detalles específicos
      const diametroMm = resultado.seleccionado.diametroMm;
      const alturaMm = resultado.seleccionado.alturaMm;
      const cantidadMuros = resultado.cantidadMuros || 1;
      
      // Calcular materiales detallados
      const pesoDetallado = calcularPesoMuertoDetallado(diametroMm, alturaMm);
      const aceroLongitudinal = calcularAceroLongitudinalDetallado(alturaMm, diametroMm, 4, '#4', cantidadMuros);
      const aceroTransversal = calcularAceroTransversalDetallado(diametroMm, alturaMm, 3, cantidadMuros);
      const alambreDetallado = calcularAlambre(4, 3, cantidadMuros);
      
      html += `
        <tr>
          <td><strong>${resultado.grupo || resultado.muro}</strong></td>
          <td style="text-align: center;">${resultado.xBraces}</td>
          <td style="text-align: center; font-weight: bold; color: #6f42c1;">${cantidadMuros}</td>
          <td style="text-align: center;">${alturaMm}</td>
          <td style="text-align: center;">${diametroMm}</td>
          <td style="font-weight: bold; color: #dc3545;">${(pesoDetallado.pesoTon * cantidadMuros).toFixed(3)}</td>
          <td style="font-weight: bold; color: #28a745;">${aceroLongitudinal.pesoKg.toFixed(1)}</td>
          <td style="font-weight: bold; color: #17a2b8;">${aceroTransversal.pesoKg.toFixed(1)}</td>
          <td style="font-weight: bold; color: #ffc107;">${alambreDetallado.pesoKg.toFixed(2)}</td>
          <td style="text-align: center;">${(pesoDetallado.volumen * cantidadMuros).toFixed(3)}</td>
        </tr>`;

      // Sumar a totales
      totales.muros += cantidadMuros;
      totales.concreto += pesoDetallado.pesoTon * cantidadMuros;
      totales.varillas += aceroLongitudinal.pesoKg;
      totales.anillos += aceroTransversal.pesoKg;
      totales.alambre += alambreDetallado.pesoKg;
      totales.volumen += pesoDetallado.volumen * cantidadMuros;
    }
  });

  // Fila de totales
  html += `
        <tr class="totales-row" style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #007acc;">
          <td style="text-align: center;"><strong>TOTALES</strong></td>
          <td style="text-align: center;">-</td>
          <td style="text-align: center; color: #6f42c1;">${totales.muros}</td>
          <td style="text-align: center;">-</td>
          <td style="text-align: center;">-</td>
          <td style="color: #dc3545;">${totales.concreto.toFixed(3)}</td>
          <td style="color: #28a745;">${totales.varillas.toFixed(1)}</td>
          <td style="color: #17a2b8;">${totales.anillos.toFixed(1)}</td>
          <td style="color: #ffc107;">${totales.alambre.toFixed(2)}</td>
          <td style="text-align: center;">${totales.volumen.toFixed(3)}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="resumen-materiales" style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px;">
      <h4>📊 Resumen de Materiales del Proyecto</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
        <div style="padding: 1rem; background: white; border-radius: 6px; border-left: 4px solid #dc3545;">
          <div style="font-size: 0.9rem; color: #6c757d;">Concreto Total</div>
          <div style="font-size: 1.2rem; font-weight: bold; color: #dc3545;">${totales.concreto.toFixed(3)} ton</div>
          <div style="font-size: 0.8rem; color: #6c757d;">${totales.volumen.toFixed(1)} m³</div>
        </div>
        <div style="padding: 1rem; background: white; border-radius: 6px; border-left: 4px solid #28a745;">
          <div style="font-size: 0.9rem; color: #6c757d;">Acero Varillas #4</div>
          <div style="font-size: 1.2rem; font-weight: bold; color: #28a745;">${totales.varillas.toFixed(1)} kg</div>
          <div style="font-size: 0.8rem; color: #6c757d;">${(totales.varillas / 0.785).toFixed(1)} m lineales</div>
        </div>
        <div style="padding: 1rem; background: white; border-radius: 6px; border-left: 4px solid #17a2b8;">
          <div style="font-size: 0.9rem; color: #6c757d;">Acero Anillos #3</div>
          <div style="font-size: 1.2rem; font-weight: bold; color: #17a2b8;">${totales.anillos.toFixed(1)} kg</div>
          <div style="font-size: 0.8rem; color: #6c757d;">${(totales.anillos / 0.376).toFixed(1)} m lineales</div>
        </div>
        <div style="padding: 1rem; background: white; border-radius: 6px; border-left: 4px solid #ffc107;">
          <div style="font-size: 0.9rem; color: #6c757d;">Alambre Ø1.22mm</div>
          <div style="font-size: 1.2rem; font-weight: bold; color: #ffc107;">${totales.alambre.toFixed(2)} kg</div>
          <div style="font-size: 0.8rem; color: #6c757d;">Amarre 35cm/nodo</div>
        </div>
      </div>
      
      <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0, 123, 255, 0.1); border-radius: 6px;">
        <h5>🔧 Especificaciones Técnicas</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
          <div>
            <strong>Concreto:</strong><br>
            • Densidad: 2400 kg/m³<br>
            • Forma: Cilíndrica<br>
            • Acabado: Liso
          </div>
          <div>
            <strong>Acero de Refuerzo:</strong><br>
            • Varillas: #4 (Ø12.7mm, 0.785 kg/m)<br>
            • Anillos: #3 (Ø9.5mm, 0.376 kg/m)<br>
            • Alambre: Ø1.22mm, amarre cada 35cm
          </div>
        </div>
      </div>
    </div>
  </div>`;

  return html;
}