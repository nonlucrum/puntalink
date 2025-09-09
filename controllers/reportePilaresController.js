// controllers/reportePilaresController.js
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, TextRun } = require('docx');

function norm(v, d = 3) {
  if (v === 0) return '0';
  return (typeof v === 'number' && isFinite(v)) ? v.toFixed(d) : (v ?? '—');
}

function drawTablePDF(doc, x, y, headers, rows, colWidths) {
  const cellPad = 4;
  const rowH = 20;
  let cursorY = y;

  // header
  doc.rect(x, cursorY, colWidths.reduce((a,b)=>a+b,0), rowH).stroke();
  let cx = x;
  headers.forEach((h, i) => {
    doc.rect(cx, cursorY, colWidths[i], rowH).stroke();
    doc.text(String(h), cx + cellPad, cursorY + 5, { width: colWidths[i] - cellPad*2, align: 'center' });
    cx += colWidths[i];
  });
  cursorY += rowH;

  // rows
  rows.forEach(r => {
    cx = x;
    doc.rect(x, cursorY, colWidths.reduce((a,b)=>a+b,0), rowH).stroke();
    r.forEach((val, i) => {
      doc.rect(cx, cursorY, colWidths[i], rowH).stroke();
      doc.text(String(val), cx + cellPad, cursorY + 5, { width: colWidths[i] - cellPad*2, align: 'center' });
      cx += colWidths[i];
    });
    cursorY += rowH;
  });

  return cursorY;
}

function buildDocxTable(headers, rows) {
  return new Table({
    rows: [
      new TableRow({
        children: headers.map(h => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(h), bold: true })] })]
        }))
      }),
      ...rows.map(r => new TableRow({
        children: r.map(val => new TableCell({
          children: [new Paragraph(String(val))]
        }))
      }))
    ],
    width: { size: 100, type: "pct" }
  });
}

