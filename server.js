const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const calculosRoutes = require('./routes/calculos');
const verificacionRoutes = require('./routes/verificacion');
const informeRoutes = require('./routes/informe');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/calculos', calculosRoutes);
app.use('/verificacion', verificacionRoutes);
app.use('/informe', informeRoutes);

// Error 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

// Servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
