import { IsDecimal, IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { IsDateOnly } from '../../../common/utils/date-only';
import { TipoCombustible } from '../repostada.entity';

export class CreateRepostadaDto {
  @IsDateOnly()
  fechaRepostada: string;

  @IsEnum(TipoCombustible)
  tipoCombustible: TipoCombustible;

  @IsNumber()
  @IsPositive()
  kmRecorridos: number;

  @IsNumber()
  @IsPositive()
  litros: number;

  @IsNumber()
  @IsPositive()
  consumoPromedio: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  costo?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  precioLitro?: number;
}

export class UpdateRepostadaDto {
  @IsOptional()
  @IsDateOnly()
  fechaRepostada?: string;

  @IsOptional()
  @IsEnum(TipoCombustible)
  tipoCombustible?: TipoCombustible;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  kmRecorridos?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  litros?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  consumoPromedio?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  costo?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  precioLitro?: number;
}
