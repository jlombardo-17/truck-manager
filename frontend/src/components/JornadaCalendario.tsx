import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { Chofer } from '../types/chofer';
import {
  ChoferJornada,
  ViajeSugerido,
  categoriaJornadaColors,
  categoriaJornadaLabels,
} from '../types/jornada';
import { getTodayLocalInputValue, toDateInputValue } from '../utils/dateUtils';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_CHIPS = 6;

export const jornadaKey = (choferId: number, fecha: string) => `${choferId}|${fecha}`;

export const iniciales = (chofer: Pick<Chofer, 'nombre' | 'apellido'>) =>
  `${chofer.nombre.trim().charAt(0)}${chofer.apellido.trim().charAt(0)}`.toUpperCase();

interface JornadaCalendarioProps {
  mes: Date; // cualquier día del mes a mostrar
  choferes: Chofer[];
  jornadas: Map<string, ChoferJornada>;
  sugeridos: Map<string, ViajeSugerido>;
  seleccion: { desde: string; hasta: string } | null;
  onDayClick: (fecha: string, extenderSeleccion: boolean) => void;
}

const JornadaCalendario: React.FC<JornadaCalendarioProps> = ({
  mes,
  choferes,
  jornadas,
  sugeridos,
  seleccion,
  onDayClick,
}) => {
  const hoy = getTodayLocalInputValue();

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mes), { weekStartsOn: 1 });
    const fin = endOfWeek(endOfMonth(mes), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicio, end: fin });
  }, [mes]);

  return (
    <div className="jornadas-calendario" role="grid" aria-label="Calendario de jornadas">
      {DIAS_SEMANA.map((dia) => (
        <div key={dia} className="jornadas-calendario__dow" role="columnheader">
          {dia}
        </div>
      ))}

      {dias.map((dia) => {
        const fecha = toDateInputValue(dia);
        const fueraDeMes = !isSameMonth(dia, mes);
        const finDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
        const seleccionado = !!seleccion && fecha >= seleccion.desde && fecha <= seleccion.hasta;

        const items = choferes.map((chofer) => ({
          chofer,
          jornada: jornadas.get(jornadaKey(chofer.id, fecha)),
          sugerido: sugeridos.get(jornadaKey(chofer.id, fecha)),
        }));
        const visibles = items.filter((i) => i.jornada || i.sugerido);

        const classes = [
          'jornadas-calendario__dia',
          fueraDeMes && 'is-fuera',
          finDeSemana && 'is-finde',
          fecha === hoy && 'is-hoy',
          seleccionado && 'is-seleccionado',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={fecha}
            type="button"
            role="gridcell"
            className={classes}
            onClick={(e) => onDayClick(fecha, e.shiftKey)}
            aria-label={`${fecha}: ${visibles.length} registro(s)`}
          >
            <span className="jornadas-calendario__numero">{dia.getDate()}</span>
            <span className="jornadas-calendario__chips">
              {visibles.slice(0, MAX_CHIPS).map(({ chofer, jornada, sugerido }) => {
                if (jornada) {
                  const color = categoriaJornadaColors[jornada.categoria];
                  const cantViaticos = jornada.viaticos?.length ?? 0;
                  return (
                    <span
                      key={chofer.id}
                      className="jornada-chip"
                      style={{ background: color.bg, color: color.fg }}
                      title={`${chofer.nombre} ${chofer.apellido}: ${categoriaJornadaLabels[jornada.categoria]}${
                        jornada.lugarTrabajo ? ` (${jornada.lugarTrabajo})` : ''
                      }${cantViaticos ? ` · ${cantViaticos} viático(s)` : ''}`}
                    >
                      <strong>{iniciales(chofer)}</strong>
                      <span className="jornada-chip__cat">{categoriaJornadaLabels[jornada.categoria]}</span>
                      {cantViaticos > 0 && <span className="jornada-chip__viatico">$ {cantViaticos}</span>}
                    </span>
                  );
                }
                return (
                  <span
                    key={chofer.id}
                    className="jornada-chip jornada-chip--sugerido"
                    title={`${chofer.nombre} ${chofer.apellido}: viaje ${sugerido!.numeroViaje} a ${sugerido!.destino} (sin registrar)`}
                  >
                    <strong>{iniciales(chofer)}</strong>
                    <span className="jornada-chip__cat">Viaje</span>
                  </span>
                );
              })}
              {visibles.length > MAX_CHIPS && (
                <span className="jornada-chip jornada-chip--mas">+{visibles.length - MAX_CHIPS}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const rangoCalendario = (mes: Date): { desde: string; hasta: string } => ({
  desde: toDateInputValue(startOfWeek(startOfMonth(mes), { weekStartsOn: 1 })),
  hasta: toDateInputValue(endOfWeek(endOfMonth(mes), { weekStartsOn: 1 })),
});

export default JornadaCalendario;
