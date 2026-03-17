import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Camion } from './camion.entity';

export const TIPOS_COMBINACION = [
  'camion_rigido',
  'camion_acoplado',
  'tractor_semirremolque',
  'camion_zorra',
  'camion_dolly_semirremolque',
  'tractor_dolly_semirremolque',
] as const;

export type TipoCombinacion = (typeof TIPOS_COMBINACION)[number];

export const TIPOS_SECCION = [
  'tractora',
  'camion',
  'semirremolque',
  'zorra',
  'acoplado',
  'dolly',
] as const;

export type TipoSeccion = (typeof TIPOS_SECCION)[number];

export interface SeccionVehicularData {
  /** 'tractora' | 'camion' | 'semirremolque' | 'zorra' | 'acoplado' | 'dolly' */
  tipo: TipoSeccion;
  ejes: number;
  largoM?: number;
  anchoM?: number;
  altoM?: number;
  /** Peso de la sección sin carga, en kg */
  pesoVacioKg?: number;
  /** Capacidad máxima de carga de la sección, en kg */
  capacidadCargaKg?: number;
}

@Entity({ name: 'configuraciones_vehiculares' })
export class ConfiguracionVehicular {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Camion)
  @JoinColumn({ name: 'camion_id' })
  camion: Camion;

  @Column({ name: 'camion_id', unique: true })
  camionId: number;

  @Column({ type: 'varchar', length: 60 })
  tipoCombinacion: string;

  @Column({ type: 'json' })
  secciones: SeccionVehicularData[];

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
