export enum TipoGastoFijo {
  SEGURO = 'seguro',
  PATENTE = 'patente',
  OTRO = 'otro',
}

export const TipoGastoFijoLabels: Record<TipoGastoFijo, string> = {
  [TipoGastoFijo.SEGURO]: 'Seguro',
  [TipoGastoFijo.PATENTE]: 'Patente',
  [TipoGastoFijo.OTRO]: 'Otro',
};

export const MONEDAS_GASTO_FIJO = ['UYU', 'USD'] as const;
export type MonedaGastoFijo = (typeof MONEDAS_GASTO_FIJO)[number];

export interface GastoFijo {
  id: number;
  camionId: number;
  tipo: TipoGastoFijo;
  concepto?: string | null;
  montoAnual: number;
  moneda: MonedaGastoFijo;
  vigenciaDesde: string; // YYYY-MM-DD
  vigenciaHasta?: string | null; // YYYY-MM-DD, null = sin vencimiento
  notas?: string | null;
  createdAt: string;
}

export interface CreateGastoFijoDto {
  tipo: TipoGastoFijo;
  concepto?: string | null;
  montoAnual: number;
  moneda?: MonedaGastoFijo;
  vigenciaDesde: string;
  vigenciaHasta?: string | null;
  notas?: string | null;
}

export type UpdateGastoFijoDto = Partial<CreateGastoFijoDto>;
