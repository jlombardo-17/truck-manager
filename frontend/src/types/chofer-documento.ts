export interface ChoferDocumento {
  id?: number;
  choferId: number;
  tipo: TipoDocumentoChofer;
  nombre?: string;
  rutaArchivo: string;
  descripcion?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  numeroDocumento?: string;
  createdAt?: string;
}

export enum TipoDocumentoChofer {
  LICENCIA_CONDUCIR = 'licencia_conducir',
  CEDULA_IDENTIDAD = 'cedula_identidad',
  CARNET_SALUD = 'carnet_salud',
  CERTIFICADO_ANTECEDENTES = 'certificado_antecedentes',
  CERTIFICADO_CONDUCIR_PROFESIONAL = 'certificado_conducir_profesional',
  SEGURO_VIDA = 'seguro_vida',
  CONTRATO_TRABAJO = 'contrato_trabajo',
  OTRO = 'otro',
}

export const TipoDocumentoChoferLabels: Record<TipoDocumentoChofer, string> = {
  [TipoDocumentoChofer.LICENCIA_CONDUCIR]: 'Licencia de Conducir',
  [TipoDocumentoChofer.CEDULA_IDENTIDAD]: 'Cédula de Identidad',
  [TipoDocumentoChofer.CARNET_SALUD]: 'Carnet de Salud',
  [TipoDocumentoChofer.CERTIFICADO_ANTECEDENTES]: 'Certificado de Antecedentes',
  [TipoDocumentoChofer.CERTIFICADO_CONDUCIR_PROFESIONAL]: 'Certificado de Conducir Profesional',
  [TipoDocumentoChofer.SEGURO_VIDA]: 'Seguro de Vida',
  [TipoDocumentoChofer.CONTRATO_TRABAJO]: 'Contrato de Trabajo',
  [TipoDocumentoChofer.OTRO]: 'Otro',
};

export type EstadoDocumento = 'vigente' | 'proximo_vencer' | 'vencido' | 'sin_vencimiento';
