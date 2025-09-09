/**
 * Servicio de cálculos estadísticos y de frecuencias para datos tabulares.
 *
 * Proporciona utilidades para:
 * - Parsear y normalizar datos de entrada.
 * - Calcular frecuencias absolutas y relativas (simples y acumuladas).
 * - Calcular estadísticos descriptivos (media, mediana, moda, mínimo, máximo, rango, varianza, desviación estándar).
 * - Formatear porcentajes y redondear valores.
 * - Generar un resumen completo de los cálculos realizados.
 *
 * Métodos:
 * @property {function(value: number|string): number} parseNumber
 *   Convierte un valor a número, soportando strings con coma decimal.
 *
 * @property {function(value: number, decimals?: number): number} roundTo
 *   Redondea un número a la cantidad de decimales indicada (por defecto 4).
 *
 * @property {function(value: number): string} formatPercentage
 *   Formatea un valor decimal como porcentaje con dos decimales.
 *
 * @property {function(data: Array<{Variable: any, Frecuencia: any}>): Array<{variable: number, frecuencia: number}>} normalizeInputs
 *   Normaliza los datos de entrada, asegurando que sean válidos y numéricos.
 *
 * @property {function(data: Array<{variable: number, frecuencia: number}>): Array<{variable: number, frecuencia: number}>} calcularFrecuenciasAbsolutas
 *   Calcula las frecuencias absolutas simples.
 *
 * @property {function(data: Array<{variable: number, frecuencia: number}>): Array<{variable: number, frecuenciaAcumulada: number}>} calcularFrecuenciasAcumuladas
 *   Calcula las frecuencias absolutas acumuladas.
 *
 * @property {function(data: Array<{variable: number, frecuencia: number}>): number} calcularTotalObservaciones
 *   Calcula el total de observaciones sumando todas las frecuencias.
 *
 * @property {function(data: Array<{variable: number, frecuencia: number}>, total: number): Array<{variable: number, frecuenciaRelativa: number}>} calcularFrecuenciasRelativas
 *   Calcula las frecuencias relativas simples.
 *
 * @property {function(data: Array<{variable: number, frecuencia: number}>, total: number): Array<{variable: number, frecuenciaRelativaAcumulada: number}>} calcularFrecuenciasRelativasAcumuladas
 *   Calcula las frecuencias relativas acumuladas.
 *
 * @property {function(data: Array<{variable: number, frecuencia: number}>): Object} calcularEstadisticosDescriptivos
 *   Calcula estadísticos descriptivos: media, mediana, moda, mínimo, máximo, rango, varianza y desviación estándar.
 *
 * @property {function(rawData: Array<{Variable: any, Frecuencia: any}>): Promise<Object>} runCalculations
 *   Ejecuta todos los cálculos y devuelve un resumen completo.
 */
