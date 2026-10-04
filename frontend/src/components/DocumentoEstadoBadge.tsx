import React from 'react';
import { EstadoDocumento } from '../types/chofer-documento';
import '../styles/DocumentoEstado.css';
import { getDaysUntil } from '../utils/dateUtils';

interface DocumentoEstadoBadgeProps {
  fechaVencimiento?: string | Date | null;
  mostrarDias?: boolean;
}

export const DocumentoEstadoBadge: React.FC<DocumentoEstadoBadgeProps> = ({ 
  fechaVencimiento, 
  mostrarDias = true 
}) => {
  const getEstado = (): EstadoDocumento => {
    if (!fechaVencimiento) {
      return 'sin_vencimiento';
    }

    const diasRestantes = getDaysUntil(fechaVencimiento) as number;

    if (diasRestantes < 0) {
      return 'vencido';
    } else if (diasRestantes <= 30) {
      return 'proximo_vencer';
    } else {
      return 'vigente';
    }
  };

  const getDiasRestantes = (): number | null => {
    if (!fechaVencimiento) return null;
    
    return getDaysUntil(fechaVencimiento);
  };

  const estado = getEstado();
  const diasRestantes = getDiasRestantes();

  const getLabel = (): string => {
    switch (estado) {
      case 'vigente':
        return mostrarDias && diasRestantes !== null ? `Vigente (${diasRestantes} días)` : 'Vigente';
      case 'proximo_vencer':
        return mostrarDias && diasRestantes !== null ? `Por vencer (${diasRestantes} días)` : 'Por vencer';
      case 'vencido':
        return mostrarDias && diasRestantes !== null ? `Vencido (${Math.abs(diasRestantes)} días)` : 'Vencido';
      case 'sin_vencimiento':
        return 'Sin vencimiento';
      default:
        return '-';
    }
  };

  const getIcon = (): string => {
    switch (estado) {
      case 'vigente':
        return '✓';
      case 'proximo_vencer':
        return '⚠';
      case 'vencido':
        return '✕';
      default:
        return '–';
    }
  };

  return (
    <span className={`documento-estado-badge estado-${estado}`}>
      <span className="estado-icon">{getIcon()}</span>
      <span className="estado-label">{getLabel()}</span>
    </span>
  );
};

export default DocumentoEstadoBadge;
