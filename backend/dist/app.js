"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const index_1 = __importDefault(require("./routes/index"));
const import_1 = __importDefault(require("./routes/import"));
const calculosRoutes_1 = __importDefault(require("./routes/calculosRoutes"));
const panelesRoutes_1 = __importDefault(require("./routes/panelesRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const app = (0, express_1.default)();
// ===== Logger simple =====
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
app.set('view engine', 'html');
// ===== Healthcheck =====
app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'puntalink-pro-ts-struct' });
});
// ===== Rutas base =====
app.use('/', index_1.default);
// ===== Importación TXT (RCSM) =====
app.use('/api/importar-muros', import_1.default);
// ===== Cancelación TXT (RCSM) =====
app.use('/api/cancelar-import', import_1.default);
// ===== Cálculos =====
app.use('/api/calculos', calculosRoutes_1.default);
// ===== Paneles =====
app.use('/api/paneles', panelesRoutes_1.default);
// ===== Proyecto =====
app.use('/api/proyecto', projectRoutes_1.default);
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
