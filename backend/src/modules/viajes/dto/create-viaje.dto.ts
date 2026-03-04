import { IsString, IsNumber, IsDateString, IsDecimal, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ViajRutaDTO {
  @IsNumber()
  orden: number;

  @IsDecimal()
  latitud: number;

  @IsDecimal()
  longitud: number;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

class ViajComisionDTO {
  @IsString()
  tipo: string; // 'contratista', 'flete', 'operario', etc

  @IsString()
  @IsOptional()
  concepto?: string;

  @IsNumber()
  @IsOptional()
  montoBase?: number;

  @IsNumber()
  @IsOptional()
  porcentaje?: number;

  @IsNumber()
  @IsOptional()
  montoFijo?: number;

  @IsString()
  @IsOptional()
  beneficiario?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class CreateViajDTO {
  @IsString()
  numeroViaje: string;

  @IsNumber()
  camionId: number;

  @IsNumber()
  choferId: number;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsString()
  origen: string;

  @IsString()
  destino: string;

  @IsDecimal()
  @IsOptional()
  latitudOrigen?: number;

  @IsDecimal()
  @IsOptional()
  longitudOrigen?: number;

  @IsDecimal()
  @IsOptional()
  latitudDestino?: number;

  @IsDecimal()
  @IsOptional()
  longitudDestino?: number;

  @IsString()
  @IsOptional()
  descripcionCarga?: string;

  @IsNumber()
  @IsOptional()
  pesoCargaKg?: number;

  @IsNumber()
  valorViaje: number;

  @IsNumber()
  @IsOptional()
  kmRecorridos?: number;

  @IsNumber()
  @IsOptional()
  consumoCombustible?: number;

  @IsNumber()
  @IsOptional()
  costoCombustible?: number;

  @IsNumber()
  @IsOptional()
  otrosGastos?: number;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViajRutaDTO)
  @IsOptional()
  rutas?: ViajRutaDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViajComisionDTO)
  @IsOptional()
  comisiones?: ViajComisionDTO[];
}
