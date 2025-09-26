import app from './app';
import pool from './db';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();


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
} else {
  // Handle case where ALLOWED_ORIGINS is not defined, e.g., allow all or a default
  corsOptions = { origin: '*' }; // Allow all origins (less secure, use with caution)
}

app.use(cors(corsOptions));

// Your routes and other application logic
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("PGUSER:", process.env.PGUSER);
console.log("PGPASSWORD:", process.env.PGPASSWORD);

// Funcion Prueba Conexion DB
async function getUsuarios() {
  const result = await pool.query("SELECT * FROM usuario");
  return result.rows;
}

getUsuarios().then(usuarios => console.log(usuarios));