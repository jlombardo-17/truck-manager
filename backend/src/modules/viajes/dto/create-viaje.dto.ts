import { IsString, IsNumber, IsDateString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type, Exclude } from 'class-transformer';

class ViajRutaDTO {
  @IsNumber({ allowNaN: false, allowInfinity: false })
  orden: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  latitud: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  longitud: number;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

class ViajComisionDTO {
  @Exclude()
  id?: string;  // UI tracking field, not stored in DB

  @IsString()
  tipo: string; // 'contratista', 'flete', 'operario', etc

  @IsString()
  @IsOptional()
  concepto?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  montoBase?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  porcentaje?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  montoFijo?: number;

  @IsString()
  @IsOptional()
  beneficiario?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @Exclude()
  montoTotal?: number;

  @Exclude()
  estado?: string;
}

export class CreateViajDTO {
  @IsString()
  numeroViaje: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  camionId: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  choferId: number;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsDateString()
  @IsOptional()
  fechaPago?: string;

  @IsString()
  origen: string;

  @IsString()
  destino: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  latitudOrigen?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  longitudOrigen?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  latitudDestino?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  longitudDestino?: number;

  @IsString()
  @IsOptional()
  descripcionCarga?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  pesoCargaKg?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  valorViaje: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  kmRecorridos?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  consumoCombustible?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  costoCombustible?: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsOptional()
  otrosGastos?: number;

  @IsString()
  @IsOptional()
  notas?: string;

  @Exclude()
  estado?: string;

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
