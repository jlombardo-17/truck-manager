import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChoferSalario } from './chofer-salario.entity';

export enum TipoPagoSalario {
  ADELANTO = 'adelanto',
  LIQUIDACION = 'liquidacion',
}

@Entity({ name: 'choferes_salarios_pagos' })
export class ChoferSalarioPago {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChoferSalario, (salario) => salario.pagos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'salario_id' })
  salario: ChoferSalario;

  @Column({ name: 'salario_id' })
  salarioId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ type: 'date', name: 'fecha_pago' })
  fechaPago: Date;

  @Column({ name: 'metodo_pago' })
  metodoPago: string;

  @Column({
    type: 'enum',
    enum: TipoPagoSalario,
    default: TipoPagoSalario.ADELANTO,
  })
  tipo: TipoPagoSalario;

  @Column({ nullable: true })
  comprobante: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
