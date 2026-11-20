export interface Cliente {
  id: number;
  nombre: string;
  rut: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClienteDto {
  nombre: string;
  rut?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  notas?: string | null;
  activo?: boolean;
}

export type UpdateClienteDto = Partial<CreateClienteDto>;
