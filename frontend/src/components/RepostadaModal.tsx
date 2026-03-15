import { useState } from 'react';
import { CreateRepostadaDto, TipoCombustible, TipoCombustibleLabels } from '../types/repostada';
import '../styles/Modal.css';

interface RepostadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRepostadaDto) => Promise<void>;
  isLoading?: boolean;
}

export function RepostadaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: RepostadaModalProps) {
  const [formData, setFormData] = useState<CreateRepostadaDto>({
    tipoCombustible: TipoCombustible.DIESEL,
    fechaRepostada: new Date().toISOString().split('T')[0],
    kmRecorridos: 0,
    litros: 0,
    consumoPromedio: 0,
  });

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
    setFormData({
      tipoCombustible: TipoCombustible.DIESEL,
      fechaRepostada: new Date().toISOString().split('T')[0],
      kmRecorridos: 0,
      litros: 0,
      consumoPromedio: 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Agregar Repostada</h2>
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
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
