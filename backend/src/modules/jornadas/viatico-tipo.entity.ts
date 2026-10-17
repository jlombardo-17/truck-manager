import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TipoViatico } from './tipo-viatico.enum';

@Entity({ name: 'viatico_tipo' })
export class ViaticoTipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  // Tipo que se asigna a la línea al usar esta plantilla
  @Column({ type: 'enum', enum: TipoViatico, default: TipoViatico.VIATICO })
  tipo: TipoViatico;

  // Monto sugerido en UYU; se puede ajustar al registrar el viático
  @Column({ name: 'monto_default', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montoDefault: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
