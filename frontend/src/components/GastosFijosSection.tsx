import React, { useEffect, useState } from 'react';
import gastosFijosService from '../services/gastosFijosService';
import {
  CreateGastoFijoDto,
  GastoFijo,
  MONEDAS_GASTO_FIJO,
  MonedaGastoFijo,
  TipoGastoFijo,
  TipoGastoFijoLabels,
} from '../types/gastoFijo';
import { formatDateForDisplay, getTodayLocalInputValue, toDateInputValue } from '../utils/dateUtils';

const formatMonto = (monto: number, moneda: MonedaGastoFijo = 'UYU') =>
  `${moneda === 'USD' ? 'US$' : '$'} ${Number(monto).toLocaleString('es-UY', { maximumFractionDigits: 2 })}`;

interface GastosFijosSectionProps {
  camionId: number;
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Gastos fijos anuales del camión (seguro, patente, ...).
 * Los reportes los prorratean por día dentro de la vigencia.
 */
const GastosFijosSection: React.FC<GastosFijosSectionProps> = ({ camionId, collapsed, onToggle }) => {
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GastoFijo | null>(null);

  const loadGastosFijos = async () => {
    try {
      setGastosFijos(await gastosFijosService.getByCamion(camionId));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar gastos fijos');
    }
  };

  useEffect(() => {
    loadGastosFijos();
  }, [camionId]);

  const handleDelete = async (gastoFijo: GastoFijo) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto fijo?')) return;
    try {
      await gastosFijosService.delete(gastoFijo.id, camionId);
      loadGastosFijos();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar gasto fijo');
    }
  };

  const getLabel = (gastoFijo: GastoFijo) => gastoFijo.concepto || TipoGastoFijoLabels[gastoFijo.tipo];

  return (
    <section className="info-section">
      <div className="section-header">
        <div className="section-title-toggle" onClick={onToggle}>
          <span className={`section-chevron${collapsed ? ' is-collapsed' : ''}`}>▼</span>
          <h2>📅 Gastos Fijos Anuales {gastosFijos.length > 0 && <span className="section-count">{gastosFijos.length}</span>}</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          + Agregar Gasto Fijo
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {collapsed ? (
        <div className="section-summary-line">
          {gastosFijos.length === 0 ? (
            <span className="summary-empty">Sin gastos fijos registrados</span>
          ) : (
            gastosFijos.slice(0, 3).map((gastoFijo) => (
              <span key={gastoFijo.id} className="summary-tag">{getLabel(gastoFijo)}</span>
            ))
          )}
        </div>
      ) : gastosFijos.length === 0 ? (
        <div className="empty-message">No hay gastos fijos registrados (seguro, patente, ...)</div>
      ) : (
        <div className="servicios-list">
          {gastosFijos.map((gastoFijo) => (
            <div key={gastoFijo.id} className="servicio-item">
              <div className="servicio-header">
                <span className="fecha">
                  {formatDateForDisplay(gastoFijo.vigenciaDesde, 'es-AR')} –{' '}
                  {gastoFijo.vigenciaHasta ? formatDateForDisplay(gastoFijo.vigenciaHasta, 'es-AR') : 'sin vencimiento'}
                </span>
                <div className="servicio-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(gastoFijo);
                      setShowModal(true);
                    }}
                    className="servicio-action-btn servicio-edit-btn"
                    title="Editar gasto fijo"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(gastoFijo)}
                    className="servicio-action-btn servicio-delete-btn"
                    title="Eliminar gasto fijo"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
              <div className="servicio-tipos">
                <span className="tag">{TipoGastoFijoLabels[gastoFijo.tipo]}</span>
              </div>
              {gastoFijo.concepto && <p className="descripcion">{gastoFijo.concepto}</p>}
              <div className="servicio-footer">
                <span className="km">Mensual: {formatMonto(Number(gastoFijo.montoAnual) / 12, gastoFijo.moneda)}</span>
                <span className="costo">{formatMonto(gastoFijo.montoAnual, gastoFijo.moneda)} / año</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <GastoFijoModal
          camionId={camionId}
          gastoFijo={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditing(null);
            loadGastosFijos();
          }}
        />
      )}
    </section>
  );
};

const GastoFijoModal: React.FC<{
  camionId: number;
  gastoFijo?: GastoFijo | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ camionId, gastoFijo, onClose, onSave }) => {
  const isEditing = !!gastoFijo;
  const [formData, setFormData] = useState({
    tipo: gastoFijo?.tipo ?? TipoGastoFijo.SEGURO,
    concepto: gastoFijo?.concepto ?? '',
    montoAnual: gastoFijo?.montoAnual != null ? String(gastoFijo.montoAnual) : '',
    moneda: gastoFijo?.moneda ?? ('UYU' as MonedaGastoFijo),
    vigenciaDesde: gastoFijo?.vigenciaDesde ? toDateInputValue(gastoFijo.vigenciaDesde) : getTodayLocalInputValue(),
    vigenciaHasta: gastoFijo?.vigenciaHasta ? toDateInputValue(gastoFijo.vigenciaHasta) : '',
    notas: gastoFijo?.notas ?? '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoAnual = Number(formData.montoAnual);
    if (!Number.isFinite(montoAnual) || montoAnual <= 0) {
      setError('Ingresá un monto anual mayor a 0');
      return;
    }
    if (formData.vigenciaHasta && formData.vigenciaHasta < formData.vigenciaDesde) {
      setError('La vigencia hasta no puede ser anterior a la vigencia desde');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Al editar, los campos vaciados se envían como null para que el backend los limpie
      const empty = isEditing ? null : undefined;
      const payload: CreateGastoFijoDto = {
        tipo: formData.tipo,
        concepto: formData.concepto || empty,
        montoAnual,
        moneda: formData.moneda,
        vigenciaDesde: formData.vigenciaDesde,
        vigenciaHasta: formData.vigenciaHasta || empty,
        notas: formData.notas || empty,
      };

      if (isEditing && gastoFijo) {
        await gastosFijosService.update(gastoFijo.id, camionId, payload);
      } else {
        await gastosFijosService.create(camionId, payload);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar gasto fijo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Gasto Fijo' : 'Agregar Gasto Fijo'}</h2>
          <button type="button" onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoGastoFijo })}
                disabled={isLoading}
              >
                {Object.values(TipoGastoFijo).map((tipo) => (
                  <option key={tipo} value={tipo}>{TipoGastoFijoLabels[tipo]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Concepto</label>
              <input
                type="text"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                placeholder="Ej: Seguro BSE, Patente 2026"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Monto anual</label>
              <input
                type="number"
                value={formData.montoAnual}
                onChange={(e) => setFormData({ ...formData, montoAnual: e.target.value })}
                step="0.01"
                min="0"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Moneda</label>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData({ ...formData, moneda: e.target.value as MonedaGastoFijo })}
                disabled={isLoading}
              >
                {MONEDAS_GASTO_FIJO.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vigencia desde</label>
              <input
                type="date"
                value={formData.vigenciaDesde}
                onChange={(e) => setFormData({ ...formData, vigenciaDesde: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Vigencia hasta (opcional)</label>
              <input
                type="date"
                value={formData.vigenciaHasta}
                onChange={(e) => setFormData({ ...formData, vigenciaHasta: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              disabled={isLoading}
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar Gasto Fijo' : 'Guardar Gasto Fijo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GastosFijosSection;
