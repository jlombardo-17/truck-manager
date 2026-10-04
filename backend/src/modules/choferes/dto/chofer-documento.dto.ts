import { IsArray, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { IsDateOnly } from '../../../common/utils/date-only';
import { TipoDocumentoChofer } from '../chofer-documento.entity';

export class CreateChoferDocumentoDto {
  @IsNumber()
  choferId: number;

  @IsEnum(TipoDocumentoChofer)
  tipo: TipoDocumentoChofer;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  rutaArchivo?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rutasArchivos?: string[];

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsOptional()
  @IsDateOnly()
  fechaEmision?: string;

  @IsOptional()
  @IsDateOnly()
  fechaVencimiento?: string;

  @IsString()
  @IsOptional()
  numeroDocumento?: string;
}

export class UpdateChoferDocumentoDto {
  @IsEnum(TipoDocumentoChofer)
  @IsOptional()
  tipo?: TipoDocumentoChofer;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  rutaArchivo?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rutasArchivos?: string[];

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsOptional()
  @IsDateOnly()
  fechaEmision?: string;

  @IsOptional()
  @IsDateOnly()
  fechaVencimiento?: string;

  @IsString()
  @IsOptional()
  numeroDocumento?: string;
}
