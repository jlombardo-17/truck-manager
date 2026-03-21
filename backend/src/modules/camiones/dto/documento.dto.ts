import { IsArray, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
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
  @Type(() => Date)
  @IsDate()
  fechaVencimiento?: Date;
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
  @Type(() => Date)
  @IsDate()
  fechaVencimiento?: Date;
}
