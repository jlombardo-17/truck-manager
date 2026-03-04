import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { viajsService, Viaje } from '../services/viajsService';
import camionesService from '../services/camionesService';
import choferesService from '../services/choferesService';
import { Camion } from '../types/camion';
import { Chofer } from '../types/chofer';
import '../styles/Viajes.css';

const Viajes: React.FC = () => {
  const navigate = useNavigate();
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
      <div className="page-header">
        <h1>🛣️ Viajes y Rutas</h1>
        <button className="btn-primary" onClick={handleNew}>
          + Nuevo Viaje
        </button>
      </div>

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
        <div className="loading">Cargando viajes...</div>
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
                  <td className="valor-cell">${viaje.valorViaje.toFixed(2)}</td>
                  <td className="km-cell">{viaje.kmRecorridos?.toFixed(2) || '0'} km</td>
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
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(viaje.id!)}
                      title="Eliminar"
                    >
                      ✕
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
