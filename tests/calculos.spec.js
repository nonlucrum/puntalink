// Importar dependencias de Vitest
const { describe, test, expect } = require('vitest');
// Importar el servicio de cálculos
const calculosService = require('../services/calculos');

// Tests para el servicio de cálculos
describe('Servicios de Cálculos', () => {

  // --- Normalización de datos ---
  describe('normalizeInputs', () => {
    // Debe normalizar datos válidos correctamente
    test('debería normalizar datos válidos correctamente', () => {
      const input = [
        { Variable: 48, Frecuencia: 1 },
        { Variable: 49, Frecuencia: 2 },
        { Variable: '50,5', Frecuencia: '3' }
      ];

      const result = calculosService.normalizeInputs(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ variable: 48, frecuencia: 1 });
      expect(result[1]).toEqual({ variable: 49, frecuencia: 2 });
      expect(result[2]).toEqual({ variable: 50.5, frecuencia: 3 });
    });

    // Debe filtrar datos inválidos
    test('debería filtrar datos inválidos', () => {
      const input = [
        { Variable: 48, Frecuencia: 1 },
        { Variable: 'invalid', Frecuencia: 2 },
        { Variable: 50, Frecuencia: 0 },
        { Variable: 51, Frecuencia: -1 }
      ];

      const result = calculosService.normalizeInputs(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ variable: 48, frecuencia: 1 });
    });

    // Debe lanzar error con datos vacíos
    test('debería lanzar error con datos vacíos', () => {
      expect(() => calculosService.normalizeInputs([])).toThrow('Los datos deben ser un array no vacío');
      expect(() => calculosService.normalizeInputs(null)).toThrow('Los datos deben ser un array no vacío');
    });
  });

  // --- Frecuencias absolutas ---
  describe('calcularFrecuenciasAbsolutas', () => {
    test('debería calcular frecuencias absolutas correctamente', () => {
      const input = [
        { variable: 48, frecuencia: 1 },
        { variable: 49, frecuencia: 2 },
        { variable: 50, frecuencia: 3 }
      ];

      const result = calculosService.calcularFrecuenciasAbsolutas(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ variable: 48, frecuencia: 1 });
      expect(result[1]).toEqual({ variable: 49, frecuencia: 2 });
      expect(result[2]).toEqual({ variable: 50, frecuencia: 3 });
    });
  });

  // --- Frecuencias acumuladas ---
  describe('calcularFrecuenciasAcumuladas', () => {
    test('debería calcular frecuencias acumuladas correctamente', () => {
      const input = [
        { variable: 48, frecuencia: 1 },
        { variable: 49, frecuencia: 2 },
        { variable: 50, frecuencia: 3 }
      ];

      const result = calculosService.calcularFrecuenciasAcumuladas(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ variable: 48, frecuenciaAcumulada: 1 });
      expect(result[1]).toEqual({ variable: 49, frecuenciaAcumulada: 3 });
      expect(result[2]).toEqual({ variable: 50, frecuenciaAcumulada: 6 });
    });
  });

  // --- Total de observaciones ---
  describe('calcularTotalObservaciones', () => {
    test('debería calcular el total de observaciones', () => {
      const input = [
        { variable: 48, frecuencia: 1 },
        { variable: 49, frecuencia: 2 },
        { variable: 50, frecuencia: 3 }
      ];

      const result = calculosService.calcularTotalObservaciones(input);

      expect(result).toBe(6);
    });

    test('debería retornar 0 para array vacío', () => {
      const result = calculosService.calcularTotalObservaciones([]);
      expect(result).toBe(0);
    });
  });

  // --- Frecuencias relativas ---
  describe('calcularFrecuenciasRelativas', () => {
    test('debería calcular frecuencias relativas correctamente', () => {
      const input = [
        { variable: 48, frecuencia: 1 },
        { variable: 49, frecuencia: 2 },
        { variable: 50, frecuencia: 3 }
      ];
      const total = 6;

      const result = calculosService.calcularFrecuenciasRelativas(input, total);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ variable: 48, frecuenciaRelativa: 0.1667 });
      expect(result[1]).toEqual({ variable: 49, frecuenciaRelativa: 0.3333 });
      expect(result[2]).toEqual({ variable: 50, frecuenciaRelativa: 0.5 });
    });
  });

  // --- Estadísticos descriptivos ---
  describe('calcularEstadisticosDescriptivos', () => {
    test('debería calcular estadísticos correctamente', () => {
      const input = [
        { variable: 48, frecuencia: 1 },
        { variable: 49, frecuencia: 1 },
        { variable: 50, frecuencia: 1 },
        { variable: 51, frecuencia: 1 }
      ];

      const result = calculosService.calcularEstadisticosDescriptivos(input);

      expect(result.media).toBeCloseTo(49.5, 2);
      expect(result.mediana).toBe(49.5);
      expect(result.minimo).toBe(48);
      expect(result.maximo).toBe(51);
      expect(result.rango).toBe(3);
      expect(result.totalObservaciones).toBe(4);
    });
  });

  // --- Ejecución completa de cálculos ---
  describe('runCalculations', () => {
    test('debería ejecutar todos los cálculos correctamente', async () => {
      const input = [
        { Variable: 48, Frecuencia: 1 },
        { Variable: 49, Frecuencia: 2 },
        { Variable: 50, Frecuencia: 2 },
        { Variable: 51, Frecuencia: 1 }
      ];

      const result = await calculosService.runCalculations(input);

      // Verificar estructura del resultado
      expect(result).toHaveProperty('inputs');
      expect(result).toHaveProperty('outputs');
      expect(result).toHaveProperty('trace');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('timestamp');

      // Verificar outputs
      expect(result.outputs).toHaveProperty('frecuenciasAbsolutas');
      expect(result.outputs).toHaveProperty('frecuenciasAcumuladas');
      expect(result.outputs).toHaveProperty('frecuenciasRelativas');
      expect(result.outputs).toHaveProperty('frecuenciasRelativasAcumuladas');
      expect(result.outputs).toHaveProperty('tablaFrecuencias');
      expect(result.outputs).toHaveProperty('estadisticos');

      // Verificar que la tabla tiene el formato correcto
      expect(result.outputs.tablaFrecuencias).toHaveLength(4);
      expect(result.outputs.tablaFrecuencias[0]).toHaveProperty('Variable');
      expect(result.outputs.tablaFrecuencias[0]).toHaveProperty('Frecuencias absolutas Simple');
      expect(result.outputs.tablaFrecuencias[0]).toHaveProperty('Frecuencias relativas Simple');

      // Resumen
      expect(result.summary.totalObservaciones).toBe(6);
      expect(result.summary.rangoVariables.min).toBe(48);
      expect(result.summary.rangoVariables.max).toBe(51);
    });

    // Debe manejar errores correctamente
    test('debería manejar errores correctamente', async () => {
      await expect(calculosService.runCalculations([])).rejects.toThrow();
      await expect(calculosService.runCalculations(null)).rejects.toThrow();
    });
  });

  // --- Utilidades ---
  describe('parseNumber', () => {
    test('debería parsear números correctamente', () => {
      expect(calculosService.parseNumber(42)).toBe(42);
      expect(calculosService.parseNumber('42')).toBe(42);
      expect(calculosService.parseNumber('42.5')).toBe(42.5);
      expect(calculosService.parseNumber('42,5')).toBe(42.5);
      expect(calculosService.parseNumber('invalid')).toBeNaN();
      expect(calculosService.parseNumber(null)).toBeNaN();
    });
  });

  describe('roundTo', () => {
    test('debería redondear correctamente', () => {
      expect(calculosService.roundTo(3.14159, 2)).toBe(3.14);
      expect(calculosService.roundTo(3.14159, 4)).toBe(3.1416);
      expect(calculosService.roundTo(3, 2)).toBe(3);
    });
  });

  describe('formatPercentage', () => {
    test('debería formatear porcentajes correctamente', () => {
      expect(calculosService.formatPercentage(0.5)).toBe('50.00%');
      expect(calculosService.formatPercentage(0.3333)).toBe('33.33%');
      expect(calculosService.formatPercentage(1)).toBe('100.00%');
    });
  });

});
