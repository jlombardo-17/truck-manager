import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChoferJornada } from './chofer-jornada.entity';
import { ViaticoTipo } from './viatico-tipo.entity';
import { TipoViatico } from './tipo-viatico.enum';
import { Viaje } from '../viajes/viaje.entity';

@Entity({ name: 'chofer_viatico' })
export class ChoferViatico {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChoferJornada, (jornada) => jornada.viaticos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jornada_id' })
  jornada: ChoferJornada;

  @Column({ name: 'jornada_id' })
  jornadaId: number;

  @ManyToOne(() => ViaticoTipo, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'viatico_tipo_id' })
  viaticoTipo: ViaticoTipo;

  @Column({ name: 'viatico_tipo_id', nullable: true })
  viaticoTipoId: number;

  @Column({ type: 'enum', enum: TipoViatico, default: TipoViatico.VIATICO })
  tipo: TipoViatico;

  @Column()
  concepto: string;

  // Cantidad de viáticos de este concepto en el día
  @Column({ type: 'int', default: 1 })
  cantidad: number;

  // Monto unitario en UYU (total de la línea = cantidad * monto)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  // Si está seteado, la línea se generó desde las comisiones tipo "Chofer" de ese viaje:
  // se mantiene sola al guardar el viaje y no se edita desde Jornadas.
  @ManyToOne(() => Viaje, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'viaje_id' })
  viaje: Viaje;

  @Column({ name: 'viaje_id', type: 'int', nullable: true })
  viajeId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
