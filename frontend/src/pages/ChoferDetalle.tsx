import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Chofer, EstadoChofer, estadoChoferLabels } from '../types/chofer';
import { ChoferDocumento, TipoDocumentoChofer, TipoDocumentoChoferLabels } from '../types/chofer-documento';
import choferesService from '../services/choferesService';
import choferDocumentosService from '../services/choferDocumentosService';
import DocumentoEstadoBadge from '../components/DocumentoEstadoBadge';
import BackButton from '../components/BackButton';
import SalariosTab from '../components/SalariosTab';
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
  const [activeTab, setActiveTab] = useState<'info' | 'documentos' | 'salarios'>('info');
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
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [viewingDocumento, setViewingDocumento] = useState<ChoferDocumento | null>(null);
  const [viewingPageIndex, setViewingPageIndex] = useState(0);
  const [editingDocumento, setEditingDocumento] = useState<ChoferDocumento | null>(null);
  const [paginasAEliminar, setPaginasAEliminar] = useState<number[]>([]);
  const [nuevoDocumento, setNuevoDocumento] = useState<Partial<ChoferDocumento>>({
    tipo: TipoDocumentoChofer.LICENCIA_CONDUCIR,
    rutaArchivo: '',
    rutasArchivos: [],
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

  const getDocumentoArchivos = (doc: ChoferDocumento): string[] => {
    if (doc.rutasArchivos && doc.rutasArchivos.length > 0) {
      return doc.rutasArchivos;
    }

    return doc.rutaArchivo ? [doc.rutaArchivo] : [];
  };

  const openDocumentoViewer = (doc: ChoferDocumento, pageIndex: number = 0) => {
    setViewingDocumento(doc);
    setViewingPageIndex(pageIndex);
  };

  const closeDocumentoViewer = () => {
    setViewingDocumento(null);
    setViewingPageIndex(0);
  };

  const goToPrevDocumentoPage = () => {
    if (!viewingDocumento) return;
    const totalPages = getDocumentoArchivos(viewingDocumento).length;
    setViewingPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToNextDocumentoPage = () => {
    if (!viewingDocumento) return;
    const totalPages = getDocumentoArchivos(viewingDocumento).length;
    setViewingPageIndex((prev) => (prev + 1) % totalPages);
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });

  const handleFileSelection = async (files: FileList | File[] | null) => {
    const fileArray = files ? Array.from(files) : [];
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      const fileName = file.name.toLowerCase();
      const hasBlockedExtension = BLOCKED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
      if (hasBlockedExtension) {
        setError('⚠️ Archivo bloqueado por seguridad: No se permiten archivos ejecutables (.exe, .bat, .sh, etc.)');
        return;
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        const allowedLabels = ALLOWED_MIME_TYPES.map(getFileTypeLabel).join(', ');
        setError(`❌ Tipo de archivo no permitido: "${file.type || 'desconocido'}". Solo se permiten: ${allowedLabels}`);
        return;
      }

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_FILE_SIZE_MB) {
        setError(`📁 El archivo "${file.name}" supera el límite de ${MAX_FILE_SIZE_MB}MB (tamaño: ${sizeMb.toFixed(2)}MB)`);
        return;
      }
    }

    try {
      setError(null);
      const dataUrls = await Promise.all(fileArray.map((file) => fileToDataUrl(file)));

      setNuevoDocumento((prev) => ({
        ...prev,
        rutaArchivo: dataUrls[0],
        rutasArchivos: dataUrls,
        nombre: prev.nombre || (fileArray.length === 1 ? fileArray[0].name : prev.nombre),
      }));
      setSelectedFileNames(fileArray.map((file) => file.name));
    } catch (err) {
      console.error(err);
      setError('❌ No se pudo procesar uno o más archivos seleccionados. Intenta nuevamente.');
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

  const handleCreateDocumento = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDocumento) {
        // Modo edición
        const tieneNuevosArchivos = selectedFileNames.length > 0;
        
        if (tieneNuevosArchivos) {
          // Si hay nuevos archivos: mantener páginas no eliminadas + agregar nuevas
          const paginasActuales = (editingDocumento.rutasArchivos || []).filter(
            (_, idx) => !paginasAEliminar.includes(idx)
          );
          const nuevasPaginas = nuevoDocumento.rutasArchivos || [];
          const rutasFinales = [...paginasActuales, ...nuevasPaginas];
          
          if (rutasFinales.length === 0) {
            setError('Debes mantener al menos una página o agregar nuevas páginas');
            return;
          }

          await choferDocumentosService.update(editingDocumento.id!, {
            tipo: nuevoDocumento.tipo,
            nombre: nuevoDocumento.nombre,
            numeroDocumento: nuevoDocumento.numeroDocumento,
            descripcion: nuevoDocumento.descripcion,
            fechaEmision: nuevoDocumento.fechaEmision,
            fechaVencimiento: nuevoDocumento.fechaVencimiento,
            rutasArchivos: rutasFinales,
            rutaArchivo: rutasFinales[0],
          } as ChoferDocumento);
        } else {
          // Si no hay nuevos archivos: solo actualizar otros campos
          // Las rutasArchivos se mantienen tal como están
          const paginasActuales = (editingDocumento.rutasArchivos || []).filter(
            (_, idx) => !paginasAEliminar.includes(idx)
          );

          if (paginasAEliminar.length > 0 && paginasActuales.length === 0) {
            setError('Debes mantener al menos una página');
            return;
          }

          const updateDto: any = {
            tipo: nuevoDocumento.tipo,
            nombre: nuevoDocumento.nombre,
            numeroDocumento: nuevoDocumento.numeroDocumento,
            descripcion: nuevoDocumento.descripcion,
            fechaEmision: nuevoDocumento.fechaEmision,
            fechaVencimiento: nuevoDocumento.fechaVencimiento,
          };

          // Solo actualizar rutasArchivos si se eliminaron páginas
          if (paginasAEliminar.length > 0) {
            updateDto.rutasArchivos = paginasActuales;
            updateDto.rutaArchivo = paginasActuales[0];
          }

          await choferDocumentosService.update(editingDocumento.id!, updateDto as ChoferDocumento);
        }
      } else {
        // Modo creación normal
        await choferDocumentosService.create({
          ...nuevoDocumento,
          choferId,
        } as ChoferDocumento);
      }
      
      setShowDocumentoForm(false);
      setEditingDocumento(null);
      setPaginasAEliminar([]);
      setSelectedFileNames([]);
      setNuevoDocumento({
        tipo: TipoDocumentoChofer.LICENCIA_CONDUCIR,
        rutaArchivo: '',
        rutasArchivos: [],
      });
      await loadData();
    } catch (err) {
      setError('Error al guardar el documento');
      console.error(err);
    }
  };

  const handleEditDocumento = (doc: ChoferDocumento) => {
    setEditingDocumento(doc);
    setNuevoDocumento(doc);
    setPaginasAEliminar([]);
    setSelectedFileNames([]);
    setShowDocumentoForm(true);
  };

  const handleDeleteDocumento = async (documentoId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      await choferDocumentosService.delete(documentoId);
      await loadData();
    } catch (err: any) {
      setError('Error al eliminar el documento');
      console.error(err);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    await handleFileSelection(e.dataTransfer.files);
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
        <BackButton label="← Volver a Choferes" to="/choferes" variant="compact" />
      </div>
    );
  }

  return (
    <div className="chofer-detalle-page">
      <div className="page-header">
        <BackButton label="← Volver a Choferes" to="/choferes" variant="ghost" />
        <h1>📋 Detalle del Chofer</h1>
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
          type="button"
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📄 Información
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'documentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          📎 Documentos ({documentos.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'salarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('salarios')}
        >
          💰 Salarios y Pagos
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
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (showDocumentoForm) {
                    setShowDocumentoForm(false);
                    setEditingDocumento(null);
                    setPaginasAEliminar([]);
                  } else {
                    setShowDocumentoForm(true);
                    setEditingDocumento(null);
                    setPaginasAEliminar([]);
                    setNuevoDocumento({
                      tipo: TipoDocumentoChofer.LICENCIA_CONDUCIR,
                      rutaArchivo: '',
                      rutasArchivos: [],
                    });
                    setSelectedFileNames([]);
                  }
                }}
              >
                {showDocumentoForm ? '✕ Cancelar' : '+ Nuevo Documento'}
              </button>
            </div>

            {showDocumentoForm && (
              <form className="documento-form" onSubmit={handleCreateDocumento}>
                <div className="form-header-documento">
                  <h4>{editingDocumento ? '✏️ Editar Documento' : '➕ Nuevo Documento'}</h4>
                </div>
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

                  <div className="form-group full-width">
                    <label>Archivo del Documento {!editingDocumento && '*'}</label>
                    
                    {editingDocumento && (nuevoDocumento.rutasArchivos || [getDocumentoArchivos(editingDocumento)[0]]).length > 0 && (
                      <div className="documento-edit-section">
                        <h4>📄 Páginas Actuales ({(nuevoDocumento.rutasArchivos || [getDocumentoArchivos(editingDocumento)[0]]).length > 0 ? (nuevoDocumento.rutasArchivos || [getDocumentoArchivos(editingDocumento)[0]]).length - paginasAEliminar.length : 0} de {(nuevoDocumento.rutasArchivos || [getDocumentoArchivos(editingDocumento)[0]]).length})</h4>
                        <div className="file-list-edit">
                          {(nuevoDocumento.rutasArchivos || [getDocumentoArchivos(editingDocumento)[0]]).map((_archivo, index) => (
                            <div key={`actual-${index}`} className={`file-item ${paginasAEliminar.includes(index) ? 'eliminada' : ''}`}>
                              <span className="file-name">Página {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (paginasAEliminar.includes(index)) {
                                    setPaginasAEliminar(paginasAEliminar.filter((i) => i !== index));
                                  } else {
                                    setPaginasAEliminar([...paginasAEliminar, index]);
                                  }
                                }}
                                className="delete-page-btn-edit"
                                title={paginasAEliminar.includes(index) ? 'Restaurar página' : 'Eliminar página'}
                              >
                                {paginasAEliminar.includes(index) ? '↩️' : '🗑️'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={editingDocumento && (nuevoDocumento.rutasArchivos || []).length > 0 ? 'documento-edit-section' : ''}>
                      {editingDocumento && (nuevoDocumento.rutasArchivos || []).length > 0 && (
                        <h4>➕ Agregar Nuevas Páginas</h4>
                      )}
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
                        <p className="dropzone-title">Arrastra y suelta uno o varios archivos aqui</p>
                        <p className="dropzone-subtitle">o haz click para seleccionar (PDF, JPG, PNG, etc.)</p>
                        {selectedFileNames.length > 0 && (
                          <p className="dropzone-file">Seleccionados ({selectedFileNames.length}): {selectedFileNames.join(', ')}</p>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="file-input-hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.doc,.docx,.txt"
                          multiple
                          onChange={async (e) => {
                            await handleFileSelection(e.target.files);
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
                            setNuevoDocumento({
                              ...nuevoDocumento,
                              rutaArchivo: value,
                              rutasArchivos: value ? [value] : [],
                            });
                            if (value && !value.startsWith('data:')) {
                              setSelectedFileNames([]);
                            }
                          }}
                          placeholder="https://... o data:image/png;base64,..."
                          className="url-input-alternative"
                        />
                        <small className="form-help">Pega aquí la URL directa del archivo</small>
                      </details>
                    </div>
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
                    💾 {editingDocumento ? 'Actualizar Documento' : 'Guardar Documento'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowDocumentoForm(false);
                      setEditingDocumento(null);
                      setPaginasAEliminar([]);
                      setSelectedFileNames([]);
                      setNuevoDocumento({
                        tipo: TipoDocumentoChofer.LICENCIA_CONDUCIR,
                        rutaArchivo: '',
                        rutasArchivos: [],
                      });
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
                    {getDocumentoArchivos(doc).length > 0 && (
                      <div
                        className="documento-preview clickable"
                        onClick={() => openDocumentoViewer(doc, 0)}
                        title="Ver documento"
                      >
                        {isImageDocument(getDocumentoArchivos(doc)[0]) ? (
                          <img src={getDocumentoArchivos(doc)[0]} alt={doc.nombre || 'Documento'} />
                        ) : (
                          <div className="documento-file-fallback">
                            <span className="file-icon">{isPdfDocument(getDocumentoArchivos(doc)[0]) ? 'PDF' : 'FILE'}</span>
                            <a href={getDocumentoArchivos(doc)[0]} target="_blank" rel="noreferrer">
                              Abrir documento
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {doc.nombre && <h4>{doc.nombre}</h4>}
                    {getDocumentoArchivos(doc).length > 1 && (
                      <p className="paginas-doc">📄 {getDocumentoArchivos(doc).length} páginas/archivos</p>
                    )}
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
                    <div className="documento-actions">
                      <button
                        type="button"
                        onClick={() => handleEditDocumento(doc)}
                        className="edit-btn"
                        title="Editar"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocumento(doc.id!)}
                        className="delete-btn"
                        title="Eliminar"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'salarios' && (
          <div className="documentos-section">
            <div className="section-header section-header-inline">
              <h3>💰 Salarios y Pagos del Chofer</h3>
            </div>
            <SalariosTab choferId={choferId} />
          </div>
        )}
      </div>

      {viewingDocumento && (
        <div className="doc-view-overlay" onClick={closeDocumentoViewer}>
          <div className="doc-view-container" onClick={(e) => e.stopPropagation()}>
            <div className="doc-view-header">
              <div className="doc-view-title">
                <span className="documento-tipo">{TipoDocumentoChoferLabels[viewingDocumento.tipo]}</span>
                {viewingDocumento.nombre && <h3>{viewingDocumento.nombre}</h3>}
              </div>
              <button type="button" onClick={closeDocumentoViewer} className="doc-close-btn">✕</button>
            </div>

            <div className="doc-view-body">
              {getDocumentoArchivos(viewingDocumento).length > 1 && (
                <button type="button" className="doc-nav-btn doc-nav-btn-left" onClick={goToPrevDocumentoPage}>
                  ‹
                </button>
              )}

              <div className="doc-view-content">
                {isImageDocument(getDocumentoArchivos(viewingDocumento)[viewingPageIndex]) ? (
                  <img
                    src={getDocumentoArchivos(viewingDocumento)[viewingPageIndex]}
                    alt={`${viewingDocumento.nombre || 'Documento'} - página ${viewingPageIndex + 1}`}
                  />
                ) : (
                  <div className="doc-view-file-fallback">
                    <span className="file-icon">
                      {isPdfDocument(getDocumentoArchivos(viewingDocumento)[viewingPageIndex]) ? 'PDF' : 'FILE'}
                    </span>
                    <a
                      href={getDocumentoArchivos(viewingDocumento)[viewingPageIndex]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir archivo en nueva pestaña
                    </a>
                  </div>
                )}
              </div>

              {getDocumentoArchivos(viewingDocumento).length > 1 && (
                <button type="button" className="doc-nav-btn doc-nav-btn-right" onClick={goToNextDocumentoPage}>
                  ›
                </button>
              )}
            </div>

            <div className="doc-view-footer">
              <span>
                Página {viewingPageIndex + 1} de {getDocumentoArchivos(viewingDocumento).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChoferDetalle;
