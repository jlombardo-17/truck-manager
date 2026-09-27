import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMonths, format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import AppNavbar from '../components/AppNavbar';
import BackButton from '../components/BackButton';
import JornadaCalendario, { iniciales, jornadaKey, rangoCalendario } from '../components/JornadaCalendario';
import JornadaDiaDialog from '../components/JornadaDiaDialog';
import ViaticoTiposDialog from '../components/ViaticoTiposDialog';
import choferesService from '../services/choferesService';
import jornadasService from '../services/jornadasService';
import viaticoTiposService from '../services/viaticoTiposService';
import { Chofer, EstadoChofer } from '../types/chofer';
import {
  CategoriaJornada,
  ChoferJornada,
  ResumenJornadasChofer,
  SalarioAfectado,
  ViajeSugerido,
  ViaticoTipo,
  categoriaJornadaColors,
  categoriaJornadaLabels,
} from '../types/jornada';
import { formatDateForDisplay } from '../utils/dateUtils';
import '../styles/Modal.css';
import '../styles/Jornadas.css';

const formatUYU = (monto: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(monto);

interface BulkForm {
  desde: string;
  hasta: string;
  categoria: CategoriaJornada;
  lugarTrabajo: string;
}

const Jornadas: React.FC = () => {
  const navigate = useNavigate();

  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [mes, setMes] = useState<Date>(() => startOfMonth(new Date()));
  const [jornadas, setJornadas] = useState<ChoferJornada[]>([]);
  const [sugeridos, setSugeridos] = useState<ViajeSugerido[]>([]);
  const [resumen, setResumen] = useState<ResumenJornadasChofer[]>([]);
  const [tiposViatico, setTiposViatico] = useState<ViaticoTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avisos, setAvisos] = useState<string[]>([]);

  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [ancla, setAncla] = useState<string | null>(null);
  const [bulk, setBulk] = useState<BulkForm | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [showTipos, setShowTipos] = useState(false);

  const choferesSeleccionados = useMemo(
    () => choferes.filter((c) => seleccionados.includes(c.id)),
    [choferes, seleccionados],
  );
  const choferPorId = useMemo(() => new Map(choferes.map((c) => [c.id, c])), [choferes]);
  const jornadasMap = useMemo(
    () => new Map(jornadas.map((j) => [jornadaKey(j.choferId, j.fecha), j])),
    [jornadas],
  );
  const sugeridosMap = useMemo(
    () => new Map(sugeridos.map((s) => [jornadaKey(s.choferId, s.fecha), s])),
    [sugeridos],
  );

  const handleError = (err: any, fallback: string) => {
    if (err.response?.status === 401) {
      navigate('/login');
      return;
    }
    const message = err.response?.data?.message;
    setError(Array.isArray(message) ? message.join(' · ') : message || fallback);
  };

  const cargarTipos = useCallback(async () => {
    try {
      setTiposViatico(await viaticoTiposService.getAll(true));
    } catch (err) {
      handleError(err, 'Error al cargar los tipos de viático');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await choferesService.getAll();
        const activos = data
          .filter((c) => c.estado === EstadoChofer.ACTIVO)
          .sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`));
        setChoferes(activos);
        setSeleccionados(activos.map((c) => c.id));
      } catch (err) {
        handleError(err, 'Error al cargar los choferes');
      } finally {
        setLoading(false);
      }
    })();
    cargarTipos();
  }, [cargarTipos]);

  const cargarMes = useCallback(async () => {
    if (seleccionados.length === 0) {
      setJornadas([]);
      setSugeridos([]);
      setResumen([]);
      return;
    }
    const { desde, hasta } = rangoCalendario(mes);
    try {
      setError('');
      const [rango, res] = await Promise.all([
        jornadasService.getByRango(seleccionados, desde, hasta),
        jornadasService.getResumen(seleccionados, mes.getFullYear(), mes.getMonth() + 1),
      ]);
      setJornadas(rango.jornadas);
      setSugeridos(rango.viajesSugeridos);
      setResumen(res);
    } catch (err) {
      handleError(err, 'Error al cargar las jornadas');
    }
  }, [mes, seleccionados]);

  useEffect(() => {
    cargarMes();
  }, [cargarMes]);

  const toggleChofer = (id: number) =>
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const avisosDeSalarios = (salarios: SalarioAfectado[]): string[] =>
    salarios.map((s) => {
      const chofer = choferPorId.get(s.choferId);
      const nombre = chofer ? `${chofer.nombre} ${chofer.apellido}` : `Chofer #${s.choferId}`;
      return s.actualizado
        ? `Se actualizaron los viáticos del salario ${s.mes}/${s.anio} de ${nombre}.`
        : `El salario ${s.mes}/${s.anio} de ${nombre} está ${s.estado}: los cambios en viáticos no se aplicaron a la liquidación.`;
    });

  const handleDayClick = (fecha: string, extender: boolean) => {
    if (loading) return;
    if (seleccionados.length === 0) {
      setError('Seleccioná al menos un chofer.');
      return;
    }
    if (!modoSeleccion && !extender) {
      setDiaAbierto(fecha);
      return;
    }
    if (!ancla) {
      setAncla(fecha);
      return;
    }
    const [desde, hasta] = ancla <= fecha ? [ancla, fecha] : [fecha, ancla];
    setBulk({ desde, hasta, categoria: CategoriaJornada.TRABAJADO, lugarTrabajo: '' });
  };

  const cerrarBulk = () => {
    setBulk(null);
    setAncla(null);
  };

  const aplicarBulk = async () => {
    if (!bulk) return;
    setBulkSaving(true);
    try {
      const res = await jornadasService.bulk({
        choferIds: seleccionados,
        desde: bulk.desde,
        hasta: bulk.hasta,
        categoria: bulk.categoria,
        lugarTrabajo: bulk.lugarTrabajo.trim() || undefined,
      });
      setAvisos([`Se registraron ${res.procesadas} jornada(s).`, ...avisosDeSalarios(res.salarios)]);
      cerrarBulk();
      setModoSeleccion(false);
      await cargarMes();
    } catch (err) {
      handleError(err, 'Error al aplicar la categoría');
    } finally {
      setBulkSaving(false);
    }
  };

  const seleccionActual = bulk
    ? { desde: bulk.desde, hasta: bulk.hasta }
    : ancla
      ? { desde: ancla, hasta: ancla }
      : null;

  const resumenTotales = resumen.reduce(
    (acc, r) => ({ viaticos: acc.viaticos + r.totalViaticos, cantidad: acc.cantidad + r.cantidadViaticos }),
    { viaticos: 0, cantidad: 0 },
  );

  return (
    <div className="jornadas-container">
      <AppNavbar />

      <div className="page-back-button-container">
        <BackButton label="Volver al Dashboard" to="/dashboard" variant="ghost" />
      </div>

      <div className="jornadas-content">
        <div className="jornadas-header">
          <div>
            <h1>Jornadas y viáticos</h1>
            <p>Registrá qué hizo cada chofer cada día y los viáticos correspondientes.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setShowTipos(true)}>
            Tipos de viático
          </button>
        </div>

        {error && (
          <div className="jornada-alert jornada-alert--error" role="alert">
            {error}
          </div>
        )}
        {avisos.length > 0 && (
          <div className="jornada-alert jornada-alert--info" role="status">
            <ul>
              {avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <button type="button" className="btn-link" onClick={() => setAvisos([])}>
              Cerrar
            </button>
          </div>
        )}

        <div className="jornadas-filtros">
          <div className="jornadas-filtros__choferes" aria-label="Filtrar choferes">
            {loading && <span className="jornada-hint">Cargando choferes…</span>}
            {choferes.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chofer-toggle ${seleccionados.includes(c.id) ? 'is-activo' : ''}`}
                aria-pressed={seleccionados.includes(c.id)}
                onClick={() => toggleChofer(c.id)}
              >
                <span className="chofer-toggle__iniciales">{iniciales(c)}</span>
                {c.nombre.trim()} {c.apellido}
              </button>
            ))}
            {choferes.length > 1 && (
              <>
                <button type="button" className="btn-link" onClick={() => setSeleccionados(choferes.map((c) => c.id))}>
                  Todos
                </button>
                <button type="button" className="btn-link" onClick={() => setSeleccionados([])}>
                  Ninguno
                </button>
              </>
            )}
          </div>

          <div className="jornadas-filtros__mes">
            <button type="button" className="btn-secondary" aria-label="Mes anterior" onClick={() => setMes((m) => addMonths(m, -1))}>
              ◀
            </button>
            <span className="jornadas-filtros__mes-label">{format(mes, 'MMMM yyyy', { locale: es })}</span>
            <button type="button" className="btn-secondary" aria-label="Mes siguiente" onClick={() => setMes((m) => addMonths(m, 1))}>
              ▶
            </button>
            <button type="button" className="btn-link" onClick={() => setMes(startOfMonth(new Date()))}>
              Hoy
            </button>
          </div>
        </div>

        <div className="jornadas-toolbar">
          <div className="jornadas-leyenda">
            {Object.values(CategoriaJornada).map((cat) => (
              <span
                key={cat}
                className="jornada-chip"
                style={{ background: categoriaJornadaColors[cat].bg, color: categoriaJornadaColors[cat].fg }}
              >
                {categoriaJornadaLabels[cat]}
              </span>
            ))}
            <span className="jornada-chip jornada-chip--sugerido">Viaje sin registrar</span>
          </div>
          <button
            type="button"
            className={modoSeleccion ? 'btn-primary' : 'btn-secondary'}
            aria-pressed={modoSeleccion}
            onClick={() => {
              setModoSeleccion((v) => !v);
              setAncla(null);
            }}
          >
            {modoSeleccion ? 'Cancelar selección' : 'Marcar rango de días'}
          </button>
        </div>
        {(modoSeleccion || ancla) && (
          <p className="jornada-hint">
            {ancla
              ? `Desde ${formatDateForDisplay(ancla, 'es-UY')}: hacé click en el último día del rango.`
              : 'Hacé click en el primer día del rango (también podés usar Shift + click).'}
          </p>
        )}

        <JornadaCalendario
          mes={mes}
          choferes={choferesSeleccionados}
          jornadas={jornadasMap}
          sugeridos={sugeridosMap}
          seleccion={seleccionActual}
          onDayClick={handleDayClick}
        />

        <section className="jornadas-resumen">
          <h2>Resumen de {format(mes, 'MMMM yyyy', { locale: es })}</h2>
          {resumen.length === 0 ? (
            <p className="jornada-hint">Seleccioná choferes para ver el resumen.</p>
          ) : (
            <div className="jornadas-resumen__scroll">
              <table className="jornadas-resumen__table">
                <thead>
                  <tr>
                    <th>Chofer</th>
                    {Object.values(CategoriaJornada).map((cat) => (
                      <th key={cat}>{categoriaJornadaLabels[cat]}</th>
                    ))}
                    <th>Viáticos</th>
                    <th>Total viáticos</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.map((r) => (
                    <tr key={r.choferId}>
                      <td className="bold">
                        {r.nombre.trim()} {r.apellido}
                      </td>
                      {Object.values(CategoriaJornada).map((cat) => (
                        <td key={cat}>{r.dias[cat] || '—'}</td>
                      ))}
                      <td>{r.cantidadViaticos || '—'}</td>
                      <td>{formatUYU(r.totalViaticos)}</td>
                    </tr>
                  ))}
                </tbody>
                {resumen.length > 1 && (
                  <tfoot>
                    <tr>
                      <td colSpan={Object.values(CategoriaJornada).length + 1}>Total</td>
                      <td>{resumenTotales.cantidad}</td>
                      <td>{formatUYU(resumenTotales.viaticos)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </section>
      </div>

      {diaAbierto && (
        <JornadaDiaDialog
          fecha={diaAbierto}
          choferes={choferesSeleccionados}
          jornadas={jornadasMap}
          sugeridos={sugeridosMap}
          tiposViatico={tiposViatico}
          onClose={() => setDiaAbierto(null)}
          onSaved={async (salarios) => {
            setDiaAbierto(null);
            setAvisos(avisosDeSalarios(salarios));
            await cargarMes();
          }}
        />
      )}

      {bulk && (
        <div className="modal-overlay" onClick={cerrarBulk}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>Marcar rango de días</h2>
              <button type="button" className="modal-close" onClick={cerrarBulk} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="modal-form">
              <p className="jornada-hint">
                Se aplicará a {choferesSeleccionados.length} chofer(es):{' '}
                {choferesSeleccionados.map((c) => `${c.nombre.trim()} ${c.apellido}`).join(', ')}. Los viáticos ya
                registrados se conservan.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bulk-desde">Desde</label>
                  <input
                    id="bulk-desde"
                    type="date"
                    value={bulk.desde}
                    onChange={(e) => setBulk({ ...bulk, desde: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bulk-hasta">Hasta</label>
                  <input
                    id="bulk-hasta"
                    type="date"
                    value={bulk.hasta}
                    onChange={(e) => setBulk({ ...bulk, hasta: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bulk-categoria">Categoría</label>
                  <select
                    id="bulk-categoria"
                    value={bulk.categoria}
                    onChange={(e) => setBulk({ ...bulk, categoria: e.target.value as CategoriaJornada })}
                  >
                    {Object.values(CategoriaJornada).map((cat) => (
                      <option key={cat} value={cat}>
                        {categoriaJornadaLabels[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="bulk-lugar">Lugar de trabajo (opcional)</label>
                  <input
                    id="bulk-lugar"
                    type="text"
                    value={bulk.lugarTrabajo}
                    onChange={(e) => setBulk({ ...bulk, lugarTrabajo: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={cerrarBulk} disabled={bulkSaving}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={aplicarBulk}
                  disabled={bulkSaving || !bulk.desde || !bulk.hasta || bulk.desde > bulk.hasta}
                >
                  {bulkSaving ? 'Aplicando…' : 'Aplicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTipos && (
        <ViaticoTiposDialog tipos={tiposViatico} onClose={() => setShowTipos(false)} onChanged={cargarTipos} />
      )}
    </div>
  );
};

export default Jornadas;
