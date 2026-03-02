import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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
  @IsString()
  estado?: string;

  @IsOptional()
  @Min(0)
  odometroKm?: number;
}
