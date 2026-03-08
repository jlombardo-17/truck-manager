import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import camionesService from '../services/camionesService';
import { CreateCamionDto } from '../types/camion';
import '../styles/CamionForm.css';

const CamionForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<CreateCamionDto>({
    patente: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    estado: 'activo',
    odometroKm: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadCamion(parseInt(id));
    }
  }, [id, isEditing]);

  const loadCamion = async (camionId: number) => {
    try {
      setIsLoading(true);
      const camion = await camionesService.getById(camionId);
      setFormData({
        patente: camion.patente,
        marca: camion.marca,
        modelo: camion.modelo,
        anio: camion.anio,
        estado: camion.estado,
        odometroKm: Number(camion.odometroKm),
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar el camión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'anio' || name === 'odometroKm' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isEditing && id) {
        await camionesService.update(parseInt(id), formData);
      } else {
        await camionesService.create(formData);
      }
      navigate('/camiones');
    } catch (err: any) {
      const errorMessage = Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Error al guardar';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/camiones');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading && isEditing) {
    return (
      <div className="form-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="form-container">
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

      <div className="form-content">
        <div className="page-header">
          <button onClick={handleCancel} className="btn-back">
            ← Volver a Camiones
          </button>
          <h1>{isEditing ? '✏️ Editar Camión' : '➕ Nuevo Camión'}</h1>
        </div>

        <div className="form-card">
          {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patente">
                Patente <span className="required">*</span>
              </label>
              <input
                id="patente"
                name="patente"
                type="text"
                value={formData.patente}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ej: ABC123"
                maxLength={10}
                aria-describedby="patente-help"
                aria-required="true"
              />
              <small id="patente-help" className="form-help">
                Identificación única del vehículo
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select 
                id="estado" 
                name="estado" 
                value={formData.estado} 
                onChange={handleChange} 
                disabled={isLoading}
                aria-describedby="estado-help"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="fuera_de_servicio">Fuera de Servicio</option>
              </select>
              <small id="estado-help" className="form-help">
                Estado operativo actual del camión
              </small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="marca">
                Marca <span className="required">*</span>
              </label>
              <input
                id="marca"
                name="marca"
                type="text"
                value={formData.marca}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ej: Volvo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="modelo">
                Modelo <span className="required">*</span>
              </label>
              <input
                id="modelo"
                name="modelo"
                type="text"
                value={formData.modelo}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Ej: FH16"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="anio">
                Año <span className="required">*</span>
              </label>
              <input
                id="anio"
                name="anio"
                type="number"
                value={formData.anio}
                onChange={handleChange}
                required
                disabled={isLoading}
                min={1950}
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="form-group">
              <label htmlFor="odometroKm">Odómetro (km)</label>
              <input
                id="odometroKm"
                name="odometroKm"
                type="number"
                value={formData.odometroKm}
                onChange={handleChange}
                disabled={isLoading}
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-button" disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Camión'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default CamionForm;
