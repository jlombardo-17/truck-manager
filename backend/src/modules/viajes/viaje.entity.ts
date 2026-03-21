import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import { Camion } from '../camiones/camion.entity';
import { Chofer } from '../choferes/chofer.entity';
import { ViajRuta } from './viaje-ruta.entity';
import { ViajComision } from './viaje-comision.entity';

@Entity({ name: 'viajes' })
export class Viaje {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numeroViaje: string;

  // Relaciones
  @ManyToOne(() => Camion, { cascade: false, eager: true })
  @JoinColumn({ name: 'camion_id' })
  camion: Camion;

  @RelationId((viaje: Viaje) => viaje.camion)
  camionId: number;

  @ManyToOne(() => Chofer, { cascade: false, eager: true })
  @JoinColumn({ name: 'chofer_id' })
  chofer: Chofer;

  @RelationId((viaje: Viaje) => viaje.chofer)
  choferId: number;

  // Fechas
  @Column({ type: 'datetime' })
  fechaInicio: Date;

  @Column({ type: 'datetime', nullable: true })
  fechaFin: Date;

  // Ubicaciones
  @Column()
  origen: string;

  @Column()
  destino: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitudOrigen: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitudOrigen: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitudDestino: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitudDestino: number;

  // Información de la carga
  @Column({ type: 'text', nullable: true })
  descripcionCarga: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  pesoCargaKg: number;

  // Valores económicos
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valorViaje: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  kmRecorridos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  consumoCombustible: number; // Litros

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoCombustible: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otrosGastos: number;

  // Estado
  @Column({ default: 'en_progreso' })
  estado: string; // en_progreso, completado, cancelado

  @Column({ type: 'text', nullable: true })
  notas: string;

  // Relaciones one-to-many
  @OneToMany(() => ViajRuta, (ruta) => ruta.viaje, { cascade: true, eager: true })
  rutas: ViajRuta[];

  @OneToMany(() => ViajComision, (comision) => comision.viaje, { cascade: true, eager: true })
  comisiones: ViajComision[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
