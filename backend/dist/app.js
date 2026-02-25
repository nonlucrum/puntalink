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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_1 = __importDefault(require("./routes/index"));
const import_1 = __importDefault(require("./routes/import"));
const calculosRoutes_1 = __importDefault(require("./routes/calculosRoutes"));
const panelesRoutes_1 = __importDefault(require("./routes/panelesRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes")); // 👈 NUEVO
const grupoMuertoRoutes_1 = __importDefault(require("./routes/grupoMuertoRoutes")); // 👈 NUEVO - Grupos de muertos
const muroRoutes_1 = __importDefault(require("./routes/muroRoutes"));
const pdfRoutes_1 = __importDefault(require("./routes/pdfRoutes"));
const app = (0, express_1.default)();
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
// (Opcional pero útil si alguna vez vas detrás de proxy/ingress y usas cookies SameSite=None)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
// ===== Logger simple =====
app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    _res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
});
// ===== CORS (con credenciales) =====
const corsOptions = {
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true); // curl/postman
        if (ALLOWED.includes(origin))
            return cb(null, true);
        return cb(new Error(`Origen no permitido: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-project-id'],
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions)); // preflight
// ===== Parsers =====
app.use((0, cookie_parser_1.default)()); // 👈 NECESARIO para leer/setear cookie 'session'
app.use((0, morgan_1.default)('dev'));
app.use(body_parser_1.default.json({ limit: '10mb' }));
app.use(body_parser_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ===== Static & views =====
app.set('views', path_1.default.join(__dirname, '..', 'views'));
app.set('view engine', 'html');
// ===== Healthcheck =====
app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'puntalink-pro-ts-struct' });
});
// ===== Rutas base =====
app.use('/', index_1.default);
// ===== AUTH primero que el resto (para que CORS/cookies apliquen bien) =====
app.use('/api/auth', authRoutes_1.default); // 👈 NUEVO
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
// ===== Muros manuales =====
app.use('/api/muros', muroRoutes_1.default);
// ===== Grupos de Muertos (DEBE IR ANTES DEL 404) =====
app.use('/api/grupos-muertos', grupoMuertoRoutes_1.default);
// ===== Informe (PDF/DOCX) =====
app.use('/api/informe', pdfRoutes_1.default);
// ===== 404 para APIs (SIEMPRE AL FINAL) =====
app.use('/api', (_req, res) => {
    res.status(404).json({ ok: false, error: 'Recurso API no encontrado' });
});
// ===== 404 general (páginas) =====
app.use((_req, res) => {
    res.status(404).send('Página no encontrada');
});
// ===== Error handler =====
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err?.message ?? 'Error interno del servidor' });
});
exports.default = app;
