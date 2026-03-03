export interface Camion {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  estado: string;
  odometroKm: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCamionDto {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  estado?: string;
  odometroKm?: number;
}

export interface UpdateCamionDto {
  patente?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  estado?: string;
  odometroKm?: number;
}
