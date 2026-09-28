import { EstadoSalario } from './salario';

export enum CategoriaJornada {
  TRABAJADO = 'trabajado',
  LICENCIA = 'licencia',
  LICENCIA_MEDICA = 'licencia_medica',
  SIN_TRABAJAR = 'sin_trabajar',
  MANTENIMIENTO = 'mantenimiento',
  FERIADO = 'feriado',
  OTRO = 'otro',
}

export const categoriaJornadaLabels: Record<CategoriaJornada, string> = {
  [CategoriaJornada.TRABAJADO]: 'Trabajado',
  [CategoriaJornada.LICENCIA]: 'Licencia',
  [CategoriaJornada.LICENCIA_MEDICA]: 'Licencia médica',
  [CategoriaJornada.SIN_TRABAJAR]: 'Sin trabajar',
  [CategoriaJornada.MANTENIMIENTO]: 'Mantenimiento',
  [CategoriaJornada.FERIADO]: 'Feriado',
  [CategoriaJornada.OTRO]: 'Otro',
};

// Fondo / texto con contraste AA
export const categoriaJornadaColors: Record<CategoriaJornada, { bg: string; fg: string }> = {
  [CategoriaJornada.TRABAJADO]: { bg: '#d1fae5', fg: '#065f46' },
  [CategoriaJornada.LICENCIA]: { bg: '#dbeafe', fg: '#1e40af' },
  [CategoriaJornada.LICENCIA_MEDICA]: { bg: '#fce7f3', fg: '#9d174d' },
  [CategoriaJornada.SIN_TRABAJAR]: { bg: '#e5e7eb', fg: '#374151' },
  [CategoriaJornada.MANTENIMIENTO]: { bg: '#fef3c7', fg: '#92400e' },
  [CategoriaJornada.FERIADO]: { bg: '#ede9fe', fg: '#5b21b6' },
  [CategoriaJornada.OTRO]: { bg: '#f3f4f6', fg: '#1f2937' },
};

export interface ViaticoTipo {
  id: number;
  nombre: string;
  montoDefault: number | string;
  activo: boolean;
}

export interface ChoferViatico {
  id: number;
  jornadaId: number;
  viaticoTipoId?: number | null;
  concepto: string;
  cantidad: number;
  monto: number | string; // unitario; total de la línea = cantidad * monto
  observaciones?: string | null;
}

export interface ChoferJornada {
  id: number;
  choferId: number;
  fecha: string; // YYYY-MM-DD
  categoria: CategoriaJornada;
  lugarTrabajo?: string | null;
  viajeId?: number | null;
  observaciones?: string | null;
  viaticos: ChoferViatico[];
}

export interface ViajeSugerido {
  choferId: number;
  fecha: string;
  viajeId: number;
  numeroViaje: string;
  origen: string;
  destino: string;
}

export interface JornadasRango {
  jornadas: ChoferJornada[];
  viajesSugeridos: ViajeSugerido[];
}

export interface ViaticoItemDto {
  viaticoTipoId?: number;
  concepto: string;
  cantidad?: number;
  monto: number;
  observaciones?: string;
}

export interface UpsertJornadaDto {
  choferId: number;
  fecha: string;
  categoria: CategoriaJornada;
  lugarTrabajo?: string;
  viajeId?: number;
  observaciones?: string;
  viaticos?: ViaticoItemDto[];
}

export interface BulkJornadaDto {
  choferIds: number[];
  desde: string;
  hasta: string;
  categoria: CategoriaJornada;
  lugarTrabajo?: string;
  observaciones?: string;
}

export interface SalarioAfectado {
  choferId: number;
  mes: number;
  anio: number;
  salarioId: number;
  estado: EstadoSalario;
  actualizado: boolean;
}

export interface ResumenJornadasChofer {
  choferId: number;
  nombre: string;
  apellido: string;
  dias: Record<CategoriaJornada, number>;
  diasRegistrados: number;
  cantidadViaticos: number;
  totalViaticos: number;
}

export interface ReporteViaticosChofer {
  choferId: number;
  nombre: string;
  apellido: string;
  cantidad: number;
  total: number;
  detalle: { concepto: string; montoUnitario: number; cantidad: number; total: number }[];
}

export interface CreateViaticoTipoDto {
  nombre: string;
  montoDefault: number;
  activo?: boolean;
}

export type UpdateViaticoTipoDto = Partial<CreateViaticoTipoDto>;

/** Normaliza texto de localidades para comparar (sin tildes, mayúsculas ni espacios extra) */
export const normalizarLocalidad = (value?: string | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

/** Sugiere viático cuando trabajó en una localidad distinta a la de residencia */
export const correspondeViatico = (
  categoria: CategoriaJornada,
  lugarTrabajo?: string | null,
  localidadResidencia?: string | null,
): boolean => {
  if (categoria !== CategoriaJornada.TRABAJADO) return false;
  const lugar = normalizarLocalidad(lugarTrabajo);
  const residencia = normalizarLocalidad(localidadResidencia);
  if (!lugar || !residencia) return false;
  return !lugar.includes(residencia) && !residencia.includes(lugar);
};
