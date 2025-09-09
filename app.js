const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const informesRoutes = require('./routes/informes');
const calculosService = require('./services/calculos');
const pilaresRoutes = require('./routes/pilares');   // ← NUEVO
// ...
const reportesRouter = require('./routes/reportes');
const importRouter = require('./routes/import');

// ...

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/informes', informesRoutes);
app.use('/api/pilares', pilaresRoutes);              // ← NUEVO endpoint
app.use('/api/reportes', reportesRouter);
app.use('/api/import-txt', importRouter);

app.post('/api/calculos', async (req, res) => {
  try {
    const result = await calculosService.runCalculations(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error en /api/calculos:', err);
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback (si usas Vue/React)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
