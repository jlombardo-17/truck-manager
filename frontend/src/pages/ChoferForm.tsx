import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import choferesService from '../services/choferesService';
import { EstadoChofer } from '../types/chofer';
import '../styles/ChoferForm.css';

interface FormData {
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fechaIngreso: string;
  fechaNacimiento: string;
  estado: EstadoChofer;
  sueldoBase: string;
  porcentajeComision: string;
}

const ChoferForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [formData, setFormData] = useState<FormData>({
    numeroDocumento: '',
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    fechaNacimiento: '',
    estado: EstadoChofer.ACTIVO,
    sueldoBase: '',
    porcentajeComision: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo al modificarlo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.numeroDocumento.trim()) {
      newErrors.numeroDocumento = 'El número de documento es obligatorio';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    }

    if (!formData.fechaIngreso) {
      newErrors.fechaIngreso = 'La fecha de ingreso es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        ...formData,
        fechaNacimiento: formData.fechaNacimiento || undefined,
        direccion: formData.direccion || undefined,
        sueldoBase: formData.sueldoBase ? parseFloat(formData.sueldoBase) : undefined,
        porcentajeComision: formData.porcentajeComision ? parseFloat(formData.porcentajeComision) : undefined,
      };

      await choferesService.create(dataToSend);

      navigate('/choferes');
    } catch (error: any) {
      console.error('Error al guardar chofer:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error al guardar el chofer');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chofer-form-container">
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

      <div className="page-header">
        <h1>➕ Nuevo Chofer</h1>
        <button onClick={() => navigate('/choferes')} className="btn-back">
          ← Volver a Choferes
        </button>
      </div>

      <form onSubmit={handleSubmit} className="chofer-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="numeroDocumento">
              Número de Documento / CI <span className="required">*</span>
            </label>
            <input
              type="text"
              id="numeroDocumento"
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={handleChange}
              className={errors.numeroDocumento ? 'error' : ''}
              disabled={loading}
            />
            {errors.numeroDocumento && (
              <span className="error-message">{errors.numeroDocumento}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="estado">
              Estado <span className="required">*</span>
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              disabled={loading}
            >
              <option value={EstadoChofer.ACTIVO}>Activo</option>
              <option value={EstadoChofer.INACTIVO}>Inactivo</option>
              <option value={EstadoChofer.SUSPENDIDO}>Suspendido</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="nombre">
              Nombre <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'error' : ''}
              disabled={loading}
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="apellido">
              Apellido <span className="required">*</span>
            </label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              className={errors.apellido ? 'error' : ''}
              disabled={loading}
            />
            {errors.apellido && <span className="error-message">{errors.apellido}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="telefono">
              Teléfono <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={errors.telefono ? 'error' : ''}
              disabled={loading}
            />
            {errors.telefono && <span className="error-message">{errors.telefono}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="fechaIngreso">
              Fecha de Ingreso <span className="required">*</span>
            </label>
            <input
              type="date"
              id="fechaIngreso"
              name="fechaIngreso"
              value={formData.fechaIngreso}
              onChange={handleChange}
              className={errors.fechaIngreso ? 'error' : ''}
              disabled={loading}
            />
            {errors.fechaIngreso && (
              <span className="error-message">{errors.fechaIngreso}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
            <input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sueldoBase">Sueldo Base ($)</label>
            <input
              type="number"
              id="sueldoBase"
              name="sueldoBase"
              value={formData.sueldoBase}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Ej: 35000.00"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="porcentajeComision">Porcentaje Comisión (%)</label>
            <input
              type="number"
              id="porcentajeComision"
              name="porcentajeComision"
              value={formData.porcentajeComision}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              placeholder="Ej: 15.00"
              disabled={loading}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="direccion">Dirección</label>
            <textarea
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/choferes')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando...' : '💾 Crear Chofer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChoferForm;
