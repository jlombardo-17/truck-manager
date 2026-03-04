import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Viaje } from './viaje.entity';

@Entity({ name: 'viajes_rutas' })
export class ViajRuta {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Viaje, (viaje) => viaje.rutas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viaje_id' })
  viaje: Viaje;

  @Column()
  viajeId: number;

  @Column()
  orden: number; // Orden del punto en la ruta

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitud: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  longitud: number;

  @Column({ nullable: true })
  direccion: string;

  @Column({ type: 'datetime', nullable: true })
  tiempo: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  odometroKm: number;

  @Column({ nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
