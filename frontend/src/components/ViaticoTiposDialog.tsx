import React, { useState } from 'react';
import { ViaticoTipo } from '../types/jornada';
import viaticoTiposService from '../services/viaticoTiposService';
import '../styles/Modal.css';

interface ViaticoTiposDialogProps {
  tipos: ViaticoTipo[];
  onClose: () => void;
  onChanged: () => void;
}

interface FilaEdicion {
  nombre: string;
  montoDefault: string;
}

const ViaticoTiposDialog: React.FC<ViaticoTiposDialogProps> = ({ tipos, onClose, onChanged }) => {
  const [edicion, setEdicion] = useState<Record<number, FilaEdicion>>({});
  const [nuevo, setNuevo] = useState<FilaEdicion>({ nombre: '', montoDefault: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setSaving(true);
    setError('');
    try {
      await accion();
      onChanged();
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(' · ') : message || 'Error al guardar el tipo de viático');
    } finally {
      setSaving(false);
    }
  };

  const valida = (fila: FilaEdicion) => fila.nombre.trim() !== '' && Number(fila.montoDefault) >= 0 && fila.montoDefault !== '';

  const guardarEdicion = (tipo: ViaticoTipo) => {
    const fila = edicion[tipo.id];
    if (!valida(fila)) {
      setError('Completá nombre y un monto mayor o igual a 0.');
      return;
    }
    ejecutar(async () => {
      await viaticoTiposService.update(tipo.id, { nombre: fila.nombre.trim(), montoDefault: Number(fila.montoDefault) });
      setEdicion(({ [tipo.id]: _, ...rest }) => rest);
    });
  };

  const crear = () => {
    if (!valida(nuevo)) {
      setError('Completá nombre y un monto mayor o igual a 0.');
      return;
    }
    ejecutar(async () => {
      await viaticoTiposService.create({ nombre: nuevo.nombre.trim(), montoDefault: Number(nuevo.montoDefault) });
      setNuevo({ nombre: '', montoDefault: '' });
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Tipos de viático</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-form">
          <p className="jornada-hint">
            El monto se precarga al registrar un viático y se puede ajustar en cada caso. Montos en UYU.
          </p>

          <table className="viatico-tipos-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Monto por defecto</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => {
                const fila = edicion[tipo.id];
                return (
                  <tr key={tipo.id} className={tipo.activo ? undefined : 'is-inactivo'}>
                    <td>
                      {fila ? (
                        <input
                          aria-label="Nombre"
                          value={fila.nombre}
                          onChange={(e) => setEdicion({ ...edicion, [tipo.id]: { ...fila, nombre: e.target.value } })}
                        />
                      ) : (
                        tipo.nombre
                      )}
                    </td>
                    <td>
                      {fila ? (
                        <input
                          aria-label="Monto por defecto"
                          type="number"
                          min="0"
                          step="0.01"
                          value={fila.montoDefault}
                          onChange={(e) =>
                            setEdicion({ ...edicion, [tipo.id]: { ...fila, montoDefault: e.target.value } })
                          }
                        />
                      ) : (
                        `$ ${Number(tipo.montoDefault).toLocaleString('es-UY')}`
                      )}
                    </td>
                    <td>{tipo.activo ? 'Activo' : 'Inactivo'}</td>
                    <td className="viatico-tipos-table__acciones">
                      {fila ? (
                        <>
                          <button type="button" className="btn-link" disabled={saving} onClick={() => guardarEdicion(tipo)}>
                            Guardar
                          </button>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setEdicion(({ [tipo.id]: _, ...rest }) => rest)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() =>
                              setEdicion({
                                ...edicion,
                                [tipo.id]: { nombre: tipo.nombre, montoDefault: String(Number(tipo.montoDefault)) },
                              })
                            }
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-link"
                            disabled={saving}
                            onClick={() => ejecutar(() => viaticoTiposService.update(tipo.id, { activo: !tipo.activo }))}
                          >
                            {tipo.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td>
                  <input
                    aria-label="Nombre del nuevo tipo"
                    placeholder="Ej. Almuerzo"
                    value={nuevo.nombre}
                    onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    aria-label="Monto por defecto del nuevo tipo"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={nuevo.montoDefault}
                    onChange={(e) => setNuevo({ ...nuevo, montoDefault: e.target.value })}
                  />
                </td>
                <td />
                <td className="viatico-tipos-table__acciones">
                  <button type="button" className="btn-link" disabled={saving} onClick={crear}>
                    + Agregar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          {error && <div className="jornada-alert jornada-alert--error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViaticoTiposDialog;
