import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsDateString } from 'class-validator';

/**
 * Helpers para columnas `type: 'date'` (fecha sin hora).
 *
 * TypeORM persiste un `Date` en una columna DATE usando los componentes de la
 * zona horaria LOCAL del servidor, y al leer siempre devuelve un string
 * 'YYYY-MM-DD'. Si se pasa `new Date('2026-10-01')` (medianoche UTC) con el
 * servidor en UTC-3, se guarda '2026-09-30'. Por eso estas fechas se manejan
 * siempre como string 'YYYY-MM-DD' de punta a punta.
 */

const DATE_ONLY_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

// Zona horaria del negocio para calcular "hoy" (el servidor puede correr en UTC)
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Montevideo';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Normaliza a 'YYYY-MM-DD'. Para strings ('YYYY-MM-DD' o ISO completo) toma la
 * parte de fecha tal cual; para `Date` usa la fecha en la zona del negocio.
 */
export function toDateOnly(value: string | Date | null | undefined): string | null {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);
  }

  const match = String(value).trim().match(DATE_ONLY_PREFIX_REGEX);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/**
 * Convierte 'YYYY-MM-DD' a un Date a medianoche LOCAL (no UTC como `new Date('YYYY-MM-DD')`).
 * Útil para lógica que usa getFullYear/getMonth/getDate (ej. agrupar por mes).
 */
export function parseDateOnly(fecha: string): Date {
  const match = String(fecha).match(DATE_ONLY_PREFIX_REGEX);
  if (!match) return new Date(NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/*
 * Fechas de viaje (viajes.fechaInicio / fechaFin, columnas DATETIME).
 *
 * Se cargan desde un input de fecha y se guardan con `new Date('YYYY-MM-DD')`, o sea
 * medianoche UTC del día, en cualquier servidor (el driver preserva el instante; en un
 * MySQL en UTC-3 el valor crudo queda como 21:00 del día anterior). Por eso el día del
 * viaje es SIEMPRE la fecha UTC: leerlo en hora local o de Montevideo lo corre un día.
 */

/** Día ('YYYY-MM-DD') de una fecha de viaje. */
export function fechaViajeDateOnly(value: string | Date | null | undefined): string | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/** Fecha de viaje como medianoche LOCAL de su día (para agrupar con getFullYear/getMonth/getDate). */
export function fechaViajeComoLocal(value: string | Date | null | undefined): Date {
  const fecha = fechaViajeDateOnly(value);
  return fecha ? parseDateOnly(fecha) : new Date(NaN);
}

/**
 * Convierte un rango de días calendario expresado en Dates locales (p. ej. del 1 al 30 a
 * las 23:59 locales) a los límites para filtrar fechas de viaje: medianoche UTC del primer
 * día hasta el último instante UTC del último día.
 */
export function rangoFechaViaje(desde: Date, hasta: Date): { desde: Date; hasta: Date } {
  return {
    desde: new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate())),
    hasta: new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999)),
  };
}

/** Fecha de hoy ('YYYY-MM-DD') en la zona horaria del negocio. */
export function todayDateOnly(): string {
  return toDateOnly(new Date()) as string;
}

/** Suma (o resta) días a una fecha 'YYYY-MM-DD' sin pasar por zonas horarias. */
export function addDaysDateOnly(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + dias));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Días calendario entre dos fechas 'YYYY-MM-DD' (hasta - desde). */
export function diffDaysDateOnly(desde: string, hasta: string): number {
  const toUtc = (f: string) => {
    const [y, m, d] = f.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(hasta) - toUtc(desde)) / (1000 * 60 * 60 * 24));
}

/**
 * Valida y normaliza un campo de DTO a 'YYYY-MM-DD'.
 * Acepta 'YYYY-MM-DD' o ISO completo (se recorta a la fecha). '' se convierte a null.
 * Combinar con @IsOptional() o @IsNotEmpty() según corresponda.
 */
export function IsDateOnly(message = 'La fecha debe ser una fecha válida (YYYY-MM-DD)') {
  return applyDecorators(
    Transform(({ value }) => (value == null || value === '' ? null : toDateOnly(value) ?? value)),
    IsDateString({ strict: true }, { message }),
  );
}