async function exportPDF(res, payload) {
  const { reporte, calculos } = payload;

  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-pilares.pdf"');
  doc.pipe(res);

  doc.fontSize(18).text('Reporte de Muertos y Braces', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Fecha: ${new Date().toLocaleString()}`);
  doc.moveDown();

  // resumen viento / geometría
  const r = calculos?.resultados || {};
  doc.fontSize(12).text('Resumen General', { underline: true });
  doc.fontSize(10)
     .text(`qz,site (kPa): ${norm(calculos?.resumen?.qz_kPa)}`)
     .text(`F viento (kN): ${norm(calculos?.resumen?.F_kN)}`)
     .text(`Área A (m²) : ${norm(r.A)}`)
     .text(`L brace (m) : ${norm(r.brace?.L_brace)}`);
  doc.moveDown();

  // Tabla Deadman
  doc.fontSize(12).text('Tabla: Deadman', { underline: true });
  let y = doc.y + 6;
  const deadHeaders = ['#', 'Eje', 'Muro', 'Esp. Long (m)', 'Esp. Transv (m)', 'X (m)', 'Tipo'];
  const deadRows = (reporte?.deadman || []).map((d, i) => [
    i + 1, d.eje ?? '—', d.muro ?? '—', norm(d.espLong), norm(d.espTransv), norm(d.X), d.tipo ?? 'rect'
  ]);
  y = drawTablePDF(doc, 40, y, deadHeaders, deadRows, [30, 60, 120, 90, 100, 60, 60]);
  doc.moveDown(2);

  // Tabla Braces
  doc.fontSize(12).text('Tabla: Braces', { underline: true });
  y = doc.y + 6;
  const brHeaders = ['Eje', 'Muro', 'Tipo', 'Cantidad', 'X (m)', 'θ (°)', 'NB ± (m)', 'Y (m)'];
  const brRows = (reporte?.braces || []).map(b => [
    b.eje ?? '—', b.muro ?? '—', b.tipo ?? '—', b.cantidad ?? 0,
    norm(b.X), norm(b.theta), norm(b.NB), norm(b.Y)
  ]);
  drawTablePDF(doc, 40, y, brHeaders, brRows, [60, 120, 60, 60, 60, 60, 60, 60]);
  doc.addPage();

  // Resumen de acero/alambre (si llega)
  const m = r.muerto || {};
  doc.fontSize(12).text('Acero y Alambre', { underline: true });
  doc.fontSize(10)
    .text(`Acero total (kg): ${norm(m?.armado?.kgSteelTotal_kg)}`)
    .text(`Estribos: n=${norm(m?.armado?.nEstribos,0)}, long total (m)=${norm(m?.armado?.longEstrTotal_m)}, kg=${norm(m?.armado?.kgEstriboTotal_kg)}`)
    .text(`Longitudinal total (kg): ${norm(m?.armado?.niveles?.kg_total_long)}`)
    .text(`Alambre: nudos=${norm(m?.alambre?.nudos,0)}, L (m)=${norm(m?.alambre?.longitud_m)}, kg=${norm(m?.alambre?.peso_kg)}`);
  doc.end();
}

async function exportDOCX(res, payload) {
  const { reporte, calculos } = payload;
  const doc = new Document({ creator: 'PuntaLink', description: 'Reporte de Muertos y Braces' });

  const title = new Paragraph({ text: 'Reporte de Muertos y Braces', heading: HeadingLevel.TITLE });
  const subt = new Paragraph({ text: `Fecha: ${new Date().toLocaleString()}` });

  const r = calculos?.resultados || {};
  const resumen = [
    new Paragraph({ text: 'Resumen General', heading: HeadingLevel.HEADING_2 }),
    new Paragraph(`qz,site (kPa): ${norm(calculos?.resumen?.qz_kPa)}`),
    new Paragraph(`F viento (kN): ${norm(calculos?.resumen?.F_kN)}`),
    new Paragraph(`Área A (m²): ${norm(r.A)}`),
    new Paragraph(`L brace (m): ${norm(r.brace?.L_brace)}`)
  ];

  const deadHeaders = ['#','Eje','Muro','Esp. Long (m)','Esp. Transv (m)','X (m)','Tipo'];
  const deadRows = (reporte?.deadman || []).map((d, i) => [
    i+1, d.eje ?? '—', d.muro ?? '—', norm(d.espLong), norm(d.espTransv), norm(d.X), d.tipo ?? 'rect'
  ]);
  const bracesHeaders = ['Eje','Muro','Tipo','Cantidad','X (m)','θ (°)','NB ± (m)','Y (m)'];
  const bracesRows = (reporte?.braces || []).map(b => [
    b.eje ?? '—', b.muro ?? '—', b.tipo ?? '—', b.cantidad ?? 0, norm(b.X), norm(b.theta), norm(b.NB), norm(b.Y)
  ]);

  doc.addSection({
    children: [
      title, subt,
      ...resumen,
      new Paragraph({ text: 'Tabla: Deadman', heading: HeadingLevel.HEADING_2 }),
      buildDocxTable(deadHeaders, deadRows),
      new Paragraph({ text: 'Tabla: Braces', heading: HeadingLevel.HEADING_2 }),
      buildDocxTable(bracesHeaders, bracesRows),
      new Paragraph({ text: 'Acero y Alambre', heading: HeadingLevel.HEADING_2 }),
      new Paragraph(`Acero total (kg): ${norm(r.muerto?.armado?.kgSteelTotal_kg)}`),
      new Paragraph(`Estribos: n=${norm(r.muerto?.armado?.nEstribos,0)}, long (m)=${norm(r.muerto?.armado?.longEstrTotal_m)}, kg=${norm(r.muerto?.armado?.kgEstriboTotal_kg)}`),
      new Paragraph(`Longitudinal total (kg): ${norm(r.muerto?.armado?.niveles?.kg_total_long)}`),
      new Paragraph(`Alambre: nudos=${norm(r.muerto?.alambre?.nudos,0)}, L (m)=${norm(r.muerto?.alambre?.longitud_m)}, kg=${norm(r.muerto?.alambre?.peso_kg)}`)
    ]
  });

  const buf = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-pilares.docx"');
  res.end(buf);
}

async function exportPilares(req, res) {
  try {
    const { format } = req.params;
    const payload = req.body; // { reporte: {deadman, braces}, calculos }
    if (!payload || !payload.reporte) {
      return res.status(400).json({ error: 'Falta contenido del reporte.' });
    }
    if (format === 'pdf') return exportPDF(res, payload);
    if (format === 'docx') return exportDOCX(res, payload);
    return res.status(400).json({ error: 'Formato no soportado.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo generar el reporte.' });
  }
}

module.exports = { exportPilares };
