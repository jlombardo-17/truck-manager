import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Viaje } from './viaje.entity';

@Entity({ name: 'viajes_comisiones' })
export class ViajComision {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Viaje, (viaje) => viaje.comisiones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viaje_id' })
  viaje: Viaje;

  @Column()
  viajeId: number;

  // Tipo de comisión: 'contratista', 'flete', 'operario', 'cliente', 'otro'
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

  // Monto final calculado
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montoTotal: number;

  // Beneficiario (usuario, nombre del contratista, etc)
  @Column({ nullable: true })
  beneficiario: string;

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
