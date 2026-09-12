import { EstadoBadgeTono } from '../components/EstadoBadge';

export type EstadoCamionNormalizado = 'activo' | 'mantenimiento' | 'fuera_de_servicio' | 'inactivo';

export function normalizeEstadoCamion(estado?: string): EstadoCamionNormalizado {
  const normalized = (estado || '').toLowerCase().trim().replace(/\s+/g, '_');

  if (normalized === 'activo' || normalized === 'operativo') return 'activo';
  if (normalized === 'mantenimiento' || normalized === 'en_mantenimiento') return 'mantenimiento';
  if (normalized === 'fuera_de_servicio' || normalized === 'out_of_service') return 'fuera_de_servicio';
  if (normalized === 'inactivo' || normalized === 'inactive') return 'inactivo';

  return 'inactivo';
}

export function estadoCamionLabel(estado?: string): string {
  const normalized = normalizeEstadoCamion(estado);
  if (normalized === 'activo') return 'Activo';
  if (normalized === 'mantenimiento') return 'Mantenimiento';
  if (normalized === 'fuera_de_servicio') return 'Fuera de Servicio';
  return 'Inactivo';
}

export function estadoCamionTono(estado?: string): EstadoBadgeTono {
  const normalized = normalizeEstadoCamion(estado);
  if (normalized === 'activo') return 'success';
  if (normalized === 'mantenimiento') return 'warning';
  if (normalized === 'fuera_de_servicio') return 'neutral';
  return 'danger';
}
