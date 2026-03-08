import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoSalario } from '../chofer-salario.entity';

export class CreateSalarioDto {
  @IsNotEmpty({ message: 'El ID del chofer es requerido' })
  @IsNumber({}, { message: 'El ID del chofer debe ser un número' })
  choferId: number;

  @IsNotEmpty({ message: 'El mes es requerido' })
  @IsNumber({}, { message: 'El mes debe ser un número' })
  @Min(1, { message: 'El mes debe ser entre 1 y 12' })
  @Max(12, { message: 'El mes debe ser entre 1 y 12' })
  mes: number;

  @IsNotEmpty({ message: 'El año es requerido' })
  @IsNumber({}, { message: 'El año debe ser un número' })
  @Min(2020, { message: 'El año debe ser 2020 o posterior' })
  anio: number;

  @IsOptional()
  @IsNumber({}, { message: 'El salario base debe ser un número' })
  @Type(() => Number)
  salarioBase?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Las comisiones deben ser un número' })
  @Type(() => Number)
  totalComisiones?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Los bonos deben ser un número' })
  @Type(() => Number)
  bonos?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Las deducciones deben ser un número' })
  @Type(() => Number)
  deducciones?: number;

  @IsOptional()
  @IsEnum(EstadoSalario, { message: 'El estado debe ser: pendiente, pagado o cancelado' })
  estado?: EstadoSalario;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de pago debe ser una fecha válida' })
  fechaPago?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @IsOptional()
  @IsString({ message: 'El método de pago debe ser texto' })
  metodoPago?: string;

  @IsOptional()
  @IsString({ message: 'El comprobante debe ser texto' })
  comprobante?: string;
}

export class UpdateSalarioDto {
  @IsOptional()
  @IsNumber({}, { message: 'El salario base debe ser un número' })
  @Type(() => Number)
  salarioBase?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Las comisiones deben ser un número' })
  @Type(() => Number)
  totalComisiones?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Los bonos deben ser un número' })
  @Type(() => Number)
  bonos?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Las deducciones deben ser un número' })
  @Type(() => Number)
  deducciones?: number;

  @IsOptional()
  @IsEnum(EstadoSalario, { message: 'El estado debe ser: pendiente, pagado o cancelado' })
  estado?: EstadoSalario;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de pago debe ser una fecha válida' })
  fechaPago?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @IsOptional()
  @IsString({ message: 'El método de pago debe ser texto' })
  metodoPago?: string;

  @IsOptional()
  @IsString({ message: 'El comprobante debe ser texto' })
  comprobante?: string;
}

export class GenerarSalariosDto {
  @IsNotEmpty({ message: 'El mes es requerido' })
  @IsNumber({}, { message: 'El mes debe ser un número' })
  @Min(1, { message: 'El mes debe ser entre 1 y 12' })
  @Max(12, { message: 'El mes debe ser entre 1 y 12' })
  mes: number;

  @IsNotEmpty({ message: 'El año es requerido' })
  @IsNumber({}, { message: 'El año debe ser un número' })
  @Min(2020, { message: 'El año debe ser 2020 o posterior' })
  anio: number;
}
