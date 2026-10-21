import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CategoriaDetalleRentabilidad,
  DetalleRentabilidadItem,
  RentabilidadDetalleResponse,
  RentabilidadResponse,
  reportesService,
} from '../services/reportesService';
import { formatDateForDisplay } from '../utils/dateUtils';
import '../styles/Modal.css';
import '../styles/DetallePeriodoModal.css';

interface DetallePeriodoModalProps {
  periodo: string;
  etiqueta: string;
  filtros: RentabilidadResponse['filtrosAplicados'];
  onClose: () => void;
}

// Mismo orden que las columnas de la tabla "Detalle por período"
const CATEGORIAS: Array<{ key: CategoriaDetalleRentabilidad; label: string }> = [
  { key: 'ingreso', label: 'Ingresos' },
  { key: 'operativosViaje', label: 'Combustible + Otros' },
  { key: 'gastosViaje', label: 'Gastos del Viaje' },
  { key: 'mantenimiento', label: 'Mantenimiento' },
  { key: 'gastosFijos', label: 'Gastos Fijos' },
  { key: 'sueldoChofer', label: 'Sueldo Chofer' },
];

// Sección de CamionDetalle que se abre con ?seccion=<clave>
const SECCION_CAMION = {
  servicio: 'servicios',
  mantenimiento: 'mantenimiento',
  gastoFijo: 'gastos-fijos',
} as const;

const getLinkOrigen =(item: DetalleRentabilidadItem): { to: string; label: string } | null => {
  const { referencia } = item;
  switch (referencia.tipo) {
    case 'viaje':
      return { to: `/viajes/${referencia.id}`, label: 'Ver viaje' };
    case 'servicio':
    case 'mantenimiento':
    case 'gastoFijo':
      return referencia.camionId
        ? { to: `/camiones/${referencia.camionId}?seccion=${SECCION_CAMION[referencia.tipo]}`, label: 'Ver en camión' }
        : null;
    case 'chofer':
      return { to: `/choferes/${referencia.id}/salarios`, label: 'Ver salario' };
    default:
      return null;
  }
};

const DetallePeriodoModal: React.FC<DetallePeriodoModalProps> = ({ periodo, etiqueta, filtros, onClose }) => {
  const [detalle, setDetalle] = useState<RentabilidadDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    reportesService
      .getRentabilidadDetalle(periodo, filtros)
      .then((data) => {
        if (!cancelled) setDetalle(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.response?.data?.message || 'No se pudo cargar el detalle del período');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [periodo, filtros]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const grupos = CATEGORIAS.map((categoria) => {
    const items = (detalle?.items || []).filter((item) => item.categoria === categoria.key);
    return { ...categoria, items, total: items.reduce((sum, item) => sum + item.monto, 0) };
  }).filter((grupo) => grupo.items.length > 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detalle-periodo-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalle del período {etiqueta}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="detalle-periodo-body">
          {loading && <p className="detalle-periodo-empty">Cargando detalle...</p>}
          {error && <div className="alert alert-error">{error}</div>}
          {!loading && !error && grupos.length === 0 && (
            <p className="detalle-periodo-empty">No hay registros en este período.</p>
          )}

          {!loading &&
            !error &&
            grupos.map((grupo) => (
              <section key={grupo.key} className="detalle-periodo-grupo">
                <div className="detalle-periodo-grupo-header">
                  <h3>{grupo.label}</h3>
                  <span>${grupo.total.toFixed(2)}</span>
                </div>
                <table className="reportes-table detalle-periodo-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Camión / Chofer</th>
                      <th className="detalle-periodo-monto">Monto (UYU)</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.items.map((item, index) => {
                      const link = getLinkOrigen(item);
                      return (
                        <tr key={`${item.referencia.tipo}-${item.referencia.id}-${index}`}>
                          <td>{item.fecha ? formatDateForDisplay(item.fecha) : '—'}</td>
                          <td>{item.concepto}</td>
                          <td>{[item.patente, item.chofer].filter(Boolean).join(' · ') || '—'}</td>
                          <td className="detalle-periodo-monto">${item.monto.toFixed(2)}</td>
                          <td>
                            {link && (
                              <Link to={link.to} target="_blank" rel="noopener noreferrer" className="detalle-periodo-link">
                                {link.label} ↗
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DetallePeriodoModal;
