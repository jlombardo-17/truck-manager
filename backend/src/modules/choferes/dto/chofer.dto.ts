import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsDateOnly } from '../../../common/utils/date-only';

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

  @IsOptional()
  @IsString()
  localidadResidencia?: string;

  @IsNotEmpty()
  @IsDateOnly()
  fechaIngreso: string;

  @IsOptional()
  @IsDateOnly()
  fechaNacimiento?: string;

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
  @IsString()
  localidadResidencia?: string;

  @IsOptional()
  @IsDateOnly()
  fechaIngreso?: string;

  @IsOptional()
  @IsDateOnly()
  fechaNacimiento?: string;

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
