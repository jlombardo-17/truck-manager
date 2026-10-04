export interface Camion {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  estado: string;
  odometroKm: number;
  fotoUrl?: string | null;
  fotoCredito?: string | null;
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
  // null quita la foto
  fotoUrl?: string | null;
  fotoCredito?: string | null;
}

export interface FotoSugerida {
  titulo: string;
  thumbUrl: string;
  url: string;
  paginaUrl: string;
  autor: string | null;
  licencia: string | null;
}
