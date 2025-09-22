import PDFDocument from 'pdfkit';

export function generarInforme(resultados: any[]): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    doc.fontSize(18).text('Informe de Paneles', { align: 'center' });
    doc.moveDown();

    resultados.forEach((res, i) => {
      doc.fontSize(12).text(`Panel #${i + 1} (${res.id_muro})`);
      doc.text(`Volumen: ${res.volumen_m3} m³`);
      doc.text(`Peso: ${res.peso_kN} kN`);
      doc.text(`Grua min: ${res.grua_min_kN_aprox} kN`);
      doc.text(`Viento: ${res.viento_kN} kN`);
      doc.text(`Tracción puntal: ${res.traccion_puntal_kN_aprox} kN`);
      doc.moveDown();
    });

    doc.end();
  });
}