import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import camionesService from '../services/camionesService';
import { CreateCamionDto } from '../types/camion';
import AppNavbar from '../components/AppNavbar';
import HeroSection from '../components/HeroSection';
import BackButton from '../components/BackButton';
import heroFleetRed from '../assets/hero-fleet-red.svg';
import '../styles/CamionForm.css';

const CamionForm: React.FC = () => {
  const navigate = useNavigate();
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

  if (isLoading && isEditing) {
    return (
      <div className="form-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <AppNavbar />

      <div className="page-back-button-container">
        <BackButton label="← Volver a Camiones" onClick={handleCancel} variant="ghost" />
      </div>

      <HeroSection
        subtitle="Fleet Management"
        title={isEditing ? 'Editar Camión' : 'Nuevo Camión'}
        description={
          isEditing
            ? 'Actualizá los datos del vehículo seleccionado.'
            : 'Cargá los datos del vehículo para sumarlo a la flota.'
        }
        backgroundImage={`linear-gradient(135deg, rgba(231, 76, 60, 0.9) 0%, rgba(230, 126, 34, 0.88) 50%, rgba(243, 156, 18, 0.85) 100%), url(${heroFleetRed})`}
        darkBg={true}
      />

      <div className="form-content">
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
            <button type="button" onClick={handleCancel} className="btn-secondary" disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
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
