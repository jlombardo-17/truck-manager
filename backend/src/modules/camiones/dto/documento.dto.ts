import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { IsDateOnly } from '../../../common/utils/date-only';
import { TipoDocumento } from '../documento.entity';
import { Type } from 'class-transformer';

export class CreateDocumentoDto {
  @IsEnum(TipoDocumento)
  tipo: TipoDocumento;

  @IsOptional()
  @IsString()
  rutaArchivo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rutasArchivos?: string[];

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsDateOnly()
  fechaVencimiento?: string;
}

export class UpdateDocumentoDto {
  @IsOptional()
  @IsEnum(TipoDocumento)
  tipo?: TipoDocumento;

  @IsOptional()
  @IsString()
  rutaArchivo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rutasArchivos?: string[];

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsDateOnly()
  fechaVencimiento?: string;
}
