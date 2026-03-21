import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import salariosService from '../services/salariosService';
import {
  ChoferSalario,
  EstadoSalario,
  SalarioPago,
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
  const navigate = useNavigate();
  const [salarios, setSalarios] = useState<ChoferSalario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          <span className="salarios-tab-badge warning">Pendientes: {salariosPendientes.length}</span>
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
                <button
                  type="button"
                  className="salarios-tab-action"
                  onClick={() => navigate(`/choferes/${choferId}/salarios/${salario.id}`)}
                >
                  Ver detalle
                </button>
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
                      <button
                        type="button"
                        className="salarios-tab-link"
                        onClick={() => navigate(`/choferes/${choferId}/salarios/${salario.id}`)}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default SalariosTab;
