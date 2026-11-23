import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import salariosService from '../services/salariosService';
import choferesService from '../services/choferesService';
import {
  ChoferSalario,
  SalarioPago,
  EstadoSalario,
  TipoPagoSalario,
  formatPeriodo,
  formatCurrency,
  getEstadoSalarioLabel,
  getEstadoSalarioColor,
} from '../types/salario';
import { Chofer } from '../types/chofer';
import AppNavbar from '../components/AppNavbar';
import BackButton from '../components/BackButton';
import { getTodayLocalInputValue, toDateInputValue, formatDateForDisplay } from '../utils/dateUtils';
import '../styles/ChoferSalarios.css';

const ChoferSalarios: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const choferId = parseInt(id || '0');

  const [chofer, setChofer] = useState<Chofer | null>(null);
  const [salarios, setSalarios] = useState<ChoferSalario[]>([]);
  const [salariosFiltrados, setSalariosFiltrados] = useState<ChoferSalario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filtroAnio, setFiltroAnio] = useState<number>(new Date().getFullYear());
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [salarioSeleccionado, setSalarioSeleccionado] = useState<ChoferSalario | null>(null);
  const [showPagoManualModal, setShowPagoManualModal] = useState(false);
  const [showEditarPagoModal, setShowEditarPagoModal] = useState(false);
  const [pagoEditando, setPagoEditando] = useState<{ salarioId: number; pagoId: number } | null>(null);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [pagoForm, setPagoForm] = useState({
    monto: '',
    fechaPago: getTodayLocalInputValue(),
    metodoPago: 'transferencia',
    tipo: TipoPagoSalario.ADELANTO,
    comprobante: '',
    observaciones: '',
  });
  const [pagoManualForm, setPagoManualForm] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    salarioBase: '',
    totalComisiones: '0',
    bonos: '0',
    deducciones: '0',
    fechaPago: getTodayLocalInputValue(),
    metodoPago: 'transferencia',
    monto: '',
    tipo: TipoPagoSalario.ADELANTO,
    comprobante: '',
    observaciones: '',
  });
  const [pagoEditarForm, setPagoEditarForm] = useState({
    monto: '',
    fechaPago: getTodayLocalInputValue(),
    metodoPago: 'transferencia',
    tipo: TipoPagoSalario.ADELANTO,
    comprobante: '',
    observaciones: '',
  });

  const metodosPago = ['transferencia', 'efectivo', 'cheque', 'otro'];

  useEffect(() => {
    cargarDatos();
  }, [choferId]);

  useEffect(() => {
    aplicarFiltros();
  }, [salarios, filtroAnio, filtroEstado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar datos del chofer
      const choferData = await choferesService.getById(choferId);
      setChofer(choferData);

      // Cargar salarios del chofer
      const salariosData = await salariosService.getByChofer(choferId);
      setSalarios(salariosData);
    } catch (err: any) {
      console.error('Error al cargar salarios:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...salarios];

    // Filtro por año
    filtered = filtered.filter((s) => s.anio === filtroAnio);

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      filtered = filtered.filter((s) => s.estado === filtroEstado);
    }

    setSalariosFiltrados(filtered);
  };

  const handleVerDetalle = (salarioId: number) => {
    navigate(`/choferes/${choferId}/salarios/${salarioId}`);
  };

  const handleAbrirPagoModal = (salario: ChoferSalario) => {
    const totalPagado = (salario.pagos || []).reduce(
      (acc, pago) => acc + Number(pago.monto || 0),
      0,
    );
    const saldo = Math.max(Number(salario.salarioNeto || 0) - totalPagado, 0);

    setSalarioSeleccionado(salario);
    setPagoForm({
      monto: saldo > 0 ? saldo.toFixed(2) : '',
      fechaPago: getTodayLocalInputValue(),
      metodoPago: 'transferencia',
      tipo: TipoPagoSalario.ADELANTO,
      comprobante: salario.comprobante || '',
      observaciones: '',
    });
    setShowPagoModal(true);
  };

  const handleCerrarPagoModal = () => {
    setShowPagoModal(false);
    setSalarioSeleccionado(null);
    setGuardandoPago(false);
  };

  const handleAbrirPagoManualModal = () => {
    setPagoManualForm({
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      salarioBase: '',
      totalComisiones: '0',
      bonos: '0',
      deducciones: '0',
      fechaPago: getTodayLocalInputValue(),
      metodoPago: 'transferencia',
      monto: '',
      tipo: TipoPagoSalario.ADELANTO,
      comprobante: '',
      observaciones: '',
    });
    setShowPagoManualModal(true);
  };

  const handleCerrarPagoManualModal = () => {
    setShowPagoManualModal(false);
    setGuardandoPago(false);
  };

  const handleAbrirEditarPagoModal = (salarioId: number, pago: SalarioPago) => {
    setPagoEditando({ salarioId, pagoId: pago.id });
    setPagoEditarForm({
      monto: Number(pago.monto || 0).toFixed(2),
      fechaPago: pago.fechaPago ? toDateInputValue(pago.fechaPago) : getTodayLocalInputValue(),
      metodoPago: pago.metodoPago || 'transferencia',
      tipo: pago.tipo || TipoPagoSalario.ADELANTO,
      comprobante: pago.comprobante || '',
      observaciones: pago.observaciones || '',
    });
    setShowEditarPagoModal(true);
  };

  const handleCerrarEditarPagoModal = () => {
    setShowEditarPagoModal(false);
    setPagoEditando(null);
    setGuardandoPago(false);
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!salarioSeleccionado) {
      return;
    }

    if (!pagoForm.fechaPago || !pagoForm.metodoPago || Number(pagoForm.monto) <= 0) {
      setError('Debes completar monto, fecha y método de pago');
      return;
    }

    try {
      setGuardandoPago(true);
      setError('');

      await salariosService.registrarPago(
        salarioSeleccionado.id,
        {
          monto: Number(pagoForm.monto),
          fechaPago: pagoForm.fechaPago,
          metodoPago: pagoForm.metodoPago,
          tipo: pagoForm.tipo,
          comprobante: pagoForm.comprobante.trim() || undefined,
          observaciones: pagoForm.observaciones.trim() || undefined,
        },
      );

      await cargarDatos();
      handleCerrarPagoModal();
    } catch (err: any) {
      console.error('Error al registrar pago:', err);
      setError(err.response?.data?.message || 'No se pudo registrar el pago');
      setGuardandoPago(false);
    }
  };

  const handleRegistrarPagoManual = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Number(pagoManualForm.monto) <= 0) {
      setError('Debes ingresar un monto de pago mayor a 0');
      return;
    }

    try {
      setGuardandoPago(true);
      setError('');

      let salarioPeriodo: ChoferSalario | null = null;

      try {
        salarioPeriodo = await salariosService.getSalarioChoferPeriodo(
          choferId,
          Number(pagoManualForm.anio),
          Number(pagoManualForm.mes),
        );
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404) {
          throw err;
        }
      }

      if (!salarioPeriodo) {
        if (!pagoManualForm.salarioBase || Number(pagoManualForm.salarioBase) <= 0) {
          setError('Si el salario del período no existe, debes ingresar Salario Base');
          setGuardandoPago(false);
          return;
        }

        salarioPeriodo = await salariosService.create({
          choferId,
          mes: Number(pagoManualForm.mes),
          anio: Number(pagoManualForm.anio),
          salarioBase: Number(pagoManualForm.salarioBase),
          totalComisiones: Number(pagoManualForm.totalComisiones || 0),
          bonos: Number(pagoManualForm.bonos || 0),
          deducciones: Number(pagoManualForm.deducciones || 0),
          estado: EstadoSalario.PENDIENTE,
          observaciones: pagoManualForm.observaciones.trim() || undefined,
        });
      }

      await salariosService.registrarPago(salarioPeriodo.id, {
        monto: Number(pagoManualForm.monto),
        fechaPago: pagoManualForm.fechaPago,
        metodoPago: pagoManualForm.metodoPago,
        tipo: pagoManualForm.tipo,
        comprobante: pagoManualForm.comprobante.trim() || undefined,
        observaciones: pagoManualForm.observaciones.trim() || undefined,
      });

      await cargarDatos();
      handleCerrarPagoManualModal();
    } catch (err: any) {
      console.error('Error al registrar pago manual:', err);
      setError(err.response?.data?.message || 'No se pudo registrar el pago manual');
      setGuardandoPago(false);
    }
  };

  const handleEditarPago = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pagoEditando || Number(pagoEditarForm.monto) <= 0) {
      setError('Debes ingresar un monto de pago mayor a 0');
      return;
    }

    try {
      setGuardandoPago(true);
      setError('');

      await salariosService.updatePago(pagoEditando.salarioId, pagoEditando.pagoId, {
        monto: Number(pagoEditarForm.monto),
        fechaPago: pagoEditarForm.fechaPago,
        metodoPago: pagoEditarForm.metodoPago,
        tipo: pagoEditarForm.tipo,
        comprobante: pagoEditarForm.comprobante.trim() || undefined,
        observaciones: pagoEditarForm.observaciones.trim() || undefined,
      });

      await cargarDatos();
      handleCerrarEditarPagoModal();
    } catch (err: any) {
      console.error('Error al editar pago:', err);
      setError(err.response?.data?.message || 'No se pudo editar el pago');
      setGuardandoPago(false);
    }
  };

  const handleEliminarPago = async (salarioId: number, pagoId: number) => {
    const ok = window.confirm('¿Seguro que deseas eliminar este pago? Esta acción recalculará el saldo pendiente.');
    if (!ok) {
      return;
    }

    try {
      setError('');
      await salariosService.deletePago(salarioId, pagoId);
      await cargarDatos();
    } catch (err: any) {
      console.error('Error al eliminar pago:', err);
      setError(err.response?.data?.message || 'No se pudo eliminar el pago');
    }
  };

  const handleGenerarPDF = (salario: ChoferSalario) => {
    // TODO: Implementar generación PDF
    console.log('Generar PDF para salario:', salario.id);
    alert('Función de generación PDF en desarrollo');
  };

  const calcularTotales = () => {
    const totales = salariosFiltrados.reduce(
      (acc, s) => ({
        salarioBase: acc.salarioBase + parseFloat(s.salarioBase.toString()),
        comisiones: acc.comisiones + parseFloat(s.totalComisiones.toString()),
        viaticos: acc.viaticos + Number(s.totalViaticos ?? 0),
        bonos: acc.bonos + parseFloat(s.bonos.toString()),
        deducciones: acc.deducciones + parseFloat(s.deducciones.toString()),
        salarioNeto: acc.salarioNeto + parseFloat(s.salarioNeto.toString()),
      }),
      { salarioBase: 0, comisiones: 0, viaticos: 0, bonos: 0, deducciones: 0, salarioNeto: 0 },
    );
    return totales;
  };

  const getAniosDisponibles = (): number[] => {
    const anios = Array.from(new Set(salarios.map((s) => s.anio)));
    return anios.sort((a, b) => b - a);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando salarios...</p>
      </div>
    );
  }

  const totales = calcularTotales();
  const aniosDisponibles = getAniosDisponibles();
  const getTotalPagado = (salario: ChoferSalario): number =>
    (salario.pagos || []).reduce((acc, pago) => acc + Number(pago.monto || 0), 0);

  const getSaldoPendiente = (salario: ChoferSalario): number =>
    Math.max(Number(salario.salarioNeto || 0) - getTotalPagado(salario), 0);

  const salariosPendientes = salarios
    .filter((s) => s.estado !== EstadoSalario.CANCELADO && getSaldoPendiente(s) > 0)
    .sort((a, b) => {
      if (a.anio !== b.anio) {
        return b.anio - a.anio;
      }
      return b.mes - a.mes;
    });
  const pagosHistoricos = salarios
    .flatMap((salario) =>
      (salario.pagos || []).map((pago) => ({
        salario,
        pago,
      })),
    )
    .sort((a, b) => {
      const fechaA = a.pago.fechaPago ? new Date(a.pago.fechaPago).getTime() : 0;
      const fechaB = b.pago.fechaPago ? new Date(b.pago.fechaPago).getTime() : 0;
      if (fechaA !== fechaB) {
        return fechaB - fechaA;
      }
      if (a.salario.anio !== b.salario.anio) {
        return b.salario.anio - a.salario.anio;
      }
      return b.salario.mes - a.salario.mes;
    });

  // Historial agrupado por mes de liquidación: desglose del salario + pagos al chofer
  const sueldoBaseActual = Number(chofer?.sueldoBase || 0);
  const historialPorMes = salarios
    .filter((salario) => (salario.pagos || []).length > 0)
    .map((salario) => {
      const pagos = [...(salario.pagos || [])].sort(
        (a, b) => (b.fechaPago || '').localeCompare(a.fechaPago || '') || b.id - a.id,
      );
      const totalPagado = getTotalPagado(salario);
      return {
        salario,
        pagos,
        totalPagado,
        extras: Number(salario.totalComisiones || 0) + Number(salario.totalViaticos || 0) + Number(salario.bonos || 0),
        diferencia: Number(salario.salarioNeto || 0) - totalPagado,
      };
    })
    .sort((a, b) => b.salario.anio - a.salario.anio || b.salario.mes - a.salario.mes);

  return (
    <div className="chofer-salarios-container">
      <AppNavbar />

      {/* Header */}
      <div className="page-header">
        <BackButton
          label="← Volver al Detalle del Chofer"
          to={`/choferes/${choferId}`}
          variant="ghost"
        />
        <div>
          <h1>Salarios de {chofer?.nombre} {chofer?.apellido}</h1>
          <p className="subtitle">RUT: {chofer?.numeroDocumento}</p>
        </div>
      </div>

      {error && <div className="inline-error">{error}</div>}

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filtro-anio">Año:</label>
          <select
            id="filtro-anio"
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(parseInt(e.target.value))}
          >
            {aniosDisponibles.length > 0 ? (
              aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))
            ) : (
              <option value={new Date().getFullYear()}>
                {new Date().getFullYear()}
              </option>
            )}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-estado">Estado:</label>
          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value={EstadoSalario.PENDIENTE}>Pendiente</option>
            <option value={EstadoSalario.PAGADO}>Pagado</option>
            <option value={EstadoSalario.CANCELADO}>Cancelado</option>
          </select>
        </div>

        <button className="btn-primary" onClick={cargarDatos}>
          Actualizar
        </button>
        <button type="button" className="btn-success" onClick={handleAbrirPagoManualModal}>
          + Agregar Pago
        </button>
      </div>

      <section className="pagos-section">
        <div className="pagos-section-header">
          <h2>Registro de Pagos</h2>
          <span className="pendientes-badge">
            Pendientes: {salariosPendientes.length}
          </span>
        </div>

        {salariosPendientes.length === 0 ? (
          <div className="pagos-empty">No hay salarios pendientes de pago para este chofer.</div>
        ) : (
          <div className="pagos-list">
            {salariosPendientes.map((salario) => (
              <div key={`pago-${salario.id}`} className="pago-item">
                <div className="pago-item-main">
                  <strong>{formatPeriodo(salario.mes, salario.anio)}</strong>
                  <span>{formatCurrency(salario.salarioNeto)}</span>
                </div>
                <button
                  type="button"
                  className="btn-registrar-pago"
                  onClick={() => handleAbrirPagoModal(salario)}
                >
                  Registrar Pago
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="historial-pagos-section">
        <div className="pagos-section-header">
          <h2>Historial de Pagos</h2>
          <span className="pagados-badge">
            {historialPorMes.length} {historialPorMes.length === 1 ? 'mes' : 'meses'} · {pagosHistoricos.length} pagos
          </span>
        </div>

        {pagosHistoricos.length === 0 ? (
          <div className="pagos-empty">Aún no hay pagos registrados para este chofer.</div>
        ) : (
          <div className="historial-meses">
            {historialPorMes.map(({ salario, pagos, extras, totalPagado, diferencia }, index) => {
              const base = Number(salario.salarioBase || 0);
              const baseDistinta = sueldoBaseActual > 0 && Math.abs(base - sueldoBaseActual) > 0.005;
              return (
                <details key={`mes-${salario.id}`} className="historial-mes" open={index === 0}>
                  <summary className="historial-mes__summary">
                    <span className="historial-mes__periodo">{formatPeriodo(salario.mes, salario.anio)}</span>
                    <span className="estado-badge" style={{ backgroundColor: getEstadoSalarioColor(salario.estado) }}>
                      {getEstadoSalarioLabel(salario.estado)}
                    </span>
                    <span className="historial-mes__resumen">
                      Pagado <strong>{formatCurrency(totalPagado)}</strong> de{' '}
                      {formatCurrency(Number(salario.salarioNeto || 0))} · {pagos.length}{' '}
                      {pagos.length === 1 ? 'pago' : 'pagos'}
                    </span>
                  </summary>

                  <div className="historial-mes__desglose">
                    <div className="desglose-item">
                      <span>Sueldo base</span>
                      <strong>{formatCurrency(base)}</strong>
                      {baseDistinta && (
                        <small className="desglose-alerta">
                          Distinto al sueldo base actual ({formatCurrency(sueldoBaseActual)})
                        </small>
                      )}
                    </div>
                    <div className="desglose-item desglose-item--extra">
                      <span>+ Comisiones por viajes</span>
                      <strong>{formatCurrency(Number(salario.totalComisiones || 0))}</strong>
                    </div>
                    <div className="desglose-item desglose-item--extra">
                      <span>+ Viáticos</span>
                      <strong>{formatCurrency(Number(salario.totalViaticos || 0))}</strong>
                    </div>
                    {Number(salario.bonos || 0) !== 0 && (
                      <div className="desglose-item desglose-item--extra">
                        <span>+ Bonos</span>
                        <strong>{formatCurrency(Number(salario.bonos))}</strong>
                      </div>
                    )}
                    {Number(salario.deducciones || 0) !== 0 && (
                      <div className="desglose-item desglose-item--deduccion">
                        <span>− Deducciones</span>
                        <strong>{formatCurrency(Number(salario.deducciones))}</strong>
                      </div>
                    )}
                    <div className="desglose-item desglose-item--total">
                      <span>= Total a pagar</span>
                      <strong>{formatCurrency(Number(salario.salarioNeto || 0))}</strong>
                      <small>Extras del mes: {formatCurrency(extras)}</small>
                    </div>
                    <div className={`desglose-item ${diferencia > 0.005 ? 'desglose-item--saldo' : ''}`}>
                      <span>{diferencia < -0.005 ? 'Pagado de más' : 'Saldo pendiente'}</span>
                      <strong>{formatCurrency(Math.abs(diferencia))}</strong>
                    </div>
                    {salario.costoEmpresa != null && (
                      <div className="desglose-item desglose-item--empresa">
                        <span>Costo empresa</span>
                        <strong>{formatCurrency(Number(salario.costoEmpresa))}</strong>
                        <small>Informativo</small>
                      </div>
                    )}
                  </div>

                  <table className="historial-mes__pagos">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Método</th>
                        <th>Comprobante</th>
                        <th className="num">Monto</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago) => (
                        <tr key={`hist-${salario.id}-${pago.id}`}>
                          <td>{pago.fechaPago ? formatDateForDisplay(pago.fechaPago, 'es-CL') : '-'}</td>
                          <td>{pago.tipo === TipoPagoSalario.ADELANTO ? 'Adelanto' : 'Liquidación'}</td>
                          <td>{pago.metodoPago || '-'}</td>
                          <td>
                            {pago.comprobante || '-'}
                            {pago.observaciones && <div className="historial-observaciones">{pago.observaciones}</div>}
                          </td>
                          <td className="num">{formatCurrency(Number(pago.monto))}</td>
                          <td className="historial-actions">
                            <button
                              type="button"
                              className="btn-historial-edit"
                              onClick={() => handleAbrirEditarPagoModal(salario.id, pago)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn-historial-delete"
                              onClick={() => handleEliminarPago(salario.id, pago.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4}>Total pagado en el mes</td>
                        <td className="num">{formatCurrency(totalPagado)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-historial-detalle"
                            onClick={() => handleVerDetalle(salario.id)}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </details>
              );
            })}
          </div>
        )}
      </section>

      {/* Tabla de Salarios */}
      {salariosFiltrados.length === 0 ? (
        <div className="empty-state">
          <p>No hay salarios registrados para este período</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="salarios-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Salario Base</th>
                  <th>Comisiones</th>
                  <th>Viáticos</th>
                  <th>Bonos</th>
                  <th>Deducciones</th>
                  <th title="Base + comisiones + viáticos + bonos − deducciones">Total a pagar</th>
                  <th>Pagado Acum.</th>
                  <th>Saldo</th>
                  <th title="Costo total para la empresa (cargado a mano). No suma a lo que se le paga al chofer.">
                    Costo Empresa
                  </th>
                  <th>Estado</th>
                  <th>Fecha Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {salariosFiltrados.map((salario) => (
                  <tr key={salario.id}>
                    <td>
                      <strong>{formatPeriodo(salario.mes, salario.anio)}</strong>
                    </td>
                    <td>{formatCurrency(salario.salarioBase)}</td>
                    <td className="comisiones">
                      {formatCurrency(salario.totalComisiones)}
                    </td>
                    <td>{formatCurrency(salario.totalViaticos ?? 0)}</td>
                    <td className="bonos">{formatCurrency(salario.bonos)}</td>
                    <td className="deducciones">
                      {formatCurrency(salario.deducciones)}
                    </td>
                    <td>
                      <strong>{formatCurrency(salario.salarioNeto)}</strong>
                    </td>
                    <td>{formatCurrency(getTotalPagado(salario))}</td>
                    <td>{formatCurrency(getSaldoPendiente(salario))}</td>
                    <td className="costo-empresa">
                      {salario.costoEmpresa != null ? formatCurrency(salario.costoEmpresa) : '-'}
                    </td>
                    <td>
                      <span
                        className="estado-badge"
                        style={{
                          backgroundColor: getEstadoSalarioColor(salario.estado),
                        }}
                      >
                        {getEstadoSalarioLabel(salario.estado)}
                      </span>
                    </td>
                    <td>
                      {salario.fechaPago
                        ? formatDateForDisplay(salario.fechaPago, 'es-CL')
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleVerDetalle(salario.id)}
                          title="Ver detalle"
                          aria-label={`Ver detalle de salario ${formatPeriodo(
                            salario.mes,
                            salario.anio,
                          )}`}
                        >
                          👁️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleGenerarPDF(salario)}
                          title="Generar PDF"
                          aria-label={`Generar PDF de salario ${formatPeriodo(
                            salario.mes,
                            salario.anio,
                          )}`}
                        >
                          📄
                        </button>
                        {getSaldoPendiente(salario) > 0 && salario.estado !== EstadoSalario.CANCELADO && (
                          <>
                            <button
                              className="btn-icon btn-icon-pay"
                              onClick={() => handleAbrirPagoModal(salario)}
                              title="Registrar pago"
                              aria-label={`Registrar pago de salario ${formatPeriodo(
                                salario.mes,
                                salario.anio,
                              )}`}
                            >
                              💵
                            </button>
                            <button
                              type="button"
                              className="btn-registrar-inline"
                              onClick={() => handleAbrirPagoModal(salario)}
                            >
                              Registrar Pago
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totales-row">
                  <td>
                    <strong>TOTALES {filtroAnio}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.salarioBase)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.comisiones)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.viaticos)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.bonos)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.deducciones)}</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(totales.salarioNeto)}</strong>
                  </td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {showPagoModal && salarioSeleccionado && (
        <div className="pago-modal-overlay" onClick={handleCerrarPagoModal}>
          <div className="pago-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pago-modal-header">
              <h3>Registrar Pago</h3>
              <button type="button" className="pago-modal-close" onClick={handleCerrarPagoModal}>
                ✕
              </button>
            </div>

            <p className="pago-modal-periodo">
              {formatPeriodo(salarioSeleccionado.mes, salarioSeleccionado.anio)} - {formatCurrency(salarioSeleccionado.salarioNeto)}
            </p>

            <p className="pago-modal-resumen">
              Pagado acumulado: {formatCurrency(getTotalPagado(salarioSeleccionado))} | Saldo: {formatCurrency(getSaldoPendiente(salarioSeleccionado))}
            </p>

            <form onSubmit={handleRegistrarPago} className="pago-modal-form">
              <div className="pago-form-group">
                <label htmlFor="montoPago">Monto a pagar</label>
                <input
                  id="montoPago"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={pagoForm.monto}
                  onChange={(e) =>
                    setPagoForm((prev) => ({ ...prev, monto: e.target.value }))
                  }
                  required
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-form-group">
                <label htmlFor="fechaPago">Fecha de pago</label>
                <input
                  id="fechaPago"
                  type="date"
                  value={pagoForm.fechaPago}
                  onChange={(e) =>
                    setPagoForm((prev) => ({ ...prev, fechaPago: e.target.value }))
                  }
                  required
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-form-group">
                <label htmlFor="metodoPago">Método de pago</label>
                <select
                  id="metodoPago"
                  value={pagoForm.metodoPago}
                  onChange={(e) =>
                    setPagoForm((prev) => ({ ...prev, metodoPago: e.target.value }))
                  }
                  required
                  disabled={guardandoPago}
                >
                  {metodosPago.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pago-form-group">
                <label htmlFor="tipoPago">Tipo de pago</label>
                <select
                  id="tipoPago"
                  value={pagoForm.tipo}
                  onChange={(e) =>
                    setPagoForm((prev) => ({ ...prev, tipo: e.target.value as TipoPagoSalario }))
                  }
                  required
                  disabled={guardandoPago}
                >
                  <option value={TipoPagoSalario.ADELANTO}>Adelanto</option>
                  <option value={TipoPagoSalario.LIQUIDACION}>Liquidación</option>
                </select>
              </div>

              <div className="pago-form-group">
                <label htmlFor="comprobante">Comprobante (opcional)</label>
                <input
                  id="comprobante"
                  type="text"
                  placeholder="Nro transferencia, referencia, etc."
                  value={pagoForm.comprobante}
                  onChange={(e) =>
                    setPagoForm((prev) => ({ ...prev, comprobante: e.target.value }))
                  }
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-form-group">
                <label htmlFor="obsPago">Observaciones (opcional)</label>
                <input
                  id="obsPago"
                  type="text"
                  value={pagoForm.observaciones}
                  onChange={(e) =>
                    setPagoForm((prev) => ({ ...prev, observaciones: e.target.value }))
                  }
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-modal-actions">
                <button type="button" onClick={handleCerrarPagoModal} className="btn-cancel" disabled={guardandoPago}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm" disabled={guardandoPago}>
                  {guardandoPago ? 'Guardando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPagoManualModal && (
        <div className="pago-modal-overlay" onClick={handleCerrarPagoManualModal}>
          <div className="pago-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pago-modal-header">
              <h3>Agregar Pago Manual</h3>
              <button type="button" className="pago-modal-close" onClick={handleCerrarPagoManualModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleRegistrarPagoManual} className="pago-modal-form">
              <div className="pago-form-row">
                <div className="pago-form-group">
                  <label htmlFor="manualMes">Mes</label>
                  <select
                    id="manualMes"
                    value={pagoManualForm.mes}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, mes: Number(e.target.value) }))}
                    disabled={guardandoPago}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                </div>

                <div className="pago-form-group">
                  <label htmlFor="manualAnio">Año</label>
                  <input
                    id="manualAnio"
                    type="number"
                    min={2020}
                    max={2100}
                    value={pagoManualForm.anio}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, anio: Number(e.target.value) }))}
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="pago-form-row">
                <div className="pago-form-group">
                  <label htmlFor="manualBase">Salario Base</label>
                  <input
                    id="manualBase"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagoManualForm.salarioBase}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, salarioBase: e.target.value }))}
                    disabled={guardandoPago}
                  />
                </div>

                <div className="pago-form-group">
                  <label htmlFor="manualComisiones">Comisiones</label>
                  <input
                    id="manualComisiones"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagoManualForm.totalComisiones}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, totalComisiones: e.target.value }))}
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="pago-form-row">
                <div className="pago-form-group">
                  <label htmlFor="manualBonos">Bonos</label>
                  <input
                    id="manualBonos"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagoManualForm.bonos}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, bonos: e.target.value }))}
                    disabled={guardandoPago}
                  />
                </div>

                <div className="pago-form-group">
                  <label htmlFor="manualDeducciones">Deducciones</label>
                  <input
                    id="manualDeducciones"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagoManualForm.deducciones}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, deducciones: e.target.value }))}
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="pago-form-row">
                <div className="pago-form-group">
                  <label htmlFor="manualFechaPago">Fecha de pago</label>
                  <input
                    id="manualFechaPago"
                    type="date"
                    value={pagoManualForm.fechaPago}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, fechaPago: e.target.value }))}
                    required
                    disabled={guardandoPago}
                  />
                </div>

                <div className="pago-form-group">
                  <label htmlFor="manualMetodoPago">Método de pago</label>
                  <select
                    id="manualMetodoPago"
                    value={pagoManualForm.metodoPago}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, metodoPago: e.target.value }))}
                    required
                    disabled={guardandoPago}
                  >
                    {metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>
                        {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pago-form-row">
                <div className="pago-form-group">
                  <label htmlFor="manualMonto">Monto del pago</label>
                  <input
                    id="manualMonto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={pagoManualForm.monto}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, monto: e.target.value }))}
                    required
                    disabled={guardandoPago}
                  />
                </div>
                <div className="pago-form-group">
                  <label htmlFor="manualTipoPago">Tipo de pago</label>
                  <select
                    id="manualTipoPago"
                    value={pagoManualForm.tipo}
                    onChange={(e) => setPagoManualForm((prev) => ({ ...prev, tipo: e.target.value as TipoPagoSalario }))}
                    disabled={guardandoPago}
                  >
                    <option value={TipoPagoSalario.ADELANTO}>Adelanto</option>
                    <option value={TipoPagoSalario.LIQUIDACION}>Liquidación</option>
                  </select>
                </div>
              </div>

              <div className="pago-form-group">
                <label htmlFor="manualComprobante">Comprobante (opcional)</label>
                <input
                  id="manualComprobante"
                  type="text"
                  value={pagoManualForm.comprobante}
                  onChange={(e) => setPagoManualForm((prev) => ({ ...prev, comprobante: e.target.value }))}
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-form-group">
                <label htmlFor="manualObs">Observaciones (opcional)</label>
                <input
                  id="manualObs"
                  type="text"
                  value={pagoManualForm.observaciones}
                  onChange={(e) => setPagoManualForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-modal-actions">
                <button type="button" onClick={handleCerrarPagoManualModal} className="btn-cancel" disabled={guardandoPago}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm" disabled={guardandoPago}>
                  {guardandoPago ? 'Guardando...' : 'Guardar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditarPagoModal && pagoEditando && (
        <div className="pago-modal-overlay" onClick={handleCerrarEditarPagoModal}>
          <div className="pago-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pago-modal-header">
              <h3>Editar Pago</h3>
              <button type="button" className="pago-modal-close" onClick={handleCerrarEditarPagoModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleEditarPago} className="pago-modal-form">
              <div className="pago-form-group">
                <label htmlFor="editMontoPago">Monto</label>
                <input
                  id="editMontoPago"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={pagoEditarForm.monto}
                  onChange={(e) =>
                    setPagoEditarForm((prev) => ({ ...prev, monto: e.target.value }))
                  }
                  required
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-form-row">
                <div className="pago-form-group">
                  <label htmlFor="editFechaPago">Fecha de pago</label>
                  <input
                    id="editFechaPago"
                    type="date"
                    value={pagoEditarForm.fechaPago}
                    onChange={(e) =>
                      setPagoEditarForm((prev) => ({ ...prev, fechaPago: e.target.value }))
                    }
                    required
                    disabled={guardandoPago}
                  />
                </div>

                <div className="pago-form-group">
                  <label htmlFor="editMetodoPago">Método de pago</label>
                  <select
                    id="editMetodoPago"
                    value={pagoEditarForm.metodoPago}
                    onChange={(e) =>
                      setPagoEditarForm((prev) => ({ ...prev, metodoPago: e.target.value }))
                    }
                    required
                    disabled={guardandoPago}
                  >
                    {metodosPago.map((metodo) => (
                      <option key={metodo} value={metodo}>
                        {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pago-form-group">
                <label htmlFor="editTipoPago">Tipo de pago</label>
                <select
                  id="editTipoPago"
                  value={pagoEditarForm.tipo}
                  onChange={(e) =>
                    setPagoEditarForm((prev) => ({ ...prev, tipo: e.target.value as TipoPagoSalario }))
                  }
                  required
                  disabled={guardandoPago}
                >
                  <option value={TipoPagoSalario.ADELANTO}>Adelanto</option>
                  <option value={TipoPagoSalario.LIQUIDACION}>Liquidación</option>
                </select>
              </div>

              <div className="pago-form-group">
                <label htmlFor="editComprobante">Comprobante (opcional)</label>
                <input
                  id="editComprobante"
                  type="text"
                  value={pagoEditarForm.comprobante}
                  onChange={(e) =>
                    setPagoEditarForm((prev) => ({ ...prev, comprobante: e.target.value }))
                  }
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-form-group">
                <label htmlFor="editObs">Observaciones (opcional)</label>
                <input
                  id="editObs"
                  type="text"
                  value={pagoEditarForm.observaciones}
                  onChange={(e) =>
                    setPagoEditarForm((prev) => ({ ...prev, observaciones: e.target.value }))
                  }
                  disabled={guardandoPago}
                />
              </div>

              <div className="pago-modal-actions">
                <button type="button" onClick={handleCerrarEditarPagoModal} className="btn-cancel" disabled={guardandoPago}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm" disabled={guardandoPago}>
                  {guardandoPago ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChoferSalarios;
