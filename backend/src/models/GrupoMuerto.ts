// Modelo para grupos de muertos
// Este proyecto usa pg (node-postgres) directamente, no Sequelize
// Por lo tanto, este archivo solo define las interfaces TypeScript

export interface GrupoMuertoAttributes {
  pid?: number;
  pk_proyecto: number;
  numero_muerto: number;
  nombre?: string;
  x_braces: number;
  angulo_brace: number;
  eje?: string;
  tipo_construccion?: string;
  cantidad_muros: number;
  
  // Parámetros físicos del muerto (EDITABLES)
  profundidad?: number;
  largo?: number;
  ancho?: number;
  
  // Campos calculados
  fuerza_total?: number;
  volumen_concreto?: number;
  peso_muerto?: number;
  
  created_at?: Date;
  updated_at?: Date;
}

export default GrupoMuertoAttributes;
