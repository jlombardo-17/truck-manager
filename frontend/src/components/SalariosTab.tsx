import React, { useEffect, useMemo, useState } from 'react';
import salariosService from '../services/salariosService';
import {
  ChoferSalario,
  EstadoSalario,
  SalarioPago,
  TipoPagoSalario,
  formatCurrency,
  formatPeriodo,
  getEstadoSalarioColor,
  getEstadoSalarioLabel,
} from '../types/salario';
import '../styles/SalariosTab.css';

type PagoHistorico = {
  salario: ChoferSalario;
  pago: SalarioPago;
};

interface SalariosTabProps {
  choferId: number;
}

const SalariosTab: React.FC<SalariosTabProps> = ({ choferId }) => {
  const [salarios, setSalarios] = useState<ChoferSalario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [salarioSeleccionado, setSalarioSeleccionado] = useState<ChoferSalario | null>(null);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [pagoForm, setPagoForm] = useState({
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    metodoPago: 'transferencia',
    tipo: TipoPagoSalario.ADELANTO,
    comprobante: '',
    observaciones: '',
  });
  const metodosPago = ['transferencia', 'efectivo', 'cheque', 'otro'];

  const loadSalarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salariosService.getByChofer(choferId);
      setSalarios(data);
    } catch (err: any) {
      console.error('Error al cargar salarios del chofer:', err);
      setError(err?.response?.data?.message || 'No se pudieron cargar los salarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalarios();
  }, [choferId]);

  const getTotalPagado = (salario: ChoferSalario): number =>
    (salario.pagos || []).reduce((acc, pago) => acc + Number(pago.monto || 0), 0);

  const getSaldoPendiente = (salario: ChoferSalario): number =>
    Math.max(Number(salario.salarioNeto || 0) - getTotalPagado(salario), 0);

  const resumen = useMemo(() => {
    const totalNeto = salarios.reduce((acc, salario) => acc + Number(salario.salarioNeto || 0), 0);
    const totalPagado = salarios.reduce((acc, salario) => acc + getTotalPagado(salario), 0);
    const movimientos = salarios.reduce((acc, salario) => acc + (salario.pagos?.length || 0), 0);

    return {
      totalNeto,
      totalPagado,
      saldoPendiente: Math.max(totalNeto - totalPagado, 0),
      movimientos,
    };
  }, [salarios]);

  const salariosPendientes = useMemo(
    () =>
      salarios
        .filter((salario) => salario.estado !== EstadoSalario.CANCELADO && getSaldoPendiente(salario) > 0)
        .sort((a, b) => {
          if (a.anio !== b.anio) {
            return b.anio - a.anio;
          }
          return b.mes - a.mes;
        }),
    [salarios],
  );

  const pagosHistoricos = useMemo<PagoHistorico[]>(
    () =>
      salarios
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
        }),
    [salarios],
  );

  const handleAbrirPagoModal = (salario: ChoferSalario) => {
    const saldo = getSaldoPendiente(salario);

    setSalarioSeleccionado(salario);
    setPagoError(null);
    setPagoForm({
      monto: saldo > 0 ? saldo.toFixed(2) : '',
      fechaPago: new Date().toISOString().split('T')[0],
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
    setPagoError(null);
  };

  const handleRegistrarPago = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!salarioSeleccionado) {
      return;
    }

    if (!pagoForm.fechaPago || !pagoForm.metodoPago || Number(pagoForm.monto) <= 0) {
      setPagoError('Debes completar monto, fecha y método de pago');
      return;
    }

    try {
      setGuardandoPago(true);
      setPagoError(null);

      await salariosService.registrarPago(salarioSeleccionado.id, {
        monto: Number(pagoForm.monto),
        fechaPago: pagoForm.fechaPago,
        metodoPago: pagoForm.metodoPago,
        tipo: pagoForm.tipo,
        comprobante: pagoForm.comprobante.trim() || undefined,
        observaciones: pagoForm.observaciones.trim() || undefined,
      });

      await loadSalarios();
      handleCerrarPagoModal();
    } catch (err: any) {
      console.error('Error al registrar pago:', err);
      setPagoError(err?.response?.data?.message || 'No se pudo registrar el pago');
      setGuardandoPago(false);
    }
  };

  if (loading) {
    return <div className="salarios-tab-loading">Cargando salarios...</div>;
  }

  if (error) {
    return <div className="salarios-tab-error">{error}</div>;
  }

  return (
    <section className="salarios-tab-section">
      <div className="salarios-summary-grid">
        <article className="salarios-summary-card">
          <span>Total Liquidado</span>
          <strong>{formatCurrency(resumen.totalNeto)}</strong>
        </article>
        <article className="salarios-summary-card paid">
          <span>Total Pagado</span>
          <strong>{formatCurrency(resumen.totalPagado)}</strong>
        </article>
        <article className="salarios-summary-card pending">
          <span>Saldo Pendiente</span>
          <strong>{formatCurrency(resumen.saldoPendiente)}</strong>
        </article>
        <article className="salarios-summary-card movements">
          <span>Movimientos</span>
          <strong>{resumen.movimientos}</strong>
        </article>
      </div>

      <div className="salarios-tab-block">
        <div className="salarios-tab-block-header">
          <h3>Registro de Pagos Pendientes</h3>
          <div className="salarios-tab-block-header-actions">
            {salarios.length > 0 && (
              <button
                type="button"
                className="salarios-tab-action primary"
                onClick={() => handleAbrirPagoModal(salariosPendientes[0] || salarios[0])}
              >
                Agregar pago
              </button>
            )}
            <span className="salarios-tab-badge warning">Pendientes: {salariosPendientes.length}</span>
          </div>
        </div>

        {salariosPendientes.length === 0 ? (
          <div className="salarios-tab-empty">No hay salarios pendientes de pago para este chofer.</div>
        ) : (
          <div className="salarios-tab-list">
            {salariosPendientes.map((salario) => (
              <article key={salario.id} className="salarios-tab-item">
                <div>
                  <h4>{formatPeriodo(salario.mes, salario.anio)}</h4>
                  <p>
                    Saldo pendiente: <strong>{formatCurrency(getSaldoPendiente(salario))}</strong>
                  </p>
                </div>
                <div className="salarios-tab-actions">
                  <button
                    type="button"
                    className="salarios-tab-action primary"
                    onClick={() => handleAbrirPagoModal(salario)}
                  >
                    Agregar pago
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="salarios-tab-block">
        <div className="salarios-tab-block-header">
          <h3>Historial de Pagos</h3>
          <span className="salarios-tab-badge success">Movimientos: {pagosHistoricos.length}</span>
        </div>

        {pagosHistoricos.length === 0 ? (
          <div className="salarios-tab-empty">Todavia no hay pagos registrados para este chofer.</div>
        ) : (
          <div className="salarios-tab-list">
            {pagosHistoricos.map(({ salario, pago }) => (
              <article key={`${salario.id}-${pago.id}`} className="salarios-tab-item stacked">
                <div>
                  <h4>{formatPeriodo(salario.mes, salario.anio)}</h4>
                  <p>
                    Fecha: {new Date(pago.fechaPago).toLocaleDateString('es-CL')} | Metodo: {pago.metodoPago}
                  </p>
                </div>
                <strong className="salarios-tab-amount">{formatCurrency(pago.monto)}</strong>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="salarios-tab-block">
        <h3>Liquidaciones por Periodo</h3>
        {salarios.length === 0 ? (
          <div className="salarios-tab-empty">No hay liquidaciones de salario registradas.</div>
        ) : (
          <div className="salarios-tab-table-wrap">
            <table className="salarios-tab-table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Salario Neto</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {salarios.map((salario) => (
                  <tr key={salario.id}>
                    <td>{formatPeriodo(salario.mes, salario.anio)}</td>
                    <td>{formatCurrency(salario.salarioNeto)}</td>
                    <td>{formatCurrency(getTotalPagado(salario))}</td>
                    <td>{formatCurrency(getSaldoPendiente(salario))}</td>
                    <td>
                      <span
                        className="salarios-tab-status"
                        style={{ backgroundColor: getEstadoSalarioColor(salario.estado) }}
                      >
                        {getEstadoSalarioLabel(salario.estado)}
                      </span>
                    </td>
                    <td>
                      <div className="salarios-tab-actions compact">
                        {salario.estado !== EstadoSalario.CANCELADO && (
                          <button
                            type="button"
                            className="salarios-tab-link primary"
                            onClick={() => handleAbrirPagoModal(salario)}
                          >
                            Agregar pago
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPagoModal && salarioSeleccionado && (
        <div className="salarios-tab-modal-overlay" onClick={handleCerrarPagoModal}>
          <div className="salarios-tab-modal" onClick={(event) => event.stopPropagation()}>
            <div className="salarios-tab-modal-header">
              <h3>Registrar pago</h3>
              <button type="button" className="salarios-tab-modal-close" onClick={handleCerrarPagoModal}>
                ✕
              </button>
            </div>

            <p className="salarios-tab-modal-periodo">
              {formatPeriodo(salarioSeleccionado.mes, salarioSeleccionado.anio)} - {formatCurrency(salarioSeleccionado.salarioNeto)}
            </p>

            <p className="salarios-tab-modal-resumen">
              Pagado acumulado: {formatCurrency(getTotalPagado(salarioSeleccionado))} | Saldo: {formatCurrency(getSaldoPendiente(salarioSeleccionado))}
            </p>

            {pagoError && <div className="salarios-tab-modal-error">{pagoError}</div>}

            <form onSubmit={handleRegistrarPago} className="salarios-tab-modal-form">
              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-monto">Monto a pagar</label>
                  <input
                    id="salarios-tab-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={pagoForm.monto}
                    onChange={(event) => setPagoForm((prev) => ({ ...prev, monto: event.target.value }))}
                    required
                    disabled={guardandoPago}
                  />
                </div>

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-fecha">Fecha de pago</label>
                  <input
                    id="salarios-tab-fecha"
                    type="date"
                    value={pagoForm.fechaPago}
                    onChange={(event) => setPagoForm((prev) => ({ ...prev, fechaPago: event.target.value }))}
                    required
                    disabled={guardandoPago}
                  />
                </div>
              </div>

              <div className="salarios-tab-modal-row">
                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-metodo">Método de pago</label>
                  <select
                    id="salarios-tab-metodo"
                    value={pagoForm.metodoPago}
                    onChange={(event) => setPagoForm((prev) => ({ ...prev, metodoPago: event.target.value }))}
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

                <div className="salarios-tab-modal-group">
                  <label htmlFor="salarios-tab-tipo">Tipo de pago</label>
                  <select
                    id="salarios-tab-tipo"
                    value={pagoForm.tipo}
                    onChange={(event) =>
                      setPagoForm((prev) => ({ ...prev, tipo: event.target.value as TipoPagoSalario }))
                    }
                    required
                    disabled={guardandoPago}
                  >
                    <option value={TipoPagoSalario.ADELANTO}>Adelanto</option>
                    <option value={TipoPagoSalario.LIQUIDACION}>Liquidación</option>
                  </select>
                </div>
              </div>

              <div className="salarios-tab-modal-group">
                <label htmlFor="salarios-tab-comprobante">Comprobante</label>
                <input
                  id="salarios-tab-comprobante"
                  type="text"
                  placeholder="Nro transferencia, referencia, etc."
                  value={pagoForm.comprobante}
                  onChange={(event) => setPagoForm((prev) => ({ ...prev, comprobante: event.target.value }))}
                  disabled={guardandoPago}
                />
              </div>

              <div className="salarios-tab-modal-group">
                <label htmlFor="salarios-tab-observaciones">Observaciones</label>
                <textarea
                  id="salarios-tab-observaciones"
                  rows={3}
                  placeholder="Comentario interno del pago"
                  value={pagoForm.observaciones}
                  onChange={(event) => setPagoForm((prev) => ({ ...prev, observaciones: event.target.value }))}
                  disabled={guardandoPago}
                />
              </div>

              <div className="salarios-tab-modal-actions">
                <button type="button" className="salarios-tab-modal-button secondary" onClick={handleCerrarPagoModal}>
                  Cancelar
                </button>
                <button type="submit" className="salarios-tab-modal-button primary" disabled={guardandoPago}>
                  {guardandoPago ? 'Guardando...' : 'Guardar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default SalariosTab;
