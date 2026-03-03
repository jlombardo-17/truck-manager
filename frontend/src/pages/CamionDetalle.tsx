import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import camionesService from '../services/camionesService';
import serviciosService from '../services/serviciosService';
import documentosService from '../services/documentosService';
import { Camion } from '../types/camion';
import { Servicio, TipoServicio, TipoServicioLabels } from '../types/servicio';
import { Documento, TipoDocumento, TipoDocumentoLabels } from '../types/servicio';
import '../styles/CamionDetalle.css';

const CamionDetalle: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const camionId = id ? parseInt(id) : 0;

  const [camion, setCamion] = useState<Camion | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [camionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [camionData, serviciosData, documentosData] = await Promise.all([
        camionesService.getById(camionId),
        serviciosService.getByCamion(camionId),
        documentosService.getByCamion(camionId),
      ]);
      setCamion(camionData);
      setServicios(serviciosData);
      setDocumentos(documentosData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteServicio = async (servicioId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;
    try {
      await serviciosService.delete(servicioId, camionId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const handleDeleteDocumento = async (documentoId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      await documentosService.delete(documentoId, camionId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  if (isLoading) {
    return (
      <div className="detalle-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  if (!camion) {
    return (
      <div className="detalle-container">
        <div className="error-message">Camión no encontrado</div>
      </div>
    );
  }

  const ultimoServicio = servicios.length > 0 ? servicios[0] : null;

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <button onClick={() => navigate('/camiones')} className="back-button">
          ← Volver a Camiones
        </button>
        <h1>{camion.patente} - {camion.marca} {camion.modelo}</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Información General */}
      <section className="info-section">
        <h2>📋 Información General</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Patente</label>
            <span>{camion.patente}</span>
          </div>
          <div className="info-item">
            <label>Marca</label>
            <span>{camion.marca}</span>
          </div>
          <div className="info-item">
            <label>Modelo</label>
            <span>{camion.modelo}</span>
          </div>
          <div className="info-item">
            <label>Año</label>
            <span>{camion.anio}</span>
          </div>
          <div className="info-item">
            <label>Estado</label>
            <span className="estado-badge">{camion.estado}</span>
          </div>
          <div className="info-item">
            <label>Odómetro (km)</label>
            <span>{Number(camion.odometroKm).toLocaleString('es-AR')}</span>
          </div>
        </div>
      </section>

      {/* Último Servicio */}
      {ultimoServicio && (
        <section className="info-section highlight">
          <h2>🔧 Último Servicio</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Fecha</label>
              <span>{new Date(ultimoServicio.fechaServicio).toLocaleDateString('es-AR')}</span>
            </div>
            <div className="info-item">
              <label>Tipos de Servicio</label>
              <span className="servicio-tags">
                {ultimoServicio.tipos.map((tipo) => (
                  <span key={tipo} className="tag">
                    {TipoServicioLabels[tipo]}
                  </span>
                ))}
              </span>
            </div>
            {ultimoServicio.kilometraje && (
              <div className="info-item">
                <label>Kilometraje</label>
                <span>{ultimoServicio.kilometraje.toLocaleString('es-AR')} km</span>
              </div>
            )}
            {ultimoServicio.costo && (
              <div className="info-item">
                <label>Costo</label>
                <span>${Number(ultimoServicio.costo).toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>
          {ultimoServicio.descripcion && (
            <div className="descripcion-box">
              <p>{ultimoServicio.descripcion}</p>
            </div>
          )}
        </section>
      )}

      {/* Historial de Servicios */}
      <section className="info-section">
        <div className="section-header">
          <h2>🛠️ Historial de Servicios</h2>
          <button onClick={() => setShowServicioModal(true)} className="add-button">
            + Agregar Servicio
          </button>
        </div>

        {servicios.length === 0 ? (
          <div className="empty-message">No hay servicios registrados</div>
        ) : (
          <div className="servicios-list">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="servicio-item">
                <div className="servicio-header">
                  <span className="fecha">{new Date(servicio.fechaServicio).toLocaleDateString('es-AR')}</span>
                  <button
                    onClick={() => handleDeleteServicio(servicio.id)}
                    className="delete-btn"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
                <div className="servicio-tipos">
                  {servicio.tipos.map((tipo) => (
                    <span key={tipo} className="tag">
                      {TipoServicioLabels[tipo]}
                    </span>
                  ))}
                </div>
                {servicio.descripcion && <p className="descripcion">{servicio.descripcion}</p>}
                <div className="servicio-footer">
                  {servicio.kilometraje && <span className="km">km: {servicio.kilometraje.toLocaleString('es-AR')}</span>}
                  {servicio.costo && <span className="costo">${Number(servicio.costo).toLocaleString('es-AR')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Documentación */}
      <section className="info-section">
        <div className="section-header">
          <h2>📄 Documentación</h2>
          <button onClick={() => setShowDocumentoModal(true)} className="add-button">
            + Agregar Documento
          </button>
        </div>

        {documentos.length === 0 ? (
          <div className="empty-message">No hay documentos registrados</div>
        ) : (
          <div className="documentos-grid">
            {documentos.map((doc) => (
              <div key={doc.id} className="documento-card">
                <div className="documento-tipo">{TipoDocumentoLabels[doc.tipo]}</div>
                {doc.rutaArchivo && (
                  <div className="documento-preview">
                    <img src={doc.rutaArchivo} alt={doc.nombre || 'Documento'} />
                  </div>
                )}
                {doc.nombre && <h4>{doc.nombre}</h4>}
                {doc.descripcion && <p className="descripcion">{doc.descripcion}</p>}
                {doc.fechaVencimiento && (
                  <p className="vencimiento">
                    Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-AR')}
                  </p>
                )}
                <button
                  onClick={() => handleDeleteDocumento(doc.id)}
                  className="delete-btn"
                  title="Eliminar"
                >
                  🗑️ Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modales */}
      {showServicioModal && (
        <ServicioModal
          camionId={camionId}
          onClose={() => setShowServicioModal(false)}
          onSave={() => {
            setShowServicioModal(false);
            loadData();
          }}
        />
      )}

      {showDocumentoModal && (
        <DocumentoModal
          camionId={camionId}
          onClose={() => setShowDocumentoModal(false)}
          onSave={() => {
            setShowDocumentoModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Modal para Servicio
const ServicioModal: React.FC<{
  camionId: number;
  onClose: () => void;
  onSave: () => void;
}> = ({ camionId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fechaServicio: new Date().toISOString().split('T')[0],
    tipos: [] as TipoServicio[],
    descripcion: '',
    costo: '',
    kilometraje: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (tipo: TipoServicio) => {
    setFormData((prev) => ({
      ...prev,
      tipos: prev.tipos.includes(tipo) ? prev.tipos.filter((t) => t !== tipo) : [...prev.tipos, tipo],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.tipos.length === 0) {
      setError('Selecciona al menos un tipo de servicio');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await serviciosService.create(camionId, {
        fechaServicio: formData.fechaServicio,
        tipos: formData.tipos,
        descripcion: formData.descripcion || undefined,
        costo: formData.costo ? Number(formData.costo) : undefined,
        kilometraje: formData.kilometraje ? Number(formData.kilometraje) : undefined,
      });
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar servicio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Agregar Servicio</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Fecha del Servicio</label>
            <input
              type="date"
              value={formData.fechaServicio}
              onChange={(e) => setFormData({ ...formData, fechaServicio: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Tipos de Servicio</label>
            <div className="checkbox-group">
              {Object.values(TipoServicio).map((tipo) => (
                <label key={tipo} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.tipos.includes(tipo)}
                    onChange={() => handleTypeChange(tipo)}
                    disabled={isLoading}
                  />
                  {TipoServicioLabels[tipo]}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kilometraje</label>
              <input
                type="number"
                value={formData.kilometraje}
                onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Costo</label>
              <input
                type="number"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                disabled={isLoading}
                step="0.01"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para Documento
const DocumentoModal: React.FC<{
  camionId: number;
  onClose: () => void;
  onSave: () => void;
}> = ({ camionId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tipo: TipoDocumento.SEGURO as TipoDocumento,
    nombre: '',
    rutaArchivo: '',
    descripcion: '',
    fechaVencimiento: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, rutaArchivo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await documentosService.create(camionId, {
        tipo: formData.tipo,
        nombre: formData.nombre || undefined,
        rutaArchivo: formData.rutaArchivo,
        descripcion: formData.descripcion || undefined,
        fechaVencimiento: formData.fechaVencimiento || undefined,
      });
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar documento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Agregar Documento</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de Documento</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoDocumento })}
              disabled={isLoading}
            >
              {Object.values(TipoDocumento).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TipoDocumentoLabels[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={isLoading}
              placeholder="Ej: Póliza 2024"
            />
          </div>

          <div className="form-group">
            <label>Imagen del Documento</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
              required
            />
            {formData.rutaArchivo && (
              <div className="image-preview">
                <img src={formData.rutaArchivo} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Fecha de Vencimiento</label>
            <input
              type="date"
              value={formData.fechaVencimiento}
              onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CamionDetalle;
