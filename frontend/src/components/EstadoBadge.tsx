import React from 'react';
import '../styles/EstadoBadge.css';

export type EstadoBadgeTono = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface EstadoBadgeProps {
  label: string;
  tono: EstadoBadgeTono;
}

const EstadoBadge: React.FC<EstadoBadgeProps> = ({ label, tono }) => (
  <span className={`estado-badge-chip estado-badge-chip--${tono}`}>{label}</span>
);

export default EstadoBadge;
