import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoMantenimiento } from '../mantenimiento-registro.entity';

export class CreateMantenimientoTipoDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsString()
  intervaloBase: string;

  @IsOptional()
  @IsNumber()
  intervaloKm?: number;

  @IsOptional()
  @IsNumber()
  intervaloDias?: number;

  @IsOptional()
  @IsNumber()
  costoEstimado?: number;
}

export class UpdateMantenimientoTipoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  intervaloBase?: string;

  @IsOptional()
  @IsNumber()
  intervaloKm?: number;

  @IsOptional()
  @IsNumber()
  intervaloDias?: number;

  @IsOptional()
  @IsNumber()
  costoEstimado?: number;

  @IsOptional()
  activo?: boolean;
}

export class CreateMantenimientoRegistroDto {
  @IsNotEmpty()
  @IsNumber()
  camionId: number;

  @IsNotEmpty()
  @IsNumber()
  tipoId: number;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  fechaPrograma: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaRealizado?: Date;

  @IsOptional()
  @IsNumber()
  kmActual?: number;

  @IsOptional()
  @IsNumber()
  proximoKm?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  proximaFecha?: Date;

  @IsOptional()
  @IsNumber()
  costoReal?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  taller?: string;
}

export class UpdateMantenimientoRegistroDto {
  @IsOptional()
  @IsEnum(EstadoMantenimiento)
  estado?: EstadoMantenimiento;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaPrograma?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaRealizado?: Date;

  @IsOptional()
  @IsNumber()
  kmActual?: number;

  @IsOptional()
  @IsNumber()
  proximoKm?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  proximaFecha?: Date;

  @IsOptional()
  @IsNumber()
  costoReal?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  taller?: string;
}
