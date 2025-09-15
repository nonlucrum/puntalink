import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",       // tu usuario
  host: "localhost",
  database: "mibase",     // tu base de datos
  password: "tu_password",
  port: 5432,
});

export default pool;