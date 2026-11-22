import React, { useEffect, useState } from 'react';
import '../styles/CommissionsTable.css';
import { sumComisiones, sumGastosOperativosComisiones } from '../utils/comisiones';

type Moneda = 'UYU' | 'USD';

interface Commission {
  id?: string;
  tipo: string;
  concepto?: string;
  montoBase?: number;
  porcentaje?: number;
  montoFijo?: number;
  /** Moneda de montoBase / montoFijo. montoTotal siempre en UYU. */
  moneda?: Moneda;
  montoTotal?: number;
  beneficiario?: string;
  estado?: string;
  notas?: string;
}

interface CommissionsTableProps {
  commissions: Commission[];
  onCommissionsChange: (commissions: Commission[]) => void;
  /** Valor del viaje ya convertido a UYU */
  valorViaje: number;
  costoCombustible?: number;
  otrosGastos?: number;
  /** Cotización usada para convertir comisiones en USD a UYU */
  usdUyuRate: number;
  commissionTypes?: string[];
  /** Nombre del chofer del viaje: beneficiario fijo de las comisiones tipo "Chofer" */
  choferNombre?: string;
}

/** Tipo de comisión que se le paga al chofer del viaje (va a sus jornadas y su salario) */
export const TIPO_COMISION_CHOFER = 'Chofer';
const esComisionChofer = (comm: Commission) => (comm.tipo || '').trim().toLowerCase() === 'chofer';

const formatMonto = (monto: number, moneda: Moneda) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: moneda, maximumFractionDigits: 2 }).format(
    monto,
  );

const emptyCommission = (): Commission => ({ tipo: 'Contratista', moneda: 'UYU' });

