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

  @Column({ type: 'date' })
  fechaIngreso: Date;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: Date;

  @Column({ default: 'activo' })
  estado: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sueldoBase: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: 'Porcentaje de comisión sobre el valor del viaje' })
  porcentajeComision: number;

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
