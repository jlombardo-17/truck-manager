import { useEffect, useState } from 'react';
import {
  CreateRepostadaDto,
  Repostada,
  TipoCombustible,
  TipoCombustibleLabels,
} from '../types/repostada';
import { getTodayLocalInputValue, toDateInputValue } from '../utils/dateUtils';
import '../styles/Modal.css';

interface RepostadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRepostadaDto) => Promise<void>;
  isLoading?: boolean;
  initialData?: Repostada | null;
}

const getDefaultFormData = (): CreateRepostadaDto => ({
  tipoCombustible: TipoCombustible.DIESEL,
  fechaRepostada: getTodayLocalInputValue(),
  kmRecorridos: 0,
  litros: 0,
  consumoPromedio: 0,
});

const mapRepostadaToFormData = (repostada: Repostada): CreateRepostadaDto => ({
  tipoCombustible: repostada.tipoCombustible,
  fechaRepostada: toDateInputValue(repostada.fechaRepostada),
  kmRecorridos: Number(repostada.kmRecorridos) || 0,
  litros: Number(repostada.litros) || 0,
  consumoPromedio: Number(repostada.consumoPromedio) || 0,
  costo: repostada.costo != null ? Number(repostada.costo) : undefined,
  precioLitro: repostada.precioLitro != null ? Number(repostada.precioLitro) : undefined,
});

export function RepostadaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
}: RepostadaModalProps) {
  const [formData, setFormData] = useState<CreateRepostadaDto>(getDefaultFormData());

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData(mapRepostadaToFormData(initialData));
      return;
    }

    setFormData(getDefaultFormData());
  }, [initialData, isOpen]);

  const isEditing = Boolean(initialData);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else if (type === 'date') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Auto-calcular consumo promedio
  const handleKmOrLitrosChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    setFormData((prev) => {
      const updated = { ...prev, [name]: numValue };
      if (updated.litros > 0) {
        updated.consumoPromedio = updated.kmRecorridos / updated.litros;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData(getDefaultFormData());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Repostada' : 'Agregar Repostada'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              name="fechaRepostada"
              value={formData.fechaRepostada}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Combustible</label>
            <select
              name="tipoCombustible"
              value={formData.tipoCombustible}
              onChange={handleInputChange}
              required
            >
              {Object.entries(TipoCombustibleLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>KM Recorridos</label>
              <input
                type="number"
                name="kmRecorridos"
                placeholder="ej: 500"
                value={formData.kmRecorridos || ''}
                onChange={handleKmOrLitrosChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Litros</label>
              <input
                type="number"
                name="litros"
                placeholder="ej: 100.50"
                value={formData.litros || ''}
                onChange={handleKmOrLitrosChange}
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Consumo Promedio (KM/L)</label>
            <input
              type="number"
              name="consumoPromedio"
              value={Number(formData.consumoPromedio || 0).toFixed(2)}
              readOnly
              placeholder="Se calcula automáticamente"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Precio por Litro (Opcional)</label>
              <input
                type="number"
                name="precioLitro"
                placeholder="ej: 45.50"
                value={formData.precioLitro || ''}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Costo Total (Opcional)</label>
              <input
                type="number"
                name="costo"
                placeholder="ej: 4577.50"
                value={formData.costo || ''}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
