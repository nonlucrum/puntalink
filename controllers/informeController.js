const PDFDocument = require('pdfkit');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
} = require('docx');

/**
 * Utilidades
 */
function getHeaders(tabla) {
  if (!Array.isArray(tabla) || tabla.length === 0) return [];
  return Object.keys(tabla[0]);
}

function getRows(tabla) {
  if (!Array.isArray(tabla)) return [];
  return tabla.map((row) => Object.values(row));
}

/**
 * Exportar a PDF con pdfkit
 */
async function exportPDF(req, res) {
  try {
    const { data } = req.body || {};
    if (!data || !data.outputs || !data.summary) {
      return res.status(400).json({ error: 'No hay datos para exportar' });
    }

    const { outputs, summary } = data;
    const tabla = outputs.tablaFrecuencias || [];
    const headers = getHeaders(tabla);
    const rows = getRows(tabla);

    // Encabezados HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="informe-calculos.pdf"');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Título
    doc.fontSize(20).text('Informe de Cálculos Técnicos', { align: 'center' });
    doc.moveDown(1.2);

    // Resumen
    doc.fontSize(12).text('Resumen Ejecutivo', { underline: true });
    doc.moveDown(0.5);
    doc.text(`Total de variables: ${summary.totalVariables}`);
    doc.text(`Total de observaciones: ${summary.totalObservaciones}`);
    if (summary.rangoVariables) {
      doc.text(
        `Rango de variables: ${summary.rangoVariables.min} a ${summary.rangoVariables.max}`
      );
    }
    doc.moveDown(1);

    // Estadísticos (si vienen)
    if (outputs.estadisticos) {
      const e = outputs.estadisticos;
      doc.fontSize(12).text('Estadísticos Descriptivos', { underline: true });
      doc.moveDown(0.5);
      doc.text(`Media: ${e.media}`);
      doc.text(`Mediana: ${e.mediana}`);
      doc.text(
        `Moda: ${
          Array.isArray(e.moda) ? (e.moda.length ? e.moda.join(', ') : '—') : e.moda
        }`
      );
      doc.text(`Varianza: ${e.varianza}`);
      doc.text(`Desviación estándar: ${e.desviacionEstandar}`);
      doc.text(`Rango: ${e.rango}`);
      doc.moveDown(1);
    }

    // Tabla
    if (headers.length && rows.length) {
      doc.fontSize(12).text('Tabla de Frecuencias', { underline: true });
      doc.moveDown(0.5);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidth = pageWidth / headers.length;
      let y = doc.y;

      // Encabezados
      headers.forEach((h, i) => {
        doc.font('Helvetica-Bold').text(String(h), doc.x + i * colWidth, y, {
          width: colWidth,
          align: 'center',
        });
      });
      y += 18;
      doc.moveTo(doc.x, y - 4).lineTo(doc.x + pageWidth, y - 4).stroke();

      // Filas
      doc.font('Helvetica');
      rows.forEach((r) => {
        // salto de página simple si hace falta
        if (y > doc.page.height - doc.page.margins.bottom - 24) {
          doc.addPage();
          y = doc.y;
        }
        r.forEach((cell, i) => {
          doc.text(String(cell), doc.x + i * colWidth, y, {
            width: colWidth,
            align: 'center',
          });
        });
        y += 16;
      });
    } else {
      doc.text('No hay filas para mostrar.');
    }

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
}

/**
 * Exportar a DOCX con docx
 */
async function exportDOCX(req, res) {
  try {
    const { data } = req.body || {};
    if (!data || !data.outputs || !data.summary) {
      return res.status(400).json({ error: 'No hay datos para exportar' });
    }

    const { outputs, summary } = data;
    const tabla = outputs.tablaFrecuencias || [];
    const headers = getHeaders(tabla);
    const rows = getRows(tabla);

    const children = [];

    // Título
    children.push(
      new Paragraph({
        text: 'Informe de Cálculos Técnicos',
        heading: HeadingLevel.TITLE,
      })
    );

    // Resumen
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Resumen Ejecutivo', bold: true })],
      })
    );
    children.push(
      new Paragraph(`Total de variables: ${summary.totalVariables}`)
    );
    children.push(
      new Paragraph(`Total de observaciones: ${summary.totalObservaciones}`)
    );
    if (summary.rangoVariables) {
      children.push(
        new Paragraph(
          `Rango de variables: ${summary.rangoVariables.min} a ${summary.rangoVariables.max}`
        )
      );
    }

    // Estadísticos (si vienen)
    if (outputs.estadisticos) {
      const e = outputs.estadisticos;
      children.push(new Paragraph(''));
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'Estadísticos Descriptivos', bold: true })] })
      );
      children.push(new Paragraph(`Media: ${e.media}`));
      children.push(new Paragraph(`Mediana: ${e.mediana}`));
      children.push(
        new Paragraph(
          `Moda: ${Array.isArray(e.moda) ? (e.moda.length ? e.moda.join(', ') : '—') : e.moda}`
        )
      );
      children.push(new Paragraph(`Varianza: ${e.varianza}`));
      children.push(new Paragraph(`Desviación estándar: ${e.desviacionEstandar}`));
      children.push(new Paragraph(`Rango: ${e.rango}`));
    }

    // Tabla
    if (headers.length && rows.length) {
      const tableRows = [];

      // encabezados
      tableRows.push(
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(h), bold: true })] })],
                width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
              })
          ),
        })
      );

      // filas
      rows.forEach((r) => {
        tableRows.push(
          new TableRow({
            children: r.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph(String(cell))],
                  width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
                })
            ),
          })
        );
      });

      children.push(new Paragraph(''));
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'Tabla de Frecuencias', bold: true })] })
      );
      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    const doc = new Document({ sections: [{ properties: {}, children }] });
    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="informe-calculos.docx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error generando DOCX:', error);
    res.status(500).json({ error: 'Error generando DOCX' });
  }
}

module.exports = {
  exportPDF,
  exportDOCX,
};
