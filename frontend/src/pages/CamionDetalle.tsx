import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import camionesService from '../services/camionesService';
import serviciosService from '../services/serviciosService';
import documentosService from '../services/documentosService';
import { repostadasService } from '../services/repostadasService';
import { Camion } from '../types/camion';
import { Servicio, TipoServicio, TipoServicioLabels } from '../types/servicio';
import { Documento, TipoDocumento, TipoDocumentoLabels } from '../types/servicio';
import { Repostada, TipoCombustibleLabels, Estadisticas } from '../types/repostada';
import { RepostadaModal } from '../components/RepostadaModal';
import { MantenimientoTab } from '../components/MantenimientoTab';
import DocumentoEstadoBadge from '../components/DocumentoEstadoBadge';
import '../styles/CamionDetalle.css';

const CamionDetalle: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const camionId = id ? parseInt(id) : 0;

  const [camion, setCamion] = useState<Camion | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [repostadas, setRepostadas] = useState<Repostada[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [showRepostadaModal, setShowRepostadaModal] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null);
  const [viewingDocumento, setViewingDocumento] = useState<Documento | null>(null);

  useEffect(() => {
    loadData();
  }, [camionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [camionData, serviciosData, documentosData, repostadasData, estadisticasData] = await Promise.all([
        camionesService.getById(camionId),
        serviciosService.getByCamion(camionId),
        documentosService.getByCamion(camionId),
        repostadasService.getByCamion(camionId),
        repostadasService.getEstadisticas(camionId),
      ]);
      setCamion(camionData);
      setServicios(serviciosData);
      setDocumentos(documentosData);
      setRepostadas(repostadasData);
      setEstadisticas(estadisticasData);
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

  const handleEditDocumento = (doc: Documento) => {
    setEditingDocumento(doc);
    setShowDocumentoModal(true);
  };

  const handleDeleteRepostada = async (repostadaId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta repostada?')) return;
    try {
      await repostadasService.delete(camionId, repostadaId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const handleAddRepostada = async (data: any) => {
    try {
      await repostadasService.create(camionId, data);
      setShowRepostadaModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar repostada');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const documentosVencidos = documentos.filter(
    (d) => d.fechaVencimiento && new Date(d.fechaVencimiento) < new Date()
  );
  const documentosProximos = documentos.filter((d) => {
    if (!d.fechaVencimiento) return false;
    const dias = Math.floor((new Date(d.fechaVencimiento).getTime() - Date.now()) / 86400000);
    return dias >= 0 && dias <= 30;
  });

  return (
    <div className="detalle-container">
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

      <div className="detalle-content">
        <div className="page-header">
          <button onClick={() => navigate('/camiones')} className="btn-back">
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
          <button
            onClick={() => { setEditingDocumento(null); setShowDocumentoModal(true); }}
            className="add-button"
          >
            + Agregar Documento
          </button>
        </div>

        {(documentosVencidos.length > 0 || documentosProximos.length > 0) && (
          <div className="docs-alert-strip">
            {documentosVencidos.length > 0 && (
              <span className="docs-alert-item docs-alert-vencido">
                ✕ {documentosVencidos.length} documento{documentosVencidos.length > 1 ? 's' : ''} vencido{documentosVencidos.length > 1 ? 's' : ''}
              </span>
            )}
            {documentosProximos.length > 0 && (
              <span className="docs-alert-item docs-alert-proximo">
                ⚠ {documentosProximos.length} próximo{documentosProximos.length > 1 ? 's' : ''} a vencer
              </span>
            )}
          </div>
        )}

        {documentos.length === 0 ? (
          <div className="empty-message">No hay documentos registrados</div>
        ) : (
          <div className="documentos-grid">
            {[...documentos]
              .sort((a, b) => {
                const getOrder = (doc: Documento) => {
                  if (!doc.fechaVencimiento) return 3;
                  const dias = Math.floor((new Date(doc.fechaVencimiento).getTime() - Date.now()) / 86400000);
                  if (dias < 0) return 0;
                  if (dias <= 30) return 1;
                  return 2;
                };
                return getOrder(a) - getOrder(b);
              })
              .map((doc) => {
                const dias = doc.fechaVencimiento
                  ? Math.floor((new Date(doc.fechaVencimiento).getTime() - Date.now()) / 86400000)
                  : null;
                const cardStatus =
                  dias === null ? 'sin-fecha' : dias < 0 ? 'vencido' : dias <= 30 ? 'proximo' : 'vigente';
                return (
                  <div key={doc.id} className={`documento-card documento-card-${cardStatus}`}>
                    <div className="documento-card-header">
                      <span className="documento-tipo">{TipoDocumentoLabels[doc.tipo]}</span>
                      <DocumentoEstadoBadge fechaVencimiento={doc.fechaVencimiento} mostrarDias={true} />
                    </div>

                    {doc.rutaArchivo ? (
                      <div
                        className="documento-preview clickable"
                        onClick={() => setViewingDocumento(doc)}
                        title="Ver imagen completa"
                      >
                        <img src={doc.rutaArchivo} alt={doc.nombre || 'Documento'} />
                        <div className="preview-overlay">🔍 Ver imagen</div>
                      </div>
                    ) : (
                      <div className="documento-no-imagen">
                        <span>📄</span>
                        <small>Sin imagen</small>
                      </div>
                    )}

                    <div className="documento-details">
                      {doc.nombre && <h4 className="doc-nombre">{doc.nombre}</h4>}
                      {doc.descripcion && <p className="doc-descripcion">{doc.descripcion}</p>}
                      {doc.fechaVencimiento && (
                        <p className="doc-vencimiento">
                          📅 Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>

                    <div className="doc-card-actions">
                      <button
                        onClick={() => handleEditDocumento(doc)}
                        className="doc-action-btn doc-edit-btn"
                        title="Editar documento"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteDocumento(doc.id)}
                        className="doc-action-btn doc-delete-btn"
                        title="Eliminar documento"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Historial de Repostadas */}
      <section className="info-section">
        <div className="section-header">
          <h2>⛽ Historial de Repostadas</h2>
          <button onClick={() => setShowRepostadaModal(true)} className="add-button">
            + Agregar Repostada
          </button>
        </div>

        {estadisticas && estadisticas.totalRepostadas > 0 && (
          <div className="stats-grid">
            <div className="stat-card">
              <label>Total de Repostadas</label>
              <span className="stat-value">{estadisticas.totalRepostadas}</span>
            </div>
            <div className="stat-card">
              <label>Total KM Recorridos</label>
              <span className="stat-value">{Number(estadisticas.totalKm || 0).toLocaleString('es-AR')} km</span>
            </div>
            <div className="stat-card">
              <label>Total Litros</label>
              <span className="stat-value">{Number(estadisticas.totalLitros || 0).toFixed(2)} L</span>
            </div>
            <div className="stat-card">
              <label>Consumo Promedio</label>
              <span className="stat-value">{Number(estadisticas.consumoPromedio || 0).toFixed(2)} km/L</span>
            </div>
            <div className="stat-card">
              <label>Costo Total</label>
              <span className="stat-value">${Number(estadisticas.totalCosto || 0).toLocaleString('es-AR')}</span>
            </div>
            <div className="stat-card">
              <label>Costo Promedio</label>
              <span className="stat-value">${Number(estadisticas.costoPromedio || 0).toLocaleString('es-AR')}</span>
            </div>
          </div>
        )}

        {repostadas.length === 0 ? (
          <div className="empty-message">No hay repostadas registradas</div>
        ) : (
          <div className="repostadas-list">
            {repostadas.map((repostada) => (
              <div key={repostada.id} className="repostada-item">
                <div className="repostada-header">
                  <span className="fecha">{new Date(repostada.fechaRepostada).toLocaleDateString('es-AR')}</span>
                  <span className="tipo-combustible">{TipoCombustibleLabels[repostada.tipoCombustible]}</span>
                  <button
                    onClick={() => handleDeleteRepostada(repostada.id)}
                    className="delete-btn"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
                <div className="repostada-grid">
                  <div className="repostada-dato">
                    <label>KM Recorridos</label>
                    <span>{Number(repostada.kmRecorridos || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="repostada-dato">
                    <label>Litros</label>
                    <span>{(Number(repostada.litros) || 0).toFixed(2)} L</span>
                  </div>
                  <div className="repostada-dato">
                    <label>Consumo</label>
                    <span>{(Number(repostada.consumoPromedio) || 0).toFixed(2)} km/L</span>
                  </div>
                  <div className="repostada-dato">
                    <label>Precio/L</label>
                    <span>${(Number(repostada.precioLitro) || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="repostada-dato">
                    <label>Costo</label>
                    <span>${(Number(repostada.costo) || 0).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mantenimiento */}
      <section className="info-section">
        <h2>🔧 Gestión de Mantenimiento</h2>
        <MantenimientoTab camionId={camionId} />
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
          documento={editingDocumento}
          onClose={() => {
            setShowDocumentoModal(false);
            setEditingDocumento(null);
          }}
          onSave={() => {
            setShowDocumentoModal(false);
            setEditingDocumento(null);
            loadData();
          }}
        />
      )}

      {viewingDocumento && (
        <DocumentoViewModal
          documento={viewingDocumento}
          onClose={() => setViewingDocumento(null)}
        />
      )}

      {showRepostadaModal && (
        <RepostadaModal
          isOpen={showRepostadaModal}
          onClose={() => setShowRepostadaModal(false)}
          onSubmit={handleAddRepostada}
        />
      )}
      </div>
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
  documento?: Documento | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ camionId, documento, onClose, onSave }) => {
  const isEditing = !!documento;
  const [formData, setFormData] = useState({
    tipo: (documento?.tipo ?? TipoDocumento.SEGURO) as TipoDocumento,
    nombre: documento?.nombre ?? '',
    rutaArchivo: documento?.rutaArchivo ?? '',
    descripcion: documento?.descripcion ?? '',
    fechaVencimiento: documento?.fechaVencimiento
      ? documento.fechaVencimiento.split('T')[0]
      : '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, rutaArchivo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !formData.rutaArchivo) {
      setError('Selecciona una imagen del documento');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        tipo: formData.tipo,
        nombre: formData.nombre || undefined,
        rutaArchivo: formData.rutaArchivo,
        descripcion: formData.descripcion || undefined,
        fechaVencimiento: formData.fechaVencimiento || undefined,
      };
      if (isEditing) {
        await documentosService.update(documento!.id, camionId, payload);
      } else {
        await documentosService.create(camionId, payload);
      }
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
          <h2>{isEditing ? 'Editar Documento' : 'Agregar Documento'}</h2>
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
            <label>
              Imagen del Documento{isEditing ? ' (dejar vacío para mantener la actual)' : ''}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
              required={!isEditing}
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
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Documento' : 'Guardar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para ver documento completo
const DocumentoViewModal: React.FC<{
  documento: Documento;
  onClose: () => void;
}> = ({ documento, onClose }) => {
  return (
    <div className="modal-overlay doc-view-overlay" onClick={onClose}>
      <div className="doc-view-container" onClick={(e) => e.stopPropagation()}>
        <div className="doc-view-header">
          <div className="doc-view-title">
            <span className="documento-tipo">{TipoDocumentoLabels[documento.tipo]}</span>
            {documento.nombre && <h3>{documento.nombre}</h3>}
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {documento.rutaArchivo && (
          <div className="doc-view-image">
            <img src={documento.rutaArchivo} alt={documento.nombre || 'Documento'} />
          </div>
        )}

        <div className="doc-view-details">
          {documento.descripcion && (
            <div className="doc-view-field">
              <label>Descripción</label>
              <span>{documento.descripcion}</span>
            </div>
          )}
          {documento.fechaVencimiento && (
            <div className="doc-view-field">
              <label>Fecha de Vencimiento</label>
              <span>{new Date(documento.fechaVencimiento).toLocaleDateString('es-AR')}</span>
            </div>
          )}
          <div className="doc-view-field">
            <label>Estado</label>
            <DocumentoEstadoBadge fechaVencimiento={documento.fechaVencimiento} mostrarDias={true} />
          </div>
          <div className="doc-view-field">
            <label>Cargado el</label>
            <span>{new Date(documento.createdAt).toLocaleDateString('es-AR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CamionDetalle;
