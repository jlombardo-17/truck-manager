import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TIPOS_COMBINACION, TIPOS_SECCION } from '../configuracion-vehicular.entity';

export class SeccionVehicularDto {
  @IsIn(TIPOS_SECCION as unknown as string[])
  tipo: string;

  @IsNumber()
  @Min(1)
  ejes: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  largoM?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  anchoM?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altoM?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoVacioKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadCargaKg?: number;
}

export class UpsertConfiguracionVehicularDto {
  @IsIn(TIPOS_COMBINACION as unknown as string[])
  tipoCombinacion: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeccionVehicularDto)
  secciones: SeccionVehicularDto[];

  @IsOptional()
  @IsString()
  notas?: string;
}
