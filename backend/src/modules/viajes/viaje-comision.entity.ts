import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Viaje } from './viaje.entity';

/** Tipos de la tabla de comisiones que cuentan como gasto operativo del viaje, no como comisión. */
export const TIPOS_GASTO_OPERATIVO = ['peaje'];

/** Tipo de comisión que se le paga al chofer del viaje: va a sus jornadas y a su salario. */
export const TIPO_COMISION_CHOFER = 'chofer';

export const esComisionChofer = (comision: { tipo?: string | null }): boolean =>
  String(comision.tipo ?? '').trim().toLowerCase() === TIPO_COMISION_CHOFER;

/** Comisión de operario: se asigna a un chofer elegido (choferId), que la cobra en sus jornadas y salario. */
export const TIPO_COMISION_OPERARIO = 'operario';

export const esComisionOperario = (comision: { tipo?: string | null }): boolean =>
  String(comision.tipo ?? '').trim().toLowerCase() === TIPO_COMISION_OPERARIO;

/**
 * Chofer que cobra la comisión en sus jornadas: el del viaje para tipo "Chofer",
 * el asignado para tipo "Operario". null si la comisión no va a ningún chofer.
 */
export const choferQueCobraComision = (
  comision: { tipo?: string | null; choferId?: number | null },
  choferDelViajeId?: number | null,
): number | null => {
  if (esComisionChofer(comision)) return choferDelViajeId ? Number(choferDelViajeId) : null;
  if (esComisionOperario(comision)) return comision.choferId ? Number(comision.choferId) : null;
  return null;
};

export const esGastoOperativo =(comision: { tipo?: string | null }): boolean =>
  TIPOS_GASTO_OPERATIVO.includes(String(comision.tipo ?? '').trim().toLowerCase());

@Entity({ name: 'viajes_comisiones' })
export class ViajComision {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Viaje, (viaje) => viaje.comisiones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viaje_id' })
  viaje: Viaje;

  @Column()
  viajeId: number;

  // Tipo de comisión: 'chofer', 'contratista', 'flete', 'operario', 'cliente', 'acarreador', 'peaje', 'otro'
  @Column()
  tipo: string;

  // Descripción/concepto
  @Column({ nullable: true })
  concepto: string;

  // Monto base para calcular la comisión (si aplica porcentaje)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoBase: number;

  // Porcentaje de comisión (ej: 10 = 10%)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  porcentaje: number;

  // Monto fijo (alternativa a porcentaje)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoFijo: number;

  // Moneda de montoBase y montoFijo (tal como se ingresaron). Las filas
  // anteriores a esta columna tienen sus montos ya convertidos a UYU.
  @Column({ type: 'varchar', length: 3, default: 'UYU' })
  moneda: string;

  // Monto final calculado, siempre en UYU (lo suman reportes, dashboard y salarios)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montoTotal: number;

  // Beneficiario (usuario, nombre del contratista, etc)
  @Column({ nullable: true })
  beneficiario: string;

  // Chofer asignado (solo comisiones tipo "Operario"); beneficiario guarda su nombre para mostrar
  @Column({ name: 'chofer_id', type: 'int', nullable: true })
  choferId: number | null;

  // Estado: pendiente, pagado, cancelado
  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
