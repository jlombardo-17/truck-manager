import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Camion } from './camion.entity';

export enum TipoServicio {
  CAMBIO_ACEITE = 'cambio_aceite',
  FILTRO_ACEITE = 'filtro_aceite',
  FILTRO_AIRE = 'filtro_aire',
  FILTRO_GASOIL = 'filtro_gasoil',
  ROTACION_CUBIERTAS = 'rotacion_cubiertas',
  ALINEACION = 'alineacion',
  REVISION_GENERAL = 'revision_general',
  REPARACION = 'reparacion',
  OTRO = 'otro',
}

@Entity({ name: 'servicios' })
export class Servicio {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Camion, (camion) => camion.id, { eager: false })
  camion: Camion;

  @Column()
  camionId: number;

  @Column({ type: 'date' })
  fechaServicio: Date;

  @Column({ type: 'json' })
  tipos: TipoServicio[];

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costo: number;

  @Column({ nullable: true })
  kilometraje: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
