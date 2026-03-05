import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mantenimiento_tipos')
export class MantenimientoTipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 50 })
  intervaloBase: string; // ej: "3 meses", "6 meses", "1 año", "10000 km"

  @Column({ type: 'int', nullable: true })
  intervaloKm: number; // intervalo en km

  @Column({ type: 'int', nullable: true })
  intervaloDias: number; // intervalo en días

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costoEstimado: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
