import { EstadoBadgeTono } from '../components/EstadoBadge';

export function estadoChoferTono(estado?: string): EstadoBadgeTono {
  switch ((estado || '').toLowerCase()) {
    case 'activo':
      return 'success';
    case 'suspendido':
      return 'warning';
    case 'inactivo':
    default:
      return 'neutral';
  }
}
