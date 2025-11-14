// Test con datos exactos del proyecto
const datosProyecto = [
  { muerto: 'M1', braces: 2, angulo: 52, eje: 'A', tipo: 'TILT-UP', cantMuros: 1, muros: ['M01'] },
  { muerto: 'M2', braces: 2, angulo: 55, eje: 'B', tipo: 'TILT-UP', cantMuros: 1, muros: ['M02'] },
  { muerto: 'M3', braces: 2, angulo: 55, eje: 'A', tipo: 'TILT-UP', cantMuros: 2, muros: ['M03', 'M04'] },
  { muerto: 'M4', braces: 2, angulo: 55, eje: 'B', tipo: 'TILT-UP', cantMuros: 2, muros: ['M82', 'M83'] },
  { muerto: 'M5', braces: 2, angulo: 55, eje: 'A', tipo: 'TILT-UP', cantMuros: 1, muros: ['M84'] },
  { muerto: 'M6', braces: 2, angulo: 55, eje: 'B', tipo: 'TILT-UP', cantMuros: 1, muros: ['M85'] },
  { muerto: 'M7', braces: 2, angulo: 52, eje: '32', tipo: 'TILT-UP', cantMuros: 1, muros: ['M86'] },
  { muerto: 'M8', braces: 2, angulo: 55, eje: '33', tipo: 'TILT-UP', cantMuros: 1, muros: ['M87'] },
  { muerto: 'M9', braces: 2, angulo: 55, eje: '32', tipo: 'TILT-UP', cantMuros: 2, muros: ['M88', 'M91'] },
  { muerto: 'M10', braces: 3, angulo: 53, eje: '32', tipo: 'TILT-UP', cantMuros: 2, muros: ['M92', 'M110'] },
  { muerto: 'M11', braces: 2, angulo: 55, eje: '32', tipo: 'TILT-UP', cantMuros: 1, muros: ['M111'] },
  { muerto: 'M12', braces: 2, angulo: 55, eje: '1', tipo: 'TILT-UP', cantMuros: 2, muros: ['M203', 'M207'] },
  { muerto: 'M13', braces: 3, angulo: 53, eje: '1', tipo: 'TILT-UP', cantMuros: 2, muros: ['M208', 'M226'] },
  { muerto: 'M14', braces: 2, angulo: 55, eje: '1', tipo: 'TILT-UP', cantMuros: 2, muros: ['M227', 'M230'] },
  { muerto: 'M15', braces: 2, angulo: 55, eje: '2', tipo: 'TILT-UP', cantMuros: 1, muros: ['M231'] },
  { muerto: 'M16', braces: 2, angulo: 55, eje: '1', tipo: 'TILT-UP', cantMuros: 1, muros: ['M232'] }
];

// Mapeo de muerto M a muerto D (según factores de Magnorth)
const mapeoMuertoID = {
  'M1': 'D1', 'M2': 'D2', 'M3': 'D3', 'M4': 'D4', 'M5': 'D5', 'M6': 'D6',
  'M7': 'D7', 'M8': 'D8', 'M9': 'D9', 'M10': 'D10', 'M11': 'D11', 'M12': 'D12',
  'M13': 'D13', 'M14': 'D14', 'M15': 'D15', 'M16': 'D16'
};

console.log('=== DATOS DEL PROYECTO ===');
datosProyecto.forEach((item, index) => {
  const muertoD = mapeoMuertoID[item.muerto];
  console.log(`${index + 1}. ${item.muerto} (${muertoD}) - ${item.cantMuros} muro(s): ${item.muros.join(', ')} - Eje ${item.eje}`);
});

console.log('\\n=== TOTAL MUROS POR MUERTO ===');
let totalMuros = 0;
datosProyecto.forEach(item => {
  totalMuros += item.cantMuros;
  console.log(`${item.muerto}: ${item.cantMuros} muro(s)`);
});
console.log(`TOTAL MUROS: ${totalMuros}`);

// Para usar en dashboard - formato esperado
const configParaDashboard = {
  muertos: datosProyecto.map(item => ({
    id: mapeoMuertoID[item.muerto],
    eje: item.eje,
    cantidadMuros: item.cantMuros,
    muros: item.muros,
    angulo: item.angulo,
    braces: item.braces
  }))
};

console.log('\\n=== CONFIG PARA DASHBOARD ===');
console.log(JSON.stringify(configParaDashboard, null, 2));