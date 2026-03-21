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
import BackButton from '../components/BackButton';
import ConfiguracionVehicularTab from '../components/ConfiguracionVehicularTab';
import '../styles/CamionDetalle.css';

type DocumentCostProjectionWindow = '1y' | '5y';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);

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
  const [costProjectionWindow, setCostProjectionWindow] = useState<DocumentCostProjectionWindow>('1y');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const getDocumentoArchivos = (doc: Documento): string[] => {
    if (doc.rutasArchivos && doc.rutasArchivos.length > 0) {
      return doc.rutasArchivos;
    }
    return doc.rutaArchivo ? [doc.rutaArchivo] : [];
  };

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

  const projectionWindowDays = costProjectionWindow === '5y' ? 365 * 5 : 365;
  const projectionWindowLabel = costProjectionWindow === '5y' ? '5 años' : '1 año';
  const documentosConCosto = documentos.filter((doc) => Number(doc.costo || 0) > 0);

  const getDocumentCoverageDays = (documento: Documento) => {
    if (!documento.fechaVencimiento || !documento.createdAt) {
      return 365;
    }

    const createdAt = new Date(documento.createdAt);
    const fechaVencimiento = new Date(documento.fechaVencimiento);
    const diffDays = Math.ceil(
      (fechaVencimiento.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return diffDays > 0 ? diffDays : 365;
  };

  const getProjectedDocumentCost = (documento: Documento) => {
    const costo = Number(documento.costo || 0);
    const coverageDays = getDocumentCoverageDays(documento);
    return costo * (projectionWindowDays / coverageDays);
  };

  const totalCostoFijoActual = documentosConCosto.reduce(
    (sum, documento) => sum + Number(documento.costo || 0),
    0,
  );

  const totalCostoFijoProyectado = documentosConCosto.reduce(
    (sum, documento) => sum + getProjectedDocumentCost(documento),
    0,
  );

  const renderDocumentacionSection = () => (
    <section className="info-section">
      <div className="section-header">
        <div className="section-title-toggle" onClick={() => toggleSection('docs')}>
          <span className={`section-chevron${collapsed['docs'] ? ' is-collapsed' : ''}`}>▼</span>
          <h2>📄 Documentación {documentos.length > 0 && <span className="section-count">{documentos.length}</span>}</h2>
        </div>
        <button
          type="button"
          onClick={() => { setEditingDocumento(null); setShowDocumentoModal(true); }}
          className="add-button"
        >
          + Agregar Documento
        </button>
      </div>

      {collapsed['docs'] ? (
        <div className="section-summary-line">
          {documentos.length === 0 ? (
            <span className="summary-empty">Sin documentos registrados</span>
          ) : (
            <>
              <span>{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</span>
              {documentosVencidos.length > 0 && (<><span className="summary-sep">·</span><span className="summary-alert-vencido">✕ {documentosVencidos.length} vencido{documentosVencidos.length !== 1 ? 's' : ''}</span></>)}
              {documentosProximos.length > 0 && (<><span className="summary-sep">·</span><span className="summary-alert-proximo">⚠ {documentosProximos.length} próximo{documentosProximos.length !== 1 ? 's' : ''} a vencer</span></>)}
              {documentosConCosto.length > 0 && (<><span className="summary-sep">·</span><span>💰 {formatCurrency(totalCostoFijoProyectado)} proyectado / {projectionWindowLabel}</span></>)}
            </>
          )}
        </div>
      ) : (
        <>
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

          <div className="docs-costs-panel">
            <div className="docs-costs-header">
              <div>
                <h3>Costos Fijos Asociados</h3>
                <p>Proyección presupuestaria basada en documentos con costo cargado y su vigencia estimada.</p>
              </div>
              <div className="docs-costs-controls">
                <label htmlFor="docs-cost-window">Proyectar a</label>
                <select
                  id="docs-cost-window"
                  value={costProjectionWindow}
                  onChange={(e) => setCostProjectionWindow(e.target.value as DocumentCostProjectionWindow)}
                >
                  <option value="1y">1 año</option>
                  <option value="5y">5 años</option>
                </select>
              </div>
            </div>

            {documentosConCosto.length === 0 ? (
              <div className="docs-costs-empty">
                No hay documentos con costo cargado para proyectar gastos fijos todavía.
              </div>
            ) : (
              <>
                <div className="docs-costs-summary-grid">
                  <div className="docs-cost-card">
                    <span className="docs-cost-card-label">Documentos con costo</span>
                    <strong>{documentosConCosto.length}</strong>
                  </div>
                  <div className="docs-cost-card">
                    <span className="docs-cost-card-label">Costo actual cargado</span>
                    <strong>{formatCurrency(totalCostoFijoActual)}</strong>
                  </div>
                  <div className="docs-cost-card docs-cost-card-accent">
                    <span className="docs-cost-card-label">Proyección a {projectionWindowLabel}</span>
                    <strong>{formatCurrency(totalCostoFijoProyectado)}</strong>
                  </div>
                </div>

                <div className="docs-fixed-costs-list">
                  {documentosConCosto.map((doc) => {
                    const coverageDays = getDocumentCoverageDays(doc);
                    const projectedCost = getProjectedDocumentCost(doc);

                    return (
                      <div key={`cost-${doc.id}`} className="docs-fixed-cost-item">
                        <div className="docs-fixed-cost-main">
                          <span className="docs-fixed-cost-type">{TipoDocumentoLabels[doc.tipo]}</span>
                          <strong>{doc.nombre || 'Documento sin nombre'}</strong>
                        </div>
                        <div className="docs-fixed-cost-metrics">
                          <span>Costo cargado: {formatCurrency(Number(doc.costo || 0))}</span>
                          <span>Cobertura estimada: {coverageDays} días</span>
                          <span>Vence: {doc.fechaVencimiento ? new Date(doc.fechaVencimiento).toLocaleDateString('es-AR') : 'Sin fecha'}</span>
                          <span>Proyección {projectionWindowLabel}: {formatCurrency(projectedCost)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

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

                      {getDocumentoArchivos(doc).length > 0 ? (
                        <div
                          className="documento-preview clickable"
                          onClick={() => setViewingDocumento(doc)}
                          title="Ver imagen completa"
                        >
                          <img src={getDocumentoArchivos(doc)[0]} alt={doc.nombre || 'Documento'} />
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
                        {getDocumentoArchivos(doc).length > 1 && (
                          <p className="doc-paginas">📄 {getDocumentoArchivos(doc).length} páginas</p>
                        )}
                        {doc.descripcion && <p className="doc-descripcion">{doc.descripcion}</p>}
                        {doc.costo != null && (
                          <p className="doc-costo">💵 Costo: {formatCurrency(Number(doc.costo))}</p>
                        )}
                        {doc.fechaVencimiento && (
                          <p className="doc-vencimiento">
                            📅 Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-AR')}
                          </p>
                        )}
                      </div>

                      <div className="doc-card-actions">
                        <button
                          type="button"
                          onClick={() => handleEditDocumento(doc)}
                          className="doc-action-btn doc-edit-btn"
                          title="Editar documento"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
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
        </>
      )}
    </section>
  );

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
            <button type="button" onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="detalle-content">
        <div className="page-header">
          <BackButton label="← Volver a Camiones" to="/camiones" variant="ghost" />
          <h1>{camion.patente} - {camion.marca} {camion.modelo}</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

      {/* Información General */}
      <section className="info-section">
        <div className="section-header">
          <div className="section-title-toggle" onClick={() => toggleSection('info')}>
            <span className={`section-chevron${collapsed['info'] ? ' is-collapsed' : ''}`}>▼</span>
            <h2>📋 Información General</h2>
          </div>
        </div>
        {collapsed['info'] ? (
          <div className="section-summary-line">
            <span className="summary-badge">{camion.estado}</span>
            <span className="summary-sep">·</span>
            <span>Año {camion.anio}</span>
            <span className="summary-sep">·</span>
            <span>📍 {Number(camion.odometroKm).toLocaleString('es-AR')} km</span>
          </div>
        ) : (
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
        )}
      </section>

      {/* Configuración vehicular */}
      <section className="info-section">
        <div className="section-header">
          <div className="section-title-toggle" onClick={() => toggleSection('config-vehicular')}>
            <span className={`section-chevron${collapsed['config-vehicular'] ? ' is-collapsed' : ''}`}>▼</span>
            <h2>🚛 Configuración Vehicular</h2>
          </div>
        </div>
        {collapsed['config-vehicular'] ? (
          <div className="section-summary-line">
            <span className="summary-empty">Sección contraída — click para expandir</span>
          </div>
        ) : (
          <ConfiguracionVehicularTab camionId={camionId} />
        )}
      </section>

      {renderDocumentacionSection()}

      {/* Último Servicio */}
      {ultimoServicio && (
        <section className="info-section highlight">
          <div className="section-header">
            <div className="section-title-toggle" onClick={() => toggleSection('ultimo-servicio')}>
              <span className={`section-chevron${collapsed['ultimo-servicio'] ? ' is-collapsed' : ''}`}>▼</span>
              <h2>🔧 Último Servicio</h2>
            </div>
          </div>
          {collapsed['ultimo-servicio'] ? (
            <div className="section-summary-line">
              <span>{new Date(ultimoServicio.fechaServicio).toLocaleDateString('es-AR')}</span>
              <span className="summary-sep">·</span>
              {ultimoServicio.tipos.slice(0, 2).map((t) => (
                <span key={t} className="summary-tag">{TipoServicioLabels[t]}</span>
              ))}
              {ultimoServicio.tipos.length > 2 && <span className="summary-more">+{ultimoServicio.tipos.length - 2}</span>}
              {ultimoServicio.kilometraje && (<><span className="summary-sep">·</span><span>📍 {ultimoServicio.kilometraje.toLocaleString('es-AR')} km</span></>)}
            </div>
          ) : (
            <>
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
            </>
          )}
        </section>
      )}

      {/* Historial de Servicios */}
      <section className="info-section">
        <div className="section-header">
          <div className="section-title-toggle" onClick={() => toggleSection('servicios')}>
            <span className={`section-chevron${collapsed['servicios'] ? ' is-collapsed' : ''}`}>▼</span>
            <h2>🛠️ Historial de Servicios {servicios.length > 0 && <span className="section-count">{servicios.length}</span>}</h2>
          </div>
          <button type="button" onClick={() => setShowServicioModal(true)} className="add-button">
            + Agregar Servicio
          </button>
        </div>

        {collapsed['servicios'] ? (
          servicios.length === 0 ? (
            <div className="section-summary-line"><span className="summary-empty">Sin servicios registrados</span></div>
          ) : (
            <div className="section-summary-line">
              <span>Último: {new Date(servicios[0].fechaServicio).toLocaleDateString('es-AR')}</span>
              <span className="summary-sep">·</span>
              {servicios[0].tipos.slice(0, 2).map((t) => (
                <span key={t} className="summary-tag">{TipoServicioLabels[t]}</span>
              ))}
              {servicios[0].tipos.length > 2 && <span className="summary-more">+{servicios[0].tipos.length - 2}</span>}
              {servicios[0].kilometraje && (<><span className="summary-sep">·</span><span>📍 {servicios[0].kilometraje.toLocaleString('es-AR')} km</span></>)}
            </div>
          )
        ) : (
          <>
            {servicios.length === 0 ? (
              <div className="empty-message">No hay servicios registrados</div>
            ) : (
              <div className="servicios-list">
                {servicios.map((servicio) => (
                  <div key={servicio.id} className="servicio-item">
                    <div className="servicio-header">
                      <span className="fecha">{new Date(servicio.fechaServicio).toLocaleDateString('es-AR')}</span>
                      <button
                        type="button"
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
          </>
        )}
      </section>

      {/* Historial de Repostadas */}
      <section className="info-section">
        <div className="section-header">
          <div className="section-title-toggle" onClick={() => toggleSection('repostadas')}>
            <span className={`section-chevron${collapsed['repostadas'] ? ' is-collapsed' : ''}`}>▼</span>
            <h2>⛽ Historial de Repostadas {repostadas.length > 0 && <span className="section-count">{repostadas.length}</span>}</h2>
          </div>
          <button type="button" onClick={() => setShowRepostadaModal(true)} className="add-button">
            + Agregar Repostada
          </button>
        </div>

        {collapsed['repostadas'] ? (
          <div className="section-summary-line">
            {repostadas.length === 0 ? (
              <span className="summary-empty">Sin repostadas registradas</span>
            ) : (
              <>
                <span>{repostadas.length} repostadas</span>
                {estadisticas && estadisticas.totalKm > 0 && (<><span className="summary-sep">·</span><span>📍 {Number(estadisticas.totalKm).toLocaleString('es-AR')} km total</span></>)}
                {estadisticas && estadisticas.consumoPromedio > 0 && (<><span className="summary-sep">·</span><span>⛽ {Number(estadisticas.consumoPromedio).toFixed(2)} km/L</span></>)}
                {estadisticas && estadisticas.totalCosto > 0 && (<><span className="summary-sep">·</span><span>💰 ${Number(estadisticas.totalCosto).toLocaleString('es-AR')}</span></>)}
              </>
            )}
          </div>
        ) : (
          <>
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
                    type="button"
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
          </>
        )}
      </section>

      {/* Mantenimiento */}
      <section className="info-section">
        <div className="section-header">
          <div className="section-title-toggle" onClick={() => toggleSection('mantenimiento')}>
            <span className={`section-chevron${collapsed['mantenimiento'] ? ' is-collapsed' : ''}`}>▼</span>
            <h2>🔧 Gestión de Mantenimiento</h2>
          </div>
        </div>
        {collapsed['mantenimiento'] ? (
          <div className="section-summary-line">
            <span className="summary-empty">Sección contraída — click para expandir</span>
          </div>
        ) : (
          <MantenimientoTab camionId={camionId} />
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
          <button type="button" onClick={onClose} className="close-btn">
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
    costo: documento?.costo != null ? String(documento.costo) : '',
    fechaVencimiento: documento?.fechaVencimiento
      ? documento.fechaVencimiento.split('T')[0]
      : '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFilesPreview, setSelectedFilesPreview] = useState<string[]>(
    documento?.rutasArchivos && documento.rutasArchivos.length > 0
      ? documento.rutasArchivos
      : documento?.rutaArchivo
        ? [documento.rutaArchivo]
        : []
  );
  const [paginasAEliminar, setPaginasAEliminar] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCosto = (): number | undefined | null => {
    if (formData.costo.trim() === '') {
      return undefined;
    }

    const parsed = Number(formData.costo);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve((event.target?.result as string) || '');
      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    if (files.length === 0) {
      if (!isEditing) {
        setFormData((prev) => ({ ...prev, rutaArchivo: '' }));
      }
      setSelectedFilesPreview([]);
      return;
    }

    try {
      const previews = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setSelectedFilesPreview(previews);

      if (isEditing) {
        setFormData((prev) => ({ ...prev, rutaArchivo: previews[0] }));
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar los archivos seleccionados');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && selectedFiles.length === 0) {
      setError('Selecciona al menos una imagen del documento');
      return;
    }

    const costo = parseCosto();
    if (costo === null) {
      setError('Ingresa un costo valido mayor o igual a 0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Modo edición
        const tieneNuevosArchivos = selectedFiles.length > 0;
        const tieneEliminaciones = paginasAEliminar.length > 0;
        
        if (tieneNuevosArchivos || tieneEliminaciones) {
          // Combinar páginas existentes (sin eliminar) + nuevas páginas
          const paginasActuales = selectedFilesPreview.filter((_, idx) => !paginasAEliminar.includes(idx));
          const nuevasPaginas =
            tieneNuevosArchivos
              ? await Promise.all(selectedFiles.map((file) => fileToDataUrl(file)))
              : [];
          
          const rutasFinales = [...paginasActuales, ...nuevasPaginas];
          
          if (rutasFinales.length === 0) {
            setError('Debes mantener al menos una página o agregar nuevas páginas');
            setIsLoading(false);
            return;
          }

          const payload = {
            tipo: formData.tipo,
            nombre: formData.nombre || undefined,
            rutaArchivo: rutasFinales[0],
            rutasArchivos: rutasFinales,
            descripcion: formData.descripcion || undefined,
            costo,
            fechaVencimiento: formData.fechaVencimiento || undefined,
          };
          await documentosService.update(documento!.id, camionId, payload);
        } else {
          // No hay cambios de archivos: solo actualizar otros campos
          const payload = {
            tipo: formData.tipo,
            nombre: formData.nombre || undefined,
            descripcion: formData.descripcion || undefined,
            costo,
            fechaVencimiento: formData.fechaVencimiento || undefined,
          };
          await documentosService.update(documento!.id, camionId, payload);
        }
      } else {
        const archivosBase64 = await Promise.all(
          selectedFiles.map((file) => fileToDataUrl(file))
        );
        await documentosService.create(camionId, {
          tipo: formData.tipo,
          nombre: formData.nombre.trim().length > 0 ? formData.nombre.trim() : undefined,
          rutaArchivo: archivosBase64[0],
          rutasArchivos: archivosBase64,
          descripcion: formData.descripcion || undefined,
          costo,
          fechaVencimiento: formData.fechaVencimiento || undefined,
        });
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
          <button type="button" onClick={onClose} className="close-btn">
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
              Imagen del Documento
              {isEditing
                ? ' (puedes eliminar páginas o agregar nuevas)'
                : ' (puedes seleccionar varias)'}
            </label>
            
            {isEditing && selectedFilesPreview.length > 0 && (
              <div className="documento-edit-section">
                <h4>📄 Páginas Actuales ({selectedFilesPreview.length - paginasAEliminar.length} de {selectedFilesPreview.length})</h4>
                <div className="image-preview-grid">
                  {selectedFilesPreview.map((preview, index) => (
                    <div key={`actual-${index}`} className={`image-preview-thumb ${paginasAEliminar.includes(index) ? 'eliminada' : ''}`}>
                      <img src={preview} alt={`Página ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => {
                          if (paginasAEliminar.includes(index)) {
                            setPaginasAEliminar(paginasAEliminar.filter((i) => i !== index));
                          } else {
                            setPaginasAEliminar([...paginasAEliminar, index]);
                          }
                        }}
                        className="delete-page-btn"
                        title={paginasAEliminar.includes(index) ? 'Restaurar página' : 'Eliminar página'}
                        disabled={isLoading}
                      >
                        {paginasAEliminar.includes(index) ? '↩️' : '🗑️'}
                      </button>
                      <span className="page-number">Página {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={isEditing ? 'documento-edit-section' : ''}>
              {isEditing && selectedFilesPreview.length > 0 && (
                <h4>➕ Agregar Nuevas Páginas</h4>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
                multiple
                required={!isEditing}
              />
              {selectedFiles.length > 0 && (
                <div className="new-files-info">
                  <small>✓ {selectedFiles.length} archivo(s) para agregar</small>
                </div>
              )}
              {!isEditing && selectedFilesPreview.length > 0 && (
                <div className="image-preview-grid">
                  {selectedFilesPreview.map((preview, index) => (
                    <div key={`${selectedFiles[index]?.name || 'archivo'}-${index}`} className="image-preview-thumb">
                      <img src={preview} alt={selectedFiles[index]?.name || `Documento ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
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

          <div className="form-group">
            <label>Costo Asociado</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costo}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              disabled={isLoading}
              placeholder="Ej: 150000"
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
  const archivos =
    documento.rutasArchivos && documento.rutasArchivos.length > 0
      ? documento.rutasArchivos
      : documento.rutaArchivo
        ? [documento.rutaArchivo]
        : [];

  return (
    <div className="modal-overlay doc-view-overlay" onClick={onClose}>
      <div className="doc-view-container" onClick={(e) => e.stopPropagation()}>
        <div className="doc-view-header">
          <div className="doc-view-title">
            <span className="documento-tipo">{TipoDocumentoLabels[documento.tipo]}</span>
            {documento.nombre && <h3>{documento.nombre}</h3>}
          </div>
          <button type="button" onClick={onClose} className="close-btn">✕</button>
        </div>

        {archivos.length > 0 && (
          <div className="doc-view-gallery">
            {archivos.map((archivo, index) => (
              <div key={`${archivo.slice(0, 24)}-${index}`} className="doc-view-image">
                <img src={archivo} alt={`${documento.nombre || 'Documento'} - página ${index + 1}`} />
                {archivos.length > 1 && <span className="doc-page-label">Página {index + 1}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="doc-view-details">
          {documento.descripcion && (
            <div className="doc-view-field">
              <label>Descripción</label>
              <span>{documento.descripcion}</span>
            </div>
          )}
          {documento.costo != null && (
            <div className="doc-view-field">
              <label>Costo Asociado</label>
              <span>{formatCurrency(Number(documento.costo))}</span>
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
