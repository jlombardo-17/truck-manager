import React, { useMemo, useState } from 'react';
import { Chofer } from '../types/chofer';
import {
  CategoriaJornada,
  ChoferJornada,
  SalarioAfectado,
  ViajeSugerido,
  ViaticoTipo,
  categoriaJornadaLabels,
  correspondeViatico,
} from '../types/jornada';
import jornadasService from '../services/jornadasService';
import { formatDateForDisplay } from '../utils/dateUtils';
import { jornadaKey } from './JornadaCalendario';
import '../styles/Modal.css';

interface ViaticoForm {
  viaticoTipoId: number | '';
  concepto: string;
  cantidad: string;
  monto: string; // unitario
}

interface JornadaForm {
  categoria: CategoriaJornada | '';
  lugarTrabajo: string;
  observaciones: string;
  viajeId: number | null;
  viaticos: ViaticoForm[];
  dirty: boolean;
}

interface JornadaDiaDialogProps {
  fecha: string;
  choferes: Chofer[];
  jornadas: Map<string, ChoferJornada>;
  sugeridos: Map<string, ViajeSugerido>;
  tiposViatico: ViaticoTipo[]; // incluye inactivos, para mostrar los ya usados
  onClose: () => void;
  onSaved: (salarios: SalarioAfectado[]) => void;
}

const formDesdeJornada = (jornada?: ChoferJornada): JornadaForm => ({
  categoria: jornada?.categoria ?? '',
  lugarTrabajo: jornada?.lugarTrabajo ?? '',
  observaciones: jornada?.observaciones ?? '',
  viajeId: jornada?.viajeId ?? null,
  viaticos: (jornada?.viaticos ?? []).map((v) => ({
    viaticoTipoId: v.viaticoTipoId ?? '',
    concepto: v.concepto,
    cantidad: String(v.cantidad ?? 1),
    monto: String(Number(v.monto)),
  })),
  dirty: false,
});

