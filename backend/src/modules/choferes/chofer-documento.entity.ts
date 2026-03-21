import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Chofer } from './chofer.entity';

export enum TipoDocumentoChofer {
  LICENCIA_CONDUCIR = 'licencia_conducir',
  CEDULA_IDENTIDAD = 'cedula_identidad',
  CARNET_SALUD = 'carnet_salud',
  CERTIFICADO_ANTECEDENTES = 'certificado_antecedentes',
  CERTIFICADO_CONDUCIR_PROFESIONAL = 'certificado_conducir_profesional',
  SEGURO_VIDA = 'seguro_vida',
  CONTRATO_TRABAJO = 'contrato_trabajo',
  OTRO = 'otro',
}

@Entity({ name: 'chofer_documentos' })
export class ChoferDocumento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chofer, (chofer) => chofer.id, { eager: false })
  chofer: Chofer;

  @Column()
  choferId: number;

  @Column({ type: 'enum', enum: TipoDocumentoChofer })
  tipo: TipoDocumentoChofer;

  @Column({ nullable: true })
  nombre: string;

  @Column({ type: 'longtext' })
  rutaArchivo: string;

  @Column({ type: 'simple-json', nullable: true })
  rutasArchivos?: string[];

  @Column({ nullable: true })
  descripcion: string;

  @Column({ type: 'date', nullable: true })
  fechaEmision: Date;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento: Date;

  @Column({ nullable: true })
  numeroDocumento: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
