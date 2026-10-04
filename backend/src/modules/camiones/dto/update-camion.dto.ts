import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { EstadoCamion, mapEstadoCamionAlias } from '../camion-status';

export class UpdateCamionDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  patente?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsInt()
  @Min(1950)
  anio?: number;

  @IsOptional()
  @Transform(({ value }) => mapEstadoCamionAlias(value))
  @IsEnum(EstadoCamion, {
    message: `estado debe ser uno de: ${Object.values(EstadoCamion).join(', ')}`,
  })
  estado?: EstadoCamion;

  @IsOptional()
  @Min(0)
  odometroKm?: number;

  // null quita la foto
  @IsOptional()
  @IsString()
  @MaxLength(3_000_000)
  @Matches(/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/, {
    message: 'fotoUrl debe ser una URL https o una imagen (jpeg, png, webp) en base64',
  })
  fotoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fotoCredito?: string | null;
}