const formatUYU = (monto: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(monto);

const JornadaDiaDialog: React.FC<JornadaDiaDialogProps> = ({
  fecha,
  choferes,
  jornadas,
  sugeridos,
  tiposViatico,
  onClose,
  onSaved,
}) => {
  const [forms, setForms] = useState<Record<number, JornadaForm>>(() =>
    Object.fromEntries(choferes.map((c) => [c.id, formDesdeJornada(jornadas.get(jornadaKey(c.id, fecha)))])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const tiposActivos = useMemo(() => tiposViatico.filter((t) => t.activo), [tiposViatico]);

  const updateForm = (choferId: number, patch: Partial<JornadaForm>) =>
    setForms((prev) => ({ ...prev, [choferId]: { ...prev[choferId], ...patch, dirty: true } }));

  const updateViatico = (choferId: number, index: number, patch: Partial<ViaticoForm>) => {
    const viaticos = forms[choferId].viaticos.map((v, i) => (i === index ? { ...v, ...patch } : v));
    updateForm(choferId, { viaticos });
  };

  const agregarViatico = (choferId: number) => {
    const tipo = tiposActivos[0];
    const nuevo: ViaticoForm = tipo
      ? { viaticoTipoId: tipo.id, concepto: tipo.nombre, cantidad: '1', monto: String(Number(tipo.montoDefault)) }
      : { viaticoTipoId: '', concepto: '', cantidad: '1', monto: '' };
    updateForm(choferId, { viaticos: [...forms[choferId].viaticos, nuevo] });
  };

  const cambiarTipo = (choferId: number, index: number, value: string) => {
    if (!value) {
      updateViatico(choferId, index, { viaticoTipoId: '' });
      return;
    }
    const tipo = tiposViatico.find((t) => t.id === Number(value));
    if (tipo) {
      updateViatico(choferId, index, {
        viaticoTipoId: tipo.id,
        concepto: tipo.nombre,
        monto: String(Number(tipo.montoDefault)),
      });
    }
  };

  const usarSugerencia = (choferId: number, sugerido: ViajeSugerido) =>
    updateForm(choferId, {
      categoria: CategoriaJornada.TRABAJADO,
      lugarTrabajo: sugerido.destino.trim(),
      viajeId: sugerido.viajeId,
    });

  const validar = (): string | null => {
    for (const chofer of choferes) {
      const form = forms[chofer.id];
      if (!form.dirty) continue;
      if (!form.categoria && form.viaticos.length > 0) {
        return `${chofer.nombre} ${chofer.apellido}: seleccioná una categoría o quitá los viáticos.`;
      }
      for (const v of form.viaticos) {
        if (!v.concepto.trim()) return `${chofer.nombre} ${chofer.apellido}: todos los viáticos necesitan un concepto.`;
        const cantidad = Number(v.cantidad);
        if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
          return `${chofer.nombre} ${chofer.apellido}: la cantidad de cada viático debe ser un entero entre 1 y 99.`;
        }
        if (!(Number(v.monto) > 0)) return `${chofer.nombre} ${chofer.apellido}: el monto de cada viático debe ser mayor a 0.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setSaving(true);
    setError('');
    const salarios: SalarioAfectado[] = [];
    try {
      for (const chofer of choferes) {
        const form = forms[chofer.id];
        if (!form.dirty) continue;
        const existente = jornadas.get(jornadaKey(chofer.id, fecha));

        if (!form.categoria) {
          if (existente) {
            const res = await jornadasService.delete(existente.id);
            if (res.salario) salarios.push(res.salario);
          }
          continue;
        }

        const res = await jornadasService.upsert({
          choferId: chofer.id,
          fecha,
          categoria: form.categoria,
          lugarTrabajo: form.lugarTrabajo.trim() || undefined,
          viajeId: form.viajeId ?? undefined,
          observaciones: form.observaciones.trim() || undefined,
          viaticos: form.viaticos.map((v) => ({
            viaticoTipoId: v.viaticoTipoId === '' ? undefined : v.viaticoTipoId,
            concepto: v.concepto.trim(),
            cantidad: Number(v.cantidad),
            monto: Number(v.monto),
          })),
        });
        if (res.salario) salarios.push(res.salario);
      }
      onSaved(salarios);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(' · ') : message || 'Error al guardar las jornadas');
    } finally {
      setSaving(false);
    }
  };

  const hayCambios = choferes.some((c) => forms[c.id].dirty);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content jornada-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Jornada del {formatDateForDisplay(fecha, 'es-UY')}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-form">
          {choferes.map((chofer) => {
            const form = forms[chofer.id];
            const sugerido = sugeridos.get(jornadaKey(chofer.id, fecha));
            const sugiereViatico =
              correspondeViatico(form.categoria || CategoriaJornada.OTRO, form.lugarTrabajo, chofer.localidadResidencia) &&
              form.viaticos.length === 0;
            const cantidadViaticos = form.viaticos.reduce((acc, v) => acc + (Number(v.cantidad) || 0), 0);
            const totalViaticos = form.viaticos.reduce(
              (acc, v) => acc + (Number(v.cantidad) || 0) * (Number(v.monto) || 0),
              0,
            );

            return (
              <section key={chofer.id} className="jornada-dialog__chofer">
                <header className="jornada-dialog__chofer-header">
                  <h3>
                    {chofer.nombre} {chofer.apellido}
                  </h3>
                  <span className="jornada-dialog__residencia">
                    Reside en: {chofer.localidadResidencia || <em>sin cargar</em>}
                  </span>
                </header>

                {sugerido && !form.categoria && (
                  <div className="jornada-alert jornada-alert--info">
                    Tenía el viaje <strong>{sugerido.numeroViaje}</strong> ({sugerido.origen} → {sugerido.destino}).
                    <button type="button" className="btn-link" onClick={() => usarSugerencia(chofer.id, sugerido)}>
                      Marcar como trabajado
                    </button>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`categoria-${chofer.id}`}>Categoría</label>
                    <select
                      id={`categoria-${chofer.id}`}
                      value={form.categoria}
                      onChange={(e) => updateForm(chofer.id, { categoria: e.target.value as CategoriaJornada | '' })}
                    >
                      <option value="">— Sin registro —</option>
                      {Object.values(CategoriaJornada).map((cat) => (
                        <option key={cat} value={cat}>
                          {categoriaJornadaLabels[cat]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor={`lugar-${chofer.id}`}>Lugar de trabajo</label>
                    <input
                      id={`lugar-${chofer.id}`}
                      type="text"
                      value={form.lugarTrabajo}
                      placeholder="Localidad"
                      disabled={!form.categoria}
                      onChange={(e) => updateForm(chofer.id, { lugarTrabajo: e.target.value })}
                    />
                  </div>
                </div>

                {sugiereViatico && (
                  <div className="jornada-alert jornada-alert--warning">
                    Trabajó fuera de su localidad de residencia: corresponde viático.
                    <button type="button" className="btn-link" onClick={() => agregarViatico(chofer.id)}>
                      + Agregar viático
                    </button>
                  </div>
                )}
                {form.categoria === CategoriaJornada.TRABAJADO && !chofer.localidadResidencia && (
                  <p className="jornada-hint">
                    Cargá la localidad de residencia en la ficha del chofer para que se sugieran viáticos.
                  </p>
                )}

                {form.categoria && (
                  <div className="jornada-viaticos">
                    <div className="jornada-viaticos__header">
                      <span>
                        Viáticos
                        {form.viaticos.length > 0 && ` · ${cantidadViaticos} · ${formatUYU(totalViaticos)}`}
                      </span>
                      <button type="button" className="btn-link" onClick={() => agregarViatico(chofer.id)}>
                        + Agregar
                      </button>
                    </div>
                    {form.viaticos.length > 0 && (
                      <div className="jornada-viaticos__row jornada-viaticos__row--head" aria-hidden="true">
                        <span>Tipo</span>
                        <span>Concepto</span>
                        <span>Cant.</span>
                        <span>Monto c/u</span>
                        <span />
                      </div>
                    )}
                    {form.viaticos.map((v, i) => {
                      const opciones = tiposViatico.filter((t) => t.activo || t.id === v.viaticoTipoId);
                      return (
                        <div key={i} className="jornada-viaticos__row">
                          <select
                            aria-label="Tipo de viático"
                            value={v.viaticoTipoId}
                            onChange={(e) => cambiarTipo(chofer.id, i, e.target.value)}
                          >
                            <option value="">Manual</option>
                            {opciones.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nombre}
                              </option>
                            ))}
                          </select>
                          <input
                            aria-label="Concepto"
                            type="text"
                            value={v.concepto}
                            placeholder="Concepto"
                            onChange={(e) => updateViatico(chofer.id, i, { concepto: e.target.value })}
                          />
                          <input
                            aria-label="Cantidad"
                            title="Cantidad"
                            type="number"
                            min="1"
                            max="99"
                            step="1"
                            value={v.cantidad}
                            onChange={(e) => updateViatico(chofer.id, i, { cantidad: e.target.value })}
                          />
                          <input
                            aria-label="Monto unitario (UYU)"
                            title="Monto unitario (UYU)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={v.monto}
                            placeholder="Monto c/u"
                            onChange={(e) => updateViatico(chofer.id, i, { monto: e.target.value })}
                          />
                          <button
                            type="button"
                            className="jornada-viaticos__remove"
                            aria-label="Quitar viático"
                            onClick={() =>
                              updateForm(chofer.id, { viaticos: form.viaticos.filter((_, idx) => idx !== i) })
                            }
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {form.categoria && (
                  <div className="form-group">
                    <label htmlFor={`obs-${chofer.id}`}>Observaciones</label>
                    <textarea
                      id={`obs-${chofer.id}`}
                      rows={2}
                      value={form.observaciones}
                      onChange={(e) => updateForm(chofer.id, { observaciones: e.target.value })}
                    />
                  </div>
                )}
              </section>
            );
          })}

          {error && <div className="jornada-alert jornada-alert--error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !hayCambios}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JornadaDiaDialog;
