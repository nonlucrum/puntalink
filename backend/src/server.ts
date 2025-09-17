import app from './app';
import pool from './db';
import dotenv from 'dotenv';

dotenv.config();


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
console.log("PGUSER:", process.env.PGUSER);
console.log("PGPASSWORD:", process.env.PGPASSWORD);

// Funcion Prueba Conexion DB
async function getUsuarios() {
  const result = await pool.query("SELECT * FROM usuario");
  return result.rows;
}

getUsuarios().then(usuarios => console.log(usuarios));