import 'dotenv/config';
import app from './app.js';
import pool from './db.js';

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`[puntalink-pro-ts-struct] Servidor en puerto ${PORT}`);
});

// Funcion Prueba Conexion DB
async function getUsuarios() {
  const result = await pool.query("SELECT * FROM usuario");
  return result.rows;
}

getUsuarios().then(usuarios => console.log(usuarios));