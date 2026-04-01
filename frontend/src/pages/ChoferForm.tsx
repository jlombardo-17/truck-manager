import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import choferesService from '../services/choferesService';
import choferDocumentosService from '../services/choferDocumentosService';
import { EstadoChofer } from '../types/chofer';
import {
  ChoferDocumento,
  TipoDocumentoChofer,
  TipoDocumentoChoferLabels,
} from '../types/chofer-documento';
import BackButton from '../components/BackButton';
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

interface DocumentoDraft {
  tipo: TipoDocumentoChofer;
  nombre: string;
  numeroDocumento: string;
  descripcion: string;
  fechaEmision: string;
  fechaVencimiento: string;
  rutaArchivo: string;
  rutasArchivos: string[];
  selectedFileNames: string[];
}

const MAX_FILE_SIZE_MB = 50;

const createEmptyDocumentoDraft = (): DocumentoDraft => ({
  tipo: TipoDocumentoChofer.LICENCIA_CONDUCIR,
  nombre: '',
  numeroDocumento: '',
  descripcion: '',
  fechaEmision: '',
  fechaVencimiento: '',
  rutaArchivo: '',
  rutasArchivos: [],
  selectedFileNames: [],
});

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
  const [documentosIniciales, setDocumentosIniciales] = useState<DocumentoDraft[]>([]);

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });

  const updateDocumentoDraft = <K extends keyof DocumentoDraft>(
    index: number,
    field: K,
    value: DocumentoDraft[K],
  ) => {
    setDocumentosIniciales((prev) =>
      prev.map((doc, docIndex) => (docIndex === index ? { ...doc, [field]: value } : doc)),
    );
  };

  const handleDocumentoFiles = async (index: number, fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];

    if (files.length === 0) {
      return;
    }

    for (const file of files) {
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_FILE_SIZE_MB) {
        alert(
          `El archivo "${file.name}" supera el límite de ${MAX_FILE_SIZE_MB}MB (${sizeMb.toFixed(
            2,
          )}MB).`,
        );
        return;
      }
    }

    try {
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));

      setDocumentosIniciales((prev) =>
        prev.map((doc, docIndex) =>
          docIndex === index
            ? {
                ...doc,
                rutaArchivo: dataUrls[0],
                rutasArchivos: dataUrls,
                selectedFileNames: files.map((file) => file.name),
                nombre: doc.nombre || (files.length === 1 ? files[0].name : doc.nombre),
              }
            : doc,
        ),
      );
    } catch (error) {
      console.error(error);
      alert('No se pudieron procesar los archivos seleccionados');
    }
  };

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

    const documentoIncompleto = documentosIniciales.find((doc) => !doc.rutaArchivo);
    if (documentoIncompleto) {
      alert('Cada documento agregado debe tener al menos un archivo cargado o URL.');
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

      const choferCreado = await choferesService.create(dataToSend);

      if (documentosIniciales.length > 0) {
        let documentosCreados = 0;
        let documentosFallidos = 0;

        for (const doc of documentosIniciales) {
          try {
            const payload: Partial<ChoferDocumento> = {
              choferId: choferCreado.id,
              tipo: doc.tipo,
              nombre: doc.nombre || undefined,
              numeroDocumento: doc.numeroDocumento || undefined,
              descripcion: doc.descripcion || undefined,
              fechaEmision: doc.fechaEmision || undefined,
              fechaVencimiento: doc.fechaVencimiento || undefined,
              rutaArchivo: doc.rutaArchivo,
              rutasArchivos: doc.rutasArchivos.length > 0 ? doc.rutasArchivos : [doc.rutaArchivo],
            };

            await choferDocumentosService.create(payload);
            documentosCreados += 1;
          } catch (docError) {
            console.error('Error al crear documento inicial:', docError);
            documentosFallidos += 1;
          }
        }

        if (documentosFallidos > 0) {
          alert(
            `Chofer creado. Documentos creados: ${documentosCreados}. Documentos con error: ${documentosFallidos}.`,
          );
        }
      }

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
            <button type="button" onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="page-header">
        <BackButton label="← Volver a Choferes" to="/choferes" variant="ghost" />
        <h1>➕ Nuevo Chofer</h1>
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

        <section className="documentos-iniciales-section">
          <div className="section-title-row">
            <h2>📎 Documentación Inicial (Opcional)</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDocumentosIniciales((prev) => [...prev, createEmptyDocumentoDraft()])}
              disabled={loading}
            >
              + Agregar Documento
            </button>
          </div>

          {documentosIniciales.length === 0 ? (
            <p className="documentos-empty-message">
              Puedes crear el chofer y cargar documentos ahora mismo desde esta pantalla.
            </p>
          ) : (
            <div className="documentos-iniciales-list">
              {documentosIniciales.map((doc, index) => (
                <article key={`doc-inicial-${index}`} className="documento-inicial-card">
                  <div className="documento-inicial-header">
                    <h3>Documento {index + 1}</h3>
                    <button
                      type="button"
                      className="btn-remove-documento"
                      onClick={() =>
                        setDocumentosIniciales((prev) => prev.filter((_, docIndex) => docIndex !== index))
                      }
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="form-grid documento-inicial-grid">
                    <div className="form-group">
                      <label>Tipo de Documento</label>
                      <select
                        value={doc.tipo}
                        onChange={(e) =>
                          updateDocumentoDraft(index, 'tipo', e.target.value as TipoDocumentoChofer)
                        }
                        disabled={loading}
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
                        value={doc.nombre}
                        onChange={(e) => updateDocumentoDraft(index, 'nombre', e.target.value)}
                        placeholder="Ej: Licencia categoría C1"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Número de Documento</label>
                      <input
                        type="text"
                        value={doc.numeroDocumento}
                        onChange={(e) => updateDocumentoDraft(index, 'numeroDocumento', e.target.value)}
                        placeholder="Ej: 12345678"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Fecha de Emisión</label>
                      <input
                        type="date"
                        value={doc.fechaEmision}
                        onChange={(e) => updateDocumentoDraft(index, 'fechaEmision', e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Fecha de Vencimiento</label>
                      <input
                        type="date"
                        value={doc.fechaVencimiento}
                        onChange={(e) => updateDocumentoDraft(index, 'fechaVencimiento', e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Archivo del Documento</label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.doc,.docx,.txt"
                        multiple
                        onChange={async (e) => {
                          await handleDocumentoFiles(index, e.target.files);
                          e.target.value = '';
                        }}
                        disabled={loading}
                      />
                      {doc.selectedFileNames.length > 0 && (
                        <small className="file-selection-note">
                          Seleccionados ({doc.selectedFileNames.length}): {doc.selectedFileNames.join(', ')}
                        </small>
                      )}
                      <small className="file-selection-note">
                        Puedes seleccionar uno o varios archivos (máximo {MAX_FILE_SIZE_MB}MB por archivo).
                      </small>
                    </div>

                    <div className="form-group full-width">
                      <label>o URL del Archivo</label>
                      <input
                        type="text"
                        value={doc.rutaArchivo}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDocumentosIniciales((prev) =>
                            prev.map((currentDoc, docIndex) =>
                              docIndex === index
                                ? {
                                    ...currentDoc,
                                    rutaArchivo: value,
                                    rutasArchivos: value ? [value] : [],
                                    selectedFileNames:
                                      value && !value.startsWith('data:')
                                        ? []
                                        : currentDoc.selectedFileNames,
                                  }
                                : currentDoc,
                            ),
                          );
                        }}
                        placeholder="https://... o data:image/png;base64,..."
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Descripción</label>
                      <textarea
                        value={doc.descripcion}
                        onChange={(e) => updateDocumentoDraft(index, 'descripcion', e.target.value)}
                        rows={2}
                        placeholder="Notas adicionales sobre este documento"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

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
