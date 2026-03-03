import { IsDate, IsDecimal, IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { TipoCombustible } from '../repostada.entity';
import { Type } from 'class-transformer';

export class CreateRepostadaDto {
  @IsDate()
  @Type(() => Date)
  fechaRepostada: Date;

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
  @IsDate()
  @Type(() => Date)
  fechaRepostada?: Date;

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
