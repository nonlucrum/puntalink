export interface User {
  id: number;
  username: string;
  passwordHash: string;
}

// Almacén en memoria (para MVP). Luego lo cambias por DB.
export const users: User[] = [];
