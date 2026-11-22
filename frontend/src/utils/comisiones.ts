/**
 * Tipos que se cargan en la tabla "Comisiones y Gastos" del viaje pero cuentan
 * como gasto operativo, no como comisión. Mismo criterio que el backend
 * (TIPOS_GASTO_OPERATIVO en viaje-comision.entity.ts).
 */
export const TIPOS_GASTO_OPERATIVO = ['peaje'];

type ComisionLike = { tipo?: string | null; estado?: string | null; montoTotal?: number | string | null };

export const esGastoOperativo = (comision: ComisionLike): boolean =>
  TIPOS_GASTO_OPERATIVO.includes(String(comision.tipo ?? '').trim().toLowerCase());

const monto = (comision: ComisionLike): number => {
  const parsed = Number(comision.montoTotal);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Total de comisiones propiamente dichas (excluye peajes). */
export const sumComisiones = (comisiones: ComisionLike[]): number =>
  comisiones.filter((c) => !esGastoOperativo(c)).reduce((sum, c) => sum + monto(c), 0);

/** Total de peajes no cancelados, que suman a gastos operativos. */
export const sumGastosOperativosComisiones = (comisiones: ComisionLike[]): number =>
  comisiones
    .filter((c) => esGastoOperativo(c) && c.estado !== 'cancelado')
    .reduce((sum, c) => sum + monto(c), 0);
