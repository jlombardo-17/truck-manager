import React, { useState } from 'react';
import '../styles/CommissionsTable.css';

interface Commission {
  id?: string;
  tipo: string;
  concepto?: string;
  montoBase?: number;
  porcentaje?: number;
  montoFijo?: number;
  montoTotal?: number;
  beneficiario?: string;
  estado?: string;
  notas?: string;
}

interface CommissionsTableProps {
  commissions: Commission[];
  onCommissionsChange: (commissions: Commission[]) => void;
  valorViaje: number;
  commissionTypes?: string[];
}

const CommissionsTable: React.FC<CommissionsTableProps> = ({
  commissions,
  onCommissionsChange,
  valorViaje,
  commissionTypes = ['Contratista', 'Flete', 'Operario', 'Cliente', 'Otro'],
}) => {
  const [localCommissions, setLocalCommissions] = useState<Commission[]>(commissions);
  const [newCommission, setNewCommission] = useState<Commission>({
    tipo: 'Contratista',
    porcentaje: 10,
  });

  // Calcular monto total de una comisión
  const calculateTotal = (comm: Commission): number => {
    if (comm.montoFijo) {
      return comm.montoFijo;
    }
    if (comm.porcentaje && comm.montoBase) {
      return (comm.montoBase * comm.porcentaje) / 100;
    }
    if (comm.porcentaje) {
      return (valorViaje * comm.porcentaje) / 100;
    }
    return 0;
  };

  // Agregar nueva comisión
  const addCommission = () => {
    if (!newCommission.tipo) {
      alert('Debes seleccionar un tipo de comisión');
      return;
    }

    const commission: Commission = {
      id: `comm-${Date.now()}`,
      ...newCommission,
      montoTotal: calculateTotal(newCommission),
      estado: 'pendiente',
    };

    const updated = [...localCommissions, commission];
    setLocalCommissions(updated);
    onCommissionsChange(updated);
    setNewCommission({ tipo: 'Contratista', porcentaje: 10 });
  };

  // Eliminar comisión
  const removeCommission = (id: string | undefined) => {
    if (!id) return;
    const updated = localCommissions.filter((c) => c.id !== id);
    setLocalCommissions(updated);
    onCommissionsChange(updated);
  };

  // Actualizar comisión
  const updateCommission = (id: string | undefined, field: string, value: any) => {
    if (!id) return;
    const updated = localCommissions.map((c) => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        updated.montoTotal = calculateTotal(updated);
        return updated;
      }
      return c;
    });
    setLocalCommissions(updated);
    onCommissionsChange(updated);
  };

  // Calcular total de comisiones
  const totalComisiones = localCommissions.reduce((sum, c) => sum + (c.montoTotal || 0), 0);

  return (
    <div className="commissions-container">
      <div className="commissions-header">
        <h3>💰 Comisiones y Gastos</h3>
        <div className="commission-summary">
          <span className="summary-item">
            <strong>Valor Viaje:</strong> ${Number(valorViaje || 0).toFixed(2)}
          </span>
          <span className="summary-item highlight">
            <strong>Total Comisiones:</strong> ${Number(totalComisiones || 0).toFixed(2)}
          </span>
          <span className="summary-item">
            <strong>Ganancia Neta:</strong> ${(Number(valorViaje || 0) - Number(totalComisiones || 0)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Tabla de comisiones existentes */}
      {localCommissions.length > 0 && (
        <div className="commissions-table-wrapper">
          <table className="commissions-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Monto Base</th>
                <th>Porcentaje</th>
                <th>Monto Fijo</th>
                <th>Total</th>
                <th>Beneficiario</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {localCommissions.map((comm) => (
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
                    <input
                      type="number"
                      value={comm.montoBase || ''}
                      onChange={(e) =>
                        updateCommission(comm.id, 'montoBase', parseFloat(e.target.value))
                      }
                      placeholder="0.00"
                      className="input-small"
                    />
                  </td>
                  <td>
                    <div className="input-with-symbol">
                      <input
                        type="number"
                        value={comm.porcentaje || ''}
                        onChange={(e) =>
                          updateCommission(comm.id, 'porcentaje', parseFloat(e.target.value))
                        }
                        placeholder="0"
                        className="input-small"
                      />
                      <span>%</span>
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={comm.montoFijo || ''}
                      onChange={(e) =>
                        updateCommission(comm.id, 'montoFijo', parseFloat(e.target.value))
                      }
                      placeholder="0.00"
                      className="input-small"
                    />
                  </td>
                  <td className="total-cell">${(comm.montoTotal || 0).toFixed(2)}</td>
                  <td>
                    <input
                      type="text"
                      value={comm.beneficiario || ''}
                      onChange={(e) =>
                        updateCommission(comm.id, 'beneficiario', e.target.value)
                      }
                      placeholder="Nombre"
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
                      className="btn-delete-row"
                      onClick={() => removeCommission(comm.id)}
                      title="Eliminar comisión"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulario para agregar nueva comisión */}
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
            <label>Monto Base</label>
            <input
              type="number"
              value={newCommission.montoBase || ''}
              onChange={(e) =>
                setNewCommission({
                  ...newCommission,
                  montoBase: parseFloat(e.target.value) || undefined,
                })
              }
              placeholder="0.00"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label>Porcentaje (%)</label>
            <input
              type="number"
              value={newCommission.porcentaje || ''}
              onChange={(e) =>
                setNewCommission({
                  ...newCommission,
                  porcentaje: parseFloat(e.target.value) || undefined,
                })
              }
              placeholder="0"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label>Monto Fijo</label>
            <input
              type="number"
              value={newCommission.montoFijo || ''}
              onChange={(e) =>
                setNewCommission({
                  ...newCommission,
                  montoFijo: parseFloat(e.target.value) || undefined,
                })
              }
              placeholder="0.00"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label>Beneficiario</label>
            <input
              type="text"
              value={newCommission.beneficiario || ''}
              onChange={(e) =>
                setNewCommission({ ...newCommission, beneficiario: e.target.value })
              }
              placeholder="Nombre del beneficiario"
              className="form-input"
            />
          </div>

          <button className="btn-add-commission" onClick={addCommission}>
            + Agregar Comisión
          </button>
        </div>

        {newCommission.porcentaje && (
          <div className="preview-total">
            <p>
              Cálculo: ${(newCommission.montoBase || valorViaje).toFixed(2)} × {newCommission.porcentaje}% ={' '}
              <strong>${((newCommission.montoBase || valorViaje) * newCommission.porcentaje / 100).toFixed(2)}</strong>
            </p>
          </div>
        )}
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
