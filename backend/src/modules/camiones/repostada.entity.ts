import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Camion } from './camion.entity';

export enum TipoCombustible {
  NAFTA = 'nafta',
  DIESEL = 'diesel',
  GAS = 'gas',
  GNC = 'gnc',
  BIODIESEL = 'biodiesel',
  ETANOL = 'etanol',
}

@Entity({ name: 'repostadas' })
export class Repostada {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Camion, (camion) => camion.id, { eager: false })
  camion: Camion;

  @Column()
  camionId: number;

  @Column({ type: 'enum', enum: TipoCombustible })
  tipoCombustible: TipoCombustible;

  @Column({ type: 'date' })
  fechaRepostada: Date;

  @Column()
  kmRecorridos: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  litros: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  consumoPromedio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costo: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  precioLitro: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
