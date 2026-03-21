import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chofer } from './chofer.entity';
import { ChoferSalarioPago } from './chofer-salario-pago.entity';

export enum EstadoSalario {
  PENDIENTE = 'pendiente',
  PAGADO = 'pagado',
  CANCELADO = 'cancelado',
}

@Entity({ name: 'choferes_salarios' })
export class ChoferSalario {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chofer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chofer_id' })
  chofer: Chofer;

  @Column({ name: 'chofer_id' })
  choferId: number;

  // Período: mes (1-12)
  @Column()
  mes: number;

  // Período: año (YYYY)
  @Column()
  anio: number;

  // Salario base del chofer
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  salarioBase: number;

  // Total de comisiones de viajes del mes
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalComisiones: number;

  // Bonos adicionales (productividad, puntualidad, etc.)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonos: number;

  // Deducciones (préstamos, adelantos, multas, etc.)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deducciones: number;

  // Salario neto = salario_base + total_comisiones + bonos - deducciones
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  salarioNeto: number;

  // Estado del salario
  @Column({
    type: 'enum',
    enum: EstadoSalario,
    default: EstadoSalario.PENDIENTE,
  })
  estado: EstadoSalario;

  // Fecha en que se realizó el pago
  @Column({ type: 'date', nullable: true, name: 'fecha_pago' })
  fechaPago: Date;

  // Observaciones del período
  @Column({ type: 'text', nullable: true })
  observaciones: string;

  // Método de pago: efectivo, transferencia, cheque
  @Column({ nullable: true, name: 'metodo_pago' })
  metodoPago: string;

  // Comprobante de pago (número de transferencia, cheque, recibo)
  @Column({ nullable: true })
  comprobante: string;

  @OneToMany(() => ChoferSalarioPago, (pago) => pago.salario, {
    cascade: false,
    eager: false,
  })
  pagos: ChoferSalarioPago[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
