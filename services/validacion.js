const validacionService = {
  validarDatos: (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Debe proporcionar un conjunto de datos válido.');
    }

    data.forEach((row, index) => {
      if (!('Variable' in row) || !('Frecuencia' in row)) {
        throw new Error(`Fila ${index + 1}: faltan campos requeridos.`);
      }
      if (isNaN(parseFloat(row.Variable)) || isNaN(parseFloat(row.Frecuencia))) {
        throw new Error(`Fila ${index + 1}: valores no numéricos.`);
      }
      if (parseFloat(row.Frecuencia) <= 0) {
        throw new Error(`Fila ${index + 1}: frecuencia debe ser mayor a cero.`);
      }
    });

    return true;
  }
};

module.exports = validacionService;
