import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'choferes' })
export class Chofer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numeroDocumento: string;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column()
  telefono: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  // Localidad donde reside; si trabaja fuera de ella corresponde viático
  @Column({ nullable: true })
  localidadResidencia: string;

  @Column({ type: 'date' })
  fechaIngreso: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: string; // YYYY-MM-DD

  @Column({ default: 'activo' })
  estado: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sueldoBase: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: 'Porcentaje de comisión sobre el valor del viaje' })
  porcentajeComision: number;

  // Costo mensual total para la empresa (sueldo + aportes patronales, aguinaldo, etc.).
  // Se carga a mano; es la referencia para precargar el costo empresa de cada salario
  // y para el costo del chofer en Reportes. No afecta lo que se le paga al chofer.
  @Column({ name: 'costo_empresa', type: 'decimal', precision: 12, scale: 2, nullable: true })
  costoEmpresa: number;

  @Column({ nullable: true })
  userId: number;

  @OneToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
