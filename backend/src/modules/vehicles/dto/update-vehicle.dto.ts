import { IsString, IsOptional, IsInt, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  year?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  photoUrls?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentOdometer?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maintenanceIntervalKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maintenanceIntervalDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nextServiceOdometer?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextServiceDate?: Date;
}
