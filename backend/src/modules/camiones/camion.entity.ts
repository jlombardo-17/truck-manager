import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Servicio } from './servicio.entity';
import { Documento } from './documento.entity';

@Entity({ name: 'camiones' })
export class Camion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  patente: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  @Column({ default: 'activo' })
  estado: string;

  @Column({ name: 'odometro_km', type: 'decimal', precision: 10, scale: 2, default: 0 })
  odometroKm: number;

  @OneToMany(() => Servicio, (servicio) => servicio.camionId, { cascade: true })
  servicios: Servicio[];

  @OneToMany(() => Documento, (documento) => documento.camionId, { cascade: true })
  documentos: Documento[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
