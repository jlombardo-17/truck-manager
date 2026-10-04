import { IsEnum, IsIn, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { IsDateOnly } from '../../../common/utils/date-only';
import { MONEDAS_SERVICIO, MonedaServicio, TipoServicio } from '../servicio.entity';

export class CreateServicioDto {
  @IsDateOnly('La fecha debe ser una fecha válida (YYYY-MM-DD)')
  fechaServicio: string;

  @IsArray()
  @IsEnum(TipoServicio, { each: true })
  tipos: TipoServicio[];

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  costo?: number;

  @IsOptional()
  @IsIn(MONEDAS_SERVICIO)
  moneda?: MonedaServicio;

  @IsOptional()
  @IsNumber()
  kilometraje?: number;
}

export class UpdateServicioDto {
  @IsOptional()
  @IsDateOnly('La fecha debe ser una fecha válida (YYYY-MM-DD)')
  fechaServicio?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TipoServicio, { each: true })
  tipos?: TipoServicio[];

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  costo?: number;

  @IsOptional()
  @IsIn(MONEDAS_SERVICIO)
  moneda?: MonedaServicio;

  @IsOptional()
  @IsNumber()
  kilometraje?: number;
}
