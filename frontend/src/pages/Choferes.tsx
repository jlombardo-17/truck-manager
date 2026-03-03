import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import choferesService from '../services/choferesService';
import { Chofer, estadoChoferLabels } from '../types/chofer';
import '../styles/Choferes.css';

const Choferes: React.FC = () => {
  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [filteredChoferes, setFilteredChoferes] = useState<Chofer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    loadChoferes();
  }, []);

  useEffect(() => {
    filterChoferes();
  }, [searchTerm, choferes]);

  const loadChoferes = async () => {
    try {
      const data = await choferesService.getAll();
      setChoferes(data);
      setFilteredChoferes(data);
    } catch (error: any) {
      console.error('Error al cargar choferes:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterChoferes = () => {
    if (!searchTerm.trim()) {
      setFilteredChoferes(choferes);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = choferes.filter(
      (chofer) =>
        chofer.nombre.toLowerCase().includes(term) ||
        chofer.apellido.toLowerCase().includes(term) ||
        chofer.numeroDocumento.toLowerCase().includes(term) ||
        chofer.telefono.toLowerCase().includes(term)
    );
    setFilteredChoferes(filtered);
  };

  const handleDelete = async (id: number, nombreCompleto: string) => {
    if (!window.confirm(`¿Está seguro de eliminar al chofer ${nombreCompleto}?`)) {
      return;
    }

    try {
      await choferesService.delete(id);
      loadChoferes();
    } catch (error) {
      console.error('Error al eliminar chofer:', error);
      alert('Error al eliminar el chofer');
    }
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'badge-success';
      case 'inactivo':
        return 'badge-secondary';
      case 'suspendido':
        return 'badge-warning';
      default:
        return 'badge-default';
    }
  };

  if (loading) {
    return <div className="loading">Cargando choferes...</div>;
  }

  return (
    <div className="choferes-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-title" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>🚚 Truck Manager</h1>
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

      <div className="choferes-header">
        <h1>Gestión de Choferes</h1>
        <Link to="/choferes/new" className="btn-primary">
          + Agregar Chofer
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, documento o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredChoferes.length === 0 ? (
        <div className="empty-state">
          <p>No se encontraron choferes</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="choferes-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Nro. Documento</th>
                <th>Teléfono</th>
                <th>Fecha Ingreso</th>
                <th>Sueldo Base</th>
                <th>% Comisión</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredChoferes.map((chofer) => (
                <tr key={chofer.id}>
                  <td>
                    {chofer.apellido}, {chofer.nombre}
                  </td>
                  <td>{chofer.numeroDocumento}</td>
                  <td>{chofer.telefono}</td>
                  <td>
                    {new Date(chofer.fechaIngreso).toLocaleDateString('es-UY')}
                  </td>
                  <td>
                    {chofer.sueldoBase ? `$${chofer.sueldoBase.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td>
                    {chofer.porcentajeComision ? `${chofer.porcentajeComision}%` : '-'}
                  </td>
                  <td>
                    <span className={`badge ${getEstadoBadgeClass(chofer.estado)}`}>
                      {estadoChoferLabels[chofer.estado as keyof typeof estadoChoferLabels] || chofer.estado}
                    </span>
                  </td>
                  <td className="actions">
                    <Link
                      to={`/choferes/edit/${chofer.id}`}
                      className="btn-edit"
                      title="Editar"
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() =>
                        handleDelete(chofer.id, `${chofer.nombre} ${chofer.apellido}`)
                      }
                      className="btn-delete"
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

      <div className="summary">
        <p>
          Mostrando {filteredChoferes.length} de {choferes.length} choferes
        </p>
      </div>
    </div>
  );
};

export default Choferes;
