// Importa las funciones necesarias de Vitest
const { describe, test, expect } = require('vitest');
// Importa el módulo parse que contiene las funciones a probar
const parse = require('../lib/parse');

// Grupo de pruebas para la función parse
describe('Función parse', () => {
  // Prueba: convierte un string CSV en un array de objetos
  test('debería convertir un string CSV en array de objetos', () => {
    const csv = 'Variable,Frecuencia\n48,1\n49,2';
    const result = parse.csvToArray(csv);
    expect(result).toEqual([
      { Variable: '48', Frecuencia: '1' },
      { Variable: '49', Frecuencia: '2' }
    ]);
  });

  // Prueba: maneja un CSV vacío
  test('debería manejar CSV vacío', () => {
    const csv = '';
    const result = parse.csvToArray(csv);
    expect(result).toEqual([]);
  });

  // Prueba: convierte un array de objetos a CSV
  test('debería convertir array de objetos a CSV', () => {
    const data = [
      { Variable: 48, Frecuencia: 1 },
      { Variable: 49, Frecuencia: 2 }
    ];
    const result = parse.arrayToCsv(data);
    expect(result).toContain('Variable,Frecuencia');
    expect(result).toContain('48,1');
    expect(result).toContain('49,2');
  });
});
