import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { IsDateOnly } from '../../../common/utils/date-only';
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
  @IsDateOnly()
  fechaPrograma: string;

  @IsOptional()
  @IsDateOnly()
  fechaRealizado?: string;

  @IsOptional()
  @IsNumber()
  kmActual?: number;

  @IsOptional()
  @IsNumber()
  proximoKm?: number;

  @IsOptional()
  @IsDateOnly()
  proximaFecha?: string;

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
  @IsDateOnly()
  fechaPrograma?: string;

  @IsOptional()
  @IsDateOnly()
  fechaRealizado?: string;

  @IsOptional()
  @IsNumber()
  kmActual?: number;

  @IsOptional()
  @IsNumber()
  proximoKm?: number;

  @IsOptional()
  @IsDateOnly()
  proximaFecha?: string;

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
