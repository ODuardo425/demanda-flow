import { IsOptional, IsString } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
