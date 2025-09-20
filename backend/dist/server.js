"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./db"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT;
app_1.default.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
console.log("PGUSER:", process.env.PGUSER);
console.log("PGPASSWORD:", process.env.PGPASSWORD);
// Funcion Prueba Conexion DB
async function getUsuarios() {
    const result = await db_1.default.query("SELECT * FROM usuario");
    return result.rows;
}
getUsuarios().then(usuarios => console.log(usuarios));
