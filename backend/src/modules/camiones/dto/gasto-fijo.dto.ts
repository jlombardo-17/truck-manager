import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { IsDateOnly } from '../../../common/utils/date-only';
import { MONEDAS_GASTO_FIJO, MonedaGastoFijo, TipoGastoFijo } from '../gasto-fijo.entity';

export class CreateGastoFijoDto {
  @IsEnum(TipoGastoFijo)
  tipo: TipoGastoFijo;

  @IsOptional()
  @IsString()
  concepto?: string;

  @IsNumber()
  @Min(0)
  montoAnual: number;

  @IsOptional()
  @IsIn(MONEDAS_GASTO_FIJO)
  moneda?: MonedaGastoFijo;

  @IsDateOnly('La vigencia desde debe ser una fecha válida (YYYY-MM-DD)')
  vigenciaDesde: string;

  @IsOptional()
  @IsDateOnly('La vigencia hasta debe ser una fecha válida (YYYY-MM-DD)')
  vigenciaHasta?: string | null;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateGastoFijoDto {
  @IsOptional()
  @IsEnum(TipoGastoFijo)
  tipo?: TipoGastoFijo;

  @IsOptional()
  @IsString()
  concepto?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoAnual?: number;

  @IsOptional()
  @IsIn(MONEDAS_GASTO_FIJO)
  moneda?: MonedaGastoFijo;

  @IsOptional()
  @IsDateOnly('La vigencia desde debe ser una fecha válida (YYYY-MM-DD)')
  vigenciaDesde?: string;

  @IsOptional()
  @IsDateOnly('La vigencia hasta debe ser una fecha válida (YYYY-MM-DD)')
  vigenciaHasta?: string | null;

  @IsOptional()
  @IsString()
  notas?: string;
}
