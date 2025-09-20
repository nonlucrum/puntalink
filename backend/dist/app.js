"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const multer_1 = __importDefault(require("multer"));
const index_1 = __importDefault(require("./routes/index"));
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const calculos_1 = __importDefault(require("./routes/calculos"));
const verificacion_1 = __importDefault(require("./routes/verificacion"));
const informe_1 = __importDefault(require("./routes/informe"));
const informes_1 = __importDefault(require("./routes/informes"));
const pilares_1 = __importDefault(require("./routes/pilares"));
const reportes_1 = __importDefault(require("./routes/reportes"));
const import_1 = __importDefault(require("./routes/import"));
// 🔹 Importamos el middleware de auth
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
// ===== Logger simple (para ver URLs exactas) =====
app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});
// ===== Middlewares =====
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// ===== Static & views =====
app.set('views', path_1.default.join(__dirname, '..', 'views'));
app.set('view engine', 'html'); // cambia si usas ejs/pug/etc.
// ===== Healthcheck =====
app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'puntalink-pro-ts-struct' });
});
// ===== Rutas base =====
app.use('/', index_1.default);
app.use('/auth', auth_1.default);
app.use('/dashboard', dashboard_1.default);
app.use('/calculos', calculos_1.default);
app.use('/verificacion', verificacion_1.default);
app.use('/informe', informe_1.default);
app.use('/informes', informes_1.default);
app.use('/pilares', pilares_1.default);
app.use('/reportes', reportes_1.default);
// ===== Ejemplo de ruta protegida =====
app.get('/perfil', auth_2.authMiddleware, (req, res) => {
    res.json({ message: 'Bienvenido a tu perfil', user: req.user });
});
// ===== Importación TXT: lee SOLO Panel, Thickness, Area, Weight, Volume =====
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
async function parseTXT_MinColumns(raw) {
    const lines = raw.split(/\r?\n/);
    const paneles = [];
    for (const line of lines) {
        const ln = line.trim();
        if (!ln)
            continue;
        if (!/^\(\d+\)/.test(ln))
            continue;
        // Paso 1: convertir comas decimales en puntos (ej: "66,5" → "66.5")
        const fixedLine = ln.replace(/(\d),(\d)/g, "$1.$2");
        // Paso 2: separar columnas por comas
        const cols = fixedLine.split(",").map(c => c.trim());
        if (cols.length < 5)
            continue;
        const panel = cols[0];
        const thickness = cols[1] || "";
        const area = cols[2] || "";
        const weight = cols[3] || "";
        const volume = cols[4] || "";
        if (!thickness)
            continue;
        paneles.push({ panel, thickness, area, weight, volume });
        const nuevoMuro = await (0, db_1.addMuro)(1, // pk_proyecto
        panel, // id_muro
        parseFloat(thickness), // grosor
        parseFloat(area), // area
        parseFloat(weight), // peso
        parseFloat(volume) // volumen
        );
        console.log("Muro agregado:", nuevoMuro);
    }
    return paneles;
}
app.post(/.*import.*/i, upload.single('file'), async (req, res) => {
    try {
        const pk_proy = 1; // Cambia esto si el proyecto es dinámico
        await (0, db_1.overrideMuros)(pk_proy); // <-- Borra los muros antes de importar
        if (!req.file) {
            return res.status(400).json({ paneles: [] });
        }
        const txt = req.file.buffer.toString('utf-8');
        const paneles = await parseTXT_MinColumns(txt);
        return res.json({ paneles });
    }
    catch (err) {
        console.error('Import TXT error:', err);
        return res.status(500).json({ paneles: [] });
    }
});
app.use(['/import', '/import/txt', '/api/import', '/importar'], import_1.default);
// ===== 404 para APIs =====
app.use('/api', (req, res) => {
    res.status(404).json({ ok: false, error: 'Recurso API no encontrado' });
});
// ===== 404 general (páginas) =====
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});
// ===== Error handler =====
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err?.message ?? 'Error interno del servidor' });
});
exports.default = app;
