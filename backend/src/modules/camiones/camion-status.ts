export enum EstadoCamion {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  MANTENIMIENTO = 'mantenimiento',
  FUERA_DE_SERVICIO = 'fuera_de_servicio',
}

const ESTADO_CAMION_ALIASES: Record<string, EstadoCamion> = {
  activo: EstadoCamion.ACTIVO,
  operativo: EstadoCamion.ACTIVO,
  inactivo: EstadoCamion.INACTIVO,
  inactive: EstadoCamion.INACTIVO,
  mantenimiento: EstadoCamion.MANTENIMIENTO,
  en_mantenimiento: EstadoCamion.MANTENIMIENTO,
  fuera_de_servicio: EstadoCamion.FUERA_DE_SERVICIO,
  out_of_service: EstadoCamion.FUERA_DE_SERVICIO,
};

export const normalizeEstadoCamion = (value: unknown): EstadoCamion | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.toLowerCase().trim().replace(/\s+/g, '_');
  return ESTADO_CAMION_ALIASES[normalized];
};

export const mapEstadoCamionAlias = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.toLowerCase().trim().replace(/\s+/g, '_');
  return ESTADO_CAMION_ALIASES[normalized] ?? normalized;
};