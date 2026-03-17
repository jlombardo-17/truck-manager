export const TIPOS_COMBINACION = [
  'camion_rigido',
  'camion_acoplado',
  'tractor_semirremolque',
  'camion_zorra',
  'camion_dolly_semirremolque',
  'tractor_dolly_semirremolque',
] as const;

export type TipoCombinacion = (typeof TIPOS_COMBINACION)[number];

export const LABELS_COMBINACION: Record<TipoCombinacion, string> = {
  camion_rigido: 'Camión Rígido',
  camion_acoplado: 'Camión + Acoplado',
  tractor_semirremolque: 'Tractor + Semirremolque',
  camion_zorra: 'Camión + Zorra',
  camion_dolly_semirremolque: 'Camión + Dolly + Semirremolque',
  tractor_dolly_semirremolque: 'Tractor + Dolly + Semirremolque',
};

export const TIPOS_SECCION = [
  'tractora',
  'camion',
  'semirremolque',
  'zorra',
  'acoplado',
  'dolly',
] as const;

export type TipoSeccion = (typeof TIPOS_SECCION)[number];

export const LABELS_SECCION: Record<TipoSeccion, string> = {
  tractora: 'Tractora',
  camion: 'Camión',
  semirremolque: 'Semirremolque',
  zorra: 'Zorra',
  acoplado: 'Acoplado',
  dolly: 'Dolly',
};

export const ICONO_SECCION: Record<TipoSeccion, string> = {
  tractora: '🚛',
  camion: '🚚',
  semirremolque: '🔲',
  zorra: '🔳',
  acoplado: '🔳',
  dolly: '⚙️',
};

export interface SeccionVehicular {
  tipo: TipoSeccion;
  ejes: number;
  largoM?: number;
  anchoM?: number;
  altoM?: number;
  pesoVacioKg?: number;
  capacidadCargaKg?: number;
}

export interface ConfiguracionVehicular {
  id: number;
  camionId: number;
  tipoCombinacion: TipoCombinacion;
  secciones: SeccionVehicular[];
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertConfiguracionVehicularDto {
  tipoCombinacion: string;
  secciones: SeccionVehicular[];
  notas?: string;
}

/** Plantillas de secciones por tipo de combinación */
export const PLANTILLAS_COMBINACION: Record<TipoCombinacion, SeccionVehicular[]> = {
  camion_rigido: [
    { tipo: 'camion', ejes: 2 },
  ],
  camion_acoplado: [
    { tipo: 'camion', ejes: 2 },
    { tipo: 'acoplado', ejes: 2 },
  ],
  tractor_semirremolque: [
    { tipo: 'tractora', ejes: 2 },
    { tipo: 'semirremolque', ejes: 3 },
  ],
  camion_zorra: [
    { tipo: 'camion', ejes: 2 },
    { tipo: 'zorra', ejes: 2 },
  ],
  camion_dolly_semirremolque: [
    { tipo: 'camion', ejes: 2 },
    { tipo: 'dolly', ejes: 1 },
    { tipo: 'semirremolque', ejes: 2 },
  ],
  tractor_dolly_semirremolque: [
    { tipo: 'tractora', ejes: 2 },
    { tipo: 'dolly', ejes: 1 },
    { tipo: 'semirremolque', ejes: 2 },
  ],
};
