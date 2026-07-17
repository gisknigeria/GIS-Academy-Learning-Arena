import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreatePathwayDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateStageDto {
  @IsInt()
  @Min(1)
  @Max(3)
  stageNumber!: number;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PlaceCourseDto {
  @IsString()
  courseId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateModuleDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class ImportModuleDto {
  @IsString()
  sourceModuleId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

