import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Chofer } from '../choferes/chofer.entity';
import { Viaje } from '../viajes/viaje.entity';
import { ChoferViatico } from './chofer-viatico.entity';

export enum CategoriaJornada {
  TRABAJADO = 'trabajado',
  LICENCIA = 'licencia',
  LICENCIA_MEDICA = 'licencia_medica',
  SIN_TRABAJAR = 'sin_trabajar',
  MANTENIMIENTO = 'mantenimiento',
  FERIADO = 'feriado',
  OTRO = 'otro',
}

@Entity({ name: 'chofer_jornada' })
@Unique('UQ_chofer_jornada_chofer_fecha', ['choferId', 'fecha'])
export class ChoferJornada {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chofer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chofer_id' })
  chofer: Chofer;

  @Column({ name: 'chofer_id' })
  choferId: number;

  // Fecha del día registrado (YYYY-MM-DD)
  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'enum', enum: CategoriaJornada })
  categoria: CategoriaJornada;

  // Localidad donde trabajó ese día (para decidir si corresponde viático)
  @Column({ name: 'lugar_trabajo', nullable: true })
  lugarTrabajo: string;

  @ManyToOne(() => Viaje, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'viaje_id' })
  viaje: Viaje;

  @Column({ name: 'viaje_id', nullable: true })
  viajeId: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @OneToMany(() => ChoferViatico, (viatico) => viatico.jornada, { cascade: false })
  viaticos: ChoferViatico[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
