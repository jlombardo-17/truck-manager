const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDatePreservingDay = (value?: string | Date | null): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = String(value).trim();
  const match = trimmed.match(DATE_ONLY_REGEX);

  // For yyyy-MM-dd values, parse in local timezone to avoid day shift.
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateForDisplay = (
  value?: string | Date | null,
  locale: string = 'es-AR',
): string => {
  const parsed = parseDatePreservingDay(value);
  if (!parsed) return 'Sin fecha';
  return parsed.toLocaleDateString(locale);
};

export const toDateInputValue = (value?: string | Date | null): string => {
  const parsed = parseDatePreservingDay(value);
  if (!parsed) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Días calendario desde hoy hasta la fecha dada (negativo si ya pasó).
 * Compara a medianoche local, así una fecha 'YYYY-MM-DD' de hoy devuelve 0.
 */
export const getDaysUntil = (value?: string | Date | null): number | null => {
  const parsed = parseDatePreservingDay(value);
  if (!parsed) return null;

  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const getTodayLocalInputValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
