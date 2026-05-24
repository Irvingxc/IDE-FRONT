export interface User {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  token: string;
  sucursalId?:     number | null;
  sucursalNombre?: string | null;
  aula?:           string | null;
  roles?: string[];
  modulos?: string[];
}
