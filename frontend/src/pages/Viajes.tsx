import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { viajsService, Viaje } from '../services/viajsService';
import camionesService from '../services/camionesService';
import choferesService from '../services/choferesService';
import { Camion } from '../types/camion';
import { Chofer } from '../types/chofer';
import HeroSection from '../components/HeroSection';
import StatsGrid from '../components/StatsGrid';
import '../styles/Viajes.css';

const Viajes: React.FC = () => {
  const navigate = useNavigate();
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
  });

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
      };

      const data = await viajsService.getAll(filters);
      setViajes(data);

      // Cargar datos complementarios (camiones y choferes) de manera eficiente
      const uniqueCamionIds = new Set(data.map((v) => v.camionId));
      const uniqueChoferIds = new Set(data.map((v) => v.choferId));

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

  return (
    <div className="viajes-page">
      <div className="page-back-button-container">
        <button className="btn-back-dashboard" onClick={() => navigate('/dashboard')}>
          ← Volver al Dashboard
        </button>
      </div>
      
      <HeroSection
        subtitle="Trip Management"
        title="Viajes y Rutas"
        description="Planificación, estado y trazabilidad de entregas."
        backgroundImage="linear-gradient(135deg, #9b59b6 0%, #8e44ad 50%, #c39bd3 100%)"
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

        <button
          className="btn-secondary"
          onClick={() => setFiltros({ estado: '', camionId: '', choferId: '' })}
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
                <th>Valor</th>
                <th>KM</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {skeletonRows.map((row) => (
                <tr key={row}>
                  <td colSpan={9}>
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
                <th>Valor</th>
                <th>KM</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {viajes.map((viaje) => (
                <tr key={viaje.id} className="viaje-row">
                  <td className="numero-viaje">
                    <strong>{viaje.numeroViaje}</strong>
                  </td>
                  <td>{camiones[viaje.camionId]?.patente || `ID: ${viaje.camionId}`}</td>
                  <td>
                    {choferes[viaje.choferId]
                      ? `${choferes[viaje.choferId].nombre} ${choferes[viaje.choferId].apellido}`
                      : `ID: ${viaje.choferId}`}
                  </td>
                  <td>{viaje.origen}</td>
                  <td>{viaje.destino}</td>
                  <td className="valor-cell">${Number(viaje.valorViaje || 0).toFixed(2)}</td>
                  <td className="km-cell">{Number(viaje.kmRecorridos || 0).toFixed(2)} km</td>
                  <td>
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