const CommissionsTable: React.FC<CommissionsTableProps> = ({
  commissions,
  onCommissionsChange,
  valorViaje,
  costoCombustible = 0,
  otrosGastos = 0,
  usdUyuRate,
  commissionTypes = [TIPO_COMISION_CHOFER, 'Contratista', 'Flete', 'Operario', 'Cliente', 'Peaje', 'Otro'],
  choferNombre = '',
}) => {
  const [localCommissions, setLocalCommissions] = useState<Commission[]>(commissions);
  const [newCommission, setNewCommission] = useState<Commission>(emptyCommission());

  const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const toUyu = (monto: number, moneda?: Moneda) =>
    moneda === 'USD' ? monto * toNumber(usdUyuRate) : monto;

  useEffect(() => {
    setLocalCommissions(commissions);
  }, [commissions]);

  // Monto total de una comisión, siempre en UYU (mismo criterio que el backend)
  const calculateTotal = (comm: Commission): number => {
    const montoFijo = toNumber(comm.montoFijo);
    const porcentaje = toNumber(comm.porcentaje);
    const montoBase = toNumber(comm.montoBase);

    let total = 0;
    if (montoFijo > 0) {
      total = toUyu(montoFijo, comm.moneda);
    } else if (porcentaje > 0 && montoBase > 0) {
      total = (toUyu(montoBase, comm.moneda) * porcentaje) / 100;
    } else if (porcentaje > 0) {
      total = (toNumber(valorViaje) * porcentaje) / 100;
    }
    return Math.round(total * 100) / 100;
  };

  const addCommission = () => {
    if (!newCommission.tipo) return;

    // Con monto fijo, el porcentaje y el monto base no aplican: no guardarlos
    // para que no quede una comisión ambigua.
    const usaMontoFijo = toNumber(newCommission.montoFijo) > 0;
    const base: Commission = usaMontoFijo
      ? { ...newCommission, porcentaje: undefined, montoBase: undefined }
      : { ...newCommission, montoFijo: undefined };

    const commission: Commission = {
      id: `comm-${Date.now()}`,
      ...base,
      ...(esComisionChofer(base) ? { beneficiario: choferNombre } : {}),
      moneda: base.moneda === 'USD' ? 'USD' : 'UYU',
      montoTotal: calculateTotal(base),
      estado: 'pendiente',
    };

    const updated = [...localCommissions, commission];
    setLocalCommissions(updated);
    onCommissionsChange(updated);
    setNewCommission(emptyCommission());
  };

  const removeCommission = (id: string | undefined) => {
    if (!id) return;
    const updated = localCommissions.filter((c) => c.id !== id);
    setLocalCommissions(updated);
    onCommissionsChange(updated);
  };

  const updateCommission = (id: string | undefined, field: keyof Commission, value: unknown) => {
    if (!id) return;
    const updated = localCommissions.map((c) => {
      if (c.id === id) {
        const next = { ...c, [field]: value } as Commission;
        if (field === 'tipo' && esComisionChofer(next)) next.beneficiario = choferNombre;
        next.montoTotal = calculateTotal(next);
        return next;
      }
      return c;
    });
    setLocalCommissions(updated);
    onCommissionsChange(updated);
  };

  const parseOptional = (value: string): number | undefined => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  // Totales (todo en UYU). Los peajes no cancelados suman a gastos operativos, no a comisiones.
  const totalComisiones = sumComisiones(localCommissions);
  const totalPeajes = sumGastosOperativosComisiones(localCommissions);
  const gastosOperativos = toNumber(costoCombustible) + toNumber(otrosGastos) + totalPeajes;
  const gananciaAntesDeComisiones = toNumber(valorViaje) - gastosOperativos;
  const gananciaNetaFinal = gananciaAntesDeComisiones - totalComisiones;

  // Vista previa de la nueva comisión
  const newMoneda: Moneda = newCommission.moneda === 'USD' ? 'USD' : 'UYU';
  const newMontoFijo = toNumber(newCommission.montoFijo);
  const newPorcentaje = toNumber(newCommission.porcentaje);
  const newMontoBase = toNumber(newCommission.montoBase);
  const newTotalUyu = calculateTotal(newCommission);

  return (
    <div className="commissions-container">
      <div className="commissions-header">
        <h3>💰 Comisiones y Gastos</h3>
        <div className="commission-summary">
          <span className="summary-item">
            <strong>Valor Viaje:</strong> {formatMonto(toNumber(valorViaje), 'UYU')}
          </span>
          <span className="summary-item expense">
            <strong>Gastos Operativos:</strong> {formatMonto(gastosOperativos, 'UYU')}
          </span>
          <span className="summary-item">
            <strong>Antes de Comisiones:</strong> {formatMonto(gananciaAntesDeComisiones, 'UYU')}
          </span>
          <span className="summary-item highlight">
            <strong>Total Comisiones:</strong> {formatMonto(totalComisiones, 'UYU')}
          </span>
          <span className="summary-item net">
            <strong>Ganancia Neta Final:</strong> {formatMonto(gananciaNetaFinal, 'UYU')}
          </span>
        </div>
      </div>

      {localCommissions.length > 0 && (
        <div className="commissions-table-wrapper">
          <table className="commissions-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Moneda</th>
                <th>Monto Base</th>
                <th>Porcentaje</th>
                <th>Monto Fijo</th>
                <th>Total (UYU)</th>
                <th>Beneficiario</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {localCommissions.map((comm) => {
                const moneda: Moneda = comm.moneda === 'USD' ? 'USD' : 'UYU';
                return (
                  <tr key={comm.id} className="commission-row">
                    <td>
                      <select
                        value={comm.tipo}
                        onChange={(e) => updateCommission(comm.id, 'tipo', e.target.value)}
                        className="input-small"
                      >
                        {commissionTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={comm.concepto || ''}
                        onChange={(e) => updateCommission(comm.id, 'concepto', e.target.value)}
                        placeholder="Ej: Carga"
                        className="input-small"
                      />
                    </td>
                    <td>
                      <select
                        value={moneda}
                        onChange={(e) => updateCommission(comm.id, 'moneda', e.target.value)}
                        className="input-small"
                        aria-label="Moneda de la comisión"
                      >
                        <option value="UYU">UYU</option>
                        <option value="USD">USD</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={comm.montoBase ?? ''}
                        onChange={(e) => updateCommission(comm.id, 'montoBase', parseOptional(e.target.value))}
                        placeholder="0.00"
                        className="input-small"
                      />
                    </td>
                    <td>
                      <div className="input-with-symbol">
                        <input
                          type="number"
                          value={comm.porcentaje ?? ''}
                          onChange={(e) => updateCommission(comm.id, 'porcentaje', parseOptional(e.target.value))}
                          placeholder="0"
                          className="input-small"
                        />
                        <span>%</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={comm.montoFijo ?? ''}
                        onChange={(e) => updateCommission(comm.id, 'montoFijo', parseOptional(e.target.value))}
                        placeholder="0.00"
                        className="input-small"
                      />
                    </td>
                    <td className="total-cell">{formatMonto(toNumber(comm.montoTotal), 'UYU')}</td>
                    <td>
                      <input
                        type="text"
                        value={esComisionChofer(comm) ? choferNombre || comm.beneficiario || '' : comm.beneficiario || ''}
                        onChange={(e) => updateCommission(comm.id, 'beneficiario', e.target.value)}
                        placeholder={esComisionChofer(comm) ? 'Chofer del viaje' : 'Nombre'}
                        disabled={esComisionChofer(comm)}
                        title={esComisionChofer(comm) ? 'Se paga al chofer del viaje: va a sus jornadas y su salario' : undefined}
                        className="input-small"
                      />
                    </td>
                    <td>
                      <select
                        value={comm.estado || 'pendiente'}
                        onChange={(e) => updateCommission(comm.id, 'estado', e.target.value)}
                        className="input-small"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-delete-row"
                        onClick={() => removeCommission(comm.id)}
                        title="Eliminar comisión"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="add-commission-form">
        <h4>Agregar Nueva Comisión</h4>
        <div className="form-fields">
          <div className="form-field">
            <label>Tipo *</label>
            <select
              value={newCommission.tipo}
              onChange={(e) => setNewCommission({ ...newCommission, tipo: e.target.value })}
              className="form-input"
            >
              {commissionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Concepto</label>
            <input
              type="text"
              value={newCommission.concepto || ''}
              onChange={(e) => setNewCommission({ ...newCommission, concepto: e.target.value })}
              placeholder="Ej: Carga de grano"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label>Moneda</label>
            <select
              value={newMoneda}
              onChange={(e) => setNewCommission({ ...newCommission, moneda: e.target.value as Moneda })}
              className="form-input"
            >
              <option value="UYU">Pesos (UYU)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>

          <div className="form-field">
            <label>Monto Base</label>
            <input
              type="number"
              value={newCommission.montoBase ?? ''}
              onChange={(e) => setNewCommission({ ...newCommission, montoBase: parseOptional(e.target.value) })}
              placeholder="0.00"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label>Porcentaje (%)</label>
            <input
              type="number"
              value={newCommission.porcentaje ?? ''}
              onChange={(e) => setNewCommission({ ...newCommission, porcentaje: parseOptional(e.target.value) })}
              placeholder="0"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label>Monto Fijo</label>
            <input
              type="number"
              value={newCommission.montoFijo ?? ''}
              onChange={(e) => setNewCommission({ ...newCommission, montoFijo: parseOptional(e.target.value) })}
              placeholder="0.00"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label>Beneficiario</label>
            <input
              type="text"
              value={esComisionChofer(newCommission) ? choferNombre : newCommission.beneficiario || ''}
              onChange={(e) => setNewCommission({ ...newCommission, beneficiario: e.target.value })}
              placeholder={esComisionChofer(newCommission) ? 'Elegí el chofer del viaje' : 'Nombre del beneficiario'}
              disabled={esComisionChofer(newCommission)}
              className="form-input"
            />
            {esComisionChofer(newCommission) && (
              <small className="field-hint">Se suma a las jornadas y al salario del chofer.</small>
            )}
          </div>

          <button
            type="button"
            className="btn-add-commission"
            onClick={addCommission}
            disabled={newTotalUyu <= 0}
          >
            + Agregar Comisión
          </button>
        </div>

        {newMontoFijo > 0 ? (
          <div className="preview-total">
            <p>
              Monto fijo: {formatMonto(newMontoFijo, newMoneda)}
              {newMoneda === 'USD' && <> = <strong>{formatMonto(newTotalUyu, 'UYU')}</strong></>}
              {newPorcentaje > 0 && ' (el porcentaje no se aplica cuando hay monto fijo)'}
            </p>
          </div>
        ) : newPorcentaje > 0 ? (
          <div className="preview-total">
            <p>
              Cálculo:{' '}
              {newMontoBase > 0
                ? formatMonto(newMontoBase, newMoneda)
                : `${formatMonto(toNumber(valorViaje), 'UYU')} (valor del viaje)`}{' '}
              × {newPorcentaje}% = <strong>{formatMonto(newTotalUyu, 'UYU')}</strong>
            </p>
          </div>
        ) : null}
      </div>

      {localCommissions.length === 0 && (
        <div className="empty-commissions">
          <p>No hay comisiones agregadas. Agrega una para comenzar.</p>
        </div>
      )}
    </div>
  );
};

export default CommissionsTable;
