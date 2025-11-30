/**
 * CÁLCULOS DE ARMADO TRIANGULAR (PRISMA)
 * Basado en la lógica de 'muertoRectangular.js' pero adaptando la geometría.
 */

const PESO_ESPECIFICO_KG_M = { '#3': 0.560, '#4': 0.994, '#5': 1.552, '#6': 2.235, '#8': 3.973 };
const DENSIDAD_ACERO = 7850;

function obtenerPeso(tipo) {
  let k = String(tipo).replace('#','').trim();
  return PESO_ESPECIFICO_KG_M['#'+k] || 0.994;
}

// 1. CONCRETO (Prisma Triangular)
// Volumen = (Base * Alto / 2) * Largo
function calcularConcreto(dim, densidad, desperdicio) {
  const B = parseFloat(dim.base);
  const H = parseFloat(dim.alto);
  const L = parseFloat(dim.largo);

  const area = (B * H) / 2;
  const vol_geom = area * L;
  const peso = vol_geom * densidad;

  return { base: B, alto: H, largo: L, volumen_m3: vol_geom, peso_kg: peso };
}

// 2. LONGITUDINAL (Barras a lo largo de L)
// Usualmente se ponen en las esquinas del triángulo (3 varillas min) o distribuidas en la base.
function calcularLongitudinal(conc, config) {
  const L = conc.largo;
  const cant = parseInt(config.cantidadVarillas || 3); // Mínimo 1 arriba, 2 abajo
  const tipo = config.tipoVarilla || '#4';
  
  const total_m = L * cant;
  const peso = total_m * obtenerPeso(tipo);

  return { cantidad: cant, tipo, total_m, peso_kg: peso };
}

// 3. TRANSVERSAL (Estribos Triangulares)
function calcularTransversal(conc, config) {
  const B = conc.base;
  const H = conc.alto;
  const L = conc.largo;
  
  const rec = (config.recubrimiento || 4) / 100;
  const sep = (config.separacion || 20) / 100;
  const tipo = config.tipoVarilla || '#3';

  // Dimensiones del núcleo (triángulo interno)
  const baseNuc = Math.max(B - (2*rec), 0.10);
  const altoNuc = Math.max(H - (2*rec), 0.10);
  
  // Hipotenusa del estribo (asumiendo isósceles)
  // Lado^2 = (Base/2)^2 + Alto^2
  const ladoInclinado = Math.sqrt(Math.pow(baseNuc/2, 2) + Math.pow(altoNuc, 2));
  
  // Perímetro = Base + 2*Lado + Ganchos cierre
  const perimetro = baseNuc + (2 * ladoInclinado) + 0.20; // 20cm ganchos

  const cantidad = Math.ceil(L / sep) + 1;
  const total_m = perimetro * cantidad;
  const peso = total_m * obtenerPeso(tipo);

  return { cantidad, tipo, total_m, peso_kg: peso };
}

// 4. COORDINADOR
export function calcularMacizosTriangulares(grupos, configUI = {}) {
  const resultados = [];

  grupos.forEach(grupo => {
    const config = { ...configUI, ...(grupo.configGrupo || {}) };
    
    const dim = {
      base: config.baseTriangulo || 0.80, // Base configurable
      alto: grupo.alto_total || 1.0,      // Profundidad del grupo
      largo: grupo.largo_total || 1.0     // Largo del muro
    };

    const conc = calcularConcreto(dim, config.densidadConcreto || 2400, 1.05);
    const long = calcularLongitudinal(conc, {
      cantidadVarillas: config.cantLongitudinal, 
      tipoVarilla: config.tipoVarillaLong
    });
    const trans = calcularTransversal(conc, {
      separacion: config.separacionEstribos,
      recubrimiento: config.recubrimiento,
      tipoVarilla: config.tipoVarillaTrans
    });
    
    // Alambre simple estimación (5% del peso acero)
    const pesoAcero = long.peso_kg + trans.peso_kg;
    const pesoAlambre = pesoAcero * 0.05; 

    resultados.push({
      grupo_numero: grupo.numero_grupo,
      eje: grupo.eje,
      muros_list: grupo.muros_list,
      
      base: conc.base,
      alto: conc.alto,
      largo: conc.largo,
      
      volumen_m3: conc.volumen_m3,
      peso_conc: conc.peso_kg,
      peso_acero_total: pesoAcero + pesoAlambre,
      
      detalles: { long, trans }
    });
  });

  return resultados;
}

// 5. HTML
export function generarTablaResultadosTriangulares(resultados) {
  if(!resultados.length) return '<p>Sin resultados.</p>';

  let html = `<tbody>`;
  let tVol=0, tAcero=0;

  resultados.forEach(r => {
    tVol += r.volumen_m3;
    tAcero += r.peso_acero_total;

    html += `
      <tr>
        <td class="text-center fw-bold">G${r.grupo_numero}</td>
        <td>${r.eje}</td>
        <td class="bg-light text-center">${r.base.toFixed(2)} m</td>
        <td class="bg-light text-center">${r.alto.toFixed(2)} m</td>
        <td class="bg-light text-center">${r.largo.toFixed(2)} m</td>
        
        <td class="text-end text-success fw-bold">${r.volumen_m3.toFixed(2)} m³</td>
        <td class="text-end">${(r.peso_conc/1000).toFixed(2)} T</td>
        
        <td class="text-end fw-bold">${r.peso_acero_total.toFixed(1)} kg</td>
      </tr>
    `;
  });

  html += `</tbody><tfoot>
    <tr class="table-dark">
      <td colspan="5" class="text-end">TOTALES TRIANGULARES:</td>
      <td class="text-end">${tVol.toFixed(2)} m³</td>
      <td></td>
      <td class="text-end">${tAcero.toFixed(1)} kg</td>
    </tr></tfoot>`;
    
  return html;
}