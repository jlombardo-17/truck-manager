export interface Chofer {
  id: number;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion?: string;
  fechaIngreso: Date | string;
  fechaNacimiento?: Date | string;
  estado: EstadoChofer;
  sueldoBase?: number;
  porcentajeComision?: number;
  userId?: number;
  user?: {
    id: number;
    email: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateChoferDto {
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion?: string;
  fechaIngreso: Date | string;
  fechaNacimiento?: Date | string;
  estado?: EstadoChofer;
  sueldoBase?: number;
  porcentajeComision?: number;
  userId?: number;
}

export interface UpdateChoferDto {
  numeroDocumento?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  direccion?: string;
  fechaIngreso?: Date | string;
  fechaNacimiento?: Date | string;
  estado?: EstadoChofer;
  sueldoBase?: number;
  porcentajeComision?: number;
  userId?: number;
}

export enum EstadoChofer {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
}

export const estadoChoferLabels: Record<EstadoChofer, string> = {
  [EstadoChofer.ACTIVO]: 'Activo',
  [EstadoChofer.INACTIVO]: 'Inactivo',
  [EstadoChofer.SUSPENDIDO]: 'Suspendido',
};
