import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaJornada } from '../chofer-jornada.entity';

const CATEGORIA_MSG = `La categoría debe ser: ${Object.values(CategoriaJornada).join(', ')}`;
const IDS_REGEX = /^\d+(,\d+)*$/;

export class ViaticoItemDto {
  @IsOptional()
  @IsInt({ message: 'El tipo de viático debe ser un número' })
  @Type(() => Number)
  viaticoTipoId?: number;

  @IsNotEmpty({ message: 'El concepto del viático es requerido' })
  @IsString({ message: 'El concepto debe ser texto' })
  concepto: string;

  @IsNotEmpty({ message: 'El monto del viático es requerido' })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Type(() => Number)
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}

export class UpsertJornadaDto {
  @IsNotEmpty({ message: 'El ID del chofer es requerido' })
  @IsInt({ message: 'El ID del chofer debe ser un número' })
  @Type(() => Number)
  choferId: number;

  @IsNotEmpty({ message: 'La fecha es requerida' })
  @IsDateString({}, { message: 'La fecha debe ser una fecha válida (YYYY-MM-DD)' })
  fecha: string;

  @IsEnum(CategoriaJornada, { message: CATEGORIA_MSG })
  categoria: CategoriaJornada;

  @IsOptional()
  @IsString({ message: 'El lugar de trabajo debe ser texto' })
  lugarTrabajo?: string;

  @IsOptional()
  @IsInt({ message: 'El ID del viaje debe ser un número' })
  @Type(() => Number)
  viajeId?: number;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @IsOptional()
  @IsArray({ message: 'Los viáticos deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => ViaticoItemDto)
  viaticos?: ViaticoItemDto[];
}

export class BulkJornadaDto {
  @IsArray({ message: 'Los choferes deben ser una lista' })
  @ArrayMinSize(1, { message: 'Debe indicar al menos un chofer' })
  @IsInt({ each: true, message: 'Cada ID de chofer debe ser un número' })
  choferIds: number[];

  @IsDateString({}, { message: 'La fecha desde debe ser válida (YYYY-MM-DD)' })
  desde: string;

  @IsDateString({}, { message: 'La fecha hasta debe ser válida (YYYY-MM-DD)' })
  hasta: string;

  @IsEnum(CategoriaJornada, { message: CATEGORIA_MSG })
  categoria: CategoriaJornada;

  @IsOptional()
  @IsString({ message: 'El lugar de trabajo debe ser texto' })
  lugarTrabajo?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}

export class JornadasQueryDto {
  @Matches(IDS_REGEX, { message: 'choferIds debe ser una lista de IDs separada por comas' })
  choferIds: string;

  @IsDateString({}, { message: 'La fecha desde debe ser válida (YYYY-MM-DD)' })
  desde: string;

  @IsDateString({}, { message: 'La fecha hasta debe ser válida (YYYY-MM-DD)' })
  hasta: string;
}

export class ResumenQueryDto {
  @Matches(IDS_REGEX, { message: 'choferIds debe ser una lista de IDs separada por comas' })
  choferIds: string;

  @Type(() => Number)
  @IsInt({ message: 'El año debe ser un número' })
  @Min(2020, { message: 'El año debe ser 2020 o posterior' })
  anio: number;

  @Type(() => Number)
  @IsInt({ message: 'El mes debe ser un número' })
  @Min(1, { message: 'El mes debe ser entre 1 y 12' })
  @Max(12, { message: 'El mes debe ser entre 1 y 12' })
  mes: number;
}

export class CreateViaticoTipoDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  nombre: string;

  @IsNumber({}, { message: 'El monto por defecto debe ser un número' })
  @Type(() => Number)
  @Min(0, { message: 'El monto por defecto no puede ser negativo' })
  montoDefault: number;

  @IsOptional()
  @IsBoolean({ message: 'activo debe ser verdadero o falso' })
  activo?: boolean;
}

export class UpdateViaticoTipoDto {
  @IsOptional()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser texto' })
  nombre?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto por defecto debe ser un número' })
  @Type(() => Number)
  @Min(0, { message: 'El monto por defecto no puede ser negativo' })
  montoDefault?: number;

  @IsOptional()
  @IsBoolean({ message: 'activo debe ser verdadero o falso' })
  activo?: boolean;
}
