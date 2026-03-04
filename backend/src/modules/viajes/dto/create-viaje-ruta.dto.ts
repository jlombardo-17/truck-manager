import { IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateViajRutaDTO {
  @IsNumber()
  orden: number;

  @IsNumber()
  latitud: number;

  @IsNumber()
  longitud: number;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsNumber()
  @IsOptional()
  odometroKm?: number;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class SaveViajRutasDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateViajRutaDTO)
  rutas: CreateViajRutaDTO[];
}