const calculosService = {
  // Convierte un valor a número, soportando strings con coma decimal
  parseNumber: (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Reemplazar coma por punto y parsear
      const parsed = parseFloat(value.replace(',', '.'));
      return isNaN(parsed) ? NaN : parsed;
    }
    return NaN;
  },

  // Redondea un número a la cantidad de decimales indicada (por defecto 4)
  roundTo: (value, decimals = 4) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },

  // Formatea un valor decimal como porcentaje con dos decimales
  formatPercentage: (value) => {
    return `${(value * 100).toFixed(2)}%`;
  },

  // Normaliza los datos de entrada, asegurando que sean válidos y numéricos
  normalizeInputs: (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Los datos deben ser un array no vacío');
    }

    return data
      .map(row => {
        const variable = calculosService.parseNumber(row.Variable);
        const frecuencia = calculosService.parseNumber(row.Frecuencia);
        // Filtra valores no numéricos o frecuencias no positivas
        if (isNaN(variable) || isNaN(frecuencia) || frecuencia <= 0) {
          return null;
        }
        return { variable, frecuencia };
      })
      .filter(Boolean); // Elimina los nulos
  },

  // Calcula las frecuencias absolutas simples
  calcularFrecuenciasAbsolutas: (data) => {
    return data.map(row => ({
      variable: row.variable,
      frecuencia: row.frecuencia
    }));
  },

  // Calcula las frecuencias absolutas acumuladas
  calcularFrecuenciasAcumuladas: (data) => {
    let acumulada = 0;
    return data.map(row => {
      acumulada += row.frecuencia;
      return {
        variable: row.variable,
        frecuenciaAcumulada: acumulada
      };
    });
  },

  // Calcula el total de observaciones sumando todas las frecuencias
  calcularTotalObservaciones: (data) => {
    return data.reduce((total, row) => total + row.frecuencia, 0);
  },

  // Calcula las frecuencias relativas simples
  calcularFrecuenciasRelativas: (data, total) => {
    return data.map(row => ({
      variable: row.variable,
      frecuenciaRelativa: calculosService.roundTo(row.frecuencia / total, 4)
    }));
  },

  // Calcula las frecuencias relativas acumuladas
  calcularFrecuenciasRelativasAcumuladas: (data, total) => {
    let acumulada = 0;
    return data.map(row => {
      acumulada += row.frecuencia;
      return {
        variable: row.variable,
        frecuenciaRelativaAcumulada: calculosService.roundTo(acumulada / total, 4)
      };
    });
  },

  // Calcula estadísticos descriptivos: media, mediana, moda, mínimo, máximo, rango, varianza y desviación estándar
  calcularEstadisticosDescriptivos: (data) => {
    // Expande los datos según la frecuencia
    const variables = data.flatMap(row => Array(row.frecuencia).fill(row.variable));
    const totalObservaciones = variables.length;
    // Media
    const media = variables.reduce((a, b) => a + b, 0) / totalObservaciones;
    // Ordena para calcular la mediana
    const sorted = [...variables].sort((a, b) => a - b);
    const mid = Math.floor(totalObservaciones / 2);
    // Mediana
    const mediana =
      totalObservaciones % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    // Moda
    const valoresUnicos = [...new Set(variables)];
    const conteoModas = valoresUnicos.map(v => ({
      valor: v,
      frecuencia: variables.filter(x => x === v).length
    }));
    const maxFrecuencia = Math.max(...conteoModas.map(x => x.frecuencia));
    const moda = conteoModas.filter(x => x.frecuencia === maxFrecuencia).map(x => x.valor);
    // Mínimo y máximo
    const minimo = Math.min(...variables);
    const maximo = Math.max(...variables);
    // Rango
    const rango = maximo - minimo;
    // Varianza
    const varianza = variables.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / totalObservaciones;
    // Desviación estándar
    const desviacionEstandar = Math.sqrt(varianza);

    return {
      media: calculosService.roundTo(media, 4),
      mediana,
      moda,
      minimo,
      maximo,
      rango,
      varianza: calculosService.roundTo(varianza, 4),
      desviacionEstandar: calculosService.roundTo(desviacionEstandar, 4),
      totalObservaciones
    };
  },

  // Ejecuta todos los cálculos y devuelve un resumen completo
  runCalculations: async (rawData) => {
    const inputs = calculosService.normalizeInputs(rawData);

    const frecuenciasAbsolutas = calculosService.calcularFrecuenciasAbsolutas(inputs);
    const frecuenciasAcumuladas = calculosService.calcularFrecuenciasAcumuladas(frecuenciasAbsolutas);
    const totalObservaciones = calculosService.calcularTotalObservaciones(frecuenciasAbsolutas);
    const frecuenciasRelativas = calculosService.calcularFrecuenciasRelativas(frecuenciasAbsolutas, totalObservaciones);
    const frecuenciasRelativasAcumuladas = calculosService.calcularFrecuenciasRelativasAcumuladas(frecuenciasAbsolutas, totalObservaciones);
    const estadisticos = calculosService.calcularEstadisticosDescriptivos(frecuenciasAbsolutas);

    // Construye la tabla de frecuencias con todos los datos calculados
    const tablaFrecuencias = frecuenciasAbsolutas.map((row, index) => ({
      Variable: row.variable,
      'Frecuencias absolutas Simple': row.frecuencia,
      'Frecuencias absolutas Acumulada': frecuenciasAcumuladas[index].frecuenciaAcumulada,
      'Frecuencias relativas Simple': frecuenciasRelativas[index].frecuenciaRelativa,
      'Frecuencias relativas Acumulada': frecuenciasRelativasAcumuladas[index].frecuenciaRelativaAcumulada
    }));

    // Retorna todos los resultados y un resumen
    return {
      inputs,
      outputs: {
        frecuenciasAbsolutas,
        frecuenciasAcumuladas,
        frecuenciasRelativas,
        frecuenciasRelativasAcumuladas,
        tablaFrecuencias,
        estadisticos
      },
      trace: [],
      summary: {
        totalVariables: inputs.length,
        totalObservaciones,
        rangoVariables: {
          min: estadisticos.minimo,
          max: estadisticos.maximo
        }
      },
      timestamp: new Date().toISOString()
    };
  }
};

// Exporta el servicio para su uso en otros módulos
module.exports = calculosService;
