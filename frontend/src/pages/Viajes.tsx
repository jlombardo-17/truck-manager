import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { viajsService, Viaje } from '../services/viajsService';
import camionesService from '../services/camionesService';
import choferesService from '../services/choferesService';
import { Camion } from '../types/camion';
import { Chofer } from '../types/chofer';
import HeroSection from '../components/HeroSection';
import StatsGrid from '../components/StatsGrid';
import BackButton from '../components/BackButton';
import heroRoutesViolet from '../assets/hero-routes-violet.svg';
import '../styles/Viajes.css';

const Viajes: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const skeletonRows = Array.from({ length: 6 }, (_, index) => index);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [camiones, setCamiones] = useState<Record<number, Camion>>({});
  const [choferes, setChoferes] = useState<Record<number, Chofer>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    camionId: '',
    choferId: '',
    fechaPagoDesde: '',
    fechaPagoHasta: '',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    loadViajes();
  }, [filtros]);

  const loadViajes = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.camionId && { camionId: parseInt(filtros.camionId) }),
        ...(filtros.choferId && { choferId: parseInt(filtros.choferId) }),
        ...(filtros.fechaPagoDesde && { fechaPagoDesde: filtros.fechaPagoDesde }),
        ...(filtros.fechaPagoHasta && { fechaPagoHasta: filtros.fechaPagoHasta }),
      };

      const data = await viajsService.getAll(filters);
      setViajes(data);

      // Cargar datos complementarios (camiones y choferes) de manera eficiente
      const uniqueCamionIds = new Set(data.filter(v => v.camionId != null).map((v) => v.camionId));
      const uniqueChoferIds = new Set(data.filter(v => v.choferId != null).map((v) => v.choferId));

      if (uniqueCamionIds.size > 0) {
        const camionesData = await Promise.all(
          Array.from(uniqueCamionIds).map((id) => camionesService.getById(id)),
        );
        const camionesMap = camionesData.reduce(
          (acc, c) => ({ ...acc, [c.id]: c }),
          {} as Record<number, Camion>,
        );
        setCamiones(camionesMap);
      }

      if (uniqueChoferIds.size > 0) {
        const choferesData = await Promise.all(
          Array.from(uniqueChoferIds).map((id) => choferesService.getById(id)),
        );
        const choferesMap = choferesData.reduce(
          (acc, c) => ({ ...acc, [c.id]: c }),
          {} as Record<number, Chofer>,
        );
        setChoferes(choferesMap);
      }
    } catch (err) {
      setError('Error al cargar los viajes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    navigate('/viajes/nuevo');
  };

  const handleEdit = (id: number) => {
    navigate(`/viajes/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este viaje?')) {
      try {
        await viajsService.delete(id);
        await loadViajes();
      } catch (err) {
        setError('Error al eliminar el viaje');
      }
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await viajsService.cambiarEstado(id, nuevoEstado);
      await loadViajes();
    } catch (err) {
      setError('Error al cambiar el estado del viaje');
    }
  };

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros({ ...filtros, [field]: value });
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      en_progreso: 'badge-warning',
      completado: 'badge-success',
      cancelado: 'badge-danger',
    };
    return badges[estado] || 'badge-info';
  };

  const hasDocumentoDescarga = (viaje: Viaje) => {
    if (viaje.documentoDescargaAdjunto) {
      return true;
    }

    return typeof viaje.documentoDescarga === 'string' && viaje.documentoDescarga.trim().length > 0;
  };

  const getDocumentoDescargaUrl = (viaje: Viaje) => {
    if (viaje.documentoDescargaAdjunto) {
      return viaje.documentoDescargaAdjunto;
    }

    if (
      typeof viaje.documentoDescarga === 'string' &&
      (viaje.documentoDescarga.startsWith('http://') || viaje.documentoDescarga.startsWith('https://'))
    ) {
      return viaje.documentoDescarga;
    }

    return null;
  };

  const formatViajeAmount = (viaje: Viaje) => {
    const currency = viaje.moneda === 'USD' ? 'USD' : 'UYU';
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(Number(viaje.valorViaje || 0));
  };

  const formatViajeUyuEquivalent = (viaje: Viaje) => {
    const equivalent = Number(viaje.valorViajeUyu || viaje.valorViaje || 0);
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      maximumFractionDigits: 0,
    }).format(equivalent);
  };

  const formatViajeDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('es-UY');
  };

  return (
    <div className="viajes-page">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-title" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Truck Manager</h1>
          <div className="navbar-user">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="page-back-button-container">
        <BackButton label="Volver al Dashboard" to="/dashboard" />
      </div>
      
      <HeroSection
        subtitle="Trip Management"
        title="Viajes y Rutas"
        description="Planificación, estado y trazabilidad de entregas."
        backgroundImage={`linear-gradient(135deg, rgba(155, 89, 182, 0.9) 0%, rgba(142, 68, 173, 0.88) 50%, rgba(195, 155, 211, 0.85) 100%), url(${heroRoutesViolet})`}
        darkBg={true}
        primaryAction={{
          label: '+ Nuevo Viaje',
          onClick: handleNew,
        }}
      />

      <section className="viajes-kpi-section">
        <div className="viajes-container-inner">
          <StatsGrid
            stats={[
              {
                label: 'Total de Viajes',
                value: String(viajes.length),
                unit: 'viajes',
                icon: '📦',
                color: 'blue',
                trend: { direction: 'up', percentage: 7 },
              },
              {
                label: 'En Progreso',
                value: String(viajes.filter(v => v.estado === 'en_progreso').length),
                unit: 'activos',
                icon: '⏳',
                color: 'yellow',
                trend: { direction: 'stable', percentage: 0 },
              },
              {
                label: 'Completados',
                value: String(viajes.filter(v => v.estado === 'completado').length),
                unit: 'viajes',
                icon: '✓',
                color: 'green',
                trend: { direction: 'up', percentage: 12 },
              },
              {
                label: 'Cancelados',
                value: String(viajes.filter(v => v.estado === 'cancelado').length),
                unit: 'viajes',
                icon: '✕',
                color: 'red',
                trend: { direction: 'down', percentage: 1 },
              },
            ]}
            columns={4}
            loading={loading}
          />
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Estado</label>
          <select
            value={filtros.estado}
            onChange={(e) => handleFiltroChange('estado', e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Camión</label>
          <input
            type="text"
            value={filtros.camionId}
            onChange={(e) => handleFiltroChange('camionId', e.target.value)}
            placeholder="ID del camión"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Chofer</label>
          <input
            type="text"
            value={filtros.choferId}
            onChange={(e) => handleFiltroChange('choferId', e.target.value)}
            placeholder="ID del chofer"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Pago Desde</label>
          <input
            type="date"
            value={filtros.fechaPagoDesde}
            onChange={(e) => handleFiltroChange('fechaPagoDesde', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Pago Hasta</label>
          <input
            type="date"
            value={filtros.fechaPagoHasta}
            onChange={(e) => handleFiltroChange('fechaPagoHasta', e.target.value)}
            className="filter-input"
          />
        </div>

        <button
          className="btn-secondary"
          onClick={() => setFiltros({ estado: '', camionId: '', choferId: '', fechaPagoDesde: '', fechaPagoHasta: '' })}
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla de viajes */}
      {loading ? (
        <div className="table-responsive skeleton-table">
          <table className="viajes-table">
            <thead>
              <tr>
                <th>Nro. Viaje</th>
                <th>Camión</th>
                <th>Chofer</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Doc.</th>
                <th>Valor</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Pago</th>
                <th>KM</th>
                <th className="estado-header">Estado</th>
                <th className="acciones-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {skeletonRows.map((row) => (
                <tr key={row}>
                  <td colSpan={13}>
                    <div className="skeleton-line" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viajes.length === 0 ? (
        <div className="no-data">
          <p>No hay viajes registrados</p>
          <button className="btn-primary" onClick={handleNew}>
            Crear el primer viaje
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="viajes-table">
            <thead>
              <tr>
                <th>Nro. Viaje</th>
                <th>Camión</th>
                <th>Chofer</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Doc.</th>
                <th>Valor</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Pago</th>
                <th>KM</th>
                <th className="estado-header">Estado</th>
                <th className="acciones-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {viajes.map((viaje) => (
                <tr key={viaje.id} className="viaje-row">
                  <td className="numero-viaje">
                    <strong>{viaje.numeroViaje}</strong>
                  </td>
                  <td title={camiones[viaje.camionId]?.patente || `ID: ${viaje.camionId}`}>
                    {camiones[viaje.camionId]?.patente || `ID: ${viaje.camionId}`}
                  </td>
                  <td
                    title={
                      choferes[viaje.choferId]
                        ? `${choferes[viaje.choferId].nombre} ${choferes[viaje.choferId].apellido}`
                        : `ID: ${viaje.choferId}`
                    }
                  >
                    {choferes[viaje.choferId]
                      ? `${choferes[viaje.choferId].nombre} ${choferes[viaje.choferId].apellido}`
                      : `ID: ${viaje.choferId}`}
                  </td>
                  <td title={viaje.origen}>{viaje.origen}</td>
                  <td title={viaje.destino}>{viaje.destino}</td>
                  <td className="doc-status-cell">
                    {(() => {
                      const documentoUrl = getDocumentoDescargaUrl(viaje);
                      const documentoCargado = hasDocumentoDescarga(viaje);

                      if (documentoUrl) {
                        return (
                          <a
                            className="doc-status-badge has-doc doc-status-link"
                            href={documentoUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir comprobante"
                          >
                            Cargado
                          </a>
                        );
                      }

                      return (
                        <span className={`doc-status-badge ${documentoCargado ? 'has-doc' : 'no-doc'}`}>
                          {documentoCargado ? 'Cargado' : 'No cargado'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="valor-cell">
                    {formatViajeAmount(viaje)}
                    {viaje.moneda === 'USD' && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        Eq. {formatViajeUyuEquivalent(viaje)}
                      </div>
                    )}
                  </td>
                  <td>{formatViajeDate(viaje.fechaInicio)}</td>
                  <td>{formatViajeDate(viaje.fechaFin)}</td>
                  <td>{viaje.fechaPago ? formatViajeDate(viaje.fechaPago) : 'Pendiente'}</td>
                  <td className="km-cell">{Number(viaje.kmRecorridos || 0).toFixed(2)} km</td>
                  <td className="estado-cell">
                    <select
                      value={viaje.estado || 'en_progreso'}
                      onChange={(e) => handleCambiarEstado(viaje.id!, e.target.value)}
                      className={`estado-select ${getEstadoBadge(viaje.estado || 'en_progreso')}`}
                    >
                      <option value="en_progreso">En Progreso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="acciones-cell">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleEdit(viaje.id!)}
                      title="Editar"
                      aria-label={`Editar viaje ${viaje.numeroViaje}: ${viaje.origen} - ${viaje.destino}`}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(viaje.id!)}
                      title="Eliminar"
                      aria-label={`Eliminar viaje ${viaje.numeroViaje}: ${viaje.origen} - ${viaje.destino}`}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Viajes;
