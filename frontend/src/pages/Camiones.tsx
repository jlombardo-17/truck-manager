import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import camionesService from '../services/camionesService';
import { Camion } from '../types/camion';
import '../styles/Camiones.css';

const Camiones: React.FC = () => {
  const navigate = useNavigate();
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [filteredCamiones, setFilteredCamiones] = useState<Camion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCamiones();
  }, []);

  useEffect(() => {
    // Filtrar camiones cuando cambia el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredCamiones(camiones);
    } else {
      const filtered = camiones.filter(
        (camion) =>
          camion.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          camion.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
          camion.modelo.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCamiones(filtered);
    }
  }, [searchTerm, camiones]);

  const loadCamiones = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await camionesService.getAll();
      setCamiones(data);
      setFilteredCamiones(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar camiones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, patente: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el camión ${patente}?`)) {
      return;
    }

    try {
      await camionesService.delete(id);
      loadCamiones(); // Recargar la lista
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el camión');
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/camiones/edit/${id}`);
  };

  const handleCreate = () => {
    navigate('/camiones/new');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="camiones-container">
        <div className="loading">Cargando camiones...</div>
      </div>
    );
  }

  return (
    <div className="camiones-container">
      <div className="camiones-header">
        <div className="header-title">
          <button onClick={handleBack} className="back-button">
            ← Volver
          </button>
          <h1>🚚 Gestión de Camiones</h1>
        </div>
        <button onClick={handleCreate} className="create-button">
          + Nuevo Camión
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por patente, marca o modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="camiones-stats">
        <p>
          Total: {filteredCamiones.length} {filteredCamiones.length === 1 ? 'camión' : 'camiones'}
        </p>
      </div>

      {filteredCamiones.length === 0 ? (
        <div className="empty-state">
          <p>No se encontraron camiones.</p>
          {searchTerm && <p>Intenta con otro término de búsqueda.</p>}
        </div>
      ) : (
        <div className="table-container">
          <table className="camiones-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patente</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Estado</th>
                <th>Odómetro (km)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCamiones.map((camion) => (
                <tr key={camion.id}>
                  <td>{camion.id}</td>
                  <td>
                    <strong>{camion.patente}</strong>
                  </td>
                  <td>{camion.marca}</td>
                  <td>{camion.modelo}</td>
                  <td>{camion.anio}</td>
                  <td>
                    <span className={`estado-badge ${camion.estado}`}>{camion.estado}</span>
                  </td>
                  <td>{Number(camion.odometroKm).toLocaleString('es-AR')}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleEdit(camion.id)} className="edit-button" title="Editar">
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(camion.id, camion.patente)}
                      className="delete-button"
                      title="Eliminar"
                    >
                      🗑️
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

export default Camiones;
