export enum TipoCombustible {
  NAFTA = 'nafta',
  DIESEL = 'diesel',
  GAS = 'gas',
  GNC = 'gnc',
  BIODIESEL = 'biodiesel',
  ETANOL = 'etanol',
}

export const TipoCombustibleLabels: Record<TipoCombustible, string> = {
  [TipoCombustible.NAFTA]: 'Nafta',
  [TipoCombustible.DIESEL]: 'Diésel',
  [TipoCombustible.GAS]: 'Gas Natural',
  [TipoCombustible.GNC]: 'GNC',
  [TipoCombustible.BIODIESEL]: 'Biodiésel',
  [TipoCombustible.ETANOL]: 'Etanol',
};

export interface Repostada {
  id: number;
  camionId: number;
  tipoCombustible: TipoCombustible;
  fechaRepostada: string;
  kmRecorridos: number;
  litros: number;
  consumoPromedio: number;
  costo?: number;
  precioLitro?: number;
  createdAt: string;
}

export interface CreateRepostadaDto {
  tipoCombustible: TipoCombustible;
  fechaRepostada: string;
  kmRecorridos: number;
  litros: number;
  consumoPromedio: number;
  costo?: number;
  precioLitro?: number;
}

export interface Estadisticas {
  totalRepostadas: number;
  kmPromedio: number;
  consumoPromedio: number;
  costoPromedio: number;
  totalCosto: number;
  totalLitros: number;
  totalKm: number;
}
