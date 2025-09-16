import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",       // tu usuario
  host: "localhost",
  database: "puntalink",     // tu base de datos
  password: "root",
  port: 5432,
});

export default pool;