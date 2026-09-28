import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChoferJornada } from './chofer-jornada.entity';
import { ViaticoTipo } from './viatico-tipo.entity';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
