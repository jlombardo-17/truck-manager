import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCamionDto {
  @IsString()
  @MaxLength(10)
  patente: string;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsInt()
  @Min(1950)
  anio: number;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @Min(0)
  odometroKm?: number;
}
