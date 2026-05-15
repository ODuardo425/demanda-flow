import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { SkillMatchMode } from '@prisma/client';

export class CreateStepInputDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  orderIndex!: number;

  @IsArray()
  @ArrayUnique()
  requiredSkillIds!: string[];

  @IsEnum(SkillMatchMode)
  @IsOptional()
  matchMode?: SkillMatchMode;

  @IsArray()
  @IsOptional()
  dependsOnIndices?: number[]; // referenciamos pelo orderIndex de outras etapas do mesmo payload

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsInt()
  @IsOptional()
  expectedDurationHours?: number;
}
