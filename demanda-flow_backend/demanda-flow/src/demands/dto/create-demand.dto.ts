import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateStepInputDto } from './create-step.dto';

export class CreateDemandDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepInputDto)
  steps!: CreateStepInputDto[];
}
