import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import camionesService from '../services/camionesService';
import { Camion } from '../types/camion';
import HeroSection from '../components/HeroSection';
import StatsGrid from '../components/StatsGrid';
import BackButton from '../components/BackButton';
import heroFleetRed from '../assets/hero-fleet-red.svg';
import '../styles/Camiones.css';

type TimeRangeOption = 'all' | '1y' | '5y';

const Camiones: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const skeletonRows = Array.from({ length: 6 }, (_, index) => index);
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [filteredCamiones, setFilteredCamiones] = useState<Camion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    loadCamiones();
  }, []);

  useEffect(() => {
    const thresholdDate = getThresholdDate(timeRange);
    const filtered = camiones.filter((camion) => {
      const matchesTimeRange = isCamionWithinTimeRange(camion, thresholdDate);
      if (!matchesTimeRange) {
        return false;
      }

      if (searchTerm.trim() === '') {
        return true;
      }

      const normalizedSearch = searchTerm.toLowerCase();
      return (
        camion.patente.toLowerCase().includes(normalizedSearch) ||
        camion.marca.toLowerCase().includes(normalizedSearch) ||
        camion.modelo.toLowerCase().includes(normalizedSearch)
      );
    });

    setFilteredCamiones(filtered);
  }, [searchTerm, timeRange, camiones]);

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

  const handleViewDetail = (id: number) => {
    navigate(`/camiones/${id}`);
  };

  const handleCreate = () => {
    navigate('/camiones/new');
  };

  const getThresholdDate = (range: TimeRangeOption) => {
    if (range === 'all') {
      return null;
    }

    const threshold = new Date();
    if (range === '1y') {
      threshold.setFullYear(threshold.getFullYear() - 1);
    }

    if (range === '5y') {
      threshold.setFullYear(threshold.getFullYear() - 5);
    }

    return threshold;
  };

  const isCamionWithinTimeRange = (camion: Camion, thresholdDate: Date | null) => {
    if (!thresholdDate) {
      return true;
    }

    const createdAt = camion.createdAt ? new Date(camion.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      return false;
    }

    return createdAt >= thresholdDate;
  };

  const getTimeRangeLabel = (range: TimeRangeOption) => {
    if (range === '1y') return 'último año';
    if (range === '5y') return 'últimos 5 años';
    return 'todo el historial';
  };

  const camionesEnVentana = camiones.filter((camion) =>
    isCamionWithinTimeRange(camion, getThresholdDate(timeRange)),
  );

  const totalKilometros = camionesEnVentana.reduce(
    (sum, camion) => sum + Number(camion.odometroKm || 0),
    0,
  );

  const totalKilometrosLabel = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: totalKilometros < 1000 ? 1 : 0,
    maximumFractionDigits: totalKilometros < 1000 ? 1 : 0,
  }).format(totalKilometros);

  const normalizeEstadoCamion = (estado?: string) => {
    const normalized = (estado || '').toLowerCase().trim().replace(/\s+/g, '_');

    if (normalized === 'activo' || normalized === 'operativo') return 'activo';
    if (normalized === 'mantenimiento' || normalized === 'en_mantenimiento') return 'mantenimiento';
    if (normalized === 'fuera_de_servicio' || normalized === 'out_of_service') return 'fuera_de_servicio';
    if (normalized === 'inactivo' || normalized === 'inactive') return 'inactivo';

    return normalized || 'inactivo';
  };

  const estadoLabel = (estado?: string) => {
    const normalized = normalizeEstadoCamion(estado);
    if (normalized === 'activo') return 'Activo';
    if (normalized === 'mantenimiento') return 'Mantenimiento';
    if (normalized === 'fuera_de_servicio') return 'Fuera de Servicio';
    if (normalized === 'inactivo') return 'Inactivo';
    return normalized;
  };

  if (isLoading) {
    return (
      <div className="camiones-container">
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

        <div className="camiones-content">
          <div className="camiones-header">
            <div className="header-copy">
              <h1>Gestión de Camiones</h1>
              <p>Control de flota, estado operativo y datos clave de cada unidad.</p>
            </div>
            <button onClick={handleCreate} className="create-button" disabled>
              + Nuevo Camión
            </button>
          </div>

          <div className="table-container skeleton-table">
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
                {skeletonRows.map((row) => (
                  <tr key={row}>
                    <td colSpan={8}>
                      <div className="skeleton-line" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="camiones-container">
      {/* Navbar */}
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

      <div className="camiones-content">
        <div className="page-back-button-container">
          <BackButton label="Volver al Dashboard" to="/dashboard" />
        </div>
        
        <HeroSection
          subtitle="Fleet Management"
          title="Gestión de Camiones"
          description="Control de flota, estado operativo y datos clave de cada unidad."
          backgroundImage={`linear-gradient(135deg, rgba(231, 76, 60, 0.9) 0%, rgba(230, 126, 34, 0.88) 50%, rgba(243, 156, 18, 0.85) 100%), url(${heroFleetRed})`}
          darkBg={true}
          primaryAction={{
            label: '+ Nuevo Camión',
            onClick: handleCreate,
          }}
        />

        <section className="camiones-kpi-section">
          <div className="camiones-container-inner">
            <StatsGrid
              stats={[
                {
                  label: 'Total de Camiones',
                  value: String(camionesEnVentana.length),
                  unit: 'unidades',
                  icon: '🚚',
                  color: 'blue',
                  trend: { direction: 'up', percentage: 2 },
                },
                {
                  label: 'Camiones Operativos',
                  value: String(camionesEnVentana.filter((c) => normalizeEstadoCamion(c.estado) === 'activo').length),
                  unit: 'activos',
                  icon: '✓',
                  color: 'green',
                  trend: { direction: 'up', percentage: 5 },
                },
                {
                  label: 'Total KM Recorridos',
                  value: totalKilometrosLabel,
                  unit: 'km',
                  icon: '📍',
                  color: 'purple',
                  trend: { direction: 'up', percentage: 8 },
                },
                {
                  label: 'En Mantenimiento',
                  value: String(camionesEnVentana.filter((c) => normalizeEstadoCamion(c.estado) === 'mantenimiento').length),
                  unit: 'camiones',
                  icon: '🔧',
                  color: 'red',
                  trend: { direction: 'down', percentage: 2 },
                },
              ]}
              columns={4}
              loading={isLoading}
            />
          </div>
        </section>

        {error && <div className="error-message">{error}</div>}

        <div className="camiones-toolbar">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por patente, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="time-filter-group">
            <label htmlFor="camiones-time-range" className="time-filter-label">
              Ventana de tiempo
            </label>
            <select
              id="camiones-time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
              className="time-filter-select"
            >
              <option value="all">Todo el historial</option>
              <option value="1y">Último año</option>
              <option value="5y">Últimos 5 años</option>
            </select>
          </div>
        </div>

        <div className="camiones-stats">
          KPIs calculados sobre {camionesEnVentana.length} camiones en {getTimeRangeLabel(timeRange)}.
          {searchTerm.trim() !== '' && ` Tabla filtrada a ${filteredCamiones.length} resultados por búsqueda.`}
        </div>

        {filteredCamiones.length === 0 ? (
        <div className="empty-state">
          <p>No se encontraron camiones.</p>
          {searchTerm && <p>Intenta con otro término de búsqueda.</p>}
          {!searchTerm && <p>Probá ampliar la ventana temporal seleccionada.</p>}
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
                    <button
                      onClick={() => handleViewDetail(camion.id)}
                      className="patente-link"
                      title="Ver detalle"
                    >
                      <strong>{camion.patente}</strong>
                    </button>
                  </td>
                  <td>{camion.marca}</td>
                  <td>{camion.modelo}</td>
                  <td>{camion.anio}</td>
                  <td>
                    <span className={`estado-badge ${normalizeEstadoCamion(camion.estado)}`}>
                      {estadoLabel(camion.estado)}
                    </span>
                  </td>
                  <td>{Number(camion.odometroKm).toLocaleString('es-AR')}</td>
                  <td className="actions-cell">
                    <button 
                      onClick={() => handleEdit(camion.id)} 
                      className="edit-button" 
                      title="Editar"
                      aria-label={`Editar camión ${camion.patente}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(camion.id, camion.patente)}
                      className="delete-button"
                      title="Eliminar"
                      aria-label={`Eliminar camión ${camion.patente}`}
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
    </div>
  );
};

export default Camiones;
