// Test de un solo muerto para verificar precisión
import { obtenerConfiguracionMuerto } from './js/factoresRepeticion.js';
import { calcularReporteMuerto } from './js/muertoRectangular.js';

// Test muerto D1 (debería dar exactamente los valores del PDF)
const dimensionesD1 = { ancho: 1.26, alto: 1.74, profundidad: 0.96 };
const configBase = {
    tipoVarillaLongitudinal: 4,
    tipoVarillaTransversal: 3
};

const configConFactores = obtenerConfiguracionMuerto('D1', configBase);
console.log('Factores D1:', configConFactores);

const resultado = calcularReporteMuerto(dimensionesD1, configConFactores);
console.log('Resultado D1:', resultado);

const pesoAceroTotal = resultado.pesoLongitudinal + resultado.pesoTransversal + resultado.pesoAlambre;
console.log(`D1 - Acero Total: ${pesoAceroTotal.toFixed(2)} kg`);
console.log(`D1 - Volumen Hormigón: ${resultado.volumenConcreto.toFixed(3)} m³`);

// Valores esperados del PDF para D1:
// Acero: 17.63 kg, Hormigón: 0.600 m³
console.log('Esperado del PDF - Acero: 17.63 kg, Hormigón: 0.600 m³');