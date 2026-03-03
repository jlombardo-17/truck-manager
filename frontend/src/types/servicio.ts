export enum TipoServicio {
  CAMBIO_ACEITE = 'cambio_aceite',
  FILTRO_ACEITE = 'filtro_aceite',
  FILTRO_AIRE = 'filtro_aire',
  FILTRO_GASOIL = 'filtro_gasoil',
  ROTACION_CUBIERTAS = 'rotacion_cubiertas',
  ALINEACION = 'alineacion',
  REVISION_GENERAL = 'revision_general',
  REPARACION = 'reparacion',
  OTRO = 'otro',
}

export const TipoServicioLabels: Record<TipoServicio, string> = {
  [TipoServicio.CAMBIO_ACEITE]: 'Cambio de Aceite',
  [TipoServicio.FILTRO_ACEITE]: 'Filtro de Aceite',
  [TipoServicio.FILTRO_AIRE]: 'Filtro de Aire',
  [TipoServicio.FILTRO_GASOIL]: 'Filtro de Gasoil',
  [TipoServicio.ROTACION_CUBIERTAS]: 'Rotación de Cubiertas',
  [TipoServicio.ALINEACION]: 'Alineación',
  [TipoServicio.REVISION_GENERAL]: 'Revisión General',
  [TipoServicio.REPARACION]: 'Reparación',
  [TipoServicio.OTRO]: 'Otro',
};

export interface Servicio {
  id: number;
  camionId: number;
  fechaServicio: string;
  tipos: TipoServicio[];
  descripcion?: string;
  costo?: number;
  kilometraje?: number;
  createdAt: string;
}

export interface CreateServicioDto {
  fechaServicio: string;
  tipos: TipoServicio[];
  descripcion?: string;
  costo?: number;
  kilometraje?: number;
}

export enum TipoDocumento {
  SEGURO = 'seguro',
  LIBRETA_PROPIEDAD = 'libreta_propiedad',
  REVISION_TECNICA = 'revision_tecnica',
  MATRICULA = 'matricula',
  PERMISOS = 'permisos',
  OTRO = 'otro',
}

export const TipoDocumentoLabels: Record<TipoDocumento, string> = {
  [TipoDocumento.SEGURO]: 'Seguro',
  [TipoDocumento.LIBRETA_PROPIEDAD]: 'Libreta de Propiedad',
  [TipoDocumento.REVISION_TECNICA]: 'Revisión Técnica',
  [TipoDocumento.MATRICULA]: 'Matrícula',
  [TipoDocumento.PERMISOS]: 'Permisos',
  [TipoDocumento.OTRO]: 'Otro',
};

export interface Documento {
  id: number;
  camionId: number;
  tipo: TipoDocumento;
  nombre?: string;
  rutaArchivo: string;
  descripcion?: string;
  fechaVencimiento?: string;
  createdAt: string;
}

export interface CreateDocumentoDto {
  tipo: TipoDocumento;
  rutaArchivo: string;
  nombre?: string;
  descripcion?: string;
  fechaVencimiento?: string;
}
