// routes/import.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Puedes mejorar este parser, es solo ejemplo
function parsePanelsPlusTXT(txt) {
  const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
  let startIdx = -1;
  let endIdx = lines.length;
  for (let i = 0; i < lines.length; ++i) {
    if (/^Panel\s*,\s*Thickness\s*,\s*Area/i.test(lines[i])) {
      startIdx = i + 1;
      break;
    }
  }
  if (startIdx < 0) return { paneles: [] };
  for (let i = startIdx; i < lines.length; ++i) {
    if (/^=+/.test(lines[i]) || lines[i] === '') {
      endIdx = i;
      break;
    }
  }
  const paneles = [];
  for (let i = startIdx; i < endIdx; ++i) {
    const row = lines[i];
    if (!row.match(/^\(\d+\)\s*P/)) continue;
    const campos = row.split(',').map(x => x.trim());
    // Ahora une el campo y el decimal:
    // Panel, Thickness, Area, Weight, Volume, ... pueden tener valores como "66", "0"
    // pero están separados, así que los unes: area = campos[2] + "," + campos[3]
    paneles.push({
      panel: campos[0],
      thickness: campos[1],
      area: campos[2] + ',' + campos[3],
      weight: campos[4] + ',' + campos[5],
      volume: campos[6] + ',' + campos[7],
      // ... sigue así con más campos si necesitas
    });
  }
  return { paneles };
}





// RUTA SOLO "/"
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo.' });
  const txt = req.file.buffer.toString('utf8');
  const data = parsePanelsPlusTXT(txt);
  res.json(data);
});

module.exports = router;
