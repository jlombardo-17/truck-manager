import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { TipoServicio } from '../servicio.entity';
import { Type } from 'class-transformer';

export class CreateServicioDto {
  @Type(() => Date)
  @IsDate()
  fechaServicio: Date;

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
  @IsNumber()
  kilometraje?: number;
}

export class UpdateServicioDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaServicio?: Date;

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
  @IsNumber()
  kilometraje?: number;
}
