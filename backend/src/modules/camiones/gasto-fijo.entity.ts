import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Camion } from './camion.entity';

export enum TipoGastoFijo {
  SEGURO = 'seguro',
  PATENTE = 'patente',
  OTRO = 'otro',
}

export const MONEDAS_GASTO_FIJO = ['UYU', 'USD'] as const;
export type MonedaGastoFijo = (typeof MONEDAS_GASTO_FIJO)[number];

/**
 * Costo fijo anual de un camión (seguro, patente, etc.).
 * Los reportes lo prorratean por día (montoAnual / 365) dentro de la vigencia.
 * Sin vigenciaHasta se considera vigente indefinidamente.
 */
@Entity({ name: 'gastos_fijos' })
export class GastoFijo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Camion, (camion) => camion.id, { eager: false, onDelete: 'CASCADE' })
  camion: Camion;

  @Column()
  camionId: number;

  @Column({ type: 'enum', enum: TipoGastoFijo, default: TipoGastoFijo.OTRO })
  tipo: TipoGastoFijo;

  @Column({ nullable: true })
  concepto: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montoAnual: number;

  @Column({ type: 'varchar', length: 3, default: 'UYU' })
  moneda: MonedaGastoFijo;

  @Column({ type: 'date' })
  vigenciaDesde: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  vigenciaHasta: string | null; // YYYY-MM-DD

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
