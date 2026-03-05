import { IsEnum, IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
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
  rutaArchivo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  @IsOptional()
  fechaEmision?: string;

  @IsDateString()
  @IsOptional()
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

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsDateString()
  @IsOptional()
  fechaEmision?: string;

  @IsDateString()
  @IsOptional()
  fechaVencimiento?: string;

  @IsString()
  @IsOptional()
  numeroDocumento?: string;
}
