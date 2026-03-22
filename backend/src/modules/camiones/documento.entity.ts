import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Camion } from './camion.entity';

export enum TipoDocumento {
  SEGURO = 'seguro',
  LIBRETA_PROPIEDAD = 'libreta_propiedad',
  REVISION_TECNICA = 'revision_tecnica',
  MATRICULA = 'matricula',
  PERMISOS = 'permisos',
  OTRO = 'otro',
}

@Entity({ name: 'documentos' })
export class Documento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Camion, (camion) => camion.id, { eager: false })
  camion: Camion;

  @Column()
  camionId: number;

  @Column({ type: 'enum', enum: TipoDocumento })
  tipo: TipoDocumento;

  @Column({ nullable: true })
  nombre: string;

  @Column({ type: 'longtext' })
  rutaArchivo: string;

  @Column({
    type: 'longtext',
    nullable: true,
    transformer: {
      to: (value: string[] | undefined | null) => (value != null ? JSON.stringify(value) : null),
      from: (value: string | null) => {
        if (!value) return [];
        try { return JSON.parse(value) as string[]; } catch { return []; }
      },
    },
  })
  rutasArchivos?: string[];

  @Column({ nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costo?: number;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
