import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chofer } from '../types/chofer';
import { ChoferDocumento, TipoDocumentoChofer, TipoDocumentoChoferLabels } from '../types/chofer-documento';
import choferesService from '../services/choferesService';
import choferDocumentosService from '../services/choferDocumentosService';
import DocumentoEstadoBadge from '../components/DocumentoEstadoBadge';
import '../styles/ChoferDetalle.css';

const ChoferDetalle: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const choferId = parseInt(id || '0');

  const [chofer, setChofer] = useState<Chofer | null>(null);
  const [documentos, setDocumentos] = useState<ChoferDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'documentos'>('info');

  // Formulario de nuevo documento
  const [showDocumentoForm, setShowDocumentoForm] = useState(false);
  const [nuevoDocumento, setNuevoDocumento] = useState<Partial<ChoferDocumento>>({
    tipo: TipoDocumentoChofer.LICENCIA_CONDUCIR,
    rutaArchivo: '',
  });

  useEffect(() => {
    loadData();
  }, [choferId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [choferData, documentosData] = await Promise.all([
        choferesService.getById(choferId),
        choferDocumentosService.getByChoferId(choferId),
      ]);

      setChofer(choferData);
      setDocumentos(documentosData);
    } catch (err) {
      setError('Error al cargar los datos del chofer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocumento = async (documentoId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      await choferDocumentosService.delete(documentoId);
      await loadData();
    } catch (err) {
      setError('Error al eliminar el documento');
      console.error(err);
    }
  };

  const handleCreateDocumento = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await choferDocumentosService.create({
        ...nuevoDocumento,
        choferId,
      } as ChoferDocumento);
      
      setShowDocumentoForm(false);
      setNuevoDocumento({
        tipo: TipoDocumentoChofer.LICENCIA_CONDUCIR,
        rutaArchivo: '',
      });
      await loadData();
    } catch (err) {
      setError('Error al crear el documento');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading-container">Cargando...</div>;
  }

  if (error || !chofer) {
    return (
      <div className="error-container">
        <p>{error || 'Chofer no encontrado'}</p>
        <button onClick={() => navigate('/choferes')}>Volver a Choferes</button>
      </div>
    );
  }

  return (
    <div className="chofer-detalle-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/choferes')}>
          ← Volver
        </button>
        <h1>📋 Detalle del Chofer</h1>
        <button 
          className="btn-edit"
          onClick={() => navigate(`/choferes/${choferId}/editar`)}
        >
          ✏️ Editar
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="chofer-header">
        <div className="chofer-avatar">
          <span className="avatar-icon">👤</span>
        </div>
        <div className="chofer-info">
          <h2>{chofer.nombre} {chofer.apellido}</h2>
          <p className="chofer-dni">DNI/CI: {chofer.numeroDocumento}</p>
          {chofer.user?.email && <p className="chofer-email">✉ {chofer.user.email}</p>}
          {chofer.telefono && <p className="chofer-telefono">📞 {chofer.telefono}</p>}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📄 Información
        </button>
        <button
          className={`tab ${activeTab === 'documentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          📎 Documentos ({documentos.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="info-section">
            <div className="info-grid">
              <div className="info-card">
                <h3>👤 Datos Personales</h3>
                <div className="info-item">
                  <label>Nombre completo:</label>
                  <span>{chofer.nombre} {chofer.apellido}</span>
                </div>
                <div className="info-item">
                  <label>Número de Documento:</label>
                  <span>{chofer.numeroDocumento}</span>
                </div>
                {chofer.fechaNacimiento && (
                  <div className="info-item">
                    <label>Fecha de Nacimiento:</label>
                    <span>{new Date(chofer.fechaNacimiento).toLocaleDateString('es-AR')}</span>
                  </div>
                )}
                {chofer.direccion && (
                  <div className="info-item">
                    <label>Dirección:</label>
                    <span>{chofer.direccion}</span>
                  </div>
                )}
              </div>

              <div className="info-card">
                <h3>� Información Laboral</h3>
                <div className="info-item">
                  <label>Fecha de Ingreso:</label>
                  <span>{new Date(chofer.fechaIngreso).toLocaleDateString('es-AR')}</span>
                </div>
                {chofer.sueldoBase && (
                  <div className="info-item">
                    <label>Sueldo Base:</label>
                    <span>${Number(chofer.sueldoBase).toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {chofer.porcentajeComision && (
                  <div className="info-item">
                    <label>% Comisión:</label>
                    <span>{chofer.porcentajeComision}%</span>
                  </div>
                )}
                <div className="info-item">
                  <label>Estado:</label>
                  <span className={`estado-${chofer.estado}`}>{chofer.estado}</span>
                </div>
              </div>

              <div className="info-card">
                <h3>📞 Contacto</h3>
                {chofer.user?.email && (
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{chofer.user.email}</span>
                  </div>
                )}
                {chofer.telefono && (
                  <div className="info-item">
                    <label>Teléfono:</label>
                    <span>{chofer.telefono}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="documentos-section">
            <div className="section-header">
              <h3>📎 Documentos del Chofer</h3>
              <button
                className="btn-primary"
                onClick={() => setShowDocumentoForm(!showDocumentoForm)}
              >
                {showDocumentoForm ? '✕ Cancelar' : '+ Nuevo Documento'}
              </button>
            </div>

            {showDocumentoForm && (
              <form className="documento-form" onSubmit={handleCreateDocumento}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tipo de Documento *</label>
                    <select
                      value={nuevoDocumento.tipo}
                      onChange={(e) =>
                        setNuevoDocumento({
                          ...nuevoDocumento,
                          tipo: e.target.value as TipoDocumentoChofer,
                        })
                      }
                      required
                    >
                      {Object.values(TipoDocumentoChofer).map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {TipoDocumentoChoferLabels[tipo]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nombre del Documento</label>
                    <input
                      type="text"
                      value={nuevoDocumento.nombre || ''}
                      onChange={(e) =>
                        setNuevoDocumento({ ...nuevoDocumento, nombre: e.target.value })
                      }
                      placeholder="Ej: Licencia categoría C1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Número de Documento</label>
                    <input
                      type="text"
                      value={nuevoDocumento.numeroDocumento || ''}
                      onChange={(e) =>
                        setNuevoDocumento({ ...nuevoDocumento, numeroDocumento: e.target.value })
                      }
                      placeholder="Ej: 12345678"
                    />
                  </div>

                  <div className="form-group">
                    <label>URL/Ruta del Archivo *</label>
                    <input
                      type="text"
                      value={nuevoDocumento.rutaArchivo}
                      onChange={(e) =>
                        setNuevoDocumento({ ...nuevoDocumento, rutaArchivo: e.target.value })
                      }
                      placeholder="data:image/png;base64,..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de Emisión</label>
                    <input
                      type="date"
                      value={nuevoDocumento.fechaEmision || ''}
                      onChange={(e) =>
                        setNuevoDocumento({ ...nuevoDocumento, fechaEmision: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={nuevoDocumento.fechaVencimiento || ''}
                      onChange={(e) =>
                        setNuevoDocumento({ ...nuevoDocumento, fechaVencimiento: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Descripción</label>
                    <textarea
                      value={nuevoDocumento.descripcion || ''}
                      onChange={(e) =>
                        setNuevoDocumento({ ...nuevoDocumento, descripcion: e.target.value })
                      }
                      rows={3}
                      placeholder="Notas adicionales sobre el documento"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    💾 Guardar Documento
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowDocumentoForm(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {documentos.length === 0 ? (
              <div className="empty-message">No hay documentos registrados</div>
            ) : (
              <div className="documentos-grid">
                {documentos.map((doc) => (
                  <div key={doc.id} className="documento-card">
                    <div className="documento-tipo">{TipoDocumentoChoferLabels[doc.tipo]}</div>
                    {doc.rutaArchivo && (
                      <div className="documento-preview">
                        <img src={doc.rutaArchivo} alt={doc.nombre || 'Documento'} />
                      </div>
                    )}
                    {doc.nombre && <h4>{doc.nombre}</h4>}
                    {doc.numeroDocumento && (
                      <p className="numero-doc">Nº {doc.numeroDocumento}</p>
                    )}
                    {doc.descripcion && <p className="descripcion">{doc.descripcion}</p>}
                    <div className="documento-info">
                      {doc.fechaVencimiento && (
                        <p className="vencimiento">
                          Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-AR')}
                        </p>
                      )}
                      <DocumentoEstadoBadge fechaVencimiento={doc.fechaVencimiento} mostrarDias={true} />
                    </div>
                    <button
                      onClick={() => handleDeleteDocumento(doc.id!)}
                      className="delete-btn"
                      title="Eliminar"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoferDetalle;
