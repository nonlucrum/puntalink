"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./db"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT;
const allowedOrigins = process.env.ALLOWED_ORIGINS;
let corsOptions = {};
if (allowedOrigins) {
    const originsArray = allowedOrigins.split(',').map(item => item.trim());
    corsOptions = {
        origin: originsArray,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Or specify your allowed methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Or specify your allowed headers
        credentials: true // If your frontend needs to send cookies/auth headers
    };
}
else {
    // Handle case where ALLOWED_ORIGINS is not defined, e.g., allow all or a default
    corsOptions = { origin: '*' }; // Allow all origins (less secure, use with caution)
}
app_1.default.use((0, cors_1.default)(corsOptions));
// Your routes and other application logic
app_1.default.get('/', (req, res) => {
    res.send('Hello from the backend!');
});
app_1.default.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
console.log("PGUSER:", process.env.PGUSER);
console.log("PGPASSWORD:", process.env.PGPASSWORD);
// Funcion Prueba Conexion DB
async function getUsuarios() {
    const result = await db_1.default.query("SELECT * FROM usuario");
    return result.rows;
}
getUsuarios().then(usuarios => console.log(usuarios));
