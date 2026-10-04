import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Camion } from './camion.entity';
import { MantenimientoTipo } from './mantenimiento-tipo.entity';

export enum EstadoMantenimiento {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

@Entity('mantenimiento_registros')
export class MantenimientoRegistro {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Camion)
  @JoinColumn({ name: 'camionId' })
  camion: Camion;

  @Column()
  camionId: number;

  @ManyToOne(() => MantenimientoTipo)
  @JoinColumn({ name: 'tipoId' })
  tipo: MantenimientoTipo;

  @Column()
  tipoId: number;

  @Column({ type: 'varchar', length: 50, default: EstadoMantenimiento.PENDIENTE })
  estado: EstadoMantenimiento;

  @Column({ type: 'date' })
  fechaPrograma: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  fechaRealizado: string; // YYYY-MM-DD

  @Column({ type: 'int', nullable: true })
  kmActual: number;

  @Column({ type: 'int', nullable: true })
  proximoKm: number; // próximo KM cuando hacer mantenimiento

  @Column({ type: 'date', nullable: true })
  proximaFecha: string; // YYYY-MM-DD // próxima fecha cuando hacer mantenimiento

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoReal: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  taller: string; // nombre del taller que realizó el mantenimiento

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
