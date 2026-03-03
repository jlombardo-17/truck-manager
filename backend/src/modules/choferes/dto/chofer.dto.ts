import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChoferDto {
  @IsNotEmpty()
  @IsString()
  numeroDocumento: string;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  apellido: string;

  @IsNotEmpty()
  @IsString()
  telefono: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  fechaIngreso: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaNacimiento?: Date;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  sueldoBase?: number;

  @IsOptional()
  porcentajeComision?: number;

  @IsOptional()
  userId?: number;
}

export class UpdateChoferDto {
  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaIngreso?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaNacimiento?: Date;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  sueldoBase?: number;

  @IsOptional()
  porcentajeComision?: number;

  @IsOptional()
  userId?: number;
}
