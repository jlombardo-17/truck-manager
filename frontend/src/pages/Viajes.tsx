import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { viajsService, Viaje } from '../services/viajsService';
import camionesService from '../services/camionesService';
import choferesService from '../services/choferesService';
import clientesService from '../services/clientesService';
import { Cliente } from '../types/cliente';
import { Camion } from '../types/camion';
import { Chofer, EstadoChofer, estadoChoferLabels } from '../types/chofer';
import AppNavbar from '../components/AppNavbar';
import HeroSection from '../components/HeroSection';
import StatsGrid from '../components/StatsGrid';
import BackButton from '../components/BackButton';
import heroRoutesViolet from '../assets/hero-routes-violet.svg';
import { getLocalInputValueDaysAgo, getTodayLocalInputValue, parseDatePreservingDay } from '../utils/dateUtils';
import { sumComisiones, sumGastosOperativosComisiones } from '../utils/comisiones';
import '../styles/Viajes.css';

// Los anchos se asignan por clase (col-*) y no por posición, para que agregar
// o quitar columnas no desplace los estilos del resto.
const VIAJES_COLUMNS: { key: string; label: string }[] = [
  { key: 'numero', label: 'Nro. Viaje' },
  { key: 'camion', label: 'Camión' },
  { key: 'chofer', label: 'Chofer' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'origen', label: 'Origen' },
  { key: 'destino', label: 'Destino' },
  { key: 'doc', label: 'Doc.' },
  { key: 'valor', label: 'Valor' },
  { key: 'ganancia', label: 'Ganancia Neta' },
  { key: 'inicio', label: 'Inicio' },
  { key: 'fin', label: 'Fin' },
  { key: 'pago', label: 'Pago' },
  { key: 'km', label: 'KM' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones' },
];

const ViajesTableHead: React.FC = () => (
  <thead>
    <tr>
      {VIAJES_COLUMNS.map((col) => (
        <th key={col.key} className={`col-${col.key}`}>
          {col.label}
        </th>
      ))}
    </tr>
  </thead>
);

const Viajes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const skeletonRows = Array.from({ length: 6 }, (_, index) => index);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [camiones, setCamiones] = useState<Record<number, Camion>>({});
  const [choferes, setChoferes] = useState<Record<number, Chofer>>({});
  const [clientes, setClientes] = useState<Cliente[]>([]);
  // Listas completas para los selects de filtro (independientes de los viajes cargados)
  const [camionesOpciones, setCamionesOpciones] = useState<Camion[]>([]);
  const [choferesOpciones, setChoferesOpciones] = useState<Chofer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros. Por defecto, viajes de los últimos 30 días; si se llega filtrado por cliente
  // (desde la página de clientes) se muestran todos sus viajes.
  const DIAS_POR_DEFECTO = 30;
  const [filtros, setFiltros] = useState(() => ({
    estado: '',
    camionId: '',
    choferId: '',
    // Permite llegar filtrado desde la página de clientes: /viajes?clienteId=3
    clienteId: searchParams.get('clienteId') ?? '',
    // Rango por fecha de inicio del viaje
    fechaDesde: searchParams.get('clienteId') ? '' : getLocalInputValueDaysAgo(DIAS_POR_DEFECTO),
    fechaHasta: searchParams.get('clienteId') ? '' : getTodayLocalInputValue(),
  }));

  useEffect(() => {
    loadViajes();
  }, [filtros]);

  useEffect(() => {
    clientesService
      .getAll()
      .then(setClientes)
      .catch((err) => console.error('Error al cargar clientes:', err));
    camionesService
      .getAll()
      .then((data) => setCamionesOpciones([...data].sort((a, b) => a.patente.localeCompare(b.patente))))
      .catch((err) => console.error('Error al cargar camiones:', err));
    choferesService
      .getAll()
      .then((data) =>
        setChoferesOpciones(
          [...data].sort((a, b) =>
            `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`),
          ),
        ),
      )
      .catch((err) => console.error('Error al cargar choferes:', err));
  }, []);

  // Mantiene ?clienteId= en la URL para que el filtro sea compartible y sobreviva un refresh
  useEffect(() => {
    const current = searchParams.get('clienteId') ?? '';
    if (current === filtros.clienteId) return;
    const next = new URLSearchParams(searchParams);
    if (filtros.clienteId) next.set('clienteId', filtros.clienteId);
    else next.delete('clienteId');
    setSearchParams(next, { replace: true });
  }, [filtros.clienteId]);

  const loadViajes = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.camionId && { camionId: parseInt(filtros.camionId) }),
        ...(filtros.choferId && { choferId: parseInt(filtros.choferId) }),
        ...(filtros.clienteId && { clienteId: parseInt(filtros.clienteId) }),
        ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
        ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta }),
      };

      const data = await viajsService.getAll(filters);
      setViajes(data);

      // Cargar datos complementarios (camiones y choferes) de manera eficiente
      const uniqueCamionIds = new Set(data.filter(v => v.camionId != null).map((v) => v.camionId));
      const uniqueChoferIds = new Set(data.filter(v => v.choferId != null).map((v) => v.choferId));

      if (uniqueCamionIds.size > 0) {
        const camionesData = await Promise.all(
          Array.from(uniqueCamionIds).map((id) => camionesService.getById(id)),
        );
        const camionesMap = camionesData.reduce(
          (acc, c) => ({ ...acc, [c.id]: c }),
          {} as Record<number, Camion>,
        );
        setCamiones(camionesMap);
      }

      if (uniqueChoferIds.size > 0) {
        const choferesData = await Promise.all(
          Array.from(uniqueChoferIds).map((id) => choferesService.getById(id)),
        );
        const choferesMap = choferesData.reduce(
          (acc, c) => ({ ...acc, [c.id]: c }),
          {} as Record<number, Chofer>,
        );
        setChoferes(choferesMap);
      }
    } catch (err) {
      setError('Error al cargar los viajes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    navigate('/viajes/nuevo');
  };

  const handleEdit = (id: number) => {
    navigate(`/viajes/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este viaje?')) {
      try {
        await viajsService.delete(id);
        await loadViajes();
      } catch (err) {
        setError('Error al eliminar el viaje');
      }
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await viajsService.cambiarEstado(id, nuevoEstado);
      await loadViajes();
    } catch (err) {
      setError('Error al cambiar el estado del viaje');
    }
  };

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros({ ...filtros, [field]: value });
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      en_progreso: 'badge-warning',
      completado: 'badge-success',
      cancelado: 'badge-danger',
    };
    return badges[estado] || 'badge-info';
  };

  const getDocumentosAdjuntos = (viaje: Viaje) =>
    Array.isArray(viaje.documentosDescargaAdjuntos) ? viaje.documentosDescargaAdjuntos : [];

  const hasDocumentoDescarga = (viaje: Viaje) => {
    if (getDocumentosAdjuntos(viaje).length > 0) {
      return true;
    }

    return typeof viaje.documentoDescarga === 'string' && viaje.documentoDescarga.trim().length > 0;
  };

  const getDocumentoDescargaUrl = (viaje: Viaje) => {
    const adjuntos = getDocumentosAdjuntos(viaje);
    if (adjuntos.length === 1) {
      return adjuntos[0].adjunto;
    }

    if (
      adjuntos.length === 0 &&
      typeof viaje.documentoDescarga === 'string' &&
      (viaje.documentoDescarga.startsWith('http://') || viaje.documentoDescarga.startsWith('https://'))
    ) {
      return viaje.documentoDescarga;
    }

    return null;
  };

  const formatViajeAmount = (viaje: Viaje) => {
    const currency = viaje.moneda === 'USD' ? 'USD' : 'UYU';
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(Number(viaje.valorViaje || 0));
  };

  const formatViajeUyuEquivalent = (viaje: Viaje) => {
    const equivalent = Number(viaje.valorViajeUyu || viaje.valorViaje || 0);
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      maximumFractionDigits: 0,
    }).format(equivalent);
  };

  // Mismo cálculo que "Ganancia Neta Final" del formulario del viaje, en UYU:
  // valor - (combustible + otros gastos + peajes) - comisiones
  const getGananciaNetaUyu = (viaje: Viaje): number => {
    const comisiones = viaje.comisiones || [];
    const valorUyu = Number(viaje.valorViajeUyu || viaje.valorViaje || 0);
    const gastosOperativos =
      Number(viaje.costoCombustible || 0) +
      Number(viaje.otrosGastos || 0) +
      sumGastosOperativosComisiones(comisiones);
    return valorUyu - gastosOperativos - sumComisiones(comisiones);
  };

  const formatUyu = (monto: number) =>
    new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(monto);

  // Totales de los viajes listados (respetan los filtros). Los cancelados no suman.
  const viajesParaTotales = viajes.filter((v) => v.estado !== 'cancelado');
  const cantidadCancelados = viajes.length - viajesParaTotales.length;
  const totales = viajesParaTotales.reduce(
    (acc, v) => ({
      valorUyu: acc.valorUyu + Number(v.valorViajeUyu || v.valorViaje || 0),
      ganancia: acc.ganancia + getGananciaNetaUyu(v),
      km: acc.km + Number(v.kmRecorridos || 0),
    }),
    { valorUyu: 0, ganancia: 0, km: 0 },
  );

  const formatViajeDate = (value?: string) => {
    if (!value) return '-';
    const parsed = parseDatePreservingDay(value);
    return parsed ? parsed.toLocaleDateString('es-UY') : '-';
  };

  return (
    <div className="viajes-page">
      <AppNavbar />

      <div className="page-back-button-container">
        <BackButton label="Volver al Dashboard" to="/dashboard" variant="ghost" />
      </div>
      
      <HeroSection
        subtitle="Trip Management"
        title="Viajes y Rutas"
        description="Planificación, estado y trazabilidad de entregas."
        backgroundImage={`linear-gradient(135deg, rgba(155, 89, 182, 0.9) 0%, rgba(142, 68, 173, 0.88) 50%, rgba(195, 155, 211, 0.85) 100%), url(${heroRoutesViolet})`}
        darkBg={true}
        primaryAction={{
          label: '+ Nuevo Viaje',
          onClick: handleNew,
        }}
      />

      <section className="viajes-kpi-section">
        <div className="viajes-container-inner">
          <StatsGrid
            stats={[
              {
                label: 'Total de Viajes',
                value: String(viajes.length),
                unit: 'viajes',
                icon: '📦',
                color: 'blue',
                trend: { direction: 'up', percentage: 7 },
              },
              {
                label: 'En Progreso',
                value: String(viajes.filter(v => v.estado === 'en_progreso').length),
                unit: 'activos',
                icon: '⏳',
                color: 'yellow',
                trend: { direction: 'stable', percentage: 0 },
              },
              {
                label: 'Completados',
                value: String(viajes.filter(v => v.estado === 'completado').length),
                unit: 'viajes',
                icon: '✓',
                color: 'green',
                trend: { direction: 'up', percentage: 12 },
              },
              {
                label: 'Cancelados',
                value: String(viajes.filter(v => v.estado === 'cancelado').length),
                unit: 'viajes',
                icon: '✕',
                color: 'red',
                trend: { direction: 'down', percentage: 1 },
              },
            ]}
            columns={4}
            loading={loading}
          />
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Estado</label>
          <select
            value={filtros.estado}
            onChange={(e) => handleFiltroChange('estado', e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-camion">Camión</label>
          <select
            id="filtro-camion"
            value={filtros.camionId}
            onChange={(e) => handleFiltroChange('camionId', e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            {camionesOpciones.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.patente} - {c.marca} {c.modelo}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-chofer">Chofer</label>
          <select
            id="filtro-chofer"
            value={filtros.choferId}
            onChange={(e) => handleFiltroChange('choferId', e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            {choferesOpciones.map((ch) => (
              <option key={ch.id} value={String(ch.id)}>
                {ch.nombre} {ch.apellido}
                {ch.estado !== EstadoChofer.ACTIVO
                  ? ` (${estadoChoferLabels[ch.estado] ?? ch.estado})`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-cliente">Cliente</label>
          <select
            id="filtro-cliente"
            value={filtros.clienteId}
            onChange={(e) => handleFiltroChange('clienteId', e.target.value)}
            className="filter-input"
          >
            <option value="">Todos</option>
            {clientes.map((cl) => (
              <option key={cl.id} value={String(cl.id)}>
                {cl.nombre}
                {cl.activo ? '' : ' (inactivo)'}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-fecha-desde">Viaje Desde</label>
          <input
            id="filtro-fecha-desde"
            type="date"
            value={filtros.fechaDesde}
            max={filtros.fechaHasta || undefined}
            onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
            className="filter-input"
            title="Fecha de inicio del viaje"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-fecha-hasta">Viaje Hasta</label>
          <input
            id="filtro-fecha-hasta"
            type="date"
            value={filtros.fechaHasta}
            min={filtros.fechaDesde || undefined}
            onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
            className="filter-input"
            title="Fecha de inicio del viaje"
          />
        </div>

        <button
          className="btn-secondary"
          onClick={() => setFiltros({ estado: '', camionId: '', choferId: '', clienteId: '', fechaDesde: '', fechaHasta: '' })}
        >
          Limpiar Filtros
        </button>
      </div>

      {/* Tabla de viajes */}
      {loading ? (
        <div className="table-responsive skeleton-table">
          <table className="viajes-table">
            <ViajesTableHead />
            <tbody>
              {skeletonRows.map((row) => (
                <tr key={row}>
                  <td colSpan={VIAJES_COLUMNS.length}>
                    <div className="skeleton-line" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viajes.length === 0 ? (
        <div className="no-data">
          <p>No hay viajes registrados</p>
          <button className="btn-primary" onClick={handleNew}>
            Crear el primer viaje
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="viajes-table">
            <ViajesTableHead />
            <tbody>
              {viajes.map((viaje) => (
                <tr key={viaje.id} className="viaje-row">
                  <td className="numero-viaje">
                    <strong>{viaje.numeroViaje}</strong>
                  </td>
                  <td title={camiones[viaje.camionId]?.patente || `ID: ${viaje.camionId}`}>
                    {camiones[viaje.camionId]?.patente || `ID: ${viaje.camionId}`}
                  </td>
                  <td
                    title={
                      choferes[viaje.choferId]
                        ? `${choferes[viaje.choferId].nombre} ${choferes[viaje.choferId].apellido}`
                        : `ID: ${viaje.choferId}`
                    }
                  >
                    {choferes[viaje.choferId]
                      ? `${choferes[viaje.choferId].nombre} ${choferes[viaje.choferId].apellido}`
                      : `ID: ${viaje.choferId}`}
                  </td>
                  <td title={viaje.cliente?.nombre || ''}>{viaje.cliente?.nombre || '-'}</td>
                  <td title={viaje.origen}>{viaje.origen}</td>
                  <td title={viaje.destino}>{viaje.destino}</td>
                  <td className="doc-status-cell">
                    {(() => {
                      const documentoUrl = getDocumentoDescargaUrl(viaje);
                      const documentoCargado = hasDocumentoDescarga(viaje);

                      if (documentoUrl) {
                        return (
                          <a
                            className="doc-status-badge has-doc doc-status-link"
                            href={documentoUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir comprobante"
                          >
                            Cargado
                          </a>
                        );
                      }

                      const adjuntos = getDocumentosAdjuntos(viaje);
                      return (
                        <span
                          className={`doc-status-badge ${documentoCargado ? 'has-doc' : 'no-doc'}`}
                          title={adjuntos.length > 1 ? adjuntos.map((doc) => doc.nombre).join(', ') : undefined}
                        >
                          {adjuntos.length > 1
                            ? `${adjuntos.length} documentos`
                            : documentoCargado
                              ? 'Cargado'
                              : 'No cargado'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="valor-cell">
                    {formatViajeAmount(viaje)}
                    {viaje.moneda === 'USD' && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        Eq. {formatViajeUyuEquivalent(viaje)}
                      </div>
                    )}
                  </td>
                  {(() => {
                    const ganancia = getGananciaNetaUyu(viaje);
                    return (
                      <td
                        className={`ganancia-cell ${ganancia < 0 ? 'ganancia-negativa' : ''}`}
                        title="Valor del viaje menos gastos operativos (combustible, otros gastos, peajes) y comisiones, en UYU"
                      >
                        {formatUyu(ganancia)}
                      </td>
                    );
                  })()}
                  <td>{formatViajeDate(viaje.fechaInicio)}</td>
                  <td>{formatViajeDate(viaje.fechaFin)}</td>
                  <td>{viaje.fechaPago ? formatViajeDate(viaje.fechaPago) : 'Pendiente'}</td>
                  <td className="km-cell">{Number(viaje.kmRecorridos || 0).toFixed(2)} km</td>
                  <td className="estado-cell">
                    <select
                      value={viaje.estado || 'en_progreso'}
                      onChange={(e) => handleCambiarEstado(viaje.id!, e.target.value)}
                      className={`estado-select ${getEstadoBadge(viaje.estado || 'en_progreso')}`}
                    >
                      <option value="en_progreso">En Progreso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="col-acciones acciones-cell">
                    <div className="acciones-wrap">
                    <button
                      className="table-action-btn table-action-btn--edit"
                      onClick={() => handleEdit(viaje.id!)}
                      title="Editar"
                      aria-label={`Editar viaje ${viaje.numeroViaje}: ${viaje.origen} - ${viaje.destino}`}
                    >
                      Editar
                    </button>
                    <button
                      className="table-action-btn table-action-btn--delete"
                      onClick={() => handleDelete(viaje.id!)}
                      title="Eliminar"
                      aria-label={`Eliminar viaje ${viaje.numeroViaje}: ${viaje.origen} - ${viaje.destino}`}
                    >
                      Eliminar
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totales-row">
                <td colSpan={7} className="totales-label">
                  Totales · {viajesParaTotales.length} {viajesParaTotales.length === 1 ? 'viaje' : 'viajes'}
                  {cantidadCancelados > 0 && (
                    <span className="totales-nota">
                      {' '}
                      (sin {cantidadCancelados} {cantidadCancelados === 1 ? 'cancelado' : 'cancelados'})
                    </span>
                  )}
                </td>
                <td className="valor-cell" title="Suma del valor de los viajes en UYU (los viajes en USD, a su equivalente)">
                  {formatUyu(totales.valorUyu)}
                </td>
                <td className={`ganancia-cell ${totales.ganancia < 0 ? 'ganancia-negativa' : ''}`}>
                  {formatUyu(totales.ganancia)}
                </td>
                <td colSpan={3} />
                <td className="km-cell">
                  {new Intl.NumberFormat('es-UY', { maximumFractionDigits: 0 }).format(totales.km)} km
                </td>
                <td />
                <td className="col-acciones" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default Viajes;
