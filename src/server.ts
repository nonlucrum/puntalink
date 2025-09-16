import app from './app';
import pool from './db';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

// Funcion Prueba Conexion DB
async function getUsuarios() {
  const result = await pool.query("SELECT * FROM usuario");
  return result.rows;
}

getUsuarios().then(usuarios => console.log(usuarios));