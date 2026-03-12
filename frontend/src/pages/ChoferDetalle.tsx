import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Chofer, EstadoChofer, estadoChoferLabels } from '../types/chofer';
import { ChoferDocumento, TipoDocumentoChofer, TipoDocumentoChoferLabels } from '../types/chofer-documento';
import choferesService from '../services/choferesService';
import choferDocumentosService from '../services/choferDocumentosService';
import DocumentoEstadoBadge from '../components/DocumentoEstadoBadge';
import '../styles/ChoferDetalle.css';

interface ChoferEditFormData {
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

const ChoferDetalle: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const choferId = parseInt(id || '0');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chofer, setChofer] = useState<Chofer | null>(null);
  const [documentos, setDocumentos] = useState<ChoferDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingChofer, setIsSavingChofer] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'documentos'>('info');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editFormData, setEditFormData] = useState<ChoferEditFormData>({
    numeroDocumento: '',
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
    fechaIngreso: '',
    fechaNacimiento: '',
    estado: EstadoChofer.ACTIVO,
    sueldoBase: '',
    porcentajeComision: '',
  });

  // Formulario de nuevo documento
  const [showDocumentoForm, setShowDocumentoForm] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [nuevoDocumento, setNuevoDocumento] = useState<Partial<ChoferDocumento>>({
    tipo: TipoDocumentoChofer.LICENCIA_CONDUCIR,
    rutaArchivo: '',
  });

  const MAX_FILE_SIZE_MB = 50;

  // Tipos de archivo permitidos
  const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const BLOCKED_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js',
    '.jar', '.app', '.deb', '.rpm', '.sh', '.ps1', '.dll', '.so',
  ];

  const getFileTypeLabel = (mimeType: string): string => {
    const labels: Record<string, string> = {
      'image/png': 'imagen PNG',
      'image/jpeg': 'imagen JPEG',
      'image/jpg': 'imagen JPG',
      'image/webp': 'imagen WebP',
      'image/gif': 'imagen GIF',
      'application/pdf': 'documento PDF',
      'application/msword': 'documento Word (.doc)',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documento Word (.docx)',
      'text/plain': 'archivo de texto',
    };
    return labels[mimeType] || mimeType;
  };

  const isImageDocument = (rutaArchivo?: string) => {
    if (!rutaArchivo) return false;
    if (rutaArchivo.startsWith('data:image/')) return true;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(rutaArchivo);
  };

  const isPdfDocument = (rutaArchivo?: string) => {
    if (!rutaArchivo) return false;
    if (rutaArchivo.startsWith('data:application/pdf')) return true;
    return /\.pdf(\?|$)/i.test(rutaArchivo);
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });

  const handleFileSelection = async (file: File | null) => {
    if (!file) return;

    // Validar extensión bloqueada
    const fileName = file.name.toLowerCase();
    const hasBlockedExtension = BLOCKED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (hasBlockedExtension) {
      setError(`⚠️ Archivo bloqueado por seguridad: No se permiten archivos ejecutables (.exe, .bat, .sh, etc.)`);
      return;
    }

    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const allowedLabels = ALLOWED_MIME_TYPES.map(getFileTypeLabel).join(', ');
      setError(`❌ Tipo de archivo no permitido: "${file.type || 'desconocido'}". Solo se permiten: ${allowedLabels}`);
      return;
    }

    // Validar tamaño
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      setError(`📁 El archivo "${file.name}" supera el límite de ${MAX_FILE_SIZE_MB}MB (tamaño: ${sizeMb.toFixed(2)}MB)`);
      return;
    }

    try {
      setError(null);
      const dataUrl = await fileToDataUrl(file);
      setNuevoDocumento((prev) => ({
        ...prev,
        rutaArchivo: dataUrl,
        nombre: prev.nombre || file.name,
      }));
      setSelectedFileName(file.name);
    } catch (err) {
      console.error(err);
      setError('❌ No se pudo procesar el archivo seleccionado. Intenta con otro archivo.');
    }
  };

  useEffect(() => {
    loadData();
  }, [choferId]);

  useEffect(() => {
    const queryMode = searchParams.get('mode');
    const isLegacyEditPath = location.pathname.includes('/choferes/edit/');
    const shouldStartInEdit = queryMode === 'edit' || isLegacyEditPath;

    if (shouldStartInEdit) {
      setActiveTab('info');
      setIsEditMode(true);
    }
  }, [location.pathname, searchParams]);

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
      setEditFormData({
        numeroDocumento: choferData.numeroDocumento || '',
        nombre: choferData.nombre || '',
        apellido: choferData.apellido || '',
        telefono: choferData.telefono || '',
        direccion: choferData.direccion || '',
        fechaIngreso:
          typeof choferData.fechaIngreso === 'string'
            ? choferData.fechaIngreso.split('T')[0]
            : new Date(choferData.fechaIngreso).toISOString().split('T')[0],
        fechaNacimiento: choferData.fechaNacimiento
          ? typeof choferData.fechaNacimiento === 'string'
            ? choferData.fechaNacimiento.split('T')[0]
            : new Date(choferData.fechaNacimiento).toISOString().split('T')[0]
          : '',
        estado: (choferData.estado as EstadoChofer) || EstadoChofer.ACTIVO,
        sueldoBase: choferData.sueldoBase ? String(choferData.sueldoBase) : '',
        porcentajeComision: choferData.porcentajeComision ? String(choferData.porcentajeComision) : '',
      });
      setEditErrors({});
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
      setSelectedFileName('');
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    await handleFileSelection(file);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));

    if (editErrors[name]) {
      setEditErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateEditForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!editFormData.numeroDocumento.trim()) {
      nextErrors.numeroDocumento = 'El número de documento es obligatorio';
    }
    if (!editFormData.nombre.trim()) {
      nextErrors.nombre = 'El nombre es obligatorio';
    }
    if (!editFormData.apellido.trim()) {
      nextErrors.apellido = 'El apellido es obligatorio';
    }
    if (!editFormData.telefono.trim()) {
      nextErrors.telefono = 'El teléfono es obligatorio';
    }
    if (!editFormData.fechaIngreso) {
      nextErrors.fechaIngreso = 'La fecha de ingreso es obligatoria';
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveChofer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEditForm()) {
      return;
    }

    try {
      setIsSavingChofer(true);
      setError(null);

      await choferesService.update(choferId, {
        numeroDocumento: editFormData.numeroDocumento,
        nombre: editFormData.nombre,
        apellido: editFormData.apellido,
        telefono: editFormData.telefono,
        direccion: editFormData.direccion || undefined,
        fechaIngreso: editFormData.fechaIngreso,
        fechaNacimiento: editFormData.fechaNacimiento || undefined,
        estado: editFormData.estado,
        sueldoBase: editFormData.sueldoBase ? parseFloat(editFormData.sueldoBase) : undefined,
        porcentajeComision: editFormData.porcentajeComision ? parseFloat(editFormData.porcentajeComision) : undefined,
      });

      await loadData();
      setIsEditMode(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Error al actualizar el chofer');
    } finally {
      setIsSavingChofer(false);
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
                    className="btn-salarios"
                    onClick={() => navigate(`/choferes/${choferId}/salarios`)}
                  >
                    💰 Ver Salarios
                  </button>
                  <button 
          className="btn-edit"
          onClick={() => {
            setActiveTab('info');
            setIsEditMode((prev) => !prev);
          }}
        >
          {isEditMode ? '👁️ Ver' : '✏️ Editar'}
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
            <div className="section-header section-header-inline">
              <h3>{isEditMode ? '✏️ Editando Información del Chofer' : '📄 Información del Chofer'}</h3>
              <button
                className="btn-primary"
                onClick={() => setIsEditMode((prev) => !prev)}
                type="button"
              >
                {isEditMode ? 'Cancelar edición' : 'Editar información'}
              </button>
            </div>

            {isEditMode ? (
              <form className="documento-form" onSubmit={handleSaveChofer}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Número de Documento / CI *</label>
                    <input
                      type="text"
                      name="numeroDocumento"
                      value={editFormData.numeroDocumento}
                      onChange={handleEditChange}
                    />
                    {editErrors.numeroDocumento && <span className="error-message">{editErrors.numeroDocumento}</span>}
                  </div>

                  <div className="form-group">
                    <label>Estado *</label>
                    <select name="estado" value={editFormData.estado} onChange={handleEditChange}>
                      <option value={EstadoChofer.ACTIVO}>Activo</option>
                      <option value={EstadoChofer.INACTIVO}>Inactivo</option>
                      <option value={EstadoChofer.SUSPENDIDO}>Suspendido</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nombre *</label>
                    <input type="text" name="nombre" value={editFormData.nombre} onChange={handleEditChange} />
                    {editErrors.nombre && <span className="error-message">{editErrors.nombre}</span>}
                  </div>

                  <div className="form-group">
                    <label>Apellido *</label>
                    <input type="text" name="apellido" value={editFormData.apellido} onChange={handleEditChange} />
                    {editErrors.apellido && <span className="error-message">{editErrors.apellido}</span>}
                  </div>

                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input type="text" name="telefono" value={editFormData.telefono} onChange={handleEditChange} />
                    {editErrors.telefono && <span className="error-message">{editErrors.telefono}</span>}
                  </div>

                  <div className="form-group">
                    <label>Fecha de Ingreso *</label>
                    <input type="date" name="fechaIngreso" value={editFormData.fechaIngreso} onChange={handleEditChange} />
                    {editErrors.fechaIngreso && <span className="error-message">{editErrors.fechaIngreso}</span>}
                  </div>

                  <div className="form-group">
                    <label>Fecha de Nacimiento</label>
                    <input type="date" name="fechaNacimiento" value={editFormData.fechaNacimiento} onChange={handleEditChange} />
                  </div>

                  <div className="form-group">
                    <label>Sueldo Base ($)</label>
                    <input type="number" min="0" step="0.01" name="sueldoBase" value={editFormData.sueldoBase} onChange={handleEditChange} />
                  </div>

                  <div className="form-group">
                    <label>Porcentaje Comisión (%)</label>
                    <input type="number" min="0" max="100" step="0.01" name="porcentajeComision" value={editFormData.porcentajeComision} onChange={handleEditChange} />
                  </div>

                  <div className="form-group full-width">
                    <label>Dirección</label>
                    <textarea name="direccion" rows={3} value={editFormData.direccion} onChange={handleEditChange} />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditMode(false)} disabled={isSavingChofer}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSavingChofer}>
                    {isSavingChofer ? 'Guardando...' : '💾 Guardar Cambios'}
                  </button>
                </div>
              </form>
            ) : (
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
                  <span className={`estado-${chofer.estado}`}>
                    {estadoChoferLabels[chofer.estado as EstadoChofer] || chofer.estado}
                  </span>
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
            )}
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
                    <label>Archivo del Documento *</label>
                    <div
                      className={`file-dropzone ${isDragOver ? 'drag-over' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      <p className="dropzone-title">Arrastra y suelta un archivo aqui</p>
                      <p className="dropzone-subtitle">o haz click para seleccionar (PDF, JPG, PNG, etc.)</p>
                      {selectedFileName && (
                        <p className="dropzone-file">Seleccionado: {selectedFileName}</p>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="file-input-hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.doc,.docx,.txt"
                        onChange={async (e) => {
                          await handleFileSelection(e.target.files?.[0] || null);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    <small className="form-help">
                      ℹ️ Tipos permitidos: PDF, imágenes (PNG, JPG, WebP, GIF, SVG), Word (.doc, .docx), texto. Máximo {MAX_FILE_SIZE_MB}MB.
                    </small>
                    <details className="form-details">
                      <summary>¿Ya tienes el archivo en la nube?</summary>
                      <input
                        type="text"
                        value={nuevoDocumento.rutaArchivo}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNuevoDocumento({ ...nuevoDocumento, rutaArchivo: value });
                          if (value && !value.startsWith('data:')) {
                            setSelectedFileName('');
                          }
                        }}
                        placeholder="https://... o data:image/png;base64,..."
                        className="url-input-alternative"
                      />
                      <small className="form-help">Pega aquí la URL directa del archivo</small>
                    </details>
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
                    onClick={() => {
                      setShowDocumentoForm(false);
                      setSelectedFileName('');
                    }}
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
                        {isImageDocument(doc.rutaArchivo) ? (
                          <img src={doc.rutaArchivo} alt={doc.nombre || 'Documento'} />
                        ) : (
                          <div className="documento-file-fallback">
                            <span className="file-icon">{isPdfDocument(doc.rutaArchivo) ? 'PDF' : 'FILE'}</span>
                            <a href={doc.rutaArchivo} target="_blank" rel="noreferrer">
                              Abrir documento
                            </a>
                          </div>
                        )}
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
